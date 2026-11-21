'use client';

/**
 * useOrbAnimations.ts - State and Emotion Transition Hook
 * 
 * Manages smooth transitions between orb states and emotions:
 * - Interpolates between state configs over time
 * - Handles emotion color transitions (200-400ms)
 * - Manages audio-reactive parameters
 * - Provides computed animation values
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  OrbState, 
  OrbStateConfig, 
  getStateConfig, 
  getTransition,
  interpolateStates,
} from './orbV3States';
import {
  OrbEmotion,
  EmotionConfig,
  getEmotionConfig,
  interpolateEmotions,
  EMOTION_TRANSITION,
} from './orbV3Emotions';

// ============================================================================
// TYPES
// ============================================================================

export interface OrbAnimationState {
  /** Current interpolated state config */
  stateConfig: OrbStateConfig;
  /** Current interpolated emotion config */
  emotionConfig: EmotionConfig;
  /** Transition progress (0-1) */
  transitionProgress: number;
  /** Whether currently transitioning */
  isTransitioning: boolean;
  /** Current computed scale */
  scale: number;
  /** Current computed glow intensity */
  glowIntensity: number;
  /** Current computed rotation speed */
  rotationSpeed: number;
  /** Current computed pulse speed */
  pulseSpeed: number;
  /** Neural activity level */
  neuralActivity: number;
  /** Energy flow direction (-1 to 1) */
  energyDirection: number;
  /** Energy flow speed */
  energySpeed: number;
  /** Core brightness */
  coreBrightness: number;
}

export interface UseOrbAnimationsOptions {
  /** Current state */
  state: OrbState;
  /** Current emotion */
  emotion: OrbEmotion;
  /** Base intensity (0-1) */
  intensity?: number;
  /** Audio level for speech (0-1) */
  audioLevel?: number;
  /** Custom transition duration (ms) */
  transitionDuration?: number;
  /** Disable animations */
  disabled?: boolean;
}

