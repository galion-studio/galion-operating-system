/**
 * GALION Orb V5.2 - Star Field Background
 * 
 * Multi-layer parallax star field with 20,000+ stars
 * providing cosmic depth and immersion.
 */

'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Emotion } from '../types/emotion.types';
import { getEmotionConfig } from '../config/emotions';

// ============================================================================
// STAR SHADER
// ============================================================================

const starVertexShader = `
  uniform float uTime;
  uniform float uSize;
  uniform float uParallax;
  
  attribute float aSize;
  attribute float aBrightness;
  attribute float aTwinkleSpeed;
  attribute float aTwinklePhase;
  
  varying float vBrightness;
  varying float vTwinkle;
  
  void main() {
    vBrightness = aBrightness;
    
    // Twinkle effect
    vTwinkle = sin(uTime * aTwinkleSpeed + aTwinklePhase) * 0.3 + 0.7;
    
    // Parallax based on camera movement (subtle)
    vec3 pos = position;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation
    float size = aSize * uSize * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(size, 0.5, 4.0);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  
  varying float vBrightness;
  varying float vTwinkle;
  
  void main() {
    // Circular point
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    // Soft edge
    float alpha = smoothstep(0.5, 0.2, dist);
    
    // Core glow
    float core = smoothstep(0.3, 0.0, dist);
    
    vec3 color = uColor * vBrightness * vTwinkle;
    color += vec3(1.0) * core * 0.5; // White hot core
    
    gl_FragColor = vec4(color, alpha * uOpacity * vBrightness * vTwinkle);
  }
`;

// ============================================================================
// TYPES
// ============================================================================

interface OrbStarFieldProps {
  emotion?: Emotion;
  starCount?: number;
  radius?: number;
  layers?: number;
  opacity?: number;
}

interface StarLayer {
  positions: Float32Array;
  sizes: Float32Array;
  brightness: Float32Array;
  twinkleSpeeds: Float32Array;
  twinklePhases: Float32Array;
  distance: number;
  parallax: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createStarLayer(count: number, minRadius: number, maxRadius: number): StarLayer {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const brightness = new Float32Array(count);
  const twinkleSpeeds = new Float32Array(count);
  const twinklePhases = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    // Spherical distribution
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = minRadius + Math.random() * (maxRadius - minRadius);
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    
    // Varied sizes (mostly small, few large)
    sizes[i] = Math.pow(Math.random(), 2) * 2 + 0.5;
    
    // Brightness variation
    brightness[i] = Math.random() * 0.7 + 0.3;
    
    // Twinkle parameters
    twinkleSpeeds[i] = Math.random() * 3 + 1;
    twinklePhases[i] = Math.random() * Math.PI * 2;
  }
  
  return {
    positions,
    sizes,
    brightness,
    twinkleSpeeds,
    twinklePhases,
    distance: (minRadius + maxRadius) / 2,
    parallax: 1 / ((minRadius + maxRadius) / 2),
  };
}

// ============================================================================
// STAR LAYER COMPONENT
// ============================================================================

interface StarLayerComponentProps {
  layer: StarLayer;
  color: THREE.Color;
  opacity: number;
  baseSize: number;
}

function StarLayerComponent({ layer, color, opacity, baseSize }: StarLayerComponentProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(layer.positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(layer.sizes, 1));
    geo.setAttribute('aBrightness', new THREE.BufferAttribute(layer.brightness, 1));
    geo.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(layer.twinkleSpeeds, 1));
    geo.setAttribute('aTwinklePhase', new THREE.BufferAttribute(layer.twinklePhases, 1));
    return geo;
  }, [layer]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: color },
        uOpacity: { value: opacity },
        uSize: { value: baseSize },
        uParallax: { value: layer.parallax },
      },
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [color, opacity, baseSize, layer.parallax]);

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value += delta;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrbStarField({
  emotion = 'neutral',
  starCount = 5000,
  radius = 100,
  layers = 3,
  opacity = 0.8,
}: OrbStarFieldProps) {
  const groupRef = useRef<THREE.Group>(null);

  const emotionConfig = getEmotionConfig(emotion);

  // Star color (slightly tinted by emotion)
  const starColor = useMemo(() => {
    const base = new THREE.Color(0xffffff);
    const emotionColor = new THREE.Color(emotionConfig.colors.glow);
    return base.lerp(emotionColor, 0.1);
  }, [emotionConfig]);

  // Create star layers
  const starLayers = useMemo(() => {
    const result: StarLayer[] = [];
    const starsPerLayer = Math.floor(starCount / layers);
    
    for (let i = 0; i < layers; i++) {
      const minR = radius * (0.5 + i * 0.3);
      const maxR = radius * (0.8 + i * 0.4);
      result.push(createStarLayer(starsPerLayer, minR, maxR));
    }
    
    return result;
  }, [starCount, radius, layers]);

  // Slow rotation for depth perception
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.01;
  });

  return (
    <group ref={groupRef}>
      {starLayers.map((layer, index) => (
        <StarLayerComponent
          key={index}
          layer={layer}
          color={starColor}
          opacity={opacity * (1 - index * 0.1)}
          baseSize={1.5 - index * 0.2}
        />
      ))}
    </group>
  );
}

export default OrbStarField;
