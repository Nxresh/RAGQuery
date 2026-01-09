import { useRef, useMemo, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useScroll, Environment, PerspectiveCamera, Text, Stars, Trail, Instance, Instances, Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// --- ASSETS & MODELS ---

// PHYSICS ENGINE: Map linear scroll (0-1) to physics-based timeline (0-1)
// Function to add resistance or stickiness
function calculatePhysicsScroll(r: number): number {
    // 1. ANCHOR: Watch Reveal (10-12%) - Slowdown
    if (r > 0.1 && r < 0.15) {
        // Map 0.1->0.15 input to 0.1->0.12 output (slow progression)
        return 0.1 + (r - 0.1) * 0.4;
    }

    // 2. RESISTANCE: Macro Zoom (15-30%) - Heavy feel
    if (r > 0.15 && r < 0.35) {
        // Map 0.15->0.35 input (0.2 range) to 0.12->0.32 output
        return 0.12 + (r - 0.15); // Standard 1:1 for now, but feels slower due to camera distance
    }

    // 3. ANCHOR: Transaction Success (55-60%) - Sticky Moment
    if (r > 0.55 && r < 0.60) {
        // Hold the frame almost still
        return 0.55 + (r - 0.55) * 0.1;
    }

    // 4. LOW RESISTANCE: The Drive (60-80%) - Fast
    if (r > 0.60 && r < 0.80) {
        // Map 0.6->0.8 (0.2) to 0.555->0.9 (0.345) - Speed up!
        return 0.555 + (r - 0.60) * 1.7;
    }

    // Linear fallback
    return r;
}


function GodfatherWatchModel(props: any) {
    return (
        <group {...props}>
            {/* Velvet Pedestal Base */}
            <mesh position={[0, -0.2, 0]} receiveShadow>
                <cylinderGeometry args={[0.5, 0.6, 0.2, 64]} />
                <meshStandardMaterial color="#1a0505" roughness={1} metalness={0} /> {/* Velvet */}
            </mesh>

            {/* Case */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.9, 0.9, 0.15, 64]} />
                <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.4} envMapIntensity={1.5} />
            </mesh>
            {/* Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
                <torusGeometry args={[0.82, 0.03, 32, 64]} />
                <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
            </mesh>
            {/* Mechanics */}
            <group position={[0, -0.05, 0]}>
                {/* Internal Gears (Abstract) */}
                {[0, 1, 2, 3, 4].map(i => (
                    <mesh key={i} position={[Math.cos(i) * 0.4, 0.05, Math.sin(i) * 0.4]} rotation={[Math.PI / 2, 0, i]}>
                        <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
                        <meshStandardMaterial color={i % 2 === 0 ? "#D4AF37" : "#333"} metalness={1} roughness={0.3} />
                    </mesh>
                ))}
                {/* Main Bridge */}
                <mesh position={[0, 0.05, 0]} rotation={[0, 0, Math.PI / 4]}>
                    <boxGeometry args={[1.2, 0.2, 0.05]} />
                    <meshStandardMaterial color="#111" metalness={0.8} />
                </mesh>
            </group>
            {/* Hands */}
            <group position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh rotation={[0, 0, 1]}>
                    <boxGeometry args={[0.04, 0.7, 0.01]} />
                    <meshStandardMaterial color="#D4AF37" metalness={1} />
                </mesh>
            </group>
        </group>
    );
}

function CardModel(props: any) {
    return (
        <group {...props}>
            <mesh>
                <boxGeometry args={[3.37, 2.125, 0.05]} />
                <meshPhysicalMaterial color="#050505" metalness={0.8} roughness={0.2} clearcoat={1} />
            </mesh>
            {/* Chip with Glow */}
            <mesh position={[-1.2, 0.3, 0.03]}>
                <planeGeometry args={[0.5, 0.4]} />
                <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.3} emissive="#D4AF37" emissiveIntensity={0.2} />
            </mesh>
            <Text position={[0, 0, 0.04]} fontSize={0.25} color="white" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">
                RAGQUERY
            </Text>
            <Text position={[1.1, -0.7, 0.04]} fontSize={0.15} color="#aaa" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff" anchorX="right">
                WORLD ACCESS
            </Text>
        </group>
    );
}

function HyperCarModel(props: any) {
    // Abstract Low-Poly "Cyber Car"
    return (
        <group {...props}>
            {/* Body */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[2, 0.8, 4.5]} />
                <meshPhysicalMaterial color="#111" metalness={1} roughness={0.1} clearcoat={1} clearcoatRoughness={0} />
            </mesh>
            {/* Cabin */}
            <mesh position={[0, 1, -0.5]}>
                <boxGeometry args={[1.6, 0.6, 2.5]} />
                <meshStandardMaterial color="#000" metalness={1} roughness={0} />
            </mesh>
            {/* Wheels */}
            <mesh position={[1, 0.4, 1.5]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[-1, 0.4, 1.5]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[1, 0.4, -1.5]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[-1, 0.4, -1.5]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Rear Lights (Trails) */}
            <mesh position={[0, 0.6, 2.26]}>
                <boxGeometry args={[1.8, 0.1, 0.1]} />
                <meshBasicMaterial color="#ff0000" toneMapped={false} />
            </mesh>
            {/* Emblem (Zoom Target) */}
            <mesh position={[0, 0.5, -2.26]}>
                <boxGeometry args={[0.2, 0.2, 0.05]} />
                <meshBasicMaterial color="#D4AF37" toneMapped={false} />
            </mesh>
        </group>
    );
}

