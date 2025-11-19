import React from 'react';

export const Header: React.FC = () => {
  console.log('Header component rendering...');
  return (
    <header className="bg-black/50 backdrop-blur-lg border-b border-neutral-800/50 sticky top-0 z-10" style={{ minHeight: '80px' }}>
      <div className="container mx-auto px-4 md:px-8 py-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white">RAGQuery</h1>
        <p className="text-sm text-neutral-400 mt-1">Retrieval-Augmented Generation Query System</p>
      </div>
    </header>
  );
};
