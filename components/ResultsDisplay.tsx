import React, { useState } from 'react';
import { RAGResult } from '../types';
import Loader from './Loader';
import { SearchIcon } from './icon/SearchIcon';
import { FormattedAnswer } from './FormattedAnswer';

interface ResultsDisplayProps {
  results: RAGResult | null;
  isLoading: boolean;
  error: string | null;
  hasSubmitted: boolean;
  onAskFollowUp?: (question: string) => void;
}

const WelcomeMessage = () => (
  <div className="text-center p-8 border border-neutral-800 bg-neutral-950/50 rounded-2xl h-full flex flex-col justify-center items-center">
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center mb-6">
      <SearchIcon className="w-8 h-8 text-white" />
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

const InteractivePassage: React.FC<{
  chunk: { relevanceScore: number; chunkText: string };
  index: number;
  onAskQuestion?: (question: string) => void;
}> = ({ chunk, index, onAskQuestion }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(chunk.chunkText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAskQuestion = () => {
    const question = prompt('Ask a question about this passage:');
    if (question && onAskQuestion) {
      onAskQuestion(`Based on passage ${index + 1}: ${question}`);
    }
  };

  return (
    <div className="group bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-6 transition-all duration-300 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/30">
            {index + 1}
          </div>
          <div>
            <span className="text-xs font-medium text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full">
              Passage {index + 1}
            </span>
            <div className="text-sm font-semibold text-neutral-200 mt-1">{chunk.relevanceScore}% Match</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-orange-400 transition-colors px-3 py-2 rounded-lg hover:bg-neutral-800"
            title="Copy to clipboard"
          >
            {isCopied ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>

          {onAskQuestion && (
            <button
              onClick={handleAskQuestion}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-orange-400 transition-colors px-3 py-2 rounded-lg hover:bg-neutral-800"
              title="Ask a question about this passage"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ask
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-orange-400 transition-colors px-3 py-2 rounded-lg hover:bg-neutral-800"
          >
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Relevance Bar */}
      <div className="w-full bg-neutral-700/50 rounded-full h-2 mb-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full transition-all duration-500 shadow-lg shadow-orange-500/50"
          style={{ width: `${chunk.relevanceScore}%` }}
        ></div>
      </div>

      {/* Passage Text */}
      <blockquote
        className={`text-neutral-300 border-l-4 border-orange-500/50 pl-4 text-sm leading-relaxed transition-all duration-300 ${isExpanded ? 'max-h-none' : 'max-h-24 overflow-hidden'
          }`}
      >
        {chunk.chunkText}
      </blockquote>

      {!isExpanded && chunk.chunkText.length > 200 && (
        <div className="mt-3 text-xs text-neutral-500 italic flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Click "Expand" to read more...
        </div>
      )}
    </div>
  );
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isLoading, error, hasSubmitted, onAskFollowUp }) => {
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

  // Limit to top 2 passages
  const topPassages = rankedChunks.slice(0, 2);

  return (
    <div className="space-y-10">
      {/* Synthesized Answer Section */}
      <section>
        <h2 className="text-xl font-semibold text-neutral-100 mb-4">Synthesized Answer</h2>
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
          <FormattedAnswer text={synthesizedAnswer} />
        </div>
      </section>

      {/* Interactive Passages Section */}
      {topPassages.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-neutral-100 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Top {topPassages.length} Relevant Passages
          </h2>
          <div className="space-y-4">
            {topPassages.map((chunk: { relevanceScore: number; chunkText: string }, index: number) => (
              <InteractivePassage
                key={index}
                chunk={chunk}
                index={index}
                onAskQuestion={onAskFollowUp}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};