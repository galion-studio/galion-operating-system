'use client';

/**
 * GalionOrbAdvanced.tsx - Next-Generation Orb Visualization
 * 
 * The ultimate evolution of the Galion orb - replacing chunky geometry
 * with sophisticated shader-based rendering, GPU particles, and cinematic
 * post-processing.
 * 
 * Features:
 * - Advanced shader material with organic surface distortion
 * - GPU-accelerated particle systems (5000+ particles)
 * - Layered visual depth (inner universe, energy streams, glass surface)
 * - Emotional color palettes and smooth transitions
 * - Audio-reactive animations
 * - Performance-optimized with quality presets
 * - 22nd-century Apple design aesthetic
 */

import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Sphere, MeshTransmissionMaterial } from '@react-three/drei';

// State and emotion systems
import { OrbState, getStateConfig } from './orbV3States';
import { OrbEmotion, getEmotionConfig } from './orbV3Emotions';

// Advanced rendering components
import { OrbShaderMaterial } from './shaders/OrbShaderMaterial';
import { AdvancedParticleSystem } from './effects/AdvancedParticleSystem';

// ============================================================================
// TYPES
// ============================================================================

export interface GalionOrbAdvancedProps {
  /** 3D position */
  position?: [number, number, number];
  /** Base size */
  size?: number;
  /** Current behavioral state */
  state?: OrbState;
  /** Current emotion */
  emotion?: OrbEmotion;
  /** Intensity (0-1) */
  intensity?: number;
  /** Audio level (0-1) */
  audioLevel?: number;
  /** Quality preset */
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  /** Enable animations */
  animate?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Interactive */
  interactive?: boolean;
}

// ============================================================================
// EMOTION COLOR PALETTES
// ============================================================================

const EMOTION_COLORS = {
  neutral: {
    primary: '#4a90e2',
    secondary: '#357abd',
    accent: '#06b6d4',
  },
  calm: {
    primary: '#7dd3fc',
    secondary: '#38bdf8',
    accent: '#0ea5e9',
  },
  warm: {
    primary: '#fbbf24',
    secondary: '#f59e0b',
    accent: '#fb923c',
  },
  focused: {
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#6366f1',
  },
  alert: {
    primary: '#ef4444',
    secondary: '#dc2626',
    accent: '#f97316',
  },
  happy: {
    primary: '#fbbf24',
    secondary: '#84cc16',
    accent: '#22c55e',
  },
  sad: {
    primary: '#475569',
    secondary: '#334155',
    accent: '#64748b',
  },
  angry: {
    primary: '#dc2626',
    secondary: '#991b1b',
    accent: '#ea580c',
  },
  excited: {
    primary: '#ec4899',
    secondary: '#a855f7',
    accent: '#eab308',
  },
  thinking: {
    primary: '#6366f1',
    secondary: '#4f46e5',
    accent: '#8b5cf6',
  },
  curious: {
    primary: '#06b6d4',
    secondary: '#0891b2',
    accent: '#14b8a6',
  },
};

// ============================================================================
// QUALITY SETTINGS
// ============================================================================

