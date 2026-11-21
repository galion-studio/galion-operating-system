/**
 * GALION Boot Sequence - Birth Phase (Enhanced)
 *
 * The epic emergence of the AI consciousness orb.
 * Uses the new GalionOrbV6 - a proper 3D orb with:
 * - Neural network visualization
 * - Floating particles
 * - Energy streams
 * - Aurora effects
 * - Star field background
 *
 * Enhanced with:
 * - Ambient floating particles
 * - Energy ring effects
 * - Awakening stage with pulse
 * - Premium glow effects
 * - Smoother stage transitions
 */

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type PhaseProps } from '../types';
import { GalionOrbV6 } from '@/components/workspace3d/orb/v6';
import type { OrbEmotion, OrbState } from '@/components/workspace3d/orb/v6';

// =============================================================================
// TYPES
// =============================================================================

type BirthStage = 'void' | 'spark' | 'emerging' | 'growing' | 'breathing' | 'awakening' | 'ready';

// =============================================================================
// SEEDED RANDOM - Deterministic for SSR/hydration consistency
// =============================================================================

function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// =============================================================================
// AMBIENT PARTICLES COMPONENT
// =============================================================================

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function AmbientParticles({ count = 50, active = false }: { count?: number; active?: boolean }) {
  // Use seeded random for consistent SSR/client rendering
  const particles = useMemo<Particle[]>(() => {
    const seededRandom = createSeededRandom(42);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: seededRandom() * 100,
      y: seededRandom() * 100,
      size: seededRandom() * 3 + 1,
      duration: seededRandom() * 4 + 3,
      delay: seededRandom() * 2,
      opacity: seededRandom() * 0.4 + 0.1,
    }));
  }, [count]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, rgba(6, 182, 212, ${particle.opacity}) 0%, transparent 70%)`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, particle.opacity, 0],
            scale: [0.5, 1.5, 0.5],
            y: [0, -30, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// =============================================================================
// ENERGY RING COMPONENT
// =============================================================================

function EnergyRings({ active = false }: { active?: boolean }) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute rounded-full border"
          style={{
            width: `${ring * 25}%`,
            height: `${ring * 25}%`,
            borderColor: `rgba(6, 182, 212, ${0.15 / ring})`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [0.95, 1.05, 0.95],
            rotate: ring % 2 === 0 ? [0, 180] : [0, -180],
          }}
          transition={{
            duration: 8 / ring,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BirthPhase({ onComplete }: PhaseProps) {
  const [stage, setStage] = useState<BirthStage>('void');
  const [orbEmotion, setOrbEmotion] = useState<OrbEmotion>('neutral');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);

  // Stage progression with smoother transitions
  useEffect(() => {
    // Stage 0: Void (0-0.4s) - pure darkness
    const voidTimer = setTimeout(() => setStage('spark'), 400);

    // Stage 1: Spark (0.4-1.2s) - initial light appears
    const sparkTimer = setTimeout(() => setStage('emerging'), 1200);

    // Stage 2: Emerging (1.2-2.8s) - orb starts to form
    const emergeTimer = setTimeout(() => {
      setStage('growing');
      setOrbEmotion('curious');
    }, 2800);

    // Stage 3: Growing (2.8-4.5s) - orb grows to full size
    const growTimer = setTimeout(() => {
      setStage('breathing');
      setOrbEmotion('peaceful');
      setOrbState('thinking');
    }, 4500);

    // Stage 4: Breathing (4.5-6s) - orb breathes, establishes presence
    const breatheTimer = setTimeout(() => {
      setStage('awakening');
      setOrbEmotion('curious');
      setOrbState('listening');
    }, 6000);

    // Stage 5: Awakening (6-7s) - final awakening
    const awakeTimer = setTimeout(() => {
      setStage('ready');
      setOrbEmotion('neutral');
      setOrbState('idle');
    }, 7000);

    // Complete (7.5s)
    const completeTimer = setTimeout(onComplete, 7500);

    return () => {
      clearTimeout(voidTimer);
      clearTimeout(sparkTimer);
      clearTimeout(emergeTimer);
      clearTimeout(growTimer);
      clearTimeout(breatheTimer);
      clearTimeout(awakeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Simulate subtle audio activity during birth
  useEffect(() => {
    if (stage === 'growing' || stage === 'breathing' || stage === 'awakening') {
      const interval = setInterval(() => {
        const baseLevel = stage === 'awakening' ? 0.4 : 0.2;
        setAudioLevel(baseLevel + Math.random() * 0.3);
      }, 80);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [stage]);

  // Calculate orb scale based on stage
  const getOrbScale = useCallback(() => {
    const scales: Record<BirthStage, number> = {
      void: 0,
      spark: 0,
      emerging: 0.25,
      growing: 0.6,
      breathing: 0.85,
      awakening: 0.95,
      ready: 1,
    };
    return scales[stage];
  }, [stage]);

  // Calculate orb opacity based on stage
  const getOrbOpacity = useCallback(() => {
    const opacities: Record<BirthStage, number> = {
      void: 0,
      spark: 0.1,
      emerging: 0.5,
      growing: 0.75,
      breathing: 0.9,
      awakening: 1,
      ready: 1,
    };
    return opacities[stage];
  }, [stage]);

  // Determine quality based on stage (lower during animation for performance)
  const getQuality = useCallback(() => {
    if (stage === 'ready' || stage === 'awakening') return 'high';
    if (stage === 'breathing' || stage === 'growing') return 'medium';
    return 'low';
  }, [stage]);

  const showParticles = stage !== 'void' && stage !== 'spark';
  const showRings = stage === 'breathing' || stage === 'awakening' || stage === 'ready';

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: '#030308' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Deep space background gradient - animates with stage */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: stage === 'ready' || stage === 'awakening'
            ? `
              radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.05) 0%, transparent 50%),
              radial-gradient(ellipse at 30% 30%, rgba(139, 92, 246, 0.03) 0%, transparent 40%),
              radial-gradient(ellipse at 70% 70%, rgba(59, 130, 246, 0.03) 0%, transparent 40%),
              #030308
            `
            : `
              radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.02) 0%, transparent 50%),
              radial-gradient(ellipse at 30% 30%, rgba(139, 92, 246, 0.01) 0%, transparent 40%),
              radial-gradient(ellipse at 70% 70%, rgba(59, 130, 246, 0.01) 0%, transparent 40%),
              #030308
            `
        }}
        transition={{ duration: 2 }}
      />

      {/* Ambient floating particles */}
      <AmbientParticles count={40} active={showParticles} />

      {/* Energy rings around orb */}
      <EnergyRings active={showRings} />

      {/* Initial spark effect */}
      <AnimatePresence>
        {stage === 'spark' && (
          <motion.div
            className="absolute z-20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 4, 12],
              opacity: [0, 1, 0.7, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: 'easeOut',
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: 12,
                height: 12,
                background: 'radial-gradient(circle, #ffffff 0%, #06b6d4 40%, transparent 100%)',
                boxShadow: `
                  0 0 30px rgba(6, 182, 212, 1),
                  0 0 60px rgba(6, 182, 212, 0.8),
                  0 0 90px rgba(139, 92, 246, 0.5),
                  0 0 120px rgba(6, 182, 212, 0.3)
                `,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Orb Container */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        style={{
          width: '100vmin',
          height: '100vmin',
          maxWidth: 600,
          maxHeight: 600,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: getOrbScale(),
          opacity: getOrbOpacity(),
        }}
        transition={{
          scale: {
            duration: stage === 'growing' ? 1.7 : 1.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
          opacity: {
            duration: 0.6,
            ease: 'easeOut',
          },
        }}
      >
        <GalionOrbV6
          emotion={orbEmotion}
          state={orbState}
          audioLevel={audioLevel}
          quality={getQuality()}
          size={1.0}
          className="w-full h-full"
        />
      </motion.div>

      {/* Ambient light bloom during emergence */}
      <AnimatePresence>
        {(stage === 'emerging' || stage === 'growing' || stage === 'breathing') && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.12) 0%, transparent 45%),
                radial-gradient(ellipse at 50% 45%, rgba(139, 92, 246, 0.06) 0%, transparent 35%)
              `,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0.4] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* Awakening pulse effect */}
      <AnimatePresence>
        {stage === 'awakening' && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 50%)',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage indicator (debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 text-xs text-white/30 font-mono">
          Stage: {stage} | Emotion: {orbEmotion} | State: {orbState}
        </div>
      )}
    </motion.div>
  );
}

export default BirthPhase;
