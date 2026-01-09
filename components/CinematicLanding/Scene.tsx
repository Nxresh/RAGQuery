import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll, Environment, Sparkles, Float, PerspectiveCamera, Text, Stars, Cloud, Line, PointMaterial, Points } from '@react-three/drei';
import * as THREE from 'three';
import * as random from 'maath/random';
import { useState } from 'react';

// --- HIGH-FIDELITY PROCEDURAL ASSETS ---

function WatchModel() {
    return (
        <group>
            {/* Bezel: Gold Ridged */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1, 0.08, 32, 100]} />
                <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.15} envMapIntensity={2} />
            </mesh>
            {/* Glass Face: Physical material for transmission */}
            <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.95, 0.95, 0.02, 64]} />
                <meshPhysicalMaterial
                    color="white"
                    metalness={0.1}
                    roughness={0}
                    transmission={0.95}
                    thickness={0.1}
                    clearcoat={1}
                />
            </mesh>
            {/* Internal Mechanics: Gears/Cogs visible behind glass */}
            <group position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh rotation={[0, 0, 1]}>
                    <cylinderGeometry args={[0.4, 0.4, 0.05, 12]} />
                    <meshStandardMaterial color="#444" metalness={0.8} />
                </mesh>
                <mesh position={[0.5, 0.2, -0.02]} rotation={[0, 0, 2]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.05, 8]} />
                    <meshStandardMaterial color="#666" metalness={0.8} />
                </mesh>
            </group>
            {/* Face Background */}
            <mesh position={[0, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.9, 0.9, 0.02, 64]} />
                <meshStandardMaterial color="#050505" metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Hour Markers: Glowing */}
            {Array.from({ length: 12 }).map((_, i) => (
                <mesh
                    key={i}
                    position={[0.8 * Math.cos(i * Math.PI / 6), 0.8 * Math.sin(i * Math.PI / 6), 0]}
                    rotation={[0, 0, i * Math.PI / 6]}
                >
                    <boxGeometry args={[0.08, 0.02, 0.05]} />
                    <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} toneMapped={false} />
                </mesh>
            ))}
            {/* Hands: 3D Gold */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, -1]}>
                <boxGeometry args={[0.05, 0.6, 0.05]} />
                <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.02]} rotation={[0, 0, 2.5]}>
                <boxGeometry args={[0.04, 0.4, 0.05]} />
                <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
            </mesh>
            {/* Second Hand: Red */}
            <mesh position={[0, 0, 0.03]} rotation={[0, 0, 0]} name="secondHand">
                <boxGeometry args={[0.01, 0.8, 0.02]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
            </mesh>
        </group>
    );
}

function CardModel() {
    return (
        <group>
            {/* Card Body: Matte Black Premium */}
            <mesh>
                <boxGeometry args={[3.37, 2.125, 0.05]} />
                <meshPhysicalMaterial
                    color="#050505"
                    metalness={0.8}
                    roughness={0.4}
                    clearcoat={0.5}
                />
            </mesh>
            {/* Chip */}
            <mesh position={[-1.2, 0.3, 0.03]}>
                <planeGeometry args={[0.5, 0.4]} />
                <meshStandardMaterial color="#eebb55" metalness={1} roughness={0.3} />
            </mesh>
            {/* Text: Gold Embossed */}
            <Text
                position={[0, 0, 0.035]}
                fontSize={0.25}
                color="#eebb55"
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                anchorX="center"
                anchorY="middle"
            >
                RAGQUERY
            </Text>
            <Text
                position={[-1.0, -0.6, 0.035]}
                fontSize={0.12}
                color="#888"
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            >
                XXXX XXXX XXXX 1234
            </Text>

            {/* Mastercard Logo: Procedural Circles */}
            <group position={[1.1, -0.6, 0.04]}>
                <mesh position={[-0.15, 0, 0]}>
                    <circleGeometry args={[0.25, 32]} />
                    <meshBasicMaterial color="#EB001B" transparent opacity={0.9} />
                </mesh>
                <mesh position={[0.15, 0, 0.001]}>
                    <circleGeometry args={[0.25, 32]} />
                    <meshBasicMaterial color="#FF5F00" transparent opacity={0.8} />
                </mesh>
            </group>
        </group>
    );
}

