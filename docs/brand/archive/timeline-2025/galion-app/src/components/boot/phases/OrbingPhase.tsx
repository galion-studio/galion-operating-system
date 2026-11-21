// ═══════════════════════════════════════════════════════════════════
// ORBING PHASE - Orb materialization for returning users
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect, Suspense, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, TIMING, EASING, Z_INDEX, type PhaseProps } from '../types';

// Simple orb component
function OrbMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle idle pulse
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meshRef.current.scale.setScalar(scale);
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color="#3b82f6"
        emissive="#3b82f6"
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

function OrbScene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#3b82f6" />
      <OrbMesh />
    </>
  );
}

export function OrbingPhase({ onComplete }: PhaseProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, TIMING.ORBING * 1000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="fixed inset-0 bg-black">
      {/* 3D Orb */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: EASING.SMOOTH }}
        className="absolute inset-0"
      >
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Suspense fallback={null}>
            <OrbScene />
          </Suspense>
        </Canvas>
      </motion.div>
      
      {/* Ready text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: 1, duration: 0.8, ease: EASING.SMOOTH }}
        className="absolute bottom-8 left-0 right-0 text-center"
        style={{
          color: COLORS.WHITE,
          fontSize: '14px',
          zIndex: Z_INDEX.TEXT,
        }}
      >
        Ready
      </motion.div>
    </div>
  );
}
