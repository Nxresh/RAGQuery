import dotenv from 'dotenv';
// dotenv.config({ path: '.env.local' });
dotenv.config();

// Sentry for monitoring (only if DSN is configured)
import * as Sentry from '@sentry/node';
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
    integrations: [],
  });
  console.log('📊 Sentry monitoring initialized');
}
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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { parsePDFWithMetadata, parseDocxWithMetadata, parseTextWithMetadata, generateVersionId } from './services/pdfParser.js';
import { logQuery, extractCitations } from './services/auditLogger.js';
import { expandQuery, decomposeQuery, generateHypotheticalAnswer, stepBackQuery, analyzeQueryComplexity, transformQuery } from './services/queryTransformer.js';

// ============================================================
// BULLETPROOF SECURITY - Import Security Middleware
// ============================================================
import security, {
  rateLimiters,
  validateRequest,
  securityHeaders,
  sanitizeRequestBody,
  sanitizeQueryParams,
  sanitizeUrlParams,
  validateFileUpload,
  detectSuspiciousActivity,
  validateEnvironment,
  deepSanitize,
  lightSanitize,
} from './services/securityMiddleware.js';

// Validate environment variables at startup (will exit if critical vars missing)
validateEnvironment();

const execPromise = util.promisify(exec);
const app = express();
const PORT = process.env.PORT || 5190;

// Initialize PostgreSQL Connection Pool
// Support Railway's DATABASE_URL or individual env vars for local dev
const pool = process.env.DATABASE_URL
  ? new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })
  : new pg.Pool({
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

// ============================================================
// BULLETPROOF SECURITY MIDDLEWARE STACK
// ============================================================

// 1. Security Headers (Helmet) - Must be first
app.use(securityHeaders);

// 2. CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin.split(','), // Allows multiple origins via comma-separated list
  credentials: true
}));

// 3. Body parsers with size limits
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Suspicious Activity Detection - Log and block attackers
app.use(detectSuspiciousActivity);

// 5. Input Sanitization - Deep clean all incoming data
app.use(sanitizeRequestBody);
app.use(sanitizeQueryParams);
app.use(sanitizeUrlParams);

// 6. Multi-tier Rate Limiting
// Global rate limit for all API routes (100 req/min)
app.use('/api/', rateLimiters.global);

// Stricter rate limits for sensitive endpoints
app.use('/api/auth/', rateLimiters.auth);        // 10 req/15min (brute force protection)
app.use('/api/upload', rateLimiters.upload);     // 10 uploads/min
app.use('/api/process/', rateLimiters.upload);   // 10 file processes/min
app.use('/api/generate-mindmap', rateLimiters.aiGeneration);  // 20 AI calls/min
app.use('/api/generate-infographic', rateLimiters.aiGeneration);
app.use('/api/generate-slidedeck', rateLimiters.aiGeneration);
app.use('/api/generate-report', rateLimiters.aiGeneration);
app.use('/api/regenerate-visual', rateLimiters.aiGeneration);
app.use('/api/agents/', rateLimiters.aiGeneration);     // 20 AI calls/min
app.use('/api/chat/', rateLimiters.aiGeneration);       // 20 AI calls/min
app.use('/api/proxy', rateLimiters.search);             // 50 searches/min

console.log('🛡️  Bulletproof security middleware initialized');
console.log('   ├─ Security headers (Helmet)');
console.log('   ├─ Suspicious activity detection');
console.log('   ├─ Deep input sanitization (XSS/SQL/NoSQL)');
console.log('   ├─ Multi-tier rate limiting');
console.log('   └─ Request validation enabled');


// ============================================================
// JWT AUTHENTICATION SECURITY
// ============================================================
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'ares-enterprise-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Generate JWT token
function generateToken(userId, email) {
  return jwt.sign(
    { userId, email, iat: Date.now() },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// JWT Authentication Middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check for Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log('[JWT] Token verification failed:', err.message);
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = decoded;
      next();
    });
  }
  // Fallback to X-User-Id header for backward compatibility
  else if (req.headers['x-user-id']) {
    req.user = { userId: req.headers['x-user-id'] };
    next();
  }
  else {
    return res.status(401).json({ error: 'Authentication required' });
  }
}

// Optional JWT check (doesn't fail if no token, just sets req.user if valid)
function optionalJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err) req.user = decoded;
      next();
    });
  } else if (req.headers['x-user-id']) {
    req.user = { userId: req.headers['x-user-id'] };
    next();
  } else {
    next();
  }
}

// Input sanitization helper
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[<>]/g, (c) => c === '<' ? '&lt;' : '&gt;'); // Escape angle brackets
}

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', security: 'enterprise-jwt' });
});

// Debug endpoint for Railway deployment - check dist folder
// NOTE: Using inline requires since fs/path may not be imported yet in module order

app.get('/api/debug-dist', (_req, res) => {
  const distPath = path.join(__dirname, 'dist');
  const indexPath = path.join(distPath, 'index.html');

  const result = {
    __dirname,
    distPath,
    distExists: fs.existsSync(distPath),
    indexExists: fs.existsSync(indexPath),
    distContents: null,
    cwd: process.cwd(),
    cwdContents: null
  };

  if (result.distExists) {
    try {
      result.distContents = fs.readdirSync(distPath);
    } catch (e) {
      result.distContents = `Error: ${e.message}`;
    }
  }

  try {
    result.cwdContents = fs.readdirSync(process.cwd());
  } catch (e) {
    result.cwdContents = `Error: ${e.message}`;
  }

  res.json(result);
});

// ============================================================
// JWT TOKEN ENDPOINTS
// ============================================================

