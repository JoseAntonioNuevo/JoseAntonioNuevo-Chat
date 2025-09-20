"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string>("");
  const [tenant] = useState<string>("jose");

  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  const chat = useChat<UIMessage>({
    id: sessionId || undefined,
    resume: true,
  });

  const [input, setInput] = useState("");

  const isReady = Boolean(sessionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    await chat.sendMessage(
      { text, metadata: { sessionId, tenant } },
      { body: { sessionId, tenant } }
    );
  };

  // Intentionally do not render tool parts to users.
  type BasePart = { type: string } & Record<string, unknown>;
  type ReasoningUIPart = { type: "reasoning"; text: string };
  type SourceUrlUIPart = { type: "source-url"; url: string; title?: string };
  type SourceDocumentUIPart = { type: "source-document"; title: string; filename?: string };

  const isReasoning = (p: BasePart): p is ReasoningUIPart => p.type === "reasoning" && typeof (p as { text?: unknown }).text === "string";
  const isSourceUrl = (p: BasePart): p is SourceUrlUIPart => p.type === "source-url" && typeof (p as { url?: unknown }).url === "string";
  const isSourceDoc = (p: BasePart): p is SourceDocumentUIPart => p.type === "source-document" && typeof (p as { title?: unknown }).title === "string";

  const renderReasoningParts = (parts: BasePart[]) => {
    return parts
      .filter(isReasoning)
      .map((p, i) => (
        <div
          key={`reason-${i}`}
          className="p-2 bg-[#fffaf0] border border-dashed border-[#f0d9a6] text-[#6a591f] rounded-md mt-2 text-sm whitespace-pre-wrap"
        >
          {p.text}
        </div>
      ));
  };

  const renderSourceParts = (parts: BasePart[]) => {
    return parts
      .filter((p) => isSourceUrl(p) || isSourceDoc(p))
      .map((p, i) => (
        <div
          key={`src-${i}`}
          className="mt-2 text-[0.85rem] text-gray-600"
        >
          {isSourceUrl(p) ? (
            <span>
              Source:{" "}
              <a href={p.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                {p.title || p.url}
              </a>
            </span>
          ) : (
            <span>
              Source: {p.title}
              {isSourceDoc(p) && p.filename ? ` (${p.filename})` : ""}
            </span>
          )}
        </div>
      ));
  };

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight });
    }
  }, [chat.messages, chat.status]);

  if (!isReady) {
    return (
      <div className="flex justify-center items-center min-h-screen font-sans">
        <p>Initializing chat session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto p-5 font-sans">
      <div className="chat-header text-center mb-8 p-4">
        <h1 className="text-[2rem] font-bold mb-2 bg-gradient-to-br from-primary-dark to-primary bg-clip-text text-transparent">
          José Antonio Nuevo Chatbot
        </h1>
        <p className="text-lg text-text-secondary m-0 opacity-90">
          Ask me anything about me or my work!
        </p>
      </div>

      {chat.error && (
        <div className="py-3 px-4 bg-[#431f3f] border border-[#773466] rounded-[10px] mb-4 text-[#ffd1dc]">
          Error: {chat.error.message}
        </div>
      )}
      <div
        ref={listRef}
        className="min-h-[60vh] max-h-[70vh] overflow-y-auto border border-border-primary rounded-[14px] p-4 mb-4 bg-gradient-to-b from-bg-card to-[rgba(26,21,50,.75)] backdrop-blur-md"
      >
        {chat.messages.length === 0 ? (
          <p className="text-text-secondary text-center">
            Start a conversation…
          </p>
        ) : (
          chat.messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-[0.85rem] gap-[0.6rem] ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] py-3 px-[0.9rem] ${
                  message.role === "user"
                    ? "rounded-[14px_14px_4px_14px] bg-gradient-to-br from-primary-dark to-primary border border-primary text-text-primary shadow-[0_6px_18px_rgba(124,58,237,0.25)]"
                    : "rounded-[14px_14px_14px_4px] bg-bg-card-dark border border-border-primary text-text-primary shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {/* Render assistant/user text as Markdown */}
                  {(() => {
                    type TextUIPart = { type: "text"; text?: string };
                    const parts = (message.parts as unknown as BasePart[]) || [];
                    const txt = parts
                      .filter((p): p is TextUIPart => p.type === "text")
                      .map((p) => p.text ?? "")
                      .join("");
                    return txt ? (
                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {txt}
                        </ReactMarkdown>
                      </div>
                    ) : null;
                  })()}
                  {/* Optional reasoning/sources for assistant */}
                  {message.role !== "user" &&
                    renderReasoningParts((message.parts as unknown as BasePart[]) || [])}
                  {message.role !== "user" &&
                    renderSourceParts((message.parts as unknown as BasePart[]) || [])}
                </div>
              </div>
            </div>
          ))
        )}

        {chat.status === "submitted" || chat.status === "streaming" ? (
          <div className="flex justify-center pt-1">
            <div className="pulse w-9 h-[10px] rounded-lg bg-gradient-to-r from-primary-dark to-primary animate-pulse" />
          </div>
        ) : null}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex gap-[0.6rem] items-center bg-[rgba(18,10,35,0.6)] border border-border-primary p-[0.6rem] rounded-[14px] backdrop-blur-md"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          disabled={chat.status === "submitted" || chat.status === "streaming"}
          className="flex-1 py-[0.85rem] px-4 rounded-[12px] border border-border-light bg-bg-input text-text-primary text-base outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={
            chat.status === "submitted" ||
            chat.status === "streaming" ||
            !input.trim()
          }
          className={`py-[0.85rem] px-5 rounded-[12px] border font-bold text-[0.95rem] text-white cursor-pointer transition-all ${
            chat.status === "submitted" ||
            chat.status === "streaming" ||
            !input.trim()
              ? "bg-border-light border-border-light cursor-not-allowed"
              : "bg-gradient-to-br from-primary-dark to-primary border-primary shadow-[0_6px_18px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_20px_rgba(124,58,237,0.45)]"
          }`}
        >
          {chat.status === "submitted" || chat.status === "streaming"
            ? "Sending..."
            : "Send"}
        </button>
        {chat.status === "streaming" && (
          <button
            type="button"
            onClick={() => chat.stop()}
            className="py-[0.85rem] px-[1.1rem] rounded-[12px] border border-border-light bg-bg-input text-text-primary font-bold"
          >
            Stop
          </button>
        )}
      </form>
      <style jsx>{`
        .pulse {
          filter: drop-shadow(0 0 14px rgba(124, 58, 237, 0.6));
          animation: pulse 1.3s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            transform: scaleX(0.85);
            opacity: 0.9;
          }
          50% {
            transform: scaleX(1);
            opacity: 1;
          }
        }
        .markdown-body {
          line-height: 1.5;
        }
        .markdown-body :global(h1) {
          font-size: 1.6rem;
          margin: 0.75rem 0 0.4rem;
        }
        .markdown-body :global(h2) {
          font-size: 1.3rem;
          margin: 0.6rem 0 0.35rem;
        }
        .markdown-body :global(h3) {
          font-size: 1.1rem;
          margin: 0.5rem 0 0.3rem;
        }
        .markdown-body :global(p) {
          margin: 0.3rem 0;
        }
        .markdown-body :global(ul),
        .markdown-body :global(ol) {
          margin: 0.2rem 0;
          padding-left: 1rem;
        }
        .markdown-body :global(li) {
          margin: 0.1rem 0;
        }
        .markdown-body :global(li > p) {
          margin: 0.15rem 0;
        }
        .markdown-body :global(li + li) {
          margin-top: 0.15rem;
        }
        .markdown-body :global(> ul:first-child),
        .markdown-body :global(> ol:first-child) {
          margin-top: 0;
        }
        .markdown-body :global(> ul:last-child),
        .markdown-body :global(> ol:last-child) {
          margin-bottom: 0;
        }
        .markdown-body :global(code) {
          background: #f6f8fa;
          padding: 0.15rem 0.35rem;
          border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.95em;
        }
        .markdown-body :global(pre) {
          background: #0b0b0b;
          color: #e8e8e8;
          padding: 0.6rem;
          border-radius: 8px;
          overflow: auto;
          margin: 0.5rem 0;
        }
        .markdown-body :global(blockquote) {
          border-left: 4px solid #ddd;
          padding-left: 0.6rem;
          color: #555;
          margin: 0.35rem 0;
        }
        .markdown-body :global(a) {
          color: #1976d2;
          text-decoration: underline;
        }
        .markdown-body :global(> :first-child) {
          margin-top: 0;
        }
        .markdown-body :global(> :last-child) {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}