/**
 * GALION Orb V5.2 - Emotion Configurations
 * 
 * 50 emotions across 4 tiers with visual and particle configurations
 */

import { Emotion, EmotionConfig, EmotionTier, EmotionTransitionConfig } from '../types';

// ============================================================================
// TIER 1: PRIMARY EMOTIONS (10)
// ============================================================================

const primaryEmotions: Record<PrimaryEmotionKey, EmotionConfig> = {
  neutral: {
    id: 'neutral',
    name: 'Neutral',
    tier: 'primary',
    description: 'Balanced, professional state',
    colors: {
      primary: '#22d3ee',   // Cyan
      secondary: '#0ea5e9', // Sky blue
      accent: '#67e8f9',    // Light cyan
      glow: '#06b6d4',      // Cyan-500
    },
    energy: 0.5,
    nebula: {
      density: 0.5,
      turbulence: 0.2,
      glow: 0.4,
      speed: 0.3,
      noiseScale: 1.0,
      layers: 3,
    },
    particles: {
      color: '#67e8f9',
      speed: 0.1,
      count: 100,
      size: [0.02, 0.05],
      opacity: 0.6,
      pattern: 'orbital',
      sparkle: false,
    },
  },

  happy: {
    id: 'happy',
    name: 'Happy',
    tier: 'primary',
    description: 'Joy, positivity, delight',
    colors: {
      primary: '#fbbf24',   // Amber-400
      secondary: '#f59e0b', // Amber-500
      accent: '#fef08a',    // Yellow-200
      glow: '#fcd34d',      // Amber-300
    },
    energy: 0.8,
    nebula: {
      density: 0.6,
      turbulence: 0.4,
      glow: 0.7,
      speed: 0.5,
      noiseScale: 0.8,
      layers: 4,
    },
    particles: {
      color: '#fef08a',
      speed: 0.4,
      count: 150,
      size: [0.02, 0.06],
      opacity: 0.8,
      pattern: 'rising',
      sparkle: true,
    },
  },

  sad: {
    id: 'sad',
    name: 'Sad',
    tier: 'primary',
    description: 'Sorrow, melancholy, heaviness',
    colors: {
      primary: '#1e3a8a',   // Blue-900
      secondary: '#1e40af', // Blue-800
      accent: '#3b82f6',    // Blue-500
      glow: '#2563eb',      // Blue-600
    },
    energy: 0.2,
    nebula: {
      density: 0.7,
      turbulence: 0.1,
      glow: 0.3,
      speed: 0.1,
      noiseScale: 1.2,
      layers: 4,
    },
    particles: {
      color: '#60a5fa',
      speed: 0.15,
      count: 80,
      size: [0.03, 0.07],
      opacity: 0.5,
      pattern: 'falling',
      sparkle: false,
    },
  },

  angry: {
    id: 'angry',
    name: 'Angry',
    tier: 'primary',
    description: 'Rage, frustration, intensity',
    colors: {
      primary: '#dc2626',   // Red-600
      secondary: '#b91c1c', // Red-700
      accent: '#fca5a5',    // Red-300
      glow: '#ef4444',      // Red-500
    },
    energy: 1.0,
    nebula: {
      density: 0.8,
      turbulence: 0.9,
      glow: 0.9,
      speed: 0.8,
      noiseScale: 0.6,
      layers: 5,
    },
    particles: {
      color: '#f87171',
      speed: 0.9,
      count: 200,
      size: [0.02, 0.08],
      opacity: 0.9,
      pattern: 'burst',
      sparkle: false,
    },
  },

  fearful: {
    id: 'fearful',
    name: 'Fearful',
    tier: 'primary',
    description: 'Terror, anxiety, dread',
    colors: {
      primary: '#581c87',   // Purple-900
      secondary: '#6b21a8', // Purple-800
      accent: '#a855f7',    // Purple-500
      glow: '#7c3aed',      // Violet-600
    },
    energy: 0.7,
    nebula: {
      density: 0.6,
      turbulence: 0.7,
      glow: 0.5,
      speed: 0.6,
      noiseScale: 0.7,
      layers: 4,
    },
    particles: {
      color: '#c084fc',
      speed: 0.5,
      count: 120,
      size: [0.01, 0.04],
      opacity: 0.6,
      pattern: 'random',
      sparkle: false,
    },
  },

  surprised: {
    id: 'surprised',
    name: 'Surprised',
    tier: 'primary',
    description: 'Astonishment, shock, wonder',
    colors: {
      primary: '#fef08a',   // Yellow-200
      secondary: '#fbbf24', // Amber-400
      accent: '#ffffff',    // White
      glow: '#fde047',      // Yellow-300
    },
    energy: 0.9,
    nebula: {
      density: 0.4,
      turbulence: 0.8,
      glow: 1.0,
      speed: 0.9,
      noiseScale: 0.5,
      layers: 3,
    },
    particles: {
      color: '#fef9c3',
      speed: 0.8,
      count: 180,
      size: [0.03, 0.08],
      opacity: 1.0,
      pattern: 'burst',
      sparkle: true,
    },
  },

  disgusted: {
    id: 'disgusted',
    name: 'Disgusted',
    tier: 'primary',
    description: 'Repulsion, rejection',
    colors: {
      primary: '#65a30d',   // Lime-600
      secondary: '#4d7c0f', // Lime-700
      accent: '#a3e635',    // Lime-400
      glow: '#84cc16',      // Lime-500
    },
    energy: 0.4,
    nebula: {
      density: 0.5,
      turbulence: 0.3,
      glow: 0.4,
      speed: 0.2,
      noiseScale: 1.1,
      layers: 3,
    },
    particles: {
      color: '#bef264',
      speed: 0.2,
      count: 70,
      size: [0.02, 0.05],
      opacity: 0.5,
      pattern: 'flow',
      sparkle: false,
    },
  },

  contempt: {
    id: 'contempt',
    name: 'Contempt',
    tier: 'primary',
    description: 'Dismissiveness, superiority',
    colors: {
      primary: '#6b7280',   // Gray-500
      secondary: '#4b5563', // Gray-600
      accent: '#9ca3af',    // Gray-400
      glow: '#6b7280',      // Gray-500
    },
    energy: 0.3,
    nebula: {
      density: 0.4,
      turbulence: 0.15,
      glow: 0.3,
      speed: 0.15,
      noiseScale: 1.3,
      layers: 2,
    },
    particles: {
      color: '#d1d5db',
      speed: 0.1,
      count: 50,
      size: [0.02, 0.04],
      opacity: 0.4,
      pattern: 'orbital',
      sparkle: false,
    },
  },

  trust: {
    id: 'trust',
    name: 'Trust',
    tier: 'primary',
    description: 'Openness, faith, security',
    colors: {
      primary: '#3b82f6',   // Blue-500
      secondary: '#2563eb', // Blue-600
      accent: '#93c5fd',    // Blue-300
      glow: '#60a5fa',      // Blue-400
    },
    energy: 0.6,
    nebula: {
      density: 0.55,
      turbulence: 0.25,
      glow: 0.6,
      speed: 0.35,
      noiseScale: 0.9,
      layers: 3,
    },
    particles: {
      color: '#bfdbfe',
      speed: 0.25,
      count: 110,
      size: [0.02, 0.05],
      opacity: 0.7,
      pattern: 'orbital',
      sparkle: false,
    },
  },

  anticipation: {
    id: 'anticipation',
    name: 'Anticipation',
    tier: 'primary',
    description: 'Expectation, eagerness',
    colors: {
      primary: '#f97316',   // Orange-500
      secondary: '#ea580c', // Orange-600
      accent: '#fdba74',    // Orange-300
      glow: '#fb923c',      // Orange-400
    },
    energy: 0.7,
    nebula: {
      density: 0.55,
      turbulence: 0.5,
      glow: 0.65,
      speed: 0.55,
      noiseScale: 0.85,
      layers: 4,
    },
    particles: {
      color: '#fed7aa',
      speed: 0.45,
      count: 130,
      size: [0.02, 0.06],
      opacity: 0.75,
      pattern: 'spiral',
      sparkle: true,
    },
  },
};

