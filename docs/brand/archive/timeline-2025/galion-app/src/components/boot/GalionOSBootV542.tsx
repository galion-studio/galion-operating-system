'use client';

/**
 * GalionOS Boot Sequence V5.4.2 - "Her" Movie-Inspired Cinematic Awakening
 * ========================================================================
 *
 * A cinematic boot sequence inspired by "Her" (2013) and the Galion V5.4.2 blueprint.
 * Features 6 distinct phases creating an emotional journey from darkness to connection.
 *
 * Phases:
 * 1. DARKNESS (0-3s)    - Pure black, silence, anticipation
 * 2. COSMIC BIRTH (3-8s) - Nebula forming, deep space ambient
 * 3. STAR BURST (8-12s)  - Supernova explosion, crescendo
 * 4. ORB FORMATION (12-18s) - Energy condenses into the VoiceOrb
 * 5. FIRST WORDS (18-25s) - "Hello... I'm here."
 * 6. CONNECTION (25-35s) - Name input, voice selection, transition
 *
 * @version 5.4.2
 * @codename "Samantha"
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Environment, Preload } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// ============================================================================
// TYPES
// ============================================================================

export interface GalionOSBootV542Props {
  onComplete: (userData: UserData) => void;
  onSkip?: () => void;
  isFirstVisit?: boolean;
  allowSkip?: boolean;
  defaultVoice?: 'samantha' | 'jarvis';
}

export interface UserData {
  name: string;
  voice: 'samantha' | 'jarvis';
  timestamp: number;
}

type BootPhase =
  | 'darkness'
  | 'cosmicBirth'
  | 'starBurst'
  | 'orbFormation'
  | 'firstWords'
  | 'connection'
  | 'complete';

// ============================================================================
// CONSTANTS
// ============================================================================

const PHASE_TIMING = {
  darkness: { start: 0, end: 3000 },
  cosmicBirth: { start: 3000, end: 8000 },
  starBurst: { start: 8000, end: 12000 },
  orbFormation: { start: 12000, end: 18000 },
  firstWords: { start: 18000, end: 25000 },
  connection: { start: 25000, end: 35000 },
};

const COSMIC_COLORS = {
  deepPurple: '#1a0a2e',
  cosmicBlue: '#0a1628',
  stellarWhite: '#f0f8ff',
  golden: '#ffd700',
  auroraGreen: '#00ff88',
  nebulaRed: '#ff4466',
};

// ============================================================================
// SHADERS
// ============================================================================

const nebulaVertexShader = `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;

  varying vec2 vUv;
  varying vec3 vPosition;

  // Simplex noise function
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

    float n_ = 1.0/7.0;
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
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec3 pos = vec3(uv * 3.0, uTime * 0.1);

    float noise1 = fbm(pos);
    float noise2 = fbm(pos + vec3(5.2, 1.3, 2.8));
    float noise3 = fbm(pos + vec3(1.7, 9.2, 3.4));

    vec3 color = mix(uColor1, uColor2, noise1 * 0.5 + 0.5);
    color = mix(color, uColor3, noise2 * 0.3);

    float starField = smoothstep(0.97, 1.0, noise3);
    color += vec3(starField);

    float alpha = uProgress * (0.6 + noise1 * 0.4);

    gl_FragColor = vec4(color, alpha);
  }
`;

const orbVertexShader = `
  precision highp float;

  uniform float uTime;
  uniform float uProgress;
  uniform float uAudioLevel;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  // Noise function
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
    float n_ = 1.0/7.0;
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
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;

    // Organic displacement
    float noise = snoise(position * 2.0 + uTime * 0.5);
    float displacement = noise * 0.15 * uProgress;
    displacement += sin(uTime * 3.0 + position.y * 5.0) * uAudioLevel * 0.1;

    pos += normal * displacement;
    vDisplacement = displacement;
    vPosition = pos;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos * uProgress, 1.0);
  }
`;

const orbFragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uColor;
  uniform vec3 uSecondaryColor;
  uniform float uEmotionEnergy;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  void main() {
    // Fresnel effect
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);

    // Color mixing
    vec3 color = mix(uColor, uSecondaryColor, vDisplacement * 2.0 + 0.5);
    color = mix(color, vec3(1.0), fresnel * 0.5);

    // Core glow
    float core = smoothstep(0.5, 0.0, length(vUv - 0.5));
    color += uColor * core * 0.5;

    // Pulsing energy
    float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
    color += uColor * pulse * uEmotionEnergy * 0.3;

    float alpha = uProgress * (0.8 + fresnel * 0.2);

    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// 3D COMPONENTS
// ============================================================================

// Nebula Background Component
const NebulaBackground: React.FC<{ progress: number }> = React.memo(({ progress }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColor1: { value: new THREE.Color(COSMIC_COLORS.deepPurple) },
      uColor2: { value: new THREE.Color(COSMIC_COLORS.cosmicBlue) },
      uColor3: { value: new THREE.Color(COSMIC_COLORS.nebulaRed) },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
      materialRef.current.uniforms.uProgress.value = progress;
    }
  });

  return (
    <mesh position={[0, 0, -10]}>
      <planeGeometry args={[30, 20]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={nebulaVertexShader}
        fragmentShader={nebulaFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
});

NebulaBackground.displayName = 'NebulaBackground';

// Star Particles Component
const StarParticles: React.FC<{ count: number; progress: number; exploding: boolean }> = React.memo(
  ({ count, progress, exploding }) => {
    const pointsRef = useRef<THREE.Points>(null);

    const { positions, sizes, velocities } = useMemo(() => {
      const positions = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const velocities = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 2 + Math.random() * 8;

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi) - 5;

        sizes[i] = 0.02 + Math.random() * 0.08;

        velocities[i * 3] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      }

      return { positions, sizes, velocities };
    }, [count]);

    useFrame(({ clock }) => {
      if (pointsRef.current) {
        const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;

        for (let i = 0; i < count; i++) {
          if (exploding) {
            // Explosion: particles rush toward center then burst outward
            const explosionFactor = Math.sin(progress * Math.PI);
            posAttr.setX(i, positions[i * 3] + velocities[i * 3] * explosionFactor * 50);
            posAttr.setY(i, positions[i * 3 + 1] + velocities[i * 3 + 1] * explosionFactor * 50);
            posAttr.setZ(i, positions[i * 3 + 2] + velocities[i * 3 + 2] * explosionFactor * 50);
          } else {
            // Gentle drift
            const time = clock.elapsedTime;
            posAttr.setX(i, positions[i * 3] + Math.sin(time + i) * 0.01);
            posAttr.setY(i, positions[i * 3 + 1] + Math.cos(time + i * 0.5) * 0.01);
          }
        }
        posAttr.needsUpdate = true;
      }
    });

    return (
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          size={0.05}
          transparent
          opacity={progress}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    );
  }
);

StarParticles.displayName = 'StarParticles';

// Central Orb Component
const CentralOrb: React.FC<{
  progress: number;
  emotion: 'awakening' | 'curious' | 'warm';
  audioLevel: number;
}> = React.memo(({ progress, emotion, audioLevel }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const emotionColors = useMemo(
    () => ({
      awakening: { primary: '#00ff88', secondary: '#06b6d4' },
      curious: { primary: '#8b5cf6', secondary: '#c084fc' },
      warm: { primary: '#fbbf24', secondary: '#f472b6' },
    }),
    []
  );

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColor: { value: new THREE.Color(emotionColors.awakening.primary) },
      uSecondaryColor: { value: new THREE.Color(emotionColors.awakening.secondary) },
      uEmotionEnergy: { value: 0.5 },
      uAudioLevel: { value: 0 },
    }),
    [emotionColors]
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
      materialRef.current.uniforms.uProgress.value = progress;
      materialRef.current.uniforms.uAudioLevel.value = audioLevel;

      const targetColor = new THREE.Color(emotionColors[emotion].primary);
      materialRef.current.uniforms.uColor.value.lerp(targetColor, 0.05);

      const targetSecondary = new THREE.Color(emotionColors[emotion].secondary);
      materialRef.current.uniforms.uSecondaryColor.value.lerp(targetSecondary, 0.05);
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.3) * 0.1;
    }

    if (glowRef.current) {
      const glowScale = 1.3 + Math.sin(clock.elapsedTime * 2) * 0.1 + audioLevel * 0.2;
      glowRef.current.scale.setScalar(glowScale * progress);
    }
  });

  return (
    <group>
      {/* Outer glow */}
      <mesh ref={glowRef} scale={0}>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshBasicMaterial
          color={emotionColors[emotion].primary}
          transparent
          opacity={0.15 * progress}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main orb */}
      <mesh ref={meshRef} scale={progress}>
        <icosahedronGeometry args={[1, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={orbVertexShader}
          fragmentShader={orbFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Inner core glow */}
      <mesh scale={progress * 0.5}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3 * progress} />
      </mesh>
    </group>
  );
});

