"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-[900px] mx-auto p-8 font-sans min-h-screen flex flex-col justify-center">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-[3.5rem] font-bold mb-4 bg-gradient-to-br from-primary-dark to-primary bg-clip-text text-transparent leading-tight">
          José Antonio Nuevo
        </h1>
        <h2 className="text-2xl font-normal mb-6 text-text-secondary opacity-90">
          AI-Powered Professional Assistant
        </h2>
        <p className="text-lg text-text-primary mb-10 max-w-[600px] mx-auto leading-relaxed opacity-80">
          Discover my professional journey through an interactive AI chatbot with advanced RAG capabilities. 
          Ask about my experience, skills, projects, and expertise.
        </p>

        <Link
          href="/chat"
          className="inline-block px-8 py-4 bg-gradient-to-br from-primary-dark to-primary text-white no-underline rounded-[14px] font-bold text-lg border border-primary shadow-[0_8px_24px_rgba(124,58,237,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(124,58,237,0.45)]"
        >
          🚀 Start Conversation
        </Link>
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Features Card */}
        <div className="bg-bg-card backdrop-blur-md border border-border-primary rounded-[14px] p-8 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
          <h3 className="text-2xl font-semibold mb-6 text-text-primary border-b-2 border-primary-dark pb-2">
            ✨ Platform Features
          </h3>
          <ul className="leading-[1.8] p-0 m-0 list-none text-text-secondary">
            <li className="mb-3 pl-6 relative">
              <span className="absolute left-0 text-primary">🤖</span>
              Streaming AI responses with {process.env.OPENAI_MODEL || "gpt-4o-mini"}
            </li>
            <li className="mb-3 pl-6 relative">
              <span className="absolute left-0 text-primary">🔍</span>
              RAG search with Supabase pgvector
            </li>
            <li className="mb-3 pl-6 relative">
              <span className="absolute left-0 text-primary">🛠️</span>
              Tool calling for knowledge base search
            </li>
            <li className="mb-3 pl-6 relative">
              <span className="absolute left-0 text-primary">🌐</span>
              Embeddable widget for any website
            </li>
            <li className="mb-3 pl-6 relative">
              <span className="absolute left-0 text-primary">🏢</span>
              Multi-tenant support
            </li>
            <li className="pl-6 relative">
              <span className="absolute left-0 text-primary">⚡</span>
              Edge & Node.js runtime optimization
            </li>
          </ul>
        </div>

        {/* Tips Card */}
        <div className="bg-bg-card backdrop-blur-md border border-border-primary rounded-[14px] p-8 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
          <h3 className="text-2xl font-semibold mb-6 text-text-primary border-b-2 border-primary-dark pb-2">
            💡 What to Ask
          </h3>
          <ul className="leading-[1.8] p-0 m-0 list-none text-text-secondary">
            <li className="mb-3 pl-6 relative">
              <span className="absolute left-0 text-primary">📋</span>
              Ask for Jose Antonio&apos;s professional summary
            </li>
            <li className="mb-3 pl-6 relative">
              <span className="absolute left-0 text-primary">🔧</span>
              Explore core skills, tools, and technologies
            </li>
            <li className="mb-3 pl-6 relative">
              <span className="absolute left-0 text-primary">💼</span>
              Get highlights from work experience
            </li>
            <li className="mb-3 pl-6 relative">
              <span className="absolute left-0 text-primary">🚀</span>
              Learn about notable projects built
            </li>
            <li className="pl-6 relative">
              <span className="absolute left-0 text-primary">🎓</span>
              Review education background
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 p-6 border-t border-border-primary text-text-secondary opacity-70">
        <p className="m-0 text-sm">
          Built with Next.js, AI SDK, and Supabase
        </p>
      </div>
    </div>
  );
}