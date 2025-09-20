import dotenv from 'dotenv';

// Load environment variables from .env.local (Next.js convention)
dotenv.config({ path: '.env.local' });
import { openai } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';
import { supabaseServer, type KbDocument, type KbSearchResult } from '../lib/supabase';

// Sample documents for Jose's portfolio/CV
const SEED_DOCUMENTS = [
  {
    title: 'Professional Summary',
    content: `Jose Antonio is a senior full-stack engineer with over 10 years of experience building scalable web applications.
    Specializes in React, Next.js, Node.js, and cloud architectures. Strong background in AI/ML integration,
    real-time systems, and microservices. Passionate about clean code, best practices, and mentoring junior developers.`,
    source: 'cv',
  },
  {
    title: 'Technical Skills',
    content: `Programming Languages: JavaScript, TypeScript, Python, Go, Rust
    Frontend: React, Next.js, Vue.js, Svelte, React Native, Flutter
    Backend: Node.js, Express, NestJS, FastAPI, Django
    Databases: PostgreSQL, MongoDB, Redis, Supabase, Firebase
    Cloud: AWS, Google Cloud, Azure, Vercel, Netlify
    AI/ML: OpenAI API, Langchain, Vector databases, RAG systems
    DevOps: Docker, Kubernetes, CI/CD, Terraform, GitHub Actions`,
    source: 'cv',
  },
  {
    title: 'Work Experience - Senior Full-Stack Engineer at TechCorp',
    content: `2021-Present: Leading a team of 5 engineers building a SaaS platform for enterprise clients.
    - Architected microservices using Node.js and Kubernetes
    - Implemented real-time collaboration features using WebSockets
    - Reduced API response times by 60% through optimization
    - Mentored junior developers and conducted code reviews
    - Stack: Next.js, Node.js, PostgreSQL, Redis, AWS`,
    source: 'cv',
  },
  {
    title: 'Work Experience - Full-Stack Developer at StartupXYZ',
    content: `2018-2021: Built MVP and scaled to 100k users as founding engineer.
    - Developed React Native mobile app from scratch
    - Designed RESTful APIs and GraphQL schemas
    - Implemented payment processing with Stripe
    - Set up CI/CD pipelines and monitoring
    - Stack: React, React Native, Express, MongoDB, Heroku`,
    source: 'cv',
  },
  {
    title: 'Portfolio Project - AI-Powered Chat Platform',
    content: `Built a multi-tenant chatbot platform with RAG capabilities using Next.js and Supabase.
    Features include streaming responses, tool calling, vector search, and embeddable widgets.
    The system processes thousands of messages daily with sub-second response times.
    Tech stack: Next.js 14, Vercel AI SDK, OpenAI, Supabase with pgvector, Edge Runtime.
    GitHub: github.com/joseantonio/ai-chat-platform`,
    source: 'portfolio',
  },
  {
    title: 'Portfolio Project - Real-time Collaboration Tool',
    content: `Developed a Figma-like collaborative design tool with real-time cursors, canvas synchronization,
    and version history. Supports unlimited users per canvas with conflict-free replicated data types (CRDTs).
    Built with React, WebRTC, Y.js for CRDT, and Phoenix channels for real-time communication.
    Live demo: collab-tool.example.com`,
    source: 'portfolio',
  },
  {
    title: 'Portfolio Project - E-commerce Marketplace',
    content: `Created a full-featured marketplace with multi-vendor support, real-time inventory tracking,
    and ML-powered product recommendations. Processes over $1M in monthly transactions.
    Features: Payment splitting, dispute resolution, automated fulfillment, analytics dashboard.
    Tech: Next.js, Stripe Connect, PostgreSQL, Redis, Elasticsearch, TensorFlow.js`,
    source: 'portfolio',
  },
  {
    title: 'Education',
    content: `Master of Science in Computer Science - Stanford University (2016-2018)
    Focus: Distributed Systems and Machine Learning
    
    Bachelor of Science in Software Engineering - MIT (2012-2016)
    Graduated Magna Cum Laude, GPA: 3.9/4.0`,
    source: 'cv',
  },
  {
    title: 'Certifications & Awards',
    content: `AWS Certified Solutions Architect - Professional
    Google Cloud Professional Cloud Architect
    Meta Certified React Developer
    
    Awards:
    - Best Innovation Award at TechCorp Hackathon 2023
    - Open Source Contributor of the Year 2022
    - Speaker at React Summit 2023`,
    source: 'cv',
  },
  {
    title: 'Contact Information',
    content: `Email: jose@example.com
    LinkedIn: linkedin.com/in/joseantonio
    GitHub: github.com/joseantonio
    Portfolio: joseantonio.dev
    Location: San Francisco, CA (Remote-friendly)`,
    source: 'cv',
  },
];

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
    
    // Extract content for embedding
    const values = SEED_DOCUMENTS.map(doc => doc.content);

    console.log('🤖 Generating embeddings with OpenAI...');
    
    // Generate embeddings for all documents
    const { embeddings } = await embedMany({
      model: openai.textEmbeddingModel('text-embedding-3-small'),
      values,
    });

    console.log(`✅ Generated ${embeddings.length} embeddings`);

    // Prepare documents with embeddings for insertion
    const documentsWithEmbeddings = SEED_DOCUMENTS.map((doc, index) => ({
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
