/**
 * GALION Orb V6 - Exports
 *
 * The complete 3D orb system for Galion.app
 */

// Main component
export { GalionOrbV6, default } from './GalionOrbV6';

// Controller (drop-in replacement for old OrbController)
export { OrbControllerV6 } from './OrbControllerV6';
export type {
  OrbControllerV6Props,
  EmotionType,
  OrbState as LegacyOrbState,
  OrbCustomColors,
} from './OrbControllerV6';

// Sub-components (for custom compositions)
export { OrbCore } from './OrbCore';
export { OrbGlow } from './OrbGlow';
export { OrbNeural } from './OrbNeural';
export { OrbParticles } from './OrbParticles';
export { OrbEnergy } from './OrbEnergy';
export { OrbAurora } from './OrbAurora';
export { OrbStarField } from './OrbStarField';

// Types
export type {
  OrbState,
  OrbEmotion,
  QualityLevel,
  OrbColors,
  EmotionConfig,
  StateConfig,
  QualityConfig,
  GalionOrbV6Props,
} from './types';

// Configuration
export {
  EMOTION_CONFIGS,
  STATE_CONFIGS,
  QUALITY_CONFIGS,
  getEmotionConfig,
  getStateConfig,
  getQualityConfig,
  getColors,
} from './config';
