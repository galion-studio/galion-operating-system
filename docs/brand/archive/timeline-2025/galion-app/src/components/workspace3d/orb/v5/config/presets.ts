/**
 * GALION Orb V5.2 - Quality Presets
 * 
 * Performance configurations for different device capabilities
 */

import { QualityConfig, QualityLevel } from '../types';

// ============================================================================
// QUALITY PRESETS
// ============================================================================

export const QUALITY_PRESETS: Record<QualityLevel, QualityConfig> = {
  minimal: {
    pixelRatio: 1,
    antialiasing: 'none',
    bloomEnabled: false,
    bloomIntensity: 0,
    bloomLevels: 0,
    showShells: false,
    shellCount: 0,
    showParticles: false,
    particleMultiplier: 0,
    showEnergy: false,
    energyStreamCount: 0,
    showNeural: false,
    neuralNodeCount: 0,
    shadowsEnabled: false,
    shadowMapSize: 0,
    aoEnabled: false,
    targetFPS: 30,
  },

  low: {
    pixelRatio: 1,
    antialiasing: 'fxaa',
    bloomEnabled: true,
    bloomIntensity: 0.3,
    bloomLevels: 3,
    showShells: true,
    shellCount: 2,
    showParticles: true,
    particleMultiplier: 0.3,
    showEnergy: false,
    energyStreamCount: 0,
    showNeural: false,
    neuralNodeCount: 0,
    shadowsEnabled: false,
    shadowMapSize: 512,
    aoEnabled: false,
    targetFPS: 30,
  },

  medium: {
    pixelRatio: 1.5,
    antialiasing: 'fxaa',
    bloomEnabled: true,
    bloomIntensity: 0.5,
    bloomLevels: 5,
    showShells: true,
    shellCount: 4,
    showParticles: true,
    particleMultiplier: 0.6,
    showEnergy: true,
    energyStreamCount: 4,
    showNeural: true,
    neuralNodeCount: 20,
    shadowsEnabled: false,
    shadowMapSize: 1024,
    aoEnabled: false,
    targetFPS: 45,
  },

  high: {
    pixelRatio: 2,
    antialiasing: 'smaa',
    bloomEnabled: true,
    bloomIntensity: 0.7,
    bloomLevels: 6,
    showShells: true,
    shellCount: 6,
    showParticles: true,
    particleMultiplier: 1.0,
    showEnergy: true,
    energyStreamCount: 8,
    showNeural: true,
    neuralNodeCount: 40,
    shadowsEnabled: true,
    shadowMapSize: 2048,
    aoEnabled: false,
    targetFPS: 60,
  },

  ultra: {
    pixelRatio: 2,
    antialiasing: 'smaa',
    bloomEnabled: true,
    bloomIntensity: 1.0,
    bloomLevels: 8,
    showShells: true,
    shellCount: 8,
    showParticles: true,
    particleMultiplier: 1.5,
    showEnergy: true,
    energyStreamCount: 12,
    showNeural: true,
    neuralNodeCount: 60,
    shadowsEnabled: true,
    shadowMapSize: 4096,
    aoEnabled: true,
    targetFPS: 60,
  },

  auto: {
    // Will be dynamically set based on device capabilities
    pixelRatio: 1.5,
    antialiasing: 'fxaa',
    bloomEnabled: true,
    bloomIntensity: 0.5,
    bloomLevels: 5,
    showShells: true,
    shellCount: 4,
    showParticles: true,
    particleMultiplier: 0.6,
    showEnergy: true,
    energyStreamCount: 4,
    showNeural: true,
    neuralNodeCount: 20,
    shadowsEnabled: false,
    shadowMapSize: 1024,
    aoEnabled: false,
    targetFPS: 60,
  },
};

// ============================================================================
// MOBILE DETECTION
// ============================================================================

export function detectDeviceCapability(): QualityLevel {
  if (typeof window === 'undefined') return 'medium';
  
  // Check if mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  // Check GPU info if available
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (gl && gl instanceof WebGLRenderingContext) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      // High-end GPUs
      if (/RTX|Radeon RX|GeForce GTX 10|GeForce GTX 16|Apple M[1-3]/i.test(renderer)) {
        return isMobile ? 'high' : 'ultra';
      }
      
      // Mid-range GPUs
      if (/GeForce GTX|Radeon|Intel Iris/i.test(renderer)) {
        return isMobile ? 'medium' : 'high';
      }
    }
  }
  
  // Check memory
  if ('deviceMemory' in navigator) {
    const memory = (navigator as any).deviceMemory;
    if (memory >= 8) return isMobile ? 'medium' : 'high';
    if (memory >= 4) return isMobile ? 'low' : 'medium';
    return 'low';
  }
  
  // Default based on device type
  return isMobile ? 'low' : 'medium';
}

// ============================================================================
// QUALITY HELPERS
// ============================================================================

/**
 * Get quality config by level
 */
export function getQualityConfig(level: QualityLevel): QualityConfig {
  if (level === 'auto') {
    const detected = detectDeviceCapability();
    return QUALITY_PRESETS[detected];
  }
  return QUALITY_PRESETS[level];
}

/**
 * Increase quality level
 */
export function increaseQuality(current: QualityLevel): QualityLevel {
  const levels: QualityLevel[] = ['minimal', 'low', 'medium', 'high', 'ultra'];
  const currentIndex = levels.indexOf(current === 'auto' ? detectDeviceCapability() : current);
  return levels[Math.min(currentIndex + 1, levels.length - 1)];
}

/**
 * Decrease quality level
 */
export function decreaseQuality(current: QualityLevel): QualityLevel {
  const levels: QualityLevel[] = ['minimal', 'low', 'medium', 'high', 'ultra'];
  const currentIndex = levels.indexOf(current === 'auto' ? detectDeviceCapability() : current);
  return levels[Math.max(currentIndex - 1, 0)];
}
