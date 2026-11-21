/**
 * GALION Orb V5.2 - Shell Components
 * 
 * Crystal geometric shells that rotate around the orb core
 * - Icosahedron (20 faces) - primary shell
 * - Octahedron (8 faces) - secondary shell  
 * - Dodecahedron (12 faces) - tertiary shell
 */

'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbState } from '../types';
import { Emotion } from '../types/emotion.types';
import { getEmotionConfig } from '../config/emotions';
import { getStateConfig } from '../config/states';

// ============================================================================
// SHELL SHADER
// ============================================================================

const shellVertexShader = `
  uniform float uTime;
  uniform float uPulse;
  uniform float uScale;
  uniform float uRotationSpeed;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vEdgeFactor;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    // Calculate edge factor for wireframe-like effect
    vec3 absNormal = abs(normal);
    vEdgeFactor = max(max(absNormal.x, absNormal.y), absNormal.z);
    
    // Pulse vertices outward
    float pulse = 1.0 + sin(uTime * 2.0) * uPulse * 0.05;
    vec3 pos = position * uScale * pulse;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const shellFragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uGlow;
  uniform float uEdgeWidth;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vEdgeFactor;
  
  void main() {
    // Fresnel effect
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
    
    // Edge detection for crystal facets
    float edge = smoothstep(0.8 - uEdgeWidth, 0.8, vEdgeFactor);
    
    // Combine color with edge glow
    vec3 baseColor = uColor;
    vec3 glowColor = uColor * (1.5 + sin(uTime * 3.0) * 0.3);
    
    vec3 finalColor = mix(baseColor * 0.3, glowColor, edge * fresnel);
    
    // Add outer glow
    finalColor += uColor * fresnel * uGlow * 0.5;
    
    // Pulsing transparency
    float alpha = uOpacity * (0.3 + fresnel * 0.7) * (1.0 + sin(uTime * 2.0) * 0.1);
    
    gl_FragColor = vec4(finalColor, alpha * (0.2 + edge * 0.8));
  }
`;

// ============================================================================
// TYPES
// ============================================================================

interface OrbShellsProps {
  state: OrbState;
  emotion: Emotion;
  stateRef?: React.MutableRefObject<OrbState>;
  emotionRef?: React.MutableRefObject<Emotion>;
  innerRadius?: number;
  shellCount?: number;
  opacity?: number;
  /** Animation progress (0-1) */
  animationProgress?: number;
  /** Animation progress ref */
  animationProgressRef?: React.MutableRefObject<number>;
  /** Audio data ref */
  audioRef?: React.MutableRefObject<any>;
}

interface ShellConfig {
  geometry: 'icosahedron' | 'octahedron' | 'dodecahedron';
  scale: number;
  rotationSpeed: { x: number; y: number; z: number };
  detail: number;
  rotationOffset: number;
}

const SHELL_CONFIGS: ShellConfig[] = [
  {
    geometry: 'icosahedron',
    scale: 1.0,
    rotationSpeed: { x: 0.1, y: 0.2, z: 0.1 },
    detail: 0,
    rotationOffset: 0,
  },
  {
    geometry: 'octahedron',
    scale: 1.25,
    rotationSpeed: { x: -0.15, y: -0.1, z: 0.05 },
    detail: 0,
    rotationOffset: Math.PI / 4,
  },
  {
    geometry: 'dodecahedron',
    scale: 1.5,
    rotationSpeed: { x: 0.05, y: -0.1, z: -0.15 },
    detail: 0,
    rotationOffset: Math.PI / 2,
  },
];

interface SingleShellProps {
  config: ShellConfig;
  isAccent: boolean;
  emotion: Emotion;
  emotionRef?: React.MutableRefObject<Emotion>;
  state: OrbState;
  stateRef?: React.MutableRefObject<OrbState>;
  baseOpacity: number;
  innerRadius: number;
  animationProgress: number;
  animationProgressRef?: React.MutableRefObject<number>;
  audioRef?: React.MutableRefObject<any>;
}