function CityTunnel() {
    // Instanced boxes creating a tunnel of light
    const count = 40;
    const items = useMemo(() => {
        const arr = [];
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 30; // Wide spread
            const y = Math.random() * 10;
            const z = -i * 5; // Deep tunnel
            const scale = [Math.random() * 0.5 + 0.1, Math.random() * 5 + 1, Math.random() * 0.5 + 0.1];
            arr.push({ pos: [x > 0 ? x + 5 : x - 5, y, z], scale }); // Leave middle open
        }
        return arr;
    }, []);

    const tunnelRef = useRef<THREE.Group>(null!);
    useFrame((_, delta) => {
        if (tunnelRef.current) {
            tunnelRef.current.position.z += delta * 20; // Fast movement
            if (tunnelRef.current.position.z > 200) tunnelRef.current.position.z = 0;
        }
    });

    return (
        <group ref={tunnelRef} position={[0, -5, -100]}>
            {items.map((it, i) => (
                <mesh key={i} position={it.pos as any} scale={it.scale as any}>
                    <boxGeometry />
                    <meshBasicMaterial color={i % 3 === 0 ? "#ff0000" : "#ffffff"} />
                </mesh>
            ))}
            {/* Road Surface */}
            <mesh position={[0, 0, 50]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[20, 300]} />
                <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
            </mesh>
        </group>
    );
}

function BrandReveal() {
    // Load generated texture from absolute local path (in production this would be hosted)
    // For artifacts, we reference the local file. 
    // IMPORTANT: In a real deployment, this URL must be public. 
    // Assuming for now we use a placeholder or the texture if available in public folder.
    // Using a reliable placeholder for robust code, knowing the user sees artifacts locally.

    // NOTE: To make the generated image work in the browser, it needs to be in 'public'.
    // Since I cannot move files to 'public', I will use a procedural board for now, 
    // but structure it to ACCEPT a texture map if provided.

    return (
        <group>
            {/* Particles forming logo (Simulated) */}
            <Points count={500} />

            {/* The Dashboard UI Pane */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[7, 4]} />
                <meshBasicMaterial color="#000" transparent opacity={0.8} side={THREE.DoubleSide} />
                {/* 
                    Ideally: map={texture}
                    Since I cannot copy the artifact to /public in this environment reliably without access to 'public',
                    I will simulate the dashboard with geometry to match the "Figma" aesthetic created.
                 */}
            </mesh>

            {/* Dashboard Layout Simulation (Matching the visual generated: Dark, Gold Charts) */}
            {/* Chart 1 */}
            <mesh position={[-2, 1, 0.05]}>
                <planeGeometry args={[2.5, 1.5]} />
                <meshBasicMaterial color="#111" />
            </mesh>
            <mesh position={[-2, 1, 0.06]}>
                <ringGeometry args={[0.3, 0.35, 32]} />
                <meshBasicMaterial color="#D4AF37" />
            </mesh>

            {/* Chart 2 (Graph) */}
            <mesh position={[1.5, 1, 0.05]}>
                <planeGeometry args={[2.5, 1.5]} />
                <meshBasicMaterial color="#111" />
            </mesh>
            <mesh position={[1.5, 0.8, 0.06]}>
                <planeGeometry args={[2, 0.05]} />
                <meshBasicMaterial color="#D4AF37" />
            </mesh>
            <mesh position={[1.5, 1.2, 0.06]}>
                <planeGeometry args={[2, 0.05]} />
                <meshBasicMaterial color="#D4AF37" />
            </mesh>

            {/* Bottom Panels */}
            <mesh position={[0, -1, 0.05]}>
                <planeGeometry args={[6, 1.5]} />
                <meshBasicMaterial color="#111" />
            </mesh>


            <Text position={[0, 0, 0.5]} fontSize={0.8} color="white" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">
                RAGQUERY
            </Text>
            <mesh position={[0, -1, 0]}>
                <planeGeometry args={[5, 0.05]} />
                <meshBasicMaterial color="#D4AF37" />
            </mesh>
        </group>
    );
}

function Points({ count = 100 }) {
    const points = useMemo(() => {
        const p = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) p[i] = (Math.random() - 0.5) * 5;
        return p;
    }, [count]);
    return (
        <points>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[points, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.05} color="#D4AF37" transparent opacity={0.5} />
        </points>
    );
}


// --- THE SCENE CONTROLLER ---

