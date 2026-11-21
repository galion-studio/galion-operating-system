'use client';

/**
 * OrbEnergyStreams.tsx - Flowing Particle Rivers Toward Core
 * 
 * Creates energy streams that flow through the orb:
 * - Particle streams in spiral patterns toward/from center
 * - Multiple streams at different depths
 * - Speed increases near center (gravitational pull)
 * - Direction changes based on state (inward/outward)
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbState, getStateConfig } from './orbV3States';
import { OrbEmotion, getEmotionConfig } from './orbV3Emotions';

// ============================================================================
// TYPES
// ============================================================================

export interface OrbEnergyStreamsProps {
  /** Base size of the orb */
  size?: number;
  /** Current state */
  state?: OrbState;
  /** Current emotion */
  emotion?: OrbEmotion;
  /** Intensity (0-1) */
  intensity?: number;
  /** Quality level */
  quality?: 'low' | 'medium' | 'high';
}

// ============================================================================
// SPIRAL STREAM
// ============================================================================

interface SpiralStreamProps {
  particleCount: number;
  innerRadius: number;
  outerRadius: number;
  color: string;
  speed: number;
  direction: number; // 1 = inward, -1 = outward
  intensity: number;
  spiralTurns: number;
  tilt: [number, number, number];
}

function SpiralStream({
  particleCount,
  innerRadius,
  outerRadius,
  color,
  speed,
  direction,
  intensity,
  spiralTurns,
  tilt,
}: SpiralStreamProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const progressRef = useRef<Float32Array>(new Float32Array(particleCount));
  
  // Initialize progress values
  useMemo(() => {
    for (let i = 0; i < particleCount; i++) {
      progressRef.current[i] = Math.random();
    }
  }, [particleCount]);
  
  // Generate initial positions
  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    return positions;
  }, [particleCount]);
  
  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    const positionAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < particleCount; i++) {
      // Update progress
      progressRef.current[i] += delta * speed * (0.5 + Math.random() * 0.5);
      if (progressRef.current[i] > 1) progressRef.current[i] = 0;
      
      const progress = progressRef.current[i];
      
      // Calculate position along spiral
      // If direction is inward, progress goes outer->inner
      // If direction is outward, progress goes inner->outer
      const t = direction > 0 ? 1 - progress : progress;
      const radius = innerRadius + t * (outerRadius - innerRadius);
      
      // Spiral angle increases with progress
      const angle = progress * Math.PI * 2 * spiralTurns + i * 0.5;
      
      // Accelerate near center (gravitational effect)
      const gravityFactor = direction > 0 
        ? 1 + (1 - t) * 2 // Faster when closer to center (inward)
        : 1 + t * 2; // Faster when closer to edge (outward)
      
      // Calculate 3D position on spiral
      const x = radius * Math.cos(angle) * gravityFactor * 0.3;
      const y = (progress - 0.5) * outerRadius * 0.5; // Vertical spread
      const z = radius * Math.sin(angle) * gravityFactor * 0.3;
      
      positionAttr.array[i * 3] = x;
      positionAttr.array[i * 3 + 1] = y;
      positionAttr.array[i * 3 + 2] = z;
    }
    
    positionAttr.needsUpdate = true;
    
    // Rotate the whole stream
    pointsRef.current.rotation.y += 0.005 * speed * direction;
  });
  
  return (
    <points ref={pointsRef} rotation={tilt}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={1.5}
        transparent
        opacity={intensity * 0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// RADIAL STREAM (Straight lines toward/from center)
// ============================================================================

interface RadialStreamProps {
  particleCount: number;
  innerRadius: number;
  outerRadius: number;
  color: string;
  speed: number;
  direction: number;
  intensity: number;
}

function RadialStream({
  particleCount,
  innerRadius,
  outerRadius,
  color,
  speed,
  direction,
  intensity,
}: RadialStreamProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const dataRef = useRef<{
    progress: Float32Array;
    angles: Float32Array;
    phis: Float32Array;
  }>({
    progress: new Float32Array(particleCount),
    angles: new Float32Array(particleCount),
    phis: new Float32Array(particleCount),
  });
  
  // Initialize data
  useMemo(() => {
    for (let i = 0; i < particleCount; i++) {
      dataRef.current.progress[i] = Math.random();
      dataRef.current.angles[i] = Math.random() * Math.PI * 2;
      dataRef.current.phis[i] = Math.acos(2 * Math.random() - 1);
    }
  }, [particleCount]);
  
  const positions = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);
  
  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    
    const positionAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const { progress, angles, phis } = dataRef.current;
    
    for (let i = 0; i < particleCount; i++) {
      // Update progress
      progress[i] += delta * speed;
      if (progress[i] > 1) {
        progress[i] = 0;
        // Randomize direction for variety
        angles[i] = Math.random() * Math.PI * 2;
        phis[i] = Math.acos(2 * Math.random() - 1);
      }
      
      // Calculate radius based on progress and direction
      const t = direction > 0 ? 1 - progress[i] : progress[i];
      const radius = innerRadius + t * (outerRadius - innerRadius);
      
      // Spherical to Cartesian
      const x = radius * Math.sin(phis[i]) * Math.cos(angles[i]);
      const y = radius * Math.sin(phis[i]) * Math.sin(angles[i]);
      const z = radius * Math.cos(phis[i]);
      
      positionAttr.array[i * 3] = x;
      positionAttr.array[i * 3 + 1] = y;
      positionAttr.array[i * 3 + 2] = z;
    }
    
    positionAttr.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={2}
        transparent
        opacity={intensity * 0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// VORTEX RING (Circular flow around the core)
// ============================================================================

interface VortexRingProps {
  particleCount: number;
  radius: number;
  height: number;
  color: string;
  speed: number;
  intensity: number;
}

function VortexRing({
  particleCount,
  radius,
  height,
  color,
  speed,
  intensity,
}: VortexRingProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const anglesRef = useRef<Float32Array>(new Float32Array(particleCount));
  const heightsRef = useRef<Float32Array>(new Float32Array(particleCount));
  
  // Initialize angles and heights
  useMemo(() => {
    for (let i = 0; i < particleCount; i++) {
      anglesRef.current[i] = (i / particleCount) * Math.PI * 2;
      heightsRef.current[i] = (Math.random() - 0.5) * height;
    }
  }, [particleCount, height]);
  
  const positions = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);
  
  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    const positionAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < particleCount; i++) {
      anglesRef.current[i] += delta * speed;
      
      const angle = anglesRef.current[i];
      const h = heightsRef.current[i] + Math.sin(time * 2 + i * 0.1) * 0.1;
      const r = radius * (0.8 + Math.sin(time + angle) * 0.2);
      
      positionAttr.array[i * 3] = Math.cos(angle) * r;
      positionAttr.array[i * 3 + 1] = h;
      positionAttr.array[i * 3 + 2] = Math.sin(angle) * r;
    }
    
    positionAttr.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={1.2}
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
// MAIN COMPONENT
// ============================================================================

export function OrbEnergyStreams({
  size = 2,
  state = 'idle',
  emotion = 'neutral',
  intensity = 0.5,
  quality = 'high',
}: OrbEnergyStreamsProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Get configurations
  const stateConfig = getStateConfig(state);
  const emotionConfig = getEmotionConfig(emotion);
  
  // Flow direction and speed from state
  const direction = stateConfig.energyFlow.direction;
  const flowSpeed = stateConfig.energyFlow.speed * emotionConfig.speedMultiplier;
  
  // Particle counts based on quality
  const particleCounts = useMemo(() => {
    switch (quality) {
      case 'low': return { spiral: 50, radial: 30, vortex: 30 };
      case 'medium': return { spiral: 100, radial: 60, vortex: 50 };
      case 'high': return { spiral: 200, radial: 100, vortex: 80 };
      default: return { spiral: 100, radial: 60, vortex: 50 };
    }
  }, [quality]);
  
  // Global group animation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002 * flowSpeed;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Main spiral stream */}
      <SpiralStream
        particleCount={particleCounts.spiral}
        innerRadius={size * 0.1}
        outerRadius={size * 0.8}
        color={emotionConfig.stream}
        speed={flowSpeed}
        direction={direction}
        intensity={intensity}
        spiralTurns={3}
        tilt={[0, 0, 0]}
      />
      
      {/* Secondary spiral (opposite rotation) */}
      {quality !== 'low' && (
        <SpiralStream
          particleCount={Math.floor(particleCounts.spiral * 0.6)}
          innerRadius={size * 0.15}
          outerRadius={size * 0.7}
          color={emotionConfig.secondary}
          speed={flowSpeed * 0.8}
          direction={direction}
          intensity={intensity * 0.7}
          spiralTurns={2}
          tilt={[0.3, 0, 0.2]}
        />
      )}
      
      {/* Radial streams (straight lines) */}
      <RadialStream
        particleCount={particleCounts.radial}
        innerRadius={size * 0.05}
        outerRadius={size * 0.85}
        color={emotionConfig.accent}
        speed={flowSpeed * 1.2}
        direction={direction}
        intensity={intensity * 0.8}
      />
      
      {/* Vortex ring around core */}
      {quality !== 'low' && direction === 0 && (
        <VortexRing
          particleCount={particleCounts.vortex}
          radius={size * 0.3}
          height={size * 0.2}
          color={emotionConfig.stream}
          speed={flowSpeed * 2}
          intensity={intensity * 0.6}
        />
      )}
      
      {/* Additional vortex rings for high quality */}
      {quality === 'high' && (
        <>
          <VortexRing
            particleCount={Math.floor(particleCounts.vortex * 0.7)}
            radius={size * 0.5}
            height={size * 0.3}
            color={emotionConfig.secondary}
            speed={flowSpeed * 1.5}
            intensity={intensity * 0.4}
          />
          <VortexRing
            particleCount={Math.floor(particleCounts.vortex * 0.5)}
            radius={size * 0.7}
            height={size * 0.4}
            color={emotionConfig.primary}
            speed={flowSpeed}
            intensity={intensity * 0.3}
          />
        </>
      )}
    </group>
  );
}

export default OrbEnergyStreams;

