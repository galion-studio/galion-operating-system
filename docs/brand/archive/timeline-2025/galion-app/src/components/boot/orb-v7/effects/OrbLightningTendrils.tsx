/**
 * GALION Orb V7.2 - Lightning Tendrils Component
 *
 * Dynamic energy tendrils emanating from the core:
 * - Dynamic line geometry using Catmull-Rom splines
 * - Flickering animation with randomized intensity
 * - Connects core to outer particles
 * - Audio reactive brightness and length
 */

'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbV7State, OrbV7Emotion, AudioData, getEmotionPalette } from '../types';

// ============================================================================
// LIGHTNING TENDRIL CONFIG
// ============================================================================

interface TendrilConfig {
  startAngle: number;
  endAngle: number;
  verticalAngle: number;
  length: number;
  segments: number;
  jitterAmount: number;
  speed: number;
}

function generateTendrilConfigs(count: number): TendrilConfig[] {
  const configs: TendrilConfig[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    configs.push({
      startAngle: angle,
      endAngle: angle + (Math.random() - 0.5) * 0.5,
      verticalAngle: (Math.random() - 0.5) * Math.PI * 0.5,
      length: 2.0 + Math.random() * 2.0,
      segments: 15 + Math.floor(Math.random() * 10),
      jitterAmount: 0.1 + Math.random() * 0.2,
      speed: 0.5 + Math.random() * 1.0,
    });
  }

  return configs;
}

// ============================================================================
// SINGLE TENDRIL COMPONENT
// ============================================================================

interface LightningTendrilProps {
  config: TendrilConfig;
  stateRef: React.MutableRefObject<OrbV7State>;
  emotionRef: React.MutableRefObject<OrbV7Emotion>;
  progressRef: React.MutableRefObject<number>;
  audioRef: React.MutableRefObject<AudioData>;
  innerRadius: number;
}

function LightningTendril({
  config,
  stateRef,
  emotionRef,
  progressRef,
  audioRef,
  innerRadius,
}: LightningTendrilProps) {
  const lineRef = useRef<THREE.Line>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);

  // Create geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(config.segments * 3);

    // Initialize positions
    for (let i = 0; i < config.segments; i++) {
      const t = i / (config.segments - 1);
      const r = innerRadius + t * config.length;

      positions[i * 3] = Math.cos(config.startAngle) * r;
      positions[i * 3 + 1] = Math.sin(config.verticalAngle) * t * config.length * 0.5;
      positions[i * 3 + 2] = Math.sin(config.startAngle) * r;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [config, innerRadius]);

  // Refs for animation
  const timeOffset = useRef(Math.random() * 100);
  const targetColor = useRef(new THREE.Color());

  useFrame((state, delta) => {
    if (!lineRef.current || !materialRef.current) return;

    const time = state.clock.elapsedTime + timeOffset.current;
    const currentState = stateRef.current;
    const currentEmotion = emotionRef.current;
    const progress = progressRef.current;
    const audio = audioRef.current;

    // Get emotion palette
    const palette = getEmotionPalette(currentEmotion);

    // Update positions with jitter
    const positions = lineRef.current.geometry.attributes.position.array as Float32Array;

    // Audio-reactive length
    const audioLength = 1 + audio.level * 0.5;

    for (let i = 0; i < config.segments; i++) {
      const t = i / (config.segments - 1);
      const r = innerRadius + t * config.length * audioLength * progress;

      // Base position
      let x = Math.cos(config.startAngle + t * 0.1) * r;
      let y = Math.sin(config.verticalAngle) * t * config.length * 0.5;
      let z = Math.sin(config.startAngle + t * 0.1) * r;

      // Add jitter/noise
      const jitterScale = config.jitterAmount * t * (1 + audio.level * 2);
      const jitterSpeed = time * config.speed * 10;

      x += Math.sin(jitterSpeed + i * 0.5) * jitterScale;
      y += Math.cos(jitterSpeed * 1.3 + i * 0.7) * jitterScale;
      z += Math.sin(jitterSpeed * 0.8 + i * 0.3) * jitterScale;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    lineRef.current.geometry.attributes.position.needsUpdate = true;

    // Update color
    targetColor.current.set(palette.accent);
    materialRef.current.color.lerp(targetColor.current, delta * 3);

    // Flickering opacity
    const flicker = Math.sin(time * 20) * 0.3 + 0.7;
    const audioFlicker = Math.sin(time * 30 * (1 + audio.level)) * audio.level * 0.2;

    // State-based visibility
    let baseOpacity = 0.5;

    switch (currentState) {
      case 'dormant':
        baseOpacity = 0.0;
        break;
      case 'awakening':
        baseOpacity = 0.2;
        break;
      case 'expanding':
        baseOpacity = 0.4;
        break;
      case 'pulsing':
        baseOpacity = 0.6;
        break;
      case 'aware':
        baseOpacity = 0.5;
        break;
      case 'transcending':
        baseOpacity = 0.8;
        break;
    }

    materialRef.current.opacity = baseOpacity * flicker * progress + audioFlicker;
  });

  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <line ref={lineRef} geometry={geometry} renderOrder={6}>
      <lineBasicMaterial
        ref={materialRef}
        color="#8B5CF6"
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        linewidth={1}
      />
    </line>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface OrbLightningTendrilsProps {
  stateRef: React.MutableRefObject<OrbV7State>;
  emotionRef: React.MutableRefObject<OrbV7Emotion>;
  progressRef: React.MutableRefObject<number>;
  audioRef: React.MutableRefObject<AudioData>;
  tendrilCount?: number;
  innerRadius?: number;
}

export function OrbLightningTendrils({
  stateRef,
  emotionRef,
  progressRef,
  audioRef,
  tendrilCount = 12,
  innerRadius = 1.0,
}: OrbLightningTendrilsProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Generate tendril configs
  const tendrilConfigs = useMemo(
    () => generateTendrilConfigs(tendrilCount),
    [tendrilCount]
  );

  // Slow rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      {tendrilConfigs.map((config, index) => (
        <LightningTendril
          key={index}
          config={config}
          stateRef={stateRef}
          emotionRef={emotionRef}
          progressRef={progressRef}
          audioRef={audioRef}
          innerRadius={innerRadius}
        />
      ))}
    </group>
  );
}

export default OrbLightningTendrils;
