'use client';

/**
 * OrbGlassSurface.tsx - Fresnel Reflection and Refraction
 * 
 * Creates the glass-like outer surface of the orb:
 * - Fresnel effect (more reflective at edges)
 * - Subtle refraction distorting inner contents
 * - Specular highlights for curved glass
 * - Environment mapping for reflections
 */

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbState, getStateConfig } from './orbV3States';
import { OrbEmotion, getEmotionConfig } from './orbV3Emotions';

// ============================================================================
// TYPES
// ============================================================================

export interface OrbGlassSurfaceProps {
  /** Base size of the orb */
  size?: number;
  /** Current state */
  state?: OrbState;
  /** Current emotion */
  emotion?: OrbEmotion;
  /** Intensity (0-1) */
  intensity?: number;
  /** Quality level */
  quality?: 'low' | 'medium' | 'high';
  /** Opacity of the glass surface */
  opacity?: number;
}

// ============================================================================
// FRESNEL GLASS SHADER
// ============================================================================

const fresnelVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  varying float vFresnel;
  
  uniform float fresnelPower;
  
  void main() {
    vUv = uv;
    
    // World position and normal
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    
    // Camera direction
    vec3 viewDirection = normalize(cameraPosition - worldPosition.xyz);
    
    // Fresnel calculation
    float fresnel = pow(1.0 - abs(dot(viewDirection, vWorldNormal)), fresnelPower);
    vFresnel = fresnel;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fresnelFragmentShader = `
  uniform vec3 glassColor;
  uniform vec3 edgeColor;
  uniform float opacity;
  uniform float time;
  uniform float refractionRatio;
  uniform samplerCube envMap;
  
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  varying float vFresnel;
  
  void main() {
    // View direction
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    
    // Reflection
    vec3 reflectDir = reflect(-viewDir, vWorldNormal);
    
    // Refraction  
    vec3 refractDir = refract(-viewDir, vWorldNormal, refractionRatio);
    
    // Sample environment (if available)
    // For now, use simple color mixing
    vec3 reflectionColor = edgeColor;
    vec3 refractionColor = glassColor;
    
    // Mix based on fresnel
    vec3 color = mix(refractionColor, reflectionColor, vFresnel);
    
    // Add specular highlight
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float specular = pow(max(dot(reflectDir, lightDir), 0.0), 32.0);
    color += vec3(1.0) * specular * 0.3;
    
    // Subtle iridescence based on view angle
    float iridescence = sin(vFresnel * 3.14159 * 2.0 + time * 0.5) * 0.1;
    color += vec3(iridescence * 0.5, iridescence * 0.3, iridescence * 0.7);
    
    // Alpha based on fresnel (more opaque at edges)
    float alpha = mix(opacity * 0.3, opacity, vFresnel);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// GLASS SHELL COMPONENT
// ============================================================================

interface GlassShellProps {
  size: number;
  glassColor: string;
  edgeColor: string;
  opacity: number;
  fresnelPower: number;
  refractionRatio: number;
  segments: number;
}

function GlassShell({
  size,
  glassColor,
  edgeColor,
  opacity,
  fresnelPower,
  refractionRatio,
  segments,
}: GlassShellProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Create shader material
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glassColor: { value: new THREE.Color(glassColor) },
        edgeColor: { value: new THREE.Color(edgeColor) },
        opacity: { value: opacity },
        time: { value: 0 },
        fresnelPower: { value: fresnelPower },
        refractionRatio: { value: refractionRatio },
      },
      vertexShader: fresnelVertexShader,
      fragmentShader: fresnelFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      blending: THREE.NormalBlending,
    });
  }, [glassColor, edgeColor, opacity, fresnelPower, refractionRatio]);
  
  // Update uniforms
  useFrame((state) => {
    if (shaderMaterial) {
      shaderMaterial.uniforms.time.value = state.clock.elapsedTime;
    }
    
    if (meshRef.current) {
      // Very subtle rotation for specular movement
      meshRef.current.rotation.y += 0.0005;
    }
  });
  
  return (
    <mesh ref={meshRef} material={shaderMaterial}>
      <sphereGeometry args={[size, segments, segments]} />
    </mesh>
  );
}

// ============================================================================
// SPECULAR HIGHLIGHT RING
// ============================================================================

interface SpecularRingProps {
  size: number;
  color: string;
  intensity: number;
  position: [number, number, number];
  rotation: [number, number, number];
}

function SpecularRing({ size, color, intensity, position, rotation }: SpecularRingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle shimmer
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = intensity * (0.1 + Math.sin(state.clock.elapsedTime * 2) * 0.05);
    }
  });
  
  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <torusGeometry args={[size, size * 0.02, 8, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={intensity * 0.15}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ============================================================================
// HIGHLIGHT SPOT
// ============================================================================

interface HighlightSpotProps {
  size: number;
  color: string;
  intensity: number;
  position: [number, number, number];
}

function HighlightSpot({ size, color, intensity, position }: HighlightSpotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle pulse
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });
  
  return (
    <mesh ref={meshRef} position={position}>
      <circleGeometry args={[size, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={intensity * 0.4}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ============================================================================
// CAUSTIC EFFECT
// ============================================================================

interface CausticEffectProps {
  size: number;
  color: string;
  intensity: number;
}

function CausticEffect({ size, color, intensity }: CausticEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });
  
  // Generate caustic pattern points
  const causticPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const numPoints = 8;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radius = size * (0.6 + Math.random() * 0.3);
      positions.push([
        Math.cos(angle) * radius,
        -size * 1.1, // Below the orb
        Math.sin(angle) * radius,
      ]);
    }
    
    return positions;
  }, [size]);
  
  return (
    <group ref={groupRef}>
      {causticPositions.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[size * 0.15, 6]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={intensity * 0.05}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrbGlassSurface({
  size = 2,
  state = 'idle',
  emotion = 'neutral',
  intensity = 0.5,
  quality = 'high',
  opacity = 0.3,
}: OrbGlassSurfaceProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Get configurations
  const stateConfig = getStateConfig(state);
  const emotionConfig = getEmotionConfig(emotion);
  
  // Calculate segments based on quality
  const segments = useMemo(() => {
    switch (quality) {
      case 'low': return 24;
      case 'medium': return 48;
      case 'high': return 64;
      default: return 48;
    }
  }, [quality]);
  
  // Glass parameters
  const glassParams = useMemo(() => ({
    fresnelPower: 2.5,
    refractionRatio: 0.98,
    opacity: opacity * stateConfig.glow.intensity,
  }), [opacity, stateConfig]);
  
  return (
    <group ref={groupRef}>
      {/* Main glass shell */}
      <GlassShell
        size={size * 1.01} // Slightly larger than shells
        glassColor={emotionConfig.primary}
        edgeColor={emotionConfig.secondary}
        opacity={glassParams.opacity}
        fresnelPower={glassParams.fresnelPower}
        refractionRatio={glassParams.refractionRatio}
        segments={segments}
      />
      
      {/* Top-left specular highlight */}
      <HighlightSpot
        size={size * 0.15}
        color="#ffffff"
        intensity={intensity}
        position={[size * -0.4, size * 0.5, size * 0.6]}
      />
      
      {/* Secondary highlight */}
      {quality !== 'low' && (
        <HighlightSpot
          size={size * 0.08}
          color="#ffffff"
          intensity={intensity * 0.6}
          position={[size * -0.3, size * 0.6, size * 0.5]}
        />
      )}
      
      {/* Specular ring around orb */}
      {quality === 'high' && (
        <SpecularRing
          size={size * 1.05}
          color={emotionConfig.secondary}
          intensity={intensity}
          position={[0, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      )}
      
      {/* Caustic effect below */}
      {quality === 'high' && (
        <CausticEffect
          size={size}
          color={emotionConfig.accent}
          intensity={intensity * 0.5}
        />
      )}
    </group>
  );
}

export default OrbGlassSurface;