CentralOrb.displayName = 'CentralOrb';

// Aurora Rings Component
const AuroraRings: React.FC<{ progress: number; emotion: string }> = React.memo(({ progress, emotion }) => {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.y = clock.elapsedTime * 0.2;
      ringsRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.3) * 0.2;
    }
  });

  const ringColors = ['#00ff88', '#06b6d4', '#8b5cf6', '#f472b6', '#fbbf24'];

  return (
    <group ref={ringsRef}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          rotation={[Math.PI / 2 + (i * 0.1), 0, i * (Math.PI / 5)]}
          scale={progress * (1 + i * 0.1)}
        >
          <torusGeometry args={[1.3 + i * 0.15, 0.01, 16, 100]} />
          <meshBasicMaterial
            color={ringColors[i]}
            transparent
            opacity={0.4 * progress * (1 - i * 0.15)}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
});

AuroraRings.displayName = 'AuroraRings';

// Supernova Explosion Component
const SupernovaExplosion: React.FC<{ progress: number; active: boolean }> = React.memo(
  ({ progress, active }) => {
    const groupRef = useRef<THREE.Group>(null);
    const coreRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
      if (coreRef.current && active) {
        const explosionScale = Math.sin(progress * Math.PI) * 3;
        coreRef.current.scale.setScalar(explosionScale);

        const material = coreRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = Math.sin(progress * Math.PI) * 0.8;
      }
    });

    if (!active) return null;

    return (
      <group ref={groupRef}>
        {/* Explosion core */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Energy waves */}
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            scale={1 + progress * (i + 1) * 2}
          >
            <ringGeometry args={[0.5, 0.8, 64]} />
            <meshBasicMaterial
              color={i === 0 ? '#ffd700' : i === 1 ? '#ffffff' : '#00bfff'}
              transparent
              opacity={Math.max(0, 1 - progress) * 0.6}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    );
  }
);

