import React from 'react';
import { RAGResult } from '../types';
import Loader from './Loader';
import { SearchIcon } from './icon/SearchIcon';

interface ResultsDisplayProps {
  results: RAGResult | null;
  isLoading: boolean;
  error: string | null;
  hasSubmitted: boolean;
}

const WelcomeMessage = () => (
  <div className="text-center p-8 border border-neutral-800 bg-neutral-950/50 rounded-2xl h-full flex flex-col justify-center items-center">
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center mb-6">
       <SearchIcon className="w-8 h-8 text-white"/>
    </div>
    <h3 className="text-2xl font-semibold text-neutral-100 mb-2">Analysis Results</h3>
    <p className="text-neutral-400 max-w-lg mx-auto">
      Provide a data source and ask a question to begin. The AI will generate a synthesized answer and show you the most relevant passages from the source text.
    </p>
  </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-xl" role="alert">
    <strong className="font-bold">An Error Occurred</strong>
    <span className="block mt-1">{message}</span>
  </div>
);

const RelevanceBar: React.FC<{ score: number }> = ({ score }) => {
  const width = `${score}%`;
  return (
    <div className="w-full bg-neutral-700/50 rounded-full h-1 my-1">
      <div 
        className="bg-gradient-to-r from-orange-500 to-orange-400 h-1 rounded-full" 
        style={{ width }}
      ></div>
    </div>
  );
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isLoading, error, hasSubmitted }) => {
  if (isLoading) {
    return <div className="flex justify-center items-center h-full min-h-[400px]"><Loader /></div>;
  }
  
  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (!hasSubmitted) {
    return <WelcomeMessage />;
  }
  
  if (!results) {
    return null; 
  }

    // Defensive checks for results structure
    const synthesizedAnswer = results?.synthesizedAnswer || results?.answer || 'No answer generated';
    const rankedChunks = results?.rankedChunks || results?.chunks || [];

    if (!Array.isArray(rankedChunks)) {
      console.error('rankedChunks is not an array:', rankedChunks);
      return (
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
          <h2 className="text-xl font-semibold text-neutral-100 mb-4">Result</h2>
          <p className="text-neutral-300">{synthesizedAnswer}</p>
        </div>
      );
    }

    return (
      <div className="space-y-10">
        {/* Synthesized Answer Section */}
        <section>
          <h2 className="text-xl font-semibold text-neutral-100 mb-4">Synthesized Answer</h2>
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl prose prose-invert max-w-none prose-p:text-neutral-300 prose-p:leading-relaxed">
            <p>{synthesizedAnswer}</p>
          </div>
        </section>

        {/* Ranked Chunks Section */}
        {rankedChunks.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-neutral-100 mb-4">Top Relevant Passages</h2>
            <div className="space-y-4">
              {rankedChunks.map((chunk: { relevanceScore: number; chunkText: string }, index: number) => (
                <div key={index} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 transition-all duration-300 hover:border-orange-500/30 hover:bg-neutral-800/20">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-orange-400">Relevance Score</span>
                    <span className="text-sm font-semibold text-neutral-200">{chunk.relevanceScore}%</span>
                  </div>
                  <RelevanceBar score={chunk.relevanceScore} />
                  <blockquote className="mt-4 text-neutral-400 border-l-2 border-neutral-700 pl-4 text-sm leading-relaxed">
                    {chunk.chunkText}
                  </blockquote>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
};