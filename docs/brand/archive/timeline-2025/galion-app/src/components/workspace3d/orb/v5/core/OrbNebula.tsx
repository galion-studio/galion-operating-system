/**
 * GALION Orb V5.2 - Nebula Component
 * 
 * Inner consciousness clouds - emotional nebulae with depth
 */

'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Emotion } from '../types';
import { getEmotionConfig } from '../config/emotions';
import { BlendedEmotionResult } from '../types';

// ============================================================================
// SHADERS
// ============================================================================

const nebulaVertexShader = `
varying vec3 vPosition;
varying vec3 vNormal;
varying float vDepth;

void main() {
  vPosition = position;
  vNormal = normalize(normalMatrix * normal);
  vDepth = length(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const nebulaFragmentShader = `
uniform float uTime;
uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform vec3 uColorAccent;
uniform float uDensity;
uniform float uTurbulence;
uniform float uGlow;
uniform float uSpeed;
uniform float uNoiseScale;

varying vec3 vPosition;
varying vec3 vNormal;
varying float vDepth;

// FBM noise for volumetric clouds
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

// FBM (Fractal Brownian Motion) for layered clouds
float fbm(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

void main() {
  // Animated position
  vec3 animPos = vPosition * uNoiseScale;
  animPos += vec3(uTime * uSpeed * 0.1);
  
  // Turbulent displacement
  vec3 turbulence = vec3(
    snoise(animPos + uTime * 0.05),
    snoise(animPos + 100.0 + uTime * 0.05),
    snoise(animPos + 200.0 + uTime * 0.05)
  ) * uTurbulence;
  
  // Main cloud density using FBM
  float cloud = fbm(animPos + turbulence, 5);
  cloud = (cloud + 1.0) * 0.5; // Normalize to 0-1
  
  // Apply density control
  cloud = smoothstep(1.0 - uDensity, 1.0, cloud);
  
  // Secondary detail layer
  float detail = fbm(animPos * 2.0 + turbulence * 0.5, 3);
  detail = (detail + 1.0) * 0.5;
  
  // Combine layers
  float finalDensity = cloud * 0.7 + detail * 0.3;
  
  // Color gradient based on density and position
  float colorMix = finalDensity * 0.6 + (vPosition.y + 1.0) * 0.2;
  vec3 color = mix(uColorPrimary, uColorSecondary, colorMix);
  
  // Add accent highlights
  float highlight = pow(detail, 3.0);
  color = mix(color, uColorAccent, highlight * 0.4);
  
  // Inner glow based on depth
  float depthFade = smoothstep(0.0, 0.7, vDepth);
  float innerGlow = (1.0 - depthFade) * uGlow;
  color += uColorPrimary * innerGlow * 0.5;
  
  // Fresnel for edge definition
  float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
  
  // Final alpha
  float alpha = finalDensity * uDensity * (1.0 - fresnel * 0.3);
  alpha *= 0.35; // Reduced for layering without white-out
  
  gl_FragColor = vec4(color, alpha);
}
`;

// ============================================================================
// COMPONENT
// ============================================================================

export interface OrbNebulaProps {
  /** Current emotion (initial value if ref provided) */
  emotion?: Emotion;
  /** Blended emotion result (initial value if ref provided) */
  blendedResult?: BlendedEmotionResult;
  /** Emotion Ref for dynamic updates without re-renders */
  emotionRef?: React.MutableRefObject<Emotion>;
  /** Blended Result Ref for dynamic updates */
  blendedResultRef?: React.MutableRefObject<BlendedEmotionResult>;
  /** Nebula size */
  size?: number;
  /** Number of nebula layers */
  layers?: number;
  /** Enable animations */
  animate?: boolean;
  /** Animation progress (0-1) */
  animationProgress?: number;
  /** Animation Progress Ref */
  animationProgressRef?: React.MutableRefObject<number>;
  /** Audio data ref */
  audioRef?: React.MutableRefObject<any>;
}

export function OrbNebula({
  emotion = 'neutral',
  blendedResult,
  emotionRef,
  blendedResultRef,
  size = 0.75,
  layers = 3,
  animate = true,
  animationProgress = 0,
  animationProgressRef,
  audioRef,
}: OrbNebulaProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<THREE.ShaderMaterial[]>([]);

  // Initial config
  const initialEmotion = emotionRef?.current || emotion;
  const initialBlended = blendedResultRef?.current || blendedResult;
  const emotionConfig = getEmotionConfig(initialEmotion);
  const initialNebulaConfig = initialBlended?.nebula || emotionConfig.nebula;
  const initialColors = initialBlended?.colors || emotionConfig.colors;

  // Create layers
  const layerConfigs = useMemo(() => {
    return Array.from({ length: layers }, (_, i) => {
      const scale = size * (0.6 + i * 0.15);
      const offset = (i - (layers - 1) / 2) * 0.1;
      return { scale, offset, index: i };
    });
  }, [layers, size]);

  // Create uniforms for each layer
  const uniformsArray = useMemo(() => {
    return layerConfigs.map((config, i) => ({
      uTime: { value: 0 },
      uColorPrimary: { value: new THREE.Color(initialColors.primary) },
      uColorSecondary: { value: new THREE.Color(initialColors.secondary) },
      uColorAccent: { value: new THREE.Color(initialColors.accent) },
      uDensity: { value: initialNebulaConfig.density * (1 - i * 0.1) },
      uTurbulence: { value: initialNebulaConfig.turbulence },
      uGlow: { value: initialNebulaConfig.glow },
      uSpeed: { value: initialNebulaConfig.speed * (1 + i * 0.2) },
      uNoiseScale: { value: initialNebulaConfig.noiseScale * (1 + i * 0.3) },
    }));
  }, [layerConfigs, initialColors, initialNebulaConfig]);

  // Animation loop
  useFrame((state, delta) => {
    if (!animate) return;

    // READ DYNAMIC STATE FROM REFS
    const currentEmotion = emotionRef?.current || emotion;
    const currentBlended = blendedResultRef?.current || blendedResult;
    const currentProgress = animationProgressRef?.current ?? animationProgress;

    // Recalculate blended targets
    const currentConfig = getEmotionConfig(currentEmotion);
    const targetNebula = currentBlended?.nebula || currentConfig.nebula;
    const targetColors = currentBlended?.colors || currentConfig.colors;

    // Get current audio level from ref
    const currentAudioLevel = audioRef?.current?.analysis?.level || 0;

    const time = state.clock.elapsedTime;

    materialsRef.current.forEach((material, i) => {
      if (!material) return;

      material.uniforms.uTime.value = time;

      // Smoothly update colors
      const tPrimary = new THREE.Color(targetColors.primary);
      const tSecondary = new THREE.Color(targetColors.secondary);
      const tAccent = new THREE.Color(targetColors.accent);

      material.uniforms.uColorPrimary.value.lerp(tPrimary, delta * 2);
      material.uniforms.uColorSecondary.value.lerp(tSecondary, delta * 2);
      material.uniforms.uColorAccent.value.lerp(tAccent, delta * 2);

      // Update nebula properties with animation and audio reactivity
      const baseDensity = targetNebula.density * (1 - i * 0.1);
      const animationDensity = 1 + Math.sin(currentProgress * Math.PI * 2) * 0.2;
      const audioDensity = 1 + currentAudioLevel * 0.3;
      const targetDensity = baseDensity * animationDensity * audioDensity;
      material.uniforms.uDensity.value += (targetDensity - material.uniforms.uDensity.value) * delta * 2;

      // Turbulence enhanced by animation and audio
      const baseTurbulence = targetNebula.turbulence;
      const animationTurbulence = 1 + Math.sin(currentProgress * Math.PI * 4) * 0.3;
      const audioTurbulence = 1 + currentAudioLevel * 0.5;
      const targetTurbulence = baseTurbulence * animationTurbulence * audioTurbulence;
      material.uniforms.uTurbulence.value += (targetTurbulence - material.uniforms.uTurbulence.value) * delta * 2;

      // Glow enhanced by animation and audio
      const baseGlow = targetNebula.glow;
      const animationGlow = 1 + Math.sin(currentProgress * Math.PI * 6) * 0.4;
      const audioGlow = 1 + currentAudioLevel * 0.6;
      const targetGlow = baseGlow * animationGlow * audioGlow;
      material.uniforms.uGlow.value += (targetGlow - material.uniforms.uGlow.value) * delta * 2;

      // Speed enhanced by animation and audio
      const baseSpeed = targetNebula.speed * (1 + i * 0.2);
      const animationSpeed = 1 + Math.sin(currentProgress * Math.PI * 2) * 0.5;
      const audioSpeed = 1 + currentAudioLevel * 1.0;
      const targetSpeed = baseSpeed * animationSpeed * audioSpeed;
      material.uniforms.uSpeed.value += (targetSpeed - material.uniforms.uSpeed.value) * delta * 2;
    });

    // Enhanced rotation with animation and audio
    if (groupRef.current) {
      const baseRotation = delta * 0.01; // Slower base rotation
      const animationRotation = Math.sin(currentProgress * Math.PI * 2) * delta * 0.02;
      const audioRotation = currentAudioLevel * delta * 0.05;
      groupRef.current.rotation.y += baseRotation + animationRotation + audioRotation;
    }
  });

  return (
    <group ref={groupRef}>
      {layerConfigs.map((config, i) => (
        <mesh
          key={i}
          position={[0, config.offset, 0]}
          renderOrder={-10 + i}
        >
          <sphereGeometry args={[config.scale, 32, 32]} />
          <shaderMaterial
            ref={(el) => { if (el) materialsRef.current[i] = el; }}
            vertexShader={nebulaVertexShader}
            fragmentShader={nebulaFragmentShader}
            uniforms={uniformsArray[i]}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

export default OrbNebula;
