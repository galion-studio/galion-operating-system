/**
 * orbV3Emotions.ts - Emotion Color Palettes and Mappings
 * 
 * Defines 11 emotion overlays for the Galion V3 Orb per the V3 guide Part 4.2:
 * Each emotion affects:
 * - Color palette (primary, secondary, accent, glow)
 * - Glow intensity
 * - Gradient speed
 * - Particle behavior
 * 
 * Emotion changes happen over 200-400ms with smooth easing
 */

import * as THREE from 'three';

// ============================================================================
// TYPES
// ============================================================================

export type OrbEmotion = 
  | 'neutral'
  | 'calm'
  | 'warm'
  | 'focused'
  | 'alert'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'excited'
  | 'thinking'
  | 'curious';

export interface EmotionPalette {
  /** Display name */
  label: string;
  
  /** Primary color (dominant) */
  primary: string;
  
  /** Secondary color (supporting) */
  secondary: string;
  
  /** Accent color (highlights) */
  accent: string;
  
  /** Glow color */
  glow: string;
  
  /** Secondary glow color */
  glowSecondary: string;
  
  /** Core singularity color */
  core: string;
  
  /** Neural network synapse color */
  synapse: string;
  
  /** Energy stream color */
  stream: string;
  
  /** Nebula cloud colors [inner, outer] */
  nebula: [string, string];
  
  /** Star field tint */
  stars: string;
}

export interface EmotionConfig extends EmotionPalette {
  /** Animation speed multiplier (relative to neutral) */
  speedMultiplier: number;
  
  /** Glow intensity override (0-1) */
  glowIntensity: number;
  
  /** Particle density multiplier */
  particleDensity: number;
  
  /** Neural activity boost (added to state's neural.activity) */
  neuralBoost: number;
  
  /** How "warm" the emotion feels (affects color temperature) */
  warmth: number; // -1 (cold) to 1 (warm)
  
  /** Energy level (affects animation speeds) */
  energy: number; // 0 (calm) to 1 (energetic)
}

// ============================================================================
// COLOR PALETTES (per V3 Guide)
// ============================================================================

