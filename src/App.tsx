import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  FileCode2, 
  Layers, 
  FileCheck, 
  Database, 
  MessageSquareCode, 
  Settings, 
  Sparkles, 
  Terminal, 
  ArrowLeft,
  X,
  Target,
  Share2,
  CheckCircle2,
  UploadCloud,
  Check,
  GripHorizontal,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  ChevronsUpDown,
  ChevronsLeftRight,
  Columns,
  Rows
} from 'lucide-react';
import { Header } from './components/Header';
import { UploadAndTerminal } from './components/UploadAndTerminal';
import { FileTree } from './components/FileTree';
import { CodeViewer } from './components/CodeViewer';
import { TabOverview } from './components/TabOverview';
import { TabUseCases } from './components/TabUseCases';
import { TabDatabaseFlows } from './components/TabDatabaseFlows';
import { TabChatbot } from './components/TabChatbot';
import { TabSettingsBYOK } from './components/TabSettingsBYOK';
import { ExportDocModal } from './components/ExportDocModal';
import { SAMPLE_CODEBASE, APPCHAT_CMS_CODEBASE } from './data/sampleCodebase';
import { SAMPLE_SRS_SPEC } from './data/sampleSpecs';
import { CodeFile, FullSRS, TerminalLog, TraceEvidence } from './types';
import { parseUploadedZip, analyzeGeneralCodebase, parseCustomSnippetCodebase } from './utils/zipParser';

export type AnalysisSource = File | File[] | string | { projectName: string; files: { name: string; content: string; language?: string }[] };

