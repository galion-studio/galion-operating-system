'use client';

/**
 * GalionOSBootV7 - The Ultimate Boot Experience
 *
 * A cinematic, Awwwards-quality boot sequence featuring:
 * - Epic orb birth animation
 * - Smooth phase transitions
 * - Audio-reactive feedback
 * - Premium brand reveal
 *
 * This is the new galion.app intro sequence.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { OrbBirthSequence, BirthPhase } from './birth/OrbBirthSequence';
import { GalionOrbV7 } from './GalionOrbV7';

// ============================================================================
// TYPES
// ============================================================================

export type BootPhase =
  | 'initializing'
  | 'birth'
  | 'welcome'
  | 'tagline'
  | 'ready'
  | 'complete';

export interface GalionOSBootV7Props {
  onComplete?: () => void;
  onReady?: () => void;
  skipEnabled?: boolean;
  showWelcomeBack?: boolean;
  userName?: string;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
}

// ============================================================================
// PHASE DURATIONS
// ============================================================================

const PHASE_DURATIONS: Record<BootPhase, number> = {
  initializing: 500,
  birth: 5000, // OrbBirthSequence handles its own timing
  welcome: 2000,
  tagline: 2500,
  ready: 1500,
  complete: 0,
};

// ============================================================================
// ANIMATED TEXT COMPONENTS
// ============================================================================

const GalionLogo: React.FC<{ visible: boolean }> = ({ visible }) => {
  const letters = 'GALION'.split('');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="flex items-center justify-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          {letters.map((letter, i) => (
            <motion.span
              key={i}
              className="text-6xl md:text-8xl font-bold tracking-wider"
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #00FF88 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 40px rgba(0, 255, 136, 0.5)',
              }}
              initial={{ opacity: 0, y: 50, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Tagline: React.FC<{ visible: boolean }> = ({ visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.p
        className="text-lg md:text-xl text-white/80 font-light tracking-widest"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        Your imagination is the only limit
      </motion.p>
    )}
  </AnimatePresence>
);

const WelcomeBack: React.FC<{ visible: boolean; name?: string }> = ({ visible, name }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.p
          className="text-2xl md:text-3xl text-white/90 font-light"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Welcome back{name ? `, ${name}` : ''}
        </motion.p>
        <motion.p
          className="mt-2 text-sm text-white/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Ready to create something amazing?
        </motion.p>
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================================================
// BACKGROUND EFFECTS
// ============================================================================

const GradientBackground: React.FC<{ phase: BootPhase }> = ({ phase }) => {
  const getGradient = () => {
    switch (phase) {
      case 'initializing':
        return 'radial-gradient(ellipse at center, #000000 0%, #000000 100%)';
      case 'birth':
        return 'radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)';
      case 'welcome':
      case 'tagline':
        return 'radial-gradient(ellipse at center, #0d1f17 0%, #000000 70%)';
      case 'ready':
      case 'complete':
        return 'radial-gradient(ellipse at center, #0a1a12 0%, #000000 80%)';
      default:
        return 'radial-gradient(ellipse at center, #000000 0%, #000000 100%)';
    }
  };

  return (
    <motion.div
      className="absolute inset-0"
      animate={{ background: getGradient() }}
      transition={{ duration: 1 }}
    />
  );
};

const GridOverlay: React.FC<{ visible: boolean }> = ({ visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        exit={{ opacity: 0 }}
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 136, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    )}
  </AnimatePresence>
);

// ============================================================================
// LOADING INDICATOR
// ============================================================================

const LoadingPulse: React.FC<{ visible: boolean }> = ({ visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-[#00ff88]"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-sm text-white/50 tracking-wider">INITIALIZING</span>
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GalionOSBootV7: React.FC<GalionOSBootV7Props> = ({
  onComplete,
  onReady,
  skipEnabled = true,
  showWelcomeBack = false,
  userName,
  quality = 'high',
}) => {
  const [phase, setPhase] = useState<BootPhase>('initializing');
  const [orbEmotion, setOrbEmotion] = useState('neutral');
  const [isSkipped, setIsSkipped] = useState(false);
  const phaseTimeoutRef = useRef<NodeJS.Timeout>();

  // Phase progression
  const advancePhase = useCallback(() => {
    const phases: BootPhase[] = ['initializing', 'birth', 'welcome', 'tagline', 'ready', 'complete'];
    const currentIndex = phases.indexOf(phase);

    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      setPhase(nextPhase);

      // Update orb emotion based on phase
      switch (nextPhase) {
        case 'welcome':
          setOrbEmotion('joy');
          break;
        case 'tagline':
          setOrbEmotion('hope');
          break;
        case 'ready':
          setOrbEmotion('presence');
          onReady?.();
          break;
        case 'complete':
          onComplete?.();
          break;
      }
    }
  }, [phase, onReady, onComplete]);

  // Handle birth sequence completion
  const handleBirthComplete = useCallback(() => {
    advancePhase();
  }, [advancePhase]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
    }
    setIsSkipped(true);
    setPhase('complete');
    setOrbEmotion('neutral');
    onReady?.();
    onComplete?.();
  }, [onReady, onComplete]);

  // Auto-advance phases (except birth which has its own timing)
  useEffect(() => {
    if (phase === 'birth' || phase === 'complete' || isSkipped) return;

    const duration = PHASE_DURATIONS[phase];
    phaseTimeoutRef.current = setTimeout(advancePhase, duration);

    return () => {
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
      }
    };
  }, [phase, isSkipped, advancePhase]);

  // Keyboard skip
  useEffect(() => {
    if (!skipEnabled || isSkipped) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'birth') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [skipEnabled, isSkipped, phase, handleSkip]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dynamic gradient background */}
      <GradientBackground phase={phase} />

      {/* Grid overlay for tech feel */}
      <GridOverlay visible={phase !== 'initializing' && phase !== 'birth'} />

      {/* Birth sequence - full takeover during birth phase */}
      {phase === 'birth' && (
        <OrbBirthSequence
          onComplete={handleBirthComplete}
          skipEnabled={skipEnabled}
          quality={quality}
        />
      )}

      {/* Post-birth orb - persistent after birth */}
      {phase !== 'initializing' && phase !== 'birth' && !isSkipped && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <GalionOrbV7 emotion={orbEmotion} birthProgress={1} quality={quality} />
        </motion.div>
      )}

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Loading indicator */}
        <LoadingPulse visible={phase === 'initializing'} />

        {/* Logo and tagline */}
        <div className="flex flex-col items-center gap-6">
          <GalionLogo visible={phase === 'welcome' || phase === 'tagline'} />
          <Tagline visible={phase === 'tagline'} />
        </div>

        {/* Welcome back message */}
        {showWelcomeBack && <WelcomeBack visible={phase === 'ready'} name={userName} />}

        {/* Ready state - subtle ready indicator */}
        <AnimatePresence>
          {phase === 'ready' && !showWelcomeBack && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.p
                className="text-lg text-white/60"
                animate={{
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Ready
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skip hint */}
      <AnimatePresence>
        {skipEnabled && !isSkipped && phase !== 'complete' && phase !== 'birth' && (
          <motion.button
            className="absolute bottom-8 right-8 px-4 py-2 text-white/40 text-sm
                       border border-white/10 rounded-full backdrop-blur-sm
                       hover:bg-white/5 hover:text-white/60 transition-colors
                       pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1 }}
            onClick={handleSkip}
          >
            Press ESC to skip
          </motion.button>
        )}
      </AnimatePresence>

      {/* Version badge */}
      <motion.div
        className="absolute bottom-4 left-4 text-[10px] text-white/20 font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        GalionOS v7.2
      </motion.div>
    </div>
  );
};

export default GalionOSBootV7;
