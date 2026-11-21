/**
 * GALION Orb V7.2 - Glass Surface Component
 *
 * Outer transparent glass shell with:
 * - Refractive surface effect
 * - Subtle iridescence/rainbow reflection
 * - Fresnel edge glow
 * - Ethereal transparency
 */

'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbV7State, OrbV7Emotion, AudioData, getEmotionPalette } from '../types';

// ============================================================================
// SHADERS
// ============================================================================

const glassVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const glassFragmentShader = `
uniform float uTime;
uniform float uFresnelPower;
uniform float uIridescence;
uniform float uOpacity;
uniform vec3 uGlowColor;
uniform float uProgress;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

// Simple iridescent color based on view angle
vec3 iridescence(float angle, float intensity) {
  float hue = angle * 0.5 + uTime * 0.1;

  // HSV to RGB conversion
  vec3 c = vec3(hue, 0.5, 1.0);
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  vec3 rgb = c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);

  return rgb * intensity;
}

void main() {
  // View direction
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  // Fresnel effect - stronger at edges
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), uFresnelPower);

  // Base glass color (very subtle)
  vec3 baseColor = vec3(0.9, 0.95, 1.0) * 0.1;

  // Iridescent reflection
  float iriAngle = dot(vNormal, vec3(0.0, 1.0, 0.0)) + dot(vNormal, viewDir);
  vec3 iriColor = iridescence(iriAngle, uIridescence);

  // Rim glow
  vec3 rimGlow = uGlowColor * fresnel * 0.8;

  // Combine colors
  vec3 finalColor = baseColor + iriColor * fresnel + rimGlow;

  // Subtle shimmer
  float shimmer = sin(vUv.x * 30.0 + uTime * 2.0) * sin(vUv.y * 30.0 - uTime * 1.5) * 0.02;
  finalColor += vec3(shimmer) * fresnel;

  // Alpha: mostly transparent except at edges
  float alpha = fresnel * uOpacity * uProgress;

  // Add slight center visibility for depth perception
  float centerAlpha = (1.0 - fresnel) * 0.02 * uProgress;
  alpha += centerAlpha;

  gl_FragColor = vec4(finalColor, alpha);
}
`;

// ============================================================================
// COMPONENT
// ============================================================================

export interface OrbGlassSurfaceProps {
  stateRef: React.MutableRefObject<OrbV7State>;
  emotionRef: React.MutableRefObject<OrbV7Emotion>;
  progressRef: React.MutableRefObject<number>;
  audioRef: React.MutableRefObject<AudioData>;
  size?: number;
}

export function OrbGlassSurface({
  stateRef,
  emotionRef,
  progressRef,
  audioRef,
  size = 1.2,
}: OrbGlassSurfaceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Reusable color object
  const targetGlowColor = useRef(new THREE.Color());

  // Create uniforms once
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uFresnelPower: { value: 2.5 },
    uIridescence: { value: 0.3 },
    uOpacity: { value: 0.4 },
    uGlowColor: { value: new THREE.Color('#6366F1') },
    uProgress: { value: 0 },
  }), []);

  // Animation loop
  useFrame((state, delta) => {
    if (!materialRef.current || !meshRef.current) return;

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

    // Update glow color
    targetGlowColor.current.set(palette.glow);
    materialRef.current.uniforms.uGlowColor.value.lerp(targetGlowColor.current, delta * 2);

    // State-based parameters
    let targetIridescence = 0.3;
    let targetFresnelPower = 2.5;
    let targetOpacity = 0.4;

    switch (currentState) {
      case 'dormant':
        targetIridescence = 0.1;
        targetFresnelPower = 3.5;
        targetOpacity = 0.2;
        break;
      case 'awakening':
        targetIridescence = 0.4;
        targetFresnelPower = 2.5;
        targetOpacity = 0.4;
        break;
      case 'expanding':
        targetIridescence = 0.5;
        targetFresnelPower = 2.0;
        targetOpacity = 0.5;
        break;
      case 'pulsing':
        targetIridescence = 0.6 + Math.sin(time * 4) * 0.2;
        targetFresnelPower = 2.0;
        targetOpacity = 0.5;
        break;
      case 'aware':
        targetIridescence = 0.5;
        targetFresnelPower = 2.2;
        targetOpacity = 0.45;
        break;
      case 'transcending':
        targetIridescence = 0.8;
        targetFresnelPower = 1.5;
        targetOpacity = 0.6;
        break;
    }

    // Audio reactivity
    if (audio.level > 0.05) {
      targetIridescence += audio.level * 0.3;
      targetOpacity += audio.level * 0.1;
    }

    // Smooth transitions
    materialRef.current.uniforms.uIridescence.value +=
      (targetIridescence - materialRef.current.uniforms.uIridescence.value) * delta * 4;
    materialRef.current.uniforms.uFresnelPower.value +=
      (targetFresnelPower - materialRef.current.uniforms.uFresnelPower.value) * delta * 4;
    materialRef.current.uniforms.uOpacity.value +=
      (targetOpacity - materialRef.current.uniforms.uOpacity.value) * delta * 4;

    // Subtle rotation for shimmer
    meshRef.current.rotation.y += delta * 0.1;
    meshRef.current.rotation.x += delta * 0.05;

    // Scale with progress
    const scaleProgress = 0.3 + progress * 0.7;
    meshRef.current.scale.setScalar(size * scaleProgress);
  });

  // Cleanup
  useEffect(() => {
    return () => {
      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, []);

  return (
    <mesh ref={meshRef} renderOrder={15}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={glassVertexShader}
        fragmentShader={glassFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

export default OrbGlassSurface;
