/**
 * GALION Orb V6 - Configuration
 *
 * Emotion colors, state configs, and quality presets.
 * Based on Galion brand identity: Cyan (#06b6d4), Purple (#a855f7), Blue (#3b82f6)
 */

import {
  OrbEmotion,
  OrbState,
  EmotionConfig,
  StateConfig,
  QualityConfig,
  QualityLevel,
  OrbColors,
} from './types';

// =============================================================================
// EMOTION CONFIGURATIONS
// =============================================================================

export const EMOTION_CONFIGS: Record<OrbEmotion, EmotionConfig> = {
  neutral: {
    id: 'neutral',
    name: 'Neutral',
    colors: {
      primary: '#06b6d4',   // Galion Cyan
      secondary: '#0891b2',
      glow: '#22d3ee',
      core: '#67e8f9',
      particles: '#a5f3fc',
    },
    energy: 0.5,
    particleSpeed: 0.3,
    particleCount: 100,
    glowIntensity: 0.6,
    pulseRate: 4,
  },

  happy: {
    id: 'happy',
    name: 'Happy',
    colors: {
      primary: '#fbbf24',   // Amber
      secondary: '#f59e0b',
      glow: '#fcd34d',
      core: '#fef08a',
      particles: '#fef9c3',
    },
    energy: 0.8,
    particleSpeed: 0.5,
    particleCount: 150,
    glowIntensity: 0.8,
    pulseRate: 3,
  },

  sad: {
    id: 'sad',
    name: 'Sad',
    colors: {
      primary: '#3b82f6',   // Blue
      secondary: '#1e40af',
      glow: '#60a5fa',
      core: '#93c5fd',
      particles: '#bfdbfe',
    },
    energy: 0.3,
    particleSpeed: 0.15,
    particleCount: 60,
    glowIntensity: 0.4,
    pulseRate: 6,
  },

  calm: {
    id: 'calm',
    name: 'Calm',
    colors: {
      primary: '#10b981',   // Emerald
      secondary: '#059669',
      glow: '#34d399',
      core: '#6ee7b7',
      particles: '#a7f3d0',
    },
    energy: 0.4,
    particleSpeed: 0.2,
    particleCount: 80,
    glowIntensity: 0.5,
    pulseRate: 5,
  },

  excited: {
    id: 'excited',
    name: 'Excited',
    colors: {
      primary: '#f97316',   // Orange
      secondary: '#ea580c',
      glow: '#fb923c',
      core: '#fdba74',
      particles: '#fed7aa',
    },
    energy: 0.95,
    particleSpeed: 0.7,
    particleCount: 180,
    glowIntensity: 0.9,
    pulseRate: 2,
  },

  curious: {
    id: 'curious',
    name: 'Curious',
    colors: {
      primary: '#14b8a6',   // Teal
      secondary: '#0d9488',
      glow: '#2dd4bf',
      core: '#5eead4',
      particles: '#99f6e4',
    },
    energy: 0.65,
    particleSpeed: 0.4,
    particleCount: 120,
    glowIntensity: 0.7,
    pulseRate: 3.5,
  },

  focused: {
    id: 'focused',
    name: 'Focused',
    colors: {
      primary: '#8b5cf6',   // Violet
      secondary: '#7c3aed',
      glow: '#a78bfa',
      core: '#c4b5fd',
      particles: '#ddd6fe',
    },
    energy: 0.7,
    particleSpeed: 0.35,
    particleCount: 110,
    glowIntensity: 0.75,
    pulseRate: 3,
  },

  peaceful: {
    id: 'peaceful',
    name: 'Peaceful',
    colors: {
      primary: '#0ea5e9',   // Sky
      secondary: '#0284c7',
      glow: '#38bdf8',
      core: '#7dd3fc',
      particles: '#bae6fd',
    },
    energy: 0.35,
    particleSpeed: 0.15,
    particleCount: 70,
    glowIntensity: 0.5,
    pulseRate: 6,
  },

  love: {
    id: 'love',
    name: 'Love',
    colors: {
      primary: '#ec4899',   // Pink
      secondary: '#db2777',
      glow: '#f472b6',
      core: '#f9a8d4',
      particles: '#fbcfe8',
    },
    energy: 0.75,
    particleSpeed: 0.4,
    particleCount: 140,
    glowIntensity: 0.8,
    pulseRate: 3.5,
  },

  wonder: {
    id: 'wonder',
    name: 'Wonder',
    colors: {
      primary: '#a855f7',   // Purple (Galion)
      secondary: '#9333ea',
      glow: '#c084fc',
      core: '#d8b4fe',
      particles: '#e9d5ff',
    },
    energy: 0.85,
    particleSpeed: 0.45,
    particleCount: 160,
    glowIntensity: 0.85,
    pulseRate: 3,
  },

  determined: {
    id: 'determined',
    name: 'Determined',
    colors: {
      primary: '#dc2626',   // Red
      secondary: '#b91c1c',
      glow: '#ef4444',
      core: '#f87171',
      particles: '#fca5a5',
    },
    energy: 0.9,
    particleSpeed: 0.55,
    particleCount: 150,
    glowIntensity: 0.85,
    pulseRate: 2.5,
  },

  empathetic: {
    id: 'empathetic',
    name: 'Empathetic',
    colors: {
      primary: '#f472b6',   // Pink light
      secondary: '#ec4899',
      glow: '#f9a8d4',
      core: '#fbcfe8',
      particles: '#fce7f3',
    },
    energy: 0.6,
    particleSpeed: 0.3,
    particleCount: 100,
    glowIntensity: 0.65,
    pulseRate: 4,
  },

  inspired: {
    id: 'inspired',
    name: 'Inspired',
    colors: {
      primary: '#fbbf24',   // Gold-purple blend
      secondary: '#a855f7',
      glow: '#f59e0b',
      core: '#fde047',
      particles: '#fef08a',
    },
    energy: 0.9,
    particleSpeed: 0.55,
    particleCount: 170,
    glowIntensity: 0.9,
    pulseRate: 2.5,
  },

  transcendent: {
    id: 'transcendent',
    name: 'Transcendent',
    colors: {
      primary: '#ffffff',
      secondary: '#a855f7',
      glow: '#f5f3ff',
      core: '#ffffff',
      particles: '#faf5ff',
    },
    energy: 1.0,
    particleSpeed: 0.4,
    particleCount: 200,
    glowIntensity: 1.0,
    pulseRate: 4,
  },
};

