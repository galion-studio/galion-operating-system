'use client';

/**
 * LightDoor3D
 * Source: galion-workspace3d master, src/components/effects/LightDoor3D.tsx
 * The seam, parting panels, and pulse are the same motion the boot mounts.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface LightDoor3DProps {
  isOpen?: boolean;
  color?: string;
  glowColor?: string;
  height?: number;
  width?: number;
  intensity?: number;
  position?: [number, number, number];
  showBeams?: boolean;
  showParticles?: boolean;
  particleCount?: number;
}

export function LightDoor3D({
  isOpen = false,
  color = '#06b6d4',
  glowColor = '#22d3ee',
  height = 30,
  width = 20,
  intensity = 1,
  position = [0, 0, -10],
}: LightDoor3DProps) {
  const left = useRef<THREE.Mesh>(null);
  const right = useRef<THREE.Mesh>(null);
  const line = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const open = isOpen ? 1 : 0;
    if (left.current) {
      const target = isOpen ? -width : -width * 0.5;
      left.current.position.x = THREE.MathUtils.lerp(left.current.position.x, target, delta * 2);
      const material = left.current.material as THREE.MeshBasicMaterial;
      material.opacity = THREE.MathUtils.lerp(material.opacity, isOpen ? 0 : 0.15, delta * 2);
    }
    if (right.current) {
      const target = isOpen ? width : width * 0.5;
      right.current.position.x = THREE.MathUtils.lerp(right.current.position.x, target, delta * 2);
      const material = right.current.material as THREE.MeshBasicMaterial;
      material.opacity = THREE.MathUtils.lerp(material.opacity, isOpen ? 0 : 0.15, delta * 2);
    }
    if (line.current) {
      const material = line.current.material as THREE.MeshBasicMaterial;
      const pulse = 0.55 + Math.sin(performance.now() / 400) * 0.2;
      material.opacity = THREE.MathUtils.lerp(material.opacity, open * intensity * pulse, delta * 3);
    }
  });

  return (
    <group position={position}>
      <mesh ref={left} position={[-width * 0.5, 0, -5]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={right} position={[width * 0.5, 0, -5]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={line}>
        <planeGeometry args={[0.35, height]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <pointLight color={glowColor} intensity={isOpen ? intensity * 2 : 0} distance={20} position={[0, 0, 2]} />
    </group>
  );
}

export default LightDoor3D;
