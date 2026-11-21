/**
 * GALION Orb V7.2 - Type Definitions
 *
 * Types for the awakening consciousness orb - boot sequence visualization.
 * Compatible with the full 50-emotion system from core/emotions.ts
 *
 * @version 7.2.1
 */

import * as THREE from 'three';

// ============================================================================
// ORB STATES
// ============================================================================

export type OrbV7State =
  | 'dormant'      // Pre-awakening, minimal activity
  | 'awakening'    // First signs of life
  | 'expanding'    // Growing consciousness
  | 'pulsing'      // Active breathing
  | 'aware'        // Fully conscious
  | 'transcending' // Peak state
  | 'idle';        // Default relaxed state

// ============================================================================
// EMOTION SYSTEM (Simplified for boot sequence)
// Extended emotions can be mapped from the full 50-emotion system
// ============================================================================

export type OrbV7Emotion =
  | 'neutral'
  | 'curious'
  | 'awakened'
  | 'cosmic'
  | 'transcendent'
  // Extended emotions for full compatibility
  | 'joy'
  | 'love'
  | 'hope'
  | 'serenity'
  | 'awe'
  | 'bliss';

export interface EmotionColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
}

export const EMOTION_PALETTES: Record<OrbV7Emotion, EmotionColorPalette> = {
  // Core boot sequence emotions
  neutral: {
    primary: '#00FF88',    // Galion green
    secondary: '#10B981',  // Emerald
    accent: '#22D3EE',     // Cyan
    glow: '#06B6D4',       // Teal
  },
  curious: {
    primary: '#8B5CF6',    // Purple
    secondary: '#C4B5FD',  // Light purple
    accent: '#A78BFA',     // Violet
    glow: '#6366F1',       // Indigo
  },
  awakened: {
    primary: '#6366F1',    // Indigo
    secondary: '#06B6D4',  // Cyan
    accent: '#8B5CF6',     // Purple
    glow: '#3B82F6',       // Blue
  },
  cosmic: {
    primary: '#6366F1',    // Indigo
    secondary: '#EC4899',  // Pink
    accent: '#F472B6',     // Light pink
    glow: '#A855F7',       // Violet
  },
  transcendent: {
    primary: '#FFFFFF',    // White
    secondary: '#F0ABFC',  // Light purple
    accent: '#E0E7FF',     // Very light indigo
    glow: '#C7D2FE',       // Lighter indigo
  },
  // Extended emotions
  joy: {
    primary: '#FFD700',    // Gold
    secondary: '#FFA500',  // Orange
    accent: '#FBBF24',     // Amber
    glow: '#F59E0B',       // Yellow-orange
  },
  love: {
    primary: '#F43F5E',    // Rose
    secondary: '#FDA4AF',  // Light pink
    accent: '#FB7185',     // Pink
    glow: '#EC4899',       // Magenta
  },
  hope: {
    primary: '#10B981',    // Emerald
    secondary: '#34D399',  // Light green
    accent: '#6EE7B7',     // Mint
    glow: '#22C55E',       // Green
  },
  serenity: {
    primary: '#22D3EE',    // Cyan
    secondary: '#A5F3FC',  // Light cyan
    accent: '#67E8F9',     // Sky cyan
    glow: '#06B6D4',       // Teal
  },
  awe: {
    primary: '#818CF8',    // Light indigo
    secondary: '#C7D2FE',  // Very light indigo
    accent: '#A5B4FC',     // Periwinkle
    glow: '#6366F1',       // Indigo
  },
  bliss: {
    primary: '#FDE68A',    // Light yellow
    secondary: '#FFFBEB',  // Cream
    accent: '#FEF3C7',     // Pale yellow
    glow: '#FBBF24',       // Amber
  },
};

// ============================================================================
// AUDIO DATA
// ============================================================================

export interface AudioData {
  level: number;       // 0-1 normalized audio level
  bass: number;        // Low frequency intensity
  mid: number;         // Mid frequency intensity
  treble: number;      // High frequency intensity
  isSpeaking: boolean; // Voice activity detection
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface GalionOrbV7Props {
  /** Current awakening state */
  state?: OrbV7State;
  /** Current emotion */
  emotion?: OrbV7Emotion;
  /** Awakening progress (0-1) */
  progress?: number;
  /** Enable audio reactivity */
  audioEnabled?: boolean;
  /** External audio level (0-1) */
  audioLevel?: number;
  /** Called when orb becomes aware */
  onAwakened?: () => void;
  /** Called on touch/click */
  onInteract?: () => void;
  /** Base size multiplier */
  size?: number;
  /** Custom class name */
  className?: string;
  /** Debug mode */
  debug?: boolean;
}

export interface OrbSceneRefs {
  stateRef: React.MutableRefObject<OrbV7State>;
  emotionRef: React.MutableRefObject<OrbV7Emotion>;
  progressRef: React.MutableRefObject<number>;
  audioRef: React.MutableRefObject<AudioData>;
}

// ============================================================================
// SHADER UNIFORMS
// ============================================================================

export interface PlasmaUniforms {
  uTime: { value: number };
  uColorPrimary: { value: THREE.Color };
  uColorSecondary: { value: THREE.Color };
  uColorAccent: { value: THREE.Color };
  uEnergy: { value: number };
  uPulsePhase: { value: number };
  uDisplacement: { value: number };
  uProgress: { value: number };
}

export interface GlassUniforms {
  uTime: { value: number };
  uFresnelPower: { value: number };
  uIridescence: { value: number };
  uOpacity: { value: number };
  uGlowColor: { value: THREE.Color };
}

export interface ParticleUniforms {
  uTime: { value: number };
  uSize: { value: number };
  uColor: { value: THREE.Color };
  uOpacity: { value: number };
  uAudioLevel: { value: number };
}

export interface RingUniforms {
  uTime: { value: number };
  uColor: { value: THREE.Color };
  uOpacity: { value: number };
  uRotationSpeed: { value: number };
}

// ============================================================================
// UTILITY
// ============================================================================

export function getEmotionPalette(emotion: OrbV7Emotion): EmotionColorPalette {
  return EMOTION_PALETTES[emotion] || EMOTION_PALETTES.neutral;
}

export function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return new THREE.Color().lerpColors(a, b, t);
}
