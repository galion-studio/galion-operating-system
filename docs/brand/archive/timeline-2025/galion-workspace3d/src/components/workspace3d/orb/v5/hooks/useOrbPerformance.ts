/**
 * GALION Orb V5.2 - Performance Monitoring Hook
 * 
 * Adaptive quality management based on FPS
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { QualityLevel, QualityConfig } from '../types';
import { 
  getQualityConfig, 
  increaseQuality, 
  decreaseQuality, 
  detectDeviceCapability 
} from '../config/presets';

export interface UseOrbPerformanceOptions {
  /** Initial quality level */
  initialQuality?: QualityLevel;
  /** Target FPS for adaptive quality */
  targetFPS?: number;
  /** Minimum FPS before quality decrease */
  minFPS?: number;
  /** Enable adaptive quality */
  adaptive?: boolean;
  /** Callback when quality changes */
  onQualityChange?: (quality: QualityLevel) => void;
}

export interface UseOrbPerformanceReturn {
  /** Current quality level */
  quality: QualityLevel;
  /** Current quality configuration */
  qualityConfig: QualityConfig;
  /** Current FPS */
  fps: number;
  /** Set quality level */
  setQuality: (quality: QualityLevel) => void;
  /** Increase quality */
  increaseQuality: () => void;
  /** Decrease quality */
  decreaseQuality: () => void;
  /** Update quality based on performance */
  updateQuality: (direction: 'increase' | 'decrease') => void;
}

export function useOrbPerformance(options: UseOrbPerformanceOptions = {}): UseOrbPerformanceReturn {
  const {
    initialQuality = 'auto',
    targetFPS = 60,
    minFPS = 30,
    adaptive = true,
    onQualityChange,
  } = options;

  // Resolve initial quality
  const resolvedInitialQuality = initialQuality === 'auto' 
    ? detectDeviceCapability() 
    : initialQuality;

  // State
  const [quality, setQualityInternal] = useState<QualityLevel>(resolvedInitialQuality);
  const [fps, setFps] = useState(60);

  // Refs for FPS calculation
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  // Get quality config
  const qualityConfig = getQualityConfig(quality);

  // Set quality with callback
  const setQuality = useCallback((newQuality: QualityLevel) => {
    const resolved = newQuality === 'auto' ? detectDeviceCapability() : newQuality;
    setQualityInternal(resolved);
    onQualityChange?.(resolved);
  }, [onQualityChange]);

  // Increase quality
  const handleIncreaseQuality = useCallback(() => {
    const newQuality = increaseQuality(quality);
    setQuality(newQuality);
  }, [quality, setQuality]);

  // Decrease quality
  const handleDecreaseQuality = useCallback(() => {
    const newQuality = decreaseQuality(quality);
    setQuality(newQuality);
  }, [quality, setQuality]);

  // Update quality based on direction
  const updateQuality = useCallback((direction: 'increase' | 'decrease') => {
    if (direction === 'increase') {
      handleIncreaseQuality();
    } else {
      handleDecreaseQuality();
    }
  }, [handleIncreaseQuality, handleDecreaseQuality]);

  // FPS monitoring
  useEffect(() => {
    if (!adaptive) return;

    let consecutiveLowFrames = 0;
    let consecutiveHighFrames = 0;

    const measureFPS = () => {
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      // Keep last 60 frame times
      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      // Calculate average FPS
      if (frameTimesRef.current.length >= 10) {
        const avgDelta = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const currentFPS = Math.round(1000 / avgDelta);
        setFps(currentFPS);

        // Adaptive quality adjustments
        if (currentFPS < minFPS) {
          consecutiveLowFrames++;
          consecutiveHighFrames = 0;
          if (consecutiveLowFrames > 30) {
            handleDecreaseQuality();
            consecutiveLowFrames = 0;
          }
        } else if (currentFPS >= targetFPS) {
          consecutiveHighFrames++;
          consecutiveLowFrames = 0;
          if (consecutiveHighFrames > 120) { // Wait longer before increasing
            handleIncreaseQuality();
            consecutiveHighFrames = 0;
          }
        } else {
          consecutiveLowFrames = 0;
          consecutiveHighFrames = 0;
        }
      }

      animationFrameRef.current = requestAnimationFrame(measureFPS);
    };

    animationFrameRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [adaptive, minFPS, targetFPS, handleDecreaseQuality, handleIncreaseQuality]);

  return {
    quality,
    qualityConfig,
    fps,
    setQuality,
    increaseQuality: handleIncreaseQuality,
    decreaseQuality: handleDecreaseQuality,
    updateQuality,
  };
}

export default useOrbPerformance;