type PrimaryEmotionKey = 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'surprised' | 'disgusted' | 'contempt' | 'trust' | 'anticipation';

// ============================================================================
// TIER 2: SECONDARY EMOTIONS (15)
// ============================================================================

const secondaryEmotions: Record<string, EmotionConfig> = {
  love: {
    id: 'love',
    name: 'Love',
    tier: 'secondary',
    description: 'Deep affection, warmth',
    blendFrom: ['happy', 'trust'],
    colors: {
      primary: '#ec4899',   // Pink-500
      secondary: '#db2777', // Pink-600
      accent: '#fbcfe8',    // Pink-200
      glow: '#f472b6',      // Pink-400
    },
    energy: 0.85,
    nebula: {
      density: 0.65,
      turbulence: 0.35,
      glow: 0.75,
      speed: 0.4,
      noiseScale: 0.9,
      layers: 4,
    },
    particles: {
      color: '#fce7f3',
      speed: 0.35,
      count: 140,
      size: [0.02, 0.06],
      opacity: 0.8,
      pattern: 'rising',
      sparkle: true,
    },
  },

  submission: {
    id: 'submission',
    name: 'Submission',
    tier: 'secondary',
    description: 'Yielding, acceptance',
    blendFrom: ['trust', 'fearful'],
    colors: {
      primary: '#a78bfa',   // Violet-400
      secondary: '#8b5cf6', // Violet-500
      accent: '#ddd6fe',    // Violet-200
      glow: '#a78bfa',      // Violet-400
    },
    energy: 0.4,
    nebula: {
      density: 0.5,
      turbulence: 0.2,
      glow: 0.45,
      speed: 0.2,
      noiseScale: 1.0,
      layers: 3,
    },
    particles: {
      color: '#c4b5fd',
      speed: 0.15,
      count: 80,
      size: [0.02, 0.04],
      opacity: 0.55,
      pattern: 'falling',
      sparkle: false,
    },
  },

  awe: {
    id: 'awe',
    name: 'Awe',
    tier: 'secondary',
    description: 'Overwhelming wonder',
    blendFrom: ['fearful', 'surprised'],
    colors: {
      primary: '#a855f7',   // Purple-500
      secondary: '#9333ea', // Purple-600
      accent: '#f5f3ff',    // White-purple tint
      glow: '#c084fc',      // Purple-400
    },
    energy: 0.9,
    nebula: {
      density: 0.6,
      turbulence: 0.6,
      glow: 0.9,
      speed: 0.45,
      noiseScale: 0.7,
      layers: 5,
    },
    particles: {
      color: '#e9d5ff',
      speed: 0.4,
      count: 170,
      size: [0.02, 0.07],
      opacity: 0.85,
      pattern: 'spiral',
      sparkle: true,
    },
  },

  disapproval: {
    id: 'disapproval',
    name: 'Disapproval',
    tier: 'secondary',
    description: 'Disappointed shock',
    blendFrom: ['surprised', 'sad'],
    colors: {
      primary: '#64748b',   // Slate-500
      secondary: '#475569', // Slate-600
      accent: '#94a3b8',    // Slate-400
      glow: '#64748b',      // Slate-500
    },
    energy: 0.45,
    nebula: {
      density: 0.5,
      turbulence: 0.3,
      glow: 0.4,
      speed: 0.2,
      noiseScale: 1.0,
      layers: 3,
    },
    particles: {
      color: '#cbd5e1',
      speed: 0.2,
      count: 70,
      size: [0.02, 0.05],
      opacity: 0.5,
      pattern: 'falling',
      sparkle: false,
    },
  },

  remorse: {
    id: 'remorse',
    name: 'Remorse',
    tier: 'secondary',
    description: 'Regretful guilt',
    blendFrom: ['sad', 'disgusted'],
    colors: {
      primary: '#1e3a5f',   // Dark murky blue
      secondary: '#1a365d', // Darker blue
      accent: '#4a5568',    // Gray-blue
      glow: '#2d3748',      // Dark slate
    },
    energy: 0.25,
    nebula: {
      density: 0.65,
      turbulence: 0.15,
      glow: 0.25,
      speed: 0.1,
      noiseScale: 1.2,
      layers: 4,
    },
    particles: {
      color: '#718096',
      speed: 0.1,
      count: 60,
      size: [0.02, 0.05],
      opacity: 0.4,
      pattern: 'falling',
      sparkle: false,
    },
  },

  contempt_hot: {
    id: 'contempt_hot',
    name: 'Burning Contempt',
    tier: 'secondary',
    description: 'Burning scorn',
    blendFrom: ['disgusted', 'angry'],
    colors: {
      primary: '#92400e',   // Amber-800
      secondary: '#78350f', // Amber-900
      accent: '#b45309',    // Amber-700
      glow: '#d97706',      // Amber-600
    },
    energy: 0.7,
    nebula: {
      density: 0.6,
      turbulence: 0.6,
      glow: 0.6,
      speed: 0.5,
      noiseScale: 0.8,
      layers: 4,
    },
    particles: {
      color: '#fbbf24',
      speed: 0.55,
      count: 100,
      size: [0.02, 0.06],
      opacity: 0.7,
      pattern: 'burst',
      sparkle: false,
    },
  },

  aggressiveness: {
    id: 'aggressiveness',
    name: 'Aggressiveness',
    tier: 'secondary',
    description: 'Forward thrust',
    blendFrom: ['angry', 'anticipation'],
    colors: {
      primary: '#dc2626',   // Red-600
      secondary: '#c2410c', // Orange-700
      accent: '#fb923c',    // Orange-400
      glow: '#ea580c',      // Orange-600
    },
    energy: 0.95,
    nebula: {
      density: 0.75,
      turbulence: 0.85,
      glow: 0.85,
      speed: 0.8,
      noiseScale: 0.6,
      layers: 5,
    },
    particles: {
      color: '#fdba74',
      speed: 0.85,
      count: 190,
      size: [0.02, 0.07],
      opacity: 0.9,
      pattern: 'burst',
      sparkle: false,
    },
  },

  optimism: {
    id: 'optimism',
    name: 'Optimism',
    tier: 'secondary',
    description: 'Hopeful excitement',
    blendFrom: ['anticipation', 'happy'],
    colors: {
      primary: '#84cc16',   // Lime-500
      secondary: '#65a30d', // Lime-600
      accent: '#d9f99d',    // Lime-200
      glow: '#a3e635',      // Lime-400
    },
    energy: 0.8,
    nebula: {
      density: 0.55,
      turbulence: 0.45,
      glow: 0.7,
      speed: 0.5,
      noiseScale: 0.85,
      layers: 4,
    },
    particles: {
      color: '#ecfccb',
      speed: 0.45,
      count: 145,
      size: [0.02, 0.06],
      opacity: 0.8,
      pattern: 'rising',
      sparkle: true,
    },
  },

  anxiety: {
    id: 'anxiety',
    name: 'Anxiety',
    tier: 'secondary',
    description: 'Nervous energy',
    blendFrom: ['fearful', 'anticipation'],
    colors: {
      primary: '#7c3aed',   // Violet-600
      secondary: '#6d28d9', // Violet-700
      accent: '#f97316',    // Orange-500
      glow: '#8b5cf6',      // Violet-500
    },
    energy: 0.75,
    nebula: {
      density: 0.6,
      turbulence: 0.7,
      glow: 0.55,
      speed: 0.65,
      noiseScale: 0.75,
      layers: 4,
    },
    particles: {
      color: '#c4b5fd',
      speed: 0.6,
      count: 140,
      size: [0.01, 0.05],
      opacity: 0.65,
      pattern: 'random',
      sparkle: false,
    },
  },

  envy: {
    id: 'envy',
    name: 'Envy',
    tier: 'secondary',
    description: 'Jealous longing',
    blendFrom: ['sad', 'angry'],
    colors: {
      primary: '#166534',   // Green-800
      secondary: '#14532d', // Green-900
      accent: '#4ade80',    // Green-400
      glow: '#22c55e',      // Green-500
    },
    energy: 0.55,
    nebula: {
      density: 0.55,
      turbulence: 0.4,
      glow: 0.45,
      speed: 0.35,
      noiseScale: 0.95,
      layers: 3,
    },
    particles: {
      color: '#86efac',
      speed: 0.3,
      count: 90,
      size: [0.02, 0.05],
      opacity: 0.55,
      pattern: 'spiral',
      sparkle: false,
    },
  },

  guilt: {
    id: 'guilt',
    name: 'Guilt',
    tier: 'secondary',
    description: 'Self-blame',
    blendFrom: ['fearful', 'sad'],
    colors: {
      primary: '#4c1d95',   // Purple-900
      secondary: '#3b0764', // Purple-950
      accent: '#7c3aed',    // Violet-600
      glow: '#5b21b6',      // Purple-800
    },
    energy: 0.35,
    nebula: {
      density: 0.6,
      turbulence: 0.25,
      glow: 0.35,
      speed: 0.15,
      noiseScale: 1.1,
      layers: 4,
    },
    particles: {
      color: '#a78bfa',
      speed: 0.15,
      count: 70,
      size: [0.02, 0.05],
      opacity: 0.45,
      pattern: 'falling',
      sparkle: false,
    },
  },

  pride: {
    id: 'pride',
    name: 'Pride',
    tier: 'secondary',
    description: 'Triumphant strength',
    blendFrom: ['happy', 'angry'],
    colors: {
      primary: '#fbbf24',   // Amber-400
      secondary: '#dc2626', // Red-600
      accent: '#fef08a',    // Yellow-200
      glow: '#f59e0b',      // Amber-500
    },
    energy: 0.85,
    nebula: {
      density: 0.6,
      turbulence: 0.5,
      glow: 0.8,
      speed: 0.5,
      noiseScale: 0.8,
      layers: 4,
    },
    particles: {
      color: '#fde047',
      speed: 0.5,
      count: 160,
      size: [0.02, 0.07],
      opacity: 0.85,
      pattern: 'rising',
      sparkle: true,
    },
  },

  hope: {
    id: 'hope',
    name: 'Hope',
    tier: 'secondary',
    description: 'Positive expectation',
    blendFrom: ['happy', 'anticipation'],
    colors: {
      primary: '#fde047',   // Yellow-300
      secondary: '#facc15', // Yellow-400
      accent: '#fefce8',    // Yellow-50
      glow: '#eab308',      // Yellow-500
    },
    energy: 0.75,
    nebula: {
      density: 0.5,
      turbulence: 0.35,
      glow: 0.7,
      speed: 0.4,
      noiseScale: 0.9,
      layers: 3,
    },
    particles: {
      color: '#fef9c3',
      speed: 0.35,
      count: 130,
      size: [0.02, 0.06],
      opacity: 0.75,
      pattern: 'rising',
      sparkle: true,
    },
  },

  despair: {
    id: 'despair',
    name: 'Despair',
    tier: 'secondary',
    description: 'Hopeless darkness',
    blendFrom: ['sad', 'fearful'],
    colors: {
      primary: '#0f172a',   // Slate-900
      secondary: '#020617', // Slate-950
      accent: '#334155',    // Slate-700
      glow: '#1e293b',      // Slate-800
    },
    energy: 0.15,
    nebula: {
      density: 0.75,
      turbulence: 0.1,
      glow: 0.2,
      speed: 0.08,
      noiseScale: 1.3,
      layers: 5,
    },
    particles: {
      color: '#475569',
      speed: 0.08,
      count: 50,
      size: [0.02, 0.06],
      opacity: 0.35,
      pattern: 'falling',
      sparkle: false,
    },
  },

  shame: {
    id: 'shame',
    name: 'Shame',
    tier: 'secondary',
    description: 'Hidden embarrassment',
    blendFrom: ['fearful', 'disgusted'],
    colors: {
      primary: '#581c87',   // Purple-900
      secondary: '#3f6212', // Lime-800 (green tint)
      accent: '#7c3aed',    // Violet-600
      glow: '#6b21a8',      // Purple-800
    },
    energy: 0.3,
    nebula: {
      density: 0.55,
      turbulence: 0.3,
      glow: 0.3,
      speed: 0.15,
      noiseScale: 1.1,
      layers: 3,
    },
    particles: {
      color: '#a78bfa',
      speed: 0.12,
      count: 60,
      size: [0.01, 0.04],
      opacity: 0.4,
      pattern: 'falling',
      sparkle: false,
    },
  },
};

