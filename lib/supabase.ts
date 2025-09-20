import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key
// This should only be used in server-side code (API routes, server components)
export function supabaseServer() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !supabaseServiceRole) {
    throw new Error('Missing Supabase environment variables for server client');
  }

  return createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Optional: Client-side Supabase client with anon key
// This can be used in client components if needed
export function supabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for client');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Type definitions for database tables
export interface KbDocument {
  id: number;
  tenant: string;
  source?: string;
  title?: string;
  content?: string;
  embedding?: number[];
  created_at?: string;
}

export interface Conversation {
  id: string;
  tenant: string;
  session_id: string;
  started_at?: string;
}

export interface Message {
  id: number;
  conversation_id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  created_at?: string;
}

export interface KbSearchResult {
  id: number;
  title: string;
  content: string;
  similarity: number;
}