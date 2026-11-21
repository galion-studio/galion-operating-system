/**
 * GALION Orb V5.2 - Glow Component
 *
 * Multi-layer glow and bloom effects
 */

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getEmotionConfig } from "../config/emotions";
import { getStateConfig } from "../config/states";
import { BlendedEmotionResult, Emotion, OrbState } from "../types";

// ============================================================================
// SHADERS
// ============================================================================

const glowVertexShader = `
varying vec3 vNormal;
varying vec3 vPositionWorld;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPositionWorld = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const glowFragmentShader = `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uFalloff;
uniform float uTime;
uniform float uPulse;

varying vec3 vNormal;
varying vec3 vPositionWorld;

void main() {
  // Fresnel-based glow
  vec3 viewDirection = normalize(cameraPosition - vPositionWorld);
  float fresnel = 1.0 - abs(dot(vNormal, viewDirection));
  fresnel = pow(fresnel, uFalloff);
  
  // Pulsing effect
  float pulse = 1.0 + sin(uTime * 2.0) * uPulse * 0.15;
  
  // Final glow
  float glow = fresnel * uIntensity * pulse;
  
  gl_FragColor = vec4(uColor, glow);
}
`;

// ============================================================================
// COMPONENT
// ============================================================================

export interface OrbGlowProps {
  /** Current state */
  state: OrbState;
  /** Current emotion */
  emotion: Emotion;
  /** Blended emotion result */
  blendedResult?: BlendedEmotionResult;
  /** State Ref */
  stateRef?: React.MutableRefObject<OrbState>;
  /** Emotion Ref */
  emotionRef?: React.MutableRefObject<Emotion>;
  /** Base size of the glow */
  size?: number;
  /** Number of glow layers */
  layers?: number;
  /** Enable animations */
  animate?: boolean;
  /** Animation progress (0-1) */
  animationProgress?: number;
  /** Audio data ref */
  audioRef?: React.MutableRefObject<any>;
}

export function OrbGlow({
  state,
  emotion,
  blendedResult,
  stateRef,
  emotionRef,
  size = 1.0,
  layers = 2,
  animate = true,
  animationProgress = 0,
  audioRef,
}: OrbGlowProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<THREE.ShaderMaterial[]>([]);

  // Initial configs
  const initialState = stateRef?.current || state;
  const initialEmotion = emotionRef?.current || emotion;
  const stateConfig = getStateConfig(initialState);
  const emotionConfig = getEmotionConfig(initialEmotion);
  // Note: we can't easily ref-read blendedResult initial structure if it wasn't passed as prop initially?
  // Assume basic prop usage for initialization is fine, dynamic updates use refs/configs.
  // Actually, we should check emotionConfig.colors as fallback.
  const colors = blendedResult?.colors || emotionConfig.colors;

  // Create glow layer configurations
  const glowLayers = useMemo(() => {
    return Array.from({ length: layers }, (_, i) => {
      const layerScale = size * (1.1 + i * 0.15);
      const intensity = stateConfig.visual.glowIntensity * 0.15 * (1 - i * 0.25);
      const falloff = 2.5 + i * 0.5;
      return { scale: layerScale, intensity, falloff, index: i };
    });
  }, [layers, size, stateConfig.visual.glowIntensity]);

  // Create uniforms for each layer
  const uniformsArray = useMemo(() => {
    return glowLayers.map((layer) => ({
      uColor: { value: new THREE.Color(colors.glow) },
      uIntensity: { value: layer.intensity },
      uFalloff: { value: layer.falloff },
      uTime: { value: 0 },
      uPulse: { value: stateConfig.visual.glowIntensity },
    }));
  }, [glowLayers, colors.glow, stateConfig.visual.glowIntensity]);

  // Animation loop
  useFrame((frameState, delta) => {
    if (!animate) return;

    // READ DYNAMIC REFS
    const currentState = stateRef?.current || state;
    const currentEmotion = emotionRef?.current || emotion;
    const currentStateConfig = getStateConfig(currentState);
    const currentEmotionConfig = getEmotionConfig(currentEmotion);
    const currentColors = currentEmotionConfig.colors; // Simplify here: use standard emotion colors if blended not avail via ref (TODO: pass BlendedRef if needed)

    // Get current audio level from ref if available
    const currentAudioLevel = audioRef?.current?.analysis?.level || 0;

    const time = frameState.clock.elapsedTime;

    materialsRef.current.forEach((material, i) => {
      if (!material) return;

      material.uniforms.uTime.value = time;

      // Update color
      const targetColor = new THREE.Color(currentColors.glow);
      material.uniforms.uColor.value.lerp(targetColor, delta * 2);

      // Update intensity based on state, animation progress, and audio
      const baseIntensity = currentStateConfig.visual.glowIntensity * 0.15 * (1 - i * 0.25);
      const animationIntensity =
        Math.sin(animationProgress * Math.PI * 2) * 0.2 + 0.8;
      const audioIntensity = 1 + currentAudioLevel * 0.5;
      const targetIntensity =
        baseIntensity * animationIntensity * audioIntensity;

      material.uniforms.uIntensity.value +=
        (targetIntensity - material.uniforms.uIntensity.value) * delta * 3;

      // Update pulse with animation progress
      const pulseBase = currentStateConfig.visual.glowIntensity;
      const pulseAnimation =
        Math.sin(animationProgress * Math.PI * 4) * 0.3 + 0.7;
      const pulseAudio = 1 + currentAudioLevel * 0.4;
      material.uniforms.uPulse.value +=
        (pulseBase * pulseAnimation * pulseAudio -
          material.uniforms.uPulse.value) *
        delta *
        2;
    });
  });

  return (
    <group ref={groupRef}>
      {glowLayers.map((layer, i) => (
        <mesh key={i} renderOrder={-10 - i}>
          <sphereGeometry args={[layer.scale, 24, 24]} />
          <shaderMaterial
            ref={(el) => {
              if (el) materialsRef.current[i] = el;
            }}
            vertexShader={glowVertexShader}
            fragmentShader={glowFragmentShader}
            uniforms={uniformsArray[i]}
            transparent
            depthWrite={false}
            depthTest={false}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

export default OrbGlow;
