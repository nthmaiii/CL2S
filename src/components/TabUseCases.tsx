import React, { useState } from 'react';
import { 
  FileCheck, 
  Target, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  Code, 
  Layers, 
  Sparkles, 
  ExternalLink, 
  BookOpen, 
  CheckCircle2, 
  Lock, 
  Globe,
  Download
} from 'lucide-react';
import { UseCaseSpec, BusinessRuleSpec, ApiSpec, TraceEvidence, ConfidenceLevel } from '../types';

interface TabUseCasesProps {
  useCases: UseCaseSpec[];
  businessRules: BusinessRuleSpec[];
  apiSpecs: ApiSpec[];
  onSelectEvidence: (evidence: TraceEvidence) => void;
  onOpenExportModal?: () => void;
}

export const TabUseCases: React.FC<TabUseCasesProps> = ({
  useCases,
  businessRules,
  apiSpecs,
  onSelectEvidence,
  onOpenExportModal,
}) => {
  const [subSection, setSubSection] = useState<'usecases' | 'rules' | 'apis'>('usecases');

  const getConfidenceBadge = (confidence: ConfidenceLevel) => {
    switch (confidence) {
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Độ tin cậy: HIGH (99%)
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Độ tin cậy: MEDIUM (85%)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 border border-rose-500/40 text-rose-300">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 overflow-y-auto max-w-5xl mx-auto select-text">
      {/* Sub navigation pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="subtab-usecases-btn"
            onClick={() => setSubSection('usecases')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              subSection === 'usecases'
                ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Ca Sử Dụng ({useCases.length})</span>
          </button>

          <button
            id="subtab-rules-btn"
            onClick={() => setSubSection('rules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              subSection === 'rules'
                ? 'bg-teal-950 border border-teal-500/50 text-teal-300 shadow-md shadow-teal-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Luật Nghiệp Vụ ({businessRules.length})</span>
          </button>

          <button
            id="subtab-apis-btn"
            onClick={() => setSubSection('apis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              subSection === 'apis'
                ? 'bg-purple-950 border border-purple-500/50 text-purple-300 shadow-md shadow-purple-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Đặc Tả API ({apiSpecs.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onOpenExportModal && (
            <button
              onClick={onOpenExportModal}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Xuất tài liệu SRS"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất SRS</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: USE CASES */}
      {subSection === 'usecases' && (
        <div className="space-y-4">
          {useCases.map((uc) => (
            <div 
              key={uc.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 lg:p-5 transition shadow-lg space-y-3"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
                    {uc.id}
                  </span>
                  <h3 className="text-sm lg:text-base font-bold text-slate-100">
                    {uc.name}
                  </h3>
                </div>
                {getConfidenceBadge(uc.confidence)}
              </div>

              {/* Actor & Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">Tác nhân (Actor):</span>
                  <span className="text-cyan-300 font-medium">{uc.actor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">Điều kiện tiên quyết:</span>
                  <span className="text-slate-300">{uc.preCondition}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">Kết quả sau thực thi:</span>
                  <span className="text-slate-300">{uc.postCondition}</span>
                </div>
              </div>

              {/* Main Flow */}
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Luồng Thực Thi Chính (Main Flow):
                </span>
                <div className="space-y-1.5">
                  {uc.mainFlow.map((step, idx) => (
                    <div key={idx} className="text-xs text-slate-300 bg-slate-950/40 px-3 py-1.5 rounded border border-slate-800/40">
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* Traceability Evidence Block */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Luật tham chiếu:</span>
                  {uc.businessRulesRef?.map((r) => (
                    <span key={r} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                      {r}
                    </span>
                  ))}
                </div>

                <button
                  id={`trace-btn-${uc.id}`}
                  onClick={() => onSelectEvidence(uc.evidence)}
                  className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-950 transition active:scale-95 group"
                >
                  <Target className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition" />
                  <span>Bằng chứng: <span className="font-mono underline">{uc.evidence.fileName}: Dòng {uc.evidence.startLine}–{uc.evidence.endLine}</span></span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 2: BUSINESS RULES */}
      {subSection === 'rules' && (
        <div className="space-y-4">
          {businessRules.map((rule) => (
            <div 
              key={rule.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 lg:p-5 transition shadow-lg space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded bg-teal-950 border border-teal-500/40 text-teal-300 font-mono text-xs font-bold">
                    {rule.id}
                  </span>
                  <h3 className="text-sm lg:text-base font-bold text-slate-100">
                    {rule.ruleName}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    rule.impactLevel === 'CRITICAL' 
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    Mức độ: {rule.impactLevel}
                  </span>
                  {getConfidenceBadge(rule.confidence)}
                </div>
              </div>

              <p className="text-xs lg:text-sm text-slate-300 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                {rule.description}
              </p>

              {/* Evidence trigger */}
              <div className="pt-2 flex justify-end">
                <button
                  id={`trace-btn-${rule.id}`}
                  onClick={() => onSelectEvidence(rule.evidence)}
                  className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-950 hover:bg-teal-900 border border-teal-500/50 text-teal-300 shadow-md shadow-teal-950 transition active:scale-95 group"
                >
                  <Target className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition" />
                  <span>Bằng chứng: <span className="font-mono underline">{rule.evidence.fileName}: Dòng {rule.evidence.startLine}–{rule.evidence.endLine}</span></span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 3: APIS */}
      {subSection === 'apis' && (
        <div className="space-y-4">
          {apiSpecs.map((api, idx) => (
            <div 
              key={idx}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 lg:p-5 transition shadow-lg space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-black ${
                    api.method === 'POST' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                    api.method === 'GET' ? 'bg-blue-950 text-blue-300 border border-blue-700' :
                    'bg-purple-950 text-purple-300 border border-purple-700'
                  }`}>
                    {api.method}
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-100">
                    {api.endpoint}
                  </span>
                </div>
                {getConfidenceBadge(api.confidence)}
              </div>

              <p className="text-xs text-slate-300">
                {api.description}
              </p>

              {/* Payloads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {api.requestPayload && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Request Payload:</span>
                    <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                      {api.requestPayload}
                    </pre>
                  </div>
                )}
                {api.responsePayload && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Sample Response:</span>
                    <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                      {api.responsePayload}
                    </pre>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id={`trace-api-btn-${idx}`}
                  onClick={() => onSelectEvidence(api.evidence)}
                  className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-500/50 text-purple-300 shadow-md shadow-purple-950 transition active:scale-95 group"
                >
                  <Target className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition" />
                  <span>Bằng chứng: <span className="font-mono underline">{api.evidence.fileName}: Dòng {api.evidence.startLine}–{api.evidence.endLine}</span></span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
