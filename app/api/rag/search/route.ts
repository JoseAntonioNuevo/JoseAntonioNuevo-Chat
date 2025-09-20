import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { supabaseServer, KbSearchResult } from '@/lib/supabase';

// Force Node.js runtime for this route (needed for embeddings)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { query, tenant } = await request.json();

    // Validate input
    if (!query || !tenant) {
      return NextResponse.json(
        { error: 'Missing required parameters: query and tenant' },
        { status: 400 }
      );
    }

    // Generate embedding for the query using OpenAI's text-embedding-3-small model
    const { embedding } = await embed({
      model: openai.textEmbeddingModel('text-embedding-3-small'),
      value: query,
    });

    // Get Supabase client
    const supabase = supabaseServer();

    // Call the kb_search RPC function with the embedding
    const { data, error } = await supabase
      .rpc('kb_search', {
        p_tenant: tenant,
        p_query: `[${embedding.join(',')}]`,
        p_match_count: 5,
      });

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json(
        { error: 'Failed to search knowledge base', details: error.message },
        { status: 500 }
      );
    }

    // Type the results
    const results = data as KbSearchResult[];

    // Return the search results
    return NextResponse.json({
      results: results || [],
    });

  } catch (error) {
    console.error('RAG search error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
