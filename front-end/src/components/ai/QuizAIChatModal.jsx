import React, { useState, useEffect, useRef } from "react";
import { aiChatService } from "../../services/aiChatService";

function FormattedMessage({ text }) {
  if (!text) return null;

  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-slate-800 break-words">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // Header ###
        if (trimmed.startsWith("###")) {
          return (
            <h4 key={idx} className="font-bold text-slate-900 text-sm mt-2 mb-1 flex items-center gap-1.5">
              {trimmed.replace(/^###\s*/, "")}
            </h4>
          );
        }
        if (trimmed.startsWith("##")) {
          return (
            <h3 key={idx} className="font-bold text-slate-900 text-base mt-2 mb-1">
              {trimmed.replace(/^##\s*/, "")}
            </h3>
          );
        }

        // Blockquote >
        if (trimmed.startsWith(">")) {
          return (
            <blockquote key={idx} className="pl-3 border-l-2 border-indigo-400 bg-indigo-50/60 py-1 px-2 rounded text-slate-700 italic text-xs">
              {trimmed.replace(/^>\s*/, "")}
            </blockquote>
          );
        }

        // Bullet point - or *
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>{renderInlineBold(content)}</span>
            </div>
          );
        }

        return <p key={idx}>{renderInlineBold(line)}</p>;
      })}
    </div>
  );
}

function renderInlineBold(str) {
  if (!str) return "";
  const parts = str.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function QuizAIChatModal({
  isOpen,
  onClose,
  question,
  selectedAnswerTitle,
  lessonId,
  courseId,
  resultId,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Khi modal mở, tự động gọi AI phân tích câu hỏi ban đầu
  useEffect(() => {
    if (!isOpen || !question) return;

    const optionsList = (question.options || []).map((o, idx) => {
      const label = o.label || String.fromCharCode(65 + idx);
      return `${label}. ${o.title || o.content || ""}`;
    });

    const initialFetch = async () => {
      setLoading(true);
      setMessages([]);

      try {
        const response = await aiChatService.chatQuiz({
          questionText: question.content || "",
          options: optionsList,
          selectedOption: selectedAnswerTitle || "Chưa chọn đáp án",
          lessonId,
          courseId,
          questionId: question.questionId,
          resultId,
          userQuery:
            "Hãy phân tích chi tiết câu hỏi trắc nghiệm này dựa trên bài giảng PDF và giải thích vì sao đáp án đúng.",
        });

        const initialReply = {
          role: "assistant",
          content: response?.reply || "Đã phân tích câu hỏi dựa trên tài liệu bài học.",
          citations: response?.citations || [],
        };
        setMessages([initialReply]);
      } catch (err) {
        console.error("Lỗi phân tích câu hỏi bằng AI:", err);
        setMessages([
          {
            role: "assistant",
            content: "⚠️ Không thể kết nối tới EduSmart AI để phân tích câu này. Vui lòng thử lại sau.",
            citations: [],
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    initialFetch();
  }, [isOpen, question?.questionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!isOpen || !question) return null;

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const optionsList = (question.options || []).map((o, idx) => {
      const label = o.label || String.fromCharCode(65 + idx);
      return `${label}. ${o.title || o.content || ""}`;
    });

    try {
      const response = await aiChatService.chatQuiz({
        questionText: question.content || "",
        options: optionsList,
        selectedOption: selectedAnswerTitle || null,
        lessonId,
        courseId,
        questionId: question.questionId,
        resultId,
        userQuery: text,
      });

      const aiMsg = {
        role: "assistant",
        content: response?.reply || "Không tìm thấy thông tin bổ sung cho thắc mắc này.",
        citations: response?.citations || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Lỗi trao đổi AI về câu hỏi:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Gặp lỗi khi gửi câu hỏi. Vui lòng thử lại.",
          citations: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full flex flex-col max-h-[85vh] shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>Trợ lý AI Giải đáp câu hỏi trắc nghiệm</span>
              </h3>
              <p className="text-xs text-blue-100 font-medium">Đối chiếu và suy luận dựa trên tài liệu bài giảng PDF</p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Question Header Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase mb-1">
            <span className="material-symbols-outlined text-[15px]">help_outline</span>
            <span>Nội dung câu hỏi:</span>
          </div>
          <p className="text-sm font-semibold text-slate-800 line-clamp-3">{question.content}</p>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl p-4 shadow-2xs ${
                    isUser
                      ? "bg-blue-600 text-white rounded-tr-xs"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                  }`}
                >
                  {isUser ? (
                    <p className="text-sm font-medium whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div>
                      <FormattedMessage text={m.content} />

                      {m.citations && m.citations.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">description</span>
                            Căn cứ PDF:
                          </span>
                          {m.citations.map((c, cIdx) => (
                            <span
                              key={cIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium text-[11px] border border-indigo-100"
                              title={`Tài liệu: ${c.source} - Trang ${c.page}`}
                            >
                              <span>Trang {c.page}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-2">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 shadow-2xs flex items-center gap-2.5 text-slate-600 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs text-slate-600 font-medium ml-1">AI đang đối chiếu lý thuyết PDF và suy luận giải thích...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {!loading && (
          <div className="px-4 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-1.5">
            {[
              "Vì sao đáp án này đúng?",
              "Tại sao lựa chọn của em sai?",
              "Lưu ý ngắn về câu này",
            ].map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(s)}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-medium transition-colors cursor-pointer border border-slate-200/60"
              >
                💡 {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={loading}
            placeholder="Hỏi thêm AI về câu hỏi này..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-60"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            <span>Gửi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
