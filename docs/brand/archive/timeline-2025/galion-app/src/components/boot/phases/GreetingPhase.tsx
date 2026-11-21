// ═══════════════════════════════════════════════════════════════════
// GREETING PHASE - Welcome back text
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AnimatedText } from '../shared/AnimatedText';
import { TIMING, type PhaseProps } from '../types';

export function GreetingPhase({ onComplete }: PhaseProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, TIMING.GREETING * 1000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="fixed inset-0 bg-black">
      <AnimatePresence>
        <AnimatedText subtitle="GALION is ready">
          Welcome Back
        </AnimatedText>
      </AnimatePresence>
    </div>
  );
}
