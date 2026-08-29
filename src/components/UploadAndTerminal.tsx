import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  Terminal as TerminalIcon, 
  Play, 
  ShieldCheck, 
  Sparkles, 
  FolderArchive,
  RefreshCw,
  FileCode,
  Lock,
  Zap,
  FolderPlus,
  Plus,
  Trash2,
  Code,
  Layers
} from 'lucide-react';
import { TerminalLog } from '../types';
import confetti from 'canvas-confetti';

interface CustomFileSnippet {
  id: string;
  name: string;
  content: string;
}

interface UploadAndTerminalProps {
  isScanning: boolean;
  onStartAnalysis: (payload: File | File[] | string | { projectName: string; files: { name: string; content: string; language?: string }[] }) => void;
  logs: TerminalLog[];
  scanProgress: number;
}

export const UploadAndTerminal: React.FC<UploadAndTerminalProps> = ({
  isScanning,
  onStartAnalysis,
  logs,
  scanProgress
}) => {
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Custom Paste/Input State
  const [customProjectName, setCustomProjectName] = useState('appchat-cms');
  const [customSnippets, setCustomSnippets] = useState<CustomFileSnippet[]>([
    {
      id: 'f-1',
      name: 'server.js',
      content: `const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());

// RESTful API Routes
app.get('/api/v1/cms/posts', (req, res) => {
  res.json({ success: true, data: [] });
});

// Socket.IO Realtime Chat Connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('new_message', data);
  });
});

server.listen(8080, () => console.log('AppChat-CMS running on port 8080'));`
    },
    {
      id: 'f-2',
      name: 'chatController.js',
      content: `// Xử lý logic truyền nhận tin nhắn & kiểm tra spam
function handleSendMessage(socket, io, data) {
  const { roomId, content, senderId } = data;
  if (!content || content.trim().length === 0) {
    return socket.emit('error', { message: 'Nội dung tin nhắn không được rỗng!' });
  }
  io.to(roomId).emit('new_message', {
    roomId,
    senderId,
    content,
    sentAt: new Date().toISOString()
  });
}`
    },
    {
      id: 'f-3',
      name: 'schema.sql',
      content: `-- Bảng cơ sở dữ liệu cho AppChat và CMS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  role VARCHAR(32) DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(64) NOT NULL,
  sender_id INT REFERENCES users(id),
  content TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cms_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id INT REFERENCES users(id),
  status VARCHAR(32) DEFAULT 'DRAFT'
);`
    }
  ]);
  const [activeSnippetId, setActiveSnippetId] = useState<string>('f-1');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    if (scanProgress === 100) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#06b6d4', '#14b8a6', '#38bdf8']
      });
    }
  }, [scanProgress]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const fileList = e.dataTransfer.files;
    if (fileList.length > 0) {
      const filesArray: File[] = Array.from(fileList);
      setSelectedFiles(filesArray);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      const filesArray: File[] = Array.from(fileList);
      setSelectedFiles(filesArray);
    }
  };

  const handleExecuteUpload = () => {
    if (selectedFiles.length === 0) return;
    onStartAnalysis(selectedFiles.length === 1 ? selectedFiles[0] : selectedFiles);
  };

  const handleAddSnippet = () => {
    const newId = `f-${Date.now()}`;
    const newName = `file_${customSnippets.length + 1}.js`;
    const newSnippet: CustomFileSnippet = {
      id: newId,
      name: newName,
      content: '// Nhập mã nguồn của bạn vào đây\n'
    };
    setCustomSnippets(prev => [...prev, newSnippet]);
    setActiveSnippetId(newId);
  };

  const handleDeleteSnippet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (customSnippets.length <= 1) return;
    const remaining = customSnippets.filter(s => s.id !== id);
    setCustomSnippets(remaining);
    if (activeSnippetId === id) {
      setActiveSnippetId(remaining[0].id);
    }
  };

  const handleExecuteCustomSnippets = () => {
    if (customSnippets.length === 0) return;
    onStartAnalysis({
      projectName: customProjectName.trim() || 'MY_CODEBASE',
      files: customSnippets.map(s => ({
        name: s.name.trim() || 'code.js',
        content: s.content
      }))
    });
  };

  const currentSnippet = customSnippets.find(s => s.id === activeSnippetId) || customSnippets[0];

  const getTagBadge = (tag: TerminalLog['tag']) => {
    switch (tag) {
      case 'SCAN':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">[SCAN]</span>;
      case 'FILTER':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">[FILTER-SAFE]</span>;
      case 'OPTIMIZE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">[OPTIMIZE]</span>;
      case 'TREE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800">[TREE]</span>;
      case 'CACHE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-800">[CACHE]</span>;
      case 'SUCCESS':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">[SUCCESS]</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">[INFO]</span>;
    }
  };

  return (
    <div className="flex flex-col h-full gap-3 p-3 lg:p-4 overflow-y-auto select-none">
      {/* Upload Modes Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1 flex items-center gap-1 shadow-md">
        <button
          id="mode-upload-files-btn"
          type="button"
          onClick={() => setActiveInputMode('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
            activeInputMode === 'upload'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Tải Lên Tệp / File ZIP / Thư Mục</span>
        </button>

        <button
          id="mode-paste-code-btn"
          type="button"
          onClick={() => setActiveInputMode('paste')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
            activeInputMode === 'paste'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Dán / Nhập Mã Nguồn Trực Tiếp</span>
        </button>

        <button
          id="mode-demo-samples-btn"
          type="button"
          onClick={() => setActiveInputMode('samples')}
          className={`px-3 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
            activeInputMode === 'samples'
              ? 'bg-slate-800 text-cyan-400 border border-cyan-800/60'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dự án mẫu</span>
        </button>
      </div>

      {/* MODE 1: FILE / ZIP / FOLDER UPLOAD */}
      {activeInputMode === 'upload' && (
        <div className="flex flex-col gap-3">
          <div 
            id="zip-upload-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-300 ${
              isDragging 
                ? 'border-cyan-400 bg-cyan-950/40 scale-[0.99] shadow-lg shadow-cyan-950/50' 
                : 'border-slate-700 hover:border-cyan-500/70 bg-slate-900/80 hover:bg-slate-900 shadow-xl'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileInputChange} 
              multiple
              accept=".html,.htm,.zip,.tar,.gz,.java,.js,.jsx,.ts,.tsx,.py,.go,.sql,.json,.vue,.php,.css" 
              className="hidden" 
            />

            {/* Folder selection hidden input */}
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFileInputChange}
              // @ts-ignore
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
            />
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-950 to-slate-900 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50 group-hover:scale-110 transition">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100 flex items-center justify-center gap-1.5 flex-wrap">
                  <span>Kéo thả tệp dự án của bạn</span>
                  <span className="text-cyan-400 font-mono font-extrabold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">.ZIP / .HTML / SOURCE</span>
                  <span>vào đây</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Hỗ trợ toàn diện dự án Node.js, Express, React, Java Spring Boot, Python FastAPI/Flask, PHP, HTML5...
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Chọn tệp lẻ / file .ZIP</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    folderInputRef.current?.click();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chọn cả thư mục dự án</span>
                </button>
              </div>

              {/* Enterprise Security Badges */}
              <div className="flex items-center gap-3 pt-2 text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Lock className="w-3 h-3" /> Auto .env Shield
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <Zap className="w-3 h-3" /> Universal Parser
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-purple-400">
                  <Sparkles className="w-3 h-3" /> Gemini Caching
                </span>
              </div>
            </div>
          </div>

          {/* If files are selected, display confirmation and Action Button */}
          {selectedFiles.length > 0 && (
            <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold">
                  {selectedFiles.length}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100">
                    {selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} tệp đã chọn sẵn sàng`}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {(selectedFiles.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1)} KB • Hệ thống đã sẵn sàng quét và trích xuất đặc tả SRS
                  </p>
                </div>
              </div>

              <button
                id="start-user-upload-scan-btn"
                type="button"
                disabled={isScanning}
                onClick={handleExecuteUpload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                {isScanning ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>Bắt Đầu Phân Tích Mã Nguồn Của Tôi</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: DIRECT CODE / MULTI-FILE INPUT */}
      {activeInputMode === 'paste' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-300 shrink-0">Tên dự án:</label>
              <input
                type="text"
                value={customProjectName}
                onChange={(e) => setCustomProjectName(e.target.value)}
                placeholder="Ví dụ: appchat-cms"
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-xs text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none w-full sm:w-64"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleAddSnippet}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm tệp</span>
              </button>

              <button
                id="submit-custom-code-btn"
                type="button"
                disabled={isScanning}
                onClick={handleExecuteCustomSnippets}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-950 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                {isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>Phân Tích Dự Án Này</span>
              </button>
            </div>
          </div>

          {/* File Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {customSnippets.map((snip) => (
              <div
                key={snip.id}
                onClick={() => setActiveSnippetId(snip.id)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition shrink-0 ${
                  activeSnippetId === snip.id
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{snip.name}</span>
                {customSnippets.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSnippet(snip.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition ml-1"
                    title="Xóa tệp này"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Active File Editor */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">Đổi tên tệp:</span>
                <input
                  type="text"
                  value={currentSnippet.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setCustomSnippets(prev => prev.map(s => s.id === currentSnippet.id ? { ...s, name: newName } : s));
                  }}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {currentSnippet.content.split('\n').length} dòng
              </span>
            </div>

            <textarea
              value={currentSnippet.content}
              onChange={(e) => {
                const newContent = e.target.value;
                setCustomSnippets(prev => prev.map(s => s.id === currentSnippet.id ? { ...s, content: newContent } : s));
              }}
              rows={9}
              placeholder="Dán hoặc gõ mã nguồn của bạn vào đây..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:border-cyan-500/80 focus:outline-none resize-y leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {/* MODE 3: SAMPLE / DEMO CODEBASES */}
      {activeInputMode === 'samples' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
          <p className="text-xs text-slate-400">
            Bạn có thể thử nghiệm nhanh tính năng trích xuất đặc tả SRS với các bộ mã nguồn mẫu:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-indigo-900/60 rounded-xl p-3 flex flex-col justify-between gap-3 hover:border-indigo-500 transition">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Dự án: AppChat-CMS</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hệ thống trò chuyện thời gian thực (Socket.IO/WebSockets) kết hợp bảng quản trị nội dung CMS (RESTful CRUD, RBAC, schema.sql).
                </p>
              </div>
              <button
                id="load-sample-appchat-btn"
                type="button"
                disabled={isScanning}
                onClick={() => onStartAnalysis('appchat-cms.zip')}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Nạp Dự Án AppChat-CMS</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-3 hover:border-cyan-500 transition">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Dự án: Spring Boot Legacy</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hệ thống phân tầng Java Enterprise: UserController, UserService (BCrypt, Brute-Force lockout), JPA Repository và MySQL.
                </p>
              </div>
              <button
                id="load-sample-project-btn"
                type="button"
                disabled={isScanning}
                onClick={() => onStartAnalysis('sample-legacy-springboot-v1.zip')}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
                <span>Nạp Dự Án Spring Boot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar when scanning */}
      {isScanning && (
        <div className="bg-slate-900/90 border border-cyan-500/50 rounded-xl p-3 shadow-lg shadow-cyan-950/40">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              Đang quét tệp mã nguồn & trích xuất đặc tả SRS...
            </span>
            <span className="font-mono font-bold text-cyan-400">{scanProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm shadow-cyan-400"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Interactive Security Terminal */}
      <div className="flex-1 min-h-[240px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xl">
        {/* Terminal Header */}
        <div className="h-8 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-400 ml-2">
              <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>CL2S-Security-Terminal :: Real-time Pipeline</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> In-Memory Shield Active
          </span>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-2 select-text">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-6">
              <FolderArchive className="w-8 h-8 text-slate-400 mb-2 stroke-[1.5]" />
              <p className="text-xs font-semibold text-slate-300">Sẵn sàng tiếp nhận mã nguồn của bạn.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Tải lên tệp .ZIP, kéo thả mã nguồn hoặc nhập trực tiếp ở tab bên trên để chạy Pipeline trích xuất đặc tả.
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed animate-in fade-in duration-200">
                <span className="text-slate-400 text-[10px] shrink-0 font-mono">{log.timestamp}</span>
                <div className="shrink-0">{getTagBadge(log.tag)}</div>
                <div className="flex-1 text-slate-200">
                  <span className="font-sans">{log.message}</span>
                  {log.details && (
                    <span className="block text-[11px] text-slate-400 mt-0.5 pl-2 border-l-2 border-slate-700 font-sans">
                      {log.details}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
