/**
 * GALION Gatekeeper V2 - Epic Orb Birth Experience
 *
 * Features:
 * - HDR color palette throughout
 * - Fluid, organic animations
 * - Epic orb birth from nebula
 * - Minimalistic spinning loader
 * - Step-by-step galaxy/nebula formation
 *
 * @version 3.0.0 - Epic Edition
 * @lastUpdated December 10, 2025
 */

"use client";

import { Float, Line, Sparkles, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { GalionOrbV3 } from "../workspace3d/orb/GalionOrbV3";
import { AdvancedParticleSystem } from "../workspace3d/orb/effects/AdvancedParticleSystem";

// ============================================================================
// HDR COLOR PALETTE - Alive, Organic, Vibrant
// ============================================================================

const HDR_COLORS = {
  // Primary HDR Blues
  cosmic: {
    deep: "#0a0e27",
    medium: "#1e3a8a",
    bright: "#3b82f6",
    neon: "#60a5fa",
    glow: "#93c5fd",
  },
  // HDR Purples - Mystical Energy
  mystical: {
    deep: "#1e1b4b",
    medium: "#6d28d9",
    bright: "#8b5cf6",
    neon: "#a78bfa",
    glow: "#c4b5fd",
  },
  // HDR Cyans - Electric Energy
  electric: {
    deep: "#0e7490",
    medium: "#0891b2",
    bright: "#06b6d4",
    neon: "#22d3ee",
    glow: "#67e8f9",
  },
  // HDR Whites - Pure Energy
  pure: {
    base: "#ffffff",
    glow: "#f0f9ff",
    shimmer: "#e0f2fe",
  },
  // Nebula Colors - Organic
  nebula: {
    deep: "#0f172a",
    purple: "#312e81",
    blue: "#1e40af",
    cyan: "#155e75",
    pink: "#7e22ce",
  },
};

// ============================================================================
// SEEDED RANDOM - Deterministic for SSR/hydration consistency
// ============================================================================

function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// ============================================================================
// TYPES
// ============================================================================

type GatekeeperPhase =
  | "initializing" // Minimalistic spinner (3s)
  | "nebula-forming" // Dark nebula begins forming (3s)
  | "orb-birth" // Orb emerges from nebula (5s)
  | "explosion" // Explosion with white lines (2s)
  | "light-transition" // Background fades to light (2s)
  | "voice-welcome" // Voice AI greeting
  | "consent-intro" // Smooth transition to consent explanation
  | "consent-detail" // Cookie + Terms in elegant flow
  | "permissions-intro" // Transition to permissions
  | "permissions-request" // Microphone & Speaker permission request
  | "permissions-denied" // User denied - must enable to continue
  | "finalizing" // Final transition
  | "complete"; // Done

interface ConsentState {
  cookies: "pending" | "accepted" | "essential-only";
  terms: "pending" | "accepted";
  microphone: "pending" | "granted" | "denied";
}

interface GalionGatekeeperV2Props {
  platformName?: string;
  onComplete: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TOS_VERSION = "2.1.0";
const STORAGE_KEY = "galion_gatekeeper_v2";
const DEBUG_ENABLED = true;

// ============================================================================
// HUMAN-OPTIMIZED ANIMATION CONFIGS
// Designed for universal accessibility: elders, youth, and everyone in between
// Based on research: 300-500ms for UI feedback, 800-1200ms for transitions
// ============================================================================

// Easing curves optimized for human perception
const humanEase = [0.4, 0, 0.2, 1]; // Material Design standard - feels natural
const gentleEase = [0.25, 0.1, 0.25, 1]; // Softer, easier on eyes for elders
const breathingEase = [0.45, 0, 0.55, 1]; // Symmetric, calming

// Duration constants (in seconds) - GLOBAL for all components
const QUICK_FEEDBACK = 0.3; // Button presses, small interactions
const STANDARD_TRANSITION = 0.6; // Normal element transitions
const COMFORTABLE_REVEAL = 1.2; // Text reveals - enough time to notice
const HUMAN_READABLE_DELAY = 1.2; // Stagger delay for sequential content
const CINEMATIC_MOMENT = 1.8; // Major reveals - impactful but not tedious
const READING_PAUSE = 2.5; // Time to read short text before auto-advance
const COMPREHENSION_PAUSE = 4.0; // Time to read/understand longer content

// Legacy aliases for compatibility
const riverEase = gentleEase;
const flowDuration = COMFORTABLE_REVEAL;
const cinematicDuration = CINEMATIC_MOMENT;
const gentleSpring = { type: "spring", stiffness: 80, damping: 20, mass: 1 };

// Debug logger
const debug = {
  log: (message: string, data?: unknown) => {
    if (DEBUG_ENABLED) {
      console.log(`[Gatekeeper] ${message}`, data ?? "");
    }
  },
  event: (event: string, data?: unknown) => {
    if (DEBUG_ENABLED) {
      console.log(`[Gatekeeper:Event] ${event}`, data ?? "");
      // Analytics hook point - can be connected to any analytics provider
      if (typeof window !== "undefined") {
        (
          window as Window & {
            galionAnalytics?: { track: (e: string, d: unknown) => void };
          }
        ).galionAnalytics?.track(event, data);
      }
    }
  },
};

// ============================================================================
// ORGANIC EASING FUNCTIONS
// ============================================================================

const organicEase = (t: number): number => {
  // Smooth cubic easing with organic feel
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const fluidEase = (t: number): number => {
  // Sine-based easing for fluid motion
  return -(Math.cos(Math.PI * t) - 1) / 2;
};

const explosiveEase = (t: number): number => {
  // Exponential easing for explosive effects
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
};

// ============================================================================
// MINIMALISTIC SPINNER - Phase 1
// ============================================================================

function MinimalisticSpinner() {
  return (
    <div className="flex items-center justify-center">
      {/* Triple ring spinner */}
      <div className="relative w-16 h-16">
        {/* Outer ring - blue */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${HDR_COLORS.cosmic.neon}`,
            borderTopColor: "transparent",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, ease: "linear", repeat: Infinity }}
        />

        {/* Middle ring - purple */}
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{
            border: `2px solid ${HDR_COLORS.mystical.bright}`,
            borderTopColor: "transparent",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
        />

        {/* Inner ring - cyan */}
        <motion.div
          className="absolute inset-4 rounded-full"
          style={{
            border: `2px solid ${HDR_COLORS.electric.neon}`,
            borderTopColor: "transparent",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity }}
        />

        {/* Center glow */}
        <div className="absolute inset-4 rounded-full blur-md bg-[radial-gradient(circle,var(--cosmic-neon-40),transparent)]" />
      </div>
    </div>
  );
}

// ============================================================================
// NEBULA FORMATION - Phase 2
// ============================================================================

function NebulaFormation({ progress }: { progress: number }) {
  return (
    <group>
      {/* Advanced particle system for nebula */}
      <AdvancedParticleSystem
        count={3000}
        type="energy"
        particleSize={0.03}
        color1={HDR_COLORS.nebula.deep}
        color2={HDR_COLORS.nebula.purple}
        color3={HDR_COLORS.nebula.blue}
        speed={0.3}
        emitterRadius={3}
        intensity={progress * 0.8}
      />

      {/* Additional sparkles */}
      <Sparkles
        count={50}
        scale={5}
        size={2}
        speed={0.5}
        opacity={progress * 0.6}
        color={HDR_COLORS.mystical.glow}
      />
    </group>
  );
}

// ============================================================================
// ORB BIRTH SCENE - Phase 3
// ============================================================================

function OrbBirthScene({ progress }: { progress: number }) {
  const scale = fluidEase(progress);

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group scale={scale}>
        <GalionOrbV3
          emotion="curious"
          state="thinking"
          quality="high"
          animate={true}
          debug={false}
        />
      </group>
    </Float>
  );
}

// ============================================================================
// EXPLOSION SCENE - Phase 4
// ============================================================================

function ExplosionScene({ progress }: { progress: number }) {
  const explosionRadius = explosiveEase(progress) * 10;
  const lineCount = 32;

  // Pre-compute z-offsets with seeded random for hydration consistency
  const lineOffsets = React.useMemo(() => {
    const seededRandom = createSeededRandom(123);
    return Array.from({ length: lineCount }, () => ({
      startZ: (seededRandom() - 0.5) * 0.3,
      endZOffset: (seededRandom() - 0.5) * 2,
    }));
  }, [lineCount]);

  return (
    <group>
      {lineOffsets.map((offsets, i) => {
        const angle = (i / lineCount) * Math.PI * 2;
        const startX = Math.cos(angle) * 0.5;
        const startY = Math.sin(angle) * 0.5;
        const startZ = offsets.startZ;

        const endX = Math.cos(angle) * explosionRadius;
        const endY = Math.sin(angle) * explosionRadius;
        const endZ = startZ + offsets.endZOffset;

        return (
          <Line
            key={i}
            points={[
              [startX, startY, startZ],
              [endX, endY, endZ],
            ]}
            color={HDR_COLORS.pure.base}
            lineWidth={2}
            transparent
            opacity={1 - progress}
          />
        );
      })}

      {/* Central white flash */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial
          color={HDR_COLORS.pure.base}
          transparent
          opacity={(1 - progress) * 2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// LIGHT TRANSITION SCENE - Phase 5
// ============================================================================

function LightTransitionScene({ progress }: { progress: number }) {
  const lineCount = 12;
  const flowDistance = organicEase(progress) * 15;

  return (
    <group>
      {Array.from({ length: lineCount }).map((_, i) => {
        const angle = (i / lineCount) * Math.PI * 2;
        const startX = Math.cos(angle) * 2;
        const startY = Math.sin(angle) * 2;

        const endX = Math.cos(angle) * flowDistance;
        const endY = Math.sin(angle) * flowDistance;

        const color =
          i % 3 === 0
            ? HDR_COLORS.cosmic.bright
            : i % 3 === 1
            ? HDR_COLORS.mystical.bright
            : HDR_COLORS.electric.bright;

        return (
          <Line
            key={i}
            points={[
              [startX, startY, 0],
              [endX, endY, 0],
            ]}
            color={color}
            lineWidth={1.5}
            transparent
            opacity={0.6}
          />
        );
      })}
    </group>
  );
}

// ============================================================================
// COSMOS BACKGROUND - Dark Nebula + Stars for Consent/Voice Phases
// ============================================================================

function CosmosBackground({ fade = 1 }: { fade?: number }) {
  return (
    <group>
      {/* Starfield */}
      <Stars
        radius={140}
        depth={70}
        count={1800}
        factor={3}
        fade
        speed={0.25}
      />

      {/* Subtle sparkles */}
      <Sparkles
        count={70}
        scale={18}
        size={2.2}
        speed={0.18}
        opacity={0.28 * fade}
        color={HDR_COLORS.cosmic.glow}
      />

      {/* Floating nebula particles */}
      <Float speed={0.4} rotationIntensity={0.1} floatIntensity={0.35}>
        <AdvancedParticleSystem
          count={1800}
          type="energy"
          particleSize={0.018}
          color1={HDR_COLORS.nebula.deep}
          color2={HDR_COLORS.nebula.purple}
          color3={HDR_COLORS.nebula.blue}
          emitterRadius={8}
          speed={0.22}
          intensity={0.38 * fade}
        />
      </Float>

      {/* Secondary cyan wisps */}
      <Float speed={0.55} rotationIntensity={0.15} floatIntensity={0.4}>
        <AdvancedParticleSystem
          count={900}
          type="energy"
          particleSize={0.014}
          color1={HDR_COLORS.electric.deep}
          color2={HDR_COLORS.electric.neon}
          color3={HDR_COLORS.cosmic.neon}
          emitterRadius={10}
          speed={0.28}
          intensity={0.24 * fade}
        />
      </Float>

      {/* Soft gradient planes for depth */}
      <mesh position={[0, 0, -8]} rotation={[0, 0, 0]}>
        <planeGeometry args={[45, 45]} />
        <meshBasicMaterial
          color={HDR_COLORS.nebula.deep}
          transparent
          opacity={0.35 * fade}
        />
      </mesh>
      <mesh position={[0, 0, -6]} rotation={[0, Math.PI / 9, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial
          color={HDR_COLORS.mystical.deep}
          transparent
          opacity={0.18 * fade}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// 3D FLOWING LINES SCENE (No Orbs) - Enhanced with Wiggle Entrance
// ============================================================================

function FlowingLine({
  startPosition,
  color,
  speed = 1,
  amplitude = 0.5,
  frequency = 1,
  delay = 0,
  globalOpacity = 1,
}: {
  startPosition: [number, number, number];
  color: string;
  speed?: number;
  amplitude?: number;
  frequency?: number;
  delay?: number;
  globalOpacity?: number;
}) {
  const lineRef = useRef<THREE.Group>(null);
  const time = useRef(0);
  const entranceProgress = useRef(0);
  // Use index-based offset instead of random to avoid hydration mismatch
  const wigglePhase = useRef(startPosition[1] * Math.PI * 0.5);

  // State for opacity - tracked separately to avoid hydration issues
  const [lineOpacity, setLineOpacity] = React.useState(0);

  // State for animated curve points
  const [curvePoints, setCurvePoints] = React.useState<THREE.Vector3[]>(() => {
    // Initialize with starting positions (off-screen)
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 50; i++) {
      pts.push(new THREE.Vector3(-20, startPosition[1], 5));
    }
    return pts;
  });

  // Generate flowing curve points with wiggle entrance animation
  useFrame((state, delta) => {
    time.current += delta * speed;

    // Entrance animation - lines wiggle into place after delay
    const adjustedTime = Math.max(0, state.clock.elapsedTime - delay);
    if (entranceProgress.current < 1) {
      entranceProgress.current = Math.min(1, adjustedTime / 2.8); // 2.8s to fully appear
    }

    const progress = entranceProgress.current;
    const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic for smooth settle

    // Generate flowing curve points with wiggle entrance
    const pts: THREE.Vector3[] = [];
    const segments = 50;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      // Base final positions
      const baseX = startPosition[0] + (t - 0.5) * 10;
      const baseY =
        startPosition[1] + Math.sin(t * Math.PI * frequency) * amplitude;
      const baseZ = startPosition[2] + Math.cos(t * Math.PI * 0.5) * 0.5;

      // Wiggle entrance effect - lines snake into position from edges
      const entranceOffset = (1 - easeProgress) * 18; // Start 18 units away
      const wiggleAmount = (1 - easeProgress) * 2.5; // Lots of wiggle at start, none when settled

      // Organic wiggle using multiple sine waves
      const wiggleX =
        Math.sin(t * 8 + time.current * 4 + wigglePhase.current) * wiggleAmount;
      const wiggleY =
        Math.cos(t * 6 + time.current * 3 + wigglePhase.current * 1.5) *
        wiggleAmount *
        0.6;
      const wiggleZ = Math.sin(t * 4 + time.current * 2) * wiggleAmount * 0.3;

      // Lines come from alternating directions based on their Y position
      const direction =
        startPosition[1] > 0
          ? 1
          : startPosition[1] < 0
          ? -1
          : frequency > 2
          ? 1
          : -1;
      const entranceX = entranceOffset * direction * (0.3 + t * 0.7); // Staggered entrance along line

      // Flowing animation after settled - gentle river motion
      const flowX = Math.sin(time.current * 0.4 + t * 2) * 0.25 * easeProgress;
      const flowY =
        Math.sin(time.current * 0.25 + t * 1.5 + wigglePhase.current) *
        0.12 *
        easeProgress;

      const x = baseX + entranceX + wiggleX + flowX;
      const y = baseY + wiggleY + flowY;
      const z = baseZ + (1 - easeProgress) * 4 + wiggleZ; // Come from behind camera

      pts.push(new THREE.Vector3(x, y, z));
    }

    setCurvePoints(pts);

    // Update opacity state for render
    const newOpacity = Math.min(1, entranceProgress.current * 1.8);
    setLineOpacity(newOpacity);

    // Subtle rotation when settled
    if (lineRef.current) {
      lineRef.current.rotation.z =
        Math.sin(time.current * 0.15) * 0.015 * easeProgress;
    }
  });

  // Final opacity combines entrance progress with global phase opacity
  const finalOpacity = lineOpacity * globalOpacity;

  if (curvePoints.length === 0) return null;

  return (
    <group ref={lineRef}>
      <Line
        points={curvePoints}
        color={color}
        lineWidth={2}
        transparent
        opacity={finalOpacity * 0.7}
        dashed={false}
      />
      {/* Glow effect */}
      <Line
        points={curvePoints}
        color={color}
        lineWidth={10}
        transparent
        opacity={finalOpacity * 0.18}
        dashed={false}
      />
    </group>
  );
}

function PulsingParticles({ count = 100 }: { count?: number }) {
  const particlesRef = useRef<THREE.Points>(null);

  // Use seeded random for SSR/hydration consistency
  const positions = React.useMemo(() => {
    const seededRandom = createSeededRandom(456);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (seededRandom() - 0.5) * 30;
      pos[i * 3 + 1] = (seededRandom() - 0.5) * 15;
      pos[i * 3 + 2] = (seededRandom() - 0.5) * 10;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#60a5fa"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

function FlowingLinesScene({ phase }: { phase: GatekeeperPhase }) {
  // Fade lines slightly when text appears to give it focus
  const lineOpacity =
    phase === "voice-welcome" ? 0.7 : phase === "complete" ? 0 : 1;

  return (
    <>
      <ambientLight intensity={0.12} />
      <pointLight position={[10, 10, 10]} intensity={0.6} color="#3b82f6" />
      <pointLight position={[-10, -5, -10]} intensity={0.35} color="#8b5cf6" />
      <pointLight position={[0, 0, 5]} intensity={0.2} color="#06b6d4" />

      <Stars radius={100} depth={50} count={1200} factor={3} fade speed={0.2} />

      {/* Main flowing lines - elegant river effect with staggered entrance */}
      <Float speed={0.3} rotationIntensity={0.05} floatIntensity={0.2}>
        {/* Primary lines - enter first */}
        <FlowingLine
          startPosition={[0, 0, 0]}
          color="#3b82f6"
          speed={0.7}
          amplitude={0.9}
          frequency={2}
          delay={0.2}
          globalOpacity={lineOpacity}
        />
        <FlowingLine
          startPosition={[0, -1.2, 0.5]}
          color="#8b5cf6"
          speed={0.55}
          amplitude={0.7}
          frequency={1.5}
          delay={0.5}
          globalOpacity={lineOpacity}
        />
        {/* Secondary lines - enter with slight delay */}
        <FlowingLine
          startPosition={[0, 1.3, -0.5]}
          color="#06b6d4"
          speed={0.85}
          amplitude={0.6}
          frequency={2.5}
          delay={0.8}
          globalOpacity={lineOpacity}
        />
        <FlowingLine
          startPosition={[0, 0.6, 1]}
          color="#34d399"
          speed={0.65}
          amplitude={0.5}
          frequency={1.8}
          delay={1.1}
          globalOpacity={lineOpacity}
        />
        {/* Accent lines - enter last for depth */}
        <FlowingLine
          startPosition={[0, -0.5, -1]}
          color="#f472b6"
          speed={0.5}
          amplitude={0.4}
          frequency={2.2}
          delay={1.4}
          globalOpacity={lineOpacity}
        />
      </Float>

      {/* Subtle particles - delayed appearance */}
      <PulsingParticles count={120} />
    </>
  );
}

// ============================================================================
// UI COMPONENTS - Glass Morphism
// ============================================================================

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
      relative overflow-hidden
      bg-white/3 backdrop-blur-2xl
      border border-white/8
      rounded-3xl
      shadow-[0_8px_32px_rgba(0,0,0,0.3)]
      ${className}
    `}
    >
      {/* Subtle gradient shimmer */}
      <div className="absolute inset-0 bg-linear-to-br from-[rgba(30,58,138,0.3)] via-[rgba(109,40,217,0.2)] to-[rgba(6,182,212,0.25)] rounded-3xl blur-xl pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ============================================================================
// CONSENT CONTENT - Clear & Transparent
// ============================================================================

interface ConsentExplanationProps {
  onAcceptAll: () => void;
  onEssentialOnly: () => void;
}

function ConsentExplanation({
  onAcceptAll,
  onEssentialOnly,
}: ConsentExplanationProps) {
  return (
    <motion.div
      className="max-w-xl mx-auto px-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: COMFORTABLE_REVEAL, ease: humanEase }}
    >
      <GlassCard className="p-6 md:p-8">
        {/* Clear Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 0.2,
            duration: STANDARD_TRANSITION,
            ease: humanEase,
          }}
        >
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
            Before We Begin
          </h2>
          <p className="text-slate-400 text-sm">
            We believe in complete transparency
          </p>
        </motion.div>

        {/* What We Need - Crystal Clear */}
        <motion.div
          className="space-y-3 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 0.5,
            duration: STANDARD_TRANSITION,
            ease: humanEase,
          }}
        >
          {/* Essential */}
          <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">
                Essential Features
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Voice processing, session management, and core AI functionality.
                These are required for GALION to work.
              </p>
            </div>
          </div>

          {/* Analytics - Optional */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">
                Usage Analytics{" "}
                <span className="text-xs text-slate-500">(optional)</span>
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Help us improve by allowing anonymous usage statistics. No
                personal data is collected.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Your Rights */}
        <motion.div
          className="mb-6 p-3 md:p-4 rounded-2xl bg-white/2 border border-white/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 0.8,
            duration: STANDARD_TRANSITION,
            ease: humanEase,
          }}
        >
          <h3 className="text-white font-medium mb-2 text-sm">Your Rights</h3>
          <ul className="text-slate-400 text-xs space-y-1.5">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
              Change these preferences anytime in Settings
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
              Request data deletion at any time
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
              We never sell your personal data
            </li>
          </ul>
        </motion.div>

        {/* Action Buttons - Clear Choices */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 1.0,
            duration: STANDARD_TRANSITION,
            ease: humanEase,
          }}
        >
          <motion.button
            onClick={onAcceptAll}
            className="w-full py-3.5 md:py-4 px-6 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-2xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: QUICK_FEEDBACK }}
          >
            Accept & Continue
          </motion.button>

          <motion.button
            onClick={onEssentialOnly}
            className="w-full py-3 px-6 text-slate-400 hover:text-white text-sm transition-colors duration-200"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            Essential Only
          </motion.button>
        </motion.div>

        {/* Legal Links */}
        <motion.div
          className="mt-6 pt-6 border-t border-white/5 flex justify-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5, duration: 1.5 }}
        >
          <a
            href="/privacy"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Terms of Service
          </a>
          <a
            href="/cookies"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cookie Policy
          </a>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}

// ============================================================================
// PERMISSIONS REQUEST - Microphone & Speaker
// ============================================================================

interface PermissionsRequestProps {
  onRequestPermission: () => void;
}

function PermissionsRequest({ onRequestPermission }: PermissionsRequestProps) {
  return (
    <motion.div
      className="max-w-xl mx-auto px-4"
      initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: STANDARD_TRANSITION, ease: riverEase }}
    >
      <GlassCard className="p-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.6,
            duration: STANDARD_TRANSITION,
            ease: riverEase,
          }}
        >
          <h2 className="text-2xl font-semibold text-white mb-2">
            Enable Voice Access
          </h2>
          <p className="text-slate-400 text-sm">
            GALION is a voice-first AI companion
          </p>
        </motion.div>

        {/* Permissions Explanation */}
        <motion.div
          className="space-y-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: HUMAN_READABLE_DELAY,
            duration: STANDARD_TRANSITION,
            ease: riverEase,
          }}
        >
          {/* Microphone */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Microphone Access</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                To hear your voice commands and questions. Your voice is
                processed securely and never stored.
              </p>
            </div>
          </div>

          {/* Speaker */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Speaker Output</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                To respond to you with natural voice. GALION speaks back instead
                of just showing text.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Why Required */}
        <motion.div
          className="mb-8 p-4 rounded-2xl bg-white/2 border border-white/5"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: HUMAN_READABLE_DELAY + 0.6,
            duration: STANDARD_TRANSITION,
            ease: riverEase,
          }}
        >
          <h3 className="text-white font-medium mb-2 text-sm">
            Why is this required?
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            GALION is designed as a voice-first experience. Unlike traditional
            chatbots, we believe conversation should feel natural - like talking
            to a friend. Voice is at the core of everything we do.
          </p>
        </motion.div>

        {/* Enable Button */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: HUMAN_READABLE_DELAY + 1.2,
            duration: STANDARD_TRANSITION,
            ease: riverEase,
          }}
        >
          <motion.button
            onClick={onRequestPermission}
            className="w-full py-4 px-6 bg-linear-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium rounded-2xl transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              Enable Microphone & Continue
            </span>
          </motion.button>
        </motion.div>

        {/* Browser Prompt Note */}
        <motion.div
          className="mt-6 pt-6 border-t border-white/5 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: HUMAN_READABLE_DELAY + 1.8,
            duration: STANDARD_TRANSITION,
          }}
        >
          <p className="text-xs text-slate-600">
            Your browser will ask for permission • Click "Allow" to continue
          </p>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}

