import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    size: number;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
    depth: number; // 0-1, affects size and speed
    color: string;
}

interface AntigravityParticlesProps {
    enabled?: boolean;
}

// Brighter, more electric blue/cyan palette for higher visibility
const PARTICLE_COLORS = [
    '#4da3ff', // Bright Blue
    '#00e5ff', // Electric Cyan
    '#7ec0ff', // Light Blue
    '#3B82F6', // Vivid Blue
    '#60A5FA', // Sky Blue
];

export const AntigravityParticles: React.FC<AntigravityParticlesProps> = ({
    enabled = true
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const animationRef = useRef<number>();

    useEffect(() => {
        if (!enabled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Initialize particles scattered across the screen
        const initParticles = () => {
            particlesRef.current = [];
            // Increased density (divide by smaller number)
            const particleCount = Math.floor((window.innerWidth * window.innerHeight) / 6000);

            for (let i = 0; i < particleCount; i++) {
                particlesRef.current.push(createParticle());
            }
        };

        const createParticle = (): Particle => {
            const depth = Math.random(); // 0 = far, 1 = close
            return {
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                targetX: Math.random() * window.innerWidth,
                targetY: Math.random() * window.innerHeight,
                size: 2.5 + depth * 5, // Larger size
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05, // Faster rotation
                opacity: 0.4 + depth * 0.6, // Higher opacity (up to 1.0)
                depth,
                color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
            };
        };

        initParticles();

        // Track mouse
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const mouse = mouseRef.current;

            // Update and draw particles
            particlesRef.current.forEach(particle => {
                // Calculate distance to mouse
                const dx = mouse.x - particle.x;
                const dy = mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Increased attraction radius for more responsive feel
                const attractionRadius = 600;
                // Much stronger attraction
                const attractionStrength = 0.08 + particle.depth * 0.1;

                if (distance < attractionRadius) {
                    // Pull toward cursor
                    const force = (1 - distance / attractionRadius) * attractionStrength;
                    particle.targetX = particle.x + dx * force;
                    particle.targetY = particle.y + dy * force;
                } else {
                    // Faster gentle drift when far from cursor
                    particle.targetX += (Math.random() - 0.5) * 2.5;
                    particle.targetY += (Math.random() - 0.5) * 2.5;
                }

                // Faster smoothing/inertia
                const easing = 0.08 + particle.depth * 0.05;
                particle.x += (particle.targetX - particle.x) * easing;
                particle.y += (particle.targetY - particle.y) * easing;

                // Keep particles in bounds with wrapping
                if (particle.x < -20) particle.x = canvas.width + 20;
                if (particle.x > canvas.width + 20) particle.x = -20;
                if (particle.y < -20) particle.y = canvas.height + 20;
                if (particle.y > canvas.height + 20) particle.y = -20;

                // Rotate
                particle.rotation += particle.rotationSpeed;

                // Draw shard/dash shape
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);

                // Shard shape (elongated rectangle with glow)
                const width = particle.size * 0.4;
                const height = particle.size * 2.5; // Longer shards

                // Stronger glow effect
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 10 + particle.depth * 10;

                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.opacity;

                // Draw rounded rectangle (shard)
                ctx.beginPath();
                const radius = width * 0.3;
                ctx.roundRect(-width / 2, -height / 2, width, height, radius);
                ctx.fill();

                ctx.restore();
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [enabled]);

    if (!enabled) return null;

    return (
        <>
            {/* Blue edge vignette glow */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(66, 133, 244, 0.08) 100%)',
                }}
            />
            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none z-0"
            />
        </>
    );
};