const QUALITY_SETTINGS = {
  low: {
    particleCount: 1000,
    enableGlassSurface: false,
    enableInnerParticles: false,
    shaderQuality: 'low',
  },
  medium: {
    particleCount: 2500,
    enableGlassSurface: true,
    enableInnerParticles: true,
    shaderQuality: 'medium',
  },
  high: {
    particleCount: 5000,
    enableGlassSurface: true,
    enableInnerParticles: true,
    shaderQuality: 'high',
  },
  ultra: {
    particleCount: 8000,
    enableGlassSurface: true,
    enableInnerParticles: true,
    shaderQuality: 'ultra',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GalionOrbAdvanced({
  position = [0, 0, 0],
  size = 2,
  state = 'idle',
  emotion = 'neutral',
  intensity = 0.7,
  audioLevel = 0,
  quality = 'high',
  animate = true,
  onClick,
  interactive = true,
}: GalionOrbAdvancedProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);
  
  const { camera } = useThree();
  
  const stateConfig = getStateConfig(state);
  const emotionConfig = getEmotionConfig(emotion);
  const qualitySettings = QUALITY_SETTINGS[quality];
  const colors = EMOTION_COLORS[emotion];
  
  // Calculate effective intensity
  const effectiveIntensity = useMemo(() => {
    return intensity * (0.5 + emotionConfig.energy * 0.5);
  }, [intensity, emotionConfig]);
  
  // Color objects
  const color1 = useMemo(() => new THREE.Color(colors.primary), [colors.primary]);
  const color2 = useMemo(() => new THREE.Color(colors.secondary), [colors.secondary]);
  const color3 = useMemo(() => new THREE.Color(colors.accent), [colors.accent]);
  
  // Animation loop
  useFrame((frameState, delta) => {
    if (!groupRef.current || !animate) return;
    
    // Scale animation
    const baseScale = stateConfig.scale.base;
    const audioScale = state === 'speaking' ? audioLevel * 0.05 : 0;
    const hoverScale = hovered && interactive ? 0.03 : 0;
    const breathe = Math.sin(frameState.clock.elapsedTime * stateConfig.pulse.duration) * stateConfig.pulse.intensity * 0.02;
    
    const targetScale = baseScale + audioScale + hoverScale + breathe;
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 5);
    groupRef.current.scale.setScalar(newScale);
    
    // Rotation
    if (state === 'idle' || state === 'thinking') {
      groupRef.current.rotation.y += delta * 0.1 * emotionConfig.speedMultiplier;
    }
    
    if (state === 'thinking') {
      groupRef.current.rotation.x = Math.sin(frameState.clock.elapsedTime * 0.5) * 0.1;
      groupRef.current.rotation.z = Math.cos(frameState.clock.elapsedTime * 0.3) * 0.05;
    }
    
    // Update shader material
    if (materialRef.current) {
      materialRef.current.uTime = frameState.clock.elapsedTime;
      materialRef.current.uIntensity = effectiveIntensity;
      materialRef.current.uAudioLevel = audioLevel;
      materialRef.current.uColor1 = color1;
      materialRef.current.uColor2 = color2;
      materialRef.current.uColor3 = color3;
      materialRef.current.uCameraPosition = camera.position;
    }
  });
  
  // Event handlers
  const handlePointerOver = () => {
    if (interactive) {
      setHovered(true);
      document.body.style.cursor = 'pointer';
    }
  };
  
  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };
  
  const handleClick = (e: any) => {
    e.stopPropagation?.();
    onClick?.();
  };
  
  return (
    <group
      ref={groupRef}
      position={position}
      onClick={interactive ? handleClick : undefined}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* ==================== INNER LAYERS ==================== */}
      
      {/* Inner Universe Particles */}
      {qualitySettings.enableInnerParticles && (
        <AdvancedParticleSystem
          count={Math.floor(qualitySettings.particleCount * 0.3)}
          emitterRadius={size * 0.5}
          particleSize={0.02}
          speed={0.5}
          color1={colors.primary}
          color2={colors.secondary}
          color3={colors.accent}
          audioLevel={audioLevel}
          intensity={effectiveIntensity * 0.6}
          type="sparkle"
        />
      )}
      
      {/* ==================== CORE ORB WITH SHADER ==================== */}
      
      <mesh ref={coreRef}>
        <sphereGeometry args={[size, 128, 128]} />
        <orbShaderMaterial
          ref={materialRef}
          uTime={0}
          uIntensity={effectiveIntensity}
          uAudioLevel={audioLevel}
          uColor1={color1}
          uColor2={color2}
          uColor3={color3}
          uCameraPosition={camera.position}
          uFresnelPower={3.0}
          uGlowIntensity={1.5 * emotionConfig.energy}
        />
      </mesh>
      
      {/* ==================== ENERGY STREAMS ==================== */}
      
      <AdvancedParticleSystem
        count={Math.floor(qualitySettings.particleCount * 0.4)}
        emitterRadius={size * 0.8}
        particleSize={0.03}
        speed={emotionConfig.speedMultiplier}
        color1={colors.primary}
        color2={colors.secondary}
        color3={colors.accent}
        audioLevel={audioLevel}
        intensity={effectiveIntensity}
        type="energy"
      />
      
      {/* ==================== OUTER TRAILS ==================== */}
      
      <AdvancedParticleSystem
        count={Math.floor(qualitySettings.particleCount * 0.3)}
        emitterRadius={size * 1.2}
        particleSize={0.04}
        speed={emotionConfig.speedMultiplier * 0.8}
        color1={colors.accent}
        color2={colors.primary}
        color3={colors.secondary}
        audioLevel={audioLevel}
        intensity={effectiveIntensity * 0.7}
        type="trail"
      />
      
      {/* ==================== GLASS SURFACE (OUTER LAYER) ==================== */}
      
      {qualitySettings.enableGlassSurface && (
        <Sphere args={[size * 1.15, 64, 64]}>
          <MeshTransmissionMaterial
            color={colors.primary}
            thickness={0.5}
            roughness={0.1}
            transmission={0.95}
            ior={1.5}
            chromaticAberration={0.3}
            backside={false}
            transparent
            opacity={0.3}
          />
        </Sphere>
      )}
    </group>
  );
}

// ============================================================================
// PRESETS
// ============================================================================

export const OrbAdvancedPresets = {
  idle: {
    state: 'idle' as OrbState,
    emotion: 'neutral' as OrbEmotion,
    intensity: 0.6,
  },
  listening: {
    state: 'listening' as OrbState,
    emotion: 'focused' as OrbEmotion,
    intensity: 0.8,
  },
  speaking: {
    state: 'speaking' as OrbState,
    emotion: 'warm' as OrbEmotion,
    intensity: 0.9,
  },
  thinking: {
    state: 'thinking' as OrbState,
    emotion: 'thinking' as OrbEmotion,
    intensity: 0.7,
  },
  excited: {
    state: 'speaking' as OrbState,
    emotion: 'excited' as OrbEmotion,
    intensity: 1.0,
  },
};

export default GalionOrbAdvanced;
