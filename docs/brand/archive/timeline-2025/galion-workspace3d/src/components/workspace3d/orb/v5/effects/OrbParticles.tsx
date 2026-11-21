/**
 * GALION Orb V5.2 - Particles Effect Component
 *
 * UPGRADED: Boid-swarming behavior for organic particle movement.
 * Reduced density for cleaner look.
 */

"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getEmotionConfig } from "../config/emotions";
import { getStateConfig } from "../config/states";
import { BlendedEmotionResult, Emotion, OrbState } from "../types";

// ============================================================================
// BOID TYPES
// ============================================================================
interface Boid {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  maxSpeed: number;
  maxForce: number;
}

// ============================================================================
// SHADERS (Simplified for CPU Positioning)
// ============================================================================

const particleVertexShader = `
attribute float aSize;

uniform float uSize;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uSize * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const particleFragmentShader = `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uSparkle;
uniform float uTime;

void main() {
  // Circular particle
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  if (dist > 0.5) discard;
  
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
  
  // Sparkle
  float sparkle = 1.0;
  if (uSparkle > 0.0) {
      sparkle = 0.8 + 0.2 * sin(uTime * 15.0 + gl_FragCoord.x * 0.1);
  }
  
  gl_FragColor = vec4(uColor * sparkle, alpha * uOpacity);
}
`;

export interface OrbParticlesProps {
  state: OrbState;
  emotion: Emotion;
  stateRef?: React.MutableRefObject<OrbState>;
  emotionRef?: React.MutableRefObject<Emotion>;
  blendedResult?: BlendedEmotionResult;
  blendedResultRef?: React.MutableRefObject<BlendedEmotionResult | null>;
  count?: number;
  radius?: number;
  animate?: boolean;
  qualityMultiplier?: number;
  animationProgress?: number;
  animationProgressRef?: React.MutableRefObject<number>;
  audioRef?: React.MutableRefObject<any>;
}

export function OrbParticles({
  state,
  emotion,
  stateRef,
  emotionRef,
  blendedResult,
  blendedResultRef,
  count = 150,
  radius = 1.5,
  animate = true,
  qualityMultiplier = 1.0,
  animationProgress = 0,
  animationProgressRef,
  audioRef,
}: OrbParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Reduced count (Less overwhelming)
  const actualCount = Math.max(20, Math.floor((count * qualityMultiplier) * 0.4));

  // Boid Simulation State
  const boidsRef = useRef<Boid[]>([]);

  // Init Geometry & Boids
  const { geometry } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const posArray = new Float32Array(actualCount * 3);
    const sizeArray = new Float32Array(actualCount);

    boidsRef.current = [];

    for (let i = 0; i < actualCount; i++) {
      // Init Random Position on Sphere Surface
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = radius;

      const pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      posArray[i * 3] = pos.x;
      posArray[i * 3 + 1] = pos.y;
      posArray[i * 3 + 2] = pos.z;

      sizeArray[i] = 0.5 + Math.random() * 1.5;

      boidsRef.current.push({
        position: pos,
        velocity: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(0.02),
        acceleration: new THREE.Vector3(),
        maxSpeed: 0.03 + Math.random() * 0.02,
        maxForce: 0.001
      });
    }

    geo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizeArray, 1));
    return { geometry: geo };
  }, [actualCount, radius]);

  // Uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0xffffff) },
    uOpacity: { value: 0.6 },
    uSize: { value: 30 },
    uSparkle: { value: 1.0 }
  }), []);

  // UseFrame Loop (Physics)
  useFrame((frameState, delta) => {
    if (!pointsRef.current || !materialRef.current) return;

    // Configs
    const currentEmotion = emotionRef?.current || emotion;
    const currentState = stateRef?.current || state;
    const audioLevel = audioRef?.current?.analysis?.level || 0;

    const emotionConfig = getEmotionConfig(currentEmotion);

    // Update Material
    materialRef.current.uniforms.uTime.value = frameState.clock.elapsedTime;
    const targetColor = new THREE.Color(emotionConfig.particles.color);
    if (audioLevel > 0.1) targetColor.lerp(new THREE.Color(1, 1, 1), audioLevel * 0.3);
    materialRef.current.uniforms.uColor.value.lerp(targetColor, delta * 2);
    materialRef.current.uniforms.uOpacity.value = 0.4 + (audioLevel * 0.4);

    // Boids Simulation
    const boids = boidsRef.current;

    // Tuning
    const separationDist = 0.3;
    const neighborDist = 1.2;
    const cohesionWeight = 0.005;
    const alignWeight = 0.02;
    const separateWeight = 0.04;
    const centerWeight = 0.002;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < actualCount; i++) {
      const b = boids[i];

      // Reset Accel
      b.acceleration.set(0, 0, 0);

      // Flocking
      const alignSum = new THREE.Vector3();
      const cohesionSum = new THREE.Vector3();
      const separateSum = new THREE.Vector3();
      let total = 0;
      let separateCount = 0;

      for (let j = 0; j < actualCount; j++) {
        if (i === j) continue;
        const other = boids[j];
        const dist = b.position.distanceTo(other.position);

        if (dist < neighborDist) {
          alignSum.add(other.velocity);
          cohesionSum.add(other.position);
          total++;

          if (dist < separationDist) {
            const diff = b.position.clone().sub(other.position).normalize().divideScalar(dist);
            separateSum.add(diff);
            separateCount++;
          }
        }
      }

      if (total > 0) {
        alignSum.divideScalar(total).normalize().multiplyScalar(b.maxSpeed).sub(b.velocity).clampLength(0, b.maxForce);
        cohesionSum.divideScalar(total).sub(b.position).normalize().multiplyScalar(b.maxSpeed).sub(b.velocity).clampLength(0, b.maxForce);
        b.acceleration.add(alignSum.multiplyScalar(alignWeight));
        b.acceleration.add(cohesionSum.multiplyScalar(cohesionWeight));
      }

      if (separateCount > 0) {
        separateSum.divideScalar(separateCount).normalize().multiplyScalar(b.maxSpeed).sub(b.velocity).clampLength(0, b.maxForce);
        b.acceleration.add(separateSum.multiplyScalar(separateWeight));
      }

      // Sphere Containment (Attract to shell surface radius)
      const distFromCenter = b.position.length();
      const targetDist = radius;
      const centerForce = b.position.clone().normalize().multiplyScalar(targetDist).sub(b.position).multiplyScalar(centerWeight);
      b.acceleration.add(centerForce);

      // Audio Boost (Scatter)
      if (audioLevel > 0.3) {
        const noise = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.001 * audioLevel);
        b.acceleration.add(noise);
        b.maxSpeed = 0.05 + audioLevel * 0.1;
      } else {
        b.maxSpeed = 0.03;
      }

      // Update Physics
      b.velocity.add(b.acceleration).clampLength(0, b.maxSpeed);
      b.position.add(b.velocity);

      // Update Buffer
      positions[i * 3] = b.position.x;
      positions[i * 3 + 1] = b.position.y;
      positions[i * 3 + 2] = b.position.z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default OrbParticles;