function NeuralNexusModel() {
    // Procedural Neural Network Visualization
    const [sphere] = useState(() => random.inSphere(new Float32Array(300), { radius: 1.5 }));

    return (
        <group>
            {/* Central Core: Radiant Brain */}
            <mesh>
                <icosahedronGeometry args={[0.8, 2]} />
                <meshStandardMaterial
                    color="#00ffff"
                    emissive="#00ffff"
                    emissiveIntensity={2}
                    wireframe
                    transparent
                    opacity={0.3}
                />
            </mesh>
            <mesh>
                <icosahedronGeometry args={[0.5, 4]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={1}
                    roughness={0}
                    thickness={2}
                />
            </mesh>

            {/* Connecting Nodes */}
            <Points positions={sphere} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#ffa0e0"
                    size={0.03}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    );
}

export function Scene() {
    const scroll = useScroll();
    const cameraRef = useRef<THREE.PerspectiveCamera>(null!);
    const watchRef = useRef<THREE.Group>(null!);
    const cardRef = useRef<THREE.Group>(null!);
    const nexusRef = useRef<THREE.Group>(null!);

    // Animation Loop
    useFrame((state, delta) => {
        const r = scroll.offset;

        // --- CAMERA SEQUENCE ---
        if (cameraRef.current) {
            // Phase 1: Void (Text View) (0 - 0.2)
            // Camera stationary or slow drift
            if (r < 0.2) {
                cameraRef.current.position.z = 5;
                cameraRef.current.position.y = 0;
                cameraRef.current.position.x = 0;
            }
            // Phase 2: Watch Entry & Zoom (0.2 - 0.5)
            else if (r < 0.5) {
                const p = (r - 0.2) / 0.3;
                cameraRef.current.position.z = THREE.MathUtils.lerp(5, 2, p);
                cameraRef.current.position.y = THREE.MathUtils.lerp(0, 0, p);
                // Subtle tilt
                cameraRef.current.rotation.x = THREE.MathUtils.lerp(0, -0.2, p);
            }
            // Phase 3: Card Transition (0.5 - 0.75)
            else if (r < 0.75) {
                const p = (r - 0.5) / 0.25;
                cameraRef.current.position.z = THREE.MathUtils.lerp(2, 4, p);
                cameraRef.current.position.x = THREE.MathUtils.lerp(0, 0, p);
                cameraRef.current.rotation.x = THREE.MathUtils.lerp(-0.2, 0, p);
            }
            // Phase 4: Nexus / Reveal (0.75 - 1.0)
            else {
                const p = (r - 0.75) / 0.25;
                cameraRef.current.position.z = THREE.MathUtils.lerp(4, 3, p);
                cameraRef.current.position.y = THREE.MathUtils.lerp(0, 0, p);
            }

            // cameraRef.current.lookAt(0,0,0); // Manual lookAt override if needed, but rotation.x handles tilt
        }

        // --- OBJECT VISIBILITY & ANIMATION ---

        // 1. WATCH (Visible 0.2 - 0.55)
        if (watchRef.current) {
            const appearStart = 0.2;
            const disappearEnd = 0.55;

            // Scale logic: Fade in then out
            let s = 0;
            if (r > appearStart && r < disappearEnd) {
                if (r < appearStart + 0.1) s = (r - appearStart) / 0.1; // Fade in
                else if (r > disappearEnd - 0.1) s = 1 - (r - (disappearEnd - 0.1)) / 0.1; // Fade out
                else s = 1;
            }
            watchRef.current.scale.setScalar(THREE.MathUtils.lerp(watchRef.current.scale.x, s, 0.1));

            // Rotation
            watchRef.current.rotation.y = r * Math.PI * 2;
            watchRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;

            // Second hand tick (hacky but works)
            const secondHand = watchRef.current.getObjectByName("secondHand");
            if (secondHand) secondHand.rotation.z = -state.clock.elapsedTime * 2;
        }

        // 2. CARD (Visible 0.5 - 0.8)
        if (cardRef.current) {
            const appearStart = 0.5;
            const disappearEnd = 0.8;

            let s = 0;
            if (r > appearStart && r < disappearEnd) {
                if (r < appearStart + 0.1) s = (r - appearStart) / 0.1;
                else if (r > disappearEnd - 0.1) s = 1 - (r - (disappearEnd - 0.1)) / 0.1;
                else s = 1;
            }
            cardRef.current.scale.setScalar(THREE.MathUtils.lerp(cardRef.current.scale.x, s, 0.1));

            // Floating & Rotate
            cardRef.current.rotation.y = Math.PI + Math.sin(state.clock.elapsedTime * 0.5) * 0.2 + (r - 0.5) * 2;
            cardRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.3) * 0.1;
        }

        // 3. NEURAL NEXUS (Visible 0.75 - 1.0)
        if (nexusRef.current) {
            const appearStart = 0.75;

            let s = 0;
            if (r > appearStart) {
                s = Math.min(1, (r - appearStart) / 0.1);
            }
            nexusRef.current.scale.setScalar(THREE.MathUtils.lerp(nexusRef.current.scale.x, s, 0.1));

            // Pulse
            nexusRef.current.rotation.y += delta * 0.5;
            nexusRef.current.rotation.z += delta * 0.2;
        }

    });

    return (
        <>
            <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 0, 5]} fov={45} />

            {/* Cinematic Lighting & Environment */}
            <Environment preset="city" />
            <ambientLight intensity={0.2} />
            <pointLight position={[-10, -10, -10]} intensity={1} color="blue" />
            <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={2} castShadow color="white" />

            {/* Background Atmosphere */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Cloud opacity={0.3} speed={0.2} width={10} depth={1.5} segments={20} position={[0, -5, -10]} color="#111122" />

            {/* Floating Particles (Dust) */}
            <Sparkles count={100} scale={12} size={2} speed={0.4} opacity={0.5} color="#44aaff" />

            {/* --- OBJECTS --- */}

            <group ref={watchRef}>
                <WatchModel />
            </group>

            <group ref={cardRef}>
                <CardModel />
            </group>

            <group ref={nexusRef}>
                <NeuralNexusModel />
            </group>

        </>
    );
}
