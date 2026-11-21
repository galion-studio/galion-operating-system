/**
 * STARK HUB Audio System - Module Exports
 *
 * Complete audio system for the STARK HUB 3D workspace.
 * All audio is procedurally generated using Web Audio API.
 *
 * Modules:
 * - useStarkHubSounds: HUD sound effects (UI, movement, transitions)
 * - useSpatialAudio: 3D positional audio with camera listener
 * - useStarkHubAmbient: Background ambient soundscape
 *
 * "Audio systems integrated, sir."
 */

// ============================================================================
// HUD SOUND EFFECTS
// ============================================================================

export {
  useStarkHubSounds,
  default as useStarkHubSoundsDefault,
  type SoundType,
} from './useStarkHubSounds';

// ============================================================================
// 3D SPATIAL AUDIO
// ============================================================================

export {
  useSpatialAudio,
  default as useSpatialAudioDefault,
  STATION_POSITIONS,
  type SpatialSoundOptions,
  type SpatialSoundSource,
  type ProceduralSoundType,
} from './useSpatialAudio';

// ============================================================================
// AMBIENT SOUNDSCAPE
// ============================================================================

export {
  useStarkHubAmbient,
  default as useStarkHubAmbientDefault,
  type AmbientLayerConfig,
  type AmbientConfig,
  type AmbientState,
} from './useStarkHubAmbient';

// ============================================================================
// TYPE RE-EXPORTS FOR CONVENIENCE
// ============================================================================

// Sound configuration types
export type { SoundType as HUDSoundType } from './useStarkHubSounds';
export type { ProceduralSoundType as SpatialSoundType } from './useSpatialAudio';
export type { AmbientConfig as AmbientSoundConfig } from './useStarkHubAmbient';
