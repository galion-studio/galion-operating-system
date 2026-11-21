/**
 * Boot Animation Components
 * 
 * Premium, cinematic animations for first-time and returning users.
 * Each animation is carefully timed and polished for a 22nd century experience.
 * 
 * UNIFIED BOOT SEQUENCE (New): Complete, consolidated boot experience
 * GalionOSBoot: First-time visitor animation (~7.5 seconds) [LEGACY]
 * WakeUp: Returning user animation (~3.5 seconds) [LEGACY]
 * FirstInteractionCelebration: One-time celebration after first voice interaction
 * 
 * All components are wrapped in error boundaries for safe fallback
 */

// NEW: Unified Boot Sequence (replaces GalionOSBoot + WakeUp)
export { UnifiedBootSequence, hasCompletedBoot, getTimeSinceLastVisit } from './UnifiedBootSequence';
export type { BootPhase, WakePhase, Phase, PhaseProps, ConsentState } from './types';
export { TIMING, COLORS, EASING, Z_INDEX } from './types';

// LEGACY: Old boot components (kept for backwards compatibility)
export { GalionOSBoot } from './GalionOSBoot';
export type { GalionOSBootProps } from './GalionOSBoot';

export { WakeUp } from './WakeUp';
export type { WakeUpProps } from './WakeUp';

export { FirstInteractionCelebration } from './FirstInteractionCelebration';
export type { FirstInteractionCelebrationProps } from './FirstInteractionCelebration';

export { BootErrorBoundary } from './BootErrorBoundary';
