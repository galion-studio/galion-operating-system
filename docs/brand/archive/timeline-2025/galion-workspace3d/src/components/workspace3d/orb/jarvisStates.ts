/**
 * jarvisStates.ts - Jarvis Orb State Machine Definitions
 * 
 * Visual states for the Jarvis-style AI Orb inspired by:
 * - Marvel's Jarvis/F.R.I.D.A.Y. holographic interfaces
 * - Ultron's angular, geometric data visualization
 * - Nebula aesthetics with neon accent lights
 * 
 * Key differences from GalionOrbV3:
 * - More angular/geometric structures
 * - Brighter, more saturated neon colors
 * - Floating holographic UI fragments
 * - Data stream visualizations
 * - Glossy glass with strong fresnel
 * 
 * States:
 * - Idle: Calm, floating, gentle breathing
 * - Listening: Alert, absorbing data streams
 * - Speaking: Projecting, radiating information
 * - Thinking: Rapid data processing
 * - Task: Executing, focused
 */

// Re-export base types for consistency
export type JarvisState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'task';

export interface JarvisStateConfig {
  /** Display name */
  label: string;
  
  /** Core pulse animation */
  pulse: {
    intensity: number;
    duration: number;
    easing: 'easeInOut' | 'easeOut' | 'linear';
  };
  
  /** Neon ring settings */
  rings: {
    /** Primary ring color (hex) */
    primaryColor: string;
    /** Secondary ring color (hex) */
    secondaryColor: string;
    /** Tertiary accent color (hex) */
    accentColor: string;
    /** Rotation speed multiplier */
    rotationSpeed: number;
    /** Glow intensity */
    glowIntensity: number;
  };
  
  /** Nebula core settings */
  nebula: {
    /** Base color (hex) */
    color: string;
    /** Turbulence speed */
    turbulence: number;
    /** Density (0-1) */
    density: number;
    /** Brightness */
    brightness: number;
  };
  
  /** Holographic UI fragments */
  hud: {
    /** Number of visible fragments */
    fragmentCount: number;
    /** Orbit speed */
    orbitSpeed: number;
    /** Visibility (0-1) */
    visibility: number;
    /** Color */
    color: string;
  };
  
  /** Memory nodes (internal components) */
  memories: {
    /** Number of active nodes */
    activeCount: number;
    /** Pulse frequency */
    pulseFrequency: number;
    /** Connection visibility */
    connectionVisibility: number;
    /** Node colors */
    colors: string[];
  };
  
  /** Overall scale */
  scale: {
    base: number;
    min: number;
    max: number;
    breathingSpeed: number;
  };
  
  /** Data stream effects */
  dataStreams: {
    /** Stream direction: 1=inward, -1=outward, 0=static */
    direction: number;
    /** Speed multiplier */
    speed: number;
    /** Density */
    density: number;
    /** Color */
    color: string;
  };
  
  /** Glass shell */
  glass: {
    /** Fresnel intensity */
    fresnelIntensity: number;
    /** Opacity */
    opacity: number;
    /** Refraction strength */
    refractionStrength: number;
  };
}

// ============================================================================
// JARVIS COLOR PALETTE
// ============================================================================

export const JARVIS_COLORS = {
  // Primary neon colors
  cyan: '#00ffff',
  magenta: '#ff00ff',
  gold: '#ffaa00',
  electric: '#00aaff',
  
  // Secondary colors
  deepBlue: '#0044aa',
  violet: '#8800ff',
  emerald: '#00ff88',
  coral: '#ff4488',
  
  // Neutrals
  white: '#ffffff',
  silver: '#aabbcc',
  dark: '#112233',
  
  // Nebula colors
  nebulaCyan: '#00ddff',
  nebulaPurple: '#8844ff',
  nebulaPink: '#ff44aa',
};

// ============================================================================
// STATE CONFIGURATIONS
// ============================================================================

