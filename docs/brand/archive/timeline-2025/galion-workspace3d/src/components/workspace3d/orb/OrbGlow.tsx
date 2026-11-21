'use client';

/**
 * OrbGlow.tsx - Dynamic Glow and Bloom Effects
 * 
 * Creates the ethereal glow around the orb that makes it feel alive:
 * - Multi-layered glow spheres
 * - Pulsing intensity based on state
 * - Color shifts with emotion
 * - Fresnel-style edge glow
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbState, getStateConfig } from './orbV3States';
import { OrbEmotion, getEmotionConfig } from './orbV3Emotions';

// ============================================================================
// TYPES
// ============================================================================

export interface OrbGlowProps {
  /** Base size of the orb */
  size?: number;
  /** Current state */
  state?: OrbState;
  /** Current emotion */
  emotion?: OrbEmotion;
  /** Intensity multiplier (0-1) */
  intensity?: number;
  /** Quality level */
  quality?: 'low' | 'medium' | 'high';
  /** Enable pulsing animation */
  pulsing?: boolean;
}

// ============================================================================
// GLOW LAYER COMPONENT
// ============================================================================

interface GlowLayerProps {
  size: number;
  color: string;
  opacity: number;
  blur: number;
  pulseSpeed: number;
  pulseAmount: number;
  segments: number;
}

