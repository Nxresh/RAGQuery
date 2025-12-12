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

// Hierarchical chunking: Parent (Context) -> Child (Search)
export function createHierarchicalChunks(text, parentSize = 1000, childSize = 200, childOverlap = 50) {
    const paragraphs = text.split(/\n\s*\n/); // Split by paragraphs
    const hierarchy = [];

    let currentParentWords = [];
    let currentParentStartIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i].trim();
        if (!para) continue;

        const paraWords = para.split(/\s+/);
        currentParentWords.push(...paraWords);

        // If parent is big enough or it's the last paragraph, finalize the parent
        if (currentParentWords.length >= parentSize || i === paragraphs.length - 1) {
            const parentText = currentParentWords.join(' ');
            const parentId = `parent_${hierarchy.length}`;

            // Create children from this parent
            const children = [];
            for (let j = 0; j < currentParentWords.length; j += (childSize - childOverlap)) {
                const childChunk = currentParentWords.slice(j, j + childSize).join(' ');
                if (childChunk.length > 50) {
                    children.push({
                        text: childChunk,
                        parentId: parentId
                    });
                }
            }

            hierarchy.push({
                id: parentId,
                text: parentText,
                children: children
            });

            // Reset for next parent
            currentParentWords = [];
        }
    }

    return hierarchy;
}

// Semantic search: find most relevant chunks using Hierarchical Retrieval
export async function semanticSearch(documentContent, query, topK = 5) {
    console.log('[Semantic Search] Starting Hierarchical Retrieval...');

    // 1. Create Hierarchy
    const hierarchy = createHierarchicalChunks(documentContent);
    const allChildren = hierarchy.flatMap(p => p.children);
    console.log(`[Semantic Search] Created ${hierarchy.length} parent contexts and ${allChildren.length} child search chunks`);

    if (allChildren.length === 0) {
        console.warn('[Semantic Search] No chunks created. Text might be too short.');
        return [];
    }

    // 2. Generate query embedding
    console.log('[Semantic Search] Generating query embedding...');
    const queryEmbedding = await generateEmbedding(query);

    // 3. Generate embeddings for all CHILDREN (batch if needed)
    console.log('[Semantic Search] Generating child embeddings...');
    // In production, you'd batch this. For now, Promise.all is okay for reasonable sizes.
    const childEmbeddings = await Promise.all(
        allChildren.map(child => generateEmbedding(child.text))
    );

    // 4. Calculate similarities for children
    console.log('[Semantic Search] Calculating similarities...');
    const scoredChildren = allChildren.map((child, idx) => {
        const similarity = cosineSimilarity(queryEmbedding, childEmbeddings[idx]);
        return {
            ...child,
            score: Math.round(similarity * 100),
            similarity: similarity
        };
    });

    // 5. Sort children by relevance
    const topChildren = scoredChildren
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK * 2); // Get more children to ensure we find enough unique parents

    // 6. Map back to PARENTS (Deduplicate)
    const seenParents = new Set();
    const topParents = [];

    for (const child of topChildren) {
        if (!seenParents.has(child.parentId)) {
            const parent = hierarchy.find(p => p.id === child.parentId);
            if (parent) {
                topParents.push({
                    relevanceScore: child.score, // Use child's score as proxy for relevance
                    chunkText: parent.text, // RETURN THE FULL PARENT TEXT
                    matchType: 'hierarchical_parent'
                });
                seenParents.add(child.parentId);
            }
        }
        if (topParents.length >= topK) break;
    }

    console.log(`[Semantic Search] Retrieved ${topParents.length} unique parent contexts`);
    return topParents;
}
