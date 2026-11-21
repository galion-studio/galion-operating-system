// =====================================================================
// CONSENT PHASE - Simple, Clean Terms Agreement
// =====================================================================
// Minimal, organic design
// Just the essentials: Terms, Privacy, Microphone
// Beautiful but not overwhelming
//
// SESSION PERSISTENCE: Uses SessionService for proper localStorage handling
// =====================================================================

'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type PhaseProps } from '../types';
import { SessionService } from '@/lib/session';

interface ConsentPhaseProps extends PhaseProps {
  platformName?: string;
}

type Step = 'welcome' | 'terms' | 'microphone' | 'complete';

/**
 * Initialize AudioContext on user gesture to unlock audio playback.
 * This is required by browser autoplay policies.
 */
const warmUpAudioContext = async () => {
  try {
    // Create and immediately resume AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass({ sampleRate: 24000 });
      await ctx.resume();

      // Play a silent buffer to fully unlock audio
      const buffer = ctx.createBuffer(1, 1, 24000);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      // Store in window for reuse
      (window as any).__galionAudioContext = ctx;
      console.log('[Audio] AudioContext warmed up and unlocked');
    }
  } catch (e) {
    console.warn('[Audio] Failed to warm up AudioContext:', e);
  }
};

export function ConsentPhase({ onComplete, platformName = 'Galion' }: ConsentPhaseProps) {
  const [step, setStep] = useState<Step>('welcome');
  const audioWarmedUp = useRef(false);

  // Warm up audio on first user interaction
  const ensureAudioReady = () => {
    if (!audioWarmedUp.current) {
      audioWarmedUp.current = true;
      warmUpAudioContext();
    }
  };

  const handleGetStarted = () => {
    ensureAudioReady();
    setStep('terms');
  };

  const handleAcceptTerms = () => {
    ensureAudioReady();
    // Use SessionService for consistent storage
    SessionService.acceptTerms('all');
    console.log('[Consent] Terms accepted via SessionService');
    setStep('microphone');
  };

  const handleMicrophone = async (allow: boolean) => {
    // Ensure audio is ready for immediate playback
    ensureAudioReady();

    if (allow) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        SessionService.setMicrophonePermission('granted');
      } catch {
        SessionService.setMicrophonePermission('denied');
      }
    } else {
      SessionService.setMicrophonePermission('text-only');
    }

    setStep('complete');
    // Small delay before completing to allow animations
    setTimeout(() => {
      console.log('[Consent] Consent phase complete');
      onComplete();
    }, 800);
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center px-6"
      style={{ background: '#000' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(6, 182, 212, 0.05) 0%, transparent 50%)',
        }}
      />

      <AnimatePresence mode="wait">
        {/* WELCOME - Initial greeting */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            className="relative text-center max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo/Title */}
            <motion.h1
              className="text-4xl font-light text-white mb-4 tracking-wide"
              style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}
            >
              Welcome to {platformName}
            </motion.h1>

            <motion.p
              className="text-white/50 text-sm mb-12 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Your AI companion for voice, creativity, and knowledge
            </motion.p>

            {/* Continue button */}
            <motion.button
              onClick={handleGetStarted}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/10 text-white/90 text-sm hover:border-white/20 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Get Started
            </motion.button>
          </motion.div>
        )}

        {/* TERMS - Simple terms acceptance */}
        {step === 'terms' && (
          <motion.div
            key="terms"
            className="relative w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
              <h2 className="text-xl font-medium text-white mb-2">
                Before we begin
              </h2>
              <p className="text-white/50 text-sm mb-6">
                Quick agreement to get started
              </p>

              {/* Simple list of what they agree to */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  </div>
                  <span className="text-white/70">
                    Use {platformName} responsibly and ethically
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  </div>
                  <span className="text-white/70">
                    Your data stays private and secure
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  </div>
                  <span className="text-white/70">
                    Essential cookies for the app to work
                  </span>
                </div>
              </div>

              {/* Accept button */}
              <motion.button
                onClick={handleAcceptTerms}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                I Agree & Continue
              </motion.button>

              {/* Links */}
              <div className="flex justify-center gap-4 mt-4">
                <a href="/privacy" className="text-xs text-white/30 hover:text-white/50 transition-colors">
                  Privacy Policy
                </a>
                <a href="/terms" className="text-xs text-white/30 hover:text-white/50 transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* MICROPHONE - Voice permission */}
        {step === 'microphone' && (
          <motion.div
            key="microphone"
            className="relative w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-6">
              {/* Microphone icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>

              <h2 className="text-xl font-medium text-white text-center mb-2">
                Enable Voice
              </h2>
              <p className="text-white/50 text-sm text-center mb-6">
                {platformName} is designed for natural voice conversation
              </p>

              {/* Voice features */}
              <div className="bg-white/[0.02] rounded-xl p-4 mb-6">
                <p className="text-white/60 text-xs leading-relaxed">
                  Voice lets you talk naturally with {platformName}. Your audio is processed securely and never stored without permission.
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                <motion.button
                  onClick={() => handleMicrophone(true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Enable Microphone
                </motion.button>

                <motion.button
                  onClick={() => handleMicrophone(false)}
                  className="w-full py-3 text-white/40 text-sm hover:text-white/60 transition-colors"
                  whileTap={{ scale: 0.99 }}
                >
                  Use Text Only
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* COMPLETE - Brief transition */}
        {/* Complete step - no UI, transitions directly to birth */}
        {step === 'complete' && (
          <motion.div
            key="complete"
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ConsentPhase;
