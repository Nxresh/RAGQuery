import React, { useState, useCallback, useRef, useEffect } from 'react';

// --- TYPES ---
export interface RankedChunk {
  relevanceScore: number;
  chunkText: string;
}

export interface RAGResult {
  synthesizedAnswer: string;
  rankedChunks: RankedChunk[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}


// --- SERVICES ---
async function callProxy(action: string, payload: object): Promise<any> {
  try {
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, payload }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`Error calling proxy for action "${action}":`, error);
    throw error;
  }
}

export async function scrapeContentFromURL(url: string): Promise<string> {
  const data = await callProxy('scrape', { url });
  return data.content;
}

export async function performRAG(documentContent: string, query: string): Promise<RAGResult> {
  const result = await callProxy('rag', { documentContent, query });
  result.rankedChunks.sort((a: RankedChunk, b: RankedChunk) => b.relevanceScore - a.relevanceScore);
  return result as RAGResult;
}

export async function askAres(history: ChatMessage[]): Promise<string> {
  const result = await callProxy('chat', { history });
  return result.response;
}


// --- ICONS ---
const FileIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const AresIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="ares-gradient" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F97316" />
                <stop offset="1" stopColor="#EA580C" />
            </linearGradient>
        </defs>
        <path d="M12 2C10.6868 2 9.5 3.1868 9.5 4.5V6.5H14.5V4.5C14.5 3.1868 13.3132 2 12 2Z" fill="url(#ares-gradient)" />
        <path d="M5 6.5C5 5.11929 6.11929 4 7.5 4H9.5V11C9.5 12.1046 10.3954 13 11.5 13H12.5C13.6046 13 14.5 12.1046 14.5 11V4H16.5C17.8807 4 19 5.11929 19 6.5V14.5C19 18.0899 15.866 21 12 21C8.13401 21 5 18.0899 5 14.5V6.5Z" fill="url(#ares-gradient)" />
        <path d="M11.5 13H12.5" stroke="#FED7AA" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M3.49999 12C3.5 7.5 7.5 3.5 12 3.5C16.5 3.5 20.5 7.5 20.5 12C20.5 16.5 16.5 20.5 12 20.5C7.5 20.5 3.5 16.5 3.49999 12Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 16L12 8M12 8L15 11M12 8L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const RetryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.18-3.185m-3.181-4.991A8.25 8.25 0 002.985 19.644l3.182-3.182m0 0l3.182-3.182m-3.182 3.182L2.985 19.644" />
  </svg>
);


// --- UI COMPONENTS ---

const LogoIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="logo-gradient" x1="4" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F97316" /> {/* Orange-500 */}
        <stop offset="1" stopColor="#FB923C" /> {/* Orange-400 */}
      </linearGradient>
    </defs>
    <rect x="4" y="10" width="20" height="14" rx="2" fill="url(#logo-gradient)" fillOpacity="0.3" />
    <rect x="6" y="7" width="20" height="14" rx="2" fill="url(#logo-gradient)" fillOpacity="0.5" />
    <rect x="8" y="4" width="20" height="14" rx="2" fill="black" stroke="url(#logo-gradient)" strokeWidth="1.5" />
    <circle cx="18" cy="11" r="2.5" fill="url(#logo-gradient)"/>
  </svg>
);

const Header: React.FC = () => {
  return (
    <header className="bg-black/50 backdrop-blur-lg border-b border-neutral-800/50 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
             <LogoIcon />
             <h1 className="text-2xl font-medium tracking-tight">
               <span className="font-semibold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">RAG</span>
               <span className="font-normal text-neutral-400">Query</span>
             </h1>
          </div>
        </div>
      </div>
    </header>
  );
};

const Loader: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-neutral-800 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-t-4 border-orange-500 rounded-full animate-spin"></div>
      </div>
      <p className="text-neutral-400 font-medium">Generating Answer...</p>
    </div>
);

