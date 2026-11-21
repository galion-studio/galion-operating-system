'use client';

/**
 * AdvancedPostProcessing.tsx - Cinematic Post-Processing Effects
 * 
 * Adds sophisticated post-processing for 22nd-century visual quality:
 * - Bloom (selective and volumetric)
 * - Chromatic aberration
 * - Depth of field
 * - Film grain
 * - Color grading
 * - Vignette
 * 
 * Optimized for performance with quality presets.
 */

import React from 'react';
import { EffectComposer, Bloom, ChromaticAberration, DepthOfField, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import * as THREE from 'three';

// ============================================================================
// TYPES
// ============================================================================

export interface AdvancedPostProcessingProps {
  /** Enable bloom effect */
  enableBloom?: boolean;
  /** Bloom intensity */
  bloomIntensity?: number;
  /** Bloom luminance threshold */
  bloomThreshold?: number;
  /** Enable chromatic aberration */
  enableChromaticAberration?: boolean;
  /** Chromatic aberration intensity */
  chromaticAberrationIntensity?: number;
  /** Enable depth of field */
  enableDepthOfField?: boolean;
  /** DOF focal distance */
  focalLength?: number;
  /** DOF blur strength */
  bokehScale?: number;
  /** Enable film grain */
  enableFilmGrain?: boolean;
  /** Film grain intensity */
  filmGrainIntensity?: number;
  /** Enable vignette */
  enableVignette?: boolean;
  /** Vignette darkness */
  vignetteDarkness?: number;
  /** Quality preset */
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  /** Emotion-based color tint */
  emotionTint?: THREE.Vector3;
}

// ============================================================================
// QUALITY PRESETS
// ============================================================================

const QUALITY_PRESETS = {
  low: {
    bloomLuminanceSmoothing: 0.5,
    bloomMipmapBlur: false,
    bloomResolutionScale: 0.5,
    chromaticAberrationOffset: new THREE.Vector2(0.001, 0.001),
    noiseOpacity: 0.1,
  },
  medium: {
    bloomLuminanceSmoothing: 0.7,
    bloomMipmapBlur: true,
    bloomResolutionScale: 0.75,
    chromaticAberrationOffset: new THREE.Vector2(0.002, 0.002),
    noiseOpacity: 0.15,
  },
  high: {
    bloomLuminanceSmoothing: 0.9,
    bloomMipmapBlur: true,
    bloomResolutionScale: 1.0,
    chromaticAberrationOffset: new THREE.Vector2(0.003, 0.003),
    noiseOpacity: 0.2,
  },
  ultra: {
    bloomLuminanceSmoothing: 1.0,
    bloomMipmapBlur: true,
    bloomResolutionScale: 1.0,
    chromaticAberrationOffset: new THREE.Vector2(0.004, 0.004),
    noiseOpacity: 0.25,
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AdvancedPostProcessing({
  enableBloom = true,
  bloomIntensity = 1.5,
  bloomThreshold = 0.3,
  enableChromaticAberration = true,
  chromaticAberrationIntensity = 0.5,
  enableDepthOfField = false,
  focalLength = 5,
  bokehScale = 2,
  enableFilmGrain = true,
  filmGrainIntensity = 0.15,
  enableVignette = true,
  vignetteDarkness = 0.5,
  quality = 'high',
  emotionTint,
}: AdvancedPostProcessingProps) {
  const preset = QUALITY_PRESETS[quality];

  return (
    <EffectComposer>
      <>
        {/* BLOOM - Glow and luminance enhancement */}
        {enableBloom && (
          <Bloom
            intensity={bloomIntensity}
            luminanceThreshold={bloomThreshold}
            luminanceSmoothing={preset.bloomLuminanceSmoothing}
            mipmapBlur={preset.bloomMipmapBlur}
            radius={0.85}
            levels={quality === 'ultra' ? 9 : quality === 'high' ? 8 : 6}
            kernelSize={KernelSize.LARGE}
            blendFunction={BlendFunction.ADD}
          />
        )}

        {/* CHROMATIC ABERRATION - Color fringing for depth */}
        {enableChromaticAberration && (
          <ChromaticAberration
            offset={preset.chromaticAberrationOffset.clone().multiplyScalar(chromaticAberrationIntensity)}
            blendFunction={BlendFunction.NORMAL}
            radialModulation={false}
            modulationOffset={0}
          />
        )}

        {/* DEPTH OF FIELD - Focus blur (optional, performance intensive) */}
        {enableDepthOfField && quality !== 'low' && (
          <DepthOfField
            focusDistance={0}
            focalLength={focalLength}
            bokehScale={bokehScale}
            height={quality === 'ultra' ? 720 : quality === 'high' ? 480 : 360}
          />
        )}

        {/* FILM GRAIN - Subtle noise for cinematic feel */}
        {enableFilmGrain && (
          <Noise
            opacity={preset.noiseOpacity * filmGrainIntensity}
            blendFunction={BlendFunction.OVERLAY}
          />
        )}

        {/* VIGNETTE - Darken edges */}
        {enableVignette && (
          <Vignette
            offset={0.3}
            darkness={vignetteDarkness}
            blendFunction={BlendFunction.NORMAL}
          />
        )}
      </>
    </EffectComposer>
  );
}

// ============================================================================
// EMOTION-BASED PRESETS
// ============================================================================

export const EmotionPostProcessingPresets = {
  neutral: {
    bloomIntensity: 1.2,
    bloomThreshold: 0.4,
    chromaticAberrationIntensity: 0.3,
    vignetteDarkness: 0.4,
  },
  calm: {
    bloomIntensity: 0.8,
    bloomThreshold: 0.5,
    chromaticAberrationIntensity: 0.2,
    vignetteDarkness: 0.3,
  },
  warm: {
    bloomIntensity: 1.4,
    bloomThreshold: 0.35,
    chromaticAberrationIntensity: 0.4,
    vignetteDarkness: 0.35,
  },
  focused: {
    bloomIntensity: 1.6,
    bloomThreshold: 0.3,
    chromaticAberrationIntensity: 0.5,
    vignetteDarkness: 0.5,
  },
  alert: {
    bloomIntensity: 2.0,
    bloomThreshold: 0.2,
    chromaticAberrationIntensity: 0.7,
    vignetteDarkness: 0.6,
  },
  happy: {
    bloomIntensity: 1.8,
    bloomThreshold: 0.25,
    chromaticAberrationIntensity: 0.6,
    vignetteDarkness: 0.3,
  },
  sad: {
    bloomIntensity: 0.6,
    bloomThreshold: 0.6,
    chromaticAberrationIntensity: 0.2,
    vignetteDarkness: 0.7,
  },
  angry: {
    bloomIntensity: 2.2,
    bloomThreshold: 0.15,
    chromaticAberrationIntensity: 0.9,
    vignetteDarkness: 0.7,
  },
  excited: {
    bloomIntensity: 2.0,
    bloomThreshold: 0.2,
    chromaticAberrationIntensity: 0.8,
    vignetteDarkness: 0.4,
  },
  thinking: {
    bloomIntensity: 1.0,
    bloomThreshold: 0.45,
    chromaticAberrationIntensity: 0.3,
    vignetteDarkness: 0.5,
  },
  curious: {
    bloomIntensity: 1.3,
    bloomThreshold: 0.38,
    chromaticAberrationIntensity: 0.45,
    vignetteDarkness: 0.4,
  },
};

export default AdvancedPostProcessing;
