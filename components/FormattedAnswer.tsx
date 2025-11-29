import React, { useState, useEffect } from 'react';

interface FormattedAnswerProps {
    text: string;
    speed?: number;
}

// Convert markdown-like text to professional HTML structure
function formatAnswer(text: string): JSX.Element[] {
    const elements: JSX.Element[] = [];
    let key = 0;

    // Remove markdown symbols and parse structure
    const lines = text.split('\n').filter(line => line.trim());

    let currentSection: string[] = [];
    let inList = false;

    lines.forEach((line) => {
        // Remove markdown symbols
        let cleanLine = line
            .replace(/\*\*/g, '') // Remove **
            .replace(/##/g, '')   // Remove ##
            .replace(/###/g, '')  // Remove ###
            .replace(/\*/g, '')   // Remove *
            .trim();

        // Detect headings (lines that are short and end with :)
        if (cleanLine.endsWith(':') && cleanLine.length < 60 && !cleanLine.match(/^\d+\./)) {
            // Close any open list
            if (inList && currentSection.length > 0) {
                elements.push(
                    <ul key={key++} className="space-y-2 mb-4">
                        {currentSection.map((item, i) => (
                            <li key={i} className="flex items-start">
                                <span className="text-orange-400 mr-2 mt-1">•</span>
                                <span className="text-neutral-300">{item}</span>
                            </li>
                        ))}
                    </ul>
                );
                currentSection = [];
                inList = false;
            }

            // Add heading
            elements.push(
                <h3 key={key++} className="text-lg font-bold text-white mt-6 mb-3 first:mt-0">
                    {cleanLine.replace(':', '')}
                </h3>
            );
        }
        // Detect list items (start with number or dash)
        else if (cleanLine.match(/^[\d\-•]\./)) {
            inList = true;
            const item = cleanLine.replace(/^[\d\-•]\.\s*/, '');
            currentSection.push(item);
        }
        // Regular paragraph
        else if (cleanLine.length > 0) {
            // Close any open list
            if (inList && currentSection.length > 0) {
                elements.push(
                    <ul key={key++} className="space-y-2 mb-4">
                        {currentSection.map((item, i) => (
                            <li key={i} className="flex items-start">
                                <span className="text-orange-400 mr-2 mt-1">•</span>
                                <span className="text-neutral-300">{item}</span>
                            </li>
                        ))}
                    </ul>
                );
                currentSection = [];
                inList = false;
            }

            // Check if line contains bold-worthy keywords
            const boldKeywords = ['Important', 'Note', 'Key', 'Summary', 'Conclusion', 'Benefits', 'Advantages', 'Disadvantages', 'Challenges'];
            let formattedLine = cleanLine;

            boldKeywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                formattedLine = formattedLine.replace(regex, match => `<strong>${match}</strong>`);
            });

            elements.push(
                <p
                    key={key++}
                    className="text-neutral-300 leading-relaxed mb-3"
                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                />
            );
        }
    });

    // Close any remaining list
    if (inList && currentSection.length > 0) {
        elements.push(
            <ul key={key++} className="space-y-2 mb-4">
                {currentSection.map((item, i) => (
                    <li key={i} className="flex items-start">
                        <span className="text-orange-400 mr-2 mt-1">•</span>
                        <span className="text-neutral-300">{item}</span>
                    </li>
                ))}
            </ul>
        );
    }

    return elements;
}

export const FormattedAnswer: React.FC<FormattedAnswerProps> = ({ text, speed = 15 }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, speed);
            return () => clearTimeout(timeout);
        } else if (currentIndex === text.length && text.length > 0) {
            setIsComplete(true);
        }
    }, [currentIndex, text, speed]);

    // Reset when text changes
    useEffect(() => {
        setDisplayedText('');
        setCurrentIndex(0);
        setIsComplete(false);
    }, [text]);

    if (isComplete) {
        return <div className="formatted-answer">{formatAnswer(text)}</div>;
    }

    return (
        <div className="text-neutral-300 leading-relaxed">
            <span className="whitespace-pre-wrap">{displayedText}</span>
            <span className="inline-block w-0.5 h-5 bg-orange-500 ml-1 animate-pulse" />
        </div>
    );
};
