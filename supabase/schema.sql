-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- Create kb_documents table for RAG knowledge base
CREATE TABLE IF NOT EXISTS kb_documents (
    id BIGSERIAL PRIMARY KEY,
    tenant TEXT NOT NULL,
    source TEXT,
    title TEXT,
    content TEXT,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant TEXT NOT NULL,
    session_id TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant', 'tool')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS kb_documents_embedding_idx 
ON kb_documents 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Enable Row Level Security
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- For kb_documents: Allow SELECT based on tenant claim from JWT
-- Usage: Expects auth.jwt() ->> 'tenant' to match the row's tenant
CREATE POLICY kb_documents_select_policy ON kb_documents
    FOR SELECT
    USING (tenant = auth.jwt() ->> 'tenant');

-- For conversations: Allow SELECT based on tenant claim from JWT
CREATE POLICY conversations_select_policy ON conversations
    FOR SELECT
    USING (tenant = auth.jwt() ->> 'tenant');

-- For messages: Allow SELECT through conversation tenant check
-- Joins with conversations to verify tenant access
CREATE POLICY messages_select_policy ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.tenant = auth.jwt() ->> 'tenant'
        )
    );

-- RPC function for knowledge base search
-- Returns documents ranked by vector similarity
CREATE OR REPLACE FUNCTION kb_search(
    p_tenant TEXT,
    p_query VECTOR,
    p_match_count INT DEFAULT 5
)
RETURNS TABLE (
    id BIGINT,
    title TEXT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kb.id,
        kb.title,
        kb.content,
        1 - (kb.embedding <=> p_query) AS similarity
    FROM kb_documents kb
    WHERE kb.tenant = p_tenant
    ORDER BY kb.embedding <=> p_query
    LIMIT p_match_count;
END;
$$;

-- Grant necessary permissions for the function
GRANT EXECUTE ON FUNCTION kb_search TO anon, authenticated;
