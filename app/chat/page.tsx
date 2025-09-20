'use client';

import { useEffect, useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage, UIMessagePart } from 'ai';

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
        <span key={i}>{'text' in p ? p.text : ''}</span>
      ));
  };

  const renderToolParts = (parts: any[]) => {
    return parts
      .filter((p) => p.type === 'dynamic-tool' || p.type.startsWith('tool-'))
      .map((p, i) => {
        if (p.type === 'dynamic-tool') {
          return (
            <div key={`tool-${i}`} style={{ padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              <strong>🔧 {p.toolName}</strong>
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>state: {p.state}</div>
              {'input' in p && p.input !== undefined && (
                <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', overflow: 'auto' }}>{JSON.stringify(p.input, null, 2)}</pre>
              )}
              {'output' in p && p.output !== undefined && (
                <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', overflow: 'auto' }}>{JSON.stringify(p.output, null, 2)}</pre>
              )}
              {'errorText' in p && p.errorText && (
                <div style={{ color: '#c00', marginTop: '0.5rem' }}>{p.errorText}</div>
              )}
            </div>
          );
        }
        // typed tool part, p.type = `tool-${name}`
        const typed: any = p as any;
        return (
          <div key={`tool-${i}`} style={{ padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            <strong>🔧 {typed.type.replace('tool-', '')}</strong>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>state: {typed.state}</div>
            {typed.input !== undefined && (
              <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', overflow: 'auto' }}>{JSON.stringify(typed.input, null, 2)}</pre>
            )}
            {typed.output !== undefined && (
              <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', overflow: 'auto' }}>{JSON.stringify(typed.output, null, 2)}</pre>
            )}
            {typed.errorText && (
              <div style={{ color: '#c00', marginTop: '0.5rem' }}>{typed.errorText}</div>
            )}
          </div>
        );
      });
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
                {renderTextParts(message.parts as any[])}
                {renderToolParts(message.parts as any[])}
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
      `}</style>
    </div>
  );
}
