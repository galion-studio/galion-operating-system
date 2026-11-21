/**
 * orbV3States.ts - Orb State Machine Definitions
 * 
 * Defines the 5 visual states for the Galion V3 Orb per the V3 guide:
 * - Idle: Default calm state
 * - Listening: User is speaking
 * - Speaking: AI is responding
 * - Thinking: Processing/generating
 * - Task: Executing an action
 * 
 * Each state has specific animation parameters for:
 * - Pulse intensity and speed
 * - Glow behavior
 * - Gradient motion
 * - Scale variations
 */

// ============================================================================
// TYPES
// ============================================================================

export type OrbState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'task';

export interface OrbStateConfig {
  /** Display name for UI */
  label: string;
  
  /** Pulse animation settings */
  pulse: {
    /** Scale variation as percentage (e.g., 0.02 = 2%) */
    intensity: number;
    /** Pulse cycle duration in seconds */
    duration: number;
    /** Easing function */
    easing: 'easeInOut' | 'easeOut' | 'linear';
  };
  
  /** Glow effect settings */
  glow: {
    /** Base glow intensity (0-1) */
    intensity: number;
    /** Glow variation amount */
    variation: number;
    /** Should glow pulse */
    pulsing: boolean;
    /** Pulse speed multiplier */
    speed: number;
  };
  
  /** Gradient/internal motion */
  gradient: {
    /** Rotation speed in radians per second */
    rotationSpeed: number;
    /** Speed multiplier for internal effects */
    motionMultiplier: number;
    /** Should gradients brighten */
    brighten: boolean;
  };
  
  /** Scale settings */
  scale: {
    /** Base scale (1.0 = 100%) */
    base: number;
    /** Minimum scale variation */
    min: number;
    /** Maximum scale variation */
    max: number;
  };
  
  /** Neural network activity */
  neural: {
    /** Firing frequency (0-1, 0 = none, 1 = constant) */
    activity: number;
    /** Connection visibility (0-1) */
    visibility: number;
  };
  
  /** Energy stream direction and speed */
  energyFlow: {
    /** Direction: 1 = inward, -1 = outward, 0 = static */
    direction: number;
    /** Speed multiplier */
    speed: number;
  };
  
  /** Core singularity settings */
  core: {
    /** Brightness (0-1) */
    brightness: number;
    /** Pulse speed */
    pulseSpeed: number;
  };
}

export interface StateTransition {
  /** Duration in milliseconds */
  duration: number;
  /** Easing for scale changes */
  scaleEasing: string;
  /** Easing for color/glow changes */
  colorEasing: string;
}

// ============================================================================
// STATE CONFIGURATIONS (per V3 Guide Part 4.1)
// ============================================================================

export const ORB_STATES: Record<OrbState, OrbStateConfig> = {
  /**
   * IDLE - Default calm state
   * Contemplative god, observing, waiting
   */
  idle: {
    label: 'Idle',
    pulse: {
      intensity: 0.015, // 1-2%
      duration: 4,
      easing: 'easeInOut',
    },
    glow: {
      intensity: 0.5,
      variation: 0.1,
      pulsing: true,
      speed: 0.25,
    },
    gradient: {
      rotationSpeed: 0.02,
      motionMultiplier: 0.2,
      brighten: false,
    },
    scale: {
      base: 1.0,
      min: 1.0,
      max: 1.0,
    },
    neural: {
      activity: 0.1, // Occasional sparks
      visibility: 0.3,
    },
    energyFlow: {
      direction: 1, // Slow inward
      speed: 0.3,
    },
    core: {
      brightness: 0.6,
      pulseSpeed: 0.25, // 4s cycle
    },
  },

  /**
   * LISTENING - User is speaking
   * Alert, absorbing information, focused attention
   */
  listening: {
    label: 'Listening',
    pulse: {
      intensity: 0.025, // 2-3%
      duration: 1.2,
      easing: 'easeInOut',
    },
    glow: {
      intensity: 0.7,
      variation: 0.2,
      pulsing: true,
      speed: 0.8,
    },
    gradient: {
      rotationSpeed: 0.04,
      motionMultiplier: 0.4,
      brighten: false,
    },
    scale: {
      base: 1.015,
      min: 1.01,
      max: 1.02,
    },
    neural: {
      activity: 0.3, // On standby, some activity
      visibility: 0.5,
    },
    energyFlow: {
      direction: 1, // Inward flow (absorbing)
      speed: 0.8,
    },
    core: {
      brightness: 0.4, // Dimmed (receiving)
      pulseSpeed: 0.5,
    },
  },

  /**
   * SPEAKING - AI is responding
   * Projecting, expressing, radiating energy
   */
  speaking: {
    label: 'Speaking',
    pulse: {
      intensity: 0.03, // 0-3% synced to speech
      duration: 0.6,
      easing: 'easeOut',
    },
    glow: {
      intensity: 0.9,
      variation: 0.3,
      pulsing: true,
      speed: 1.5,
    },
    gradient: {
      rotationSpeed: 0.06,
      motionMultiplier: 0.8,
      brighten: true,
    },
    scale: {
      base: 1.0,
      min: 1.0,
      max: 1.03,
    },
    neural: {
      activity: 0.6, // Radiating outward
      visibility: 0.8,
    },
    energyFlow: {
      direction: -1, // Outward flow (projecting)
      speed: 1.2,
    },
    core: {
      brightness: 1.0, // Bright
      pulseSpeed: 1.5,
    },
  },

  /**
   * THINKING - Processing/generating
   * Deep contemplation, synapses firing rapidly
   */
  thinking: {
    label: 'Thinking',
    pulse: {
      intensity: 0.015, // 1-2%
      duration: 3,
      easing: 'easeInOut',
    },
    glow: {
      intensity: 0.65,
      variation: 0.15,
      pulsing: true,
      speed: 0.5,
    },
    gradient: {
      rotationSpeed: 0.08, // Faster internal swirl
      motionMultiplier: 1.0,
      brighten: false,
    },
    scale: {
      base: 1.0,
      min: 1.0,
      max: 1.0,
    },
    neural: {
      activity: 0.9, // Rapid firing!
      visibility: 1.0,
    },
    energyFlow: {
      direction: 1, // Accelerated inward
      speed: 1.5,
    },
    core: {
      brightness: 0.8,
      pulseSpeed: 1.0, // 1s cycle
    },
  },

  /**
   * TASK - Executing an action
   * Focused, determined, working
   */
  task: {
    label: 'Task Active',
    pulse: {
      intensity: 0.02, // Deep, slow
      duration: 2,
      easing: 'easeInOut',
    },
    glow: {
      intensity: 0.75,
      variation: 0.2,
      pulsing: true,
      speed: 0.6,
    },
    gradient: {
      rotationSpeed: 0.05,
      motionMultiplier: 0.6,
      brighten: false,
    },
    scale: {
      base: 1.0,
      min: 0.98,
      max: 1.02,
    },
    neural: {
      activity: 0.7,
      visibility: 0.9,
    },
    energyFlow: {
      direction: 0, // Circular/contained
      speed: 0.7,
    },
    core: {
      brightness: 0.85,
      pulseSpeed: 0.75,
    },
  },
};

