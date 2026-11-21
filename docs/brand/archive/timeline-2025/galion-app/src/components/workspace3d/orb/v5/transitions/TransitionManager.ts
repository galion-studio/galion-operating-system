/**
 * GALION Orb V5.2 - Transition Manager
 * 
 * Phase-based transitions with LAB color space blending
 * for smooth, perceptually-uniform color interpolation.
 */

import * as THREE from 'three';
import { OrbState } from '../types';
import { Emotion } from '../types/emotion.types';
import { getStateConfig } from '../config/states';
import { getEmotionConfig } from '../config/emotions';

// ============================================================================
// LAB COLOR SPACE UTILITIES
// ============================================================================

interface LABColor {
  L: number; // Lightness (0-100)
  a: number; // Green-Red axis (-128 to 127)
  b: number; // Blue-Yellow axis (-128 to 127)
}

interface XYZColor {
  X: number;
  Y: number;
  Z: number;
}

// D65 illuminant reference values
const REF_X = 95.047;
const REF_Y = 100.0;
const REF_Z = 108.883;

/**
 * Convert sRGB to XYZ color space
 */
function rgbToXYZ(r: number, g: number, b: number): XYZColor {
  // Normalize to 0-1
  let rn = r / 255;
  let gn = g / 255;
  let bn = b / 255;

  // Apply gamma correction
  rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
  gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
  bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;

  rn *= 100;
  gn *= 100;
  bn *= 100;

  // sRGB to XYZ matrix
  return {
    X: rn * 0.4124564 + gn * 0.3575761 + bn * 0.1804375,
    Y: rn * 0.2126729 + gn * 0.7151522 + bn * 0.0721750,
    Z: rn * 0.0193339 + gn * 0.1191920 + bn * 0.9503041,
  };
}

/**
 * Convert XYZ to LAB color space
 */
function xyzToLAB(xyz: XYZColor): LABColor {
  let x = xyz.X / REF_X;
  let y = xyz.Y / REF_Y;
  let z = xyz.Z / REF_Z;

  const epsilon = 0.008856;
  const kappa = 903.3;

  x = x > epsilon ? Math.pow(x, 1/3) : (kappa * x + 16) / 116;
  y = y > epsilon ? Math.pow(y, 1/3) : (kappa * y + 16) / 116;
  z = z > epsilon ? Math.pow(z, 1/3) : (kappa * z + 16) / 116;

  return {
    L: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  };
}

/**
 * Convert LAB to XYZ color space
 */
function labToXYZ(lab: LABColor): XYZColor {
  const y = (lab.L + 16) / 116;
  const x = lab.a / 500 + y;
  const z = y - lab.b / 200;

  const epsilon = 0.008856;
  const kappa = 903.3;

  const x3 = Math.pow(x, 3);
  const z3 = Math.pow(z, 3);

  return {
    X: (x3 > epsilon ? x3 : (116 * x - 16) / kappa) * REF_X,
    Y: (lab.L > kappa * epsilon ? Math.pow((lab.L + 16) / 116, 3) : lab.L / kappa) * REF_Y,
    Z: (z3 > epsilon ? z3 : (116 * z - 16) / kappa) * REF_Z,
  };
}

/**
 * Convert XYZ to sRGB
 */
function xyzToRGB(xyz: XYZColor): { r: number; g: number; b: number } {
  const x = xyz.X / 100;
  const y = xyz.Y / 100;
  const z = xyz.Z / 100;

  // XYZ to sRGB matrix
  let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  let g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
  let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

  // Apply gamma correction
  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1/2.4) - 0.055 : 12.92 * b;

  return {
    r: Math.max(0, Math.min(255, Math.round(r * 255))),
    g: Math.max(0, Math.min(255, Math.round(g * 255))),
    b: Math.max(0, Math.min(255, Math.round(b * 255))),
  };
}

/**
 * Convert THREE.Color to LAB
 */
export function colorToLAB(color: THREE.Color): LABColor {
  const xyz = rgbToXYZ(color.r * 255, color.g * 255, color.b * 255);
  return xyzToLAB(xyz);
}

/**
 * Convert LAB to THREE.Color
 */
export function labToColor(lab: LABColor): THREE.Color {
  const xyz = labToXYZ(lab);
  const rgb = xyzToRGB(xyz);
  return new THREE.Color(rgb.r / 255, rgb.g / 255, rgb.b / 255);
}

/**
 * Interpolate between two LAB colors
 */
