/**
 * Advanced Query Transformation Service
 * Implements 4 techniques to improve RAG query quality:
 * 1. Query Expansion - Rewrite vague queries into detailed ones
 * 2. Sub-Question Decomposition - Break complex questions into sub-questions
 * 3. HyDE (Hypothetical Document Embeddings) - Generate hypothetical answer for search
 * 4. Step-Back Prompting - Identify underlying general concept
 */

/**
 * Query Expansion: Rewrite vague query into detailed, search-optimized query
 * Example: "AI issues" → "common problems in artificial intelligence, machine learning errors, debugging neural networks"
 */
export async function expandQuery(query, generateFn) {
    console.log('[QueryTransform] Expanding query:', query);

    const prompt = `You are a search query optimizer. Rewrite the following user query into a more detailed, comprehensive search query that will match more relevant documents.

User Query: "${query}"

Instructions:
- Expand abbreviations and acronyms
- Add related terms and synonyms
- Include specific technical terms if applicable
- Keep it as a single search query (not multiple questions)
- Make it 2-3x longer than the original

Expanded Query (just the query, no explanations):`;

    try {
        const expanded = await generateFn(prompt);
        const cleanExpanded = expanded.trim().replace(/^["']|["']$/g, '');
        console.log('[QueryTransform] Expanded to:', cleanExpanded.substring(0, 100) + '...');
        return cleanExpanded;
    } catch (err) {
        console.error('[QueryTransform] Expansion failed:', err.message);
        return query; // Fallback to original
    }
}

/**
 * Sub-Question Decomposition: Break complex question into simpler sub-questions
 * Example: "Compare RAG vs Fine-tuning" → ["What is RAG?", "What is fine-tuning?", "What are the pros and cons?"]
 */
export async function decomposeQuery(query, generateFn) {
    console.log('[QueryTransform] Decomposing query:', query);

    const prompt = `Break down this complex question into 2-4 simpler sub-questions that, when answered together, will fully answer the original question.

Original Question: "${query}"

Return ONLY a JSON array of sub-questions, nothing else:
["sub-question 1", "sub-question 2", ...]`;

    try {
        const result = await generateFn(prompt);
        // Extract JSON array from response
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const subQuestions = JSON.parse(jsonMatch[0]);
            console.log('[QueryTransform] Decomposed into', subQuestions.length, 'sub-questions');
            return subQuestions;
        }
        return [query]; // Fallback to original
    } catch (err) {
        console.error('[QueryTransform] Decomposition failed:', err.message);
        return [query];
    }
}

/**
 * HyDE: Generate a hypothetical ideal answer, then use it for semantic search
 * This finds documents similar to what a good answer would contain
 */
export async function generateHypotheticalAnswer(query, generateFn) {
    console.log('[QueryTransform] Generating hypothetical answer (HyDE)...');

    const prompt = `You are an expert. Provide a brief, factual answer to this question as if you had perfect knowledge. This will be used to find similar real documents.

Question: "${query}"

Hypothetical Answer (2-3 paragraphs, factual and detailed):`;

    try {
        const hypothetical = await generateFn(prompt);
        console.log('[QueryTransform] HyDE generated:', hypothetical.substring(0, 100) + '...');
        return hypothetical;
    } catch (err) {
        console.error('[QueryTransform] HyDE failed:', err.message);
        return query; // Fallback to original query
    }
}

/**
 * Step-Back Prompting: Identify the underlying general concept
 * Example: "How to fix React useState not updating?" → "React state management patterns"
 */
export async function stepBackQuery(query, generateFn) {
    console.log('[QueryTransform] Applying step-back prompting...');

    const prompt = `Take a "step back" from this specific question to identify the broader, underlying concept or topic. This helps find more foundational context.

Specific Question: "${query}"

What is the general concept or topic this question is really about? Provide a broader query that captures the foundational knowledge needed.

Step-Back Query (just the query, no explanations):`;

    try {
        const stepBack = await generateFn(prompt);
        const cleanStepBack = stepBack.trim().replace(/^["']|["']$/g, '');
        console.log('[QueryTransform] Step-back query:', cleanStepBack);
        return cleanStepBack;
    } catch (err) {
        console.error('[QueryTransform] Step-back failed:', err.message);
        return query;
    }
}

/**
 * Combined Intelligent Query Transformation
 * Automatically determines which techniques to apply based on query characteristics
 */
export async function transformQuery(query, generateFn, options = {}) {
    const {
        enableExpansion = true,
        enableDecomposition = false, // Only for complex multi-part questions
        enableHyDE = false,          // Computationally expensive, opt-in
        enableStepBack = false       // For specific technical questions
    } = options;

    const result = {
        originalQuery: query,
        expandedQuery: null,
        subQuestions: null,
        hypotheticalAnswer: null,
        stepBackQuery: null,
        searchQueries: [query] // Final queries to use for search
    };

    // 1. Query Expansion (lightweight, always useful)
    if (enableExpansion) {
        result.expandedQuery = await expandQuery(query, generateFn);
        result.searchQueries = [result.expandedQuery];
    }

    // 2. Sub-Question Decomposition (for complex questions)
    if (enableDecomposition) {
        const isComplex = query.includes(' vs ') ||
            query.includes(' compare ') ||
            query.includes(' and ') ||
            query.split(' ').length > 15;

        if (isComplex) {
            result.subQuestions = await decomposeQuery(query, generateFn);
            // Add sub-questions to search queries
            result.searchQueries = [...result.searchQueries, ...result.subQuestions];
        }
    }

    // 3. HyDE (for factual questions)
    if (enableHyDE) {
        result.hypotheticalAnswer = await generateHypotheticalAnswer(query, generateFn);
        // Use hypothetical answer as additional search context
        result.searchQueries.push(result.hypotheticalAnswer);
    }

    // 4. Step-Back Prompting (for specific technical questions)
    if (enableStepBack) {
        result.stepBackQuery = await stepBackQuery(query, generateFn);
        result.searchQueries.push(result.stepBackQuery);
    }

    console.log('[QueryTransform] Final search queries:', result.searchQueries.length);
    return result;
}

/**
 * Detect query complexity and suggest which transformations to apply
 */
export function analyzeQueryComplexity(query) {
    const wordCount = query.split(/\s+/).length;
    const hasComparison = /\b(vs|versus|compare|difference|better)\b/i.test(query);
    const hasMultipleParts = /\b(and|also|additionally|furthermore)\b/i.test(query);
    const isVague = wordCount < 5;
    const isTechnical = /\b(error|bug|fix|implement|code|function|api)\b/i.test(query);

    return {
        isVague,
        isComplex: hasComparison || hasMultipleParts || wordCount > 15,
        isTechnical,
        suggestedTransforms: {
            expansion: isVague,
            decomposition: hasComparison || hasMultipleParts,
            hyde: !isTechnical && wordCount > 5,
            stepBack: isTechnical
        }
    };
}
