import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion';

interface SpinningRingProps {
  radius: number;
  speed: number;
  color: string;
  thickness: number;
}

const SpinningRing = forwardRef<THREE.Mesh, SpinningRingProps>(({ radius, speed, color, thickness }, forwardedRef) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  useImperativeHandle(forwardedRef, () => meshRef.current, []);

  useFrame((state) => {
    meshRef.current.rotation.x = state.clock.elapsedTime * speed;
    meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.7;
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[radius, thickness, 16, 48]} />
      <meshStandardMaterial color={color} transparent opacity={0.6} />
    </mesh>
  );
});

SpinningRing.displayName = 'SpinningRing';

const PulsingCore = forwardRef<THREE.Mesh>((_, forwardedRef) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  useImperativeHandle(forwardedRef, () => meshRef.current, []);

  useFrame((state) => {
    const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.5} />
    </mesh>
  );
});

PulsingCore.displayName = 'PulsingCore';

const LoaderScene = () => (
  <Canvas camera={{ position: [0, 0, 4], fov: 45 }} dpr={[1, 1.5]}>
    <ambientLight intensity={0.6} />
    <pointLight position={[3, 3, 3]} intensity={0.8} color="#dc2626" />
    <SpinningRing radius={1} speed={2} color="#dc2626" thickness={0.04} />
    <SpinningRing radius={1.3} speed={-1.5} color="#3b82f6" thickness={0.03} />
    <SpinningRing radius={0.7} speed={3} color="#f59e0b" thickness={0.03} />
    <PulsingCore />
  </Canvas>
);

export const FullPageLoader3D = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background">
    <div className="w-40 h-40">
      <LoaderScene />
    </div>
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-body text-muted-foreground mt-2"
    >
      Loading...
    </motion.p>
  </div>
);

export const InlineLoader3D = ({ size = 80 }: { size?: number }) => (
  <div style={{ width: size, height: size }} className="mx-auto">
    <LoaderScene />
  </div>
);
