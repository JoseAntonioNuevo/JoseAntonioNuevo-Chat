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
          style={{
            padding: "0.5rem",
            backgroundColor: "#fffaf0",
            border: "1px dashed #f0d9a6",
            color: "#6a591f",
            borderRadius: "6px",
            marginTop: "0.5rem",
            fontSize: "0.9rem",
            whiteSpace: "pre-wrap",
          }}
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
          style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#555" }}
        >
          {isSourceUrl(p) ? (
            <span>
              Source:{" "}
              <a href={p.url} target="_blank" rel="noreferrer">
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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <p>Initializing chat session...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "1.25rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div className="chat-header">
        <h1>José Antonio Nuevo Chatbot</h1>
        <p>Ask me anything about me or my work!</p>
      </div>

      {chat.error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "#431f3f",
            border: "1px solid #773466",
            borderRadius: "10px",
            marginBottom: "1rem",
            color: "#ffd1dc",
          }}
        >
          Error: {chat.error.message}
        </div>
      )}
      <div
        ref={listRef}
        style={{
          minHeight: "60vh",
          maxHeight: "70vh",
          overflowY: "auto",
          border: "1px solid #2a2352",
          borderRadius: "14px",
          padding: "1rem",
          marginBottom: "1rem",
          background:
            "linear-gradient(180deg, rgba(30,24,60,.75), rgba(26,21,50,.75))",
          backdropFilter: "blur(6px)",
        }}
      >
        {chat.messages.length === 0 ? (
          <p style={{ color: "#b8aef0", textAlign: "center" }}>
            Start a conversation…
          </p>
        ) : (
          chat.messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: "flex",
                marginBottom: "0.85rem",
                gap: "0.6rem",
                justifyContent:
                  message.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "0.75rem 0.9rem",
                  borderRadius:
                    message.role === "user"
                      ? "14px 14px 4px 14px"
                      : "14px 14px 14px 4px",
                  background:
                    message.role === "user"
                      ? "linear-gradient(135deg, #6d28d9, #7c3aed)"
                      : "#1f1940",
                  border:
                    message.role === "user"
                      ? "1px solid #7c3aed"
                      : "1px solid #2a2352",
                  color: "#eae6ff",
                  boxShadow:
                    message.role === "user"
                      ? "0 6px 18px rgba(124, 58, 237, 0.25)"
                      : "0 6px 18px rgba(0, 0, 0, 0.25)",
                }}
              >
                <div style={{ whiteSpace: "pre-wrap" }}>
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: "0.25rem",
            }}
          >
            <div className="pulse" />
          </div>
        ) : null}
      </div>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: "0.6rem",
          alignItems: "center",
          background: "rgba(18, 10, 35, 0.6)",
          border: "1px solid #2a2352",
          padding: "0.6rem",
          borderRadius: "14px",
          backdropFilter: "blur(6px)",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          disabled={chat.status === "submitted" || chat.status === "streaming"}
          style={{
            flex: 1,
            padding: "0.85rem 1rem",
            borderRadius: "12px",
            border: "1px solid #3a2e6e",
            background: "#1a1433",
            color: "#e6e1ff",
            fontSize: "1rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={
            chat.status === "submitted" ||
            chat.status === "streaming" ||
            !input.trim()
          }
          style={{
            padding: "0.85rem 1.25rem",
            borderRadius: "12px",
            border: "1px solid #7c3aed",
            background:
              chat.status === "submitted" ||
              chat.status === "streaming" ||
              !input.trim()
                ? "#3a2e6e"
                : "linear-gradient(135deg, #6d28d9, #7c3aed)",
            color: "#fff",
            fontWeight: 700,
            cursor:
              chat.status === "submitted" ||
              chat.status === "streaming" ||
              !input.trim()
                ? "not-allowed"
                : "pointer",
            fontSize: "0.95rem",
            boxShadow:
              chat.status === "submitted" ||
              chat.status === "streaming" ||
              !input.trim()
                ? "none"
                : "0 6px 18px rgba(124, 58, 237, 0.35)",
          }}
        >
          {chat.status === "submitted" || chat.status === "streaming"
            ? "Sending..."
            : "Send"}
        </button>
        {chat.status === "streaming" && (
          <button
            type="button"
            onClick={() => chat.stop()}
            style={{
              padding: "0.85rem 1.1rem",
              borderRadius: "12px",
              border: "1px solid #3a2e6e",
              backgroundColor: "#1a1433",
              color: "#e6e1ff",
              fontWeight: 700,
            }}
          >
            Stop
          </button>
        )}
      </form>
      <style jsx>{`
        .chat-header {
          text-align: center;
          margin-bottom: 2rem;
          padding: 1rem;
        }
        .chat-header h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          background: linear-gradient(135deg, #6d28d9, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .chat-header p {
          font-size: 1.1rem;
          color: #b8aef0;
          margin: 0;
          opacity: 0.9;
        }
        .pulse {
          width: 36px;
          height: 10px;
          border-radius: 8px;
          background: linear-gradient(90deg, #6d28d9, #7c3aed);
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
        /* Tighten list spacing */
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
