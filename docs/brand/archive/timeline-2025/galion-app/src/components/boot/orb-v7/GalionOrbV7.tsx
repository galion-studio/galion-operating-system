'use client';

/**
 * GalionOrbV7.2 - The Epic Interactive Orb
 *
 * An Awwwards-quality, ultra-responsive AI orb visualization
 * featuring 50 emotions, 8K shaders, birth animations,
 * audio reactivity, and organic living feel.
 *
 * Inspired by: Octagos AI Orb (Awwwards)
 * Built for: Galion.app boot sequence
 *
 * VERSION 7.2.1 - Enhanced with modular components:
 * - OrbPlasmaCore - Central consciousness with noise displacement
 * - OrbGlassSurface - Ethereal iridescent shell
 * - OrbParticleField - 600+ orbital particles
 * - OrbEnergyRings - 5 rotating holographic rings
 * - OrbLightningTendrils - 12 dynamic energy connections
 * - CosmicBackground - 1500+ stars with nebula
 */

import React, { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, Preload } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

import {
  cosmicVertexShader,
  cosmicFragmentShader,
  glowVertexShader,
  glowFragmentShader,
  particleVertexShader,
  particleFragmentShader,
} from './shaders/cosmicShader';

import {
  EmotionConfig,
  NEUTRAL_EMOTION,
  BIRTH_EMOTION,
  getEmotion,
  lerpEmotionConfig,
} from './core/emotions';

// ============================================================================
// TYPES
// ============================================================================

export interface GalionOrbV7Props {
  emotion?: string;
  birthProgress?: number; // 0-1 for birth animation
  audioLevel?: number; // 0-1 for audio reactivity
  isListening?: boolean;
  isSpeaking?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  onBirthComplete?: () => void;
  className?: string;
}

interface OrbCoreProps {
  emotion: EmotionConfig;
  birthProgress: number;
  audioLevel: number;
}

interface ParticleFieldProps {
  emotion: EmotionConfig;
  birthProgress: number;
  audioLevel: number;
  count: number;
}

interface GlowLayerProps {
  emotion: EmotionConfig;
  birthProgress: number;
  scale: number;
  opacity: number;
}

// ============================================================================
// QUALITY PRESETS
// ============================================================================

const QUALITY_PRESETS = {
  low: { segments: 32, particles: 500, layers: 2 },
  medium: { segments: 64, particles: 1000, layers: 3 },
  high: { segments: 128, particles: 2000, layers: 4 },
  ultra: { segments: 256, particles: 4000, layers: 5 }, // 8K quality
};

// ============================================================================
// ORB CORE - Main sphere with cosmic shader
// ============================================================================

const OrbCore: React.FC<OrbCoreProps> = React.memo(({ emotion, birthProgress, audioLevel }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Create shader material
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: emotion.energy },
      uBirthProgress: { value: birthProgress },
      uAudioReactivity: { value: audioLevel },
      uEmotionColor: { value: new THREE.Color(emotion.color) },
      uSecondaryColor: { value: new THREE.Color(emotion.secondaryColor) },
      uEmotionEnergy: { value: emotion.energy },
      uNoiseTexture: { value: null },
    }),
    []
  );

  // Update uniforms every frame
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
      materialRef.current.uniforms.uBirthProgress.value = birthProgress;
      materialRef.current.uniforms.uAudioReactivity.value = audioLevel;

      // Smooth emotion color transition
      const targetColor = new THREE.Color(emotion.color);
      materialRef.current.uniforms.uEmotionColor.value.lerp(targetColor, 0.05);

      const targetSecondary = new THREE.Color(emotion.secondaryColor);
      materialRef.current.uniforms.uSecondaryColor.value.lerp(targetSecondary, 0.05);

      materialRef.current.uniforms.uEmotionEnergy.value +=
        (emotion.energy - materialRef.current.uniforms.uEmotionEnergy.value) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={cosmicVertexShader}
        fragmentShader={cosmicFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
});

OrbCore.displayName = 'OrbCore';

// ============================================================================
// GLOW LAYER - Fresnel-based outer glow
// ============================================================================

