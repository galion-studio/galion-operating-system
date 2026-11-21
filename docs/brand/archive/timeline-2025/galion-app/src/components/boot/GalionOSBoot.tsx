'use client';

/**
 * GalionOS Boot Animation - Cinematic Birth of the Orb
 * 
 * Enhanced premium animation for first-time users.
 * Features:
 * - Particle effects and light rays
 * - Dramatic orb materialization
 * - Professional easing and timing
 * - 22nd century Apple-level polish
 * - LightDoor effect during awakening
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LightDoor } from '@/components/effects/LightDoor';

export interface GalionOSBootProps {
  /** Called when boot animation completes */
  onComplete: () => void;
  /** Called when ready to play greeting (Stage C) */
  onReadyForGreeting?: () => void;
}

// Animation stages with cinematic timing
type BootStage = 
  | 'void'        // 0-1s: Pure darkness, anticipation
  | 'spark'       // 1-2s: First spark of consciousness
  | 'logo'        // 2-5s: Logo revelation with particles
  | 'convergence' // 5-5.8s: Energy convergence
  | 'orb-birth'   // 5.8-9s: Dramatic orb materialization
  | 'awakening'   // 9-11s: First breath, light pulse
  | 'settle'      // 11-12.5s: Settle to idle state
  | 'complete';   // Done (human-optimized ~12.5s total)

