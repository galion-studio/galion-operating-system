'use client';

/**
 * IronManJarvisHologram.tsx - Iconic 2008 Movie Accurate Hologram
 * 
 * Recreates the exact Jarvis hologram from Iron Man 1 (2008) cave scene
 * when Tony builds the Mark III helmet.
 * 
 * Technical Specifications:
 * - Arc reactor core: white-blue emissive center with god rays
 * - 3 independent rotating golden gyro rings
 * - Mark III helmet wireframe inside rings
 * - 8000-12000 emitted particles with turbulence
 * - 6-8 orbital data ribbons with schematics
 * - Holographic flicker and scanlines
 * - 360° orbit camera with slow zoom
 * - Strong bloom and vignette post-processing
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// ============================================================================
// SHADERS
// ============================================================================

// Arc reactor core shader - emissive with lens flare effect
const arcReactorVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const arcReactorFragmentShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  uniform float uTime;
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vPosition);
    
    // Fresnel effect for lens flare
    float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 3.0);
    
    // Pulsing intensity
    float pulse = 0.8 + sin(uTime * 2.0) * 0.2;
    
    // Base white-blue color
    vec3 color = vec3(1.0, 0.95, 0.8) * pulse;
    
    // Cyan tint on edges
    color += vec3(0.0, 1.0, 1.0) * fresnel * 0.5;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Golden ring shader
const goldenRingVertexShader = `
  varying vec3 vPosition;
  
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const goldenRingFragmentShader = `
  varying vec3 vPosition;
  uniform float uTime;
  
  void main() {
    // Golden glow color (#FFB400)
    vec3 golden = vec3(1.0, 0.71, 0.0);
    
    // Subtle pulsing
    float pulse = 0.9 + sin(uTime * 1.5) * 0.1;
    
    gl_FragColor = vec4(golden * pulse, 1.0);
  }
`;

// ============================================================================
// ARC REACTOR CORE
// ============================================================================

function ArcReactorCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: arcReactorVertexShader,
      fragmentShader: arcReactorFragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((state) => {
    if (meshRef.current && material instanceof THREE.ShaderMaterial) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Slight wobble
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      meshRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.25) * 0.03;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[0, 0, 0]} scale={0.4}>
        <icosahedronGeometry args={[1, 4]} />
        <primitive object={material} attach="material" />
      </mesh>
      
      {/* Point lights for glow */}
      <pointLight intensity={3} distance={5} color="#00ffff" />
      <pointLight intensity={2} distance={8} color="#ffffff" />
    </group>
  );
}

// ============================================================================
// SHOCKWAVE RING
// ============================================================================

interface ShockwaveInstance {
  age: number;
  maxAge: number;
}

function ShockwaveRings() {
  const groupRef = useRef<THREE.Group>(null);
  const shockwavesRef = useRef<ShockwaveInstance[]>([]);
  const lastEmitRef = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Emit new shockwave every 2.5 seconds
    if (state.clock.elapsedTime - lastEmitRef.current > 2.5) {
      shockwavesRef.current.push({ age: 0, maxAge: 1.2 });
      lastEmitRef.current = state.clock.elapsedTime;
    }

    // Update and render shockwaves
    shockwavesRef.current = shockwavesRef.current.filter((sw) => sw.age < sw.maxAge);

    // Clear old meshes
    while (groupRef.current.children.length) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    // Create new meshes
    shockwavesRef.current.forEach((sw) => {
      sw.age += 0.016; // ~60 FPS
      const progress = sw.age / sw.maxAge;
      const radius = 2.0 * progress;
      const opacity = 1.0 - progress;

      const geometry = new THREE.TorusGeometry(radius, 0.05, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: '#00ffff',
        emissive: '#00ffff',
        emissiveIntensity: opacity * 2,
        transparent: true,
        opacity: opacity * 0.8,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = Math.PI / 4;
      groupRef.current!.add(mesh);
    });
  });

  return <group ref={groupRef} />;
}

// ============================================================================
// GOLDEN GYRO RINGS
// ============================================================================

