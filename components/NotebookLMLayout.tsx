import React, { useState, useEffect, useRef } from 'react';
import { LinkInput } from './SourceInput/LinkInput';
import { FileUploadGrid } from './SourceInput/FileUploadGrid';
import { SourceManager } from './SourceInput/SourceManager';
import { RAGResult } from '../types';
import { TypewriterText } from './TypewriterText';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { User } from 'firebase/auth';
import './ChatStyles.css';

interface Source {
    id: number;
    title: string;
    type: string;
    content: string;
    created_at: string;
}

interface ConversationItem {
    id: number;
    query: string;
    result: RAGResult;
    timestamp: Date;
}

interface Project {
    id: number;
    name: string;
    source_ids: number[];
    created_at?: string;
}

interface NotebookLMLayoutProps {
    onSignOut: () => void;
    user?: User | null;
}

export const NotebookLMLayout: React.FC<NotebookLMLayoutProps> = ({ onSignOut, user }) => {
    const [sources, setSources] = useState<Source[]>([]);
    const [selectedSources, setSelectedSources] = useState<number[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isQuerying, setIsQuerying] = useState(false);
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    // const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Handled by SidebarProvider
    const [currentQuery, setCurrentQuery] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Projects & Search State
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Load sources and projects from backend
    useEffect(() => {
        fetchSources();
        fetchProjects();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [conversations, isQuerying]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchSources = async () => {
        try {
            const response = await fetch('/api/documents');
            const data = await response.json();
            setSources(data.documents || []);
            // Only reset selected sources if we're not in a project view (optional logic)
            // setSelectedSources((data.documents || []).map((s: Source) => s.id));
        } catch (err) {
            console.error('Failed to fetch sources:', err);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects');
            const data = await response.json();
            setProjects(data.projects || []);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
        }
    };

    const saveSource = async (title: string, content: string, type: string) => {
        const response = await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, type })
        });

        if (!response.ok) throw new Error('Failed to save source');
    };

    const handleLinkSubmit = async (url: string) => {
        setIsProcessing(true);
        setError(null);

        try {
            const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

            if (isYouTube) {
                const response = await fetch('/api/process/youtube', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });

                if (!response.ok) throw new Error('Failed to process YouTube video');

                const data = await response.json();
                await saveSource(data.title, data.content, 'youtube');
            } else {
                const response = await fetch('/api/proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'scrape',
                        payload: { url }
                    })
                });

                if (!response.ok) throw new Error('Failed to scrape website');

                const data = await response.json();
                await saveSource(url, data.content, 'url');
            }

            await fetchSources();
            setIsUploadModalOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process URL');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileUpload = async (file: File, type: string) => {
        setIsProcessing(true);
        setError(null);

        try {
            if (type === 'pdf') {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `Upload failed: ${response.status}`);
                }

                const data = await response.json();
                // Server already saves to DB, but we need to refresh the sources list
                console.log('[Upload] PDF uploaded successfully:', data.title);

            } else if (type === 'image') {
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch('/api/process/image', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `Image processing failed: ${response.status}`);
                }

                const data = await response.json();
                await saveSource(file.name, data.text, 'image');

            } else if (type === 'audio') {
                const formData = new FormData();
                formData.append('audio', file);

                const response = await fetch('/api/process/audio', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Failed to transcribe audio');

                const data = await response.json();
                await saveSource(file.name, data.transcript, 'audio');
            }

            await fetchSources();
            setIsUploadModalOpen(false);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Failed to process file');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTextUpload = async () => {
        const text = prompt('Paste your text here:');
        if (!text) return;

        setIsProcessing(true);
        try {
            await saveSource('Pasted Text', text, 'text');
            await fetchSources();
            setIsUploadModalOpen(false);
        } catch (err) {
            setError('Failed to save text');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteSource = async (id: number) => {
        try {
            await fetch(`/api/documents/${id}`, {
                method: 'DELETE'
            });
            await fetchSources();
            setSelectedSources(prev => prev.filter(sid => sid !== id));
        } catch (err) {
            setError('Failed to delete source');
        }
    };

    const handleToggleSource = (id: number) => {
        setSelectedSources(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleToggleAll = () => {
        if (selectedSources.length === sources.length) {
            setSelectedSources([]);
        } else {
            setSelectedSources(sources.map(s => s.id));
        }
    };

    const handleQuery = async () => {
        if (!currentQuery.trim()) return;
        if (selectedSources.length === 0) {
            setError('Please select at least one source');
            return;
        }

        setIsQuerying(true);
        setError(null);

        // Add user message immediately
        const tempId = Date.now();
        const query = currentQuery;
        setCurrentQuery('');

        try {
            const selectedSourcesData = sources.filter(s => selectedSources.includes(s.id));
            const combinedContent = selectedSourcesData.map(s => s.content).join('\n\n');

            const response = await fetch('/api/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'rag',
                    payload: {
                        documentContent: combinedContent,
                        query
                    }
                })
            });

            if (!response.ok) throw new Error('Query failed');

            const data = await response.json();

            // Add to conversation history
            setConversations(prev => [...prev, {
                id: tempId,
                query,
                result: data,
                timestamp: new Date()
            }]);
        } catch (err) {
            console.error('Query error:', err);
            setError(err instanceof Error ? err.message : 'Query failed');
            // Restore query if failed?
            setCurrentQuery(query);
        } finally {
            setIsQuerying(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleQuery();
        }
    };

    const handleCreateProject = async () => {
        if (selectedSources.length === 0) {
            alert('Please select at least one source to create a project.');
            return;
        }
        if (selectedSources.length > 5) {
            alert('You can select a maximum of 5 sources for a project.');
            return;
        }

        const name = prompt('Enter project name:');
        if (!name) return;

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, source_ids: selectedSources })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create project');
            }

            await fetchProjects();
            alert('Project created successfully!');
        } catch (err) {
            console.error('Create project error:', err);
            alert(err instanceof Error ? err.message : 'Failed to create project');
        }
    };

    const handleSelectProject = (project: Project) => {
        setSelectedSources(project.source_ids);
        setConversations([]); // Optional: clear chat when switching projects
        setCurrentQuery('');
    };

    // Filter sources based on search query
    const filteredSources = sources.filter(source =>
        source.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleNewChat = () => {
        setConversations([]);
        setCurrentQuery('');
    };

    return (
        <SidebarProvider>
            <div className="flex h-screen bg-black overflow-hidden w-full">
                {/* Sidebar */}
                <AppSidebar
                    user={user || undefined}
                    onNewChat={handleNewChat}
                    projects={projects}
                    onSelectProject={handleSelectProject}
                    onCreateProject={handleCreateProject}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                >
                    <div className="mb-4">
                        <h2 className="text-xs font-medium text-neutral-500 mb-2 px-2 uppercase tracking-wider">Sources</h2>
                        <SourceManager
                            sources={filteredSources}
                            onDelete={handleDeleteSource}
                            selectedSources={selectedSources}
                            onToggleSource={handleToggleSource}
                            onToggleAll={handleToggleAll}
                        />
                    </div>
                </AppSidebar>

                <SidebarInset className="bg-black flex-1 flex flex-col min-w-0">
                    {/* ========== TOP BAR ========== */}
                    <div className="topbar">
                        <div className="topbar-left">
                            <SidebarTrigger className="text-neutral-400 hover:text-white mr-2" />
                            <div className="model-selector">RAG Query v2.6</div>
                        </div>

                        <div className="topbar-center">
                            Enterprise Intelligence
                        </div>

                        <div className="topbar-right">
                            <div className="topbar-icon" onClick={() => setIsUploadModalOpen(true)} title="Upload Documents">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                            </div>
                            <div className="topbar-icon" onClick={onSignOut} title="Sign Out">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* ========== CONTENT WRAPPER ========== */}
                    <div className="chat-wrapper">
                        <div className="chat-messages">
                            {conversations.length === 0 ? (
                                <div className="welcome-container">
                                    <h1 className="text-2xl font-bold mb-2 text-white">Welcome to ARES</h1>
                                    <p className="text-sm mb-6 text-neutral-400 max-w-md">
                                        Upload documents or add links to get started.
                                    </p>

                                    <div className="w-full max-w-4xl space-y-12">
                                        {/* Link Input Card - No heading */}
                                        <div className="p-1">
                                            <LinkInput onSubmit={handleLinkSubmit} isLoading={isProcessing} />
                                        </div>

                                        {/* File Upload Card - No background */}
                                        <div className="p-1">
                                            <FileUploadGrid
                                                onFileUpload={handleFileUpload}
                                                onTextUpload={handleTextUpload}
                                                isProcessing={isProcessing}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-3xl mx-auto w-full">
                                    {conversations.map((item) => (
                                        <React.Fragment key={item.id}>
                                            {/* User Message */}
                                            <div className="message-row user">
                                                <div className="message-avatar user-avatar">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                </div>
                                                <div className="message-content">
                                                    <div className="whitespace-pre-wrap">{item.query}</div>
                                                </div>
                                            </div>

                                            {/* Model Message */}
                                            <div className="message-row model">
                                                <div className="message-avatar model-avatar">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h1a7 7 0 0 1 7-7V5.73C9.4 5.39 9 4.74 9 4a2 2 0 0 1 2-2z"></path><path d="M8 14h8"></path><path d="M11 17h2"></path></svg>
                                                </div>
                                                <div className="message-content">
                                                    <div className="prose prose-invert prose-sm max-w-none">
                                                        <TypewriterText text={item.result.synthesizedAnswer || ''} speed={10} />

                                                    </div>

                                                    {/* Sources */}
                                                    {item.result.rankedChunks && item.result.rankedChunks.length > 0 && (
                                                        <div className="mt-4 pt-4 border-t border-neutral-800">
                                                            <p className="text-xs font-semibold text-neutral-500 mb-2">Sources:</p>
                                                            <div className="space-y-2">
                                                                {item.result.rankedChunks.slice(0, 3).map((chunk, idx) => (
                                                                    <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-neutral-400">
                                                                        <div className="flex justify-between mb-1">
                                                                            <span className="font-medium text-orange-500">Relevance: {chunk.relevanceScore}%</span>
                                                                        </div>
                                                                        <p className="line-clamp-2">{chunk.chunkText}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    ))}

                                    {isQuerying && (
                                        <div className="message-row model">
                                            <div className="message-avatar model-avatar">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h1a7 7 0 0 1 7-7V5.73C9.4 5.39 9 4.74 9 4a2 2 0 0 1 2-2z"></path><path d="M8 14h8"></path><path d="M11 17h2"></path></svg>
                                            </div>
                                            <div className="message-content">
                                                <div className="flex gap-1.5 items-center h-full">
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* ========== INPUT BOX ========== */}
                        <div className="chat-input-container">
                            <textarea
                                className="chat-input"
                                placeholder="Message ARES..."
                                value={currentQuery}
                                onChange={(e) => setCurrentQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                disabled={isQuerying}
                            ></textarea>
                            <button className="send-button" onClick={handleQuery} disabled={!currentQuery.trim() || isQuerying}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </div>
                    </div>
                </SidebarInset>
            </div>

            {/* Upload Modal (Optional/Secondary Access) */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-orange-900/20">
                        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Add Data Sources</h2>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-neutral-400 hover:text-white">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-8">
                            <section>
                                <h3 className="text-sm font-medium text-neutral-400 mb-3">Add from URL</h3>
                                <LinkInput onSubmit={handleLinkSubmit} isLoading={isProcessing} />
                            </section>

                            <section>
                                <h3 className="text-sm font-medium text-neutral-400 mb-3">Upload Files</h3>
                                <FileUploadGrid
                                    onFileUpload={handleFileUpload}
                                    onTextUpload={handleTextUpload}
                                    isProcessing={isProcessing}
                                />
                            </section>

                            {error && (
                                <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </SidebarProvider>
    );
};
