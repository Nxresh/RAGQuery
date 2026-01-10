import { useEffect, useRef } from 'react';

interface ParticlesProps {
    count?: number;
    color?: string;
    opacity?: number;
}

export function Particles({ count = 50, color = '#ffffff', opacity = 0.3 }: ParticlesProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();

        const particles: Array<{
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            opacity: number;
        }> = [];

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2.5 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.5 + 0.2,
            });
        }

        let animationId: number;

        function animate() {
            if (!canvas || !ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle) => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalAlpha = particle.opacity * opacity;
                ctx.fill();

                // Smooth movement
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Wrap around edges smoothly
                if (particle.x < -10) particle.x = canvas.width + 10;
                if (particle.x > canvas.width + 10) particle.x = -10;
                if (particle.y < -10) particle.y = canvas.height + 10;
                if (particle.y > canvas.height + 10) particle.y = -10;
            });

            animationId = requestAnimationFrame(animate);
        }

        animate();

        window.addEventListener('resize', resizeCanvas);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [count, color, opacity]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-0"
        />
    );
}
