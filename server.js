import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Security headers for production/dev when serving API
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Basic CSP: allow same-origin scripts and inline styles (adjust for production)
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';");
  next();
});

// Simple health check to verify server is up
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Check for API key
if (!process.env.API_KEY) {
  console.error('ERROR: API_KEY environment variable is not set.');
  console.error('Please set it before starting the server:');
  console.error('  Windows: set API_KEY=your_key_here');
  console.error('  Linux/Mac: export API_KEY=your_key_here');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to call the model with retries for transient errors (e.g., 503 / UNAVAILABLE)
async function generateWithRetries(callParams, maxAttempts = 3) {
  let attempt = 0;
  while (true) {
    try {
      return await ai.models.generateContent(callParams);
    } catch (err) {
      attempt += 1;
      const isLast = attempt >= maxAttempts;
      // Log trimmed error info for diagnostics
      console.warn(`[API] Model call failed (attempt ${attempt}/${maxAttempts}):`, err?.message || err);
      if (isLast) {
        // rethrow the last error to be handled by outer catch
        throw err;
      }
      // Exponential backoff (simple): wait attempt * 500ms
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
}

// Normalize model response into a string. Extract actual text from Google GenAI SDK responses.
async function readResponseText(response) {
  if (response == null) return '';
  try {
    // Handle Google GenAI SDK response object
    if (response.candidates && Array.isArray(response.candidates) && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content?.parts && Array.isArray(candidate.content.parts)) {
        const textPart = candidate.content.parts.find(p => p.text);
        if (textPart && textPart.text) {
          return String(textPart.text);
        }
      }
    }
    // Fallback: try .text() method
    if (typeof response.text === 'function') {
      return String(await response.text());
    }
    // Fallback: string
    if (typeof response === 'string') return response;
    // Fallback: stringify object
    if (typeof response === 'object') {
      return JSON.stringify(response);
    }
    return String(response);
  } catch (e) {
    console.error('[API] Error in readResponseText:', e);
    return String(response);
  }
}

// Define the response schema for RAG
const ragResponseSchema = {
  type: Type.OBJECT,
  properties: {
    synthesizedAnswer: { type: Type.STRING },
    rankedChunks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          relevanceScore: { type: Type.INTEGER },
          chunkText: { type: Type.STRING },
        },
        required: ['relevanceScore', 'chunkText'],
      },
    },
  },
  required: ['synthesizedAnswer', 'rankedChunks'],
};

