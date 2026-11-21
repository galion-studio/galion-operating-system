/**
 * GALION Orb V6 - Main Orchestrator Component
 *
 * The complete 3D orb experience combining:
 * - Core plasma sphere
 * - Outer glow halo
 * - Neural network
 * - Floating particles
 * - Energy streams
 * - Aurora effect
 * - Star field background
 *
 * Designed for Galion.app - the AI voice platform.
 * "Your only limit is your imagination."
 */

'use client';

import { Suspense, useMemo, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Types and config
import {
  GalionOrbV6Props,
  OrbEmotion,
  OrbState,
  QualityLevel,
} from './types';
import {
  getEmotionConfig,
  getStateConfig,
  getQualityConfig,
  getColors,
} from './config';

// Components
import { OrbCore } from './OrbCore';
import { OrbGlow } from './OrbGlow';
import { OrbNeural } from './OrbNeural';
import { OrbParticles } from './OrbParticles';
import { OrbEnergy } from './OrbEnergy';
import { OrbAurora } from './OrbAurora';
import { OrbStarField } from './OrbStarField';

// =============================================================================
// ORB SCENE - The 3D content
// =============================================================================

interface OrbSceneProps {
  emotion: OrbEmotion;
  state: OrbState;
  audioLevel: number;
  quality: QualityLevel;
  size: number;
  debug: boolean;
}

const OrbScene = memo(function OrbScene({
  emotion,
  state,
  audioLevel,
  quality,
  size,
  debug,
}: OrbSceneProps) {
  // Get configurations
  const emotionConfig = useMemo(() => getEmotionConfig(emotion), [emotion]);
  const stateConfig = useMemo(() => getStateConfig(state), [state]);
  const qualityConfig = useMemo(() => getQualityConfig(quality), [quality]);
  const colors = useMemo(() => getColors(emotion), [emotion]);

  // Calculate derived values
  const effectiveSize = size * stateConfig.scaleMultiplier;
  const glowIntensity = emotionConfig.glowIntensity * (1 + audioLevel * 0.3);
  const particleSpeed = emotionConfig.particleSpeed * (1 + audioLevel * 0.5);
  const neuralActivity = stateConfig.particleActivity * (1 + audioLevel * 0.4);

  if (debug) {
    console.log('[GalionOrbV6] Rendering with:', {
      emotion,
      state,
      audioLevel,
      quality,
    });
  }

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-10, -5, -10]} intensity={0.3} color={colors.primary} />

      {/* Background: Star Field */}
      {qualityConfig.enableStars && (
        <OrbStarField
          colors={colors}
          starCount={qualityConfig.starCount}
          radius={40}
          opacity={0.7}
        />
      )}

      {/* Layer 1: Aurora (outermost atmospheric effect) */}
      {qualityConfig.enableAurora && (
        <OrbAurora
          colors={colors}
          radius={effectiveSize * 2.5}
          height={effectiveSize * 4}
          opacity={0.35}
          audioLevel={audioLevel}
        />
      )}

      {/* Layer 2: Outer Glow/Halo */}
      <OrbGlow
        colors={colors}
        intensity={glowIntensity}
        audioLevel={audioLevel}
        size={effectiveSize * 2.2}
      />

      {/* Layer 3: Energy Streams */}
      {qualityConfig.enableEnergy && (
        <OrbEnergy
          colors={colors}
          streamCount={12}
          innerRadius={effectiveSize * 1.0}
          outerRadius={effectiveSize * 1.6}
          audioLevel={audioLevel}
          intensity={emotionConfig.energy}
        />
      )}

      {/* Layer 4: Floating Particles */}
      {qualityConfig.enableParticles && (
        <OrbParticles
          colors={colors}
          count={qualityConfig.particleCount}
          innerRadius={effectiveSize * 1.1}
          outerRadius={effectiveSize * 1.8}
          speed={particleSpeed}
          audioLevel={audioLevel}
        />
      )}

      {/* Layer 5: Neural Network */}
      {qualityConfig.enableNeural && (
        <OrbNeural
          colors={colors}
          nodeCount={qualityConfig.neuralNodes}
          maxConnections={qualityConfig.neuralConnections}
          radius={effectiveSize * 0.9}
          audioLevel={audioLevel}
          activity={neuralActivity}
        />
      )}

      {/* Layer 6: Core Sphere (innermost) */}
      <OrbCore
        colors={colors}
        energy={emotionConfig.energy}
        audioLevel={audioLevel}
        size={effectiveSize * 0.8}
      />

      {/* Camera Controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={4}
        maxDistance={20}
        dampingFactor={0.1}
        enableDamping={true}
        autoRotate={false}
        target={[0, 0, 0]}
        makeDefault
      />
    </>
  );
});

// =============================================================================
// LOADING FALLBACK
// =============================================================================

function OrbLoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshBasicMaterial color="#06b6d4" transparent opacity={0.5} />
    </mesh>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function GalionOrbV6Inner({
  emotion = 'neutral',
  state = 'idle',
  audioLevel = 0,
  quality = 'medium',
  size = 1.0,
  onClick,
  className = '',
  style,
  debug = false,
}: GalionOrbV6Props) {
  // Canvas GL settings
  const glSettings = useMemo(() => ({
    antialias: quality === 'ultra' || quality === 'high',
    alpha: true,
    powerPreference: 'high-performance' as const,
    stencil: false,
    depth: true,
  }), [quality]);

  // DPR based on quality
  const dpr = useMemo(() => {
    switch (quality) {
      case 'low': return [1, 1] as [number, number];
      case 'medium': return [1, 1.5] as [number, number];
      case 'high': return [1, 2] as [number, number];
      case 'ultra': return [1.5, 2] as [number, number];
      default: return [1, 1.5] as [number, number];
    }
  }, [quality]);

  return (
    <div
      className={`relative w-full h-full ${className}`}
      style={style}
      onClick={onClick}
    >
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={glSettings}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          if (debug) {
            console.log('[GalionOrbV6] Canvas created');
          }
        }}
      >
        <Suspense fallback={<OrbLoadingFallback />}>
          <OrbScene
            emotion={emotion}
            state={state}
            audioLevel={audioLevel}
            quality={quality}
            size={size}
            debug={debug}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Export memoized component
export const GalionOrbV6 = memo(GalionOrbV6Inner);

export default GalionOrbV6;
