/**
 * GALION Orb V7.2 - Plasma Core Component
 *
 * The central consciousness sphere with animated plasma/energy core.
 * Features:
 * - Glowing plasma sphere with noise displacement
 * - Pulsing animation synced to audio/emotion
 * - Inner light source simulation
 * - Organic breathing animation
 */

'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbV7State, OrbV7Emotion, AudioData, getEmotionPalette } from '../types';

// ============================================================================
// SHADERS
// ============================================================================

const plasmaVertexShader = `
uniform float uTime;
uniform float uDisplacement;
uniform float uProgress;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying float vDisplacement;

// Simplex noise functions
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

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

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

void main() {
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;

  // Multi-octave noise for organic displacement
  float noise1 = snoise(position * 1.5 + uTime * 0.3) * 0.5;
  float noise2 = snoise(position * 3.0 - uTime * 0.2) * 0.25;
  float noise3 = snoise(position * 6.0 + uTime * 0.5) * 0.125;

  float totalNoise = (noise1 + noise2 + noise3) * uDisplacement * uProgress;
  vDisplacement = totalNoise;

  // Displace vertices along normal
  vec3 displaced = position + normal * totalNoise;
  vPosition = displaced;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

const plasmaFragmentShader = `
uniform float uTime;
uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform vec3 uColorAccent;
uniform float uEnergy;
uniform float uPulsePhase;
uniform float uProgress;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying float vDisplacement;

// Simplex noise (simplified for fragment)
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

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

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

