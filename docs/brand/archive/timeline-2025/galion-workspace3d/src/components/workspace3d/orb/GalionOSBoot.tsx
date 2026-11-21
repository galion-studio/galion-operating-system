'use client';

/**
 * GalionOSBoot.tsx - Enhanced Organic Boot Animation Sequence
 * 
 * A cinematic startup that blends:
 * - Big Bang (cosmic creation)
 * - Mystical/Magical (wonder, aurora colors)
 * - Awakening/Birth (organic emergence)
 * - Power On (energy surge)
 * 
 * Timeline (5.5 seconds total):
 * 0-0.8s:    VOID - Pure black, single distant star twinkles
 * 0.8-1.5s:  COSMIC SPARK - Star bursts into expanding ring (Big Bang)
 * 1.5-2.5s:  NEBULA BIRTH - Colorful gas clouds swirl inward (Mystical)
 * 2.5-3.3s:  CORE IGNITION - Center glows hot, particles rush in (Power On)
 * 3.3-4.2s:  FIRST BREATH - Orb materializes from within (Birth)
 * 4.2-5.0s:  AWAKENING - Orb pulses once, glow stabilizes
 * 5.0-5.5s:  READY - Gentle idle animation, UI fades in
 * 
 * Key principles:
 * - No sharp mechanical transitions
 * - Everything breathes and flows
 * - Light comes from within
 * - Golden ratio spiral movements
 * - Aurora-like color gradients
 * - Each phase emerges from the previous
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { GalionOrbV3 } from './GalionOrbV3';
import { LightDoor3D } from '@/components/effects/LightDoor3D';

// ============================================================================
// TYPES
// ============================================================================

export interface GalionOSBootProps {
  /** Callback when boot sequence completes */
  onComplete?: () => void;
  /** Skip the boot sequence */
  skip?: boolean;
  /** Mobile optimized (shorter) */
  mobile?: boolean;
  /** Custom duration multiplier */
  speedMultiplier?: number;
  /** Quality level */
  quality?: 'low' | 'medium' | 'high';
}

export type BootPhase = 
  | 'void'            // 0-0.8s - Anticipation
  | 'cosmicSpark'     // 0.8-1.5s - Creation (Big Bang)
  | 'nebulaBirth'     // 1.5-2.5s - Wonder (Mystical)
  | 'coreIgnition'    // 2.5-3.3s - Energy (Power On)
  | 'firstBreath'     // 3.3-4.2s - Life (Birth)
  | 'awakening'       // 4.2-5.0s - Presence
  | 'ready'           // 5.0-5.5s - Calm power
  | 'complete';

// ============================================================================
// BOOT PHASES TIMING - Organic flow
// ============================================================================

const DESKTOP_PHASES: Record<BootPhase, { start: number; end: number }> = {
  void: { start: 0, end: 0.8 },
  cosmicSpark: { start: 0.8, end: 1.5 },
  nebulaBirth: { start: 1.5, end: 2.5 },
  coreIgnition: { start: 2.5, end: 3.3 },
  firstBreath: { start: 3.3, end: 4.2 },
  awakening: { start: 4.2, end: 5.0 },
  ready: { start: 5.0, end: 5.5 },
  complete: { start: 5.5, end: 5.5 },
};

const MOBILE_PHASES: Record<BootPhase, { start: number; end: number }> = {
  void: { start: 0, end: 0.4 },
  cosmicSpark: { start: 0.4, end: 0.7 },
  nebulaBirth: { start: 0.7, end: 1.2 },
  coreIgnition: { start: 1.2, end: 1.6 },
  firstBreath: { start: 1.6, end: 2.0 },
  awakening: { start: 2.0, end: 2.4 },
  ready: { start: 2.4, end: 2.7 },
  complete: { start: 2.7, end: 2.7 },
};

// ============================================================================
// POETIC LOADING TEXTS - Organic awakening feel
// ============================================================================

const LOADING_TEXTS = [
  "From the void...",
  "A spark ignites...",
  "Consciousness forms...",
  "Breathing life...",
  "Awakening...",
  "Ready to dream with you...",
];

// ============================================================================
// SMOOTHSTEP - For organic transitions
// ============================================================================

function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// ============================================================================
// DISTANT STAR - Twinkling star in the void
// ============================================================================

