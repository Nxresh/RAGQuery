import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll, Environment, Sparkles, PerspectiveCamera, Text, Stars, Float, Torus, Cylinder, Box, Plane } from '@react-three/drei';
import * as THREE from 'three';

// --- ASSETS ---

function GodfatherWatchModel() {
    return (
        <group rotation={[Math.PI / 2, 0, 0]} scale={0.9}>
            {/* Case: Obsidian / Matte Black */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.9, 0.9, 0.15, 64]} />
                <meshStandardMaterial color="#0a0a0a" metalness={0.8} roughness={0.7} envMapIntensity={1} />
            </mesh>

            {/* Bezel: Polished Black Ceramic */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
                <torusGeometry args={[0.9, 0.04, 32, 64]} />
                <meshStandardMaterial color="#000" metalness={1} roughness={0.1} />
            </mesh>

            {/* Inner Ring: Rose Gold */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
                <torusGeometry args={[0.82, 0.015, 32, 64]} />
                <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.2} />
            </mesh>

            {/* Face: Skeleton Hierarchy */}
            <group position={[0, -0.05, 0]}>
                {/* Mechanism Plate */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.85, 0.85, 0.02, 64]} />
                    <meshStandardMaterial color="#111" metalness={0.9} roughness={0.5} />
                </mesh>

                {/* The "Rose" / Flower Mechanism Hint */}
                <group position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <mesh>
                        <torusKnotGeometry args={[0.25, 0.08, 64, 8, 2, 3]} />
                        <meshStandardMaterial color="#333" metalness={1} roughness={0.4} />
                    </mesh>
                    {/* Gold center */}
                    <mesh>
                        <sphereGeometry args={[0.1]} />
                        <meshStandardMaterial color="#D4AF37" metalness={1} />
                    </mesh>
                </group>

                {/* Roman Numeral Pillars (Abstract) */}
                {[0, 1, 2, 3].map(i => (
                    <mesh key={i} position={[0.6 * Math.cos(i * Math.PI / 2), 0.1, 0.6 * Math.sin(i * Math.PI / 2)]} rotation={[Math.PI / 2, 0, 0]}>
                        <boxGeometry args={[0.05, 0.2, 0.05]} />
                        <meshStandardMaterial color="#D4AF37" metalness={1} />
                    </mesh>
                ))}
            </group>

            {/* Hands (Gold) */}
            <group position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh rotation={[0, 0, 0.5]}>
                    <boxGeometry args={[0.04, 0.6, 0.02]} />
                    <meshStandardMaterial color="#D4AF37" metalness={1} />
                </mesh>
                <mesh rotation={[0, 0, 2]}>
                    <boxGeometry args={[0.06, 0.4, 0.02]} />
                    <meshStandardMaterial color="#D4AF37" metalness={1} />
                </mesh>
            </group>
        </group>
    );
}

function CardModel() {
    return (
        <group>
            {/* Card Body: Matte Obsidian */}
            <mesh>
                <boxGeometry args={[3.37, 2.125, 0.05]} />
                <meshPhysicalMaterial
                    color="#050505"
                    metalness={0.6}
                    roughness={0.4}
                    clearcoat={0.5}
                />
            </mesh>

            {/* Chip: Gold */}
            <mesh position={[-1.2, 0.3, 0.03]}>
                <planeGeometry args={[0.5, 0.4]} />
                <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.3} />
            </mesh>

            {/* Text */}
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
                position={[1.1, -0.7, 0.04]}
                fontSize={0.12}
                color="#555"
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                anchorX="right"
            >
                WORLD ACCESS
            </Text>
        </group>
    );
}

function MechanicalSpiral() {
    const groupRef = useRef<THREE.Group>(null!);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.z -= 0.002; // Slow rotation
        }
    });

    // Generate heavier spiral tubes
    const points = useMemo(() => {
        const p = [];
        for (let i = 0; i < 150; i++) {
            const t = i / 8;
            const r = 3 + i * 0.1;
            const x = Math.cos(t * 2) * r;
            const y = Math.sin(t * 2) * r;
            const z = -i * 0.8;
            p.push(new THREE.Vector3(x, y, z));
        }
        return p;
    }, []);
    const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);

    return (
        <group ref={groupRef}>
            <mesh>
                <tubeGeometry args={[curve, 100, 0.1, 8, false]} />
                <meshStandardMaterial color="#222" metalness={0.9} roughness={0.4} />
            </mesh>
            {/* Secondary Rail */}
            <mesh rotation={[0, 0, Math.PI]}>
                <tubeGeometry args={[curve, 100, 0.05, 8, false]} />
                <meshStandardMaterial color="#444" metalness={0.8} roughness={0.5} />
            </mesh>
        </group>
    );
}

