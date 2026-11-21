/**
 * Orb Animation Utilities
 * Emotion-based animation configurations
 */

import { EmotionType } from './Orb';

export interface AnimationConfig {
  scale: number[];
  duration: number;
  opacity: number[];
  glowIntensity: number;
}

export const emotionAnimations: Partial<Record<EmotionType, AnimationConfig>> = {
  happy: {
    scale: [1, 1.15, 1],
    duration: 1.2,
    opacity: [0.8, 1, 0.8],
    glowIntensity: 100,
  },
  sad: {
    scale: [1, 0.95, 1],
    duration: 3,
    opacity: [0.5, 0.7, 0.5],
    glowIntensity: 40,
  },
  angry: {
    scale: [1, 1.1, 0.95, 1.1, 1],
    duration: 0.8,
    opacity: [0.9, 1, 0.9, 1, 0.9],
    glowIntensity: 120,
  },
  excited: {
    scale: [1, 1.2, 0.9, 1.2, 1],
    duration: 0.6,
    opacity: [0.8, 1, 0.8, 1, 0.8],
    glowIntensity: 110,
  },
  neutral: {
    scale: [1, 1.05, 1],
    duration: 2,
    opacity: [0.6, 0.8, 0.6],
    glowIntensity: 60,
  },
  calm: {
    scale: [1, 1.02, 1],
    duration: 3,
    opacity: [0.7, 0.85, 0.7],
    glowIntensity: 50,
  },
  warm: {
    scale: [1, 1.08, 1],
    duration: 1.5,
    opacity: [0.75, 0.95, 0.75],
    glowIntensity: 80,
  },
  focused: {
    scale: [1, 1.06, 1],
    duration: 1.8,
    opacity: [0.8, 0.9, 0.8],
    glowIntensity: 70,
  },
  alert: {
    scale: [1, 1.12, 1],
    duration: 1,
    opacity: [0.85, 1, 0.85],
    glowIntensity: 100,
  },
};

// Default animation config fallback
const defaultAnimation: AnimationConfig = {
  scale: [1, 1.05, 1],
  duration: 2,
  opacity: [0.6, 0.8, 0.6],
  glowIntensity: 60,
};

// Calculate animation based on emotion and intensity
export function getAnimationForEmotion(
  emotion: EmotionType,
  intensity: number,
  isListening: boolean,
  isSpeaking: boolean
): AnimationConfig {
  const baseAnimation = emotionAnimations[emotion] || defaultAnimation;
  
  // Modify based on state
  if (isSpeaking) {
    return {
      ...baseAnimation,
      duration: baseAnimation.duration * 0.7,
      glowIntensity: baseAnimation.glowIntensity * 1.5,
      opacity: baseAnimation.opacity.map(o => Math.min(1, o * 1.3)),
    };
  }
  
  if (isListening) {
    return {
      ...baseAnimation,
      duration: baseAnimation.duration * 0.8,
      glowIntensity: baseAnimation.glowIntensity * 1.2,
    };
  }
  
  // Apply intensity multiplier
  return {
    ...baseAnimation,
    glowIntensity: baseAnimation.glowIntensity * intensity,
    opacity: baseAnimation.opacity.map(o => o * (0.5 + intensity * 0.5)),
  };
}

// Interpolate between two colors based on intensity
export function interpolateColor(
  color1: string,
  color2: string,
  intensity: number
): string {
  // This is a simplified version - you could use a proper color library for better results
  return intensity < 0.5 ? color1 : color2;
}
