import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  GitBranch, 
  Copy, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Sparkles, 
  Code2,
  RefreshCw,
  Download,
  Info,
  Layers,
  X,
  Eye,
  Sliders
} from 'lucide-react';
import { DatabaseArchitecture, DiagramFlow } from '../types';
import { renderMermaidSvg } from '../utils/mermaidSanitizer';

interface TabDatabaseFlowsProps {
  dbArch: DatabaseArchitecture;
  flows: DiagramFlow[];
}

export const TabDatabaseFlows: React.FC<TabDatabaseFlowsProps> = ({
  dbArch,
  flows = []
}) => {
  // Active selection: 'erd' or flow index (0, 1, 2...)
  const [selectedDiagramId, setSelectedDiagramId] = useState<string>('erd');
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [showRawCode, setShowRawCode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Validate active selection against available flows
  const activeFlowIndex = selectedDiagramId.startsWith('flow-') 
    ? parseInt(selectedDiagramId.replace('flow-', ''), 10) 
    : -1;

  const currentFlow: DiagramFlow | undefined = (activeFlowIndex >= 0 && activeFlowIndex < flows.length) 
    ? flows[activeFlowIndex] 
    : undefined;

  const isErd = selectedDiagramId === 'erd' || !currentFlow;

  const getCurrentCode = (): string => {
    if (isErd) {
      return dbArch?.mermaidErdCode || '';
    }
    return currentFlow?.mermaidSequenceCode || '';
  };

  const getCurrentTitle = (): string => {
    if (isErd) {
      return 'Sơ đồ Thực thể Quan hệ & Cấu trúc Thực thể (ERD / Entity Diagram)';
    }
    return currentFlow?.title || 'Sơ đồ Tuần tự Thực thi (Sequence Diagram)';
  };

  const getCurrentDescription = (): string => {
    if (isErd) {
      return dbArch?.tablesDescription || 'Cấu trúc các bảng thực thể, quan hệ khóa chính/ngoại và thuộc tính.';
    }
    return currentFlow?.description || 'Mô tả chi tiết luồng điều hướng tuần tự giữa các thành phần.';
  };

  // Re-render Mermaid SVG when diagram selection or codebase changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    const code = getCurrentCode();

    renderMermaidSvg(selectedDiagramId, code)
      .then((svg) => {
        if (isMounted) {
          setRenderedSvg(svg);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setRenderedSvg(`<div class="text-rose-400 p-4 text-xs font-mono">Lỗi kết xuất sơ đồ: ${err.message}</div>`);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDiagramId, dbArch, flows]);

  // Handle ESC key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCurrentCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (!renderedSvg) return;
    const blob = new Blob([renderedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDiagramId}-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-5xl mx-auto select-text">
      {/* Diagram Category & Flow Selector Tabs */}
      <div className="flex flex-col gap-2.5 pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Chọn Sơ Đồ Kiến Trúc ({1 + flows.length} Sơ Đồ Khả Dụng)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            MermaidJS v10 Engine
          </span>
        </div>

        {/* Dynamic Diagram Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* ERD Diagram Tab */}
          <button
            id="diagram-tab-erd"
            onClick={() => { setSelectedDiagramId('erd'); setZoomLevel(1); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              isErd
                ? 'bg-cyan-950 border-cyan-500/60 text-cyan-300 shadow-lg shadow-cyan-950/60'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Sơ Đồ Thực Thể (ERD)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              isErd ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              {dbArch?.entitiesCount || 1} thực thể
            </span>
          </button>

          {/* Dynamic Sequence Flow Tabs */}
          {flows.map((flow, idx) => {
            const flowId = `flow-${idx}`;
            const isSelected = selectedDiagramId === flowId;
            return (
              <button
                key={flow.id || flowId}
                id={`diagram-tab-${flowId}`}
                onClick={() => { setSelectedDiagramId(flowId); setZoomLevel(1); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-teal-950 border-teal-500/60 text-teal-300 shadow-lg shadow-teal-950/60'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="truncate max-w-[220px] sm:max-w-[280px]" title={flow.title}>
                  {flow.title}
                </span>
                <span className="text-[10px] font-mono opacity-70">
                  #{idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar & Action Bar */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-md">
        {/* Title and Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0"></div>
          <span className="text-xs font-bold text-slate-100 truncate">
            {getCurrentTitle()}
          </span>
        </div>

        {/* Viewport Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.5, parseFloat((prev - 0.1).toFixed(2))))}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 transition"
              title="Thu nhỏ (-10%)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setZoomLevel(1)}
              className="text-[11px] font-mono text-cyan-300 font-bold px-2 hover:bg-slate-800 rounded py-0.5 transition"
              title="Nhấp để đặt lại 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.8, parseFloat((prev + 0.1).toFixed(2))))}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 transition"
              title="Phóng to (+10%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
              title="Vừa khít khung hình (Reset)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-4 bg-slate-800 mx-0.5 hidden sm:block"></div>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition flex items-center gap-1.5"
            title="Xem toàn màn hình"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Toàn Màn Hình</span>
          </button>

          {/* Toggle Raw Code Button */}
          <button
            id="toggle-raw-mermaid-btn"
            onClick={() => setShowRawCode(!showRawCode)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              showRawCode
                ? 'bg-cyan-950 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-teal-400" />
            <span>{showRawCode ? 'Xem Sơ Đồ' : 'Mã Mermaid'}</span>
          </button>

          {/* Copy Mermaid Syntax */}
          <button
            id="copy-mermaid-btn"
            onClick={handleCopyCode}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition flex items-center gap-1.5"
            title="Sao chép cú pháp MermaidJS"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Chép Mã</span>
              </>
            )}
          </button>

          {/* Download SVG */}
          <button
            onClick={handleDownloadSvg}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition flex items-center gap-1.5"
            title="Tải ảnh vector SVG chất lượng cao"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Đã tải</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Tải SVG</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Description card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-slate-100">Ý nghĩa cấu trúc: </span>
          {getCurrentDescription()}
        </div>
      </div>

      {/* Responsive Diagram Viewport Canvas */}
      <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 sm:p-6 min-h-[440px] max-h-[620px] flex items-center justify-center overflow-auto shadow-2xl relative bg-grid-slate">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-cyan-400 py-12">
            <RefreshCw className="w-7 h-7 animate-spin text-cyan-400" />
            <div className="text-center">
              <p className="text-xs font-bold text-slate-200">Đang kết xuất sơ đồ trực quan...</p>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">Xử lý cú pháp MermaidJS an toàn</p>
            </div>
          </div>
        ) : showRawCode ? (
          <div className="w-full h-full flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Định dạng: Mermaid Diagram Script</span>
              <span>{getCurrentCode().split('\n').length} dòng</span>
            </div>
            <pre className="w-full font-mono text-xs text-cyan-300 p-4 bg-slate-900/90 rounded-xl overflow-x-auto border border-slate-800 shadow-inner">
              {getCurrentCode()}
            </pre>
          </div>
        ) : (
          <div 
            className="mermaid-diagram-viewport w-full flex justify-center items-center transition-transform duration-200 origin-center"
            style={{ 
              transform: zoomLevel === 1 ? 'none' : `scale(${zoomLevel})`,
              transformOrigin: 'center center'
            }}
            dangerouslySetInnerHTML={{ __html: renderedSvg }}
          />
        )}
      </div>

      {/* Educational Color Legend for Diagram Elements */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Chú Giải Các Thành Phần Sơ Đồ (Color Legend)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></span>
            <span className="text-slate-300 truncate">Actor / Người dùng</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0"></span>
            <span className="text-slate-300 truncate">DOM / Giao diện HTML</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0"></span>
            <span className="text-slate-300 truncate">Service / Controller</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0"></span>
            <span className="text-slate-300 truncate">Database / Bảng Thực thể</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Interactive Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-400">
                <Maximize2 className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-100">{getCurrentTitle()}</h2>
                <p className="text-xs text-slate-400">Chế độ toàn màn hình có độ nét cao</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.15))}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono px-2 text-cyan-300 font-bold">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.15))}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
                  title="Phóng to"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400"
                  title="Đặt lại"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleDownloadSvg}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>Tải SVG</span>
              </button>

              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 border border-slate-800 transition"
                title="Đóng (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Diagram View Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-grid-slate">
            <div 
              className="mermaid-fullscreen-viewport w-full flex justify-center items-center transition-transform duration-200 origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
              dangerouslySetInnerHTML={{ __html: renderedSvg }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
