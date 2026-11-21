/**
 * GALION Orb V5.2 - Energy Streams Effect Component
 *
 * UPGRADED: Plasma Ribbons using dynamic Lines + Noise.
 * Simulates high-energy plasma containment field.
 */

"use client";

import { useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { getEmotionConfig } from "../config/emotions";
import { getStateConfig } from "../config/states";
import { Emotion, OrbState } from "../types";

// ============================================================================
// HELPER: Simple 3D Noise
// ============================================================================
function noise(x: number, y: number, z: number) {
  return Math.sin(x) * Math.cos(y) * Math.sin(z) +
    Math.sin(x * 2 + y) * 0.5 +
    Math.cos(z * 1.5) * 0.5;
}

export interface OrbEnergyProps {
  state: OrbState;
  emotion: Emotion;
  stateRef?: React.MutableRefObject<OrbState>;
  emotionRef?: React.MutableRefObject<Emotion>;
  radius?: number;
  streamCount?: number;
  pointsPerStream?: number;
  audioRef?: React.MutableRefObject<any>;
}

export function OrbEnergy({
  state,
  emotion,
  stateRef,
  emotionRef,
  radius = 1.3,
  streamCount = 8,
  pointsPerStream = 60,
  audioRef,
}: OrbEnergyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.Line[]>([]);

  // Create Stream Geometries
  const streams = useMemo(() => {
    return Array.from({ length: streamCount }).map((_, i) => {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(pointsPerStream * 3);

      // Initial circle
      for (let j = 0; j < pointsPerStream; j++) {
        const angle = (j / pointsPerStream) * Math.PI * 2;
        positions[j * 3] = Math.cos(angle) * radius;
        positions[j * 3 + 1] = Math.sin(angle) * radius; // Tilted circle
        positions[j * 3 + 2] = 0;
      }

      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // Random rotation axis for this stream
      const axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
      const speed = 0.2 + Math.random() * 0.5;

      return { geo, axis, speed, offset: Math.random() * 100 };
    });
  }, [streamCount, pointsPerStream, radius]);

  useFrame((frameState, delta) => {
    if (!groupRef.current) return;

    const time = frameState.clock.elapsedTime;
    const audioLevel = audioRef?.current?.analysis?.level || 0;

    const currentEmotion = emotionRef?.current || emotion;
    const emotionConfig = getEmotionConfig(currentEmotion);

    // Color
    const col = new THREE.Color(emotionConfig.colors.accent);
    if (audioLevel > 0.2) col.lerp(new THREE.Color(1, 1, 1), audioLevel * 0.5);

    linesRef.current.forEach((line, i) => {
      if (!line) return;
      const stream = streams[i];
      const positions = line.geometry.attributes.position.array as Float32Array;

      // Material update
      (line.material as THREE.LineBasicMaterial).color.lerp(col, delta * 3);
      (line.material as THREE.LineBasicMaterial).opacity = 0.3 + (audioLevel * 0.5);
      (line.material as THREE.LineBasicMaterial).linewidth = 2;

      // Rotate base axis
      // Actually, we reconstruct the loop every frame with noise

      const speed = stream.speed * (1 + audioLevel * 2);
      const t = time * speed + stream.offset;

      for (let j = 0; j < pointsPerStream; j++) {
        // Base Circle Parameter
        const angle = (j / pointsPerStream) * Math.PI * 2 + t * 0.5;

        // Base shape (Atomic orbit style)
        // We use the 'axis' to define the plane of this ring
        // Or simpler: define ring in XY then rotate it

        // Dynamic Radius (Pulse)
        const r = radius * (1.0 + noise(angle, t, i) * 0.2);

        // Perturbation
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        const pz = noise(angle * 3, t * 2, i) * 0.3 * (1 + audioLevel); // Whiggle z

        const v = new THREE.Vector3(px, py, pz);
        v.applyAxisAngle(stream.axis, t * 0.2); // Slowly rotate the whole ring plane

        positions[j * 3] = v.x;
        positions[j * 3 + 1] = v.y;
        positions[j * 3 + 2] = v.z;
      }

      line.geometry.attributes.position.needsUpdate = true;
    });

    // Rotate entire group slowly
    groupRef.current.rotation.y += delta * 0.1;
  });

  return (
    <group ref={groupRef}>
      {streams.map((s, i) => (
        <line key={i} ref={(el) => { if (el) linesRef.current[i] = el as THREE.Line }}>
          <bufferGeometry attach="geometry" {...s.geo} />
          <lineBasicMaterial attach="material" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} linewidth={2} />
        </line>
      ))}
    </group>
  );
}

export default OrbEnergy;
