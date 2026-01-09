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
            {/* Scene 1: Entry */}
            <Section className="items-start text-left pl-10 md:pl-20">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="text-2xl md:text-4xl text-neutral-300 font-extralight max-w-md"
                >
                    Time is not measured.
                    <br />
                    <span className="text-white font-normal">It is experienced.</span>
                </motion.h2>
            </Section>

            {/* Spacer for transition to watch */}
            <div className="h-screen" />

            {/* Scene 2: Watch Zoom */}
            <Section className="items-end text-right pr-10 md:pr-20">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1 }}
                >
                    <h3 className="text-xl md:text-3xl font-light mb-2">Precision Engineering</h3>
                    <p className="text-sm md:text-base text-neutral-400 max-w-xs ml-auto">
                        Every detail crafted for absolute perfection.
                    </p>
                </motion.div>
            </Section>

            {/* Scene 3: Payment/Card */}
            <Section className="items-center text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-100 to-yellow-500">
                        Seamless Trust
                    </h2>
                    <p className="text-neutral-400 uppercase tracking-[0.2em] text-sm">
                        Zero Friction Transaction
                    </p>
                </motion.div>
            </Section>

            {/* Scene 4: Driving */}
            <Section className="items-start text-left pl-10">
                <motion.h2
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1 }}
                    className="text-5xl md:text-8xl font-black italic tracking-tighter text-neutral-800"
                    style={{ WebkitTextStroke: '1px rgba(255,255,255,0.2)' }}
                >
                    VELOCITY
                </motion.h2>
            </Section>

            {/* Spacer for driving sequence */}
            <div className="h-screen" />

            {/* Scene 5: Reveal */}
            <Section className="items-center text-center h-[120vh]">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    className="flex flex-col items-center gap-8 pointer-events-auto"
                >
                    <h1 className="text-6xl md:text-9xl font-bold tracking-tighter mb-4 text-white">
                        RAG<span className="text-orange-500">QUERY</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl text-center leading-relaxed">
                        The power of intelligence. <br />
                        Your new reality starts here.
                    </p>

                    <button
                        onClick={onEnter}
                        className="mt-12 px-12 py-4 bg-white text-black text-lg font-bold tracking-widest hover:bg-orange-500 hover:text-white transition-all duration-300 rounded-full"
                    >
                        ENTER EXPERIENCE
                    </button>
                </motion.div>
            </Section>
        </div>
    );
}