const GlowLayer: React.FC<GlowLayerProps> = React.memo(
  ({ emotion, birthProgress, scale, opacity }) => {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const uniforms = useMemo(
      () => ({
        uColor: { value: new THREE.Color(emotion.color) },
        uOpacity: { value: opacity },
        uTime: { value: 0 },
        uBirthProgress: { value: birthProgress },
      }),
      []
    );

    useFrame(({ clock }) => {
      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = clock.elapsedTime;
        materialRef.current.uniforms.uBirthProgress.value = birthProgress;

        const targetColor = new THREE.Color(emotion.color);
        materialRef.current.uniforms.uColor.value.lerp(targetColor, 0.05);
      }
    });

    return (
      <mesh scale={scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={glowVertexShader}
          fragmentShader={glowFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    );
  }
);

GlowLayer.displayName = 'GlowLayer';

// ============================================================================
// PARTICLE FIELD - Floating particles around orb
// ============================================================================

const ParticleField: React.FC<ParticleFieldProps> = React.memo(
  ({ emotion, birthProgress, audioLevel, count }) => {
    const pointsRef = useRef<THREE.Points>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    // Generate particle attributes
    const { positions, sizes, lives, velocities, randoms } = useMemo(() => {
      const positions = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const lives = new Float32Array(count);
      const velocities = new Float32Array(count * 3);
      const randoms = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        // Spherical distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 1.2 + Math.random() * 1.5;

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        sizes[i] = 0.02 + Math.random() * 0.06;
        lives[i] = 1 + Math.random() * 4;
        randoms[i] = Math.random();

        // Random velocity
        velocities[i * 3] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      }

      return { positions, sizes, lives, velocities, randoms };
    }, [count]);

    const uniforms = useMemo(
      () => ({
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uBirthProgress: { value: birthProgress },
        uAudioReactivity: { value: audioLevel },
        uColor: { value: new THREE.Color(emotion.color) },
      }),
      []
    );

    useFrame(({ clock }) => {
      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = clock.elapsedTime;
        materialRef.current.uniforms.uBirthProgress.value = birthProgress;
        materialRef.current.uniforms.uAudioReactivity.value = audioLevel;

        const targetColor = new THREE.Color(emotion.color);
        materialRef.current.uniforms.uColor.value.lerp(targetColor, 0.05);
      }
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
          <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
          <bufferAttribute attach="attributes-aLife" count={count} array={lives} itemSize={1} />
          <bufferAttribute
            attach="attributes-aVelocity"
            count={count}
            array={velocities}
            itemSize={3}
          />
          <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
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
);

ParticleField.displayName = 'ParticleField';

// ============================================================================
// AURORA RINGS - Energy rings around the orb
// ============================================================================

const AuroraRing: React.FC<{
  emotion: EmotionConfig;
  birthProgress: number;
  index: number;
  total: number;
}> = React.memo(({ emotion, birthProgress, index, total }) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const t = clock.elapsedTime;
      const offset = (index / total) * Math.PI * 2;

      ringRef.current.rotation.x = Math.sin(t * 0.3 + offset) * 0.3;
      ringRef.current.rotation.y = t * 0.2 + offset;
      ringRef.current.rotation.z = Math.cos(t * 0.4 + offset) * 0.2;

      // Birth animation - rings expand outward
      const birthScale = Math.max(0, birthProgress * 2 - index * 0.1);
      ringRef.current.scale.setScalar(1.3 + index * 0.15 + birthScale * 0.2);

      // Fade in during birth
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.min(1, birthProgress * 3 - index * 0.2) * 0.3;
    }
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[1.3 + index * 0.15, 0.01, 16, 100]} />
      <meshBasicMaterial
        color={emotion.color}
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
});

AuroraRing.displayName = 'AuroraRing';

// ============================================================================
// SCENE - Complete 3D scene composition
// ============================================================================

const OrbScene: React.FC<{
  emotion: EmotionConfig;
  birthProgress: number;
  audioLevel: number;
  quality: keyof typeof QUALITY_PRESETS;
}> = React.memo(({ emotion, birthProgress, audioLevel, quality }) => {
  const groupRef = useRef<THREE.Group>(null);
  const preset = QUALITY_PRESETS[quality];

  // Subtle floating animation
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime;
      groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Core orb only - clean design */}
      <OrbCore emotion={emotion} birthProgress={birthProgress} audioLevel={audioLevel} />
    </group>
  );
});

OrbScene.displayName = 'OrbScene';

// ============================================================================
// CAMERA CONTROLLER - Smooth camera movements
// ============================================================================

const CameraController: React.FC<{ birthProgress: number }> = ({ birthProgress }) => {
  const { camera } = useThree();

  useFrame(() => {
    // Start zoomed in, pull back during birth
    const targetZ = 2.5 + birthProgress * 1;
    camera.position.z += (targetZ - camera.position.z) * 0.02;
  });

  return null;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GalionOrbV7: React.FC<GalionOrbV7Props> = ({
  emotion = 'neutral',
  birthProgress = 1,
  audioLevel = 0,
  isListening = false,
  isSpeaking = false,
  quality = 'high',
  onBirthComplete,
  className = '',
}) => {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionConfig>(NEUTRAL_EMOTION);
  const [internalBirthProgress, setInternalBirthProgress] = useState(birthProgress);
  const birthCompleteRef = useRef(false);

  // Handle emotion changes with smooth transitions
  useEffect(() => {
    const targetEmotion = emotion === 'birth' ? BIRTH_EMOTION : getEmotion(emotion);
    setCurrentEmotion(targetEmotion);
  }, [emotion]);

  // Handle birth animation progress
  useEffect(() => {
    setInternalBirthProgress(birthProgress);

    if (birthProgress >= 1 && !birthCompleteRef.current) {
      birthCompleteRef.current = true;
      onBirthComplete?.();
    }
  }, [birthProgress, onBirthComplete]);

  // Calculate audio reactivity with listening/speaking boost
  const effectiveAudioLevel = useMemo(() => {
    let level = audioLevel;
    if (isListening) level = Math.max(level, 0.3);
    if (isSpeaking) level = Math.max(level, 0.5);
    return level;
  }, [audioLevel, isListening, isSpeaking]);

  return (
    <div className={`relative w-[400px] h-[400px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true,
        }}
        dpr={[1, 2]}
      >
        {/* Ambient lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#00ff88" />

        {/* Camera controller */}
        <CameraController birthProgress={internalBirthProgress} />

        {/* Float wrapper for organic movement */}
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
          <OrbScene
            emotion={currentEmotion}
            birthProgress={internalBirthProgress}
            audioLevel={effectiveAudioLevel}
            quality={quality}
          />
        </Float>

        {/* Environment for reflections */}
        <Environment preset="night" />

        {/* Preload assets */}
        <Preload all />
      </Canvas>

      {/* Birth flash overlay */}
      <AnimatePresence>
        {internalBirthProgress > 0.1 && internalBirthProgress < 0.5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${currentEmotion.color}40 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Audio indicator removed for clean design - status shown in LiveTranscript */}
    </div>
  );
};

export default GalionOrbV7;
