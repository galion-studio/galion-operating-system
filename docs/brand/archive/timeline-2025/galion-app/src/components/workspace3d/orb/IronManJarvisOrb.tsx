'use client';

/**
 * IronManJarvisOrb.tsx - EXACT Iron Man (2008) Jarvis Hologram Recreation
 * 
 * A pixel-perfect recreation of Tony Stark's holographic interface featuring:
 * - Central arc reactor core with radiating shockwaves
 * - Triple golden gyroscopic ring system
 * - Thousands of drifting gold/orange particles
 * - Data ribbons with orbital electron paths
 * - Holographic scanlines, flicker, and chromatic aberration
 * - Breathing animation with heartbeat-synced pulses
 * 
 * Based on the Mark III helmet scene from Iron Man (2008)
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

// ============================================================================
// COLOR PALETTE - Exact Iron Man hologram colors
// ============================================================================

const JARVIS_COLORS = {
  // Core arc reactor
  arcCore: '#ffffff',
  arcGlow: '#4dc3ff',
  arcPulse: '#00a8ff',
  
  // Golden hologram
  gold: '#ffaa00',
  goldBright: '#ffcc44',
  goldDim: '#cc8800',
  orange: '#ff6600',
  
  // Accent
  amber: '#ffbb33',
  white: '#ffffff',
};

// ============================================================================
// TYPES
// ============================================================================

export interface IronManJarvisOrbProps {
  position?: [number, number, number];
  size?: number;
  intensity?: number;
  animate?: boolean;
  onClick?: () => void;
  showHelmet?: boolean;
  showDataRibbons?: boolean;
  showParticles?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

// ============================================================================
// ARC REACTOR CORE - The heart of the visualization
// ============================================================================

function ArcReactorCore({ size, intensity }: { size: number; intensity: number }) {
  const coreRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const shockwaveRefs = useRef<THREE.Mesh[]>([]);
  const [shockwaves, setShockwaves] = useState<number[]>([0]);
  
  // Create shockwave every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShockwaves(prev => [...prev.slice(-3), Date.now()]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    if (coreRef.current) {
      // Heartbeat pulse
      const heartbeat = Math.sin(t * 4) * 0.5 + 0.5;
      const pulse = 1 + heartbeat * 0.15;
      coreRef.current.scale.setScalar(pulse);
    }
    
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(t * 3) * 0.1;
    }
  });
  
  return (
    <group ref={coreRef}>
      {/* Inner bright core */}
      <mesh>
        <sphereGeometry args={[size * 0.08, 32, 32]} />
        <meshBasicMaterial 
          color={JARVIS_COLORS.arcCore} 
          transparent 
          opacity={1}
        />
      </mesh>
      
      {/* Blue-white glow layer 1 */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 0.12, 32, 32]} />
        <meshBasicMaterial 
          color={JARVIS_COLORS.arcGlow} 
          transparent 
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Blue-white glow layer 2 */}
      <mesh>
        <sphereGeometry args={[size * 0.18, 32, 32]} />
        <meshBasicMaterial 
          color={JARVIS_COLORS.arcPulse} 
          transparent 
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Outer golden transition */}
      <mesh>
        <sphereGeometry args={[size * 0.25, 32, 32]} />
        <meshBasicMaterial 
          color={JARVIS_COLORS.gold} 
          transparent 
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Radiating shockwaves */}
      {shockwaves.map((id, i) => (
        <ShockwaveRing key={id} size={size} delay={i * 0.3} />
      ))}
      
      {/* Central point light */}
      <pointLight 
        color={JARVIS_COLORS.arcGlow} 
        intensity={intensity * 3} 
        distance={size * 8}
        decay={2}
      />
      
      {/* God rays / lens flare effect */}
      <sprite scale={[size * 2, size * 2, 1]}>
        <spriteMaterial
          color={JARVIS_COLORS.arcGlow}
          transparent
          opacity={0.3 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </group>
  );
}

// ============================================================================
// SHOCKWAVE RING - Radiating concentric waves
// ============================================================================

