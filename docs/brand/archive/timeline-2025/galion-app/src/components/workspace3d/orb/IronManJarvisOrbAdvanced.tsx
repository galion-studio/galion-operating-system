'use client';

/**
 * IronManJarvisOrbAdvanced.tsx - ULTIMATE Iron Man Jarvis Hologram
 * 
 * The most detailed recreation possible with:
 * - Custom shaders for realistic holographic effect
 * - Proper depth sorting for particles
 * - GPU-accelerated animations
 * - Memory-efficient instancing
 * - Full intro sequence with arc reactor pulse → particle explosion → ring spin-up
 */

import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

// ============================================================================
// IRON MAN HOLOGRAM COLOR PALETTE
// ============================================================================

const COLORS = {
  // Arc reactor core
  coreWhite: new THREE.Color('#ffffff'),
  coreBlue: new THREE.Color('#4dc3ff'),
  coreCyan: new THREE.Color('#00d4ff'),
  
  // Golden hologram
  gold: new THREE.Color('#ffaa00'),
  goldBright: new THREE.Color('#ffdd55'),
  goldDim: new THREE.Color('#aa7700'),
  orange: new THREE.Color('#ff7722'),
  amber: new THREE.Color('#ffbb33'),
};

// ============================================================================
// SHADER: Holographic Gold Material
// ============================================================================

const holoGoldVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying float vFresnel;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vUv = uv;
  
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vec3 viewDirection = normalize(cameraPosition - worldPosition.xyz);
  vFresnel = pow(1.0 - max(0.0, dot(vNormal, viewDirection)), 3.0);
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const holoGoldFragmentShader = `
uniform vec3 uColor;
uniform float uTime;
uniform float uIntensity;
uniform float uFlicker;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying float vFresnel;

// Noise function
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  // Base color with fresnel edge glow
  vec3 color = uColor;
  color = mix(color, color * 2.0, vFresnel * 0.5);
  
  // Holographic scanlines
  float scanline = sin(vUv.y * 150.0 + uTime * 3.0) * 0.5 + 0.5;
  scanline = pow(scanline, 4.0) * 0.3;
  
  // Noise for holographic texture
  float noise = hash(vUv * 100.0 + uTime);
  float holoNoise = step(0.98, noise) * 0.5;
  
  // Flicker effect
  float flicker = 1.0 + sin(uTime * 20.0 + vPosition.x * 10.0) * uFlicker * 0.1;
  
  // Combine effects
  vec3 finalColor = color * (1.0 + scanline + holoNoise) * flicker;
  
  // Edge brightness
  float edgeFactor = vFresnel * 0.8;
  finalColor += uColor * edgeFactor * 2.0;
  
  gl_FragColor = vec4(finalColor * uIntensity, 0.85);
}
`;

// ============================================================================
// SHADER: Arc Reactor Core
// ============================================================================

const arcReactorVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const arcReactorFragmentShader = `
uniform float uTime;
uniform float uPulse;
uniform vec3 uCoreColor;
uniform vec3 uGlowColor;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vec2 center = vec2(0.5, 0.5);
  float dist = length(vUv - center);
  
  // Core glow
  float coreGlow = 1.0 - smoothstep(0.0, 0.5, dist);
  coreGlow = pow(coreGlow, 2.0);
  
  // Pulsing rings
  float ring1 = abs(sin(dist * 30.0 - uTime * 5.0));
  ring1 = pow(ring1, 8.0) * (1.0 - dist);
  
  float ring2 = abs(sin(dist * 20.0 + uTime * 3.0));
  ring2 = pow(ring2, 6.0) * (1.0 - dist);
  
  // Radial rays
  float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
  float rays = abs(sin(angle * 8.0 + uTime * 2.0));
  rays = pow(rays, 4.0) * (1.0 - dist) * 0.5;
  
  // Heartbeat pulse
  float heartbeat = sin(uTime * 4.0) * 0.5 + 0.5;
  float pulse = 1.0 + heartbeat * uPulse * 0.3;
  
  // Combine
  vec3 color = uCoreColor * coreGlow * 2.0 * pulse;
  color += uGlowColor * (ring1 + ring2) * 0.5;
  color += uGlowColor * rays * 0.3;
  
  float alpha = coreGlow * 0.9 + (ring1 + ring2) * 0.3;
  
  gl_FragColor = vec4(color * pulse, alpha);
}
`;

// ============================================================================
// SHADER: Particle Field
// ============================================================================

