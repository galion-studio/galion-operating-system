// ═══════════════════════════════════════════════════════════════════
// UNIFIED BOOT SEQUENCE - TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Boot phases for first-time users
 */
export type BootPhase = 
  | 'void'           // Pure black, single light (0-2s)
  | 'birth'          // Spinner → Nebula → Orb (2-8s)
  | 'welcome'        // 3D scene + "Welcome to GALION Ecosystem" (8-14s)
  | 'voice-intro'    // Speaking orb (optional, 14-20s)
  | 'consent'        // Cookie/ToS/Mic flow (20-40s)
  | 'finalization'   // Final transition (40-45s)
  | 'complete';      // Done!

/**
 * Wake phases for returning users
 */
export type WakePhase =
  | 'wake'      // Wiggling lines (0-3s)
  | 'greeting'  // Welcome back text (3-6s)
  | 'orbing'    // Orb materialization (6-8s)
  | 'complete'; // Done!

/**
 * Combined phase type
 */
export type Phase = BootPhase | WakePhase;

/**
 * Phase completion callback
 */
export type PhaseCompleteCallback = () => void;

/**
 * Props for each phase component
 */
export interface PhaseProps {
  onComplete: PhaseCompleteCallback;
  onSkip?: () => void;
}

/**
 * Consent state
 */
export interface ConsentState {
  cookies: 'essential' | 'all' | null;
  termsAccepted: boolean;
  microphonePermission: 'granted' | 'denied' | null;
}

/**
 * Boot sequence timing (in seconds)
 */
export const TIMING = {
  // First-time user flow (60s total)
  VOID: 3,
  BIRTH: 8,
  WELCOME: 10,
  VOICE_INTRO: 6,
  CONSENT: 20,      // User-controlled
  FINALIZATION: 5,
  
  // Returning user flow (8s total)
  WAKE: 3,
  GREETING: 3,
  ORBING: 2,
} as const;

/**
 * V3 Color palette
 */
export const COLORS = {
  // Base
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  
  // Orb gradient (HDR)
  ORB_START: 'hsl(240, 100%, 70%)',    // Blue
  ORB_MIDDLE: 'hsl(280, 100%, 65%)',   // Purple
  ORB_END: 'hsl(180, 100%, 60%)',      // Cyan
  
  // Nebula
  NEBULA_DARK: 'hsl(250, 60%, 15%)',
  NEBULA_LIGHT: 'hsl(280, 70%, 25%)',
  
  // Lines (flowing)
  LINE_COLOR: 'rgba(255, 255, 255, 0.8)',
} as const;

/**
 * Animation easing
 */
export const EASING = {
  // Natural physics-based easing
  SPRING: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 15,
    mass: 1,
  },
  
  // Smooth cubic
  SMOOTH: [0.4, 0, 0.2, 1] as [number, number, number, number],
  
  // Organic entrance
  ENTRANCE: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  
  // Organic exit
  EXIT: [0.36, 0, 0.66, -0.56] as [number, number, number, number],
} as const;

/**
 * Z-index layers
 */
export const Z_INDEX = {
  BACKGROUND: 0,
  ORB: 10,
  PARTICLES: 5,
  TEXT: 20,
  SKIP_BUTTON: 30,
  CONSENT_CARDS: 25,
} as const;
