/**
 * GALION Orb V7.2 Enhanced - Main Orchestrator Component
 *
 * EPIC awakening consciousness orb for the galion-app boot sequence.
 * Inspired by Awwwards AI orb aesthetics but uniquely Galion.
 *
 * This is the ENHANCED version using modular components:
 * - OrbPlasmaCore - Central consciousness with noise displacement
 * - OrbGlassSurface - Ethereal iridescent shell
 * - OrbParticleField - 600+ orbital particles with boid behavior
 * - OrbEnergyRings - 5 rotating holographic rings
 * - OrbLightningTendrils - 12 dynamic energy connections
 * - CosmicBackground - 1500+ stars with nebula
 *
 * Features:
 * - High DPR Canvas (2x) for crisp rendering
 * - All layers properly ordered for depth
 * - Emotion and state management via refs (no re-renders)
 * - Audio reactivity integration
 * - Touch/mouse interaction support
 * - Organic breathing animation
 *
 * @version 7.2.1
 */

'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import React, {
  Suspense,
  useRef,
  useEffect,
  memo,
  useMemo,
  useCallback,
} from 'react';
import * as THREE from 'three';

// Types
import {
  OrbV7State,
  OrbV7Emotion,
  AudioData,
  getEmotionPalette,
} from './types';

// Core Components
import { OrbPlasmaCore } from './core/OrbPlasmaCore';
import { OrbGlassSurface } from './core/OrbGlassSurface';

// Effect Components
import { OrbParticleField } from './effects/OrbParticleField';
import { OrbEnergyRings } from './effects/OrbEnergyRings';
import { OrbLightningTendrils } from './effects/OrbLightningTendrils';

// Background Components
import { CosmicBackground } from './background/CosmicBackground';

// ============================================================================
// TYPES
// ============================================================================

export interface GalionOrbV7EnhancedProps {
  /** Current awakening state */
  state?: OrbV7State;
  /** Current emotion */
  emotion?: OrbV7Emotion;
  /** Awakening progress (0-1) */
  progress?: number;
  /** Enable audio reactivity */
  audioEnabled?: boolean;
  /** External audio level (0-1) */
  audioLevel?: number;
  /** Called when orb becomes aware */
  onAwakened?: () => void;
  /** Called on touch/click */
  onInteract?: () => void;
  /** Base size multiplier */
  size?: number;
  /** Custom class name */
  className?: string;
  /** Debug mode */
  debug?: boolean;
}

// ============================================================================
// CAMERA CONTROLLER (subtle zoom on awakening)
// ============================================================================

interface CameraControllerProps {
  progressRef: React.MutableRefObject<number>;
}

function CameraController({ progressRef }: CameraControllerProps) {
  const { camera } = useThree();
  const initialZ = useRef(camera.position.z);

  useEffect(() => {
    initialZ.current = camera.position.z;
  }, [camera]);

  // Subtle camera push on progress
  React.useEffect(() => {
    const animate = () => {
      const progress = progressRef.current;
      const targetZ = 12 - progress * 2; // Zoom in slightly as orb awakens
      camera.position.z += (targetZ - camera.position.z) * 0.02;
    };

    const interval = setInterval(animate, 16);
    return () => clearInterval(interval);
  }, [camera, progressRef]);

  return null;
}

// ============================================================================
// ORB SCENE (renders once, updates via refs)
// ============================================================================

interface OrbSceneProps {
  stateRef: React.MutableRefObject<OrbV7State>;
  emotionRef: React.MutableRefObject<OrbV7Emotion>;
  progressRef: React.MutableRefObject<number>;
  audioRef: React.MutableRefObject<AudioData>;
  size: number;
  onInteract?: () => void;
}

