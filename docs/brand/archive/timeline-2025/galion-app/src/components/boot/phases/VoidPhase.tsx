// =====================================================================
// VOID PHASE - Simple, Organic Darkness to Light
// =====================================================================
// Pure darkness with a single point of consciousness emerging
// Simple, calm, organic - no complex animations
// =====================================================================

'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { type PhaseProps } from '../types';

export function VoidPhase({ onComplete }: PhaseProps) {
  useEffect(() => {
    // Short, simple transition
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: '#000' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      {/* Soft ambient glow in the void */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.03) 0%, transparent 50%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      />

      {/* Single point of light - consciousness awakening */}
      <motion.div
        className="relative"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 1.5,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        {/* Soft outer glow */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 120,
            height: 120,
            left: -56,
            top: -56,
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.08) 40%, transparent 70%)',
            filter: 'blur(20px)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Core light point */}
        <motion.div
          className="rounded-full"
          style={{
            width: 8,
            height: 8,
            background: 'radial-gradient(circle, #fff 0%, rgba(6, 182, 212, 0.8) 50%, transparent 100%)',
            boxShadow: `
              0 0 20px rgba(255, 255, 255, 0.6),
              0 0 40px rgba(6, 182, 212, 0.4),
              0 0 60px rgba(139, 92, 246, 0.2)
            `,
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export default VoidPhase;
