import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center',
    }}>
      <h1 style={{ marginBottom: '2rem' }}>JA Chatbot</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        AI-powered chatbot with RAG capabilities built with Next.js and Supabase
      </p>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link 
          href="/chat"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#1976d2',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
          }}
        >
          Try Chat Interface
        </Link>
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'left' }}>
        <h2>Features</h2>
        <ul style={{ lineHeight: 1.6 }}>
          <li>🤖 Streaming AI responses with gpt-4o-mini</li>
          <li>🔍 RAG search with Supabase pgvector</li>
          <li>🛠️ Tool calling for knowledge base search</li>
          <li>🌐 Embeddable widget for any website</li>
          <li>🏢 Multi-tenant support</li>
          <li>⚡ Edge & Node.js runtime optimization</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Embed Widget</h3>
        <p>Add this to any website:</p>
        <code style={{ 
          display: 'block', 
          padding: '0.5rem', 
          backgroundColor: '#fff', 
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '0.875rem',
        }}>
          {`<script src="${process.env.NEXT_PUBLIC_BASE_URL}/ja-chatbot.js" defer></script>`}<br/>
          {`<ja-chatbot tenant="jose"></ja-chatbot>`}
        </code>
      </div>
    </div>
  )
}