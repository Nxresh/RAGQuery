import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll, Environment, PerspectiveCamera, Text, Stars, Trail, Instance, Instances, Float } from '@react-three/drei';
import * as THREE from 'three';

// --- ASSETS & MODELS ---

function GodfatherWatchModel(props: any) {
    return (
        <group {...props}>
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
            <mesh position={[-1.2, 0.3, 0.03]}>
                <planeGeometry args={[0.5, 0.4]} />
                <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.3} />
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
    return (
        <group>
            {/* Particles forming logo (Simulated) */}
            <Points count={500} />
            <Text position={[0, 0, 0]} fontSize={1} color="white" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">
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
        const r = scroll.offset; // 0 to 1

        // --- 6-STAGE CAMERA RIG DIRECTOR ---
        // 0-0.15: Establishing (Store)
        // 0.15-0.35: Macro (Watch Inside)
        // 0.35-0.55: Transaction (Card)
        // 0.55-0.75: Chase (Car)
        // 0.75-0.90: Emblem Zoom (Car Nose)
        // 0.90-1.0: Brand Reveal (Void)

        if (cameraRef.current) {

            // Default lookAt
            let lookAtTarget = new THREE.Vector3(0, 0, 0);

            if (r < 0.15) {
                // RIG 1: ESTABLISHING
                // Slide forward slowly
                const p = r / 0.15;
                cameraRef.current.position.set(0, 0.5, 5 - p * 1); // 5 -> 4
                lookAtTarget.set(0, 0, 0);

            } else if (r < 0.35) {
                // RIG 2: MACRO ZOOM
                // Zoom deep into watch
                const p = (r - 0.15) / 0.20;
                // Move from z=4 to z=1, maybe tilt down
                cameraRef.current.position.set(0, THREE.MathUtils.lerp(0.5, 2, p), THREE.MathUtils.lerp(4, 0.5, p));
                cameraRef.current.rotation.x = -Math.PI / 4 * p;
                lookAtTarget.set(0, 0, 0);

                // Spin watch gears?
                if (watchRef.current) {
                    watchRef.current.rotation.z += 0.01; // Ticking
                }

            } else if (r < 0.55) {
                // RIG 3: TRANSACTION
                // Locked frame
                cameraRef.current.position.set(0, 0, 5);
                cameraRef.current.rotation.set(0, 0, 0);

                const p = (r - 0.35) / 0.20;
                // Transitions: Watch FADEOUT, Card FADEIN
                if (watchRef.current) watchRef.current.visible = false;
                if (cardRef.current) {
                    cardRef.current.visible = true;
                    // Swipe Animation
                    cardRef.current.position.x = THREE.MathUtils.lerp(-5, 0, p * 2);
                    if (p > 0.5) cardRef.current.rotation.y = (p - 0.5) * Math.PI; // Spin finish
                }

            } else if (r < 0.80) {
                // RIG 4: CHASE (The Drive)
                if (cardRef.current) cardRef.current.visible = false;
                if (carRef.current) {
                    carRef.current.visible = true;
                    // Car is at 0,0,0. Camera trails behind.
                    const p = (r - 0.55) / 0.25;

                    // Camera shake
                    const shake = Math.sin(state.clock.elapsedTime * 20) * 0.05;

                    // Camera moves low and close
                    cameraRef.current.position.set(shake, 1.5, 6);
                    cameraRef.current.lookAt(0, 0.5, 0);
                }

            } else if (r < 0.95) {
                // RIG 5: EMBLEM ZOOM
                // Fly into the hood of the car
                if (carRef.current) carRef.current.visible = true;
                const p = (r - 0.80) / 0.15;

                // Zoom to logo at (0, 0.5, -2.26)
                cameraRef.current.position.set(0, 1.5 - p, 6 - p * 8); // ending at z=-2 (past logo)
                cameraRef.current.lookAt(0, 0.5, -3);

            } else {
                // RIG 6: BRAND REVEAL
                // Car gone. Brand appears.
                if (carRef.current) carRef.current.visible = false;
                if (brandRef.current) {
                    brandRef.current.visible = true;
                    cameraRef.current.position.set(0, 0, 5);
                    cameraRef.current.lookAt(0, 0, 0);
                }
            }
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