// Exchange Firebase UID for backend JWT (Hybrid Auth)
app.post('/api/auth/token', validateRequest('POST /api/auth/token'), async (req, res) => {
  try {
    const { uid, email } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ error: 'Missing uid or email' });
    }

    // Verify user exists in our database
    const { rows } = await pool.query(
      'SELECT * FROM user_details WHERE firebase_uid = $1',
      [uid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found. Please sign up first.' });
    }

    // Generate JWT token
    const token = generateToken(uid, email);

    console.log('[JWT] Token issued for user:', email);

    res.json({
      token,
      expiresIn: JWT_EXPIRES_IN,
      user: {
        id: rows[0].id,
        email: rows[0].email,
        firstName: rows[0].first_name,
        lastName: rows[0].last_name
      }
    });
  } catch (err) {
    console.error('[JWT] Token generation error:', err);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Verify JWT token (for frontend validation)
app.get('/api/auth/verify', authenticateJWT, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Refresh JWT token
app.post('/api/auth/refresh', authenticateJWT, (req, res) => {
  try {
    const newToken = generateToken(req.user.userId, req.user.email);
    res.json({ token: newToken, expiresIn: JWT_EXPIRES_IN });
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// ============================================================
// SMART AI-POWERED QUERY SUGGESTIONS
// ============================================================

// Generate intelligent query suggestions based on source content
app.post('/api/suggestions', validateRequest('POST /api/suggestions'), async (req, res) => {
  try {
    const { sourceIds, userId, featureType, featureContext } = req.body;

    if (!sourceIds || sourceIds.length === 0) {
      // Feature-specific fallback suggestions when no sources are selected
      let fallbackSuggestions;
      if (featureType === 'studio') {
        if (featureContext?.includes('mind map')) {
          fallbackSuggestions = ["Brainstorm project ideas", "Map out a strategy", "Visualize key concepts", "Create topic overview"];
        } else if (featureContext?.includes('infographic')) {
          fallbackSuggestions = ["Show key statistics", "Create a timeline", "Compare options visually", "Visualize data trends"];
        } else if (featureContext?.includes('slide')) {
          fallbackSuggestions = ["Outline a pitch deck", "Create intro slides", "Build presentation structure", "Summarize key points"];
        } else if (featureContext?.includes('report')) {
          fallbackSuggestions = ["Create executive summary", "Draft detailed analysis", "Build comprehensive report", "Compile key findings"];
        } else {
          fallbackSuggestions = ["Generate visual content", "Create presentation", "Build infographic", "Design mind map"];
        }
      } else if (featureType === 'agents') {
        if (featureContext?.includes('YouTube')) {
          fallbackSuggestions = ["Summarize this video", "Extract key points", "List main topics", "Find actionable insights"];
        } else if (featureContext?.includes('Confluence')) {
          fallbackSuggestions = ["Generate SOP document", "Create knowledge article", "Draft how-to guide", "Build documentation"];
        } else {
          fallbackSuggestions = ["Analyze content", "Generate documentation", "Extract insights", "Create summary"];
        }
      } else {
        fallbackSuggestions = [
          "What are the key points in this document?",
          "Summarize the main topics",
          "What are the most important details?",
          "Explain the core concepts"
        ];
      }
      return res.json({ suggestions: fallbackSuggestions });
    }

    // Get content from selected sources (first 3000 chars of each, max 3 sources)
    const limitedIds = sourceIds.slice(0, 3);
    console.log('[Suggestions] Querying DB for sourceIds:', limitedIds, 'userId:', userId);
    const { rows } = await pool.query(
      `SELECT title, SUBSTRING(content, 1, 3000) as content FROM documents 
       WHERE id = ANY($1) AND (user_id = $2 OR user_id IS NULL)`,
      [limitedIds, userId || 'anonymous']
    );
    console.log('[Suggestions] DB returned', rows.length, 'rows');

    if (rows.length === 0) {
      // Same feature-specific fallback when no documents found
      console.log('[Suggestions] No documents found, using fallback for featureType:', featureType);
      let fallbackSuggestions;
      if (featureType === 'studio') {
        fallbackSuggestions = ["Generate visual content", "Create presentation", "Build infographic", "Design mind map"];
      } else if (featureType === 'agents') {
        fallbackSuggestions = ["Analyze content", "Generate documentation", "Extract insights", "Create summary"];
      } else {
        fallbackSuggestions = ["What are the key points?", "Summarize this content", "What are the main themes?", "List important details"];
      }
      return res.json({ suggestions: fallbackSuggestions });
    }

    // Combine source content for analysis
    const combinedContent = rows.map(r => `[${r.title}]: ${r.content}`).join('\n\n');

    // Define sources for the prompt
    const sources = rows.map(r => ({ title: r.title, content: r.content }));
    const contentPreview = combinedContent;

    // Use AI to generate smart suggestions
    let suggestionPrompt;
    if (sources.length > 0) {
      // Determine the output format based on feature type
      let outputInstructions;
      if (featureType === 'studio') {
        if (featureContext?.includes('mind map')) {
          outputInstructions = `Generate 4 TOPIC INPUTS for a Mind Map generator based on the document content.
These should be topics/concepts the user would type to create a mind map visualization.
Examples: "AI Evolution and Branches", "Machine Learning Fundamentals", "Neural Network Architecture"
Format: Short noun phrases (2-5 words) representing concepts to map visually.`;
        } else if (featureContext?.includes('infographic')) {
          outputInstructions = `Generate 4 TOPIC INPUTS for an Infographic generator based on the document content.
These should be data-focused topics the user would type to create visual data representations.
Examples: "AI Adoption Statistics 2024", "ML vs DL Comparison", "Industry AI Use Cases"
Format: Short phrases that would work as infographic titles with data potential.`;
        } else if (featureContext?.includes('slide')) {
          outputInstructions = `Generate 4 TOPIC INPUTS for a Slide Deck generator based on the document content.
These should be presentation topics the user would type to create slides.
Examples: "Introduction to Machine Learning", "AI Ethics Overview", "Deep Learning Applications"
Format: Presentation title style (3-6 words).`;
        } else if (featureContext?.includes('report')) {
          outputInstructions = `Generate 4 TOPIC INPUTS for a Report generator based on the document content.
These should be report topics the user would type to create detailed documentation.
Examples: "Comprehensive AI Analysis", "Machine Learning Implementation Guide", "AI Trends Report"
Format: Report title style (3-6 words).`;
        } else {
          outputInstructions = `Generate 4 TOPIC INPUTS for content generation based on the documents.
Format: Short topic phrases (2-5 words).`;
        }
      } else if (featureType === 'agents') {
        if (featureContext?.includes('YouTube')) {
          outputInstructions = `Generate 4 QUERY INPUTS for a YouTube video analysis agent.
These are questions/requests the user would ask about a video transcript.
Examples: "Summarize the main points", "List all tools mentioned", "What are the key takeaways?"
Format: Action-oriented questions/requests about video content.`;
        } else if (featureContext?.includes('Confluence')) {
          outputInstructions = `Generate 4 INSTRUCTION INPUTS for a Confluence documentation agent.
These are instructions the user would give to generate documentation.
Examples: "Create SOP for deployment process", "Draft technical specification", "Generate how-to guide"
Format: Documentation creation instructions.`;
        } else {
          outputInstructions = `Generate 4 QUERY INPUTS for an agent based on the documents.
Format: Action-oriented requests.`;
        }
      } else {
        // Chat - generate analytical questions
        outputInstructions = `Generate 4 ANALYTICAL QUESTIONS about the document content.
These are questions the user would ask to explore and understand the content.
Examples: "What are the key points?", "Compare X and Y", "Explain the main concept"
Format: Thoughtful questions that encourage deep analysis.`;
      }

      // Check if multiple sources are selected
      const isMultiSource = sources.length > 1;
      const multiSourceContext = isMultiSource
        ? `\nIMPORTANT: Multiple documents (${sources.length}) are selected. Focus on:
- COMMON THEMES shared across all documents
- CROSS-DOCUMENT comparisons and connections  
- SEMANTIC OVERLAP and shared concepts
- Questions that synthesize information from multiple sources`
        : '';

      suggestionPrompt = `You are an AI assistant helping users generate content from their documents.

DOCUMENTS (${sources.length}):
${sources.map(s => `- "${s.title}"`).join('\n')}

CONTENT PREVIEW:
${contentPreview.substring(0, 800)}
${multiSourceContext}

TASK:
${outputInstructions}

RULES:
- Base suggestions on ACTUAL CONTENT from the documents
${isMultiSource ? '- Focus on COMMON THEMES and SHARED CONCEPTS across all documents' : '- Each suggestion must be UNIQUE and SPECIFIC to the content'}
${isMultiSource ? '- Suggestions should encourage CROSS-DOCUMENT ANALYSIS' : ''}
- Keep each suggestion under 8 words
- Return EXACTLY 4 suggestions as a JSON array: ["suggestion1", "suggestion2", "suggestion3", "suggestion4"]
`;
    } else {
      // No content - Suggest generic but feature-specific actions
      suggestionPrompt = `
You are an expert AI assistant.
Generate 4 feature-specific suggestions for the "${featureContext || 'General'}" feature.
No documents are selected, so suggest general templates or starting points.

Examples:
- Mind Map: "Brainstorm project ideas", "Map out a marketing strategy"
- YouTube: "Analyze this video URL", "Find key topics in video"

Output strictly as a JSON array of strings.
`;
    }

    let suggestions = [
      "What are the key points?",
      "Summarize the main topics",
      "Explain the core concepts",
      "List important details"
    ];

    try {
      // Call AI for smart suggestions
      if (USE_OPENROUTER) {
        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5173'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages: [{ role: 'user', content: suggestionPrompt }],
            max_tokens: 300
          })
        });

        if (aiResponse.ok) {
          const data = await aiResponse.json();
          const content = data.choices?.[0]?.message?.content || '';

          // Parse JSON array from response
          const match = content.match(/\[[\s\S]*\]/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (Array.isArray(parsed) && parsed.length >= 4) {
              suggestions = parsed.slice(0, 4);
              console.log('[Suggestions] AI generated:', suggestions);
            }
          }
        }
      }
    } catch (aiErr) {
      console.error('[Suggestions] AI error, using defaults:', aiErr.message);
    }

    res.json({ suggestions });

  } catch (err) {
    console.error('[Suggestions] Error:', err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Check for OpenRouter API key (preferred) or Google API key (fallback)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GOOGLE_API_KEY = process.env.API_KEY;

if (!OPENROUTER_API_KEY && !GOOGLE_API_KEY) {
  console.error('ERROR: No API key found. Set OPENROUTER_API_KEY or API_KEY in .env');
  process.exit(1);
}

// Determine which provider to use
const USE_OPENROUTER = !!OPENROUTER_API_KEY;
console.log(`🤖 Using AI Provider: ${USE_OPENROUTER ? 'OpenRouter' : 'Google Gemini'}`);

// OpenRouter API call function
async function callOpenRouter(prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'RAGQuery App'
    },
    body: JSON.stringify({
      model: 'qwen/qwen-2.5-7b-instruct', // Very cheap: ~$0.0001/1K tokens
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response generated';
}

// Google Gemini fallback (if OpenRouter not available)
let genAI, model;
if (!USE_OPENROUTER) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Fastest model
}

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

// Initialize embeddings for semantic search (only if Google API key is available)
import { initEmbeddings } from './semanticSearch.js';
if (GOOGLE_API_KEY) {
  initEmbeddings(GOOGLE_API_KEY);
  console.log('✅ Semantic search initialized');
} else {
  console.log('⚠️ Semantic search disabled (no Google API key for embeddings)');
}

const upload = multer({ storage: multer.memoryStorage() });

// Helper to call the model with retries
// Helper to call the model with retries
async function generateWithRetries(prompt, maxAttempts = 5) {
  let attempt = 0;
  const fs = require('fs');
  const logFile = 'api_debug_error.log';

  const log = (msg) => {
    console.log(msg);
    try {
      fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);
    } catch (e) { /* ignore file write errors */ }
  };

  log(`[API] generateWithRetries called. Prompt length: ${prompt.length}`);

  while (true) {
    try {
      log(`[API] Attempt ${attempt + 1}/${maxAttempts} starting...`);

      let responseText;
      if (USE_OPENROUTER) {
        // Use OpenRouter
        responseText = await callOpenRouter(prompt);
      } else {
        // Use Google Gemini
        const result = await model.generateContent(prompt);
        const response = await result.response;
        responseText = response.text();
      }

      log(`[API] Attempt ${attempt + 1} success.`);
      return responseText;
    } catch (err) {
      attempt += 1;
      const isRateLimit = err.message?.includes('429') || err.status === 429;

      log(`[API] Model call failed (attempt ${attempt}/${maxAttempts}): ${err?.message || err}`);

      const isLast = attempt >= maxAttempts;
      if (isLast) throw err;

      let delay = 2000 * Math.pow(2, attempt - 1); // Default backoff

      // Smart Retry: Extract retryDelay from error message if available
      if (isRateLimit) {
        // Check for JSON format: "retryDelay":"38s"
        let match = err.message?.match(/retryDelay":"([\d\.]+)s"/);
        // Check for text format: "Please retry in 30.226s"
        if (!match) match = err.message?.match(/Please retry in ([\d\.]+)s/);

        if (match && match[1]) {
          const serverWait = parseFloat(match[1]) * 1000;
          log(`[API] Rate Limit detected. Server requested wait: ${serverWait}ms`);
          // Add a small buffer (2s) to be safe
          delay = serverWait + 2000;
        } else {
          // Fallback if we can't parse it but know it's a rate limit
          delay = 10000 * attempt;
        }
      }

      log(`[API] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// RAG endpoint
app.post('/api/proxy', validateRequest('POST /api/proxy'), async (req, res) => {
  try {
    const { action, payload } = req.body;
    console.log(`[Proxy] Action: ${action}`);

    if (!action) return res.status(400).json({ error: 'Missing action' });

    if (action === 'rag') {
      const { documentContent, query, documentIds, userId, enableAdvancedTransforms } = payload;
      if (!documentContent || !query) return res.status(400).json({ error: 'Missing documentContent or query' });

      const startTime = Date.now();
      console.log('[RAG] Starting semantic search...');
      console.log('[RAG] Document length:', documentContent.length, 'characters');
      console.log('[RAG] Original Query:', query);

      try {
        // Analyze query complexity for intelligent transformation
        const complexity = analyzeQueryComplexity(query);
        console.log('[RAG] Query analysis:', JSON.stringify(complexity.suggestedTransforms));

        // Apply query transformation based on complexity
        let searchQuery = query;
        let transformationUsed = 'none';
        let subQuestions = null;
        let hypotheticalAnswer = null;

        // Always expand vague queries
        if (complexity.isVague || complexity.suggestedTransforms.expansion) {
          try {
            searchQuery = await expandQuery(query, generateWithRetries);
            transformationUsed = 'expansion';
          } catch (e) {
            console.log('[RAG] Query expansion failed, using original');
          }
        }

        // For complex multi-part questions, decompose into sub-questions
        if (enableAdvancedTransforms && complexity.suggestedTransforms.decomposition) {
          try {
            subQuestions = await decomposeQuery(query, generateWithRetries);
            if (subQuestions.length > 1) {
              transformationUsed = 'decomposition';
              console.log('[RAG] Decomposed into', subQuestions.length, 'sub-questions');
            }
          } catch (e) {
            console.log('[RAG] Decomposition failed');
          }
        }

        // For non-technical questions, use HyDE (opt-in due to cost)
        if (enableAdvancedTransforms && complexity.suggestedTransforms.hyde) {
          try {
            hypotheticalAnswer = await generateHypotheticalAnswer(query, generateWithRetries);
            transformationUsed = 'hyde';
          } catch (e) {
            console.log('[RAG] HyDE failed');
          }
        }

        console.log('[RAG] Transformation used:', transformationUsed);
        console.log('[RAG] Search query:', searchQuery.substring(0, 100) + '...');

        // Use semantic search with the transformed query
        const { semanticSearch } = await import('./semanticSearch.js');

        // Use hypothetical answer for search if HyDE was applied
        const queryForSearch = hypotheticalAnswer || searchQuery;
        const topChunks = await semanticSearch(documentContent, queryForSearch, 3);

        // If sub-questions exist, optionally run additional searches
        let additionalContext = '';
        if (subQuestions && subQuestions.length > 1) {
          console.log('[RAG] Running searches for sub-questions...');
          for (const subQ of subQuestions.slice(1, 3)) { // Limit to 2 additional
            const subChunks = await semanticSearch(documentContent, subQ, 1);
            if (subChunks.length > 0) {
              additionalContext += `\n\n### Additional Context for: "${subQ}"\n${subChunks[0].chunkText}`;
            }
          }
        }

        console.log('[RAG] Semantic search complete');
        console.log('[RAG] Top Parent Contexts count:', topChunks.length);
        console.log('[RAG] Top relevance scores:', topChunks.map(c => c.relevanceScore + '%').join(', '));

        // Enhanced context with source indexing for citations
        const topChunksText = topChunks.map((c, i) => `
---
### [Source ${i + 1}]${c.pageNumber ? ` (Page ${c.pageNumber})` : ''}${c.sectionId ? ` §${c.sectionId}` : ''} - Relevance: ${c.relevanceScore}%
${c.chunkText}
---
`).join('\n');

        // Check if multiple sources are involved
        const uniqueSourceCount = new Set(topChunks.map(c => c.documentId || c.documentTitle)).size;
        const isMultiSource = uniqueSourceCount > 1;

        const multiSourceInstructions = isMultiSource ? `
5. **MULTI-SOURCE SYNTHESIS (CRITICAL - ${uniqueSourceCount} sources detected)**:
   - You MUST use information from ALL ${uniqueSourceCount} sources in your answer
   - COMPARE and CONTRAST information across different sources
   - IDENTIFY common themes, agreements, or contradictions between sources
   - SYNTHESIZE insights by combining information from multiple sources
   - DO NOT just answer from one source - integrate ALL sources
   - If sources have different perspectives, present both with citations` : '';

        const synthesisPrompt = `You are an expert AI research assistant. Your task is to provide COMPREHENSIVE, DETAILED answers based on the provided document sources.

**CRITICAL RESPONSE REQUIREMENTS:**

1. **LENGTH & DEPTH (IMPORTANT)**:
   - Provide THOROUGH, IN-DEPTH explanations - NOT short summaries
   - Aim for at least 300-500 words in your response
   - Explain the "what", "why", "how", and implications
   - Include relevant details, examples, and context from the sources
   - DO NOT be concise - be COMPREHENSIVE

2. **STRUCTURE (MANDATORY)**:
   - Start with a clear **# Main Title** (H1) summarizing the topic
   - Use **## Section Headings** (H2) to organize your answer into logical parts
   - Use **### Subsections** (H3) for detailed breakdowns if needed
   - Use **numbered lists (1., 2., 3.)** for processes, steps, or key points
   - Use **bullet points (-)** for related items or features
   - Use **bold text** for key terms and important concepts

3. **INLINE CITATIONS (CRITICAL)**:
   - EVERY factual claim MUST have a citation: **[Source X, p.Y]** or **[Source X]**
   - Example: "The policy requires annual reviews [Source 1, p.5]"
   - Cite the specific source number from the context sections below
   - If information comes from multiple sources, cite ALL of them

4. **SOURCES SECTION (REQUIRED AT END)**:
   After your main answer, include a "## Sources Used" section listing:
   - Each source number, page (if available), and a brief description of what it contributed
   - Example: "- **Source 1 (Page 5)**: Provided policy requirements for annual reviews"

5. **QUALITY GUIDELINES**:
   - Never say "the document says" without specifying WHICH source
   - Explain complex concepts in accessible terms
   - Connect ideas and show relationships between points
   - If sources contain different perspectives, present ALL of them${multiSourceInstructions}

**CONTEXT SECTIONS FROM YOUR KNOWLEDGE BASE:**
${topChunksText}
${additionalContext}

**USER'S QUESTION:** ${query}

**YOUR COMPREHENSIVE ANSWER (Remember: Be detailed, use headings, cite ALL sources):**`;

        console.log('[RAG] Generating synthesis with citations...');
        const synthesizedAnswer = await generateWithRetries(synthesisPrompt);
        console.log('[RAG] Synthesis successful');
        console.log('[RAG] Answer preview:', synthesizedAnswer.substring(0, 100) + '...');

        // Calculate latency
        const latencyMs = Date.now() - startTime;

        // Enrich chunks with metadata for frontend
        const enrichedChunks = topChunks.map((c, idx) => ({
          ...c,
          sourceIndex: idx + 1,
          documentId: c.documentId || null,
          documentTitle: c.documentTitle || null,
          pageNumber: c.pageNumber || null,
          sectionId: c.sectionId || null
        }));

        // Log to audit trail (async, don't wait)
        if (userId) {
          logQuery(pool, {
            userId,
            queryText: query,
            retrievedChunkIds: enrichedChunks.map(c => c.chunkId).filter(Boolean),
            chunksFedToModel: enrichedChunks.map(c => c.chunkId).filter(Boolean),
            citedChunkIds: [], // Would need to parse response for citations
            modelResponse: synthesizedAnswer,
            documentIds: documentIds || [],
            latencyMs
          }).catch(err => console.error('[Audit] Failed:', err.message));
        }

        return res.status(200).json({
          synthesizedAnswer,
          rankedChunks: enrichedChunks,
          latencyMs
        });
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

        const topChunks = scoredChunks.sort((a, b) => b.score - a.score).slice(0, 5).map((c, idx) => ({
          relevanceScore: c.score,
          chunkText: c.text,
          sourceIndex: idx + 1
        }));

        // Fallback: Generate synthesis using keyword-matched chunks
        console.log('[RAG] Fallback: Attempting synthesis with keyword chunks...');
        const fallbackContext = topChunks.map((c, i) => `
---
### [Source ${i + 1}] - Relevance: ${c.relevanceScore}%
${c.chunkText}
---
`).join('\n');

        const fallbackPrompt = `You are an expert AI research assistant. Your task is to provide COMPREHENSIVE, DETAILED answers based on the provided context.

**CRITICAL RESPONSE REQUIREMENTS:**

1. **LENGTH & DEPTH (IMPORTANT)**:
   - Provide THOROUGH, IN-DEPTH explanations - NOT short summaries
   - Aim for at least 300-500 words in your response
   - Explain the "what", "why", "how", and implications
   - DO NOT be concise - be COMPREHENSIVE

2. **STRUCTURE (MANDATORY)**:
   - Start with a clear **# Main Title** (H1) summarizing the topic
   - Use **## Section Headings** (H2) to organize your answer into logical parts
   - Use **### Subsections** (H3) for detailed breakdowns if needed
   - Use **numbered lists (1., 2., 3.)** for processes, steps, or key points
   - Use **bullet points (-)** for related items or features
   - Use **bold text** for key terms and important concepts

3. **INLINE CITATIONS (CRITICAL)**:
   - EVERY factual claim MUST have a citation: **[Source X]**
   - Example: "The policy requires annual reviews [Source 1]"
   - Cite the specific source number from the context sections below

4. **SOURCES SECTION (REQUIRED AT END)**:
   After your main answer, include a "## Sources Used" section listing:
   - Each source number and a brief description of what it contributed

**CONTEXT SECTIONS:**
${fallbackContext}

**USER'S QUESTION:** ${query}

**YOUR COMPREHENSIVE ANSWER (Remember: Be detailed, use headings, cite ALL sources):**`;

        try {
          const fallbackAnswer = await generateWithRetries(fallbackPrompt);
          console.log('[RAG] Fallback synthesis successful');
          return res.status(200).json({ synthesizedAnswer: fallbackAnswer, rankedChunks: topChunks });
        } catch (fallbackErr) {
          console.error('[RAG] Fallback synthesis also failed:', fallbackErr.message);
          return res.status(200).json({
            synthesizedAnswer: `Found ${topChunks.length} relevant passages, but failed to generate summary due to API rate limits. Please wait a moment and try again.`,
            rankedChunks: topChunks
          });
        }
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
app.post('/api/process/youtube', validateRequest('POST /api/process/youtube'), async (req, res) => {
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

// ============================================================
// IMAGE PROCESSING - OCR + Person Recognition + Scene Analysis
// ============================================================
app.post('/api/process/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    console.log(`[Image] Processing: ${req.file.originalname} (${req.file.mimetype})`);

    // Convert image to base64
    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const analysisPrompt = `Analyze this image and describe what you see in a natural, flowing way.

Your description should include:
1. Any text visible in the image (preserve document structure if applicable)
2. If there are people: describe their appearance, and if they appear to be a celebrity or public figure, mention who they might be naturally (e.g., "The image shows Elon Musk standing at a podium...")
3. The setting, environment, and any notable objects or landmarks
4. The overall context and mood of the image

Write your response as a cohesive description, NOT with section headers. Make it read naturally like you're describing the image to someone. Be thorough but conversational.`;

    let extractedText;

    if (USE_OPENROUTER) {
      // Use OpenRouter with a vision-capable model
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${imageBase64}`
                  }
                },
                {
                  type: 'text',
                  text: analysisPrompt
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'OpenRouter vision call failed');
      }

      const data = await response.json();
      extractedText = data.choices[0]?.message?.content || 'No analysis generated';
    } else {
      // Use Google Gemini SDK
      const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await visionModel.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64
          }
        },
        analysisPrompt
      ]);
      extractedText = result.response.text();
    }

    console.log('[Image] Analysis complete, length:', extractedText.length);
    res.json({ text: extractedText, filename: req.file.originalname });

  } catch (err) {
    console.error('[Image] Error:', err);
    res.status(500).json({ error: `Image processing failed: ${err.message}` });
  }
});

// ============================================================
// AUDIO PROCESSING - Transcription
// ============================================================
app.post('/api/process/audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio uploaded' });
    }

    console.log(`[Audio] Processing: ${req.file.originalname} (${req.file.mimetype})`);

    // For audio, we'll use a text prompt to describe what we need
    // Note: OpenRouter/Gemini audio support may be limited
    const audioBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    let transcript;

    if (!USE_OPENROUTER && genAI) {
      // Use Google Gemini SDK for audio (has better audio support)
      const audioModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await audioModel.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: audioBase64
          }
        },
        "Transcribe this audio recording. Return the full transcript text only."
      ]);
      transcript = result.response.text();
    } else {
      // Fallback: inform user that audio transcription requires Google API
      transcript = "Audio transcription is currently only supported with Google Gemini API. Please configure API_KEY in your .env file.";
    }

    console.log('[Audio] Transcribed, length:', transcript.length);
    res.json({ transcript, filename: req.file.originalname });

  } catch (err) {
    console.error('[Audio] Error:', err);
    res.status(500).json({ error: `Audio processing failed: ${err.message}` });
  }
});

// ============================================================
// AGENTS - MCP YouTube Agent Endpoint
// ============================================================
app.post('/api/agents/youtube', validateRequest('POST /api/agents/youtube'), async (req, res) => {
  try {
    const { videoUrl, query } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Missing videoUrl' });
    }
    if (!query) {
      return res.status(400).json({ error: 'Missing query' });
    }

    console.log('[YouTube Agent] Processing:', { videoUrl, query });

    // Extract Video ID
    let videoId = null;
    try {
      const urlObj = new URL(videoUrl);
      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    console.log('[YouTube Agent] Video ID:', videoId);

    // Step 1: Fetch Transcript via Docker MCP
    console.log('[YouTube Agent] Fetching transcript via Docker MCP...');
    let transcript = '';
    try {
      transcript = await new Promise((resolve, reject) => {
        const { spawn } = require('child_process');

        const docker = spawn('docker', ['run', '-i', '--rm', 'mcp/youtube-transcript'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        docker.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        docker.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        docker.on('error', (err) => {
          reject(new Error(`Docker error: ${err.message}`));
        });

        docker.on('close', (code) => {
          console.log('[MCP] Response received, parsing...');

          try {
            // Parse JSON-RPC responses line by line
            const lines = stdout.trim().split('\n');
            for (const line of lines) {
              try {
                const response = JSON.parse(line);
                if (response.result && response.result.content) {
                  const textContent = response.result.content.find(c => c.type === 'text');
                  if (textContent && textContent.text) {
                    resolve(textContent.text);
                    return;
                  }
                }
              } catch (e) { /* continue */ }
            }
            reject(new Error('No transcript in MCP response'));
          } catch (err) {
            reject(new Error(`Parse error: ${err.message}`));
          }
        });

        // MCP Initialize
        const initReq = JSON.stringify({
          jsonrpc: '2.0', id: 0, method: 'initialize',
          params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'RAGQuery', version: '1.0.0' } }
        });

        // MCP Get Transcript
        const transcriptReq = JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'tools/call',
          params: { name: 'get_transcript', arguments: { url: videoUrl } }
        });

        docker.stdin.write(initReq + '\n');
        setTimeout(() => {
          docker.stdin.write(transcriptReq + '\n');
          docker.stdin.end();
        }, 300);

        // Timeout
        setTimeout(() => { docker.kill(); reject(new Error('Timeout')); }, 30000);
      });

      console.log('[YouTube Agent] Transcript length:', transcript.length);
    } catch (err) {
      console.error('[YouTube Agent] MCP failed:', err.message);
      return res.status(400).json({
        error: `Could not fetch transcript: ${err.message}`
      });
    }

    // Step 2: Process Query with AI
    console.log('[YouTube Agent] Processing query with AI...');
    const agentPrompt = `You are an expert YouTube video analyst providing comprehensive, detailed answers. You have access to a video transcript and must answer the user's question.

**VIDEO TRANSCRIPT:**
${transcript.substring(0, 15000)} ${transcript.length > 15000 ? '... [transcript truncated for length]' : ''}

**USER'S QUESTION:**
${query}

**IMPORTANT FORMATTING INSTRUCTIONS:**
1. **Use Proper Headings:**
   - Use **# (H1)** for the main title
   - Use **## (H2)** for major sections
   - Use **### (H3)** for subsections

2. **Structure Your Response:**
   - Start with a brief **Overview** or **Summary** section
   - Break down the content into **logical sections**
   - Use **numbered lists (1., 2., 3.)** for steps or key points
   - Use **bullet points (-)** for details within sections

3. **Highlight Key Information:**
   - Use **bold** for important terms and concepts
   - Use *italics* for emphasis or quotes from the video
   - Include relevant **timestamps** if available in the transcript

4. **Be Comprehensive:**
   - Provide detailed explanations, not just brief summaries
   - Include examples or quotes from the transcript
   - If the user asks for a summary, provide a thorough breakdown
   - Cover all relevant aspects of the question

5. **Professional Quality:**
   - Write as if creating a professional document or article
   - Ensure the response is well-organized and easy to follow
   - Aim for depth and clarity

**YOUR DETAILED RESPONSE:**`;

    let aiResponse;
    try {
      aiResponse = await generateWithRetries(agentPrompt);
      console.log('[YouTube Agent] AI response generated');
    } catch (err) {
      console.error('[YouTube Agent] AI processing failed:', err.message);
      return res.status(500).json({
        error: 'Failed to process your query. Please try again.',
        transcript: transcript.substring(0, 500) + '...'
      });
    }

    // Return successful response
    res.status(200).json({
      videoId,
      transcript: transcript.substring(0, 1000) + (transcript.length > 1000 ? '...' : ''),
      transcriptLength: transcript.length,
      query,
      answer: aiResponse
    });

  } catch (err) {
    console.error('[YouTube Agent] Error:', err);
    res.status(500).json({ error: `Agent error: ${err.message}` });
  }
});

// ============================================================
// AGENTS - Confluence SOP Agent Endpoints
// ============================================================

// Confluence Environment Variables
const CONFLUENCE_URL = process.env.CONFLUENCE_URL;
const CONFLUENCE_USERNAME = process.env.CONFLUENCE_USERNAME;
const CONFLUENCE_API_TOKEN = process.env.CONFLUENCE_API_TOKEN || process.env.CONFLUENCE_PERSONAL_TOKEN;

// Endpoint 1: Generate SOP from knowledge input
app.post('/api/agents/confluence/generate', validateRequest('POST /api/agents/confluence/generate'), async (req, res) => {
  try {
    const { knowledge, title } = req.body;

    if (!knowledge || knowledge.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide knowledge input (at least 10 characters)' });
    }

    console.log('[Confluence Agent] Generating SOP from knowledge:', knowledge.substring(0, 100) + '...');

    const sopPrompt = `You are an expert technical writer specializing in creating detailed Standard Operating Procedures (SOPs).

**USER'S KNOWLEDGE INPUT:**
${knowledge}

**YOUR TASK:**
Create a comprehensive, professional SOP document based on the user's input. The SOP should be:
- Clear and actionable
- Well-structured with proper headings
- Detailed enough for someone new to follow

**FORMAT (use this exact structure):**

# ${title || '[Generate an appropriate title based on content]'}

## Purpose
[Brief description of what this SOP covers and why it exists]

## Scope
[Who this applies to, what systems/processes are involved]

## Prerequisites
[Required knowledge, access, tools, or permissions needed before starting]

## Procedure

### Step 1: [First Major Action]
[Detailed instructions]
- Sub-step details if needed
- Include specific commands, paths, or values

### Step 2: [Second Major Action]
[Detailed instructions]

### Step 3: [Continue as needed]
[Add more steps as required by the content]

## Verification
[How to verify the procedure was completed successfully]

## Troubleshooting
| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| [Issue 1] | [Cause] | [Solution] |
| [Issue 2] | [Cause] | [Solution] |

## Related Documents
- [List any related SOPs, documentation, or resources]

---
*Generated by ARES Enterprise Intelligence*

**GENERATE THE SOP NOW:**`;

    let sopContent;
    try {
      sopContent = await generateWithRetries(sopPrompt);
      console.log('[Confluence Agent] SOP generated successfully, length:', sopContent.length);
    } catch (err) {
      console.error('[Confluence Agent] SOP generation failed:', err.message);
      return res.status(500).json({ error: 'Failed to generate SOP. Please try again.' });
    }

    // Extract suggested title from generated content
    const titleMatch = sopContent.match(/^# (.+)$/m);
    const suggestedTitle = titleMatch ? titleMatch[1].trim() : title || 'Untitled SOP';

    res.status(200).json({
      sopContent,
      suggestedTitle,
      inputLength: knowledge.length
    });

  } catch (err) {
    console.error('[Confluence Agent] Error:', err);
    res.status(500).json({ error: `Generation error: ${err.message}` });
  }
});

// Endpoint 2: Publish to Confluence via REST API (User-provided credentials)
app.post('/api/agents/confluence/publish', validateRequest('POST /api/agents/confluence/publish'), async (req, res) => {
  try {
    const {
      title,
      content,
      spaceKey,
      parentPageId,
      // User-provided Confluence credentials
      confluenceUrl,
      confluenceEmail,
      confluenceToken,
      action,
      pageId
    } = req.body;

    if (!title || !content || !spaceKey) {
      return res.status(400).json({ error: 'Missing required fields: title, content, spaceKey' });
    }

    // Use user-provided credentials or fallback to env variables
    const CONF_URL = confluenceUrl || process.env.CONFLUENCE_URL;
    const CONF_EMAIL = confluenceEmail || process.env.CONFLUENCE_USERNAME;
    const CONF_TOKEN = confluenceToken || process.env.CONFLUENCE_API_TOKEN || process.env.CONFLUENCE_PERSONAL_TOKEN;

    if (!CONF_URL || !CONF_EMAIL || !CONF_TOKEN) {
      return res.status(400).json({
        error: 'Confluence credentials not provided. Please configure URL, Email, and API Token in the settings.'
      });
    }

    console.log('[Confluence Agent] Publishing to Confluence:', { title, spaceKey, url: CONF_URL });

    // Convert markdown to Confluence storage format
    const confluenceContent = content
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    const storageContent = `<p>${confluenceContent}</p>`;

    // Create page via Confluence REST API
    const apiUrl = `${CONF_URL}/wiki/rest/api/content`;
    const auth = Buffer.from(`${CONF_EMAIL}:${CONF_TOKEN}`).toString('base64');

    const requestBody = {
      type: 'page',
      title: title,
      space: { key: spaceKey },
      body: {
        storage: {
          value: storageContent,
          representation: 'storage'
        }
      }
    };

    // Add parent page if provided
    if (parentPageId) {
      requestBody.ancestors = [{ id: parentPageId }];
      console.log('[Confluence Agent] Creating page under parent:', parentPageId);
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[Confluence Agent] API Error:', responseData);
      throw new Error(responseData.message || `Confluence API error: ${response.status}`);
    }

    const pageUrl = `${CONF_URL}/wiki${responseData._links?.webui || `/spaces/${spaceKey}/pages/${responseData.id}`}`;

    console.log('[Confluence Agent] Published successfully:', pageUrl);

    res.status(200).json({
      success: true,
      message: 'Page created successfully',
      pageId: responseData.id,
      pageUrl: pageUrl,
      title: responseData.title
    });

  } catch (err) {
    console.error('[Confluence Agent] Publish error:', err);
    res.status(500).json({ error: `Publish failed: ${err.message}` });
  }
});

// Endpoint 3: Get Confluence spaces (for dropdown)
app.get('/api/agents/confluence/spaces', async (req, res) => {
  try {
    if (!CONFLUENCE_URL || !CONFLUENCE_USERNAME || !CONFLUENCE_API_TOKEN) {
      return res.status(400).json({
        error: 'Confluence credentials not configured',
        configured: false
      });
    }

    // Return offersl2 space plus placeholders
    res.status(200).json({
      configured: true,
      spaces: [
        { key: 'offersl2', name: 'Offers L2 SOP' },
        { key: 'DOCS', name: 'Documentation' },
        { key: 'TEAM', name: 'Team Space' },
        { key: 'KB', name: 'Knowledge Base' }
      ]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Sync
app.post('/api/auth/sync', validateRequest('POST /api/auth/sync'), async (req, res) => {
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

// Upload Endpoint (Enhanced with provenance tracking)
app.post('/api/upload', upload.single('file'), validateFileUpload, async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const mimeType = req.file.mimetype;
    const title = req.file.originalname;
    const versionId = generateVersionId();

    console.log(`[Upload] Processing: ${title} (${mimeType}) for user: ${userId}`);

    let parseResult;
    let docType = 'file';

    try {
      if (mimeType === 'application/pdf') {
        parseResult = await parsePDFWithMetadata(req.file.buffer);
        docType = 'pdf';
        console.log(`[Upload] PDF parsed: ${parseResult.pageCount} pages, ${parseResult.chunks.length} chunks`);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        parseResult = await parseDocxWithMetadata(req.file.buffer);
        docType = 'docx';
      } else {
        const textContent = req.file.buffer.toString('utf-8');
        parseResult = parseTextWithMetadata(textContent, title);
        docType = 'text';
      }
    } catch (parseError) {
      console.error('[Upload] Parse error:', parseError);
      return res.status(500).json({ error: `Failed to parse file: ${parseError.message}` });
    }

    if (!parseResult.content || parseResult.content.trim().length === 0) {
      return res.status(400).json({ error: 'File empty or unparseable' });
    }

    try {
      // Insert document with enhanced metadata
      const { rows: docRows } = await pool.query(
        `INSERT INTO documents 
         (title, content, type, user_id, version_id, file_hash, page_count, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id`,
        [
          title,
          parseResult.content,
          docType,
          userId,
          versionId,
          parseResult.fileHash,
          parseResult.pageCount,
          JSON.stringify(parseResult.metadata || {})
        ]
      );

      const documentId = docRows[0].id;
      console.log(`[Upload] Document saved ID: ${documentId}`);

      // Store chunks with provenance metadata
      if (parseResult.chunks && parseResult.chunks.length > 0) {
        const chunkPromises = parseResult.chunks.map(chunk =>
          pool.query(
            `INSERT INTO document_chunks 
             (document_id, chunk_index, chunk_text, page_number, section_id, start_char, end_char, bounding_box)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [
              documentId,
              chunk.chunkIndex,
              chunk.chunkText,
              chunk.pageNumber,
              chunk.sectionId,
              chunk.startChar,
              chunk.endChar,
              chunk.boundingBox ? JSON.stringify(chunk.boundingBox) : null
            ]
          )
        );

        await Promise.all(chunkPromises);
        console.log(`[Upload] Stored ${parseResult.chunks.length} chunks with page metadata`);
      }

      res.json({
        id: documentId,
        content: parseResult.content,
        title,
        pageCount: parseResult.pageCount,
        chunkCount: parseResult.chunks?.length || 0,
        versionId
      });
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

app.post('/api/documents', validateRequest('POST /api/documents'), async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { title, content, type, isStarred, thumbnail } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Missing title/content' });

  try {
    // Store thumbnail in metadata JSON if provided
    const metadata = thumbnail ? JSON.stringify({ thumbnail }) : null;

    const { rows } = await pool.query(
      'INSERT INTO documents (title, content, type, user_id, is_starred, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [title, content, type || 'text', userId, isStarred || false, metadata]
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

// Rename document
app.put('/api/documents/:id', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Missing title' });
  }

  try {
    await pool.query('UPDATE documents SET title = $1 WHERE id = $2 AND user_id = $3', [title.trim(), id, userId]);
    res.json({ message: 'Document renamed', id, title: title.trim() });
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

app.post('/api/projects', validateRequest('POST /api/projects'), async (req, res) => {
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
app.post('/api/chat/ares', validateRequest('POST /api/chat/ares'), async (req, res) => {
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

app.post('/api/generate-mindmap', validateRequest('POST /api/generate-mindmap'), async (req, res) => {
  try {
    const { topic, context } = req.body;
    if (!topic) return res.status(400).json({ error: 'Missing topic' });

    const { semanticSearch } = await import('./semanticSearch.js');
    const topContexts = await semanticSearch(context, topic, 10);
    const contextText = topContexts.map(c => c.chunkText).join('\n\n');

    const prompt = `Generate a DEEPLY NESTED hierarchical mindmap for: "${topic}".
    
    Context to use:
    ${contextText || 'No specific context provided.'}
    
    Output strictly valid JSON. EVERY branch must go AT LEAST 4-5 levels deep:
    {
      "label": "Main Topic (Level 0)",
      "details": "Overview of the main topic",
      "children": [
        {
          "label": "Category A (Level 1)",
          "details": "Description of this category",
          "children": [
            {
              "label": "Aspect A.1 (Level 2)",
              "details": "Details about this aspect",
              "children": [
                {
                  "label": "Point A.1.1 (Level 3)",
                  "details": "Specific point explanation",
                  "children": [
                    {
                      "label": "Detail A.1.1.1 (Level 4)",
                      "details": "Fine-grained detail",
                      "children": [
                        {
                          "label": "Example A.1.1.1.1 (Level 5)",
                          "details": "Concrete example or final detail"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
    
    MANDATORY REQUIREMENTS:
    1. **MINIMUM 5 LEVELS DEEP**: Every main branch MUST have children going down to level 4 or 5.
    2. **NO SHALLOW BRANCHES**: If a node at level 2 or 3 has no children, ADD children to make it deeper.
    3. **STRUCTURE**:
       - Level 0: Main Topic (1 node)
       - Level 1: Main Categories (3-5 nodes)
       - Level 2: Sub-categories (2-4 per parent)
       - Level 3: Specific Points (2-3 per parent)
       - Level 4: Details/Examples (2-3 per parent)
       - Level 5: Fine Details (1-2 per parent if applicable)
    4. **"details" MUST BE VERY DETAILED**:
       - Write 4-6 sentences for EACH node
       - Explain WHAT it is, WHY it matters, HOW it works
       - Include specific examples, statistics, or use cases where relevant
       - Make it comprehensive enough that someone can learn just from reading the details
       - DO NOT use vague descriptions like "Description of..." - provide REAL, SUBSTANTIVE content
    5. **"children"**: MUST be an array. Even leaf nodes should have this as empty array [].
    
    GENERATE THE DEEPEST POSSIBLE MINDMAP for "${topic}". DO NOT STOP AT LEVEL 3.`;

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

app.post('/api/generate-infographic', validateRequest('POST /api/generate-infographic'), async (req, res) => {
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

app.post('/api/generate-slidedeck', validateRequest('POST /api/generate-slidedeck'), async (req, res) => {
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

app.post('/api/generate-report', validateRequest('POST /api/generate-report'), async (req, res) => {
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
app.post('/api/regenerate-visual', validateRequest('POST /api/regenerate-visual'), async (req, res) => {
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

// ============================================================
// PRODUCTION: Serve Static Frontend
// ============================================================
// (path and __dirname already imported at top of file)

// Serve static files from the dist directory (Vite build output)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't interfere with API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📂 Serving static files from: ${path.join(__dirname, 'dist')}`);
});

