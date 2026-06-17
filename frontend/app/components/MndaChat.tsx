"use client";

import { useState, useEffect, useRef } from "react";
import { MndaFormData } from "@/types/mnda";

interface Message {
  id: string;
  role: "ai" | "user";
  text: string;
}

interface Props {
  formData: MndaFormData;
  onFormDataChange: (data: MndaFormData) => void;
}

async function fetchChatReply(
  messages: { role: string; content: string }[],
  currentFields: MndaFormData
): Promise<{ reply: string; fields: MndaFormData }> {
  const res = await fetch("/api/chat/mnda", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, currentFields }),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function toApiMessages(msgs: Message[]) {
  return msgs.map((m) => ({
    role: m.role === "ai" ? "assistant" : "user",
    content: m.text,
  }));
}

export default function MndaChat({ formData, onFormDataChange }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mountedRef = useRef(false);

  // Scroll message list to bottom whenever messages or loading state changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Fire opening greeting on mount
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    setLoading(true);
    fetchChatReply([], formData)
      .then(({ reply, fields }) => {
        setMessages([{ id: crypto.randomUUID(), role: "ai", text: reply }]);
        onFormDataChange(fields);
      })
      .catch(() => {
        setMessages([
          {
            id: crypto.randomUUID(),
            role: "ai",
            text: "Hello! I'm here to help you draft a Mutual NDA. What's the purpose of this agreement?",
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async (userText: string) => {
    if (loading || !userText.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: userText.trim(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const response = await fetchChatReply(toApiMessages(nextMessages), formData);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", text: response.reply },
      ]);
      onFormDataChange(response.fields);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    const text = inputValue;
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              msg.role === "ai"
                ? "mr-auto bg-white border border-brand-blue/20 text-gray-800 shadow-sm"
                : "ml-auto bg-brand-navy text-white"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="mr-auto bg-white border border-brand-blue/20 rounded-lg px-3 py-2 shadow-sm">
            <div className="flex gap-1 items-center h-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex-none border-t border-gray-200 bg-white px-4 py-3 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={loading}
          className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent max-h-32 overflow-y-auto disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={loading || !inputValue.trim()}
          className="flex-none bg-brand-purple text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
