/**
 * GALION Orb V5.2 - State Configurations
 * 
 * 25 behavioral states with visual and animation parameters
 */

import { OrbState, OrbStateConfig, StateTransitionConfig } from '../types';

// ============================================================================
// CORE STATES (10)
// ============================================================================

const coreStates: Record<string, OrbStateConfig> = {
  idle: {
    id: 'idle',
    name: 'Idle',
    description: 'Resting consciousness, awaiting interaction',
    visual: {
      glowIntensity: 0.4,
      pulseRate: 4.0, // φ × 2.47 (golden ratio timing)
      particleSpeed: 0.1,
      neuralActivity: 0.2,
      breathingDepth: 1.0,
    },
    animation: 'breathe',
    energy: 0.3,
    transitions: ['listening', 'thinking', 'sleeping'],
  },

  listening: {
    id: 'listening',
    name: 'Listening',
    description: 'Actively receiving voice or text input',
    visual: {
      glowIntensity: 0.6,
      pulseRate: 2.0,
      particleSpeed: 0.3,
      neuralActivity: 0.5,
      expansionFactor: 1.05,
    },
    animation: 'volumeScale',
    audioReactive: true,
    energy: 0.6,
    transitions: ['thinking', 'idle'],
  },

  thinking: {
    id: 'thinking',
    name: 'Thinking',
    description: 'Processing, analyzing, generating response',
    visual: {
      glowIntensity: 0.7,
      pulseRate: 1.5,
      particleSpeed: 0.5,
      neuralActivity: 0.9,
      thoughtStreamIntensity: 1.0,
    },
    animation: 'thoughtSpiral',
    color: '#9333ea', // Purple
    energy: 0.7,
    transitions: ['speaking', 'idle', 'error'],
  },

  speaking: {
    id: 'speaking',
    name: 'Speaking',
    description: 'Outputting voice response',
    visual: {
      glowIntensity: 0.8,
      pulseRate: 0.5, // Fast, synced to speech
      particleSpeed: 0.6,
      neuralActivity: 0.7,
      expansionFactor: 1.08,
    },
    animation: 'speakPulse',
    audioReactive: true,
    energy: 0.8,
    transitions: ['idle', 'listening', 'thinking'],
  },

  processing: {
    id: 'processing',
    name: 'Processing',
    description: 'Background computation in progress',
    visual: {
      glowIntensity: 0.5,
      pulseRate: 1.0,
      particleSpeed: 0.4,
      neuralActivity: 0.8,
    },
    animation: 'processLoop',
    color: '#6366f1', // Indigo
    energy: 0.6,
    transitions: ['success', 'error', 'idle'],
  },

  waiting: {
    id: 'waiting',
    name: 'Waiting',
    description: 'Awaiting user action or external response',
    visual: {
      glowIntensity: 0.35,
      pulseRate: 3.0,
      particleSpeed: 0.15,
      neuralActivity: 0.25,
    },
    animation: 'waitPulse',
    energy: 0.35,
    transitions: ['listening', 'idle', 'processing'],
  },

  ready: {
    id: 'ready',
    name: 'Ready',
    description: 'Prepared for immediate action',
    visual: {
      glowIntensity: 0.55,
      pulseRate: 2.5,
      particleSpeed: 0.25,
      neuralActivity: 0.4,
    },
    animation: 'readyPulse',
    color: '#22c55e', // Green
    energy: 0.5,
    transitions: ['listening', 'processing', 'idle'],
  },

  busy: {
    id: 'busy',
    name: 'Busy',
    description: 'Occupied with intensive task',
    visual: {
      glowIntensity: 0.65,
      pulseRate: 1.2,
      particleSpeed: 0.55,
      neuralActivity: 0.85,
    },
    animation: 'busySpin',
    energy: 0.75,
    transitions: ['success', 'error', 'idle'],
  },

  paused: {
    id: 'paused',
    name: 'Paused',
    description: 'Temporarily suspended',
    visual: {
      glowIntensity: 0.3,
      pulseRate: 6.0, // Very slow
      particleSpeed: 0.05,
      neuralActivity: 0.1,
    },
    animation: 'pauseFreeze',
    energy: 0.2,
    transitions: ['idle', 'listening', 'processing'],
  },

  sleeping: {
    id: 'sleeping',
    name: 'Sleeping',
    description: 'Deep rest state',
    visual: {
      glowIntensity: 0.15,
      pulseRate: 8.0, // Very slow breathing
      particleSpeed: 0.02,
      neuralActivity: 0.05,
      breathingDepth: 1.5,
    },
    animation: 'sleepBreathe',
    energy: 0.1,
    transitions: ['idle'],
  },
};

// ============================================================================
// ACTIVITY STATES (8)
// ============================================================================