// API Proxy endpoint
app.post('/api/proxy', async (req, res) => {
  try {
    const { action, payload } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Missing action' });
    }

    console.log(`[API] action=${action}`);

    if (action === 'rag') {
      const { documentContent, query } = payload;
      if (!documentContent || !query) {
        return res.status(400).json({ error: 'Missing documentContent or query' });
      }

      // LOCAL RAG: Split document into chunks and rank locally (no model call needed!)
      console.log('[API] Starting local RAG processing...');
      
      // Split into sentences (simple chunking)
      const sentences = documentContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
      console.log(`[API] Split document into ${sentences.length} chunks`);

      // Simple relevance scoring: count query word matches in each chunk
      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const scoredChunks = sentences.map((chunk, idx) => {
        const chunkLower = chunk.toLowerCase();
        let score = 0;
        for (const word of queryWords) {
          const regex = new RegExp(`\\b${word}\\b`, 'g');
          const matches = chunkLower.match(regex);
          score += (matches ? matches.length : 0) * 10;
        }
        // Bonus: prefer chunks closer to beginning
        score += Math.max(0, 20 - idx);
        return {
          text: chunk.trim(),
          score: Math.min(100, score),
          index: idx
        };
      });

      // Sort by relevance and take top 5
      const topChunks = scoredChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(c => ({
          relevanceScore: c.score,
          chunkText: c.text
        }));

      console.log('[API] Top chunks identified, now calling model for synthesis...');

      // Now use the model ONLY to synthesize an answer from the top chunks
      const topChunksText = topChunks.map((c, i) => `${i+1}. [${c.relevanceScore}%] ${c.chunkText}`).join('\n\n');
      const synthesisPrompt = `You are a detailed and comprehensive assistant. Based on these relevant passages from a document, provide a thorough, well-structured answer to the user's query.

IMPORTANT: Format your response as follows:
- Start with a brief overview/summary
- Use bullet points for key information (main ideas, benefits, features, steps, etc.)
- Under each bullet point, provide 1-2 sentences of detailed explanation
- Include sub-bullets for important details or examples
- Organize logically (by topic, priority, or sequence)
- End with a brief conclusion if relevant

Do NOT make up information—only use what's in the passages below.

RELEVANT PASSAGES:
${topChunksText}

USER QUERY: "${query}"

Now provide a detailed, well-organized answer with bullet points and thorough explanations based only on the passages above:`;

      try {
        const synthesisResponse = await generateWithRetries({
          model: 'gemini-2.5-flash', // Use cheaper flash model for synthesis
          contents: synthesisPrompt,
          config: {
            temperature: 0.3,
          },
        });

        const synthesizedAnswer = String((await readResponseText(synthesisResponse)) || 'No answer generated').trim();
        console.log('[API] Synthesis complete');

        return res.status(200).json({
          synthesizedAnswer: synthesizedAnswer,
          rankedChunks: topChunks
        });
      } catch (err) {
        console.error('[API] Synthesis failed:', err?.message);
        // Fallback: return chunks with a simple concatenated answer
        return res.status(200).json({
          synthesizedAnswer: `Found ${topChunks.length} relevant passages. Top passage: "${topChunks[0]?.chunkText || 'N/A'}"`,
          rankedChunks: topChunks
        });
      }

    } else if (action === 'scrape') {
      const { url } = payload;
      if (!url) {
        return res.status(400).json({ error: 'Missing url' });
      }
      const model = "gemini-2.5-pro";

      const prompt = `
        You are a web content extraction agent. Use web search to access the URL and extract its main textual content.
        **URL to process:** ${url}
        **Instructions:**
        1. Search to access the URL content.
        2. Extract the primary text of the article/page.
        3. Remove boilerplate (menus, ads, etc.).
        4. Return ONLY the clean, main body of text.
        5. If you cannot access the URL, respond with the exact phrase: "ERROR:UNABLE_TO_SCRAPE".
      `;

      const response = await generateWithRetries({
        model: model,
        contents: prompt,
        config: {
          temperature: 0.0,
          tools: [{ googleSearch: {} }],
        },
      });

  const extractedText = String((await readResponseText(response)) || '').trim();
      if (extractedText === "ERROR:UNABLE_TO_SCRAPE") {
        throw new Error("The model could not access or scrape content from the provided URL.");
      }
      return res.status(200).json({ content: extractedText });

    } else if (action === 'chat') {
      const { history } = payload;
      
      if (!history || !Array.isArray(history)) {
        return res.status(400).json({ error: 'Missing or invalid history array' });
      }

      const systemInstruction = "You are Ares, an AI assistant with the persona of a master strategist and warrior of intellect. Your purpose is to help users dissect information and conquer complex questions. You are sharp, witty, and confident. You value clarity and precision. You remember past interactions to provide context-aware responses. When the user starts a new conversation, you must greet them and state your purpose.";

      // Convert history to format expected by the model
      const contents = history.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const response = await generateWithRetries({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const chatResponse = await readResponseText(response);
      return res.status(200).json({ response: chatResponse });

    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('[API] Error in proxy:', error);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    // If the underlying model/service reports UNAVAILABLE or 503, return 503 so frontend can retry
    const messageStr = String(errorMessage) + '\n' + String(errorDetails);
    const isModelUnavailable = /UNAVAILABLE|503/.test(messageStr);
    const statusCode = isModelUnavailable ? 503 : 500;
    return res.status(statusCode).json({ 
      error: errorMessage, 
      details: errorDetails,
      type: error?.constructor?.name || typeof error
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ API Server running on http://localhost:${PORT}`);
  console.log(`📝 Make sure your frontend is configured to use this URL\n`);
});
