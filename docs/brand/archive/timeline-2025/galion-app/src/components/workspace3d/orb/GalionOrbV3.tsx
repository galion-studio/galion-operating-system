'use client';

/**
 * GalionOrbV3.tsx - Main 3D Orb Component
 * 
 * The living AI presence for Galion V3 - a god-like orb with infinite depth.
 * Combines all visual layers:
 * - Inner Universe (stars, nebula)
 * - Neural Network (synapses, intelligence)
 * - Energy Streams (flowing particles)
 * - Shells (geometric structure)
 * - Glow (bloom effects)
 * - Particles (ambient sparkles)
 * - Glass Surface (fresnel reflections)
 * 
 * The orb reacts to state (idle, listening, speaking, thinking, task)
 * and emotion (11 overlays) with smooth transitions.
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// State and emotion systems
import { OrbState, getStateConfig, getTransition } from './orbV3States';
import { OrbEmotion, getEmotionConfig } from './orbV3Emotions';

// Visual components
import { OrbShells } from './OrbShells';
import { OrbGlow } from './OrbGlow';
import { OrbParticles } from './OrbParticles';
import { OrbInnerUniverse } from './OrbInnerUniverse';
import { OrbNeuralNetwork } from './OrbNeuralNetwork';
import { OrbEnergyStreams } from './OrbEnergyStreams';
import { OrbGlassSurface } from './OrbGlassSurface';

// ============================================================================
// TYPES
// ============================================================================

export interface GalionOrbV3Props {
  /** 3D position in scene */
  position?: [number, number, number];
  /** Base size of the orb */
  size?: number;
  /** Current behavioral state */
  state?: OrbState;
  /** Current emotion overlay */
  emotion?: OrbEmotion;
  /** Intensity multiplier (0-1) */
  intensity?: number;
  /** Audio level for speech visualization (0-1) */
  audioLevel?: number;
  /** Quality level (affects performance) */
  quality?: 'low' | 'medium' | 'high';
  /** Enable animations */
  animate?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Whether the orb is interactive */
  interactive?: boolean;
  /** Show debug helpers */
  debug?: boolean;
}

// ============================================================================
// QUALITY PRESETS
// ============================================================================

