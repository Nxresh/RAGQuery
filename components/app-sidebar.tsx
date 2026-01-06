import React from "react"
import { User } from "firebase/auth"
import { useSidebar, SidebarTrigger } from "./ui/sidebar"
import { Button } from "./ui/button"
import { HistoryPanel, HistoryItem } from "./HistoryPanel"

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
    onHistorySelect?: (item: HistoryItem) => void;
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
    const [isSearchExpanded, setIsSearchExpanded] = React.useState(false)
    const [isProjectsExpanded, setIsProjectsExpanded] = React.useState(false)
    const searchInputRef = React.useRef<HTMLInputElement>(null)

    // Focus search input when expanded
    React.useEffect(() => {
        if (isSearchExpanded && searchInputRef.current) {
            searchInputRef.current.focus()
        }
    }, [isSearchExpanded])

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
                    {/* Single Scrollable Container - ChatGPT Style */}
                    <div className="flex-1 overflow-y-auto">
                        {/* New Chat - Compact premium button */}
                        <div className="px-3 pt-2 pb-1">
                            <Button
                                onClick={onNewChat}
                                variant="premium-subtle"
                                className="w-full justify-start gap-2 py-2"
                                leftIcon={
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 8v8" />
                                        <path d="M8 12h8" />
                                    </svg>
                                }
                            >
                                New chat
                            </Button>
                        </div>

                        {/* Search Sources - Compact expandable search */}
                        <div className="px-3 pb-0.5">
                            {isSearchExpanded ? (
                                <div className="relative">
                                    <svg className="absolute left-3 top-2 h-4 w-4 text-orange-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="M21 21l-4.35-4.35" />
                                    </svg>
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search sources..."
                                        value={searchQuery}
                                        onChange={(e) => onSearchChange?.(e.target.value)}
                                        onBlur={() => !searchQuery && setIsSearchExpanded(false)}
                                        className="w-full bg-neutral-900 text-neutral-200 text-sm rounded-lg pl-9 pr-3 py-1.5 border border-orange-500/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 focus:outline-none placeholder-neutral-500 transition-all"
                                    />
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsSearchExpanded(true)}
                                    className="group flex items-center gap-2 w-full px-2 py-1.5 text-sm text-neutral-300 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all duration-200"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-orange-400">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="M21 21l-4.35-4.35" />
                                    </svg>
                                    <span>Search sources</span>
                                </button>
                            )}
                        </div>

                        {/* Library - Compact */}
                        <div className="px-3 pb-0.5">
                            <button
                                onClick={onOpenLibrary}
                                className="group flex items-center gap-2 w-full px-2 py-1.5 text-sm text-neutral-300 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all duration-200"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-orange-400">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                                <span>Library</span>
                            </button>
                        </div>

                        {/* Projects - Collapsible */}
                        <div className="px-3 pb-0.5">
                            <button
                                onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                                className="group flex items-center justify-between w-full px-2 py-1.5 text-sm text-neutral-300 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all duration-200"
                            >
                                <div className="flex items-center gap-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-orange-400">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                    <span>Projects</span>
                                    {projects.length > 0 && (
                                        <span className="text-xs text-neutral-500">({projects.length})</span>
                                    )}
                                </div>
                                <svg
                                    width="12" height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`text-neutral-500 group-hover:text-orange-400 transition-transform duration-200 ${isProjectsExpanded ? 'rotate-180' : ''}`}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                        </div>

                        {/* Projects List - Only show when expanded */}
                        {isProjectsExpanded && (
                            <div className="px-3 pb-1">
                                {projects.length > 0 ? (
                                    <div className="space-y-0 pl-5">
                                        {projects.map(project => (
                                            <div key={project.id} className="group flex items-center w-full hover:bg-white/5 rounded-md transition-all duration-200 pr-1">
                                                <button
                                                    onClick={() => onSelectProject?.(project)}
                                                    className="flex-1 flex items-center gap-2 px-2 py-1 text-sm text-neutral-500 group-hover:text-white truncate text-left transition-colors"
                                                >
                                                    <span className="truncate">{project.name}</span>
                                                </button>
                                                <div className="hidden group-hover:flex items-center gap-0.5">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onRenameProject?.(project); }}
                                                        className="p-0.5 text-neutral-500 hover:text-white transition-colors"
                                                        title="Rename"
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDeleteProject?.(project); }}
                                                        className="p-0.5 text-neutral-500 hover:text-red-400 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="pl-5 py-1 text-xs text-neutral-600 italic">No projects yet</div>
                                )}
                                {/* New Project button inside expanded section */}
                                <button
                                    onClick={onCreateProject}
                                    className="mt-1 ml-5 flex items-center gap-1 px-2 py-1 text-xs text-orange-400/70 hover:text-orange-400 transition-colors"
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    <span>New project</span>
                                </button>
                            </div>
                        )}

                        {/* Divider - Minimal */}
                        <div className="border-t border-white/5 mx-3 my-1"></div>

                        {/* Toggle Tabs: Sources / History - Compact */}
                        <div className="px-3 py-1">
                            <div className="flex bg-white/5 rounded-md p-0.5">
                                <button
                                    onClick={() => setSidebarView('sources')}
                                    className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-all ${sidebarView === 'sources'
                                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                        : 'text-neutral-500 hover:text-neutral-300'
                                        }`}
                                >
                                    Sources
                                </button>
                                <button
                                    onClick={() => setSidebarView('history')}
                                    className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-all ${sidebarView === 'history'
                                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                        : 'text-neutral-500 hover:text-neutral-300'
                                        }`}
                                >
                                    History
                                </button>
                            </div>
                        </div>


                        {/* Sources/History Content - scrolls as part of the whole container */}
                        {sidebarView === 'sources' ? (
                            <div className="px-3 py-2">
                                {children}
                            </div>
                        ) : (
                            <HistoryPanel
                                storageKey="ares_chat_history"
                                title="Chat History"
                                onSelectItem={(item) => {
                                    onHistorySelect?.(item);
                                    setSidebarView('sources');
                                }}
                            />
                        )}
                    </div>

                    {/* User Profile Section - Fixed at bottom */}
                    <div className="p-3 border-t border-white/5 flex-shrink-0">
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