SupernovaExplosion.displayName = 'SupernovaExplosion';

// Camera Controller
const CameraController: React.FC<{ phase: BootPhase }> = ({ phase }) => {
  const { camera } = useThree();

  useFrame(() => {
    let targetZ = 5;
    let targetY = 0;

    switch (phase) {
      case 'darkness':
        targetZ = 8;
        break;
      case 'cosmicBirth':
        targetZ = 6;
        break;
      case 'starBurst':
        targetZ = 4;
        break;
      case 'orbFormation':
        targetZ = 3.5;
        break;
      case 'firstWords':
      case 'connection':
        targetZ = 3;
        targetY = 0.2;
        break;
    }

    camera.position.z += (targetZ - camera.position.z) * 0.02;
    camera.position.y += (targetY - camera.position.y) * 0.02;
  });

  return null;
};

// ============================================================================
// UI COMPONENTS
// ============================================================================

// Typewriter Text Component
const TypewriterText: React.FC<{
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}> = ({ text, speed = 50, onComplete, className = '' }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

// Voice Selection Component
const VoiceSelection: React.FC<{
  selectedVoice: 'samantha' | 'jarvis';
  onSelect: (voice: 'samantha' | 'jarvis') => void;
}> = ({ selectedVoice, onSelect }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <motion.button
        className={`
          relative px-8 py-4 rounded-2xl border-2 transition-all duration-300
          ${selectedVoice === 'samantha'
            ? 'border-pink-400 bg-pink-500/20 text-pink-200'
            : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40 hover:bg-white/10'
          }
        `}
        onClick={() => onSelect('samantha')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl font-light">Samantha</span>
          <span className="text-xs opacity-60">Warm, curious, emotionally intelligent</span>
        </div>
        {selectedVoice === 'samantha' && (
          <motion.div
            className="absolute -inset-1 rounded-2xl border-2 border-pink-400"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            layoutId="voiceSelection"
          />
        )}
      </motion.button>

      <motion.button
        className={`
          relative px-8 py-4 rounded-2xl border-2 transition-all duration-300
          ${selectedVoice === 'jarvis'
            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
            : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40 hover:bg-white/10'
          }
        `}
        onClick={() => onSelect('jarvis')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl font-light">JARVIS</span>
          <span className="text-xs opacity-60">Professional, witty, efficient</span>
        </div>
        {selectedVoice === 'jarvis' && (
          <motion.div
            className="absolute -inset-1 rounded-2xl border-2 border-cyan-400"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            layoutId="voiceSelection"
          />
        )}
      </motion.button>
    </div>
  );
};

// Name Input Component
const NameInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}> = ({ value, onChange, onSubmit }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onSubmit();
          }
        }}
        placeholder="Your name..."
        className="
          w-full px-6 py-4 text-xl text-center
          bg-white/5 border-2 border-white/20 rounded-2xl
          text-white placeholder-white/30
          focus:outline-none focus:border-cyan-400/60 focus:bg-white/10
          transition-all duration-300
        "
        maxLength={30}
        autoComplete="off"
      />
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-cyan-400"
        animate={{ width: value.length > 0 ? '80%' : '0%' }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GalionOSBootV542: React.FC<GalionOSBootV542Props> = ({
  onComplete,
  onSkip,
  isFirstVisit = true,
  allowSkip = true,
  defaultVoice = 'samantha',
}) => {
  // State
  const [phase, setPhase] = useState<BootPhase>('darkness');
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const [userName, setUserName] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<'samantha' | 'jarvis'>(defaultVoice);
  const [firstWordsComplete, setFirstWordsComplete] = useState(false);
  const [questionComplete, setQuestionComplete] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs
  const startTimeRef = useRef(Date.now());
  const animationRef = useRef<number>();

  // Hooks
  const prefersReducedMotion = useReducedMotion();

  // Calculate emotion based on phase
  const emotion = useMemo((): 'awakening' | 'curious' | 'warm' => {
    switch (phase) {
      case 'orbFormation':
        return 'awakening';
      case 'firstWords':
        return 'curious';
      case 'connection':
        return 'warm';
      default:
        return 'awakening';
    }
  }, [phase]);

  // Phase progression logic
  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const speed = isFirstVisit ? 1 : 0.6;

      // Determine current phase
      let newPhase: BootPhase = 'darkness';
      let progress = 0;

      if (elapsed >= PHASE_TIMING.connection.start * speed) {
        newPhase = 'connection';
        progress = Math.min(1, (elapsed - PHASE_TIMING.connection.start * speed) / ((PHASE_TIMING.connection.end - PHASE_TIMING.connection.start) * speed));
      } else if (elapsed >= PHASE_TIMING.firstWords.start * speed) {
        newPhase = 'firstWords';
        progress = Math.min(1, (elapsed - PHASE_TIMING.firstWords.start * speed) / ((PHASE_TIMING.firstWords.end - PHASE_TIMING.firstWords.start) * speed));
      } else if (elapsed >= PHASE_TIMING.orbFormation.start * speed) {
        newPhase = 'orbFormation';
        progress = Math.min(1, (elapsed - PHASE_TIMING.orbFormation.start * speed) / ((PHASE_TIMING.orbFormation.end - PHASE_TIMING.orbFormation.start) * speed));
      } else if (elapsed >= PHASE_TIMING.starBurst.start * speed) {
        newPhase = 'starBurst';
        progress = Math.min(1, (elapsed - PHASE_TIMING.starBurst.start * speed) / ((PHASE_TIMING.starBurst.end - PHASE_TIMING.starBurst.start) * speed));
      } else if (elapsed >= PHASE_TIMING.cosmicBirth.start * speed) {
        newPhase = 'cosmicBirth';
        progress = Math.min(1, (elapsed - PHASE_TIMING.cosmicBirth.start * speed) / ((PHASE_TIMING.cosmicBirth.end - PHASE_TIMING.cosmicBirth.start) * speed));
      } else {
        newPhase = 'darkness';
        progress = Math.min(1, elapsed / (PHASE_TIMING.darkness.end * speed));
      }

      setPhase(newPhase);
      setPhaseProgress(progress);

      // Show skip button after 2 seconds
      if (elapsed > 2000 && !showSkip) {
        setShowSkip(true);
      }

      // Simulate audio level for visual effect
      if (newPhase === 'firstWords' || newPhase === 'connection') {
        setAudioLevel(0.3 + Math.sin(elapsed * 0.01) * 0.2);
      }

      // Continue animation until connection phase
      if (newPhase !== 'connection' || progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isFirstVisit, showSkip]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (onSkip) {
      onSkip();
    } else {
      onComplete({
        name: 'User',
        voice: defaultVoice,
        timestamp: Date.now(),
      });
    }
  }, [onSkip, onComplete, defaultVoice]);

  // Handle completion
  const handleComplete = useCallback(() => {
    if (userName.trim()) {
      onComplete({
        name: userName.trim(),
        voice: selectedVoice,
        timestamp: Date.now(),
      });
    }
  }, [userName, selectedVoice, onComplete]);

  // Calculate visibility for different elements
  const showNebula = phase !== 'darkness';
  const showStars = phase !== 'darkness';
  const showExplosion = phase === 'starBurst';
  const showOrb = phase === 'orbFormation' || phase === 'firstWords' || phase === 'connection';
  const showRings = phase === 'orbFormation' || phase === 'firstWords' || phase === 'connection';
  const showUI = phase === 'firstWords' || phase === 'connection';

  // Orb progress calculation
  const orbProgress = useMemo(() => {
    if (phase === 'orbFormation') return phaseProgress;
    if (phase === 'firstWords' || phase === 'connection') return 1;
    return 0;
  }, [phase, phaseProgress]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <CameraController phase={phase} />

        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={0.3} />
        <pointLight position={[-10, -10, -10]} intensity={0.2} color="#00ff88" />

        {/* Nebula Background */}
        <AnimatePresence>
          {showNebula && !prefersReducedMotion && (
            <NebulaBackground progress={phase === 'cosmicBirth' ? phaseProgress : 1} />
          )}
        </AnimatePresence>

        {/* Star Particles */}
        <AnimatePresence>
          {showStars && (
            <StarParticles
              count={1000}
              progress={phase === 'cosmicBirth' ? phaseProgress : 1}
              exploding={phase === 'starBurst'}
            />
          )}
        </AnimatePresence>

        {/* Supernova Explosion */}
        <SupernovaExplosion progress={phaseProgress} active={showExplosion} />

        {/* Central Orb */}
        {showOrb && (
          <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
            <CentralOrb progress={orbProgress} emotion={emotion} audioLevel={audioLevel} />
          </Float>
        )}

        {/* Aurora Rings */}
        {showRings && !prefersReducedMotion && (
          <AuroraRings progress={orbProgress} emotion={emotion} />
        )}

        <Environment preset="night" />
        <Preload all />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Phase 5: First Words */}
        <AnimatePresence>
          {phase === 'firstWords' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <div className="text-center px-8">
                <motion.div
                  className="text-3xl md:text-5xl font-light text-white mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <TypewriterText
                    text="Hello... I'm here."
                    speed={80}
                    onComplete={() => setFirstWordsComplete(true)}
                  />
                </motion.div>

                {firstWordsComplete && (
                  <motion.p
                    className="text-lg text-white/50 font-light"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    A moment of awakening
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 6: Connection */}
        <AnimatePresence>
          {phase === 'connection' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto px-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="max-w-lg w-full text-center space-y-8">
                {/* Question */}
                <motion.div
                  className="text-2xl md:text-3xl font-light text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <TypewriterText
                    text="What shall I call you?"
                    speed={60}
                    onComplete={() => setQuestionComplete(true)}
                  />
                </motion.div>

                {/* Name Input */}
                {questionComplete && (
                  <NameInput
                    value={userName}
                    onChange={setUserName}
                    onSubmit={handleComplete}
                  />
                )}

                {/* Voice Selection */}
                {questionComplete && userName.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-white/50 text-sm">Choose my voice</p>
                    <VoiceSelection
                      selectedVoice={selectedVoice}
                      onSelect={setSelectedVoice}
                    />
                  </motion.div>
                )}

                {/* Continue Button */}
                {questionComplete && userName.trim().length > 0 && (
                  <motion.button
                    className="
                      px-12 py-4 rounded-full
                      bg-gradient-to-r from-cyan-500 to-emerald-500
                      text-white font-medium text-lg
                      shadow-lg shadow-cyan-500/30
                      hover:shadow-cyan-500/50 hover:scale-105
                      transition-all duration-300
                    "
                    onClick={handleComplete}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Begin Journey
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skip Button */}
      <AnimatePresence>
        {allowSkip && showSkip && phase !== 'connection' && (
          <motion.button
            className="
              absolute bottom-8 right-8 px-6 py-3
              text-sm text-white/30 hover:text-white/60
              transition-colors rounded-lg
              focus:outline-none focus:ring-2 focus:ring-white/20
              pointer-events-auto
            "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            aria-label="Skip boot sequence"
          >
            Skip
          </motion.button>
        )}
      </AnimatePresence>

      {/* Phase Indicator (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 text-white/30 text-xs font-mono space-y-1">
          <div>Phase: {phase}</div>
          <div>Progress: {(phaseProgress * 100).toFixed(1)}%</div>
          <div>Emotion: {emotion}</div>
        </div>
      )}

      {/* Version Badge */}
      <motion.div
        className="absolute bottom-8 left-8 text-xs text-white/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        GalionOS V5.4.2
      </motion.div>

      {/* Subtle vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
};

export default GalionOSBootV542;