function GoldenRings() {
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const ring3Ref = useRef<THREE.Group>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: goldenRingVertexShader,
      fragmentShader: goldenRingFragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((state) => {
    if (material instanceof THREE.ShaderMaterial) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }

    // Ring 1: Y +7 deg/s, X +11 deg/s
    if (ring1Ref.current) {
      ring1Ref.current.rotation.y += (7 * Math.PI / 180) * 0.016;
      ring1Ref.current.rotation.x += (11 * Math.PI / 180) * 0.016;
    }

    // Ring 2: Z -9 deg/s, Y +5 deg/s
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= (9 * Math.PI / 180) * 0.016;
      ring2Ref.current.rotation.y += (5 * Math.PI / 180) * 0.016;
    }

    // Ring 3: X +13 deg/s, Z -6 deg/s
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x += (13 * Math.PI / 180) * 0.016;
      ring3Ref.current.rotation.z -= (6 * Math.PI / 180) * 0.016;
    }
  });

  const createRing = (radius: number) => (
    <mesh position={[0, 0, 0]}>
      <torusGeometry args={[radius, 0.08, 32, 32]} />
      <meshStandardMaterial
        color="#FFB400"
        emissive="#FFB400"
        emissiveIntensity={1.5}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );

  return (
    <group>
      <group ref={ring1Ref}>{createRing(1.8)}</group>
      <group ref={ring2Ref}>{createRing(2.8)}</group>
      <group ref={ring3Ref}>{createRing(4.0)}</group>
    </group>
  );
}

// ============================================================================
// MARK III HELMET WIREFRAME
// ============================================================================

function HelmetWireframe() {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    // Create simplified Mark III helmet as wireframe
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];

    // Helmet outline (approximate Mark III shape)
    const headRadius = 0.6;
    const segments = 16;

    // Top dome
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * headRadius;
      const z = Math.sin(angle) * headRadius;
      positions.push(x, headRadius * 0.8, z);
    }

    // Face grid
    for (let i = 0; i < segments / 2; i++) {
      for (let j = 0; j < segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        const x = Math.cos(angle) * (headRadius * (1 - i / (segments / 2)));
        const z = Math.sin(angle) * (headRadius * (1 - i / (segments / 2)));
        const y = headRadius * 0.8 - (i / (segments / 2)) * 1.2;
        positions.push(x, y, z);
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: '#FFB400',
      transparent: true,
      opacity: 0.6,
      linewidth: 1,
    });

    const lineSegments = new THREE.LineSegments(geometry, lineMaterial);
    groupRef.current.add(lineSegments);
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      // Rotate with innermost ring + slow breathe
      groupRef.current.rotation.y += (7 * Math.PI / 180) * 0.016;
      groupRef.current.rotation.x += (11 * Math.PI / 180) * 0.016;

      // Scale breathing (1% over 4 seconds)
      const breathe = 1.0 + Math.sin(state.clock.elapsedTime / 2) * 0.01;
      groupRef.current.scale.set(breathe, breathe, breathe);
    }
  });

  return <group ref={groupRef} position={[0, 0, 0]} scale={0.8} />;
}

// ============================================================================
// PARTICLE EMITTER
// ============================================================================

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const particlesRef = useRef<Particle[]>([]);
  
  // Fixed maximum particle count to prevent buffer resize errors
  const MAX_PARTICLES = 5000;

  const { particleGeometry, particleMaterial } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    
    // Pre-allocate fixed-size buffers
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Set initial draw range to 0
    geometry.setDrawRange(0, 0);
    
    const material = new THREE.PointsMaterial({
      size: 0.05,
      sizeAttenuation: true,
      color: '#FF8C00',
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });
    
    return { particleGeometry: geometry, particleMaterial: material };
  }, []);

  useFrame((state) => {
    // Emit 600-800 particles per second
    const emitRate = 600 + Math.random() * 200;
    const timeDelta = 0.016; // ~60 FPS
    const toEmit = Math.floor((emitRate * timeDelta) / 1000);

    for (let i = 0; i < toEmit; i++) {
      // Don't exceed max particles
      if (particlesRef.current.length >= MAX_PARTICLES) break;
      
      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * Math.PI * 2;

      const velocity = 15 + Math.random() * 25;
      const particleVelocity = new THREE.Vector3(
        Math.cos(angle) * Math.sin(elevation) * velocity,
        Math.sin(angle) * Math.sin(elevation) * velocity,
        Math.cos(elevation) * velocity
      );

      // Add turbulence
      particleVelocity.x += (Math.random() - 0.5) * 5;
      particleVelocity.y += (Math.random() - 0.5) * 5;
      particleVelocity.z += (Math.random() - 0.5) * 5;

      particlesRef.current.push({
        position: new THREE.Vector3(0, 0, 0),
        velocity: particleVelocity,
        life: 0,
        maxLife: 3.5,
      });
    }

    // Update particles
    particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);

    particlesRef.current.forEach((p) => {
      p.life += timeDelta;
      p.position.add(p.velocity.clone().multiplyScalar(timeDelta * 0.5));

      // Apply turbulence
      p.velocity.x += (Math.random() - 0.5) * 0.5;
      p.velocity.y += (Math.random() - 0.5) * 0.5;
      p.velocity.z += (Math.random() - 0.5) * 0.5;

      // Fade with distance
      const distance = p.position.length();
      p.velocity.multiplyScalar(0.99); // Damping
    });

    // Update geometry using existing buffers
    const positionAttr = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = particleGeometry.getAttribute('color') as THREE.BufferAttribute;
    const sizeAttr = particleGeometry.getAttribute('size') as THREE.BufferAttribute;

    particlesRef.current.forEach((p, i) => {
      positionAttr.setXYZ(i, p.position.x, p.position.y, p.position.z);

      // Color transition: orange (#FF8C00) -> light orange (#FFA040)
      const progress = p.life / p.maxLife;
      const hue = 0.08 + progress * 0.02;
      const color = new THREE.Color().setHSL(hue, 1, 0.5);

      colorAttr.setXYZ(i, color.r, color.g, color.b);

      // Size fade
      sizeAttr.setX(i, (1 - progress) * 3 + 1);
    });

    // Update draw range to only render active particles
    particleGeometry.setDrawRange(0, particlesRef.current.length);
    
    // Mark attributes as needing update
    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={particleGeometry} material={particleMaterial} />
  );
}

