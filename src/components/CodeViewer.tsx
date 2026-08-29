import React, { useEffect, useRef } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  Sparkles, 
  Target, 
  Maximize2,
  Code2
} from 'lucide-react';
import { CodeFile, TraceEvidence } from '../types';

interface CodeViewerProps {
  file: CodeFile | null;
  activeEvidence: TraceEvidence | null;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  file,
  activeEvidence,
}) => {
  const [copied, setCopied] = React.useState(false);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const lineHighlightRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (activeEvidence && file && activeEvidence.fileName === file.name) {
      const targetLine = activeEvidence.startLine;
      const targetElement = lineHighlightRefs.current[targetLine];
      if (targetElement && codeContainerRef.current) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [activeEvidence, file]);

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-6 text-center select-none">
        <Code2 className="w-12 h-12 text-slate-400 mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">Chưa chọn tệp mã nguồn</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Chọn một tệp từ cây thư mục hoặc nhấn vào bất kỳ bằng chứng (Evidence) trong SRS để xem code trực tiếp.
        </p>
      </div>
    );
  }

  const lines = file.content.split('\n');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isEvidenceMatching = activeEvidence && activeEvidence.fileName === file.name;

  return (
    <div className="flex flex-col h-full bg-slate-950 border-t lg:border-t-0 border-slate-800 overflow-hidden">
      {/* Code Header Bar */}
      <div className="h-10 bg-slate-900/90 border-b border-slate-800 px-3 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2 truncate">
          <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-mono text-xs font-semibold text-slate-200 truncate">
            {file.path}
          </span>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {file.language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isEvidenceMatching && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 text-[11px] font-semibold animate-pulse">
              <Target className="w-3 h-3 text-cyan-400" />
              <span>Bằng chứng: Dòng {activeEvidence.startLine}–{activeEvidence.endLine}</span>
            </div>
          )}

          <button
            id="copy-code-btn"
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
            title="Sao chép toàn bộ mã nguồn"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Sao chép</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Evidence Banner info when active */}
      {isEvidenceMatching && (
        <div className="bg-gradient-to-r from-cyan-950/80 to-slate-900 border-b border-cyan-500/30 px-3 py-1.5 text-xs flex items-start gap-2 select-text shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-slate-300">
            <span className="font-bold text-cyan-300">Truy vết nguồn gốc: </span>
            <span className="text-slate-300">{activeEvidence.explanation}</span>
          </div>
        </div>
      )}

      {/* Code lines container with line numbers */}
      <div 
        ref={codeContainerRef}
        className="flex-1 overflow-auto font-mono text-xs p-2 select-text leading-5 bg-slate-950"
      >
        <div className="min-w-full inline-block">
          {lines.map((lineText, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = isEvidenceMatching && 
              lineNum >= activeEvidence.startLine && 
              lineNum <= activeEvidence.endLine;

            return (
              <div
                key={lineNum}
                ref={(el) => { lineHighlightRefs.current[lineNum] = el; }}
                className={`flex items-start transition-colors duration-300 ${
                  isHighlighted 
                    ? 'bg-cyan-950/70 border-l-4 border-cyan-400 text-cyan-100 shadow-inner' 
                    : 'hover:bg-slate-900/50 border-l-4 border-transparent'
                }`}
              >
                {/* Line number gutter */}
                <div 
                  className={`w-10 text-right pr-3 shrink-0 select-none ${
                    isHighlighted ? 'text-cyan-400 font-bold' : 'text-slate-600'
                  }`}
                >
                  {lineNum}
                </div>

                {/* Line code text with simple syntax highlights */}
                <div className="flex-1 pl-2 whitespace-pre pr-4 font-normal">
                  {renderFormattedCodeLine(lineText, file.language)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function renderFormattedCodeLine(text: string, language: string) {
  // Simple token highlight for keywords, strings, comments, annotations
  if (text.trim().startsWith('//') || text.trim().startsWith('--') || text.trim().startsWith('/*') || text.trim().startsWith('*')) {
    return <span className="text-slate-500 italic">{text}</span>;
  }

  // Keywords formatting
  const formatted = text
    .replace(/(package|import|public|class|interface|return|throw|new|if|else|private|final|static|void|String|int|long|boolean|true|false|null|SELECT|FROM|WHERE|INSERT|INTO|CREATE|TABLE|ENGINE|AUTO_INCREMENT|PRIMARY|KEY|UNIQUE|NOT|NULL)/g, '§kw§$1§/kw§')
    .replace(/(@\w+)/g, '§ann§$1§/ann§')
    .replace(/(".*?"|'.*?')/g, '§str§$1§/str§');

  const parts = formatted.split(/(§kw§.*?§\/kw§|§ann§.*?§\/ann§|§str§.*?§\/str§)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('§kw§')) {
          return <span key={i} className="text-purple-400 font-semibold">{part.replace(/§\/?kw§/g, '')}</span>;
        }
        if (part.startsWith('§ann§')) {
          return <span key={i} className="text-amber-400 font-medium">{part.replace(/§\/?ann§/g, '')}</span>;
        }
        if (part.startsWith('§str§')) {
          return <span key={i} className="text-emerald-300">{part.replace(/§\/?str§/g, '')}</span>;
        }
        return <span key={i} className="text-slate-200">{part}</span>;
      })}
    </>
  );
}