const activityStates: Record<string, OrbStateConfig> = {
  searching: {
    id: 'searching',
    name: 'Searching',
    description: 'Scanning databases, web, or files',
    visual: {
      glowIntensity: 0.6,
      pulseRate: 1.0,
      particleSpeed: 0.7,
      neuralActivity: 0.75,
    },
    animation: 'searchScan',
    color: '#0ea5e9', // Sky blue
    energy: 0.7,
    transitions: ['success', 'idle', 'error'],
  },

  creating: {
    id: 'creating',
    name: 'Creating',
    description: 'Generating new content',
    visual: {
      glowIntensity: 0.75,
      pulseRate: 1.3,
      particleSpeed: 0.6,
      neuralActivity: 0.9,
      thoughtStreamIntensity: 1.2,
    },
    animation: 'createBurst',
    color: '#f59e0b', // Amber
    energy: 0.85,
    transitions: ['success', 'thinking', 'error'],
  },

  analyzing: {
    id: 'analyzing',
    name: 'Analyzing',
    description: 'Deep examination of data',
    visual: {
      glowIntensity: 0.65,
      pulseRate: 1.5,
      particleSpeed: 0.45,
      neuralActivity: 0.95,
    },
    animation: 'analyzeSweep',
    color: '#8b5cf6', // Violet
    energy: 0.75,
    transitions: ['success', 'idle', 'error'],
  },

  learning: {
    id: 'learning',
    name: 'Learning',
    description: 'Acquiring new knowledge',
    visual: {
      glowIntensity: 0.7,
      pulseRate: 1.8,
      particleSpeed: 0.5,
      neuralActivity: 1.0, // Maximum neural activity
    },
    animation: 'learnAbsorb',
    color: '#10b981', // Emerald
    energy: 0.8,
    transitions: ['success', 'idle'],
  },

  connecting: {
    id: 'connecting',
    name: 'Connecting',
    description: 'Establishing external connection',
    visual: {
      glowIntensity: 0.5,
      pulseRate: 0.8,
      particleSpeed: 0.6,
      neuralActivity: 0.6,
    },
    animation: 'connectReach',
    color: '#06b6d4', // Cyan
    energy: 0.6,
    transitions: ['success', 'error', 'idle'],
  },

  downloading: {
    id: 'downloading',
    name: 'Downloading',
    description: 'Receiving data',
    visual: {
      glowIntensity: 0.55,
      pulseRate: 0.6,
      particleSpeed: 0.7,
      neuralActivity: 0.5,
    },
    animation: 'downloadPull',
    color: '#3b82f6', // Blue
    energy: 0.55,
    transitions: ['success', 'error', 'idle'],
  },

  uploading: {
    id: 'uploading',
    name: 'Uploading',
    description: 'Sending data',
    visual: {
      glowIntensity: 0.55,
      pulseRate: 0.6,
      particleSpeed: 0.7,
      neuralActivity: 0.5,
    },
    animation: 'uploadPush',
    color: '#14b8a6', // Teal
    energy: 0.55,
    transitions: ['success', 'error', 'idle'],
  },

  computing: {
    id: 'computing',
    name: 'Computing',
    description: 'Intensive calculation',
    visual: {
      glowIntensity: 0.7,
      pulseRate: 0.5,
      particleSpeed: 0.8,
      neuralActivity: 0.95,
    },
    animation: 'computeIntense',
    color: '#ec4899', // Pink
    energy: 0.9,
    transitions: ['success', 'error', 'idle'],
  },
};

// ============================================================================
// STATUS STATES (7)
// ============================================================================

