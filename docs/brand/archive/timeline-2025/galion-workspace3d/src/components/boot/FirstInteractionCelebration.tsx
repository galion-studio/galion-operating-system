'use client';

/**
 * First Voice Interaction Celebration
 * 
 * A beautiful moment celebrating the user's first successful voice interaction.
 * Shows once, then never again - making it feel special.
 * Features:
 * - Particle burst from orb
 * - Gentle congratulatory message
 * - Smooth fade-out
 * - ~3 second duration
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export interface FirstInteractionCelebrationProps {
  /** Called when celebration completes */
  onComplete: () => void;
  /** Show the celebration */
  isVisible: boolean;
}

export function FirstInteractionCelebration({
  onComplete,
  isVisible,
}: FirstInteractionCelebrationProps) {
  const [particles, setParticles] = useState<Array<{ 
    id: number; 
    angle: number; 
    distance: number; 
    delay: number;
    size: number;
  }>>([]);
  const [showMessage, setShowMessage] = useState(false);
  
  // Generate celebration particles
  useEffect(() => {
    if (isVisible) {
      const particleArray = Array.from({ length: 24 }, (_, i) => ({
        id: i,
        angle: (360 / 24) * i + (Math.random() * 15 - 7.5), // Slight randomness
        distance: 120 + Math.random() * 40,
        delay: Math.random() * 0.2,
        size: 2 + Math.random() * 3,
      }));
      setParticles(particleArray);
      
      // Show message after burst
      const messageTimer = setTimeout(() => setShowMessage(true), 400);
      
      // Complete after full animation
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 3000);
      
      return () => {
        clearTimeout(messageTimer);
        clearTimeout(completeTimer);
      };
    }
    return undefined;
  }, [isVisible, onComplete]);
  
  if (!isVisible) return null;
  
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Particle burst */}
      <div className="relative">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.id % 3 === 0 
                ? 'radial-gradient(circle, #a5f3fc 0%, #67e8f9 50%, transparent 100%)'
                : particle.id % 3 === 1
                ? 'radial-gradient(circle, #93c5fd 0%, #60a5fa 50%, transparent 100%)'
                : 'radial-gradient(circle, #c4b5fd 0%, #a78bfa 50%, transparent 100%)',
              boxShadow: `0 0 ${particle.size * 2}px ${particle.size}px rgba(99, 102, 241, 0.3)`,
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              x: Math.cos((particle.angle * Math.PI) / 180) * particle.distance,
              y: Math.sin((particle.angle * Math.PI) / 180) * particle.distance,
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              delay: particle.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        ))}
        
        {/* Central glow pulse */}
        <motion.div
          className="absolute w-32 h-32 rounded-full -left-16 -top-16"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(6,182,212,0.2) 40%, transparent 70%)',
            filter: 'blur(30px)',
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: [0.5, 1.5, 1.2],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 1.2,
            ease: 'easeOut',
          }}
        />
        
        {/* Success ring */}
        {[0, 0.1, 0.2].map((delay, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute w-20 h-20 -left-10 -top-10 rounded-full border border-cyan-400/60"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 3.5],
              opacity: [0.8, 0],
            }}
            transition={{
              duration: 1,
              delay,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
      
      {/* Celebration message */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            className="absolute bottom-[30%] text-center px-6"
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span className="text-base text-white/80 font-light tracking-wide">
                Perfect!
              </span>
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-sm text-white/50 font-light tracking-wide max-w-xs">
              Your voice is clear and strong. We're ready to work together.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default FirstInteractionCelebration;
