/**
 * GALION Orb V5.2 - Main Orchestrator Component (STABLE)
 *
 * FIXED: WebGL Context Leak by using stable component structure
 * - No Suspense boundaries that could cause remounts
 * - All props are stable (no new objects each render)
 * - Canvas is memoized to never remount
 */

"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, {
  Suspense,
  useEffect,
  useRef,
  memo,
  useMemo,
  useCallback,
} from "react";

// Types
import { GalionOrbV5Props, OrbState, QualityLevel, QualityConfig } from "./types";
import { Emotion } from "./types/emotion.types";

// Hooks
import { useOrbAnimation } from "./hooks/useOrbAnimation";
import { useOrbEmotion } from "./hooks/useOrbEmotion";
import { useOrbPerformance } from "./hooks/useOrbPerformance";
import { useOrbState } from "./hooks/useOrbState";

// Core Components
import { OrbCore } from "./core/OrbCore";
import { OrbGlow } from "./core/OrbGlow";
import { OrbNebula } from "./core/OrbNebula";
import { OrbSurface } from "./core/OrbSurface";

// Effect Components
import { OrbAurora } from "./effects/OrbAurora";
import { OrbEnergy } from "./effects/OrbEnergy";
import { OrbFlame } from "./effects/OrbFlame";
import { OrbNeural } from "./effects/OrbNeural";
import { OrbParticles } from "./effects/OrbParticles";
import { OrbShells } from "./effects/OrbShells";

// Background Components
import { OrbCosmicNebula } from "./background/OrbCosmicNebula";
import { OrbStarField } from "./background/OrbStarField";

import { useOrbAudio } from "./hooks/useOrbAudio";

// ============================================================================
// STABLE ORB SCENE - All state passed via refs to prevent re-renders
// ============================================================================

interface OrbSceneProps {
  stateRef: React.MutableRefObject<OrbState>;
  emotionRef: React.MutableRefObject<Emotion>;
  qualityConfigRef: React.MutableRefObject<QualityConfig | null>;
  animationProgressRef: React.MutableRefObject<number>;
  audioRef: React.MutableRefObject<any>;
  positionRef: React.MutableRefObject<[number, number, number]>;
  sizeRef: React.MutableRefObject<number>;
  blendedResultRef: React.MutableRefObject<any>;
  debug?: boolean;
}

