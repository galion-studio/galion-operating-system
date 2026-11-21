/**
 * GALION Orb V5.2 - Main Exports
 *
 * Complete AI presence orb visualization system
 */

// Main Component
export { GalionOrbV5 } from "./GalionOrbV5";
export type { GalionOrbV5Controls } from "./GalionOrbV5";
// Re-export as default for backwards compatibility
import { GalionOrbV5 as GalionOrbV5Component } from "./GalionOrbV5";
export default GalionOrbV5Component;

// Types
export type {
  GalionOrbV5Props,
  OrbShaderUniforms,
  OrbState,
  QualityConfig,
  QualityLevel,
  UseOrbAnimationReturn,
  UseOrbEmotionReturn,
  UseOrbStateReturn,
} from "./types";

export type {
  BlendedEmotionResult,
  ComplexEmotion,
  Emotion,
  EmotionBlendState,
  EmotionConfig,
  EmotionTier,
  PrimaryEmotion,
  SecondaryEmotion,
  TranscendentEmotion,
} from "./types/emotion.types";

// Hooks
export { useOrbAnimation } from "./hooks/useOrbAnimation";
export { useOrbAudio } from "./hooks/useOrbAudio";
export type {
  AudioAnalysis,
  UseOrbAudioReturn,
  VoiceActivity,
} from "./hooks/useOrbAudio";
export { useOrbEmotion } from "./hooks/useOrbEmotion";
export { useOrbPerformance } from "./hooks/useOrbPerformance";
export { useOrbState } from "./hooks/useOrbState";

// Configuration
export {
  getStateConfig,
  getStateTransition,
  isValidTransition,
  STATE_CONFIGS,
} from "./config/states";

export {
  blendEmotionConfigs,
  EMOTION_CONFIGS,
  getEmotionConfig,
  getEmotionsByTier,
} from "./config/emotions";

export {
  detectDeviceCapability,
  getQualityConfig,
  QUALITY_PRESETS,
} from "./config/presets";

// Core Components (for advanced customization)
export { OrbCore } from "./core/OrbCore";
export { OrbGlow } from "./core/OrbGlow";
export { OrbNebula } from "./core/OrbNebula";
export { OrbSurface } from "./core/OrbSurface";

// Effect Components (for advanced customization)
export { OrbAurora } from "./effects/OrbAurora";
export { OrbEnergy } from "./effects/OrbEnergy";
export { OrbFlame } from "./effects/OrbFlame";
export { OrbNeural } from "./effects/OrbNeural";
export { OrbParticles } from "./effects/OrbParticles";
export { OrbShells } from "./effects/OrbShells";

// Background Components
export { OrbCosmicNebula } from "./background/OrbCosmicNebula";
export { OrbStarField } from "./background/OrbStarField";

// UI Components
export { EmotionVisualModal } from "./ui/EmotionVisualModal";

// Transitions
export {
  EASING,
  lerpColorLAB,
  TRANSITION_PRESETS,
  TransitionManager,
  useTransitionManager,
  type TransitionPhase,
  type TransitionPreset,
  type TransitionState,
} from "./transitions";
