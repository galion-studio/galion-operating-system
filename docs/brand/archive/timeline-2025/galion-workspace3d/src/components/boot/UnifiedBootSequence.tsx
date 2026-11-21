// ═══════════════════════════════════════════════════════════════════
// UNIFIED BOOT SEQUENCE - Main Orchestrator
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SkipButton } from './shared/SkipButton';
import { VoidPhase } from './phases/VoidPhase';
import { WelcomePhase } from './phases/WelcomePhase';
import { WakePhase } from './phases/WakePhase';
import { GreetingPhase } from './phases/GreetingPhase';
import type { BootPhase, WakePhase as WakePhaseType, Phase } from './types';

// Import phase components directly
import { BirthPhase } from './phases/BirthPhase';
import { OrbingPhase } from './phases/OrbingPhase';
import { ConsentPhase } from './phases/ConsentPhase';

// ============================================================================
// WINDOWS-STYLE SPINNING CIRCLE LOADER
// ============================================================================

function WindowsSpinningLoader() {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3">
      {/* galionOS label */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-sm text-white/70 font-light tracking-wider"
          style={{
            fontFamily: '-apple-system, system-ui, sans-serif',
            letterSpacing: '0.15em',
          }}
        >
          galionOS
        </p>
      </motion.div>
      
      {/* Spinning circle loader */}
      <div className="relative w-10 h-10">
        {/* Outer spinning ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: '#3b82f6',
            borderRightColor: '#8b5cf6',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Inner glow */}
        <motion.div
          className="absolute inset-1 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full blur-md"
          style={{
            border: '2px solid transparent',
            borderTopColor: 'rgba(59, 130, 246, 0.5)',
            borderRightColor: 'rgba(139, 92, 246, 0.5)',
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// TYPES
// ============================================================================

interface UnifiedBootSequenceProps {
  isFirstVisit: boolean;
  onComplete: () => void;
  allowSkip?: boolean;
  platformName?: string;
}

// ============================================================================
// PHASE SEQUENCES
// ============================================================================

const FIRST_VISIT_SEQUENCE: BootPhase[] = [
  'void',
  'birth',
  'welcome',
  'consent',
  'complete',
];

const RETURNING_SEQUENCE: WakePhaseType[] = [
  'wake',
  'greeting',
  'orbing',
  'complete',
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UnifiedBootSequence({
  isFirstVisit,
  onComplete,
  allowSkip = true,
  platformName = 'GALION',
}: UnifiedBootSequenceProps) {
  const [phase, setPhase] = useState<Phase>(isFirstVisit ? 'void' : 'wake');
  const [isSkipping, setIsSkipping] = useState(false);
  
  // Get the current sequence based on user type
  const sequence = isFirstVisit ? FIRST_VISIT_SEQUENCE : RETURNING_SEQUENCE;
  
  // Handle phase completion
  const handlePhaseComplete = useCallback(() => {
    const currentIndex = sequence.indexOf(phase as any);
    const nextPhase = sequence[currentIndex + 1];
    
    if (nextPhase && nextPhase !== 'complete') {
      setPhase(nextPhase as Phase);
    } else {
      // Boot sequence complete
      onComplete();
    }
  }, [phase, sequence, onComplete]);
  
  // Handle skip
  const handleSkip = useCallback(() => {
    if (!allowSkip) return;
    
    // Can't skip consent phase (legal requirement)
    if (phase === 'consent') return;
    
    setIsSkipping(true);
    onComplete();
  }, [allowSkip, phase, onComplete]);
  
  // Save boot completion to localStorage
  useEffect(() => {
    if (phase === 'complete') {
      localStorage.setItem('galion_boot_completed', 'true');
      localStorage.setItem('galion_last_visit', new Date().toISOString());
    }
  }, [phase]);
  
  // Render current phase
  const renderPhase = () => {
    const commonProps = {
      onComplete: handlePhaseComplete,
      onSkip: handleSkip,
    };
    
    switch (phase) {
      // First-time user phases
      case 'void':
        return <VoidPhase {...commonProps} />;
      
      case 'birth':
        return <BirthPhase {...commonProps} />;
      
      case 'welcome':
        return <WelcomePhase {...commonProps} />;
      
      case 'consent':
        return <ConsentPhase {...commonProps} platformName={platformName} />;
      
      // Returning user phases
      case 'wake':
        return <WakePhase {...commonProps} />;
      
      case 'greeting':
        return <GreetingPhase {...commonProps} />;
      
      case 'orbing':
        return <OrbingPhase {...commonProps} />;
      
      default:
        return null;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black">
      {/* Windows-style spinning loader */}
      <WindowsSpinningLoader />
      
      <AnimatePresence mode="wait">
        {renderPhase()}
      </AnimatePresence>
      
      {/* Skip button (hidden during consent) */}
      {allowSkip && phase !== 'consent' && !isSkipping && (
        <SkipButton onClick={handleSkip} />
      )}
    </div>
  );
}

// ============================================================================
// HELPER: Check if user has completed boot before
// ============================================================================

export function hasCompletedBoot(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('galion_boot_completed') === 'true';
}

// ============================================================================
// HELPER: Get time since last visit
// ============================================================================

export function getTimeSinceLastVisit(): string | null {
  if (typeof window === 'undefined') return null;
  
  const lastVisit = localStorage.getItem('galion_last_visit');
  if (!lastVisit) return null;
  
  const lastDate = new Date(lastVisit);
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  } else {
    return 'just now';
  }
}