// Inner scene - renders ONCE with initial values
// All dynamic updates happen via refs that children read in their useFrame
const OrbSceneInner = memo(function OrbSceneInner({
  stateRef,
  emotionRef,
  qualityConfigRef,
  animationProgressRef,
  audioRef,
  positionRef,
  sizeRef,
  blendedResultRef,
  debug = false,
}: OrbSceneProps) {
  console.log("[GalionOrbV5] OrbSceneInner MOUNTED");

  // Get initial values for static setup
  const initialPosition = positionRef.current;
  const initialSize = sizeRef.current;
  const staticState = stateRef.current;
  const staticEmotion = emotionRef.current;

  // Quality config - use defaults if not yet set
  const qc = qualityConfigRef.current || {
    showEnergy: true,
    showParticles: true,
    showNeural: true,
    showNeuralNetwork: true, // Fixed typo/alias
    shellCount: 3,
    energyStreamCount: 8,
    neuralNodeCount: 30,
  };

  return (
    <group position={initialPosition}>
      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.6} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#4488ff" />

      {/* Background: Cosmic Nebula */}
      <OrbCosmicNebula emotion={staticEmotion} emotionRef={emotionRef} radius={80} opacity={0.2} />

      {/* Background: Star Field */}
      <OrbStarField radius={60} starCount={500} />

      {/* Layer 1: Aurora (outermost) */}
      <OrbAurora
        state={staticState}
        stateRef={stateRef}
        emotion={staticEmotion}
        emotionRef={emotionRef}
        radius={initialSize * 4}
        opacity={0.3}
        animationProgressRef={animationProgressRef}
        audioRef={audioRef}
      />

      {/* Layer 2: Glow (outer halo) */}
      <OrbGlow state={staticState} emotion={staticEmotion} stateRef={stateRef} emotionRef={emotionRef} size={initialSize * 2.5} audioRef={audioRef} />

      {/* Layer 3: Flame aura */}
      <OrbFlame
        state={staticState}
        stateRef={stateRef}
        emotion={staticEmotion}
        emotionRef={emotionRef}
        radius={initialSize * 1.8}
        opacity={0.5}
        animationProgressRef={animationProgressRef}
        audioRef={audioRef}
      />

      {/* Layer 4: Energy streams */}
      {qc.showEnergy && (
        <OrbEnergy
          state={staticState}
          emotion={staticEmotion}
          stateRef={stateRef}
          emotionRef={emotionRef}
          radius={initialSize * 1.5}
          streamCount={qc.energyStreamCount}
          animationProgress={0}
          animationProgressRef={animationProgressRef}
          audioRef={audioRef}
        />
      )}

      {/* Layer 5: Particles */}
      {qc.showParticles && (
        <OrbParticles
          state={staticState}
          emotion={staticEmotion}
          stateRef={stateRef}
          emotionRef={emotionRef}
          blendedResultRef={blendedResultRef}
          count={200}
          radius={initialSize * 1.3}
          animationProgress={0}
          animationProgressRef={animationProgressRef}
          audioRef={audioRef}
        />
      )}

      {/* Layer 6: Shells (crystalline layers) */}
      <OrbShells
        state={staticState}
        emotion={staticEmotion}
        stateRef={stateRef}
        emotionRef={emotionRef}
        innerRadius={initialSize * 1.1}
        shellCount={qc.shellCount}
        animationProgress={0}
        animationProgressRef={animationProgressRef}
        audioRef={audioRef}
      />

      {/* Layer 7: Surface (main visible shell) */}
      <OrbSurface state={staticState} emotion={staticEmotion} stateRef={stateRef} emotionRef={emotionRef} size={initialSize} opacity={0.08} audioRef={audioRef} />

      {/* Layer 8: Neural network */}
      {(qc.showNeural) && (
        <OrbNeural
          state={staticState}
          stateRef={stateRef}
          emotion={staticEmotion}
          emotionRef={emotionRef}
          nodeCount={Math.min(qc.neuralNodeCount, 100)}
          radius={initialSize * 0.8}
          animationProgress={0}
          animationProgressRef={animationProgressRef}
          audioRef={audioRef}
        />
      )}

      {/* Layer 9: Nebula (innermost consciousness clouds) */}
      <OrbNebula
        emotionRef={emotionRef}
        blendedResultRef={blendedResultRef}
        size={initialSize * 0.6}
        layers={3}
        animationProgressRef={animationProgressRef}
        audioRef={audioRef}
      />

      {/* Layer 10: Core (plasma center) */}
      <OrbCore
        state={staticState}
        emotion={staticEmotion}
        stateRef={stateRef}
        emotionRef={emotionRef}
        size={initialSize * 0.5}
        quality={qc as QualityConfig}
        animationProgress={0}
        animationProgressRef={animationProgressRef}
        audioRef={audioRef}
        debug={debug}
      />

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        dampingFactor={0.1}
        enableDamping={true}
        autoRotate={false}
        target={[0, 0, 0]}
        makeDefault
      />
    </group>
  );
});

// ============================================================================
// STABLE CANVAS - Memoized to NEVER remount
// ============================================================================

interface StableCanvasProps {
  children: React.ReactNode;
}

