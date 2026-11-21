'use client';

/**
 * JarvisOrbScanLines.tsx - Marvel-style Holographic Scan Effects
 * 
 * Animated scan line effects inspired by Iron Man's JARVIS interface:
 * - Horizontal scan line sweeping vertically
 * - Wireframe sphere overlay with pulsing opacity
 * - Radar-style rotating sweep effect
 * - All effects use GPU shaders for performance
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { JarvisStateConfig } from './jarvisStates';

// ============================================================================
// TYPES
// ============================================================================

export interface JarvisOrbScanLinesProps {
  size?: number;
  config: JarvisStateConfig;
  intensity?: number;
}

// ============================================================================
// SCAN LINE SHADER
// ============================================================================

const scanLineVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vPosition = position;
  vNormal = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const scanLineFragmentShader = `
uniform float uTime;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uScanSpeed;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Horizontal scan line sweeping up/down
  float scanY = mod(uTime * uScanSpeed, 2.0) - 1.0;
  float scanLine = smoothstep(0.02, 0.0, abs(vPosition.y - scanY));
  
  // Secondary faster scan line
  float scanY2 = mod(uTime * uScanSpeed * 1.7 + 0.5, 2.0) - 1.0;
  float scanLine2 = smoothstep(0.01, 0.0, abs(vPosition.y - scanY2)) * 0.5;
  
  // Vertical scan lines (grid effect)
  float gridX = smoothstep(0.98, 1.0, abs(sin(vPosition.x * 20.0 + uTime * 0.5)));
  float gridZ = smoothstep(0.98, 1.0, abs(sin(vPosition.z * 20.0 + uTime * 0.5)));
  float grid = (gridX + gridZ) * 0.2;
  
  // Combine effects
  float alpha = (scanLine + scanLine2 + grid) * uIntensity;
  
  // Fresnel edge glow
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
  alpha += fresnel * 0.3 * uIntensity;
  
  gl_FragColor = vec4(uColor, alpha);
}
`;

// ============================================================================
// RADAR SWEEP SHADER
// ============================================================================

const radarVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const radarFragmentShader = `
uniform float uTime;
uniform vec3 uColor;
uniform float uIntensity;

varying vec2 vUv;
varying vec3 vPosition;

#define PI 3.14159265359

void main() {
  // Calculate angle from center
  vec2 center = vUv - 0.5;
  float angle = atan(center.y, center.x);
  float dist = length(center);
  
  // Rotating sweep
  float sweepAngle = mod(uTime * 1.5, PI * 2.0) - PI;
  float sweep = smoothstep(0.3, 0.0, abs(angle - sweepAngle));
  
  // Fade based on distance from center
  float fade = smoothstep(0.5, 0.2, dist);
  
  // Concentric rings
  float rings = smoothstep(0.98, 1.0, abs(sin(dist * 30.0)));
  
  // Trail effect
  float trail = smoothstep(0.5, 0.0, mod(angle - sweepAngle + PI, PI * 2.0) - PI) * 0.5;
  
  float alpha = (sweep + trail * 0.3 + rings * 0.2) * fade * uIntensity;
  
  gl_FragColor = vec4(uColor, alpha);
}
`;

// ============================================================================
// WIREFRAME OVERLAY COMPONENT
// ============================================================================

function WireframeOverlay({ 
  size, 
  color, 
  intensity 
}: { 
  size: number; 
  color: string; 
  intensity: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  useFrame((state) => {
    if (materialRef.current) {
      // Pulsing opacity
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.5;
      materialRef.current.opacity = pulse * intensity * 0.4;
    }
    
    if (meshRef.current) {
      // Slow rotation
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x += 0.001;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[size * 1.15, 2]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        wireframe
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ============================================================================
// SCAN SPHERE COMPONENT
// ============================================================================

function ScanSphere({ 
  size, 
  color, 
  intensity,
  scanSpeed,
}: { 
  size: number; 
  color: string; 
  intensity: number;
  scanSpeed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uIntensity: { value: intensity },
    uScanSpeed: { value: scanSpeed },
  }), [color, intensity, scanSpeed]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size * 1.1, 64, 64]} />
      <shaderMaterial
        vertexShader={scanLineVertexShader}
        fragmentShader={scanLineFragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================================
// RADAR DISC COMPONENT
// ============================================================================

function RadarDisc({ 
  size, 
  color, 
  intensity,
  yPosition,
}: { 
  size: number; 
  color: string; 
  intensity: number;
  yPosition: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uIntensity: { value: intensity },
  }), [color, intensity]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, yPosition, 0]}>
      <circleGeometry args={[size * 1.5, 64]} />
      <shaderMaterial
        vertexShader={radarVertexShader}
        fragmentShader={radarFragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JarvisOrbScanLines({ 
  size = 1, 
  config,
  intensity = 1,
}: JarvisOrbScanLinesProps) {
  const primaryColor = config.rings.primaryColor;
  const scanSpeed = config.rings.rotationSpeed;
  
  return (
    <group>
      {/* Wireframe overlay */}
      <WireframeOverlay 
        size={size} 
        color={primaryColor} 
        intensity={intensity} 
      />
      
      {/* Scan line sphere */}
      <ScanSphere 
        size={size} 
        color={primaryColor} 
        intensity={intensity * 0.8}
        scanSpeed={scanSpeed}
      />
      
      {/* Radar disc at bottom */}
      <RadarDisc 
        size={size} 
        color={config.rings.secondaryColor} 
        intensity={intensity * 0.6}
        yPosition={-size * 0.8}
      />
      
      {/* Radar disc at top (inverted) */}
      <RadarDisc 
        size={size * 0.7} 
        color={config.rings.accentColor} 
        intensity={intensity * 0.4}
        yPosition={size * 0.9}
      />
    </group>
  );
}

export default JarvisOrbScanLines;