// =============================================================================
// STATE CONFIGURATIONS
// =============================================================================

export const STATE_CONFIGS: Record<OrbState, StateConfig> = {
  idle: {
    id: 'idle',
    scaleMultiplier: 1.0,
    pulseIntensity: 0.02,
    rotationSpeed: 0.02,
    particleActivity: 0.5,
  },

  listening: {
    id: 'listening',
    scaleMultiplier: 1.02,
    pulseIntensity: 0.03,
    rotationSpeed: 0.03,
    particleActivity: 0.7,
  },

  speaking: {
    id: 'speaking',
    scaleMultiplier: 1.03,
    pulseIntensity: 0.05,
    rotationSpeed: 0.04,
    particleActivity: 0.9,
  },

  thinking: {
    id: 'thinking',
    scaleMultiplier: 1.0,
    pulseIntensity: 0.015,
    rotationSpeed: 0.05,
    particleActivity: 0.6,
  },

  processing: {
    id: 'processing',
    scaleMultiplier: 1.01,
    pulseIntensity: 0.025,
    rotationSpeed: 0.06,
    particleActivity: 0.8,
  },
};

// =============================================================================
// QUALITY PRESETS
// =============================================================================

export const QUALITY_CONFIGS: Record<QualityLevel, QualityConfig> = {
  low: {
    particleCount: 50,
    neuralNodes: 30,
    neuralConnections: 3,
    starCount: 200,
    enableAurora: false,
    enableEnergy: false,
    enableNeural: true,
    enableParticles: true,
    enableStars: true,
  },

  medium: {
    particleCount: 100,
    neuralNodes: 60,
    neuralConnections: 4,
    starCount: 500,
    enableAurora: true,
    enableEnergy: true,
    enableNeural: true,
    enableParticles: true,
    enableStars: true,
  },

  high: {
    particleCount: 200,
    neuralNodes: 100,
    neuralConnections: 5,
    starCount: 1000,
    enableAurora: true,
    enableEnergy: true,
    enableNeural: true,
    enableParticles: true,
    enableStars: true,
  },

  ultra: {
    particleCount: 300,
    neuralNodes: 150,
    neuralConnections: 6,
    starCount: 2000,
    enableAurora: true,
    enableEnergy: true,
    enableNeural: true,
    enableParticles: true,
    enableStars: true,
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getEmotionConfig(emotion: OrbEmotion): EmotionConfig {
  return EMOTION_CONFIGS[emotion] || EMOTION_CONFIGS.neutral;
}

export function getStateConfig(state: OrbState): StateConfig {
  return STATE_CONFIGS[state] || STATE_CONFIGS.idle;
}

export function getQualityConfig(quality: QualityLevel): QualityConfig {
  return QUALITY_CONFIGS[quality] || QUALITY_CONFIGS.medium;
}

export function getColors(emotion: OrbEmotion): OrbColors {
  return getEmotionConfig(emotion).colors;
}
