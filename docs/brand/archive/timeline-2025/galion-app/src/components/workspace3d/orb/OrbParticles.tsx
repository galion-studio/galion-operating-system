"use client";

/**
 * OrbParticles.tsx - Emotion-Reactive Particle System
 *
 * Creates ambient particles around the orb that react to:
 * - Current emotion (color, speed)
 * - Current state (density, behavior)
 * - Audio level (for speaking state)
 *
 * Particles float, orbit, and create a magical atmosphere
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbEmotion, getEmotionConfig } from "./orbV3Emotions";
import { OrbState, getStateConfig } from "./orbV3States";

// ============================================================================
// TYPES
// ============================================================================

export interface OrbParticlesProps {
  /** Base size of the orb */
  size?: number;
  /** Particle spawn radius multiplier */
  radiusMultiplier?: number;
  /** Base particle count */
  count?: number;
  /** Current state */
  state?: OrbState;
  /** Current emotion */
  emotion?: OrbEmotion;
  /** Intensity multiplier (0-1) */
  intensity?: number;
  /** Audio level for reactive particles (0-1) */
  audioLevel?: number;
  /** Quality level */
  quality?: "low" | "medium" | "high";
}

// ============================================================================
// QUALITY SETTINGS
// ============================================================================

const QUALITY_MULTIPLIERS = {
  low: 0.2,
  medium: 0.5,
  high: 1.0,
};

// ============================================================================
// FLOATING PARTICLES
// ============================================================================

interface FloatingParticlesProps {
  count: number;
  radius: number;
  color: string;
  size: number;
  speed: number;
  intensity: number;
}

