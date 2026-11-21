'use client';

/**
 * JarvisOrbMemories.tsx - Internal Memory Nodes
 * 
 * Floating nodes inside the orb representing:
 * - Different AI components/systems
 * - Memory banks
 * - Processing units
 * - Connected by glowing neural lines
 * 
 * Inspired by Jarvis's internal visualization
 * showing multiple subsystems working together.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { JarvisStateConfig } from './jarvisStates';

// ============================================================================
// TYPES
// ============================================================================

export interface JarvisOrbMemoriesProps {
  size?: number;
  config: JarvisStateConfig;
}

interface MemoryNode {
  id: string;
  position: THREE.Vector3;
  basePosition: THREE.Vector3;
  color: string;
  size: number;
  pulsePhase: number;
}

// ============================================================================
// MEMORY NODE COMPONENT
// ============================================================================

function MemoryNodeMesh({
  node,
  pulseFrequency,
  time,
}: {
  node: MemoryNode;
  pulseFrequency: number;
  time: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Calculate pulsing
  const pulse = Math.sin(time * pulseFrequency + node.pulsePhase) * 0.3 + 0.7;
  const scale = node.size * (0.8 + pulse * 0.4);
  
  return (
    <group position={node.position}>
      {/* Core node - icosahedron for angular look */}
      <mesh ref={meshRef} scale={scale}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={pulse}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh ref={glowRef} scale={scale * 1.5}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={0.2 * pulse}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Point light */}
      <pointLight
        color={node.color}
        intensity={pulse * 0.5}
        distance={node.size * 5}
      />
    </group>
  );
}

// ============================================================================
// CONNECTION LINES
// ============================================================================

function ConnectionLines({
  nodes,
  visibility,
  time,
}: {
  nodes: MemoryNode[];
  visibility: number;
  time: number;
}) {
  const linesRef = useRef<THREE.Group>(null);
  
  // Generate connection pairs (connect each node to 2-3 neighbors)
  const connections = useMemo(() => {
    const conns: [MemoryNode, MemoryNode][] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      // Connect to next 2 nodes (circular)
      for (let j = 1; j <= 2; j++) {
        const nextIdx = (i + j) % nodes.length;
        if (nextIdx !== i) {
          conns.push([nodes[i], nodes[nextIdx]]);
        }
      }
    }
    
    return conns;
  }, [nodes]);
  
  return (
    <group ref={linesRef}>
      {connections.map((conn, idx) => {
        const [nodeA, nodeB] = conn;
        const pulse = Math.sin(time * 2 + idx * 0.5) * 0.5 + 0.5;
        
        // Create curved line using quadratic bezier
        const midPoint = new THREE.Vector3()
          .addVectors(nodeA.position, nodeB.position)
          .multiplyScalar(0.5);
        
        // Pull midpoint toward center for curve
        midPoint.multiplyScalar(0.7);
        
        const curve = new THREE.QuadraticBezierCurve3(
          nodeA.position,
          midPoint,
          nodeB.position
        );
        
        const points = curve.getPoints(20);
        
        return (
          <line key={idx}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={points.length}
                array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={nodeA.color}
              transparent
              opacity={visibility * pulse * 0.6}
              blending={THREE.AdditiveBlending}
            />
          </line>
        );
      })}
    </group>
  );
}

// ============================================================================
// DATA PARTICLES FLOWING ON CONNECTIONS
// ============================================================================

function DataParticles({
  nodes,
  config,
  time,
}: {
  nodes: MemoryNode[];
  config: JarvisStateConfig;
  time: number;
}) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = Math.floor(config.memories.activeCount * 10 * config.dataStreams.density);
  
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Random position within sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = Math.random() * 0.6;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      
      // Color from palette
      const colorIdx = Math.floor(Math.random() * config.memories.colors.length);
      const color = new THREE.Color(config.memories.colors[colorIdx]);
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    
    return { positions: pos, colors: col };
  }, [particleCount, config.memories.colors]);
  
  useFrame(() => {
    if (!particlesRef.current) return;
    
    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      // Spiral motion
      const x = posArray[i * 3];
      const y = posArray[i * 3 + 1];
      const z = posArray[i * 3 + 2];
      
      const speed = config.dataStreams.speed * 0.01;
      const direction = config.dataStreams.direction;
      
      // Rotate around Y axis
      const angle = Math.atan2(z, x) + speed * direction;
      const r = Math.sqrt(x * x + z * z);
      
      posArray[i * 3] = Math.cos(angle) * r;
      posArray[i * 3 + 2] = Math.sin(angle) * r;
      posArray[i * 3 + 1] += (Math.random() - 0.5) * 0.002;
      
      // Keep within bounds
      const dist = Math.sqrt(posArray[i * 3] ** 2 + posArray[i * 3 + 1] ** 2 + posArray[i * 3 + 2] ** 2);
      if (dist > 0.7) {
        const scale = 0.3 / dist;
        posArray[i * 3] *= scale;
        posArray[i * 3 + 1] *= scale;
        posArray[i * 3 + 2] *= scale;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JarvisOrbMemories({ size = 1, config }: JarvisOrbMemoriesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  
  // Generate memory nodes
  const nodes = useMemo(() => {
    const nodeList: MemoryNode[] = [];
    const count = config.memories.activeCount;
    
    // Distribute nodes in 3D space using fibonacci sphere
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    
    for (let i = 0; i < count; i++) {
      const theta = (2 * Math.PI * i) / goldenRatio;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const r = 0.5 * size;
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      const pos = new THREE.Vector3(x, y, z);
      
      nodeList.push({
        id: `node-${i}`,
        position: pos,
        basePosition: pos.clone(),
        color: config.memories.colors[i % config.memories.colors.length],
        size: 0.04 * size,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    
    return nodeList;
  }, [config.memories.activeCount, config.memories.colors, size]);
  
  // Animation
  useFrame((state) => {
    timeRef.current = state.clock.elapsedTime;
    
    if (groupRef.current) {
      // Slow rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
    }
    
    // Animate node positions (gentle floating)
    nodes.forEach((node, i) => {
      const t = state.clock.elapsedTime;
      const offset = new THREE.Vector3(
        Math.sin(t * 0.5 + i) * 0.02,
        Math.cos(t * 0.3 + i * 0.7) * 0.02,
        Math.sin(t * 0.4 + i * 1.3) * 0.02
      );
      node.position.copy(node.basePosition).add(offset);
    });
  });
  
  return (
    <group ref={groupRef} scale={size}>
      {/* Memory nodes */}
      {nodes.map((node) => (
        <MemoryNodeMesh
          key={node.id}
          node={node}
          pulseFrequency={config.memories.pulseFrequency}
          time={timeRef.current}
        />
      ))}
      
      {/* Connection lines */}
      <ConnectionLines
        nodes={nodes}
        visibility={config.memories.connectionVisibility}
        time={timeRef.current}
      />
      
      {/* Data particles */}
      <DataParticles
        nodes={nodes}
        config={config}
        time={timeRef.current}
      />
    </group>
  );
}

export default JarvisOrbMemories;

