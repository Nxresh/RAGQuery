export interface RankedChunk {
  relevanceScore: number;
  chunkText: string;
}

export interface RAGResult {
  synthesizedAnswer: string;
  rankedChunks: RankedChunk[];
}
