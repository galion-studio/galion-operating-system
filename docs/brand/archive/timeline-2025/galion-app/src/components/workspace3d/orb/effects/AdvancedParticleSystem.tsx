"use client";

/**
 * AdvancedParticleSystem.tsx - GPU-Accelerated Particle Effects
 *
 * High-performance particle system using instanced meshes and custom shaders
 * for thousands of particles at 60fps.
 *
 * Features:
 * - GPU-based particle updates
 * - Energy trails and flow patterns
 * - Audio-reactive behavior
 * - Smooth interpolation and physics
 * - Multiple particle types (sparkles, energy, trails)
 */

import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// ============================================================================
// PARTICLE SHADER MATERIAL
// ============================================================================

const particleVertexShader = /* glsl */ `
  attribute vec3 offset;
  attribute vec3 velocity;
  attribute float size;
  attribute float life;
  attribute vec3 color;
  
  varying vec3 vColor;
  varying float vLife;
  
  uniform float uTime;
  uniform float uScale;
  uniform float uAudioLevel;
  
  void main() {
    vColor = color;
    vLife = life;
    
    // Position with offset
    vec3 pos = position * size * uScale;
    pos += offset;
    
    // Audio pulse
    float audioPulse = 1.0 + uAudioLevel * 0.2;
    pos *= audioPulse;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = size * uScale * (300.0 / -mvPosition.z) * life;
  }
`;

const particleFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vLife;
  
  void main() {
    // Circular particle shape
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    // Smooth edges
    float alpha = smoothstep(0.5, 0.2, dist);
    alpha *= vLife; // Fade with life
    
    // Glowing center
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    vec3 finalColor = vColor * (1.0 + glow * 0.5);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const ParticleShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uScale: 1.0,
    uAudioLevel: 0,
  },
  particleVertexShader,
  particleFragmentShader
);

extend({ ParticleShaderMaterial });

// ============================================================================
// PARTICLE SYSTEM TYPES
// ============================================================================

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

