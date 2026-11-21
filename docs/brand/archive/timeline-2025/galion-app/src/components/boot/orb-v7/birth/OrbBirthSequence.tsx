'use client';

/**
 * OrbBirthSequence - The Epic Birth Animation
 *
 * A cinematic sequence showing the birth of the Galion AI orb.
 * From void to singularity to cosmic expansion.
 *
 * Phases:
 * 1. Void - Complete darkness
 * 2. Singularity - A point of light appears
 * 3. Expansion - The orb explodes into existence
 * 4. Stabilization - The orb settles into its natural state
 * 5. Ready - Full interactive mode
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GalionOrbV7 } from '../GalionOrbV7';

// ============================================================================
// TYPES
// ============================================================================

export type BirthPhase = 'void' | 'singularity' | 'expansion' | 'stabilization' | 'ready';

export interface OrbBirthSequenceProps {
  onComplete?: () => void;
  onPhaseChange?: (phase: BirthPhase) => void;
  skipEnabled?: boolean;
  autoStart?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
}

interface PhaseConfig {
  duration: number;
  birthProgress: number;
  emotion: string;
}

// ============================================================================
// PHASE CONFIGURATIONS
// ============================================================================

const PHASE_CONFIGS: Record<BirthPhase, PhaseConfig> = {
  void: {
    duration: 800,
    birthProgress: 0,
    emotion: 'stillness',
  },
  singularity: {
    duration: 1200,
    birthProgress: 0.15,
    emotion: 'birth',
  },
  expansion: {
    duration: 1500,
    birthProgress: 0.5,
    emotion: 'creation',
  },
  stabilization: {
    duration: 1000,
    birthProgress: 0.85,
    emotion: 'flow',
  },
  ready: {
    duration: 500,
    birthProgress: 1,
    emotion: 'neutral',
  },
};

const PHASE_ORDER: BirthPhase[] = ['void', 'singularity', 'expansion', 'stabilization', 'ready'];

// ============================================================================
// SINGULARITY EFFECT - The initial point of light
// ============================================================================

const SingularityEffect: React.FC<{ visible: boolean }> = ({ visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 3 }}
        transition={{ duration: 0.5 }}
      >
        {/* Central point */}
        <motion.div
          className="relative"
          animate={{
            scale: [0, 0.1, 0.05, 0.15],
          }}
          transition={{
            duration: 1.2,
            times: [0, 0.3, 0.5, 1],
            ease: 'easeOut',
          }}
        >
          {/* Core */}
          <div
            className="w-4 h-4 rounded-full bg-white"
            style={{
              boxShadow: `
                0 0 20px 10px rgba(255, 255, 255, 0.8),
                0 0 40px 20px rgba(0, 255, 136, 0.6),
                0 0 80px 40px rgba(0, 255, 136, 0.4),
                0 0 120px 60px rgba(0, 255, 136, 0.2)
              `,
            }}
          />

          {/* Expanding rings */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-white/30"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 4 * i, opacity: 0 }}
              transition={{
                duration: 1.5,
                delay: i * 0.2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================================================
// EXPANSION FLASH - The big bang moment
// ============================================================================

const ExpansionFlash: React.FC<{ active: boolean }> = ({ active }) => (
  <AnimatePresence>
    {active && (
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, times: [0, 0.2, 1] }}
        style={{
          background: `radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(0, 255, 136, 0.6) 30%,
            rgba(0, 255, 136, 0.2) 60%,
            transparent 100%
          )`,
        }}
      />
    )}
  </AnimatePresence>
);

// ============================================================================
// COSMIC DUST - Background particle effect
// ============================================================================

const CosmicDust: React.FC<{ visible: boolean }> = ({ visible }) => {
  const particles = useRef(
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 4,
    }))
  ).current;

  return (
    <AnimatePresence>
      {visible && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full bg-white"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0.5],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
                boxShadow: `0 0 ${particle.size * 3}px ${particle.size}px rgba(0, 255, 136, 0.3)`,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// PHASE INDICATOR - Shows current phase (optional debug)
// ============================================================================

const PhaseIndicator: React.FC<{ phase: BirthPhase; show: boolean }> = ({ phase, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="absolute top-4 left-4 text-white/50 text-xs font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        Phase: {phase}
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================================================
// SKIP BUTTON
// ============================================================================

const SkipButton: React.FC<{ visible: boolean; onClick: () => void }> = ({ visible, onClick }) => (
  <AnimatePresence>
    {visible && (
      <motion.button
        className="absolute bottom-8 right-8 px-4 py-2 text-white/60 text-sm
                   border border-white/20 rounded-full backdrop-blur-sm
                   hover:bg-white/10 hover:text-white transition-colors"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.5 }}
        onClick={onClick}
      >
        Skip Intro
      </motion.button>
    )}
  </AnimatePresence>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const OrbBirthSequence: React.FC<OrbBirthSequenceProps> = ({
  onComplete,
  onPhaseChange,
  skipEnabled = true,
  autoStart = true,
  quality = 'high',
}) => {
  const [phase, setPhase] = useState<BirthPhase>('void');
  const [birthProgress, setBirthProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const phaseTimeoutRef = useRef<NodeJS.Timeout>();
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  // Get current phase index
  const currentPhaseIndex = PHASE_ORDER.indexOf(phase);

  // Advance to next phase
  const advancePhase = useCallback(() => {
    const nextIndex = currentPhaseIndex + 1;
    if (nextIndex < PHASE_ORDER.length) {
      const nextPhase = PHASE_ORDER[nextIndex];
      setPhase(nextPhase);
      onPhaseChange?.(nextPhase);

      // Trigger expansion flash
      if (nextPhase === 'expansion') {
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 800);
      }
    } else {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentPhaseIndex, onPhaseChange, onComplete]);

  // Skip animation
  const handleSkip = useCallback(() => {
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setPhase('ready');
    setBirthProgress(1);
    setIsComplete(true);
    onPhaseChange?.('ready');
    onComplete?.();
  }, [onPhaseChange, onComplete]);

  // Animate birth progress smoothly
  useEffect(() => {
    if (isComplete) return;

    const config = PHASE_CONFIGS[phase];
    const targetProgress = config.birthProgress;
    const startProgress = birthProgress;
    const duration = config.duration;

    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const t = Math.min(elapsed / duration, 1);

      // Ease out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - t, 3);
      const newProgress = startProgress + (targetProgress - startProgress) * eased;

      setBirthProgress(newProgress);

      if (t < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [phase, isComplete]);

  // Auto-advance phases
  useEffect(() => {
    if (!autoStart || isComplete) return;

    const config = PHASE_CONFIGS[phase];
    phaseTimeoutRef.current = setTimeout(advancePhase, config.duration);

    return () => {
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
      }
    };
  }, [phase, autoStart, isComplete, advancePhase]);

  // Handle keyboard skip
  useEffect(() => {
    if (!skipEnabled || isComplete) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [skipEnabled, isComplete, handleSkip]);

  const currentConfig = PHASE_CONFIGS[phase];

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Cosmic dust background */}
      <CosmicDust visible={phase !== 'void'} />

      {/* Void phase - pure black */}
      <AnimatePresence>
        {phase === 'void' && (
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Singularity effect */}
      <SingularityEffect visible={phase === 'singularity'} />

      {/* Expansion flash */}
      <ExpansionFlash active={showFlash} />

      {/* Main orb - appears after singularity */}
      <AnimatePresence>
        {phase !== 'void' && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: phase === 'singularity' ? 0.5 : 0 }}
          >
            <GalionOrbV7
              emotion={currentConfig.emotion}
              birthProgress={birthProgress}
              quality={quality}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase indicator (debug) */}
      <PhaseIndicator phase={phase} show={process.env.NODE_ENV === 'development'} />

      {/* Skip button */}
      <SkipButton
        visible={skipEnabled && !isComplete && phase !== 'void'}
        onClick={handleSkip}
      />

      {/* Loading/progress indicator */}
      <AnimatePresence>
        {phase !== 'ready' && !isComplete && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #00ff88, #00ff88aa)',
                  width: `${birthProgress * 100}%`,
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrbBirthSequence;
