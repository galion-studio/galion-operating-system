'use client';

/**
 * StarkHubBootSequence - STARK HUB Boot Animation
 * 
 * Cinematic JARVIS-style boot sequence with animated progress and system messages.
 * Self-contained - no external context dependencies.
 * 
 * "J.A.R.V.I.S., boot up. Let's get to work."
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvisStore } from '../stores/jarvisStore';
import { useStarkHubSounds } from '../audio/useStarkHubSounds';

// ============================================================================
// TYPES
// ============================================================================

interface BootStep {
  id: string;
  label: string;
  duration: number;
  subSteps: string[];
}

interface StarkHubBootSequenceProps {
  /** Callback when boot is complete */
  onComplete?: () => void;
  /** Skip boot sequence immediately */
  skip?: boolean;
  /** Quality tier affects boot duration */
  quality?: 'ultra' | 'high' | 'medium' | 'light';
}

// ============================================================================
// BOOT STEPS CONFIGURATION
// ============================================================================

const BOOT_STEPS: BootStep[] = [
  {
    id: 'power',
    label: 'Power Systems',
    duration: 400,
    subSteps: ['Arc reactor stable', 'Power distribution online'],
  },
  {
    id: 'core',
    label: 'Neural Core',
    duration: 500,
    subSteps: ['Neural interface active', 'Memory allocation', 'Process initialization'],
  },
  {
    id: 'sensors',
    label: 'Sensor Array',
    duration: 350,
    subSteps: ['Visual systems', 'Motion tracking', 'Depth sensors calibrated'],
  },
  {
    id: 'hud',
    label: 'HUD Interface',
    duration: 450,
    subSteps: ['Display calibration', 'UI elements loaded', 'Overlay systems ready'],
  },
  {
    id: 'audio',
    label: 'Audio Synthesis',
    duration: 300,
    subSteps: ['Sound synthesis initialized', 'Voice recognition enabled'],
  },
  {
    id: 'ai',
    label: 'AI Systems',
    duration: 600,
    subSteps: ['Language model loaded', 'Pattern recognition active', 'JARVIS online'],
  },
  {
    id: 'final',
    label: 'System Check',
    duration: 250,
    subSteps: ['All systems nominal', 'Ready for operation'],
  },
];

// Quality tier multipliers for boot duration
const QUALITY_MULTIPLIERS = {
  ultra: 1.0,   // Full 3s boot
  high: 0.8,    // 2.4s
  medium: 0.6,  // 1.8s
  light: 0.4,   // 1.2s
};