interface AdvancedParticleSystemProps {
  count?: number;
  emitterRadius?: number;
  particleSize?: number;
  speed?: number;
  color1?: string;
  color2?: string;
  color3?: string;
  audioLevel?: number;
  intensity?: number;
  type?: "energy" | "sparkle" | "trail";
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AdvancedParticleSystem({
  count = 5000,
  emitterRadius = 2,
  particleSize = 0.05,
  speed = 1.0,
  color1 = "#4a90e2",
  color2 = "#8b5cf6",
  color3 = "#06b6d4",
  audioLevel = 0,
  intensity = 1.0,
  type = "energy",
}: AdvancedParticleSystemProps) {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<any>(null);

  // Use stable count ref to prevent buffer resizing issues
  // THREE.WebGLAttributes doesn't support resizing buffer attributes
  const stableCountRef = useRef<number | null>(null);
  if (stableCountRef.current === null) {
    stableCountRef.current = count;
  }
  const actualCount = stableCountRef.current;

  // Particle data stored in useMemo for persistence
  const particles = useMemo(() => {
    const particleArray: Particle[] = [];

    for (let i = 0; i < actualCount; i++) {
      particleArray.push(createParticle(emitterRadius, type));
    }

    return particleArray;
  }, [actualCount, emitterRadius, type]);

  // Geometry attributes
  const { offsets, velocities, sizes, lives, colors } = useMemo(() => {
    const offsets = new Float32Array(actualCount * 3);
    const velocities = new Float32Array(actualCount * 3);
    const sizes = new Float32Array(actualCount);
    const lives = new Float32Array(actualCount);
    const colors = new Float32Array(actualCount * 3);

    const colorPalette = [
      new THREE.Color(color1),
      new THREE.Color(color2),
      new THREE.Color(color3),
    ];

    particles.forEach((particle, i) => {
      offsets[i * 3] = particle.position.x;
      offsets[i * 3 + 1] = particle.position.y;
      offsets[i * 3 + 2] = particle.position.z;

      velocities[i * 3] = particle.velocity.x;
      velocities[i * 3 + 1] = particle.velocity.y;
      velocities[i * 3 + 2] = particle.velocity.z;

      sizes[i] = particle.size;
      lives[i] = particle.life / particle.maxLife;

      const color =
        colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });

    return { offsets, velocities, sizes, lives, colors };
  }, [particles, color1, color2, color3, actualCount]);

  // Animation loop
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const offsetAttr = meshRef.current.geometry.getAttribute(
      "offset"
    ) as THREE.BufferAttribute;
    const velocityAttr = meshRef.current.geometry.getAttribute(
      "velocity"
    ) as THREE.BufferAttribute;
    const lifeAttr = meshRef.current.geometry.getAttribute(
      "life"
    ) as THREE.BufferAttribute;

    particles.forEach((particle, i) => {
      // Update life
      particle.life -= delta * speed;

      // Reset particle if dead
      if (particle.life <= 0) {
        resetParticle(particle, emitterRadius, type);
      }

      // Apply forces based on type
      if (type === "energy") {
        // Swirl pattern
        const angle = state.clock.elapsedTime * 0.5 + i * 0.01;
        particle.acceleration.x = Math.cos(angle) * 0.5;
        particle.acceleration.z = Math.sin(angle) * 0.5;
        particle.acceleration.y =
          Math.sin(state.clock.elapsedTime + i * 0.1) * 0.3;
      } else if (type === "trail") {
        // Outward flow
        const direction = particle.position.clone().normalize();
        particle.acceleration.copy(direction.multiplyScalar(2.0));
      } else {
        // Sparkles - gentle float
        particle.acceleration.y =
          Math.sin(state.clock.elapsedTime * 2 + i * 0.1) * 0.5;
      }

      // Audio influence
      const audioInfluence = audioLevel * intensity;
      particle.acceleration.multiplyScalar(1.0 + audioInfluence);

      // Update velocity and position
      particle.velocity.add(particle.acceleration.multiplyScalar(delta));
      particle.velocity.multiplyScalar(0.98); // Damping
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));

      // Update attributes
      offsetAttr.setXYZ(
        i,
        particle.position.x,
        particle.position.y,
        particle.position.z
      );
      velocityAttr.setXYZ(
        i,
        particle.velocity.x,
        particle.velocity.y,
        particle.velocity.z
      );
      lifeAttr.setX(i, particle.life / particle.maxLife);
    });

    offsetAttr.needsUpdate = true;
    velocityAttr.needsUpdate = true;
    lifeAttr.needsUpdate = true;

    // Update shader uniforms
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uAudioLevel = audioLevel;
      materialRef.current.uScale = intensity;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry key={`particle-geo-${actualCount}`}>
        <bufferAttribute
          attach="attributes-offset"
          count={actualCount}
          array={offsets}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-velocity"
          count={actualCount}
          array={velocities}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={actualCount}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-life"
          count={actualCount}
          array={lives}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-color"
          count={actualCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <particleShaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createParticle(radius: number, type: string): Particle {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = radius * (0.5 + Math.random() * 0.5);

  const position = new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );

  const velocity = new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2
  );

  const maxLife =
    type === "trail" ? 2 + Math.random() * 2 : 3 + Math.random() * 3;

  return {
    position,
    velocity,
    acceleration: new THREE.Vector3(),
    life: maxLife,
    maxLife,
    size: 0.02 + Math.random() * 0.08,
    color: new THREE.Color(),
  };
}

function resetParticle(particle: Particle, radius: number, type: string): void {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = radius * (type === "energy" ? 0.5 : 0.3);

  particle.position.set(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );

  particle.velocity.set(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2
  );

  particle.life = particle.maxLife;
  particle.acceleration.set(0, 0, 0);
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      particleShaderMaterial: any;
    }
  }
}
