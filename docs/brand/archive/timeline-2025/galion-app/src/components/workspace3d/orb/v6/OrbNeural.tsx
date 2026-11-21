/**
 * GALION Orb V6 - Neural Network Component
 *
 * Visualizes a neural network with nodes and impulses.
 * Represents the AI's "thinking" process.
 */

'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbColors } from './types';

// =============================================================================
// TYPES
// =============================================================================

interface NeuralNode {
  position: THREE.Vector3;
  basePosition: THREE.Vector3;
  connections: number[];
  energy: number;
  pulseOffset: number;
}

interface NeuralImpulse {
  active: boolean;
  startIdx: number;
  endIdx: number;
  progress: number;
  speed: number;
}

// =============================================================================
// SEEDED RANDOM - Deterministic for SSR/hydration consistency
// =============================================================================

function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function createCircleTexture(): THREE.Texture | undefined {
  if (typeof document === 'undefined') return undefined;

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;

  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  return new THREE.CanvasTexture(canvas);
}

// =============================================================================
// COMPONENT
// =============================================================================

interface OrbNeuralProps {
  colors: OrbColors;
  nodeCount?: number;
  maxConnections?: number;
  radius?: number;
  audioLevel: number;
  activity: number; // 0-1
}

export function OrbNeural({
  colors,
  nodeCount = 80,
  maxConnections = 4,
  radius = 0.85,
  audioLevel,
  activity,
}: OrbNeuralProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Points>(null);
  const impulsesRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const [isClient, setIsClient] = useState(false);

  // Set client flag after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Texture for soft particles - only create on client
  const circleTexture = useMemo(() => {
    if (!isClient) return undefined;
    return createCircleTexture();
  }, [isClient]);

  // Initialize neural network data with seeded random
  const neuralData = useMemo(() => {
    const seededRandom = createSeededRandom(42); // Fixed seed for consistency
    const nodes: NeuralNode[] = [];
    const connections: [number, number][] = [];
    const nodePositions = new Float32Array(nodeCount * 3);
    const impulsePositions = new Float32Array(200 * 3); // Max 200 impulses
    const linePositions: number[] = [];

    // Create nodes in fibonacci sphere distribution
    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / nodeCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const r = radius * (0.5 + seededRandom() * 0.5);

      const pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      nodes.push({
        position: pos.clone(),
        basePosition: pos.clone(),
        connections: [],
        energy: seededRandom() * 0.3,
        pulseOffset: seededRandom() * Math.PI * 2,
      });

      nodePositions[i * 3] = pos.x;
      nodePositions[i * 3 + 1] = pos.y;
      nodePositions[i * 3 + 2] = pos.z;
    }

    // Create connections to nearest neighbors
    const connectionSet = new Set<string>();
    nodes.forEach((node, i) => {
      const distances = nodes.map((n, idx) => ({
        idx,
        dist: node.basePosition.distanceTo(n.basePosition),
      }));
      distances.sort((a, b) => a.dist - b.dist);

      // Connect to nearest k nodes
      for (let j = 1; j <= maxConnections && j < distances.length; j++) {
        const neighborIdx = distances[j].idx;
        if (distances[j].dist < radius * 0.7) {
          const key = `${Math.min(i, neighborIdx)}-${Math.max(i, neighborIdx)}`;
          if (!connectionSet.has(key)) {
            connectionSet.add(key);
            node.connections.push(neighborIdx);
            nodes[neighborIdx].connections.push(i);
            connections.push([i, neighborIdx]);

            // Add line positions
            const p1 = nodes[i].basePosition;
            const p2 = nodes[neighborIdx].basePosition;
            linePositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
          }
        }
      }
    });

    // Initialize impulses (inactive)
    const impulses: NeuralImpulse[] = [];
    for (let i = 0; i < 200; i++) {
      impulses.push({
        active: false,
        startIdx: 0,
        endIdx: 0,
        progress: 0,
        speed: 0,
      });
      // Position off-screen
      impulsePositions[i * 3] = 9999;
      impulsePositions[i * 3 + 1] = 9999;
      impulsePositions[i * 3 + 2] = 9999;
    }

    return {
      nodes,
      connections,
      impulses,
      nodePositions,
      impulsePositions,
      linePositions: new Float32Array(linePositions),
    };
  }, [nodeCount, maxConnections, radius]);

  // Animation loop
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    const { nodes, impulses, nodePositions, impulsePositions } = neuralData;

    // Update nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Gentle floating motion
      node.position.x = node.basePosition.x + Math.sin(time * 0.5 + node.pulseOffset) * 0.02;
      node.position.y = node.basePosition.y + Math.cos(time * 0.4 + node.pulseOffset * 1.3) * 0.02;
      node.position.z = node.basePosition.z + Math.sin(time * 0.6 + node.pulseOffset * 0.7) * 0.02;

      // Update buffer
      nodePositions[i * 3] = node.position.x;
      nodePositions[i * 3 + 1] = node.position.y;
      nodePositions[i * 3 + 2] = node.position.z;

      // Energy decay
      node.energy *= 0.98;

      // Random energy injection based on activity and audio
      if (Math.random() < 0.02 * activity + audioLevel * 0.05) {
        node.energy += 0.4;
      }

      // Fire impulses when energy is high
      if (node.energy > 1.0 && node.connections.length > 0) {
        node.energy = 0;

        // Spawn impulse to random connection
        const targetIdx = node.connections[Math.floor(Math.random() * node.connections.length)];
        const freeImpulse = impulses.find(imp => !imp.active);
        if (freeImpulse) {
          freeImpulse.active = true;
          freeImpulse.startIdx = i;
          freeImpulse.endIdx = targetIdx;
          freeImpulse.progress = 0;
          freeImpulse.speed = 1.5 + Math.random() + audioLevel * 2;
        }
      }
    }

    // Update impulses
    for (let i = 0; i < impulses.length; i++) {
      const impulse = impulses[i];
      if (impulse.active) {
        impulse.progress += impulse.speed * delta;

        if (impulse.progress >= 1.0) {
          // Arrived - transfer energy
          impulse.active = false;
          impulsePositions[i * 3] = 9999;

          const target = nodes[impulse.endIdx];
          if (target) target.energy += 0.25;
        } else {
          // Interpolate position
          const p1 = nodes[impulse.startIdx].position;
          const p2 = nodes[impulse.endIdx].position;
          const t = impulse.progress;

          impulsePositions[i * 3] = p1.x + (p2.x - p1.x) * t;
          impulsePositions[i * 3 + 1] = p1.y + (p2.y - p1.y) * t;
          impulsePositions[i * 3 + 2] = p1.z + (p2.z - p1.z) * t;
        }
      }
    }

    // Mark buffers for update
    if (nodesRef.current) {
      nodesRef.current.geometry.attributes.position.needsUpdate = true;
    }
    if (impulsesRef.current) {
      impulsesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Rotate entire network slowly
    groupRef.current.rotation.y += delta * 0.03 * (1 + audioLevel);
    groupRef.current.rotation.x = Math.sin(time * 0.1) * 0.05;
  });

  // Don't render on server
  if (!isClient) return null;

  return (
    <group ref={groupRef}>
      {/* Neural Nodes */}
      <points ref={nodesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={nodeCount}
            array={neuralData.nodePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          map={circleTexture}
          size={0.08}
          sizeAttenuation
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color={colors.particles}
        />
      </points>

      {/* Neural Impulses */}
      <points ref={impulsesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={200}
            array={neuralData.impulsePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          map={circleTexture}
          size={0.06}
          sizeAttenuation
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#ffffff"
        />
      </points>

      {/* Connection Lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={neuralData.linePositions.length / 3}
            array={neuralData.linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={colors.secondary}
          transparent
          opacity={0.08}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

export default OrbNeural;
