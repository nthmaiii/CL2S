import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Target, 
  Zap, 
  Trash2, 
  HelpCircle,
  Clock,
  ArrowRight,
  Code2,
  Cpu
} from 'lucide-react';
import { ChatMessage, TraceEvidence } from '../types';
import { askCodebaseChatbot, checkGeminiServerStatus } from '../utils/geminiApi';

interface TabChatbotProps {
  onSelectEvidence: (evidence: TraceEvidence) => void;
  apiKey: string;
  isLiveMode: boolean;
  codeContext?: string;
}

interface EnhancedChatMessage extends ChatMessage {
  isLive?: boolean;
  modelUsed?: string;
  latencyMs?: number;
}

const SAMPLE_QUESTIONS = [
  'Xin chào!',
  'Hãy mô tả tổng quan về dự án này',
  'Làm thế nào để mã hóa mật khẩu trong dự án này?',
  'Quy trình đăng ký tài khoản mới diễn ra như thế nào?',
  'Cơ chế tự động khóa tài khoản sau 5 lần sai hoạt động ra sao?',
  'Cơ sở dữ liệu gồm những bảng nào và quan hệ ra sao?'
];

export const TabChatbot: React.FC<TabChatbotProps> = ({
  onSelectEvidence,
  apiKey,
  isLiveMode,
  codeContext
}) => {
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: 'Xin chào! Tôi là Trợ lý AI phân tích mã nguồn di sản CL2S (CodeLegacy2Spec). Toàn bộ mã nguồn đã được nạp vào **Gemini Context Cache (TTL 1 Giờ)**.\n\nBạn có thể hỏi tôi bất kỳ điều gì về logic nghiệp vụ, điều kiện rẽ nhánh, thuật toán bảo mật hoặc cấu trúc dữ liệu của dự án này.'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [serverHasKey, setServerHasKey] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isThinking]);

  useEffect(() => {
    checkGeminiServerStatus().then(status => {
      setServerHasKey(status.hasServerKey);
    });
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isThinking) return;

    const userMsg: EnhancedChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: query.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const response = await askCodebaseChatbot(query, apiKey, isLiveMode, codeContext);
      
      const assistantMsg: EnhancedChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: response.text,
        evidenceRef: response.evidenceRef,
        isLive: response.isLive,
        modelUsed: response.modelUsed,
        latencyMs: response.latencyMs,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Xin lỗi, đã xảy ra lỗi trong quá trình phân tích ngữ cảnh mã nguồn.'
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'Lịch sử hội thoại đã được xóa. Tôi sẵn sàng cho câu hỏi tiếp theo về codebase!'
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 p-3 lg:p-5 max-w-5xl mx-auto select-text">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs lg:text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Trợ lý Mã nguồn CL2S</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 fill-current" />
                Response &lt;1.5s
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isLiveMode 
                ? (serverHasKey || (apiKey && apiKey.length > 5) 
                    ? '🟢 Đang chạy Live Gemini API (Context Grounding)' 
                    : '🟡 Live Mode bật (Sử dụng Gemini Backend/BYOK)') 
                : '⚡ Chế độ Demo (Tối ưu hóa sẵn phản hồi)'}
            </p>
          </div>
        </div>

        <button
          id="clear-chat-btn"
          onClick={handleClearChat}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          title="Xóa hội thoại"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Xóa hội thoại</span>
        </button>
      </div>

      {/* Messages list */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-xs shrink-0 shadow-md">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs lg:text-sm leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-br-none shadow-md shadow-cyan-950/40'
                : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
            }`}>
              <div className="whitespace-pre-wrap font-sans">
                {msg.text}
              </div>

              {/* Trace Evidence Clickable Card if attached */}
              {msg.evidenceRef && (
                <div className="mt-3 pt-2.5 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-cyan-400 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Bằng chứng mã nguồn xác thực:</span>
                  </div>
                  
                  <div className="bg-slate-950 rounded-lg p-2 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <Code2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="font-mono text-xs text-slate-200 font-semibold truncate">
                        {msg.evidenceRef.fileName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        Dòng {msg.evidenceRef.startLine}–{msg.evidenceRef.endLine}
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectEvidence(msg.evidenceRef!)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-500/40 transition shrink-0 self-end sm:self-auto"
                    >
                      <span>Xem Dòng Code</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Message metadata footer */}
              <div className={`mt-2 text-[10px] flex items-center gap-2 ${msg.sender === 'user' ? 'text-cyan-200/70 justify-end' : 'text-slate-400'}`}>
                <Clock className="w-2.5 h-2.5" />
                <span>{msg.timestamp}</span>
                {msg.modelUsed && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-cyan-400">{msg.modelUsed}</span>
                  </>
                )}
                {msg.latencyMs && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-emerald-400">{(msg.latencyMs / 1000).toFixed(2)}s</span>
                  </>
                )}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs shrink-0 shadow-md">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* AI Typing Indicator */}
        {isThinking && (
          <div className="flex gap-3 justify-start animate-in fade-in duration-200">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-xs shrink-0 shadow-md">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl rounded-bl-none p-3 text-xs text-cyan-300 flex items-center gap-2 shadow-lg shadow-cyan-950/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Đang truy xuất Gemini Context Cache & trích xuất bằng chứng...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="mb-2 shrink-0">
        <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-cyan-400" />
          <span>Gợi ý câu hỏi nhanh:</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {SAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              disabled={isThinking}
              onClick={() => handleSendMessage(q)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-900 hover:bg-cyan-950/70 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 transition shrink-0 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 bg-slate-900 border border-slate-800 focus-within:border-cyan-500/80 rounded-xl p-1.5 shadow-lg shrink-0 transition"
      >
        <input
          id="chatbot-prompt-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Hỏi về mã nguồn, bảo mật, API, database..."
          disabled={isThinking}
          className="flex-1 bg-transparent px-3 py-1.5 text-xs lg:text-sm text-slate-100 placeholder-slate-400 focus:outline-none disabled:opacity-50"
        />

        <button
          id="send-chat-btn"
          type="submit"
          disabled={!inputText.trim() || isThinking}
          className="p-2 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-md shadow-cyan-950 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Gửi câu hỏi"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
