import React, { useState, useCallback } from 'react';
import { Header } from './components/header';
import { DataSourceInput } from './components/DataSourceInput';
import { QueryInput } from './components/QueryInput';
import { ResultsDisplay } from './components/ResultsDisplay';
import { RAGResult } from './types';
import { performRAG, scrapeContentFromURL } from './services/geminiService';

console.log('App component file loaded');

export default function App(): React.JSX.Element {
  console.log('App() function called');
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<RAGResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setDocumentContent(text);
        setFileName(file.name);
        setResults(null);
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        setDocumentContent(null);
        setFileName(null);
      }
      reader.readAsText(file);
    } else {
      setDocumentContent(null);
      setFileName(null);
    }
  };

  const handleUrlSubmit = useCallback(async (url: string) => {
    if (!url.trim()) {
      setError('Please enter a valid URL.');
      return;
    }

    setIsScraping(true);
    setError(null);
    setResults(null);
    setDocumentContent(null);
    setFileName(null);

    try {
      const scrapedContent = await scrapeContentFromURL(url);
      setDocumentContent(scrapedContent);
      setFileName(url);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during scraping.');
      setDocumentContent(null);
      setFileName(null);
    } finally {
      setIsScraping(false);
    }
  }, []);

  const handleClearDataSource = () => {
    setDocumentContent(null);
    setFileName(null);
    setResults(null);
    setError(null);
    setQuery(''); // Also clear the query input for a fresh start.
  };

  const handleSubmit = useCallback(async () => {
    if (!query.trim() || !documentContent) {
      setError('Please provide a document or URL and enter a query.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const ragResult = await performRAG(documentContent, query);
      setResults(ragResult);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [documentContent, query]);

  console.log('App render function executing...');
  
  return (
    <div className="min-h-screen bg-black font-sans text-neutral-200">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Controls Column */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-8">
            <section>
              <h2 className="text-lg font-medium text-neutral-400 mb-3">Data Source</h2>
              <DataSourceInput
                onFileChange={handleFileChange}
                onUrlSubmit={handleUrlSubmit}
                onClear={handleClearDataSource}
                fileName={fileName}
                isScraping={isScraping}
              />
            </section>
            <section>
               <h2 className="text-lg font-medium text-neutral-400 mb-3">Your Question</h2>
              <QueryInput
                query={query}
                setQuery={setQuery}
                onSubmit={handleSubmit}
                isDisabled={!documentContent || isLoading || isScraping}
              />
            </section>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-8 xl:col-span-9">
             <ResultsDisplay 
                results={results}
                isLoading={isLoading}
                error={error}
                hasSubmitted={!!(isLoading || error || results)}
              />
          </div>
        </div>
      </main>
    </div>
  );
}