'use client';

/**
 * BootTimeline - Boot Sequence Timeline Configuration
 * 
 * Defines the steps and timing for the STARK system boot sequence.
 * 
 * "Initializing STARK systems..."
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BootStep {
  id: string;
  label: string;
  duration: number; // ms
  subSteps?: string[];
  sound?: 'boot' | 'confirm' | 'notification';
}

export interface BootTimeline {
  totalDuration: number;
  steps: BootStep[];
}

// ============================================================================
// BOOT STEPS
// ============================================================================

export const STARK_BOOT_STEPS: BootStep[] = [
  {
    id: 'power',
    label: 'Power Systems',
    duration: 400,
    subSteps: ['Arc reactor stable', 'Power distribution online'],
    sound: 'boot',
  },
  {
    id: 'core',
    label: 'Core Systems',
    duration: 500,
    subSteps: ['Neural interface', 'Memory allocation', 'Process initialization'],
  },
  {
    id: 'sensors',
    label: 'Sensor Array',
    duration: 350,
    subSteps: ['Visual systems', 'Motion tracking', 'Depth sensors'],
  },
  {
    id: 'hud',
    label: 'HUD Interface',
    duration: 450,
    subSteps: ['Display calibration', 'UI elements', 'Overlay systems'],
  },
  {
    id: 'audio',
    label: 'Audio Systems',
    duration: 300,
    subSteps: ['Sound synthesis', 'Voice recognition'],
    sound: 'notification',
  },
  {
    id: 'network',
    label: 'Network Connection',
    duration: 400,
    subSteps: ['Secure channel', 'API handshake', 'Data sync'],
  },
  {
    id: 'ai',
    label: 'AI Systems',
    duration: 600,
    subSteps: ['Language model', 'Pattern recognition', 'Predictive systems'],
  },
  {
    id: 'final',
    label: 'System Check',
    duration: 300,
    subSteps: ['All systems nominal'],
    sound: 'confirm',
  },
];

// ============================================================================
// TIMELINE CALCULATOR
// ============================================================================

export function calculateBootTimeline(
  steps: BootStep[] = STARK_BOOT_STEPS
): BootTimeline {
  let totalDuration = 0;
  
  const processedSteps = steps.map(step => {
    totalDuration += step.duration;
    return step;
  });
  
  return {
    totalDuration,
    steps: processedSteps,
  };
}

// ============================================================================
// PROGRESS CALCULATOR
// ============================================================================

export function calculateProgress(
  elapsedTime: number,
  timeline: BootTimeline
): {
  progress: number;
  currentStep: BootStep | null;
  currentStepIndex: number;
  currentStepProgress: number;
  currentSubStep: string | null;
} {
  const { totalDuration, steps } = timeline;
  const progress = Math.min(1, elapsedTime / totalDuration);
  
  // Find current step
  let accumulated = 0;
  let currentStepIndex = 0;
  let currentStep: BootStep | null = null;
  let currentStepProgress = 0;
  let currentSubStep: string | null = null;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepEnd = accumulated + step.duration;
    
    if (elapsedTime <= stepEnd) {
      currentStepIndex = i;
      currentStep = step;
      currentStepProgress = (elapsedTime - accumulated) / step.duration;
      
      // Calculate sub-step
      if (step.subSteps && step.subSteps.length > 0) {
        const subStepIndex = Math.min(
          Math.floor(currentStepProgress * step.subSteps.length),
          step.subSteps.length - 1
        );
        currentSubStep = step.subSteps[subStepIndex];
      }
      
      break;
    }
    
    accumulated = stepEnd;
  }
  
  // If past all steps
  if (elapsedTime >= totalDuration) {
    currentStepIndex = steps.length - 1;
    currentStep = steps[steps.length - 1];
    currentStepProgress = 1;
    if (currentStep?.subSteps) {
      currentSubStep = currentStep.subSteps[currentStep.subSteps.length - 1];
    }
  }
  
  return {
    progress,
    currentStep,
    currentStepIndex,
    currentStepProgress,
    currentSubStep,
  };
}

// ============================================================================
// MESSAGES
// ============================================================================

export const BOOT_MESSAGES = {
  start: 'Initializing STARK Systems...',
  complete: 'All systems online. Welcome back, sir.',
  error: 'Warning: System initialization incomplete.',
};

export const GREETING_MESSAGES = [
  "Good morning, sir. All systems are operational.",
  "Welcome back. The workshop is ready.",
  "Systems online. Ready for your command.",
  "J.A.R.V.I.S. online. How may I assist you today?",
  "Mark systems initialized. All displays ready.",
];

export function getRandomGreeting(): string {
  return GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)];
}

export default calculateBootTimeline;