// Random greetings on completion
const GREETINGS = [
  'Good evening, sir.',
  'Systems ready, sir.',
  'At your service.',
  'Welcome back, sir.',
  'JARVIS online and operational.',
  'Ready when you are, sir.',
  'All systems nominal.',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getRandomGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

function calculateTimeline(steps: BootStep[], multiplier: number) {
  let totalDuration = 0;
  const processedSteps = steps.map(step => {
    const adjustedDuration = step.duration * multiplier;
    totalDuration += adjustedDuration;
    return { ...step, duration: adjustedDuration };
  });
  return { totalDuration, steps: processedSteps };
}

function calculateProgress(
  elapsed: number,
  timeline: { totalDuration: number; steps: BootStep[] }
) {
  const { totalDuration, steps } = timeline;
  const progress = Math.min(1, elapsed / totalDuration);
  
  let accumulated = 0;
  let currentStepIndex = steps.length - 1;
  let currentStep = steps[steps.length - 1];
  let currentStepProgress = 1;
  let currentSubStep = '';
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepEnd = accumulated + step.duration;
    
    if (elapsed <= stepEnd) {
      currentStepIndex = i;
      currentStep = step;
      currentStepProgress = (elapsed - accumulated) / step.duration;
      
      if (step.subSteps.length > 0) {
        const subIdx = Math.min(
          Math.floor(currentStepProgress * step.subSteps.length),
          step.subSteps.length - 1
        );
        currentSubStep = step.subSteps[subIdx];
      }
      break;
    }
    accumulated = stepEnd;
  }
  
  return { progress, currentStepIndex, currentStep, currentStepProgress, currentSubStep };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StarkHubBootSequence({
  onComplete,
  skip = false,
  quality = 'high',
}: StarkHubBootSequenceProps) {
  const setMood = useJarvisStore(s => s.setMood);
  const { bootStart, bootComplete, notification } = useStarkHubSounds();
  
  const [elapsed, setElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [greeting, setGreeting] = useState('');
  const startTime = useRef<number>(0);
  const animationRef = useRef<number>(0);
  const soundPlayedRef = useRef<boolean>(false);
  
  const multiplier = QUALITY_MULTIPLIERS[quality] || 1;
  const timeline = calculateTimeline(BOOT_STEPS, multiplier);
  const progressData = calculateProgress(elapsed, timeline);
  
  // Handle skip
  const handleSkip = useCallback(() => {
    setElapsed(timeline.totalDuration);
    setIsComplete(true);
    setFadeOut(true);
    setGreeting(getRandomGreeting());
    setMood('idle');
    
    setTimeout(() => {
      onComplete?.();
    }, 600);
  }, [timeline.totalDuration, onComplete, setMood]);
  
  // Skip if requested
  useEffect(() => {
    if (skip) {
      handleSkip();
    }
  }, [skip, handleSkip]);
  
  // Keyboard skip
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleSkip]);
  
  // Boot animation loop
  useEffect(() => {
    if (isComplete || skip) return;
    
    // Play boot start sound once
    if (!soundPlayedRef.current) {
      bootStart();
      soundPlayedRef.current = true;
    }
    
    setMood('executing');
    startTime.current = performance.now();
    
    const animate = (time: number) => {
      const currentElapsed = time - startTime.current;
      setElapsed(currentElapsed);
      
      if (currentElapsed < timeline.totalDuration) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Boot complete
        setIsComplete(true);
        setGreeting(getRandomGreeting());
        setMood('celebrating');
        bootComplete();
        
        setTimeout(() => {
          setFadeOut(true);
          setMood('idle');
          setTimeout(() => {
            onComplete?.();
          }, 600);
        }, 1200);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isComplete, skip, timeline.totalDuration, onComplete, setMood, bootStart, bootComplete]);
  
  return (
    <AnimatePresence>
      {!fadeOut && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden bg-black"
          style={{ fontFamily: "'Rajdhani', 'Orbitron', 'Segoe UI', monospace" }}
        >
          {/* Corner decorations */}
          <CornerDecor />
          
          {/* Scan line effect */}
          <div 
            className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
            style={{ animation: 'bootScanMove 2s linear infinite' }}
          />
          
          {/* Arc Reactor animation */}
          <motion.div 
            className="relative w-24 h-24 mb-10"
            animate={{ scale: isComplete ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <ArcReactorBoot progress={progressData.progress} isComplete={isComplete} />
          </motion.div>
          
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12 text-5xl font-bold tracking-[0.2em] text-cyan-400"
            style={{ textShadow: '0 0 30px rgba(0, 200, 255, 0.5)' }}
          >
            STARK
          </motion.div>
          
          {/* Content */}
          <div className="w-full max-w-md px-5">
            {/* Progress bar */}
            <div className="mb-8">
              <div className="h-1 rounded-full overflow-hidden bg-cyan-500/10 mb-2">
                <motion.div
                  className="h-full bg-cyan-400"
                  style={{ 
                    width: `${progressData.progress * 100}%`,
                    boxShadow: '0 0 10px rgba(0, 200, 255, 0.5)',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-cyan-500/60">
                <span>INITIALIZING SYSTEMS</span>
                <span>{Math.round(progressData.progress * 100)}%</span>
              </div>
            </div>
            
            {/* Steps list */}
            <div className="mb-8 space-y-2">
              {timeline.steps.map((step, idx) => {
                const isPast = idx < progressData.currentStepIndex;
                const isCurrent = idx === progressData.currentStepIndex;
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center text-sm ${
                      isPast 
                        ? 'text-emerald-400' 
                        : isCurrent 
                          ? 'text-cyan-400' 
                          : 'text-cyan-500/30'
                    }`}
                  >
                    <span className="w-5 h-5 flex items-center justify-center mr-3 text-xs">
                      {isPast ? '✓' : isCurrent ? '►' : '○'}
                    </span>
                    <span>{step.label}</span>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Current sub-step / greeting */}
            <motion.div
              key={isComplete ? 'greeting' : progressData.currentSubStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-cyan-400/80 text-sm tracking-wider min-h-[20px]"
            >
              {isComplete ? greeting : progressData.currentSubStep}
            </motion.div>
          </div>
          
          {/* Skip button */}
          {!isComplete && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={handleSkip}
              className="absolute bottom-10 right-10 px-4 py-2 text-xs tracking-widest border border-cyan-500/30 text-cyan-500/50 rounded transition-colors hover:border-cyan-500/60 hover:text-cyan-500/80"
            >
              SKIP [ESC]
            </motion.button>
          )}
          
          {/* CSS Keyframes */}
          <style>{`
            @keyframes bootScanMove {
              0% { transform: translateY(-100vh); }
              100% { transform: translateY(100vh); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function CornerDecor() {
  const cornerClass = "absolute w-12 h-12 border-cyan-500/30";
  return (
    <>
      <div className={`${cornerClass} top-5 left-5 border-t-2 border-l-2`} />
      <div className={`${cornerClass} top-5 right-5 border-t-2 border-r-2`} />
      <div className={`${cornerClass} bottom-5 left-5 border-b-2 border-l-2`} />
      <div className={`${cornerClass} bottom-5 right-5 border-b-2 border-r-2`} />
    </>
  );
}

function ArcReactorBoot({ progress, isComplete }: { progress: number; isComplete: boolean }) {
  const rings = 3;
  const baseColor = isComplete ? 'rgba(0, 255, 136, 0.9)' : 'rgba(0, 200, 255, 0.9)';
  
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Core glow */}
      <defs>
        <radialGradient id="bootCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={baseColor} stopOpacity="1" />
          <stop offset="50%" stopColor={baseColor} stopOpacity="0.5" />
          <stop offset="100%" stopColor={baseColor} stopOpacity="0" />
        </radialGradient>
        <filter id="bootGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Background glow */}
      <circle cx="50" cy="50" r="40" fill="url(#bootCoreGlow)" opacity={0.3 + progress * 0.4} />
      
      {/* Rings */}
      {Array.from({ length: rings }).map((_, i) => {
        const radius = 15 + i * 10;
        const strokeWidth = 2 - i * 0.3;
        const dashArray = Math.PI * 2 * radius;
        const dashOffset = dashArray * (1 - Math.min(1, progress * 1.5 - i * 0.2));
        
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={baseColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            filter="url(#bootGlow)"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
              transition: 'stroke-dashoffset 0.3s ease-out',
            }}
          />
        );
      })}
      
      {/* Center core */}
      <circle
        cx="50"
        cy="50"
        r="8"
        fill={baseColor}
        filter="url(#bootGlow)"
        opacity={progress > 0.1 ? 1 : progress * 10}
      />
      
      {/* Rotating marker */}
      {!isComplete && progress > 0.1 && (
        <g style={{ animation: 'spin 2s linear infinite', transformOrigin: '50% 50%' }}>
          <circle cx="50" cy="12" r="2" fill={baseColor} />
        </g>
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}

export default StarkHubBootSequence;