export function lerpLAB(lab1: LABColor, lab2: LABColor, t: number): LABColor {
  return {
    L: lab1.L + (lab2.L - lab1.L) * t,
    a: lab1.a + (lab2.a - lab1.a) * t,
    b: lab1.b + (lab2.b - lab1.b) * t,
  };
}

/**
 * Interpolate between two THREE.Colors in LAB space
 */
export function lerpColorLAB(color1: THREE.Color, color2: THREE.Color, t: number): THREE.Color {
  const lab1 = colorToLAB(color1);
  const lab2 = colorToLAB(color2);
  const interpolated = lerpLAB(lab1, lab2, t);
  return labToColor(interpolated);
}

// ============================================================================
// TRANSITION PHASES
// ============================================================================

export type TransitionPhase = 'idle' | 'exit' | 'morph' | 'enter' | 'complete';

export interface TransitionPhaseConfig {
  /** Phase name */
  name: TransitionPhase;
  /** Duration in seconds */
  duration: number;
  /** Easing function */
  easing: (t: number) => number;
  /** Effects to apply during this phase */
  effects: TransitionEffect[];
}

export type TransitionEffect = 
  | 'fadeGlow'
  | 'expandCore'
  | 'contractCore'
  | 'neuralActivate'
  | 'neuralDeactivate'
  | 'particleBurst'
  | 'colorShift'
  | 'pulseIntensify'
  | 'shellRotate'
  | 'energySurge';

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

export const EASING = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInExpo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t: number) => {
    if (t === 0 || t === 1) return t;
    return t < 0.5
      ? Math.pow(2, 10 * (2 * t - 1)) / 2
      : (2 - Math.pow(2, -10 * (2 * t - 1))) / 2;
  },
  easeOutElastic: (t: number) => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  },
  easeOutBounce: (t: number) => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
} as const;

// ============================================================================
// TRANSITION PRESETS
// ============================================================================

export interface TransitionPreset {
  name: string;
  phases: TransitionPhaseConfig[];
  totalDuration: number;
}

export const TRANSITION_PRESETS: Record<string, TransitionPreset> = {
  // Standard smooth transition
  smooth: {
    name: 'smooth',
    totalDuration: 0.8,
    phases: [
      { name: 'exit', duration: 0.2, easing: EASING.easeOutQuad, effects: ['fadeGlow', 'contractCore'] },
      { name: 'morph', duration: 0.4, easing: EASING.easeInOutCubic, effects: ['colorShift'] },
      { name: 'enter', duration: 0.2, easing: EASING.easeInQuad, effects: ['fadeGlow', 'expandCore'] },
    ],
  },

  // Quick snap transition
  snap: {
    name: 'snap',
    totalDuration: 0.3,
    phases: [
      { name: 'exit', duration: 0.1, easing: EASING.easeInExpo, effects: ['contractCore'] },
      { name: 'enter', duration: 0.2, easing: EASING.easeOutElastic, effects: ['expandCore', 'particleBurst'] },
    ],
  },

  // Dramatic energy transition
  dramatic: {
    name: 'dramatic',
    totalDuration: 1.2,
    phases: [
      { name: 'exit', duration: 0.3, easing: EASING.easeInCubic, effects: ['fadeGlow', 'neuralDeactivate'] },
      { name: 'morph', duration: 0.6, easing: EASING.easeInOutExpo, effects: ['colorShift', 'energySurge', 'shellRotate'] },
      { name: 'enter', duration: 0.3, easing: EASING.easeOutCubic, effects: ['fadeGlow', 'neuralActivate', 'particleBurst'] },
    ],
  },

  // Pulse transition
  pulse: {
    name: 'pulse',
    totalDuration: 0.5,
    phases: [
      { name: 'exit', duration: 0.15, easing: EASING.easeInQuad, effects: ['contractCore', 'pulseIntensify'] },
      { name: 'morph', duration: 0.2, easing: EASING.linear, effects: ['colorShift'] },
      { name: 'enter', duration: 0.15, easing: EASING.easeOutBounce, effects: ['expandCore'] },
    ],
  },

  // Consciousness awakening
  awaken: {
    name: 'awaken',
    totalDuration: 1.5,
    phases: [
      { name: 'morph', duration: 0.5, easing: EASING.easeInQuad, effects: ['colorShift', 'neuralActivate'] },
      { name: 'enter', duration: 1.0, easing: EASING.easeOutExpo, effects: ['fadeGlow', 'expandCore', 'particleBurst', 'energySurge'] },
    ],
  },
};

// ============================================================================
// TRANSITION STATE
// ============================================================================

