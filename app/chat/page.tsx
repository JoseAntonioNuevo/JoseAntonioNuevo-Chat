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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
              Personal AI
            </span>
          </div>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">
                José Antonio Assistant
              </h1>
              <p className="text-sm text-green-500">● Online</p>
            </div>
          </div>
          <p className="text-lg text-slate-600 dark:text-gray-300 max-w-2xl mx-auto">
            Ask me anything about José Antonio's experience, skills, and projects!
          </p>
        </div>

        {chat.error && (
          <div className="py-3 px-4 bg-red-100 border border-red-300 rounded-xl mb-4 text-red-800">
            Error: {chat.error.message}
          </div>
        )}

        {/* Chat Messages Container */}
        <div className="relative rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800 flex-1 flex flex-col mb-6">
          <div
            ref={listRef}
            className="flex-1 min-h-0 overflow-y-auto space-y-4"
          >
            {chat.messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2 dark:bg-gray-700">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-gray-300">
                  What would you like to know about José Antonio?
                </p>
              </div>
            ) : (
              chat.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "max-w-xs rounded-br-md bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                        : "max-w-[85%] rounded-bl-md bg-slate-100 text-slate-800 dark:bg-gray-700 dark:text-gray-200"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
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
              <div className="flex justify-start mt-4">
                <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2 dark:bg-gray-700">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="flex gap-3 items-center bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 p-4 rounded-2xl shadow-lg"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about José Antonio's experience, skills, or projects..."
            disabled={chat.status === "submitted" || chat.status === "streaming"}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-gray-100 text-base outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={
              chat.status === "submitted" ||
              chat.status === "streaming" ||
              !input.trim()
            }
            className={`py-3 px-6 rounded-xl font-semibold text-white transition-all transform ${
              chat.status === "submitted" ||
              chat.status === "streaming" ||
              !input.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl"
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
              className="py-3 px-4 rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 font-semibold hover:bg-slate-200 dark:hover:bg-gray-600 transition-all"
            >
              Stop
            </button>
          )}
        </form>

        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 h-24 w-24 animate-pulse rounded-full bg-gradient-to-r from-pink-400 to-purple-500 opacity-20 pointer-events-none"></div>
        <div
          className="absolute -bottom-6 -left-6 h-32 w-32 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 opacity-20 pointer-events-none"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      <style jsx>{`
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