/**
 * GALION Orb V5.2 - Emotion Type Definitions
 * 
 * 50 emotions across 4 tiers with blending support
 */

import * as THREE from 'three';

// ============================================================================
// EMOTION TIERS
// ============================================================================

/** Tier 1: Primary Emotions (10) - Foundational emotional building blocks */
export type PrimaryEmotion = 
  | 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful'
  | 'surprised' | 'disgusted' | 'contempt' | 'trust' | 'anticipation';

/** Tier 2: Secondary Emotions (15) - Combinations of primary emotions */
export type SecondaryEmotion = 
  | 'love' | 'submission' | 'awe' | 'disapproval' | 'remorse'
  | 'contempt_hot' | 'aggressiveness' | 'optimism' | 'anxiety' | 'envy'
  | 'guilt' | 'pride' | 'hope' | 'despair' | 'shame';

/** Tier 3: Complex Emotions (13) - Nuanced emotional states */
export type ComplexEmotion = 
  | 'nostalgia' | 'melancholy' | 'determination' | 'admiration'
  | 'embarrassment' | 'frustration' | 'loneliness' | 'contentment'
  | 'inspiration' | 'vulnerability' | 'empowerment' | 'ambivalence' | 'curiosity';

/** Tier 4: Transcendent Emotions (12) - Spiritual/elevated states */
export type TranscendentEmotion = 
  | 'enlightenment' | 'unity' | 'bliss' | 'cosmic_wonder'
  | 'infinite_peace' | 'divine_love' | 'transcendence' | 'pure_awareness'
  | 'sacred_awe' | 'eternal_now' | 'universal_compassion' | 'sublime_joy';

/** All 50 emotions combined */
export type Emotion = PrimaryEmotion | SecondaryEmotion | ComplexEmotion | TranscendentEmotion;

export type EmotionTier = 'primary' | 'secondary' | 'complex' | 'transcendent';

// ============================================================================
// EMOTION COLORS
// ============================================================================

export interface EmotionColors {
  /** Core color (center of nebula) */
  primary: string;
  /** Secondary color (outer regions) */
  secondary: string;
  /** Accent color (highlights, particles) */
  accent: string;
  /** Glow color */
  glow: string;
}

// ============================================================================
// NEBULA CONFIGURATION
// ============================================================================

export interface EmotionNebulaConfig {
  /** Cloud density (0-1) */
  density: number;
  /** Turbulence amount (0-1) */
  turbulence: number;
  /** Inner glow intensity (0-1) */
  glow: number;
  /** Movement speed multiplier */
  speed: number;
  /** Scale of noise patterns */
  noiseScale: number;
  /** Number of cloud layers */
  layers: number;
}

// ============================================================================
// PARTICLE CONFIGURATION
// ============================================================================

export interface EmotionParticleConfig {
  /** Particle color (hex) */
  color: string;
  /** Movement speed (0-1) */
  speed: number;
  /** Particle count */
  count: number;
  /** Particle size range */
  size: [number, number];
  /** Particle opacity (0-1) */
  opacity: number;
  /** Movement pattern */
  pattern: 'random' | 'orbital' | 'rising' | 'falling' | 'spiral' | 'burst' | 'flow';
  /** Sparkle/twinkle effect */
  sparkle: boolean;
}

// ============================================================================
// EMOTION CONFIGURATION
// ============================================================================

export interface EmotionConfig {
  /** Emotion identifier */
  id: Emotion;
  /** Display name */
  name: string;
  /** Emotion tier */
  tier: EmotionTier;
  /** Color palette */
  colors: EmotionColors;
  /** Energy level (0-1) - affects animation intensity */
  energy: number;
  /** Nebula cloud settings */
  nebula: EmotionNebulaConfig;
  /** Particle settings */
  particles: EmotionParticleConfig;
  /** Description of the emotion */
  description?: string;
  /** Blend sources for secondary/complex emotions */
  blendFrom?: [Emotion, Emotion];
  /** Sound characteristics */
  sound?: {
    frequency: number;
    waveform: 'sine' | 'triangle' | 'square' | 'sawtooth';
    harmony: number[];
  };
}

// ============================================================================
// EMOTION BLENDING
// ============================================================================

export interface EmotionBlendState {
  /** Primary emotion */
  primary: Emotion;
  /** Primary emotion intensity (0-1) */
  primaryIntensity: number;
  /** Secondary emotions with their intensities */
  secondary: Array<{
    emotion: Emotion;
    intensity: number;
  }>;
}

export interface BlendedEmotionResult {
  /** Blended color palette */
  colors: EmotionColors;
  /** Combined energy level */
  energy: number;
  /** Blended nebula config */
  nebula: EmotionNebulaConfig;
  /** Blended particle config */
  particles: EmotionParticleConfig;
}

// ============================================================================
// EMOTION HOOKS RETURN TYPES
// ============================================================================

export interface UseOrbEmotionReturn {
  /** Current primary emotion */
  emotion: Emotion;
  /** Current emotion configuration */
  emotionConfig: EmotionConfig;
  /** Set primary emotion */
  setEmotion: (emotion: Emotion, intensity?: number) => void;
  /** Add secondary emotion overlay */
  addEmotionOverlay: (emotion: Emotion, intensity: number) => void;
  /** Remove emotion overlay */
  removeEmotionOverlay: (emotion: Emotion) => void;
  /** Clear all overlays */
  clearOverlays: () => void;
  /** Current blend state */
  blendState: EmotionBlendState;
  /** Get blended result for rendering */
  getBlendedResult: () => BlendedEmotionResult;
  /** Whether currently transitioning emotions */
  isTransitioning: boolean;
}

// ============================================================================
// EMOTION TRANSITION
// ============================================================================

export interface EmotionTransitionConfig {
  /** Transition duration in ms */
  duration: number;
  /** Easing function */
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring';
  /** Color morph style */
  colorMorph: 'blend' | 'crossfade' | 'burst';
  /** Whether to show transition particles */
  showParticles: boolean;
}
