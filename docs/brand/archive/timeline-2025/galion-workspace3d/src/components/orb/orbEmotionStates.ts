/**
 * Orb Emotion State Mappings
 * Following Part 4.2 of Galion.app-v3-guide.md
 * 
 * Maps detected emotions to visual properties:
 * - Color palette shifts
 * - Glow intensity
 * - Gradient speed
 * - Scale variations
 */

import type { EmotionType } from './Orb';

export interface OrbEmotionVisuals {
  // Color palette (CSS gradient string)
  primaryGradient: string;
  
  // Glow properties
  glowColor: string;
  glowIntensity: number; // 0-1
  
  // Motion properties
  gradientSpeed: number; // 0-1 (animation speed multiplier)
  pulseIntensity: number; // 0-1 (scale variation)
  
  // Shadow properties
  shadowIntensity: number; // 0-1
}

/**
 * Emotion to visual mapping following v3 guide specifications
 * 
 * Emotion changes happen over 200-400ms with smooth easing
 */
export const EMOTION_VISUALS: Partial<Record<EmotionType, OrbEmotionVisuals>> = {
  // ===========================================================================
  // NEUTRAL - Default balanced state
  // ===========================================================================
  neutral: {
    primaryGradient: `
      radial-gradient(circle at 30% 25%, #1e3a8a 0%, transparent 50%),
      radial-gradient(circle at 70% 70%, #0e7490 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, #0891b2 0%, #115e59 60%, #134e4a 100%)
    `,
    glowColor: 'rgba(99, 102, 241, 0.25)',
    glowIntensity: 0.5,
    gradientSpeed: 0.2,
    pulseIntensity: 0.02, // 2%
    shadowIntensity: 0.3,
  },
  
  // ===========================================================================
  // CALM - Cool blues, slow motion, dim glow
  // ===========================================================================
  calm: {
    primaryGradient: `
      radial-gradient(circle at 30% 30%, #1e3a8a 0%, transparent 60%),
      radial-gradient(circle at 50% 50%, #1e40af 0%, #1e3a8a 50%, #1f2937 100%)
    `,
    glowColor: 'rgba(30, 58, 138, 0.2)',
    glowIntensity: 0.3,
    gradientSpeed: 0.1,
    pulseIntensity: 0.015, // 1.5% - very subtle
    shadowIntensity: 0.2,
  },
  
  // ===========================================================================
  // HAPPY - Warm accents, brighter, more energetic
  // ===========================================================================
  happy: {
    primaryGradient: `
      radial-gradient(circle at 35% 30%, #f59e0b 0%, transparent 40%),
      radial-gradient(circle at 65% 65%, #14b8a6 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, #06b6d4 0%, #0891b2 50%, #0e7490 100%)
    `,
    glowColor: 'rgba(245, 158, 11, 0.3)',
    glowIntensity: 0.7,
    gradientSpeed: 0.4,
    pulseIntensity: 0.03, // 3% - more energetic
    shadowIntensity: 0.4,
  },
  
  // ===========================================================================
  // EXCITED - Bright, fast motion, high energy
  // ===========================================================================
  excited: {
    primaryGradient: `
      radial-gradient(circle at 40% 25%, #f472b6 0%, transparent 45%),
      radial-gradient(circle at 60% 70%, #06b6d4 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, #14b8a6 0%, #0891b2 50%, #115e59 100%)
    `,
    glowColor: 'rgba(244, 114, 182, 0.35)',
    glowIntensity: 0.85,
    gradientSpeed: 0.6,
    pulseIntensity: 0.04, // 4% - energetic
    shadowIntensity: 0.5,
  },
  
  // ===========================================================================
  // SAD - Cooler tones, slower, dimmer
  // ===========================================================================
  sad: {
    primaryGradient: `
      radial-gradient(circle at 50% 50%, #1e3a8a 0%, #0f172a 70%, #020617 100%)
    `,
    glowColor: 'rgba(30, 58, 138, 0.15)',
    glowIntensity: 0.25,
    gradientSpeed: 0.05,
    pulseIntensity: 0.01, // 1% - minimal
    shadowIntensity: 0.15,
  },
  
  // ===========================================================================
  // ANGRY - Red tones, intense, sharp motion
  // ===========================================================================
  angry: {
    primaryGradient: `
      radial-gradient(circle at 35% 30%, #dc2626 0%, transparent 50%),
      radial-gradient(circle at 65% 70%, #b91c1c 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, #991b1b 0%, #7f1d1d 60%, #450a0a 100%)
    `,
    glowColor: 'rgba(220, 38, 38, 0.4)',
    glowIntensity: 0.75,
    gradientSpeed: 0.5,
    pulseIntensity: 0.035, // 3.5% - intense
    shadowIntensity: 0.6,
  },
  
  // ===========================================================================
  // FEARFUL - Purple/violet, tense, jittery
  // ===========================================================================
  fearful: {
    primaryGradient: `
      radial-gradient(circle at 40% 35%, #7c3aed 0%, transparent 50%),
      radial-gradient(circle at 60% 65%, #6366f1 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, #4f46e5 0%, #4338ca 60%, #312e81 100%)
    `,
    glowColor: 'rgba(124, 58, 237, 0.3)',
    glowIntensity: 0.55,
    gradientSpeed: 0.35,
    pulseIntensity: 0.025, // 2.5% - slightly tense
    shadowIntensity: 0.35,
  },
  
  // ===========================================================================
  // SURPRISED - Bright cyan/white, quick motion
  // ===========================================================================
  surprised: {
    primaryGradient: `
      radial-gradient(circle at 50% 40%, #f0fdfa 0%, transparent 40%),
      radial-gradient(circle at 45% 55%, #06b6d4 0%, transparent 55%),
      radial-gradient(circle at 50% 50%, #22d3ee 0%, #06b6d4 50%, #0891b2 100%)
    `,
    glowColor: 'rgba(34, 211, 238, 0.5)',
    glowIntensity: 0.8,
    gradientSpeed: 0.45,
    pulseIntensity: 0.035, // 3.5% - alert
    shadowIntensity: 0.45,
  },
  
  // ===========================================================================
  // CONFUSED - Muted purple/gray, uneven motion
  // ===========================================================================
  confused: {
    primaryGradient: `
      radial-gradient(circle at 45% 40%, #6b7280 0%, transparent 50%),
      radial-gradient(circle at 55% 60%, #8b5cf6 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, #6366f1 0%, #4b5563 60%, #374151 100%)
    `,
    glowColor: 'rgba(107, 114, 128, 0.25)',
    glowIntensity: 0.4,
    gradientSpeed: 0.15,
    pulseIntensity: 0.02, // 2% - uncertain
    shadowIntensity: 0.25,
  },
  
  // ===========================================================================
  // FOCUSED - Cool teals, sharper gradients, higher intensity
  // ===========================================================================
  focused: {
    primaryGradient: `
      radial-gradient(circle at 30% 25%, #0e7490 0%, transparent 45%),
      radial-gradient(circle at 70% 70%, #14b8a6 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, #06b6d4 0%, #0891b2 50%, #0e7490 100%)
    `,
    glowColor: 'rgba(6, 182, 212, 0.35)',
    glowIntensity: 0.65,
    gradientSpeed: 0.3,
    pulseIntensity: 0.02, // 2% - steady
    shadowIntensity: 0.4,
  },
  
  // ===========================================================================
  // THINKING - Rotating gradients, analytical colors
  // ===========================================================================
  thinking: {
    primaryGradient: `
      radial-gradient(circle at 40% 35%, #8b5cf6 0%, transparent 50%),
      radial-gradient(circle at 60% 65%, #0891b2 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, #6366f1 0%, #0891b2 50%, #115e59 100%)
    `,
    glowColor: 'rgba(139, 92, 246, 0.3)',
    glowIntensity: 0.5,
    gradientSpeed: 0.25,
    pulseIntensity: 0.015, // 1.5% - contemplative
    shadowIntensity: 0.3,
  },
};

