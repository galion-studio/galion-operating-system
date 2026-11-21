'use client';

/**
 * GalionUltimateBoot - MD2026 Ultimate Boot Experience
 * =====================================================
 *
 * The definitive Galion.app boot sequence combining:
 * 1. CONSENT PHASE - Rules acceptance + microphone permission
 * 2. BIRTH PHASE - Cinematic orb birth with sacred geometry
 * 3. READY PHASE - MD2026 Premium Blue Orb experience
 *
 * MD2026 Specification:
 * - 120px blue orb (#0099FF → #0077DD → #0055AA)
 * - Pulse animation: 1.0 → 1.05 → 1.0, 2.5s cycle
 * - 8-12 internal particles rotating 360°/8s
 * - Voice-first with text fallback
 *
 * "Your only limit is your imagination."
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConsentPhase } from './phases/ConsentPhase';
import { BirthOfAStar } from './BirthOfAStar';
import { GalionPremiumOrb } from '../orb/GalionPremiumOrb';
import { SessionService } from '@/lib/session';

// ============================================================================
// TYPES
// ============================================================================

export type UltimateBootPhase =
  | 'initializing'  // Brief loading state
  | 'consent'       // Rules + mic permission
  | 'birth'         // Cinematic orb birth
  | 'ready'         // MD2026 Premium orb ready
  | 'complete';     // Boot finished

export interface GalionUltimateBootProps {
  /** Callback when boot is complete */
  onComplete?: () => void;
  /** Callback when ready to interact (orb visible) */
  onReady?: () => void;
  /** Callback when user submits first query */
  onFirstQuery?: (query: string) => void;
  /** Whether to allow skipping phases */
  skipEnabled?: boolean;
  /** User's name for greeting */
  userName?: string;
  /** Whether this is a first-time visitor */
  isFirstVisit?: boolean;
  /** Skip consent if already accepted */
  skipConsentIfAccepted?: boolean;
}

// ============================================================================
// PHASE DURATIONS
// ============================================================================

const PHASE_DURATIONS = {
  initializing: 800,
  consent: 0, // User-driven, no timeout
  birth: 8000, // BirthOfAStar handles its own timing
  ready: 0, // Stays until interaction
};

// ============================================================================
// LOADING SCREEN
// ============================================================================

