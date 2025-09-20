import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local (Next.js convention)
dotenv.config({ path: '.env.local' });
import { openai } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';
import { supabaseServer, type KbDocument, type KbSearchResult } from '../lib/supabase';

// Function to read documents from the docs folder
function loadDocumentsFromFiles(): Array<{ title: string; content: string; source: string }> {
  const docsDir = path.join(process.cwd(), 'docs');
  
  if (!fs.existsSync(docsDir)) {
    console.log('❌ docs folder not found, using fallback placeholder data');
    return [];
  }

  const documents: Array<{ title: string; content: string; source: string }> = [];
  const files = fs.readdirSync(docsDir);

  console.log(`📁 Found ${files.length} files in docs folder:`);
  
  files.forEach(file => {
    if (file.endsWith('.md') || file.endsWith('.txt')) {
      const filePath = path.join(docsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract title from filename or first heading
      let title = file.replace(/\.(md|txt)$/, '');
      const firstLine = content.split('\n')[0];
      if (firstLine.startsWith('#')) {
        title = firstLine.replace(/^#+\s*/, '');
      }
      
      // Convert filename to proper title case
      title = title
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      documents.push({
        title,
        content: content.trim(),
        source: 'cv', // You can customize this based on file name or folder structure
      });

      console.log(`   ✅ ${file} -> "${title}"`);
    }
  });

  return documents;
}

async function main() {
  console.log('🚀 Starting document ingestion for tenant: jose');

  try {
    // Validate environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
      throw new Error('Supabase environment variables are not set');
    }

    console.log('📝 Preparing documents for embedding...');
    
    // Load documents from files
    const documents = loadDocumentsFromFiles();
    
    if (documents.length === 0) {
      throw new Error('No documents found in docs folder. Please add .md or .txt files to the docs/ directory.');
    }
    
    // Extract content for embedding
    const values = documents.map(doc => doc.content);

    console.log('🤖 Generating embeddings with OpenAI...');
    
    // Generate embeddings for all documents
    const { embeddings } = await embedMany({
      model: openai.textEmbeddingModel('text-embedding-3-small'),
      values,
    });

    console.log(`✅ Generated ${embeddings.length} embeddings`);

    // Prepare documents with embeddings for insertion
    const documentsWithEmbeddings = documents.map((doc, index) => ({
      tenant: 'jose',
      title: doc.title,
      content: doc.content,
      source: doc.source,
      embedding: `[${embeddings[index].join(',')}]`,
    }));

    console.log('💾 Inserting documents into Supabase...');
    
    // Get Supabase client
    const supabase = supabaseServer();

    // Insert all documents
    const { data, error } = await supabase
      .from('kb_documents')
      .insert(documentsWithEmbeddings)
      .select();

    if (error) {
      throw new Error(`Supabase insertion error: ${error.message}`);
    }

    console.log(`✅ Successfully inserted ${data?.length || 0} documents`);
    console.log('\n📚 Ingested documents:');
    (data as KbDocument[] | null)?.forEach((doc) => {
      console.log(`   - ${doc.title} (ID: ${doc.id})`);
    });

    console.log('\n🎉 Document ingestion completed successfully!');
    
    // Test the search functionality
    console.log('\n🔍 Testing search functionality...');
    
    // Generate a test query embedding
    const testQuery = 'Tell me about portfolio projects';
    const { embedding: queryEmbedding } = await embed({
      model: openai.textEmbeddingModel('text-embedding-3-small'),
      value: testQuery,
    });

    // Search using the RPC function
    const { data: searchResults, error: searchError } = await supabase
      .rpc('kb_search', {
        p_tenant: 'jose',
        p_query: `[${queryEmbedding.join(',')}]`,
        p_match_count: 3,
      });

    if (searchError) {
      console.error('❌ Search test failed:', searchError);
    } else {
      const typed = (searchResults as KbSearchResult[] | null) ?? [];
      console.log(`✅ Search test successful! Found ${typed.length} results for: "${testQuery}"`);
      typed.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.title} (Similarity: ${(result.similarity * 100).toFixed(1)}%)`);
      });
    }

  } catch (error) {
    console.error('❌ Error during ingestion:', error);
    process.exit(1);
  }
}

// Run the ingestion
main().catch(console.error);
