// Chunk metadata for enterprise provenance tracking
export interface ChunkMetadata {
  documentId?: number | null;
  documentTitle?: string | null;
  pageNumber?: number | null;
  sectionId?: string | null;
  boundingBox?: { x: number; y: number; w: number; h: number } | null;
}

export interface RankedChunk extends ChunkMetadata {
  relevanceScore: number;
  chunkText: string;
  sourceIndex?: number;  // For citation references [Source 1], [Source 2], etc.
  chunkId?: number;      // Database ID for audit trail
}

export interface RAGResult {
  synthesizedAnswer?: string;   // Newer API key
  answer?: string;              // Older fallback key
  rankedChunks?: RankedChunk[]; // Newer API key
  chunks?: RankedChunk[];       // Older fallback key
  latencyMs?: number;           // Query processing time
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// Audit log entry for compliance
export interface AuditLogEntry {
  id: number;
  userId: string;
  queryText: string;
  retrievedChunkIds: number[];
  chunksFedToModel: number[];
  citedChunkIds: number[];
  modelResponse: string;
  documentIds: number[];
  latencyMs: number;
  createdAt: string;
}

