'use client';

/**
 * JarvisNeuralNetwork.tsx - Neural Network Visualization
 * 
 * Marvel JARVIS-style neural network display:
 * - Floating node spheres orbiting the core
 * - Glowing connection lines between nodes
 * - Particle streams flowing along connections
 * - Nodes pulse based on AI state (thinking/processing)
 * - Color-coded: cyan=data, magenta=processing, gold=output
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { JarvisStateConfig } from './jarvisStates';

// ============================================================================
// TYPES
// ============================================================================

export interface JarvisNeuralNetworkProps {
  size?: number;
  config: JarvisStateConfig;
  isThinking?: boolean;
  intensity?: number;
}

interface NeuralNode {
  id: number;
  position: THREE.Vector3;
  basePosition: THREE.Vector3;
  type: 'data' | 'processing' | 'output';
  connections: number[];
  pulseOffset: number;
  orbitSpeed: number;
  orbitRadius: number;
  orbitPhase: number;
}

// ============================================================================
// NODE COLORS
// ============================================================================

const NODE_COLORS = {
  data: '#00d4ff',      // Cyan
  processing: '#ff00ff', // Magenta
  output: '#ffd700',     // Gold
};

// ============================================================================
// NEURAL NODE COMPONENT
// ============================================================================

function NeuralNodeMesh({
  node,
  size,
  isThinking,
  intensity,
  time,
}: {
  node: NeuralNode;
  size: number;
  isThinking: boolean;
  intensity: number;
  time: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  const color = NODE_COLORS[node.type];
  const nodeSize = size * 0.08;
  
  // Calculate orbital position
  const angle = time * node.orbitSpeed + node.orbitPhase;
  const x = node.basePosition.x + Math.cos(angle) * node.orbitRadius * 0.3;
  const y = node.basePosition.y + Math.sin(time * 0.5 + node.pulseOffset) * 0.1;
  const z = node.basePosition.z + Math.sin(angle) * node.orbitRadius * 0.3;
  
  // Pulse effect when thinking
  const pulse = isThinking 
    ? 1 + Math.sin(time * 5 + node.pulseOffset) * 0.3 
    : 1;
  
  const emissiveIntensity = isThinking 
    ? 2 + Math.sin(time * 8 + node.pulseOffset) * 1 
    : 1;

  // Update node position for connection calculations
  useEffect(() => {
    node.position.set(x, y, z);
  }, [node, x, y, z]);

  return (
    <group position={[x, y, z]}>
      {/* Core node */}
      <mesh ref={meshRef} scale={pulse}>
        <sphereGeometry args={[nodeSize, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity * intensity}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh ref={glowRef} scale={pulse * 1.5}>
        <sphereGeometry args={[nodeSize, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Point light */}
      <pointLight
        color={color}
        intensity={emissiveIntensity * intensity * 0.5}
        distance={size * 0.5}
        decay={2}
      />
    </group>
  );
}

// ============================================================================
// CONNECTION LINE COMPONENT
// ============================================================================

function ConnectionLine({
  start,
  end,
  color,
  intensity,
  isActive,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  intensity: number;
  isActive: boolean;
}) {
  const points = useMemo(() => [
    [start.x, start.y, start.z] as [number, number, number],
    [end.x, end.y, end.z] as [number, number, number],
  ], [start, end]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={isActive ? 2 : 1}
      transparent
      opacity={intensity * (isActive ? 0.8 : 0.4)}
      dashed={!isActive}
      dashSize={0.1}
      gapSize={0.05}
    />
  );
}

// ============================================================================
// PARTICLE STREAM COMPONENT
// ============================================================================