const particleVertexShader = `
attribute float aSize;
attribute float aLife;
attribute vec3 aVelocity;

uniform float uTime;
uniform float uSize;

varying float vLife;
varying float vDist;

void main() {
  vLife = aLife;
  
  // Animate position along velocity
  vec3 pos = position + aVelocity * mod(uTime + aLife * 10.0, 5.0);
  
  // Distance from center for fading
  vDist = length(pos);
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Size attenuation
  gl_PointSize = aSize * uSize * (300.0 / -mvPosition.z);
}
`;

const particleFragmentShader = `
uniform vec3 uColor;
uniform float uOpacity;

varying float vLife;
varying float vDist;

void main() {
  // Circular particle shape
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  if (dist > 0.5) discard;
  
  // Soft edge
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
  
  // Fade with distance from center
  float distFade = 1.0 - smoothstep(0.0, 3.0, vDist);
  
  // Life-based brightness variation
  float brightness = 0.5 + sin(vLife * 6.28) * 0.5;
  
  gl_FragColor = vec4(uColor * brightness, alpha * uOpacity * distFade);
}
`;

// ============================================================================
// COMPONENT: Advanced Arc Reactor
// ============================================================================

interface ArcReactorProps {
  size: number;
  intensity: number;
  phase: number; // 0-1 intro animation phase
}

function AdvancedArcReactor({ size, intensity, phase }: ArcReactorProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPulse: { value: 1 },
    uCoreColor: { value: COLORS.coreWhite },
    uGlowColor: { value: COLORS.coreBlue },
  }), []);
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uPulse.value = phase;
    }
    
    if (meshRef.current) {
      // Subtle rotation
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });
  
  return (
    <group scale={phase}>
      {/* Core plane with shader */}
      <mesh ref={meshRef}>
        <planeGeometry args={[size * 0.5, size * 0.5, 1, 1]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={arcReactorVertexShader}
          fragmentShader={arcReactorFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 3D core sphere */}
      <mesh>
        <sphereGeometry args={[size * 0.06, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Glow layers */}
      {[0.08, 0.12, 0.18, 0.25].map((r, i) => (
        <mesh key={i}>
          <sphereGeometry args={[size * r, 32, 32]} />
          <meshBasicMaterial
            color={i < 2 ? '#4dc3ff' : '#ffaa00'}
            transparent
            opacity={(0.4 - i * 0.08) * intensity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
      
      {/* Point light */}
      <pointLight color="#4dc3ff" intensity={intensity * 5 * phase} distance={size * 10} />
    </group>
  );
}

// ============================================================================
// COMPONENT: Advanced Golden Ring
// ============================================================================

interface GoldenRingProps {
  size: number;
  radius: number;
  tubeRadius: number;
  rotation: THREE.Euler;
  speed: number;
  direction: number;
  intensity: number;
  delay: number;
  phase: number;
}

function AdvancedGoldenRing({ 
  size, 
  radius, 
  tubeRadius, 
  rotation, 
  speed, 
  direction, 
  intensity,
  delay,
  phase 
}: GoldenRingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const ticksRef = useRef<THREE.InstancedMesh>(null);
  
  const tickCount = 60;
  const ringPhase = Math.max(0, Math.min(1, (phase - delay) * 3));
  
  const uniforms = useMemo(() => ({
    uColor: { value: COLORS.gold },
    uTime: { value: 0 },
    uIntensity: { value: intensity },
    uFlicker: { value: 0.5 },
  }), [intensity]);
  
  // Initialize ticks
  useEffect(() => {
    if (!ticksRef.current) return;
    
    const temp = new THREE.Object3D();
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius * size;
      const y = Math.sin(angle) * radius * size;
      
      temp.position.set(x, y, 0);
      temp.rotation.z = angle;
      temp.scale.set(1, i % 5 === 0 ? 3 : 1, 1);
      temp.updateMatrix();
      
      ticksRef.current.setMatrixAt(i, temp.matrix);
    }
    ticksRef.current.instanceMatrix.needsUpdate = true;
  }, [radius, size]);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    if (groupRef.current) {
      // Rotation with spin-up acceleration
      const spinSpeed = speed * direction * ringPhase;
      groupRef.current.rotation.z += spinSpeed * 0.008;
    }
    
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
    }
    
    // Animate ticks
    if (ticksRef.current && ringPhase > 0) {
      const temp = new THREE.Object3D();
      for (let i = 0; i < tickCount; i++) {
        const angle = (i / tickCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius * size;
        const y = Math.sin(angle) * radius * size;
        
        const pulse = Math.sin(t * 5 + i * 0.3) * 0.4 + 0.8;
        
        temp.position.set(x, y, 0);
        temp.rotation.z = angle;
        temp.scale.set(pulse, i % 5 === 0 ? 3 : 1.2, pulse);
        temp.updateMatrix();
        
        ticksRef.current.setMatrixAt(i, temp.matrix);
      }
      ticksRef.current.instanceMatrix.needsUpdate = true;
    }
  });
  
  return (
    <group ref={groupRef} rotation={rotation} scale={ringPhase}>
      {/* Main ring with custom shader */}
      <mesh>
        <torusGeometry args={[radius * size, tubeRadius * size, 12, 128]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={holoGoldVertexShader}
          fragmentShader={holoGoldFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh>
        <torusGeometry args={[radius * size, tubeRadius * size * 4, 8, 64]} />
        <meshBasicMaterial
          color="#ffcc44"
          transparent
          opacity={0.15 * intensity * ringPhase}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Data ticks */}
      <instancedMesh ref={ticksRef} args={[undefined, undefined, tickCount]}>
        <boxGeometry args={[tubeRadius * size, tubeRadius * size * 10, tubeRadius * size]} />
        <meshBasicMaterial
          color="#ffdd55"
          transparent
          opacity={0.9 * ringPhase}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
}

// ============================================================================
// COMPONENT: Advanced Particle Field
// ============================================================================

interface AdvancedParticleFieldProps {
  size: number;
  intensity: number;
  count: number;
  phase: number;
}

function AdvancedParticleField({ size, intensity, count, phase }: AdvancedParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const { positions, sizes, lifetimes, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const lifetimes = new Float32Array(count);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Spawn in sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.5) * size * 0.3;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      // Outward velocity
      const speed = 0.02 + Math.random() * 0.05;
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      velocities[i * 3 + 2] = Math.cos(phi) * speed;
      
      sizes[i] = 0.5 + Math.random() * 2;
      lifetimes[i] = Math.random();
    }
    
    return { positions, sizes, lifetimes, velocities };
  }, [count, size]);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSize: { value: 1 },
    uColor: { value: COLORS.gold },
    uOpacity: { value: intensity },
  }), [intensity]);
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uOpacity.value = intensity * phase;
    }
    
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aLife" count={count} array={lifetimes} itemSize={1} />
        <bufferAttribute attach="attributes-aVelocity" count={count} array={velocities} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ============================================================================
