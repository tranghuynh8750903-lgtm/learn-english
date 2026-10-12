import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ArrowRight,
  HelpCircle,
  Wand2,
  BookOpen,
  Copy,
  Check,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { ChatMessage, LearningMode } from '../types';
import { askAIAssistant } from '../services/geminiService';

interface AIAssistantProps {
  learningMode: LearningMode;
  targetScore: string;
  onModeChange: (mode: LearningMode) => void;
  onNavigateWrite: (draft?: { title: string; content: string; topicTag: string }) => void;
}

const QUICK_PROMPTS = {
  TOEIC: [
    {
      title: 'Giải thích lỗi "many reason"',
      prompt:
        'Vì sao câu "I have many reason to learn English" lại sai ngữ pháp? Hãy giải thích quy tắc với many và cho 3 ví dụ câu tương tự trong đề thi TOEIC Part 5.',
    },
    {
      title: 'Phân biệt Despite vs. Although',
      prompt:
        'Phân biệt chi tiết cách dùng Despite, In spite of, Although, Even though, However trong TOEIC Part 5 & 6 kèm các ví dụ cụ thể.',
    },
    {
      title: 'Collocations công sở Part 5',
      prompt:
        'Hãy cung cấp 5 cụm Collocations thương mại xuất hiện nhiều nhất trong TOEIC mức 800+ kèm nghĩa tiếng Việt và câu ví dụ minh họa.',
    },
    {
      title: 'Chiến thuật Paraphrasing Part 7',
      prompt:
        'Chia sẻ chiến thuật tìm từ đồng nghĩa (Paraphrasing) hiệu quả để đạt điểm tối đa ở các đoạn văn đôi và đoạn văn ba trong TOEIC Part 7.',
    },
  ],
  IELTS: [
    {
      title: 'Giải thích lỗi "many reason"',
      prompt:
        'Giải thích lỗi sai trong câu "I have many reason to learn English", và cho tôi 3 cách diễn đạt lại chuẩn Band 8.0 cho bài thi IELTS Writing Task 2.',
    },
    {
      title: 'Từ vựng C1/C2 chủ đề Công nghệ',
      prompt:
        'Cung cấp 6 từ vựng & Collocations học thuật C1/C2 chủ đề "Artificial Intelligence & Automation" cho IELTS Writing Task 2 kèm câu ví dụ.',
    },
    {
      title: 'Cấu trúc đảo ngữ Band 8.0',
      prompt:
        'Hướng dẫn chi tiết cách dùng các cấu trúc Đảo ngữ (Inversion) và Mệnh đề phân từ (Participle Clauses) để tăng điểm Grammatical Range trong IELTS Writing 8.0.',
    },
    {
      title: 'Triển khai ý Speaking Part 3',
      prompt:
        'Cách kéo dài câu trả lời và phát triển lập luận trừu tượng trong IELTS Speaking Part 3 theo phương pháp PEEL (Point, Explain, Example, Link).',
    },
  ],
};

