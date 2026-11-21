'use client';

/**
 * MobileOrbV3.tsx - Mobile-Optimized Orb Variant
 * 
 * A simplified version of GalionOrbV3 optimized for mobile devices:
 * - Fewer shells (2 vs 5)
 * - Single orbital ring
 * - Reduced particle count (100 vs 1000)
 * - No bloom/post-processing
 * - Lower geometry detail
 * - Simpler neural network
 * - Static star field (no parallax)
 * - Touch-optimized interactions
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { OrbState, getStateConfig } from './orbV3States';
import { OrbEmotion, getEmotionConfig } from './orbV3Emotions';

// ============================================================================
// TYPES
// ============================================================================

export interface MobileOrbV3Props {
  /** 3D position */
  position?: [number, number, number];
  /** Base size */
  size?: number;
  /** Current state */
  state?: OrbState;
  /** Current emotion */
  emotion?: OrbEmotion;
  /** Intensity (0-1) */
  intensity?: number;
  /** Audio level for speech (0-1) */
  audioLevel?: number;
  /** Enable animations (disable to save battery) */
  animate?: boolean;
  /** Touch handlers */
  onTap?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
}

// ============================================================================
// SIMPLIFIED SHELL (Just outer + core)
// ============================================================================

interface MobileShellProps {
  size: number;
  primaryColor: string;
  secondaryColor: string;
  emissiveIntensity: number;
  rotationSpeed: number;
  pulseSpeed: number;
}

function MobileShell({
  size,
  primaryColor,
  secondaryColor,
  emissiveIntensity,
  rotationSpeed,
  pulseSpeed,
}: MobileShellProps) {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const outerMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  useFrame((state) => {
    // Outer shell rotation
    if (outerRef.current) {
      outerRef.current.rotation.y += 0.002 * rotationSpeed;
      outerRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
    
    // Inner shell rotation (opposite)
    if (innerRef.current) {
      innerRef.current.rotation.y -= 0.003 * rotationSpeed;
    }
    
    // Emissive pulse
    if (outerMaterialRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.2 + 0.8;
      outerMaterialRef.current.emissiveIntensity = emissiveIntensity * pulse;
    }
  });
  
  return (
    <group>
      {/* Outer shell - icosahedron */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[size, 0]} />
        <meshStandardMaterial
          ref={outerMaterialRef}
          color="#001020"
          emissive={primaryColor}
          emissiveIntensity={emissiveIntensity}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>
      
      {/* Inner core - smaller, brighter */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[size * 0.5, 0]} />
        <meshStandardMaterial
          color="#001020"
          emissive={secondaryColor}
          emissiveIntensity={emissiveIntensity * 1.5}
          metalness={0.7}
          roughness={0.3}
          transparent
          opacity={0.7}
        />
      </mesh>
      
      {/* Central light point */}
      <mesh>
        <sphereGeometry args={[size * 0.1, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Point light from core */}
      <pointLight
        color={secondaryColor}
        intensity={emissiveIntensity * 2}
        distance={size * 5}
        decay={2}
      />
    </group>
  );
}

// ============================================================================
// SIMPLIFIED RING (Single ring)
// ============================================================================

interface MobileRingProps {
  size: number;
  color: string;
  rotationSpeed: number;
  intensity: number;
}

function MobileRing({ size, color, rotationSpeed, intensity }: MobileRingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.z += rotationSpeed * 0.015;
    }
  });
  
  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[size * 1.3, 0.02, 8, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={intensity * 0.6}
      />
    </mesh>
  );
}

// ============================================================================
// SIMPLIFIED PARTICLES (Low count)
// ============================================================================

interface MobileParticlesProps {
  count: number;
  radius: number;
  color: string;
  intensity: number;
  speed: number;
}

