import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Scroll, Loader } from '@react-three/drei';
import { Scene } from './Scene';
import { Overlay } from './Overlay';

interface CinematicExperienceProps {
    onEnter: () => void;
}

export function CinematicExperience({ onEnter }: CinematicExperienceProps) {
    return (
        <>
            <Canvas
                camera={{ position: [0, 0, 5], fov: 45 }}
                shadows
                dpr={[1, 2]} // Optimize pixel ratio
                gl={{ antialias: false, toneMappingExposure: 1.2, powerPreference: 'high-performance' }}
                className="bg-[#050505]"
            >
                <Suspense fallback={null}>
                    <ScrollControls pages={6} damping={0.2}>
                        {/* 3D Scene Content */}
                        <Scene />

                        {/* HTML Overlay Content */}
                        <Scroll html style={{ width: '100vw', height: '100vh' }}>
                            <Overlay onEnter={onEnter} />
                        </Scroll>
                    </ScrollControls>
                </Suspense>
            </Canvas>
            <Loader />
        </>
    );
}
