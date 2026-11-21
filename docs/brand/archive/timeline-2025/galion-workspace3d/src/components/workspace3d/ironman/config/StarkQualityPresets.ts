/**
 * STARK HUB - Quality Presets Configuration
 * 
 * 4-tier quality system that adapts to device capabilities:
 * - ULTRA: "STARK INDUSTRIES" - High-end gaming rigs
 * - HIGH: "AVENGERS READY" - Mid-range desktops/laptops
 * - MEDIUM: "FIELD READY" - Tablets, older laptops
 * - LIGHT: "POWER SAVE" - Old phones, low battery
 * 
 * "The suit adapts to the situation. So should the interface."
 */

// ============================================================================
// TYPES
// ============================================================================

export type StarkQualityTier = 'ultra' | 'high' | 'medium' | 'light';

export interface ParticleConfig {
  ambientCount: number;
  energyCount: number;
  maxSize: number;
  complexity: 'full' | 'reduced' | 'minimal';
}

export interface PostProcessingConfig {
  bloom: boolean;
  bloomIntensity: number;
  vignette: boolean;
  vignetteIntensity: number;
  chromaticAberration: boolean;
  chromaticIntensity: number;
  scanLines: boolean;
  scanLineIntensity: number;
  noise: boolean;
  noiseIntensity: number;
}

export interface ShadowConfig {
  enabled: boolean;
  mapSize: number;
  maxLights: number;
  softShadows: boolean;
}

export interface AnimationConfig {
  complexity: 'cinematic' | 'complex' | 'normal' | 'simple';
  rotationSpeed: number;
  transitionDuration: number;
  enablePhysics: boolean;
}

export interface HUDConfig {
  showAll: boolean;
  showStatus: boolean;
  showCompass: boolean;
  showMinimap: boolean;
  showVoiceWaveform: boolean;
  showDiagnostics: boolean;
  showTargetReticle: boolean;
  enableGlitchEffects: boolean;
  scanLinesOverlay: boolean;
}

export interface AudioConfig {
  enabled: boolean;
  spatialAudio: boolean;
  ambientSounds: boolean;
  uiSounds: boolean;
  defaultVolume: number;
}

export interface BootConfig {
  duration: number;
  style: 'cinematic' | 'enhanced' | 'standard' | 'quick';
  showDiagnostics: boolean;
  showLogo: boolean;
}

export interface PerformanceTargets {
  targetFPS: number;
  maxDrawCalls: number;
  maxTriangles: number;
  textureMemoryMB: number;
  jsHeapMB: number;
}

export interface StarkQualityPreset {
  tier: StarkQualityTier;
  name: string;
  tagline: string;
  particles: ParticleConfig;
  postProcessing: PostProcessingConfig;
  shadows: ShadowConfig;
  animations: AnimationConfig;
  hud: HUDConfig;
  audio: AudioConfig;
  boot: BootConfig;
  performance: PerformanceTargets;
}

// ============================================================================
// PRESET DEFINITIONS
// ============================================================================

