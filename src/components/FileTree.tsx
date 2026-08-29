import React, { useState } from 'react';
import { 
  FileCode, 
  Folder, 
  FolderOpen, 
  Search, 
  Database, 
  ShieldAlert, 
  CheckCircle2, 
  Layers,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { CodeFile } from '../types';
import { EXCLUDED_FILES_LOG } from '../data/sampleCodebase';

interface FileTreeProps {
  files: CodeFile[];
  selectedFile: CodeFile | null;
  onSelectFile: (file: CodeFile) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  selectedFile,
  onSelectFile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showExcludedModal, setShowExcludedModal] = useState(false);
  const [isTreeExpanded, setIsTreeExpanded] = useState(true);

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (file: CodeFile) => {
    if (file.category === 'schema') {
      return <Database className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (file.category === 'controller') {
      return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    if (file.category === 'service') {
      return <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    return <FileCode className="w-4 h-4 text-blue-400 shrink-0" />;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border-r border-slate-800 select-none">
      {/* File Tree Header */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mã nguồn dự án ({files.length})</span>
          </div>
          <button
            id="excluded-security-badge-btn"
            onClick={() => setShowExcludedModal(!showExcludedModal)}
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/60 text-rose-300 hover:bg-rose-900/60 transition"
            title="Xem danh sách các tệp nhạy cảm đã tự động loại trừ"
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Đã lọc: 3 tệp nhạy cảm</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            id="file-search-input"
            type="text"
            placeholder="Tìm kiếm tệp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* Directory Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="text-[11px] font-mono text-slate-400 px-2 py-1 flex items-center gap-1.5 cursor-pointer hover:text-slate-300"
             onClick={() => setIsTreeExpanded(!isTreeExpanded)}>
          {isTreeExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          {isTreeExpanded ? <FolderOpen className="w-3.5 h-3.5 text-cyan-400" /> : <Folder className="w-3.5 h-3.5 text-cyan-400" />}
          <span className="font-semibold text-slate-300">src/main/</span>
        </div>

        {isTreeExpanded && (
          <div className="pl-3 space-y-0.5 border-l border-slate-800/80 ml-3">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile?.path === file.path;
              return (
                <button
                  key={file.path}
                  id={`file-item-${file.name.replace('.', '-')}`}
                  onClick={() => onSelectFile(file)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-all group ${
                    isSelected
                      ? 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 shadow-sm shadow-cyan-950'
                      : 'hover:bg-slate-800/70 text-slate-300 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {getFileIcon(file)}
                    <span className="font-mono truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0">
                    <span>{file.linesCount} dòng</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                    <span>{file.size}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Security Excluded Info Modal / Drawer */}
      {showExcludedModal && (
        <div className="p-3 bg-slate-950 border-t border-rose-900/40 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-rose-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Lá Chắn An Toàn (Security Shield)
            </span>
            <button 
              onClick={() => setShowExcludedModal(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {EXCLUDED_FILES_LOG.map((item, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded p-1.5 text-[11px]">
                <span className="font-mono font-semibold text-rose-400">{item.name}</span>
                <p className="text-slate-400 text-[10px] mt-0.5">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
