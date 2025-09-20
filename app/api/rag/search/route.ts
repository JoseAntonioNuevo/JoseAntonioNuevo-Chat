import { NextRequest, NextResponse } from 'next/server';
import { KbSearchResult } from '@/lib/supabase';
import { searchKb } from '@/lib/rag';

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

    const results: KbSearchResult[] = await searchKb({ query, tenant, matchCount: 5 });

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