// COMPONENT: Orbital Data Streams
// ============================================================================

function OrbitalDataStream({ 
  size, 
  radius, 
  tilt, 
  speed, 
  intensity,
  phase 
}: { 
  size: number; 
  radius: number; 
  tilt: number; 
  speed: number; 
  intensity: number;
  phase: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const nodeRef = useRef<THREE.Mesh>(null);
  
  // Create orbital path
  const pathGeometry = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, radius * size, radius * size * 0.8, 0, Math.PI * 2, false, 0);
    const points = curve.getPoints(100);
    return new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, 0, p.y)));
  }, [radius, size]);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    if (groupRef.current) {
      groupRef.current.rotation.y = t * speed * phase;
    }
    
    if (nodeRef.current) {
      const angle = t * speed * 2;
      nodeRef.current.position.x = Math.cos(angle) * radius * size;
      nodeRef.current.position.z = Math.sin(angle) * radius * size * 0.8;
      
      // Pulse
      const pulse = Math.sin(t * 6) * 0.3 + 1;
      nodeRef.current.scale.setScalar(pulse * phase);
    }
  });
  
  return (
    <group ref={groupRef} rotation={[tilt, 0, 0]}>
      {/* Orbital path */}
      <line geometry={pathGeometry}>
        <lineBasicMaterial 
          color="#ffaa00" 
          transparent 
          opacity={0.3 * intensity * phase}
          blending={THREE.AdditiveBlending}
        />
      </line>
      
      {/* Data node */}
      <mesh ref={nodeRef}>
        <octahedronGeometry args={[size * 0.025]} />
        <meshBasicMaterial 
          color="#ffdd55"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Node glow */}
      <mesh ref={nodeRef}>
        <sphereGeometry args={[size * 0.04, 16, 16]} />
        <meshBasicMaterial 
          color="#ffaa00"
          transparent
          opacity={0.4 * phase}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// COMPONENT: Holographic Scanlines
// ============================================================================

