"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "2rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* Hero Section */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 
          style={{ 
            fontSize: "3.5rem",
            fontWeight: "700",
            margin: "0 0 1rem 0",
            background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: "1.1",
          }}
        >
          José Antonio Nuevo
        </h1>
        <h2 
          style={{ 
            fontSize: "1.5rem",
            fontWeight: "400",
            margin: "0 0 1.5rem 0",
            color: "#b8aef0",
            opacity: "0.9",
          }}
        >
          AI-Powered Professional Assistant
        </h2>
        <p 
          style={{ 
            fontSize: "1.1rem",
            color: "#e6e1ff",
            margin: "0 0 2.5rem 0",
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: "1.6",
            opacity: "0.8",
          }}
        >
          Discover my professional journey through an interactive AI chatbot with advanced RAG capabilities. 
          Ask about my experience, skills, projects, and expertise.
        </p>

        <Link
          href="/chat"
          style={{
            display: "inline-block",
            padding: "1rem 2rem",
            background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "14px",
            fontWeight: "700",
            fontSize: "1.1rem",
            border: "1px solid #7c3aed",
            boxShadow: "0 8px 24px rgba(124, 58, 237, 0.35)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 32px rgba(124, 58, 237, 0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(124, 58, 237, 0.35)";
          }}
        >
          🚀 Start Conversation
        </Link>
      </div>

      {/* Content Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "2rem",
        marginBottom: "2rem"
      }}>
        {/* Features Card */}
        <div
          style={{
            background: "rgba(30,24,60,.75)",
            backdropFilter: "blur(6px)",
            border: "1px solid #2a2352",
            borderRadius: "14px",
            padding: "2rem",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
          }}
        >
          <h3 
            style={{ 
              fontSize: "1.5rem",
              fontWeight: "600",
              margin: "0 0 1.5rem 0",
              color: "#e6e1ff",
              borderBottom: "2px solid #6d28d9",
              paddingBottom: "0.5rem",
            }}
          >
            ✨ Platform Features
          </h3>
          <ul style={{ 
            lineHeight: "1.8", 
            padding: "0", 
            margin: "0",
            listStyle: "none",
            color: "#b8aef0",
          }}>
            <li style={{ marginBottom: "0.8rem", paddingLeft: "1.5rem", position: "relative" }}>
              <span style={{ position: "absolute", left: "0", color: "#7c3aed" }}>🤖</span>
              Streaming AI responses with {process.env.OPENAI_MODEL || "gpt-4o-mini"}
            </li>
            <li style={{ marginBottom: "0.8rem", paddingLeft: "1.5rem", position: "relative" }}>
              <span style={{ position: "absolute", left: "0", color: "#7c3aed" }}>🔍</span>
              RAG search with Supabase pgvector
            </li>
            <li style={{ marginBottom: "0.8rem", paddingLeft: "1.5rem", position: "relative" }}>
              <span style={{ position: "absolute", left: "0", color: "#7c3aed" }}>🛠️</span>
              Tool calling for knowledge base search
            </li>
            <li style={{ marginBottom: "0.8rem", paddingLeft: "1.5rem", position: "relative" }}>
              <span style={{ position: "absolute", left: "0", color: "#7c3aed" }}>🌐</span>
              Embeddable widget for any website
            </li>
            <li style={{ marginBottom: "0.8rem", paddingLeft: "1.5rem", position: "relative" }}>
              <span style={{ position: "absolute", left: "0", color: "#7c3aed" }}>🏢</span>
              Multi-tenant support
            </li>
            <li style={{ paddingLeft: "1.5rem", position: "relative" }}>
              <span style={{ position: "absolute", left: "0", color: "#7c3aed" }}>⚡</span>
              Edge & Node.js runtime optimization
            </li>
          </ul>
        </div>

        {/* Tips Card */}
        <div
          style={{
            background: "rgba(30,24,60,.75)",
            backdropFilter: "blur(6px)",
            border: "1px solid #2a2352",
            borderRadius: "14px",
            padding: "2rem",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
          }}
        >
          <h3 
            style={{ 
              fontSize: "1.5rem",
              fontWeight: "600",
              margin: "0 0 1.5rem 0",
              color: "#e6e1ff",
              borderBottom: "2px solid #6d28d9",
              paddingBottom: "0.5rem",
            }}
          >
            💡 What to Ask
          </h3>
          <ul style={{ 
            lineHeight: "1.8", 
            padding: "0", 
            margin: "0",
            listStyle: "none",
            color: "#b8aef0",
          }}>
            <li style={{ marginBottom: "0.8rem", paddingLeft: "1.5rem", position: "relative" }}>
              <span style={{ position: "absolute", left: "0", color: "#7c3aed" }}>📋</span>
              Ask for Jose Antonio's professional summary
            </li>
            <li style={{ marginBottom: "0.8rem", paddingLeft: "1.5rem", position: "relative" }}>
              <span style={{ position: "absolute", left: "0", color: "#7c3aed" }}>🔧</span>
              Explore core skills, tools, and technologies
            </li>
            <li style={{ marginBottom: "0.8rem", paddingLeft: "1.5rem", position: "relative" }}>
              <span style={{ position: "absolute", left: "0", color: "#7c3aed" }}>💼</span>
              Get highlights from work experience
            </li>
            <li style={{ marginBottom: "0.8rem", paddingLeft: "1.5rem", position: "relative" }}>
              <span style={{ position: "absolute", left: "0", color: "#7c3aed" }}>🚀</span>
              Learn about notable projects built
            </li>
            <li style={{ paddingLeft: "1.5rem", position: "relative" }}>
              <span style={{ position: "absolute", left: "0", color: "#7c3aed" }}>🎓</span>
              Review education background
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: "center", 
        marginTop: "2rem",
        padding: "1.5rem",
        borderTop: "1px solid #2a2352",
        color: "#b8aef0",
        opacity: "0.7",
      }}>
        <p style={{ margin: "0", fontSize: "0.9rem" }}>
          Built with Next.js, AI SDK, and Supabase
        </p>
      </div>
    </div>
  );
}
