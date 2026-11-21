/**
 * GALION Orb V6 - Type Definitions
 *
 * Clean, simple types for the V6 orb system.
 * Designed for clarity and ease of use.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

export type OrbState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'processing';

export type OrbEmotion =
  | 'neutral' | 'happy' | 'sad' | 'calm' | 'excited'
  | 'curious' | 'focused' | 'peaceful' | 'love' | 'wonder'
  | 'determined' | 'empathetic' | 'inspired' | 'transcendent';

export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';

// =============================================================================
// COLOR CONFIGURATION
// =============================================================================

export interface OrbColors {
  primary: string;      // Main orb color
  secondary: string;    // Secondary/accent color
  glow: string;         // Outer glow color
  core: string;         // Inner core color
  particles: string;    // Particle color
}

// =============================================================================
// EMOTION CONFIGURATION
// =============================================================================

export interface EmotionConfig {
  id: OrbEmotion;
  name: string;
  colors: OrbColors;
  energy: number;           // 0-1, affects animation intensity
  particleSpeed: number;    // Particle movement speed
  particleCount: number;    // Number of particles
  glowIntensity: number;    // Glow brightness
  pulseRate: number;        // Breathing animation speed
}

// =============================================================================
// STATE CONFIGURATION
// =============================================================================

export interface StateConfig {
  id: OrbState;
  scaleMultiplier: number;  // Base scale adjustment
  pulseIntensity: number;   // How much it pulses
  rotationSpeed: number;    // Neural network rotation
  particleActivity: number; // Particle system activity
}

// =============================================================================
// QUALITY CONFIGURATION
// =============================================================================

export interface QualityConfig {
  particleCount: number;
  neuralNodes: number;
  neuralConnections: number;
  starCount: number;
  enableAurora: boolean;
  enableEnergy: boolean;
  enableNeural: boolean;
  enableParticles: boolean;
  enableStars: boolean;
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

export interface GalionOrbV6Props {
  /** Current emotional state */
  emotion?: OrbEmotion;
  /** Current behavioral state */
  state?: OrbState;
  /** Audio level for reactivity (0-1) */
  audioLevel?: number;
  /** Quality setting */
  quality?: QualityLevel;
  /** Size multiplier */
  size?: number;
  /** Click handler */
  onClick?: () => void;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Debug mode */
  debug?: boolean;
}

// =============================================================================
// INTERNAL PROPS (for sub-components)
// =============================================================================

export interface OrbLayerProps {
  emotion: OrbEmotion;
  state: OrbState;
  audioLevel: number;
  colors: OrbColors;
  time: number;
}
