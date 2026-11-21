'use client';

/**
 * OrbShaderMaterial.tsx - Advanced Shader-Based Orb Material
 * 
 * Creates a sophisticated, multi-layered shader material for the orb
 * that replaces the chunky geometric shapes with smooth, organic visuals.
 * 
 * Features:
 * - Layered noise-based surface distortion
 * - Fresnel glow effects
 * - Volumetric inner glow
 * - Procedural energy patterns
 * - Smooth color transitions
 * - Audio-reactive pulsing
 */

import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// ============================================================================
// VERTEX SHADER
// ============================================================================

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vNoise;
  
  uniform float uTime;
  uniform float uIntensity;
  uniform float uAudioLevel;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  
  // 3D Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
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
  
  // Fractional Brownian Motion (FBM) for organic detail
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 4; i++) {
      value += amplitude * snoise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    
    return value;
  }
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    // Create flowing noise displacement
    vec3 pos = position;
    float time = uTime * 0.2;
    
    // Multi-layered noise for organic surface
    float noise1 = fbm(pos * 2.0 + vec3(time, time * 0.5, time * 0.3));
    float noise2 = fbm(pos * 4.0 - vec3(time * 0.3, time * 0.2, time));
    float noise3 = snoise(pos * 8.0 + vec3(time * 0.5, time, time * 0.7));
    
    // Combine noises with audio influence
    float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
    float audioInfluence = uAudioLevel * 0.3;
    
    // Displace vertices along normal
    float displacement = (combinedNoise + audioInfluence) * uIntensity * 0.15;
    pos += normal * displacement;
    
    vNoise = combinedNoise;
    vPosition = pos;
    
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// ============================================================================
// FRAGMENT SHADER
// ============================================================================

const fragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vNoise;
  
  uniform float uTime;
  uniform float uIntensity;
  uniform float uAudioLevel;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uCameraPosition;
  uniform float uFresnelPower;
  uniform float uGlowIntensity;
  
  void main() {
    // Calculate view direction for fresnel
    vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), uFresnelPower);
    
    // Base color gradient based on position
    float colorMix = (vPosition.y + 1.0) * 0.5;
    vec3 baseColor = mix(uColor1, uColor2, colorMix);
    
    // Add energy patterns from noise
    float energyPattern = sin(vNoise * 10.0 + uTime) * 0.5 + 0.5;
    baseColor = mix(baseColor, uColor3, energyPattern * 0.3);
    
    // Fresnel glow
    vec3 fresnelColor = mix(baseColor, uColor3, fresnel);
    
    // Pulse with audio
    float pulse = sin(uTime * 2.0) * 0.1 + 0.9;
    pulse += uAudioLevel * 0.3;
    
    // Final color with glow
    vec3 finalColor = fresnelColor * uIntensity * pulse;
    finalColor += uColor3 * fresnel * uGlowIntensity;
    
    // Add atmospheric depth
    float depth = length(vPosition) / 2.0;
    finalColor = mix(finalColor, baseColor * 0.5, depth * 0.3);
    
    // Emissive boost
    finalColor *= (1.0 + uIntensity * 0.5);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ============================================================================
// SHADER MATERIAL
// ============================================================================

export const OrbShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uIntensity: 1.0,
    uAudioLevel: 0,
    uColor1: new THREE.Color('#4a90e2'),
    uColor2: new THREE.Color('#8b5cf6'),
    uColor3: new THREE.Color('#06b6d4'),
    uCameraPosition: new THREE.Vector3(0, 0, 5),
    uFresnelPower: 3.0,
    uGlowIntensity: 1.5,
  },
  vertexShader,
  fragmentShader
);

// Register material with R3F
extend({ OrbShaderMaterial });

// Type declaration for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      orbShaderMaterial: any;
    }
  }
}

export type OrbShaderMaterialType = typeof OrbShaderMaterial & {
  key: string;
};
