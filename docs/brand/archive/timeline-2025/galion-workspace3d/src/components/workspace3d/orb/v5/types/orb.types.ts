/**
 * GALION Orb V5.2 - Core Type Definitions
 *
 * Complete type system for the living digital consciousness orb
 */

import * as THREE from "three";

// ============================================================================
// STATES - 25 Behavioral States
// ============================================================================

/** Core States (10) - Primary operational modes */
export type CoreState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "processing"
  | "waiting"
  | "ready"
  | "busy"
  | "paused"
  | "sleeping";

/** Activity States (8) - Task-specific behaviors */
export type ActivityState =
  | "searching"
  | "creating"
  | "analyzing"
  | "learning"
  | "connecting"
  | "downloading"
  | "uploading"
  | "computing";

/** Status States (7) - System status indicators */
export type StatusState =
  | "success"
  | "error"
  | "warning"
  | "updating"
  | "rebooting"
  | "emergency"
  | "transcending";

/** All 25 states combined */
export type OrbState = CoreState | ActivityState | StatusState;

// ============================================================================
// STATE CONFIGURATION
// ============================================================================

export interface OrbStateVisual {
  /** Glow intensity (0-1) */
  glowIntensity: number;
  /** Pulse rate in seconds */
  pulseRate: number;
  /** Particle speed multiplier */
  particleSpeed: number;
  /** Neural network activity (0-1) */
  neuralActivity: number;
  /** Breathing animation depth */
  breathingDepth?: number;
  /** Expansion factor for size */
  expansionFactor?: number;
  /** Thought stream intensity for thinking state */
  thoughtStreamIntensity?: number;
}

export interface OrbStateConfig {
  /** State identifier */
  id: OrbState;
  /** Display name */
  name: string;
  /** State description */
  description: string;
  /** Visual parameters */
  visual: OrbStateVisual;
  /** Primary animation to use */
  animation: string;
  /** Primary color (hex) */
  color?: string;
  /** Whether state responds to audio */
  audioReactive?: boolean;
  /** Energy level (0-1) */
  energy?: number;
  /** Valid transitions from this state */
  transitions?: OrbState[];
}

export interface StateTransitionConfig {
  /** Transition duration in ms */
  duration: number;
  /** Easing function */
  easing: "linear" | "easeIn" | "easeOut" | "easeInOut" | "spring" | "bounce";
  /** Whether to use crossfade blending */
  crossfade?: boolean;
  /** Crossfade overlap duration in ms */
  crossfadeDuration?: number;
}

// ============================================================================
// QUALITY SETTINGS
// ============================================================================

export type QualityLevel =
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "ultra"
  | "auto";

export interface QualityConfig {
  /** Device pixel ratio */
  pixelRatio: number;
  /** Anti-aliasing mode */
  antialiasing: "none" | "msaa" | "fxaa" | "smaa";
  /** Enable bloom post-processing */
  bloomEnabled: boolean;
  /** Bloom effect intensity */
  bloomIntensity: number;
  /** Bloom mipmap levels */
  bloomLevels: number;
  /** Show geometric shells */
  showShells: boolean;
  /** Number of shell layers */
  shellCount: number;
  /** Show particle effects */
  showParticles: boolean;
  /** Particle count multiplier */
  particleMultiplier: number;
  /** Show energy streams */
  showEnergy: boolean;
  /** Energy stream count */
  energyStreamCount: number;
  /** Show neural network */
  showNeural: boolean;
  /** Neural node count */
  neuralNodeCount: number;
  /** Enable shadows */
  shadowsEnabled: boolean;
  /** Shadow map size */
  shadowMapSize: number;
  /** Enable ambient occlusion */
  aoEnabled: boolean;
  /** Target FPS */
  targetFPS: number;
}

// ============================================================================
// ANIMATION TYPES
// ============================================================================

export type AnimationCategory =
  | "idle"
  | "reactive"
  | "transition"
  | "voice"
  | "special"
  | "emotion";

export interface AnimationKeyframe {
  /** Time in animation (0-1) */
  time: number;
  /** Property values at this keyframe */
  values: Record<string, number | THREE.Vector3 | THREE.Color>;
  /** Easing to next keyframe */
  easing?: string;
}

export interface OrbAnimationConfig {
  /** Animation identifier */
  id: string;
  /** Display name */
  name: string;
  /** Animation category */
  category: AnimationCategory;
  /** Duration in milliseconds */
  duration: number;
  /** Whether animation loops */
  loop: boolean;
  /** Keyframes */
  keyframes: AnimationKeyframe[];
  /** Blend mode when combining with other animations */
  blendMode?: "replace" | "additive" | "multiply";
  /** Priority (higher = plays over lower) */
  priority?: number;
}

// ============================================================================
// LAYER SYSTEM
// ============================================================================