export interface TransitionState {
  isTransitioning: boolean;
  phase: TransitionPhase;
  progress: number; // 0-1 overall progress
  phaseProgress: number; // 0-1 progress within current phase
  fromState: OrbState | null;
  toState: OrbState | null;
  fromEmotion: Emotion | null;
  toEmotion: Emotion | null;
  preset: TransitionPreset;
  startTime: number;
  interpolatedColor: THREE.Color;
  interpolatedValues: Record<string, number>;
}

// ============================================================================
// TRANSITION MANAGER CLASS
// ============================================================================

export class TransitionManager {
  private state: TransitionState;
  private onUpdate?: (state: TransitionState) => void;
  private onComplete?: () => void;

  constructor() {
    this.state = this.createDefaultState();
  }

  private createDefaultState(): TransitionState {
    return {
      isTransitioning: false,
      phase: 'idle',
      progress: 0,
      phaseProgress: 0,
      fromState: null,
      toState: null,
      fromEmotion: null,
      toEmotion: null,
      preset: TRANSITION_PRESETS.smooth,
      startTime: 0,
      interpolatedColor: new THREE.Color(0xffffff),
      interpolatedValues: {},
    };
  }

  /**
   * Start a state transition
   */
  startStateTransition(
    fromState: OrbState,
    toState: OrbState,
    presetName: keyof typeof TRANSITION_PRESETS = 'smooth'
  ): void {
    const preset = TRANSITION_PRESETS[presetName];
    
    this.state = {
      ...this.createDefaultState(),
      isTransitioning: true,
      phase: preset.phases[0]?.name || 'morph',
      fromState,
      toState,
      preset,
      startTime: performance.now(),
    };
  }

  /**
   * Start an emotion transition
   */
  startEmotionTransition(
    fromEmotion: Emotion,
    toEmotion: Emotion,
    presetName: keyof typeof TRANSITION_PRESETS = 'smooth'
  ): void {
    const preset = TRANSITION_PRESETS[presetName];
    
    this.state = {
      ...this.createDefaultState(),
      isTransitioning: true,
      phase: preset.phases[0]?.name || 'morph',
      fromEmotion,
      toEmotion,
      preset,
      startTime: performance.now(),
    };
  }

  /**
   * Update the transition (call every frame)
   */
  update(): TransitionState {
    if (!this.state.isTransitioning) {
      return this.state;
    }

    const elapsed = (performance.now() - this.state.startTime) / 1000;
    const totalDuration = this.state.preset.totalDuration;
    
    // Calculate overall progress
    this.state.progress = Math.min(elapsed / totalDuration, 1);

    // Find current phase
    let accumulatedTime = 0;
    let currentPhaseIndex = 0;
    
    for (let i = 0; i < this.state.preset.phases.length; i++) {
      const phase = this.state.preset.phases[i];
      if (elapsed < accumulatedTime + phase.duration) {
        currentPhaseIndex = i;
        break;
      }
      accumulatedTime += phase.duration;
      currentPhaseIndex = i;
    }

    const currentPhase = this.state.preset.phases[currentPhaseIndex];
    if (currentPhase) {
      this.state.phase = currentPhase.name;
      const phaseElapsed = elapsed - accumulatedTime;
      const rawProgress = Math.min(phaseElapsed / currentPhase.duration, 1);
      this.state.phaseProgress = currentPhase.easing(rawProgress);
    }

    // Interpolate colors in LAB space
    this.interpolateColors();

    // Interpolate visual values
    this.interpolateValues();

    // Check completion
    if (this.state.progress >= 1) {
      this.state.isTransitioning = false;
      this.state.phase = 'complete';
      this.onComplete?.();
    }

    this.onUpdate?.(this.state);
    return this.state;
  }

  /**
   * Interpolate colors between states/emotions in LAB space
   */
  private interpolateColors(): void {
    const t = this.state.progress;

    if (this.state.fromEmotion && this.state.toEmotion) {
      const fromConfig = getEmotionConfig(this.state.fromEmotion);
      const toConfig = getEmotionConfig(this.state.toEmotion);
      
      const fromColor = new THREE.Color(fromConfig.colors.primary);
      const toColor = new THREE.Color(toConfig.colors.primary);
      
      this.state.interpolatedColor = lerpColorLAB(fromColor, toColor, t);
    }
  }