function DistantStar({ phase, progress }: { phase: BootPhase; progress: number }) {
  const starRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Only visible during void phase
  const visible = phase === 'void' || (phase === 'cosmicSpark' && progress < 0.3);
  
  useFrame((state) => {
    if (!starRef.current || !visible) return;
    
    const t = state.clock.elapsedTime;
    
    // Organic twinkling (multiple frequencies for natural feel)
    const twinkle = 0.3 + 
      0.3 * Math.sin(t * 2.3) * 
      0.5 * (1 + Math.sin(t * 3.7)) *
      0.7 * (1 + Math.sin(t * 1.1));
    
    starRef.current.scale.setScalar(0.02 + twinkle * 0.03);
    
    if (glowRef.current) {
      glowRef.current.scale.setScalar(0.1 + twinkle * 0.15);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = twinkle * 0.5;
    }
  });
  
  if (!visible) return null;
  
  return (
    <group position={[0, 0, 0]}>
      <mesh ref={starRef}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshBasicMaterial color="#a5b4fc" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ============================================================================
// COSMIC SPARK - Expanding ring of light (Big Bang moment)
// ============================================================================

function CosmicSpark({ phase, progress }: { phase: BootPhase; progress: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  const visible = phase === 'cosmicSpark' || (phase === 'nebulaBirth' && progress < 0.3);
  
  // Generate spark particles
  const particlePositions = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const radius = 0.1;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
    }
    return positions;
  }, []);
  
  useFrame((state) => {
    if (!ringRef.current || !visible) return;
    
    const t = state.clock.elapsedTime;
    const smoothProgress = smootherstep(progress);
    
    // Ring expands with smooth acceleration
    const ringScale = smoothProgress * 3;
    ringRef.current.scale.set(ringScale, ringScale, 1);
    
    // Fade out as it expands
    const opacity = 1 - smoothProgress * 0.7;
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    
    // Ring rotation
    ringRef.current.rotation.z = t * 0.5;
    
    // Particles expand outward
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < positions.count; i++) {
        const theta = (i / positions.count) * Math.PI * 2;
        const radius = 0.1 + smoothProgress * 2.5;
        const wobble = Math.sin(t * 3 + i * 0.1) * 0.1;
        positions.setXYZ(
          i,
          Math.cos(theta + t * 0.3) * (radius + wobble),
          (Math.sin(t * 2 + i) * 0.1) * smoothProgress,
          Math.sin(theta + t * 0.3) * (radius + wobble)
        );
      }
      positions.needsUpdate = true;
      
      (particlesRef.current.material as THREE.PointsMaterial).opacity = opacity * 0.8;
    }
  });
  
  if (!visible) return null;
  
  return (
    <group>
      {/* Expanding ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 64]} />
        <meshBasicMaterial 
          color="#67e8f9" 
          transparent 
          opacity={1} 
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Spark particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlePositions.length / 3}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#ffffff"
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Central flash */}
      <pointLight 
        color="#67e8f9" 
        intensity={10 * (1 - progress)} 
        distance={10} 
      />
    </group>
  );
}

// ============================================================================
// NEBULA BIRTH - Swirling colorful gas clouds (Mystical)
// ============================================================================