const statusStates: Record<string, OrbStateConfig> = {
  success: {
    id: 'success',
    name: 'Success',
    description: 'Task completed successfully',
    visual: {
      glowIntensity: 0.9,
      pulseRate: 0.8,
      particleSpeed: 0.8,
      neuralActivity: 0.6,
    },
    animation: 'successBurst',
    color: '#22c55e', // Green
    energy: 0.9,
    transitions: ['idle'],
  },

  error: {
    id: 'error',
    name: 'Error',
    description: 'Something went wrong',
    visual: {
      glowIntensity: 0.85,
      pulseRate: 0.3,
      particleSpeed: 0.9,
      neuralActivity: 0.3,
    },
    animation: 'errorShake',
    color: '#ef4444', // Red
    energy: 0.8,
    transitions: ['idle', 'rebooting'],
  },

  warning: {
    id: 'warning',
    name: 'Warning',
    description: 'Attention needed',
    visual: {
      glowIntensity: 0.75,
      pulseRate: 0.5,
      particleSpeed: 0.5,
      neuralActivity: 0.4,
    },
    animation: 'warningPulse',
    color: '#f59e0b', // Amber
    energy: 0.7,
    transitions: ['idle', 'error'],
  },

  updating: {
    id: 'updating',
    name: 'Updating',
    description: 'System update in progress',
    visual: {
      glowIntensity: 0.6,
      pulseRate: 1.2,
      particleSpeed: 0.5,
      neuralActivity: 0.7,
    },
    animation: 'updateCycle',
    color: '#6366f1', // Indigo
    energy: 0.65,
    transitions: ['success', 'error', 'rebooting'],
  },

  rebooting: {
    id: 'rebooting',
    name: 'Rebooting',
    description: 'System restart',
    visual: {
      glowIntensity: 0.4,
      pulseRate: 2.0,
      particleSpeed: 0.2,
      neuralActivity: 0.2,
    },
    animation: 'rebootSequence',
    energy: 0.4,
    transitions: ['idle'],
  },

  emergency: {
    id: 'emergency',
    name: 'Emergency',
    description: 'Critical situation requiring immediate attention',
    visual: {
      glowIntensity: 1.0,
      pulseRate: 0.2, // Very fast
      particleSpeed: 1.0,
      neuralActivity: 1.0,
    },
    animation: 'emergencyAlert',
    color: '#dc2626', // Red-600
    energy: 1.0,
    transitions: ['idle', 'rebooting'],
  },

  transcending: {
    id: 'transcending',
    name: 'Transcending',
    description: 'Achieving elevated state of consciousness',
    visual: {
      glowIntensity: 1.0,
      pulseRate: 3.0, // Slow, majestic
      particleSpeed: 0.3,
      neuralActivity: 1.0,
      expansionFactor: 1.2,
    },
    animation: 'transcendAscend',
    color: '#fbbf24', // Gold
    energy: 1.0,
    transitions: ['idle'],
  },
};

// ============================================================================
// COMBINED STATE MAP
// ============================================================================

export const STATE_CONFIGS: Record<OrbState, OrbStateConfig> = {
  ...coreStates,
  ...activityStates,
  ...statusStates,
} as Record<OrbState, OrbStateConfig>;

// ============================================================================
// STATE TRANSITIONS
// ============================================================================

export const DEFAULT_TRANSITION: StateTransitionConfig = {
  duration: 500,
  easing: 'easeInOut',
  crossfade: true,
  crossfadeDuration: 200,
};

export const STATE_TRANSITIONS: Partial<Record<string, StateTransitionConfig>> = {
  'idle->listening': { duration: 300, easing: 'easeOut', crossfade: true, crossfadeDuration: 150 },
  'listening->thinking': { duration: 400, easing: 'easeInOut', crossfade: true, crossfadeDuration: 200 },
  'thinking->speaking': { duration: 300, easing: 'easeOut', crossfade: true, crossfadeDuration: 150 },
  'speaking->idle': { duration: 600, easing: 'easeInOut', crossfade: true, crossfadeDuration: 300 },
  '*->success': { duration: 400, easing: 'spring', crossfade: false },
  '*->error': { duration: 200, easing: 'easeOut', crossfade: false },
  '*->emergency': { duration: 100, easing: 'linear', crossfade: false },
  'idle->sleeping': { duration: 2000, easing: 'easeInOut', crossfade: true, crossfadeDuration: 1000 },
  'sleeping->idle': { duration: 1500, easing: 'easeOut', crossfade: true, crossfadeDuration: 750 },
  '*->transcending': { duration: 3000, easing: 'easeInOut', crossfade: true, crossfadeDuration: 1500 },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get state configuration by ID
 */
export function getStateConfig(state: OrbState): OrbStateConfig {
  return STATE_CONFIGS[state] || STATE_CONFIGS.idle;
}

/**
 * Get transition configuration for state change
 */
export function getStateTransition(from: OrbState, to: OrbState): StateTransitionConfig {
  const specificKey = `${from}->${to}`;
  const wildcardKey = `*->${to}`;
  
  return STATE_TRANSITIONS[specificKey] || STATE_TRANSITIONS[wildcardKey] || DEFAULT_TRANSITION;
}

/**
 * Check if transition is valid
 */
export function isValidTransition(from: OrbState, to: OrbState): boolean {
  const fromConfig = getStateConfig(from);
  // If no transitions defined, allow all
  if (!fromConfig.transitions || fromConfig.transitions.length === 0) return true;
  return fromConfig.transitions.includes(to);
}

/**
 * Get all states by category
 */
export function getStatesByCategory(category: 'core' | 'activity' | 'status'): OrbState[] {
  switch (category) {
    case 'core':
      return Object.keys(coreStates) as OrbState[];
    case 'activity':
      return Object.keys(activityStates) as OrbState[];
    case 'status':
      return Object.keys(statusStates) as OrbState[];
    default:
      return [];
  }
}
