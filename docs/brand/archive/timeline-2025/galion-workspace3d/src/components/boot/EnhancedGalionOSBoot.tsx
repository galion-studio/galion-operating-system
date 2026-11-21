'use client';

/**
 * Enhanced GalionOS Boot Animation - Premium First-Time Experience
 * 
 * Cinematic boot sequence with particle effects, ambient animations,
 * and smooth transitions. Designed for maximum visual impact.
 * 
 * Duration: ~6-7 seconds total for a truly premium feel
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface EnhancedGalionOSBootProps {
  /** Called when boot animation completes */
  onComplete: () => void;
  /** Called when ready to play greeting */
  onReadyForGreeting?: () => void;
}

// Particle system for ambient depth
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

// Boot animation stages - extended for premium experience
type BootStage = 
  | 'darkness'      // 0-0.5s: Pure darkness, building anticipation
  | 'spark'         // 0.5-1.2s: First spark of consciousness
  | 'logo'          // 1.2-2.8s: Logo materialization with particles
  | 'point'         // 2.8-3.3s: Condensing to point of light
  | 'orb-birth'     // 3.3-5.5s: Epic orb birth with energy waves
  | 'breath'        // 5.5-6.3s: First breath of life
  | 'settle'        // 6.3-7.0s: Settle to idle state
  | 'complete';     // Done

/**
 * Generate ambient particles for depth and atmosphere
 */
function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 4 + 3,
    delay: Math.random() * 2,
    opacity: Math.random() * 0.3 + 0.1,
  }));
}