function SingleShell({
  config,
  isAccent,
  emotion,
  emotionRef,
  state,
  stateRef,
  baseOpacity,
  innerRadius,
  animationProgress,
  animationProgressRef,
  audioRef
}: SingleShellProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Initial colors
  const initialEmotionConfig = getEmotionConfig(emotion);
  const initialColor = new THREE.Color(isAccent ? initialEmotionConfig.colors.accent : initialEmotionConfig.colors.primary);

  // Create geometry based on type
  const geometry = useMemo(() => {
    const radius = innerRadius * config.scale;
    switch (config.geometry) {
      case 'icosahedron':
        return new THREE.IcosahedronGeometry(radius, config.detail);
      case 'octahedron':
        return new THREE.OctahedronGeometry(radius, config.detail);
      case 'dodecahedron':
        return new THREE.DodecahedronGeometry(radius, config.detail);
      default:
        return new THREE.IcosahedronGeometry(radius, config.detail);
    }
  }, [config.geometry, config.detail, config.scale, innerRadius]);

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: initialColor },
        uOpacity: { value: baseOpacity },
        uPulse: { value: 0.5 },
        uScale: { value: 1.0 },
        uRotationSpeed: { value: 1.0 },
        uGlow: { value: 0.5 },
        uEdgeWidth: { value: 0.1 },
      },
      vertexShader: shellVertexShader,
      fragmentShader: shellFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [initialColor.getHexString(), baseOpacity]);

  // Animation
  useFrame((_, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    // Get current audio level from ref
    const currentAudioLevel = audioRef?.current?.analysis?.level || 0;

    // Get dynamic state
    const currentState = stateRef?.current || state;
    const currentStateConfig = getStateConfig(currentState);
    const dynamicMultiplier = currentStateConfig.visual.neuralActivity + 0.2;

    // Get animation progress
    const currentProgress = animationProgressRef?.current ?? animationProgress;

    // Resolve current emotion color
    const currentEmotion = emotionRef?.current || emotion;
    const currentEmotionConfig = getEmotionConfig(currentEmotion);
    const targetColor = new THREE.Color(isAccent ? currentEmotionConfig.colors.accent : currentEmotionConfig.colors.primary);

    // Update time
    materialRef.current.uniforms.uTime.value += delta;

    // Update color
    materialRef.current.uniforms.uColor.value.lerp(targetColor, delta * 2);

    // Rotate based on state activity, animation progress, and audio
    const animationSpeedBoost = 1 + Math.sin(currentProgress * Math.PI * 4) * 0.3;
    const audioSpeedBoost = 1 + currentAudioLevel * 1.5;
    const speedMult = dynamicMultiplier * animationSpeedBoost * audioSpeedBoost;
    meshRef.current.rotation.x += config.rotationSpeed.x * speedMult * delta;
    meshRef.current.rotation.y += config.rotationSpeed.y * speedMult * delta;
    meshRef.current.rotation.z += config.rotationSpeed.z * speedMult * delta;

    // Update pulse based on state, animation, and audio
    const basePulse = dynamicMultiplier * 0.8;
    const animationPulse = Math.sin(currentProgress * Math.PI * 6) * 0.4 + 1;
    const audioPulse = 1 + currentAudioLevel * 0.8;
    const targetPulse = basePulse * animationPulse * audioPulse;
    materialRef.current.uniforms.uPulse.value += (targetPulse - materialRef.current.uniforms.uPulse.value) * delta * 2;

    // Update glow based on animation and audio
    const baseGlow = 0.5;
    const animationGlow = 1 + Math.sin(currentProgress * Math.PI * 2) * 0.3;
    const audioGlow = 1 + currentAudioLevel * 0.6;
    const targetGlow = baseGlow * animationGlow * audioGlow;
    materialRef.current.uniforms.uGlow.value += (targetGlow - materialRef.current.uniforms.uGlow.value) * delta * 2;

    // Update scale based on audio
    const targetScale = 1 + currentAudioLevel * 0.1;
    materialRef.current.uniforms.uScale.value += (targetScale - materialRef.current.uniforms.uScale.value) * delta * 3;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[config.rotationOffset, config.rotationOffset * 0.5, 0]}
    >
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrbShells({
  state,
  emotion,
  stateRef,
  emotionRef,
  innerRadius = 1.0,
  shellCount = 3,
  opacity = 0.4,
  animationProgress = 0,
  animationProgressRef,
  audioRef,
}: OrbShellsProps) {
  // Render shells
  const shellsToRender = SHELL_CONFIGS.slice(0, Math.min(shellCount, 3));

  return (
    <group>
      {shellsToRender.map((config, index) => {
        // Alternate between primary and accent colors
        const isAccent = index % 2 !== 0;
        // Reduce opacity for outer shells
        const shellOpacity = opacity * (1 - index * 0.15);

        return (
          <SingleShell
            key={config.geometry}
            config={config}
            isAccent={isAccent}
            emotion={emotion}
            emotionRef={emotionRef}
            state={state}
            stateRef={stateRef}
            baseOpacity={shellOpacity}
            innerRadius={innerRadius}
            animationProgress={animationProgress}
            animationProgressRef={animationProgressRef}
            audioRef={audioRef}
          />
        );
      })}
    </group>
  );
}

export default OrbShells;
