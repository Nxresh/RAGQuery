import { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll, Environment, Sparkles, Float, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';

// --- ASSET PLACEHOLDERS (Replace with real GLBs) ---
// To use real models:
// 1. Download models (watch.glb, car.glb) to /public/models/
// 2. Use: const { scene } = useGLTF('/models/watch.glb')
// 3. Replace the mesh primitives below with <primitive object={scene} />

// --- HIGH-END PROCEDURAL ASSETS ---

function WatchModel() {
    return (
        <group>
            {/* Case */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1, 0.1, 32, 100]} />
                <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.15} envMapIntensity={2} />
            </mesh>
            {/* Face Background */}
            <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.95, 0.95, 0.05, 32]} />
                <meshStandardMaterial color="#0a0a0a" metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Hour Markers */}
            {Array.from({ length: 12 }).map((_, i) => (
                <mesh
                    key={i}
                    position={[0.8 * Math.cos(i * Math.PI / 6), 0.8 * Math.sin(i * Math.PI / 6), 0.05]}
                    rotation={[0, 0, i * Math.PI / 6]}
                >
                    <boxGeometry args={[0.1, 0.02, 0.05]} />
                    <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} />
                </mesh>
            ))}
            {/* Hands */}
            <mesh position={[0, 0, 0.1]} rotation={[0, 0, 0.5]}>
                <boxGeometry args={[0.04, 0.7, 0.02]} />
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.1]} rotation={[0, 0, 2]}>
                <boxGeometry args={[0.04, 0.5, 0.02]} />
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.2} />
            </mesh>
        </group>
    );
}

function CardModel() {
    return (
        <group>
            {/* Card Body */}
            <mesh>
                <boxGeometry args={[3.37, 2.125, 0.05]} />
                <meshPhysicalMaterial
                    color="#111"
                    metalness={0.9}
                    roughness={0.3}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                />
            </mesh>
            {/* Chip */}
            <mesh position={[-1.2, 0.3, 0.03]}>
                <planeGeometry args={[0.5, 0.4]} />
                <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
            </mesh>
            {/* Magstrip / Detail */}
            <mesh position={[0, -0.5, 0.03]}>
                <planeGeometry args={[3, 0.2]} />
                <meshStandardMaterial color="#222" metalness={0.5} roughness={0.8} />
            </mesh>
            {/* Text */}
            <Text
                position={[0, 0, 0.04]}
                fontSize={0.25}
                color="#fff"
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            >
                RAGQUERY
            </Text>
        </group>
    );
}

