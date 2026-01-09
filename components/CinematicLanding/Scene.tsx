import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll, Environment, Sparkles, PerspectiveCamera, Text, Stars, Float, Icosahedron, Torus, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

// --- ASSETS ---

function GodfatherWatchModel() {
    return (
        <group rotation={[Math.PI / 2, 0, 0]} scale={0.9}>
            {/* Case: Rose Gold Complex */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.9, 0.9, 0.15, 64]} />
                <meshStandardMaterial color="#B76E79" metalness={1} roughness={0.1} envMapIntensity={2.5} />
            </mesh>

            {/* Bezel: Black Ceramic Insert */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
                <torusGeometry args={[0.9, 0.04, 32, 64]} />
                <meshStandardMaterial color="#000" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Face: Open Skeleton Work */}
            <group position={[0, -0.05, 0]}>
                {/* Main Plate */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.85, 0.85, 0.02, 64]} />
                    <meshStandardMaterial color="#111" metalness={0.6} roughness={0.6} />
                </mesh>

                {/* Musical Cylinders (Godfather mechanism hint) */}
                <group position={[-0.4, 0.1, -0.3]} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
                    <mesh>
                        <cylinderGeometry args={[0.12, 0.12, 0.5, 32]} />
                        <meshStandardMaterial color="#B76E79" metalness={1} roughness={0.3} />
                    </mesh>
                    {/* Pins on cylinder */}
                    {Array.from({ length: 10 }).map((_, i) => (
                        <mesh key={i} position={[0.13, (i - 5) * 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
                            <cylinderGeometry args={[0.01, 0.01, 0.05, 8]} />
                            <meshStandardMaterial color="#fff" metalness={1} />
                        </mesh>
                    ))}
                </group>

                <group position={[0.4, 0.1, -0.3]} rotation={[Math.PI / 2, 0, -Math.PI / 4]}>
                    <mesh>
                        <cylinderGeometry args={[0.12, 0.12, 0.5, 32]} />
                        <meshStandardMaterial color="#B76E79" metalness={1} roughness={0.3} />
                    </mesh>
                </group>

                {/* Center Tourbillon Cage */}
                <group position={[0, 0.1, 0.4]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.25, 0.02, 16, 32]} />
                        <meshStandardMaterial color="#ffd700" metalness={1} />
                    </mesh>
                    <mesh>
                        <octahedronGeometry args={[0.15, 0]} />
                        <meshStandardMaterial color="#B76E79" wireframe />
                    </mesh>
                </group>

                {/* Central Godfather Logo Hint */}
                <Text
                    position={[0, 0.12, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    fontSize={0.1}
                    color="#fff"
                    font="https://fonts.gstatic.com/s/alfaoneroom/v1/m8JVjfKr7al8y0mX8m2h.woff"
                    anchorX="center"
                    anchorY="middle"
                >
                    The Godfather
                </Text>
            </group>

            {/* Hands */}
            <group position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh rotation={[0, 0, 1]}>
                    <boxGeometry args={[0.06, 0.7, 0.02]} />
                    <meshStandardMaterial color="#B76E79" metalness={1} />
                </mesh>
                <mesh rotation={[0, 0, -2]}>
                    <boxGeometry args={[0.08, 0.5, 0.02]} />
                    <meshStandardMaterial color="#B76E79" metalness={1} />
                </mesh>
            </group>

            {/* Glass Dome */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.9, 0.9, 0.05, 64]} />
                <meshPhysicalMaterial
                    color="#fff"
                    transparent
                    opacity={0.1}
                    roughness={0}
                    metalness={0.1}
                    transmission={0.9}
                    thickness={0.1}
                />
            </mesh>
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
                    color="#050505"
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

// "Previous Version" Spiral/Sphere - Based on User Image
// White inner sphere + Wireframe Outer Sphere + Particles
function WireframeSphereModel() {
    const groupRef = useRef<THREE.Group>(null!);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.002;
            groupRef.current.rotation.x += 0.001;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Inner White Sphere - "The World" */}
            <mesh>
                <sphereGeometry args={[1, 64, 64]} />
                <meshStandardMaterial color="white" roughness={0.2} metalness={0.1} />
            </mesh>

            {/* Outer Wireframe Sphere - "The Network" */}
            <mesh scale={1.5}>
                <sphereGeometry args={[1, 24, 24]} />
                <meshBasicMaterial color="white" wireframe transparent opacity={0.15} />
            </mesh>
            <mesh scale={1.8} rotation={[0, 0, Math.PI / 4]}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial color="white" wireframe transparent opacity={0.1} />
            </mesh>

            {/* Orbiting Particles */}
            <Sparkles count={150} scale={5} size={2} speed={0.4} opacity={0.5} color="white" />
        </group>
    );
}

