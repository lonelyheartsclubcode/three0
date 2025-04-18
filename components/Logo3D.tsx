import * as THREE from 'three';
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

// Define proper typing for the refs
type TextMeshRef = THREE.Mesh & {
  material: THREE.MeshStandardMaterial;
};

type GroupRef = THREE.Group;

function AnimatedLogo() {
  const groupRef = useRef<GroupRef>(null);
  const textRef = useRef<TextMeshRef>(null);

  // Animate with rotation only, no bounce or zoom
  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Faster rotation (increased multiplier from 0.5 to 0.8)
      groupRef.current.rotation.y += delta * 0.8;
      groupRef.current.rotation.x = Math.sin(elapsed * 0.3) * 0.1;
    }

    if (textRef.current) {
      // Only keep subtle rotation
      textRef.current.rotation.x = Math.sin(elapsed * 1.5) * 0.1;
      textRef.current.rotation.y = Math.cos(elapsed * 1.2) * 0.1;
    }
  });

  return (
    <>
      {/* Position the group slightly higher to prevent bottom cutoff */}
      <group ref={groupRef} position={[0, -0.1, 0]}>
        <Text
          ref={textRef}
          fontSize={2.0}
          color="white"
          anchorX="center"
          anchorY="middle"
          material-toneMapped={false}
          material-metalness={0.8}
          material-roughness={0.25}
          castShadow
          receiveShadow
        >
          three0
        </Text>
      </group>

      {/* Lights */}
      <ambientLight intensity={0.3} />
      <pointLight
        position={[5, 10, 7]}
        intensity={1.5}
        color="white"
      />
      <pointLight position={[-5, 6, 3]} intensity={0.9} color="#ffa500" />
      <directionalLight position={[0, 10, 0]} intensity={0.4} color="#a0c4ff" />
    </>
  );
}

// Define props interface
interface Logo3DProps {
  onClick: () => void;
  width?: number;
  height?: number;
}

export default function Logo3D({ onClick, width = 180, height = 80 }: Logo3DProps) {
  return (
    <div 
      style={{ width, height }} 
      className="cursor-pointer"
      onClick={onClick}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }}>
        <AnimatedLogo />
      </Canvas>
    </div>
  );
} 