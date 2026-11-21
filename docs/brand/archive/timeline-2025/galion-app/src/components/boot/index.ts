/**
 * Boot Animation Components
 *
 * Premium, cinematic animations for first-time and returning users.
 * Each animation is carefully timed and polished for a 22nd century experience.
 *
 * RECOMMENDED: GalionUltimateBoot - MD2026 spec with consent + birth + premium orb
 * V7.2: GalionOrbV7 - Epic 50-emotion orb with 8K shaders (cosmic style)
 * Birth of a Star - Cosmic cinematic intro with sacred geometry
 * UNIFIED BOOT SEQUENCE: Complete, consolidated boot experience
 * GalionOSBoot: First-time visitor animation (~7.5 seconds) [LEGACY]
 * WakeUp: Returning user animation (~3.5 seconds) [LEGACY]
 * FirstInteractionCelebration: One-time celebration after first voice interaction
 *
 * All components are wrapped in error boundaries for safe fallback
 */

// RECOMMENDED: MD2026 Ultimate Boot - Consent + Birth + Premium Blue Orb
export { GalionUltimateBoot, hasCompletedUltimateBoot, resetUltimateBoot } from './GalionUltimateBoot';
export type { GalionUltimateBootProps, UltimateBootPhase } from './GalionUltimateBoot';

// V7.2: Epic Orb with 50 emotions and cinematic boot sequence
export { GalionOSBootV7, GalionOrbV7 } from './orb-v7';
export type { GalionOSBootV7Props, BootPhase as BootPhaseV7 } from './orb-v7';

// NEW: Welcome Questions - Deep personalization flow inspired by "Her"
export { WelcomeQuestions } from './WelcomeQuestions';
export type {
  WelcomeQuestionsProps,
  WelcomeQuestionsResult,
  WelcomeAnswer,
  VoicePersona
} from './WelcomeQuestions';

// NEW: Birth of a Star - Premium cosmic boot animation
export { BirthOfAStar } from './BirthOfAStar';
export type { BirthOfAStarProps } from './BirthOfAStar';

// NEW: Galion OS Boot V3 - Clean branded boot with Galion OS text
export { GalionOSBootV3 } from './GalionOSBootV3';
export type { GalionOSBootV3Props } from './GalionOSBootV3';

// NEW: Ultra-fast beta boot screen
export { GalionOSBootV2 } from './GalionOSBootV2';

// NEW: Unified Boot Sequence (replaces GalionOSBoot + WakeUp)
export { UnifiedBootSequence, hasCompletedBoot, getTimeSinceLastVisit } from './UnifiedBootSequence';
export type { BootPhase, WakePhase, Phase, PhaseProps, ConsentState } from './types';
export { TIMING, COLORS, EASING, Z_INDEX } from './types';

// LEGACY: Old boot components (kept for backwards compatibility)
export { GalionOSBoot } from './GalionOSBoot';
export type { GalionOSBootProps } from './GalionOSBoot';

// Enhanced boot animation
export { EnhancedGalionOSBoot } from './EnhancedGalionOSBoot';
export type { EnhancedGalionOSBootProps } from './EnhancedGalionOSBoot';

export { WakeUp } from './WakeUp';
export type { WakeUpProps } from './WakeUp';

export { FirstInteractionCelebration } from './FirstInteractionCelebration';
export type { FirstInteractionCelebrationProps } from './FirstInteractionCelebration';

export { BootErrorBoundary } from './BootErrorBoundary';