export function EnhancedGalionOSBoot({
  onComplete,
  onReadyForGreeting,
}: EnhancedGalionOSBootProps) {
  const [stage, setStage] = useState<BootStage>('darkness');
  const [logoGlowPulse, setLogoGlowPulse] = useState(false);
  const [showPoetic1, setShowPoetic1] = useState(false);
  const [showPoetic2, setShowPoetic2] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  
  // Memoized particle system
  const particles = useMemo(() => generateParticles(40), []);
  
  // Stage timing - precise cinematic sequence
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    // Stage 0: Darkness (0-0.5s) - Build anticipation
    timers.push(setTimeout(() => setStage('spark'), 500));
    
    // Stage 1: First Spark (0.5-1.2s) - Consciousness awakens
    timers.push(setTimeout(() => setStage('logo'), 1200));
    
    // Stage 2: Logo (1.2-2.8s) - Brand materialization
    timers.push(setTimeout(() => setShowParticles(true), 1400));
    timers.push(setTimeout(() => setLogoGlowPulse(true), 1600));
    timers.push(setTimeout(() => setShowPoetic1(true), 1800));
    timers.push(setTimeout(() => setShowPoetic2(true), 2300));
    
    // Stage 3: Point of Light (2.8-3.3s) - Condensing energy
    timers.push(setTimeout(() => {
      setStage('point');
      setShowPoetic1(false);
      setShowPoetic2(false);
    }, 2800));
    
    // Stage 4: Orb Birth (3.3-5.5s) - Epic emergence
    timers.push(setTimeout(() => setStage('orb-birth'), 3300));
    
    // Stage 5: First Breath (5.5-6.3s) + trigger greeting
    timers.push(setTimeout(() => {
      setStage('breath');
      onReadyForGreeting?.();
    }, 5500));
    
    // Stage 6: Settle (6.3-7.0s) - Final calm
    timers.push(setTimeout(() => setStage('settle'), 6300));
    
    // Complete (7.0s) - Full cinematic experience
    timers.push(setTimeout(() => {
      setStage('complete');
      onComplete();
    }, 7000));
    
    return () => timers.forEach(t => clearTimeout(t));
  }, [onComplete, onReadyForGreeting]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f] overflow-hidden">
      {/* Deep space background with subtle stars */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 150% 100% at 50% 40%, #0f1729 0%, #0a0a0f 60%),
            radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.03) 0%, transparent 50%)
          `,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />
      
      {/* Ambient particles - float throughout scene */}
      <AnimatePresence>
        {showParticles && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, particle.opacity, particle.opacity, 0],
              scale: [0, 1, 1, 0],
              y: [0, -100, -200],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}
      </AnimatePresence>
      
      <AnimatePresence mode="sync">
        {/* ================================================================
            STAGE 0: DARKNESS - Building Anticipation (0-0.5s)
            ================================================================ */}
        {stage === 'darkness' && (
          <motion.div
            key="darkness"
            className="absolute inset-0 bg-[#0a0a0f]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
        
        {/* ================================================================
            STAGE 1: FIRST SPARK - Consciousness Awakens (0.5-1.2s)
            ================================================================ */}
        {stage === 'spark' && (
          <motion.div
            key="spark"
            className="absolute flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Single point of light - the beginning */}
            <motion.div
              className="w-1 h-1 rounded-full"
              style={{
                background: '#ffffff',
                boxShadow: '0 0 30px 10px rgba(255, 255, 255, 0.6), 0 0 60px 20px rgba(99, 102, 241, 0.4)',
              }}
              animate={{
                scale: [0, 1.5, 1, 1.8, 1],
                opacity: [0, 1, 0.8, 1, 0.9],
              }}
              transition={{
                duration: 0.7,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        )}
        
        {/* ================================================================
            STAGE 2: LOGO - Brand Materialization (1.2-2.8s)
            ================================================================ */}
        {(stage === 'logo' || stage === 'point') && (
          <motion.div
            key="logo-container"
            className="absolute flex flex-col items-center justify-center text-center"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: stage === 'point' ? 0 : 1,
              y: stage === 'point' ? -30 : 0,
              filter: stage === 'point' ? 'blur(5px)' : 'blur(0px)',
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Multi-layer glow behind logo - energy building */}
            <motion.div
              className="absolute w-96 h-96 rounded-full pointer-events-none"
              style={{
                background: `
                  radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%),
                  radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 60%)
                `,
                filter: 'blur(70px)',
              }}
              animate={logoGlowPulse ? {
                opacity: [0.2, 1, 0.5],
                scale: [1, 1.3, 1.1],
              } : { opacity: 0.2 }}
              transition={{
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
            
            {/* Secondary glow layer - pulsing energy */}
            <motion.div
              className="absolute w-80 h-80 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 60%)',
                filter: 'blur(50px)',
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                ease: 'easeInOut',
                repeat: Infinity,
              }}
            />
            
            {/* GALION wordmark - premium typography */}
            <motion.h1
              className="relative text-6xl md:text-7xl font-extralight tracking-[0.4em] text-white select-none"
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                textShadow: '0 0 40px rgba(99, 102, 241, 0.3)',
              }}
              initial={{ 
                opacity: 0, 
                y: 20, 
                letterSpacing: '0.6em',
                filter: 'blur(10px)',
              }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                letterSpacing: '0.4em',
                filter: 'blur(0px)',
              }}
              transition={{ 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              GALION
              
              {/* Shimmer effect across logo */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                style={{
                  maskImage: 'linear-gradient(to right, transparent, white, transparent)',
                }}
                animate={{
                  x: ['-200%', '200%'],
                }}
                transition={{
                  duration: 2,
                  delay: 0.3,
                  ease: 'easeInOut',
                }}
              />
            </motion.h1>
            
            {/* Tagline - ethereal fade-in */}
            <motion.p
              className="mt-6 text-base md:text-lg text-white/40 font-light tracking-[0.25em] select-none"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
            >
              Your only limit is your imagination
            </motion.p>
            
            {/* Poetic initialization text - mystical appearance */}
            <div className="absolute top-[calc(50%+140px)] flex flex-col items-center gap-3">
              <AnimatePresence mode="sync">
                {showPoetic1 && (
                  <motion.p
                    key="poetic1"
                    className="text-sm text-cyan-400/40 font-light tracking-wider"
                    initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
                    transition={{ duration: 0.5 }}
                  >
                    Initializing consciousness…
                  </motion.p>
                )}
              </AnimatePresence>
              <AnimatePresence mode="sync">
                {showPoetic2 && (
                  <motion.p
                    key="poetic2"
                    className="text-sm text-violet-400/30 font-light tracking-wider"
                    initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
                    transition={{ duration: 0.5 }}
                  >
                    Linking voice, memory, and space…
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
        
        {/* ================================================================
            STAGE 3: POINT OF LIGHT - Energy Condensing (2.8-3.3s)
            ================================================================ */}
        {stage === 'point' && (
          <motion.div
            key="point-of-light"
            className="absolute flex items-center justify-center"
            style={{ top: '50%' }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Converging energy rings */}
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={`ring-${ring}`}
                className="absolute rounded-full border border-cyan-400/30"
                style={{
                  width: 120 * ring,
                  height: 120 * ring,
                }}
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 0.3, opacity: [0, 0.6, 0] }}
                transition={{
                  duration: 0.5,
                  delay: ring * 0.05,
                  ease: 'easeIn',
                }}
              />
            ))}
            
            {/* Central point of light - brilliant */}
            <motion.div
              className="w-4 h-4 rounded-full"
              style={{
                background: 'radial-gradient(circle, #ffffff 0%, #67e8f9 40%, #6366f1 100%)',
                boxShadow: `
                  0 0 30px 12px rgba(103, 232, 249, 0.6),
                  0 0 60px 20px rgba(99, 102, 241, 0.4),
                  0 0 90px 30px rgba(139, 92, 246, 0.2)
                `,
              }}
              animate={{
                scale: [1, 1.5, 1.2],
                opacity: [0.9, 1, 1],
              }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        )}
        
        {/* ================================================================
            STAGE 4: ORB BIRTH - Epic Emergence (3.3-5.5s)
            ================================================================ */}
        {(stage === 'orb-birth' || stage === 'breath' || stage === 'settle') && (
          <motion.div
            key="orb-birth"
            className="absolute flex items-center justify-center"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
            {/* Energy waves emanating during birth */}
            {stage === 'orb-birth' && [1, 2, 3, 4].map((wave) => (
              <motion.div
                key={`wave-${wave}`}
                className="absolute rounded-full border-2 border-cyan-400/20"
                style={{
                  width: 200,
                  height: 200,
                }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ 
                  scale: [0.5, 3.5],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: wave * 0.3,
                  ease: 'easeOut',
                }}
              />
            ))}
            
            {/* Orb container with shadow and depth */}
            <motion.div
              className="relative"
              initial={{ scale: 0.02, opacity: 0.3 }}
              animate={{ 
                scale: stage === 'orb-birth' ? [0.02, 0.6, 0.95, 1] : 
                       stage === 'breath' ? [1, 1.08, 1] :
                       1,
                opacity: stage === 'orb-birth' ? [0.3, 0.7, 0.95, 1] : 1,
              }}
              transition={{
                duration: stage === 'orb-birth' ? 2.2 : 
                         stage === 'breath' ? 0.6 : 0.5,
                times: stage === 'orb-birth' ? [0, 0.4, 0.85, 1] : undefined,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Shadow underneath - grounding element */}
              <motion.div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-10 rounded-[100%]"
                style={{
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
                  filter: 'blur(15px)',
                }}
                initial={{ opacity: 0, scaleX: 0.2 }}
                animate={{ 
                  opacity: stage === 'breath' ? [0.5, 0.65, 0.5] : 0.5,
                  scaleX: stage === 'breath' ? [1, 1.15, 1] : 1,
                }}
                transition={{ 
                  opacity: { delay: 0.6, duration: 0.8 },
                  scaleX: stage === 'breath' ? { duration: 0.6, ease: 'easeInOut' } : {},
                }}
              />
              
              {/* Outer glow bloom - multi-layer */}
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: `
                    radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(6,182,212,0.2) 40%, transparent 70%),
                    radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 60%)
                  `,
                  filter: 'blur(40px)',
                  transform: 'scale(1.8)',
                }}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: stage === 'breath' ? [0.8, 1.2, 0.9] : 0.8,
                  scale: stage === 'breath' ? [1.8, 2.0, 1.8] : 1.8,
                }}
                transition={{ 
                  opacity: { delay: 0.4, duration: 0.9 },
                  scale: stage === 'breath' ? { duration: 0.6, ease: 'easeInOut' } : {},
                }}
              />
              
              {/* Main orb sphere - premium gradients */}
              <motion.div
                className="w-56 h-56 md:w-64 md:h-64 rounded-full relative overflow-hidden"
                style={{
                  background: `
                    radial-gradient(ellipse at 28% 22%, #3b82f6 0%, transparent 50%),
                    radial-gradient(ellipse at 72% 75%, #14b8a6 0%, transparent 50%),
                    radial-gradient(circle at 50% 50%, #0891b2 0%, #115e59 55%, #0f766e 100%)
                  `,
                  boxShadow: `
                    0 0 80px rgba(99, 102, 241, 0.35),
                    0 0 140px rgba(6, 182, 212, 0.2),
                    0 0 200px rgba(139, 92, 246, 0.1),
                    inset 0 0 100px rgba(255, 255, 255, 0.1)
                  `,
                }}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1,
                }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                {/* Primary highlight - top-left lighting */}
                <motion.div 
                  className="absolute top-[8%] left-[12%] w-24 h-24 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.12) 40%, transparent 70%)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: stage === 'breath' ? [1, 1.4, 1] : 1,
                  }}
                  transition={{ 
                    opacity: { delay: 0.6, duration: 0.5 },
                  }}
                />
                
                {/* Secondary highlight - brighter spot */}
                <motion.div 
                  className="absolute top-[6%] left-[10%] w-10 h-10 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                />
                
                {/* Internal swirling gradients - organic motion */}
                <motion.div
                  className="absolute inset-3 rounded-full opacity-35"
                  style={{
                    background: 'conic-gradient(from 0deg at 42% 38%, #1e40af 0%, #0891b2 20%, #14b8a6 40%, #06b6d4 60%, #0891b2 80%, #1e40af 100%)',
                    filter: 'blur(25px)',
                  }}
                  animate={{
                    rotate: stage === 'orb-birth' ? [0, 45, 35] :
                            stage === 'settle' ? [35, 40] : 35,
                  }}
                  transition={{
                    duration: stage === 'orb-birth' ? 2.2 :
                            stage === 'settle' ? 10 : 0,
                    ease: stage === 'settle' ? 'linear' : 'easeInOut',
                    repeat: stage === 'settle' ? Infinity : 0,
                  }}
                />
                
                {/* Warm accent layer - depth and richness */}
                <motion.div
                  className="absolute inset-6 rounded-full opacity-12"
                  style={{
                    background: `
                      radial-gradient(circle at 65% 65%, #f472b6 0%, transparent 50%),
                      radial-gradient(circle at 35% 35%, #a78bfa 0%, transparent 60%)
                    `,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.12 }}
                  transition={{ delay: 1, duration: 0.6 }}
                />
                
                {/* Subtle inner light pulse - breathing effect */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 55%)',
                  }}
                  animate={{
                    opacity: stage === 'settle' ? [0.25, 0.45, 0.25] : 
                            stage === 'breath' ? [0.3, 0.65, 0.4] : 0.3,
                    scale: stage === 'settle' ? [1, 1.02, 1] :
                           stage === 'breath' ? [1, 1.03, 1] : 1,
                  }}
                  transition={{
                    duration: stage === 'settle' ? 5 :
                            stage === 'breath' ? 0.6 : 0,
                    repeat: stage === 'settle' ? Infinity : 0,
                    ease: 'easeInOut',
                  }}
                />
                
                {/* Rim light - edge definition */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    boxShadow: 'inset 0 -2px 40px rgba(6, 182, 212, 0.3), inset 0 2px 40px rgba(99, 102, 241, 0.2)',
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EnhancedGalionOSBoot;
