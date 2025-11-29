// Vercel types removed for local build compatibility
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const ragResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    synthesizedAnswer: {
      type: SchemaType.STRING,
      description: "A comprehensive answer to the user's query, synthesized from the most relevant document chunks. This answer must be based ONLY on the provided document.",
    },
    rankedChunks: {
      type: SchemaType.ARRAY,
      description: "An array of relevant document passages, ranked by relevance score in descending order.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          relevanceScore: {
            type: SchemaType.INTEGER,
            description: "A score from 0 to 100 indicating the chunk's relevance to the query.",
          },
          chunkText: {
            type: SchemaType.STRING,
            description: "The actual text of the relevant passage from the document.",
          },
        },
        required: ['relevanceScore', 'chunkText'],
      },
    },
  },
  required: ['synthesizedAnswer', 'rankedChunks'],
} as const;


export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API_KEY is not configured on the server.' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const { action, payload } = req.body;

    if (action === 'scrape') {
      const { url } = payload;
      const prompt = `You are a web content extraction agent. Your goal is to use your web search capabilities to access the provided URL and extract its main textual content. URL: ${url}. Carefully remove all boilerplate content (menus, ads, etc.) and return ONLY the clean, main body of text. If you cannot access the URL, respond with the exact phrase: "ERROR:UNABLE_TO_SCRAPE".`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const extractedText = response.text().trim();

      if (extractedText === "ERROR:UNABLE_TO_SCRAPE") {
        throw new Error("The model could not access or scrape content from the provided URL.");
      }
      return res.status(200).json({ content: extractedText });

    } else if (action === 'rag') {
      const { documentContent, query } = payload;
      const prompt = `You are an advanced RAG system. Analyze the following DOCUMENT TEXT and answer the USER QUERY based ONLY on the information within that document. DOCUMENT TEXT: --- ${documentContent} --- USER QUERY: "${query}" --- Provide your output in the specified JSON format.`;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: ragResponseSchema as any,
          temperature: 0.2,
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text().trim();

      return res.status(200).json(JSON.parse(jsonText));

    } else if (action === 'chat') {
      const { history } = payload;
      const systemInstruction = "You are Ares, an AI assistant with the persona of a master strategist and warrior of intellect. Your purpose is to help users dissect information and conquer complex questions. You are sharp, witty, and confident. You value clarity and precision. You remember past interactions to provide context-aware responses. When the user starts a new conversation, you must greet them and state your purpose.";

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction,
        generationConfig: {
          temperature: 0.7,
        }
      });

      const chatHistory = history.map((msg: { role: 'user' | 'model', content: string }) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      const result = await model.generateContent({
        contents: chatHistory
      });

      const response = await result.response;
      return res.status(200).json({ response: response.text() });

    } else {
      return res.status(400).json({ error: 'Invalid action specified.' });
    }
  } catch (error) {
    console.error('Error in API proxy:', error);
    const message = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return res.status(500).json({ error: message });
  }
}