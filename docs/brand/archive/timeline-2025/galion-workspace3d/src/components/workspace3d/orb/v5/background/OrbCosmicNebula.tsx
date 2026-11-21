/**
 * GALION Orb V5.2 - Cosmic Nebula Background
 * 
 * Deep space nebula clouds that provide atmospheric depth
 * and respond to emotion colors.
 */

'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Emotion } from '../types/emotion.types';
import { getEmotionConfig } from '../config/emotions';

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
  uniform vec3 uColor3;
  uniform float uOpacity;
  uniform float uDensity;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  // FBM noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
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
  
  float fbm(vec2 p) {
    float f = 0.0;
    float w = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 5; i++) {
      f += w * snoise(p * freq);
      freq *= 2.0;
      w *= 0.5;
    }
    return f;
  }
  
  void main() {
    // Convert to spherical-ish coordinates for seamless wrapping
    vec2 uv = vUv;
    
    // Slow time for cosmic scale
    float t = uTime * 0.02;
    
    // Multiple noise layers for depth
    float n1 = fbm(uv * 2.0 + t * 0.1);
    float n2 = fbm(uv * 4.0 - t * 0.05);
    float n3 = fbm(uv * 8.0 + t * 0.03);
    
    // Combine for cloud density
    float density = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2) * 0.5 + 0.5;
    density = pow(density, uDensity);
    
    // Color mixing based on density and position
    float colorMix1 = smoothstep(0.3, 0.7, density + n1 * 0.3);
    float colorMix2 = smoothstep(0.4, 0.6, n2 * 0.5 + 0.5);
    
    vec3 color = mix(uColor1, uColor2, colorMix1);
    color = mix(color, uColor3, colorMix2 * density);
    
    // Darken edges
    float vignette = 1.0 - smoothstep(0.3, 0.7, length(uv - 0.5));
    color *= vignette * 0.5 + 0.5;
    
    // Final alpha
    float alpha = density * uOpacity * vignette;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// TYPES
// ============================================================================

interface OrbCosmicNebulaProps {
  emotion?: Emotion;
  emotionRef?: React.MutableRefObject<Emotion>;
  radius?: number;
  opacity?: number;
  density?: number;
}

export function OrbCosmicNebula({
  emotion = 'neutral',
  emotionRef,
  radius = 80,
  opacity = 0.4,
  density = 1.5,
}: OrbCosmicNebulaProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const emotionConfig = getEmotionConfig(emotion);

  // Helper to generate colors
  const getNebulaColors = (eConfig: any) => {
    const primary = new THREE.Color(eConfig.colors.primary).multiplyScalar(0.3);
    const accent = new THREE.Color(eConfig.colors.accent).multiplyScalar(0.4);
    const glow = new THREE.Color(eConfig.colors.glow).multiplyScalar(0.2);
    return {
      color1: primary.lerp(new THREE.Color(0x1a0a2e), 0.7),
      color2: accent.lerp(new THREE.Color(0x16213e), 0.6),
      color3: glow.lerp(new THREE.Color(0x0f3460), 0.5),
    };
  }

  const initialColors = useMemo(() => getNebulaColors(emotionConfig), []);

  // Large sphere geometry
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(radius, 64, 32);
  }, [radius]);

  // Shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: initialColors.color1 },
        uColor2: { value: initialColors.color2 },
        uColor3: { value: initialColors.color3 },
        uOpacity: { value: opacity },
        uDensity: { value: density },
      },
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [initialColors.color1.getHexString(), opacity, density]);

  // Animation
  useFrame((_, delta) => {
    if (!materialRef.current) return;

    // Get dynamic emotion
    const currentEmotion = emotionRef?.current || emotion;
    const currentEmotionConfig = getEmotionConfig(currentEmotion);
    const targetColors = getNebulaColors(currentEmotionConfig);

    materialRef.current.uniforms.uTime.value += delta;

    // Smoothly transition colors
    materialRef.current.uniforms.uColor1.value.lerp(targetColors.color1, delta * 0.5);
    materialRef.current.uniforms.uColor2.value.lerp(targetColors.color2, delta * 0.5);
    materialRef.current.uniforms.uColor3.value.lerp(targetColors.color3, delta * 0.5);
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}

export default OrbCosmicNebula;