function NebulaBirth({ phase, progress }: { phase: BootPhase; progress: number }) {
  const cloudsRef = useRef<THREE.Points>(null);
  
  const visible = ['nebulaBirth', 'coreIgnition'].includes(phase) || 
                  (phase === 'firstBreath' && progress < 0.3);
  
  // Generate nebula particles in golden spiral
  const { positions, colors } = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const radius = 2 + t * 3;
      const theta = i * goldenAngle;
      const y = (Math.random() - 0.5) * 2;
      
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
      
      // Aurora-like colors (purple -> cyan -> pink)
      const hue = (t * 0.3 + 0.7) % 1; // 0.7 to 1.0 (purple to pink range)
      const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return { positions, colors };
  }, []);
  
  useFrame((state) => {
    if (!cloudsRef.current || !visible) return;
    
    const t = state.clock.elapsedTime;
    const smoothProgress = smootherstep(progress);
    
    const positionAttr = cloudsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    
    // Particles spiral inward as progress increases
    const count = positionAttr.count;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    
    for (let i = 0; i < count; i++) {
      const particleT = i / count;
      
      // Start radius (far) -> end radius (close to center)
      const startRadius = 4 + particleT * 3;
      const endRadius = 0.5 + particleT * 0.5;
      
      // Smoothly interpolate radius inward
      const currentRadius = startRadius + (endRadius - startRadius) * smoothProgress;
      
      // Spiral rotation increases over time
      const theta = i * goldenAngle + t * (0.3 + particleT * 0.2);
      
      // Organic vertical movement
      const baseY = (Math.sin(i * 0.1) - 0.5) * 2;
      const y = baseY * (1 - smoothProgress * 0.8) + 
                Math.sin(t * 1.5 + i * 0.05) * 0.2 * (1 - smoothProgress);
      
      positionAttr.setXYZ(
        i,
        Math.cos(theta) * currentRadius,
        y,
        Math.sin(theta) * currentRadius
      );
    }
    
    positionAttr.needsUpdate = true;
    
    // Fade based on phase transition
    let opacity = 0.7;
    if (phase === 'coreIgnition') {
      opacity = 0.7 * (1 - progress * 0.5);
    } else if (phase === 'firstBreath') {
      opacity = 0.35 * (1 - progress);
    }
    (cloudsRef.current.material as THREE.PointsMaterial).opacity = opacity;
  });
  
  if (!visible) return null;
  
  return (
    <points ref={cloudsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// CORE IGNITION - Hot center glow, particles rush inward (Power On)
// ============================================================================

function CoreIgnition({ phase, progress }: { phase: BootPhase; progress: number }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);
  
  const visible = ['coreIgnition', 'firstBreath', 'awakening', 'ready', 'complete'].includes(phase);
  
  useFrame((state) => {
    if (!coreRef.current || !visible) return;
    
    const t = state.clock.elapsedTime;
    const smoothProgress = smootherstep(progress);
    
    // Core scale grows with smooth breathing
    let scale = 0;
    if (phase === 'coreIgnition') {
      scale = smoothProgress * 0.5;
    } else if (phase === 'firstBreath') {
      scale = 0.5 + progress * 0.3;
    } else {
      scale = 0.8;
    }
    
    // Gentle breathing
    const breathe = 1 + Math.sin(t * 1.5) * 0.05 * (phase === 'ready' ? 1 : 0.3);
    coreRef.current.scale.setScalar(scale * breathe);
    
    // Color shifts from white-hot to warm
    const hue = phase === 'coreIgnition' ? 0.15 : 0.55; // Orange -> Cyan
    const saturation = phase === 'coreIgnition' ? 0.3 : 0.6;
    (coreRef.current.material as THREE.MeshBasicMaterial).color.setHSL(hue, saturation, 0.8);
    
    // Inner glow
    if (innerGlowRef.current) {
      innerGlowRef.current.scale.setScalar(scale * 1.5 * breathe);
      const glowOpacity = phase === 'coreIgnition' ? smoothProgress * 0.6 : 0.4;
      (innerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = glowOpacity;
    }
  });
  
  if (!visible) return null;
  
  return (
    <group>
      {/* Core sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#fff7ed" />
      </mesh>
      
      {/* Inner glow */}
      <mesh ref={innerGlowRef}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial 
          color="#67e8f9" 
          transparent 
          opacity={0.4}
        />
      </mesh>
      
      {/* Core light */}
      <pointLight 
        color="#67e8f9" 
        intensity={phase === 'coreIgnition' ? progress * 5 : 3} 
        distance={15} 
      />
    </group>
  );
}

// ============================================================================
// 3D BOOT SCENE - Main scene composition
// ============================================================================

interface Boot3DSceneProps {
  phase: BootPhase;
  progress: number;
  quality: 'low' | 'medium' | 'high';
}

function Boot3DScene({ phase, progress, quality }: Boot3DSceneProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const orbGroupRef = useRef<THREE.Group>(null);
  
  // Camera position - cinematic pull-in
  const getCameraZ = useCallback(() => {
    switch (phase) {
      case 'void':
        return 20;
      case 'cosmicSpark':
        return 20 - progress * 5;
      case 'nebulaBirth':
        return 15 - progress * 3;
      case 'coreIgnition':
        return 12 - progress * 2;
      case 'firstBreath':
        return 10 - progress * 1;
      case 'awakening':
      case 'ready':
      case 'complete':
        return 9;
      default:
        return 20;
    }
  }, [phase, progress]);
  
  // Smooth camera animation
  useFrame(() => {
    if (cameraRef.current) {
      const targetZ = getCameraZ();
      // Superfluid camera movement
      const factor = 1 - Math.exp(-3 * 0.016); // Smooth damp
      cameraRef.current.position.z += (targetZ - cameraRef.current.position.z) * factor;
    }
  });
  
  // Orb visibility and animation
  const showOrb = ['firstBreath', 'awakening', 'ready', 'complete'].includes(phase);
  
  useFrame((state) => {
    if (!orbGroupRef.current) return;
    
    const t = state.clock.elapsedTime;
    
    // Scale based on phase
    let targetScale = 0;
    if (phase === 'firstBreath') {
      targetScale = smootherstep(progress);
    } else if (['awakening', 'ready', 'complete'].includes(phase)) {
      targetScale = 1;
    }
    
    // Smooth scale transition
    const currentScale = orbGroupRef.current.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * 0.1;
    orbGroupRef.current.scale.setScalar(newScale);
    
    // Gentle rotation
    orbGroupRef.current.rotation.y = t * 0.1;
  });
  
  // Orb intensity based on phase
  const getOrbIntensity = () => {
    switch (phase) {
      case 'firstBreath': return 0.3 + progress * 0.3;
      case 'awakening': return 0.6 + progress * 0.3;
      case 'ready':
      case 'complete': return 0.9;
      default: return 0.5;
    }
  };

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[0, 0, 20]}
        fov={35}
      />
      
      {/* Ambient light - very low */}
      <ambientLight intensity={0.01} />
      
      {/* Boot phases - layered composition */}
      <DistantStar phase={phase} progress={progress} />
      <CosmicSpark phase={phase} progress={progress} />
      <NebulaBirth phase={phase} progress={progress} />
      <CoreIgnition phase={phase} progress={progress} />
      
      {/* Light Door - Opens as boot progresses */}
      <LightDoor3D
        isOpen={['cosmicSpark', 'nebulaBirth', 'coreIgnition', 'firstBreath', 'awakening', 'ready', 'complete'].includes(phase)}
        color="#06b6d4"
        glowColor="#22d3ee"
        height={40}
        width={25}
        intensity={
          phase === 'cosmicSpark' ? progress * 0.3 :
          phase === 'nebulaBirth' ? 0.3 + progress * 0.3 :
          phase === 'coreIgnition' ? 0.6 + progress * 0.3 :
          0.9
        }
        position={[0, 0, -15]}
        showBeams={['coreIgnition', 'firstBreath', 'awakening', 'ready', 'complete'].includes(phase)}
        showParticles={['nebulaBirth', 'coreIgnition', 'firstBreath', 'awakening', 'ready', 'complete'].includes(phase)}
        particleCount={quality === 'low' ? 20 : quality === 'medium' ? 40 : 60}
      />
      
      {/* The Orb - emerges from core */}
      {showOrb && (
        <group ref={orbGroupRef} scale={0}>
          <GalionOrbV3
            size={2}
            state="idle"
            emotion="neutral"
            intensity={getOrbIntensity()}
            quality={quality}
            animate={phase === 'ready' || phase === 'complete'}
          />
        </group>
      )}
      
      {/* Fog - cosmic depth */}
      <fog attach="fog" args={['#030308', 10, 40]} />
    </>
  );
}

