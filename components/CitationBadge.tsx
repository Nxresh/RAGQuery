import React, { useState } from 'react';

interface CitationBadgeProps {
    sourceIndex: number;
    pageNumber?: number | null;
    sectionId?: string | null;
    documentTitle?: string | null;
    chunkText?: string;
    onClick?: () => void;
}

/**
 * Clickable citation badge component for inline citations
 * Displays as [Source X, p.Y] and shows preview on hover/click
 */
export const CitationBadge: React.FC<CitationBadgeProps> = ({
    sourceIndex,
    pageNumber,
    sectionId,
    documentTitle,
    chunkText,
    onClick
}) => {
    const [showPreview, setShowPreview] = useState(false);

    // Format citation text
    let citationText = `Source ${sourceIndex}`;
    if (pageNumber) citationText += `, p.${pageNumber}`;
    if (sectionId) citationText += `, §${sectionId}`;

    return (
        <span className="relative inline-block">
            <button
                onClick={() => {
                    setShowPreview(!showPreview);
                    onClick?.();
                }}
                onMouseEnter={() => setShowPreview(true)}
                onMouseLeave={() => setShowPreview(false)}
                className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-medium 
                           bg-orange-500/20 text-orange-400 rounded border border-orange-500/30
                           hover:bg-orange-500/30 hover:border-orange-500/50 transition-all
                           cursor-pointer"
            >
                [{citationText}]
            </button>

            {/* Preview Popup */}
            {showPreview && chunkText && (
                <div className="absolute z-50 bottom-full left-0 mb-2 w-80 max-h-48 overflow-y-auto
                                bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl p-3
                                animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {documentTitle && (
                        <div className="text-xs font-semibold text-orange-400 mb-1 truncate">
                            📄 {documentTitle}
                        </div>
                    )}
                    {pageNumber && (
                        <div className="text-xs text-neutral-500 mb-2">
                            Page {pageNumber}{sectionId ? `, Section ${sectionId}` : ''}
                        </div>
                    )}
                    <div className="text-xs text-neutral-300 leading-relaxed line-clamp-6">
                        "{chunkText}"
                    </div>
                </div>
            )}
        </span>
    );
};

/**
 * Parse text and replace citation markers with CitationBadge components
 * Looks for patterns like [Source 1], [Source 2, p.5], [Source 3, §4.3]
 */
export function parseCitations(
    text: string,
    chunks: Array<{
        sourceIndex: number;
        pageNumber?: number | null;
        sectionId?: string | null;
        documentTitle?: string | null;
        chunkText?: string;
    }>
): React.ReactNode[] {
    const citationPattern = /\[Source\s+(\d+)(?:,\s*p\.?(\d+))?(?:,\s*§([\d.]+))?\]/gi;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = citationPattern.exec(text)) !== null) {
        // Add text before the citation
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        const sourceIndex = parseInt(match[1]);
        const chunk = chunks.find(c => c.sourceIndex === sourceIndex);

        if (chunk) {
            parts.push(
                <CitationBadge
                    key={`citation-${key++}`}
                    sourceIndex={sourceIndex}
                    pageNumber={match[2] ? parseInt(match[2]) : chunk.pageNumber}
                    sectionId={match[3] || chunk.sectionId}
                    documentTitle={chunk.documentTitle}
                    chunkText={chunk.chunkText}
                />
            );
        } else {
            // If chunk not found, render as plain text badge
            parts.push(
                <span
                    key={`citation-text-${key++}`}
                    className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-medium 
                               bg-neutral-700/50 text-neutral-400 rounded border border-neutral-600"
                >
                    [{match[0].slice(1, -1)}]
                </span>
            );
        }

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
}

export default CitationBadge;
