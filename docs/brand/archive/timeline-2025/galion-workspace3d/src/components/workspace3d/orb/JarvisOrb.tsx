'use client';

/**
 * JarvisOrb.tsx - Main Jarvis-Style AI Orb Component
 * 
 * A Marvel's Jarvis/Ultron inspired AI visualization featuring:
 * - Nebula-like volumetric inner core
 * - Neon accent rings (cyan/magenta/gold)
 * - Glossy glass surface with fresnel reflections
 * - Organic breathing/floating animation
 * - Floating holographic UI fragments
 * - Internal memory/component nodes
 * - Data stream visualizations
 * 
 * This is an ALTERNATIVE to GalionOrbV3, available as a template
 * in the Workspace 3D builder.
 * 
 * Key differences from GalionOrbV3:
 * - More angular/geometric internal structure
 * - Brighter neon edge lighting
 * - UI elements floating around the orb
 * - Data visualization streams
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

// State system
import { JarvisState, JarvisStateConfig, getJarvisStateConfig, JARVIS_STATES } from './jarvisStates';

// Visual components
import { JarvisOrbCore } from './JarvisOrbCore';
import { JarvisOrbRings } from './JarvisOrbRings';
import { JarvisOrbHUD } from './JarvisOrbHUD';
import { JarvisOrbMemories } from './JarvisOrbMemories';

// ============================================================================
// TYPES
// ============================================================================

export interface JarvisOrbProps {
  /** 3D position in scene */
  position?: [number, number, number];
  /** Base size of the orb */
  size?: number;
  /** Current behavioral state */
  state?: JarvisState;
  /** Intensity multiplier (0-1) */
  intensity?: number;
  /** Audio level for speech visualization (0-1) */
  audioLevel?: number;
  /** Quality level (affects performance) */
  quality?: 'low' | 'medium' | 'high';
  /** Enable animations */
  animate?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Whether the orb is interactive */
  interactive?: boolean;
  /** Show HUD fragments */
  showHUD?: boolean;
  /** Show internal memories */
  showMemories?: boolean;
  /** Show debug helpers */
  debug?: boolean;
}

// ============================================================================
// QUALITY PRESETS
// ============================================================================

const QUALITY_SETTINGS = {
  low: {
    enableCore: true,
    enableRings: true,
    enableHUD: false,
    enableMemories: false,
    enableGlass: false,
  },
  medium: {
    enableCore: true,
    enableRings: true,
    enableHUD: true,
    enableMemories: true,
    enableGlass: true,
  },
  high: {
    enableCore: true,
    enableRings: true,
    enableHUD: true,
    enableMemories: true,
    enableGlass: true,
  },
};

// ============================================================================
// GLASS SHELL COMPONENT
// ============================================================================

function GlassShell({
  size,
  config,
}: {
  size: number;
  config: JarvisStateConfig;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && meshRef.current.material) {
      const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
      // Subtle opacity pulse
      mat.opacity = config.glass.opacity + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 64, 64]} />
      <meshPhysicalMaterial
        color="#ffffff"
        transparent
        opacity={config.glass.opacity}
        metalness={0.1}
        roughness={0.05}
        transmission={0.9}
        thickness={0.5}
        ior={1.5}
        clearcoat={1}
        clearcoatRoughness={0.1}
        envMapIntensity={config.glass.fresnelIntensity}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

// ============================================================================
// OUTER GLOW
// ============================================================================

function OuterGlow({
  size,
  color,
  intensity,
}: {
  size: number;
  color: string;
  intensity: number;
}) {
  return (
    <group>
      {/* Inner glow layer */}
      <mesh>
        <sphereGeometry args={[size * 1.05, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Outer glow layer */}
      <mesh>
        <sphereGeometry args={[size * 1.15, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.05 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Bloom sprite */}
      <sprite scale={[size * 4, size * 4, 1]}>
        <spriteMaterial
          color={color}
          transparent
          opacity={0.15 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </group>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JarvisOrb({
  position = [0, 0, 0],
  size = 2,
  state = 'idle',
  intensity = 1,
  audioLevel = 0,
  quality = 'high',
  animate = true,
  onClick,
  interactive = true,
  showHUD = true,
  showMemories = true,
  debug = false,
}: JarvisOrbProps) {
  const groupRef = useRef<THREE.Group>(null);
  const qualitySettings = QUALITY_SETTINGS[quality];
  
  // Current state config
  const config = useMemo(() => getJarvisStateConfig(state), [state]);
  
  // Animated values
  const [currentScale, setCurrentScale] = useState(config.scale.base);
  
  // Breathing animation
  useFrame((state) => {
    if (!animate || !groupRef.current) return;
    
    const t = state.clock.elapsedTime;
    
    // Organic breathing scale
    const breathe = Math.sin(t * config.scale.breathingSpeed) * 0.5 + 0.5;
    const scale = config.scale.min + breathe * (config.scale.max - config.scale.min);
    
    // Audio reactivity
    const audioScale = 1 + audioLevel * 0.05;
    
    groupRef.current.scale.setScalar(scale * audioScale * intensity);
    
    // Gentle floating motion
    groupRef.current.position.y = position[1] + Math.sin(t * 0.3) * 0.1 * size;
    
    // Very subtle rotation
    groupRef.current.rotation.y = Math.sin(t * 0.1) * 0.05;
  });
  
  // Click handling
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (interactive && onClick) {
      e.stopPropagation();
      onClick();
    }
  };
  
  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerOver={() => {
        if (interactive) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* Outer glow */}
      <OuterGlow
        size={size}
        color={config.rings.primaryColor}
        intensity={config.rings.glowIntensity * intensity}
      />
      
      {/* Neon rings */}
      {qualitySettings.enableRings && (
        <JarvisOrbRings size={size} config={config} />
      )}
      
      {/* Glass shell */}
      {qualitySettings.enableGlass && (
        <GlassShell size={size} config={config} />
      )}
      
      {/* Inner nebula core */}
      {qualitySettings.enableCore && (
        <JarvisOrbCore size={size} config={config} audioLevel={audioLevel} />
      )}
      
      {/* Internal memory nodes */}
      {qualitySettings.enableMemories && showMemories && (
        <JarvisOrbMemories size={size} config={config} />
      )}
      
      {/* Floating HUD fragments */}
      {qualitySettings.enableHUD && showHUD && (
        <JarvisOrbHUD size={size} config={config} state={state} />
      )}
      
      {/* Debug helpers */}
      {debug && (
        <>
          <axesHelper args={[size * 2]} />
          <mesh>
            <sphereGeometry args={[size, 16, 16]} />
            <meshBasicMaterial wireframe color="#ff0000" transparent opacity={0.2} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default JarvisOrb;

// Re-export state types for external use
export type { JarvisState, JarvisStateConfig };
export { JARVIS_STATES, getJarvisStateConfig };

