import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pg from 'pg'; // Use node-postgres
import multer from 'multer';
import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

// Import the correct SDK
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = 3000;

// Initialize PostgreSQL Connection Pool
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'ragquery_db',
  port: process.env.DB_PORT || 5432,
});

// Test Database Connection
async function testDbConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL Database');
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Please check your .env file and ensure PostgreSQL is running.');
  }
}
testDbConnection();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';");
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Check for API key
if (!process.env.API_KEY) {
  console.error('ERROR: API_KEY environment variable is not set.');
  process.exit(1);
}

// Initialize GenAI with the correct SDK
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
// Use gemini-2.5-flash - confirmed available
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Initialize embeddings for semantic search
import { initEmbeddings } from './semanticSearch.js';
initEmbeddings(process.env.API_KEY);
console.log('✅ Semantic search initialized');

const upload = multer({ storage: multer.memoryStorage() });

// Helper to call the model with retries
async function generateWithRetries(prompt, maxAttempts = 3) {
  let attempt = 0;
  while (true) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      attempt += 1;
      const isLast = attempt >= maxAttempts;
      console.warn(`[API] Model call failed (attempt ${attempt}/${maxAttempts}):`, err?.message || err);
      if (isLast) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// RAG endpoint
app.post('/api/proxy', async (req, res) => {
  try {
    const { action, payload } = req.body;
    console.log(`[Proxy] Action: ${action}`);

    if (!action) return res.status(400).json({ error: 'Missing action' });

    if (action === 'rag') {
      const { documentContent, query } = payload;
      if (!documentContent || !query) return res.status(400).json({ error: 'Missing documentContent or query' });

      console.log('[RAG] Starting semantic search...');
      console.log('[RAG] Document length:', documentContent.length, 'characters');
      console.log('[RAG] Query:', query);

      try {
        // Use semantic search with embeddings for better relevance
        const { semanticSearch } = await import('./semanticSearch.js');
        const topChunks = await semanticSearch(documentContent, query, 5);

        console.log('[RAG] Semantic search complete');
        console.log('[RAG] Top chunks count:', topChunks.length);
        console.log('[RAG] Top relevance scores:', topChunks.map(c => c.relevanceScore + '%').join(', '));

        const topChunksText = topChunks.map((c, i) => `${i + 1}. [${c.relevanceScore}%] ${c.chunkText}`).join('\n\n');

        const synthesisPrompt = `You are an expert AI assistant tasked with answering questions based on provided context.

**IMPORTANT INSTRUCTIONS:**
1. **Formatting**:
   - Use **H1 (#)** for the main title.
   - Use **H2 (##)** for major sections.
   - Use **Numbered Lists (1., 2., 3.)** for steps or key points.
   - **Bold Keys**: Start list items with a bold key if applicable (e.g., **Key:** Value).
   - **Do NOT use bold text inline** within sentences unless it's a key term.
2. **Detail**: Provide a **detailed, comprehensive explanation**. Explain *why* and *how*.
3. **Structure**:
   - Start with a clear **H1 Title**.
   - Break down the answer into clear **H2 Sections**.
   - Use **Numbered Lists** for processes or itemized details.

**Context from the document:**
${topChunksText}

**User's Query:** ${query}

**Your Answer:**`;

        console.log('[RAG] Generating synthesis...');
        const synthesizedAnswer = await generateWithRetries(synthesisPrompt);
        console.log('[RAG] Synthesis successful');
        console.log('[RAG] Answer preview:', synthesizedAnswer.substring(0, 100) + '...');
        return res.status(200).json({ synthesizedAnswer, rankedChunks: topChunks });
      } catch (err) {
        console.error('[RAG] Semantic search error:', err);
        console.error('[RAG] Falling back to keyword search...');

        // Fallback to simple keyword matching if semantic search fails
        const sentences = documentContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

        const scoredChunks = sentences.map((chunk, idx) => {
          const chunkLower = chunk.toLowerCase();
          let score = 0;
          for (const word of queryWords) {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            const matches = chunkLower.match(regex);
            score += (matches ? matches.length : 0) * 10;
          }
          score += Math.max(0, 20 - idx);
          return { text: chunk.trim(), score: Math.min(100, score), index: idx };
        });

        const topChunks = scoredChunks.sort((a, b) => b.score - a.score).slice(0, 5).map(c => ({
          relevanceScore: c.score,
          chunkText: c.text
        }));

        return res.status(200).json({
          synthesizedAnswer: `Found ${topChunks.length} relevant passages, but failed to generate summary.`,
          rankedChunks: topChunks
        });
      }
    }

    if (action === 'scrape') {
      const { url } = payload;
      console.log('[Scrape] Request received for URL:', url);

      if (!url) {
        return res.status(400).json({ error: 'Missing URL' });
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();

        // Improved text extraction
        let content = html
          // Remove script and style tags with their content
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
          // Remove HTML comments
          .replace(/<!--[\s\S]*?-->/g, ' ')
          // Replace common block elements with newlines
          .replace(/<\/(div|p|br|h[1-6]|li|tr)>/gi, '\n')
          // Remove all remaining HTML tags
          .replace(/<[^>]+>/g, ' ')
          // Decode common HTML entities
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          // Clean up whitespace
          .replace(/\s+/g, ' ')
          .replace(/\n\s+/g, '\n')
          .trim();

        console.log('[Scrape] Success, content length:', content.length);

        if (!content || content.length < 50) {
          throw new Error('Extracted content is too short or empty');
        }

        return res.status(200).json({ content });
      } catch (err) {
        console.error('[Scrape] Error:', err);
        return res.status(500).json({ error: `Failed to scrape URL: ${err.message}` });
      }
    }

    if (action === 'chat') {
      const { history } = payload;
      if (!history || !Array.isArray(history)) return res.status(400).json({ error: 'Missing history' });

      // Convert history to Gemini format if needed, but for simple generation we can just prompt
      // For better chat, we should use model.startChat, but let's stick to simple generation for now to ensure stability
      const lastMessage = history[history.length - 1].content;

      try {
        const responseText = await generateWithRetries(lastMessage);
        return res.status(200).json({ response: responseText });
      } catch (err) {
        console.error('[Chat] Error:', err);
        return res.status(500).json({ error: `Chat failed: ${err.message}` });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('[API] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Auth Sync
app.post('/api/auth/sync', async (req, res) => {
  const { uid, email, firstName, lastName, country } = req.body;
  console.log('[Auth Sync] Request:', { uid, email, country });

  if (!uid || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM user_details WHERE firebase_uid = $1', [uid]);

    if (rows.length > 0) {
      // Update existing user
      await pool.query(
        `UPDATE user_details SET 
         email = $1, 
         first_name = COALESCE($2, first_name), 
         last_name = COALESCE($3, last_name), 
         country = COALESCE($4, country), 
         last_login = NOW(),
         updated_at = NOW() 
         WHERE firebase_uid = $5`,
        [email, firstName, lastName, country, uid]
      );
      res.json({ message: 'User details updated', action: 'updated' });
    } else {
      // Create new user
      await pool.query(
        `INSERT INTO user_details (firebase_uid, email, first_name, last_name, country, last_login) 
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [uid, email, firstName || '', lastName || '', country || '']
      );
      res.json({ message: 'User details created', action: 'created' });
    }
  } catch (err) {
    console.error('[Auth Sync] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Upload Endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let content = '';
    const mimeType = req.file.mimetype;
    const title = req.file.originalname;

    console.log(`[Upload] Processing: ${title} (${mimeType}) for user: ${userId}`);

    try {
      if (mimeType === 'application/pdf') {
        const data = await pdf(req.file.buffer);
        content = data.text;
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        content = result.value;
      } else {
        content = req.file.buffer.toString('utf-8');
      }
    } catch (parseError) {
      console.error('[Upload] Parse error:', parseError);
      return res.status(500).json({ error: `Failed to parse file: ${parseError.message}` });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'File empty or unparseable' });
    }

    try {
      const { rows } = await pool.query(
        'INSERT INTO documents (title, content, type, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [title, content, 'file', userId]
      );
      console.log(`[Upload] Saved ID: ${rows[0].id}`);
      res.json({ id: rows[0].id, content, title });
    } catch (err) {
      console.error('[Upload] DB Error:', err);
      res.status(500).json({ error: err.message });
    }
  } catch (error) {
    console.error('[Upload] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Documents Endpoints
app.get('/api/documents', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { rows } = await pool.query('SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json({ documents: rows });
  } catch (err) {
    console.error('[Documents] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { title, content, type } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Missing title/content' });

  try {
    const { rows } = await pool.query(
      'INSERT INTO documents (title, content, type, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [title, content, type || 'text', userId]
    );
    res.json({ id: rows[0].id });
  } catch (err) {
    console.error('[Documents] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  try {
    await pool.query('DELETE FROM documents WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('[Documents] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Projects Endpoints
app.get('/api/projects', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { rows } = await pool.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    // Parse source_ids for frontend convenience (Postgres JSONB is returned as object/array automatically by pg)
    const projects = rows.map(p => ({
      ...p,
      source_ids: typeof p.source_ids === 'string' ? JSON.parse(p.source_ids) : p.source_ids
    }));
    res.json({ projects });
  } catch (err) {
    console.error('[Projects] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { name, source_ids } = req.body;
  if (!name || !source_ids || !Array.isArray(source_ids)) {
    return res.status(400).json({ error: 'Missing name or invalid source_ids' });
  }

  if (source_ids.length > 5) {
    return res.status(400).json({ error: 'Projects can have a maximum of 5 sources' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO projects (name, source_ids, user_id) VALUES ($1, $2, $3) RETURNING id',
      [name, JSON.stringify(source_ids), userId]
    );
    res.json({ id: rows[0].id, name, source_ids });
  } catch (err) {
    console.error('[Projects] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Missing name' });
  }

  try {
    await pool.query('UPDATE projects SET name = $1 WHERE id = $2 AND user_id = $3', [name, id, userId]);
    res.json({ message: 'Project renamed', id, name });
  } catch (err) {
    console.error('[Projects] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  try {
    await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('[Projects] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Ares Chat
app.post('/api/chat/ares', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    try {
      const { rows: docs } = await pool.query('SELECT * FROM documents');

      if (docs.length === 0) {
        return res.json({ response: "I don't have any memories yet. Upload some documents!" });
      }

      const allContent = docs.map(d => d.content).join('\n\n');
      // Simple context retrieval
      const sentences = allContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

      const scoredChunks = sentences.map((chunk, idx) => {
        const chunkLower = chunk.toLowerCase();
        let score = 0;
        for (const word of queryWords) {
          const regex = new RegExp(`\\b${word}\\b`, 'g');
          const matches = chunkLower.match(regex);
          score += (matches ? matches.length : 0) * 10;
        }
        score += Math.max(0, 20 - idx);
        return { text: chunk.trim(), score: Math.min(100, score) };
      });

      const topChunks = scoredChunks.sort((a, b) => b.score - a.score).slice(0, 3);
      const context = topChunks.map((c, i) => `${i + 1}. ${c.text}`).join('\n\n');

      const systemPrompt = `You are Ares, a highly intelligent AI assistant.
      Answer the user's question using the provided context.
      
      Context:
      ${context}
      
      Question: ${query}`;

      try {
        const responseText = await generateWithRetries(systemPrompt);
        res.json({ response: responseText, sources: topChunks });
      } catch (err) {
        console.error('[Ares] Error:', err);
        res.status(500).json({ error: err.message });
      }
    } catch (err) {
      console.error('[Ares] DB Error:', err);
      res.status(500).json({ error: err.message });
    }
  } catch (error) {
    console.error('[Ares] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
});
