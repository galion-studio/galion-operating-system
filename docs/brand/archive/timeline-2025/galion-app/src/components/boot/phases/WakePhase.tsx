// ═══════════════════════════════════════════════════════════════════
// WAKE PHASE - Flowing lines for returning users
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { COLORS, TIMING, EASING, Z_INDEX, type PhaseProps } from '../types';

const LINES = [
  { width: '200px', delay: 0 },
  { width: '280px', delay: 0.3 },
  { width: '360px', delay: 0.6 },
  { width: '280px', delay: 0.9 },
  { width: '200px', delay: 1.2 },
];

export function WakePhase({ onComplete }: PhaseProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, TIMING.WAKE * 1000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          alignItems: 'center',
          zIndex: Z_INDEX.TEXT,
        }}
      >
        {LINES.map((line, index) => (
          <motion.div
            key={index}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.8 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{
              duration: 0.8,
              delay: line.delay,
              ease: EASING.SMOOTH,
            }}
            style={{
              width: line.width,
              height: '2px',
              background: `linear-gradient(90deg, 
                transparent, 
                ${COLORS.LINE_COLOR}, 
                transparent
              )`,
              transformOrigin: 'center',
            }}
          />
        ))}
      </div>
    </div>
  );
}