const DataSourceInput: React.FC<{
  onFileChange: (file: File | null) => void;
  onUrlSubmit: (url: string) => Promise<void>;
  onClear: () => void;
  fileName: string | null;
  isScraping: boolean;
}> = ({ onFileChange, onUrlSubmit, onClear, fileName, isScraping }) => {
    const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
    const [url, setUrl] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onFileChange(e.dataTransfer.files[0]);
        }
    }, [onFileChange]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
        onFileChange(e.target.files[0]);
        }
    };

    const handleClick = () => { inputRef.current?.click(); };
    
    const handleUrlFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUrlSubmit(url);
    };

    const isFileLoaded = fileName && !fileName.startsWith('http');
    const isUrlLoaded = fileName && fileName.startsWith('http');
    
    const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
        <button
            onClick={onClick}
            className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${active ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}
        >{children}</button>
    );

    const LoadedContentDisplay: React.FC<{ icon: React.ReactNode, label: string, fileName: string, onClear: () => void }> = ({ icon, label, fileName, onClear }) => (
        <div className="flex items-center space-x-4 text-sm p-4 bg-neutral-900 border border-neutral-800 rounded-xl relative">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-orange-400 bg-neutral-800 rounded-lg">{icon}</div>
            <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-200 truncate">{label}:</p>
            <p className="text-neutral-400 truncate">{fileName}</p>
            </div>
            <button onClick={onClear} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-800 hover:text-red-400 transition-colors" aria-label="Remove data source"><TrashIcon className="w-5 h-5" /></button>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-1 flex items-center space-x-1">
                <TabButton active={activeTab === 'file'} onClick={() => setActiveTab('file')}><UploadIcon className="w-4 h-4" /><span>File</span></TabButton>
                <TabButton active={activeTab === 'url'} onClick={() => setActiveTab('url')}><LinkIcon className="w-4 h-4" /><span>URL</span></TabButton>
            </div>
            <div className="min-h-[140px]">
                {activeTab === 'file' && (
                    <>
                        {isFileLoaded ? ( <LoadedContentDisplay icon={<FileIcon className="w-6 h-6" />} label="File Loaded" fileName={fileName!} onClear={onClear} /> ) : (
                        <div
                            className={`relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-xl transition-colors duration-200 cursor-pointer ${isDragging ? 'border-orange-500 bg-neutral-900' : 'border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-900'}`}
                            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} onClick={handleClick}
                        >
                            <input ref={inputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".txt,.md,.json,.html" />
                            <div className="flex flex-col items-center text-center">
                            <UploadIcon className="w-8 h-8 text-neutral-600 mb-3" />
                            <p className="text-sm font-semibold text-neutral-300"><span className="text-orange-400">Upload a file</span> or drag and drop</p>
                            <p className="text-xs text-neutral-500 mt-1">TXT, MD, JSON, or HTML</p>
                            </div>
                        </div>
                        )}
                    </>
                )}
                {activeTab === 'url' && (
                    <div className="space-y-3">
                        {isUrlLoaded ? ( <LoadedContentDisplay icon={<LinkIcon className="w-6 h-6" />} label="Content From URL" fileName={fileName!} onClear={onClear} />) : (
                        <form onSubmit={handleUrlFormSubmit} className="space-y-3">
                            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/article" className="block w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm text-neutral-200 disabled:opacity-50 transition-colors" disabled={isScraping} required />
                            <button type="submit" disabled={isScraping || !url} className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-black disabled:bg-orange-600/50 disabled:cursor-not-allowed transition-colors">
                                {isScraping ? (
                                    <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Scraping Content...</>
                                ) : ( "Scrape & Use" )}
                            </button>
                        </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const QueryInput: React.FC<{
  query: string;
  setQuery: (query: string) => void;
  onSubmit: () => void;
  isDisabled: boolean;
}> = ({ query, setQuery, onSubmit, isDisabled }) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isDisabled) onSubmit();
        }
    };

    return (
        <div className="space-y-4">
        <textarea id="query-input" rows={4} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g., What are the key takeaways from the document?" className="block w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm text-neutral-200 disabled:opacity-50 transition-colors" disabled={isDisabled} />
        <button onClick={onSubmit} disabled={isDisabled} className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-sm text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-black disabled:bg-orange-600/50 disabled:cursor-not-allowed transition-all duration-300">
            <SearchIcon className="w-5 h-5 mr-2 -ml-1" />Analyze & Answer
        </button>
        </div>
    );
};

const ResultsDisplay: React.FC<{
  results: RAGResult | null;
  isLoading: boolean;
  error: string | null;
  hasSubmitted: boolean;
}> = ({ results, isLoading, error, hasSubmitted }) => {
    const WelcomeMessage = () => (
        <div className="text-center p-8 border border-neutral-800 bg-neutral-950/50 rounded-2xl h-full flex flex-col justify-center items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center mb-6"><SearchIcon className="w-8 h-8 text-white"/></div>
            <h3 className="text-2xl font-semibold text-neutral-100 mb-2">Analysis Results</h3>
            <p className="text-neutral-400 max-w-lg mx-auto">Provide a data source and ask a question to begin. The AI will generate a synthesized answer and show you the most relevant passages from the source text.</p>
        </div>
    );

    const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-xl" role="alert">
            <strong className="font-bold">An Error Occurred</strong>
            <span className="block mt-1">{message}</span>
        </div>
    );

    const RelevanceBar: React.FC<{ score: number }> = ({ score }) => (
        <div className="w-full bg-neutral-700/50 rounded-full h-1 my-1">
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 h-1 rounded-full" style={{ width: `${score}%` }}></div>
        </div>
    );

    if (isLoading) return <div className="flex justify-center items-center h-full min-h-[400px]"><Loader /></div>;
    if (error) return <ErrorDisplay message={error} />;
    if (!hasSubmitted) return <WelcomeMessage />;
    if (!results) return null;

    return (
        <div className="space-y-10">
        <section>
            <h2 className="text-xl font-semibold text-neutral-100 mb-4">Synthesized Answer</h2>
            <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl prose prose-invert max-w-none prose-p:text-neutral-300 prose-p:leading-relaxed"><p>{results.synthesizedAnswer}</p></div>
        </section>
        <section>
            <h2 className="text-xl font-semibold text-neutral-100 mb-4">Top Relevant Passages</h2>
            <div className="space-y-4">
            {results.rankedChunks.map((chunk, index) => (
                <div key={index} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 transition-all duration-300 hover:border-orange-500/30 hover:bg-neutral-800/20">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-orange-400">Relevance Score</span>
                    <span className="text-sm font-semibold text-neutral-200">{chunk.relevanceScore}%</span>
                </div>
                <RelevanceBar score={chunk.relevanceScore} />
                <blockquote className="mt-4 text-neutral-400 border-l-2 border-neutral-700 pl-4 text-sm leading-relaxed">{chunk.chunkText}</blockquote>
                </div>
            ))}
            </div>
        </section>
        </div>
    );
};

