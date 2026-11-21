/**
 * GALION Orb V5.2 - Surface Component
 *
 * Crystal surface with fresnel reflections and refraction
 */

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getEmotionConfig } from "../config/emotions";
import { getStateConfig } from "../config/states";
import { Emotion, OrbState } from "../types";

// ============================================================================
// SHADERS
// ============================================================================

const surfaceVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const surfaceFragmentShader = `
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uFresnelPower;
uniform float uRefractionRatio;
uniform float uRippleIntensity;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

// Ripple noise
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
  // View direction for fresnel
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  
  // Fresnel effect (more reflection at grazing angles)
  float fresnel = pow(1.0 - abs(dot(vNormal, viewDirection)), uFresnelPower);
  
  // Ripple distortion
  vec2 rippleUV = vUv * 8.0 + uTime * 0.05;
  float ripple = noise(rippleUV) * uRippleIntensity;
  
  // Base color with subtle iridescence
  vec3 finalColor = uColor;
  finalColor += vec3(0.1, 0.15, 0.2) * fresnel; // Subtle blue edge tint
  
  // Core opacity + fresnel edge glow
  float coreOpacity = uOpacity * 0.1; // Very clear center (glass-like)
  float edgeOpacity = fresnel * 0.4; // Glowing edges
  float finalAlpha = coreOpacity + edgeOpacity + ripple * 0.05;
  
  // Clamp to reasonable range
  finalAlpha = clamp(finalAlpha, 0.05, 0.6);
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;

// ============================================================================
// COMPONENT
// ============================================================================

export interface OrbSurfaceProps {
  /** Current state */
  state: OrbState;
  /** Current emotion */
  emotion: Emotion;
  /** State Ref */
  stateRef?: React.MutableRefObject<OrbState>;
  /** Emotion Ref */
  emotionRef?: React.MutableRefObject<Emotion>;
  /** Surface size */
  size?: number;
  /** Enable animations */
  animate?: boolean;
  /** Opacity multiplier */
  opacity?: number;
  /** Audio data ref */
  audioRef?: React.MutableRefObject<any>;
}

export function OrbSurface({
  state,
  emotion,
  stateRef,
  emotionRef,
  size = 1.02,
  animate = true,
  opacity = 0.15,
  audioRef,
}: OrbSurfaceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Initial setup
  const initialState = stateRef?.current || state;
  const initialEmotion = emotionRef?.current || emotion;
  const stateConfig = getStateConfig(initialState);
  const emotionConfig = getEmotionConfig(initialEmotion);

  // Create uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(emotionConfig.colors.accent) },
      uOpacity: { value: opacity },
      uFresnelPower: { value: 3.0 },
      uRefractionRatio: { value: 0.98 },
      uRippleIntensity: { value: stateConfig.audioReactive ? 0.3 : 0.1 },
    }),
    [emotionConfig.colors.accent, opacity, stateConfig.audioReactive]
  );

  // Animation loop
  useFrame((frameState, delta) => {
    if (!materialRef.current || !animate) return;

    // READ DYNAMIC REFS
    const currentState = stateRef?.current || state;
    const currentEmotion = emotionRef?.current || emotion;
    const currentEmotionConfig = getEmotionConfig(currentEmotion);
    const currentStateConfig = getStateConfig(currentState);

    // Get current audio level from ref
    const currentAudioLevel = audioRef?.current?.analysis?.level || 0;

    const time = frameState.clock.elapsedTime;
    materialRef.current.uniforms.uTime.value = time;

    // Update color
    const targetColor = new THREE.Color(currentEmotionConfig.colors.accent);
    materialRef.current.uniforms.uColor.value.lerp(targetColor, delta * 2);

    // Update ripple intensity based on state and audio
    const baseRipple = currentStateConfig.audioReactive ? 0.3 : 0.1;
    const audioRipple = currentAudioLevel * 0.2;
    const targetRipple = baseRipple + audioRipple;

    materialRef.current.uniforms.uRippleIntensity.value +=
      (targetRipple - materialRef.current.uniforms.uRippleIntensity.value) *
      delta;
  });

  return (
    <mesh ref={meshRef} renderOrder={5}>
      <sphereGeometry args={[size, 48, 48]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={surfaceVertexShader}
        fragmentShader={surfaceFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={true}
        side={THREE.FrontSide}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}

export default OrbSurface;