export const JARVIS_STATES: Record<JarvisState, JarvisStateConfig> = {
  /**
   * IDLE - Calm, floating, gentle breathing
   * Like Jarvis in standby mode
   */
  idle: {
    label: 'Standby',
    pulse: {
      intensity: 0.02,
      duration: 5,
      easing: 'easeInOut',
    },
    rings: {
      primaryColor: JARVIS_COLORS.cyan,
      secondaryColor: JARVIS_COLORS.electric,
      accentColor: JARVIS_COLORS.magenta,
      rotationSpeed: 0.2,
      glowIntensity: 0.6,
    },
    nebula: {
      color: JARVIS_COLORS.nebulaCyan,
      turbulence: 0.3,
      density: 0.5,
      brightness: 0.6,
    },
    hud: {
      fragmentCount: 4,
      orbitSpeed: 0.1,
      visibility: 0.4,
      color: JARVIS_COLORS.cyan,
    },
    memories: {
      activeCount: 3,
      pulseFrequency: 0.5,
      connectionVisibility: 0.3,
      colors: [JARVIS_COLORS.cyan, JARVIS_COLORS.electric, JARVIS_COLORS.magenta],
    },
    scale: {
      base: 1.0,
      min: 0.98,
      max: 1.02,
      breathingSpeed: 0.3,
    },
    dataStreams: {
      direction: 1,
      speed: 0.3,
      density: 0.3,
      color: JARVIS_COLORS.cyan,
    },
    glass: {
      fresnelIntensity: 0.8,
      opacity: 0.2,
      refractionStrength: 0.3,
    },
  },

  /**
   * LISTENING - Alert, absorbing data
   * Active attention, data flowing inward
   */
  listening: {
    label: 'Listening',
    pulse: {
      intensity: 0.03,
      duration: 1.5,
      easing: 'easeInOut',
    },
    rings: {
      primaryColor: JARVIS_COLORS.emerald,
      secondaryColor: JARVIS_COLORS.cyan,
      accentColor: JARVIS_COLORS.gold,
      rotationSpeed: 0.5,
      glowIntensity: 0.8,
    },
    nebula: {
      color: JARVIS_COLORS.emerald,
      turbulence: 0.5,
      density: 0.6,
      brightness: 0.7,
    },
    hud: {
      fragmentCount: 6,
      orbitSpeed: 0.3,
      visibility: 0.7,
      color: JARVIS_COLORS.emerald,
    },
    memories: {
      activeCount: 5,
      pulseFrequency: 0.8,
      connectionVisibility: 0.5,
      colors: [JARVIS_COLORS.emerald, JARVIS_COLORS.cyan, JARVIS_COLORS.gold],
    },
    scale: {
      base: 1.02,
      min: 1.0,
      max: 1.04,
      breathingSpeed: 0.5,
    },
    dataStreams: {
      direction: 1,
      speed: 0.8,
      density: 0.6,
      color: JARVIS_COLORS.emerald,
    },
    glass: {
      fresnelIntensity: 1.0,
      opacity: 0.25,
      refractionStrength: 0.4,
    },
  },

  /**
   * SPEAKING - Projecting, radiating information
   * Bright, outward energy, confident
   */
  speaking: {
    label: 'Speaking',
    pulse: {
      intensity: 0.04,
      duration: 0.8,
      easing: 'easeOut',
    },
    rings: {
      primaryColor: JARVIS_COLORS.gold,
      secondaryColor: JARVIS_COLORS.coral,
      accentColor: JARVIS_COLORS.magenta,
      rotationSpeed: 0.8,
      glowIntensity: 1.2,
    },
    nebula: {
      color: JARVIS_COLORS.gold,
      turbulence: 0.7,
      density: 0.8,
      brightness: 1.0,
    },
    hud: {
      fragmentCount: 8,
      orbitSpeed: 0.5,
      visibility: 1.0,
      color: JARVIS_COLORS.gold,
    },
    memories: {
      activeCount: 7,
      pulseFrequency: 1.2,
      connectionVisibility: 0.9,
      colors: [JARVIS_COLORS.gold, JARVIS_COLORS.coral, JARVIS_COLORS.white],
    },
    scale: {
      base: 1.0,
      min: 0.98,
      max: 1.06,
      breathingSpeed: 1.0,
    },
    dataStreams: {
      direction: -1,
      speed: 1.2,
      density: 0.9,
      color: JARVIS_COLORS.gold,
    },
    glass: {
      fresnelIntensity: 1.5,
      opacity: 0.15,
      refractionStrength: 0.5,
    },
  },

  /**
   * THINKING - Rapid data processing
   * Intense internal activity, synapses firing
   */
  thinking: {
    label: 'Processing',
    pulse: {
      intensity: 0.025,
      duration: 2,
      easing: 'easeInOut',
    },
    rings: {
      primaryColor: JARVIS_COLORS.violet,
      secondaryColor: JARVIS_COLORS.magenta,
      accentColor: JARVIS_COLORS.cyan,
      rotationSpeed: 1.2,
      glowIntensity: 0.9,
    },
    nebula: {
      color: JARVIS_COLORS.nebulaPurple,
      turbulence: 1.0,
      density: 0.9,
      brightness: 0.8,
    },
    hud: {
      fragmentCount: 10,
      orbitSpeed: 0.8,
      visibility: 0.9,
      color: JARVIS_COLORS.violet,
    },
    memories: {
      activeCount: 10,
      pulseFrequency: 2.0,
      connectionVisibility: 1.0,
      colors: [JARVIS_COLORS.violet, JARVIS_COLORS.magenta, JARVIS_COLORS.cyan, JARVIS_COLORS.gold],
    },
    scale: {
      base: 1.0,
      min: 0.99,
      max: 1.01,
      breathingSpeed: 0.8,
    },
    dataStreams: {
      direction: 1,
      speed: 1.5,
      density: 1.0,
      color: JARVIS_COLORS.violet,
    },
    glass: {
      fresnelIntensity: 1.2,
      opacity: 0.2,
      refractionStrength: 0.6,
    },
  },

  /**
   * TASK - Executing, focused
   * Determined, working, progress
   */
  task: {
    label: 'Executing',
    pulse: {
      intensity: 0.03,
      duration: 1.5,
      easing: 'easeInOut',
    },
    rings: {
      primaryColor: JARVIS_COLORS.coral,
      secondaryColor: JARVIS_COLORS.gold,
      accentColor: JARVIS_COLORS.emerald,
      rotationSpeed: 0.6,
      glowIntensity: 1.0,
    },
    nebula: {
      color: JARVIS_COLORS.coral,
      turbulence: 0.6,
      density: 0.7,
      brightness: 0.9,
    },
    hud: {
      fragmentCount: 6,
      orbitSpeed: 0.4,
      visibility: 0.8,
      color: JARVIS_COLORS.coral,
    },
    memories: {
      activeCount: 6,
      pulseFrequency: 1.0,
      connectionVisibility: 0.8,
      colors: [JARVIS_COLORS.coral, JARVIS_COLORS.gold, JARVIS_COLORS.emerald],
    },
    scale: {
      base: 1.0,
      min: 0.97,
      max: 1.03,
      breathingSpeed: 0.6,
    },
    dataStreams: {
      direction: 0,
      speed: 0.7,
      density: 0.7,
      color: JARVIS_COLORS.coral,
    },
    glass: {
      fresnelIntensity: 1.0,
      opacity: 0.2,
      refractionStrength: 0.4,
    },
  },
};

