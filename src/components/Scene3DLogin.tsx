import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const FloatingShape = ({ position, color, speed, size }: { position: [number, number, number]; color: string; speed: number; size: number }) => {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.3) * 0.3;
    ref.current.rotation.y += speed * 0.005;
  });

  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={1.5}>
      <mesh ref={ref} position={position} scale={size}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.15}
          distort={0.4}
          speed={2}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
};

const FloatingTorus = ({ position, color, speed }: { position: [number, number, number]; color: string; speed: number }) => {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    ref.current.rotation.x = state.clock.elapsedTime * speed * 0.2;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * speed * 0.15) * 0.5;
  });

  return (
    <Float speed={speed * 0.7} rotationIntensity={0.3} floatIntensity={1}>
      <mesh ref={ref} position={position}>
        <torusGeometry args={[0.8, 0.25, 16, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.1} wireframe />
      </mesh>
    </Float>
  );
};

const Particles = () => {
  const count = 60;
  const ref = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 12;
    }
    return pos;
  }, []);

  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#dc2626" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
};

export const Scene3DLogin = () => (
  <div className="absolute inset-0 -z-10">
    <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 1.5]}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.3} />
      <FloatingShape position={[-3, 2, -2]} color="#dc2626" speed={1.2} size={1.2} />
      <FloatingShape position={[3.5, -1.5, -3]} color="#3b82f6" speed={0.8} size={0.9} />
      <FloatingShape position={[-2, -2.5, -1]} color="#f59e0b" speed={1} size={0.7} />
      <FloatingShape position={[2, 2.5, -4]} color="#22c55e" speed={0.6} size={1} />
      <FloatingTorus position={[4, 1, -2]} color="#dc2626" speed={1.5} />
      <FloatingTorus position={[-3.5, -1, -3]} color="#8b5cf6" speed={1} />
      <Particles />
    </Canvas>
  </div>
);
