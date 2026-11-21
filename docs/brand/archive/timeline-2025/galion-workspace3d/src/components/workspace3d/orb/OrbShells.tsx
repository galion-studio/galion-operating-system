'use client';

/**
 * OrbShells.tsx - Nested Shell Geometries for God-Like Depth
 * 
 * Creates the 5 nested shell structure that gives the orb physical presence:
 * - Shell 1: Outer atmosphere (transparent, 2x size)
 * - Shell 2: Wireframe dodecahedron (rotating)
 * - Shell 3: Glowing icosahedron (main body)
 * - Shell 4: Inner core (bright, pulsing)
 * - Shell 5: Central light point (singularity)
 * 
 * Each shell rotates independently to create depth and motion
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbState, getStateConfig } from './orbV3States';
import { OrbEmotion, getEmotionConfig } from './orbV3Emotions';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Converts rgba/rgb color string to hex format for THREE.Color
 * @param color - Color string like 'rgba(6, 182, 212, 0.25)' or '#06b6d4'
 * @returns Hex color string like '#06b6d4'
 */
function rgbaToHex(color: string): string {
  // If already hex, return as-is
  if (color.startsWith('#')) return color;

  // Extract RGB values from rgba() or rgb()
  const match = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Fallback to cyan if parsing fails
  return '#06b6d4';
}

// ============================================================================
// TYPES
// ============================================================================

export interface OrbShellsProps {
  /** Base size of the orb */
  size?: number;
  /** Current state */
  state?: OrbState;
  /** Current emotion */
  emotion?: OrbEmotion;
  /** Animation intensity (0-1) */
  intensity?: number;
  /** Quality level for LOD */
  quality?: 'low' | 'medium' | 'high';
  /** Enable shell animations */
  animate?: boolean;
}

interface ShellConfig {
  size: number;
  segments: number;
  opacity: number;
  wireframe: boolean;
  emissiveIntensity: number;
}

// ============================================================================
// QUALITY PRESETS
// ============================================================================

const QUALITY_SETTINGS = {
  low: {
    shell1Segments: 16,
    shell2Detail: 0,
    shell3Detail: 0,
    shell4Segments: 8,
    shell5Segments: 8,
    enableShell1: false, // Disable outer atmosphere on low
    enableShell2: true,
  },
  medium: {
    shell1Segments: 24,
    shell2Detail: 0,
    shell3Detail: 1,
    shell4Segments: 16,
    shell5Segments: 12,
    enableShell1: true,
    enableShell2: true,
  },
  high: {
    shell1Segments: 48,
    shell2Detail: 1,
    shell3Detail: 2,
    shell4Segments: 32,
    shell5Segments: 24,
    enableShell1: true,
    enableShell2: true,
  },
};

// ============================================================================
// SHELL COMPONENTS
// ============================================================================

/**
 * Shell 1: Outer Atmosphere
 * Large transparent sphere for glow containment
 */
function OuterAtmosphere({ 
  size, 
  color, 
  opacity, 
  segments 
}: { 
  size: number; 
  color: string; 
  opacity: number;
  segments: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Very slow rotation
      meshRef.current.rotation.y += 0.0005;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size * 2, segments, segments]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity * 0.05}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Shell 2: Wireframe Dodecahedron
 * Geometric structure rotating and pulsating inside the orb
 */
function WireframeDodecahedron({ 
  size, 
  color, 
  opacity,
  rotationSpeed 
}: { 
  size: number; 
  color: string; 
  opacity: number;
  rotationSpeed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Rotation
      meshRef.current.rotation.y += 0.003 * rotationSpeed;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
      meshRef.current.rotation.z += 0.001 * rotationSpeed;
      
      // Breathing/Pulsating animation - scale in and out
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
      meshRef.current.scale.setScalar(breathe);
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <dodecahedronGeometry args={[size * 1.2, 0]} />
      <meshBasicMaterial
        color={color}
        wireframe
        transparent
        opacity={opacity * 0.5}
      />
    </mesh>
  );
}