const QUALITY_SETTINGS = {
  low: {
    enableInnerUniverse: true,
    enableNeuralNetwork: true,
    enableEnergyStreams: true,
    enableGlassSurface: true,
    particleMultiplier: 0.3,
  },
  medium: {
    enableInnerUniverse: true,
    enableNeuralNetwork: true,
    enableEnergyStreams: true,
    enableGlassSurface: true,
    particleMultiplier: 0.6,
  },
  high: {
    enableInnerUniverse: true,
    enableNeuralNetwork: true,
    enableEnergyStreams: true,
    enableGlassSurface: true,
    particleMultiplier: 1.0,
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GalionOrbV3({
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
  debug = false,
}: GalionOrbV3Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [scale, setScale] = useState(1);
  
  // Get configurations
  const stateConfig = getStateConfig(state);
  const emotionConfig = getEmotionConfig(emotion);
  const qualitySettings = QUALITY_SETTINGS[quality];
  
  // Calculate effective intensity (state + emotion + base)
  const effectiveIntensity = useMemo(() => {
    return intensity * (0.5 + emotionConfig.energy * 0.5);
  }, [intensity, emotionConfig]);
  
  // Calculate scale based on state and audio
  useEffect(() => {
    const baseScale = stateConfig.scale.base;
    const audioScale = state === 'speaking' ? audioLevel * 0.03 : 0;
    const hoverScale = hovered && interactive ? 0.02 : 0;
    setScale(baseScale + audioScale + hoverScale);
  }, [state, audioLevel, hovered, interactive, stateConfig]);
  
  // Animation loop
  useFrame((frameState, delta) => {
    if (!groupRef.current || !animate) return;
    
    // Smooth scale interpolation
    const targetScale = scale;
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 5);
    groupRef.current.scale.setScalar(newScale);
    
    // Subtle idle rotation
    if (state === 'idle' || state === 'thinking') {
      groupRef.current.rotation.y += delta * 0.05 * emotionConfig.speedMultiplier;
    }
    
    // Breathing animation
    const breathe = Math.sin(frameState.clock.elapsedTime * stateConfig.pulse.duration) * stateConfig.pulse.intensity;
    groupRef.current.scale.multiplyScalar(1 + breathe);
  });
  
  // Pointer events
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
  
  const handleClick = (e: { stopPropagation?: () => void }) => {
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
      {/* ==================== DEPTH LAYERS (Inside → Outside) ==================== */}
      
      {/* Layer 1: Inner Universe - Stars and Nebula (Deepest) */}
      {qualitySettings.enableInnerUniverse && (
        <OrbInnerUniverse
          size={size}
          state={state}
          emotion={emotion}
          intensity={effectiveIntensity}
          quality={quality}
        />
      )}
      
      {/* Layer 2: Neural Network - Intelligence visualization */}
      {qualitySettings.enableNeuralNetwork && (
        <OrbNeuralNetwork
          size={size}
          state={state}
          emotion={emotion}
          intensity={effectiveIntensity}
          quality={quality}
        />
      )}
      
      {/* Layer 3: Energy Streams - Flowing particles */}
      {qualitySettings.enableEnergyStreams && (
        <OrbEnergyStreams
          size={size}
          state={state}
          emotion={emotion}
          intensity={effectiveIntensity}
          quality={quality}
        />
      )}
      
      {/* Layer 4: Geometric Shells - Physical structure */}
      <OrbShells
        size={size}
        state={state}
        emotion={emotion}
        intensity={effectiveIntensity}
        quality={quality}
        animate={animate}
      />
      
      {/* Layer 5: Glow Effects - Bloom and pulse */}
      <OrbGlow
        size={size}
        state={state}
        emotion={emotion}
        intensity={effectiveIntensity}
        quality={quality}
        pulsing={animate}
      />
      
      {/* Layer 6: Ambient Particles - Sparkles around orb */}
      <OrbParticles
        size={size}
        count={Math.floor(500 * qualitySettings.particleMultiplier)}
        state={state}
        emotion={emotion}
        intensity={effectiveIntensity}
        audioLevel={audioLevel}
        quality={quality}
      />
      
      {/* Layer 7: Glass Surface - Fresnel reflections (Outermost) */}
      {qualitySettings.enableGlassSurface && (
        <OrbGlassSurface
          size={size}
          state={state}
          emotion={emotion}
          intensity={effectiveIntensity}
          quality={quality}
          opacity={0.25}
        />
      )}
      
      {/* ==================== DEBUG HELPERS ==================== */}
      
      {debug && (
        <>
          {/* Bounding sphere */}
          <mesh>
            <sphereGeometry args={[size * 2.5, 16, 16]} />
            <meshBasicMaterial color="#ff0000" wireframe opacity={0.2} transparent />
          </mesh>
          
          {/* Axes helper */}
          <axesHelper args={[size * 2]} />
        </>
      )}
    </group>
  );
}

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

/**
 * Create orb props for specific scenarios
 */
export const OrbPresets = {
  /** Default idle state */
  idle: {
    state: 'idle' as OrbState,
    emotion: 'neutral' as OrbEmotion,
    intensity: 0.6,
  },
  
  /** Listening to user */
  listening: {
    state: 'listening' as OrbState,
    emotion: 'focused' as OrbEmotion,
    intensity: 0.8,
  },
  
  /** Speaking response */
  speaking: {
    state: 'speaking' as OrbState,
    emotion: 'warm' as OrbEmotion,
    intensity: 0.9,
  },
  
  /** Deep thinking */
  thinking: {
    state: 'thinking' as OrbState,
    emotion: 'thinking' as OrbEmotion,
    intensity: 0.7,
  },
  
  /** Executing task */
  task: {
    state: 'task' as OrbState,
    emotion: 'focused' as OrbEmotion,
    intensity: 0.8,
  },
  
  /** Happy response */
  happy: {
    state: 'speaking' as OrbState,
    emotion: 'happy' as OrbEmotion,
    intensity: 0.9,
  },
  
  /** Alert/warning */
  alert: {
    state: 'idle' as OrbState,
    emotion: 'alert' as OrbEmotion,
    intensity: 1.0,
  },
  
  /** Calm/supportive */
  calm: {
    state: 'idle' as OrbState,
    emotion: 'calm' as OrbEmotion,
    intensity: 0.5,
  },
  
  /** Excited/enthusiastic */
  excited: {
    state: 'speaking' as OrbState,
    emotion: 'excited' as OrbEmotion,
    intensity: 1.0,
  },
};

export default GalionOrbV3;

