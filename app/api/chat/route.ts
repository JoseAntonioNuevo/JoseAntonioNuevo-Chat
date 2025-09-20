import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, tool, convertToCoreMessages } from 'ai';
import { z } from 'zod';
import type { KbSearchResult } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase';
// Uncomment to enable rate limiting:
// import { checkRateLimit } from '@/lib/ratelimit';

// Use Node runtime to support Supabase service role writes
export const runtime = 'nodejs';

// CORS allowlist per tenant (placeholder)
const ALLOWED_ORIGINS: Record<string, string[]> = {
  jose: ['http://localhost:3000', 'http://localhost:3001'],
  // TODO: Add more tenant -> allowed origins mappings
};

// Tool factory to capture request-scoped context (e.g., tenant)
function createSearchKbTool(tenant: string) {
  // Define tool using AI SDK helper to ensure correct shape
  const searchKbTool = tool({
    description: 'Search the knowledge base for relevant information',
    inputSchema: z.object({
      query: z.string().describe('The search query to find relevant documents'),
    }),
    execute: async ({ query }) => {
      try {
        // Use the environment variable for internal API calls (Edge -> Node)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const response = await fetch(`${baseUrl}/api/rag/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, tenant }),
        });

        if (!response.ok) {
          throw new Error(`RAG search failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
          const formattedResults = (data.results as KbSearchResult[])
            .map((r: KbSearchResult) => `[${r.title || 'Document'}] (Relevance: ${(r.similarity * 100).toFixed(1)}%)\n${r.content}`)
            .join('\n\n---\n\n');

          return {
            success: true,
            results: data.results,
            formatted: formattedResults,
          };
        }

        return {
          success: true,
          results: [],
          formatted: 'No relevant documents found in the knowledge base.',
        };
      } catch (error) {
        console.error('Tool execution error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  });
  return searchKbTool;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('DEBUG - Received request body:', JSON.stringify(body, null, 2));
    
    const { messages } = body;
    // Use provided values when available
    const tenant: string = body.tenant || 'jose';
    const sessionId: string = body.sessionId || crypto.randomUUID();

    // Validate required parameters
    console.log('DEBUG - Parameters check:', { 
      messages: messages ? `Array with ${messages.length} items` : 'missing/falsy',
      tenant: tenant || 'missing',
      sessionId: sessionId || 'missing' 
    });
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or empty messages array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!tenant) {
      return new Response(
        JSON.stringify({ error: 'Missing tenant parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing sessionId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check CORS based on tenant allowlist
    const origin = request.headers.get('origin');
    const allowedOrigins = ALLOWED_ORIGINS[tenant] || [];
    if (origin && !allowedOrigins.includes(origin)) {
      return new Response(
        JSON.stringify({ error: 'Origin not allowed for this tenant' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // OPTIONAL: Rate limiting per tenant:origin combination
    // Uncomment the following block to enable rate limiting:
    /*
    const rateLimitIdentifier = `${tenant}:${origin || 'unknown'}`;
    const rateLimitResult = await checkRateLimit(rateLimitIdentifier);
    
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: new Date(rateLimitResult.reset * 1000).toISOString(),
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }
    */

    // System prompt that defines the chatbot behavior
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

    // Convert UI messages from the client to core model messages for the AI call
    const coreMessages = convertToCoreMessages(messages);

    // Persist conversation + last user message
    try {
      const supabase = supabaseServer();
      // Ensure conversation exists
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

      // Extract text from last user message
      const lastUser = [...messages].reverse().find((m: any) => m.role === 'user');
      let userText = '';
      if (lastUser?.parts && Array.isArray(lastUser.parts)) {
        for (const p of lastUser.parts) if (p?.type === 'text') userText += p.text ?? '';
      } else if (typeof lastUser?.content === 'string') {
        userText = lastUser.content;
      }
      if (conv && userText) {
        await supabase.from('messages').insert({
          conversation_id: conv.id,
          role: 'user',
          content: userText,
        });
      }
    } catch (e) {
      console.warn('Non-blocking persistence error (user):', e);
    }

    // Stream the AI response with tool calling
    const result = await streamText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
      system: systemPrompt,
      messages: coreMessages,
      tools: {
        search_kb: createSearchKbTool(tenant),
      },
    });

    // Support both UI stream (default) and plain text stream for simple widgets
    const streamProtocol = request.headers.get('x-stream-protocol');
    if (streamProtocol === 'text') {
      return result.toTextStreamResponse({
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Stream-Protocol',
        },
      });
    }

    // Default: UI message stream for @ai-sdk/react useChat
    return result.toUIMessageStreamResponse({
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Stream-Protocol',
      },
      // Provide original UI messages so the client can maintain continuity
      originalMessages: messages,
      // Attach minimal message metadata (optional)
      messageMetadata: () => ({ sessionId, tenant }),
      onFinish: async ({ responseMessage }) => {
        try {
          const supabase = supabaseServer();
          const { data: conv } = await supabase
            .from('conversations')
            .select('id')
            .eq('tenant', tenant)
            .eq('session_id', sessionId)
            .single();
          if (!conv) return;
          let assistantText = '';
          if (responseMessage?.parts && Array.isArray(responseMessage.parts)) {
            for (const p of responseMessage.parts) if (p?.type === 'text') assistantText += p.text ?? '';
          }
          if (assistantText) {
            await supabase.from('messages').insert({
              conversation_id: conv.id,
              role: 'assistant',
              content: assistantText,
            });
          }
        } catch (e) {
          console.warn('Non-blocking persistence error (assistant):', e);
        }
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
