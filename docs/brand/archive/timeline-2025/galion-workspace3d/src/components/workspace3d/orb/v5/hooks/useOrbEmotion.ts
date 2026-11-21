/**
 * GALION Orb V5.2 - Emotion Management Hook
 * 
 * Manages orb emotions with multi-emotion blending support
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Emotion, 
  EmotionConfig, 
  EmotionBlendState, 
  BlendedEmotionResult,
  UseOrbEmotionReturn 
} from '../types';
import { 
  getEmotionConfig, 
  getEmotionTransition, 
  blendEmotionConfigs 
} from '../config/emotions';

// Color interpolation helper
function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = new THREE.Color(color1);
  const c2 = new THREE.Color(color2);
  c1.lerp(c2, t);
  return '#' + c1.getHexString();
}

export interface UseOrbEmotionOptions {
  /** Initial emotion */
  initialEmotion?: Emotion;
  /** Maximum number of simultaneous emotion overlays */
  maxOverlays?: number;
  /** Callback when emotion changes */
  onEmotionChange?: (emotion: Emotion) => void;
  /** Callback when blend state changes */
  onBlendChange?: (blendState: EmotionBlendState) => void;
}

export function useOrbEmotion(options: UseOrbEmotionOptions = {}): UseOrbEmotionReturn {
  const {
    initialEmotion = 'neutral',
    maxOverlays = 3,
    onEmotionChange,
    onBlendChange,
  } = options;

  // State
  const [emotion, setEmotionInternal] = useState<Emotion>(initialEmotion);
  const [primaryIntensity, setPrimaryIntensity] = useState(1);
  const [overlays, setOverlays] = useState<Array<{ emotion: Emotion; intensity: number }>>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Refs for animation
  const animationFrameRef = useRef<number | null>(null);
  const transitionStartRef = useRef<number>(0);
  const transitionFromRef = useRef<Emotion>(initialEmotion);

  // Get current emotion config
  const emotionConfig = useMemo(() => getEmotionConfig(emotion), [emotion]);

  // Build blend state
  const blendState: EmotionBlendState = useMemo(() => ({
    primary: emotion,
    primaryIntensity,
    secondary: overlays,
  }), [emotion, primaryIntensity, overlays]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Set primary emotion with transition
  const setEmotion = useCallback((newEmotion: Emotion, intensity: number = 1) => {
    if (newEmotion === emotion && intensity === primaryIntensity) return;

    // Cancel ongoing transition
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const transition = getEmotionTransition(emotion, newEmotion);
    transitionStartRef.current = performance.now();
    transitionFromRef.current = emotion;

    setIsTransitioning(true);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - transitionStartRef.current;
      const progress = Math.min(elapsed / transition.duration, 1);

      // Easing
      const eased = transition.easing === 'easeInOut'
        ? progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
        : progress;

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsTransitioning(false);
        setEmotionInternal(newEmotion);
        setPrimaryIntensity(intensity);
        onEmotionChange?.(newEmotion);
      }
    };

    setEmotionInternal(newEmotion);
    setPrimaryIntensity(intensity);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [emotion, primaryIntensity, onEmotionChange]);

  // Add emotion overlay
  const addEmotionOverlay = useCallback((overlayEmotion: Emotion, intensity: number) => {
    setOverlays(prev => {
      // Check if already exists
      const existing = prev.find(o => o.emotion === overlayEmotion);
      if (existing) {
        return prev.map(o => 
          o.emotion === overlayEmotion ? { ...o, intensity } : o
        );
      }

      // Add new overlay, respecting max
      const newOverlays = [...prev, { emotion: overlayEmotion, intensity }];
      if (newOverlays.length > maxOverlays) {
        newOverlays.shift(); // Remove oldest
      }
      return newOverlays;
    });
  }, [maxOverlays]);

  // Remove emotion overlay
  const removeEmotionOverlay = useCallback((overlayEmotion: Emotion) => {
    setOverlays(prev => prev.filter(o => o.emotion !== overlayEmotion));
  }, []);

  // Clear all overlays
  const clearOverlays = useCallback(() => {
    setOverlays([]);
  }, []);

  // Get blended result for rendering
  const getBlendedResult = useCallback((): BlendedEmotionResult => {
    const primaryConfig = getEmotionConfig(emotion);
    
    // If no overlays, return primary config
    if (overlays.length === 0) {
      return {
        colors: primaryConfig.colors,
        energy: primaryConfig.energy * primaryIntensity,
        nebula: primaryConfig.nebula,
        particles: primaryConfig.particles,
      };
    }

    // Blend with overlays
    let blendedConfig = primaryConfig;
    let totalWeight = primaryIntensity;

    for (const overlay of overlays) {
      const overlayConfig = getEmotionConfig(overlay.emotion);
      const ratio = overlay.intensity / (totalWeight + overlay.intensity);
      blendedConfig = blendEmotionConfigs(blendedConfig, overlayConfig, ratio);
      totalWeight += overlay.intensity;
    }

    // Blend colors manually with all overlays
    let blendedColors = { ...primaryConfig.colors };
    let colorTotalWeight = primaryIntensity;

    for (const overlay of overlays) {
      const overlayConfig = getEmotionConfig(overlay.emotion);
      const ratio = overlay.intensity / (colorTotalWeight + overlay.intensity);
      
      blendedColors = {
        primary: lerpColor(blendedColors.primary, overlayConfig.colors.primary, ratio),
        secondary: lerpColor(blendedColors.secondary, overlayConfig.colors.secondary, ratio),
        accent: lerpColor(blendedColors.accent, overlayConfig.colors.accent, ratio),
        glow: lerpColor(blendedColors.glow, overlayConfig.colors.glow, ratio),
      };
      
      colorTotalWeight += overlay.intensity;
    }

    return {
      colors: blendedColors,
      energy: blendedConfig.energy,
      nebula: blendedConfig.nebula,
      particles: blendedConfig.particles,
    };
  }, [emotion, primaryIntensity, overlays]);

  // Notify on blend change
  useEffect(() => {
    onBlendChange?.(blendState);
  }, [blendState, onBlendChange]);

  return {
    emotion,
    emotionConfig,
    setEmotion,
    addEmotionOverlay,
    removeEmotionOverlay,
    clearOverlays,
    blendState,
    getBlendedResult,
    isTransitioning,
  };
}

export default useOrbEmotion;