/** 12 Depth Layers for the orb */
export type DepthLayer =
  | "L00_crystal_surface"
  | "L01_quantum_singularity"
  | "L02_plasma_core"
  | "L03_neural_network"
  | "L04_holographic_rings"
  | "L05_aurora_effect"
  | "L06_data_streams"
  | "L07_memory_particles"
  | "L08_energy_grid"
  | "L09_star_field"
  | "L10_nebula_atmosphere"
  | "L11_cosmic_background"
  | "L12_dimensional_membrane";

export interface LayerConfig {
  /** Layer identifier */
  id: DepthLayer;
  /** Render order (higher = rendered later/on top) */
  renderOrder: number;
  /** Layer opacity (0-1) */
  opacity: number;
  /** Whether layer is currently visible */
  visible: boolean;
  /** Blend mode */
  blendMode: THREE.Blending;
  /** Depth from center (for positioning) */
  depth: number;
}

// ============================================================================
// AUDIO REACTIVITY
// ============================================================================

export interface AudioAnalysis {
  /** Overall volume level (0-1) */
  volume: number;
  /** Frequency bands */
  frequencies: {
    bass: number;
    mid: number;
    treble: number;
  };
  /** Beat detection */
  beat: {
    detected: boolean;
    strength: number;
    bpm: number;
  };
  /** Speech detection */
  isSpeaking: boolean;
  /** Voice pitch (Hz) */
  pitch: number;
}

export interface AudioReactiveConfig {
  /** Enable audio reactivity */
  enabled: boolean;
  /** Sensitivity multiplier */
  sensitivity: number;
  /** Smoothing factor (0-1, higher = smoother) */
  smoothing: number;
  /** Response properties */
  response: {
    /** Scale orb with volume */
    scaleWithVolume: boolean;
    /** Maximum scale factor */
    maxScale: number;
    /** Glow with bass */
    glowWithBass: boolean;
    /** Particle speed with energy */
    particlesWithEnergy: boolean;
  };
}

// ============================================================================
// MAIN COMPONENT PROPS
// ============================================================================

export interface GalionOrbV5Props {
  /** Initial emotional state */
  initialEmotion?: string;
  /** Controlled emotional state - use this for dynamic updates */
  emotion?: string;
  /** Initial behavioral state */
  initialState?: OrbState;
  /** Controlled behavioral state - use this for dynamic updates */
  state?: OrbState;
  /** Quality preset or 'auto' for adaptive */
  quality?: QualityLevel;
  /** Enable audio reactivity */
  audioEnabled?: boolean;
  /** Custom audio source */
  audioSource?: MediaStream | AudioNode;
  /**
   * External audio level for visualization (0-1)
   * Connect this to useStreamingAudioPlayback or audio analyzer output
   * The orb will pulse and glow based on this value
   */
  audioLevel?: number;
  /** Called when state changes */
  onStateChange?: (state: OrbState) => void;
  /** Called when emotion changes */
  onEmotionChange?: (emotion: string) => void;
  /** Called on click */
  onClick?: () => void;
  /** Position in 3D space */
  position?: [number, number, number];
  /** Base size of the orb */
  size?: number;
  /** Custom className */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Children (overlay content) */
  children?: React.ReactNode;
  /** Enable debug mode */
  debug?: boolean;
}

// ============================================================================
// HOOKS RETURN TYPES
// ============================================================================

export interface UseOrbStateReturn {
  /** Current state */
  state: OrbState;
  /** Previous state */
  previousState: OrbState | null;
  /** State configuration */
  stateConfig: OrbStateConfig;
  /** Set new state with transition */
  setState: (state: OrbState) => void;
  /** Whether currently transitioning */
  isTransitioning: boolean;
  /** Transition progress (0-1) */
  transitionProgress: number;
}

export interface UseOrbAnimationReturn {
  /** Currently playing animation */
  currentAnimation: string | null;
  /** Animation progress (0-1) */
  progress: number;
  /** Play animation by name */
  play: (animationId: string) => void;
  /** Stop current animation */
  stop: () => void;
  /** Pause animation */
  pause: () => void;
  /** Resume paused animation */
  resume: () => void;
  /** Whether animation is playing */
  isPlaying: boolean;
}

export interface UseOrbAudioReturn {
  /** Current audio analysis */
  analysis: AudioAnalysis;
  /** Whether audio is enabled */
  enabled: boolean;
  /** Enable/disable audio */
  setEnabled: (enabled: boolean) => void;
  /** Set audio source */
  setSource: (source: MediaStream | AudioNode) => void;
}

// ============================================================================
// SHADER UNIFORMS
// ============================================================================

export interface OrbShaderUniforms {
  uTime: { value: number };
  uState: { value: number };
  uEmotionPrimary: { value: THREE.Color };
  uEmotionSecondary: { value: THREE.Color };
  uEmotionBlend: { value: number };
  uGlowIntensity: { value: number };
  uPulsePhase: { value: number };
  uAudioLevel: { value: number };
  uResolution: { value: THREE.Vector2 };
}
