/**
 * GALION Orb V7.2 - Boot Sequence Components
 *
 * Complete exports for the epic V7.2 orb and boot sequence.
 * Features 50 emotions, 8K shaders, birth animations, and audio reactivity.
 *
 * VERSION 7.2.1 includes ENHANCED modular components:
 * - OrbPlasmaCore - Central consciousness with noise displacement
 * - OrbGlassSurface - Ethereal iridescent shell
 * - OrbParticleField - 600+ orbital particles with boid behavior
 * - OrbEnergyRings - 5 rotating holographic rings
 * - OrbLightningTendrils - 12 dynamic energy connections
 * - CosmicBackground - 1500+ stars with nebula
 *
 * @version 7.2.1
 */

// =============================================================================
// MAIN ORB COMPONENT
// =============================================================================

export { GalionOrbV7 } from './GalionOrbV7';
export type { GalionOrbV7Props } from './GalionOrbV7';

// =============================================================================
// ENHANCED ORB COMPONENT (Modular Architecture)
// =============================================================================

export { GalionOrbV7Enhanced } from './GalionOrbV7Enhanced';
export type { GalionOrbV7EnhancedProps } from './GalionOrbV7Enhanced';

// =============================================================================
// MODULAR 3D COMPONENTS
// =============================================================================

// Core Components
export { OrbPlasmaCore } from './core/OrbPlasmaCore';
export { OrbGlassSurface } from './core/OrbGlassSurface';

// Effect Components
export { OrbParticleField } from './effects/OrbParticleField';
export { OrbEnergyRings } from './effects/OrbEnergyRings';
export { OrbLightningTendrils } from './effects/OrbLightningTendrils';

// Background Components
export { CosmicBackground } from './background/CosmicBackground';

// Enhanced Types
export type {
  OrbV7State,
  OrbV7Emotion,
  AudioData,
  EmotionColorPalette,
} from './types';

export {
  EMOTION_PALETTES,
  getEmotionPalette,
  lerpColor,
} from './types';

// =============================================================================
// BOOT SEQUENCE COMPONENTS
// =============================================================================

export { GalionOSBootV7 } from './GalionOSBootV7';
export type { GalionOSBootV7Props, BootPhase as BootPhaseV7 } from './GalionOSBootV7';

export { OrbBirthSequence } from './birth/OrbBirthSequence';
export type { OrbBirthSequenceProps, BirthPhase as OrbBirthPhase } from './birth/OrbBirthSequence';

// =============================================================================
// EMOTION SYSTEM
// =============================================================================

export {
  ALL_EMOTIONS,
  PRIMARY_EMOTIONS,
  SECONDARY_EMOTIONS,
  COMPLEX_EMOTIONS,
  TRANSCENDENT_EMOTIONS,
  NEUTRAL_EMOTION,
  BIRTH_EMOTION,
  getEmotion,
  getEmotionsByTier,
  lerpEmotionConfig,
} from './core/emotions';
export type { EmotionConfig, EmotionTier } from './core/emotions';

// =============================================================================
// SHADERS
// =============================================================================

export {
  cosmicVertexShader,
  cosmicFragmentShader,
  glowVertexShader,
  glowFragmentShader,
  particleVertexShader,
  particleFragmentShader,
} from './shaders/cosmicShader';

// =============================================================================
// HOOKS (re-exports for convenience)
// =============================================================================

export { useOrbV7 } from '@/hooks/useOrbV7';
export { useBootSequence } from '@/hooks/useBootSequence';
export {
  FIRST_VISIT_PHASE_CONFIGS,
  RETURNING_USER_PHASE_CONFIGS,
  FIRST_VISIT_PHASE_ORDER,
  RETURNING_USER_PHASE_ORDER,
} from '@/hooks/useBootSequence';

// =============================================================================
// CONTEXT
// =============================================================================

export {
  OrbProvider,
  OrbContext,
  useOrbContext,
  useOrbContextOptional,
} from '@/contexts/OrbContext';

// =============================================================================
// TYPES (from orb-v7.types - avoiding duplicates with emotion system)
// =============================================================================

export type {
  // Core orb types
  OrbState,
  OrbEmotion,
  QualityLevel,

  // Boot phase types (BootPhase exported as BootPhaseV7 from GalionOSBootV7)
  ExtendedBootPhase,

  // Configuration types
  OrbColors,
  StateConfig,
  QualityConfig,
  BootPhaseConfig,

  // Options types
  BootSequenceOptions,
  UseOrbV7Options,

  // State types
  BootSequenceState,
  OrbPerformanceMetrics,

  // Return types
  UseOrbV7Return,
  UseBootSequenceReturn,

  // Context types
  OrbContextValue,
  OrbProviderProps,

  // Animation types
  OrbAnimationConfig,
  OrbTransitionConfig,

  // Event types
  OrbEventType,
  OrbEvent,
  OrbEventListener,

  // Utility types
  EmotionCategory,
  CategorizedEmotion,
} from '@/types/orb-v7.types';