function ShockwaveRing({ size, delay }: { size: number; delay: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Date.now());
  
  useFrame(() => {
    if (!ringRef.current) return;
    
    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / 2, 1); // 2 second animation
    
    const scale = 0.3 + progress * 2;
    const opacity = (1 - progress) * 0.5;
    
    ringRef.current.scale.setScalar(scale);
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
  });
  
  return (
    <mesh ref={ringRef}>
      <ringGeometry args={[size * 0.9, size * 1, 64]} />
      <meshBasicMaterial
        color={JARVIS_COLORS.arcGlow}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================================
// GOLDEN GYROSCOPIC RINGS - The signature look
// ============================================================================

interface GyroRingProps {
  size: number;
  radius: number;
  tubeRadius: number;
  rotation: [number, number, number];
  speed: number;
  direction: number;
  intensity: number;
}

function GyroRing({ size, radius, tubeRadius, rotation, speed, direction, intensity }: GyroRingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ticksRef = useRef<THREE.InstancedMesh>(null);
  
  const tickCount = 48;
  
  // Initialize tick matrices
  useEffect(() => {
    if (!ticksRef.current) return;
    
    const temp = new THREE.Object3D();
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius * size;
      const y = Math.sin(angle) * radius * size;
      
      temp.position.set(x, y, 0);
      temp.lookAt(0, 0, 0);
      temp.scale.set(1, i % 4 === 0 ? 2 : 1, 1);
      temp.updateMatrix();
      
      ticksRef.current.setMatrixAt(i, temp.matrix);
    }
    ticksRef.current.instanceMatrix.needsUpdate = true;
  }, [radius, size]);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    if (groupRef.current) {
      groupRef.current.rotation.z += speed * direction * 0.005;
    }
    
    // Animate tick marks
    if (ticksRef.current) {
      const temp = new THREE.Object3D();
      for (let i = 0; i < tickCount; i++) {
        const angle = (i / tickCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius * size;
        const y = Math.sin(angle) * radius * size;
        
        const pulse = Math.sin(t * 4 + i * 0.2) * 0.3 + 0.7;
        
        temp.position.set(x, y, 0);
        temp.lookAt(0, 0, 0);
        temp.scale.set(pulse, i % 4 === 0 ? 2.5 : 1.2, pulse);
        temp.updateMatrix();
        
        ticksRef.current.setMatrixAt(i, temp.matrix);
      }
      ticksRef.current.instanceMatrix.needsUpdate = true;
    }
  });
  
  return (
    <group ref={groupRef} rotation={rotation}>
      {/* Main golden ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[radius * size, tubeRadius * size, 8, 128]} />
        <meshStandardMaterial
          color={JARVIS_COLORS.gold}
          emissive={JARVIS_COLORS.gold}
          emissiveIntensity={intensity * 0.8}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.95}
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh>
        <torusGeometry args={[radius * size, tubeRadius * size * 3, 8, 128]} />
        <meshBasicMaterial
          color={JARVIS_COLORS.goldBright}
          transparent
          opacity={0.15 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Data tick marks */}
      <instancedMesh ref={ticksRef} args={[undefined, undefined, tickCount]}>
        <boxGeometry args={[tubeRadius * size * 0.8, tubeRadius * size * 8, tubeRadius * size * 0.8]} />
        <meshBasicMaterial
          color={JARVIS_COLORS.goldBright}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
}

function GoldenRingSystem({ size, intensity }: { size: number; intensity: number }) {
  const systemRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (systemRef.current) {
      // Subtle wobble
      systemRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
      systemRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.15) * 0.05;
    }
  });
  
  const rings = [
    { radius: 0.6, tubeRadius: 0.008, rotation: [0, 0, 0] as [number, number, number], speed: 0.8, direction: 1 },
    { radius: 0.75, tubeRadius: 0.006, rotation: [Math.PI / 3, 0, Math.PI / 6] as [number, number, number], speed: 0.6, direction: -1 },
    { radius: 0.9, tubeRadius: 0.005, rotation: [Math.PI / 6, Math.PI / 4, 0] as [number, number, number], speed: 0.4, direction: 1 },
  ];
  
  return (
    <group ref={systemRef}>
      {rings.map((ring, i) => (
        <GyroRing
          key={i}
          size={size}
          radius={ring.radius}
          tubeRadius={ring.tubeRadius}
          rotation={ring.rotation}
          speed={ring.speed}
          direction={ring.direction}
          intensity={intensity}
        />
      ))}
    </group>
  );
}