function MobileParticles({ count, radius, color, intensity, speed }: MobileParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.6 + Math.random() * 0.4);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    
    return positions;
  }, [count, radius]);
  
  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001 * speed;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={1.5}
        transparent
        opacity={intensity * 0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// SIMPLIFIED GLOW (Single layer)
// ============================================================================

interface MobileGlowProps {
  size: number;
  color: string;
  intensity: number;
  pulseSpeed: number;
}

function MobileGlow({ size, color, intensity, pulseSpeed }: MobileGlowProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  useFrame((state) => {
    if (materialRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.05 + 0.15;
      materialRef.current.opacity = intensity * pulse;
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size * 1.4, 16, 16]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={intensity * 0.15}
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ============================================================================
// MAIN MOBILE ORB COMPONENT
// ============================================================================

export function MobileOrbV3({
  position = [0, 0, 0],
  size = 2,
  state = 'idle',
  emotion = 'neutral',
  intensity = 0.7,
  audioLevel = 0,
  animate = true,
  onTap,
  onLongPress,
  onDoubleTap,
}: MobileOrbV3Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(1);
  
  // Touch handling
  const touchStartRef = useRef<number>(0);
  const touchCountRef = useRef(0);
  const longPressTimerRef = useRef<NodeJS.Timeout>();
  const lastTapRef = useRef<number>(0);
  
  // Get configurations
  const stateConfig = getStateConfig(state);
  const emotionConfig = getEmotionConfig(emotion);
  
  // Calculate values
  const rotationSpeed = stateConfig.gradient.rotationSpeed * emotionConfig.speedMultiplier;
  const pulseSpeed = stateConfig.core.pulseSpeed * emotionConfig.speedMultiplier;
  const emissiveIntensity = stateConfig.glow.intensity * emotionConfig.glowIntensity * intensity;
  
  // Scale animation
  useEffect(() => {
    const baseScale = stateConfig.scale.base;
    const audioScale = state === 'speaking' ? audioLevel * 0.02 : 0;
    setScale(baseScale + audioScale);
  }, [state, audioLevel, stateConfig]);
  
  // Animation loop
  useFrame((frameState, delta) => {
    if (!groupRef.current || !animate) return;
    
    // Smooth scale
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, scale, delta * 5);
    groupRef.current.scale.setScalar(newScale);
    
    // Breathing
    const breathe = Math.sin(frameState.clock.elapsedTime * stateConfig.pulse.duration) * stateConfig.pulse.intensity;
    groupRef.current.scale.multiplyScalar(1 + breathe * 0.5); // Reduced breathing on mobile
  });
  
  // Touch handlers
  const handlePointerDown = (e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    touchStartRef.current = Date.now();
    touchCountRef.current++;
    
    // Long press detection
    longPressTimerRef.current = setTimeout(() => {
      onLongPress?.();
    }, 500);
    
    // Double tap detection
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onDoubleTap?.();
      touchCountRef.current = 0;
    }
    lastTapRef.current = now;
  };
  
  const handlePointerUp = (e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    const tapDuration = Date.now() - touchStartRef.current;
    if (tapDuration < 200 && touchCountRef.current === 1) {
      onTap?.();
    }
    
    touchCountRef.current = 0;
  };
  
  return (
    <group
      ref={groupRef}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* Simplified shell structure */}
      <MobileShell
        size={size}
        primaryColor={emotionConfig.primary}
        secondaryColor={emotionConfig.secondary}
        emissiveIntensity={emissiveIntensity}
        rotationSpeed={rotationSpeed}
        pulseSpeed={pulseSpeed}
      />
      
      {/* Single orbital ring */}
      <MobileRing
        size={size}
        color={emotionConfig.primary}
        rotationSpeed={rotationSpeed}
        intensity={intensity}
      />
      
      {/* Reduced particles */}
      <MobileParticles
        count={100}
        radius={size * 2}
        color={emotionConfig.secondary}
        intensity={intensity}
        speed={emotionConfig.speedMultiplier}
      />
      
      {/* Single glow layer */}
      <MobileGlow
        size={size}
        color={emotionConfig.primary}
        intensity={intensity}
        pulseSpeed={pulseSpeed}
      />
    </group>
  );
}

export default MobileOrbV3;

