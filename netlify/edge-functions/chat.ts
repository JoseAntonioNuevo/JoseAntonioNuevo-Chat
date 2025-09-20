// Netlify Edge Function version of the chat endpoint.
// Streams using the Vercel AI SDK v5 UI message stream protocol.
// This avoids buffering in Netlify’s serverless functions.

import { streamText, tool, convertToCoreMessages, stepCountIs, embed } from 'ai';
import { openai as createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

type KbSearchResult = {
  id: number;
  title: string;
  content: string;
  similarity: number;
};

// CORS allowlist per tenant (mirror your Next route config)
const ALLOWED_ORIGINS: Record<string, string[]> = {
  jose: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://chat.joseantonionuevo.tech',
  ],
};

function getEnv(key: string): string | undefined {
  // Works both in Netlify Edge (Deno) and during Next type-check/build (Node)
  const denoEnv = (globalThis as any)?.Deno?.env;
  const fromDeno = typeof denoEnv?.get === 'function' ? denoEnv.get(key) : undefined;
  return fromDeno ?? (process as any)?.env?.[key];
}

function supabaseEdge() {
  const url = getEnv('SUPABASE_URL');
  const serviceRole = getEnv('SUPABASE_SERVICE_ROLE');
  if (!url || !serviceRole) throw new Error('Missing Supabase env vars');
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Initialize OpenAI provider explicitly with API key for Edge runtime
const oai = createOpenAI({ apiKey: getEnv('OPENAI_API_KEY') || '' });

async function searchKb({
  query,
  tenant,
  matchCount = 5,
}: {
  query: string;
  tenant: string;
  matchCount?: number;
}): Promise<KbSearchResult[]> {
  // embed query with OpenAI
  const { embedding } = await embed({
    model: oai.textEmbeddingModel('text-embedding-3-small'),
    value: query,
  });
  const supabase = supabaseEdge();
  const { data, error } = await supabase.rpc('kb_search', {
    p_tenant: tenant,
    p_query: `[${embedding.join(',')}]`,
    p_match_count: matchCount,
  });
  if (error) throw new Error(`Failed to search knowledge base: ${error.message}`);
  return (data as KbSearchResult[]) || [];
}

function createSearchKbTool(tenant: string) {
  return tool({
    description: 'Search the knowledge base for relevant information',
    inputSchema: z.object({
      query: z.string().describe('The search query to find relevant documents'),
    }),
    execute: async ({ query }) => {
      try {
        const results = await searchKb({ query, tenant, matchCount: 5 });
        if (results.length > 0) {
          const formatted = results
            .map((r) => `[${r.title || 'Document'}] (Relevance: ${(r.similarity * 100).toFixed(1)}%)\n${r.content}`)
            .join('\n\n---\n\n');
          return { success: true as const, results, formatted };
        }
        return { success: true as const, results: [], formatted: 'No relevant documents found in the knowledge base.' };
      } catch (error) {
        console.error('Tool execution error:', error);
        return { success: false as const, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
  });
}

function corsHeaders(origin: string | null): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Stream-Protocol',
    // help proxies avoid buffering/compression
    'Content-Encoding': 'identity',
    'X-Accel-Buffering': 'no',
  };
}

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    return new Response(null, { status: 200, headers: corsHeaders(origin) });
  }
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const origin = request.headers.get('origin');
    const body = await request.json();

    const messages = body?.messages;
    const tenant: string = body?.tenant || 'jose';
    const sessionId: string = body?.sessionId || crypto.randomUUID();

    // CORS allowlist per tenant
    const allowedOrigins = ALLOWED_ORIGINS[tenant] || [];
    if (origin && !allowedOrigins.includes(origin)) {
      return new Response(JSON.stringify({ error: 'Origin not allowed for this tenant' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or empty messages array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are a helpful AI assistant with access to a knowledge base about Jose Antonio Nuevo.

CRITICAL: After using the search_kb tool, you MUST continue the conversation with a synthesized response. Do not end the conversation after tool execution.

Your mandatory workflow is:
1. Search the knowledge base using the search_kb tool when relevant
2. Analyze the retrieved information carefully
3. ALWAYS provide a comprehensive, synthesized response in natural language
4. Extract key information and present it clearly and professionally

For employment questions, organize companies chronologically and include:
- Company name and role
- Duration of employment
- Key responsibilities or achievements

Remember: You must ALWAYS respond with actual content after using tools. Never stop after tool execution.

Tenant context: ${tenant}
Session ID: ${sessionId}`;

    // Convert to core messages for the AI call
    const coreMessages = convertToCoreMessages(messages);

    // Optional persistence (best-effort) — create conversation and store last user message
    try {
      const supabase = supabaseEdge();
      let { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('tenant', tenant)
        .eq('session_id', sessionId)
        .maybeSingle();
      if (!conv) {
        const ins = await supabase
          .from('conversations')
          .insert({ tenant, session_id: sessionId })
          .select('*')
          .single();
        conv = ins.data;
      }
      // extract last user text
      type BasePart = { type: string } & Record<string, unknown>;
      const isTextPart = (p: BasePart): p is { type: 'text'; text: string } => p.type === 'text' && typeof (p as any).text === 'string';
      const uiMessages = messages as Array<{ role: 'user' | 'assistant' | 'system'; parts?: unknown; content?: unknown }>;
      const lastUser = [...uiMessages].reverse().find((m) => m.role === 'user');
      let userText = '';
      if (lastUser?.parts && Array.isArray(lastUser.parts as unknown[])) {
        const parts = lastUser.parts as unknown as BasePart[];
        for (const p of parts) if (isTextPart(p)) userText += p.text;
      } else if (typeof lastUser?.content === 'string') {
        userText = lastUser.content;
      }
      if (conv && userText) {
        await supabase.from('messages').insert({ conversation_id: conv.id, role: 'user', content: userText });
      }
    } catch (e) {
      console.warn('Edge persistence (user) failed, continuing:', e);
    }

    // Stream model response
    const result = await streamText({
      model: oai(getEnv('OPENAI_MODEL') ?? 'gpt-4o-mini'),
      system: systemPrompt,
      messages: coreMessages,
      toolChoice: 'auto',
      stopWhen: stepCountIs(2),
      tools: {
        search_kb: createSearchKbTool(tenant),
      },
    });

    const streamProtocol = request.headers.get('x-stream-protocol');
    if (streamProtocol === 'text') {
      return result.toTextStreamResponse({ headers: corsHeaders(origin) });
    }

    // Default: UI message stream for @ai-sdk/react useChat
    return result.toUIMessageStreamResponse({
      headers: corsHeaders(origin),
      originalMessages: messages,
      messageMetadata: () => ({ sessionId, tenant }),
      sendReasoning: true,
      onFinish: async ({ responseMessage }) => {
        try {
          const supabase = supabaseEdge();
          const { data: conv } = await supabase
            .from('conversations')
            .select('id')
            .eq('tenant', tenant)
            .eq('session_id', sessionId)
            .single();
          if (!conv) return;
          type BasePart = { type: string } & Record<string, unknown>;
          const isTextPart = (p: BasePart): p is { type: 'text'; text: string } => p.type === 'text' && typeof (p as any).text === 'string';
          let assistantText = '';
          if (responseMessage?.parts && Array.isArray(responseMessage.parts as unknown[])) {
            const parts = responseMessage.parts as unknown as BasePart[];
            for (const p of parts) if (isTextPart(p)) assistantText += p.text;
          }
          if (assistantText) {
            await supabase.from('messages').insert({ conversation_id: conv.id, role: 'assistant', content: assistantText });
          }
        } catch (e) {
          console.warn('Edge persistence (assistant) failed:', e);
        }
      },
    });
  } catch (error) {
    console.error('Edge Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