const StableCanvas = memo(function StableCanvas({ children }: StableCanvasProps) {
  console.log("[GalionOrbV5] StableCanvas RENDER - this should happen only ONCE");

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 14], fov: 40 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
      }}
      frameloop="always"
      onCreated={({ gl }) => {
        gl.setClearColor("#050510", 1);
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        console.log("[GalionOrbV5] WebGL context CREATED - this should happen only ONCE");
      }}
      style={{ background: "#050510" }}
    >
      {children}
    </Canvas>
  );
}, () => true); // NEVER re-render

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function GalionOrbV5Inner({
  initialEmotion = "neutral",
  emotion: controlledEmotion,
  initialState = "idle",
  state: controlledState,
  quality = "medium",
  audioEnabled = false,
  audioSource,
  audioLevel: externalAudioLevel,
  onStateChange,
  onEmotionChange,
  onClick,
  position = [0, 0, 0],
  size = 1.0,
  className = "",
  style,
  children,
  debug = false,
}: GalionOrbV5Props) {
  // Refs for passing state to child components without re-renders
  const stateRef = useRef<OrbState>(initialState);
  const emotionRef = useRef<Emotion>(initialEmotion as Emotion);
  const qualityConfigRef = useRef<QualityConfig | null>(null);
  const animationProgressRef = useRef<number>(0);
  const positionRef = useRef<[number, number, number]>(position);
  const sizeRef = useRef<number>(size);
  const blendedResultRef = useRef<any>(null);

  // State management hooks
  const { state, stateConfig, setState } = useOrbState({
    initialState,
    onStateChange,
  });

  const { emotion, setEmotion, getBlendedResult } = useOrbEmotion({
    initialEmotion: initialEmotion as Emotion,
    onEmotionChange,
  });

  const { progress: animationProgress } = useOrbAnimation({
    defaultAnimation: stateConfig.animation,
  });

  const { qualityConfig } = useOrbPerformance({
    initialQuality: quality,
    targetFPS: 60,
    adaptive: false,
  });

  // Voice handlers
  const handleSpeechStart = React.useCallback(() => {
    setState("listening");
  }, [setState]);

  const handleSpeechEnd = React.useCallback(() => {
    setState("processing");
    // Short processing delay before returning to idle
    setTimeout(() => setState("idle"), 1500);
  }, [setState]);

  const { audioDataRef } = useOrbAudio({
    enableVAD: true,
    enableBeatDetection: true,
    source: audioSource || null,
    onSpeechStart: handleSpeechStart,
    onSpeechEnd: handleSpeechEnd,
  });

  // Sync controlled props
  useEffect(() => {
    if (controlledEmotion) setEmotion(controlledEmotion as Emotion);
  }, [controlledEmotion, setEmotion]);

  useEffect(() => {
    if (controlledState) setState(controlledState);
  }, [controlledState, setState]);

  // Update refs (no re-renders caused)
  useEffect(() => {
    stateRef.current = (controlledState || state) as OrbState;
    emotionRef.current = (controlledEmotion || emotion) as Emotion;
    qualityConfigRef.current = qualityConfig;
    animationProgressRef.current = animationProgress;
    positionRef.current = position;
    sizeRef.current = size;
    blendedResultRef.current = getBlendedResult();

    if (debug) {
      console.log("[GalionOrbV5] Emotion Updated:", emotionRef.current);
      console.log("[GalionOrbV5] State Updated:", stateRef.current);
    }
  });

  // Memoize the scene to prevent re-renders
  const orbScene = useMemo(() => (
    <OrbSceneInner
      stateRef={stateRef}
      emotionRef={emotionRef}
      qualityConfigRef={qualityConfigRef}
      animationProgressRef={animationProgressRef}
      audioRef={audioDataRef}
      positionRef={positionRef}
      sizeRef={sizeRef}
      blendedResultRef={blendedResultRef}
      debug={debug}
    />
  ), []); // Empty deps - refs never change identity

  return (
    <div className={`relative w-full h-full ${className}`} style={style}>
      <StableCanvas>
        <Suspense fallback={null}>
          {orbScene}
        </Suspense>
      </StableCanvas>

      {children}
    </div>
  );
}

// Export memoized
export const GalionOrbV5 = memo(GalionOrbV5Inner);

// Export types
export interface GalionOrbV5Controls {
  setState: (state: OrbState) => void;
  setEmotion: (emotion: Emotion, intensity?: number) => void;
  addEmotionOverlay: (emotion: Emotion, intensity: number) => void;
  removeEmotionOverlay: (emotion: Emotion) => void;
  clearOverlays: () => void;
  playAnimation: (animationId: string) => void;
  stopAnimation: () => void;
  setQuality: (quality: QualityLevel) => void;
}
