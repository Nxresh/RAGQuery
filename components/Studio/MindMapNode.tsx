import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ChevronRight, ChevronDown } from 'lucide-react';

export const MindMapNode = memo(({ data, isConnectable, selected }: NodeProps) => {
    const { label, isExpanded, hasChildren, onToggle, id } = data;

    const handleExpandToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasChildren) {
            onToggle(id);
        }
    };

    return (
        <div className="group relative flex items-center">
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="!bg-neutral-500 !w-1.5 !h-1.5 !border-none opacity-0 group-hover:opacity-100 transition-opacity"
            />

            <div
                className={`
                    relative rounded-full border transition-all duration-300 flex items-center justify-between gap-3
                    ${isExpanded
                        ? 'px-3 py-1.5 min-w-[100px] max-w-[200px]'
                        : 'px-4 py-2.5 min-w-[120px] max-w-[250px]'
                    }
                    ${selected
                        ? 'bg-neutral-900 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)] scale-105'
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800'
                    }
                `}
            >
                {/* Connection Line decoration */}
                {hasChildren && (
                    <div className={`absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-[1px] ${isExpanded ? 'bg-orange-500/50' : 'bg-neutral-800'}`} />
                )}

                <span className={`font-medium leading-snug truncate transition-all duration-300 ${selected ? 'text-white' : 'text-neutral-300'} ${isExpanded ? 'text-xs' : 'text-sm'}`}>
                    {label}
                </span>

                {hasChildren && (
                    <div
                        onClick={handleExpandToggle}
                        className={`
                            p-0.5 rounded-full transition-colors hover:bg-white/10 shrink-0
                            ${isExpanded ? 'text-orange-500' : 'text-neutral-600'}
                        `}
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="!bg-neutral-500 !w-1.5 !h-1.5 !border-none opacity-0 group-hover:opacity-100 transition-opacity"
            />
        </div>
    );
});

MindMapNode.displayName = 'MindMapNode';
