'use client';

/**
 * Galion OS Boot V3 - Clean, Branded Boot Sequence
 *
 * Simple, elegant boot animation that:
 * 1. Shows "Galion OS" branding clearly
 * 2. Has smooth cosmic animation
 * 3. Leads into unified consent
 *
 * Duration: ~4 seconds, skippable
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface GalionOSBootV3Props {
  onComplete: () => void;
  isFirstVisit?: boolean;
  allowSkip?: boolean;
  reducedMotion?: boolean;
}

type BootPhase = 'void' | 'logo' | 'tagline' | 'ready';

export function GalionOSBootV3({
  onComplete,
  isFirstVisit = true,
  allowSkip = true,
  reducedMotion = false,
}: GalionOSBootV3Props) {
  const [phase, setPhase] = useState<BootPhase>('void');
  const [showSkip, setShowSkip] = useState(false);

  // Use SSR-safe reduced motion hook, combined with prop override
  const systemReducedMotion = useReducedMotion();
  const prefersReducedMotion = reducedMotion || systemReducedMotion;

  // Phase timing
  useEffect(() => {
    const duration = isFirstVisit ? 1 : 0.7;
    const timers: NodeJS.Timeout[] = [];

    // Show skip after 1s
    timers.push(setTimeout(() => setShowSkip(true), 1000));

    // Void -> Logo
    timers.push(setTimeout(() => setPhase('logo'), 500 * duration));

    // Logo -> Tagline
    timers.push(setTimeout(() => setPhase('tagline'), 2000 * duration));

    // Tagline -> Ready
    timers.push(setTimeout(() => setPhase('ready'), 3500 * duration));

    // Complete
    timers.push(setTimeout(() => onComplete(), 4000 * duration));

    return () => timers.forEach(t => clearTimeout(t));
  }, [isFirstVisit, onComplete]);

  const handleSkip = useCallback(() => {
    if (allowSkip) onComplete();
  }, [allowSkip, onComplete]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0a0a0f]">
      {/* Cosmic background gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 40%, rgba(6, 182, 212, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 30% 70%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse 70% 60% at 70% 30%, rgba(59, 130, 246, 0.04) 0%, transparent 50%)
          `,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      />

      {/* Subtle star field */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.8) 50%, transparent),
            radial-gradient(1px 1px at 40% 60%, rgba(255,255,255,0.6) 50%, transparent),
            radial-gradient(1px 1px at 60% 20%, rgba(255,255,255,0.7) 50%, transparent),
            radial-gradient(1px 1px at 80% 50%, rgba(255,255,255,0.5) 50%, transparent),
            radial-gradient(1.5px 1.5px at 50% 80%, rgba(255,255,255,0.9) 50%, transparent)
          `,
          backgroundSize: '200px 200px',
        }}
      />

      {/* Central content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Galion OS Logo & Text */}
        <AnimatePresence mode="wait">
          {(phase === 'logo' || phase === 'tagline' || phase === 'ready') && (
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Orb Icon */}
              <motion.div
                className="relative mb-8"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
                {/* Outer glow */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    width: 120,
                    height: 120,
                    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                    transform: 'translate(-10px, -10px)',
                  }}
                />

                {/* Main orb */}
                <motion.div
                  className="relative w-24 h-24 rounded-full"
                  style={{
                    background: `
                      radial-gradient(ellipse at 30% 25%, rgba(59, 130, 246, 0.8) 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 70%, rgba(20, 184, 166, 0.7) 0%, transparent 50%),
                      radial-gradient(circle at 50% 50%, #0891b2 0%, #115e59 60%, #0f766e 100%)
                    `,
                    boxShadow: `
                      0 0 40px rgba(6, 182, 212, 0.4),
                      0 0 80px rgba(6, 182, 212, 0.2),
                      inset 0 0 40px rgba(255, 255, 255, 0.1)
                    `,
                  }}
                  animate={prefersReducedMotion ? {} : {
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {/* Highlight */}
                  <div
                    className="absolute top-3 left-4 w-6 h-6 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
                    }}
                  />
                </motion.div>
              </motion.div>

              {/* Galion OS Text */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h1 className="text-4xl md:text-5xl font-light tracking-wide text-white">
                  Galion
                  <span className="text-cyan-400 ml-2 font-normal">OS</span>
                </h1>

                {/* Version */}
                <motion.p
                  className="mt-2 text-sm text-white/40 tracking-widest uppercase"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Version 4.0
                </motion.p>
              </motion.div>

              {/* Tagline */}
              <AnimatePresence>
                {(phase === 'tagline' || phase === 'ready') && (
                  <motion.p
                    className="mt-8 text-lg md:text-xl text-white/60 font-light max-w-md text-center px-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    Your only limit is your imagination
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Loading indicator */}
              {phase !== 'ready' && (
                <motion.div
                  className="mt-12 flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400/60"
                        animate={prefersReducedMotion ? {} : {
                          opacity: [0.3, 1, 0.3],
                          scale: [0.8, 1, 0.8],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-white/40 ml-2">Initializing</span>
                </motion.div>
              )}

              {/* Ready state */}
              {phase === 'ready' && (
                <motion.div
                  className="mt-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2 text-cyan-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">Ready</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skip button */}
      {allowSkip && showSkip && phase !== 'ready' && (
        <motion.button
          className="absolute bottom-8 right-8 px-4 py-2 text-sm text-white/30 hover:text-white/60 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleSkip}
          aria-label="Skip boot sequence"
        >
          Skip
        </motion.button>
      )}

      {/* Copyright */}
      <motion.div
        className="absolute bottom-8 left-8 text-xs text-white/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        © 2024 Galion
      </motion.div>
    </div>
  );
}

export default GalionOSBootV3;
