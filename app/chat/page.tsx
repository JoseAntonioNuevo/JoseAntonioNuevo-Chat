'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure we're on the client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    setSessionId(crypto.randomUUID());
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          tenant: 'jose',
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        
        // Update the assistant message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: assistantContent }
              : msg
          )
        );
      }

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Don't render until client-side hydration is complete
  if (!isClient || !sessionId) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <p>Initializing chat session...</p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <h1 style={{ marginBottom: '2rem' }}>AI Chat Assistant</h1>
      
      {/* Session info */}
      <div style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        marginBottom: '1rem',
        fontSize: '0.875rem',
        color: '#666',
      }}>
        Session ID: {sessionId}
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          marginBottom: '1rem',
          color: '#c00',
        }}>
          Error: {error}
        </div>
      )}

      {/* Messages display */}
      <div style={{
        minHeight: '400px',
        maxHeight: '600px',
        overflowY: 'auto',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem',
        backgroundColor: '#fafafa',
      }}>
        {messages.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center' }}>
            No messages yet. Start a conversation!
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                borderRadius: '8px',
                backgroundColor: message.role === 'user' ? '#e3f2fd' : '#fff',
                border: `1px solid ${message.role === 'user' ? '#90caf9' : '#ddd'}`,
              }}
            >
              <div style={{
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: message.role === 'user' ? '#1976d2' : '#666',
                fontSize: '0.875rem',
              }}>
                {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'AI Assistant' : 'Tool'}
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
                {message.toolInvocations?.map((tool, index) => (
                  <div key={index} style={{ 
                    padding: '0.5rem', 
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    marginTop: '0.5rem',
                    fontSize: '0.875rem',
                  }}>
                    <strong>🔧 {tool.toolName}</strong>
                    {tool.state === 'result' && (
                      <pre style={{ 
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        overflow: 'auto',
                      }}>
                        {JSON.stringify(tool.result, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div style={{
            padding: '0.75rem',
            borderRadius: '8px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            color: '#666',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>AI is thinking</span>
              <span className="loading-dots">...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '1rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isLoading || !input.trim() ? '#ccc' : '#1976d2',
            color: '#fff',
            fontWeight: 'bold',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
          }}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>

      {/* Instructions */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#666',
      }}>
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
