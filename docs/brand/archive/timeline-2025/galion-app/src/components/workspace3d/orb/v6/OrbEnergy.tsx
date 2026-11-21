/**
 * GALION Orb V6 - Energy Streams Component
 *
 * Dynamic energy streams/rays emanating from the orb core.
 * Creates a powerful, active appearance.
 */

'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbColors } from './types';

// =============================================================================
// SEEDED RANDOM - Deterministic for SSR/hydration consistency
// =============================================================================

function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// =============================================================================
// SHADERS
// =============================================================================

const vertexShader = `
  attribute float aPhase;
  attribute float aLength;

  uniform float uTime;
  uniform float uAudioLevel;

  varying float vAlpha;
  varying float vPhase;

  void main() {
    vPhase = aPhase;

    // Position along the stream
    vec3 pos = position;

    // Wave motion
    float wave = sin(uTime * 2.0 + aPhase * 3.0) * 0.1;
    pos.x += wave * normal.y;
    pos.y += wave * normal.x;

    // Audio reactivity - extend streams
    float audioExtend = 1.0 + uAudioLevel * 0.5;
    pos *= audioExtend;

    // Alpha based on distance from center
    float dist = length(pos);
    vAlpha = smoothstep(2.0, 0.8, dist);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;

  varying float vAlpha;
  varying float vPhase;

  void main() {
    // Pulsing intensity
    float pulse = sin(uTime * 3.0 + vPhase * 2.0) * 0.3 + 0.7;

    // Final alpha
    float alpha = vAlpha * uIntensity * pulse * 0.4;

    gl_FragColor = vec4(uColor, alpha);
  }
`;

// =============================================================================
// COMPONENT
// =============================================================================

interface OrbEnergyProps {
  colors: OrbColors;
  streamCount?: number;
  innerRadius?: number;
  outerRadius?: number;
  audioLevel: number;
  intensity: number;
}

export function OrbEnergy({
  colors,
  streamCount = 12,
  innerRadius = 1.0,
  outerRadius = 1.8,
  audioLevel,
  intensity,
}: OrbEnergyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [isClient, setIsClient] = useState(false);

  // Set client flag after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Create stream geometry with seeded random
  const { geometry, phases } = useMemo(() => {
    const seededRandom = createSeededRandom(789); // Fixed seed for consistency
    const positions: number[] = [];
    const normals: number[] = [];
    const phaseArray: number[] = [];
    const indices: number[] = [];

    const segmentsPerStream = 20;

    for (let s = 0; s < streamCount; s++) {
      // Random direction using seeded random
      const theta = (s / streamCount) * Math.PI * 2 + seededRandom() * 0.3;
      const phi = Math.acos(2 * seededRandom() - 1);

      const dirX = Math.sin(phi) * Math.cos(theta);
      const dirY = Math.sin(phi) * Math.sin(theta);
      const dirZ = Math.cos(phi);

      const phase = seededRandom() * Math.PI * 2;
      const baseIdx = s * (segmentsPerStream + 1);

      // Create points along the stream
      for (let i = 0; i <= segmentsPerStream; i++) {
        const t = i / segmentsPerStream;
        const r = innerRadius + t * (outerRadius - innerRadius);

        // Position
        positions.push(dirX * r, dirY * r, dirZ * r);

        // Normal (perpendicular to direction)
        normals.push(-dirY, dirX, 0);

        // Phase
        phaseArray.push(phase);
      }

      // Create line indices
      for (let i = 0; i < segmentsPerStream; i++) {
        indices.push(baseIdx + i, baseIdx + i + 1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(phaseArray, 1));
    geo.setIndex(indices);

    return { geometry: geo, phases: phaseArray };
  }, [streamCount, innerRadius, outerRadius]);

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(colors.glow) },
        uIntensity: { value: intensity },
        uTime: { value: 0 },
        uAudioLevel: { value: audioLevel },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  // Animation loop
  useFrame((state, delta) => {
    if (!groupRef.current || !materialRef.current) return;

    const time = state.clock.elapsedTime;

    // Update uniforms
    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uAudioLevel.value +=
      (audioLevel - materialRef.current.uniforms.uAudioLevel.value) * delta * 8;
    materialRef.current.uniforms.uIntensity.value +=
      (intensity - materialRef.current.uniforms.uIntensity.value) * delta * 3;

    // Smooth color transition
    materialRef.current.uniforms.uColor.value.lerp(
      new THREE.Color(colors.glow),
      delta * 3
    );

    // Rotate streams
    groupRef.current.rotation.y += delta * 0.1;
    groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
  });

  // Don't render on server
  if (!isClient) return null;

  return (
    <group ref={groupRef}>
      <lineSegments geometry={geometry}>
        <primitive object={material} ref={materialRef} attach="material" />
      </lineSegments>
    </group>
  );
}

export default OrbEnergy;