function HolographicScanlines({ size, intensity, phase }: { size: number; intensity: number; phase: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: intensity },
  }), [intensity]);
  
  const scanlineShader = useMemo(() => ({
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uIntensity;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      
      void main() {
        // Horizontal scanlines
        float scanline = sin(vUv.y * 300.0 + uTime * 4.0) * 0.5 + 0.5;
        scanline = pow(scanline, 10.0);
        
        // Static noise
        float noise = hash(vUv * 500.0 + uTime);
        noise = step(0.997, noise);
        
        // Flicker
        float flicker = sin(uTime * 35.0) * 0.03 + 1.0;
        
        // Chromatic shift
        float chromaOffset = sin(uTime * 2.0) * 0.002;
        
        float alpha = (scanline * 0.08 + noise * 0.2) * uIntensity * flicker;
        
        gl_FragColor = vec4(1.0, 0.95, 0.8, alpha);
      }
    `,
  }), []);
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uIntensity.value = intensity * phase;
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size * 1.8, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        {...scanlineShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ============================================================================
// MAIN COMPONENT: IronManJarvisOrbAdvanced
// ============================================================================

export interface IronManJarvisOrbAdvancedProps {
  position?: [number, number, number];
  size?: number;
  intensity?: number;
  quality?: 'low' | 'medium' | 'high';
  autoPlay?: boolean;
  onClick?: () => void;
}

export function IronManJarvisOrbAdvanced({
  position = [0, 0, 0],
  size = 2,
  intensity = 1,
  quality = 'high',
  autoPlay = true,
  onClick,
}: IronManJarvisOrbAdvancedProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [introPhase, setIntroPhase] = useState(autoPlay ? 0 : 1);
  
  // Particle count based on quality
  const particleCount = quality === 'high' ? 5000 : quality === 'medium' ? 2500 : 1000;
  
  // Intro animation
  useEffect(() => {
    if (!autoPlay) return;
    
    const startTime = Date.now();
    const duration = 4000; // 4 second intro
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Eased progress
      const eased = 1 - Math.pow(1 - progress, 3);
      setIntroPhase(eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [autoPlay]);
  
  // Breathing animation
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const t = state.clock.elapsedTime;
    
    // Breathing (1-2% scale every 4 seconds)
    const breathe = Math.sin(t * 0.4) * 0.015 + 1;
    groupRef.current.scale.setScalar(breathe);
    
    // Subtle float
    groupRef.current.position.y = position[1] + Math.sin(t * 0.3) * size * 0.02;
  });
  
  // Ring configurations
  const rings = [
    { radius: 0.55, tubeRadius: 0.008, rotation: new THREE.Euler(0, 0, 0), speed: 1, direction: 1, delay: 0.2 },
    { radius: 0.7, tubeRadius: 0.006, rotation: new THREE.Euler(Math.PI / 3.5, 0, Math.PI / 8), speed: 0.8, direction: -1, delay: 0.35 },
    { radius: 0.85, tubeRadius: 0.005, rotation: new THREE.Euler(Math.PI / 6, Math.PI / 5, 0), speed: 0.6, direction: 1, delay: 0.5 },
  ];
  
  // Data stream configurations
  const dataStreams = [
    { radius: 1.0, tilt: 0, speed: 0.4 },
    { radius: 1.1, tilt: Math.PI / 4, speed: 0.35 },
    { radius: 1.15, tilt: Math.PI / 2.5, speed: 0.45 },
    { radius: 1.05, tilt: -Math.PI / 5, speed: 0.38 },
    { radius: 1.2, tilt: Math.PI / 3, speed: 0.42 },
  ];
  
  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      {/* Arc Reactor Core */}
      <AdvancedArcReactor size={size} intensity={intensity} phase={introPhase} />
      
      {/* Golden Ring System */}
      {rings.map((ring, i) => (
        <AdvancedGoldenRing
          key={i}
          size={size}
          radius={ring.radius}
          tubeRadius={ring.tubeRadius}
          rotation={ring.rotation}
          speed={ring.speed}
          direction={ring.direction}
          intensity={intensity}
          delay={ring.delay}
          phase={introPhase}
        />
      ))}
      
      {/* Particle Field */}
      <AdvancedParticleField 
        size={size} 
        intensity={intensity} 
        count={particleCount}
        phase={introPhase}
      />
      
      {/* Orbital Data Streams */}
      {dataStreams.map((stream, i) => (
        <OrbitalDataStream
          key={i}
          size={size}
          radius={stream.radius}
          tilt={stream.tilt}
          speed={stream.speed}
          intensity={intensity}
          phase={introPhase}
        />
      ))}
      
      {/* Holographic Scanlines */}
      <HolographicScanlines size={size} intensity={intensity} phase={introPhase} />
      
      {/* Ambient lighting */}
      <pointLight color="#ffaa00" intensity={intensity * 2 * introPhase} distance={size * 12} position={[size, size, size]} />
      <pointLight color="#ff7722" intensity={intensity * 1.5 * introPhase} distance={size * 10} position={[-size, -size, size]} />
    </group>
  );
}

export default IronManJarvisOrbAdvanced;

