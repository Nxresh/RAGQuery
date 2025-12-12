import dotenv from 'dotenv';
// dotenv.config({ path: '.env.local' });
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
import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);
const app = express();
const PORT = 5190;

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
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com;");
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
// Use gemini-2.0-flash (User has access to this specific model)
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Helper to repair truncated JSON
function repairJSON(jsonStr) {
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // If it fails, try to find the last valid closing structure
    console.log('[JSON Repair] Attempting to repair JSON...');

    // 1. Try adding missing closing braces/brackets
    const openBraces = (jsonStr.match(/{/g) || []).length;
    const closeBraces = (jsonStr.match(/}/g) || []).length;
    const openBrackets = (jsonStr.match(/\[/g) || []).length;
    const closeBrackets = (jsonStr.match(/\]/g) || []).length;

    let repaired = jsonStr;
    for (let i = 0; i < (openBraces - closeBraces); i++) repaired += '}';
    for (let i = 0; i < (openBrackets - closeBrackets); i++) repaired += ']';

    try {
      return JSON.parse(repaired);
    } catch (e2) {
      // 2. If that fails, try to cut off at the last complete object in the array (if it's an array)
      // This is specific to our slide deck structure which is { slides: [...] }
      const lastSlideEnd = jsonStr.lastIndexOf('},');
      if (lastSlideEnd !== -1) {
        const truncated = jsonStr.substring(0, lastSlideEnd + 1) + ']}';
        try {
          return JSON.parse(truncated);
        } catch (e3) {
          throw e; // Give up
        }
      }
      throw e;
    }
  }
}

// Initialize embeddings for semantic search
import { initEmbeddings } from './semanticSearch.js';
initEmbeddings(process.env.API_KEY);
console.log('✅ Semantic search initialized');

const upload = multer({ storage: multer.memoryStorage() });

