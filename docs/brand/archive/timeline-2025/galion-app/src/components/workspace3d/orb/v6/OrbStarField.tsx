/**
 * GALION Orb V6 - Star Field Component
 *
 * Background star field for cosmic depth.
 * Creates immersion and scale.
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
// SHADERS
// =============================================================================

const vertexShader = `
  attribute float aSize;
  attribute float aBrightness;
  attribute float aTwinkleSpeed;
  attribute float aTwinklePhase;

  uniform float uTime;
  uniform float uBaseSize;

  varying float vBrightness;
  varying float vTwinkle;

  void main() {
    vBrightness = aBrightness;

    // Twinkle effect
    vTwinkle = sin(uTime * aTwinkleSpeed + aTwinklePhase) * 0.3 + 0.7;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Size attenuation
    float size = aSize * uBaseSize * (200.0 / -mvPosition.z);
    gl_PointSize = clamp(size, 0.5, 4.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vBrightness;
  varying float vTwinkle;

  void main() {
    // Circular point with soft edge
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) discard;

    // Soft edge
    float alpha = smoothstep(0.5, 0.2, dist);

    // Core glow
    float core = smoothstep(0.3, 0.0, dist);

    vec3 color = uColor * vBrightness * vTwinkle;
    color += vec3(1.0) * core * 0.5; // White hot core

    gl_FragColor = vec4(color, alpha * uOpacity * vBrightness * vTwinkle);
  }
`;

// =============================================================================
// COMPONENT
// =============================================================================

interface OrbStarFieldProps {
  colors: OrbColors;
  starCount?: number;
  radius?: number;
  opacity?: number;
}

export function OrbStarField({
  colors,
  starCount = 1000,
  radius = 50,
  opacity = 0.8,
}: OrbStarFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [isClient, setIsClient] = useState(false);

  // Set client flag after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Generate star data with seeded random
  const starData = useMemo(() => {
    const seededRandom = createSeededRandom(123); // Fixed seed for consistency
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const brightness = new Float32Array(starCount);
    const twinkleSpeeds = new Float32Array(starCount);
    const twinklePhases = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      // Spherical distribution
      const theta = seededRandom() * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom() - 1);
      const r = radius * (0.5 + seededRandom() * 0.5);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Varied sizes (mostly small, few large)
      sizes[i] = Math.pow(seededRandom(), 2) * 2 + 0.5;

      // Brightness variation
      brightness[i] = seededRandom() * 0.7 + 0.3;

      // Twinkle parameters
      twinkleSpeeds[i] = seededRandom() * 3 + 1;
      twinklePhases[i] = seededRandom() * Math.PI * 2;
    }

    return { positions, sizes, brightness, twinkleSpeeds, twinklePhases };
  }, [starCount, radius]);

  // Create geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(starData.positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(starData.sizes, 1));
    geo.setAttribute('aBrightness', new THREE.BufferAttribute(starData.brightness, 1));
    geo.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(starData.twinkleSpeeds, 1));
    geo.setAttribute('aTwinklePhase', new THREE.BufferAttribute(starData.twinklePhases, 1));
    return geo;
  }, [starData]);

  // Star color (slightly tinted by emotion)
  const starColor = useMemo(() => {
    const base = new THREE.Color(0xffffff);
    const emotionColor = new THREE.Color(colors.glow);
    return base.lerp(emotionColor, 0.1);
  }, [colors.glow]);

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: starColor },
        uOpacity: { value: opacity },
        uBaseSize: { value: 1.5 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  // Animation loop
  useFrame((state, delta) => {
    if (!materialRef.current || !groupRef.current) return;

    // Update time for twinkle
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    // Update color
    const targetColor = new THREE.Color(0xffffff).lerp(new THREE.Color(colors.glow), 0.1);
    materialRef.current.uniforms.uColor.value.lerp(targetColor, delta * 2);

    // Slow rotation for depth perception
    groupRef.current.rotation.y += delta * 0.005;
    groupRef.current.rotation.x += delta * 0.002;
  });

  // Don't render on server
  if (!isClient) return null;

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} geometry={geometry}>
        <primitive object={material} ref={materialRef} attach="material" />
      </points>
    </group>
  );
}

export default OrbStarField;
