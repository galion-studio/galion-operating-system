'use client';

/**
 * OrbInnerUniverse.tsx - Star Field and Nebula Depth Layers
 * 
 * Creates the infinite depth illusion inside the orb:
 * - Procedural star field INSIDE the orb
 * - Stars get smaller/dimmer toward center (depth illusion)
 * - Parallax rotation when orb moves
 * - Volumetric nebula clouds with parallax
 * - Occasional shooting stars / meteors
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbState, getStateConfig } from './orbV3States';
import { OrbEmotion, getEmotionConfig } from './orbV3Emotions';

// ============================================================================
// TYPES
// ============================================================================

export interface OrbInnerUniverseProps {
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
}

// ============================================================================
// STAR FIELD (Inside the orb - creates depth)
// ============================================================================

interface InnerStarFieldProps {
  count: number;
  innerRadius: number;
  outerRadius: number;
  color: string;
  intensity: number;
  rotationSpeed: number;
}

function InnerStarField({
  count,
  innerRadius,
  outerRadius,
  color,
  intensity,
  rotationSpeed,
}: InnerStarFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Generate stars with depth-based sizing
  const { positions, sizes, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    
    const baseColor = new THREE.Color(color);
    
    for (let i = 0; i < count; i++) {
      // Distribute stars in a sphere, more density toward outer edge
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Bias toward outer radius for depth effect
      const t = Math.pow(Math.random(), 0.5); // Square root for even distribution
      const r = innerRadius + t * (outerRadius - innerRadius);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      // Size decreases toward center (depth illusion)
      const depthFactor = (r - innerRadius) / (outerRadius - innerRadius);
      sizes[i] = 0.5 + depthFactor * 2.5;
      
      // Color dims toward center
      const brightness = 0.3 + depthFactor * 0.7;
      colors[i * 3] = baseColor.r * brightness;
      colors[i * 3 + 1] = baseColor.g * brightness;
      colors[i * 3 + 2] = baseColor.b * brightness;
    }
    
    return { positions, sizes, colors };
  }, [count, innerRadius, outerRadius, color]);
  
  useFrame((state) => {
    if (pointsRef.current) {
      // Slow parallax rotation
      pointsRef.current.rotation.y += 0.0002 * rotationSpeed;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.02;
      
      // Twinkling effect on opacity
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = intensity * (0.6 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1);
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
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1}
        transparent
        opacity={intensity * 0.7}
        vertexColors
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ============================================================================
// NEBULA CLOUD LAYER
// ============================================================================

interface NebulaLayerProps {
  size: number;
  innerColor: string;
  outerColor: string;
  opacity: number;
  rotationSpeed: number;
  tilt: [number, number, number];
  segments: number;
}

function NebulaLayer({
  size,
  innerColor,
  outerColor,
  opacity,
  rotationSpeed,
  tilt,
  segments,
}: NebulaLayerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Custom shader for gradient sphere
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        innerColor: { value: new THREE.Color(innerColor) },
        outerColor: { value: new THREE.Color(outerColor) },
        opacity: { value: opacity },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 innerColor;
        uniform vec3 outerColor;
        uniform float opacity;
        uniform float time;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        // Simple noise function
        float noise(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
        }
        
        void main() {
          // Distance from center for gradient
          float dist = length(vPosition);
          float gradient = smoothstep(0.0, 1.0, dist);
          
          // Mix colors based on distance
          vec3 color = mix(innerColor, outerColor, gradient);
          
          // Add subtle noise for cloud effect
          float n = noise(vPosition * 3.0 + time * 0.1);
          color += n * 0.05;
          
          // Fresnel for edge fade
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          float alpha = opacity * (0.3 + fresnel * 0.7);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
  }, [innerColor, outerColor, opacity]);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed * 0.001;
      meshRef.current.rotation.z += rotationSpeed * 0.0005;
    }
    
    if (shaderMaterial) {
      shaderMaterial.uniforms.time.value = state.clock.elapsedTime;
    }
  });
  
  return (
    <mesh ref={meshRef} rotation={tilt} material={shaderMaterial}>
      <sphereGeometry args={[size, segments, segments]} />
    </mesh>
  );
}

// ============================================================================
// SHOOTING STAR
// ============================================================================

interface ShootingStarProps {
  orbSize: number;
  color: string;
  active: boolean;
}

function ShootingStar({ orbSize, color, active }: ShootingStarProps) {
  const lineRef = useRef<THREE.Line>(null);
  const progressRef = useRef(0);
  const pathRef = useRef<{ start: THREE.Vector3; end: THREE.Vector3 }>({
    start: new THREE.Vector3(),
    end: new THREE.Vector3(),
  });
  const visibleRef = useRef(false);
  const cooldownRef = useRef(0);
  
  // Generate new path
  const generatePath = () => {
    const theta1 = Math.random() * Math.PI * 2;
    const phi1 = Math.acos(2 * Math.random() - 1);
    const r1 = orbSize * 0.8;
    
    pathRef.current.start.set(
      r1 * Math.sin(phi1) * Math.cos(theta1),
      r1 * Math.sin(phi1) * Math.sin(theta1),
      r1 * Math.cos(phi1)
    );
    
    // End point closer to center
    const theta2 = theta1 + (Math.random() - 0.5) * 0.5;
    const phi2 = phi1 + (Math.random() - 0.5) * 0.5;
    const r2 = orbSize * 0.2;
    
    pathRef.current.end.set(
      r2 * Math.sin(phi2) * Math.cos(theta2),
      r2 * Math.sin(phi2) * Math.sin(theta2),
      r2 * Math.cos(phi2)
    );
  };
  
  useFrame((_, delta) => {
    if (!lineRef.current || !active) return;
    
    const material = lineRef.current.material as THREE.LineBasicMaterial;
    
    if (visibleRef.current) {
      progressRef.current += delta * 2;
      
      if (progressRef.current >= 1) {
        visibleRef.current = false;
        cooldownRef.current = 3 + Math.random() * 5; // Random cooldown
        material.opacity = 0;
      } else {
        // Fade in then out
        const fade = progressRef.current < 0.3 
          ? progressRef.current / 0.3 
          : 1 - (progressRef.current - 0.3) / 0.7;
        material.opacity = fade * 0.8;
        
        // Update line position along path
        const geometry = lineRef.current.geometry as THREE.BufferGeometry;
        const positions = geometry.attributes.position.array as Float32Array;
        
        const t = progressRef.current;
        const headT = Math.min(t + 0.1, 1);
        
        const head = new THREE.Vector3().lerpVectors(
          pathRef.current.start,
          pathRef.current.end,
          headT
        );
        const tail = new THREE.Vector3().lerpVectors(
          pathRef.current.start,
          pathRef.current.end,
          Math.max(t - 0.05, 0)
        );
        
        positions[0] = tail.x;
        positions[1] = tail.y;
        positions[2] = tail.z;
        positions[3] = head.x;
        positions[4] = head.y;
        positions[5] = head.z;
        
        geometry.attributes.position.needsUpdate = true;
      }
    } else {
      cooldownRef.current -= delta;
      if (cooldownRef.current <= 0) {
        visibleRef.current = true;
        progressRef.current = 0;
        generatePath();
      }
    }
  });
  
  // Initial geometry
  const positions = useMemo(() => new Float32Array([0, 0, 0, 0, 0, 0]), []);
  
  return (
    // @ts-expect-error - line is a valid r3f element for THREE.Line
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0}
        linewidth={2}
        blending={THREE.AdditiveBlending}
      />
    </line>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrbInnerUniverse({
  size = 2,
  state = 'idle',
  emotion = 'neutral',
  intensity = 0.5,
  quality = 'high',
}: OrbInnerUniverseProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Get configurations
  const stateConfig = getStateConfig(state);
  const emotionConfig = getEmotionConfig(emotion);
  
  // Calculate star count based on quality
  const starCount = useMemo(() => {
    switch (quality) {
      case 'low': return 200;
      case 'medium': return 500;
      case 'high': return 1000;
      default: return 500;
    }
  }, [quality]);
  
  const nebulaSegments = useMemo(() => {
    switch (quality) {
      case 'low': return 16;
      case 'medium': return 24;
      case 'high': return 32;
      default: return 24;
    }
  }, [quality]);
  
  const rotationSpeed = emotionConfig.speedMultiplier * stateConfig.gradient.motionMultiplier;
  
  return (
    <group ref={groupRef}>
      {/* Inner star field - creates infinite depth */}
      <InnerStarField
        count={starCount}
        innerRadius={size * 0.1}
        outerRadius={size * 0.85}
        color={emotionConfig.stars}
        intensity={intensity}
        rotationSpeed={rotationSpeed}
      />
      
      {/* Nebula layer 1 - innermost */}
      <NebulaLayer
        size={size * 0.7}
        innerColor={emotionConfig.nebula[0]}
        outerColor={emotionConfig.nebula[1]}
        opacity={intensity * 0.15}
        rotationSpeed={rotationSpeed}
        tilt={[0, 0, 0]}
        segments={nebulaSegments}
      />
      
      {/* Nebula layer 2 - tilted */}
      {quality !== 'low' && (
        <NebulaLayer
          size={size * 0.6}
          innerColor={emotionConfig.primary}
          outerColor={emotionConfig.nebula[1]}
          opacity={intensity * 0.1}
          rotationSpeed={rotationSpeed * 0.7}
          tilt={[0.3, 0.2, 0]}
          segments={nebulaSegments}
        />
      )}
      
      {/* Nebula layer 3 - opposite tilt */}
      {quality === 'high' && (
        <NebulaLayer
          size={size * 0.5}
          innerColor={emotionConfig.secondary}
          outerColor={emotionConfig.nebula[0]}
          opacity={intensity * 0.08}
          rotationSpeed={rotationSpeed * 1.2}
          tilt={[-0.2, 0.4, 0.1]}
          segments={nebulaSegments}
        />
      )}
      
      {/* Nebula layer 4 - core glow */}
      {quality === 'high' && (
        <NebulaLayer
          size={size * 0.3}
          innerColor={emotionConfig.core}
          outerColor={emotionConfig.primary}
          opacity={intensity * 0.2}
          rotationSpeed={rotationSpeed * 0.5}
          tilt={[0.1, -0.1, 0.2]}
          segments={nebulaSegments}
        />
      )}
      
      {/* Shooting stars - only on high quality */}
      {quality === 'high' && (
        <>
          <ShootingStar
            orbSize={size}
            color={emotionConfig.accent}
            active={intensity > 0.3}
          />
          <ShootingStar
            orbSize={size}
            color={emotionConfig.secondary}
            active={intensity > 0.5}
          />
        </>
      )}
    </group>
  );
}

export default OrbInnerUniverse;