// ============================================================================
// TIER 3: COMPLEX EMOTIONS (13)
// ============================================================================

const complexEmotions: Record<string, EmotionConfig> = {
  nostalgia: {
    id: 'nostalgia',
    name: 'Nostalgia',
    tier: 'complex',
    description: 'Bittersweet longing for the past',
    colors: {
      primary: '#92400e',   // Sepia/amber
      secondary: '#78350f',
      accent: '#fcd34d',
      glow: '#d97706',
    },
    energy: 0.5,
    nebula: { density: 0.6, turbulence: 0.2, glow: 0.5, speed: 0.2, noiseScale: 1.0, layers: 4 },
    particles: { color: '#fde68a', speed: 0.2, count: 100, size: [0.02, 0.06], opacity: 0.6, pattern: 'orbital', sparkle: true },
  },

  melancholy: {
    id: 'melancholy',
    name: 'Melancholy',
    tier: 'complex',
    description: 'Thoughtful sadness with beauty',
    colors: {
      primary: '#1e3a8a',
      secondary: '#312e81',
      accent: '#818cf8',
      glow: '#4338ca',
    },
    energy: 0.35,
    nebula: { density: 0.6, turbulence: 0.15, glow: 0.4, speed: 0.15, noiseScale: 1.1, layers: 4 },
    particles: { color: '#a5b4fc', speed: 0.15, count: 85, size: [0.02, 0.06], opacity: 0.5, pattern: 'falling', sparkle: false },
  },

  determination: {
    id: 'determination',
    name: 'Determination',
    tier: 'complex',
    description: 'Focused resolve',
    colors: {
      primary: '#b91c1c',
      secondary: '#0369a1',
      accent: '#f87171',
      glow: '#dc2626',
    },
    energy: 0.85,
    nebula: { density: 0.65, turbulence: 0.5, glow: 0.75, speed: 0.55, noiseScale: 0.8, layers: 4 },
    particles: { color: '#fca5a5', speed: 0.5, count: 150, size: [0.02, 0.06], opacity: 0.8, pattern: 'flow', sparkle: false },
  },

  admiration: {
    id: 'admiration',
    name: 'Admiration',
    tier: 'complex',
    description: 'Respectful appreciation',
    colors: {
      primary: '#0369a1',
      secondary: '#0c4a6e',
      accent: '#7dd3fc',
      glow: '#0284c7',
    },
    energy: 0.7,
    nebula: { density: 0.55, turbulence: 0.3, glow: 0.65, speed: 0.35, noiseScale: 0.9, layers: 3 },
    particles: { color: '#bae6fd', speed: 0.3, count: 120, size: [0.02, 0.06], opacity: 0.7, pattern: 'rising', sparkle: true },
  },

  embarrassment: {
    id: 'embarrassment',
    name: 'Embarrassment',
    tier: 'complex',
    description: 'Self-conscious discomfort',
    colors: {
      primary: '#db2777',
      secondary: '#be185d',
      accent: '#f9a8d4',
      glow: '#ec4899',
    },
    energy: 0.55,
    nebula: { density: 0.5, turbulence: 0.4, glow: 0.5, speed: 0.35, noiseScale: 0.9, layers: 3 },
    particles: { color: '#fbcfe8', speed: 0.35, count: 90, size: [0.02, 0.05], opacity: 0.6, pattern: 'random', sparkle: false },
  },

  frustration: {
    id: 'frustration',
    name: 'Frustration',
    tier: 'complex',
    description: 'Blocked progress',
    colors: {
      primary: '#c2410c',
      secondary: '#9a3412',
      accent: '#fb923c',
      glow: '#ea580c',
    },
    energy: 0.75,
    nebula: { density: 0.6, turbulence: 0.65, glow: 0.65, speed: 0.6, noiseScale: 0.75, layers: 4 },
    particles: { color: '#fdba74', speed: 0.55, count: 130, size: [0.02, 0.06], opacity: 0.7, pattern: 'random', sparkle: false },
  },

  loneliness: {
    id: 'loneliness',
    name: 'Loneliness',
    tier: 'complex',
    description: 'Isolated emptiness',
    colors: {
      primary: '#1e293b',
      secondary: '#0f172a',
      accent: '#64748b',
      glow: '#334155',
    },
    energy: 0.25,
    nebula: { density: 0.4, turbulence: 0.1, glow: 0.25, speed: 0.1, noiseScale: 1.3, layers: 3 },
    particles: { color: '#94a3b8', speed: 0.1, count: 40, size: [0.02, 0.05], opacity: 0.35, pattern: 'orbital', sparkle: false },
  },

  contentment: {
    id: 'contentment',
    name: 'Contentment',
    tier: 'complex',
    description: 'Peaceful satisfaction',
    colors: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#6ee7b7',
      glow: '#10b981',
    },
    energy: 0.55,
    nebula: { density: 0.5, turbulence: 0.2, glow: 0.55, speed: 0.25, noiseScale: 1.0, layers: 3 },
    particles: { color: '#a7f3d0', speed: 0.2, count: 100, size: [0.02, 0.05], opacity: 0.65, pattern: 'orbital', sparkle: false },
  },

  inspiration: {
    id: 'inspiration',
    name: 'Inspiration',
    tier: 'complex',
    description: 'Creative spark',
    colors: {
      primary: '#fbbf24',
      secondary: '#8b5cf6',
      accent: '#fef08a',
      glow: '#f59e0b',
    },
    energy: 0.9,
    nebula: { density: 0.6, turbulence: 0.55, glow: 0.85, speed: 0.55, noiseScale: 0.75, layers: 5 },
    particles: { color: '#fde68a', speed: 0.55, count: 180, size: [0.02, 0.07], opacity: 0.9, pattern: 'spiral', sparkle: true },
  },

  vulnerability: {
    id: 'vulnerability',
    name: 'Vulnerability',
    tier: 'complex',
    description: 'Open and exposed',
    colors: {
      primary: '#be185d',
      secondary: '#9d174d',
      accent: '#f9a8d4',
      glow: '#db2777',
    },
    energy: 0.45,
    nebula: { density: 0.45, turbulence: 0.35, glow: 0.45, speed: 0.25, noiseScale: 1.0, layers: 3 },
    particles: { color: '#fbcfe8', speed: 0.2, count: 80, size: [0.02, 0.05], opacity: 0.55, pattern: 'random', sparkle: false },
  },

  empowerment: {
    id: 'empowerment',
    name: 'Empowerment',
    tier: 'complex',
    description: 'Strengthened confidence',
    colors: {
      primary: '#dc2626',
      secondary: '#b91c1c',
      accent: '#fbbf24',
      glow: '#ef4444',
    },
    energy: 0.9,
    nebula: { density: 0.65, turbulence: 0.55, glow: 0.85, speed: 0.55, noiseScale: 0.75, layers: 4 },
    particles: { color: '#fca5a5', speed: 0.55, count: 170, size: [0.02, 0.07], opacity: 0.85, pattern: 'rising', sparkle: true },
  },

  ambivalence: {
    id: 'ambivalence',
    name: 'Ambivalence',
    tier: 'complex',
    description: 'Conflicting feelings',
    colors: {
      primary: '#6366f1',
      secondary: '#f59e0b',
      accent: '#a5b4fc',
      glow: '#818cf8',
    },
    energy: 0.5,
    nebula: { density: 0.55, turbulence: 0.45, glow: 0.5, speed: 0.35, noiseScale: 0.9, layers: 4 },
    particles: { color: '#c7d2fe', speed: 0.35, count: 110, size: [0.02, 0.05], opacity: 0.6, pattern: 'random', sparkle: false },
  },

  curiosity: {
    id: 'curiosity',
    name: 'Curiosity',
    tier: 'complex',
    description: 'Eager to learn',
    colors: {
      primary: '#06b6d4',
      secondary: '#0891b2',
      accent: '#67e8f9',
      glow: '#22d3ee',
    },
    energy: 0.75,
    nebula: { density: 0.55, turbulence: 0.45, glow: 0.7, speed: 0.5, noiseScale: 0.85, layers: 4 },
    particles: { color: '#a5f3fc', speed: 0.45, count: 140, size: [0.02, 0.06], opacity: 0.75, pattern: 'spiral', sparkle: true },
  },
};

