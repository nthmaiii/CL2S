import React from 'react';
import { 
  FileCode2, 
  Sparkles, 
  Download, 
  Key, 
  Zap, 
  ShieldCheck, 
  UploadCloud,
  Layers,
  FileText
} from 'lucide-react';

interface HeaderProps {
  isAnalyzed: boolean;
  isLiveMode: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onReset: () => void;
  onOpenExportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAnalyzed,
  isLiveMode,
  setActiveTab,
  onReset,
  onOpenExportModal,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-3 lg:px-6 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-950/50 shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
            <FileCode2 className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base lg:text-lg tracking-tight bg-gradient-to-r from-slate-100 via-cyan-200 to-teal-300 bg-clip-text text-transparent">
              CodeLegacy2Spec
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              CL2S
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              AI Riser 2026
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Tái cấu trúc mã nguồn cũ thành đặc tả SRS có bằng chứng truy vết (Traceability)
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      {isAnalyzed && (
        <div className="hidden xl:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Độ tin cậy:</span>
            <span className="font-bold text-emerald-400">99.5%</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Context Cache:</span>
            <span className="font-mono text-cyan-400">TTL 1 Giờ</span>
          </div>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Prominent Upload / Rescan Button */}
        <button
          id="header-upload-zip-btn"
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition active:scale-95"
          title="Tải lên tệp .ZIP mã nguồn mới hoặc quét lại"
        >
          <UploadCloud className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Tải ZIP Khác</span>
        </button>

        {/* Prominent Export Button that opens the Full Export Modal */}
        {isAnalyzed && (
          <button
            id="open-export-modal-btn"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-950 transition active:scale-95 border border-cyan-400/30"
            title="Xuất tài liệu SRS (Markdown, Word, JSON, In PDF)"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Tài Liệu</span>
          </button>
        )}

        {/* Live / Demo Mode indicator & link to settings */}
        <button
          id="mode-indicator-btn"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition ${
            isLiveMode
              ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
          title="Cấu hình Gemini API Key"
        >
          <Key className={`w-3.5 h-3.5 ${isLiveMode ? 'text-cyan-400' : 'text-amber-400'}`} />
          <span className="hidden md:inline">{isLiveMode ? 'Live Mode' : 'Cached Mode'}</span>
        </button>
      </div>
    </header>
  );
};