// Helper to call the model with retries
async function generateWithRetries(prompt, maxAttempts = 8) {
  let attempt = 0;
  console.log(`[API] generateWithRetries called. Prompt length: ${prompt.length}`);
  while (true) {
    try {
      console.log(`[API] Attempt ${attempt + 1}/${maxAttempts} starting...`);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      console.log(`[API] Attempt ${attempt + 1} success.`);
      return response.text();
    } catch (err) {
      attempt += 1;
      const isLast = attempt >= maxAttempts;
      const isRateLimit = err.message?.includes('429') || err.status === 429;

      console.warn(`[API] Model call failed (attempt ${attempt}/${maxAttempts}):`, err?.message || err);

      if (isLast) throw err;

      // Aggressive Exponential backoff for rate limits
      // 10s, 20s, 40s, 80s...
      const baseDelay = isRateLimit ? 10000 : 2000;
      const delay = baseDelay * Math.pow(2, attempt - 1);

      console.log(`[API] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
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
        // Retrieve top 5 Parent Contexts (Hierarchical RAG)
        const topChunks = await semanticSearch(documentContent, query, 5);

        console.log('[RAG] Semantic search complete');
        console.log('[RAG] Top Parent Contexts count:', topChunks.length);
        console.log('[RAG] Top relevance scores:', topChunks.map(c => c.relevanceScore + '%').join(', '));

        const topChunksText = topChunks.map((c, i) => `
---
### Context Section ${i + 1} (Relevance: ${c.relevanceScore}%)
${c.chunkText}
---
`).join('\n');

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

**Context Sections from the document (Hierarchical Retrieval):**
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

// YouTube Transcript Endpoint
app.post('/api/process/youtube', async (req, res) => {
  let videoId = null;
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing URL' });

    console.log('[YouTube] Processing URL:', url);

    // Extract Video ID
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      }
    } catch (e) {
      console.error('[YouTube] Invalid URL format:', e);
    }

    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    console.log('[YouTube] Video ID:', videoId);

    // Fetch Transcript using standalone script to avoid stability issues
    console.log('[YouTube] Executing fetch_youtube.js...');
    let stdout;
    try {
      const result = await execPromise(`node fetch_youtube.js ${videoId}`);
      stdout = result.stdout;
      console.log('[YouTube] Script execution successful');
    } catch (execError) {
      console.error('[YouTube] Script execution failed:', execError);
      throw new Error(`Script execution failed: ${execError.message}`);
    }

    let transcriptItems;
    try {
      transcriptItems = JSON.parse(stdout);
    } catch (e) {
      throw new Error('Failed to parse transcript output');
    }

    if (transcriptItems.error) {
      throw new Error(transcriptItems.error);
    }

    if (!transcriptItems || transcriptItems.length === 0) {
      throw new Error('No transcript available for this video');
    }

    // Combine text into paragraphs for Hierarchical RAG
    // Group every 15 lines (~1-2 mins) into a paragraph to provide structure
    const content = transcriptItems.reduce((acc, item, index) => {
      if (index % 15 === 0 && index !== 0) {
        return acc + '\n\n' + item.text;
      }
      return acc + ' ' + item.text;
    }, '');

    // We don't get the title from youtube-transcript, so we'll use a placeholder or try to fetch it
    // For now, a simple placeholder with ID is sufficient for the MVP
    const title = `YouTube Video (${videoId})`;

    console.log('[YouTube] Transcript fetched, length:', content.length);

    res.json({ title, content });

  } catch (err) {
    console.error('[YouTube] Error processing video:', videoId);
    console.error('[YouTube] Full Error:', err);

    if (err.message.includes('No transcript available')) {
      return res.status(400).json({ error: 'This video does not have captions/transcript available.' });
    }

    res.status(500).json({ error: `Failed to process YouTube video: ${err.message}` });
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

  const { title, content, type, isStarred } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Missing title/content' });

  try {
    const { rows } = await pool.query(
      'INSERT INTO documents (title, content, type, user_id, is_starred) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [title, content, type || 'text', userId, isStarred || false]
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

// --- STUDIO ENDPOINTS ---

app.post('/api/generate-mindmap', async (req, res) => {
  try {
    const { topic, context } = req.body;
    if (!topic) return res.status(400).json({ error: 'Missing topic' });

    const { semanticSearch } = await import('./semanticSearch.js');
    const topContexts = await semanticSearch(context, topic, 10);
    const contextText = topContexts.map(c => c.chunkText).join('\n\n');

    const prompt = `Generate a comprehensive hierarchical mindmap for the topic: "${topic}".
    
    IMPORTANT: Use the following context to generate the mindmap.
    
    Context:
    ${contextText || 'No specific context provided.'}
    
    Output strictly valid JSON with this recursive structure:
    {
      "label": "Main Topic",
      "details": "Brief description or key insight",
      "children": [
        {
          "label": "Subtopic 1",
          "details": "Detailed explanation or answer for this subtopic. DO NOT create a child node for the answer. Put the answer text HERE.",
          "children": [ ... ]
        }
      ]
    }
    
    CRITICAL RULES:
    1. "details": This field MUST contain the explanation, answer, or description for the node.
    2. "children": Use this ONLY for actual subtopics or branches. DO NOT create a child node just to hold text.
    3. Ensure the structure is deep enough (at least 3 levels) to cover the topic thoroughly.`;

    const responseText = await generateWithRetries(prompt);
    console.log('[Mindmap] Raw response:', responseText);

    let jsonStr = responseText.replace(/```json\s*|\s*```/g, '').trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    const data = JSON.parse(jsonStr);
    res.json(data);
  } catch (err) {
    console.error('[Mindmap] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate-infographic', async (req, res) => {
  try {
    const { topic, context, mode } = req.body;
    console.log(`[Infographic] Request received. Topic: "${topic}", Mode: "${mode}"`);

    if (!topic) return res.status(400).json({ error: 'Missing topic' });

    let prompt = '';

    const { semanticSearch } = await import('./semanticSearch.js');
    const topContexts = await semanticSearch(context, topic, 10);
    const contextText = topContexts.map(c => c.chunkText).join('\n\n');

    if (mode === 'advanced') {
      console.log('[Infographic] Using ADVANCED mode prompt.');
      prompt = `
    You are an expert data visualization architect.
    Generate a JSON object for an "Advanced Visualization Dashboard" about "${topic}".
    Use the provided context: ${contextText || 'No specific context provided.'}

    The output must be a valid JSON object with this structure:
    {
      "title": "String",
      "stats": [ { "label": "String", "value": "String", "icon": "String", "description": "String" } ],
      "charts": [
        { "type": "String", "title": "String", "data": [] }
      ],
      "sections": [ { "title": "String", "items": ["String"] } ]
    }

    CRITICAL RULES FOR "ADVANCED" MODE:
    1. **Chart Types**: You MUST generate **EXACTLY 4 charts** using ONLY these advanced types:
       - **"bubble"**: 3D correlation. Data: [{ "x": 10, "y": 20, "z": 100, "name": "Label", "explanation": "Why this point is here..." }]
       - **"funnel"**: Process flow or conversion. Data: [{ "name": "Stage 1", "value": 100, "fill": "#8884d8", "explanation": "What this stage means..." }]
       - **"streamgraph"**: Organic trends. Data: [{ "name": "Jan", "value": 10, "value2": 20, "value3": 30, "explanation": "Trend analysis for Jan..." }]
       - **"donut"**: Composition. Data: [{ "name": "A", "value": 10, "explanation": "Significance of A..." }]
       - **"radar"**: Multi-variable. Data: [{ "name": "A", "value": 10, "explanation": "Performance in A..." }]
    
    2. **Composition**:
       - Chart 1: MUST be a **Donut Chart** or **Radar Chart**.
       - Chart 2: MUST be a **Bubble Chart** (generate rich x,y,z data).
       - Chart 3: MUST be a **Funnel Chart** (show a logical progression, hierarchy, or filtering process).
       - Chart 4: MUST be a **Streamgraph** (generate multi-series data).

    3. **Data Richness**:
       - For Bubble: Ensure 'z' (size) varies significantly. Spread points out to avoid clustering.
       - For Funnel: Use descending values to show a clear "funnel" effect (e.g., 100 -> 80 -> 60 -> 40).
       - For Streamgraph: Use 'value', 'value2', 'value3' to create layers.
       - **"explanation"**: EVERY data point object MUST have an 'explanation' field (1-2 sentences) describing that specific point's context.
       - **"unit"**: For EACH chart, provide a 'unit' string (e.g., "Billion Users", "USD", "%", "Tons") that applies to the values.

    4. **Detailed Insights (CRITICAL)**:
       - **"detailed_analysis"**: For EACH chart, you MUST provide a 'detailed_analysis' string (2-3 sentences).
       - This text should explain *why* the data looks this way, what the *implications* are, and what the user should take away from it.
       - Do NOT just describe the numbers (e.g., "A is 10"). Analyze them (e.g., "The dominance of A suggests a strong market preference...").

    5. **Stats Section**:
       - **NO PLACEHOLDERS**: Never use "Retrieving Data..." or "Loading...". Generate plausible, specific numbers based on the context (e.g., "8.1 Billion", "$4.5 Trillion").
       - **Icons**: Use "activity", "trending-up", "bar-chart", "users".

    6. **Visuals**:
       - Do NOT use simple Bar or Pie charts. This is an ADVANCED dashboard.
       - Make the data look complex and professional.
    `;
    } else {
      console.log('[Infographic] Using STANDARD mode prompt.');
      prompt = `Generate comprehensive and detailed data for an infographic about: "${topic}".
    
    Context:
    ${contextText || 'No specific context provided.'}
    
    Output strictly valid JSON with this structure:
    {
      "title": "Infographic Title",
      "charts": [
        {
          "type": "bar", // Options: "bar", "pie", "line", "area", "radar"
          "title": "Chart Title",
          "data": [
            { "name": "Category A", "value": 10 },
            { "name": "Category B", "value": 20 }
          ]
        }
      ],
      "stats": [
        { "label": "Key Stat", "value": "100+", "description": "Brief explanation", "icon": "activity" }
      ],
      "sections": [
        {
          "title": "Section Title",
          "items": ["Fact 1", "Fact 2", "Fact 3"]
        }
      ]
    }
    
    CRITICAL INSTRUCTIONS:
    1. **Detailed Values**: Use specific, accurate numbers and data points based on the context. Avoid generic placeholders.
    2. **Professional Tone**: Ensure all text is professional and informative.
    3. **Icons**: For the "stats" section, assign one of the following icon names to the "icon" field based on the content: "activity", "users", "trending-up", "dollar-sign" (ONLY if related to money), "bar-chart", "pie-chart". Default to "activity" if unsure.
    4. **No Generic Symbols**: Do NOT include currency symbols (like $) in the "value" field unless it is specifically a monetary value.
    5. **Color Palette**: The frontend uses an orange/dark-grey theme, so ensure the data categories are suitable for this.
    6. **Visual Diversity & Composition**:
       - You MUST generate **EXACTLY 4 charts** in the "charts" array.
       - **Rule A**: You may use AT MOST **one** "bar" chart.
         3. Network Graph (Connections)
         4. Streamgraph (Trends)
       - **Goal**: The dashboard must look diverse and "cool". DO NOT repeat chart types if possible.`;
    }

    const responseText = await generateWithRetries(prompt);
    console.log('[Infographic] Raw AI Response:', responseText.slice(0, 200) + '...'); // Log start of response

    let jsonStr = responseText.replace(/```json\s*|\s*```/g, '').trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    const data = JSON.parse(jsonStr);
    console.log('[Infographic] Parsed Data Charts:', data.charts?.map(c => c.type)); // Log generated chart types
    res.json(data);
  } catch (err) {
    console.error('[Infographic] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate-slidedeck', async (req, res) => {
  try {
    const { topic, context } = req.body;
    if (!topic) return res.status(400).json({ error: 'Missing topic' });

    const { semanticSearch } = await import('./semanticSearch.js');
    const topContexts = await semanticSearch(context, topic, 10);
    const contextText = topContexts.map(c => c.chunkText).join('\n\n');

    const prompt = `Generate a comprehensive, professional 5-7 slide presentation for: "${topic}".

      Context:
    ${contextText || 'No specific context provided.'}
    
    Output strictly valid JSON with this structure:
    {
      "title": "Presentation Title",
        "subtitle": "Presentation Subtitle",
          "slides": [
            {
              "title": "Slide Title",
              "content": [
                "Detailed, comprehensive bullet point 1 (2-3 sentences)",
                "Detailed, comprehensive bullet point 2 (2-3 sentences)",
                "Detailed, comprehensive bullet point 3 (2-3 sentences)",
                "Detailed, comprehensive bullet point 4 (2-3 sentences)"
              ],
              "image_description": "A detailed visual description of an image, chart, or diagram that would perfectly illustrate this slide. Be specific about what should be shown.",
              "visual_svgs": ["<svg ...>...</svg>"] (Array containing EXACTLY 1 valid, static, detailed SVG string. Max 2000 chars.),
              "notes": "Comprehensive speaker notes explaining the slide content in depth."
            }
          ]
    }
    
    CRITICAL INSTRUCTIONS:
    1. **Detail**: The content MUST be detailed and professional. Avoid brief or generic points.
    2. **Visuals**: You MUST provide a unique, descriptive "image_description" AND a valid "visual_svgs" array for EVERY slide.
    3. **Multiple Visuals**: You MUST generate **2 to 3 distinct detailed SVGs** for each slide.
    4. **SVG Style - SMART VISUALIZATION**:
       - **IF** the slide contains **numerical data**, generate a **Professional Data Visualization** (Bar, Pie, Line, Donut). **MUST** include clear labels, axes, and legends.
       - **IF** the slide is **conceptual**, generate a **Detailed Infographic Diagram** (e.g., process flow, system architecture, mind map).
       - **Style**: Use a **Modern, Flat, Corporate Infographic Style**. Use vibrant colors (Orange, Blue, Grey) to match the theme.
    5. **Visuals**: You MUST generate **EXACTLY 1 detailed, high-quality SVG** for each slide. Do NOT generate multiple.
    6. **CLEAR LABELS**: **INCLUDE CLEAR, READABLE TEXT LABELS** for all key elements. Text **MUST** have a solid background rectangle ('<rect fill="white" opacity="0.9" ... />') or shadow to ensure readability.
    7. **NO ANIMATION**: The image must be completely static.
    8. **Structure**: Ensure a logical flow from introduction to conclusion.`;

    const responseText = await generateWithRetries(prompt);
    let jsonStr = responseText.replace(/```json\s *|\s * ```/g, '').trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    const data = repairJSON(jsonStr);
    res.json(data);
  } catch (err) {
    console.error('[Slidedeck] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate-report', async (req, res) => {
  try {
    const { topic, context, format } = req.body;
    console.log('[Report Generation] Request received:', { topic, format }); // Debug log

    let styleGuide = '';

    if (format === 'briefing_doc') {
      styleGuide = `
        **FORMAT: BRIEFING DOC**
        - **Structure**: Title, Executive Summary, Key Insights (Bulleted), Notable Quotes, Strategic Implications.
        - **Tone**: Professional, concise, high-level.
        - **Output Mapping**:
          - "title": "Briefing: [Topic]"
          - "summary": Executive Summary
          - "sections": [
            { "heading": "Key Insights", "content": "Bulleted list of critical findings..." },
            { "heading": "Notable Quotes", "content": "Direct quotes from sources..." },
            { "heading": "Strategic Implications", "content": "Analysis of impact..." }
          ]
      `;
    } else if (format === 'study_guide') {
      styleGuide = `
        **FORMAT: STUDY GUIDE**
        - **Structure**: Title, Learning Objectives, Core Concepts, Short-Answer Quiz (5 questions), Essay Questions (3 prompts), Glossary.
        - **Tone**: Educational, clear, structured.
        - **Output Mapping**:
          - "title": "Study Guide: [Topic]"
          - "summary": Learning Objectives
          - "sections": [
            { "heading": "Core Concepts", "content": "Detailed explanation of key topics..." },
            { "heading": "Short-Answer Quiz", "content": "1. Question?\\n   Answer: ...\\n2. ..." },
            { "heading": "Essay Questions", "content": "1. Prompt...\\n2. ..." },
            { "heading": "Glossary", "content": "**Term**: Definition..." }
          ]
      `;
    } else if (format === 'blog_post') {
      styleGuide = `
        **FORMAT: BLOG POST**
        - **Structure**: Catchy Title, Engaging Intro, Key Takeaways (H2s), Conclusion.
        - **Tone**: Conversational, engaging, accessible, "highly readable".
        - **Output Mapping**:
          - "title": Catchy Blog Title
          - "summary": Teaser/Intro
          - "sections": Body paragraphs with engaging headings.
      `;
    } else if (format === 'executive_summary') {
      styleGuide = `
        **FORMAT: EXECUTIVE SUMMARY**
        - **Structure**: Title, Overview, Key Findings, Business Impact, Recommendations.
        - **Tone**: Formal, business-centric, concise.
      `;
    } else if (format === 'technical_whitepaper') {
      styleGuide = `
        **FORMAT: TECHNICAL WHITEPAPER**
        - **Structure**: Title, Abstract, Technical Architecture, Implementation Details, Challenges & Solutions, Conclusion.
        - **Tone**: Highly technical, detailed, authoritative.
      `;
    } else if (format === 'explanatory_article') {
      styleGuide = `
        **FORMAT: EXPLANATORY ARTICLE**
        - **Structure**: Title, The "Simple Analogy" (Explain like I'm 5), Deep Dive, Real-World Examples.
        - **Tone**: Educational, simple, illustrative.
      `;
    } else if (format === 'concept_breakdown') {
      styleGuide = `
        **FORMAT: CONCEPT BREAKDOWN**
        - **Structure**: Title, The Problem, The Solution, How It Works, Key Benefits.
        - **Tone**: Analytical, problem-solution oriented.
      `;
    } else {
      styleGuide = `
        **FORMAT: STANDARD PROFESSIONAL REPORT**
        - **Structure**: Title, Executive Summary, Detailed Sections.
        - **Tone**: Formal, comprehensive, business-like.
      `;
    }

    const { semanticSearch } = await import('./semanticSearch.js');
    const topContexts = await semanticSearch(context, topic, 10);
    const contextText = topContexts.map(c => c.chunkText).join('\n\n');

    const prompt = `Generate a content piece for: "${topic}".
    
    Context:
    ${contextText || 'No specific context provided.'}
    
    ${styleGuide}

    Output strictly valid JSON with this structure:
    {
      "title": "String",
      "summary": "String",
      "sections": [
        {
          "heading": "String",
          "content": "String (Markdown supported)",
          "chart": { // OPTIONAL: Only include if the section involves numerical data comparison or trends.
            "type": "bar", // Options: "bar", "pie", "line", "area", "donut"
            "title": "Descriptive Chart Title",
            "description": "A clear, 1-2 sentence explanation of what this data shows and the key insight.",
            "xAxisLabel": "Label for X Axis (e.g., Year, Category)",
            "yAxisLabel": "Label for Y Axis (e.g., Revenue in $M, Percentage)",
            "data": [
              { "name": "Specific Label A", "value": 10 },
              { "name": "Specific Label B", "value": 20 }
            ]
          }
        }
      ]
    }
    
    CRITICAL INSTRUCTIONS:
    1. **Detail**: The content MUST be detailed and follow the requested **${format || 'standard'}** format.
    2. **Charts REQUIRED**: You **MUST** include a "chart" object for **AT LEAST ONE** section if data permits.
    3. **Chart Quality**: 
       - **Labels**: Use descriptive names for data points (e.g., "Q1 2024" instead of "Q1").
       - **Context**: The "description" field MUST explain the chart's significance so a user understands the concept just by looking at it.
    4. **Professionalism**: Maintain high professional standards.`;

    const responseText = await generateWithRetries(prompt);
    console.log('[Report] Raw AI Response (Preview):', responseText.slice(0, 500)); // Log for debug

    // Robust JSON extraction
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[Report] JSON Parse Error:', parseError);
      console.error('[Report] Failed JSON String:', jsonStr);
      return res.status(500).json({ error: 'Failed to generate valid report format. Please try again.' });
    }

    // Validate structure
    if (!data.title || !data.sections) {
      return res.status(500).json({ error: 'Generated report is missing required fields.' });
    }

    console.log('[Report] Generated Sections:', data.sections?.length);
    console.log('[Report] Sections with Charts:', data.sections?.filter(s => s.chart).length); // Log chart count
    res.json(data);
  } catch (err) {
    console.error('[Report] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Regenerate a specific visual
app.post('/api/regenerate-visual', async (req, res) => {
  try {
    const { slide_content, user_instruction, current_visual_description } = req.body;

    let prompt = `
        You are an expert SVG illustrator.
        
        CONTEXT:
        The user is creating a slide with the following content:
        "${slide_content}"

        TASK:
        Generate a SINGLE, detailed, professional SVG image to illustrate this slide.
        
        CRITICAL INSTRUCTIONS:
        1. **Style**: Create a **Modern, Flat, Corporate Infographic Diagram** or **Data Visualization**. Use vibrant colors (Orange, Blue, Grey).
        2. **NO ANIMATION**: The SVG must be completely static.
        3. **CLEAR LABELS**: **INCLUDE CLEAR, READABLE TEXT LABELS** for all key elements. Text **MUST** have a solid background rectangle ('<rect fill="white" opacity="0.9" ... />') or shadow.
        4. **Output**: Return ONLY the raw SVG code. No markdown, no json, no explanations.
        `;

    if (user_instruction) {
      prompt += `
            USER INSTRUCTION (PRIORITY):
            "${user_instruction}"
            
            Follow the user's instruction PRECISELY. If they ask for a chart, make a chart. If they ask for a specific scene, draw that scene.
            `;
    } else {
      prompt += `
            GOAL:
            Create a distinct variation of the visual.
            Current description: "${current_visual_description || 'N/A'}"
            
            Make it different but still highly relevant to the slide content.
            `;
    }

    const responseText = await generateWithRetries(prompt);

    // Clean up response
    let svg = responseText.replace(/```svg|```/g, '').trim();
    // Ensure it starts with <svg
    const svgStart = svg.indexOf('<svg');
    const svgEnd = svg.lastIndexOf('</svg>');
    if (svgStart !== -1 && svgEnd !== -1) {
      svg = svg.substring(svgStart, svgEnd + 6);
    }

    res.json({ visual_svg: svg });

  } catch (error) {
    console.error('Error regenerating visual:', error);
    res.status(500).json({ error: 'Failed to regenerate visual' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT} `);
});