  /**
   * Interpolate visual values between states
   */
  private interpolateValues(): void {
    const t = this.state.progress;

    if (this.state.fromState && this.state.toState) {
      const fromConfig = getStateConfig(this.state.fromState);
      const toConfig = getStateConfig(this.state.toState);

      this.state.interpolatedValues = {
        glowIntensity: fromConfig.visual.glowIntensity + 
          (toConfig.visual.glowIntensity - fromConfig.visual.glowIntensity) * t,
        pulseRate: fromConfig.visual.pulseRate + 
          (toConfig.visual.pulseRate - fromConfig.visual.pulseRate) * t,
        particleSpeed: fromConfig.visual.particleSpeed + 
          (toConfig.visual.particleSpeed - fromConfig.visual.particleSpeed) * t,
        neuralActivity: fromConfig.visual.neuralActivity + 
          (toConfig.visual.neuralActivity - fromConfig.visual.neuralActivity) * t,
        energy: (fromConfig.energy ?? 0.5) + 
          ((toConfig.energy ?? 0.5) - (fromConfig.energy ?? 0.5)) * t,
      };
    }
  }

  /**
   * Cancel current transition
   */
  cancel(): void {
    this.state = this.createDefaultState();
  }

  /**
   * Get current transition state
   */
  getState(): TransitionState {
    return { ...this.state };
  }

  /**
   * Check if currently transitioning
   */
  isTransitioning(): boolean {
    return this.state.isTransitioning;
  }

  /**
   * Get current phase
   */
  getCurrentPhase(): TransitionPhase {
    return this.state.phase;
  }

  /**
   * Get active effects for current phase
   */
  getActiveEffects(): TransitionEffect[] {
    if (!this.state.isTransitioning) return [];
    
    const currentPhase = this.state.preset.phases.find(p => p.name === this.state.phase);
    return currentPhase?.effects || [];
  }

  /**
   * Set update callback
   */
  setOnUpdate(callback: (state: TransitionState) => void): void {
    this.onUpdate = callback;
  }

  /**
   * Set completion callback
   */
  setOnComplete(callback: () => void): void {
    this.onComplete = callback;
  }
}

// ============================================================================
// REACT HOOK
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseTransitionManagerOptions {
  defaultPreset?: keyof typeof TRANSITION_PRESETS;
  onTransitionStart?: () => void;
  onTransitionComplete?: () => void;
}

export interface UseTransitionManagerReturn {
  transitionState: TransitionState;
  isTransitioning: boolean;
  startStateTransition: (from: OrbState, to: OrbState, preset?: keyof typeof TRANSITION_PRESETS) => void;
  startEmotionTransition: (from: Emotion, to: Emotion, preset?: keyof typeof TRANSITION_PRESETS) => void;
  cancelTransition: () => void;
  getInterpolatedColor: () => THREE.Color;
  getInterpolatedValues: () => Record<string, number>;
  getActiveEffects: () => TransitionEffect[];
}

export function useTransitionManager(
  options: UseTransitionManagerOptions = {}
): UseTransitionManagerReturn {
  const {
    defaultPreset = 'smooth',
    onTransitionStart,
    onTransitionComplete,
  } = options;

  const managerRef = useRef<TransitionManager>(new TransitionManager());
  const animationFrameRef = useRef<number>(0);
  
  const [transitionState, setTransitionState] = useState<TransitionState>(
    managerRef.current.getState()
  );

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const state = managerRef.current.update();
      setTransitionState({ ...state });
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Setup callbacks
  useEffect(() => {
    managerRef.current.setOnComplete(() => {
      onTransitionComplete?.();
    });
  }, [onTransitionComplete]);

  const startStateTransition = useCallback((
    from: OrbState,
    to: OrbState,
    preset: keyof typeof TRANSITION_PRESETS = defaultPreset
  ) => {
    onTransitionStart?.();
    managerRef.current.startStateTransition(from, to, preset);
  }, [defaultPreset, onTransitionStart]);

  const startEmotionTransition = useCallback((
    from: Emotion,
    to: Emotion,
    preset: keyof typeof TRANSITION_PRESETS = defaultPreset
  ) => {
    onTransitionStart?.();
    managerRef.current.startEmotionTransition(from, to, preset);
  }, [defaultPreset, onTransitionStart]);

  const cancelTransition = useCallback(() => {
    managerRef.current.cancel();
  }, []);

  const getInterpolatedColor = useCallback(() => {
    return managerRef.current.getState().interpolatedColor;
  }, []);

  const getInterpolatedValues = useCallback(() => {
    return managerRef.current.getState().interpolatedValues;
  }, []);

  const getActiveEffects = useCallback(() => {
    return managerRef.current.getActiveEffects();
  }, []);

  return {
    transitionState,
    isTransitioning: transitionState.isTransitioning,
    startStateTransition,
    startEmotionTransition,
    cancelTransition,
    getInterpolatedColor,
    getInterpolatedValues,
    getActiveEffects,
  };
}

export default TransitionManager;
