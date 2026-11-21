/**
 * GALION Orb V7.2 - Component Exports
 *
 * All modular 3D components for the enhanced orb.
 * Use these for custom compositions or standalone usage.
 *
 * @version 7.2.1
 */

// Core Components
export { OrbPlasmaCore } from './core/OrbPlasmaCore';
export { OrbGlassSurface } from './core/OrbGlassSurface';

// Effect Components
export { OrbParticleField } from './effects/OrbParticleField';
export { OrbEnergyRings } from './effects/OrbEnergyRings';
export { OrbLightningTendrils } from './effects/OrbLightningTendrils';

// Background Components
export { CosmicBackground } from './background/CosmicBackground';

// Enhanced Orchestrator
export { GalionOrbV7Enhanced } from './GalionOrbV7Enhanced';

// Types
export type {
  OrbV7State,
  OrbV7Emotion,
  AudioData,
  EmotionColorPalette,
  GalionOrbV7Props,
  OrbSceneRefs,
  PlasmaUniforms,
  GlassUniforms,
  ParticleUniforms,
  RingUniforms,
} from './types';

export {
  EMOTION_PALETTES,
  getEmotionPalette,
  lerpColor,
} from './types';
