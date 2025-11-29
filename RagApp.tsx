import React, { useState, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { AresChat } from './components/AresChat';
import { saveDocument } from './services/geminiService';
import { TypewriterText } from './components/TypewriterText';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./components/ui/sidebar"
import { AppSidebar } from "./components/app-sidebar"


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
        <circle cx="18" cy="11" r="2.5" fill="url(#logo-gradient)" />
    </svg>
);



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
                        {isFileLoaded ? (<LoadedContentDisplay icon={<FileIcon className="w-6 h-6" />} label="File Loaded" fileName={fileName!} onClear={onClear} />) : (
                            <div
                                className={`relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-xl transition-colors duration-200 cursor-pointer ${isDragging ? 'border-orange-500 bg-neutral-900' : 'border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-900'}`}
                                onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} onClick={handleClick}
                            >
                                <input ref={inputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".txt,.md,.json,.html,.pdf,.docx" />
                                <div className="flex flex-col items-center text-center">
                                    <UploadIcon className="w-8 h-8 text-neutral-600 mb-3" />
                                    <p className="text-sm font-semibold text-neutral-300"><span className="text-orange-400">Upload a file</span> or drag and drop</p>
                                    <p className="text-xs text-neutral-500 mt-1">TXT, MD, JSON, HTML, PDF, or DOCX</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
                {activeTab === 'url' && (
                    <div className="space-y-3">
                        {isUrlLoaded ? (<LoadedContentDisplay icon={<LinkIcon className="w-6 h-6" />} label="Content From URL" fileName={fileName!} onClear={onClear} />) : (
                            <form onSubmit={handleUrlFormSubmit} className="space-y-3">
                                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/article" className="block w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm text-neutral-200 disabled:opacity-50 transition-colors" disabled={isScraping} required />
                                <button type="submit" disabled={isScraping || !url} className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-black disabled:bg-orange-600/50 disabled:cursor-not-allowed transition-colors">
                                    {isScraping ? (
                                        <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Scraping Content...</>
                                    ) : ("Scrape & Use")}
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center mb-6"><SearchIcon className="w-8 h-8 text-white" /></div>
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
                <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl prose prose-invert max-w-none prose-p:text-neutral-300 prose-p:leading-relaxed">
                    <p><TypewriterText text={results.synthesizedAnswer} speed={15} /></p>
                </div>
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


// --- MAIN APP COMPONENT ---
export default function RagApp({ user }: { user: User }): React.JSX.Element {
    const [activeTab, setActiveTab] = useState<'home' | 'chat'>('home');
    const [documentContent, setDocumentContent] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [query, setQuery] = useState<string>('');
    const [results, setResults] = useState<RAGResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isScraping, setIsScraping] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (file: File | null) => {
        if (file) {
            setIsLoading(true);
            setError(null);
            setResults(null);
            try {
                // Upload file to server (handles PDF/DOCX/TXT parsing and DB storage)
                const { uploadFile } = await import('./services/geminiService');
                const result = await uploadFile(file);
                setDocumentContent(result.content);
                setFileName(result.title);
                console.log('File uploaded and saved to memory');
            } catch (err) {
                console.error('Failed to upload file:', err);
                setError(err instanceof Error ? err.message : 'Failed to upload file');
                setDocumentContent(null);
                setFileName(null);
            } finally {
                setIsLoading(false);
            }
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

            // Save to Memory
            try {
                await saveDocument(url, scrapedContent, 'url');
                console.log('URL content saved to memory');
            } catch (err) {
                console.error('Failed to save URL to memory', err);
            }

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

    const handleNewChat = () => {
        handleClearDataSource();
        setActiveTab('home');
    };

    return (
        <SidebarProvider>
            <AppSidebar user={user} onNewChat={handleNewChat} />
            <SidebarInset className="bg-black">
                <header className="flex h-14 shrink-0 items-center gap-2 border-b border-neutral-800 bg-black px-4 sticky top-0 z-10">
                    <SidebarTrigger className="text-neutral-200 hover:bg-neutral-800" />
                    <div className="h-4 w-px bg-neutral-800 mx-2" />
                    <div className="flex items-center gap-2">
                        <LogoIcon />
                        <span className="font-semibold text-neutral-200">RAGQuery</span>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-auto">
                    {activeTab === 'home' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
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
                    ) : (
                        <div className="h-[calc(100vh-100px)]">
                            <AresChat />
                        </div>
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
