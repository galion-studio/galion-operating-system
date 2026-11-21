// ═══════════════════════════════════════════════════════════════════
// VOID PHASE - Pure black with single light
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { COLORS, TIMING, EASING, Z_INDEX, type PhaseProps } from '../types';

export function VoidPhase({ onComplete }: PhaseProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, TIMING.VOID * 1000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      {/* Single point of light */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.5, opacity: 0 }}
        transition={{
          duration: 1.5,
          ease: EASING.SMOOTH,
        }}
        style={{
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: COLORS.WHITE,
          boxShadow: `
            0 0 20px ${COLORS.WHITE},
            0 0 40px ${COLORS.ORB_END},
            0 0 60px ${COLORS.ORB_MIDDLE}
          `,
          zIndex: Z_INDEX.ORB,
        }}
      />
    </div>
  );
}