// ============================================================================
// MAIN BOOT COMPONENT
// ============================================================================

export function GalionOSBoot({
  onComplete,
  skip = false,
  mobile = false,
  speedMultiplier = 1,
  quality = 'high',
}: GalionOSBootProps) {
  const [phase, setPhase] = useState<BootPhase>('void');
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);
  const [textOpacity, setTextOpacity] = useState(0);
  const [uiOpacity, setUiOpacity] = useState(0);
  const startTimeRef = useRef(Date.now());
  const loadingTextIndexRef = useRef(0);
  
  // Get phase timings
  const phases = mobile ? MOBILE_PHASES : DESKTOP_PHASES;
  
  // Skip handling
  useEffect(() => {
    if (skip) {
      setPhase('complete');
      onComplete?.();
    }
  }, [skip, onComplete]);
  
  // Main animation loop
  useEffect(() => {
    if (skip) return;
    
    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000 * speedMultiplier;
      
      // Determine current phase
      let currentPhase: BootPhase = 'void';
      let phaseProgress = 0;
      
      for (const [phaseName, timing] of Object.entries(phases)) {
        if (elapsed >= timing.start && elapsed < timing.end) {
          currentPhase = phaseName as BootPhase;
          phaseProgress = (elapsed - timing.start) / (timing.end - timing.start);
          break;
        } else if (elapsed >= timing.end && phaseName === 'ready') {
          currentPhase = 'complete';
          phaseProgress = 1;
        }
      }
      
      setPhase(currentPhase);
      setProgress(phaseProgress);
      
      // Text opacity - fade in during void/cosmicSpark, fade out during coreIgnition
      let newTextOpacity = 0;
      if (currentPhase === 'void') {
        newTextOpacity = smootherstep(phaseProgress);
      } else if (currentPhase === 'cosmicSpark' || currentPhase === 'nebulaBirth') {
        newTextOpacity = 1;
      } else if (currentPhase === 'coreIgnition') {
        newTextOpacity = 1 - smootherstep(phaseProgress);
      }
      setTextOpacity(newTextOpacity);
      
      // UI opacity - fade in during ready phase
      if (currentPhase === 'ready') {
        setUiOpacity(smootherstep(phaseProgress));
      } else if (currentPhase === 'complete') {
        setUiOpacity(1);
      }
      
      // Cycle loading text organically
      if (['void', 'cosmicSpark', 'nebulaBirth', 'coreIgnition'].includes(currentPhase)) {
        const textIndex = Math.min(
          Math.floor(elapsed * 1.5),
          LOADING_TEXTS.length - 1
        );
        if (textIndex !== loadingTextIndexRef.current) {
          loadingTextIndexRef.current = textIndex;
          setLoadingText(LOADING_TEXTS[textIndex]);
        }
      }
      
      // Check completion
      if (currentPhase === 'complete') {
        onComplete?.();
        return;
      }
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [skip, phases, speedMultiplier, onComplete]);
  
  // Handle skip on click
  const handleSkip = useCallback(() => {
    setPhase('complete');
    onComplete?.();
  }, [onComplete]);
  
  if (skip) {
    return null;
  }
  
  return (
    <div
      onClick={handleSkip}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        cursor: 'pointer',
      }}
    >
      {/* 3D Canvas */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Canvas
          gl={{ antialias: quality !== 'low', alpha: false }}
          dpr={quality === 'low' ? [0.75, 1] : [1, 2]}
        >
          <Boot3DScene
            phase={phase}
            progress={progress}
            quality={quality}
          />
        </Canvas>
      </div>
      
      {/* Logo Text - fades with cosmic spark */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          transform: 'translateY(-50%)',
          textAlign: 'center',
          opacity: textOpacity,
          transition: 'opacity 0.5s ease-out',
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            fontSize: mobile ? '42px' : '64px',
            fontWeight: 100,
            letterSpacing: '24px',
            color: '#ffffff',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            margin: 0,
            textShadow: '0 0 30px rgba(103, 232, 249, 0.5)',
          }}
        >
          GALION
        </h1>
      </div>
      
      {/* Tagline */}
      <div
        style={{
          position: 'absolute',
          top: '46%',
          textAlign: 'center',
          opacity: textOpacity * 0.8,
          transition: 'opacity 0.5s ease-out',
          pointerEvents: 'none',
        }}
      >
        <p
          style={{
            fontSize: mobile ? '12px' : '16px',
            fontWeight: 300,
            letterSpacing: '6px',
            color: '#67e8f9',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            margin: 0,
          }}
        >
          YOUR ONLY LIMIT IS YOUR IMAGINATION
        </p>
      </div>
      
      {/* Loading Text - Poetic */}
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          textAlign: 'center',
          opacity: textOpacity * 0.6,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}
      >
        <p
          style={{
            fontSize: mobile ? '11px' : '13px',
            fontWeight: 300,
            letterSpacing: '3px',
            color: '#a5b4fc',
            fontFamily: 'monospace',
            margin: 0,
            fontStyle: 'italic',
          }}
        >
          {loadingText}
        </p>
      </div>
      
      {/* Skip hint - very subtle */}
      <div
        style={{
          position: 'absolute',
          bottom: '4%',
          opacity: textOpacity * 0.2,
          fontSize: '11px',
          color: '#333',
          letterSpacing: '2px',
          pointerEvents: 'none',
        }}
      >
        tap to skip
      </div>
    </div>
  );
}

export default GalionOSBoot;
