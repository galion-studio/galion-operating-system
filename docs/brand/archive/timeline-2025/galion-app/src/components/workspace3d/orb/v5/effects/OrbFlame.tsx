/**
 * GALION Orb V5.2 - Flame Effect Component
 *
 * Consciousness flame effect - golden awareness fire that emanates
 * from the orb during high-energy states and transcendent emotions.
 */

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getEmotionConfig } from "../config/emotions";
import { getStateConfig } from "../config/states";
import { OrbState } from "../types";
import { Emotion } from "../types/emotion.types";

// ============================================================================
// FLAME SHADER
// ============================================================================

const flameVertexShader = `
  uniform float uTime;
  uniform float uIntensity;
  
  varying vec2 vUv;
  varying float vDisplacement;
  
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
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    vUv = uv;
    
    // Create flame displacement
    float noise1 = snoise(vec3(position.x * 2.0, position.y * 1.5 - uTime * 2.0, uTime * 0.5));
    float noise2 = snoise(vec3(position.x * 4.0, position.y * 3.0 - uTime * 3.0, uTime * 0.3));
    
    // Displacement increases toward the top
    float heightFactor = smoothstep(0.0, 1.0, uv.y);
    vDisplacement = (noise1 * 0.5 + noise2 * 0.3) * heightFactor * uIntensity;
    
    // Apply displacement
    vec3 pos = position;
    pos.x += vDisplacement * 0.3;
    pos.z += vDisplacement * 0.2;
    
    // Taper toward top
    float taper = 1.0 - pow(uv.y, 1.5);
    pos.xz *= taper;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const flameFragmentShader = `
  uniform vec3 uColorInner;
  uniform vec3 uColorOuter;
  uniform vec3 uColorTip;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uOpacity;
  
  varying vec2 vUv;
  varying float vDisplacement;
  
  void main() {
    // Gradient from bottom to top
    float gradient = vUv.y;
    
    // Add noise variation
    float variation = vDisplacement * 0.5 + 0.5;
    
    // Color interpolation: inner → outer → tip
    vec3 color;
    if (gradient < 0.4) {
      color = mix(uColorInner, uColorOuter, gradient / 0.4);
    } else {
      color = mix(uColorOuter, uColorTip, (gradient - 0.4) / 0.6);
    }
    
    // Add brightness variation
    color *= 0.8 + variation * 0.4;
    
    // Fade out at edges and top
    float edgeFade = smoothstep(0.0, 0.3, 0.5 - abs(vUv.x - 0.5));
    float topFade = 1.0 - pow(gradient, 2.0);
    float alpha = edgeFade * topFade * uOpacity * uIntensity;
    
    // Flicker effect
    alpha *= 0.9 + sin(uTime * 15.0 + vUv.y * 10.0) * 0.1;

    // FRESNEL TRANSPARENCY (Added) - Make center transparent
    // Need viewDirection in fragment shader? 
    // Or approximate with gradient.
    // Let's use simple U-gradient fade for now as we don't have normals here handy in this shader setup easily.
    // vUv.x is 0..1 around the cone. 0.5 is center front? No, it wraps.
    // Cone UVs: u is angular, v is height.
    // To make "front" transparent, we need normal/viewDir.
    // But since it's additive, just reducing Alpha overall is safer.
    
    alpha *= 0.4; // DRASTICALLY REDUCE OPACITY
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// TYPES
// ============================================================================

interface OrbFlameProps {
  state: OrbState;
  stateRef?: React.MutableRefObject<OrbState>;
  emotion: Emotion;
  emotionRef?: React.MutableRefObject<Emotion>;
  radius?: number;
  height?: number;
  opacity?: number;
  animationProgress?: number;
  animationProgressRef?: React.MutableRefObject<number>;
  audioRef?: React.MutableRefObject<any>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrbFlame({
  state,
  stateRef,
  emotion,
  emotionRef,
  radius = 1.0,
  height = 1.5,
  opacity = 0.7,
  animationProgress = 0,
  animationProgressRef,
  audioRef,
}: OrbFlameProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const emotionConfig = getEmotionConfig(emotion);
  const stateConfig = getStateConfig(state);

  // Create stable initial colors using refs
  const colorInnerRef = useRef(new THREE.Color(emotionConfig.colors.primary).multiplyScalar(1.5));
  const colorOuterRef = useRef(new THREE.Color(emotionConfig.colors.accent));
  const colorTipRef = useRef(new THREE.Color(emotionConfig.colors.glow).multiplyScalar(0.5));

  // Flame geometry (cone shape)
  const geometry = useMemo(() => {
    return new THREE.ConeGeometry(radius * 0.6, height, 32, 16, true);
  }, [radius, height]);

  // Shader material - create once
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorInner: { value: colorInnerRef.current },
        uColorOuter: { value: colorOuterRef.current },
        uColorTip: { value: colorTipRef.current },
        uIntensity: { value: 0.5 },
        uOpacity: { value: opacity },
      },
      vertexShader: flameVertexShader,
      fragmentShader: flameFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [opacity]); // Only recreate if opacity changes

  // Animation
  useFrame((_, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    // Get dynamic state
    const currentState = stateRef?.current || state;
    const currentEmotion = emotionRef?.current || emotion;
    const currentEmotionConfig = getEmotionConfig(currentEmotion);
    const currentStateConfig = getStateConfig(currentState);

    // Determine visibility (Always render, but toggle visibility via prop)
    const shouldRender = true;

    // Show if emotion is NOT neutral OR if state has energy
    // Note: getEmotionConfig(currentEmotion).tier cannot be 'neutral' as it's not a tier.
    meshRef.current.visible = true; // ALWAYS RENDER FLAME
    if (!meshRef.current.visible) return; // Optimization: don't compute if hidden

    // Get current audio level from ref
    const currentAudioLevel = audioRef?.current?.analysis?.level || 0;

    // Update time
    materialRef.current.uniforms.uTime.value += delta;
    // Update colors smoothly toward current emotion colors
    const targetInner = new THREE.Color(currentEmotionConfig.colors.primary).multiplyScalar(1.5);
    const targetOuter = new THREE.Color(currentEmotionConfig.colors.accent);
    const targetTip = new THREE.Color(currentEmotionConfig.colors.glow).multiplyScalar(0.5);
    materialRef.current.uniforms.uColorInner.value.lerp(targetInner, delta * 2);
    materialRef.current.uniforms.uColorOuter.value.lerp(targetOuter, delta * 2);
    materialRef.current.uniforms.uColorTip.value.lerp(targetTip, delta * 2);

    // Intensity based on state energy and audio
    const baseIntensity =
      currentStateConfig.visual.glowIntensity * 0.8 +
      currentStateConfig.visual.neuralActivity * 0.4;
    const audioIntensity = currentAudioLevel * 0.5;
    const targetIntensity = baseIntensity + audioIntensity;

    materialRef.current.uniforms.uIntensity.value +=
      (targetIntensity - materialRef.current.uniforms.uIntensity.value) *
      delta *
      3;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, radius * 0.8, 0]} visible={true}>
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}

export default OrbFlame;