// --- ARES CHAT COMPONENTS ---

const AresFab: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="fixed bottom-6 right-6 z-20 w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full shadow-lg flex items-center justify-center hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-black" aria-label="Open Ares Assistant">
        <AresIcon className="w-8 h-8"/>
    </button>
);

const AresTypingLoader: React.FC = () => (
    <div className="flex items-center space-x-1.5 p-3">
        <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"></div>
    </div>
);

const AresChatModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    history: ChatMessage[];
    onSubmit: (message: string) => void;
    onRetry: () => void;
    isLoading: boolean;
    error: { message: string } | null;
}> = ({ isOpen, onClose, history, onSubmit, onRetry, isLoading, error }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSubmit(input);
            setInput('');
        }
    };
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isLoading, error]);

    if (!isOpen) return null;

    const ChatError: React.FC<{ message: string; onRetry: () => void; }> = ({ message, onRetry }) => (
      <div className="flex justify-end">
        <div className="flex flex-col items-end space-y-2">
            <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-2 rounded-xl rounded-br-lg max-w-sm md:max-w-md">
                <p className="text-sm font-semibold">Failed to get response</p>
                <p className="text-xs mt-1">{message}</p>
            </div>
            <button onClick={onRetry} className="flex items-center space-x-2 text-sm text-orange-400 hover:text-orange-300 font-semibold px-3 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors">
                <RetryIcon />
                <span>Retry</span>
            </button>
        </div>
      </div>
    );

    return (
        <div className="fixed inset-0 z-30 flex items-end justify-end p-4 md:p-6" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative flex flex-col w-full max-w-lg h-[85vh] max-h-[700px] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl transition-transform transform-gpu animate-slide-in">
                <header className="flex items-center justify-between p-4 border-b border-neutral-800 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 flex items-center justify-center text-orange-400"><AresIcon className="w-6 h-6"/></div>
                        <h2 className="text-lg font-semibold text-neutral-200">Ares Assistant</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200 transition-colors" aria-label="Close chat"><CloseIcon className="w-5 h-5"/></button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 space-y-4">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-sm md:max-w-md px-4 py-2.5 rounded-2xl ${msg.role === 'user' ? 'bg-orange-600 text-white rounded-br-lg' : 'bg-neutral-800 text-neutral-200 rounded-bl-lg'}`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-start"><div className="bg-neutral-800 rounded-2xl rounded-bl-lg"><AresTypingLoader /></div></div>}
                    {error && <ChatError message={error.message} onRetry={onRetry} />}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="p-4 flex-shrink-0">
                    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Ares anything..." className="flex-1 block w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm text-neutral-200 disabled:opacity-50 transition-colors" disabled={isLoading} />
                        <button type="submit" disabled={isLoading || !input.trim()} className="w-12 h-12 flex items-center justify-center rounded-full bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-black disabled:bg-orange-600/50 disabled:cursor-not-allowed transition-colors flex-shrink-0"><SendIcon className="w-5 h-5 -rotate-90"/></button>
                    </form>
                </footer>
            </div>
            <style>{`
                @keyframes slide-in {
                    from { opacity: 0; transform: translateY(2rem); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
export default function App(): React.JSX.Element {
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<RAGResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Ares Chat State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAresLoading, setIsAresLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<{ message: string } | null>(null);
  
  // Load chat history from localStorage on initial render
  useEffect(() => {
    try {
        const storedHistory = localStorage.getItem('aresChatHistory');
        if (storedHistory) {
            setChatHistory(JSON.parse(storedHistory));
        } else {
            // Add introductory message if no history exists
            setChatHistory([
                { role: 'model', content: "Greetings. I am Ares, your assistant for intellectual combat. Present your document, state your query, and we shall achieve clarity together." }
            ]);
        }
    } catch (error) {
        console.error("Failed to parse chat history from localStorage", error);
        setChatHistory([
            { role: 'model', content: "Greetings. I am Ares, your assistant for intellectual combat. Present your document, state your query, and we shall achieve clarity together." }
        ]);
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
      if (chatHistory.length > 1 || (chatHistory.length === 1 && chatHistory[0].role === 'user')) {
          localStorage.setItem('aresChatHistory', JSON.stringify(chatHistory));
      }
  }, [chatHistory]);


  const handleFileChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocumentContent(e.target?.result as string);
        setFileName(file.name);
        setResults(null);
        setError(null);
      };
      reader.onerror = () => { setError('Failed to read the file.'); setDocumentContent(null); setFileName(null); }
      reader.readAsText(file);
    } else {
      setDocumentContent(null);
      setFileName(null);
    }
  };

  const handleUrlSubmit = useCallback(async (url: string) => {
    if (!url.trim()) { setError('Please enter a valid URL.'); return; }
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
    setQuery('');
  };

  const handleSubmit = useCallback(async () => {
    if (!query.trim() || !documentContent) { setError('Please provide a document or URL and enter a query.'); return; }
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

  const handleChatSubmit = useCallback(async (newMessage: string, isRetry = false) => {
    const updatedHistory = isRetry ? [...chatHistory] : [...chatHistory, { role: 'user' as const, content: newMessage }];
    if (!isRetry) {
        setChatHistory(updatedHistory as ChatMessage[]);
    }

    setIsAresLoading(true);
    setChatError(null);
    
    try {
        const response = await askAres(updatedHistory as ChatMessage[]);
        setChatHistory(prev => [...prev, { role: 'model' as const, content: response }]);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Ares is unavailable right now.';
        setChatError({ message });
    } finally {
        setIsAresLoading(false);
    }
  }, [chatHistory]);

  const handleChatRetry = useCallback(() => {
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (lastMessage?.role === 'user' && chatError) {
        handleChatSubmit(lastMessage.content, true);
    }
  }, [chatHistory, chatError, handleChatSubmit]);


  return (
    <div className="min-h-screen bg-black font-sans text-neutral-200">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 xl:col-span-3 space-y-8">
            <section>
              <h2 className="text-lg font-medium text-neutral-400 mb-3">Data Source</h2>
              <DataSourceInput onFileChange={handleFileChange} onUrlSubmit={handleUrlSubmit} onClear={handleClearDataSource} fileName={fileName} isScraping={isScraping} />
            </section>
            <section>
               <h2 className="text-lg font-medium text-neutral-400 mb-3">Your Question</h2>
              <QueryInput query={query} setQuery={setQuery} onSubmit={handleSubmit} isDisabled={!documentContent || isLoading || isScraping} />
            </section>
          </div>
          <div className="lg:col-span-8 xl:col-span-9">
             <ResultsDisplay results={results} isLoading={isLoading} error={error} hasSubmitted={!!(isLoading || error || results)} />
          </div>
        </div>
      </main>
      <AresFab onClick={() => setIsChatOpen(true)} />
      <AresChatModal 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        history={chatHistory}
        onSubmit={handleChatSubmit}
        onRetry={handleChatRetry}
        isLoading={isAresLoading}
        error={chatError}
      />
    </div>
  );
}