void main() {
  // Fresnel effect for edge glow
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);

  // Animated plasma noise
  float noise = snoise(vPosition * 2.0 + uTime * 0.4);
  float noise2 = snoise(vPosition * 4.0 - uTime * 0.3);
  float combinedNoise = noise * 0.6 + noise2 * 0.4;

  // Pulse effect
  float pulse = sin(uTime * 2.0 + uPulsePhase) * 0.5 + 0.5;
  float fastPulse = sin(uTime * 5.0) * 0.3 + 0.7;

  // Color mixing based on noise and position
  float colorMix = (combinedNoise + 1.0) * 0.5;
  colorMix = smoothstep(0.2, 0.8, colorMix);

  vec3 baseColor = mix(uColorPrimary, uColorSecondary, colorMix);

  // Add accent color at peaks
  float peakIntensity = smoothstep(0.6, 1.0, combinedNoise);
  baseColor = mix(baseColor, uColorAccent, peakIntensity * 0.5);

  // Energy-based brightness
  float brightness = 1.0 + uEnergy * 0.4 + pulse * 0.2 * uEnergy;
  baseColor *= brightness;

  // Inner glow (center is brighter)
  float centerGlow = 1.0 - length(vPosition) * 0.8;
  centerGlow = max(centerGlow, 0.0);
  baseColor += uColorPrimary * centerGlow * 0.3 * uProgress;

  // Fresnel rim glow
  baseColor += uColorAccent * fresnel * 1.5 * uEnergy;

  // Add white-hot center core effect
  float coreIntensity = pow(centerGlow, 3.0) * uEnergy * 0.5;
  baseColor += vec3(1.0) * coreIntensity;

  // Alpha based on progress and fresnel
  float alpha = mix(0.85, 0.95, fresnel) * uProgress;
  alpha = min(alpha + coreIntensity * 0.3, 1.0);

  gl_FragColor = vec4(baseColor, alpha);
}
`;

// ============================================================================
// COMPONENT
// ============================================================================

export interface OrbPlasmaCoreProps {
  stateRef: React.MutableRefObject<OrbV7State>;
  emotionRef: React.MutableRefObject<OrbV7Emotion>;
  progressRef: React.MutableRefObject<number>;
  audioRef: React.MutableRefObject<AudioData>;
  size?: number;
}

export function OrbPlasmaCore({
  stateRef,
  emotionRef,
  progressRef,
  audioRef,
  size = 1.0,
}: OrbPlasmaCoreProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Reusable color objects to prevent memory allocation in useFrame
  const targetPrimary = useRef(new THREE.Color());
  const targetSecondary = useRef(new THREE.Color());
  const targetAccent = useRef(new THREE.Color());

  // Create uniforms once
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorPrimary: { value: new THREE.Color('#4F46E5') },
    uColorSecondary: { value: new THREE.Color('#06B6D4') },
    uColorAccent: { value: new THREE.Color('#8B5CF6') },
    uEnergy: { value: 0.5 },
    uPulsePhase: { value: 0 },
    uDisplacement: { value: 0.08 },
    uProgress: { value: 0 },
  }), []);

  // Animation loop
  useFrame((state, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    const time = state.clock.elapsedTime;
    const currentState = stateRef.current;
    const currentEmotion = emotionRef.current;
    const progress = progressRef.current;
    const audio = audioRef.current;

    // Get emotion palette
    const palette = getEmotionPalette(currentEmotion);

    // Update time
    materialRef.current.uniforms.uTime.value = time;

    // Smooth progress transition
    const currentProgress = materialRef.current.uniforms.uProgress.value;
    materialRef.current.uniforms.uProgress.value += (progress - currentProgress) * delta * 3;

    // Update colors smoothly
    targetPrimary.current.set(palette.primary);
    targetSecondary.current.set(palette.secondary);
    targetAccent.current.set(palette.accent);

    materialRef.current.uniforms.uColorPrimary.value.lerp(targetPrimary.current, delta * 2);
    materialRef.current.uniforms.uColorSecondary.value.lerp(targetSecondary.current, delta * 2);
    materialRef.current.uniforms.uColorAccent.value.lerp(targetAccent.current, delta * 2);

    // State-based energy
    let targetEnergy = 0.5;
    let targetDisplacement = 0.08;
    let pulseSpeed = 2;

    switch (currentState) {
      case 'dormant':
        targetEnergy = 0.2;
        targetDisplacement = 0.02;
        pulseSpeed = 0.5;
        break;
      case 'awakening':
        targetEnergy = 0.6;
        targetDisplacement = 0.1;
        pulseSpeed = 1.5;
        break;
      case 'expanding':
        targetEnergy = 0.8;
        targetDisplacement = 0.12;
        pulseSpeed = 2;
        break;
      case 'pulsing':
        targetEnergy = 0.9 + Math.sin(time * 3) * 0.1;
        targetDisplacement = 0.15;
        pulseSpeed = 3;
        break;
      case 'aware':
        targetEnergy = 0.85;
        targetDisplacement = 0.1;
        pulseSpeed = 2;
        break;
      case 'transcending':
        targetEnergy = 1.0;
        targetDisplacement = 0.2;
        pulseSpeed = 4;
        break;
      default:
        targetEnergy = 0.6;
        targetDisplacement = 0.08;
    }

    // Audio reactivity
    if (audio.level > 0.05) {
      targetEnergy += audio.level * 0.3;
      targetDisplacement += audio.level * 0.05;
    }

    // Smooth energy and displacement transitions
    materialRef.current.uniforms.uEnergy.value +=
      (targetEnergy - materialRef.current.uniforms.uEnergy.value) * delta * 4;
    materialRef.current.uniforms.uDisplacement.value +=
      (targetDisplacement - materialRef.current.uniforms.uDisplacement.value) * delta * 3;

    // Pulse phase
    materialRef.current.uniforms.uPulsePhase.value = time * pulseSpeed;

    // Breathing scale
    const breathe = Math.sin(time * 1.5) * 0.03 + 1;
    const audioScale = 1 + audio.level * 0.15;
    const progressScale = 0.3 + progress * 0.7;
    meshRef.current.scale.setScalar(size * breathe * audioScale * progressScale);
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
    <mesh ref={meshRef} renderOrder={10}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={plasmaVertexShader}
        fragmentShader={plasmaFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

export default OrbPlasmaCore;
