# JA Chatbot - Multi-Site AI Chatbot Microservice

A production-ready Next.js 14/15 chatbot microservice with streaming responses, tool calling, and RAG (Retrieval-Augmented Generation) capabilities powered by Supabase pgvector.

## Features

- **Streaming AI Responses**: Real-time token streaming using Vercel AI SDK v5
- **RAG with pgvector**: Vector similarity search on Supabase for contextual responses
- **Tool Calling**: AI can search knowledge base during conversations
- **Multi-tenant Support**: Isolated data and CORS policies per tenant
- **Embeddable Widget**: Lightweight Web Component for any website
- **Edge & Node Runtimes**: Optimized API routes for performance
- **Rate Limiting**: Optional Upstash integration for API protection

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **AI**: Vercel AI SDK v5 with OpenAI (gpt-5-mini)
- **Database**: Supabase (PostgreSQL + pgvector)
- **Embeddings**: OpenAI text-embedding-3-small
- **Rate Limiting**: Upstash Redis (optional)
- **Runtime**: Edge (chat) + Node.js (RAG search)

## Prerequisites

- Node.js 18+ and pnpm
- OpenAI API key
- Supabase project with pgvector enabled
- (Optional) Upstash Redis for rate limiting

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anon/public key
- `SUPABASE_SERVICE_ROLE`: Supabase service role key (keep secret!)

Optional for rate limiting:
- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST token

### 3. Set Up Database Schema

1. Go to your Supabase SQL Editor
2. Copy and run the entire contents of `/supabase/schema.sql`
3. This will create:
   - `kb_documents` table for knowledge base
   - `conversations` and `messages` tables for chat history
   - HNSW index for fast vector search
   - RPC function `kb_search` for similarity search
   - Row Level Security policies

### 4. Ingest Initial Documents

Run the ingestion script to populate the knowledge base:

```bash
pnpm ingest
```

This inserts sample documents for the 'jose' tenant including CV and portfolio information.

### 5. Run Development Server

```bash
pnpm dev
```

Visit:
- Chat UI: http://localhost:3000/chat
- API endpoints:
  - `/api/chat` - Streaming chat with tool calling (Edge)
  - `/api/rag/search` - Vector similarity search (Node)

## Embedding the Widget

To embed the chatbot on any website:

```html
<!-- Add to your HTML -->
<script src="https://YOUR-DEPLOY.vercel.app/ja-chatbot.js" defer></script>
<ja-chatbot tenant="jose"></ja-chatbot>
```

For local testing:
```html
<script src="http://localhost:3000/ja-chatbot.js" defer></script>
<ja-chatbot tenant="jose" api-url="http://localhost:3000/api/chat"></ja-chatbot>
```

## Project Structure

```
ja-chatbot/
├── app/
│   ├── api/
│   │   ├── chat/route.ts         # Edge: Streaming chat with tools
│   │   └── rag/search/route.ts   # Node: Vector similarity search
│   └── chat/page.tsx              # React chat interface
├── lib/
│   ├── supabase.ts               # Supabase client helpers
│   └── ratelimit.ts              # Rate limiting utilities
├── public/
│   └── ja-chatbot.js             # Embeddable Web Component
├── scripts/
│   └── ingest.ts                 # Document ingestion script
├── supabase/
│   └── schema.sql                # Database schema and RLS
└── .env.example                  # Environment variables template
```

## API Endpoints

### POST /api/chat
Streaming chat endpoint with tool calling capabilities.

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Tell me about portfolio projects" }
  ],
  "tenant": "jose",
  "sessionId": "uuid-here"
}
```

**Response:**
- Default: UI Message Stream (for `@ai-sdk/react` `useChat`)
- If header `X-Stream-Protocol: text` is present: plain text stream (for the widget)

### POST /api/rag/search
Vector similarity search in knowledge base.

**Request Body:**
```json
{
  "query": "portfolio projects",
  "tenant": "jose"
}
```

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "title": "Portfolio Project - AI Chat",
      "content": "...",
      "similarity": 0.92
    }
  ]
}
```

## Configuration

### Multi-tenant Setup

Edit tenant allowlists in `/app/api/chat/route.ts`:

```typescript
const ALLOWED_ORIGINS: Record<string, string[]> = {
  jose: ['http://localhost:3000', 'https://jose.com'],
  acme: ['https://acme.com', 'https://app.acme.com'],
  // Add more tenants...
};
```

### Rate Limiting

To enable rate limiting:

1. Set up Upstash Redis and add credentials to `.env.local`
2. Uncomment rate limiting code in `/app/api/chat/route.ts`
3. Customize limits in `/lib/ratelimit.ts`

### Custom System Prompts

Modify the system prompt in `/app/api/chat/route.ts` to customize AI behavior per tenant.

## Production Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Security Checklist

- [ ] Never expose `SUPABASE_SERVICE_ROLE` to client
- [ ] Enable strict CORS checking in production
- [ ] Configure rate limiting for public APIs
- [ ] Review and update RLS policies
- [ ] Use HTTPS for all production deployments
- [ ] Rotate API keys regularly

## Scripts

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run ESLint
pnpm ingest     # Ingest documents to knowledge base
```

## Troubleshooting

### "Missing Supabase environment variables"
Ensure all required environment variables are set in `.env.local`

### "Rate limit not working"
Check that Upstash credentials are correct and uncomment rate limiting code

### "Search returns no results"
Run `pnpm ingest` to populate the knowledge base

### "CORS errors on widget"
Add your domain to `ALLOWED_ORIGINS` in `/app/api/chat/route.ts`

## TODOs

- [ ] Add domain allowlists for production CORS
- [ ] Implement conversation persistence to database
- [ ] Add authentication/authorization
- [ ] Enhance UI with better styling
- [ ] Add more sophisticated RAG strategies
- [ ] Implement conversation history in widget
- [ ] Add analytics and monitoring
- [ ] Create admin dashboard for tenant management

## License

MIT

## Support

For issues or questions, please open a GitHub issue.