function CarModel() {
    return (
        <group>
            {/* Body: Aerodynamic Shell */}
            <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0.5, 0]}>
                <capsuleGeometry args={[0.7, 3.5, 4, 16]} />
                <meshPhysicalMaterial
                    color="#001a33"
                    metalness={0.8}
                    roughness={0.2}
                    clearcoat={1}
                    clearcoatRoughness={0}
                />
            </mesh>
            {/* Cockpit */}
            <mesh position={[0, 0.8, -0.5]} rotation={[0, Math.PI / 2, 0]}>
                <capsuleGeometry args={[0.5, 1.5, 4, 16]} />
                <meshPhysicalMaterial color="#000" metalness={0.9} roughness={0} opacity={0.9} transparent />
            </mesh>
            {/* Wheels */}
            {/* Front Left */}
            <mesh position={[-0.8, 0.3, 1.2]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2, 32]} />
                <meshStandardMaterial color="#111" roughness={0.8} />
            </mesh>
            {/* Front Right */}
            <mesh position={[0.8, 0.3, 1.2]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2, 32]} />
                <meshStandardMaterial color="#111" roughness={0.8} />
            </mesh>
            {/* Rear Left */}
            <mesh position={[-0.8, 0.3, -1.2]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
                <cylinderGeometry args={[0.35, 0.35, 0.25, 32]} />
                <meshStandardMaterial color="#111" roughness={0.8} />
            </mesh>
            {/* Rear Right */}
            <mesh position={[0.8, 0.3, -1.2]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
                <cylinderGeometry args={[0.35, 0.35, 0.25, 32]} />
                <meshStandardMaterial color="#111" roughness={0.8} />
            </mesh>
            {/* Tail Lights (Red Trails) */}
            <mesh position={[0, 0.5, -2]}>
                <boxGeometry args={[1.5, 0.1, 0.1]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={8} toneMapped={false} />
            </mesh>
        </group>
    );
}

export function Scene() {
    const scroll = useScroll();
    const cameraRef = useRef<THREE.PerspectiveCamera>(null!);
    const watchRef = useRef<THREE.Group>(null!);
    const cardRef = useRef<THREE.Group>(null!);
    const carRef = useRef<THREE.Group>(null!);
    const textRef = useRef<any>(null!);

    // Animation Loop
    useFrame((state, delta) => {
        // Current scroll offset (0 to 1)
        const r = scroll.offset;

        // --- CAMERA MOVEMENT ---
        // Scene 1-2: Watch (0 - 0.3)
        // Scene 3: Card (0.3 - 0.6)
        // Scene 4: Car (0.6 - 0.8)
        // Scene 5: Reveal (0.8 - 1.0)

        // Interpolate Camera Position based on scroll
        // Start: [0, 0, 5]
        // Watch Zoom: [0, 0, 2]
        // Card Move: [2, 0, 4]
        // Car Chase: [0, 1, 6]
        // Reveal: [0, 0, 8]

        if (cameraRef.current) {
            // Simple linear interpolation logic for demo
            // Ideally use GSAP timeline synced to scroll, but manual lerp works for R3F

            // Phase 1: Watch Zoom (0 -> 0.3)
            if (r < 0.33) {
                const p = r / 0.33;
                cameraRef.current.position.z = THREE.MathUtils.lerp(5, 2, p);
                cameraRef.current.position.y = THREE.MathUtils.lerp(0, 0.5, p);
            }
            // Phase 2: Card Transition (0.33 -> 0.66)
            else if (r < 0.66) {
                const p = (r - 0.33) / 0.33;
                cameraRef.current.position.z = THREE.MathUtils.lerp(2, 4, p);
                cameraRef.current.position.x = THREE.MathUtils.lerp(0, 2, p);
                cameraRef.current.lookAt(0, 0, 0);
            }
            // Phase 3: Car/Reveal (0.66 -> 1.0)
            else {
                const p = (r - 0.66) / 0.34;
                cameraRef.current.position.x = THREE.MathUtils.lerp(2, 0, p);
                cameraRef.current.position.z = THREE.MathUtils.lerp(4, 8, p);
                cameraRef.current.position.y = THREE.MathUtils.lerp(0.5, 0, p);
            }

            cameraRef.current.lookAt(0, 0, 0);
        }

        // --- OBJECT ANIMATIONS ---

        // Watch: Spin execution
        if (watchRef.current) {
            watchRef.current.rotation.y += delta * 0.2; // Idle spin
            watchRef.current.rotation.x = r * Math.PI * 2; // Scroll spin

            // Visibility
            const visible = r < 0.35;
            watchRef.current.scale.setScalar(THREE.MathUtils.lerp(visible ? 1 : 0, visible ? 1 : 0, 0.1));
        }

        // Card: Swipe and Reveal
        if (cardRef.current) {
            // Appears at 0.3
            const visible = r > 0.3 && r < 0.65;
            const scaleNode = visible ? 1 : 0;
            cardRef.current.scale.setScalar(THREE.MathUtils.lerp(cardRef.current.scale.x, scaleNode, 0.1));

            cardRef.current.rotation.y = r * Math.PI * 4; // Fast spin
            cardRef.current.position.x = THREE.MathUtils.lerp(-5, 0, (r - 0.3) * 5); // Slide in
        }

        // Car: Drive by
        if (carRef.current) {
            const visible = r > 0.6;
            const scaleNode = visible ? 1 : 0;
            carRef.current.scale.setScalar(THREE.MathUtils.lerp(carRef.current.scale.x, scaleNode, 0.1));

            // Shake effect
            carRef.current.position.y = Math.sin(state.clock.elapsedTime * 20) * 0.02 - 1; // Low position
            carRef.current.position.z = THREE.MathUtils.lerp(-10, 0, (r - 0.6) * 4); // Drive forward
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 0, 5]} fov={45} />

            {/* Environment & Lighting */}
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />

            {/* Floating Particles */}
            <Sparkles count={50} scale={10} size={4} speed={0.4} opacity={0.5} color="#ffffff" />

            {/* --- OBJECTS --- */}

            {/* 1. Watch (Time) */}
            <group ref={watchRef}>
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <WatchModel />
                </Float>
            </group>

            {/* 2. Card (Trust) */}
            <group ref={cardRef} position={[0, 0, 0]} scale={0}>
                <Float speed={4} rotationIntensity={1} floatIntensity={0.5}>
                    <CardModel />
                </Float>
            </group>

            {/* 3. Car (Power) */}
            <group ref={carRef} position={[0, -1, 0]} scale={0}>
                <CarModel />
                {/* Speed lines */}
                <Sparkles count={100} scale={[2, 0.5, 5]} position={[0, 0.5, 0]} speed={5} color="#00ffff" opacity={0.3} size={10} />
            </group>

        </>
    );
}