// ============================================================================
// PERMISSIONS DENIED - Must enable to continue
// ============================================================================

interface PermissionsDeniedProps {
  onRetry: () => void;
}

function PermissionsDenied({ onRetry }: PermissionsDeniedProps) {
  return (
    <motion.div
      className="max-w-xl mx-auto px-4"
      initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: STANDARD_TRANSITION, ease: riverEase }}
    >
      <GlassCard className="p-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.6,
            duration: STANDARD_TRANSITION,
            ease: riverEase,
          }}
        >
          {/* Warning Icon */}
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.4,
              duration: STANDARD_TRANSITION,
              ease: riverEase,
            }}
          >
            <svg
              className="w-8 h-8 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </motion.div>

          <h2 className="text-2xl font-semibold text-white mb-2">
            Microphone Access Required
          </h2>
          <p className="text-slate-400 text-sm">
            GALION cannot function without voice access
          </p>
        </motion.div>

        {/* Explanation */}
        <motion.div
          className="mb-8 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: HUMAN_READABLE_DELAY,
            duration: STANDARD_TRANSITION,
            ease: riverEase,
          }}
        >
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            It looks like microphone access was denied. As a voice-first AI
            companion, GALION needs microphone access to work properly.
          </p>
          <p className="text-slate-400 text-xs">
            Please enable microphone access and try again to enter the platform.
          </p>
        </motion.div>

        {/* How to Enable */}
        <motion.div
          className="mb-8 p-4 rounded-2xl bg-white/2 border border-white/5"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: HUMAN_READABLE_DELAY + 0.6,
            duration: STANDARD_TRANSITION,
            ease: riverEase,
          }}
        >
          <h3 className="text-white font-medium mb-3 text-sm">
            How to enable:
          </h3>
          <ol className="text-slate-400 text-xs space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-medium">
                1
              </span>
              <span>
                Click the lock/settings icon in your browser's address bar
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-medium">
                2
              </span>
              <span>Find "Microphone" in the permissions list</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-medium">
                3
              </span>
              <span>Change the setting to "Allow"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-medium">
                4
              </span>
              <span>Click the button below to try again</span>
            </li>
          </ol>
        </motion.div>

        {/* Retry Button */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: HUMAN_READABLE_DELAY + 1.2,
            duration: STANDARD_TRANSITION,
            ease: riverEase,
          }}
        >
          <motion.button
            onClick={onRetry}
            className="w-full py-4 px-6 bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium rounded-2xl transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              I've Enabled It - Retry
            </span>
          </motion.button>
        </motion.div>

        {/* Support Link */}
        <motion.div
          className="mt-6 pt-6 border-t border-white/5 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: HUMAN_READABLE_DELAY + 1.8,
            duration: STANDARD_TRANSITION,
          }}
        >
          <p className="text-xs text-slate-600">
            Having trouble?{" "}
            <a
              href="/support"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Contact Support
            </a>
          </p>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}