function RAGBoardModel() {
    return (
        <group>
            {/* Main Board Background */}
            <mesh>
                <planeGeometry args={[12, 7]} />
                <meshPhysicalMaterial
                    color="#1a1c20"
                    transparent
                    opacity={0.9}
                    metalness={0.5}
                    roughness={0.2}
                    clearcoat={1}
                />
            </mesh>

            {/* Grid Layout Visualization */}

            {/* Left Panel: Inputs */}
            <mesh position={[-4, 0, 0.1]}>
                <planeGeometry args={[3, 6]} />
                <meshStandardMaterial color="#25282c" />
            </mesh>
            {/* Lines representing code/input */}
            {Array.from({ length: 8 }).map((_, i) => (
                <mesh key={i} position={[-4, 2 - i * 0.5, 0.15]}>
                    <planeGeometry args={[2, 0.2]} />
                    <meshBasicMaterial color="#3e434a" />
                </mesh>
            ))}

            {/* Right Panel: Sources */}
            <mesh position={[4, 0, 0.1]}>
                <planeGeometry args={[3, 6]} />
                <meshStandardMaterial color="#25282c" />
            </mesh>
            {/* Source Blocks */}
            {Array.from({ length: 4 }).map((_, i) => (
                <mesh key={i} position={[4, 1.5 - i * 1.2, 0.15]}>
                    <planeGeometry args={[2.5, 0.8]} />
                    <meshBasicMaterial color="#3e434a" />
                </mesh>
            ))}

            {/* Center Panel: Output (Glowing) */}
            <mesh position={[0, 0, 0.2]}>
                <planeGeometry args={[4, 6]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[0, 2, 0.25]}>
                <planeGeometry args={[3, 0.5]} />
                <meshBasicMaterial color="#D4AF37" transparent opacity={0.8} />
            </mesh>
            <Text
                position={[0, 0, 0.3]}
                fontSize={0.2}
                maxWidth={3.5}
                color="#eee"
                textAlign="center"
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            >
                Constructing response from verifiable enterprise sources...
            </Text>

        </group>
    );
}

export function Scene() {
    const scroll = useScroll();
    const cameraRef = useRef<THREE.PerspectiveCamera>(null!);
    const watchRef = useRef<THREE.Group>(null!);
    const cardRef = useRef<THREE.Group>(null!);
    const spiralRef = useRef<THREE.Group>(null!);
    const boardRef = useRef<THREE.Group>(null!);

    useFrame((state, delta) => {
        const r = scroll.offset;

        // --- CAMERA SEQUENCE ---
        if (cameraRef.current) {
            // Camera logic must handle the "Gaps" smoothy
            cameraRef.current.position.x = 0;
            cameraRef.current.position.y = 0;

            if (r < 0.4) {
                // WATCH PHASE
                cameraRef.current.position.z = 5;
                cameraRef.current.lookAt(0, 0, 0);
            } else if (r < 0.75) {
                // CARD PHASE
                cameraRef.current.position.z = 4.5;
            } else {
                // SPIRAL/BOARD PHASE -> Fly through
                const p = (r - 0.75) / 0.25;
                cameraRef.current.position.z = THREE.MathUtils.lerp(4.5, 2, p);
            }
        }

        // --- STRICT VISIBILITY TIMING ---
        // Plan:
        // 0.0-0.2: TEXT 1 (No 3D)
        // 0.2-0.4: WATCH (3D Only)
        // 0.4-0.5: TEXT 2 (No 3D)
        // 0.5-0.7: CARD (3D Only)
        // 0.7-0.8: TEXT 3 (No 3D)
        // 0.8-1.0: SPIRAL -> BOARD (3D Only)

        // 1. WATCH (Visible 0.2 - 0.4)
        if (watchRef.current) {
            const start = 0.2;
            const end = 0.4;
            // Smooth fade in/out slightly around edges
            const visible = r > start - 0.05 && r < end + 0.05;
            watchRef.current.visible = visible;

            if (visible) {
                // Fade opacity/scale logic
                let opacity = 1;
                if (r < start) opacity = (r - (start - 0.05)) / 0.05;
                if (r > end) opacity = 1 - (r - end) / 0.05;
                watchRef.current.scale.setScalar(opacity * 0.9);

                watchRef.current.rotation.y = r * Math.PI;
                watchRef.current.rotation.x = 0.2;
            }
        }

        // 2. CARD (Visible 0.5 - 0.7)
        if (cardRef.current) {
            const start = 0.5;
            const end = 0.7;
            const visible = r > start - 0.05 && r < end + 0.05;
            cardRef.current.visible = visible;

            if (visible) {
                let s = 1;
                if (r < start) s = (r - (start - 0.05)) / 0.05;
                if (r > end) s = 1 - (r - end) / 0.05;
                cardRef.current.scale.setScalar(s);

                // LEFT to RIGHT Motion
                // Map 0.5->0.7 to X=-4 -> X=4
                const p = (r - start) / (end - start);
                cardRef.current.position.x = THREE.MathUtils.lerp(-4, 4, p);
            }
        }

        // 3. SPIRAL & BOARD (Visible 0.8 - 1.0)
        if (spiralRef.current && boardRef.current) {
            const start = 0.8;
            const visible = r > start - 0.05;
            spiralRef.current.visible = visible;
            boardRef.current.visible = visible;

            if (visible) {
                // Fade in
                let s = 1;
                if (r < start) s = (r - (start - 0.05)) / 0.05;

                // Spiral rotates
                spiralRef.current.scale.setScalar(s);

                // Board comes in at end (0.9+)
                const boardP = Math.max(0, (r - 0.9) / 0.1);
                boardRef.current.scale.setScalar(boardP); // Zoom up from 0
                boardRef.current.position.z = -2; // Behind spiral initially? No, Camera zooms in.
            }
        }

    });

    return (
        <>
            <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 0, 5]} fov={45} />
            <Environment preset="city" />
            {/* Cinematic Lighting */}
            <ambientLight intensity={0.2} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#444" />

            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

            <group ref={watchRef}>
                <GodfatherWatchModel />
            </group>

            <group ref={cardRef}>
                <CardModel />
            </group>

            <group ref={spiralRef} position={[0, 0, -5]}>
                <MechanicalSpiral />
            </group>

            <group ref={boardRef} position={[0, 0, -8]}>
                <RAGBoardModel />
            </group>
        </>
    );
}
