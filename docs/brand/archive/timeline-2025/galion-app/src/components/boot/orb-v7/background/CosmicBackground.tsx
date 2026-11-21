/**
 * GALION Orb V7.2 - Cosmic Background Component
 *
 * Deep space background with:
 * - 1000+ twinkling stars in multiple layers
 * - Nebula clouds with subtle color gradients
 * - Slow parallax motion for depth
 * - Emotion-tinted atmosphere
 */

'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbV7State, OrbV7Emotion, AudioData, getEmotionPalette } from '../types';

// ============================================================================
// STAR FIELD SHADERS
// ============================================================================

const starVertexShader = `
uniform float uTime;
uniform float uSize;

attribute float aSize;
attribute float aBrightness;
attribute float aTwinkleSpeed;
attribute float aTwinklePhase;

varying float vBrightness;
varying float vTwinkle;

void main() {
  vBrightness = aBrightness;

  // Twinkle effect
  vTwinkle = sin(uTime * aTwinkleSpeed + aTwinklePhase) * 0.3 + 0.7;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // Size attenuation
  float size = aSize * uSize * (200.0 / -mvPosition.z);
  gl_PointSize = clamp(size, 0.5, 6.0);

  gl_Position = projectionMatrix * mvPosition;
}
`;

const starFragmentShader = `
uniform vec3 uColor;
uniform float uOpacity;

varying float vBrightness;
varying float vTwinkle;

void main() {
  // Circular point
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  if (dist > 0.5) discard;

  // Soft edge
  float alpha = smoothstep(0.5, 0.1, dist);

  // Core glow
  float core = smoothstep(0.2, 0.0, dist);

  vec3 color = uColor * vBrightness * vTwinkle;
  color += vec3(1.0) * core * 0.5; // White hot core

  gl_FragColor = vec4(color, alpha * uOpacity * vBrightness * vTwinkle);
}
`;

// ============================================================================
// NEBULA SHADER
// ============================================================================

const nebulaVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const nebulaFragmentShader = `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uOpacity;

varying vec2 vUv;
varying vec3 vPosition;

// Simple noise function
float noise(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value;
}

void main() {
  // Calculate position on sphere
  vec3 spherePos = normalize(vPosition);

  // Animated noise for nebula clouds
  float time = uTime * 0.05;
  float n1 = fbm(spherePos * 3.0 + time);
  float n2 = fbm(spherePos * 5.0 - time * 0.7);
  float n3 = fbm(spherePos * 8.0 + time * 0.3);

  float nebulaDensity = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

  // Create cloud-like pattern
  nebulaDensity = smoothstep(0.3, 0.7, nebulaDensity);

  // Color gradient
  vec3 color = mix(uColor1, uColor2, nebulaDensity);

  // Add some brightness variation
  float brightness = 0.7 + n1 * 0.3;
  color *= brightness;

  // Alpha based on density
  float alpha = nebulaDensity * uOpacity * 0.5;

  gl_FragColor = vec4(color, alpha);
}
`;

// ============================================================================
// STAR LAYER
// ============================================================================

interface StarLayerProps {
  count: number;
  minRadius: number;
  maxRadius: number;
  emotionRef: React.MutableRefObject<OrbV7Emotion>;
  opacity: number;
}

function StarLayer({ count, minRadius, maxRadius, emotionRef, opacity }: StarLayerProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const targetColor = useRef(new THREE.Color());

  // Generate star data
  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const brightness = new Float32Array(count);
    const twinkleSpeeds = new Float32Array(count);
    const twinklePhases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = minRadius + Math.random() * (maxRadius - minRadius);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Size (mostly small, few large)
      sizes[i] = Math.pow(Math.random(), 3) * 2 + 0.3;

      // Brightness variation
      brightness[i] = Math.random() * 0.7 + 0.3;

      // Twinkle parameters
      twinkleSpeeds[i] = Math.random() * 3 + 1;
      twinklePhases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1));
    geo.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));
    geo.setAttribute('aTwinklePhase', new THREE.BufferAttribute(twinklePhases, 1));

    const unis = {
      uTime: { value: 0 },
      uSize: { value: 1.5 },
      uColor: { value: new THREE.Color(0xffffff) },
      uOpacity: { value: opacity },
    };

    return { geometry: geo, uniforms: unis };
  }, [count, minRadius, maxRadius, opacity]);

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    const palette = getEmotionPalette(emotionRef.current);

    // Update time
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    // Tint stars slightly with emotion color
    const baseWhite = new THREE.Color(0xffffff);
    targetColor.current.set(palette.glow);
    targetColor.current.lerp(baseWhite, 0.85);
    materialRef.current.uniforms.uColor.value.lerp(targetColor.current, delta * 0.5);
  });

  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, [geometry]);

  return (
    <points ref={pointsRef} geometry={geometry} renderOrder={0}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ============================================================================
// NEBULA SPHERE
// ============================================================================

interface NebulaSphereProps {
  radius: number;
  emotionRef: React.MutableRefObject<OrbV7Emotion>;
  opacity: number;
}

function NebulaSphere({ radius, emotionRef, opacity }: NebulaSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const targetColor1 = useRef(new THREE.Color());
  const targetColor2 = useRef(new THREE.Color());

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color('#4F46E5') },
    uColor2: { value: new THREE.Color('#06B6D4') },
    uOpacity: { value: opacity },
  }), [opacity]);

  useFrame((state, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    const palette = getEmotionPalette(emotionRef.current);

    // Update time
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    // Update colors
    targetColor1.current.set(palette.primary);
    targetColor2.current.set(palette.secondary);

    materialRef.current.uniforms.uColor1.value.lerp(targetColor1.current, delta * 0.5);
    materialRef.current.uniforms.uColor2.value.lerp(targetColor2.current, delta * 0.5);

    // Very slow rotation
    meshRef.current.rotation.y += delta * 0.01;
    meshRef.current.rotation.x += delta * 0.005;
  });

  // Cleanup
  useEffect(() => {
    return () => {
      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, []);

  return (
    <mesh ref={meshRef} renderOrder={-1}>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={nebulaVertexShader}
        fragmentShader={nebulaFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface CosmicBackgroundProps {
  stateRef: React.MutableRefObject<OrbV7State>;
  emotionRef: React.MutableRefObject<OrbV7Emotion>;
  progressRef: React.MutableRefObject<number>;
  audioRef: React.MutableRefObject<AudioData>;
  starCount?: number;
  nebulaRadius?: number;
}

export function CosmicBackground({
  stateRef,
  emotionRef,
  progressRef,
  audioRef,
  starCount = 1500,
  nebulaRadius = 100,
}: CosmicBackgroundProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Slow parallax rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.005;
    }
  });

  // Star counts per layer (front to back)
  const starsPerLayer = Math.floor(starCount / 3);

  return (
    <group ref={groupRef}>
      {/* Nebula background */}
      <NebulaSphere
        radius={nebulaRadius}
        emotionRef={emotionRef}
        opacity={0.15}
      />

      {/* Star layers (parallax effect through different distances) */}
      <StarLayer
        count={starsPerLayer}
        minRadius={40}
        maxRadius={60}
        emotionRef={emotionRef}
        opacity={0.9}
      />
      <StarLayer
        count={starsPerLayer}
        minRadius={60}
        maxRadius={80}
        emotionRef={emotionRef}
        opacity={0.7}
      />
      <StarLayer
        count={starsPerLayer}
        minRadius={80}
        maxRadius={95}
        emotionRef={emotionRef}
        opacity={0.5}
      />
    </group>
  );
}

export default CosmicBackground;
