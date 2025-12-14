import React from 'react';
import { Clock, Trash2, RotateCcw } from 'lucide-react';

export interface HistoryItem {
    id: string;
    query: string;
    timestamp: number;
    type?: string;
    agent?: string;
}

interface HistoryPanelProps {
    storageKey: string;
    onSelectItem: (item: HistoryItem) => void;
    title?: string;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
    storageKey,
    onSelectItem,
    title = 'History'
}) => {
    const [items, setItems] = React.useState<HistoryItem[]>([]);
    const [isExpanded, setIsExpanded] = React.useState(true);

    // Load from localStorage
    React.useEffect(() => {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                setItems(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse history:', e);
            }
        }
    }, [storageKey]);

    const deleteItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = items.filter(item => item.id !== id);
        setItems(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
    };

    const clearAll = () => {
        setItems([]);
        localStorage.removeItem(storageKey);
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const groupByDate = (items: HistoryItem[]) => {
        const groups: { [key: string]: HistoryItem[] } = {
            'Today': [],
            'Yesterday': [],
            'This Week': [],
            'Older': []
        };

        const now = new Date();
        items.forEach(item => {
            const date = new Date(item.timestamp);
            const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) groups['Today'].push(item);
            else if (diffDays === 1) groups['Yesterday'].push(item);
            else if (diffDays < 7) groups['This Week'].push(item);
            else groups['Older'].push(item);
        });

        return groups;
    };

    const grouped = groupByDate(items);

    if (items.length === 0) {
        return (
            <div className="px-3 py-4">
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                    <Clock size={12} />
                    <span>{title}</span>
                </div>
                <p className="text-xs text-neutral-600 italic">No history yet</p>
            </div>
        );
    }

    return (
        <div className="px-3 py-2">
            {/* Header */}
            <div
                className="flex items-center justify-between cursor-pointer mb-2"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    <Clock size={12} />
                    <span>{title}</span>
                    <span className="text-neutral-600">({items.length})</span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); clearAll(); }}
                    className="text-neutral-600 hover:text-red-400 transition-colors p-1"
                    title="Clear all"
                >
                    <Trash2 size={12} />
                </button>
            </div>

            {/* Items */}
            {isExpanded && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(grouped).map(([group, groupItems]) =>
                        groupItems.length > 0 && (
                            <div key={group}>
                                <p className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider mb-1 mt-2">
                                    {group}
                                </p>
                                {groupItems.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => onSelectItem(item)}
                                        className="group flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                                    >
                                        <RotateCcw size={12} className="text-neutral-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-neutral-300 truncate">
                                                {item.query}
                                            </p>
                                            <p className="text-[10px] text-neutral-600">
                                                {item.type && <span className="text-orange-500/70">{item.type} • </span>}
                                                {formatTime(item.timestamp)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => deleteItem(item.id, e)}
                                            className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 transition-all p-1"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

// Helper function to add items to history
export const addToHistory = (storageKey: string, query: string, type?: string, agent?: string) => {
    const stored = localStorage.getItem(storageKey);
    let items: HistoryItem[] = stored ? JSON.parse(stored) : [];

    // Add new item at the beginning
    const newItem: HistoryItem = {
        id: Date.now().toString(),
        query,
        timestamp: Date.now(),
        type,
        agent
    };

    // Remove duplicate if exists
    items = items.filter(item => item.query !== query);

    // Add to beginning, limit to 50 items
    items = [newItem, ...items].slice(0, 50);

    localStorage.setItem(storageKey, JSON.stringify(items));
    return items;
};