export function Scene() {
    const scroll = useScroll();
    const cameraRef = useRef<THREE.PerspectiveCamera>(null!);

    // Scene Refs
    const watchRef = useRef<THREE.Group>(null!);
    const cardRef = useRef<THREE.Group>(null!);
    const carRef = useRef<THREE.Group>(null!);
    const brandRef = useRef<THREE.Group>(null!);

    useFrame((state, delta) => {
        // APPLY PHYSICS MAPPING
        // r_raw is the linear scroll. r is the physics-adjusted scroll.
        const r_raw = scroll.offset;
        const r = calculatePhysicsScroll(r_raw);

        // --- 6-STAGE CAMERA RIG DIRECTOR ---
        // 0-0.15: Establishing (Store) -> 50° FOV
        // 0.15-0.35: Macro (Watch Inside) -> 20° FOV (Telephoto)
        // 0.35-0.55: Transaction (Card) -> 35° FOV
        // 0.55-0.75: Chase (Car) -> 65° FOV (Wide/Speed)
        // 0.75-0.90: Emblem Zoom (Car Nose) -> 30° FOV
        // 0.90-1.0: Brand Reveal (Void) -> 45° FOV

        if (cameraRef.current) {

            // Default lookAt
            let lookAtTarget = new THREE.Vector3(0, 0, 0);
            let targetFOV = 50;

            if (r < 0.15) {
                // RIG 1: ESTABLISHING
                // Slide forward slowly, maintain 50 FOV
                const p = r / 0.15;
                cameraRef.current.position.set(0, 0.5, 5 - p * 1); // 5 -> 4
                targetFOV = 50;

            } else if (r < 0.35) {
                // RIG 2: MACRO ZOOM
                // Zoom deep into watch, Switch to Telephoto (20 FOV)
                const p = (r - 0.15) / 0.20;
                cameraRef.current.position.set(0, THREE.MathUtils.lerp(0.5, 2, p), THREE.MathUtils.lerp(4, 0.5, p));
                cameraRef.current.rotation.x = -Math.PI / 4 * p;

                targetFOV = THREE.MathUtils.lerp(50, 20, p); // Zoom effect

                if (watchRef.current) {
                    watchRef.current.rotation.z += 0.01; // Ticking
                }

            } else if (r < 0.55) {
                // RIG 3: TRANSACTION
                targetFOV = 35;
                cameraRef.current.position.set(0, 0, 5);
                cameraRef.current.rotation.set(0, 0, 0);

                const p = (r - 0.35) / 0.20;
                if (watchRef.current) watchRef.current.visible = false;
                if (cardRef.current) {
                    cardRef.current.visible = true;
                    cardRef.current.position.x = THREE.MathUtils.lerp(-5, 0, p * 2);
                    if (p > 0.5) cardRef.current.rotation.y = (p - 0.5) * Math.PI;
                }

            } else if (r < 0.80) {
                // RIG 4: CHASE (The Drive)
                targetFOV = 65; // Wide angle for speed
                if (cardRef.current) cardRef.current.visible = false;
                if (carRef.current) {
                    carRef.current.visible = true;
                    const p = (r - 0.55) / 0.25;

                    // Camera shake
                    const shake = Math.sin(state.clock.elapsedTime * 20) * 0.05;
                    cameraRef.current.position.set(shake, 1.5, 6);
                    cameraRef.current.lookAt(0, 0.5, 0);
                }

            } else if (r < 0.95) {
                // RIG 5: EMBLEM ZOOM
                targetFOV = THREE.MathUtils.lerp(65, 30, (r - 0.80) / 0.15); // Tunnel vision
                if (carRef.current) carRef.current.visible = true;
                const p = (r - 0.80) / 0.15;
                cameraRef.current.position.set(0, 1.5 - p, 6 - p * 8);
                cameraRef.current.lookAt(0, 0.5, -3);

            } else {
                // RIG 6: BRAND REVEAL
                targetFOV = 45;
                if (carRef.current) carRef.current.visible = false;
                if (brandRef.current) {
                    brandRef.current.visible = true;
                    cameraRef.current.position.set(0, 0, 5);
                    cameraRef.current.lookAt(0, 0, 0);
                }
            }

            // Smooth FOV interpolation
            cameraRef.current.fov = THREE.MathUtils.lerp(cameraRef.current.fov, targetFOV, 0.05);
            cameraRef.current.updateProjectionMatrix();
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 0, 5]} fov={50} />
            <Environment preset="night" />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} intensity={2} castShadow />

            {/* SCENE 1 & 2: WATCH */}
            <group ref={watchRef} visible={true}>
                <GodfatherWatchModel />
            </group>

            {/* SCENE 3: CARD */}
            <group ref={cardRef} visible={false}>
                <CardModel />
            </group>

            {/* SCENE 4 & 5: CAR & CITY */}
            <group ref={carRef} visible={false}>
                <HyperCarModel />
                <CityTunnel />
            </group>

            {/* SCENE 6: BRAND */}
            <group ref={brandRef} visible={false}>
                <BrandReveal />
            </group>
        </>
    );
}
