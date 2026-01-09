import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll, Environment, Sparkles, PerspectiveCamera, Text, Stars, Float, Icosahedron, Dodecahedron, Octahedron, Torus } from '@react-three/drei';
import * as THREE from 'three';

// --- ASSETS ---

function ClassicWatchModel() {
    return (
        <group rotation={[Math.PI / 2, 0, 0]} scale={0.8}>
            {/* Strap: Leather texture look */}
            <mesh position={[0, 0, -0.1]}>
                <boxGeometry args={[0.6, 2.5, 0.05]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>

            {/* Case: Polished Silver/Steel */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.8, 0.8, 0.15, 64]} />
                <meshStandardMaterial color="#e0e0e0" metalness={1} roughness={0.1} envMapIntensity={2} />
            </mesh>

            {/* Bezel: Gold Accent */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
                <torusGeometry args={[0.8, 0.05, 32, 64]} />
                <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
            </mesh>

            {/* Face: Deep Blue Sunburst */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
                <cylinderGeometry args={[0.75, 0.75, 0.01, 64]} />
                <meshStandardMaterial color="#001133" metalness={0.5} roughness={0.4} />
            </mesh>

            {/* Hands */}
            <group position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[0.04, 0.5, 0.01]} />
                    <meshStandardMaterial color="#FFD700" metalness={1} />
                </mesh>
                <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <boxGeometry args={[0.04, 0.35, 0.01]} />
                    <meshStandardMaterial color="#FFD700" metalness={1} />
                </mesh>
            </group>
        </group>
    );
}

function CardModel() {
    return (
        <group>
            {/* Card Body: Matte Black */}
            <mesh>
                <boxGeometry args={[3.37, 2.125, 0.05]} />
                <meshPhysicalMaterial
                    color="#000000"
                    metalness={0.7}
                    roughness={0.4}
                    clearcoat={0.8}
                    clearcoatRoughness={0.1}
                />
            </mesh>

            {/* Chip */}
            <mesh position={[-1.2, 0.3, 0.03]}>
                <planeGeometry args={[0.5, 0.4]} />
                <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.3} />
            </mesh>

            {/* Text: Pure White on Black */}
            <Text
                position={[0, 0, 0.04]}
                fontSize={0.28}
                color="white"
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.05}
            >
                RAGQUERY
            </Text>

            <Text
                position={[-1.0, -0.6, 0.04]}
                fontSize={0.14}
                color="#cccccc"
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            >
                0000 0000 0000 0000
            </Text>

            {/* Mastercard Logo - Classic Red/Orange */}
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

function QuantumGeometryModel() {
    const groupRef = useRef<THREE.Group>(null!);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.005;
            groupRef.current.rotation.z += 0.002;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Outer Geodesic Cage */}
            <mesh>
                <icosahedronGeometry args={[1.8, 1]} />
                <meshStandardMaterial color="#00ffff" wireframe transparent opacity={0.15} />
            </mesh>

            {/* Mid Rotating Rings */}
            <group rotation={[Math.PI / 4, 0, 0]}>
                <mesh>
                    <torusGeometry args={[1.4, 0.02, 16, 100]} />
                    <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={2} />
                </mesh>
            </group>

            {/* Inner Geometric Core - "Graph" feel */}
            <mesh>
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="#ffffff" wireframe transparent opacity={0.3} />
            </mesh>

            {/* Central Singularity */}
            <mesh>
                <octahedronGeometry args={[0.5, 0]} />
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={4} toneMapped={false} />
            </mesh>

            {/* Connecting Lines / Data Streams */}
            <Sparkles count={40} scale={3} size={4} speed={0.4} opacity={0.6} color="#00ffff" />
        </group>
    );
}

function SpiralTunnel() {
    // Generate spiral points
    const points = useMemo(() => {
        const p = [];
        for (let i = 0; i < 200; i++) {
            const t = i / 10;
            const r = 2 + i * 0.05; // radius increases
            const x = Math.cos(t * 3) * r;
            const y = Math.sin(t * 3) * r;
            const z = -i * 0.5; // clear depth
            p.push(new THREE.Vector3(x, y, z));
        }
        return p;
    }, []);

    // Create a tube or points along the path
    const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);

    return (
        <group position={[0, 0, -5]}>
            {/* Tunnel Particles */}
            <Sparkles count={500} scale={[10, 10, 50]} size={3} speed={2} opacity={0.5} color="#44aaff" />

            {/* Faint Guide Line */}
            <mesh>
                <tubeGeometry args={[curve, 64, 0.05, 8, false]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={0.1} wireframe />
            </mesh>
        </group>
    );
}

