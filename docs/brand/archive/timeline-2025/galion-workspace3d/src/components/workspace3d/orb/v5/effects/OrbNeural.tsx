/**
 * GALION Orb V5.2 - Neural Network System
 *
 * ADVANCED LOGIC: Spiking Neural Network (SNN) Simulation
 * - True signal propagation (packets travel between nodes)
 * - Self-organizing activity waves
 * - Audio-driven inputs
 * - Floating/Drifting nodes
 */

"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getEmotionConfig } from "../config/emotions";
import { getStateConfig } from "../config/states";
import { Emotion, OrbState } from "../types";

// ============================================================================
// HELPERS
// ============================================================================
function createCircleTexture() {
  if (typeof document === 'undefined') return undefined;
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;

  const cx = 16;
  const cy = 16;
  const r = 14;

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  return new THREE.CanvasTexture(canvas);
}

// Perlin-like simple noise for floating animation
function simpleNoise(x: number, y: number, z: number) {
  return Math.sin(x) * Math.cos(y) * Math.sin(z);
}

// ============================================================================
// LOGIC TYPES
// ============================================================================

interface SimNode {
  basePos: THREE.Vector3; // Original position
  currentPos: THREE.Vector3; // Animated position
  velocity: THREE.Vector3;
  connections: number[];
  energy: number; // 0 to 1 (Potential)
  refractoryTimer: number; // Cooldown after firing
  pulseOffset: number;
}

interface SimImpulse {
  active: boolean;
  startIdx: number;
  endIdx: number;
  progress: number; // 0.0 to 1.0
  speed: number;
}