function GlowLayer({
  size,
  color,
  opacity,
  pulseSpeed,
  pulseAmount,
  segments,
}: GlowLayerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const baseOpacity = useRef(opacity);
  
  useFrame((state) => {
    if (meshRef.current && materialRef.current) {
      // Pulse scale
      const scalePulse = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed) * pulseAmount * 0.1;
      meshRef.current.scale.setScalar(scalePulse);
      
      // Pulse opacity
      const opacityPulse = baseOpacity.current + Math.sin(state.clock.elapsedTime * pulseSpeed) * pulseAmount * 0.05;
      materialRef.current.opacity = Math.max(0, Math.min(1, opacityPulse));
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, segments, segments]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={opacity}
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ============================================================================
// ENERGY PULSE RINGS
// ============================================================================

interface PulseRingProps {
  size: number;
  color: string;
  speed: number;
  maxScale: number;
  segments: number;
}

function PulseRing({ size, color, speed, maxScale, segments }: PulseRingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const progressRef = useRef(Math.random()); // Stagger start
  
  useFrame((_, delta) => {
    if (!meshRef.current || !materialRef.current) return;
    
    progressRef.current += delta * speed;
    if (progressRef.current > 1) progressRef.current = 0;
    
    const progress = progressRef.current;
    const scale = 1 + progress * (maxScale - 1);
    const opacity = (1 - progress) * 0.4;
    
    meshRef.current.scale.setScalar(scale);
    materialRef.current.opacity = opacity;
  });
  
  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[size * 0.95, size, segments]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ============================================================================
// AURORA EFFECT
// ============================================================================

interface AuroraProps {
  size: number;
  primaryColor: string;
  secondaryColor: string;
  intensity: number;
  speed: number;
}

function Aurora({ size, primaryColor, secondaryColor, intensity, speed }: AuroraProps) {
  const groupRef = useRef<THREE.Group>(null);
  const material1Ref = useRef<THREE.MeshBasicMaterial>(null);
  const material2Ref = useRef<THREE.MeshBasicMaterial>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002 * speed;
    }
    
    // Oscillating opacity for aurora effect
    if (material1Ref.current) {
      material1Ref.current.opacity = intensity * (0.05 + Math.sin(state.clock.elapsedTime * speed) * 0.02);
    }
    if (material2Ref.current) {
      material2Ref.current.opacity = intensity * (0.03 + Math.cos(state.clock.elapsedTime * speed * 0.7) * 0.015);
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Primary aurora layer */}
      <mesh rotation={[0.3, 0, 0]}>
        <torusGeometry args={[size * 1.8, size * 0.3, 8, 64]} />
        <meshBasicMaterial
          ref={material1Ref}
          color={primaryColor}
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Secondary aurora layer */}
      <mesh rotation={[-0.2, 0.5, 0]}>
        <torusGeometry args={[size * 2.0, size * 0.25, 8, 64]} />
        <meshBasicMaterial
          ref={material2Ref}
          color={secondaryColor}
          transparent
          opacity={0.03}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrbGlow({
  size = 2,
  state = 'idle',
  emotion = 'neutral',
  intensity = 0.5,
  quality = 'high',
  pulsing = true,
}: OrbGlowProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Get configurations
  const stateConfig = getStateConfig(state);
  const emotionConfig = getEmotionConfig(emotion);
  
  // Calculate derived values
  const glowIntensity = useMemo(() => {
    return stateConfig.glow.intensity * emotionConfig.glowIntensity * intensity;
  }, [stateConfig, emotionConfig, intensity]);
  
  const pulseSpeed = useMemo(() => {
    return stateConfig.glow.speed * emotionConfig.speedMultiplier;
  }, [stateConfig, emotionConfig]);
  
  const segments = useMemo(() => {
    switch (quality) {
      case 'low': return 16;
      case 'medium': return 24;
      case 'high': return 32;
      default: return 24;
    }
  }, [quality]);
  
  // Group subtle rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Layer 1: Innermost glow - tight around orb */}
      <GlowLayer
        size={size * 1.1}
        color={emotionConfig.secondary}
        opacity={glowIntensity * 0.3}
        blur={0}
        pulseSpeed={pulseSpeed * 2}
        pulseAmount={pulsing ? stateConfig.glow.variation : 0}
        segments={segments}
      />
      
      {/* Layer 2: Mid glow */}
      <GlowLayer
        size={size * 1.3}
        color={emotionConfig.primary}
        opacity={glowIntensity * 0.2}
        blur={0}
        pulseSpeed={pulseSpeed * 1.5}
        pulseAmount={pulsing ? stateConfig.glow.variation * 0.8 : 0}
        segments={segments}
      />
      
      {/* Layer 3: Outer glow */}
      {quality !== 'low' && (
        <GlowLayer
          size={size * 1.6}
          color={emotionConfig.accent}
          opacity={glowIntensity * 0.12}
          blur={0}
          pulseSpeed={pulseSpeed}
          pulseAmount={pulsing ? stateConfig.glow.variation * 0.6 : 0}
          segments={segments}
        />
      )}
      
      {/* Layer 4: Atmosphere glow */}
      {quality === 'high' && (
        <GlowLayer
          size={size * 2.0}
          color={emotionConfig.primary}
          opacity={glowIntensity * 0.06}
          blur={0}
          pulseSpeed={pulseSpeed * 0.5}
          pulseAmount={pulsing ? stateConfig.glow.variation * 0.4 : 0}
          segments={segments}
        />
      )}
      
      {/* Pulse rings - only when speaking or listening */}
      {(state === 'speaking' || state === 'listening') && (
        <>
          <PulseRing
            size={size}
            color={emotionConfig.secondary}
            speed={state === 'speaking' ? 2 : 1.5}
            maxScale={1.5}
            segments={quality === 'low' ? 32 : 64}
          />
          {quality !== 'low' && (
            <PulseRing
              size={size}
              color={emotionConfig.primary}
              speed={state === 'speaking' ? 1.5 : 1.2}
              maxScale={1.8}
              segments={64}
            />
          )}
        </>
      )}
      
      {/* Aurora effect - subtle color bands */}
      {quality === 'high' && (
        <Aurora
          size={size}
          primaryColor={emotionConfig.primary}
          secondaryColor={emotionConfig.accent}
          intensity={glowIntensity}
          speed={emotionConfig.speedMultiplier}
        />
      )}
      
      {/* Point lights for bloom effect */}
      <pointLight
        color={emotionConfig.secondary}
        intensity={glowIntensity * 2}
        distance={size * 8}
        decay={2}
      />
      
      <pointLight
        color={emotionConfig.primary}
        intensity={glowIntensity}
        distance={size * 12}
        decay={2}
      />
    </group>
  );
}

export default OrbGlow;

