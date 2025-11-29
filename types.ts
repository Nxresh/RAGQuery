export interface RankedChunk {
  relevanceScore: number;
  chunkText: string;
}

export interface RAGResult {
  synthesizedAnswer?: string;   // Newer API key
  answer?: string;              // Older fallback key
  rankedChunks?: RankedChunk[]; // Newer API key
  chunks?: RankedChunk[];       // Older fallback key
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
