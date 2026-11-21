/**
 * GALION Orb V7.2 - Particle Field Component
 *
 * Floating particles with orbital motion patterns:
 * - 500+ instanced particles for performance
 * - Orbital motion patterns
 * - Size variation by distance from center
 * - Emotion-based colors
 * - Audio reactive clustering/dispersion
 */

'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbV7State, OrbV7Emotion, AudioData, getEmotionPalette } from '../types';

// ============================================================================
// SHADERS
// ============================================================================

const particleVertexShader = `
uniform float uTime;
uniform float uSize;
uniform float uProgress;
uniform float uAudioLevel;

attribute float aSize;
attribute float aSpeed;
attribute float aOrbitRadius;
attribute float aOrbitPhase;
attribute float aOrbitTilt;

varying float vAlpha;
varying float vDistance;

void main() {
  // Orbital motion
  float angle = uTime * aSpeed + aOrbitPhase;
  float tiltedY = sin(angle) * aOrbitRadius * sin(aOrbitTilt);
  float x = cos(angle) * aOrbitRadius;
  float z = sin(angle) * aOrbitRadius * cos(aOrbitTilt);
  float y = tiltedY + position.y * 0.5;

  // Audio-reactive expansion
  float audioExpand = 1.0 + uAudioLevel * 0.5;

  vec3 orbitalPos = vec3(x, y, z) * audioExpand;

  // Add original position offset for variation
  orbitalPos += position * 0.3;

  vec4 mvPosition = modelViewMatrix * vec4(orbitalPos, 1.0);

  // Size based on distance
  vDistance = length(orbitalPos);
  float distanceScale = 1.0 / (1.0 + vDistance * 0.1);

  // Size attenuation
  float size = aSize * uSize * distanceScale * uProgress * (200.0 / -mvPosition.z);
  gl_PointSize = clamp(size, 1.0, 8.0);

  // Alpha based on distance and progress
  vAlpha = (1.0 - vDistance * 0.05) * uProgress;

  gl_Position = projectionMatrix * mvPosition;
}
`;

const particleFragmentShader = `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;

varying float vAlpha;
varying float vDistance;

void main() {
  // Circular particle with soft edge
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  if (dist > 0.5) discard;

  // Soft glow falloff
  float alpha = smoothstep(0.5, 0.1, dist);

  // Core glow
  float core = smoothstep(0.3, 0.0, dist);

  // Twinkle effect
  float twinkle = sin(uTime * 3.0 + vDistance * 10.0) * 0.2 + 0.8;

  vec3 color = uColor * twinkle;
  color += vec3(1.0) * core * 0.3; // White hot core

  gl_FragColor = vec4(color, alpha * vAlpha * uOpacity);
}
`;

// ============================================================================
// COMPONENT
// ============================================================================

export interface OrbParticleFieldProps {
  stateRef: React.MutableRefObject<OrbV7State>;
  emotionRef: React.MutableRefObject<OrbV7Emotion>;
  progressRef: React.MutableRefObject<number>;
  audioRef: React.MutableRefObject<AudioData>;
  count?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export function OrbParticleField({
  stateRef,
  emotionRef,
  progressRef,
  audioRef,
  count = 600,
  innerRadius = 1.5,
  outerRadius = 4.0,
}: OrbParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Reusable color
  const targetColor = useRef(new THREE.Color());

  // Generate particle attributes
  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const orbitRadii = new Float32Array(count);
    const orbitPhases = new Float32Array(count);
    const orbitTilts = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random spherical position (initial offset)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = innerRadius + Math.random() * (outerRadius - innerRadius);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Size variation (mostly small, some larger)
      sizes[i] = Math.pow(Math.random(), 2) * 1.5 + 0.3;

      // Orbital parameters
      speeds[i] = (Math.random() * 0.3 + 0.1) * (Math.random() > 0.5 ? 1 : -1);
      orbitRadii[i] = innerRadius + Math.random() * (outerRadius - innerRadius) * 0.8;
      orbitPhases[i] = Math.random() * Math.PI * 2;
      orbitTilts[i] = Math.random() * Math.PI;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aOrbitRadius', new THREE.BufferAttribute(orbitRadii, 1));
    geo.setAttribute('aOrbitPhase', new THREE.BufferAttribute(orbitPhases, 1));
    geo.setAttribute('aOrbitTilt', new THREE.BufferAttribute(orbitTilts, 1));

    const unis = {
      uTime: { value: 0 },
      uSize: { value: 30 },
      uColor: { value: new THREE.Color('#6366F1') },
      uOpacity: { value: 0.7 },
      uProgress: { value: 0 },
      uAudioLevel: { value: 0 },
    };

    return { geometry: geo, uniforms: unis };
  }, [count, innerRadius, outerRadius]);

  // Animation loop
  useFrame((state, delta) => {
    if (!materialRef.current || !pointsRef.current) return;

    const time = state.clock.elapsedTime;
    const currentState = stateRef.current;
    const currentEmotion = emotionRef.current;
    const progress = progressRef.current;
    const audio = audioRef.current;

    // Get emotion palette
    const palette = getEmotionPalette(currentEmotion);

    // Update uniforms
    materialRef.current.uniforms.uTime.value = time;

    // Smooth progress
    const currentProgress = materialRef.current.uniforms.uProgress.value;
    materialRef.current.uniforms.uProgress.value += (progress - currentProgress) * delta * 3;

    // Audio level
    const currentAudio = materialRef.current.uniforms.uAudioLevel.value;
    materialRef.current.uniforms.uAudioLevel.value += (audio.level - currentAudio) * delta * 8;

    // Update color
    targetColor.current.set(palette.accent);
    materialRef.current.uniforms.uColor.value.lerp(targetColor.current, delta * 2);

    // State-based parameters
    let targetSize = 30;
    let targetOpacity = 0.7;

    switch (currentState) {
      case 'dormant':
        targetSize = 15;
        targetOpacity = 0.3;
        break;
      case 'awakening':
        targetSize = 25;
        targetOpacity = 0.5;
        break;
      case 'expanding':
        targetSize = 35;
        targetOpacity = 0.7;
        break;
      case 'pulsing':
        targetSize = 40 + Math.sin(time * 4) * 10;
        targetOpacity = 0.8;
        break;
      case 'aware':
        targetSize = 35;
        targetOpacity = 0.75;
        break;
      case 'transcending':
        targetSize = 50;
        targetOpacity = 0.9;
        break;
    }

    // Smooth transitions
    materialRef.current.uniforms.uSize.value +=
      (targetSize - materialRef.current.uniforms.uSize.value) * delta * 4;
    materialRef.current.uniforms.uOpacity.value +=
      (targetOpacity - materialRef.current.uniforms.uOpacity.value) * delta * 4;

    // Slow overall rotation
    pointsRef.current.rotation.y += delta * 0.05;
  });

  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, [geometry]);

  return (
    <points ref={pointsRef} geometry={geometry} renderOrder={5}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default OrbParticleField;
