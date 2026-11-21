'use client';

/**
 * JarvisOrbCore.tsx - Inner Nebula Effect
 * 
 * The volumetric cloud-like core of the Jarvis orb.
 * Inspired by nebula gas clouds with:
 * - Swirling, organic motion
 * - Color shifts based on state
 * - Volumetric appearance using layered spheres
 * - Breathing/pulsing animation
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { JarvisStateConfig } from './jarvisStates';

// ============================================================================
// TYPES
// ============================================================================

export interface JarvisOrbCoreProps {
  size?: number;
  config: JarvisStateConfig;
  audioLevel?: number;
}

// ============================================================================
// CUSTOM SHADER
// ============================================================================

const nebulaVertexShader = `
varying vec3 vPosition;
varying vec3 vNormal;
varying float vNoise;

uniform float uTime;
uniform float uTurbulence;

// Simplex noise
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

void main() {
  vPosition = position;
  vNormal = normal;
  
  // Calculate noise for vertex displacement
  vec3 noisePos = position * 1.5 + uTime * 0.2;
  float noise = snoise(noisePos) * uTurbulence;
  vNoise = noise;
  
  // Organic displacement
  vec3 displaced = position + normal * noise * 0.1;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

const nebulaFragmentShader = `
varying vec3 vPosition;
varying vec3 vNormal;
varying float vNoise;

uniform vec3 uColor;
uniform float uTime;
uniform float uTurbulence;
uniform float uDensity;
uniform float uBrightness;
uniform float uAudioLevel;

void main() {
  // Distance from center for radial gradient
  float dist = length(vPosition);
  
  // Swirling pattern
  float angle = atan(vPosition.y, vPosition.x);
  float swirl = sin(angle * 3.0 + uTime * 0.5 + dist * 2.0) * 0.5 + 0.5;
  
  // Combine with noise
  float pattern = (vNoise * 0.5 + 0.5) * swirl;
  
  // Radial falloff
  float radialFalloff = 1.0 - smoothstep(0.0, 1.0, dist);
  
  // Final color with volumetric effect
  vec3 color = uColor;
  color = mix(color, color * 1.5, pattern * uBrightness);
  
  // Audio reactivity
  float audioBoost = 1.0 + uAudioLevel * 0.5;
  color *= audioBoost;
  
  // Alpha based on density and distance
  float alpha = uDensity * radialFalloff * (0.6 + pattern * 0.4);
  
  gl_FragColor = vec4(color, alpha);
}
`;

// ============================================================================
// COMPONENT
// ============================================================================

export function JarvisOrbCore({ size = 1, config, audioLevel = 0 }: JarvisOrbCoreProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Parse nebula color
  const nebulaColor = useMemo(() => {
    return new THREE.Color(config.nebula.color);
  }, [config.nebula.color]);
  
  // Shader uniforms - Create once and update in useFrame
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: nebulaColor.clone() },
    uTurbulence: { value: config.nebula.turbulence },
    uDensity: { value: config.nebula.density },
    uBrightness: { value: config.nebula.brightness },
    uAudioLevel: { value: audioLevel },
  }), [config.nebula.turbulence, config.nebula.density, config.nebula.brightness]);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
      materialRef.current.uniforms.uColor.value = nebulaColor;
      materialRef.current.uniforms.uTurbulence.value = config.nebula.turbulence;
      materialRef.current.uniforms.uDensity.value = config.nebula.density;
      materialRef.current.uniforms.uBrightness.value = config.nebula.brightness;
      materialRef.current.uniforms.uAudioLevel.value = audioLevel;
    }
    
    if (meshRef.current) {
      // Gentle rotation
      meshRef.current.rotation.y = t * 0.1;
      meshRef.current.rotation.x = Math.sin(t * 0.15) * 0.1;
    }
  });
  
  return (
    <group>
      {/* Main nebula core */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[size * 0.7, 4]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={nebulaVertexShader}
          fragmentShader={nebulaFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Inner glow sphere */}
      <mesh>
        <sphereGeometry args={[size * 0.4, 32, 32]} />
        <meshBasicMaterial
          color={config.nebula.color}
          transparent
          opacity={0.3 * config.nebula.brightness}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Central point light */}
      <pointLight
        color={config.nebula.color}
        intensity={config.nebula.brightness * 2}
        distance={size * 5}
      />
    </group>
  );
}

export default JarvisOrbCore;