// ============================================================================
// TRANSITION CONFIGURATIONS
// ============================================================================

export interface JarvisTransition {
  duration: number;
  easing: string;
}

export const JARVIS_TRANSITIONS: Record<string, JarvisTransition> = {
  default: { duration: 400, easing: 'ease-in-out' },
  'idle->listening': { duration: 250, easing: 'ease-out' },
  'listening->idle': { duration: 350, easing: 'ease-in-out' },
  'idle->speaking': { duration: 200, easing: 'ease-out' },
  'speaking->idle': { duration: 500, easing: 'ease-in-out' },
  'idle->thinking': { duration: 300, easing: 'ease-in' },
  'thinking->speaking': { duration: 200, easing: 'ease-out' },
  'idle->task': { duration: 350, easing: 'ease-in-out' },
  'task->idle': { duration: 450, easing: 'ease-in-out' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getJarvisStateConfig(state: JarvisState): JarvisStateConfig {
  return JARVIS_STATES[state];
}

export function getJarvisTransition(from: JarvisState, to: JarvisState): JarvisTransition {
  const key = `${from}->${to}`;
  return JARVIS_TRANSITIONS[key] || JARVIS_TRANSITIONS.default;
}

export function interpolateJarvisStates(
  from: JarvisStateConfig,
  to: JarvisStateConfig,
  progress: number
): Partial<JarvisStateConfig> {
  const lerp = (a: number, b: number) => a + (b - a) * progress;
  const lerpColor = (a: string, b: string) => progress < 0.5 ? a : b;
  
  return {
    pulse: {
      intensity: lerp(from.pulse.intensity, to.pulse.intensity),
      duration: lerp(from.pulse.duration, to.pulse.duration),
      easing: progress < 0.5 ? from.pulse.easing : to.pulse.easing,
    },
    rings: {
      primaryColor: lerpColor(from.rings.primaryColor, to.rings.primaryColor),
      secondaryColor: lerpColor(from.rings.secondaryColor, to.rings.secondaryColor),
      accentColor: lerpColor(from.rings.accentColor, to.rings.accentColor),
      rotationSpeed: lerp(from.rings.rotationSpeed, to.rings.rotationSpeed),
      glowIntensity: lerp(from.rings.glowIntensity, to.rings.glowIntensity),
    },
    nebula: {
      color: lerpColor(from.nebula.color, to.nebula.color),
      turbulence: lerp(from.nebula.turbulence, to.nebula.turbulence),
      density: lerp(from.nebula.density, to.nebula.density),
      brightness: lerp(from.nebula.brightness, to.nebula.brightness),
    },
    hud: {
      fragmentCount: Math.round(lerp(from.hud.fragmentCount, to.hud.fragmentCount)),
      orbitSpeed: lerp(from.hud.orbitSpeed, to.hud.orbitSpeed),
      visibility: lerp(from.hud.visibility, to.hud.visibility),
      color: lerpColor(from.hud.color, to.hud.color),
    },
    memories: {
      activeCount: Math.round(lerp(from.memories.activeCount, to.memories.activeCount)),
      pulseFrequency: lerp(from.memories.pulseFrequency, to.memories.pulseFrequency),
      connectionVisibility: lerp(from.memories.connectionVisibility, to.memories.connectionVisibility),
      colors: progress < 0.5 ? from.memories.colors : to.memories.colors,
    },
    scale: {
      base: lerp(from.scale.base, to.scale.base),
      min: lerp(from.scale.min, to.scale.min),
      max: lerp(from.scale.max, to.scale.max),
      breathingSpeed: lerp(from.scale.breathingSpeed, to.scale.breathingSpeed),
    },
    dataStreams: {
      direction: lerp(from.dataStreams.direction, to.dataStreams.direction),
      speed: lerp(from.dataStreams.speed, to.dataStreams.speed),
      density: lerp(from.dataStreams.density, to.dataStreams.density),
      color: lerpColor(from.dataStreams.color, to.dataStreams.color),
    },
    glass: {
      fresnelIntensity: lerp(from.glass.fresnelIntensity, to.glass.fresnelIntensity),
      opacity: lerp(from.glass.opacity, to.glass.opacity),
      refractionStrength: lerp(from.glass.refractionStrength, to.glass.refractionStrength),
    },
  };
}

export default JARVIS_STATES;

