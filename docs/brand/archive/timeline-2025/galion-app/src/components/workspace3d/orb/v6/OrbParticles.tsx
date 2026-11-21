/**
 * GALION Orb V6 - Particles Component
 *
 * Floating particles that orbit around the orb.
 * Creates a magical, ethereal atmosphere.
 */

'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbColors } from './types';

// =============================================================================
// SEEDED RANDOM - Deterministic for SSR/hydration consistency
// =============================================================================

function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function createParticleTexture(): THREE.Texture | undefined {
  if (typeof document === 'undefined') return undefined;

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;

  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  return new THREE.CanvasTexture(canvas);
}

// =============================================================================
// COMPONENT
// =============================================================================

interface OrbParticlesProps {
  colors: OrbColors;
  count?: number;
  innerRadius?: number;
  outerRadius?: number;
  speed: number;
  audioLevel: number;
}

export function OrbParticles({
  colors,
  count = 150,
  innerRadius = 1.2,
  outerRadius = 2.0,
  speed,
  audioLevel,
}: OrbParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const [isClient, setIsClient] = useState(false);

  // Set client flag after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Texture - only create on client
  const particleTexture = useMemo(() => {
    if (!isClient) return undefined;
    return createParticleTexture();
  }, [isClient]);

  // Initialize particle data with seeded random
  const particleData = useMemo(() => {
    const seededRandom = createSeededRandom(456); // Fixed seed for consistency
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random spherical position between inner and outer radius
      const theta = seededRandom() * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom() - 1);
      const r = innerRadius + seededRandom() * (outerRadius - innerRadius);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Random orbital velocity direction
      const vTheta = seededRandom() * Math.PI * 2;
      const vPhi = Math.acos(2 * seededRandom() - 1);
      const vMag = 0.001 + seededRandom() * 0.003;

      velocities[i * 3] = vMag * Math.sin(vPhi) * Math.cos(vTheta);
      velocities[i * 3 + 1] = vMag * Math.sin(vPhi) * Math.sin(vTheta);
      velocities[i * 3 + 2] = vMag * Math.cos(vPhi);

      // Random phase for sparkle
      phases[i] = seededRandom() * Math.PI * 2;

      // Random size variation
      sizes[i] = 0.02 + seededRandom() * 0.04;
    }

    return { positions, velocities, phases, sizes };
  }, [count, innerRadius, outerRadius]);

  // Animation loop
  useFrame((state, delta) => {
    if (!pointsRef.current || !materialRef.current) return;

    const time = state.clock.elapsedTime;
    const { positions, velocities, phases, sizes } = particleData;

    // Update each particle
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Current position
      let x = positions[i3];
      let y = positions[i3 + 1];
      let z = positions[i3 + 2];

      // Distance from center
      const dist = Math.sqrt(x * x + y * y + z * z);

      // Normalize position
      const nx = x / dist;
      const ny = y / dist;
      const nz = z / dist;

      // Orbital motion - cross product with up vector for tangent
      const tx = ny * 0.5 - nz * 0.3;
      const ty = nz * 0.3 - nx * 0.5;
      const tz = nx * 0.3 - ny * 0.3;

      // Apply velocity with orbital tendency
      const speedMult = speed * (1 + audioLevel * 2);
      x += (velocities[i3] + tx * 0.005) * speedMult;
      y += (velocities[i3 + 1] + ty * 0.005) * speedMult;
      z += (velocities[i3 + 2] + tz * 0.005) * speedMult;

      // Keep particles within bounds
      const newDist = Math.sqrt(x * x + y * y + z * z);
      if (newDist < innerRadius || newDist > outerRadius) {
        // Bounce back towards middle
        const targetDist = (innerRadius + outerRadius) / 2;
        const scale = targetDist / newDist;
        x *= scale;
        y *= scale;
        z *= scale;

        // Reverse radial velocity
        const radialVel = (velocities[i3] * nx + velocities[i3 + 1] * ny + velocities[i3 + 2] * nz);
        velocities[i3] -= 2 * radialVel * nx;
        velocities[i3 + 1] -= 2 * radialVel * ny;
        velocities[i3 + 2] -= 2 * radialVel * nz;
      }

      // Store updated position
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
    }

    // Update geometry
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Update material color
    materialRef.current.color.lerp(new THREE.Color(colors.particles), delta * 3);

    // Sparkle effect via opacity
    const sparkle = Math.sin(time * 2) * 0.1 + 0.6 + audioLevel * 0.2;
    materialRef.current.opacity = Math.min(sparkle, 0.9);

    // Size based on audio
    materialRef.current.size = 0.04 + audioLevel * 0.02;
  });

  // Don't render on server
  if (!isClient) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particleData.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        map={particleTexture}
        size={0.04}
        sizeAttenuation
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color={colors.particles}
      />
    </points>
  );
}

export default OrbParticles;
