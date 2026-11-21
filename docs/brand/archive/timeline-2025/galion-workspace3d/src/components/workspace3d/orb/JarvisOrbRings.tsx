'use client';

/**
 * JarvisOrbRings.tsx - Neon Ring System
 * 
 * Multiple orbiting neon rings around the core.
 * Inspired by Iron Man's holographic interfaces:
 * - Three primary rings at different angles
 * - Glowing neon colors (cyan, magenta, gold)
 * - Independent rotation speeds
 * - Glossy, reflective materials
 * - Data tick marks and accent lights
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { JarvisStateConfig } from './jarvisStates';

// ============================================================================
// TYPES
// ============================================================================

export interface JarvisOrbRingsProps {
  size?: number;
  config: JarvisStateConfig;
}

interface RingConfig {
  radius: number;
  tubeRadius: number;
  rotation: [number, number, number];
  color: string;
  speed: number;
  direction: number;
}

// ============================================================================
// SINGLE RING COMPONENT
// ============================================================================

interface SingleRingProps {
  config: RingConfig;
  baseSize: number;
  glowIntensity: number;
  rotationSpeed: number;
}

function SingleRing({ config, baseSize, glowIntensity, rotationSpeed }: SingleRingProps) {
  const ringRef = useRef<THREE.Group>(null);
  const ticksRef = useRef<THREE.InstancedMesh>(null);
  
  const tickCount = 24;
  
  // Pre-calculate tick positions
  const tickMatrices = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const temp = new THREE.Object3D();
    
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * Math.PI * 2;
      const x = Math.cos(angle) * config.radius * baseSize;
      const y = Math.sin(angle) * config.radius * baseSize;
      
      temp.position.set(x, y, 0);
      temp.lookAt(0, 0, 0);
      temp.rotation.z = angle;
      temp.updateMatrix();
      
      matrices.push(temp.matrix.clone());
    }
    
    return matrices;
  }, [config.radius, baseSize]);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    if (ringRef.current) {
      ringRef.current.rotation.z += config.speed * rotationSpeed * config.direction * 0.01;
    }
    
    // Update tick matrices for animation
    if (ticksRef.current) {
      const temp = new THREE.Object3D();
      for (let i = 0; i < tickCount; i++) {
        const angle = (i / tickCount) * Math.PI * 2 + t * config.speed * config.direction;
        const x = Math.cos(angle) * config.radius * baseSize;
        const y = Math.sin(angle) * config.radius * baseSize;
        
        const pulse = Math.sin(t * 3 + i * 0.5) * 0.3 + 0.7;
        
        temp.position.set(x, y, 0);
        temp.scale.setScalar(pulse);
        temp.updateMatrix();
        
        ticksRef.current.setMatrixAt(i, temp.matrix);
      }
      ticksRef.current.instanceMatrix.needsUpdate = true;
    }
  });
  
  const ringColor = new THREE.Color(config.color);
  
  return (
    <group ref={ringRef} rotation={config.rotation}>
      {/* Main ring torus */}
      <mesh>
        <torusGeometry args={[config.radius * baseSize, config.tubeRadius * baseSize, 16, 100]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.color}
          emissiveIntensity={glowIntensity}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Outer glow ring */}
      <mesh>
        <torusGeometry args={[config.radius * baseSize, config.tubeRadius * baseSize * 2, 16, 100]} />
        <meshBasicMaterial
          color={config.color}
          transparent
          opacity={0.2 * glowIntensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Data tick marks */}
      <instancedMesh ref={ticksRef} args={[undefined, undefined, tickCount]}>
        <boxGeometry args={[0.02 * baseSize, 0.1 * baseSize, 0.02 * baseSize]} />
        <meshBasicMaterial
          color={config.color}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JarvisOrbRings({ size = 1, config }: JarvisOrbRingsProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Define the three main rings
  const rings: RingConfig[] = useMemo(() => [
    {
      radius: 1.2,
      tubeRadius: 0.015,
      rotation: [Math.PI / 4, 0, 0] as [number, number, number],
      color: config.rings.primaryColor,
      speed: 0.3,
      direction: 1,
    },
    {
      radius: 1.35,
      tubeRadius: 0.012,
      rotation: [0, Math.PI / 3, Math.PI / 6] as [number, number, number],
      color: config.rings.secondaryColor,
      speed: 0.4,
      direction: -1,
    },
    {
      radius: 1.5,
      tubeRadius: 0.01,
      rotation: [Math.PI / 6, Math.PI / 4, 0] as [number, number, number],
      color: config.rings.accentColor,
      speed: 0.25,
      direction: 1,
    },
  ], [config.rings]);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Very subtle overall rotation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });
  
  return (
    <group ref={groupRef}>
      {rings.map((ring, i) => (
        <SingleRing
          key={i}
          config={ring}
          baseSize={size}
          glowIntensity={config.rings.glowIntensity}
          rotationSpeed={config.rings.rotationSpeed}
        />
      ))}
      
      {/* Accent point lights on rings */}
      <pointLight
        position={[size * 1.2, 0, 0]}
        color={config.rings.primaryColor}
        intensity={config.rings.glowIntensity * 0.5}
        distance={size * 3}
      />
      <pointLight
        position={[-size * 1.2, 0, 0]}
        color={config.rings.secondaryColor}
        intensity={config.rings.glowIntensity * 0.4}
        distance={size * 3}
      />
      <pointLight
        position={[0, size * 1.2, 0]}
        color={config.rings.accentColor}
        intensity={config.rings.glowIntensity * 0.3}
        distance={size * 3}
      />
    </group>
  );
}

export default JarvisOrbRings;

