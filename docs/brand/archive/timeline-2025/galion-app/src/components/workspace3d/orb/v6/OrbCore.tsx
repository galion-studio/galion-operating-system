/**
 * GALION Orb V6 - Core Component
 *
 * The central plasma sphere - the heart of the orb.
 * Uses custom shaders for organic, flowing appearance.
 */

'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbColors } from './types';

// =============================================================================
// SHADERS
// =============================================================================

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColorPrimary;
  uniform vec3 uColorSecondary;
  uniform vec3 uColorCore;
  uniform float uEnergy;
  uniform float uAudioLevel;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  // Simplex noise
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
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    // Organic flowing noise
    float noise1 = snoise(vPosition * 2.0 + uTime * 0.3);
    float noise2 = snoise(vPosition * 4.0 - uTime * 0.2);
    float combinedNoise = noise1 * 0.6 + noise2 * 0.4;

    // Audio reactive pulse
    float audioPulse = 1.0 + uAudioLevel * 0.3;

    // Fresnel for edge glow
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);

    // Color mixing
    float colorMix = (combinedNoise + 1.0) * 0.5;
    vec3 color = mix(uColorPrimary, uColorSecondary, colorMix);

    // Add core brightness
    float coreBrightness = 1.0 - length(vPosition) * 0.8;
    color = mix(color, uColorCore, coreBrightness * 0.5);

    // Energy and audio brightness
    float brightness = 1.0 + uEnergy * 0.4 + uAudioLevel * 0.3;
    color *= brightness * audioPulse;

    // Add fresnel glow at edges
    color += uColorCore * fresnel * 0.8;

    // Alpha with depth
    float alpha = 0.85 + fresnel * 0.15;

    gl_FragColor = vec4(color, alpha);
  }
`;

// =============================================================================
// COMPONENT
// =============================================================================

interface OrbCoreProps {
  colors: OrbColors;
  energy: number;
  audioLevel: number;
  size?: number;
}

export function OrbCore({ colors, energy, audioLevel, size = 1.0 }: OrbCoreProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Create uniforms once
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorPrimary: { value: new THREE.Color(colors.primary) },
    uColorSecondary: { value: new THREE.Color(colors.secondary) },
    uColorCore: { value: new THREE.Color(colors.core) },
    uEnergy: { value: energy },
    uAudioLevel: { value: audioLevel },
  }), []);

  // Animation loop
  useFrame((state, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    const time = state.clock.elapsedTime;

    // Update time
    materialRef.current.uniforms.uTime.value = time;

    // Smooth color transitions
    materialRef.current.uniforms.uColorPrimary.value.lerp(
      new THREE.Color(colors.primary),
      delta * 3
    );
    materialRef.current.uniforms.uColorSecondary.value.lerp(
      new THREE.Color(colors.secondary),
      delta * 3
    );
    materialRef.current.uniforms.uColorCore.value.lerp(
      new THREE.Color(colors.core),
      delta * 3
    );

    // Smooth energy transition
    materialRef.current.uniforms.uEnergy.value +=
      (energy - materialRef.current.uniforms.uEnergy.value) * delta * 3;

    // Smooth audio level transition
    materialRef.current.uniforms.uAudioLevel.value +=
      (audioLevel - materialRef.current.uniforms.uAudioLevel.value) * delta * 8;

    // Breathing animation
    const breathe = Math.sin(time * 0.5) * 0.02 + 1;
    const audioScale = 1 + audioLevel * 0.1;
    meshRef.current.scale.setScalar(size * breathe * audioScale);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default OrbCore;