const OrbSceneInner = memo(function OrbSceneInner({
  stateRef,
  emotionRef,
  progressRef,
  audioRef,
  size,
  onInteract,
}: OrbSceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Handle click/touch
  const handlePointerDown = useCallback(() => {
    onInteract?.();
  }, [onInteract]);

  return (
    <group ref={groupRef} onPointerDown={handlePointerDown}>
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#4488ff" />
      <pointLight position={[0, 0, 5]} intensity={0.2} color="#8B5CF6" />

      {/* Background: Cosmic stars and nebula */}
      <CosmicBackground
        stateRef={stateRef}
        emotionRef={emotionRef}
        progressRef={progressRef}
        audioRef={audioRef}
        starCount={1500}
        nebulaRadius={100}
      />

      {/* Layer 6: Particle Field (outermost) */}
      <OrbParticleField
        stateRef={stateRef}
        emotionRef={emotionRef}
        progressRef={progressRef}
        audioRef={audioRef}
        count={600}
        innerRadius={1.8}
        outerRadius={4.5}
      />

      {/* Layer 5: Energy Rings */}
      <OrbEnergyRings
        stateRef={stateRef}
        emotionRef={emotionRef}
        progressRef={progressRef}
        audioRef={audioRef}
        ringCount={5}
      />

      {/* Layer 4: Lightning Tendrils */}
      <OrbLightningTendrils
        stateRef={stateRef}
        emotionRef={emotionRef}
        progressRef={progressRef}
        audioRef={audioRef}
        tendrilCount={12}
        innerRadius={1.0}
      />

      {/* Layer 2: Glass Surface */}
      <OrbGlassSurface
        stateRef={stateRef}
        emotionRef={emotionRef}
        progressRef={progressRef}
        audioRef={audioRef}
        size={size * 1.15}
      />

      {/* Layer 1: Plasma Core (innermost) */}
      <OrbPlasmaCore
        stateRef={stateRef}
        emotionRef={emotionRef}
        progressRef={progressRef}
        audioRef={audioRef}
        size={size}
      />

      {/* Camera controller */}
      <CameraController progressRef={progressRef} />

      {/* Controls - very limited for boot sequence */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableRotate={true}
        rotateSpeed={0.3}
        dampingFactor={0.1}
        enableDamping={true}
        autoRotate={false}
        target={[0, 0, 0]}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.7}
      />
    </group>
  );
});

// ============================================================================
// STABLE CANVAS (memoized to prevent remounts)
// ============================================================================

interface StableCanvasProps {
  children: React.ReactNode;
}

const StableCanvas = memo(function StableCanvas({ children }: StableCanvasProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 12], fov: 45 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
      }}
      frameloop="always"
      onCreated={({ gl }) => {
        gl.setClearColor('#050510', 1);
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.2;
      }}
      style={{ background: 'transparent' }}
    >
      {children}
    </Canvas>
  );
}, () => true); // Never re-render

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function GalionOrbV7EnhancedInner({
  state: controlledState = 'dormant',
  emotion: controlledEmotion = 'neutral',
  progress: controlledProgress = 0,
  audioEnabled = false,
  audioLevel = 0,
  onAwakened,
  onInteract,
  size = 1.0,
  className = '',
  debug = false,
}: GalionOrbV7EnhancedProps) {
  // Refs for passing state to child components without re-renders
  const stateRef = useRef<OrbV7State>(controlledState);
  const emotionRef = useRef<OrbV7Emotion>(controlledEmotion);
  const progressRef = useRef<number>(controlledProgress);
  const audioRef = useRef<AudioData>({
    level: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    isSpeaking: false,
  });

  // Track if awakened callback was fired
  const awakenedFired = useRef(false);

  // Update refs when controlled props change (no re-renders)
  useEffect(() => {
    stateRef.current = controlledState;
    emotionRef.current = controlledEmotion;
    progressRef.current = controlledProgress;

    // Audio data
    audioRef.current.level = audioLevel;

    // Fire awakened callback when reaching aware state
    if (
      (controlledState === 'aware' || controlledState === 'transcending') &&
      !awakenedFired.current
    ) {
      awakenedFired.current = true;
      onAwakened?.();
    }

    if (debug) {
      console.log('[GalionOrbV7Enhanced] State:', controlledState);
      console.log('[GalionOrbV7Enhanced] Emotion:', controlledEmotion);
      console.log('[GalionOrbV7Enhanced] Progress:', controlledProgress);
    }
  }, [controlledState, controlledEmotion, controlledProgress, audioLevel, onAwakened, debug]);

  // Memoize scene to prevent re-renders
  const orbScene = useMemo(() => (
    <OrbSceneInner
      stateRef={stateRef}
      emotionRef={emotionRef}
      progressRef={progressRef}
      audioRef={audioRef}
      size={size}
      onInteract={onInteract}
    />
  ), [size, onInteract]); // Only re-create if size or handlers change

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Deep space gradient background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 45%, #0f1729 0%, #050510 70%),
            radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.03) 0%, transparent 50%)
          `,
        }}
      />

      <StableCanvas>
        <Suspense fallback={null}>
          {orbScene}
        </Suspense>
      </StableCanvas>

      {/* Debug overlay */}
      {debug && (
        <div className="absolute top-4 left-4 text-white/50 text-xs font-mono z-50">
          <div>State: {controlledState}</div>
          <div>Emotion: {controlledEmotion}</div>
          <div>Progress: {(controlledProgress * 100).toFixed(0)}%</div>
          <div>Audio: {(audioLevel * 100).toFixed(0)}%</div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export const GalionOrbV7Enhanced = memo(GalionOrbV7EnhancedInner);

// Re-export types
export type {
  OrbV7State,
  OrbV7Emotion,
  AudioData,
};

export default GalionOrbV7Enhanced;
