"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  role: "ai" | "user";
  text: string;
}

interface Props {
  docType: string | null;
  fields: Record<string, string>;
  onDocTypeChange: (docType: string | null) => void;
  onFieldsChange: (fields: Record<string, string>) => void;
}

async function fetchChatReply(
  messages: { role: string; content: string }[],
  currentDocType: string | null,
  currentFields: Record<string, string>
): Promise<{ reply: string; docType: string | null; fields: Record<string, string> }> {
  const res = await fetch("/api/chat/doc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, currentDocType, currentFields }),
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

export default function DocumentChat({
  docType,
  fields,
  onDocTypeChange,
  onFieldsChange,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mountedRef = useRef(false);

  // Scroll to bottom on new messages or loading state change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Re-focus textarea when AI finishes responding (not on initial mount)
  useEffect(() => {
    if (!loading && mountedRef.current) {
      textareaRef.current?.focus();
    }
  }, [loading]);

  // Opening greeting on mount
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    setLoading(true);
    fetchChatReply([], null, {})
      .then(({ reply, docType: dt, fields: f }) => {
        setMessages([{ id: crypto.randomUUID(), role: "ai", text: reply }]);
        if (dt) { onDocTypeChange(dt); onFieldsChange(f); }
      })
      .catch(() => {
        setMessages([{
          id: crypto.randomUUID(),
          role: "ai",
          text: "Hello! I can help you create a legal document. What kind of document do you need today?",
        }]);
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
      const response = await fetchChatReply(
        toApiMessages(nextMessages),
        docType,
        fields
      );
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", text: response.reply },
      ]);
      if (response.docType !== docType && (response.docType !== null || docType !== null)) {
        onDocTypeChange(response.docType);
      }
      if (response.fields && Object.keys(response.fields).length > 0) {
        onFieldsChange(response.fields);
      }
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
    if (textareaRef.current) textareaRef.current.style.height = "auto";
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
