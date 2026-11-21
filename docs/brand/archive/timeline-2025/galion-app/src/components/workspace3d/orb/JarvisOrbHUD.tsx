'use client';

/**
 * JarvisOrbHUD.tsx - Floating Holographic UI Fragments
 * 
 * Floating UI elements that orbit the Jarvis orb:
 * - Small holographic cards/panels
 * - Data readouts and metrics
 * - Angular, geometric shapes
 * - Orbiting at various distances
 * - Fading in/out based on state
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { JarvisStateConfig } from './jarvisStates';

// ============================================================================
// TYPES
// ============================================================================

export interface JarvisOrbHUDProps {
  size?: number;
  config: JarvisStateConfig;
  state?: string;
}

interface HUDFragment {
  id: string;
  type: 'panel' | 'hexagon' | 'diamond' | 'bar';
  label: string;
  value?: string;
  orbitRadius: number;
  orbitSpeed: number;
  orbitOffset: number;
  verticalOffset: number;
  scale: number;
}

// ============================================================================
// HUD FRAGMENT TYPES
// ============================================================================

function HUDPanel({
  position,
  rotation,
  label,
  value,
  color,
  opacity,
  scale,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  label: string;
  value?: string;
  color: string;
  opacity: number;
  scale: number;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Panel background */}
      <mesh>
        <planeGeometry args={[0.4, 0.25]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Border lines */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(0.4, 0.25)]} />
        <lineBasicMaterial color={color} transparent opacity={opacity} />
      </lineSegments>
      
      {/* Label text */}
      <Text
        position={[0, 0.05, 0.01]}
        fontSize={0.04}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      
      {/* Value text */}
      {value && (
        <Text
          position={[0, -0.04, 0.01]}
          fontSize={0.05}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {value}
        </Text>
      )}
    </group>
  );
}

function HUDHexagon({
  position,
  rotation,
  color,
  opacity,
  scale,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  opacity: number;
  scale: number;
}) {
  const hexShape = useMemo(() => {
    const shape = new THREE.Shape();
    const radius = 0.1;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);
  
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh>
        <shapeGeometry args={[hexShape]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Glowing edge */}
      <lineLoop>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={6}
            array={new Float32Array([
              ...Array.from({ length: 6 }, (_, i) => {
                const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                return [Math.cos(angle) * 0.1, Math.sin(angle) * 0.1, 0];
              }).flat()
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={opacity} />
      </lineLoop>
    </group>
  );
}

function HUDDiamond({
  position,
  rotation,
  color,
  opacity,
  scale,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  opacity: number;
  scale: number;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.1, 0.1]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.5}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Inner diamond */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.06, 0.06]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={opacity * 0.8}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function HUDBar({
  position,
  rotation,
  color,
  opacity,
  scale,
  fillPercent = 0.7,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  opacity: number;
  scale: number;
  fillPercent?: number;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Background bar */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[0.3, 0.04]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.2}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Fill bar */}
      <mesh position={[(fillPercent - 1) * 0.15, 0, 0.001]}>
        <planeGeometry args={[0.3 * fillPercent, 0.03]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.8}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(0.3, 0.04)]} />
        <lineBasicMaterial color={color} transparent opacity={opacity * 0.6} />
      </lineSegments>
    </group>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JarvisOrbHUD({ size = 1, config, state = 'idle' }: JarvisOrbHUDProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Define HUD fragments
  const fragments: HUDFragment[] = useMemo(() => [
    { id: 'status', type: 'panel', label: 'STATUS', value: state.toUpperCase(), orbitRadius: 1.8, orbitSpeed: 0.2, orbitOffset: 0, verticalOffset: 0.3, scale: 1 },
    { id: 'cpu', type: 'bar', label: 'CPU', orbitRadius: 1.7, orbitSpeed: 0.15, orbitOffset: Math.PI * 0.5, verticalOffset: -0.2, scale: 0.8 },
    { id: 'mem', type: 'bar', label: 'MEM', orbitRadius: 1.7, orbitSpeed: 0.15, orbitOffset: Math.PI * 0.55, verticalOffset: -0.35, scale: 0.8 },
    { id: 'hex1', type: 'hexagon', label: '', orbitRadius: 1.6, orbitSpeed: 0.25, orbitOffset: Math.PI, verticalOffset: 0.1, scale: 1 },
    { id: 'hex2', type: 'hexagon', label: '', orbitRadius: 1.5, orbitSpeed: 0.3, orbitOffset: Math.PI * 1.2, verticalOffset: -0.1, scale: 0.7 },
    { id: 'diamond1', type: 'diamond', label: '', orbitRadius: 1.4, orbitSpeed: 0.35, orbitOffset: Math.PI * 1.5, verticalOffset: 0.2, scale: 1 },
    { id: 'diamond2', type: 'diamond', label: '', orbitRadius: 1.55, orbitSpeed: 0.22, orbitOffset: Math.PI * 1.7, verticalOffset: -0.15, scale: 0.8 },
    { id: 'net', type: 'panel', label: 'NETWORK', value: 'ACTIVE', orbitRadius: 1.75, orbitSpeed: 0.18, orbitOffset: Math.PI * 0.25, verticalOffset: 0, scale: 0.9 },
    { id: 'hex3', type: 'hexagon', label: '', orbitRadius: 1.45, orbitSpeed: 0.28, orbitOffset: Math.PI * 0.75, verticalOffset: 0.25, scale: 0.6 },
    { id: 'diamond3', type: 'diamond', label: '', orbitRadius: 1.65, orbitSpeed: 0.2, orbitOffset: Math.PI * 1.25, verticalOffset: 0.35, scale: 0.9 },
  ], [state]);
  
  // Get visible fragments based on config
  const visibleFragments = useMemo(() => {
    return fragments.slice(0, config.hud.fragmentCount);
  }, [fragments, config.hud.fragmentCount]);
  
  // Animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * config.hud.orbitSpeed * 0.5;
    }
  });
  
  return (
    <group ref={groupRef}>
      {visibleFragments.map((fragment, index) => {
        // Calculate position on orbit
        const angle = fragment.orbitOffset;
        const x = Math.cos(angle) * fragment.orbitRadius * size;
        const z = Math.sin(angle) * fragment.orbitRadius * size;
        const y = fragment.verticalOffset * size;
        
        const position: [number, number, number] = [x, y, z];
        const rotation: [number, number, number] = [0, -angle + Math.PI / 2, 0];
        
        const props = {
          position,
          rotation,
          color: config.hud.color,
          opacity: config.hud.visibility,
          scale: fragment.scale * size * 0.8,
        };
        
        switch (fragment.type) {
          case 'panel':
            return (
              <HUDPanel
                key={fragment.id}
                {...props}
                label={fragment.label}
                value={fragment.value}
              />
            );
          case 'hexagon':
            return <HUDHexagon key={fragment.id} {...props} />;
          case 'diamond':
            return <HUDDiamond key={fragment.id} {...props} />;
          case 'bar':
            return (
              <HUDBar
                key={fragment.id}
                {...props}
                fillPercent={0.5 + Math.random() * 0.4}
              />
            );
          default:
            return null;
        }
      })}
    </group>
  );
}

export default JarvisOrbHUD;

