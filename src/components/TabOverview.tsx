import React from 'react';
import { 
  Building2, 
  Cpu, 
  Database, 
  ShieldCheck, 
  Layers, 
  Zap, 
  Clock, 
  FileCheck,
  CheckCircle2,
  Sparkles,
  Download,
  FileCode2,
  FileText
} from 'lucide-react';
import { ProjectOverview } from '../types';

interface TabOverviewProps {
  overview: ProjectOverview;
  onNavigateToUseCases: () => void;
  onNavigateToDatabase: () => void;
  onOpenExportModal?: () => void;
}

export const TabOverview: React.FC<TabOverviewProps> = ({
  overview,
  onNavigateToUseCases,
  onNavigateToDatabase,
  onOpenExportModal
}) => {
  return (
    <div className="p-4 lg:p-6 space-y-6 overflow-y-auto max-w-5xl mx-auto select-text">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                SRS Tự Động Hóa (AI Reconstructed)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Độ tin cậy: {overview.metrics.reconstructionConfidence}%
              </span>
            </div>

            {onOpenExportModal && (
              <button
                id="overview-export-btn"
                onClick={onOpenExportModal}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 transition flex items-center gap-1.5 border border-cyan-400/30"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Tài Liệu SRS (.md / .doc)</span>
              </button>
            )}
          </div>

          <h1 className="text-xl lg:text-2xl font-black text-slate-100 tracking-tight mb-2">
            {overview.name}
          </h1>
          <p className="text-sm font-medium text-cyan-400 mb-3">
            {overview.slogan}
          </p>
          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed max-w-3xl">
            {overview.description}
          </p>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-cyan-400" />
              Kiến trúc: <strong className="text-slate-200">{overview.architecturalStyle}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[11px] text-slate-400 mb-1">Tệp đã quét</div>
          <div className="text-lg font-black text-slate-100 font-mono">
            {overview.metrics.totalFilesScanned.toLocaleString()}
          </div>
          <div className="text-[10px] text-cyan-400 mt-0.5">Toàn bộ Tree</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[11px] text-slate-400 mb-1">Tệp logic giữ lại</div>
          <div className="text-lg font-black text-emerald-400 font-mono">
            {overview.metrics.relevantFilesCount}
          </div>
          <div className="text-[10px] text-emerald-300 mt-0.5">Tree-Shaking 100%</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[11px] text-slate-400 mb-1">Tệp rác/nhạy cảm</div>
          <div className="text-lg font-black text-rose-400 font-mono">
            {overview.metrics.ignoredFilesCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-rose-300 mt-0.5">Đã lọc an toàn</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[11px] text-slate-400 mb-1">Dòng mã (LOC)</div>
          <div className="text-lg font-black text-slate-100 font-mono">
            {overview.metrics.totalLinesOfCode}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Logic cốt lõi</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[11px] text-slate-400 mb-1">Context Cache</div>
          <div className="text-lg font-black text-cyan-400 font-mono">
            {overview.metrics.cacheTtlMinutes}m
          </div>
          <div className="text-[10px] text-cyan-300 mt-0.5">Gemini Caching</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[11px] text-slate-400 mb-1">Tokens tiết kiệm</div>
          <div className="text-lg font-black text-amber-400 font-mono">
            ~85.4K
          </div>
          <div className="text-[10px] text-amber-300 mt-0.5">Tiết kiệm 80%</div>
        </div>
      </div>

      {/* Tech Stack Detected */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Công nghệ phát hiện trong mã nguồn (Tech Stack Analysis)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {overview.techStackDetected.map((tech, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  {tech.category}
                </span>
                <h4 className="text-sm font-bold text-slate-200 mt-1.5">{tech.name}</h4>
                {tech.version && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Phiên bản: {tech.version}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {tech.confidence}%
                </span>
                <span className="block text-[10px] text-slate-400">Độ tin cậy</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Audit Findings */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Phát hiện & Đánh giá An ninh mã nguồn (Security Audit Insights)
        </h3>
        <div className="space-y-2">
          {overview.securityFindingsSummary.map((finding, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/60 border border-slate-800/60 p-2.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{finding}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={onNavigateToUseCases}
          className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-left transition group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              Use Cases & Bằng chứng
            </span>
            <span className="text-xs text-cyan-400 group-hover:translate-x-1 transition">→</span>
          </div>
          <p className="text-xs text-slate-400">
            Xem các Ca sử dụng, Luật nghiệp vụ và API Specifications kèm liên kết dòng mã trực tiếp.
          </p>
        </button>

        <button
          onClick={onNavigateToDatabase}
          className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/40 text-left transition group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-bold text-slate-200 group-hover:text-teal-300 transition flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-400" />
              Sơ đồ ERD & Tuần tự
            </span>
            <span className="text-xs text-teal-400 group-hover:translate-x-1 transition">→</span>
          </div>
          <p className="text-xs text-slate-400">
            Khám phá kiến trúc các bảng dữ liệu và sơ đồ luồng tuần tự tương tác Mermaid.
          </p>
        </button>

        {onOpenExportModal && (
          <button
            onClick={onOpenExportModal}
            className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-900 hover:from-cyan-950/70 border border-cyan-500/30 hover:border-cyan-500/60 text-left transition group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-cyan-200 group-hover:text-cyan-100 transition flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" />
                Xuất Tài Liệu SRS
              </span>
              <span className="text-xs text-cyan-400 group-hover:translate-x-1 transition">→</span>
            </div>
            <p className="text-xs text-slate-400">
              Tải tài liệu hoàn chỉnh định dạng Markdown (.md), Word (.doc), JSON hoặc in trực tiếp.
            </p>
          </button>
        )}
      </div>
    </div>
  );
};