// ============================================================================
// ORBITAL DATA RIBBONS
// ============================================================================

function OrbitalRibbons() {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    // Create 6-8 orbital ribbon curves
    for (let ribbonIdx = 0; ribbonIdx < 7; ribbonIdx++) {
      const curve = new THREE.EllipseCurve(
        0, 0,
        2.5 + ribbonIdx * 0.3, // xRadius
        1.5 + ribbonIdx * 0.2, // yRadius
        0, Math.PI * 2,
        false,
        (ribbonIdx * Math.PI) / 7
      );

      const points = curve.getPoints(128);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const material = new THREE.LineBasicMaterial({
        color: '#FFB400',
        transparent: true,
        opacity: 0.5,
        linewidth: 1,
      });

      const line = new THREE.Line(geometry, material);
      line.rotation.x = Math.PI / 3 + (ribbonIdx * Math.PI) / 7;
      groupRef.current.add(line);

      // Add small floating data points
      for (let i = 0; i < 5; i++) {
        const t = (i / 5) * 0.8;
        const point = curve.getPoint(t);
        const dataGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const dataMaterial = new THREE.MeshStandardMaterial({
          color: '#FFD700',
          emissive: '#FFD700',
          emissiveIntensity: 1.0,
        });
        const dataMesh = new THREE.Mesh(dataGeometry, dataMaterial);
        dataMesh.position.copy(point as any);
        dataMesh.position.z = (ribbonIdx - 3) * 0.5;
        line.add(dataMesh);
      }
    }
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      // Slow rotation around Y axis
      groupRef.current.rotation.y += 0.001;
    }
  });

  return <group ref={groupRef} />;
}

// ============================================================================
// HOLOGRAPHIC FLICKER
// ============================================================================

function HolographicFlicker() {
  // Scanlines are rendered via CSS overlay in main component
  return null;
}

// ============================================================================
// CAMERA CONTROLLER
// ============================================================================

function CameraController() {
  const { camera } = useThree();
  const startTimeRef = useRef(Date.now());

  useFrame(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const cycleTime = 60; // 60 second full orbit
    const progress = (elapsed % cycleTime) / cycleTime;

    // 360° orbit at radius 10.8
    const angle = progress * Math.PI * 2;
    const radius = 10.8;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Set camera position with smooth lerp
    camera.position.lerp(
      new THREE.Vector3(x, 3, z),
      0.02
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const IronManJarvisHologram2008 = React.forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        backgroundColor: '#000000',
        overflow: 'hidden',
      }}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: [0, 3, 10.8], fov: 50 }}
        dpr={[1, 2]}
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* Lights */}
        <ambientLight intensity={0.1} />

        {/* Core components */}
        <ArcReactorCore />
        <ShockwaveRings />
        <GoldenRings />
        <HelmetWireframe />
        <ParticleField />
        <OrbitalRibbons />
        <HolographicFlicker />

        {/* Camera control */}
        <CameraController />

        {/* Post-processing */}
        <EffectComposer>
          <Bloom
            intensity={2.5}
            luminanceThreshold={0.8}
            luminanceSmoothing={0.9}
            radius={1.2}
          />
          <Vignette offset={0.3} darkness={0.6} blendFunction={BlendFunction.NORMAL} />
        </EffectComposer>
      </Canvas>

      {/* Scanlines overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    </div>
  );
});

IronManJarvisHologram2008.displayName = 'IronManJarvisHologram2008';
