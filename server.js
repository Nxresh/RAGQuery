import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import sqlite3 from 'sqlite3';
import multer from 'multer';
import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

// Import the correct SDK
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = 3000;

// Initialize SQLite Database
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firebase_uid TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    country TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run("ALTER TABLE users ADD COLUMN firebase_uid TEXT UNIQUE", () => { });
});

// Documents table
db.run(`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

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
1. Read the user's query carefully and answer it directly
2. Base your answer ONLY on the information provided in the context below
3. Use clear, professional Markdown formatting (headers, bullet points, bold text)
4. Be comprehensive yet concise
5. If the context doesn't fully answer the query, acknowledge this and provide what information is available

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
app.post('/api/auth/sync', (req, res) => {
  const { uid, email, firstName, lastName, country } = req.body;
  console.log('[Auth Sync] Request:', { uid, email });

  if (!uid || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.get('SELECT * FROM users WHERE firebase_uid = ?', [uid], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      db.run(
        'UPDATE users SET email = ?, first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), country = COALESCE(?, country), updated_at = CURRENT_TIMESTAMP WHERE firebase_uid = ?',
        [email, firstName, lastName, country, uid],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'User synced', action: 'updated' });
        }
      );
    } else {
      db.run(
        'INSERT INTO users (firebase_uid, email, first_name, last_name, country) VALUES (?, ?, ?, ?, ?)',
        [uid, email, firstName || '', lastName || '', country || ''],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'User synced', action: 'created' });
        }
      );
    }
  });
});

// Upload Endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let content = '';
    const mimeType = req.file.mimetype;
    const title = req.file.originalname;

    console.log(`[Upload] Processing: ${title} (${mimeType})`);

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

    db.run(
      'INSERT INTO documents (title, content, type) VALUES (?, ?, ?)',
      [title, content, 'file'],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        console.log(`[Upload] Saved ID: ${this.lastID}`);
        res.json({ id: this.lastID, content, title });
      }
    );
  } catch (error) {
    console.error('[Upload] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Documents Endpoints
app.get('/api/documents', (req, res) => {
  db.all('SELECT * FROM documents ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ documents: rows });
  });
});

app.post('/api/documents', (req, res) => {
  const { title, content, type } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Missing title/content' });

  db.run(
    'INSERT INTO documents (title, content, type) VALUES (?, ?, ?)',
    [title, content, type || 'text'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM documents WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Document deleted' });
  });
});

// Ares Chat
app.post('/api/chat/ares', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    db.all('SELECT * FROM documents', [], async (err, docs) => {
      if (err) return res.status(500).json({ error: err.message });

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
    });
  } catch (error) {
    console.error('[Ares] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
});
