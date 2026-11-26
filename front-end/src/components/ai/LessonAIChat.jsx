import React, { useState, useRef, useEffect } from "react";
import { aiChatService } from "../../services/aiChatService";

const SUGGESTIONS = [
  "Tóm tắt kiến thức cốt lõi bài học này",
  "Giải thích các thuật ngữ và khái niệm khó",
  "Cho tôi ví dụ thực hành và code minh họa",
  "Những lỗi phổ biến học sinh hay mắc phải",
];

// Helper hiển thị định dạng văn bản Markdown cơ bản
function FormattedMessage({ text }) {
  if (!text) return null;

  // Tách theo dòng để format
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
            <blockquote key={idx} className="pl-3 border-l-2 border-blue-400 bg-blue-50/60 py-1 px-2 rounded text-slate-700 italic text-xs">
              {trimmed.replace(/^>\s*/, "")}
            </blockquote>
          );
        }

        // Bullet point - or *
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-2">
              <span className="text-blue-500 font-bold">•</span>
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

export default function LessonAIChat({ lessonId, courseId, lessonTitle }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Khởi tạo và tải lịch sử chat từ MongoDB
  useEffect(() => {
    let isMounted = true;
    const greeting = {
      role: "assistant",
      content: `Xin chào! Tôi là **Trợ lý AI EduSmart** của bài học *${
        lessonTitle || "này"
      }*.\n\nTôi có thể giúp bạn giải đáp thắc mắc, phân tích tài liệu bài giảng PDF của giáo viên và đưa ra ví dụ minh họa trực quan. Hãy đặt câu hỏi bất kỳ nhé!`,
      citations: [],
    };

    if (!lessonId) {
      setMessages([greeting]);
      return;
    }

    aiChatService
      .getLessonHistory(lessonId)
      .then((history) => {
        if (!isMounted) return;
        if (Array.isArray(history) && history.length > 0) {
          const loadedMessages = history
            .filter((h) => {
              const text = h.messageContent || "";
              // Loại trừ hoàn toàn các tin nhắn giải thích Quiz nếu có lẫn vào
              return (
                !text.includes("Giải thích ngắn gọn 2-3 câu vì sao đáp án đúng") &&
                !text.includes("không dùng các ký tự markdown như") &&
                text !== "Kiểm tra giúp phát hiện và sửa lỗi." &&
                text !== "Đây là kiến thức nền tảng được trình bày trong chương."
              );
            })
            .map((h) => ({
              role:
                (h.messageRole || "").toLowerCase() === "user"
                  ? "user"
                  : "assistant",
              content: h.messageContent || "",
              citations: [],
              createdAt: h.createdAt,
            }));
          setMessages([greeting, ...loadedMessages]);
        } else {
          setMessages([greeting]);
        }
      })
      .catch(() => {
        if (isMounted) setMessages([greeting]);
      });

    return () => {
      isMounted = false;
    };
  }, [lessonId, lessonTitle]);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Lọc lịch sử hội thoại gửi lên backend
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await aiChatService.chatLesson({
        message: text,
        lessonId,
        courseId,
        history,
      });

      const aiMsg = {
        role: "assistant",
        content: response?.reply || "Xin lỗi, hiện tại tôi chưa tìm được câu trả lời phù hợp trong tài liệu bài học này.",
        citations: response?.citations || [],
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Lỗi hỏi AI trong bài học:", err);
      const errorMsg = {
        role: "assistant",
        content: "⚠️ Đã có lỗi khi kết nối tới dịch vụ AI. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau giây lát.",
        citations: [],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = async () => {
    if (lessonId) {
      await aiChatService.clearLessonHistory(lessonId);
    }
    setMessages([
      {
        role: "assistant",
        content: `Cuộc trò chuyện đã được làm mới. Hãy hỏi tôi bất kỳ điều gì về bài học *${
          lessonTitle || ""
        }*!`,
        citations: [],
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[520px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
              <span>EduSmart AI Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">Hỏi đáp bám sát PDF bài học</span>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          title="Xóa đoạn chat làm mới"
          type="button"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 shadow-2xs ${
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

                    {/* Citations / Tham khảo PDF */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">description</span>
                          Căn cứ PDF:
                        </span>
                        {m.citations.map((c, cIdx) => (
                          <span
                            key={cIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium text-[11px] border border-blue-100"
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

        {/* Loading Bubble */}
        {loading && (
          <div className="flex items-start gap-2">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-2xs flex items-center gap-2 text-slate-500 text-sm">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-xs text-slate-600 font-medium ml-1">AI đang đối chiếu PDF bài học...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 3 && !loading && (
        <div className="px-4 pb-2 pt-1 flex flex-wrap gap-1.5 bg-white border-t border-slate-100">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium transition-colors cursor-pointer border border-slate-200/60"
            >
              💡 {s}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
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
          placeholder="Đặt câu hỏi cho AI về bài học này..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-60"
        />

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </div>
    </div>
  );
}