/**
 * Get orb visuals for a specific emotion with smooth transition
 */
export function getEmotionVisuals(emotion: EmotionType): OrbEmotionVisuals {
  return EMOTION_VISUALS[emotion] || EMOTION_VISUALS.neutral!;
}

/**
 * Mix two emotion visuals for smooth transitions
 * Used for cross-fading between emotions
 */
export function mixEmotionVisuals(
  from: EmotionType,
  to: EmotionType,
  progress: number // 0-1
): OrbEmotionVisuals {
  const fromVisuals = getEmotionVisuals(from);
  const toVisuals = getEmotionVisuals(to);
  
  // Simple linear interpolation for numeric values
  return {
    // For gradients, we'd need to cross-fade - for now just switch at 50%
    primaryGradient: progress < 0.5 ? fromVisuals.primaryGradient : toVisuals.primaryGradient,
    glowColor: progress < 0.5 ? fromVisuals.glowColor : toVisuals.glowColor,
    glowIntensity: fromVisuals.glowIntensity + (toVisuals.glowIntensity - fromVisuals.glowIntensity) * progress,
    gradientSpeed: fromVisuals.gradientSpeed + (toVisuals.gradientSpeed - fromVisuals.gradientSpeed) * progress,
    pulseIntensity: fromVisuals.pulseIntensity + (toVisuals.pulseIntensity - fromVisuals.pulseIntensity) * progress,
    shadowIntensity: fromVisuals.shadowIntensity + (toVisuals.shadowIntensity - fromVisuals.shadowIntensity) * progress,
  };
}
