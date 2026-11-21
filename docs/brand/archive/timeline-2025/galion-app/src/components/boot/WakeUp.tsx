'use client';

/**
 * Wake-Up Animation for Returning Users
 * 
 * Enhanced premium animation that feels like waking a friend.
 * Features:
 * - Smooth fade-in from darkness
 * - Gentle orb materialization with shimmer
 * - Contextual welcome message
 * - Elegant 3-second experience
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface WakeUpProps {
  /** Called when wake-up animation completes */
  onComplete: () => void;
  /** Show continuation context */
  showContinuePrompt?: boolean;
  /** Last conversation context (for "continue where we left off") */
  lastContext?: string;
}

export function WakeUp({ 
  onComplete, 
  showContinuePrompt = false,
  lastContext,
}: WakeUpProps) {
  const [stage, setStage] = useState<'emerge' | 'glow' | 'breath' | 'complete'>('emerge');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showContext, setShowContext] = useState(false);
  
  useEffect(() => {
    // Premium wake sequence (~3.5s total)
    // 0-1s: Orb emerges from darkness with shimmer
    // 1-2s: Gentle glow pulse
    // 2-3s: Single breath
    // 3-3.5s: Welcome message, then complete
    
    const glowTimer = setTimeout(() => setStage('glow'), 1000);
    const breathTimer = setTimeout(() => setStage('breath'), 2000);
    const welcomeTimer = setTimeout(() => setShowWelcome(true), 2800);
    const contextTimer = setTimeout(() => setShowContext(true), 3000);
    const completeTimer = setTimeout(() => {
      setStage('complete');
      onComplete();
    }, 3500);
    
    return () => {
      clearTimeout(glowTimer);
      clearTimeout(breathTimer);
      clearTimeout(welcomeTimer);
      clearTimeout(contextTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f] overflow-hidden">
      {/* Background gradient - fades in smoothly */}
      <motion.div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 100% 80% at center, #0f0f1a 0%, #0a0a0f 100%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      
      {/* Subtle ambient light rays */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        {[0, 120, 240].map((angle, i) => (
          <motion.div
            key={`ray-${i}`}
            className="absolute w-1 h-96 bg-gradient-to-t from-cyan-400/40 to-transparent origin-bottom"
            style={{
              left: '50%',
              top: '50%',
              transform: `rotate(${angle}deg) translateY(-100px)`,
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{
              scaleY: [0, 1, 0.8],
              opacity: [0, 0.3, 0.2],
            }}
            transition={{
              duration: 1.5,
              delay: 0.2 + i * 0.1,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
      
      <div className="relative flex flex-col items-center">
        {/* Orb wake-up animation */}
        <motion.div
          className="relative"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ 
            scale: stage === 'breath' ? [1, 1.05, 1] : 1, 
            opacity: 1 
          }}
          transition={{
            scale: stage === 'breath' 
              ? { duration: 1, times: [0, 0.5, 1], ease: 'easeInOut' }
              : { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 1.2, ease: 'easeOut' },
          }}
        >
          {/* Outer glow - pulses gently */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(6,182,212,0.2) 40%, transparent 70%)',
              filter: 'blur(40px)',
              transform: 'scale(1.6)',
            }}
            initial={{ opacity: 0, scale: 1.3 }}
            animate={{
              opacity: stage === 'glow' ? [0.3, 0.7, 0.5] : 0.5,
              scale: stage === 'glow' ? [1.3, 1.8, 1.6] : 1.6,
            }}
            transition={{
              duration: stage === 'glow' ? 1 : 2,
              repeat: stage !== 'glow' ? Infinity : 0,
              ease: 'easeInOut',
            }}
          />
          
          {/* Shimmer ring during emergence */}
          {stage === 'emerge' && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0%, rgba(6, 182, 212, 0.4) 50%, transparent 100%)',
                filter: 'blur(2px)',
              }}
              initial={{ rotate: 0, opacity: 0 }}
              animate={{
                rotate: 360,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1,
                ease: 'linear',
              }}
            />
          )}
          
          {/* Main orb with premium gradients */}
          <motion.div
            className="w-52 h-52 md:w-60 md:h-60 rounded-full relative overflow-hidden"
            style={{
              background: `
                radial-gradient(circle at 30% 25%, #1e3a8a 0%, transparent 50%),
                radial-gradient(circle at 70% 70%, #0e7490 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, #0891b2 0%, #115e59 60%, #134e4a 100%)
              `,
              boxShadow: `
                0 0 70px rgba(99, 102, 241, 0.35),
                0 0 120px rgba(6, 182, 212, 0.2),
                inset 0 0 80px rgba(255, 255, 255, 0.12)
              `,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            {/* Highlight - brightens during glow */}
            <motion.div 
              className="absolute top-[10%] left-[15%] w-20 h-20 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)',
              }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: stage === 'glow' ? [0.8, 1.2, 1] : 1,
              }}
              transition={{
                duration: stage === 'glow' ? 1 : 0.8,
                ease: 'easeInOut',
              }}
            />
            
            {/* Secondary highlight for depth */}
            <motion.div 
              className="absolute top-[8%] left-[12%] w-8 h-8 rounded-full opacity-50"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 70%)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            />
            
            {/* Internal energy swirl */}
            <motion.div
              className="absolute inset-3 rounded-full opacity-30"
              style={{
                background: 'conic-gradient(from 0deg at 40% 40%, #1e40af 0%, #0891b2 25%, #14b8a6 50%, #0891b2 75%, #1e40af 100%)',
                filter: 'blur(25px)',
              }}
              initial={{ rotate: -30 }}
              animate={{
                rotate: stage === 'breath' ? [0, 15, 10] : 10,
                opacity: stage === 'breath' ? [0.3, 0.4, 0.3] : 0.3,
              }}
              transition={{
                duration: stage === 'breath' ? 1 : 1.5,
                ease: 'easeInOut',
              }}
            />
            
            {/* Warm accent */}
            <div
              className="absolute inset-5 rounded-full opacity-10"
              style={{
                background: 'radial-gradient(circle at 60% 60%, #f472b6 0%, #ec4899 30%, transparent 60%)',
              }}
            />
            
            {/* Surface shimmer effect during emergence */}
            {stage === 'emerge' && (
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.15) 55%, transparent 100%)',
                }}
                initial={{ x: '-100%', y: '-100%' }}
                animate={{ x: '100%', y: '100%' }}
                transition={{
                  duration: 1.2,
                  ease: 'easeInOut',
                }}
              />
            )}
            
            {/* Idle pulse animation */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 60%)',
              }}
              animate={{
                scale: [1, 1.02, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
          
          {/* Shadow underneath */}
          <motion.div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-36 h-6 rounded-[100%]"
            style={{
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 50%, transparent 80%)',
              filter: 'blur(10px)',
            }}
            initial={{ opacity: 0, scaleX: 0.5 }}
            animate={{ 
              opacity: 0.5, 
              scaleX: stage === 'breath' ? [1, 1.05, 1] : 1,
            }}
            transition={{ 
              opacity: { duration: 0.8 },
              scaleX: stage === 'breath' ? { duration: 1, ease: 'easeInOut' } : {},
            }}
          />
        </motion.div>
        
        {/* Welcome message */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              className="absolute bottom-[-80px] text-center"
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <p className="text-sm text-white/60 font-light tracking-wide">
                Welcome back
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Continue prompt (optional) */}
        {showContinuePrompt && showContext && (
          <motion.div
            className="absolute bottom-[-120px] text-center max-w-sm px-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <p className="text-xs text-white/40 font-light">
              Continue where we left off?
            </p>
            {lastContext && (
              <p className="text-xs text-white/25 mt-2 truncate">
                "{lastContext}"
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default WakeUp;