export const STARK_QUALITY_PRESETS: Record<StarkQualityTier, StarkQualityPreset> = {
  ultra: {
    tier: 'ultra',
    name: 'STARK INDUSTRIES',
    tagline: 'Maximum Power',
    particles: {
      ambientCount: 8000,
      energyCount: 500,
      maxSize: 0.05,
      complexity: 'full',
    },
    postProcessing: {
      bloom: true,
      bloomIntensity: 1.5,
      vignette: true,
      vignetteIntensity: 0.4,
      chromaticAberration: true,
      chromaticIntensity: 0.003,
      scanLines: true,
      scanLineIntensity: 0.08,
      noise: true,
      noiseIntensity: 0.02,
    },
    shadows: {
      enabled: true,
      mapSize: 2048,
      maxLights: 12,
      softShadows: true,
    },
    animations: {
      complexity: 'cinematic',
      rotationSpeed: 1.0,
      transitionDuration: 0.5,
      enablePhysics: true,
    },
    hud: {
      showAll: true,
      showStatus: true,
      showCompass: true,
      showMinimap: true,
      showVoiceWaveform: true,
      showDiagnostics: true,
      showTargetReticle: true,
      enableGlitchEffects: true,
      scanLinesOverlay: true,
    },
    audio: {
      enabled: true,
      spatialAudio: true,
      ambientSounds: true,
      uiSounds: true,
      defaultVolume: 0.5,
    },
    boot: {
      duration: 5000,
      style: 'cinematic',
      showDiagnostics: true,
      showLogo: true,
    },
    performance: {
      targetFPS: 60,
      maxDrawCalls: 500,
      maxTriangles: 1000000,
      textureMemoryMB: 512,
      jsHeapMB: 200,
    },
  },

  high: {
    tier: 'high',
    name: 'AVENGERS READY',
    tagline: 'Battle Ready',
    particles: {
      ambientCount: 3000,
      energyCount: 200,
      maxSize: 0.04,
      complexity: 'full',
    },
    postProcessing: {
      bloom: true,
      bloomIntensity: 1.2,
      vignette: true,
      vignetteIntensity: 0.3,
      chromaticAberration: false,
      chromaticIntensity: 0,
      scanLines: true,
      scanLineIntensity: 0.05,
      noise: false,
      noiseIntensity: 0,
    },
    shadows: {
      enabled: true,
      mapSize: 1024,
      maxLights: 8,
      softShadows: false,
    },
    animations: {
      complexity: 'complex',
      rotationSpeed: 1.0,
      transitionDuration: 0.4,
      enablePhysics: true,
    },
    hud: {
      showAll: true,
      showStatus: true,
      showCompass: true,
      showMinimap: true,
      showVoiceWaveform: true,
      showDiagnostics: true,
      showTargetReticle: true,
      enableGlitchEffects: false,
      scanLinesOverlay: true,
    },
    audio: {
      enabled: true,
      spatialAudio: false,
      ambientSounds: true,
      uiSounds: true,
      defaultVolume: 0.5,
    },
    boot: {
      duration: 4000,
      style: 'enhanced',
      showDiagnostics: true,
      showLogo: true,
    },
    performance: {
      targetFPS: 60,
      maxDrawCalls: 300,
      maxTriangles: 500000,
      textureMemoryMB: 256,
      jsHeapMB: 150,
    },
  },

  medium: {
    tier: 'medium',
    name: 'FIELD READY',
    tagline: 'Efficient Mode',
    particles: {
      ambientCount: 1000,
      energyCount: 100,
      maxSize: 0.03,
      complexity: 'reduced',
    },
    postProcessing: {
      bloom: true,
      bloomIntensity: 0.8,
      vignette: false,
      vignetteIntensity: 0,
      chromaticAberration: false,
      chromaticIntensity: 0,
      scanLines: false,
      scanLineIntensity: 0,
      noise: false,
      noiseIntensity: 0,
    },
    shadows: {
      enabled: false,
      mapSize: 512,
      maxLights: 4,
      softShadows: false,
    },
    animations: {
      complexity: 'normal',
      rotationSpeed: 0.8,
      transitionDuration: 0.3,
      enablePhysics: false,
    },
    hud: {
      showAll: false,
      showStatus: true,
      showCompass: true,
      showMinimap: false,
      showVoiceWaveform: true,
      showDiagnostics: false,
      showTargetReticle: true,
      enableGlitchEffects: false,
      scanLinesOverlay: false,
    },
    audio: {
      enabled: true,
      spatialAudio: false,
      ambientSounds: false,
      uiSounds: true,
      defaultVolume: 0.4,
    },
    boot: {
      duration: 3000,
      style: 'standard',
      showDiagnostics: false,
      showLogo: true,
    },
    performance: {
      targetFPS: 60,
      maxDrawCalls: 150,
      maxTriangles: 200000,
      textureMemoryMB: 128,
      jsHeapMB: 100,
    },
  },

  light: {
    tier: 'light',
    name: 'POWER SAVE',
    tagline: 'Essential Mode',
    particles: {
      ambientCount: 200,
      energyCount: 30,
      maxSize: 0.02,
      complexity: 'minimal',
    },
    postProcessing: {
      bloom: false,
      bloomIntensity: 0,
      vignette: false,
      vignetteIntensity: 0,
      chromaticAberration: false,
      chromaticIntensity: 0,
      scanLines: false,
      scanLineIntensity: 0,
      noise: false,
      noiseIntensity: 0,
    },
    shadows: {
      enabled: false,
      mapSize: 256,
      maxLights: 2,
      softShadows: false,
    },
    animations: {
      complexity: 'simple',
      rotationSpeed: 0.5,
      transitionDuration: 0.2,
      enablePhysics: false,
    },
    hud: {
      showAll: false,
      showStatus: true,
      showCompass: false,
      showMinimap: false,
      showVoiceWaveform: true,
      showDiagnostics: false,
      showTargetReticle: false,
      enableGlitchEffects: false,
      scanLinesOverlay: false,
    },
    audio: {
      enabled: true,
      spatialAudio: false,
      ambientSounds: false,
      uiSounds: true,
      defaultVolume: 0.3,
    },
    boot: {
      duration: 2000,
      style: 'quick',
      showDiagnostics: false,
      showLogo: false,
    },
    performance: {
      targetFPS: 30,
      maxDrawCalls: 75,
      maxTriangles: 50000,
      textureMemoryMB: 64,
      jsHeapMB: 50,
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get preset by tier
 */
export function getPreset(tier: StarkQualityTier): StarkQualityPreset {
  return STARK_QUALITY_PRESETS[tier];
}

/**
 * Get the next tier up (for upgrade)
 */
export function getNextTierUp(current: StarkQualityTier): StarkQualityTier | null {
  const order: StarkQualityTier[] = ['light', 'medium', 'high', 'ultra'];
  const currentIndex = order.indexOf(current);
  return currentIndex < order.length - 1 ? order[currentIndex + 1] : null;
}

/**
 * Get the next tier down (for downgrade)
 */
export function getNextTierDown(current: StarkQualityTier): StarkQualityTier | null {
  const order: StarkQualityTier[] = ['light', 'medium', 'high', 'ultra'];
  const currentIndex = order.indexOf(current);
  return currentIndex > 0 ? order[currentIndex - 1] : null;
}

/**
 * Get all tiers in order (lowest to highest)
 */
export function getAllTiers(): StarkQualityTier[] {
  return ['light', 'medium', 'high', 'ultra'];
}

/**
 * Compare tiers (returns -1, 0, or 1)
 */
export function compareTiers(a: StarkQualityTier, b: StarkQualityTier): number {
  const order: StarkQualityTier[] = ['light', 'medium', 'high', 'ultra'];
  return order.indexOf(a) - order.indexOf(b);
}

// ============================================================================
// FEATURE UTILITY FUNCTIONS
// ============================================================================

export type FeatureName = 
  | 'bloom' 
  | 'shadows' 
  | 'particles' 
  | 'holographicDistortion'
  | 'scanLines'
  | 'chromaticAberration'
  | 'softShadows'
  | 'physics'
  | 'audio'
  | 'spatialAudio';

/**
 * Check if a feature is enabled at a given tier
 */
export function getFeatureEnabled(tier: StarkQualityTier, feature: FeatureName): boolean {
  const preset = STARK_QUALITY_PRESETS[tier];
  
  switch (feature) {
    case 'bloom':
      return preset.postProcessing.bloom;
    case 'shadows':
      return preset.shadows.enabled;
    case 'particles':
      return preset.particles.ambientCount > 0;
    case 'holographicDistortion':
      return tier === 'ultra' || tier === 'high';
    case 'scanLines':
      return preset.postProcessing.scanLines;
    case 'chromaticAberration':
      return preset.postProcessing.chromaticAberration;
    case 'softShadows':
      return preset.shadows.softShadows;
    case 'physics':
      return preset.animations.enablePhysics;
    case 'audio':
      return preset.audio.enabled;
    case 'spatialAudio':
      return preset.audio.spatialAudio;
    default:
      return false;
  }
}

/**
 * Get a feature value using a selector function
 */
export function getFeatureValue<T>(
  tier: StarkQualityTier, 
  selector: (preset: StarkQualityPreset) => T
): T {
  const preset = STARK_QUALITY_PRESETS[tier];
  return selector(preset);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default STARK_QUALITY_PRESETS;
