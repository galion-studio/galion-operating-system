'use client';

/**
 * OrbNeuralNetwork.tsx - Synapse Firing Visualization
 * 
 * Creates the neural network effect inside the orb - the "intelligence":
 * - Thin glowing lines connecting random points
 * - Lines pulse with light traveling along them (neurons firing)
 * - More activity during "thinking" state
 * - Colors shift with emotion
 * - Connections form/dissolve dynamically
 */

import React, { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbState, getStateConfig } from './orbV3States';
import { OrbEmotion, getEmotionConfig } from './orbV3Emotions';

// ============================================================================
// TYPES
// ============================================================================

export interface OrbNeuralNetworkProps {
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

interface NeuronNode {
  position: THREE.Vector3;
  connections: number[];
  active: boolean;
  lastFired: number;
}

interface SynapseSignal {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  active: boolean;
}

// ============================================================================
// NEURAL NODE (Neuron points)
// ============================================================================

interface NeuralNodesProps {
  nodes: NeuronNode[];
  color: string;
  intensity: number;
  activityLevel: number;
}

function NeuralNodes({ nodes, color, intensity, activityLevel }: NeuralNodesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(nodes.length * 3);
    const sizes = new Float32Array(nodes.length);
    
    nodes.forEach((node, i) => {
      positions[i * 3] = node.position.x;
      positions[i * 3 + 1] = node.position.y;
      positions[i * 3 + 2] = node.position.z;
      sizes[i] = 2 + Math.random() * 2;
    });
    
    return { positions, sizes };
  }, [nodes]);
  
  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const material = pointsRef.current.material as THREE.PointsMaterial;
    
    // Pulse based on activity
    const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2 * activityLevel;
    material.opacity = intensity * pulse;
    material.size = 2 + activityLevel * 2;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={nodes.length}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={3}
        transparent
        opacity={intensity * 0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// SYNAPSE CONNECTIONS (Lines between neurons)
// ============================================================================

interface SynapseConnectionsProps {
  nodes: NeuronNode[];
  color: string;
  intensity: number;
  visibility: number;
}

function SynapseConnections({ nodes, color, intensity, visibility }: SynapseConnectionsProps) {
  const linesRef = useRef<THREE.LineSegments>(null);
  
  // Generate connection geometry
  const { positions, indices } = useMemo(() => {
    const positions: number[] = [];
    const indices: number[] = [];
    let indexCounter = 0;
    
    nodes.forEach((node, i) => {
      node.connections.forEach(targetIdx => {
        if (targetIdx > i) { // Avoid duplicates
          const target = nodes[targetIdx];
          if (target) {
            positions.push(
              node.position.x, node.position.y, node.position.z,
              target.position.x, target.position.y, target.position.z
            );
            indices.push(indexCounter, indexCounter + 1);
            indexCounter += 2;
          }
        }
      });
    });
    
    return {
      positions: new Float32Array(positions),
      indices: new Uint16Array(indices),
    };
  }, [nodes]);
  
  useFrame((state) => {
    if (!linesRef.current) return;
    
    const material = linesRef.current.material as THREE.LineBasicMaterial;
    const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    material.opacity = intensity * visibility * pulse;
  });
  
  if (positions.length === 0) return null;
  
  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="index"
          array={indices}
          count={indices.length}
          itemSize={1}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={intensity * visibility * 0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

// ============================================================================
// FIRING SIGNAL (Light pulse traveling along synapse)
// ============================================================================

interface FiringSignalProps {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  progress: number;
  color: string;
  intensity: number;
}

function FiringSignal({ fromPos, toPos, progress, color, intensity }: FiringSignalProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Calculate current position
  const currentPos = useMemo(() => {
    return new THREE.Vector3().lerpVectors(fromPos, toPos, progress);
  }, [fromPos, toPos, progress]);
  
  // Trail positions
  const trailPositions = useMemo(() => {
    const trail: number[] = [];
    const numPoints = 5;
    
    for (let i = 0; i < numPoints; i++) {
      const t = Math.max(0, progress - i * 0.05);
      const pos = new THREE.Vector3().lerpVectors(fromPos, toPos, t);
      trail.push(pos.x, pos.y, pos.z);
    }
    
    return new Float32Array(trail);
  }, [fromPos, toPos, progress]);
  
  return (
    <group>
      {/* Signal head */}
      <mesh ref={meshRef} position={currentPos}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={intensity * 0.9}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Signal trail */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={5}
            array={trailPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={intensity * 0.5}
          blending={THREE.AdditiveBlending}
        />
      </line>
    </group>
  );
}

// ============================================================================
// FIRING SIGNALS MANAGER
// ============================================================================

interface SignalsManagerProps {
  nodes: NeuronNode[];
  signals: SynapseSignal[];
  color: string;
  intensity: number;
}

function SignalsManager({ nodes, signals, color, intensity }: SignalsManagerProps) {
  return (
    <group>
      {signals.filter(s => s.active).map((signal, i) => {
        const fromNode = nodes[signal.fromNode];
        const toNode = nodes[signal.toNode];
        
        if (!fromNode || !toNode) return null;
        
        return (
          <FiringSignal
            key={i}
            fromPos={fromNode.position}
            toPos={toNode.position}
            progress={signal.progress}
            color={color}
            intensity={intensity}
          />
        );
      })}
    </group>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrbNeuralNetwork({
  size = 2,
  state = 'idle',
  emotion = 'neutral',
  intensity = 0.5,
  quality = 'high',
}: OrbNeuralNetworkProps) {
  const groupRef = useRef<THREE.Group>(null);
  const signalsRef = useRef<SynapseSignal[]>([]);
  const lastFireTimeRef = useRef(0);
  
  // Get configurations
  const stateConfig = getStateConfig(state);
  const emotionConfig = getEmotionConfig(emotion);
  
  // Calculate node count based on quality
  const nodeCount = useMemo(() => {
    switch (quality) {
      case 'low': return 15;
      case 'medium': return 30;
      case 'high': return 50;
      default: return 30;
    }
  }, [quality]);
  
  // Generate neural network nodes
  const nodes = useMemo(() => {
    const nodes: NeuronNode[] = [];
    
    for (let i = 0; i < nodeCount; i++) {
      // Distribute in sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = size * (0.2 + Math.random() * 0.6);
      
      const position = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      
      // Generate connections (2-4 per node, to nearby nodes)
      const connections: number[] = [];
      const numConnections = 2 + Math.floor(Math.random() * 3);
      
      for (let j = 0; j < numConnections; j++) {
        const targetIdx = Math.floor(Math.random() * nodeCount);
        if (targetIdx !== i && !connections.includes(targetIdx)) {
          connections.push(targetIdx);
        }
      }
      
      nodes.push({
        position,
        connections,
        active: false,
        lastFired: 0,
      });
    }
    
    return nodes;
  }, [nodeCount, size]);
  
  // Initialize signals
  useMemo(() => {
    signalsRef.current = [];
    for (let i = 0; i < 20; i++) {
      signalsRef.current.push({
        fromNode: 0,
        toNode: 0,
        progress: 0,
        speed: 0.5 + Math.random() * 1,
        active: false,
      });
    }
  }, []);
  
  // Neural activity level
  const activityLevel = stateConfig.neural.activity + emotionConfig.neuralBoost;
  const visibility = stateConfig.neural.visibility;
  
  // Fire rate based on activity
  const fireInterval = useMemo(() => {
    if (activityLevel > 0.8) return 0.1; // Rapid firing
    if (activityLevel > 0.5) return 0.3;
    if (activityLevel > 0.2) return 0.8;
    return 2; // Occasional
  }, [activityLevel]);
  
  // Update signals
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Slow rotation
    groupRef.current.rotation.y += 0.001 * emotionConfig.speedMultiplier;
    
    // Update active signals
    signalsRef.current.forEach(signal => {
      if (signal.active) {
        signal.progress += delta * signal.speed * emotionConfig.speedMultiplier;
        if (signal.progress >= 1) {
          signal.active = false;
        }
      }
    });
    
    // Fire new signals based on activity level
    const currentTime = state.clock.elapsedTime;
    if (currentTime - lastFireTimeRef.current > fireInterval) {
      lastFireTimeRef.current = currentTime;
      
      // Find inactive signal to reuse
      const inactiveSignal = signalsRef.current.find(s => !s.active);
      if (inactiveSignal && Math.random() < activityLevel) {
        // Pick random node with connections
        const nodeWithConnections = nodes.filter(n => n.connections.length > 0);
        if (nodeWithConnections.length > 0) {
          const sourceIdx = nodes.indexOf(
            nodeWithConnections[Math.floor(Math.random() * nodeWithConnections.length)]
          );
          const source = nodes[sourceIdx];
          const targetIdx = source.connections[
            Math.floor(Math.random() * source.connections.length)
          ];
          
          inactiveSignal.fromNode = sourceIdx;
          inactiveSignal.toNode = targetIdx;
          inactiveSignal.progress = 0;
          inactiveSignal.speed = 0.5 + Math.random() * 1.5;
          inactiveSignal.active = true;
        }
      }
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Neural nodes (neuron points) */}
      <NeuralNodes
        nodes={nodes}
        color={emotionConfig.synapse}
        intensity={intensity}
        activityLevel={activityLevel}
      />
      
      {/* Synapse connections (static lines) */}
      <SynapseConnections
        nodes={nodes}
        color={emotionConfig.synapse}
        intensity={intensity}
        visibility={visibility}
      />
      
      {/* Firing signals (animated pulses) */}
      <SignalsManager
        nodes={nodes}
        signals={signalsRef.current}
        color={emotionConfig.accent}
        intensity={intensity * activityLevel}
      />
    </group>
  );
}

export default OrbNeuralNetwork;

