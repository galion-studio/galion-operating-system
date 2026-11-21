/**
 * GALION Orb V5.2 - Core Sphere Component
 *
 * The central consciousness sphere with plasma/energy core
 */

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getEmotionConfig } from "../config/emotions";
import { getStateConfig } from "../config/states";
import { Emotion, OrbState, QualityConfig } from "../types";

// ============================================================================
// SHADERS
// ============================================================================

const coreVertexShader = `
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

const coreFragmentShader = `
uniform float uTime;
uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform float uEnergy;
uniform float uPulsePhase;
uniform float uGlowIntensity;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

// Simplex noise for organic movement
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
  // Organic noise for plasma effect
  float noise = snoise(vPosition * 2.0 + uTime * 0.3);
  float noise2 = snoise(vPosition * 4.0 - uTime * 0.2);
  
  // Combine noise layers
  float combinedNoise = noise * 0.6 + noise2 * 0.4;
  
  // Pulse effect
  float pulse = sin(uTime * 3.0 + uPulsePhase) * 0.5 + 0.5;
  
  // Fresnel for edge glow
  float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
  
  // Color mixing based on position and noise
  float colorMix = (combinedNoise + 1.0) * 0.5;
  colorMix = colorMix * (1.0 - fresnel * 0.5);
  
  vec3 color = mix(uColorPrimary, uColorSecondary, colorMix);
  
  // Add energy-based brightness
  float brightness = 1.0 + uEnergy * 0.3 + pulse * 0.15 * uEnergy;
  color *= brightness;
  
  // Add fresnel glow
  color += uColorPrimary * fresnel * uGlowIntensity * 1.0;
  
  // Alpha based on fresnel (slightly transparent at center for depth)
  float alpha = 0.7 + fresnel * 0.15;
  
  gl_FragColor = vec4(color, alpha);
}
`;

// ============================================================================
// COMPONENT
// ============================================================================

export interface OrbCoreProps {
  /** Current state */
  state: OrbState;
  /** Current emotion */
  emotion: Emotion;
  /** State Ref for dynamic updates */
  stateRef?: React.MutableRefObject<OrbState>;
  /** Emotion Ref for dynamic updates */
  emotionRef?: React.MutableRefObject<Emotion>;
  /** Core size */
  size?: number;
  /** Quality config */
  quality?: QualityConfig;
  /** Animation progress (0-1) */
  animationProgress?: number;
  /** Animation Progress Ref */
  animationProgressRef?: React.MutableRefObject<number>;
  /** Audio data ref */
  audioRef?: React.MutableRefObject<any>;
  /** Custom primary color override */
  colorOverride?: string;
  /** Enable debug logs */
  debug?: boolean;
}

export function OrbCore({
  state = 'idle',
  emotion = 'neutral',
  stateRef,
  emotionRef,
  size = 0.8,
  quality,
  animationProgress = 0,
  animationProgressRef,
  audioRef,
  colorOverride,
  debug = false,
}: OrbCoreProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Initial setup using refs or props
  const initialState = stateRef?.current || state;
  const initialEmotion = emotionRef?.current || emotion;
  const stateConfig = getStateConfig(initialState);
  const emotionConfig = getEmotionConfig(initialEmotion);

  // Create shader material uniforms once - updates happen in useFrame
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorPrimary: {
        value: new THREE.Color(emotionConfig.colors.primary),
      },
      uColorSecondary: {
        value: new THREE.Color(emotionConfig.colors.secondary),
      },
      uEnergy: { value: emotionConfig.energy },
      uPulsePhase: { value: 0 },
      uGlowIntensity: { value: stateConfig.visual.glowIntensity },
    }),
    [] // Never recreate - all updates happen smoothly in useFrame
  );

  // Animation loop
  useFrame((frameState, delta) => {
    if (!materialRef.current) return;

    // READ DYNAMIC STATE
    const currentState = stateRef?.current || state;
    const currentEmotion = emotionRef?.current || emotion;

    // Get updated configs
    const currentScaleConfig = getStateConfig(currentState);
    const currentEmotionConfig = getEmotionConfig(currentEmotion);

    // Get current audio level from ref if available
    const currentAudioLevel = audioRef?.current?.analysis?.level || 0;

    const time = frameState.clock.elapsedTime;
    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uPulsePhase.value =
      (time / currentScaleConfig.visual.pulseRate) * Math.PI * 2;

    // Update colors smoothly
    const targetPrimary = new THREE.Color(
      colorOverride || currentEmotionConfig.colors.primary
    );
    materialRef.current.uniforms.uColorPrimary.value.lerp(
      targetPrimary,
      delta * 2
    );

    const targetSecondary = new THREE.Color(currentEmotionConfig.colors.secondary);
    materialRef.current.uniforms.uColorSecondary.value.lerp(
      targetSecondary,
      delta * 2
    );

    // Update energy based on state and audio
    const targetEnergy = currentEmotionConfig.energy + currentAudioLevel * 0.3;
    materialRef.current.uniforms.uEnergy.value +=
      (targetEnergy - materialRef.current.uniforms.uEnergy.value) * delta * 3;

    // Update glow intensity
    const targetGlow = currentScaleConfig.visual.glowIntensity;
    materialRef.current.uniforms.uGlowIntensity.value +=
      (targetGlow - materialRef.current.uniforms.uGlowIntensity.value) *
      delta *
      2;

    // Subtle breathing scale
    if (meshRef.current) {
      const breathe =
        Math.sin((time / currentScaleConfig.visual.pulseRate) * Math.PI * 2) * 0.02 +
        1;
      const audioScale = 1 + currentAudioLevel * 0.1;
      meshRef.current.scale.setScalar(size * breathe * audioScale);
    }

    // DEBUG: Log internal state occasionally to verify updates
    if (debug && frameState.clock.elapsedTime % 2 < 0.02) {
      console.log("[OrbCore] State:", {
        currentEmotion,
        targetPrimary: targetPrimary.getHexString(),
        currentUniform: materialRef.current.uniforms.uColorPrimary.value.getHexString()
      });
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={1}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={coreVertexShader}
        fragmentShader={coreFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={true}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default OrbCore;
