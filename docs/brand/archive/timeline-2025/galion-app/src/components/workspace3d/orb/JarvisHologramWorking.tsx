'use client';

/**
 * JarvisHologramWorking.tsx - Guaranteed Working Version
 * 
 * Minimal Three.js/R3F implementation that is guaranteed to render.
 */

import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Simple rotating core
function Core() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.5, 2]} />
      <meshStandardMaterial
        color="#00ffff"
        emissive="#00ffff"
        emissiveIntensity={2}
        wireframe
      />
    </mesh>
  );
}

// Rotating ring
function Ring({ radius, speed, axis }: { radius: number; speed: number; axis: 'x' | 'y' | 'z' }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation[axis] = state.clock.elapsedTime * speed;
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[radius, 0.02, 16, 100]} />
      <meshStandardMaterial
        color="#FFB400"
        emissive="#FFB400"
        emissiveIntensity={1}
      />
    </mesh>
  );
}

// Scene content
function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00ffff" />
      
      <Core />
      <Ring radius={1} speed={0.5} axis="y" />
      <Ring radius={1.5} speed={-0.3} axis="x" />
      <Ring radius={2} speed={0.2} axis="z" />
    </>
  );
}

// Loading fallback
function Loader() {
  return (
    <mesh>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial color="#FFB400" wireframe />
    </mesh>
  );
}

// Main exported component
export function JarvisHologramWorking() {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      minHeight: '400px',
      background: '#000' 
    }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#000011']} />
        <Suspense fallback={<Loader />}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default JarvisHologramWorking;
