/**
 * GALION Orb V5.2 - Aurora Effect Component
 *
 * Northern lights atmospheric effect that wraps around the orb
 * during contemplative and transcendent emotional states.
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
// AURORA SHADER
// ============================================================================

const auroraVertexShader = `
  uniform float uTime;
  uniform float uWaveAmplitude;
  uniform float uWaveFrequency;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vWave;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    // Create flowing wave displacement
    float wave1 = sin(position.y * uWaveFrequency + uTime * 0.5) * uWaveAmplitude;
    float wave2 = sin(position.y * uWaveFrequency * 0.7 + uTime * 0.3 + 1.5) * uWaveAmplitude * 0.7;
    float wave3 = sin(position.x * uWaveFrequency * 0.5 + uTime * 0.4) * uWaveAmplitude * 0.5;
    
    vWave = wave1 + wave2 + wave3;
    
    // Apply wave to position
    vec3 pos = position;
    pos.x += vWave * 0.1;
    pos.z += vWave * 0.05;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const auroraFragmentShader = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uIntensity;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vWave;
  
  // Simplex noise for organic patterns
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  void main() {
    // Create flowing noise pattern
    float noise1 = snoise(vec2(vUv.x * 3.0, vUv.y * 2.0 + uTime * 0.1));
    float noise2 = snoise(vec2(vUv.x * 5.0, vUv.y * 3.0 - uTime * 0.15));
    float noise3 = snoise(vec2(vUv.x * 8.0, vUv.y * 5.0 + uTime * 0.08));
    
    float pattern = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2) * 0.5 + 0.5;
    
    // Create curtain effect (vertical bands)
    float curtain = sin(vUv.x * 20.0 + uTime * 0.5 + vWave * 2.0) * 0.5 + 0.5;
    curtain = pow(curtain, 3.0);
    
    // Color blending based on position and noise
    float colorMix1 = sin(vUv.y * 3.14159 + uTime * 0.2) * 0.5 + 0.5;
    float colorMix2 = sin(vUv.x * 3.14159 * 2.0 + uTime * 0.3) * 0.5 + 0.5;
    
    vec3 color = mix(uColor1, uColor2, colorMix1);
    color = mix(color, uColor3, colorMix2 * pattern);
    
    // Add shimmer
    color += vec3(0.1, 0.15, 0.2) * curtain * noise3;
    
    // Calculate alpha with curtain effect
    float baseAlpha = pattern * curtain * uOpacity * uIntensity;
    
    // Fade at edges
    float edgeFade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
    edgeFade *= smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
    
    float alpha = baseAlpha * edgeFade;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// TYPES
// ============================================================================

interface OrbAuroraProps {
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

export function OrbAurora({
  state,
  stateRef,
  emotion,
  emotionRef,
  radius = 1.5,
  height = 2.0,
  opacity = 0.5,
  animationProgress = 0,
  animationProgressRef,
  audioRef,
}: OrbAuroraProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Initial configs
  const emotionConfig = getEmotionConfig(emotion);

  // Aurora colors (ethereal greens, purples, blues) - Helper
  const getAuroraColors = (eConfig: any) => {
    const primary = new THREE.Color(eConfig.colors.primary);
    const glow = new THREE.Color(eConfig.colors.glow);
    const accent = new THREE.Color(eConfig.colors.accent);
    return {
      color1: primary.lerp(new THREE.Color(0x00ff88), 0.3),
      color2: glow.lerp(new THREE.Color(0x8800ff), 0.3),
      color3: accent.lerp(new THREE.Color(0x0088ff), 0.3),
    };
  }

  const initialColors = useMemo(() => getAuroraColors(emotionConfig), []);

  // Cylinder geometry for aurora curtain
  const geometry = useMemo(() => {
    return new THREE.CylinderGeometry(
      radius,
      radius * 1.2,
      height,
      64,
      32,
      true
    );
  }, [radius, height]);

  // Shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: initialColors.color1 },
        uColor2: { value: initialColors.color2 },
        uColor3: { value: initialColors.color3 },
        uOpacity: { value: opacity },
        uIntensity: { value: 0.5 },
        uWaveAmplitude: { value: 0.2 },
        uWaveFrequency: { value: 4.0 },
      },
      vertexShader: auroraVertexShader,
      fragmentShader: auroraFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [initialColors.color1.getHexString(), opacity]);

  // Animation
  useFrame((_, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    // Get dynamic state
    const currentState = stateRef?.current || state;
    const currentEmotion = emotionRef?.current || emotion;
    const currentStateConfig = getStateConfig(currentState);
    const currentEmotionConfig = getEmotionConfig(currentEmotion);

    // Determine visibility
    const shouldRender =
      currentEmotionConfig.tier === "transcendent" ||
      currentEmotionConfig.tier === "complex" ||
      currentStateConfig.visual.glowIntensity > 0.7;

    meshRef.current.visible = shouldRender;
    if (!shouldRender) return;

    // Get current audio level from ref
    const currentAudioLevel = audioRef?.current?.analysis?.level || 0;
    const currentProgress = animationProgressRef?.current ?? animationProgress;

    // Update time
    materialRef.current.uniforms.uTime.value += delta;

    // Slowly rotate with animation progress influence
    const baseRotation = delta * 0.1;
    const animationRotation =
      Math.sin(currentProgress * Math.PI * 2) * delta * 0.05;
    meshRef.current.rotation.y += baseRotation + animationRotation;

    // Update colors
    const targetColors = getAuroraColors(currentEmotionConfig);
    materialRef.current.uniforms.uColor1.value.lerp(targetColors.color1, delta);
    materialRef.current.uniforms.uColor2.value.lerp(targetColors.color2, delta);
    materialRef.current.uniforms.uColor3.value.lerp(targetColors.color3, delta);

    // Intensity based on state, animation, and audio
    const baseIntensity =
      currentEmotionConfig.tier === "transcendent"
        ? 0.8
        : currentEmotionConfig.tier === "complex"
          ? 0.5
          : currentStateConfig.visual.glowIntensity * 0.4;
    const animationIntensity =
      1 + Math.sin(currentProgress * Math.PI * 4) * 0.3;
    const audioIntensity = 1 + currentAudioLevel * 0.4;
    const targetIntensity = baseIntensity * animationIntensity * audioIntensity;

    materialRef.current.uniforms.uIntensity.value +=
      (targetIntensity - materialRef.current.uniforms.uIntensity.value) *
      delta *
      2;

    // Update opacity with audio reactivity
    const baseOpacity = opacity;
    const audioOpacity = 1 + currentAudioLevel * 0.2;
    const targetOpacity = baseOpacity * audioOpacity;
    materialRef.current.uniforms.uOpacity.value +=
      (targetOpacity - materialRef.current.uniforms.uOpacity.value) * delta * 2;

    // Update wave amplitude based on animation progress
    const waveAmplitude =
      0.2 +
      Math.sin(currentProgress * Math.PI * 6) * 0.1 +
      currentAudioLevel * 0.1;
    materialRef.current.uniforms.uWaveAmplitude.value +=
      (waveAmplitude - materialRef.current.uniforms.uWaveAmplitude.value) *
      delta *
      2;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0, 0]} visible={true}>
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}

export default OrbAurora;