// ============================================================================
// MAIN GATEKEEPER COMPONENT
// ============================================================================

export function GalionGatekeeperV2({
  platformName = "GALION",
  onComplete,
}: GalionGatekeeperV2Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [phase, setPhase] = useState<GatekeeperPhase>("initializing");
  const [consent, setConsent] = useState<ConsentState>({
    cookies: "pending",
    terms: "pending",
    microphone: "pending",
  });

  // Progressive animation states for organic transitions
  const [nebulaProgress, setNebulaProgress] = useState(0);
  const [birthProgress, setBirthProgress] = useState(0);
  const [explosionProgress, setExplosionProgress] = useState(0);
  const [transitionProgress, setTransitionProgress] = useState(0);

  const startTime = useRef(Date.now());

  // Mark as mounted (client-side only) - prevents hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check for existing consent on mount
  useEffect(() => {
    debug.log("Gatekeeper initialized");

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version === TOS_VERSION && parsed.accepted) {
          debug.log("Returning user detected, skipping gatekeeper");
          debug.event("gatekeeper_skip", { reason: "returning_user" });
          setPhase("complete");
          setTimeout(onComplete, 100);
          return;
        }
      } catch (e) {
        debug.log("Failed to parse stored consent", e);
      }
    }

    // New user - start the experience
    debug.event("gatekeeper_start", { type: "new_user" });
    startExperience();
  }, [onComplete]);

  const startExperience = async () => {
    debug.log("Starting epic orb birth experience");

    // ================================================================
    // PHASE 1: INITIALIZING - Minimalistic Spinner (3s)
    // ================================================================
    setPhase("initializing");
    debug.event("gatekeeper_phase", { phase: "initializing" });
    await delay(3000);

    // ================================================================
    // PHASE 2: NEBULA FORMING - Dark nebula begins forming (3s)
    // Step-by-step organic progression
    // ================================================================
    setPhase("nebula-forming");
    debug.event("gatekeeper_phase", { phase: "nebula-forming" });

    // Animate nebula progress organically (10 steps over 3s)
    for (let i = 0; i <= 10; i++) {
      setNebulaProgress(organicEase(i / 10));
      await delay(300);
    }

    // ================================================================
    // PHASE 3: ORB BIRTH - Orb emerges from nebula (5s)
    // Fluid, organic emergence with wonder
    // ================================================================
    setPhase("orb-birth");
    debug.event("gatekeeper_phase", { phase: "orb-birth" });

    // Animate orb birth organically (16 steps over 5s)
    for (let i = 0; i <= 16; i++) {
      setBirthProgress(fluidEase(i / 16));
      await delay(312.5); // 5000ms / 16 steps
    }

    // ================================================================
    // PHASE 4: EXPLOSION - White lines radiating (2s)
    // Explosive, energetic expansion
    // ================================================================
    setPhase("explosion");
    debug.event("gatekeeper_phase", { phase: "explosion" });

    // Animate explosion (8 steps over 2s)
    for (let i = 0; i <= 8; i++) {
      setExplosionProgress(explosiveEase(i / 8));
      await delay(250);
    }

    // ================================================================
    // PHASE 5: LIGHT TRANSITION - Background fades to light (2s)
    // Flowing lines, calm transition
    // ================================================================
    setPhase("light-transition");
    debug.event("gatekeeper_phase", { phase: "light-transition" });

    // Animate transition (8 steps over 2s)
    for (let i = 0; i <= 8; i++) {
      setTransitionProgress(organicEase(i / 8));
      await delay(250);
    }

    // ================================================================
    // PHASE 6: VOICE WELCOME - Voice AI greeting (4s)
    // ================================================================
    setPhase("voice-welcome");
    debug.event("gatekeeper_phase", { phase: "voice-welcome" });
    await delay(4000);

    // ================================================================
    // PHASE 7: CONSENT - User interaction begins
    // ================================================================
    setPhase("consent-intro");
    debug.event("gatekeeper_phase", { phase: "consent-intro" });
    await delay(2000);

    setPhase("consent-detail");
    debug.event("gatekeeper_phase", { phase: "consent-detail" });
  };

  const handleAcceptAll = useCallback(() => {
    debug.event("consent_accept_all", {
      timeSpent: Date.now() - startTime.current,
    });

    setConsent((prev) => ({ ...prev, cookies: "accepted", terms: "accepted" }));

    // Save consent to localStorage (but not complete yet - need mic permission)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: TOS_VERSION,
        accepted: false, // Will be set to true after mic permission
        cookiesAccepted: true,
        analyticsAccepted: true,
        timestamp: Date.now(),
      })
    );

    // Go to permissions intro
    setPhase("permissions-intro");
    debug.event("gatekeeper_phase", { phase: "permissions-intro" });
  }, []);

  const handleEssentialOnly = useCallback(() => {
    debug.event("consent_essential_only", {
      timeSpent: Date.now() - startTime.current,
    });

    setConsent((prev) => ({
      ...prev,
      cookies: "essential-only",
      terms: "accepted",
    }));

    // Save consent to localStorage (but not complete yet - need mic permission)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: TOS_VERSION,
        accepted: false, // Will be set to true after mic permission
        cookiesAccepted: false,
        analyticsAccepted: false,
        timestamp: Date.now(),
      })
    );

    // Go to permissions intro
    setPhase("permissions-intro");
    debug.event("gatekeeper_phase", { phase: "permissions-intro" });
  }, []);

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async () => {
    debug.event("microphone_permission_request");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Permission granted - stop the stream (we just needed permission)
      stream.getTracks().forEach((track) => track.stop());

      debug.event("microphone_permission_granted");
      setConsent((prev) => ({ ...prev, microphone: "granted" }));

      // Update localStorage to mark as fully accepted
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...parsed,
            accepted: true,
            microphoneGranted: true,
          })
        );
      }

      // Finalize - Cinematic exit
      setPhase("finalizing");
      setTimeout(() => {
        setPhase("complete");
        debug.event("gatekeeper_complete", {
          totalTime: Date.now() - startTime.current,
          microphoneGranted: true,
        });
        onComplete();
      }, 3500);
    } catch (error) {
      debug.event("microphone_permission_denied", { error });
      setConsent((prev) => ({ ...prev, microphone: "denied" }));
      setPhase("permissions-denied");
    }
  }, [onComplete]);

  // Retry after permission denied
  const handleRetryPermission = useCallback(() => {
    debug.event("microphone_permission_retry");
    setPhase("permissions-request");
    // Small delay then request again
    setTimeout(() => {
      requestMicrophonePermission();
    }, 500);
  }, [requestMicrophonePermission]);

  // Don't render until mounted (prevents hydration mismatch)
  // Server renders nothing, client renders after mount
  if (!isMounted) return null;

  // Don't render if complete
  if (phase === "complete") return null;

  // Dynamic background color based on phase - ALWAYS DARK
  const getBackgroundColor = () => {
    switch (phase) {
      case "initializing":
        return "#000000"; // Pure black for spinner
      case "nebula-forming":
      case "orb-birth":
        return HDR_COLORS.nebula.deep; // Deep space
      case "explosion":
        return "#0a0e1a"; // Slightly lighter during explosion flash
      case "light-transition":
      case "voice-welcome":
      case "consent-intro":
      case "consent-detail":
      case "permissions-intro":
      case "permissions-request":
      case "permissions-denied":
      case "finalizing":
        return HDR_COLORS.nebula.deep; // Stay dark cosmos for all consent phases
      default:
        return HDR_COLORS.nebula.deep; // Default dark
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-9999 overflow-hidden"
      animate={{ backgroundColor: getBackgroundColor() }}
      transition={{ duration: 2, ease: "easeInOut" }}
    >
      {/* 3D Background Scene */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2, ease: riverEase }}
      >
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
        >
          <Suspense fallback={null}>
            {/* Ambient lighting for all phases */}
            <ambientLight intensity={0.15} />
            <pointLight
              position={[10, 10, 10]}
              intensity={0.4}
              color={HDR_COLORS.cosmic.bright}
            />
            <pointLight
              position={[-10, -5, -10]}
              intensity={0.3}
              color={HDR_COLORS.mystical.bright}
            />

            {/* Persistent cosmos background for all phases except initializing */}
            {phase !== "initializing" && (
              <CosmosBackground
                fade={
                  phase === "nebula-forming"
                    ? 0.3
                    : phase === "orb-birth"
                    ? 0.5
                    : phase === "explosion"
                    ? 0.7
                    : phase === "light-transition"
                    ? 0.85
                    : 1
                }
              />
            )}

            {/* Phase-specific 3D scenes layered on top */}
            {phase === "nebula-forming" && (
              <NebulaFormation progress={nebulaProgress} />
            )}
            {phase === "orb-birth" && (
              <>
                <NebulaFormation progress={1} />
                <OrbBirthScene progress={birthProgress} />
              </>
            )}
            {phase === "explosion" && (
              <ExplosionScene progress={explosionProgress} />
            )}
            {phase === "light-transition" && (
              <LightTransitionScene progress={transitionProgress} />
            )}
            {(phase === "voice-welcome" ||
              phase === "consent-intro" ||
              phase === "consent-detail" ||
              phase === "permissions-intro" ||
              phase === "permissions-request" ||
              phase === "permissions-denied" ||
              phase === "finalizing") && <FlowingLinesScene phase={phase} />}
          </Suspense>
        </Canvas>
      </motion.div>

      {/* Content Layer */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* Phase 1: INITIALIZING - Minimalistic Spinner */}
          {phase === "initializing" && (
            <motion.div
              key="initializing"
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: COMFORTABLE_REVEAL, ease: humanEase }}
            >
              <MinimalisticSpinner />

              {/* Loading text with HDR glow */}
              <motion.p
                className="text-sm tracking-[0.3em] uppercase mt-8 font-light"
                style={{
                  color: HDR_COLORS.cosmic.glow,
                  textShadow: `0 0 20px ${HDR_COLORS.cosmic.neon}40`,
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1, ease: humanEase }}
              >
                INITIALIZING
              </motion.p>
            </motion.div>
          )}

          {/* Phase 2: NEBULA FORMING - No UI, just 3D scene */}
          {phase === "nebula-forming" && (
            <motion.div
              key="nebula-forming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            />
          )}

          {/* Phase 3: ORB BIRTH - No UI, just 3D scene */}
          {phase === "orb-birth" && (
            <motion.div
              key="orb-birth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            />
          )}

          {/* Phase 4: EXPLOSION - No UI, just 3D scene */}
          {phase === "explosion" && (
            <motion.div
              key="explosion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}

          {/* Phase 5: LIGHT TRANSITION - No UI, just 3D scene */}
          {phase === "light-transition" && (
            <motion.div
              key="light-transition"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            />
          )}

          {/* Phase 6: VOICE WELCOME - Pure orb experience (text removed) */}
          {phase === "voice-welcome" && (
            <motion.div
              key="voice-welcome"
              className="text-center px-4 relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
              transition={{ duration: COMFORTABLE_REVEAL, ease: humanEase }}
            >
              {/* Welcome text removed - pure orb-only experience */}
            </motion.div>
          )}

          {/* Consent Intro - Clear, readable transition */}
          {phase === "consent-intro" && (
            <motion.div
              key="consent-intro"
              className="text-center px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: STANDARD_TRANSITION, ease: humanEase }}
            >
              <motion.p className="text-lg md:text-xl text-slate-400/90 font-light tracking-wide">
                Let's set up your experience...
              </motion.p>
            </motion.div>
          )}

          {/* Consent Detail */}
          {phase === "consent-detail" && (
            <motion.div
              key="consent-detail"
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ConsentExplanation
                onAcceptAll={handleAcceptAll}
                onEssentialOnly={handleEssentialOnly}
              />
            </motion.div>
          )}

          {/* Permissions Intro - Gentle transition */}
          {phase === "permissions-intro" && (
            <motion.div
              key="permissions-intro"
              className="text-center px-4"
              initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -30, filter: "blur(5px)" }}
              transition={{ duration: STANDARD_TRANSITION, ease: riverEase }}
              onAnimationComplete={() => {
                // After intro animation, go to request - comfortable reading time
                setTimeout(() => {
                  setPhase("permissions-request");
                  debug.event("gatekeeper_phase", {
                    phase: "permissions-request",
                  });
                }, 2500);
              }}
            >
              <motion.p
                className="text-xl text-slate-400/90 font-light tracking-wide"
                initial={{ letterSpacing: "0.1em" }}
                animate={{ letterSpacing: "0.15em" }}
                transition={{
                  duration: STANDARD_TRANSITION * 3,
                  ease: riverEase,
                }}
              >
                One more thing...
              </motion.p>
            </motion.div>
          )}

          {/* Permissions Request - Same card style as consent */}
          {phase === "permissions-request" && (
            <motion.div
              key="permissions-request"
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PermissionsRequest
                onRequestPermission={requestMicrophonePermission}
              />
            </motion.div>
          )}

          {/* Permissions Denied - User must enable to continue */}
          {phase === "permissions-denied" && (
            <motion.div
              key="permissions-denied"
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PermissionsDenied onRetry={handleRetryPermission} />
            </motion.div>
          )}

          {/* Finalizing Phase - Cinematic Exit */}
          {phase === "finalizing" && (
            <motion.div
              key="finalizing"
              className="text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
              transition={{ duration: cinematicDuration, ease: riverEase }}
            >
              <motion.div
                className="flex flex-col items-center gap-6 text-slate-400"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ duration: COMFORTABLE_REVEAL }}
              >
                {/* Elegant loading ring */}
                <motion.div className="relative w-16 h-16">
                  <motion.div className="absolute inset-0 border-2 border-blue-500/10 rounded-full" />
                  <motion.div
                    className="absolute inset-0 border-2 border-transparent border-t-blue-500/60 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <motion.div
                    className="absolute inset-2 border border-purple-500/20 rounded-full"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
                <motion.span
                  className="text-lg font-light tracking-wide"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: STANDARD_TRANSITION,
                    duration: COMFORTABLE_REVEAL,
                  }}
                >
                  Preparing your workspace...
                </motion.span>
                <motion.span
                  className="text-sm text-slate-600 tracking-wider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: HUMAN_READABLE_DELAY,
                    duration: COMFORTABLE_REVEAL,
                  }}
                >
                  Almost there
                </motion.span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom info - Always visible during consent */}
      {phase === "consent-detail" && (
        <motion.div
          className="absolute bottom-4 left-0 right-0 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-xs text-slate-600">
            Operating in 20+ countries • Open Source • Community Driven
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// Helper
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default GalionGatekeeperV2;
