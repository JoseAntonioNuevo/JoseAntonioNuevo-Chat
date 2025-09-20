import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { supabaseServer, type KbSearchResult } from '@/lib/supabase';

export async function searchKb({
  query,
  tenant,
  matchCount = 5,
}: {
  query: string;
  tenant: string;
  matchCount?: number;
}): Promise<KbSearchResult[]> {
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
      p_match_count: matchCount,
    });

  if (error) {
    throw new Error(`Failed to search knowledge base: ${error.message}`);
  }

  return (data as KbSearchResult[]) || [];
}

