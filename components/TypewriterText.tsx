import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
    text: string;
    speed?: number;
    onComplete?: () => void;
}

import ReactMarkdown from 'react-markdown';

export const TypewriterText: React.FC<TypewriterTextProps> = ({
    text,
    speed = 10,
    onComplete
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, speed);

            return () => clearTimeout(timeout);
        } else if (onComplete && currentIndex === text.length && text.length > 0) {
            onComplete();
        }
    }, [currentIndex, text, speed, onComplete]);

    // Reset when text changes
    useEffect(() => {
        setDisplayedText('');
        setCurrentIndex(0);
    }, [text]);

    return (
        <div className="typewriter-container">
            <ReactMarkdown>{displayedText}</ReactMarkdown>
            {currentIndex < text.length && (
                <span className="inline-block w-2 h-5 bg-orange-500 ml-1 animate-pulse align-middle" />
            )}
        </div>
    );
};