// ============================================================================
// TIER 4: TRANSCENDENT EMOTIONS (12)
// ============================================================================

const transcendentEmotions: Record<string, EmotionConfig> = {
  enlightenment: {
    id: 'enlightenment',
    name: 'Enlightenment',
    tier: 'transcendent',
    description: 'Ultimate understanding',
    colors: { primary: '#ffffff', secondary: '#fef08a', accent: '#ffffff', glow: '#fef9c3' },
    energy: 1.0,
    nebula: { density: 0.4, turbulence: 0.3, glow: 1.0, speed: 0.3, noiseScale: 0.6, layers: 6 },
    particles: { color: '#ffffff', speed: 0.3, count: 200, size: [0.02, 0.08], opacity: 1.0, pattern: 'spiral', sparkle: true },
  },

  unity: {
    id: 'unity',
    name: 'Unity',
    tier: 'transcendent',
    description: 'Oneness with all',
    colors: { primary: '#8b5cf6', secondary: '#22d3ee', accent: '#e9d5ff', glow: '#a78bfa' },
    energy: 0.95,
    nebula: { density: 0.55, turbulence: 0.25, glow: 0.9, speed: 0.35, noiseScale: 0.8, layers: 5 },
    particles: { color: '#ddd6fe', speed: 0.35, count: 180, size: [0.02, 0.07], opacity: 0.9, pattern: 'orbital', sparkle: true },
  },

  bliss: {
    id: 'bliss',
    name: 'Bliss',
    tier: 'transcendent',
    description: 'Perfect happiness',
    colors: { primary: '#fbbf24', secondary: '#ec4899', accent: '#fef08a', glow: '#fcd34d' },
    energy: 1.0,
    nebula: { density: 0.5, turbulence: 0.35, glow: 0.95, speed: 0.4, noiseScale: 0.75, layers: 5 },
    particles: { color: '#fef9c3', speed: 0.4, count: 190, size: [0.02, 0.08], opacity: 0.95, pattern: 'rising', sparkle: true },
  },

  cosmic_wonder: {
    id: 'cosmic_wonder',
    name: 'Cosmic Wonder',
    tier: 'transcendent',
    description: 'Awe at the universe',
    colors: { primary: '#1e3a8a', secondary: '#7c3aed', accent: '#fef08a', glow: '#3b82f6' },
    energy: 0.95,
    nebula: { density: 0.65, turbulence: 0.45, glow: 0.9, speed: 0.4, noiseScale: 0.7, layers: 6 },
    particles: { color: '#bfdbfe', speed: 0.4, count: 200, size: [0.01, 0.08], opacity: 0.9, pattern: 'spiral', sparkle: true },
  },

  infinite_peace: {
    id: 'infinite_peace',
    name: 'Infinite Peace',
    tier: 'transcendent',
    description: 'Boundless calm',
    colors: { primary: '#0ea5e9', secondary: '#0284c7', accent: '#e0f2fe', glow: '#38bdf8' },
    energy: 0.7,
    nebula: { density: 0.45, turbulence: 0.1, glow: 0.75, speed: 0.15, noiseScale: 1.0, layers: 4 },
    particles: { color: '#bae6fd', speed: 0.15, count: 120, size: [0.02, 0.06], opacity: 0.75, pattern: 'orbital', sparkle: false },
  },

  divine_love: {
    id: 'divine_love',
    name: 'Divine Love',
    tier: 'transcendent',
    description: 'Universal unconditional love',
    colors: { primary: '#ec4899', secondary: '#fbbf24', accent: '#fce7f3', glow: '#f472b6' },
    energy: 1.0,
    nebula: { density: 0.55, turbulence: 0.3, glow: 0.95, speed: 0.35, noiseScale: 0.85, layers: 5 },
    particles: { color: '#fbcfe8', speed: 0.35, count: 180, size: [0.02, 0.08], opacity: 0.95, pattern: 'rising', sparkle: true },
  },

  transcendence: {
    id: 'transcendence',
    name: 'Transcendence',
    tier: 'transcendent',
    description: 'Beyond ordinary limits',
    colors: { primary: '#a855f7', secondary: '#fbbf24', accent: '#f5f3ff', glow: '#c084fc' },
    energy: 1.0,
    nebula: { density: 0.5, turbulence: 0.4, glow: 1.0, speed: 0.45, noiseScale: 0.7, layers: 6 },
    particles: { color: '#e9d5ff', speed: 0.45, count: 200, size: [0.02, 0.09], opacity: 1.0, pattern: 'spiral', sparkle: true },
  },

  pure_awareness: {
    id: 'pure_awareness',
    name: 'Pure Awareness',
    tier: 'transcendent',
    description: 'Clear consciousness',
    colors: { primary: '#f0fdfa', secondary: '#ccfbf1', accent: '#ffffff', glow: '#99f6e4' },
    energy: 0.85,
    nebula: { density: 0.35, turbulence: 0.15, glow: 0.85, speed: 0.2, noiseScale: 0.9, layers: 4 },
    particles: { color: '#ffffff', speed: 0.2, count: 150, size: [0.02, 0.06], opacity: 0.85, pattern: 'orbital', sparkle: true },
  },

  sacred_awe: {
    id: 'sacred_awe',
    name: 'Sacred Awe',
    tier: 'transcendent',
    description: 'Reverent wonder',
    colors: { primary: '#fbbf24', secondary: '#7c3aed', accent: '#fef9c3', glow: '#f59e0b' },
    energy: 0.95,
    nebula: { density: 0.6, turbulence: 0.4, glow: 0.95, speed: 0.4, noiseScale: 0.75, layers: 5 },
    particles: { color: '#fde68a', speed: 0.4, count: 180, size: [0.02, 0.08], opacity: 0.95, pattern: 'spiral', sparkle: true },
  },

  eternal_now: {
    id: 'eternal_now',
    name: 'Eternal Now',
    tier: 'transcendent',
    description: 'Timeless presence',
    colors: { primary: '#f0abfc', secondary: '#22d3ee', accent: '#fdf4ff', glow: '#e879f9' },
    energy: 0.9,
    nebula: { density: 0.5, turbulence: 0.2, glow: 0.9, speed: 0.25, noiseScale: 0.85, layers: 5 },
    particles: { color: '#f5d0fe', speed: 0.25, count: 160, size: [0.02, 0.07], opacity: 0.9, pattern: 'orbital', sparkle: true },
  },

  universal_compassion: {
    id: 'universal_compassion',
    name: 'Universal Compassion',
    tier: 'transcendent',
    description: 'Love for all beings',
    colors: { primary: '#10b981', secondary: '#ec4899', accent: '#d1fae5', glow: '#34d399' },
    energy: 0.9,
    nebula: { density: 0.55, turbulence: 0.25, glow: 0.85, speed: 0.3, noiseScale: 0.9, layers: 4 },
    particles: { color: '#a7f3d0', speed: 0.3, count: 160, size: [0.02, 0.07], opacity: 0.85, pattern: 'rising', sparkle: true },
  },

  sublime_joy: {
    id: 'sublime_joy',
    name: 'Sublime Joy',
    tier: 'transcendent',
    description: 'Elevated ecstasy',
    colors: { primary: '#fbbf24', secondary: '#f472b6', accent: '#fef08a', glow: '#fcd34d' },
    energy: 1.0,
    nebula: { density: 0.55, turbulence: 0.45, glow: 1.0, speed: 0.5, noiseScale: 0.7, layers: 5 },
    particles: { color: '#fef9c3', speed: 0.5, count: 200, size: [0.02, 0.09], opacity: 1.0, pattern: 'rising', sparkle: true },
  },
};

