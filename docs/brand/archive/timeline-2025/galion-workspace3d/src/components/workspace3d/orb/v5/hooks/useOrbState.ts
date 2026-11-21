/**
 * GALION Orb V5.2 - State Management Hook
 * 
 * Manages orb behavioral states with smooth transitions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { OrbState, OrbStateConfig, UseOrbStateReturn } from '../types';
import { getStateConfig, getStateTransition, isValidTransition } from '../config/states';

// Easing functions
const easings = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => 1 - (1 - t) * (1 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  spring: (t: number) => 1 - Math.cos(t * Math.PI * 0.5) * Math.exp(-t * 3),
  bounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

export interface UseOrbStateOptions {
  /** Initial state */
  initialState?: OrbState;
  /** Callback when state changes */
  onStateChange?: (state: OrbState, previousState: OrbState | null) => void;
  /** Callback when transition starts */
  onTransitionStart?: (from: OrbState, to: OrbState) => void;
  /** Callback when transition ends */
  onTransitionEnd?: (state: OrbState) => void;
  /** Whether to validate transitions */
  validateTransitions?: boolean;
}

export function useOrbState(options: UseOrbStateOptions = {}): UseOrbStateReturn {
  const {
    initialState = 'idle',
    onStateChange,
    onTransitionStart,
    onTransitionEnd,
    validateTransitions = false,
  } = options;

  // State
  const [state, setStateInternal] = useState<OrbState>(initialState);
  const [previousState, setPreviousState] = useState<OrbState | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);

  // Refs for animation
  const animationFrameRef = useRef<number | null>(null);
  const transitionStartTimeRef = useRef<number>(0);

  // Get current state config
  const stateConfig = getStateConfig(state);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Set state with transition
  const setState = useCallback((newState: OrbState) => {
    // Skip if same state
    if (newState === state) return;

    // Validate transition if enabled
    if (validateTransitions && !isValidTransition(state, newState)) {
      console.warn(`Invalid transition from ${state} to ${newState}`);
      return;
    }

    // Cancel any ongoing transition
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Get transition config
    const transition = getStateTransition(state, newState);
    
    // Start transition
    setIsTransitioning(true);
    setTransitionProgress(0);
    setPreviousState(state);
    transitionStartTimeRef.current = performance.now();

    onTransitionStart?.(state, newState);

    // Animate transition
    const animate = (currentTime: number) => {
      const elapsed = currentTime - transitionStartTimeRef.current;
      const progress = Math.min(elapsed / transition.duration, 1);
      
      // Apply easing
      const easingFn = easings[transition.easing] || easings.easeInOut;
      const easedProgress = easingFn(progress);
      
      setTransitionProgress(easedProgress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Transition complete
        setIsTransitioning(false);
        setTransitionProgress(1);
        setStateInternal(newState);
        onStateChange?.(newState, state);
        onTransitionEnd?.(newState);
      }
    };

    // Start immediately with new state (visual transition happens via progress)
    setStateInternal(newState);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [state, validateTransitions, onStateChange, onTransitionStart, onTransitionEnd]);

  return {
    state,
    previousState,
    stateConfig,
    setState,
    isTransitioning,
    transitionProgress,
  };
}

export default useOrbState;
