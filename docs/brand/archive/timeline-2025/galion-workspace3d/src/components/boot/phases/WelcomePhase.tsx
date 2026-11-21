// ═══════════════════════════════════════════════════════════════════
// WELCOME PHASE - 3D scene with "Welcome to GALION Ecosystem"
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS, TIMING, EASING, Z_INDEX, type PhaseProps } from '../types';

// ============================================================================
// 3D COMPONENTS
// ============================================================================

function AnimatedSphere({ 
  position, 
  color, 
  size = 1 
}: { 
  position: [number, number, number]; 
  color: string; 
  size?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.3;
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[size, 2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.8}
          transparent
          opacity={0.8}
        />
      </mesh>
    </Float>
  );
}

function GlowingRing({ 
  radius = 3, 
  color = '#3b82f6' 
}: { 
  radius?: number; 
  color?: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.2;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.05, 16, 100]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

function ParticleField() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 500;
  
  const positions = useRef(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }).current();

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#60a5fa"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function WelcomeScene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#3b82f6" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      
      <Stars radius={50} depth={50} count={3000} factor={4} fade speed={1} />
      
      {/* Central Orb */}
      <AnimatedSphere position={[0, 0, 0]} color="#3b82f6" size={1} />
      
      {/* Orbiting Spheres */}
      <AnimatedSphere position={[3, 1, 0]} color="#8b5cf6" size={0.4} />
      <AnimatedSphere position={[-2, -1, 2]} color="#06b6d4" size={0.3} />
      <AnimatedSphere position={[1, 2, -2]} color="#10b981" size={0.35} />
      
      {/* Glowing Rings */}
      <GlowingRing radius={2.5} color="#3b82f6" />
      <GlowingRing radius={3.5} color="#8b5cf6" />
      
      {/* Particle Field */}
      <ParticleField />
    </>
  );
}

// ============================================================================
// WELCOME PHASE
// ============================================================================

export function WelcomePhase({ onComplete, onSkip }: PhaseProps) {
  const [showText, setShowText] = useState(false);
  
  useEffect(() => {
    // Show text after longer delay for dramatic effect
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 1500);
    
    // Auto-advance after full extended duration
    const completeTimer = setTimeout(() => {
      onComplete();
    }, TIMING.WELCOME * 1000);
    
    return () => {
      clearTimeout(textTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);
  
  const handleClick = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black cursor-pointer"
      onClick={handleClick}
    >
      {/* 3D Background */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
          <Suspense fallback={null}>
            <WelcomeScene />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Text Overlay */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ zIndex: Z_INDEX.TEXT }}
      >
        <AnimatePresence>
          {showText && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 1.2, ease: EASING.SMOOTH }}
              className="text-center"
            >
              <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 1.0, ease: EASING.SMOOTH }}
                style={{
                  fontSize: '3rem',
                  fontWeight: 700,
                  background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #22d3ee)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.02em',
                }}
              >
                Welcome to
              </motion.h1>
              
              <motion.h2
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 1.0, ease: EASING.SMOOTH }}
                style={{
                  fontSize: '5rem',
                  fontWeight: 900,
                  color: COLORS.WHITE,
                  marginTop: '0.5rem',
                  letterSpacing: '-0.02em',
                }}
              >
                GALION
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8, ease: EASING.SMOOTH }}
                style={{
                  fontSize: '1.5rem',
                  color: '#60a5fa',
                  marginTop: '1rem',
                }}
              >
                Ecosystem
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1.8, duration: 0.8, ease: EASING.SMOOTH }}
                style={{
                  fontSize: '0.875rem',
                  color: COLORS.WHITE,
                  marginTop: '2rem',
                }}
              >
                Your AI consciousness is ready
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, transparent 60%, rgba(0,0,0,0.8) 100%)',
        }}
      />
    </div>
  );
}
