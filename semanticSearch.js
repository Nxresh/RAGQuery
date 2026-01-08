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

// ============================================================
// SIMILARITY TECHNIQUES - Multi-Algorithm Support
// ============================================================
// 1. Cosine Similarity → Best for text & semantic meaning (normalized direction)
// 2. Euclidean Distance (L2) → Great for images & values where magnitude matters
// 3. Manhattan Distance (L1) → Good for sparse / high-dimensional spaces
// 4. Dot Product → Fast & effective for pre-normalized embeddings

/**
 * Cosine Similarity - measures angle between vectors (direction-based)
 * Best for: Text embeddings, semantic similarity, document matching
 * Range: [-1, 1] where 1 = identical direction, 0 = orthogonal, -1 = opposite
 */
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

/**
 * Euclidean Distance (L2) - measures straight-line distance
 * Best for: Image embeddings, recommendation systems, clustering
 * Range: [0, ∞) where 0 = identical, higher = more different
 * Returns: Similarity score (inverted distance normalized to 0-1)
 */
export function euclideanSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have same length');
    }

    let sumSquaredDiff = 0;
    for (let i = 0; i < vecA.length; i++) {
        const diff = vecA[i] - vecB[i];
        sumSquaredDiff += diff * diff;
    }

    const distance = Math.sqrt(sumSquaredDiff);
    // Convert distance to similarity (0-1 range)
    // Using exponential decay for smooth similarity scoring
    return Math.exp(-distance / Math.sqrt(vecA.length));
}

/**
 * Manhattan Distance (L1) - measures grid-based distance
 * Best for: High-dimensional sparse data, categorical features
 * Range: [0, ∞) where 0 = identical, higher = more different
 * Returns: Similarity score (inverted distance normalized to 0-1)
 */
export function manhattanSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have same length');
    }

    let sumAbsDiff = 0;
    for (let i = 0; i < vecA.length; i++) {
        sumAbsDiff += Math.abs(vecA[i] - vecB[i]);
    }

    // Convert distance to similarity (0-1 range)
    // Normalize by vector length and apply exponential decay
    return Math.exp(-sumAbsDiff / vecA.length);
}

/**
 * Dot Product Similarity - fast inner product
 * Best for: Pre-normalized embeddings, fast approximate matching
 * Range: Depends on vector magnitudes; higher = more similar
 * Returns: Raw dot product (caller should normalize if needed)
 */
export function dotProductSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
    }

    return dotProduct;
}

/**
 * Hybrid Similarity - combines multiple techniques for robust matching
 * Weights can be adjusted based on content type
 */
export function hybridSimilarity(vecA, vecB, weights = { cosine: 0.6, euclidean: 0.2, manhattan: 0.1, dotProduct: 0.1 }) {
    const cosine = cosineSimilarity(vecA, vecB);
    const euclidean = euclideanSimilarity(vecA, vecB);
    const manhattan = manhattanSimilarity(vecA, vecB);

    // Normalize dot product to 0-1 range using sigmoid
    const rawDot = dotProductSimilarity(vecA, vecB);
    const dotNormalized = 1 / (1 + Math.exp(-rawDot / 10));

    return (
        weights.cosine * cosine +
        weights.euclidean * euclidean +
        weights.manhattan * manhattan +
        weights.dotProduct * dotNormalized
    );
}

/**
 * Smart Similarity Selector - chooses best technique based on content type
 * @param {string} contentType - 'text', 'image', 'sparse', 'normalized', 'hybrid'
 * @returns {Function} The appropriate similarity function
 */
export function getSimilarityFunction(contentType = 'text') {
    const techniques = {
        text: cosineSimilarity,           // Text/semantic - direction matters, not magnitude
        semantic: cosineSimilarity,       // Semantic search
        image: euclideanSimilarity,       // Image embeddings - magnitude matters
        recommendation: euclideanSimilarity, // Rec systems
        sparse: manhattanSimilarity,      // Sparse/high-dim data
        categorical: manhattanSimilarity, // Categorical features
        normalized: dotProductSimilarity, // Pre-normalized embeddings (fast)
        fast: dotProductSimilarity,       // Speed-optimized
        hybrid: hybridSimilarity,         // Combines all techniques
        default: cosineSimilarity
    };

    return techniques[contentType] || techniques.default;
}

/**
 * Calculate similarity using best technique for the content
 * Auto-detects if embeddings are normalized for optimization
 */
export function calculateSimilarity(vecA, vecB, contentType = 'text') {
    // Check if vectors are approximately normalized (magnitude ≈ 1)
    const normA = Math.sqrt(vecA.reduce((sum, v) => sum + v * v, 0));
    const normB = Math.sqrt(vecB.reduce((sum, v) => sum + v * v, 0));
    const isNormalized = Math.abs(normA - 1) < 0.01 && Math.abs(normB - 1) < 0.01;

    // If content type is 'text' and vectors are normalized, dot product = cosine (faster)
    if (contentType === 'text' && isNormalized) {
        return dotProductSimilarity(vecA, vecB);
    }

    const similarityFn = getSimilarityFunction(contentType);
    return similarityFn(vecA, vecB);
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

    // 4. Calculate similarities for children using HYBRID approach
    // Hybrid combines: Cosine (60%) + Euclidean (20%) + Manhattan (10%) + Dot (10%)
    console.log('[Semantic Search] Calculating hybrid similarities (Cosine+Euclidean+Manhattan+Dot)...');
    const scoredChildren = allChildren.map((child, idx) => {
        // Use hybrid similarity for most robust matching
        const similarity = hybridSimilarity(queryEmbedding, childEmbeddings[idx]);

        // Also calculate individual scores for debugging/analysis
        const cosineScore = cosineSimilarity(queryEmbedding, childEmbeddings[idx]);

        return {
            ...child,
            score: Math.round(similarity * 100),
            similarity: similarity,
            cosineScore: Math.round(cosineScore * 100), // For reference
            matchMethod: 'hybrid'
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
