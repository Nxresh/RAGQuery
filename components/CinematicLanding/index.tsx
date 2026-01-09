import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IntroSwipe } from './IntroSwipe';
import { CinematicExperience } from './CinematicExperience';

interface CinematicLandingProps {
    onComplete: () => void;
}

export function CinematicLanding({ onComplete }: CinematicLandingProps) {
    console.log('RENDER CinematicLanding');
    const [introFinished, setIntroFinished] = useState(false);

    return (
        <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden">
            {/* Hand Swipe Intro */}
            <AnimatePresence>
                {!introFinished && (
                    <IntroSwipe onComplete={() => setIntroFinished(true)} />
                )}
            </AnimatePresence>

            {/* 3D Experience (Always mounted but revealed after intro) */}
            <div
                className={`absolute inset-0 transition-opacity duration-1000 ${introFinished ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                <CinematicExperience onEnter={onComplete} />
            </div>
        </div>
    );
}