export function Scene() {
    const scroll = useScroll();
    const cameraRef = useRef<THREE.PerspectiveCamera>(null!);
    const watchRef = useRef<THREE.Group>(null!);
    const cardRef = useRef<THREE.Group>(null!);
    const spiralRef = useRef<THREE.Group>(null!);

    useFrame((state, delta) => {
        const r = scroll.offset;

        // --- CAMERA SEQUENCE ---
        if (cameraRef.current) {
            // 0 - 0.25: WATCH ENTRY
            if (r < 0.25) {
                cameraRef.current.position.set(0, 0, 5);
                cameraRef.current.lookAt(0, 0, 0);
            }
            // 0.25 - 0.5: WATCH ZOOM & CARD ENTRY
            else if (r < 0.5) {
                const p = (r - 0.25) / 0.25;
                // Zoom into watch slightly
                cameraRef.current.position.z = THREE.MathUtils.lerp(5, 3.5, p);
                // cameraRef.current.rotation.x = THREE.MathUtils.lerp(0, -0.2, p);
            }
            // 0.5 - 0.8: CARD & SPIRAL APPROACH
            else if (r < 0.8) {
                const p = (r - 0.5) / 0.3;
                cameraRef.current.position.z = THREE.MathUtils.lerp(3.5, 4, p); // Pull back slightly for Card
            }
            // 0.8 - 1.0: FINAL SPIRAL ZOOM
            else {
                const p = (r - 0.8) / 0.2;
                // DRAMATIC ZOOM THROUGH THE SPHERE
                cameraRef.current.position.z = THREE.MathUtils.lerp(4, -2, p);
            }
        }

        // --- ANIMATIONS ---

        // 1. WATCH (Visible 0 - 0.4)
        if (watchRef.current) {
            const visible = r < 0.45;
            watchRef.current.visible = visible;
            if (visible) {
                watchRef.current.rotation.y = r * Math.PI * 2;
                watchRef.current.rotation.x = Math.PI / 6 + Math.sin(state.clock.elapsedTime) * 0.05;

                // Fade out logic
                let scale = 1;
                if (r > 0.35) scale = 1 - (r - 0.35) / 0.1;
                watchRef.current.scale.setScalar(scale * 0.9); // Base scale 0.9
            }
        }

        // 2. CARD (Visible 0.3 - 0.7)
        if (cardRef.current) {
            const start = 0.35;
            const end = 0.75;
            const visible = r > start && r < end;
            cardRef.current.visible = visible;

            if (visible) {
                const p = (r - start) / (end - start);
                // Left to Right Animation
                const xPos = THREE.MathUtils.lerp(-5, 5, p);
                cardRef.current.position.x = xPos;

                // Banking
                cardRef.current.rotation.y = xPos * 0.15;
                cardRef.current.rotation.z = -xPos * 0.05;
            }
        }

        // 3. WIREFRAME SPHERE / SPIRAL TURN (Visible 0.7 - 1.0)
        if (spiralRef.current) {
            const start = 0.7;
            const visible = r > start;
            spiralRef.current.visible = visible;

            if (visible) {
                const p = (r - start) / 0.3;

                // Scale up as we approach
                const s = THREE.MathUtils.lerp(0, 1.5, Math.min(1, p * 2));
                spiralRef.current.scale.setScalar(s);

                // Rotation
                spiralRef.current.rotation.y += 0.005;
            }
        }

    });

    return (
        <>
            <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 0, 5]} fov={45} />
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="white" />
            <pointLight position={[-10, -5, -5]} intensity={0.5} color="#B76E79" /> {/* Rose Gold Fill */}

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <group ref={watchRef}>
                <GodfatherWatchModel />
            </group>

            <group ref={cardRef}>
                <CardModel />
            </group>

            <group ref={spiralRef}>
                <WireframeSphereModel />
            </group>
        </>
    );
}
