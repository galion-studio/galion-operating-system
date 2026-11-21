'use client';

/**
 * IronManJarvisHologram2008Simple.tsx - Simplified Working Version
 * 
 * A simplified hologram that avoids shader compilation issues.
 */

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Arc Reactor Core - simple emissive sphere
function ArcReactorCore() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      meshRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.25) * 0.03;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} scale={0.4}>
        <icosahedronGeometry args={[1, 4]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#00ffff"
          emissiveIntensity={2}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      <pointLight intensity={3} distance={5} color="#00ffff" />
      <pointLight intensity={2} distance={8} color="#ffffff" />
    </group>
  );
}

// Golden Rotating Rings
function GoldenRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ring1Ref.current) {
      ring1Ref.current.rotation.y += 0.002;
      ring1Ref.current.rotation.x += 0.003;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= 0.0025;
      ring2Ref.current.rotation.y += 0.0015;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x += 0.0035;
      ring3Ref.current.rotation.z -= 0.002;
    }
  });

  const ringMaterial = {
    color: '#FFB400',
    emissive: '#FFB400',
    emissiveIntensity: 1.5,
    metalness: 0.8,
    roughness: 0.2,
  };

  return (
    <group>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.8, 0.08, 32, 64]} />
        <meshStandardMaterial {...ringMaterial} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.8, 0.08, 32, 64]} />
        <meshStandardMaterial {...ringMaterial} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[4.0, 0.08, 32, 64]} />
        <meshStandardMaterial {...ringMaterial} />
      </mesh>
    </group>
  );
}

// Simple Particle System
function ParticleSystem() {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 500;
  
  const geometry = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 5 + 1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001;
      pointsRef.current.rotation.x += 0.0005;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        color="#FF8C00"
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Orbital Ribbons
function OrbitalRibbons() {
  const groupRef = useRef<THREE.Group>(null);

  React.useEffect(() => {
    if (!groupRef.current) return;

    for (let i = 0; i < 7; i++) {
      const points: THREE.Vector3[] = [];
      const xRadius = 2.5 + i * 0.3;
      const yRadius = 1.5 + i * 0.2;
      for (let j = 0; j <= 64; j++) {
        const t = (j / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(t) * xRadius,
          Math.sin(t) * yRadius,
          0
        ));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: '#FFB400', 
        transparent: true, 
        opacity: 0.5 
      });
      const line = new THREE.Line(geometry, material);
      line.rotation.x = Math.PI / 3 + (i * Math.PI) / 7;
      groupRef.current.add(line);
    }
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return <group ref={groupRef} />;
}

// Camera Controller
function CameraController() {
  const startTime = React.useRef(Date.now());

  useFrame(({ camera }) => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = (elapsed % 60) / 60;
    const angle = progress * Math.PI * 2;
    const radius = 10.8;

    const targetX = Math.cos(angle) * radius;
    const targetZ = Math.sin(angle) * radius;

    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.z += (targetZ - camera.position.z) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// Main Component
export const IronManJarvisHologram2008Simple = React.forwardRef<HTMLDivElement>(
  (props, ref) => {
    return (
      <div
        ref={ref}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000000',
          overflow: 'hidden',
        }}
      >
        <Canvas
          camera={{ position: [0, 3, 10.8], fov: 50 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          style={{ width: '100%', height: '100%' }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={0.3} />
          
          <ArcReactorCore />
          <GoldenRings />
          <ParticleSystem />
          <OrbitalRibbons />
          <CameraController />
        </Canvas>

        {/* Scanlines overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      </div>
    );
  }
);

IronManJarvisHologram2008Simple.displayName = 'IronManJarvisHologram2008Simple';

export default IronManJarvisHologram2008Simple;
