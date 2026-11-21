// ═══════════════════════════════════════════════════════════════════
// BIRTH PHASE - Spinner → Nebula → Orb birth
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS, TIMING, EASING, type PhaseProps } from '../types';

// Nebula particle system
function NebulaParticles({ progress }: { progress: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 1000;
  
  const particles = useRef(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = Math.random() * 3;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }).current();
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#6d28d9"
        transparent
        opacity={progress * 0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Orb mesh
function OrbMesh({ scale }: { scale: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });
  
  return (
    <mesh ref={meshRef} scale={scale}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color="#3b82f6"
        emissive="#3b82f6"
        emissiveIntensity={0.8}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

// Birth scene
function BirthScene({ phase }: { phase: 'spinner' | 'nebula' | 'orb' }) {
  const nebulaProgress = phase === 'nebula' ? 1 : phase === 'orb' ? 1 : 0;
  const orbScale = phase === 'orb' ? 1 : 0;
  
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#3b82f6" />
      <Stars radius={50} depth={50} count={2000} factor={3} fade speed={1} />
      
      {phase !== 'spinner' && <NebulaParticles progress={nebulaProgress} />}
      {phase === 'orb' && <OrbMesh scale={orbScale} />}
      {phase !== 'spinner' && (
        <Sparkles
          count={30}
          scale={5}
          size={2}
          speed={0.5}
          opacity={nebulaProgress * 0.5}
          color="#a78bfa"
        />
      )}
    </>
  );
}

// Spinner component
function Spinner() {
  return (
    <div className="relative w-20 h-20">
      {/* Outer ring - blue */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: '2px solid #3b82f6',
          borderTopColor: 'transparent',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
      />
      
      {/* Middle ring - purple */}
      <motion.div
        className="absolute inset-2 rounded-full"
        style={{
          border: '2px solid #8b5cf6',
          borderTopColor: 'transparent',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2.5, ease: 'linear', repeat: Infinity }}
      />
      
      {/* Inner ring - cyan */}
      <motion.div
        className="absolute inset-4 rounded-full"
        style={{
          border: '2px solid #22d3ee',
          borderTopColor: 'transparent',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
      />
    </div>
  );
}

export function BirthPhase({ onComplete }: PhaseProps) {
  const [subPhase, setSubPhase] = useState<'spinner' | 'nebula' | 'orb'>('spinner');
  
  useEffect(() => {
    // Spinner (0-2s)
    const spinnerTimer = setTimeout(() => {
      setSubPhase('nebula');
    }, 2000);
    
    // Nebula (2-4s)
    const nebulaTimer = setTimeout(() => {
      setSubPhase('orb');
    }, 4000);
    
    // Complete (4-6s)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, TIMING.BIRTH * 1000);
    
    return () => {
      clearTimeout(spinnerTimer);
      clearTimeout(nebulaTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);
  
  return (
    <div className="fixed inset-0 bg-black">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
          <Suspense fallback={null}>
            <BirthScene phase={subPhase} />
          </Suspense>
        </Canvas>
      </div>
      
      {/* 2D Spinner overlay (only during spinner phase) */}
      {subPhase === 'spinner' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.5, ease: EASING.SMOOTH }}
          >
            <Spinner />
          </motion.div>
        </div>
      )}
    </div>
  );
}
