/**
 * GALION Orb V5.2 - Animation Hook
 * 
 * Manages orb animations with smooth transitions and blending
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { UseOrbAnimationReturn, OrbAnimationConfig, AnimationCategory } from '../types';

// ============================================================================
// ANIMATION LIBRARY
// ============================================================================

const ANIMATIONS: Record<string, OrbAnimationConfig> = {
  // Idle animations
  breathe: {
    id: 'breathe',
    name: 'Breathe',
    category: 'idle',
    duration: 8000, // 8 seconds - slower, deeper breathing
    loop: true,
    keyframes: [
      { time: 0, values: { scale: 1.0, glowIntensity: 0.3 }, easing: 'easeInOut' },
      { time: 0.5, values: { scale: 1.02, glowIntensity: 0.45 }, easing: 'easeInOut' },
      { time: 1, values: { scale: 1.0, glowIntensity: 0.3 } },
    ],
    blendMode: 'replace',
    priority: 1,
  },

  sleepBreathe: {
    id: 'sleepBreathe',
    name: 'Sleep Breathe',
    category: 'idle',
    duration: 10000, // 10 seconds - very slow, peaceful
    loop: true,
    keyframes: [
      { time: 0, values: { scale: 0.98, glowIntensity: 0.15 }, easing: 'easeInOut' },
      { time: 0.5, values: { scale: 1.02, glowIntensity: 0.2 }, easing: 'easeInOut' },
      { time: 1, values: { scale: 0.98, glowIntensity: 0.15 } },
    ],
    blendMode: 'replace',
    priority: 1,
  },

  // Reactive animations - made slower for stability
  volumeScale: {
    id: 'volumeScale',
    name: 'Volume Scale',
    category: 'reactive',
    duration: 500, // 500ms - smooth, not jerky
    loop: true,
    keyframes: [
      { time: 0, values: { scale: 1.0 } },
      { time: 1, values: { scale: 1.04 } }, // Reduced from 1.08
    ],
    blendMode: 'additive',
    priority: 5,
  },

  speakPulse: {
    id: 'speakPulse',
    name: 'Speak Pulse',
    category: 'voice',
    duration: 800, // 800ms - organic voice rhythm
    loop: true,
    keyframes: [
      { time: 0, values: { scale: 1.0, glowIntensity: 0.7 }, easing: 'easeOut' },
      { time: 0.5, values: { scale: 1.05, glowIntensity: 0.85 }, easing: 'easeIn' },
      { time: 1, values: { scale: 1.0, glowIntensity: 0.7 } },
    ],
    blendMode: 'replace',
    priority: 5,
  },

  // Thinking animations
  thoughtSpiral: {
    id: 'thoughtSpiral',
    name: 'Thought Spiral',
    category: 'idle',
    duration: 8000, // Reduced speed significantly
    loop: true,
    keyframes: [
      { time: 0, values: { rotation: 0, thoughtStreamIntensity: 0.6 }, easing: 'linear' },
      { time: 0.5, values: { rotation: Math.PI, thoughtStreamIntensity: 0.8 }, easing: 'linear' },
      { time: 1, values: { rotation: Math.PI * 2, thoughtStreamIntensity: 0.6 } },
    ],
    blendMode: 'replace',
    priority: 3,
  },

  // Special animations
  successBurst: {
    id: 'successBurst',
    name: 'Success Burst',
    category: 'special',
    duration: 1000,
    loop: false,
    keyframes: [
      { time: 0, values: { scale: 1.0, glowIntensity: 0.7 }, easing: 'easeOut' },
      { time: 0.3, values: { scale: 1.2, glowIntensity: 1.0 }, easing: 'easeOut' },
      { time: 1, values: { scale: 1.0, glowIntensity: 0.5 } },
    ],
    blendMode: 'replace',
    priority: 10,
  },

  errorShake: {
    id: 'errorShake',
    name: 'Error Shake',
    category: 'special',
    duration: 500,
    loop: false,
    keyframes: [
      { time: 0, values: { offsetX: 0 }, easing: 'linear' },
      { time: 0.1, values: { offsetX: 0.1 } },
      { time: 0.2, values: { offsetX: -0.1 } },
      { time: 0.3, values: { offsetX: 0.08 } },
      { time: 0.4, values: { offsetX: -0.08 } },
      { time: 0.5, values: { offsetX: 0.05 } },
      { time: 0.6, values: { offsetX: -0.05 } },
      { time: 0.8, values: { offsetX: 0.02 } },
      { time: 1, values: { offsetX: 0 } },
    ],
    blendMode: 'additive',
    priority: 10,
  },

  warningPulse: {
    id: 'warningPulse',
    name: 'Warning Pulse',
    category: 'special',
    duration: 1000,
    loop: true,
    keyframes: [
      { time: 0, values: { glowIntensity: 0.5 }, easing: 'easeInOut' },
      { time: 0.5, values: { glowIntensity: 0.9 }, easing: 'easeInOut' },
      { time: 1, values: { glowIntensity: 0.5 } },
    ],
    blendMode: 'replace',
    priority: 8,
  },

  emergencyAlert: {
    id: 'emergencyAlert',
    name: 'Emergency Alert',
    category: 'special',
    duration: 1000, // 1 second - urgent but not jarring
    loop: true,
    keyframes: [
      { time: 0, values: { scale: 1.0, glowIntensity: 0.8 }, easing: 'linear' },
      { time: 0.5, values: { scale: 1.1, glowIntensity: 1.0 }, easing: 'linear' },
      { time: 1, values: { scale: 1.0, glowIntensity: 0.8 } },
    ],
    blendMode: 'replace',
    priority: 10,
  },

  transcendAscend: {
    id: 'transcendAscend',
    name: 'Transcend Ascend',
    category: 'special',
    duration: 5000,
    loop: true,
    keyframes: [
      { time: 0, values: { scale: 1.0, glowIntensity: 0.8, offsetY: 0 }, easing: 'easeInOut' },
      { time: 0.25, values: { scale: 1.1, glowIntensity: 0.9, offsetY: 0.1 }, easing: 'easeInOut' },
      { time: 0.5, values: { scale: 1.15, glowIntensity: 1.0, offsetY: 0.15 }, easing: 'easeInOut' },
      { time: 0.75, values: { scale: 1.1, glowIntensity: 0.9, offsetY: 0.1 }, easing: 'easeInOut' },
      { time: 1, values: { scale: 1.0, glowIntensity: 0.8, offsetY: 0 } },
    ],
    blendMode: 'replace',
    priority: 5,
  },

  // Activity animations
  searchScan: {
    id: 'searchScan',
    name: 'Search Scan',
    category: 'idle',
    duration: 2000,
    loop: true,
    keyframes: [
      { time: 0, values: { rotation: 0, particleSpeed: 0.5 }, easing: 'linear' },
      { time: 1, values: { rotation: Math.PI * 2, particleSpeed: 0.7 } },
    ],
    blendMode: 'replace',
    priority: 4,
  },

  createBurst: {
    id: 'createBurst',
    name: 'Create Burst',
    category: 'special',
    duration: 1500,
    loop: true,
    keyframes: [
      { time: 0, values: { scale: 1.0, particleEmission: 0.5 }, easing: 'easeOut' },
      { time: 0.3, values: { scale: 1.08, particleEmission: 1.0 }, easing: 'easeIn' },
      { time: 0.6, values: { scale: 1.02, particleEmission: 0.7 }, easing: 'easeOut' },
      { time: 1, values: { scale: 1.0, particleEmission: 0.5 } },
    ],
    blendMode: 'replace',
    priority: 4,
  },

  // Transition animations
  stateTransition: {
    id: 'stateTransition',
    name: 'State Transition',
    category: 'transition',
    duration: 500,
    loop: false,
    keyframes: [
      { time: 0, values: { transitionProgress: 0 }, easing: 'easeInOut' },
      { time: 1, values: { transitionProgress: 1 } },
    ],
    blendMode: 'replace',
    priority: 10,
  },
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export interface UseOrbAnimationOptions {
  /** Default animation to play */
  defaultAnimation?: string;
  /** Callback when animation completes (non-looping) */
  onComplete?: (animationId: string) => void;
}

