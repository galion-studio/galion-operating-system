/**
 * GALION Orb V7.2 - Energy Rings Component
 *
 * Rotating energy rings around the orb:
 * - 3-5 concentric rings at different tilts
 * - Holographic material effect
 * - Smooth rotation with easing
 * - Audio reactive intensity
 */

'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbV7State, OrbV7Emotion, AudioData, getEmotionPalette } from '../types';

// ============================================================================
// SHADERS
// ============================================================================

const ringVertexShader = `
uniform float uTime;
uniform float uProgress;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ringFragmentShader = `
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uProgress;
uniform float uAudioLevel;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Calculate angle around ring for gradient
  float angle = atan(vPosition.x, vPosition.z);
  float normalizedAngle = (angle + 3.14159) / (2.0 * 3.14159);

  // Animated gradient that flows around the ring
  float flow = fract(normalizedAngle + uTime * 0.3);

  // Create segments/dashes
  float segments = 12.0;
  float segmentPos = fract(normalizedAngle * segments + uTime * 0.5);
  float dash = smoothstep(0.0, 0.1, segmentPos) * smoothstep(0.5, 0.4, segmentPos);

  // Pulse effect
  float pulse = sin(uTime * 3.0 + normalizedAngle * 6.0) * 0.3 + 0.7;

  // Energy flow effect
  float energy = smoothstep(0.3, 0.7, flow) * smoothstep(1.0, 0.7, flow);
  energy = mix(0.4, 1.0, energy);

  // Audio boost
  float audioBoost = 1.0 + uAudioLevel * 0.5;

  // Final color
  vec3 color = uColor * energy * pulse * audioBoost;

  // Add white hot spots
  color += vec3(1.0) * dash * 0.3 * uAudioLevel;

  // Alpha with dash pattern
  float alpha = (0.3 + dash * 0.7) * uOpacity * uProgress;

  gl_FragColor = vec4(color, alpha);
}
`;

// ============================================================================
// RING DATA
// ============================================================================

interface RingConfig {
  radius: number;
  tiltX: number;
  tiltY: number;
  tiltZ: number;
  speed: number;
  thickness: number;
}

const RING_CONFIGS: RingConfig[] = [
  { radius: 1.6, tiltX: 0.3, tiltY: 0, tiltZ: 0.2, speed: 0.3, thickness: 0.02 },
  { radius: 2.0, tiltX: -0.5, tiltY: 0.3, tiltZ: 0.1, speed: -0.2, thickness: 0.025 },
  { radius: 2.4, tiltX: 0.1, tiltY: -0.4, tiltZ: -0.3, speed: 0.25, thickness: 0.02 },
  { radius: 2.8, tiltX: 0.4, tiltY: 0.2, tiltZ: 0.4, speed: -0.15, thickness: 0.015 },
  { radius: 3.2, tiltX: -0.2, tiltY: 0.5, tiltZ: -0.2, speed: 0.2, thickness: 0.015 },
];

// ============================================================================
// SINGLE RING COMPONENT
// ============================================================================

interface EnergyRingProps {
  config: RingConfig;
  stateRef: React.MutableRefObject<OrbV7State>;
  emotionRef: React.MutableRefObject<OrbV7Emotion>;
  progressRef: React.MutableRefObject<number>;
  audioRef: React.MutableRefObject<AudioData>;
  index: number;
}

function EnergyRing({
  config,
  stateRef,
  emotionRef,
  progressRef,
  audioRef,
  index,
}: EnergyRingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const targetColor = useRef(new THREE.Color());

  // Create ring geometry
  const geometry = useMemo(() => {
    return new THREE.TorusGeometry(config.radius, config.thickness, 16, 128);
  }, [config.radius, config.thickness]);

  // Uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#6366F1') },
    uOpacity: { value: 0.6 },
    uProgress: { value: 0 },
    uAudioLevel: { value: 0 },
  }), []);

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    const time = state.clock.elapsedTime;
    const currentState = stateRef.current;
    const currentEmotion = emotionRef.current;
    const progress = progressRef.current;
    const audio = audioRef.current;

    // Get emotion palette
    const palette = getEmotionPalette(currentEmotion);

    // Update time
    materialRef.current.uniforms.uTime.value = time;

    // Smooth progress
    const currentProgress = materialRef.current.uniforms.uProgress.value;
    materialRef.current.uniforms.uProgress.value += (progress - currentProgress) * delta * 3;

    // Audio level
    const currentAudio = materialRef.current.uniforms.uAudioLevel.value;
    materialRef.current.uniforms.uAudioLevel.value += (audio.level - currentAudio) * delta * 8;

    // Update color (alternate between primary and accent)
    targetColor.current.set(index % 2 === 0 ? palette.primary : palette.accent);
    materialRef.current.uniforms.uColor.value.lerp(targetColor.current, delta * 2);

    // State-based opacity
    let targetOpacity = 0.6;

    switch (currentState) {
      case 'dormant':
        targetOpacity = 0.1;
        break;
      case 'awakening':
        targetOpacity = 0.3;
        break;
      case 'expanding':
        targetOpacity = 0.5;
        break;
      case 'pulsing':
        targetOpacity = 0.7 + Math.sin(time * 3 + index) * 0.2;
        break;
      case 'aware':
        targetOpacity = 0.6;
        break;
      case 'transcending':
        targetOpacity = 0.9;
        break;
    }

    materialRef.current.uniforms.uOpacity.value +=
      (targetOpacity - materialRef.current.uniforms.uOpacity.value) * delta * 4;

    // Rotation with audio influence
    const speedMultiplier = 1 + audio.level * 0.5;
    meshRef.current.rotation.x += config.speed * delta * speedMultiplier;
    meshRef.current.rotation.y += config.speed * 0.7 * delta * speedMultiplier;
    meshRef.current.rotation.z += config.speed * 0.3 * delta * speedMultiplier;
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
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[config.tiltX, config.tiltY, config.tiltZ]}
      renderOrder={8}
    >
      <shaderMaterial
        ref={materialRef}
        vertexShader={ringVertexShader}
        fragmentShader={ringFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface OrbEnergyRingsProps {
  stateRef: React.MutableRefObject<OrbV7State>;
  emotionRef: React.MutableRefObject<OrbV7Emotion>;
  progressRef: React.MutableRefObject<number>;
  audioRef: React.MutableRefObject<AudioData>;
  ringCount?: number;
}

export function OrbEnergyRings({
  stateRef,
  emotionRef,
  progressRef,
  audioRef,
  ringCount = 5,
}: OrbEnergyRingsProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Limit to available configs
  const rings = RING_CONFIGS.slice(0, Math.min(ringCount, RING_CONFIGS.length));

  // Slow overall rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {rings.map((config, index) => (
        <EnergyRing
          key={index}
          config={config}
          stateRef={stateRef}
          emotionRef={emotionRef}
          progressRef={progressRef}
          audioRef={audioRef}
          index={index}
        />
      ))}
    </group>
  );
}

export default OrbEnergyRings;
