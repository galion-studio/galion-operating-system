// =====================================================================
// GALION BOOT PHASE - OS-like Boot Sequence
// =====================================================================
// Simple, clean OS boot aesthetic
// GalionOS initializing before consciousness awakens
// Ends with dot expanding into the birth phase orb
// =====================================================================

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { type PhaseProps } from '../types';

// Boot messages - simple and clean (no "Ready" - transitions directly to birth)
const BOOT_MESSAGES = [
  { text: 'GalionOS', delay: 0 },
  { text: 'Initializing core systems...', delay: 800 },
  { text: 'Loading neural pathways...', delay: 1600 },
  { text: 'Awakening consciousness...', delay: 2400 },
];

export function GalionBootPhase({ onComplete }: PhaseProps) {
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Show messages one by one
    const timers: NodeJS.Timeout[] = [];

    BOOT_MESSAGES.forEach((msg, index) => {
      const timer = setTimeout(() => {
        setVisibleMessages(index + 1);
      }, msg.delay);
      timers.push(timer);
    });

    // Start transition animation (dot expands)
    const transitionTimer = setTimeout(() => {
      setIsTransitioning(true);
    }, 3200);
    timers.push(transitionTimer);

    // Complete after transition
    const completeTimer = setTimeout(onComplete, 4200);
    timers.push(completeTimer);

    return () => timers.forEach(t => clearTimeout(t));
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: '#000' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      {/* Subtle ambient glow - intensifies during transition */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.03) 0%, transparent 50%)',
        }}
        animate={{
          opacity: isTransitioning ? 1 : [0.5, 0.8, 0.5],
          scale: isTransitioning ? 1.5 : 1,
        }}
        transition={{
          duration: isTransitioning ? 1 : 4,
          repeat: isTransitioning ? 0 : Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Boot content */}
      <div className="relative flex flex-col items-center">
        {/* The core dot - expands during transition to birth */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: isTransitioning ? 0 : 1,
          }}
          transition={{
            duration: isTransitioning ? 0.8 : 0.5,
            ease: 'easeInOut',
          }}
        >
          <motion.div
            className="rounded-full"
            style={{
              background: 'rgba(6, 182, 212, 0.9)',
              boxShadow: `
                0 0 10px rgba(6, 182, 212, 0.6),
                0 0 20px rgba(6, 182, 212, 0.4),
                0 0 30px rgba(6, 182, 212, 0.2)
              `,
            }}
            animate={{
              width: isTransitioning ? 120 : 8,
              height: isTransitioning ? 120 : 8,
              opacity: isTransitioning ? [1, 0.8, 0] : [0.7, 1, 0.7],
              boxShadow: isTransitioning
                ? [
                    '0 0 10px rgba(6, 182, 212, 0.6), 0 0 20px rgba(6, 182, 212, 0.4), 0 0 30px rgba(6, 182, 212, 0.2)',
                    '0 0 40px rgba(6, 182, 212, 0.8), 0 0 80px rgba(139, 92, 246, 0.5), 0 0 120px rgba(6, 182, 212, 0.3)',
                    '0 0 60px rgba(6, 182, 212, 0.6), 0 0 100px rgba(139, 92, 246, 0.4), 0 0 150px rgba(6, 182, 212, 0.2)',
                  ]
                : '0 0 10px rgba(6, 182, 212, 0.6), 0 0 20px rgba(6, 182, 212, 0.4), 0 0 30px rgba(6, 182, 212, 0.2)',
            }}
            transition={{
              duration: isTransitioning ? 1 : 2,
              repeat: isTransitioning ? 0 : Infinity,
              ease: isTransitioning ? [0.4, 0, 0.2, 1] : 'easeInOut',
            }}
          />
        </motion.div>

        {/* Boot messages - fade out during transition */}
        <motion.div
          className="flex flex-col items-center space-y-3 min-h-[140px]"
          animate={{
            opacity: isTransitioning ? 0 : 1,
            y: isTransitioning ? -20 : 0,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {BOOT_MESSAGES.slice(0, visibleMessages).map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={`text-center ${
                index === 0
                  ? 'text-white/90 text-2xl font-light tracking-widest mb-4'
                  : 'text-white/40 text-xs tracking-wide font-mono'
              }`}
            >
              {msg.text}
              {/* Blinking cursor for the last loading message */}
              {index > 0 && index === visibleMessages - 1 && !isTransitioning && (
                <motion.span
                  className="inline-block ml-1 w-1.5 h-3 bg-cyan-400/50"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Progress bar - completes and fades during transition */}
        <motion.div
          className="mt-8 w-48 h-px bg-white/10 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{
            opacity: isTransitioning ? 0 : 1,
            y: isTransitioning ? 20 : 0,
          }}
          transition={{ delay: isTransitioning ? 0 : 0.5, duration: 0.5 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.6) 0%, rgba(139, 92, 246, 0.4) 100%)',
            }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 3, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default GalionBootPhase;