/**
 * Shell 3: Main Icosahedron Body
 * Primary visible shell with emissive glow
 */
function MainBody({ 
  size, 
  primaryColor,
  secondaryColor,
  emissiveIntensity,
  detail,
  rotationSpeed,
  pulsing,
  pulseSpeed,
}: { 
  size: number; 
  primaryColor: string;
  secondaryColor: string;
  emissiveIntensity: number;
  detail: number;
  rotationSpeed: number;
  pulsing: boolean;
  pulseSpeed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y -= 0.002 * rotationSpeed;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.15) * 0.15;
    }
    
    // Pulse emissive intensity
    if (materialRef.current && pulsing) {
      const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.3 + 0.7;
      materialRef.current.emissiveIntensity = emissiveIntensity * pulse;
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[size, detail]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#001830"
        emissive={secondaryColor}
        emissiveIntensity={emissiveIntensity}
        metalness={0.9}
        roughness={0.1}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

/**
 * Shell 4: Inner Core
 * Brighter inner shell visible through main body
 */
function InnerCore({ 
  size, 
  color,
  emissiveIntensity,
  segments,
  rotationSpeed,
  pulseSpeed,
}: { 
  size: number; 
  color: string;
  emissiveIntensity: number;
  segments: number;
  rotationSpeed: number;
  pulseSpeed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(1);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.06 * rotationSpeed;
      meshRef.current.rotation.y -= 0.003 * rotationSpeed;
      
      // Subtle breathing scale
      const pulse = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.03;
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, pulse, 0.1);
      meshRef.current.scale.setScalar(scaleRef.current);
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[size * 0.6, 2]} />
      <meshStandardMaterial
        color="#001525"
        emissive={color}
        emissiveIntensity={emissiveIntensity * 1.5}
        metalness={0.8}
        roughness={0.2}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

/**
 * Shell 5: Central Singularity
 * The bright core point - the "eye" of the god
 */
function CentralSingularity({ 
  size, 
  color,
  brightness,
  segments,
  pulseSpeed,
}: { 
  size: number; 
  color: string;
  brightness: number;
  segments: number;
  pulseSpeed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Intense pulsing at core
      const pulse = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed * 2) * 0.08;
      meshRef.current.scale.setScalar(pulse);
    }
    
    if (materialRef.current) {
      // Opacity pulsing
      const opacityPulse = 0.8 + Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.2;
      materialRef.current.opacity = brightness * opacityPulse;
    }
  });
  
  return (
    <>
      {/* Core sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size * 0.15, segments, segments]} />
        <meshBasicMaterial
          ref={materialRef}
          color={color}
          transparent
          opacity={brightness}
        />
      </mesh>
      
      {/* Inner bright point */}
      <mesh>
        <sphereGeometry args={[size * 0.05, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Core point light */}
      <pointLight
        color={color}
        intensity={brightness * 3}
        distance={size * 5}
        decay={2}
      />
    </>
  );
}

// ============================================================================
// ORBITAL RINGS
// ============================================================================

interface OrbitalRingProps {
  size: number;
  color: string;
  opacity: number;
  thickness: number;
  tilt: [number, number, number];
  rotationSpeed: number;
  segments: number;
}

