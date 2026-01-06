import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
    text: string;
    speed?: number;
    onComplete?: () => void;
    stopped?: boolean;
}

import ReactMarkdown from 'react-markdown';

export const TypewriterText: React.FC<TypewriterTextProps> = ({
    text,
    speed = 10,
    onComplete,
    stopped = false
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    // If stopped, immediately show all text
    useEffect(() => {
        if (stopped && currentIndex < text.length) {
            setDisplayedText(text);
            setCurrentIndex(text.length);
            onComplete?.();
        }
    }, [stopped, text, currentIndex, onComplete]);

    useEffect(() => {
        if (stopped) return; // Don't animate if stopped

        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, speed);

            return () => clearTimeout(timeout);
        } else if (onComplete && currentIndex === text.length && text.length > 0) {
            onComplete();
        }
    }, [currentIndex, text, speed, onComplete, stopped]);

    // Reset when text changes
    useEffect(() => {
        setDisplayedText('');
        setCurrentIndex(0);
    }, [text]);

    return (
        <div className="typewriter-container">
            <ReactMarkdown>{displayedText}</ReactMarkdown>
            {currentIndex < text.length && !stopped && (
                <span className="inline-block w-2 h-5 bg-orange-500 ml-1 animate-pulse align-middle" />
            )}
        </div>
    );
};
