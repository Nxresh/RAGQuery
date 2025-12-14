import React from "react"
import { User } from "firebase/auth"
import { useSidebar, SidebarTrigger } from "./ui/sidebar"
import { Button } from "./ui/button"
import { HistoryPanel } from "./HistoryPanel"

interface Project {
    id: number;
    name: string;
    source_ids: number[];
    created_at?: string;
}

interface AppSidebarProps extends React.ComponentProps<"div"> {
    user?: User;
    onNewChat: () => void;
    children?: React.ReactNode;
    projects?: Project[];
    onSelectProject?: (project: Project) => void;
    onCreateProject?: () => void;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    onRenameProject?: (project: Project) => void;
    onDeleteProject?: (project: Project) => void;
    onOpenLibrary?: () => void;
    onHistorySelect?: (query: string) => void;
}

export function AppSidebar({
    user,
    onNewChat,
    children,
    className,
    projects = [],
    onSelectProject,
    onCreateProject,
    searchQuery = '',
    onSearchChange,
    onRenameProject,
    onDeleteProject,
    onOpenLibrary,
    onHistorySelect,
    ...props
}: AppSidebarProps) {
    const { open, setOpen } = useSidebar()
    const hoverRef = React.useRef(false)
    const [sidebarView, setSidebarView] = React.useState<'sources' | 'history'>('sources')

    // Expand on hover, collapse on leave
    const handleMouseEnter = () => {
        hoverRef.current = true
        setOpen(true)
    }

    const handleMouseLeave = () => {
        hoverRef.current = false
        // Collapse after a short delay
        setTimeout(() => {
            if (!hoverRef.current) {
                setOpen(false)
            }
        }, 300)
    }

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`flex flex-col h-full bg-black text-neutral-200 border-r border-white/5 transition-all duration-300 ease-out overflow-hidden ${open ? "w-[260px]" : "w-[48px]"
                } ${className}`}
            {...props}
        >
            {/* Collapsed Mini View */}
            {!open && (
                <div className="w-[48px] h-full flex flex-col items-center py-3 gap-3">
                    <button
                        onClick={onNewChat}
                        className="w-9 h-9 rounded-lg bg-white/5 hover:bg-orange-500/20 flex items-center justify-center text-neutral-400 hover:text-orange-400 transition-all"
                        title="New Chat"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v8" />
                            <path d="M8 12h8" />
                        </svg>
                    </button>
                    <button
                        onClick={onOpenLibrary}
                        className="w-9 h-9 rounded-lg hover:bg-white/5 flex items-center justify-center text-neutral-500 hover:text-white transition-all"
                        title="Library"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M3 12h18M3 18h18" />
                        </svg>
                    </button>
                    <div className="flex-1" />
                    <div className="text-xs text-neutral-600 rotate-90 whitespace-nowrap">Hover to expand</div>
                </div>
            )}

            {/* Expanded Full View */}
            {open && (
                <div className="min-w-[260px] h-full flex flex-col">
                    {/* Top Section */}
                    <div className="p-3 space-y-4">
                        <div className="flex items-center gap-2">
                            {/* New Chat Button */}
                            <Button
                                onClick={onNewChat}
                                variant="premium-subtle"
                                className="w-full justify-start gap-3"
                                leftIcon={
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 8v8" />
                                        <path d="M8 12h8" />
                                    </svg>
                                }
                            >
                                New chat
                            </Button>
                            <SidebarTrigger className="text-neutral-400 hover:text-white flex-shrink-0" />
                        </div>

                        {/* Navigation Links */}
                        <nav className="space-y-1">
                            {/* Search Input */}
                            <div className="px-3 py-2">
                                <div className="relative group">
                                    <svg className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500 group-focus-within:text-orange-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search sources..."
                                        value={searchQuery}
                                        onChange={(e) => onSearchChange?.(e.target.value)}
                                        className="w-full bg-white/5 text-neutral-200 text-sm rounded-lg pl-8 pr-3 py-2 border border-white/10 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)] focus:outline-none placeholder-neutral-600 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={onOpenLibrary}
                                className="group flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-400 hover:text-white hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent rounded-r-lg border-l-2 border-transparent hover:border-orange-500 transition-all duration-200"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform duration-200">
                                    <path d="M3 6h18M3 12h18M3 18h18" />
                                </svg>
                                <span>Library</span>
                            </button>

                            {/* Projects Section */}
                            <div className="pt-4">
                                <div className="flex items-center justify-between px-3 py-1 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    <span>Projects</span>
                                    <button onClick={onCreateProject} className="hover:text-orange-400 transition-colors" title="Create Project">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div className="mt-2 space-y-0.5">
                                    {projects.map(project => (
                                        <div key={project.id} className="group flex items-center w-full hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent rounded-r-lg border-l-2 border-transparent hover:border-orange-500 transition-all duration-200 pr-2">
                                            <button
                                                onClick={() => onSelectProject?.(project)}
                                                className="flex-1 flex items-center gap-3 px-3 py-2 text-sm text-neutral-400 group-hover:text-white truncate text-left transition-colors"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-600 group-hover:text-orange-500/80 flex-shrink-0 transition-colors">
                                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                                </svg>
                                                <span className="truncate">{project.name}</span>
                                            </button>
                                            <div className="hidden group-hover:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onRenameProject?.(project); }}
                                                    className="p-1 text-neutral-500 hover:text-white transition-colors"
                                                    title="Rename"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteProject?.(project); }}
                                                    className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {projects.length === 0 && (
                                        <div className="px-3 py-2 text-xs text-neutral-600 italic">No projects yet</div>
                                    )}
                                </div>
                            </div>
                        </nav>
                    </div>

                    {/* Toggle Tabs: Sources / History */}
                    <div className="px-3 py-2 border-b border-white/5">
                        <div className="flex bg-white/5 rounded-lg p-1">
                            <button
                                onClick={() => setSidebarView('sources')}
                                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${sidebarView === 'sources'
                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                    : 'text-neutral-500 hover:text-neutral-300'
                                    }`}
                            >
                                Sources
                            </button>
                            <button
                                onClick={() => setSidebarView('history')}
                                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${sidebarView === 'history'
                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                    : 'text-neutral-500 hover:text-neutral-300'
                                    }`}
                            >
                                History
                            </button>
                        </div>
                    </div>

                    {/* Content Section - Sources or History */}
                    <div className="flex-1 overflow-y-auto">
                        {sidebarView === 'sources' ? (
                            <div className="px-3 py-2">
                                {children}
                            </div>
                        ) : (
                            <HistoryPanel
                                storageKey="ares_chat_history"
                                title="Chat History"
                                onSelectItem={(item) => {
                                    onHistorySelect?.(item.query);
                                    setSidebarView('sources');
                                }}
                            />
                        )}
                    </div>

                    {/* User Profile Section */}
                    <div className="p-3 border-t border-white/5">
                        {user ? (
                            <div className="flex items-center gap-3 px-3 py-3 bg-gradient-to-t from-white/5 to-transparent rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-medium text-xs shadow-lg shadow-purple-900/20">
                                    {user.email ? user.email.substring(0, 2).toUpperCase() : 'NN'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-neutral-200 truncate group-hover:text-white transition-colors">
                                        {user.displayName || 'Naresh N'}
                                    </div>
                                    <div className="text-xs text-neutral-500 truncate">Free Plan</div>
                                </div>
                                <Button variant="premium-subtle" size="sm" className="h-7 px-2 text-xs">
                                    Upgrade
                                </Button>
                            </div>
                        ) : (
                            <div className="px-2 py-2 text-sm text-neutral-400">
                                Not signed in
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