// EmotionConfig is exported from ./core/emotions (line 88)

// =============================================================================
// CONSTANTS
// =============================================================================

export {
  ORB_DEFAULTS,
  BOOT_PHASE_ORDER,
  FIRST_VISIT_PHASES,
  RETURNING_USER_PHASES,
} from '@/types/orb-v7.types';

// =============================================================================
// ORB COMPONENTS (re-export from v6 for compatibility)
// =============================================================================

export {
  GalionOrbV6,
  OrbCore,
  OrbGlow,
  OrbNeural,
  OrbParticles,
  OrbEnergy,
  OrbAurora,
  OrbStarField,
  OrbControllerV6,
} from '@/components/workspace3d/orb/v6';

// =============================================================================
// BOOT PHASE COMPONENTS (Legacy compatibility - aliased to avoid conflicts)
// =============================================================================

// Re-export existing boot phases with aliases to avoid conflicts with types
export { BirthPhase as BirthPhaseComponent } from '@/components/boot/phases/BirthPhase';
export { VoidPhase as VoidPhaseComponent } from '@/components/boot/phases/VoidPhase';
export { WelcomePhase as WelcomePhaseComponent } from '@/components/boot/phases/WelcomePhase';
export { GreetingPhase as GreetingPhaseComponent } from '@/components/boot/phases/GreetingPhase';
export { ConsentPhase as ConsentPhaseComponent } from '@/components/boot/phases/ConsentPhase';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get emotion category for grouping/filtering
 */
export function getEmotionCategory(emotion: string): string {
  const categories: Record<string, string[]> = {
    primary: ['neutral', 'happy', 'sad', 'angry', 'fearful', 'surprised', 'disgusted'],
    positive: [
      'joyful', 'excited', 'content', 'peaceful', 'grateful', 'hopeful',
      'proud', 'amused', 'love', 'inspired', 'relieved', 'optimistic', 'confident',
    ],
    negative: [
      'anxious', 'frustrated', 'disappointed', 'lonely', 'jealous',
      'guilty', 'embarrassed', 'overwhelmed', 'bored', 'confused',
    ],
    complex: [
      'curious', 'nostalgic', 'melancholic', 'contemplative', 'determined',
      'sympathetic', 'empathetic', 'vulnerable', 'serene', 'passionate',
    ],
    intellectual: ['focused', 'creative', 'analytical', 'skeptical', 'wise'],
    transcendent: ['wonder', 'awe', 'transcendent', 'enlightened', 'calm'],
  };

  for (const [category, emotions] of Object.entries(categories)) {
    if (emotions.includes(emotion)) {
      return category;
    }
  }

  return 'primary';
}

/**
 * Check if emotion is positive valence
 */
export function isPositiveEmotion(emotion: string): boolean {
  const positiveEmotions = [
    'happy', 'joyful', 'excited', 'content', 'peaceful', 'grateful',
    'hopeful', 'proud', 'amused', 'love', 'inspired', 'relieved',
    'optimistic', 'confident', 'wonder', 'awe', 'transcendent',
    'enlightened', 'calm', 'serene', 'passionate',
  ];
  return positiveEmotions.includes(emotion);
}

/**
 * Get recommended quality based on device capabilities
 */
export function getRecommendedQuality(): string {
  if (typeof window === 'undefined') return 'medium';

  // Check for mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Check device memory (if available)
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const lowMemory = deviceMemory !== undefined && deviceMemory < 4;

  // Check hardware concurrency
  const lowCores = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency < 4;

  if (prefersReducedMotion || (isMobile && lowMemory)) {
    return 'low';
  }

  if (isMobile || lowMemory || lowCores) {
    return 'medium';
  }

  // Check for high-end indicators
  const highEnd = deviceMemory !== undefined && deviceMemory >= 8 && navigator.hardwareConcurrency >= 8;

  if (highEnd) {
    return 'ultra';
  }

  return 'high';
}

/**
 * Format boot phase duration for display
 */
export function formatPhaseDuration(milliseconds: number): string {
  if (milliseconds === 0) return 'User-driven';
  if (milliseconds < 1000) return `${milliseconds}ms`;
  return `${(milliseconds / 1000).toFixed(1)}s`;
}

/**
 * Lerp (linear interpolation) utility for smooth transitions
 */
export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

/**
 * Ease out cubic function for smooth animations
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease in out cubic function for smooth transitions
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