export function useOrbAnimation(options: UseOrbAnimationOptions = {}): UseOrbAnimationReturn {
  const { defaultAnimation = 'breathe', onComplete } = options;

  // State
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(defaultAnimation);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Refs
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  // Get animation config
  const getAnimation = useCallback((id: string): OrbAnimationConfig | null => {
    return ANIMATIONS[id] || null;
  }, []);

  // Stop animation
  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPlaying(false);
    setProgress(0);
    setCurrentAnimation(null);
  }, []);

  // Pause animation
  const pause = useCallback(() => {
    if (!isPaused && isPlaying) {
      pauseTimeRef.current = performance.now();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setIsPaused(true);
    }
  }, [isPaused, isPlaying]);

  // Play animation
  const play = useCallback((animationId: string) => {
    const animation = getAnimation(animationId);
    if (!animation) {
      console.warn(`Animation "${animationId}" not found`);
      return;
    }

    // Cancel existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setCurrentAnimation(animationId);
    setIsPlaying(true);
    setIsPaused(false);
    startTimeRef.current = performance.now();

    // Track last React update time to throttle state updates
    let lastProgressUpdate = 0;
    const PROGRESS_UPDATE_INTERVAL = 100; // Only update React state 10 times/second

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      let normalizedProgress = (elapsed % animation.duration) / animation.duration;

      if (!animation.loop) {
        normalizedProgress = Math.min(elapsed / animation.duration, 1);
      }

      // THROTTLE: Only update React state every 100ms to prevent performance issues
      if (currentTime - lastProgressUpdate > PROGRESS_UPDATE_INTERVAL) {
        setProgress(normalizedProgress);
        lastProgressUpdate = currentTime;
      }

      if (!animation.loop && normalizedProgress >= 1) {
        setIsPlaying(false);
        onComplete?.(animationId);
        // Return to default animation
        if (defaultAnimation && animationId !== defaultAnimation) {
          play(defaultAnimation);
        }
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [getAnimation, onComplete, defaultAnimation]);

  // Resume animation
  const resume = useCallback(() => {
    if (isPaused && currentAnimation) {
      const pauseDuration = performance.now() - pauseTimeRef.current;
      startTimeRef.current += pauseDuration;
      setIsPaused(false);
      play(currentAnimation);
    }
  }, [isPaused, currentAnimation, play]);

  // Start default animation on mount
  useEffect(() => {
    if (defaultAnimation) {
      play(defaultAnimation);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []); // Only on mount

  return {
    currentAnimation,
    progress,
    play,
    stop,
    pause,
    resume,
    isPlaying: isPlaying && !isPaused,
  };
}

// Export animation library for external use
export { ANIMATIONS };
export default useOrbAnimation;
