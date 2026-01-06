/**
 * Audit Logger Service
 * Provides compliance-grade audit trail for RAG queries
 */

/**
 * Log a RAG query with full provenance tracking
 * @param {Object} pool - PostgreSQL connection pool
 * @param {Object} params - Audit parameters
 */
export async function logQuery(pool, {
    userId,
    queryText,
    retrievedChunkIds = [],
    chunksFedToModel = [],
    citedChunkIds = [],
    modelResponse = '',
    documentIds = [],
    latencyMs = 0
}) {
    try {
        const { rows } = await pool.query(
            `INSERT INTO audit_logs 
             (user_id, query_text, retrieved_chunk_ids, chunks_fed_to_model, 
              cited_chunk_ids, model_response, document_ids, latency_ms)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [
                userId,
                queryText,
                retrievedChunkIds,
                chunksFedToModel,
                citedChunkIds,
                modelResponse,
                documentIds,
                latencyMs
            ]
        );
        console.log(`[Audit] Logged query ID: ${rows[0].id}`);
        return rows[0].id;
    } catch (err) {
        console.error('[Audit] Failed to log query:', err.message);
        // Don't throw - audit logging should not break the main flow
        return null;
    }
}

/**
 * Get audit logs for a user
 * @param {Object} pool - PostgreSQL connection pool
 * @param {string} userId - User ID
 * @param {number} limit - Max results
 */
export async function getAuditLogs(pool, userId, limit = 50) {
    try {
        const { rows } = await pool.query(
            `SELECT * FROM audit_logs 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [userId, limit]
        );
        return rows;
    } catch (err) {
        console.error('[Audit] Failed to get logs:', err.message);
        return [];
    }
}

/**
 * Get audit log with chunk details
 * @param {Object} pool - PostgreSQL connection pool
 * @param {number} auditId - Audit log ID
 */
export async function getAuditLogWithChunks(pool, auditId) {
    try {
        const { rows: auditRows } = await pool.query(
            `SELECT * FROM audit_logs WHERE id = $1`,
            [auditId]
        );

        if (auditRows.length === 0) return null;

        const audit = auditRows[0];

        // Get chunk details for cited chunks
        if (audit.cited_chunk_ids && audit.cited_chunk_ids.length > 0) {
            const { rows: chunks } = await pool.query(
                `SELECT dc.*, d.title as document_title 
                 FROM document_chunks dc
                 JOIN documents d ON dc.document_id = d.id
                 WHERE dc.id = ANY($1)`,
                [audit.cited_chunk_ids]
            );
            audit.citedChunks = chunks;
        }

        return audit;
    } catch (err) {
        console.error('[Audit] Failed to get audit with chunks:', err.message);
        return null;
    }
}

/**
 * Parse model response to extract citation references
 * Looks for patterns like [Doc 1, p.5] or [Source 2, §4.3]
 */
export function extractCitations(modelResponse) {
    const citationPattern = /\[(?:Doc|Source|Ref)\s*(\d+)(?:,\s*(?:p\.?|page\s*)(\d+))?(?:,\s*(?:§|section\s*)([\d.]+))?\]/gi;
    const citations = [];
    let match;

    while ((match = citationPattern.exec(modelResponse)) !== null) {
        citations.push({
            docRef: parseInt(match[1]),
            pageNumber: match[2] ? parseInt(match[2]) : null,
            sectionId: match[3] || null,
            fullMatch: match[0],
            position: match.index
        });
    }

    return citations;
}
