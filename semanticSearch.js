// Semantic search utilities using embeddings
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize embedding model
let embeddingModel = null;

export function initEmbeddings(apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
}

// Generate embedding for text
export async function generateEmbedding(text) {
    if (!embeddingModel) {
        throw new Error('Embedding model not initialized');
    }

    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct / (normA * normB);
}

// Better chunking with overlapping windows
export function createChunks(text, chunkSize = 500, overlap = 100) {
    const words = text.split(/\s+/);
    const chunks = [];

    for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        if (chunk.trim().length > 50) { // Only include substantial chunks
            chunks.push({
                text: chunk.trim(),
                startIndex: i,
                endIndex: Math.min(i + chunkSize, words.length)
            });
        }
    }

    return chunks;
}

// Semantic search: find most relevant chunks
export async function semanticSearch(documentContent, query, topK = 5) {
    console.log('[Semantic Search] Starting...');

    // Create overlapping chunks for better coverage
    const chunks = createChunks(documentContent, 500, 100);
    console.log(`[Semantic Search] Created ${chunks.length} chunks`);

    // Generate query embedding
    console.log('[Semantic Search] Generating query embedding...');
    const queryEmbedding = await generateEmbedding(query);

    // Generate embeddings for all chunks (batch if needed)
    console.log('[Semantic Search] Generating chunk embeddings...');
    const chunkEmbeddings = await Promise.all(
        chunks.map(chunk => generateEmbedding(chunk.text))
    );

    // Calculate similarities
    console.log('[Semantic Search] Calculating similarities...');
    const scoredChunks = chunks.map((chunk, idx) => {
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbeddings[idx]);
        return {
            text: chunk.text,
            score: Math.round(similarity * 100), // Convert to percentage
            similarity: similarity,
            startIndex: chunk.startIndex,
            endIndex: chunk.endIndex
        };
    });

    // Sort by similarity and return top K
    const topChunks = scoredChunks
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map(chunk => ({
            relevanceScore: chunk.score,
            chunkText: chunk.text
        }));

    console.log(`[Semantic Search] Found ${topChunks.length} relevant chunks`);
    console.log(`[Semantic Search] Top score: ${topChunks[0]?.relevanceScore}%`);

    return topChunks;
}