export default function App() {
  // Application State
  const [isAnalyzed, setIsAnalyzed] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);
  const [files, setFiles] = useState<CodeFile[]>(SAMPLE_CODEBASE);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(SAMPLE_CODEBASE[1]); // UserService.java
  const [srsSpec, setSrsSpec] = useState<FullSRS>(SAMPLE_SRS_SPEC);
  const [activeTab, setActiveTab] = useState<string>('usecases');
  const [activeEvidence, setActiveEvidence] = useState<TraceEvidence | null>({
    fileName: 'UserService.java',
    startLine: 42,
    endLine: 46,
    snippet: 'String saltRoundsCost12 = "$2a$12$";\nString hashedPassword = passwordEncoder.encode(rawPassword, saltRoundsCost12);',
    explanation: 'Mã hóa mật khẩu bằng BCrypt cost factor 12 trong UserService.'
  });
  const [logs, setLogs] = useState<TerminalLog[]>([
    { id: '1', timestamp: '09:40:12', tag: 'SCAN', message: 'Reading ZIP tree structure: sample-legacy-springboot-v1.zip...' },
    { id: '2', timestamp: '09:40:13', tag: 'FILTER', message: '.env file detected -> Excluded for enterprise security!', details: 'Found DB password & JWT secret.' },
    { id: '3', timestamp: '09:40:13', tag: 'FILTER', message: 'private_key.pem detected -> Excluded!', details: 'Found RSA 4096-bit private certificate.' },
    { id: '4', timestamp: '09:40:14', tag: 'OPTIMIZE', message: 'node_modules/ and target/ ignored to save token budget.', details: 'Tree-shaking reduced 12,410 redundant files (~85,400 tokens saved).' },
    { id: '5', timestamp: '09:40:14', tag: 'TREE', message: '12,432 files scanned -> 4 relevant architectural files extracted.', details: 'Extracted: UserController.java, UserService.java, UserRepository.java, schema.sql' },
    { id: '6', timestamp: '09:40:15', tag: 'CACHE', message: 'Creating Gemini Context Cache (TTL: 1 Hour)...', details: 'Stored token budget in cache_name: cl2s-cache-auth-service-v2' },
    { id: '7', timestamp: '09:40:16', tag: 'SUCCESS', message: 'System Specification successfully reconstructed with 99.5% Confidence.' }
  ]);

  // BYOK & Settings
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('CL2S_GEMINI_KEY') || '';
  });
  const [isLiveMode, setIsLiveMode] = useState<boolean>(() => {
    return localStorage.getItem('CL2S_LIVE_MODE') === 'true';
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [evidenceToast, setEvidenceToast] = useState<string | null>(null);
  const [leftPaneView, setLeftPaneView] = useState<'upload' | 'tree' | 'code'>('code');

  // Splitter & Resizing State for Menu 1 2 3 4 5 & Code Pane
  const [splitPercentage, setSplitPercentage] = useState<number>(55); // 55% for SRS Pane, 45% for Code Pane
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'auto' | 'horizontal' | 'vertical'>('auto');
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag handlers for vertical and horizontal resizing
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const isVertical = layoutMode === 'vertical' || (layoutMode === 'auto' && window.innerWidth < 1024);

      if (isVertical) {
        // Vertical dragging: calculate Y position from bottom or top
        // Menu 1 2 3 4 5 (SRS) is at the bottom in vertical mode
        const offsetY = e.clientY - rect.top;
        const totalHeight = rect.height;
        if (totalHeight > 0) {
          const newCodeRatio = (offsetY / totalHeight) * 100;
          const newSrsRatio = Math.max(15, Math.min(85, 100 - newCodeRatio));
          setSplitPercentage(Math.round(newSrsRatio));
        }
      } else {
        // Horizontal dragging: calculate X position
        const offsetX = e.clientX - rect.left;
        const totalWidth = rect.width;
        if (totalWidth > 0) {
          const newCodeRatio = (offsetX / totalWidth) * 100;
          const newSrsRatio = Math.max(18, Math.min(82, 100 - newCodeRatio));
          setSplitPercentage(Math.round(newSrsRatio));
        }
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = (layoutMode === 'vertical' || (layoutMode === 'auto' && window.innerWidth < 1024)) ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, layoutMode]);

  // Quick preset actions for user friendliness
  const handleSetPreset = (preset: 'expand-srs' | 'balanced' | 'shrink-srs' | 'fullscreen-srs') => {
    if (preset === 'expand-srs') setSplitPercentage(80);
    if (preset === 'balanced') setSplitPercentage(50);
    if (preset === 'shrink-srs') setSplitPercentage(20);
    if (preset === 'fullscreen-srs') setSplitPercentage(splitPercentage >= 95 ? 55 : 98);
  };

  // Generate code context string for AI
  const codeContextString = useMemo(() => {
    return files.map(f => `--- FILE: ${f.name} (${f.path}) ---\n${f.content.slice(0, 4000)}`).join('\n\n');
  }, [files]);

  const handleStartAnalysis = async (fileOrPayload?: AnalysisSource) => {
    setIsScanning(true);
    setScanProgress(0);
    setLogs([]);
    setLeftPaneView('upload');

    // Case 1: Custom Snippets directly inputted by user
    if (fileOrPayload && typeof fileOrPayload === 'object' && 'files' in fileOrPayload && Array.isArray((fileOrPayload as any).files)) {
      try {
        const customData = fileOrPayload as { projectName: string; files: { name: string; content: string; language?: string }[] };
        const result = await parseCustomSnippetCodebase(customData.files, customData.projectName, (progress, newLog) => {
          setScanProgress(progress);
          setLogs(prev => [...prev, newLog]);
        });

        setFiles(result.files);
        setSelectedFile(result.files[0] || null);
        setSrsSpec(result.spec);
        if (result.primaryEvidence) {
          setActiveEvidence(result.primaryEvidence);
        }
        setIsScanning(false);
        setIsAnalyzed(true);
        setActiveTab('usecases');
        setLeftPaneView('code');
        return;
      } catch (err: any) {
        console.error('Error parsing custom snippets:', err);
      }
    }

    // Case 2: Real File object or files uploaded (e.g. .HTML, .ZIP, source files, folders)
    if (fileOrPayload instanceof File || Array.isArray(fileOrPayload)) {
      try {
        const result = await parseUploadedZip(fileOrPayload, (progress, newLog) => {
          setScanProgress(progress);
          setLogs(prev => [...prev, newLog]);
        });

        setFiles(result.files);
        setSelectedFile(result.files[0] || null);
        setSrsSpec(result.spec);
        if (result.primaryEvidence) {
          setActiveEvidence(result.primaryEvidence);
        }
        setIsScanning(false);
        setIsAnalyzed(true);
        setActiveTab('usecases');
        setLeftPaneView('code');
        return;
      } catch (err: any) {
        console.error('Error parsing uploaded file(s):', err);
      }
    }

    // Case 3: Sample codebase simulation
    const zipName = typeof fileOrPayload === 'string' ? fileOrPayload : 'sample-legacy-springboot-v1.zip';
    const isAppChat = zipName.toLowerCase().includes('appchat');

    const simulationSteps: { delay: number; log: Omit<TerminalLog, 'id' | 'timestamp'>; progress: number }[] = isAppChat ? [
      {
        delay: 200,
        progress: 15,
        log: { tag: 'SCAN', message: `Đang quét tệp mã nguồn: ${zipName}...` }
      },
      {
        delay: 450,
        progress: 35,
        log: { tag: 'FILTER', message: 'Tệp .env được phát hiện -> Tự động loại bỏ để bảo vệ an toàn!', details: 'Bảo vệ JWT secret & DB connection string.' }
      },
      {
        delay: 700,
        progress: 55,
        log: { tag: 'TREE', message: 'Phát hiện phân hệ Real-time Chat (Socket.IO) & Quản trị Nội dung CMS.', details: 'Trích xuất: server.js, chatController.js, cmsController.js, schema.sql' }
      },
      {
        delay: 1100,
        progress: 80,
        log: { tag: 'OPTIMIZE', message: 'Tối ưu hóa AST & Trích xuất các luồng sự kiện Socket & API CMS.', details: 'Tiết kiệm ~65,000 tokens ngữ cảnh.' }
      },
      {
        delay: 1400,
        progress: 92,
        log: { tag: 'CACHE', message: 'Khởi tạo Gemini Context Cache cho AppChat-CMS (TTL: 1 Giờ)...', details: 'Bộ nhớ đệm sẵn sàng phản hồi siêu tốc.' }
      },
      {
        delay: 1700,
        progress: 100,
        log: { tag: 'SUCCESS', message: 'Tái cấu trúc đặc tả AppChat-CMS hoàn tất với độ tin cậy 99.5%!', details: 'Đã sinh các Use Cases Chat & CMS, Sequence Diagrams và Mermaid ERD.' }
      }
    ] : [
      {
        delay: 200,
        progress: 15,
        log: { tag: 'SCAN', message: `Đang quét cấu trúc tệp mã nguồn: ${zipName}...` }
      },
      {
        delay: 450,
        progress: 35,
        log: { tag: 'FILTER', message: 'Tệp .env được phát hiện -> Tự động loại bỏ để bảo vệ an toàn!', details: 'Bảo vệ mật khẩu DB & JWT secret.' }
      },
      {
        delay: 700,
        progress: 50,
        log: { tag: 'FILTER', message: 'Tệp private_key.pem được phát hiện -> Đã loại bỏ!', details: 'Bảo vệ chứng chỉ số RSA 4096-bit.' }
      },
      {
        delay: 950,
        progress: 65,
        log: { tag: 'OPTIMIZE', message: 'Thư mục node_modules/ và target/ đã được Tree-shaking.', details: 'Tiết kiệm ~85,400 tokens ngữ cảnh.' }
      },
      {
        delay: 1200,
        progress: 80,
        log: { tag: 'TREE', message: '12,432 tệp quét -> 4 tệp kiến trúc cốt lõi đã nạp.', details: 'Bao gồm: UserController.java, UserService.java, UserRepository.java, schema.sql' }
      },
      {
        delay: 1500,
        progress: 92,
        log: { tag: 'CACHE', message: 'Khởi tạo Gemini Context Cache (TTL: 1 Giờ)...', details: 'Bộ nhớ đệm sẵn sàng phản hồi siêu tốc.' }
      },
      {
        delay: 1800,
        progress: 100,
        log: { tag: 'SUCCESS', message: 'Tái cấu trúc đặc tả SRS hoàn tất với độ tin cậy 99.5%!', details: 'Đã sinh 3 Use Cases, 3 Business Rules, 3 API specs & Mermaid ERD.' }
      }
    ];

    simulationSteps.forEach(({ delay, log, progress }) => {
      setTimeout(() => {
        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: timeString,
          ...log
        }]);
        setScanProgress(progress);

        if (progress === 100) {
          setIsScanning(false);
          setIsAnalyzed(true);
          if (isAppChat) {
            const parsedSpec = analyzeGeneralCodebase(APPCHAT_CMS_CODEBASE, 'APPCHAT_CMS');
            setFiles(APPCHAT_CMS_CODEBASE);
            setSelectedFile(APPCHAT_CMS_CODEBASE[1]); // chatController.js
            setSrsSpec(parsedSpec);
            if (parsedSpec.useCases[0]?.evidence) {
              setActiveEvidence(parsedSpec.useCases[0].evidence);
            }
          } else {
            setFiles(SAMPLE_CODEBASE);
            setSelectedFile(SAMPLE_CODEBASE[1]); // UserService.java
            setSrsSpec(SAMPLE_SRS_SPEC);
          }
          setActiveTab('usecases');
          setLeftPaneView('code');
        }
      }, delay);
    });
  };

  const handleSelectEvidence = (evidence: TraceEvidence) => {
    setActiveEvidence(evidence);
    const targetFile = files.find(f => f.name.toLowerCase() === evidence.fileName.toLowerCase()) || 
                       files.find(f => f.path.toLowerCase().includes(evidence.fileName.toLowerCase())) || 
                       null;
    if (targetFile) {
      setSelectedFile(targetFile);
      setLeftPaneView('code');
    }

    setEvidenceToast(`Đã chuyển tới ${evidence.fileName} (Dòng ${evidence.startLine}–${evidence.endLine})`);
    setTimeout(() => {
      setEvidenceToast(null);
    }, 3500);
  };

  const handleSaveSettings = (key: string, liveMode: boolean) => {
    setApiKey(key);
    setIsLiveMode(liveMode);
    localStorage.setItem('CL2S_GEMINI_KEY', key);
    localStorage.setItem('CL2S_LIVE_MODE', String(liveMode));
  };

  const handleExportMarkdown = () => {
    const mdContent = `# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) - ${srsSpec.projectOverview.name}
*Được tái dựng tự động bởi nền tảng CodeLegacy2Spec (CL2S) v2.0*
*Độ tin cậy: ${srsSpec.projectOverview.metrics.reconstructionConfidence}%*

---

## 1. TỔNG QUAN HỆ THỐNG
${srsSpec.projectOverview.description}

- **Kiến trúc**: ${srsSpec.projectOverview.architecturalStyle}
- **Công nghệ phát hiện**: ${srsSpec.projectOverview.techStackDetected.map(t => t.name).join(', ')}

---

## 2. DANH SÁCH CA SỬ DỤNG (USE CASES)
${srsSpec.useCases.map(uc => `
### ${uc.id}: ${uc.name}
- **Tác nhân**: ${uc.actor}
- **Độ tin cậy**: ${uc.confidence}
- **Điều kiện tiên quyết**: ${uc.preCondition}
- **Kết quả**: ${uc.postCondition}
- **Bằng chứng mã nguồn**: \`${uc.evidence.fileName}\` (Dòng ${uc.evidence.startLine}-${uc.evidence.endLine})
- **Luồng thực thi**:
${uc.mainFlow.map(s => `  ${s}`).join('\n')}
`).join('\n')}