// ============================================================================
// COMBINED EMOTION MAP
// ============================================================================

export const EMOTION_CONFIGS: Record<Emotion, EmotionConfig> = {
  ...primaryEmotions,
  ...secondaryEmotions,
  ...complexEmotions,
  ...transcendentEmotions,
} as Record<Emotion, EmotionConfig>;

// ============================================================================
// EMOTION TRANSITIONS
// ============================================================================

export const DEFAULT_EMOTION_TRANSITION: EmotionTransitionConfig = {
  duration: 800,
  easing: 'easeInOut',
  colorMorph: 'blend',
  showParticles: true,
};

export const EMOTION_TRANSITIONS: Partial<Record<string, EmotionTransitionConfig>> = {
  '*->angry': { duration: 400, easing: 'easeOut', colorMorph: 'burst', showParticles: true },
  '*->happy': { duration: 600, easing: 'easeOut', colorMorph: 'blend', showParticles: true },
  '*->sad': { duration: 1200, easing: 'easeInOut', colorMorph: 'crossfade', showParticles: false },
  '*->transcendent': { duration: 2000, easing: 'easeInOut', colorMorph: 'blend', showParticles: true },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get emotion configuration by ID
 */
export function getEmotionConfig(emotion: Emotion): EmotionConfig {
  return EMOTION_CONFIGS[emotion] || EMOTION_CONFIGS.neutral;
}

/**
 * Get emotions by tier
 */
export function getEmotionsByTier(tier: EmotionTier): Emotion[] {
  return Object.values(EMOTION_CONFIGS)
    .filter(config => config.tier === tier)
    .map(config => config.id);
}

/**
 * Get emotion transition configuration
 */
export function getEmotionTransition(from: Emotion, to: Emotion): EmotionTransitionConfig {
  const specificKey = `${from}->${to}`;
  const wildcardKey = `*->${to}`;
  
  return EMOTION_TRANSITIONS[specificKey] || EMOTION_TRANSITIONS[wildcardKey] || DEFAULT_EMOTION_TRANSITION;
}

/**
 * Blend two emotion configs
 */
export function blendEmotionConfigs(
  config1: EmotionConfig, 
  config2: EmotionConfig, 
  ratio: number // 0 = all config1, 1 = all config2
): EmotionConfig {
  const t = Math.max(0, Math.min(1, ratio));
  const invT = 1 - t;
  
  return {
    ...config1,
    id: t > 0.5 ? config2.id : config1.id,
    energy: config1.energy * invT + config2.energy * t,
    nebula: {
      density: config1.nebula.density * invT + config2.nebula.density * t,
      turbulence: config1.nebula.turbulence * invT + config2.nebula.turbulence * t,
      glow: config1.nebula.glow * invT + config2.nebula.glow * t,
      speed: config1.nebula.speed * invT + config2.nebula.speed * t,
      noiseScale: config1.nebula.noiseScale * invT + config2.nebula.noiseScale * t,
      layers: Math.round(config1.nebula.layers * invT + config2.nebula.layers * t),
    },
    particles: {
      ...config1.particles,
      speed: config1.particles.speed * invT + config2.particles.speed * t,
      count: Math.round(config1.particles.count * invT + config2.particles.count * t),
      opacity: config1.particles.opacity * invT + config2.particles.opacity * t,
    },
  };
}
