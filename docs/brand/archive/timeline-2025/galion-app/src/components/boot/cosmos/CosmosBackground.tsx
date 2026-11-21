/**
 * GALION Cosmos Background - Infinite Space Visualization
 *
 * A stunning deep space cosmos background with 5 visual layers:
 * - Layer 1: Deep Space (50,000 twinkling stars)
 * - Layer 2: Nebula Clouds (5 nebulae with custom shaders)
 * - Layer 3: Galactic Core (warm golden glow with spiral rotation)
 * - Layer 4: Dust Lanes (parallax scrolling)
 * - Layer 5: Star Clusters (10 clusters with 50-200 stars each)
 *
 * Effects: Bloom, God Rays, Vignette, Film Grain
 *
 * Based on BACKEND5.4.2FINAL.md Master Blueprint
 */

'use client';

import { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// ============================================================================
// CONFIGURATION
// ============================================================================

const COSMOS_CONFIG = {
  // Layer 1: Deep Space
  deepSpace: {
    color: '#0A0A15',
    starCount: 50000,
    starSizeRange: [0.5, 2.0],
    parallaxSpeed: 0.002,
  },
  // Layer 2: Nebulae
  nebulae: {
    count: 5,
    colors: ['#4A0080', '#800040', '#004080'],
    opacity: 0.3,
    driftSpeed: 0.02,
  },
  // Layer 3: Galactic Core
  galacticCore: {
    position: [0, 0, -1000] as [number, number, number],
    color: '#FFE4B5',
    size: 200,
    glowIntensity: 2.0,
    rotationSpeed: 0.005,
  },
  // Layer 4: Dust Lanes
  dustLanes: {
    count: 3,
    opacity: 0.15,
    parallaxSpeed: 0.01,
  },
  // Layer 5: Star Clusters
  starClusters: {
    count: 10,
    starsPerCluster: [50, 200] as [number, number],
    colors: ['#FFFFFF', '#87CEEB', '#FFD700'],
  },
  // Effects
  effects: {
    bloom: { intensity: 0.8, luminanceThreshold: 0.6, luminanceSmoothing: 0.5 },
    vignette: { darkness: 0.4, offset: 0.3 },
    filmGrain: { opacity: 0.02 },
  },
};

// ============================================================================
// SHADER DEFINITIONS
// ============================================================================

// Deep Space Star Shader
const deepSpaceStarVertexShader = `
uniform float uTime;
uniform float uSize;

attribute float aSize;
attribute float aBrightness;
attribute float aTwinkleSpeed;
attribute float aTwinklePhase;
attribute vec3 aColor;

varying float vBrightness;
varying float vTwinkle;
varying vec3 vColor;

void main() {
  vBrightness = aBrightness;
  vColor = aColor;

  // Twinkle effect with variation
  float twinkleBase = sin(uTime * aTwinkleSpeed + aTwinklePhase);
  float twinkleSecondary = sin(uTime * aTwinkleSpeed * 1.7 + aTwinklePhase * 0.7);
  vTwinkle = (twinkleBase * 0.3 + twinkleSecondary * 0.1) + 0.7;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // Size attenuation with distance
  float size = aSize * uSize * (400.0 / -mvPosition.z);
  gl_PointSize = clamp(size, 0.5, 8.0);

  gl_Position = projectionMatrix * mvPosition;
}
`;

const deepSpaceStarFragmentShader = `
uniform float uOpacity;

varying float vBrightness;
varying float vTwinkle;
varying vec3 vColor;

void main() {
  // Circular point with soft falloff
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  if (dist > 0.5) discard;

  // Soft radial gradient
  float alpha = smoothstep(0.5, 0.1, dist);

  // Hot white core
  float core = smoothstep(0.2, 0.0, dist);
  vec3 color = vColor * vBrightness * vTwinkle;
  color += vec3(1.0) * core * 0.6;

  // Add subtle chromatic aberration
  float r = smoothstep(0.3, 0.0, dist);
  color.r += r * 0.05;

  gl_FragColor = vec4(color, alpha * uOpacity * vBrightness * vTwinkle);
}
`;

// Nebula Shader with FBM Noise
const nebulaVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vPosition = position;
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const nebulaFragmentShader = `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uOpacity;
uniform float uDrift;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vWorldPosition;

// Improved noise functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 6; i++) {
    value += amplitude * snoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value;
}

void main() {
  // Spherical position for seamless clouds
  vec3 spherePos = normalize(vPosition);

  // Animated noise layers with drift
  float drift = uTime * uDrift;
  float n1 = fbm(spherePos * 2.0 + vec3(drift, drift * 0.7, 0.0));
  float n2 = fbm(spherePos * 4.0 + vec3(-drift * 0.5, drift * 0.3, drift));
  float n3 = fbm(spherePos * 8.0 + vec3(drift * 0.3, -drift * 0.2, drift * 0.5));

  // Cloud density with flow
  float density = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
  density = smoothstep(0.2, 0.8, density * 0.5 + 0.5);

  // Triple color gradient based on density
  vec3 color = mix(uColor1, uColor2, smoothstep(0.3, 0.6, density));
  color = mix(color, uColor3, smoothstep(0.5, 0.9, density + n1 * 0.3));

  // Add glow at cloud edges
  float glow = smoothstep(0.4, 0.6, density) * (1.0 - smoothstep(0.6, 0.8, density));
  color += vec3(0.2, 0.1, 0.3) * glow * 2.0;

  // Brightness variation
  float brightness = 0.8 + n1 * 0.4;
  color *= brightness;

  // Alpha based on density and opacity
  float alpha = density * uOpacity * 0.6;

  gl_FragColor = vec4(color, alpha);
}
`;

// Galactic Core Shader with God Rays
const galacticCoreVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const galacticCoreFragmentShader = `
uniform float uTime;
uniform vec3 uCoreColor;
uniform float uIntensity;
uniform float uRotation;

varying vec2 vUv;
varying vec3 vPosition;

// Spiral pattern
float spiral(vec2 uv, float arms, float tightness) {
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float spiral = sin(angle * arms - radius * tightness + uTime * 0.2);
  return spiral * 0.5 + 0.5;
}

void main() {
  vec2 centeredUv = vUv - 0.5;

  // Rotate over time
  float s = sin(uRotation);
  float c = cos(uRotation);
  centeredUv = mat2(c, -s, s, c) * centeredUv;

  float radius = length(centeredUv);

  // Core glow with falloff
  float coreGlow = 1.0 - smoothstep(0.0, 0.5, radius);
  coreGlow = pow(coreGlow, 2.0);

  // Spiral arms glow
  float spiralArms = spiral(centeredUv, 3.0, 10.0);
  float spiralGlow = spiralArms * (1.0 - smoothstep(0.1, 0.5, radius));

  // God rays effect
  float rays = 0.0;
  for (int i = 0; i < 8; i++) {
    float angle = float(i) * 0.785398 + uTime * 0.1;
    vec2 rayDir = vec2(cos(angle), sin(angle));
    float rayDist = abs(dot(centeredUv, rayDir));
    rays += smoothstep(0.15, 0.0, rayDist) * (1.0 - radius);
  }
  rays *= 0.3;

  // Combine effects
  float totalGlow = coreGlow + spiralGlow * 0.5 + rays;
  totalGlow *= uIntensity;

  // Color gradient from hot center to warm outer
  vec3 hotColor = vec3(1.0, 1.0, 0.95);
  vec3 color = mix(uCoreColor, hotColor, coreGlow * 0.5);
  color *= totalGlow;

  // Soft alpha falloff
  float alpha = smoothstep(0.6, 0.0, radius) * totalGlow * 0.8;

  gl_FragColor = vec4(color, alpha);
}
`;

// Dust Lane Shader
const dustLaneVertexShader = `
uniform float uTime;
uniform float uParallax;

attribute float aSize;
attribute float aDensity;
attribute float aPhase;

varying float vDensity;
varying float vFade;

void main() {
  vDensity = aDensity;

  // Parallax movement
  vec3 pos = position;
  pos.x += sin(uTime * 0.1 + aPhase) * 10.0 * uParallax;
  pos.z += cos(uTime * 0.08 + aPhase * 1.3) * 5.0 * uParallax;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Size with distance
  float size = aSize * (300.0 / -mvPosition.z);
  gl_PointSize = clamp(size, 2.0, 30.0);

  // Fade with distance
  vFade = smoothstep(2000.0, 500.0, -mvPosition.z);

  gl_Position = projectionMatrix * mvPosition;
}
`;

const dustLaneFragmentShader = `
uniform float uOpacity;
uniform vec3 uDustColor;

varying float vDensity;
varying float vFade;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  if (dist > 0.5) discard;

  // Soft cloud appearance
  float alpha = smoothstep(0.5, 0.0, dist);
  alpha *= vDensity * uOpacity * vFade;

  // Dark dust color
  vec3 color = uDustColor * 0.3;

  gl_FragColor = vec4(color, alpha * 0.4);
}
`;

// Star Cluster Shader
const clusterStarVertexShader = `
uniform float uTime;
uniform float uSize;

attribute float aSize;
attribute float aBrightness;
attribute float aTwinkle;
attribute vec3 aColor;

varying float vBrightness;
varying float vTwinkle;
varying vec3 vColor;

void main() {
  vBrightness = aBrightness;
  vColor = aColor;

  // More prominent twinkle for cluster stars
  vTwinkle = sin(uTime * aTwinkle * 2.0) * 0.4 + 0.6;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  float size = aSize * uSize * (200.0 / -mvPosition.z);
  gl_PointSize = clamp(size, 1.0, 10.0);

  gl_Position = projectionMatrix * mvPosition;
}
`;

const clusterStarFragmentShader = `
uniform float uOpacity;

varying float vBrightness;
varying float vTwinkle;
varying vec3 vColor;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  if (dist > 0.5) discard;

  float alpha = smoothstep(0.5, 0.05, dist);
  float core = smoothstep(0.15, 0.0, dist);

  vec3 color = vColor * vBrightness * vTwinkle;
  color += vec3(1.0) * core * 0.7;

  gl_FragColor = vec4(color, alpha * uOpacity * vBrightness * vTwinkle);
}
`;

// ============================================================================
// LAYER 1: DEEP SPACE STARS (50,000 stars)
// ============================================================================

interface DeepSpaceLayerProps {
  count: number;
  minRadius: number;
  maxRadius: number;
  opacity: number;
}

function DeepSpaceLayer({ count, minRadius, maxRadius, opacity }: DeepSpaceLayerProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const brightness = new Float32Array(count);
    const twinkleSpeeds = new Float32Array(count);
    const twinklePhases = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const colorOptions = [
      new THREE.Color('#FFFFFF'), // White
      new THREE.Color('#E6F0FF'), // Blue-white
      new THREE.Color('#FFE4C4'), // Warm white
      new THREE.Color('#87CEEB'), // Light blue
    ];

    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = minRadius + Math.random() * (maxRadius - minRadius);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Size distribution (mostly small, few bright)
      const [minSize, maxSize] = COSMOS_CONFIG.deepSpace.starSizeRange;
      sizes[i] = minSize + Math.pow(Math.random(), 3) * (maxSize - minSize);

      // Brightness
      brightness[i] = 0.3 + Math.random() * 0.7;

      // Twinkle variation
      twinkleSpeeds[i] = 0.5 + Math.random() * 3.0;
      twinklePhases[i] = Math.random() * Math.PI * 2;

      // Star color
      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1));
    geo.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));
    geo.setAttribute('aTwinklePhase', new THREE.BufferAttribute(twinklePhases, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

    const unis = {
      uTime: { value: 0 },
      uSize: { value: 1.5 },
      uOpacity: { value: opacity },
    };

    return { geometry: geo, uniforms: unis };
  }, [count, minRadius, maxRadius, opacity]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    // Slow parallax rotation
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * COSMOS_CONFIG.deepSpace.parallaxSpeed;
      pointsRef.current.rotation.x += delta * COSMOS_CONFIG.deepSpace.parallaxSpeed * 0.3;
    }
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <points ref={pointsRef} geometry={geometry} renderOrder={0}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={deepSpaceStarVertexShader}
        fragmentShader={deepSpaceStarFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ============================================================================
// LAYER 2: NEBULA CLOUDS
// ============================================================================

interface NebulaSphereProps {
  radius: number;
  colors: [string, string, string];
  opacity: number;
  rotationOffset: number;
}

function NebulaSphere({ radius, colors, opacity, rotationOffset }: NebulaSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(colors[0]) },
      uColor2: { value: new THREE.Color(colors[1]) },
      uColor3: { value: new THREE.Color(colors[2]) },
      uOpacity: { value: opacity },
      uDrift: { value: COSMOS_CONFIG.nebulae.driftSpeed },
    }),
    [colors, opacity]
  );

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.003;
      meshRef.current.rotation.x = rotationOffset;
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={-2}>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={nebulaVertexShader}
        fragmentShader={nebulaFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function NebulaLayer() {
  const config = COSMOS_CONFIG.nebulae;
  const baseColors = config.colors;

  // Create 5 nebula spheres at different positions and sizes
  const nebulae = useMemo(() => {
    return Array.from({ length: config.count }, (_, i) => ({
      radius: 200 + i * 50,
      colors: [
        baseColors[i % 3],
        baseColors[(i + 1) % 3],
        baseColors[(i + 2) % 3],
      ] as [string, string, string],
      rotationOffset: (i / config.count) * Math.PI * 0.5,
      opacity: config.opacity * (1 - i * 0.1),
    }));
  }, [config, baseColors]);

  return (
    <group>
      {nebulae.map((nebula, i) => (
        <NebulaSphere key={i} {...nebula} />
      ))}
    </group>
  );
}

// ============================================================================
// LAYER 3: GALACTIC CORE
// ============================================================================

function GalacticCoreLayer() {
  const config = COSMOS_CONFIG.galacticCore;
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const rotationRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCoreColor: { value: new THREE.Color(config.color) },
      uIntensity: { value: config.glowIntensity },
      uRotation: { value: 0 },
    }),
    [config]
  );

  useFrame((state, delta) => {
    rotationRef.current += delta * config.rotationSpeed;

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uRotation.value = rotationRef.current;
    }
  });

  return (
    <group position={config.position}>
      {/* Core glow sphere */}
      <mesh ref={meshRef}>
        <planeGeometry args={[config.size * 2, config.size * 2]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={galacticCoreVertexShader}
          fragmentShader={galacticCoreFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Bright center point light */}
      <pointLight color={config.color} intensity={3} distance={500} decay={2} />

      {/* Inner hot core */}
      <mesh>
        <sphereGeometry args={[config.size * 0.05, 32, 32]} />
        <meshBasicMaterial color="#FFFAF0" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

// ============================================================================
// LAYER 4: DUST LANES
// ============================================================================

function DustLaneLayer() {
  const config = COSMOS_CONFIG.dustLanes;
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const particleCount = 3000;

  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const densities = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Distribute in lanes across the view
      const laneIndex = Math.floor(i / (particleCount / config.count));
      const laneOffset = (laneIndex - 1) * 300;

      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = laneOffset + (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = -200 - Math.random() * 1500;

      sizes[i] = 5 + Math.random() * 20;
      densities[i] = 0.2 + Math.random() * 0.8;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aDensity', new THREE.BufferAttribute(densities, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    const unis = {
      uTime: { value: 0 },
      uOpacity: { value: config.opacity },
      uParallax: { value: config.parallaxSpeed },
      uDustColor: { value: new THREE.Color('#1a1a2e') },
    };

    return { geometry: geo, uniforms: unis };
  }, [config, particleCount]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <points ref={pointsRef} geometry={geometry} renderOrder={-1}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={dustLaneVertexShader}
        fragmentShader={dustLaneFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

// ============================================================================
// LAYER 5: STAR CLUSTERS
// ============================================================================

interface StarClusterProps {
  position: [number, number, number];
  starCount: number;
  radius: number;
  colorIndex: number;
}

function StarCluster({ position, starCount, radius, colorIndex }: StarClusterProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const clusterColors = COSMOS_CONFIG.starClusters.colors;

  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const brightness = new Float32Array(starCount);
    const twinkle = new Float32Array(starCount);
    const colors = new Float32Array(starCount * 3);

    const baseColor = new THREE.Color(clusterColors[colorIndex % clusterColors.length]);

    for (let i = 0; i < starCount; i++) {
      // Gaussian distribution for cluster stars
      const r = radius * Math.sqrt(-2.0 * Math.log(Math.random())) * 0.3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      sizes[i] = 0.5 + Math.pow(Math.random(), 2) * 3;
      brightness[i] = 0.5 + Math.random() * 0.5;
      twinkle[i] = 1 + Math.random() * 3;

      // Slight color variation
      const colorVariation = 0.9 + Math.random() * 0.2;
      colors[i * 3] = baseColor.r * colorVariation;
      colors[i * 3 + 1] = baseColor.g * colorVariation;
      colors[i * 3 + 2] = baseColor.b * colorVariation;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1));
    geo.setAttribute('aTwinkle', new THREE.BufferAttribute(twinkle, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

    const unis = {
      uTime: { value: 0 },
      uSize: { value: 2.0 },
      uOpacity: { value: 0.9 },
    };

    return { geometry: geo, uniforms: unis };
  }, [starCount, radius, colorIndex, clusterColors]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <group position={position}>
      <points ref={pointsRef} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={clusterStarVertexShader}
          fragmentShader={clusterStarFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function StarClusterLayer() {
  const config = COSMOS_CONFIG.starClusters;

  const clusters = useMemo(() => {
    return Array.from({ length: config.count }, (_, i) => {
      const [minStars, maxStars] = config.starsPerCluster;
      return {
        position: [
          (Math.random() - 0.5) * 600,
          (Math.random() - 0.5) * 400,
          -100 - Math.random() * 400,
        ] as [number, number, number],
        starCount: Math.floor(minStars + Math.random() * (maxStars - minStars)),
        radius: 20 + Math.random() * 40,
        colorIndex: i,
      };
    });
  }, [config]);

  return (
    <group>
      {clusters.map((cluster, i) => (
        <StarCluster key={i} {...cluster} />
      ))}
    </group>
  );
}

// ============================================================================
// POST-PROCESSING EFFECTS
// ============================================================================

function CosmosEffects() {
  const { bloom, vignette, filmGrain } = COSMOS_CONFIG.effects;

  return (
    <EffectComposer>
      <Bloom
        intensity={bloom.intensity}
        luminanceThreshold={bloom.luminanceThreshold}
        luminanceSmoothing={bloom.luminanceSmoothing}
        mipmapBlur
      />
      <Vignette
        darkness={vignette.darkness}
        offset={vignette.offset}
        eskil={false}
      />
      <Noise
        opacity={filmGrain.opacity}
        blendFunction={BlendFunction.OVERLAY}
      />
    </EffectComposer>
  );
}

// ============================================================================
// SCENE CONTENT
// ============================================================================

function CosmosSceneContent() {
  const { scene } = useThree();

  // Set background color
  useEffect(() => {
    scene.background = new THREE.Color(COSMOS_CONFIG.deepSpace.color);
  }, [scene]);

  return (
    <>
      {/* Camera position for infinite space feel */}
      {/* Layer 1: Deep Space (50,000 stars in 3 sub-layers) */}
      <DeepSpaceLayer
        count={Math.floor(COSMOS_CONFIG.deepSpace.starCount * 0.5)}
        minRadius={800}
        maxRadius={1500}
        opacity={0.6}
      />
      <DeepSpaceLayer
        count={Math.floor(COSMOS_CONFIG.deepSpace.starCount * 0.3)}
        minRadius={400}
        maxRadius={800}
        opacity={0.8}
      />
      <DeepSpaceLayer
        count={Math.floor(COSMOS_CONFIG.deepSpace.starCount * 0.2)}
        minRadius={200}
        maxRadius={400}
        opacity={1.0}
      />

      {/* Layer 2: Nebula Clouds */}
      <NebulaLayer />

      {/* Layer 3: Galactic Core with God Rays */}
      <GalacticCoreLayer />

      {/* Layer 4: Dust Lanes */}
      <DustLaneLayer />

      {/* Layer 5: Star Clusters */}
      <StarClusterLayer />

      {/* Post-Processing Effects */}
      <CosmosEffects />
    </>
  );
}

// ============================================================================
// MAIN EXPORT COMPONENT
// ============================================================================

export interface CosmosBackgroundProps {
  className?: string;
  starCount?: number;
  nebulaOpacity?: number;
  bloomIntensity?: number;
  interactive?: boolean;
}

export function CosmosBackground({
  className = '',
  starCount,
  nebulaOpacity,
  bloomIntensity,
  interactive = false,
}: CosmosBackgroundProps) {
  // Override config if props provided
  if (starCount !== undefined) {
    COSMOS_CONFIG.deepSpace.starCount = starCount;
  }
  if (nebulaOpacity !== undefined) {
    COSMOS_CONFIG.nebulae.opacity = nebulaOpacity;
  }
  if (bloomIntensity !== undefined) {
    COSMOS_CONFIG.effects.bloom.intensity = bloomIntensity;
  }

  return (
    <div
      className={`fixed inset-0 -z-10 ${className}`}
      style={{ background: COSMOS_CONFIG.deepSpace.color }}
    >
      <Canvas
        camera={{
          position: [0, 0, 50],
          fov: 75,
          near: 0.1,
          far: 5000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <CosmosSceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}

// ============================================================================
// STANDALONE 3D COMPONENT (for embedding in existing Canvas)
// ============================================================================

export interface CosmosBackground3DProps {
  starCount?: number;
  nebulaOpacity?: number;
  includeEffects?: boolean;
}

export function CosmosBackground3D({
  starCount = 50000,
  nebulaOpacity = 0.3,
  includeEffects = true,
}: CosmosBackground3DProps) {
  // Override config
  COSMOS_CONFIG.deepSpace.starCount = starCount;
  COSMOS_CONFIG.nebulae.opacity = nebulaOpacity;

  return (
    <group>
      {/* Layer 1: Deep Space */}
      <DeepSpaceLayer
        count={Math.floor(starCount * 0.5)}
        minRadius={800}
        maxRadius={1500}
        opacity={0.6}
      />
      <DeepSpaceLayer
        count={Math.floor(starCount * 0.3)}
        minRadius={400}
        maxRadius={800}
        opacity={0.8}
      />
      <DeepSpaceLayer
        count={Math.floor(starCount * 0.2)}
        minRadius={200}
        maxRadius={400}
        opacity={1.0}
      />

      {/* Layer 2: Nebula Clouds */}
      <NebulaLayer />

      {/* Layer 3: Galactic Core */}
      <GalacticCoreLayer />

      {/* Layer 4: Dust Lanes */}
      <DustLaneLayer />

      {/* Layer 5: Star Clusters */}
      <StarClusterLayer />

      {/* Effects */}
      {includeEffects && <CosmosEffects />}
    </group>
  );
}

export default CosmosBackground;

