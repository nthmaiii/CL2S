import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileCode2, 
  FileText, 
  Copy, 
  Check, 
  Printer, 
  Sparkles, 
  ShieldCheck,
  Eye,
  Layers,
  Code2
} from 'lucide-react';
import { FullSRS } from '../types';
import { 
  downloadFile, 
  copyToClipboardSafe, 
  generateMarkdownSRS, 
  generateWordHtmlSRS 
} from '../utils/docExporter';

interface ExportDocModalProps {
  srsSpec: FullSRS;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDocModal: React.FC<ExportDocModalProps> = ({
  srsSpec,
  isOpen,
  onClose
}) => {
  const [activeFormat, setActiveFormat] = useState<'md' | 'doc' | 'json'>('md');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const safeProjectName = (srsSpec.projectOverview.name || 'SRS-Project').replace(/[^a-zA-Z0-9_-]/g, '_');
  const mdContent = generateMarkdownSRS(srsSpec);
  const wordContent = generateWordHtmlSRS(srsSpec);
  const jsonContent = JSON.stringify(srsSpec, null, 2);

  const handleDownload = () => {
    let success = false;
    let fileName = '';

    if (activeFormat === 'md') {
      fileName = `SRS_${safeProjectName}.md`;
      success = downloadFile(mdContent, fileName, 'text/markdown');
    } else if (activeFormat === 'doc') {
      fileName = `SRS_${safeProjectName}.doc`;
      success = downloadFile(wordContent, fileName, 'application/msword');
    } else {
      fileName = `SRS_${safeProjectName}.json`;
      success = downloadFile(jsonContent, fileName, 'application/json');
    }

    if (success) {
      setDownloadSuccess(`Đã tải xuống thành công: ${fileName}`);
      setTimeout(() => setDownloadSuccess(null), 3500);
    }
  };

  const handleCopy = async () => {
    const textToCopy = activeFormat === 'md' 
      ? mdContent 
      : activeFormat === 'doc' 
        ? mdContent // Copy markdown text even when doc preview is selected
        : jsonContent;

    const ok = await copyToClipboardSafe(textToCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden select-text">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Xuất Tài Liệu Đặc Tả SRS (Software Requirements Specification)
              </h2>
              <p className="text-xs text-slate-400">
                Tài liệu chuẩn IEEE 830 / ISO 29148 tái dựng từ mã nguồn với bằng chứng truy vết
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              id="export-tab-md"
              onClick={() => setActiveFormat('md')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                activeFormat === 'md'
                  ? 'bg-cyan-950 border-cyan-500/80 text-cyan-300 shadow-md shadow-cyan-950'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Markdown (.md)</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono">
                Khuyên dùng
              </span>
            </button>

            <button
              id="export-tab-doc"
              onClick={() => setActiveFormat('doc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                activeFormat === 'doc'
                  ? 'bg-teal-950 border-teal-500/80 text-teal-300 shadow-md shadow-teal-950'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              <span>Word (.doc / HTML)</span>
            </button>

            <button
              id="export-tab-json"
              onClick={() => setActiveFormat('json')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                activeFormat === 'json'
                  ? 'bg-purple-950 border-purple-500/80 text-purple-300 shadow-md shadow-purple-950'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-purple-400" />
              <span>JSON Data</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {srsSpec.projectOverview.metrics.reconstructionConfidence}% Confidence
            </span>
            <span>•</span>
            <span>{srsSpec.useCases.length} Use Cases</span>
            <span>•</span>
            <span>{srsSpec.businessRules.length} Rules</span>
          </div>
        </div>

        {/* Content Preview Box */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-inner">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold text-slate-300">Xem trước nội dung (Live Document Preview)</span>
              </div>
              <span className="font-mono text-[11px]">
                {activeFormat === 'md' ? `${mdContent.length.toLocaleString()} ký tự` : activeFormat === 'doc' ? 'HTML Word Template' : 'JSON Data'}
              </span>
            </div>

            <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto pr-2 select-text">
              {activeFormat === 'md' ? mdContent : activeFormat === 'doc' ? wordContent.slice(0, 4000) + '\n\n...[Định dạng bảng biểu và style Word đầy đủ được kèm theo trong tệp tải về]...' : jsonContent}
            </pre>
          </div>
        </div>

        {/* Feedback message if download success */}
        {downloadSuccess && (
          <div className="bg-emerald-950/80 border-t border-emerald-500/40 px-5 py-2 text-xs text-emerald-300 flex items-center gap-2 shrink-0">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              id="modal-copy-btn"
              onClick={handleCopy}
              className="px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-2"
              title="Sao chép toàn bộ nội dung tài liệu"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Đã sao chép vào Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>Sao chép toàn bộ</span>
                </>
              )}
            </button>

            <button
              id="modal-print-btn"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-2"
              title="In hoặc Lưu thành PDF từ trình duyệt"
            >
              <Printer className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">In / Lưu PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition border border-slate-700"
            >
              Đóng
            </button>

            <button
              id="modal-download-primary-btn"
              onClick={handleDownload}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 transition active:scale-95 flex items-center gap-2 border border-cyan-400/30"
            >
              <Download className="w-4 h-4" />
              <span>Tải Tệp {activeFormat.toUpperCase()} Về Máy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
