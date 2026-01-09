import { motion } from 'framer-motion';

interface OverlayProps {
    onEnter: () => void;
}

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <section className={`min-h-screen flex flex-col justify-center items-center p-8 ${className}`}>
        {children}
    </section>
);

export function Overlay({ onEnter }: OverlayProps) {
    return (
        <div className="w-full text-white font-light tracking-wide pointer-events-none">
            {/* Scene 1: Void Entry (Scroll 0-0.2) */}
            <Section className="items-center text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }} // Fade in
                    transition={{ duration: 1.5 }}
                >
                    <h2 className="text-3xl md:text-5xl font-extralight tracking-widest text-white mb-4">
                        Time is not measured.
                    </h2>
                    <p className="text-xl md:text-2xl text-neutral-400 font-light tracking-wide">
                        It is experienced.
                    </p>
                </motion.div>
            </Section>

            {/* Scene 2: Watch Zoom (Scroll 0.2-0.5) */}
            <Section className="items-end text-right pr-10 md:pr-20">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1 }}
                >
                    <h3 className="text-2xl md:text-4xl text-white font-light mb-2">Precision Engineering</h3>
                    <p className="text-sm md:text-base text-neutral-400 max-w-xs ml-auto">
                        Every detail crafted for absolute perfection.
                    </p>
                </motion.div>
            </Section>

            {/* Scene 3: Card / Mastercard (Scroll 0.5-0.75) */}
            <Section className="items-start text-left pl-10 md:pl-20">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-4xl md:text-6xl font-bold mb-2 text-white">
                        Global Access
                    </h2>
                    <p className="text-neutral-400 uppercase tracking-[0.2em] text-sm">
                        Zero Friction Transaction
                    </p>
                </motion.div>
            </Section>

            {/* Scene 4: Neural Nexus (Scroll 0.75-1.0) */}
            <Section className="items-center text-center">
                <motion.h2
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="text-5xl md:text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                >
                    ABSOLUTE<br />INTELLIGENCE
                </motion.h2>
            </Section>

            {/* Spacer for transition */}
            <div className="h-[50vh]" />

            {/* Final Reveal & Action */}
            <Section className="items-center text-center h-[100vh]">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    className="flex flex-col items-center gap-8 pointer-events-auto bg-black/80 p-16 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl"
                >
                    <h1 className="text-6xl md:text-9xl font-bold tracking-tighter mb-2 text-white">
                        RAGQUERY
                    </h1>
                    <p className="text-xl md:text-2xl text-neutral-300 max-w-2xl text-center leading-relaxed font-light">
                        The world's most advanced AI. <br />
                        Your new reality starts here.
                    </p>

                    <button
                        onClick={onEnter}
                        className="mt-8 px-12 py-4 bg-white text-black text-lg font-bold tracking-widest hover:bg-neutral-200 transition-all duration-300 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    >
                        ENTER EXPERIENCE
                    </button>
                </motion.div>
            </Section>
        </div>
    );
}