export interface UseOrbAnimationsResult extends OrbAnimationState {
  /** Trigger a state change */
  setState: (newState: OrbState) => void;
  /** Trigger an emotion change */
  setEmotion: (newEmotion: OrbEmotion) => void;
  /** Reset to defaults */
  reset: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useOrbAnimations({
  state: initialState,
  emotion: initialEmotion,
  intensity = 0.7,
  audioLevel = 0,
  transitionDuration,
  disabled = false,
}: UseOrbAnimationsOptions): UseOrbAnimationsResult {
  // Current targets
  const [targetState, setTargetState] = useState<OrbState>(initialState);
  const [targetEmotion, setTargetEmotion] = useState<OrbEmotion>(initialEmotion);
  
  // Previous values for interpolation
  const prevStateRef = useRef<OrbState>(initialState);
  const prevEmotionRef = useRef<OrbEmotion>(initialEmotion);
  
  // Transition tracking
  const [stateProgress, setStateProgress] = useState(1);
  const [emotionProgress, setEmotionProgress] = useState(1);
  const transitionStartTimeRef = useRef(0);
  const animationFrameRef = useRef<number>();
  
  // Get current configs
  const prevStateConfig = useMemo(() => getStateConfig(prevStateRef.current), [prevStateRef.current]);
  const targetStateConfig = useMemo(() => getStateConfig(targetState), [targetState]);
  const prevEmotionConfig = useMemo(() => getEmotionConfig(prevEmotionRef.current), [prevEmotionRef.current]);
  const targetEmotionConfig = useMemo(() => getEmotionConfig(targetEmotion), [targetEmotion]);
  
  // Get transition durations
  const stateTransitionDuration = useMemo(() => {
    if (transitionDuration) return transitionDuration;
    const transition = getTransition(prevStateRef.current, targetState);
    return transition.duration;
  }, [targetState, transitionDuration]);
  
  const emotionTransitionDuration = useMemo(() => {
    return transitionDuration || EMOTION_TRANSITION.duration;
  }, [transitionDuration]);
  
  // Animation loop
  useEffect(() => {
    if (disabled) return;
    
    const animate = () => {
      const now = performance.now();
      const elapsed = now - transitionStartTimeRef.current;
      
      // Update state transition
      if (stateProgress < 1) {
        const newProgress = Math.min(elapsed / stateTransitionDuration, 1);
        setStateProgress(newProgress);
        
        if (newProgress >= 1) {
          prevStateRef.current = targetState;
        }
      }
      
      // Update emotion transition
      if (emotionProgress < 1) {
        const newProgress = Math.min(elapsed / emotionTransitionDuration, 1);
        setEmotionProgress(newProgress);
        
        if (newProgress >= 1) {
          prevEmotionRef.current = targetEmotion;
        }
      }
      
      // Continue animation if still transitioning
      if (stateProgress < 1 || emotionProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    if (stateProgress < 1 || emotionProgress < 1) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stateProgress, emotionProgress, disabled, stateTransitionDuration, emotionTransitionDuration, targetState, targetEmotion]);
  
  // State change handler
  const setState = useCallback((newState: OrbState) => {
    if (newState !== targetState) {
      prevStateRef.current = targetState;
      setTargetState(newState);
      setStateProgress(0);
      transitionStartTimeRef.current = performance.now();
    }
  }, [targetState]);
  
  // Emotion change handler
  const setEmotion = useCallback((newEmotion: OrbEmotion) => {
    if (newEmotion !== targetEmotion) {
      prevEmotionRef.current = targetEmotion;
      setTargetEmotion(newEmotion);
      setEmotionProgress(0);
      transitionStartTimeRef.current = performance.now();
    }
  }, [targetEmotion]);
  
  // Reset handler
  const reset = useCallback(() => {
    setTargetState('idle');
    setTargetEmotion('neutral');
    prevStateRef.current = 'idle';
    prevEmotionRef.current = 'neutral';
    setStateProgress(1);
    setEmotionProgress(1);
  }, []);
  
  // Update on prop changes
  useEffect(() => {
    setState(initialState);
  }, [initialState, setState]);
  
  useEffect(() => {
    setEmotion(initialEmotion);
  }, [initialEmotion, setEmotion]);
  
  // Calculate interpolated values
  const interpolatedState = useMemo(() => {
    if (stateProgress >= 1) return targetStateConfig;
    return interpolateStates(prevStateConfig, targetStateConfig, easeInOutCubic(stateProgress)) as OrbStateConfig;
  }, [prevStateConfig, targetStateConfig, stateProgress]);
  
  const interpolatedEmotion = useMemo(() => {
    if (emotionProgress >= 1) return targetEmotionConfig;
    return interpolateEmotions(prevEmotionConfig, targetEmotionConfig, easeInOutCubic(emotionProgress)) as EmotionConfig;
  }, [prevEmotionConfig, targetEmotionConfig, emotionProgress]);
  
  // Calculate computed values
  const computedValues = useMemo(() => {
    const baseScale = interpolatedState.scale.base;
    const audioScale = targetState === 'speaking' ? audioLevel * 0.03 : 0;
    const scale = baseScale + audioScale;
    
    const glowIntensity = interpolatedState.glow.intensity * interpolatedEmotion.glowIntensity * intensity;
    const rotationSpeed = interpolatedState.gradient.rotationSpeed * interpolatedEmotion.speedMultiplier;
    const pulseSpeed = interpolatedState.core.pulseSpeed * interpolatedEmotion.speedMultiplier;
    const neuralActivity = interpolatedState.neural.activity + interpolatedEmotion.neuralBoost;
    const energyDirection = interpolatedState.energyFlow.direction;
    const energySpeed = interpolatedState.energyFlow.speed * interpolatedEmotion.speedMultiplier;
    const coreBrightness = interpolatedState.core.brightness * (0.5 + interpolatedEmotion.glowIntensity * 0.5);
    
    return {
      scale,
      glowIntensity,
      rotationSpeed,
      pulseSpeed,
      neuralActivity,
      energyDirection,
      energySpeed,
      coreBrightness,
    };
  }, [interpolatedState, interpolatedEmotion, targetState, audioLevel, intensity]);
  
  // Transition progress (average of both)
  const transitionProgress = (stateProgress + emotionProgress) / 2;
  const isTransitioning = stateProgress < 1 || emotionProgress < 1;
  
  return {
    stateConfig: interpolatedState,
    emotionConfig: interpolatedEmotion as EmotionConfig,
    transitionProgress,
    isTransitioning,
    ...computedValues,
    setState,
    setEmotion,
    reset,
  };
}

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t: number): number {
  return t * t * t;
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to cycle through states for demo purposes
 */
export function useStateCycler(
  states: OrbState[],
  interval: number = 5000
): OrbState {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % states.length);
    }, interval);
    
    return () => clearInterval(timer);
  }, [states, interval]);
  
  return states[currentIndex];
}

/**
 * Hook to cycle through emotions for demo purposes
 */
export function useEmotionCycler(
  emotions: OrbEmotion[],
  interval: number = 5000
): OrbEmotion {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % emotions.length);
    }, interval);
    
    return () => clearInterval(timer);
  }, [emotions, interval]);
  
  return emotions[currentIndex];
}

/**
 * Hook to simulate audio levels for demo
 */
export function useAudioSimulator(
  active: boolean,
  minLevel: number = 0.1,
  maxLevel: number = 0.8
): number {
  const [audioLevel, setAudioLevel] = useState(0);
  
  useEffect(() => {
    if (!active) {
      setAudioLevel(0);
      return;
    }
    
    const interval = setInterval(() => {
      const newLevel = minLevel + Math.random() * (maxLevel - minLevel);
      setAudioLevel(newLevel);
    }, 100);
    
    return () => clearInterval(interval);
  }, [active, minLevel, maxLevel]);
  
  return audioLevel;
}

export default useOrbAnimations;