---

## 3. LUẬT NGHIỆP VỤ (BUSINESS RULES)
${srsSpec.businessRules.map(br => `
### ${br.id}: ${br.ruleName}
- **Mô tả**: ${br.description}
- **Mức độ ảnh hưởng**: ${br.impactLevel}
- **Bằng chứng**: \`${br.evidence.fileName}\` (Dòng ${br.evidence.startLine}-${br.evidence.endLine})
`).join('\n')}

---

## 4. CƠ SỞ DỮ LIỆU (MERMAID ERD)
\`\`\`mermaid
${srsSpec.databaseArchitecture.mermaidErdCode}
\`\`\`
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SRS-${srsSpec.projectOverview.name.replace(/\s+/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(srsSpec, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SRS-Data-${srsSpec.projectOverview.name.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleResetToUpload = () => {
    setLeftPaneView('upload');
    setIsAnalyzed(false);
    setLogs([]);
    setScanProgress(0);
    setActiveEvidence(null);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* Header Bar */}
      <Header
        isAnalyzed={isAnalyzed}
        isLiveMode={isLiveMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReset={handleResetToUpload}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Floating Evidence Toast */}
      {evidenceToast && (
        <div className="fixed top-20 right-6 z-50 bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-500/80 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <Target className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
          <span className="text-xs font-semibold text-cyan-100">{evidenceToast}</span>
          <button 
            onClick={() => setEvidenceToast(null)}
            className="text-slate-400 hover:text-slate-200 text-xs ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Two-Pane Workspace Layout with Interactive Draggable Resizer */}
      <div 
        ref={containerRef}
        className={`flex-1 flex overflow-hidden relative ${
          layoutMode === 'vertical' 
            ? 'flex-col' 
            : layoutMode === 'horizontal' 
              ? 'flex-row' 
              : 'flex-col lg:flex-row'
        }`}
      >
        {/* ================= LEFT / TOP PANE: CODEBASE & UPLOAD CONTROLLER ================= */}
        <div 
          style={{
            flex: layoutMode === 'vertical' || (layoutMode === 'auto' && typeof window !== 'undefined' && window.innerWidth < 1024)
              ? `0 0 ${100 - splitPercentage}%`
              : `0 0 ${100 - splitPercentage}%`,
            minHeight: '80px',
            minWidth: '160px'
          }}
          className="flex flex-col bg-slate-950 relative overflow-hidden transition-none border-b lg:border-b-0 lg:border-r border-slate-800/80"
        >
          {/* Left pane sub-header tabs */}
          <div className="h-11 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                id="toggle-upload-view-btn"
                onClick={() => setLeftPaneView('upload')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  leftPaneView === 'upload'
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>📤 Tải / Quét ZIP</span>
              </button>

              <button
                id="toggle-tree-view-btn"
                onClick={() => setLeftPaneView('tree')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  leftPaneView === 'tree'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Cây Thư Mục ({files.length})</span>
              </button>

              <button
                id="toggle-code-view-btn"
                onClick={() => setLeftPaneView('code')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  leftPaneView === 'code'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>Trình Đọc Code</span>
              </button>
            </div>

            {leftPaneView === 'code' && selectedFile && (
              <div className="text-[11px] font-mono text-cyan-400 truncate max-w-[140px] hidden sm:block">
                {selectedFile.name}
              </div>
            )}
          </div>

          {/* Left Pane Dynamic View Mode */}
          <div className="flex-1 overflow-hidden">
            {leftPaneView === 'upload' ? (
              <UploadAndTerminal
                isScanning={isScanning}
                onStartAnalysis={handleStartAnalysis}
                logs={logs}
                scanProgress={scanProgress}
              />
            ) : (
              /* File Tree + Code Viewer Layout */
              <div className="flex h-full overflow-hidden">
                {/* File Tree */}
                <div className={`${
                  leftPaneView === 'tree' ? 'w-full' : 'hidden xl:block xl:w-56'
                } h-full shrink-0 border-r border-slate-800/80 transition-all`}>
                  <FileTree
                    files={files}
                    selectedFile={selectedFile}
                    onSelectFile={(f) => {
                      setSelectedFile(f);
                      setLeftPaneView('code');
                    }}
                  />
                </div>

                {/* Code Viewer */}
                <div className={`${
                  leftPaneView === 'code' ? 'w-full' : 'hidden xl:flex xl:flex-1'
                } h-full flex-col overflow-hidden`}>
                  <CodeViewer
                    file={selectedFile}
                    activeEvidence={activeEvidence}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= INTERACTIVE DRAGGABLE RESIZER BAR ================= */}
        <div
          id="pane-resizer-bar"
          onPointerDown={handlePointerDown}
          onDoubleClick={() => handleSetPreset('balanced')}
          className={`group shrink-0 relative flex items-center justify-center select-none transition-colors z-20 ${
            isDragging 
              ? 'bg-cyan-500/30' 
              : 'bg-slate-900/90 hover:bg-cyan-500/20'
          } ${
            layoutMode === 'vertical' || (layoutMode === 'auto' && typeof window !== 'undefined' && window.innerWidth < 1024)
              ? 'h-3.5 w-full cursor-row-resize border-y border-cyan-500/30 hover:border-cyan-400 shadow-sm'
              : 'w-3 h-full cursor-col-resize border-x border-cyan-500/30 hover:border-cyan-400'
          }`}
          title="Kéo thả để điều chỉnh kích thước / Nhấp đúp để chia đều 50:50"
        >
          <div className="flex items-center justify-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-950/90 border border-slate-700/80 group-hover:border-cyan-500/80 shadow-md">
            {layoutMode === 'vertical' || (layoutMode === 'auto' && typeof window !== 'undefined' && window.innerWidth < 1024) ? (
              <>
                <ChevronUp className="w-3 h-3 text-cyan-400 group-hover:animate-bounce" />
                <GripHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300" />
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-cyan-200 hidden sm:inline">
                  Kéo Lên / Xuống ({splitPercentage}%)
                </span>
                <ChevronDown className="w-3 h-3 text-cyan-400 group-hover:animate-bounce" />
              </>
            ) : (
              <div className="flex flex-col items-center">
                <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300" />
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT / BOTTOM PANE: DOCUMENT & SRS VIEWER (TABS 1 2 3 4 5) ================= */}
        <div 
          style={{
            flex: `1 1 ${splitPercentage}%`,
            minHeight: '120px',
            minWidth: '220px'
          }}
          className="flex flex-col bg-slate-900/40 overflow-hidden relative"
        >
          {/* Tabs Navigation Header - Enhanced Friendly Menu Bar */}
          <div className="h-12 bg-slate-950 border-b border-slate-800 px-3 lg:px-4 flex items-center justify-between shrink-0 overflow-x-auto gap-2">
            {/* Friendly Tabs 1, 2, 3, 4, 5 */}
            <div className="flex items-center gap-1.5 min-w-max">
              <button
                id="tab-overview-btn"
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-cyan-900/40 ring-1 ring-cyan-400/50 scale-[1.02]'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <div className={`p-1 rounded-md ${activeTab === 'overview' ? 'bg-cyan-700/60' : 'bg-slate-800 text-cyan-400'}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span>1. Tổng Quan</span>
              </button>

              <button
                id="tab-usecases-btn"
                onClick={() => setActiveTab('usecases')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                  activeTab === 'usecases'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-900/40 ring-1 ring-teal-400/50 scale-[1.02]'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <div className={`p-1 rounded-md ${activeTab === 'usecases' ? 'bg-teal-700/60' : 'bg-slate-800 text-teal-400'}`}>
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
                <span>2. Use Cases & Truy Vết</span>
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-teal-950/80 text-teal-300 border border-teal-500/30">
                  {srsSpec.useCases.length}
                </span>
              </button>

              <button
                id="tab-database-btn"
                onClick={() => setActiveTab('database')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                  activeTab === 'database'
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-emerald-900/40 ring-1 ring-emerald-400/50 scale-[1.02]'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <div className={`p-1 rounded-md ${activeTab === 'database' ? 'bg-emerald-700/60' : 'bg-slate-800 text-emerald-400'}`}>
                  <Database className="w-3.5 h-3.5" />
                </div>
                <span>3. DB & Sơ Đồ</span>
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  ERD + {srsSpec.diagramFlows.length}
                </span>
              </button>

              <button
                id="tab-chatbot-btn"
                onClick={() => setActiveTab('chatbot')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                  activeTab === 'chatbot'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-amber-900/40 ring-1 ring-amber-400/50 scale-[1.02]'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <div className={`p-1 rounded-md ${activeTab === 'chatbot' ? 'bg-amber-700/60' : 'bg-slate-800 text-amber-400'}`}>
                  <MessageSquareCode className="w-3.5 h-3.5" />
                </div>
                <span>4. Trợ Lý AI</span>
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/30">
                  Flash RAG
                </span>
              </button>

              <button
                id="tab-settings-btn"
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-900/40 ring-1 ring-purple-400/50 scale-[1.02]'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <div className={`p-1 rounded-md ${activeTab === 'settings' ? 'bg-purple-700/60' : 'bg-slate-800 text-purple-400'}`}>
                  <Settings className="w-3.5 h-3.5" />
                </div>
                <span>5. Cài Đặt BYOK</span>
              </button>
            </div>

            {/* Quick Panel Size & Layout Control Actions */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-800 shrink-0">
              <button
                onClick={() => handleSetPreset('expand-srs')}
                title="Kéo lên / Mở rộng bảng Menu SRS (80%)"
                className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 border border-slate-800 transition flex items-center gap-1 text-[11px]"
              >
                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Mở Rộng</span>
              </button>

              <button
                onClick={() => handleSetPreset('balanced')}
                title="Cân bằng 50:50"
                className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 border border-slate-800 transition text-[11px]"
              >
                <span>50:50</span>
              </button>

              <button
                onClick={() => handleSetPreset('shrink-srs')}
                title="Kéo xuống / Thu nhỏ bảng Menu SRS (20%) để đọc Code"
                className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 border border-slate-800 transition flex items-center gap-1 text-[11px]"
              >
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Thu Nhỏ</span>
              </button>

              <button
                onClick={() => handleSetPreset('fullscreen-srs')}
                title={splitPercentage >= 95 ? "Khôi phục kích thước bình thường" : "Toàn màn hình Menu SRS"}
                className={`p-1.5 rounded-lg border transition text-[11px] ${
                  splitPercentage >= 95
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/80 shadow-md'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
                }`}
              >
                {splitPercentage >= 95 ? (
                  <Minimize2 className="w-3.5 h-3.5 text-cyan-300" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
                )}
              </button>

              {/* Layout mode switcher */}
              <button
                onClick={() => {
                  setLayoutMode(prev => prev === 'vertical' ? 'horizontal' : prev === 'horizontal' ? 'auto' : 'vertical');
                }}
                title={`Đổi chiều bố cục: ${layoutMode === 'vertical' ? 'Dọc (Lên/Xuống)' : layoutMode === 'horizontal' ? 'Ngang (Trái/Phải)' : 'Tự động theo màn hình'}`}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition"
              >
                {layoutMode === 'vertical' ? (
                  <Rows className="w-3.5 h-3.5 text-teal-400" />
                ) : layoutMode === 'horizontal' ? (
                  <Columns className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <ChevronsUpDown className="w-3.5 h-3.5 text-amber-400" />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content Display Area */}
          <div className="flex-1 overflow-y-auto relative">
            {activeTab === 'overview' && (
               <TabOverview
                 overview={srsSpec.projectOverview}
                 onNavigateToUseCases={() => setActiveTab('usecases')}
                 onNavigateToDatabase={() => setActiveTab('database')}
                 onOpenExportModal={() => setIsExportModalOpen(true)}
               />
            )}

            {activeTab === 'usecases' && (
               <TabUseCases
                 useCases={srsSpec.useCases}
                 businessRules={srsSpec.businessRules}
                 apiSpecs={srsSpec.apiSpecs}
                 onSelectEvidence={handleSelectEvidence}
                 onOpenExportModal={() => setIsExportModalOpen(true)}
               />
            )}

            {activeTab === 'database' && (
              <TabDatabaseFlows
                dbArch={srsSpec.databaseArchitecture}
                flows={srsSpec.diagramFlows}
              />
            )}

            {activeTab === 'chatbot' && (
              <TabChatbot
                onSelectEvidence={handleSelectEvidence}
                apiKey={apiKey}
                isLiveMode={isLiveMode}
                codeContext={codeContextString}
              />
            )}

            {activeTab === 'settings' && (
              <TabSettingsBYOK
                apiKey={apiKey}
                isLiveMode={isLiveMode}
                onSaveSettings={handleSaveSettings}
              />
            )}
          </div>
        </div>
      </div>

      {/* Export SRS Documentation Modal */}
      <ExportDocModal
        srsSpec={srsSpec}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
