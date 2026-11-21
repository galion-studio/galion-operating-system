// =====================================================================
// BOOT SEQUENCE - Type Definitions
// =====================================================================
// Simple, clean types for organic boot experience
// =====================================================================

/**
 * Boot phases for first-time users
 */
export type BootPhase =
  | 'void'        // Darkness with light
  | 'galionboot'  // GalionOS boot sequence
  | 'birth'       // Orb emerging
  | 'consent'     // Welcome, terms, microphone
  | 'complete';

/**
 * Wake phases for returning users
 */
export type WakePhase =
  | 'wake'      // Gentle wake
  | 'greeting'  // Welcome back
  | 'orbing'    // Orb appears
  | 'complete';

/**
 * Combined phase type
 */
export type Phase = BootPhase | WakePhase;

/**
 * Phase completion callback
 */
export type PhaseCompleteCallback = () => void;

/**
 * Props for phase components
 */
export interface PhaseProps {
  onComplete: PhaseCompleteCallback;
  onSkip?: () => void;
}

/**
 * HDR Color palette - organic, warm colors
 */
export const COLORS = {
  // Base
  BLACK: '#000000',
  WHITE: '#FFFFFF',

  // Cyan family
  CYAN: '#06b6d4',
  CYAN_GLOW: 'rgba(6, 182, 212, 0.4)',

  // Purple family
  PURPLE: '#8b5cf6',
  PURPLE_GLOW: 'rgba(139, 92, 246, 0.3)',

  // Blue family
  BLUE: '#3b82f6',
  BLUE_GLOW: 'rgba(59, 130, 246, 0.3)',

  // Indigo family
  INDIGO: '#6366f1',
  INDIGO_GLOW: 'rgba(99, 102, 241, 0.3)',
} as const;

/**
 * Animation easing
 */
export const EASING = {
  // Smooth organic
  SMOOTH: [0.4, 0, 0.2, 1] as [number, number, number, number],

  // Gentle entrance
  ENTRANCE: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],

  // Spring-like
  SPRING: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 15,
  },
} as const;

/**
 * Z-index layers
 */
export const Z_INDEX = {
  BACKGROUND: 0,
  ORB: 10,
  TEXT: 20,
  SKIP_BUTTON: 30,
  CONSENT_CARDS: 25,
} as const;

/**
 * Timing constants (seconds)
 */
export const TIMING = {
  VOID: 2.5,
  BIRTH: 5.5,
  WAKE: 2,
  GREETING: 2,
  ORBING: 2,
} as const;