export function Scene() {
    const scroll = useScroll();
    const cameraRef = useRef<THREE.PerspectiveCamera>(null!);
    const watchRef = useRef<THREE.Group>(null!);
    const cardRef = useRef<THREE.Group>(null!);
    const nexusRef = useRef<THREE.Group>(null!);
    const spiralRef = useRef<THREE.Group>(null!);

    useFrame((state, delta) => {
        const r = scroll.offset;

        // --- CAMERA SEQUENCE ---
        if (cameraRef.current) {
            // 0 - 0.25: WATCH
            if (r < 0.25) {
                cameraRef.current.position.set(0, 0, 5);
                cameraRef.current.lookAt(0, 0, 0);
            }
            // 0.25 - 0.5: CARD (Transition)
            else if (r < 0.5) {
                const p = (r - 0.25) / 0.25; // 0 to 1
                cameraRef.current.position.z = THREE.MathUtils.lerp(5, 4, p);
            }
            // 0.5 - 0.8: NEXUS
            else if (r < 0.8) {
                const p = (r - 0.5) / 0.3; // 0 to 1
                cameraRef.current.position.z = THREE.MathUtils.lerp(4, 2, p);
            }
            // 0.8 - 1.0: SPIRAL ZOOM
            else {
                const p = (r - 0.8) / 0.2; // 0 to 1
                // Zoom IN rapidly
                cameraRef.current.position.z = THREE.MathUtils.lerp(2, -10, p);
            }
        }

        // --- ANIMATIONS ---

        // 1. WATCH (Visible 0 - 0.3)
        if (watchRef.current) {
            const visible = r < 0.35;
            watchRef.current.visible = visible;
            if (visible) {
                watchRef.current.rotation.y = r * Math.PI * 2;
                watchRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
                const scale = THREE.MathUtils.lerp(1, 0, Math.max(0, (r - 0.25) / 0.1));
                watchRef.current.scale.setScalar(scale);
            }
        }

        // 2. CARD (Visible 0.3 - 0.6)
        if (cardRef.current) {
            // "The way it moved from left to right"
            const start = 0.3;
            const end = 0.6;
            const visible = r > start - 0.1 && r < end + 0.1;
            cardRef.current.visible = visible;

            if (visible) {
                const p = (r - start) / (end - start); // 0 to 1 progress during card phase

                // Entrance: Slide from Left (-5) to Center (0)
                // Exit: Slide to Right (+5)
                const xPos = THREE.MathUtils.lerp(-4, 4, p);
                cardRef.current.position.x = xPos;

                // Banking rotation
                cardRef.current.rotation.y = xPos * 0.2;
                cardRef.current.rotation.z = -xPos * 0.1;

                // Scale in/out
                let s = 1;
                if (p < 0.2) s = p / 0.2;
                if (p > 0.8) s = 1 - (p - 0.8) / 0.2;
                cardRef.current.scale.setScalar(s);
            }
        }

        // 3. NEXUS / QUANTUM GEOMETRY (Visible 0.6 - 0.9)
        if (nexusRef.current) {
            const start = 0.6;
            const end = 1.0; // stays till end
            const visible = r > start;
            nexusRef.current.visible = visible;

            if (visible) {
                const p = (r - start) / (0.2);
                const s = Math.min(1, p);
                nexusRef.current.scale.setScalar(s);

                // Rotate
                nexusRef.current.rotation.x = state.clock.elapsedTime * 0.1;
                nexusRef.current.rotation.y = state.clock.elapsedTime * 0.15;
            }
        }

        // 4. SPIRAL TUNNEL (Visible 0.8 - 1.0)
        if (spiralRef.current) {
            spiralRef.current.visible = r > 0.7;
            spiralRef.current.rotation.z = -state.clock.elapsedTime * 0.5;
        }

    });

    return (
        <>
            <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 0, 5]} fov={45} />
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <group ref={watchRef}>
                <ClassicWatchModel />
            </group>

            <group ref={cardRef}>
                <CardModel />
            </group>

            <group ref={nexusRef}>
                <QuantumGeometryModel />
            </group>

            <group ref={spiralRef} position={[0, 0, -5]}>
                <SpiralTunnel />
            </group>
        </>
    );
}