function ParticleStream({
  start,
  end,
  color,
  intensity,
  isActive,
  time,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  intensity: number;
  isActive: boolean;
  time: number;
}) {
  const particleCount = 8;
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    return new Float32Array(particleCount * 3);
  }, []);
  
  const sizes = useMemo(() => {
    return new Float32Array(particleCount).fill(0.03);
  }, []);

  useFrame(() => {
    if (!isActive || !pointsRef.current) return;
    
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      // Calculate position along the line
      const t = ((time * 2 + i / particleCount) % 1);
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;
      const z = start.z + (end.z - start.z) * t;
      
      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!isActive) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={intensity * 0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JarvisNeuralNetwork({
  size = 1,
  config,
  isThinking = false,
  intensity = 1,
}: JarvisNeuralNetworkProps) {
  const timeRef = useRef(0);
  
  // Generate neural network nodes
  const nodes = useMemo<NeuralNode[]>(() => {
    const nodeList: NeuralNode[] = [];
    
    // Data input nodes (bottom layer)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      nodeList.push({
        id: i,
        position: new THREE.Vector3(),
        basePosition: new THREE.Vector3(
          Math.cos(angle) * size * 1.2,
          -size * 0.6,
          Math.sin(angle) * size * 1.2
        ),
        type: 'data',
        connections: [4, 5, 6], // Connect to processing nodes
        pulseOffset: i * 0.5,
        orbitSpeed: 0.3 + Math.random() * 0.2,
        orbitRadius: size * 0.2,
        orbitPhase: (i / 4) * Math.PI * 2,
      });
    }
    
    // Processing nodes (middle layer)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      nodeList.push({
        id: 4 + i,
        position: new THREE.Vector3(),
        basePosition: new THREE.Vector3(
          Math.cos(angle) * size * 0.9,
          0,
          Math.sin(angle) * size * 0.9
        ),
        type: 'processing',
        connections: [8, 9], // Connect to output nodes
        pulseOffset: (4 + i) * 0.5,
        orbitSpeed: 0.4 + Math.random() * 0.2,
        orbitRadius: size * 0.15,
        orbitPhase: (i / 4) * Math.PI * 2,
      });
    }
    
    // Output nodes (top layer)
    for (let i = 0; i < 2; i++) {
      const angle = (i / 2) * Math.PI * 2;
      nodeList.push({
        id: 8 + i,
        position: new THREE.Vector3(),
        basePosition: new THREE.Vector3(
          Math.cos(angle) * size * 0.5,
          size * 0.6,
          Math.sin(angle) * size * 0.5
        ),
        type: 'output',
        connections: [],
        pulseOffset: (8 + i) * 0.5,
        orbitSpeed: 0.5 + Math.random() * 0.2,
        orbitRadius: size * 0.1,
        orbitPhase: (i / 2) * Math.PI * 2,
      });
    }
    
    return nodeList;
  }, [size]);
  
  // Update time
  useFrame((state) => {
    timeRef.current = state.clock.elapsedTime;
  });
  
  // Generate connection pairs
  const connections = useMemo(() => {
    const pairs: { from: NeuralNode; to: NeuralNode }[] = [];
    
    nodes.forEach(node => {
      node.connections.forEach(targetId => {
        const targetNode = nodes.find(n => n.id === targetId);
        if (targetNode) {
          pairs.push({ from: node, to: targetNode });
        }
      });
    });
    
    return pairs;
  }, [nodes]);

  return (
    <group>
      {/* Render nodes */}
      {nodes.map(node => (
        <NeuralNodeMesh
          key={node.id}
          node={node}
          size={size}
          isThinking={isThinking}
          intensity={intensity}
          time={timeRef.current}
        />
      ))}
      
      {/* Render connections */}
      {connections.map((conn, i) => (
        <group key={`conn-${i}`}>
          <ConnectionLine
            start={conn.from.position}
            end={conn.to.position}
            color={NODE_COLORS[conn.from.type]}
            intensity={intensity}
            isActive={isThinking}
          />
          <ParticleStream
            start={conn.from.position}
            end={conn.to.position}
            color={NODE_COLORS[conn.from.type]}
            intensity={intensity}
            isActive={isThinking}
            time={timeRef.current}
          />
        </group>
      ))}
    </group>
  );
}

export default JarvisNeuralNetwork;

