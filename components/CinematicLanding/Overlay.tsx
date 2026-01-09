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
            {/* Phase 1: TIME (0 - 15%) */}
            <Section className="items-center text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                >
                    <h2 className="text-4xl md:text-6xl text-white mb-6 font-serif tracking-widest" style={{ fontFamily: 'Cinzel, serif' }}>
                        Time is not measured.
                    </h2>
                    <p className="text-xl text-neutral-500 font-light tracking-[0.2em] uppercase">
                        It is experienced.
                    </p>
                </motion.div>
            </Section>

            {/* SPACER (15-35%) - Watch Macro - No Text */}
            <div className="h-[20vh]" />

            {/* Phase 2: PRECISION (35%) - Short text between Watch and Card */}
            <Section className="items-end text-right pr-12 md:pr-32 h-[50vh]">
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1 }}
                >
                    <h3 className="text-3xl md:text-5xl text-white mb-2 font-serif" style={{ fontFamily: 'Cinzel, serif' }}>
                        Precision Engineering
                    </h3>
                    <div className="h-1 w-24 bg-neutral-700 ml-auto mb-4" />
                </motion.div>
            </Section>

            {/* Phase 3: ACCESS (55%) - During Card Swipe */}
            <Section className="items-start text-left pl-12 md:pl-32 h-[50vh]">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1 }}
                >
                    <h2 className="text-5xl md:text-7xl text-white font-serif mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                        Global Access
                    </h2>
                    <p className="text-neutral-400 uppercase tracking-[0.3em] text-xs md:text-sm border-l-2 border-white pl-4">
                        Seamless. Limitless.
                    </p>
                </motion.div>
            </Section>

            {/* Phase 4: POWER / DRIVE (70%) - During Car Chase */}
            <Section className="items-center text-center h-[100vh]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mix-blend-overlay"
                >
                    <h2 className="text-8xl md:text-[10rem] text-white font-black italic tracking-tighter opacity-20" style={{ fontFamily: 'Inter, sans-serif' }}>
                        POWER
                    </h2>
                </motion.div>
            </Section>

            {/* Phase 5: EMBLEM ZOOM (80% - 95%) - Spacer mostly */}
            <div className="h-[20vh]" />

            {/* Phase 6: BRAND REVEAL / CTA (95%+) */}
            <Section className="items-center text-center h-[100vh]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 2, ease: "circOut" }}
                    className="flex flex-col items-center gap-10"
                >
                    <div className="relative">
                        <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-white z-10 relative">
                            RAGQUERY
                        </h1>
                        <div className="absolute -inset-10 bg-white/5 blur-3xl -z-10 rounded-full" />
                    </div>

                    <p className="text-xl md:text-2xl text-neutral-400 font-serif italic tracking-wide">
                        "Join the Future."
                    </p>

                    <button
                        onClick={onEnter}
                        className="mt-12 px-16 py-5 bg-white text-black text-lg font-bold tracking-[0.25em] hover:bg-neutral-200 transition-all duration-500 uppercase border border-white"
                        style={{ fontFamily: 'Cinzel, serif' }}
                    >
                        Enter System
                    </button>

                    <div className="text-xs text-neutral-600 font-mono mt-8">
                        ENCRYPTED CONNECTION ESTABLISHED
                    </div>
                </motion.div>
            </Section>
        </div>
    );
}
