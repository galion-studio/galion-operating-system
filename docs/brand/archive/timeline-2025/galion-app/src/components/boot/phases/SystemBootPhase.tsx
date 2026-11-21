// =====================================================================
// SYSTEM BOOT PHASE - Galion OS Boot Sequence
// =====================================================================
// Beautiful OS-like boot sequence with:
// - System initialization messages
// - Progress indicators
// - Smooth transitions
// - Professional yet beautiful aesthetic
// =====================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type PhaseProps } from '../types';

// Boot step definition
interface BootStep {
  id: string;
  label: string;
  duration: number; // ms
  subSteps?: string[];
}

// Boot steps configuration
const BOOT_STEPS: BootStep[] = [
  {
    id: 'kernel',
    label: 'Starting Galion OS',
    duration: 1200,
    subSteps: ['Loading kernel modules...', 'Initializing memory...'],
  },
  {
    id: 'frontend',
    label: 'Building Interface',
    duration: 1500,
    subSteps: ['Compiling components...', 'Loading assets...', 'Applying styles...'],
  },
  {
    id: 'server',
    label: 'Connecting to Servers',
    duration: 1800,
    subSteps: ['Establishing secure connection...', 'Validating certificates...', 'Syncing data...'],
  },
  {
    id: 'ai',
    label: 'Initializing AI Core',
    duration: 2000,
    subSteps: ['Loading neural networks...', 'Calibrating voice engine...', 'Preparing consciousness...'],
  },
  {
    id: 'session',
    label: 'Creating Session',
    duration: 1000,
    subSteps: ['Generating session ID...', 'Setting preferences...'],
  },
];

// Calculate total duration
const TOTAL_DURATION = BOOT_STEPS.reduce((acc, step) => acc + step.duration, 0);

// Animated dot component
function AnimatedDots() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return <span className="inline-block w-6 text-left">{dots}</span>;
}

// Boot log line component
function LogLine({
  text,
  status = 'running',
  delay = 0
}: {
  text: string;
  status?: 'running' | 'done' | 'pending';
  delay?: number;
}) {
  return (
    <motion.div
      className="flex items-center gap-2 font-mono text-xs"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {status === 'done' && (
        <span className="text-green-400">[OK]</span>
      )}
      {status === 'running' && (
        <span className="text-cyan-400">[..]</span>
      )}
      {status === 'pending' && (
        <span className="text-slate-600">[  ]</span>
      )}
      <span className={
        status === 'done' ? 'text-slate-400' :
        status === 'running' ? 'text-white' :
        'text-slate-600'
      }>
        {text}
        {status === 'running' && <AnimatedDots />}
      </span>
    </motion.div>
  );
}

// Progress bar component
function BootProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full max-w-md">
      {/* Progress bar background */}
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        {/* Progress fill */}
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: [-100, 200] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      </div>

      {/* Progress percentage */}
      <div className="flex justify-between mt-2">
        <span className="text-xs text-slate-500 font-mono">{Math.round(progress)}%</span>
        <span className="text-xs text-slate-500">
          {progress < 100 ? 'Booting...' : 'Ready'}
        </span>
      </div>
    </div>
  );
}

// Main component
export function SystemBootPhase({ onComplete }: PhaseProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentSubStep, setCurrentSubStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [bootLogs, setBootLogs] = useState<Array<{ text: string; status: 'done' | 'running' | 'pending' }>>([]);

  // Calculate progress based on completed steps
  const calculateProgress = useCallback(() => {
    let completed = 0;
    for (let i = 0; i < currentStepIndex; i++) {
      completed += BOOT_STEPS[i].duration;
    }
    // Add partial progress for current step
    if (currentStepIndex < BOOT_STEPS.length) {
      const step = BOOT_STEPS[currentStepIndex];
      const subProgress = step.subSteps
        ? (currentSubStep / step.subSteps.length) * step.duration
        : 0;
      completed += subProgress;
    }
    return (completed / TOTAL_DURATION) * 100;
  }, [currentStepIndex, currentSubStep]);

  // Update progress
  useEffect(() => {
    setProgress(calculateProgress());
  }, [calculateProgress]);

  // Boot sequence logic
  useEffect(() => {
    if (currentStepIndex >= BOOT_STEPS.length) {
      // All steps complete
      const timer = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(timer);
    }

    const step = BOOT_STEPS[currentStepIndex];
    const subSteps = step.subSteps || [];

    // Add main step to logs
    if (currentSubStep === 0) {
      setBootLogs(prev => [...prev, { text: step.label, status: 'running' }]);
    }

    // Process sub-steps
    if (currentSubStep < subSteps.length) {
      const subStepDuration = step.duration / (subSteps.length + 1);
      const timer = setTimeout(() => {
        // Update current log to done
        setBootLogs(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1].status = 'done';
          }
          // Add next sub-step
          updated.push({ text: `  ${subSteps[currentSubStep]}`, status: 'running' });
          return updated;
        });
        setCurrentSubStep(prev => prev + 1);
      }, subStepDuration);
      return () => clearTimeout(timer);
    } else {
      // Move to next step
      const remainingDuration = step.duration / (subSteps.length + 1);
      const timer = setTimeout(() => {
        // Mark last log as done
        setBootLogs(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1].status = 'done';
          }
          return updated;
        });
        setCompletedSteps(prev => [...prev, step.id]);
        setCurrentStepIndex(prev => prev + 1);
        setCurrentSubStep(0);
      }, remainingDuration);
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, currentSubStep, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-black to-slate-950" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Galion OS Logo */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1
            className="text-4xl font-light text-white tracking-wider"
            style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}
          >
            GALION<span className="text-cyan-400">OS</span>
          </h1>
          <p className="text-slate-500 text-xs mt-2 tracking-widest uppercase">
            Version 3.0
          </p>
        </motion.div>

        {/* Boot logs */}
        <motion.div
          className="bg-black/50 backdrop-blur-sm rounded-xl border border-white/5 p-4 mb-8 max-h-48 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="space-y-1.5">
            <AnimatePresence mode="popLayout">
              {bootLogs.slice(-8).map((log, index) => (
                <LogLine
                  key={`${log.text}-${index}`}
                  text={log.text}
                  status={log.status}
                  delay={0}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <BootProgressBar progress={progress} />
        </motion.div>

        {/* Current step label */}
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <AnimatePresence mode="wait">
            {currentStepIndex < BOOT_STEPS.length && (
              <motion.p
                key={currentStepIndex}
                className="text-sm text-slate-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {BOOT_STEPS[currentStepIndex].label}
              </motion.p>
            )}
            {currentStepIndex >= BOOT_STEPS.length && (
              <motion.p
                key="complete"
                className="text-sm text-green-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                System Ready
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Bottom branding */}
      <motion.div
        className="absolute bottom-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <p className="text-xs text-slate-600">
          Galion Studio 2025
        </p>
      </motion.div>
    </motion.div>
  );
}

export default SystemBootPhase;
