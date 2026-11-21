/**
 * GALION Orb V6 - Glow Component
 *
 * Outer glow/halo effect surrounding the core.
 * Creates the bloom/atmospheric effect.
 */

'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbColors } from './types';

// =============================================================================
// SHADERS
// =============================================================================

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColorGlow;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uAudioLevel;

  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Fresnel for glow falloff (inverted - brighter at edges)
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 1.5);

    // Pulsing animation
    float pulse = sin(uTime * 0.8) * 0.15 + 0.85;

    // Audio reactivity
    float audioBoost = 1.0 + uAudioLevel * 0.5;

    // Calculate alpha - fade from edge to center
    float alpha = fresnel * uIntensity * pulse * audioBoost;
    alpha = clamp(alpha, 0.0, 0.6);

    // Color with slight variation
    vec3 color = uColorGlow * (1.0 + uAudioLevel * 0.3);

    gl_FragColor = vec4(color, alpha);
  }
`;

// =============================================================================
// COMPONENT
// =============================================================================

interface OrbGlowProps {
  colors: OrbColors;
  intensity: number;
  audioLevel: number;
  size?: number;
}

export function OrbGlow({ colors, intensity, audioLevel, size = 2.5 }: OrbGlowProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Create uniforms once
  const uniforms = useMemo(() => ({
    uColorGlow: { value: new THREE.Color(colors.glow) },
    uIntensity: { value: intensity },
    uTime: { value: 0 },
    uAudioLevel: { value: audioLevel },
  }), []);

  // Animation loop
  useFrame((state, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    // Update time
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    // Smooth color transition
    materialRef.current.uniforms.uColorGlow.value.lerp(
      new THREE.Color(colors.glow),
      delta * 3
    );

    // Smooth intensity transition
    materialRef.current.uniforms.uIntensity.value +=
      (intensity - materialRef.current.uniforms.uIntensity.value) * delta * 3;

    // Smooth audio level transition
    materialRef.current.uniforms.uAudioLevel.value +=
      (audioLevel - materialRef.current.uniforms.uAudioLevel.value) * delta * 8;

    // Gentle breathing scale
    const breathe = Math.sin(state.clock.elapsedTime * 0.4) * 0.05 + 1;
    meshRef.current.scale.setScalar(size * breathe);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default OrbGlow;
