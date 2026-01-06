import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { getDocuments, deleteDocument, StoredDocument } from '../services/geminiService';
import { TypewriterText } from './TypewriterText';
import { QueryBar } from './QueryInput/QueryBar';
import './ChatStyles.css';

export function AresChat() {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [documents, setDocuments] = useState<StoredDocument[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDocsLoading, setIsDocsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [queryHistory, setQueryHistory] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchDocuments();
        const stored = localStorage.getItem('aresQueryHistory');
        if (stored) {
            setQueryHistory(JSON.parse(stored));
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchDocuments = async () => {
        setIsDocsLoading(true);
        try {
            const data = await getDocuments();
            setDocuments(data.documents);
        } catch (error) {
            console.error('Failed to fetch documents', error);
        } finally {
            setIsDocsLoading(false);
        }
    };

    const handleDeleteDocument = async (id: number) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await deleteDocument(id);
            setDocuments(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            console.error('Failed to delete document', error);
        }
    };

    const handleSend = async (text?: string) => {
        const queryText = typeof text === 'string' ? text : input;
        if (!queryText.trim() || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: queryText };
        setHistory(prev => [...prev, userMsg]);

        const newHistory = [queryText, ...queryHistory.filter(q => q !== queryText)].slice(0, 10);
        setQueryHistory(newHistory);
        localStorage.setItem('aresQueryHistory', JSON.stringify(newHistory));

        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat/ares', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: queryText, history })
            });
            const result = await response.json();
            const modelMsg: ChatMessage = { role: 'model', content: result.response };
            setHistory(prev => [...prev, modelMsg]);
        } catch (error) {
            console.error('Chat error', error);
            setHistory(prev => [...prev, { role: 'model', content: "I'm having trouble connecting to my knowledge base right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        if (history.length > 0 && confirm('Start a new chat? Current conversation will be cleared.')) {
            setHistory([]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Extract keywords from document titles for exploration suggestions
    const extractKeywordsFromDocs = (): string[] => {
        if (documents.length === 0) return [];

        const keywords: string[] = [];

        documents.forEach(doc => {
            // Extract meaningful words from title
            const titleWords = doc.title
                .replace(/\.[^/.]+$/, '') // Remove file extension
                .replace(/[_-]/g, ' ') // Replace underscores/hyphens with spaces
                .split(/\s+/)
                .filter((w: string) => w.length > 3) // Only words > 3 chars
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
            keywords.push(...titleWords);
        });

        // Remove duplicates and shuffle for variety
        return [...new Set(keywords)].sort(() => Math.random() - 0.5);
    };

    // Netflix-style: Mix exploitation (history) + exploration (source keywords)
    const getSuggestions = (): string[] => {
        const suggestions: string[] = [];
        const sourceKeywords = extractKeywordsFromDocs();

        // If no history AND no documents, show defaults
        if (queryHistory.length === 0 && documents.length === 0) {
            return [
                "Summarize the key points from my documents",
                "What are the main themes in my knowledge base?",
                "Create a comparison of the uploaded documents"
            ];
        }

        // 80% Exploitation: From query history (safe picks)
        const historyCount = Math.min(2, queryHistory.length);
        suggestions.push(...queryHistory.slice(0, historyCount));

        // 20% Exploration: Generate suggestions from document content
        if (sourceKeywords.length > 0) {
            const explorationPrompts = [
                `Tell me about ${sourceKeywords[0]}`,
                `What does the document say about ${sourceKeywords[Math.floor(Math.random() * sourceKeywords.length)]}?`,
                `Summarize the content related to ${documents[0]?.title || 'my sources'}`
            ];
            // Add 1 exploration suggestion
            suggestions.push(explorationPrompts[Math.floor(Math.random() * explorationPrompts.length)]);
        }

        // Fill remaining slots with document-based suggestions
        if (suggestions.length < 3 && documents.length > 0) {
            suggestions.push(`What are the key points in "${documents[0].title}"?`);
        }

        return suggestions.slice(0, 3);
    };

    return (
        <div className="flex h-screen bg-black overflow-hidden">
            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden bg-neutral-900/50 backdrop-blur-sm border-r border-neutral-800/50 flex flex-col`}>
                <div className="p-4 border-b border-neutral-800/50">
                    <button
                        onClick={handleNewChat}
                        className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v8" />
                            <path d="M8 12h8" />
                        </svg>
                        New Conversation
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Knowledge Base</h3>
                        <span className="text-xs text-neutral-500">{documents.length}</span>
                    </div>
                    <div className="space-y-2">
                        {isDocsLoading ? (
                            <div className="text-neutral-500 text-xs animate-pulse">Loading...</div>
                        ) : documents.length === 0 ? (
                            <div className="text-neutral-500 text-xs">No documents yet. Upload files in the Home tab.</div>
                        ) : (
                            documents.map(doc => (
                                <div key={doc.id} className="group p-3 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-all border border-neutral-700/30 hover:border-orange-500/30">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-medium text-neutral-200 truncate mb-1" title={doc.title}>{doc.title}</h4>
                                            <p className="text-[10px] text-neutral-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteDocument(doc.id)}
                                            className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {/* ========== TOP BAR ========== */}
                <div className="topbar">
                    <div className="topbar-left">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="topbar-icon" title="Toggle Sidebar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <div className="model-selector">Ares v1.0</div>
                    </div>

                    <div className="topbar-center">
                        Ares AI Assistant
                    </div>

                    <div className="topbar-right">
                        <div className="topbar-icon" onClick={() => fetchDocuments()} title="Refresh Knowledge Base">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 4v6h-6"></path>
                                <path d="M1 20v-6h6"></path>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                        </div>
                        <div className="topbar-icon" onClick={handleNewChat} title="New Chat">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v8" />
                                <path d="M8 12h8" />
                            </svg>
                        </div>
                        <div className="topbar-icon">👤</div>
                    </div>
                </div>

                {/* ========== CONTENT WRAPPER ========== */}
                <div className="chat-wrapper">
                    <div className="chat-messages">
                        {history.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-gray-500">
                                <h3 className="text-2xl font-bold mb-4 text-gray-800">Welcome to Ares</h3>
                                <p className="mb-8">Your intelligent assistant with access to your knowledge base</p>
                                <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                                    {getSuggestions().map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setInput(suggestion)}
                                            className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-left text-sm text-gray-700"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto w-full">
                                {history.map((msg, idx) => (
                                    <div key={idx} className={`message-row ${msg.role}`}>
                                        <div className={`message-avatar ${msg.role === 'user' ? 'user-avatar' : 'model-avatar'}`}>
                                            {msg.role === 'user' ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h1a7 7 0 0 1 7-7V5.73C9.4 5.39 9 4.74 9 4a2 2 0 0 1 2-2z"></path><path d="M8 14h8"></path><path d="M11 17h2"></path></svg>
                                            )}
                                        </div>
                                        <div className="message-content">
                                            {msg.role === 'model' && idx === history.length - 1 && !isLoading ? (
                                                <TypewriterText text={msg.content} speed={15} />
                                            ) : (
                                                <div className="whitespace-pre-wrap">{msg.content}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="message-row model">
                                        <div className="message-avatar model-avatar">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h1a7 7 0 0 1 7-7V5.73C9.4 5.39 9 4.74 9 4a2 2 0 0 1 2-2z"></path><path d="M8 14h8"></path><path d="M11 17h2"></path></svg>
                                        </div>
                                        <div className="message-content">
                                            <div className="flex gap-1.5 items-center h-full">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* ========== INPUT BOX ========== */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <QueryBar
                            onSubmit={(text) => handleSend(text)}
                            isLoading={isLoading}
                            disabled={isLoading}
                            value={input}
                            onChange={setInput}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