const InitializingScreen: React.FC<{ visible: boolean }> = ({ visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: '#000' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Subtle pulse indicator */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="w-3 h-3 rounded-full bg-cyan-400"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
              boxShadow: [
                '0 0 0 0 rgba(34, 211, 238, 0)',
                '0 0 20px 8px rgba(34, 211, 238, 0.4)',
                '0 0 0 0 rgba(34, 211, 238, 0)',
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.p
            className="text-white/30 text-xs tracking-widest uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Initializing
          </motion.p>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================================================
// TRANSITION OVERLAY
// ============================================================================

const TransitionOverlay: React.FC<{
  visible: boolean;
  color?: string;
}> = ({ visible, color = '#000' }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        className="fixed inset-0 z-40 pointer-events-none"
        style={{ background: color }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    )}
  </AnimatePresence>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GalionUltimateBoot: React.FC<GalionUltimateBootProps> = ({
  onComplete,
  onReady,
  onFirstQuery,
  skipEnabled = true,
  userName,
  isFirstVisit = true,
  skipConsentIfAccepted = true,
}) => {
  const [phase, setPhase] = useState<UltimateBootPhase>('initializing');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [resolvedUserName, setResolvedUserName] = useState<string>(userName || '');
  const hasCompletedRef = useRef(false);

  // Check for existing consent on mount
  useEffect(() => {
    // Get stored username
    try {
      const storedUser = localStorage.getItem('galion_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setResolvedUserName(userData.name || userName || 'Friend');
      } else if (!userName) {
        setResolvedUserName('there');
      }
    } catch {
      setResolvedUserName(userName || 'there');
    }

    // Check if consent already given
    if (skipConsentIfAccepted) {
      const sessionState = SessionService.getSessionState();
      const hasConsent = sessionState.termsAccepted;
      const hasMicPermission = sessionState.microphonePermission;

      // Only skip consent if BOTH terms are accepted AND microphone permission is set
      if (hasConsent && hasMicPermission !== null) {
        console.log('[UltimateBoot] Consent already given, skipping to birth');
        // Skip consent, go directly to birth
        setTimeout(() => setPhase('birth'), PHASE_DURATIONS.initializing);
        return;
      }

      // Log current state for debugging
      console.log('[UltimateBoot] Session state:', {
        termsAccepted: hasConsent,
        microphonePermission: hasMicPermission,
        isFirstVisit: sessionState.isFirstVisit,
        bootCompleted: sessionState.bootCompleted
      });
    }

    // Start normal flow
    setTimeout(() => setPhase('consent'), PHASE_DURATIONS.initializing);
  }, [userName, skipConsentIfAccepted]);

  // Handle consent completion
  const handleConsentComplete = useCallback(() => {
    console.log('[UltimateBoot] Consent complete, starting birth');
    setIsTransitioning(true);

    setTimeout(() => {
      setPhase('birth');
      setIsTransitioning(false);
    }, 800);
  }, []);

  // Handle birth completion
  const handleBirthComplete = useCallback(() => {
    console.log('[UltimateBoot] Birth complete, entering ready state');
    setIsTransitioning(true);

    setTimeout(() => {
      setPhase('ready');
      setIsTransitioning(false);
      onReady?.();
    }, 500);
  }, [onReady]);

  // Safety timeout - if birth takes too long, auto-advance
  useEffect(() => {
    if (phase === 'birth') {
      const safetyTimer = setTimeout(() => {
        console.log('[UltimateBoot] Safety timeout - forcing transition to ready');
        handleBirthComplete();
      }, 12000); // 12 seconds max for birth animation

      return () => clearTimeout(safetyTimer);
    }
  }, [phase, handleBirthComplete]);

  // Handle first query from ready state
  const handleFirstQuery = useCallback((query: string) => {
    console.log('[UltimateBoot] First query:', query);

    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onFirstQuery?.(query);

      // Mark boot as complete in SessionService (persists to localStorage)
      SessionService.completeBoot();
      console.log('[UltimateBoot] Boot marked as complete via SessionService');

      setPhase('complete');
      onComplete?.();
    }
  }, [onFirstQuery, onComplete]);

  // Handle orb click (voice activation)
  const handleOrbClick = useCallback(() => {
    console.log('[UltimateBoot] Orb clicked - voice activation');

    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;

      // Store voice mode preference
      try {
        sessionStorage.setItem('galion_start_voice', 'true');
      } catch {}

      // Mark boot as complete in SessionService (persists to localStorage)
      SessionService.completeBoot();
      console.log('[UltimateBoot] Boot marked as complete via SessionService');

      setPhase('complete');
      onComplete?.();
    }
  }, [onComplete]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (!skipEnabled) return;

    console.log('[UltimateBoot] Skipped');
    hasCompletedRef.current = true;

    // Mark boot as complete in SessionService (persists to localStorage)
    SessionService.completeBoot();
    console.log('[UltimateBoot] Boot marked as complete via SessionService (skipped)');

    setPhase('complete');
    onReady?.();
    onComplete?.();
  }, [skipEnabled, onReady, onComplete]);

  // Don't render anything if complete
  if (phase === 'complete') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Initializing state */}
      <InitializingScreen visible={phase === 'initializing'} />

      {/* Consent phase */}
      <AnimatePresence>
        {phase === 'consent' && (
          <motion.div
            key="consent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ConsentPhase
              onComplete={handleConsentComplete}
              platformName="Galion"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Birth phase */}
      <AnimatePresence>
        {phase === 'birth' && (
          <motion.div
            key="birth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BirthOfAStar
              onComplete={handleBirthComplete}
              isFirstVisit={isFirstVisit}
              allowSkip={skipEnabled}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ready phase - MD2026 Premium Orb */}
      <AnimatePresence>
        {phase === 'ready' && (
          <motion.div
            key="ready"
            className="fixed inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <GalionPremiumOrb
              username={resolvedUserName}
              subtext="How can I assist you today?"
              size={120}
              showInput={true}
              inputPlaceholder="Ask me anything..."
              onSubmit={handleFirstQuery}
              onOrbClick={handleOrbClick}
              autoStart={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transition overlay */}
      <TransitionOverlay visible={isTransitioning} />

      {/* Skip button (only during birth phase) */}
      <AnimatePresence>
        {skipEnabled && phase === 'birth' && (
          <motion.button
            className="fixed bottom-8 right-8 z-60 px-4 py-2 text-white/30 text-sm
                       hover:text-white/50 transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 2 }}
            onClick={handleSkip}
          >
            Skip
          </motion.button>
        )}
      </AnimatePresence>

      {/* Version badge */}
      <motion.div
        className="fixed bottom-4 left-4 text-[10px] text-white/10 font-mono z-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        MD2026 Ultimate
      </motion.div>
    </div>
  );
};

export default GalionUltimateBoot;

// ============================================================================
// HELPER: Check if boot was completed
// ============================================================================

export const hasCompletedUltimateBoot = (): boolean => {
  try {
    const sessionState = SessionService.getSessionState();
    const hasConsent = sessionState.termsAccepted;
    const hasMicPermission = sessionState.microphonePermission;
    const hasVisited = !sessionState.isFirstVisit;
    const bootCompleted = sessionState.bootCompleted;

    // Boot is complete only if:
    // 1. Terms have been accepted
    // 2. Microphone permission has been set (granted, denied, or text-only)
    // 3. User has visited before
    // 4. Boot was marked as completed
    const isComplete = hasConsent && hasMicPermission !== null && hasVisited && bootCompleted;

    console.log('[UltimateBoot] hasCompletedUltimateBoot check:', {
      hasConsent,
      hasMicPermission,
      hasVisited,
      bootCompleted,
      result: isComplete
    });

    return isComplete;
  } catch (error) {
    console.error('[UltimateBoot] Error checking boot status:', error);
    return false;
  }
};

// ============================================================================
// HELPER: Reset boot state (for testing)
// ============================================================================

export const resetUltimateBoot = (): void => {
  try {
    // Use SessionService to clear all session data properly
    SessionService.clearSession();
    sessionStorage.removeItem('galion_start_voice');
    console.log('[UltimateBoot] Boot state reset via SessionService');
  } catch (error) {
    console.error('[UltimateBoot] Error resetting boot state:', error);
  }
};