export interface OrbNeuralProps {
  state: OrbState;
  emotion: Emotion;
  stateRef?: React.MutableRefObject<OrbState>;
  emotionRef?: React.MutableRefObject<Emotion>;
  nodeCount?: number;
  radius?: number;
  maxConnections?: number;
  animate?: boolean;
  animationProgress?: number;
  animationProgressRef?: React.MutableRefObject<number>;
  audioRef?: React.MutableRefObject<any>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrbNeuralEffect({
  state,
  emotion,
  stateRef,
  emotionRef,
  nodeCount = 100,
  radius = 0.9,
  maxConnections = 6,
  animate = true,
  audioRef,
}: OrbNeuralProps) {
  const effectiveNodeCount = Math.max(nodeCount, 80);

  // -- REFS --
  const neuralGroupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Points>(null);
  const impulsesRef = useRef<THREE.Points>(null);
  const linesRef = useRef<Map<string, THREE.Line>>(new Map());
  const nodesMaterialRef = useRef<THREE.PointsMaterial>(null);
  const impulsesMaterialRef = useRef<THREE.PointsMaterial>(null);

  // -- SIMULATION STATE --
  // We use refs for simulation state to avoid React re-renders loops
  const simState = useRef({
    nodes: [] as SimNode[],
    impulses: [] as SimImpulse[],
    nodePositions: new Float32Array(effectiveNodeCount * 3),
    impulsePositions: new Float32Array(500 * 3), // Max 500 packets
    connections: [] as [number, number][]
  });

  const circleTexture = useMemo(() => createCircleTexture(), []);

  // -- INITIALIZATION --
  useMemo(() => {
    const s = simState.current;

    // Generate Nodes (Fibonacci Sphere)
    for (let i = 0; i < effectiveNodeCount; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / effectiveNodeCount);
      const theta = Math.PI * (1 + 5 ** 0.5) * (i + 0.5);
      const r = radius * (0.6 + Math.random() * 0.4);

      const pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      s.nodes.push({
        basePos: pos.clone(),
        currentPos: pos.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.002,
          (Math.random() - 0.5) * 0.002,
          (Math.random() - 0.5) * 0.002
        ),
        connections: [],
        energy: Math.random() * 0.5, // Start with some energy
        refractoryTimer: 0,
        pulseOffset: Math.random() * 10
      });

      s.nodePositions[i * 3] = pos.x;
      s.nodePositions[i * 3 + 1] = pos.y;
      s.nodePositions[i * 3 + 2] = pos.z;
    }

    // Connect Nodes
    const connectionSet = new Set<string>();
    s.nodes.forEach((node, i) => {
      const distances = s.nodes.map((n, idx) => ({ idx, dist: node.basePos.distanceTo(n.basePos) }));
      distances.sort((a, b) => a.dist - b.dist);

      // Connect to nearest K
      const k = Math.min(maxConnections, distances.length);
      for (let j = 0; j < k; j++) {
        const potentialNeighbor = distances[j].idx;
        if (potentialNeighbor !== i && distances[j].dist < radius * 0.8) {
          if (!node.connections.includes(potentialNeighbor)) {
            node.connections.push(potentialNeighbor);
            // Add reciprocal? Simpler network graph: unidirectional or bi?
            // Let's do bidirectional for easier paths
            if (!s.nodes[potentialNeighbor].connections.includes(i)) {
              s.nodes[potentialNeighbor].connections.push(i);
            }

            const key = `${Math.min(i, potentialNeighbor)}-${Math.max(i, potentialNeighbor)}`;
            if (!connectionSet.has(key)) {
              connectionSet.add(key);
              s.connections.push([Math.min(i, potentialNeighbor), Math.max(i, potentialNeighbor)]);
            }
          }
        }
      }
    });

    // Init Impulses Pool
    for (let i = 0; i < 500; i++) {
      s.impulses.push({
        active: false,
        startIdx: 0,
        endIdx: 0,
        progress: 0,
        speed: 0
      });
      // Init off-screen
      s.impulsePositions[i * 3] = 9999;
    }

  }, [effectiveNodeCount, radius, maxConnections]); // Run once

  // -- ANIMATION LOOP --
  useFrame((frameState, delta) => {

    // Configs
    const currentState = stateRef?.current || state;
    const currentEmotion = emotionRef?.current || emotion;
    const audioLevel = audioRef?.current?.analysis?.level || 0;

    const stateConfig = getStateConfig(currentState);
    const emotionConfig = getEmotionConfig(currentEmotion);
    const activityConfig = stateConfig.visual.neuralActivity || 0.5;

    const s = simState.current;

    const time = frameState.clock.elapsedTime;

    // 1. UPDATE NODES (Physics & Logic)
    for (let i = 0; i < effectiveNodeCount; i++) {
      const node = s.nodes[i];

      // -- FLOAT PHYSICS --
      // Drift slowly
      node.currentPos.x += Math.sin(time * 0.5 + node.basePos.y) * 0.001 * (1 + audioLevel);
      node.currentPos.y += Math.cos(time * 0.4 + node.basePos.z) * 0.001 * (1 + audioLevel);
      node.currentPos.z += Math.sin(time * 0.6 + node.basePos.x) * 0.001 * (1 + audioLevel);

      // Tether to base
      node.currentPos.lerp(node.basePos, 0.01);

      // Update Buffer
      s.nodePositions[i * 3] = node.currentPos.x;
      s.nodePositions[i * 3 + 1] = node.currentPos.y;
      s.nodePositions[i * 3 + 2] = node.currentPos.z;

      // -- SNN LOGIC --
      // Decay
      node.refractoryTimer = Math.max(0, node.refractoryTimer - delta);
      node.energy *= 0.98; // Natural decay

      // Input (Audio injects energy randomly)
      if (Math.random() < 0.01 + (audioLevel * 0.1)) {
        node.energy += 0.3 * audioLevel;
      }

      // Fire?
      if (node.energy > 1.0 && node.refractoryTimer <= 0) {
        // FIRE!
        node.refractoryTimer = 0.5; // Cooldown
        node.energy = 0; // Reset

        // Spawn Packets to neighbors
        for (const neighborIdx of node.connections) {
          // Find free impulse
          const freeImpulse = s.impulses.find(pk => !pk.active);
          if (freeImpulse) {
            freeImpulse.active = true;
            freeImpulse.startIdx = i;
            freeImpulse.endIdx = neighborIdx;
            freeImpulse.progress = 0;
            freeImpulse.speed = 1.0 + Math.random() + (audioLevel * 2); // Varying speeds
          }
        }
      }

      // Auto-fire occasional background logic
      if (Math.random() < 0.005 * activityConfig) node.energy += 1.0;
    }

    // 2. UPDATE IMPULSES (Travel)
    s.impulses.forEach((impulse, i) => {
      if (impulse.active) {
        impulse.progress += impulse.speed * delta;

        if (impulse.progress >= 1.0) {
          // Arrived!
          impulse.active = false;
          s.impulsePositions[i * 3] = 9999;

          // Excite target
          const target = s.nodes[impulse.endIdx];
          if (target) target.energy += 0.2; // Transfer energy

        } else {
          // Interpolate Position
          const p1 = s.nodes[impulse.startIdx].currentPos;
          const p2 = s.nodes[impulse.endIdx].currentPos;

          const x = p1.x + (p2.x - p1.x) * impulse.progress;
          const y = p1.y + (p2.y - p1.y) * impulse.progress;
          const z = p1.z + (p2.z - p1.z) * impulse.progress;

          s.impulsePositions[i * 3] = x;
          s.impulsePositions[i * 3 + 1] = y;
          s.impulsePositions[i * 3 + 2] = z;
        }
      }
    });

    // 3. FLUSH BUFFERS TO GPU
    if (nodesRef.current) {
      nodesRef.current.geometry.attributes.position.needsUpdate = true;
    }
    if (impulsesRef.current) {
      impulsesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Update Lines Geometry (nodes moved)
    // Doing this every frame for 100s of lines is heavy.
    // Optimization: Update lines only when audio is high or every X frames.
    // Or iterate linesRef:
    linesRef.current.forEach((line, key) => {
      const [startIdx, endIdx] = key.split('-').map(Number);
      const p1 = s.nodes[startIdx].currentPos;
      const p2 = s.nodes[endIdx].currentPos;

      const posAttr = line.geometry.attributes.position as THREE.BufferAttribute;
      posAttr.setXYZ(0, p1.x, p1.y, p1.z);
      posAttr.setXYZ(1, p2.x, p2.y, p2.z);
      posAttr.needsUpdate = true;

      // Material color/opacity
      const mat = line.material as THREE.LineBasicMaterial;
      const energyAvg = (s.nodes[startIdx].energy + s.nodes[endIdx].energy) * 0.5;
      mat.opacity = 0.02 + (energyAvg * 0.1);
      mat.color.lerp(new THREE.Color(emotionConfig.colors.secondary), 0.1);
      if (energyAvg > 0.5) mat.color.lerp(new THREE.Color(0xffffff), energyAvg * 0.5);
    });

    // 4. Update Materials
    if (nodesMaterialRef.current) {
      const mat = nodesMaterialRef.current;
      const col = new THREE.Color(emotionConfig.colors.accent);
      if (audioLevel > 0.1) col.lerp(new THREE.Color(1, 1, 1), audioLevel * 0.5);
      mat.color.lerp(col, delta * 5);
      mat.opacity = activityConfig * 0.4;
      mat.size = 0.15 * (1 + audioLevel * 0.2);
    }

    // Group Rotation
    if (neuralGroupRef.current) {
      neuralGroupRef.current.rotation.y += delta * 0.02 * (1 + audioLevel);
    }
  });

  return (
    <group ref={neuralGroupRef} renderOrder={10}>
      {/* NODES */}
      <points ref={nodesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={effectiveNodeCount}
            array={simState.current.nodePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={nodesMaterialRef}
          map={circleTexture}
          size={0.15}
          sizeAttenuation
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="white"
        />
      </points>

      {/* IMPULSES (Data Packets) */}
      <points ref={impulsesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={500}
            array={simState.current.impulsePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={impulsesMaterialRef}
          map={circleTexture} // Reuse texture for packets
          size={0.08}
          sizeAttenuation
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#ffffff" // Always white hot packets
          opacity={0.3}
        />
      </points>

      {/* LINES */}
      {simState.current.connections.map(([start, end]) => (
        <line key={`${start}-${end}`} ref={(el) => { if (el) linesRef.current.set(`${start}-${end}`, el as unknown as THREE.Line) }}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array(6)} // Init empty, updated in useFrame
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial transparent opacity={0.03} blending={THREE.AdditiveBlending} depthWrite={false} />
        </line>
      ))}
    </group>
  );
}

export default OrbNeuralEffect;
export const OrbNeural = OrbNeuralEffect;
