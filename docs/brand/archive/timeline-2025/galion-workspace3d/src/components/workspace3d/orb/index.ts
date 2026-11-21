/**
 * Orb V3 Components Index
 * 
 * Export all orb-related components for easy importing
 * Includes both GalionOrbV3 and JarvisOrb (alternative template)
 */

// Main components
export { GalionOrbV3, OrbPresets } from './GalionOrbV3';
export { MobileOrbV3 } from './MobileOrbV3';
export { GalionOSBoot } from './GalionOSBoot';

// Jarvis-style alternative orb
export { JarvisOrb } from './JarvisOrb';
export type { JarvisOrbProps } from './JarvisOrb';

// Iron Man (2008) Movie-Accurate Jarvis Hologram
export { IronManJarvisOrb } from './IronManJarvisOrb';
export type { IronManJarvisOrbProps } from './IronManJarvisOrb';
export { IronManJarvisOrbAdvanced } from './IronManJarvisOrbAdvanced';
export type { IronManJarvisOrbAdvancedProps } from './IronManJarvisOrbAdvanced';
export { IronManJarvisOrbMovieAccurate } from './IronManJarvisOrbMovieAccurate';
export type { IronManJarvisOrbMovieAccurateProps } from './IronManJarvisOrbMovieAccurate';

// Jarvis sub-components
export { JarvisOrbCore } from './JarvisOrbCore';
export { JarvisOrbRings } from './JarvisOrbRings';
export { JarvisOrbHUD } from './JarvisOrbHUD';
export { JarvisOrbMemories } from './JarvisOrbMemories';

// Advanced Jarvis implementations
export { JarvisNexusCore } from './JarvisNexusCore';
export type { JarvisNexusCoreProps } from './JarvisNexusCore';

// 2008 Movie-Accurate Iron Man Hologram
export { IronManJarvisHologram2008 } from './IronManJarvisHologram2008';
export { IronManJarvisHologram2008Simple } from './IronManJarvisHologram2008Simple';

// Marvel JARVIS effects
export { JarvisOrbScanLines } from './JarvisOrbScanLines';
export { JarvisNeuralNetwork } from './JarvisNeuralNetwork';
export { JarvisVoiceWaveform } from './JarvisVoiceWaveform';

// Visual layers
export { OrbShells } from './OrbShells';
export { OrbGlow } from './OrbGlow';
export { OrbParticles } from './OrbParticles';
export { OrbInnerUniverse } from './OrbInnerUniverse';
export { OrbNeuralNetwork } from './OrbNeuralNetwork';
export { OrbEnergyStreams } from './OrbEnergyStreams';
export { OrbGlassSurface } from './OrbGlassSurface';

// State and emotion systems
export { 
  ORB_STATES, 
  getStateConfig, 
  getTransition,
  interpolateStates,
  type OrbState,
  type OrbStateConfig,
} from './orbV3States';

export {
  EMOTION_PALETTES,
  getEmotionConfig,
  interpolateEmotions,
  getAllEmotions,
  getRandomEmotion,
  getEmotionGradient,
  getEmotionCSSGradient,
  type OrbEmotion,
  type EmotionConfig,
} from './orbV3Emotions';

// Jarvis state system
export {
  JARVIS_STATES,
  JARVIS_COLORS,
  getJarvisStateConfig,
  getJarvisTransition,
  interpolateJarvisStates,
  type JarvisState,
  type JarvisStateConfig,
} from './jarvisStates';

// Hooks
export {
  useOrbAnimations,
  useStateCycler,
  useEmotionCycler,
  useAudioSimulator,
  type UseOrbAnimationsOptions,
  type UseOrbAnimationsResult,
  type OrbAnimationState,
} from './useOrbAnimations';

// UI Controls
export { OrbDemoController } from './OrbDemoController';
export { OrbTouchControls, useTouchGestures } from './OrbTouchControls';

// Shaders
export {
  volumetricNebulaVertexShader,
  volumetricNebulaFragmentShader,
  coreGlowVertexShader,
  coreGlowFragmentShader,
  energyStreamVertexShader,
  energyStreamFragmentShader,
  synapsePulseVertexShader,
  synapsePulseFragmentShader,
  depthFogVertexShader,
  depthFogFragmentShader,
  createNebulaShaderMaterial,
  createCoreGlowShaderMaterial,
} from './orbDepthShaders';

