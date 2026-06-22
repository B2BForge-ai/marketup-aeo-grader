"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  companyName: string;
  industry: string;
  report: Record<string, unknown>;
}

async function consumeSSEStream(
  response: Response,
  onDelta: (text: string) => void
) {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;

      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) onDelta(delta);
      } catch {
        /* skip malformed chunks */
      }
    }
  }
}

export default function ChatPanel({
  companyName,
  industry,
  report,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendText(text: string) {
    if (!text.trim() || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);
    setMessages([...nextMessages, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          companyName,
          industry,
          report,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "发送失败");
      }

      await consumeSSEStream(res, (delta) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + delta,
            };
          }
          return updated;
        });
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant" && !last.content) {
          updated[updated.length - 1] = {
            role: "assistant",
            content: `抱歉，暂时无法回答：${err instanceof Error ? err.message : "未知错误"}`,
          };
        }
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    sendText(input);
  }

  const suggestions = [
    "为什么我的评分偏低？",
    "哪个关键词最需要优先优化？",
    "如何提升官网被 AI 引用的概率？",
  ];

  return (
    <section>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#111] flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#E8321A]" />
          继续追问 AI 顾问
        </h3>
        <p className="text-sm text-[#666] mt-1.5">
          已读取您的完整诊断报告，可针对评分、关键词和优化方案进一步提问。
        </p>
      </div>
      <div className="bg-[#F9F9F9] border border-[#EFEFEF] rounded-xl p-4">
        <div className="max-h-44 overflow-y-auto mb-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center py-4">
              <MessageCircle className="w-6 h-6 text-[#CCC] mb-2" />
              <p className="text-sm text-[#666] text-center">
                点击下方快捷问题，或直接输入您的疑问
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendText(s)}
                    className="border border-[#E8E8E8] rounded-full px-3 py-1.5 text-[13px] text-[#555] bg-white hover:border-[#E8321A] hover:text-[#E8321A] hover:bg-[#FFF5F4] transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#E8321A] text-white rounded-[10px_10px_2px_10px]"
                        : "bg-white border border-[#EFEFEF] text-[#444] rounded-[10px_10px_10px_2px]"
                    }`}
                  >
                    {msg.content || (
                      <Loader2 className="w-4 h-4 animate-spin text-[#E8321A]" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例如：首页标题应该怎么改？"
            disabled={streaming}
            className="flex-1 bg-white border border-[#E8E8E8] rounded-lg px-3.5 py-2.5 text-sm text-[#111] outline-none focus:border-[#E8321A] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="bg-[#E8321A] hover:bg-[#C82A14] disabled:opacity-40 border-none rounded-lg w-10 h-10 flex items-center justify-center text-white transition shrink-0"
            aria-label="发送"
          >
            {streaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