function FloatingParticles({
  count,
  radius,
  color,
  size,
  speed,
  intensity,
}: FloatingParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Lock the count on first render to prevent buffer resize errors
  const stableCountRef = useRef<number | null>(null);
  if (stableCountRef.current === null) {
    stableCountRef.current = count;
  }
  const actualCount = stableCountRef.current;

  // Generate initial positions and velocities
  const { positions, velocities, phases } = useMemo(() => {
    const positions = new Float32Array(actualCount * 3);
    const velocities = new Float32Array(actualCount * 3);
    const phases = new Float32Array(actualCount);

    for (let i = 0; i < actualCount; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.5 + Math.random() * 0.5);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Random orbit velocities
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      // Random phase for wave motion
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, velocities, phases };
  }, [actualCount, radius]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const positionAttr = pointsRef.current.geometry.attributes
      .position as THREE.BufferAttribute;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < actualCount; i++) {
      const idx = i * 3;

      // Get current position
      let x = positionAttr.array[idx];
      let y = positionAttr.array[idx + 1];
      let z = positionAttr.array[idx + 2];

      // Apply orbital motion
      const angle = time * speed * 0.1 + phases[i];
      const dist = Math.sqrt(x * x + z * z);

      x = dist * Math.cos(angle + i * 0.1);
      z = dist * Math.sin(angle + i * 0.1);

      // Wave motion in Y
      y += Math.sin(time * speed + phases[i]) * 0.005;

      // Keep within bounds
      const currentDist = Math.sqrt(x * x + y * y + z * z);
      if (currentDist > radius * 1.5 || currentDist < radius * 0.3) {
        // Reset to random position
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = radius * (0.5 + Math.random() * 0.5);
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      }

      positionAttr.array[idx] = x;
      positionAttr.array[idx + 1] = y;
      positionAttr.array[idx + 2] = z;
    }

    positionAttr.needsUpdate = true;

    // Slow global rotation
    pointsRef.current.rotation.y += 0.001 * speed;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry key={`floating-${actualCount}`}>
        <bufferAttribute
          attach="attributes-position"
          count={actualCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={intensity * 0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// SPARKLE PARTICLES
// ============================================================================

interface SparkleParticlesProps {
  count: number;
  radius: number;
  color: string;
  intensity: number;
}

function SparkleParticles({
  count,
  radius,
  color,
  intensity,
}: SparkleParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Lock the count on first render to prevent buffer resize errors
  const stableCountRef = useRef<number | null>(null);
  if (stableCountRef.current === null) {
    stableCountRef.current = count;
  }
  const actualCount = stableCountRef.current;

  // Generate sparkle positions
  const { positions, lifetimes, sizes } = useMemo(() => {
    const positions = new Float32Array(actualCount * 3);
    const lifetimes = new Float32Array(actualCount);
    const sizes = new Float32Array(actualCount);

    for (let i = 0; i < actualCount; i++) {
      // Random position in sphere shell
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.8 + Math.random() * 0.4);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      lifetimes[i] = Math.random();
      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    return { positions, lifetimes, sizes };
  }, [actualCount, radius]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const material = pointsRef.current.material as THREE.PointsMaterial;

    // Update lifetimes and create twinkling effect
    for (let i = 0; i < actualCount; i++) {
      lifetimes[i] += delta * (0.5 + Math.random() * 0.5);
      if (lifetimes[i] > 1) {
        lifetimes[i] = 0;

        // Respawn at new position
        const positionAttr = pointsRef.current.geometry.attributes
          .position as THREE.BufferAttribute;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = radius * (0.8 + Math.random() * 0.4);

        positionAttr.array[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positionAttr.array[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positionAttr.array[i * 3 + 2] = r * Math.cos(phi);
        positionAttr.needsUpdate = true;
      }
    }

    // Pulsing opacity
    const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    material.opacity = intensity * pulse;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry key={`sparkle-${actualCount}`}>
        <bufferAttribute
          attach="attributes-position"
          count={actualCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={1.5}
        transparent
        opacity={intensity * 0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// REACTIVE BURST PARTICLES
// ============================================================================

interface BurstParticlesProps {
  count: number;
  radius: number;
  color: string;
  intensity: number;
  direction: number; // 1 = outward, -1 = inward
  speed: number;
}

function BurstParticles({
  count,
  radius,
  color,
  intensity,
  direction,
  speed,
}: BurstParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Lock the count on first render to prevent buffer resize errors
  const stableCountRef = useRef<number | null>(null);
  if (stableCountRef.current === null) {
    stableCountRef.current = count;
  }
  const actualCount = stableCountRef.current;

  // Generate burst positions
  const { positions, progress } = useMemo(() => {
    const positions = new Float32Array(actualCount * 3);
    const progress = new Float32Array(actualCount);

    for (let i = 0; i < actualCount; i++) {
      progress[i] = Math.random();

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.3 + progress[i] * 0.7);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    return { positions, progress };
  }, [actualCount, radius]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const positionAttr = pointsRef.current.geometry.attributes
      .position as THREE.BufferAttribute;

    for (let i = 0; i < actualCount; i++) {
      progress[i] += delta * speed * 0.5;
      if (progress[i] > 1) progress[i] = 0;

      const idx = i * 3;
      const x = positionAttr.array[idx];
      const y = positionAttr.array[idx + 1];
      const z = positionAttr.array[idx + 2];

      const currentDist = Math.sqrt(x * x + y * y + z * z);
      const targetDist =
        radius *
        (direction > 0 ? 0.3 + progress[i] * 0.9 : 1.2 - progress[i] * 0.9);

      const scale = targetDist / Math.max(currentDist, 0.01);

      positionAttr.array[idx] = x * scale;
      positionAttr.array[idx + 1] = y * scale;
      positionAttr.array[idx + 2] = z * scale;
    }

    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry key={`burst-${actualCount}`}>
        <bufferAttribute
          attach="attributes-position"
          count={actualCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={2}
        transparent
        opacity={intensity * 0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrbParticles({
  size = 2,
  radiusMultiplier = 1,
  count = 500,
  state = "idle",
  emotion = "neutral",
  intensity = 0.5,
  audioLevel = 0,
  quality = "high",
}: OrbParticlesProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Get configurations
  const stateConfig = getStateConfig(state);
  const emotionConfig = getEmotionConfig(emotion);

  // Calculate actual counts based on quality
  const qualityMultiplier = QUALITY_MULTIPLIERS[quality];
  const actualCount = Math.floor(
    count * qualityMultiplier * emotionConfig.particleDensity
  );
  const sparkleCount = Math.floor(actualCount * 0.3);
  const burstCount = Math.floor(actualCount * 0.4);

  // Calculate radius
  const radius = size * 2 * radiusMultiplier;

  // Calculate speeds
  const particleSpeed = useMemo(() => {
    return (
      emotionConfig.speedMultiplier * stateConfig.gradient.motionMultiplier
    );
  }, [emotionConfig, stateConfig]);

  // Energy flow direction from state
  const flowDirection = stateConfig.energyFlow.direction;

  return (
    <group ref={groupRef}>
      {/* Main floating particles */}
      <FloatingParticles
        count={actualCount}
        radius={radius}
        color={emotionConfig.secondary}
        size={1.5}
        speed={particleSpeed}
        intensity={intensity}
      />

      {/* Sparkle effect particles */}
      {quality !== "low" && (
        <SparkleParticles
          count={sparkleCount}
          radius={radius * 1.2}
          color={emotionConfig.accent}
          intensity={intensity * 0.7}
        />
      )}

      {/* Burst/flow particles - active during speaking/listening */}
      {(state === "speaking" ||
        state === "listening" ||
        state === "thinking") && (
        <BurstParticles
          count={burstCount}
          radius={radius}
          color={emotionConfig.stream}
          intensity={
            intensity * (state === "speaking" ? 0.5 + audioLevel * 0.5 : 0.6)
          }
          direction={flowDirection}
          speed={stateConfig.energyFlow.speed}
        />
      )}

      {/* Extra particles for high intensity */}
      {quality === "high" && intensity > 0.7 && (
        <FloatingParticles
          count={Math.floor(actualCount * 0.3)}
          radius={radius * 0.7}
          color={emotionConfig.primary}
          size={1}
          speed={particleSpeed * 1.5}
          intensity={intensity * 0.5}
        />
      )}
    </group>
  );
}

export default OrbParticles;