// ============================================================================
// TRANSITION CONFIGURATIONS
// ============================================================================

export const STATE_TRANSITIONS: Record<string, StateTransition> = {
  // Default transition
  default: {
    duration: 300,
    scaleEasing: 'ease-out',
    colorEasing: 'ease-in-out',
  },
  
  // Quick transitions for speaking
  'idle->speaking': {
    duration: 150,
    scaleEasing: 'ease-out',
    colorEasing: 'ease-out',
  },
  'speaking->idle': {
    duration: 400,
    scaleEasing: 'ease-in-out',
    colorEasing: 'ease-in-out',
  },
  
  // Listening transitions
  'idle->listening': {
    duration: 200,
    scaleEasing: 'ease-out',
    colorEasing: 'ease-out',
  },
  'listening->idle': {
    duration: 300,
    scaleEasing: 'ease-in-out',
    colorEasing: 'ease-in-out',
  },
  
  // Thinking transitions
  'idle->thinking': {
    duration: 250,
    scaleEasing: 'ease-in-out',
    colorEasing: 'ease-in',
  },
  'thinking->speaking': {
    duration: 150,
    scaleEasing: 'ease-out',
    colorEasing: 'ease-out',
  },
  
  // Task transitions
  'idle->task': {
    duration: 300,
    scaleEasing: 'ease-in-out',
    colorEasing: 'ease-in-out',
  },
  'task->idle': {
    duration: 400,
    scaleEasing: 'ease-in-out',
    colorEasing: 'ease-in-out',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get state configuration by name
 */
export function getStateConfig(state: OrbState): OrbStateConfig {
  return ORB_STATES[state];
}

/**
 * Get transition configuration between two states
 */
export function getTransition(from: OrbState, to: OrbState): StateTransition {
  const key = `${from}->${to}`;
  return STATE_TRANSITIONS[key] || STATE_TRANSITIONS.default;
}

/**
 * Interpolate between two state configs
 */
export function interpolateStates(
  from: OrbStateConfig,
  to: OrbStateConfig,
  progress: number // 0-1
): Partial<OrbStateConfig> {
  const lerp = (a: number, b: number) => a + (b - a) * progress;
  
  return {
    pulse: {
      intensity: lerp(from.pulse.intensity, to.pulse.intensity),
      duration: lerp(from.pulse.duration, to.pulse.duration),
      easing: progress < 0.5 ? from.pulse.easing : to.pulse.easing,
    },
    glow: {
      intensity: lerp(from.glow.intensity, to.glow.intensity),
      variation: lerp(from.glow.variation, to.glow.variation),
      pulsing: to.glow.pulsing,
      speed: lerp(from.glow.speed, to.glow.speed),
    },
    gradient: {
      rotationSpeed: lerp(from.gradient.rotationSpeed, to.gradient.rotationSpeed),
      motionMultiplier: lerp(from.gradient.motionMultiplier, to.gradient.motionMultiplier),
      brighten: progress > 0.5 ? to.gradient.brighten : from.gradient.brighten,
    },
    scale: {
      base: lerp(from.scale.base, to.scale.base),
      min: lerp(from.scale.min, to.scale.min),
      max: lerp(from.scale.max, to.scale.max),
    },
    neural: {
      activity: lerp(from.neural.activity, to.neural.activity),
      visibility: lerp(from.neural.visibility, to.neural.visibility),
    },
    energyFlow: {
      direction: lerp(from.energyFlow.direction, to.energyFlow.direction),
      speed: lerp(from.energyFlow.speed, to.energyFlow.speed),
    },
    core: {
      brightness: lerp(from.core.brightness, to.core.brightness),
      pulseSpeed: lerp(from.core.pulseSpeed, to.core.pulseSpeed),
    },
  };
}

/**
 * Get audio-reactive scale for speaking state
 */
export function getAudioReactiveScale(audioLevel: number, baseConfig: OrbStateConfig): number {
  const { base, min, max } = baseConfig.scale;
  const range = max - min;
  return base + (audioLevel * range);
}

export default ORB_STATES;