export const AIAssistant: React.FC<AIAssistantProps> = ({
  learningMode,
  targetScore,
  onModeChange,
  onNavigateWrite,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `Xin chào! Tôi là **Trợ lý AI chuyên sâu của EnglishHub**, được thiết lập bằng mô hình **Gemini 3.8 Flash**.

Tôi sẵn sàng hỗ trợ bạn theo mục tiêu **${
        learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'
      }** (${targetScore}):
- 🔍 **Giải thích cặn kẽ mọi lỗi ngữ pháp & từ vựng** (Tại sao sai ❌ → Cách sửa đúng ✅).
- ✨ **Nâng cấp câu văn** từ cơ bản lên chuẩn học thuật Band 8.0 hoặc công sở cao cấp.
- 💡 **Giải đáp bẫy đề thi**, cấu trúc bài viết và phương pháp làm bài đạt điểm tối đa.
- 💬 **Thực hành đàm thoại, phản xạ tiếng Anh** theo bất kỳ chủ đề nào bạn muốn!

Bạn có câu hỏi hoặc đoạn văn nào cần tôi phân tích ngay không?`,
      timestamp: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    setInputMessage('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        text: m.content,
      }));

      const reply = await askAIAssistant(text, learningMode, history);

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Không thể nhận phản hồi từ Gemini AI. Vui lòng kiểm tra kết nối mạng và thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Đã làm mới phiên trò chuyện. Hãy đặt bất kỳ câu hỏi hoặc dán câu tiếng Anh nào bạn muốn tôi giải thích theo chuẩn **${
          learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'
        }**!`,
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
    setErrorMessage(null);
  };

  const currentPrompts =
    learningMode === 'IELTS' ? QUICK_PROMPTS.IELTS : QUICK_PROMPTS.TOEIC;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6E1D6] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6E6A63]">
            <span className="flex items-center gap-1.5 text-[#5B3FD9]">
              <Sparkles className="w-3.5 h-3.5" />
              Gemini 3.8 Flash Engine
            </span>
            <span>•</span>
            <span>Trợ lý AI học tập & giải đáp chuyên sâu 24/7</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#18181B] mt-1">
            Gia sư AI Hỗ trợ Luyện {learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'}
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            Đặt câu hỏi, dán câu văn cần giải thích, yêu cầu bài tập mẫu hoặc nhờ AI phân tích mọi khúc mắc tiếng Anh của bạn.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="inline-flex rounded-lg border border-[#E6E1D6] p-0.5 bg-[#FAF8F5]">
            <button
              type="button"
              onClick={() => onModeChange('TOEIC')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                learningMode === 'TOEIC'
                  ? 'bg-[#1E40AF] text-white shadow-2xs'
                  : 'text-[#57534E] hover:text-[#18181B]'
              }`}
            >
              TOEIC 800+
            </button>
            <button
              type="button"
              onClick={() => onModeChange('IELTS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                learningMode === 'IELTS'
                  ? 'bg-[#5B3FD9] text-white shadow-2xs'
                  : 'text-[#57534E] hover:text-[#18181B]'
              }`}
            >
              IELTS 8.0
            </button>
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E6E1D6] bg-white hover:bg-[#F3EFEA] text-xs font-semibold text-[#57534E] transition cursor-pointer"
            title="Làm mới cuộc trò chuyện"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[#6E6A63] flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-[#5B3FD9]" />
          <span>Gợi ý chủ đề hỏi nhanh:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {currentPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(p.prompt)}
              className="text-left p-3 rounded-xl border border-[#E6E1D6] bg-white hover:border-[#18181B] hover:shadow-2xs transition cursor-pointer space-y-1"
            >
              <div className="text-xs font-bold text-[#18181B] flex items-center justify-between">
                <span>{p.title}</span>
                <ArrowRight className="w-3 h-3 text-[#6E6A63]" />
              </div>
              <p className="text-[11px] text-[#57534E] line-clamp-2">{p.prompt}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="bg-white border border-[#E6E1D6] rounded-xl shadow-xs overflow-hidden flex flex-col h-[600px]">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-[#18181B] text-white'
                      : learningMode === 'IELTS'
                      ? 'bg-[#5B3FD9] text-white'
                      : 'bg-[#1E40AF] text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#18181B] text-white rounded-tr-none'
                      : 'bg-[#FAF8F5] border border-[#E6E1D6] text-[#18181B] rounded-tl-none shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 pb-1 mb-1 border-b border-black/10 dark:border-white/10 text-[11px] opacity-70">
                    <span className="font-semibold">
                      {isUser
                        ? 'Bạn'
                        : `EnglishHub AI (${
                            learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'
                          })`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:opacity-100 transition cursor-pointer"
                          title="Sao chép câu trả lời"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-[#059669]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap font-sans text-sm">{msg.content}</div>

                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-[#E6E1D6] flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateWrite({
                            title: 'Luyện tập theo gợi ý từ AI',
                            content: '',
                            topicTag: 'AI Guided Writing',
                          })
                        }
                        className="text-xs font-semibold text-[#5B3FD9] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        ✍️ Mở khung Viết bài để thực hành ngay →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  learningMode === 'IELTS'
                    ? 'bg-[#5B3FD9] text-white'
                    : 'bg-[#1E40AF] text-white'
                }`}
              >
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-[#FAF8F5] border border-[#E6E1D6] rounded-2xl rounded-tl-none p-4 text-xs font-semibold text-[#57534E] flex items-center gap-2 shadow-2xs">
                <Sparkles className="w-4 h-4 animate-spin text-[#5B3FD9]" />
                <span>Gemini AI đang suy nghĩ và biên soạn phản hồi chi tiết...</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 md:p-4 border-t border-[#E6E1D6] bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Nhập câu hỏi ngữ pháp, dán câu tiếng Anh cần giải thích, hoặc yêu cầu từ vựng ${
                learningMode === 'IELTS' ? 'IELTS 8.0' : 'TOEIC 800+'
              }...`}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl border border-[#E6E1D6] bg-[#FAF8F5] text-sm text-[#18181B] focus:outline-none focus:border-[#18181B] transition"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className={`px-5 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2 transition cursor-pointer disabled:opacity-50 ${
                learningMode === 'IELTS'
                  ? 'bg-[#5B3FD9] hover:bg-[#4C32B8]'
                  : 'bg-[#1E40AF] hover:bg-[#1E3A8A]'
              }`}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Gửi</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
