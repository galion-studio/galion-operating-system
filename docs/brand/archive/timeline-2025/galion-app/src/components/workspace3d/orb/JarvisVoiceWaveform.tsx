'use client';

/**
 * JarvisVoiceWaveform.tsx - 3D Voice Audio Spectrum
 * 
 * Marvel JARVIS-style voice waveform visualization:
 * - Circular ring of frequency bars around the orb
 * - Responds to audioLevel prop or real audio input
 * - Glowing holographic appearance
 * - Smooth interpolation for visual appeal
 * - Demo mode with procedural animation
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { JarvisStateConfig } from './jarvisStates';

// ============================================================================
// TYPES
// ============================================================================

export interface JarvisVoiceWaveformProps {
  size?: number;
  config: JarvisStateConfig;
  audioLevel?: number;
  audioData?: Float32Array | null; // Real frequency data from audio analyser
  isActive?: boolean;
  intensity?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BAR_COUNT = 64;
const MIN_HEIGHT = 0.02;
const MAX_HEIGHT = 0.4;

// ============================================================================
// WAVEFORM BAR COMPONENT (Instanced for performance)
// ============================================================================

function WaveformRing({
  size,
  color,
  audioLevel,
  audioData,
  isActive,
  intensity,
}: {
  size: number;
  color: string;
  audioLevel: number;
  audioData?: Float32Array | null;
  isActive: boolean;
  intensity: number;
}) {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const dummyObject = useMemo(() => new THREE.Object3D(), []);
  const barHeights = useRef<number[]>(new Array(BAR_COUNT).fill(MIN_HEIGHT));
  const targetHeights = useRef<number[]>(new Array(BAR_COUNT).fill(MIN_HEIGHT));
  
  const ringRadius = size * 1.3;
  
  // Pre-calculate bar positions
  const barPositions = useMemo(() => {
    const positions: { x: number; z: number; angle: number }[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      const angle = (i / BAR_COUNT) * Math.PI * 2;
      positions.push({
        x: Math.cos(angle) * ringRadius,
        z: Math.sin(angle) * ringRadius,
        angle,
      });
    }
    return positions;
  }, [ringRadius]);

  useFrame((state) => {
    if (!instancedRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Calculate target heights based on audio
    for (let i = 0; i < BAR_COUNT; i++) {
      let targetHeight: number;
      
      if (audioData && audioData.length > 0) {
        // Use real audio data
        const dataIndex = Math.floor((i / BAR_COUNT) * audioData.length);
        const value = audioData[dataIndex] / 255; // Normalize 0-1
        targetHeight = MIN_HEIGHT + value * (MAX_HEIGHT - MIN_HEIGHT) * audioLevel;
      } else if (isActive && audioLevel > 0) {
        // Demo mode with procedural animation
        const wave1 = Math.sin(time * 4 + i * 0.3) * 0.5 + 0.5;
        const wave2 = Math.sin(time * 6 + i * 0.5) * 0.3 + 0.3;
        const wave3 = Math.sin(time * 2 + i * 0.1) * 0.2 + 0.2;
        const combined = (wave1 + wave2 + wave3) / 3;
        targetHeight = MIN_HEIGHT + combined * (MAX_HEIGHT - MIN_HEIGHT) * audioLevel;
      } else {
        // Idle state - minimal animation
        const idle = Math.sin(time * 0.5 + i * 0.2) * 0.02 + MIN_HEIGHT;
        targetHeight = idle;
      }
      
      targetHeights.current[i] = targetHeight;
    }
    
    // Smooth interpolation of bar heights
    for (let i = 0; i < BAR_COUNT; i++) {
      barHeights.current[i] += (targetHeights.current[i] - barHeights.current[i]) * 0.15;
      
      const pos = barPositions[i];
      const height = barHeights.current[i] * size;
      
      dummyObject.position.set(pos.x, -size * 0.5 + height / 2, pos.z);
      dummyObject.scale.set(1, height / 0.1, 1);
      dummyObject.rotation.y = pos.angle;
      dummyObject.updateMatrix();
      
      instancedRef.current.setMatrixAt(i, dummyObject.matrix);
    }
    
    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={instancedRef}
      args={[undefined, undefined, BAR_COUNT]}
      frustumCulled={false}
    >
      <boxGeometry args={[0.04, 0.1, 0.02]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={intensity * (isActive ? 1.5 : 0.5)}
        metalness={0.8}
        roughness={0.2}
        transparent
        opacity={intensity * 0.9}
      />
    </instancedMesh>
  );
}

// ============================================================================
// GLOW RING COMPONENT
// ============================================================================

function GlowRing({
  size,
  color,
  intensity,
  isActive,
}: {
  size: number;
  color: string;
  intensity: number;
  isActive: boolean;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ringRef.current && ringRef.current.material instanceof THREE.MeshBasicMaterial) {
      const pulse = isActive
        ? 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.1
        : 0.1;
      ringRef.current.material.opacity = pulse * intensity;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -size * 0.5, 0]}>
      <ringGeometry args={[size * 1.2, size * 1.4, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.2}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================================
// WAVEFORM LINE (Secondary visual)
// ============================================================================

function WaveformLine({
  size,
  color,
  audioLevel,
  isActive,
  intensity,
}: {
  size: number;
  color: string;
  audioLevel: number;
  isActive: boolean;
  intensity: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.LineLoop | null>(null);
  const positionsRef = useRef<Float32Array>(new Float32Array(BAR_COUNT * 3));
  
  const ringRadius = size * 1.35;
  
  // Create line object once
  const lineObject = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positionsRef.current, 3));
    const mat = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: intensity * 0.6,
      blending: THREE.AdditiveBlending,
    });
    const line = new THREE.LineLoop(geo, mat);
    lineRef.current = line;
    return line;
  }, [color, intensity]);

  useFrame((state) => {
    if (!lineRef.current) return;
    
    const time = state.clock.elapsedTime;
    const positions = positionsRef.current;
    
    for (let i = 0; i < BAR_COUNT; i++) {
      const angle = (i / BAR_COUNT) * Math.PI * 2;
      
      // Calculate wave offset
      let waveOffset = 0;
      if (isActive && audioLevel > 0) {
        const wave = Math.sin(time * 4 + i * 0.4) * 0.1 * audioLevel;
        waveOffset = wave;
      }
      
      const radius = ringRadius + waveOffset * size;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -size * 0.5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    const geometry = lineRef.current.geometry as THREE.BufferGeometry;
    geometry.attributes.position.needsUpdate = true;
    
    // Update material properties
    const material = lineRef.current.material as THREE.LineBasicMaterial;
    material.opacity = intensity * 0.6;
  });

  return (
    <group ref={groupRef}>
      <primitive object={lineObject} />
    </group>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JarvisVoiceWaveform({
  size = 1,
  config,
  audioLevel = 0,
  audioData = null,
  isActive = false,
  intensity = 1,
}: JarvisVoiceWaveformProps) {
  const primaryColor = config.rings.primaryColor;
  const secondaryColor = config.rings.secondaryColor;
  
  return (
    <group>
      {/* Main waveform bars */}
      <WaveformRing
        size={size}
        color={primaryColor}
        audioLevel={audioLevel}
        audioData={audioData}
        isActive={isActive}
        intensity={intensity}
      />
      
      {/* Glow ring base */}
      <GlowRing
        size={size}
        color={secondaryColor}
        intensity={intensity}
        isActive={isActive}
      />
      
      {/* Outer waveform line */}
      <WaveformLine
        size={size}
        color={primaryColor}
        audioLevel={audioLevel}
        isActive={isActive}
        intensity={intensity}
      />
    </group>
  );
}

export default JarvisVoiceWaveform;