export const EMOTION_PALETTES: Record<OrbEmotion, EmotionConfig> = {
  /**
   * NEUTRAL - Default balanced state
   * Purple to teal gradient - balanced, professional
   */
  neutral: {
    label: 'Neutral',
    primary: '#1e3a8a',      // Deep blue
    secondary: '#0891b2',    // Teal
    accent: '#134e4a',       // Dark teal
    glow: 'rgba(99, 102, 241, 0.25)',
    glowSecondary: 'rgba(6, 182, 212, 0.15)',
    core: '#ffffff',
    synapse: '#06b6d4',
    stream: '#0891b2',
    nebula: ['#1e3a8a', '#0f172a'],
    stars: '#e0f2fe',
    speedMultiplier: 1.0,
    glowIntensity: 0.5,
    particleDensity: 1.0,
    neuralBoost: 0,
    warmth: 0,
    energy: 0.5,
  },

  /**
   * CALM - Cool blues, slow motion, dim glow
   * Peaceful, serene, meditative
   */
  calm: {
    label: 'Calm',
    primary: '#1e40af',      // Blue
    secondary: '#0ea5e9',    // Sky blue
    accent: '#0c4a6e',       // Dark sky
    glow: 'rgba(30, 64, 175, 0.2)',
    glowSecondary: 'rgba(14, 165, 233, 0.1)',
    core: '#e0f2fe',
    synapse: '#38bdf8',
    stream: '#0284c7',
    nebula: ['#1e3a8a', '#0f172a'],
    stars: '#bae6fd',
    speedMultiplier: 0.6,
    glowIntensity: 0.35,
    particleDensity: 0.7,
    neuralBoost: -0.1,
    warmth: -0.3,
    energy: 0.2,
  },

  /**
   * WARM - Soft pinks, supportive feeling
   * Empathetic, caring, understanding
   */
  warm: {
    label: 'Warm',
    primary: '#7c3aed',      // Violet
    secondary: '#ec4899',    // Pink
    accent: '#f472b6',       // Light pink
    glow: 'rgba(236, 72, 153, 0.25)',
    glowSecondary: 'rgba(251, 191, 36, 0.15)',
    core: '#fef3c7',
    synapse: '#f472b6',
    stream: '#ec4899',
    nebula: ['#7c3aed', '#581c87'],
    stars: '#fce7f3',
    speedMultiplier: 0.9,
    glowIntensity: 0.6,
    particleDensity: 1.0,
    neuralBoost: 0.1,
    warmth: 0.7,
    energy: 0.5,
  },

  /**
   * FOCUSED - Sharp teals, higher intensity
   * Concentrated, precise, analytical
   */
  focused: {
    label: 'Focused',
    primary: '#0e7490',      // Cyan-700
    secondary: '#06b6d4',    // Cyan-500
    accent: '#14b8a6',       // Teal
    glow: 'rgba(6, 182, 212, 0.35)',
    glowSecondary: 'rgba(20, 184, 166, 0.2)',
    core: '#ecfeff',
    synapse: '#22d3ee',
    stream: '#06b6d4',
    nebula: ['#0e7490', '#164e63'],
    stars: '#cffafe',
    speedMultiplier: 1.1,
    glowIntensity: 0.7,
    particleDensity: 1.2,
    neuralBoost: 0.2,
    warmth: -0.1,
    energy: 0.7,
  },

  /**
   * ALERT - Bright oranges, faster pulse
   * Warning, attention, important
   */
  alert: {
    label: 'Alert',
    primary: '#dc2626',      // Red-600
    secondary: '#f97316',    // Orange
    accent: '#fbbf24',       // Amber
    glow: 'rgba(239, 68, 68, 0.4)',
    glowSecondary: 'rgba(249, 115, 22, 0.25)',
    core: '#fef9c3',
    synapse: '#fb923c',
    stream: '#f97316',
    nebula: ['#dc2626', '#7f1d1d'],
    stars: '#fef3c7',
    speedMultiplier: 1.4,
    glowIntensity: 0.85,
    particleDensity: 1.4,
    neuralBoost: 0.3,
    warmth: 0.8,
    energy: 0.9,
  },

  /**
   * HAPPY - Gold to green, energetic
   * Joyful, positive, optimistic
   */
  happy: {
    label: 'Happy',
    primary: '#059669',      // Emerald
    secondary: '#10b981',    // Green
    accent: '#f59e0b',       // Amber
    glow: 'rgba(16, 185, 129, 0.3)',
    glowSecondary: 'rgba(245, 158, 11, 0.2)',
    core: '#fef3c7',
    synapse: '#34d399',
    stream: '#10b981',
    nebula: ['#059669', '#064e3b'],
    stars: '#d1fae5',
    speedMultiplier: 1.2,
    glowIntensity: 0.75,
    particleDensity: 1.3,
    neuralBoost: 0.15,
    warmth: 0.4,
    energy: 0.8,
  },

  /**
   * SAD - Deep navy, slower, dimmer
   * Melancholic, empathetic sadness
   */
  sad: {
    label: 'Sad',
    primary: '#1e3a8a',      // Blue-800
    secondary: '#3730a3',    // Indigo-700
    accent: '#4338ca',       // Indigo-600
    glow: 'rgba(30, 58, 138, 0.2)',
    glowSecondary: 'rgba(67, 56, 202, 0.1)',
    core: '#c7d2fe',
    synapse: '#6366f1',
    stream: '#4338ca',
    nebula: ['#1e3a8a', '#0f172a'],
    stars: '#c7d2fe',
    speedMultiplier: 0.5,
    glowIntensity: 0.3,
    particleDensity: 0.6,
    neuralBoost: -0.15,
    warmth: -0.4,
    energy: 0.2,
  },

  /**
   * ANGRY - Crimson reds, intense
   * Strong emotion, powerful
   */
  angry: {
    label: 'Angry',
    primary: '#b91c1c',      // Red-700
    secondary: '#dc2626',    // Red-600
    accent: '#ef4444',       // Red-500
    glow: 'rgba(185, 28, 28, 0.45)',
    glowSecondary: 'rgba(239, 68, 68, 0.3)',
    core: '#fca5a5',
    synapse: '#f87171',
    stream: '#dc2626',
    nebula: ['#b91c1c', '#450a0a'],
    stars: '#fecaca',
    speedMultiplier: 1.5,
    glowIntensity: 0.9,
    particleDensity: 1.5,
    neuralBoost: 0.35,
    warmth: 0.9,
    energy: 1.0,
  },

  /**
   * EXCITED - Pink to cyan, high energy
   * Enthusiastic, eager, vibrant
   */
  excited: {
    label: 'Excited',
    primary: '#be185d',      // Pink-700
    secondary: '#ec4899',    // Pink-500
    accent: '#06b6d4',       // Cyan
    glow: 'rgba(236, 72, 153, 0.35)',
    glowSecondary: 'rgba(6, 182, 212, 0.2)',
    core: '#fef3c7',
    synapse: '#f472b6',
    stream: '#ec4899',
    nebula: ['#be185d', '#831843'],
    stars: '#fce7f3',
    speedMultiplier: 1.4,
    glowIntensity: 0.85,
    particleDensity: 1.5,
    neuralBoost: 0.25,
    warmth: 0.5,
    energy: 0.95,
  },

  /**
   * THINKING - Purple swirl, contemplative
   * Processing, analyzing, considering
   */
  thinking: {
    label: 'Thinking',
    primary: '#7c3aed',      // Violet-600
    secondary: '#8b5cf6',    // Violet-500
    accent: '#0891b2',       // Cyan-600
    glow: 'rgba(139, 92, 246, 0.3)',
    glowSecondary: 'rgba(8, 145, 178, 0.15)',
    core: '#ede9fe',
    synapse: '#a78bfa',
    stream: '#8b5cf6',
    nebula: ['#7c3aed', '#4c1d95'],
    stars: '#ddd6fe',
    speedMultiplier: 1.0,
    glowIntensity: 0.6,
    particleDensity: 1.1,
    neuralBoost: 0.4, // Extra neural activity for thinking
    warmth: 0.1,
    energy: 0.6,
  },

  /**
   * CURIOUS - Bright cyan accent
   * Inquisitive, interested, exploring
   */
  curious: {
    label: 'Curious',
    primary: '#0891b2',      // Cyan-600
    secondary: '#06b6d4',    // Cyan-500
    accent: '#22d3ee',       // Cyan-400
    glow: 'rgba(6, 182, 212, 0.35)',
    glowSecondary: 'rgba(34, 211, 238, 0.2)',
    core: '#ecfeff',
    synapse: '#67e8f9',
    stream: '#22d3ee',
    nebula: ['#0891b2', '#164e63'],
    stars: '#cffafe',
    speedMultiplier: 1.15,
    glowIntensity: 0.7,
    particleDensity: 1.2,
    neuralBoost: 0.2,
    warmth: 0,
    energy: 0.75,
  },
};

