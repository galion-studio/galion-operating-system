// =====================================================================
// UNIFIED BOOT SEQUENCE - Simple, Organic Flow
// =====================================================================
// Clean, minimal boot experience:
// 1. Void - darkness with light appearing
// 2. Birth - orb emerging beautifully
// 3. Consent - welcome, terms, microphone
// No complex technical animations - just organic flow
//
// SESSION PERSISTENCE: Uses SessionService for proper localStorage handling
// =====================================================================

'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SkipButton } from './shared/SkipButton';
import { VoidPhase } from './phases/VoidPhase';
import { GalionBootPhase } from './phases/GalionBootPhase';
import { BirthPhase } from './phases/BirthPhase';
import { ConsentPhase } from './phases/ConsentPhase';
import { WakePhase } from './phases/WakePhase';
import { GreetingPhase } from './phases/GreetingPhase';
import { OrbingPhase } from './phases/OrbingPhase';
import { SessionService } from '@/lib/session';

// ============================================================================
// TYPES
// ============================================================================

type FirstVisitPhase = 'void' | 'galionboot' | 'birth' | 'consent' | 'complete';
type ReturningPhase = 'wake' | 'greeting' | 'orbing' | 'complete';
type Phase = FirstVisitPhase | ReturningPhase;

interface UnifiedBootSequenceProps {
  isFirstVisit: boolean;
  onComplete: () => void;
  allowSkip?: boolean;
  platformName?: string;
}

// ============================================================================
// PHASE SEQUENCES
// ============================================================================

const FIRST_VISIT_SEQUENCE: FirstVisitPhase[] = [
  'void',        // Darkness with light appearing
  'galionboot',  // GalionOS boot sequence
  'consent',     // Welcome, terms, microphone
  'birth',       // Orb emerging
  'complete',
];

const RETURNING_SEQUENCE: ReturningPhase[] = [
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
  platformName = 'Galion',
}: UnifiedBootSequenceProps) {
  const [phase, setPhase] = useState<Phase>(isFirstVisit ? 'void' : 'wake');
  const [isSkipping, setIsSkipping] = useState(false);

  // Get the current sequence
  const sequence = isFirstVisit ? FIRST_VISIT_SEQUENCE : RETURNING_SEQUENCE;

  // Complete and save boot state - MUST be called before onComplete
  const finalizeBootSequence = useCallback(() => {
    // Save boot completion BEFORE calling onComplete
    SessionService.completeBoot();
    SessionService.recordVisit();
    console.log('[Boot] Boot sequence finalized and saved');

    // Now call the completion callback
    onComplete();
  }, [onComplete]);

  // Handle phase completion
  const handlePhaseComplete = useCallback(() => {
    const currentIndex = sequence.indexOf(phase as any);
    const nextPhase = sequence[currentIndex + 1];

    if (nextPhase && nextPhase !== 'complete') {
      setPhase(nextPhase as Phase);
    } else {
      // IMPORTANT: Save state BEFORE calling onComplete
      finalizeBootSequence();
    }
  }, [phase, sequence, finalizeBootSequence]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (!allowSkip) return;

    // Can't skip consent phase
    if (phase === 'consent') return;

    // Skip to consent if in early phases
    if (phase === 'void' || phase === 'galionboot') {
      setPhase('consent');
      return;
    }

    // Skip birth phase to complete
    if (phase === 'birth') {
      finalizeBootSequence();
      return;
    }

    setIsSkipping(true);
    finalizeBootSequence();
  }, [allowSkip, phase, finalizeBootSequence]);

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

      case 'galionboot':
        return <GalionBootPhase {...commonProps} />;

      case 'birth':
        return <BirthPhase {...commonProps} />;

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
      <AnimatePresence mode="wait">
        {renderPhase()}
      </AnimatePresence>

      {/* Skip button - hidden during consent */}
      {allowSkip && phase !== 'consent' && !isSkipping && (
        <SkipButton onClick={handleSkip} />
      )}
    </div>
  );
}

// ============================================================================
// HELPERS - Use SessionService for consistency
// ============================================================================

export function hasCompletedBoot(): boolean {
  return SessionService.hasCompletedBoot();
}

export function getTimeSinceLastVisit(): string | null {
  return SessionService.getTimeSinceLastVisit();
}

export default UnifiedBootSequence;
