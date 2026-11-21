/**
 * GALION Orb V6 - Aurora Component
 *
 * Northern lights / aurora borealis effect.
 * Creates an ethereal, magical atmosphere.
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
  uniform float uTime;
  uniform float uWaveAmplitude;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vWave;

  void main() {
    vUv = uv;
    vPosition = position;

    // Create flowing wave displacement
    float wave1 = sin(position.y * 4.0 + uTime * 0.5) * uWaveAmplitude;
    float wave2 = sin(position.y * 2.5 + uTime * 0.3 + 1.5) * uWaveAmplitude * 0.7;
    float wave3 = sin(position.x * 3.0 + uTime * 0.4) * uWaveAmplitude * 0.5;

    vWave = wave1 + wave2 + wave3;

    vec3 pos = position;
    pos.x += vWave * 0.15;
    pos.z += vWave * 0.08;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uIntensity;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vWave;

  // Simple noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    // Create flowing pattern
    float n1 = noise(vec2(vUv.x * 3.0, vUv.y * 2.0 + uTime * 0.1));
    float n2 = noise(vec2(vUv.x * 5.0, vUv.y * 3.0 - uTime * 0.15));
    float pattern = (n1 * 0.6 + n2 * 0.4);

    // Curtain effect (vertical bands)
    float curtain = sin(vUv.x * 15.0 + uTime * 0.5 + vWave * 2.0) * 0.5 + 0.5;
    curtain = pow(curtain, 2.0);

    // Color blending
    float colorMix = sin(vUv.y * 3.14159 + uTime * 0.2) * 0.5 + 0.5;
    vec3 color = mix(uColor1, uColor2, colorMix);

    // Add shimmer
    color += vec3(0.1, 0.15, 0.2) * curtain * n2;

    // Calculate alpha
    float alpha = pattern * curtain * uOpacity * uIntensity;

    // Fade at edges
    float edgeFade = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
    edgeFade *= smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);

    alpha *= edgeFade;

    gl_FragColor = vec4(color, alpha * 0.5);
  }
`;

// =============================================================================
// COMPONENT
// =============================================================================

interface OrbAuroraProps {
  colors: OrbColors;
  radius?: number;
  height?: number;
  opacity?: number;
  audioLevel: number;
}

export function OrbAurora({
  colors,
  radius = 2.0,
  height = 3.0,
  opacity = 0.4,
  audioLevel,
}: OrbAuroraProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Create cylinder geometry for aurora curtain
  const geometry = useMemo(() => {
    return new THREE.CylinderGeometry(
      radius,
      radius * 1.3,
      height,
      64,
      32,
      true
    );
  }, [radius, height]);

  // Create aurora colors from orb colors
  const auroraColor1 = useMemo(() => {
    const c = new THREE.Color(colors.primary);
    c.lerp(new THREE.Color(0x00ff88), 0.3);
    return c;
  }, [colors.primary]);

  const auroraColor2 = useMemo(() => {
    const c = new THREE.Color(colors.glow);
    c.lerp(new THREE.Color(0x8800ff), 0.3);
    return c;
  }, [colors.glow]);

  // Shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: auroraColor1 },
        uColor2: { value: auroraColor2 },
        uOpacity: { value: opacity },
        uIntensity: { value: 0.5 },
        uWaveAmplitude: { value: 0.2 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  // Animation loop
  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    const time = state.clock.elapsedTime;

    // Update time
    materialRef.current.uniforms.uTime.value = time;

    // Update colors
    const targetColor1 = new THREE.Color(colors.primary).lerp(new THREE.Color(0x00ff88), 0.3);
    const targetColor2 = new THREE.Color(colors.glow).lerp(new THREE.Color(0x8800ff), 0.3);

    materialRef.current.uniforms.uColor1.value.lerp(targetColor1, delta * 2);
    materialRef.current.uniforms.uColor2.value.lerp(targetColor2, delta * 2);

    // Audio reactive intensity
    const targetIntensity = 0.4 + audioLevel * 0.4;
    materialRef.current.uniforms.uIntensity.value +=
      (targetIntensity - materialRef.current.uniforms.uIntensity.value) * delta * 5;

    // Wave amplitude based on audio
    const targetWave = 0.2 + audioLevel * 0.15;
    materialRef.current.uniforms.uWaveAmplitude.value +=
      (targetWave - materialRef.current.uniforms.uWaveAmplitude.value) * delta * 3;

    // Slow rotation
    meshRef.current.rotation.y += delta * 0.05;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0, 0]}>
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  );
}

export default OrbAurora;
