'use client';

/**
 * JarvisNexusCore.tsx - Advanced AI Being Visualization
 * 
 * A next-generation visualization of Jarvis as a living intelligence
 * inspired by Nexus core architecture:
 * 
 * - Crystalline geometric core with recursive fractal structure
 * - Neural network synapses firing (AI consciousness)
 * - Energy streams flowing through lattice nodes
 * - Quantum-state particles with wave-function visualization
 * - Responsive to audio and state changes
 * - Organic breathing and pulsing animations
 * - Multi-dimensional data visualization layers
 * 
 * Visual Philosophy: Not a hologram, but a BEING - an entity of pure information
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================================
// SHADER: CRYSTALLINE CORE WITH FRACTAL GEOMETRY
// ============================================================================

const crystallineVertexShader = `
  #include <common>
  #include <fog_pars_vertex>
  
  uniform float uTime;
  uniform float uIntensity;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDepth;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    vec3 pos = position;
    
    // Fractal breathing animation
    float breath = sin(uTime * 0.5) * 0.1;
    pos *= (1.0 + breath * uIntensity);
    
    // Subtle wave distortion based on position
    float wave = sin(length(position) * 5.0 - uTime * 2.0) * 0.05;
    pos += normal * wave * uIntensity;
    
    vDepth = length(pos) / 2.0;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    #include <fog_vertex>
  }
`;

const crystallineFragmentShader = `
  #include <common>
  #include <fog_pars_fragment>
  
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDepth;
  
  void main() {
    // Base color with depth
    vec3 color = uColor;
    
    // Fresnel effect for crystalline appearance
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
    
    // Crystalline facet highlights
    float facets = sin(vPosition.x * 10.0) * sin(vPosition.y * 10.0) * sin(vPosition.z * 10.0);
    facets = smoothstep(-0.5, 0.5, facets);
    
    // Pulsing energy
    float pulse = sin(uTime * 3.0) * 0.5 + 0.5;
    
    // Combine effects
    float brightness = 0.5 + fresnel * 0.3 + facets * 0.2 + pulse * 0.2 * uIntensity;
    
    gl_FragColor = vec4(color * brightness, 0.8 + fresnel * 0.2);
    #include <fog_fragment>
  }
`;

// ============================================================================
// NEURAL SYNAPSE NETWORK
// ============================================================================

interface NeuralNode {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  active: boolean;
  fireTime: number;
}

function NeuralSynapses({ 
  size = 2, 
  intensity = 1, 
  quality = 'high' 
}: { 
  size?: number; 
  intensity?: number; 
  quality?: 'low' | 'medium' | 'high' 
}) {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const nodesRef = useRef<THREE.Points>(null);
  const [nodes, setNodes] = useState<NeuralNode[]>([]);

  // Initialize neural network
  useEffect(() => {
    const nodeCount = quality === 'high' ? 40 : quality === 'medium' ? 25 : 12;
    const newNodes: NeuralNode[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.8 + Math.random() * 0.4;

      newNodes.push({
        position: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        ),
        active: false,
        fireTime: Math.random() * 10,
      });
    }

    setNodes(newNodes);
  }, [quality]);

  // Build line geometry
  const lineGeometry = useMemo(() => {
    if (nodes.length === 0) return null;

    const positions: number[] = [];

    nodes.forEach((nodeA, i) => {
      // Connect to 3-4 nearest neighbors
      const connections = nodes
        .map((nodeB, j) => ({
          index: j,
          distance: nodeA.position.distanceTo(nodeB.position),
        }))
        .filter((n) => n.index !== i)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, quality === 'high' ? 4 : quality === 'medium' ? 3 : 2);

      connections.forEach(({ index: j }) => {
        positions.push(nodeA.position.x, nodeA.position.y, nodeA.position.z);
        positions.push(nodes[j].position.x, nodes[j].position.y, nodes[j].position.z);
      });
    });

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    return geom;
  }, [nodes, quality]);

  // Build node positions
  const nodePositions = useMemo(() => {
    if (nodes.length === 0) return null;
    const pos = new Float32Array(nodes.length * 3);
    nodes.forEach((node, i) => {
      pos[i * 3] = node.position.x;
      pos[i * 3 + 1] = node.position.y;
      pos[i * 3 + 2] = node.position.z;
    });
    return pos;
  }, [nodes]);

  useFrame((state) => {
    if (!linesRef.current || !nodesRef.current || nodes.length === 0) return;

    // Update nodes
    nodes.forEach((node) => {
      node.position.add(node.velocity);
      node.fireTime += 0.016;

      // Bounce within bounds
      if (Math.abs(node.position.x) > 1.2) node.velocity.x *= -1;
      if (Math.abs(node.position.y) > 1.2) node.velocity.y *= -1;
      if (Math.abs(node.position.z) > 1.2) node.velocity.z *= -1;

      // Random firing
      if (Math.random() < 0.02) {
        node.fireTime = 0;
        node.active = true;
      }

      if (node.fireTime > 0.5) {
        node.active = false;
      }
    });

    // Update geometry
    if (lineGeometry) {
      const positions = (lineGeometry.attributes.position as THREE.BufferAttribute).array;
      (positions as Float32Array).set(nodePositions!);
      lineGeometry.attributes.position.needsUpdate = true;
    }

    // Pulsing lines
    const lineMaterial = (linesRef.current.material as THREE.LineBasicMaterial);
    lineMaterial.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;

    // Update node visibility
    const nodeMaterial = (nodesRef.current.material as THREE.PointsMaterial);
    nodeMaterial.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.25;
  });

  return (
    <group ref={groupRef}>
      {lineGeometry && (
        <lineSegments ref={linesRef} geometry={lineGeometry}>
          <lineBasicMaterial
            color="#00ff88"
            opacity={0.5}
            transparent
            linewidth={1}
          />
        </lineSegments>
      )}
      {nodePositions && (
        <points ref={nodesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={nodes.length}
              array={nodePositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#00ffff"
            size={0.08}
            opacity={0.7}
            transparent
            sizeAttenuation
          />
        </points>
      )}
    </group>
  );
}

// ============================================================================
// ENERGY STREAMS - FLOWING DATA
// ============================================================================

function EnergyStreams({ 
  size = 2, 
  intensity = 1 
}: { 
  size?: number; 
  intensity?: number 
}) {
  const ref = useRef<THREE.Group>(null);

  const streams = useMemo(() => {
    const s = [];
    for (let i = 0; i < 8; i++) {
      s.push({
        angle: (i / 8) * Math.PI * 2,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return s;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.children.forEach((child, i) => {
      const time = state.clock.elapsedTime;
      const stream = streams[i];
      
      // Rotate around orb
      child.position.x = Math.cos(stream.angle + time * 0.5) * 1.3;
      child.position.z = Math.sin(stream.angle + time * 0.5) * 1.3;
      
      // Vertical oscillation
      child.position.y = Math.sin(time + stream.offset) * 0.5;

      // Scale pulsing
      const pulse = 0.8 + Math.sin(time * 2 + stream.offset) * 0.2;
      child.scale.set(pulse, pulse, pulse);

      // Opacity wave
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.4 + Math.sin(time * 3 + stream.offset) * 0.3;
      }
    });
  });

  return (
    <group ref={ref}>
      {streams.map((_, i) => (
        <mesh key={i} position={[0, 0, 0]}>
          <icosahedronGeometry args={[0.15, 2]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#ff00ff' : '#00ffff'}
            emissive={i % 2 === 0 ? '#ff00ff' : '#00ffff'}
            emissiveIntensity={0.8}
            opacity={0.6}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// MAIN JARVIS NEXUS CORE COMPONENT
// ============================================================================

export interface JarvisNexusCoreProps {
  position?: [number, number, number];
  size?: number;
  intensity?: number;
  audioLevel?: number;
  quality?: 'low' | 'medium' | 'high';
  animate?: boolean;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  interactive?: boolean;
}

export const JarvisNexusCore = React.forwardRef<THREE.Group, JarvisNexusCoreProps>(
  (
    {
      position = [0, 0, 0],
      size = 2,
      intensity = 0.8,
      audioLevel = 0,
      quality = 'high',
      animate = true,
      onClick,
      interactive = true,
    },
    ref
  ) => {
    const groupRef = useRef<THREE.Group>(null);
    const coreRef = useRef<THREE.Mesh>(null);
    const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null);

    // Use forwarded ref or internal ref
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(groupRef.current);
        } else {
          ref.current = groupRef.current;
        }
      }
    }, [ref]);

    // Shader material
    const material = useMemo(() => {
      return new THREE.ShaderMaterial({
        vertexShader: crystallineVertexShader,
        fragmentShader: crystallineFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: intensity },
          uColor: { value: new THREE.Color('#00ddff') },
        },
        transparent: true,
        fog: true,
        side: THREE.DoubleSide,
      });
    }, [intensity]);

    useFrame((state) => {
      if (!groupRef.current || !coreRef.current || !shaderMaterialRef.current) return;

      const time = state.clock.elapsedTime;
      shaderMaterialRef.current.uniforms.uTime.value = time;
      shaderMaterialRef.current.uniforms.uIntensity.value = intensity + audioLevel * 0.3;

      // Rotate core
      if (animate) {
        coreRef.current.rotation.x = Math.sin(time * 0.3) * 0.1;
        coreRef.current.rotation.y += 0.002;
        coreRef.current.rotation.z = Math.cos(time * 0.2) * 0.08;
      }

      // Scale pulse with audio
      const audioPulse = 1 + audioLevel * 0.15;
      coreRef.current.scale.set(audioPulse, audioPulse, audioPulse);

      // Group glow
      groupRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as any;
          if (mat && mat.emissiveIntensity !== undefined) {
            mat.emissiveIntensity = 0.5 + audioLevel * 1.5;
          }
        }
      });
    });

    return (
      <group
        ref={groupRef}
        position={position}
        onClick={interactive ? onClick : undefined}
        scale={size}
      >
        {/* Crystalline Core */}
        <mesh
          ref={coreRef}
          material={shaderMaterialRef.current || material}
          onClick={onClick}
          scale={1.2}
        >
          <icosahedronGeometry args={[1, 5]} />
        </mesh>

        {/* Outer Glow Shell */}
        <mesh scale={1.5} position={[0, 0, 0]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={0.3}
            transparent
            opacity={0.1}
          />
        </mesh>

        {/* Neural Synapses Network */}
        <NeuralSynapses size={size} intensity={intensity} quality={quality} />

        {/* Energy Streams */}
        <EnergyStreams size={size} intensity={intensity} />

        {/* Pulse Rings */}
        {[1.3, 1.6, 1.9].map((r, i) => (
          <mesh key={`ring-${i}`} position={[0, 0, 0]}>
            <torusGeometry args={[r, 0.08, 32, 32]} />
            <meshStandardMaterial
              color={i === 0 ? '#ff00ff' : i === 1 ? '#00ffff' : '#00ff88'}
              emissive={i === 0 ? '#ff00ff' : i === 1 ? '#00ffff' : '#00ff88'}
              emissiveIntensity={0.5 + audioLevel}
              transparent
              opacity={0.4}
            />
          </mesh>
        ))}
      </group>
    );
  }
);

JarvisNexusCore.displayName = 'JarvisNexusCore';