function OrbitalRing({ 
  size, 
  color, 
  opacity, 
  thickness, 
  tilt, 
  rotationSpeed,
  segments,
}: OrbitalRingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += rotationSpeed * 0.01;
      meshRef.current.rotation.x = tilt[0] + Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });
  
  return (
    <mesh ref={meshRef} rotation={tilt}>
      <torusGeometry args={[size, thickness, 8, segments]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrbShells({
  size = 2,
  state = 'idle',
  emotion = 'neutral',
  intensity = 0.5,
  quality = 'high',
  animate = true,
}: OrbShellsProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Get configurations
  const stateConfig = getStateConfig(state);
  const emotionConfig = getEmotionConfig(emotion);
  const qualitySettings = QUALITY_SETTINGS[quality];
  
  // Calculate derived values
  const rotationSpeed = useMemo(() => {
    return stateConfig.gradient.rotationSpeed * emotionConfig.speedMultiplier;
  }, [stateConfig, emotionConfig]);
  
  const pulseSpeed = useMemo(() => {
    return stateConfig.core.pulseSpeed * emotionConfig.speedMultiplier;
  }, [stateConfig, emotionConfig]);
  
  const emissiveIntensity = useMemo(() => {
    return stateConfig.glow.intensity * emotionConfig.glowIntensity * (0.5 + intensity * 0.5);
  }, [stateConfig, emotionConfig, intensity]);
  
  // Global group subtle animation
  useFrame((state) => {
    if (groupRef.current && animate) {
      // Very subtle breathing
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.005;
      groupRef.current.scale.setScalar(breathe);
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Shell 1: Outer Atmosphere */}
      {qualitySettings.enableShell1 && (
        <OuterAtmosphere
          size={size}
          color={emotionConfig.primary}
          opacity={stateConfig.glow.intensity}
          segments={qualitySettings.shell1Segments}
        />
      )}
      
      {/* Shell 2: Wireframe Dodecahedron */}
      {qualitySettings.enableShell2 && (
        <WireframeDodecahedron
          size={size}
          color={emotionConfig.primary}
          opacity={intensity}
          rotationSpeed={rotationSpeed}
        />
      )}
      
      {/* Shell 3: Main Body */}
      <MainBody
        size={size}
        primaryColor={emotionConfig.primary}
        secondaryColor={emotionConfig.secondary}
        emissiveIntensity={emissiveIntensity}
        detail={qualitySettings.shell3Detail}
        rotationSpeed={rotationSpeed}
        pulsing={stateConfig.glow.pulsing}
        pulseSpeed={pulseSpeed}
      />
      
      {/* Shell 4: Inner Core */}
      <InnerCore
        size={size}
        color={emotionConfig.accent}
        emissiveIntensity={emissiveIntensity}
        segments={qualitySettings.shell4Segments}
        rotationSpeed={rotationSpeed}
        pulseSpeed={pulseSpeed}
      />
      
      {/* Shell 5: Central Singularity */}
      <CentralSingularity
        size={size}
        color={emotionConfig.core}
        brightness={stateConfig.core.brightness}
        segments={qualitySettings.shell5Segments}
        pulseSpeed={pulseSpeed}
      />
      
      {/* Orbital Ring 1 - Horizontal */}
      <OrbitalRing
        size={size * 1.4}
        color={emotionConfig.primary}
        opacity={0.6 * intensity}
        thickness={0.02}
        tilt={[Math.PI / 2, 0, 0]}
        rotationSpeed={rotationSpeed * 1.5}
        segments={quality === 'low' ? 32 : 64}
      />
      
      {/* Orbital Ring 2 - Tilted */}
      {quality !== 'low' && (
        <OrbitalRing
          size={size * 1.6}
          color={emotionConfig.secondary}
          opacity={0.4 * intensity}
          thickness={0.015}
          tilt={[Math.PI / 3, 0, 0]}
          rotationSpeed={-rotationSpeed}
          segments={64}
        />
      )}
      
      {/* Orbital Ring 3 - Opposite tilt */}
      {quality === 'high' && (
        <OrbitalRing
          size={size * 1.8}
          color={emotionConfig.accent}
          opacity={0.3 * intensity}
          thickness={0.01}
          tilt={[Math.PI / 2, Math.PI / 4, 0]}
          rotationSpeed={rotationSpeed * 0.8}
          segments={64}
        />
      )}
      
      {/* Orbital Ring 4 - Vertical */}
      {quality === 'high' && (
        <OrbitalRing
          size={size * 2.0}
          color={rgbaToHex(emotionConfig.glow)}
          opacity={0.2 * intensity}
          thickness={0.008}
          tilt={[0, 0, Math.PI / 2]}
          rotationSpeed={rotationSpeed * 0.5}
          segments={64}
        />
      )}
    </group>
  );
}

export default OrbShells;