export function GalionOSBoot({
  onComplete,
  onReadyForGreeting,
}: GalionOSBootProps) {
  const [stage, setStage] = useState<BootStage>('void');
  const [showPoetic1, setShowPoetic1] = useState(false);
  const [showPoetic2, setShowPoetic2] = useState(false);
  const [showPoetic3, setShowPoetic3] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; angle: number; delay: number }>>([]);
  const [stars, setStars] = useState<Array<{ id: number; left: number; top: number; duration: number; delay: number }>>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  // Mark as mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Generate particles and stars for dramatic effect (client-side only to avoid hydration mismatch)
  useEffect(() => {
    if (!isMounted) return;
    
    try {
      // Generate particles
      const particleArray = Array.from({ length: 32 }, (_, i) => ({
        id: i,
        angle: (360 / 32) * i,
        delay: Math.random() * 0.5,
      }));
      setParticles(particleArray);
      
      // Generate stars with random positions
      const starArray = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 2,
      }));
      setStars(starArray);
    } catch (error) {
      console.error('[GalionOSBoot] Particle generation error:', error);
      setParticles([]);
      setStars([]);
    }
  }, [isMounted]);
  
  // Cinematic stage timing - each moment carefully orchestrated
  // HUMAN-OPTIMIZED: Slower, comfortable for all ages
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    try {
      // Stage 1: Void → Spark (0-2s)
      // Pure darkness, let eyes adjust, then first spark of consciousness
      timers.push(setTimeout(() => setStage('spark'), 1000));
      
      // Stage 2: Spark → Logo (2-5s)
      // Logo revelation with poetic text - enough time to read each line
      timers.push(setTimeout(() => setStage('logo'), 2000));
      timers.push(setTimeout(() => setShowPoetic1(true), 2800));  // First text after logo settles
      timers.push(setTimeout(() => setShowPoetic2(true), 4000));  // 1.2s to read first line
      timers.push(setTimeout(() => setShowPoetic3(true), 5200));  // 1.2s to read second line
      
      // Stage 3: Convergence (6.4-7.2s)
      // Energy converges to center point - let last text be read
      timers.push(setTimeout(() => {
        setStage('convergence');
        setShowPoetic1(false);
        setShowPoetic2(false);
        setShowPoetic3(false);
      }, 6400));
      
      // Stage 4: Orb Birth (7.2-10s)
      // Dramatic materialization of the orb
      timers.push(setTimeout(() => setStage('orb-birth'), 7200));
      
      // Stage 5: Awakening (10-12s)
      // First breath, consciousness awakens
      timers.push(setTimeout(() => {
        setStage('awakening');
        onReadyForGreeting?.();
      }, 10000));
      
      // Stage 6: Settle (12-13.5s)
      // Settle into idle, ready state
      timers.push(setTimeout(() => setStage('settle'), 12000));
      
      // Complete (13.5s)
      // Hand off to main interface
      timers.push(setTimeout(() => {
        setStage('complete');
        onComplete();
      }, 13500));
    } catch (error) {
      console.error('[GalionOSBoot] Timer setup error:', error);
      // Emergency fallback - complete immediately
      onComplete();
    }
    
    return () => timers.forEach(t => clearTimeout(t));
  }, [onComplete, onReadyForGreeting]);
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0f] overflow-hidden">
      {/* Dynamic background that evolves with the animation */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 120% 100% at 50% 40%, #0f1729 0%, #0a0a0f 70%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: stage === 'void' ? 0 : 1,
        }}
        transition={{ duration: 2.0, ease: [0.25, 0.1, 0.25, 1] }}
      />
      
      {/* Vignette that intensifies during key moments */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 70% at center, transparent 0%, rgba(0,0,0,0.6) 100%)',
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: stage === 'orb-birth' || stage === 'awakening' ? 0.7 : 0.3,
        }}
        transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
      />
      
      {/* Subtle star field for depth - only render on client to avoid hydration issues */}
      {isMounted && stars.length > 0 && (
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {stars.map((star) => (
            <motion.div
              key={star.id}
              className="absolute w-0.5 h-0.5 bg-white rounded-full"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
              }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Main content area - matches main app layout exactly: flex-1 flex-col items-center justify-center -mt-16 */}
      <main className="flex-1 flex flex-col items-center justify-center -mt-16">
        <AnimatePresence mode="sync">
        {/* ================================================================
            STAGE 1: THE VOID (0-0.5s)
            Pure darkness, anticipation
            ================================================================ */}
        {stage === 'void' && (
          <motion.div
            key="void"
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
        
        {/* ================================================================
            STAGE 2: THE SPARK (0.5-1.2s)
            First spark of consciousness
            ================================================================ */}
        {stage === 'spark' && (
          <motion.div
            key="spark"
            className="absolute flex items-center justify-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Central spark */}
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{
                background: 'radial-gradient(circle, #ffffff 0%, #a5f3fc 50%, transparent 100%)',
                boxShadow: '0 0 30px 10px rgba(165, 243, 252, 0.6), 0 0 60px 20px rgba(99, 102, 241, 0.3)',
              }}
              animate={{
                scale: [1, 2, 1.5],
                opacity: [1, 0.8, 1],
              }}
              transition={{
                duration: 0.5,
                ease: 'easeInOut',
              }}
            />
            
            {/* Radial light burst */}
            <motion.div
              className="absolute w-40 h-40 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(6,182,212,0.2) 40%, transparent 70%)',
                filter: 'blur(20px)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            />
          </motion.div>
        )}
        
        {/* ================================================================
            STAGE 3: LOGO REVELATION (1.2-2.8s)
            Dramatic logo appearance with particles
            ================================================================ */}
        {stage === 'logo' && (
          <motion.div
            key="logo-container"
            className="absolute flex flex-col items-center justify-center text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Expanding energy ring */}
            <motion.div
              className="absolute w-96 h-96 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.1) 40%, transparent 70%)',
                filter: 'blur(40px)',
              }}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ 
                scale: [0.3, 1.3, 1],
                opacity: [0, 0.8, 0.5],
              }}
              transition={{
                duration: 1.2,
                ease: 'easeOut',
              }}
            />
            
            {/* Light rays emanating from center */}
            {particles.slice(0, 12).map((particle) => (
              <motion.div
                key={`ray-${particle.id}`}
                className="absolute w-0.5 h-20 bg-gradient-to-t from-cyan-500/30 to-transparent origin-bottom"
                style={{
                  transform: `rotate(${particle.angle}deg) translateY(-150px)`,
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: [0, 0.6, 0] }}
                transition={{
                  duration: 0.8,
                  delay: particle.delay,
                  ease: 'easeOut',
                }}
              />
            ))}
            
            {/* GALION wordmark */}
            <motion.h1
              className="text-6xl md:text-7xl font-extralight tracking-[0.4em] text-white/95 select-none relative z-10"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              initial={{ opacity: 0, y: 20, letterSpacing: '0.6em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '0.4em' }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              GALION
            </motion.h1>
            
            {/* Slogan with shimmer effect */}
            <motion.p
              className="mt-6 text-base md:text-lg text-white/40 font-light tracking-[0.25em] select-none relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1.0, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <span className="relative">
                Your only limit is your imagination
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 2.0, delay: 1.2 }}
                />
              </span>
            </motion.p>
            
            {/* Poetic initialization text - Human-readable timing */}
            <div className="absolute top-[calc(50%+140px)] flex flex-col items-center gap-3">
              <AnimatePresence mode="sync">
                {showPoetic1 && (
                  <motion.p
                    key="poetic1"
                    className="text-sm text-cyan-400/60 font-light tracking-widest"
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    ◆ Initializing consciousness
                  </motion.p>
                )}
              </AnimatePresence>
              <AnimatePresence mode="sync">
                {showPoetic2 && (
                  <motion.p
                    key="poetic2"
                    className="text-sm text-cyan-400/50 font-light tracking-widest"
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    ◆ Linking voice, memory, space
                  </motion.p>
                )}
              </AnimatePresence>
              <AnimatePresence mode="sync">
                {showPoetic3 && (
                  <motion.p
                    key="poetic3"
                    className="text-sm text-cyan-400/40 font-light tracking-widest"
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    ◆ Preparing to awaken
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
        
        {/* ================================================================
            STAGE 4: ENERGY CONVERGENCE (2.8-3.2s)
            All energy converges to center point
            ================================================================ */}
        {stage === 'convergence' && (
          <motion.div
            key="convergence"
            className="absolute flex items-center justify-center"
            style={{ top: '50%' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Particle streams converging inward */}
            {particles.map((particle) => (
              <motion.div
                key={`particle-${particle.id}`}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                style={{
                  boxShadow: '0 0 8px 2px rgba(6, 182, 212, 0.6)',
                }}
                initial={{
                  x: Math.cos((particle.angle * Math.PI) / 180) * 200,
                  y: Math.sin((particle.angle * Math.PI) / 180) * 200,
                  opacity: 1,
                  scale: 1,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  opacity: [1, 1, 0],
                  scale: [1, 0.5, 0],
                }}
                transition={{
                  duration: 0.4,
                  delay: particle.delay * 0.1,
                  ease: 'easeIn',
                }}
              />
            ))}
            
            {/* Central convergence point with intense glow */}
            <motion.div
              className="w-4 h-4 rounded-full"
              style={{
                background: 'radial-gradient(circle, #ffffff 0%, #67e8f9 30%, #3b82f6 60%, transparent 100%)',
                boxShadow: `
                  0 0 40px 12px rgba(103, 232, 249, 0.8),
                  0 0 80px 24px rgba(59, 130, 246, 0.5),
                  0 0 120px 36px rgba(99, 102, 241, 0.3)
                `,
              }}
              initial={{ scale: 1 }}
              animate={{
                scale: [1, 1.8, 1.4],
                opacity: [1, 1, 1],
              }}
              transition={{
                duration: 0.4,
                ease: 'easeInOut',
              }}
            />
            
            {/* Rings expanding from center */}
            {[0, 0.15, 0.3].map((delay, i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute w-8 h-8 rounded-full border-2 border-cyan-400/40"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 6],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 0.6,
                  delay,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        )}
        
        {/* ================================================================
            STAGE 5: ORB BIRTH (7.2-10s)
            Dramatic materialization with layers forming
            Container: Same min-h as Orb.tsx for consistent positioning
            ================================================================ */}
        {stage === 'orb-birth' && (
          <motion.div
            key="orb-birth"
            className="flex items-center justify-center min-h-[280px] md:min-h-[340px]"
          >
            {/* Energy field pulsing outward during birth */}
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(6,182,212,0.12) 30%, transparent 60%)',
                filter: 'blur(45px)',
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: [0.5, 1.2, 1],
                opacity: [0, 1, 0.7],
              }}
              transition={{
                duration: 2,
                times: [0, 0.7, 1],
                ease: [0.16, 1, 0.3, 1],
              }}
            />
            
            {/* Orb growing from point - multi-phase birth */}
            <motion.div
              className="relative"
              initial={{ scale: 0.01, opacity: 0.3 }}
              animate={{ 
                scale: [0.01, 0.4, 0.85, 1], 
                opacity: [0.3, 0.6, 0.9, 1], 
              }}
              transition={{
                duration: 2.3,
                times: [0, 0.3, 0.75, 1],
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Shadow underneath - grows with orb - MATCH Orb.tsx */}
              <motion.div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-36 h-6 rounded-[100%] pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)',
                  filter: 'blur(8px)',
                }}
                initial={{ opacity: 0, scaleX: 0.2 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.5, duration: 1.2 }}
              />
              
              {/* Outer energy bloom - multiple layers */}
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(6,182,212,0.2) 40%, transparent 70%)',
                  filter: 'blur(45px)',
                  transform: 'scale(1.8)',
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: [0, 1, 0.8],
                  scale: [0.5, 2, 1.8],
                }}
                transition={{ 
                  duration: 2,
                  times: [0, 0.6, 1],
                  ease: 'easeOut',
                }}
              />
              
              {/* Main orb sphere - layers appearing sequentially */}
              <motion.div
                className="w-52 h-52 md:w-60 md:h-60 rounded-full relative overflow-hidden"
                style={{
                  background: `
                    radial-gradient(circle at 30% 25%, #1e3a8a 0%, transparent 50%),
                    radial-gradient(circle at 70% 70%, #0e7490 0%, transparent 50%),
                    radial-gradient(circle at 50% 50%, #0891b2 0%, #115e59 60%, #134e4a 100%)
                  `,
                  boxShadow: `
                    0 0 80px rgba(99, 102, 241, 0.35),
                    0 0 140px rgba(6, 182, 212, 0.2),
                    inset 0 0 100px rgba(255, 255, 255, 0.1)
                  `,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                {/* Highlight at top-left - appears after main sphere */}
                <motion.div 
                  className="absolute top-[10%] left-[15%] w-20 h-20 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)',
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                />
                
                {/* Secondary highlight for depth */}
                <motion.div 
                  className="absolute top-[8%] left-[12%] w-8 h-8 rounded-full opacity-50"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 70%)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 1, duration: 0.4 }}
                />
                
                {/* Internal energy - swirling into place */}
                <motion.div
                  className="absolute inset-3 rounded-full opacity-35"
                  style={{
                    background: 'conic-gradient(from 0deg at 40% 40%, #1e40af 0%, #0891b2 25%, #14b8a6 50%, #0891b2 75%, #1e40af 100%)',
                    filter: 'blur(25px)',
                  }}
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{
                    rotate: 25,
                    opacity: 0.35,
                  }}
                  transition={{
                    duration: 2,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
                
                {/* Warm accent - subtle color variation */}
                <motion.div
                  className="absolute inset-5 rounded-full opacity-12"
                  style={{
                    background: 'radial-gradient(circle at 60% 60%, #f472b6 0%, #ec4899 30%, transparent 60%)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.12 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                />
                
                {/* Inner glow pulsing as energy stabilizes */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)',
                  }}
                  initial={{ opacity: 0.2 }}
                  animate={{
                    opacity: [0.2, 0.6, 0.4],
                  }}
                  transition={{
                    duration: 1.5,
                    ease: 'easeInOut',
                  }}
                />
                
                {/* Surface ripple effect */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(6, 182, 212, 0.1) 100%)',
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [0.8, 1.1, 1],
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{
                    duration: 1.2,
                    delay: 0.6,
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
        
        {/* ================================================================
            STAGE 6: AWAKENING (10-12s)
            First breath, consciousness awakens
            LightDoor opens, flowing lines appear - transition to main app
            Container: Same min-h as Orb.tsx for consistent positioning
            ================================================================ */}
        {stage === 'awakening' && (
          <>
            {/* LightDoor Background - Opens during awakening */}
            <motion.div
              className="absolute inset-0 z-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <LightDoor 
                isOpen={true}
                duration={2}
                color="#06b6d4"
                glowColor="#22d3ee"
                intensity={0.5}
                showBeams={true}
                showParticles={false}
                particleCount={10}
              />
            </motion.div>
            
            {/* Flowing energy lines radiating outward */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`flow-line-${i}`}
                  className="absolute left-1/2 top-1/2 h-[1px] origin-left"
                  style={{
                    width: '50vw',
                    background: `linear-gradient(90deg, rgba(6, 182, 212, 0.6) 0%, rgba(99, 102, 241, 0.3) 50%, transparent 100%)`,
                    transform: `rotate(${i * 45}deg)`,
                  }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ 
                    scaleX: [0, 1, 1],
                    opacity: [0, 0.8, 0.4],
                  }}
                  transition={{ 
                    duration: 2,
                    delay: 0.1 * i,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                />
              ))}
            </div>
            
            <motion.div
              key="awakening-orb"
              className="flex items-center justify-center min-h-[280px] md:min-h-[340px] z-10"
            >
              {/* Shadow underneath - breathing with orb */}
              <motion.div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-36 h-6 rounded-[100%] pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)',
                  filter: 'blur(8px)',
                }}
                animate={{
                  scaleX: [1, 1.08, 1],
                  opacity: [1, 0.9, 1],
                }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
            
            {/* Enhanced glow during awakening */}
            <motion.div
              className="absolute w-52 h-52 md:w-60 md:h-60 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(6,182,212,0.2) 40%, transparent 70%)',
                filter: 'blur(30px)',
                transform: 'scale(1.5)',
              }}
              animate={{
                opacity: [0.6, 0.9, 0.7],
                scale: [1.5, 1.65, 1.55],
              }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
            
            {/* Orb with breathing animation - first breath 8% scale */}
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
                  0 0 110px rgba(6, 182, 212, 0.2),
                  inset 0 0 70px rgba(255, 255, 255, 0.1)
                `,
              }}
              animate={{
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 1.5,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              {/* Highlight - brightens during breath */}
              <motion.div 
                className="absolute top-[10%] left-[15%] w-20 h-20 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 40%, transparent 70%)',
                }}
                animate={{
                  opacity: [1, 1.3, 1],
                }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
              
              <div 
                className="absolute top-[8%] left-[12%] w-8 h-8 rounded-full opacity-35 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
                }}
              />
              
              {/* Inner gradient - brightens at peak */}
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)',
                }}
                animate={{
                  opacity: [0.4, 0.7, 0.5],
                }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
              
              {/* Warm accent */}
              <div
                className="absolute inset-4 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 60% 60%, #f472b6 0%, transparent 60%)',
                  opacity: 0.1,
                }}
              />
              
              {/* Energy swirl */}
              <motion.div
                className="absolute inset-2 rounded-full pointer-events-none"
                style={{
                  background: 'conic-gradient(from 30deg at 45% 45%, #1e3a8a 0%, #0891b2 25%, #134e4a 50%, #0891b2 75%, #1e3a8a 100%)',
                  filter: 'blur(25px)',
                  opacity: 0.18,
                }}
                animate={{
                  rotate: [25, 32],
                }}
                transition={{
                  duration: 1.5,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          </motion.div>
          </>
        )}
        
        {/* ================================================================
            STAGE 7: SETTLE (12-13.5s)
            Settle into idle, ready state - MUST MATCH MAIN APP ORB EXACTLY
            Container: Same min-h as Orb.tsx for seamless transition
            LightDoor stays visible for seamless transition
            ================================================================ */}
        {stage === 'settle' && (
          <>
            {/* LightDoor Background - Already open, stays visible */}
            <div className="absolute inset-0 z-0">
              <LightDoor 
                isOpen={true}
                duration={0.5}
                color="#06b6d4"
                glowColor="#22d3ee"
                intensity={0.4}
                showBeams={false}
                showParticles={false}
              />
            </div>
            
            {/* Subtle flowing lines - fading to match main app */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`settle-line-${i}`}
                  className="absolute left-1/2 top-1/2 h-px origin-left"
                  style={{
                    width: '50vw',
                    background: `linear-gradient(90deg, rgba(6, 182, 212, 0.4) 0%, rgba(99, 102, 241, 0.2) 50%, transparent 100%)`,
                    transform: `rotate(${i * 45}deg)`,
                  }}
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: 0.2 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              ))}
            </div>
            
            <motion.div
              key="settle-orb"
              className="flex items-center justify-center min-h-[280px] md:min-h-[340px] z-10"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Shadow - settled - same as Orb.tsx */}
              <div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-36 h-6 rounded-[100%] pointer-events-none"
                style={{
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)',
                filter: 'blur(8px)',
              }}
            />
            
            {/* Glow - steady idle state - same as Orb.tsx */}
            <motion.div
              className="absolute w-52 h-52 md:w-60 md:h-60 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(6,182,212,0.15) 40%, transparent 70%)',
                filter: 'blur(30px)',
                transform: 'scale(1.5)',
              }}
              animate={{
                opacity: [0.5, 0.6, 0.5],
                scale: [1.5, 1.53, 1.5],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: 'easeInOut' 
              }}
            />
            
            {/* Final orb - EXACT MATCH to Orb.tsx */}
            <motion.div
              className="w-52 h-52 md:w-60 md:h-60 rounded-full relative overflow-hidden"
              style={{
                background: `
                  radial-gradient(circle at 30% 25%, #1e3a8a 0%, transparent 50%),
                  radial-gradient(circle at 70% 70%, #0e7490 0%, transparent 50%),
                  radial-gradient(circle at 50% 50%, #0891b2 0%, #115e59 60%, #134e4a 100%)
                `,
                boxShadow: `
                  0 0 55px rgba(99, 102, 241, 0.25),
                  0 0 85px rgba(6, 182, 212, 0.15),
                  inset 0 0 60px rgba(255, 255, 255, 0.06)
                `,
              }}
              initial={{ scale: 1 }}
              animate={{ 
                scale: [1, 1.015, 1], // Exact idle animation from Orb.tsx
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Highlight - EXACT MATCH to Orb.tsx */}
              <div 
                className="absolute top-[10%] left-[15%] w-20 h-20 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 40%, transparent 70%)',
                }}
              />
              
              {/* Secondary highlight - EXACT MATCH to Orb.tsx */}
              <div 
                className="absolute top-[8%] left-[12%] w-8 h-8 rounded-full opacity-35 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
                }}
              />
              
              {/* Internal gradients - slow cloud-like motion - EXACT MATCH to Orb.tsx */}
              <motion.div
                className="absolute inset-2 rounded-full pointer-events-none"
                style={{
                  background: 'conic-gradient(from 30deg at 45% 45%, #1e3a8a 0%, #0891b2 25%, #134e4a 50%, #0891b2 75%, #1e3a8a 100%)',
                  filter: 'blur(25px)',
                  opacity: 0.15,
                }}
                animate={{
                  rotate: [30, 35],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              
              {/* Warm accent layer - EXACT MATCH to Orb.tsx */}
              <div
                className="absolute inset-4 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 60% 60%, #f472b6 0%, transparent 60%)',
                  opacity: 0.08,
                }}
              />
              
              {/* Inner glow - subtle idle pulse - EXACT MATCH to Orb.tsx */}
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 50%)',
                }}
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}

export default GalionOSBoot;