// ============================================================================
// TRANSITION TIMINGS
// ============================================================================

export const EMOTION_TRANSITION = {
  /** Standard transition duration in ms */
  duration: 300,
  /** Min transition time */
  minDuration: 200,
  /** Max transition time */
  maxDuration: 400,
  /** Easing function */
  easing: 'ease-in-out',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get emotion configuration by name
 */
export function getEmotionConfig(emotion: OrbEmotion): EmotionConfig {
  return EMOTION_PALETTES[emotion];
}

/**
 * Convert hex color to THREE.Color
 */
export function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

/**
 * Get gradient colors for emotion as THREE.Color array
 */
export function getEmotionGradient(emotion: OrbEmotion): THREE.Color[] {
  const config = EMOTION_PALETTES[emotion];
  return [
    new THREE.Color(config.primary),
    new THREE.Color(config.secondary),
    new THREE.Color(config.accent),
  ];
}

/**
 * Interpolate between two emotion configs
 */
export function interpolateEmotions(
  from: EmotionConfig,
  to: EmotionConfig,
  progress: number // 0-1
): Partial<EmotionConfig> {
  const lerp = (a: number, b: number) => a + (b - a) * progress;
  const lerpColor = (a: string, b: string) => {
    const colorA = new THREE.Color(a);
    const colorB = new THREE.Color(b);
    colorA.lerp(colorB, progress);
    return `#${colorA.getHexString()}`;
  };
  
  return {
    primary: lerpColor(from.primary, to.primary),
    secondary: lerpColor(from.secondary, to.secondary),
    accent: lerpColor(from.accent, to.accent),
    core: lerpColor(from.core, to.core),
    synapse: lerpColor(from.synapse, to.synapse),
    stream: lerpColor(from.stream, to.stream),
    speedMultiplier: lerp(from.speedMultiplier, to.speedMultiplier),
    glowIntensity: lerp(from.glowIntensity, to.glowIntensity),
    particleDensity: lerp(from.particleDensity, to.particleDensity),
    neuralBoost: lerp(from.neuralBoost, to.neuralBoost),
    warmth: lerp(from.warmth, to.warmth),
    energy: lerp(from.energy, to.energy),
  };
}

/**
 * Get CSS gradient string for emotion
 */
export function getEmotionCSSGradient(emotion: OrbEmotion): string {
  const config = EMOTION_PALETTES[emotion];
  return `
    radial-gradient(circle at 30% 25%, ${config.primary} 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, ${config.secondary} 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, ${config.secondary} 0%, ${config.accent} 60%, ${config.accent} 100%)
  `;
}

/**
 * Get array of all emotion names
 */
export function getAllEmotions(): OrbEmotion[] {
  return Object.keys(EMOTION_PALETTES) as OrbEmotion[];
}

/**
 * Get random emotion (for demo purposes)
 */
export function getRandomEmotion(): OrbEmotion {
  const emotions = getAllEmotions();
  return emotions[Math.floor(Math.random() * emotions.length)];
}

export default EMOTION_PALETTES;

