'use client';

import { useEffect, useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [tenant] = useState<string>('jose');

  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  const chat = useChat<UIMessage>({
    id: sessionId || undefined,
    resume: true,
  });

  const [input, setInput] = useState('');

  const isReady = Boolean(sessionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    await chat.sendMessage(
      { text, metadata: { sessionId, tenant } },
      { body: { sessionId, tenant } }
    );
  };

  const renderTextParts = (parts: any[]) => {
    return parts
      .filter((p) => p.type === 'text')
      .map((p, i) => (
        <span key={`text-${i}`}>{p.text ?? ''}</span>
      ));
  };

  // Intentionally do not render tool parts to users.

  const renderReasoningParts = (parts: any[]) => {
    return parts
      .filter((p) => p.type === 'reasoning')
      .map((p, i) => (
        <div key={`reason-${i}`} style={{ padding: '0.5rem', backgroundColor: '#fffaf0', border: '1px dashed #f0d9a6', color: '#6a591f', borderRadius: '6px', marginTop: '0.5rem', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
          {p.text}
        </div>
      ));
  };

  const renderSourceParts = (parts: any[]) => {
    return parts
      .filter((p) => p.type === 'source-url' || p.type === 'source-document')
      .map((p, i) => (
        <div key={`src-${i}`} style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#555' }}>
          {p.type === 'source-url' ? (
            <span>Source: <a href={p.url} target="_blank" rel="noreferrer">{p.title || p.url}</a></span>
          ) : (
            <span>Source: {p.title}{p.filename ? ` (${p.filename})` : ''}</span>
          )}
        </div>
      ));
  };

  if (!isReady) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <p>Initializing chat session...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ marginBottom: '2rem' }}>AI Chat Assistant</h1>

      <div style={{ padding: '0.5rem 1rem', backgroundColor: '#f0f0f0', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
        Session ID: {sessionId}
      </div>

      {chat.error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', marginBottom: '1rem', color: '#c00' }}>
          Error: {chat.error.message}
        </div>
      )}

      <div style={{ minHeight: '400px', maxHeight: '600px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', backgroundColor: '#fafafa' }}>
        {chat.messages.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center' }}>No messages yet. Start a conversation!</p>
        ) : (
          chat.messages.map((message) => (
            <div key={message.id} style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', backgroundColor: message.role === 'user' ? '#e3f2fd' : '#fff', border: `1px solid ${message.role === 'user' ? '#90caf9' : '#ddd'}` }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: message.role === 'user' ? '#1976d2' : '#666', fontSize: '0.875rem' }}>
                {message.role === 'user' ? 'You' : 'AI Assistant'}
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {/* Render assistant text as Markdown with GFM */}
                {(() => {
                  const txt = (message.parts as any[])
                    .filter((p) => p.type === 'text')
                    .map((p) => p.text ?? '')
                    .join('');
                  return txt ? (
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{txt}</ReactMarkdown>
                    </div>
                  ) : null;
                })()}
                {renderReasoningParts(message.parts as any[])}
                {renderSourceParts(message.parts as any[])}
              </div>
            </div>
          ))
        )}

        {chat.status === 'submitted' || chat.status === 'streaming' ? (
          <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #ddd', color: '#666' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>AI is thinking</span>
              <span className="loading-dots">...</span>
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          disabled={chat.status === 'submitted' || chat.status === 'streaming'}
          style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' }}
        />
        <button
          type="submit"
          disabled={chat.status === 'submitted' || chat.status === 'streaming' || !input.trim()}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: chat.status === 'submitted' || chat.status === 'streaming' || !input.trim() ? '#ccc' : '#1976d2', color: '#fff', fontWeight: 'bold', cursor: chat.status === 'submitted' || chat.status === 'streaming' || !input.trim() ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
        >
          {chat.status === 'submitted' || chat.status === 'streaming' ? 'Sending...' : 'Send'}
        </button>
        {chat.status === 'streaming' && (
          <button
            type="button"
            onClick={() => chat.stop()}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', color: '#333', fontWeight: 'bold' }}
          >
            Stop
          </button>
        )}
      </form>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px', fontSize: '0.875rem', color: '#666' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Tips:</h3>
        <ul style={{ marginLeft: '1.5rem', lineHeight: 1.6 }}>
          <li>Ask me about anything from the knowledge base</li>
          <li>I can search for relevant documents to answer your questions</li>
          <li>Try asking about portfolio projects or CV information</li>
        </ul>
      </div>

      <style jsx>{`
        .loading-dots {
          animation: loading 1.4s infinite;
        }
        @keyframes loading {
          0%, 60%, 100% { opacity: 1; }
          30% { opacity: 0.4; }
        }
        .markdown-body :global(h1) { font-size: 1.6rem; margin: 1rem 0 0.5rem; }
        .markdown-body :global(h2) { font-size: 1.3rem; margin: 0.9rem 0 0.4rem; }
        .markdown-body :global(h3) { font-size: 1.1rem; margin: 0.8rem 0 0.3rem; }
        .markdown-body :global(p) { margin: 0.5rem 0; line-height: 1.6; }
        .markdown-body :global(ul), .markdown-body :global(ol) { margin: 0.5rem 0 0.5rem 1.25rem; }
        .markdown-body :global(li) { margin: 0.25rem 0; }
        .markdown-body :global(code) { background: #f6f8fa; padding: 0.15rem 0.35rem; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.95em; }
        .markdown-body :global(pre) { background: #0b0b0b; color: #e8e8e8; padding: 0.75rem; border-radius: 8px; overflow: auto; }
        .markdown-body :global(blockquote) { border-left: 4px solid #ddd; padding-left: 0.75rem; color: #555; margin: 0.5rem 0; }
        .markdown-body :global(a) { color: #1976d2; text-decoration: underline; }
      `}</style>
    </div>
  );
}
