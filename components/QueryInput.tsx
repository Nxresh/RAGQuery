import React from 'react';
import { SearchIcon } from './icon/SearchIcon';

interface QueryInputProps {
  query: string;
  setQuery: (query: string) => void;
  onSubmit: () => void;
  isDisabled: boolean;
}

export const QueryInput: React.FC<QueryInputProps> = ({ query, setQuery, onSubmit, isDisabled }) => {
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isDisabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className="space-y-4">
      <label htmlFor="query-input" className="sr-only">Your question</label>
      <textarea
        id="query-input"
        rows={4}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g., What are the key takeaways from the document?"
        aria-label="Your question"
        className="block w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm text-neutral-200 disabled:opacity-50 transition-colors"
        disabled={isDisabled}
      />
      <button
        onClick={onSubmit}
        disabled={isDisabled}
        className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-sm text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-black disabled:bg-orange-600/50 disabled:cursor-not-allowed transition-all duration-300"
      >
        <SearchIcon className="w-5 h-5 mr-2 -ml-1" />
        Analyze & Answer
      </button>
    </div>
  );
};