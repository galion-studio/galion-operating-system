// ═══════════════════════════════════════════════════════════════════
// CONSENT PHASE - Cookie, Terms, Microphone permissions
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, EASING, Z_INDEX, type PhaseProps } from '../types';

interface ConsentPhaseProps extends PhaseProps {
  platformName?: string;
}

type ConsentStep = 'cookies' | 'terms' | 'microphone' | 'complete';

// ============================================================================
// GLASS CARD COMPONENT
// ============================================================================

function GlassCard({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string 
}) {
  return (
    <div className={`
      relative overflow-hidden
      bg-white/[0.03] backdrop-blur-2xl
      border border-white/[0.08]
      rounded-2xl
      shadow-[0_8px_32px_rgba(0,0,0,0.3)]
      max-w-md
      ${className}
    `}>
      {/* Subtle gradient shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(30,58,138,0.3)] via-[rgba(109,40,217,0.2)] to-[rgba(6,182,212,0.25)] rounded-2xl blur-xl pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ============================================================================
// FLOWING LINES BACKGROUND
// ============================================================================

function FlowingLinesBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: Z_INDEX.BACKGROUND }}>
      {/* Horizontal flowing lines with smooth ease-in/ease-out */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
        const colors = [
          { start: 'rgba(6, 182, 212, 0)', mid: 'rgba(6, 182, 212, 0.7)', end: 'rgba(6, 182, 212, 0)' }, // cyan
          { start: 'rgba(59, 130, 246, 0)', mid: 'rgba(59, 130, 246, 0.8)', end: 'rgba(59, 130, 246, 0)' }, // blue
          { start: 'rgba(139, 92, 246, 0)', mid: 'rgba(139, 92, 246, 0.7)', end: 'rgba(139, 92, 246, 0)' }, // purple
          { start: 'rgba(168, 85, 247, 0)', mid: 'rgba(168, 85, 247, 0.6)', end: 'rgba(168, 85, 247, 0)' }, // violet
        ];
        const color = colors[index % colors.length];
        
        return (
          <motion.div
            key={`h-${index}`}
            className="absolute"
            style={{
              top: `${10 + index * 12}%`,
              left: '-20%',
              width: '140%',
              height: '3px',
              background: `linear-gradient(90deg, ${color.start} 0%, ${color.mid} 50%, ${color.end} 100%)`,
              boxShadow: `0 0 20px ${color.mid.replace('0.', '0.5')}, 0 0 40px ${color.mid.replace('0.', '0.3')}`,
              filter: 'blur(1px)',
            }}
            initial={{ x: '-100%', opacity: 0 }}
            animate={{
              x: ['0%', '100%'],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 8 + index * 0.5,
              delay: index * 0.6,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1], // smooth ease-in-out
              times: [0, 0.1, 0.9, 1], // opacity timing
            }}
          />
        );
      })}
      
      {/* Vertical flowing lines with smooth ease-in/ease-out */}
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const colors = [
          { start: 'rgba(139, 92, 246, 0)', mid: 'rgba(139, 92, 246, 0.7)', end: 'rgba(139, 92, 246, 0)' }, // purple
          { start: 'rgba(59, 130, 246, 0)', mid: 'rgba(59, 130, 246, 0.8)', end: 'rgba(59, 130, 246, 0)' }, // blue
          { start: 'rgba(6, 182, 212, 0)', mid: 'rgba(6, 182, 212, 0.6)', end: 'rgba(6, 182, 212, 0)' }, // cyan
          { start: 'rgba(14, 165, 233, 0)', mid: 'rgba(14, 165, 233, 0.7)', end: 'rgba(14, 165, 233, 0)' }, // sky
        ];
        const color = colors[index % colors.length];
        
        return (
          <motion.div
            key={`v-${index}`}
            className="absolute"
            style={{
              left: `${15 + index * 15}%`,
              top: '-20%',
              width: '3px',
              height: '140%',
              background: `linear-gradient(180deg, ${color.start} 0%, ${color.mid} 50%, ${color.end} 100%)`,
              boxShadow: `0 0 20px ${color.mid.replace('0.', '0.5')}, 0 0 40px ${color.mid.replace('0.', '0.3')}`,
              filter: 'blur(1px)',
            }}
            initial={{ y: '-100%', opacity: 0 }}
            animate={{
              y: ['0%', '100%'],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 10 + index * 0.8,
              delay: index * 0.7,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1], // smooth ease-in-out
              times: [0, 0.1, 0.9, 1], // opacity timing
            }}
          />
        );
      })}
      
      {/* Diagonal lines flowing from corner to corner */}
      {[0, 1, 2, 3].map((index) => {
        const colors = [
          { start: 'rgba(6, 182, 212, 0)', mid: 'rgba(6, 182, 212, 0.5)', end: 'rgba(6, 182, 212, 0)' }, // cyan
          { start: 'rgba(168, 85, 247, 0)', mid: 'rgba(168, 85, 247, 0.5)', end: 'rgba(168, 85, 247, 0)' }, // violet
          { start: 'rgba(59, 130, 246, 0)', mid: 'rgba(59, 130, 246, 0.6)', end: 'rgba(59, 130, 246, 0)' }, // blue
          { start: 'rgba(236, 72, 153, 0)', mid: 'rgba(236, 72, 153, 0.4)', end: 'rgba(236, 72, 153, 0)' }, // pink
        ];
        const color = colors[index % colors.length];
        
        return (
          <motion.div
            key={`diag-${index}`}
            className="absolute"
            style={{
              top: `${-10 + index * 35}%`,
              left: '-20%',
              width: '150%',
              height: '2px',
              background: `linear-gradient(90deg, ${color.start} 0%, ${color.mid} 50%, ${color.end} 100%)`,
              boxShadow: `0 0 15px ${color.mid.replace('0.', '0.4')}`,
              transform: index % 2 === 0 ? 'rotate(-20deg)' : 'rotate(20deg)',
              transformOrigin: 'center',
              filter: 'blur(1.5px)',
            }}
            initial={{ x: '-100%', opacity: 0 }}
            animate={{
              x: ['0%', '100%'],
              opacity: [0, 0.8, 0.8, 0],
            }}
            transition={{
              duration: 12 + index * 1.5,
              delay: index * 2,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1], // smooth ease-in-out
              times: [0, 0.15, 0.85, 1], // opacity timing
            }}
          />
        );
      })}
      
      {/* Slow ambient glow lines */}
      {[0, 1].map((index) => (
        <motion.div
          key={`glow-${index}`}
          className="absolute"
          style={{
            top: `${30 + index * 40}%`,
            left: '-10%',
            width: '120%',
            height: '1px',
            background: index === 0 
              ? 'linear-gradient(90deg, rgba(59, 130, 246, 0) 0%, rgba(59, 130, 246, 0.3) 50%, rgba(59, 130, 246, 0) 100%)'
              : 'linear-gradient(90deg, rgba(139, 92, 246, 0) 0%, rgba(139, 92, 246, 0.3) 50%, rgba(139, 92, 246, 0) 100%)',
            boxShadow: index === 0
              ? '0 0 30px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.2)'
              : '0 0 30px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)',
            filter: 'blur(2px)',
          }}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{
            x: ['0%', '100%'],
            opacity: [0, 0.5, 0.5, 0],
          }}
          transition={{
            duration: 20,
            delay: index * 5,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.2, 0.8, 1],
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// WINDOWS-STYLE BOOT PROGRESS BAR
// ============================================================================

function BootProgressBar({ progress }: { progress: number }) {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-64" style={{ zIndex: Z_INDEX.TEXT }}>
      {/* Progress bar container */}
      <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
        {/* Progress fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
        
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: [-200, 200],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
      
      {/* Loading text */}
      <motion.p
        className="text-center text-xs text-slate-400 mt-3"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        Initializing GALION Ecosystem...
      </motion.p>
    </div>
  );
}

// ============================================================================
// GALION OS BOOT PROGRESS BAR (Windows-style)
// ============================================================================

function GalionOSBootProgress({ step }: { step: ConsentStep }) {
  const stepProgress = {
    cookies: 33,
    terms: 66,
    microphone: 85,
    complete: 100,
  };
  
  const progress = stepProgress[step];
  
  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md px-6" style={{ zIndex: Z_INDEX.TEXT }}>
      {/* GALION OS Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <h3 className="text-white font-light text-lg mb-1 tracking-wider">GALION OS</h3>
        <p className="text-slate-400 text-xs tracking-wide">
          {step === 'cookies' && 'Configuring privacy settings...'}
          {step === 'terms' && 'Loading terms and conditions...'}
          {step === 'microphone' && 'Setting up voice interface...'}
          {step === 'complete' && 'Booting ecosystem...'}
        </p>
      </motion.div>
      
      {/* Progress Bar Container */}
      <div className="relative h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
        {/* Progress Fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: [-100, 400],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>
        
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-purple-500/50 blur-md"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      
      {/* Progress Percentage */}
      <motion.div
        className="text-center mt-2 text-slate-500 text-xs font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {progress}%
      </motion.div>
    </div>
  );
}

// ============================================================================
// CONSENT PHASE COMPONENT
// ============================================================================

export function ConsentPhase({ onComplete, platformName = 'GALION' }: ConsentPhaseProps) {
  const [step, setStep] = useState<ConsentStep>('cookies');
  const [consents, setConsents] = useState({
    cookies: false,
    terms: false,
    microphone: false,
  });
  
  const handleCookiesAccept = (type: 'essential' | 'all') => {
    setConsents(prev => ({ ...prev, cookies: true }));
    localStorage.setItem('galion_cookies', type);
    localStorage.setItem('galion_gatekeeper_v2', JSON.stringify({ 
      accepted: true, 
      cookies: type,
      timestamp: new Date().toISOString() 
    }));
    setStep('terms');
  };
  
  const handleTermsAccept = () => {
    setConsents(prev => ({ ...prev, terms: true }));
    localStorage.setItem('galion_terms_accepted', 'true');
    setStep('microphone');
  };
  
  const handleMicrophoneResponse = async (allow: boolean) => {
    if (allow) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setConsents(prev => ({ ...prev, microphone: true }));
        localStorage.setItem('galion_microphone', 'granted');
      } catch (err) {
        console.error('Microphone permission denied:', err);
        localStorage.setItem('galion_microphone', 'denied');
      }
    } else {
      localStorage.setItem('galion_microphone', 'text-only');
    }
    
    setStep('complete');
    setTimeout(() => {
      onComplete();
    }, 1000);
  };
  
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center px-4">
      {/* Flowing lines background */}
      <FlowingLinesBackground />
      
      <AnimatePresence mode="wait">
        {/* COOKIES CONSENT */}
        {step === 'cookies' && (
          <motion.div
            key="cookies"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5, ease: EASING.SMOOTH }}
            className="max-w-md mx-auto w-full"
            style={{ zIndex: Z_INDEX.CONSENT_CARDS }}
          >
            <GlassCard className="p-4 md:p-5">
              {/* Header */}
              <motion.div 
                className="text-center mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: EASING.SMOOTH }}
              >
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
                  Before We Begin
                </h2>
                <p className="text-slate-400 text-sm">
                  We believe in complete transparency
                </p>
              </motion.div>

              {/* Cookies Explanation */}
              <motion.div 
                className="space-y-2 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6, ease: EASING.SMOOTH }}
              >
                {/* Essential */}
                <div className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-0.5 text-xs">Essential Cookies</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Session management, authentication, and core functionality. 
                      These are required for {platformName} to work properly.
                    </p>
                  </div>
                </div>

                {/* Analytics - Optional */}
                <div className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-0.5 text-xs">
                      Usage Analytics <span className="text-[10px] text-slate-500">(optional)</span>
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Help us improve by allowing anonymous usage statistics. 
                      No personal data is collected.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Your Rights */}
              <motion.div 
                className="mb-4 p-2 md:p-3 rounded-xl bg-white/[0.02] border border-white/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6, ease: EASING.SMOOTH }}
              >
                <h3 className="text-white font-medium mb-1.5 text-xs">Your Rights</h3>
                <ul className="text-slate-400 text-[10px] space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    Change these preferences anytime in Settings
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    Request data deletion at any time
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    We never sell your personal data
                  </li>
                </ul>
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.6, ease: EASING.SMOOTH }}
              >
                <motion.button
                  onClick={() => handleCookiesAccept('all')}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                >
                  Accept & Continue
                </motion.button>
                
                <motion.button
                  onClick={() => handleCookiesAccept('essential')}
                  className="w-full py-3 px-6 text-slate-400 hover:text-white text-sm transition-colors duration-200"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Essential Only
                </motion.button>
              </motion.div>

              {/* Legal Links */}
              <motion.div 
                className="mt-6 pt-6 border-t border-white/5 flex justify-center gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
              >
                <a href="/privacy" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Privacy Policy
                </a>
                <a href="/terms" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Terms of Service
                </a>
                <a href="/cookies" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Cookie Policy
                </a>
              </motion.div>
            </GlassCard>
          </motion.div>
        )}
        
        {/* TERMS OF SERVICE */}
        {step === 'terms' && (
          <motion.div
            key="terms"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5, ease: EASING.SMOOTH }}
            className="max-w-md mx-auto w-full"
            style={{ zIndex: Z_INDEX.CONSENT_CARDS }}
          >
            <GlassCard className="p-4 md:p-5">
              {/* Header */}
              <motion.div 
                className="text-center mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
                  Terms of Service
                </h2>
                <p className="text-slate-400 text-sm">
                  Quick review of our guidelines
                </p>
              </motion.div>

              {/* Key Points */}
              <motion.div 
                className="space-y-3 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <h3 className="text-white font-medium mb-2 text-sm">What you agree to:</h3>
                  <ul className="text-slate-400 text-xs space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <span>Use {platformName} responsibly and ethically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <span>Respect other users and community guidelines</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <span>Don&apos;t misuse or try to harm the service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <span>You retain ownership of content you create</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Accept Button */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <motion.button
                  onClick={handleTermsAccept}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-2xl transition-all duration-200 shadow-lg shadow-blue-500/20"
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                >
                  I Accept the Terms
                </motion.button>

                <p className="text-xs text-slate-500 text-center mt-4">
                  By continuing, you agree to our{' '}
                  <a href="/terms" className="text-blue-400 hover:text-blue-300">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
                </p>
              </motion.div>
            </GlassCard>
          </motion.div>
        )}
        
        {/* MICROPHONE PERMISSION */}
        {step === 'microphone' && (
          <motion.div
            key="microphone"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5, ease: EASING.SMOOTH }}
            className="max-w-md mx-auto w-full"
            style={{ zIndex: Z_INDEX.CONSENT_CARDS }}
          >
            <GlassCard className="p-4 md:p-5">
              {/* Header */}
              <motion.div 
                className="text-center mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
                  Enable Voice Access
                </h2>
                <p className="text-slate-400 text-sm">
                  {platformName} is a voice-first AI companion
                </p>
              </motion.div>

              {/* Permissions Explanation */}
              <motion.div 
                className="space-y-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                {/* Microphone */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Microphone Access</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      To hear your voice commands and questions. 
                      Your voice is processed securely and never stored without permission.
                    </p>
                  </div>
                </div>

                {/* Speaker */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Speaker Output</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      To respond to you with natural voice. 
                      {platformName} speaks back instead of just showing text.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Why Required */}
              <motion.div 
                className="mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/5"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <h3 className="text-white font-medium mb-2 text-sm">Why voice access?</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {platformName} is designed as a voice-first experience. Unlike traditional chatbots, 
                  we believe conversation should feel natural - like talking to a friend. 
                  Voice is at the core of everything we do.
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <motion.button
                  onClick={() => handleMicrophoneResponse(true)}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium rounded-2xl transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Enable Microphone & Continue
                  </span>
                </motion.button>

                <motion.button
                  onClick={() => handleMicrophoneResponse(false)}
                  className="w-full py-3 px-6 text-slate-400 hover:text-white text-sm transition-colors duration-200"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Skip - Use Text Only
                </motion.button>
              </motion.div>

              {/* Browser Prompt Note */}
              <motion.div 
                className="mt-6 pt-6 border-t border-white/5 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
              >
                <p className="text-xs text-slate-600">
                  Your browser will ask for permission • Click &quot;Allow&quot; to continue
                </p>
              </motion.div>
            </GlassCard>
          </motion.div>
        )}
        
        {/* COMPLETE - GALION OS */}
        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASING.SMOOTH }}
            className="text-center"
          >
            {/* galionOS Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <h1 className="text-7xl md:text-9xl font-bold text-white mb-4"
                style={{
                  fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
                  letterSpacing: '-0.03em',
                  textShadow: '0 0 40px rgba(59, 130, 246, 0.5), 0 0 80px rgba(139, 92, 246, 0.3)',
                }}
              >
                galionOS
              </h1>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <p className="text-sm text-slate-500 mt-4">
                  Version 3.0 • Build 2025.12.11
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