// ============================================================================
// PARTICLE FIELD - Thousands of floating gold particles
// ============================================================================

function ParticleField({ size, intensity, count = 2000 }: { size: number; intensity: number; count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positions, velocities, lifetimes, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Spawn in sphere around center
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * size * 0.5;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      // Outward velocity
      const speed = 0.001 + Math.random() * 0.003;
      velocities[i * 3] = positions[i * 3] * speed;
      velocities[i * 3 + 1] = positions[i * 3 + 1] * speed;
      velocities[i * 3 + 2] = positions[i * 3 + 2] * speed;
      
      lifetimes[i] = Math.random();
      sizes[i] = 0.5 + Math.random() * 1.5;
    }
    
    return { positions, velocities, lifetimes, sizes };
  }, [count, size]);
  
  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const sizeAttr = pointsRef.current.geometry.attributes.size as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    
    for (let i = 0; i < count; i++) {
      // Update position with outward drift
      posAttr.array[i * 3] += velocities[i * 3];
      posAttr.array[i * 3 + 1] += velocities[i * 3 + 1];
      posAttr.array[i * 3 + 2] += velocities[i * 3 + 2];
      
      // Calculate distance from center
      const x = posAttr.array[i * 3];
      const y = posAttr.array[i * 3 + 1];
      const z = posAttr.array[i * 3 + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      
      // Reset particles that drift too far
      if (dist > size * 1.5) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.random() * size * 0.2;
        
        posAttr.array[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        posAttr.array[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        posAttr.array[i * 3 + 2] = r * Math.cos(phi);
      }
      
      // Pulsing size based on heartbeat
      const heartbeat = Math.sin(t * 4 + lifetimes[i] * 10) * 0.5 + 0.5;
      const fadeFactor = 1 - (dist / (size * 1.5));
      sizeAttr.array[i] = sizes[i] * (0.5 + heartbeat * 0.5) * fadeFactor * intensity;
    }
    
    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    
    // Rotate entire particle system slowly
    pointsRef.current.rotation.y = t * 0.05;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        color={JARVIS_COLORS.gold}
        size={0.02}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// DATA RIBBONS - Orbital electron paths with data nodes
// ============================================================================

function DataRibbon({ 
  size, 
  radius, 
  angle, 
  speed, 
  color,
  intensity 
}: { 
  size: number; 
  radius: number; 
  angle: number; 
  speed: number; 
  color: string;
  intensity: number;
}) {
  const ribbonRef = useRef<THREE.Group>(null);
  const nodeRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Line>(null);
  
  // Create trail points
  const trailPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 100;
    
    for (let i = 0; i < segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const x = Math.cos(t) * radius * size;
      const y = Math.sin(t * 0.5) * radius * size * 0.3;
      const z = Math.sin(t) * radius * size;
      points.push(new THREE.Vector3(x, y, z));
    }
    
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius, size]);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    
    if (ribbonRef.current) {
      ribbonRef.current.rotation.y = t;
      ribbonRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
    }
    
    if (nodeRef.current) {
      // Node travels along the path
      const pathT = t % (Math.PI * 2);
      nodeRef.current.position.x = Math.cos(pathT) * radius * size;
      nodeRef.current.position.y = Math.sin(pathT * 0.5) * radius * size * 0.3;
      nodeRef.current.position.z = Math.sin(pathT) * radius * size;
      
      // Pulse the node
      const pulse = Math.sin(t * 5) * 0.3 + 1;
      nodeRef.current.scale.setScalar(pulse);
    }
  });
  
  return (
    <group ref={ribbonRef} rotation={[angle, 0, 0]}>
      {/* Trail line */}
      <line ref={trailRef} geometry={trailPoints}>
        <lineBasicMaterial 
          color={color} 
          transparent 
          opacity={0.4 * intensity}
          blending={THREE.AdditiveBlending}
        />
      </line>
      
      {/* Data node */}
      <mesh ref={nodeRef}>
        <octahedronGeometry args={[size * 0.03]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Node glow */}
      <mesh ref={nodeRef}>
        <sphereGeometry args={[size * 0.05, 16, 16]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function DataRibbonSystem({ size, intensity }: { size: number; intensity: number }) {
  const ribbons = [
    { radius: 1.1, angle: 0, speed: 0.3, color: JARVIS_COLORS.gold },
    { radius: 1.2, angle: Math.PI / 4, speed: 0.25, color: JARVIS_COLORS.goldBright },
    { radius: 1.3, angle: Math.PI / 2, speed: 0.35, color: JARVIS_COLORS.orange },
    { radius: 1.15, angle: Math.PI / 3, speed: 0.28, color: JARVIS_COLORS.amber },
    { radius: 1.25, angle: -Math.PI / 6, speed: 0.32, color: JARVIS_COLORS.gold },
  ];
  
  return (
    <group>
      {ribbons.map((ribbon, i) => (
        <DataRibbon
          key={i}
          size={size}
          radius={ribbon.radius}
          angle={ribbon.angle}
          speed={ribbon.speed}
          color={ribbon.color}
          intensity={intensity}
        />
      ))}
    </group>
  );
}

// ============================================================================
// HOLOGRAPHIC WIREFRAME HELMET (Optional)
// ============================================================================

function HolographicHelmet({ size, intensity }: { size: number; intensity: number }) {
  const helmetRef = useRef<THREE.Group>(null);
  const [assemblyProgress, setAssemblyProgress] = useState(0);
  
  useEffect(() => {
    // Animate assembly
    const start = Date.now();
    const duration = 3000;
    
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setAssemblyProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, []);
  
  useFrame((state) => {
    if (helmetRef.current) {
      helmetRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });
  
  return (
    <group ref={helmetRef} scale={size * 0.3}>
      {/* Simplified helmet wireframe */}
      <mesh>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial
          color={JARVIS_COLORS.gold}
          wireframe
          transparent
          opacity={0.6 * intensity * assemblyProgress}
        />
      </mesh>
      
      {/* Face plate */}
      <mesh position={[0, 0, 0.5]} scale={[0.8, 1, 0.3]}>
        <boxGeometry args={[1, 1.2, 0.5]} />
        <meshBasicMaterial
          color={JARVIS_COLORS.gold}
          transparent
          opacity={0.3 * intensity * assemblyProgress}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Eye slits */}
      {[-0.2, 0.2].map((x, i) => (
        <mesh key={i} position={[x, 0.15, 0.8]}>
          <planeGeometry args={[0.25, 0.08]} />
          <meshBasicMaterial
            color={JARVIS_COLORS.arcGlow}
            transparent
            opacity={0.9 * assemblyProgress}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// SCANLINE OVERLAY - Holographic effect
// ============================================================================

function ScanlineOverlay({ size, intensity }: { size: number; intensity: number }) {
  const overlayRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (overlayRef.current) {
      // Animate scanlines
      const mat = overlayRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });
  
  const scanlineShader = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: intensity },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uIntensity;
      varying vec2 vUv;
      
      void main() {
        // Scanline effect
        float scanline = sin(vUv.y * 200.0 + uTime * 2.0) * 0.5 + 0.5;
        scanline = pow(scanline, 8.0);
        
        // Flicker
        float flicker = sin(uTime * 30.0) * 0.02 + 1.0;
        
        // Static noise
        float noise = fract(sin(dot(vUv + uTime * 0.001, vec2(12.9898, 78.233))) * 43758.5453);
        noise = step(0.995, noise) * 0.3;
        
        float alpha = (scanline * 0.1 + noise) * uIntensity * flicker;
        
        gl_FragColor = vec4(1.0, 0.9, 0.7, alpha);
      }
    `,
  }), [intensity]);
  
  return (
    <mesh ref={overlayRef}>
      <sphereGeometry args={[size * 1.6, 64, 64]} />
      <shaderMaterial
        {...scanlineShader}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ============================================================================
// HOLOGRAPHIC HUD ELEMENTS
// ============================================================================

function HUDElement({ 
  position, 
  rotation,
  text, 
  size,
  intensity 
}: { 
  position: [number, number, number]; 
  rotation?: [number, number, number];
  text: string;
  size: number;
  intensity: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Slight float animation
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = position[1] + Math.sin(t * 0.5 + position[0]) * 0.02 * size;
      
      // Always face camera slightly
      groupRef.current.lookAt(state.camera.position);
    }
  });
  
  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Background panel */}
      <mesh>
        <planeGeometry args={[size * 0.4, size * 0.15]} />
        <meshBasicMaterial
          color={JARVIS_COLORS.gold}
          transparent
          opacity={0.1 * intensity}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(size * 0.4, size * 0.15)]} />
        <lineBasicMaterial 
          color={JARVIS_COLORS.goldBright} 
          transparent 
          opacity={0.6 * intensity}
        />
      </lineSegments>
      
      {/* Text */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={size * 0.04}
        color={JARVIS_COLORS.goldBright}
        anchorX="center"
        anchorY="middle"
        font="/fonts/roboto-mono.woff"
      >
        {text}
      </Text>
    </group>
  );
}

function FloatingHUD({ size, intensity }: { size: number; intensity: number }) {
  const hudElements = [
    { position: [size * 1.2, size * 0.3, 0] as [number, number, number], text: 'MARK III' },
    { position: [-size * 1.2, size * 0.2, size * 0.3] as [number, number, number], text: 'JARVIS v2.0' },
    { position: [size * 0.8, -size * 0.4, size * 0.5] as [number, number, number], text: 'SYSTEMS: ONLINE' },
    { position: [-size * 0.9, -size * 0.3, -size * 0.4] as [number, number, number], text: 'ARC REACTOR: 100%' },
    { position: [0, size * 0.6, size * 0.8] as [number, number, number], text: 'STARK INDUSTRIES' },
  ];
  
  return (
    <group>
      {hudElements.map((elem, i) => (
        <HUDElement
          key={i}
          position={elem.position}
          text={elem.text}
          size={size}
          intensity={intensity}
        />
      ))}
    </group>
  );
}

// ============================================================================
// BREATHING ANIMATION WRAPPER
// ============================================================================

function BreathingWrapper({ children, size }: { children: React.ReactNode; size: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const t = state.clock.elapsedTime;
    
    // Breathing scale (1-2% every 4 seconds)
    const breathe = Math.sin(t * 0.4) * 0.01 + 1;
    groupRef.current.scale.setScalar(breathe);
    
    // Subtle floating
    groupRef.current.position.y = Math.sin(t * 0.3) * size * 0.02;
    
    // Very gentle rotation
    groupRef.current.rotation.y = Math.sin(t * 0.1) * 0.02;
  });
  
  return <group ref={groupRef}>{children}</group>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function IronManJarvisOrb({
  position = [0, 0, 0],
  size = 2,
  intensity = 1,
  animate = true,
  onClick,
  showHelmet = false,
  showDataRibbons = true,
  showParticles = true,
  quality = 'high',
}: IronManJarvisOrbProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Quality-based particle count
  const particleCount = quality === 'high' ? 3000 : quality === 'medium' ? 1500 : 500;
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.();
  };
  
  return (
    <group ref={groupRef} position={position} onClick={handleClick}>
      <BreathingWrapper size={size}>
        {/* Arc Reactor Core */}
        <ArcReactorCore size={size} intensity={intensity} />
        
        {/* Golden Gyroscopic Ring System */}
        <GoldenRingSystem size={size} intensity={intensity} />
        
        {/* Particle Field */}
        {showParticles && (
          <ParticleField size={size} intensity={intensity} count={particleCount} />
        )}
        
        {/* Data Ribbons */}
        {showDataRibbons && (
          <DataRibbonSystem size={size} intensity={intensity} />
        )}
        
        {/* Optional Helmet Wireframe */}
        {showHelmet && (
          <HolographicHelmet size={size} intensity={intensity} />
        )}
        
        {/* Floating HUD Elements */}
        <FloatingHUD size={size} intensity={intensity} />
        
        {/* Scanline Overlay */}
        <ScanlineOverlay size={size} intensity={intensity} />
        
        {/* Ambient lights */}
        <pointLight 
          color={JARVIS_COLORS.gold} 
          intensity={intensity * 1.5} 
          distance={size * 10}
          position={[size, size, size]}
        />
        <pointLight 
          color={JARVIS_COLORS.orange} 
          intensity={intensity * 1} 
          distance={size * 8}
          position={[-size, -size, size]}
        />
      </BreathingWrapper>
    </group>
  );
}

export default IronManJarvisOrb;

