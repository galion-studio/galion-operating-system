'use client';

/**
 * Galion Voice Orb - MD2026 Specification Voice-Reactive Orb
 * ===========================================================
 *
 * A premium blue orb that follows MD2026 spec and reacts to voice state:
 * - 120px diameter (configurable)
 * - Radial gradient: #0099FF → #0077DD → #0055AA
 * - Pulse animation: 1.0 → 1.05 → 1.0 over 2.5s
 * - Voice-reactive: grows with audio level, glows when listening/speaking
 *
 * "Your only limit is your imagination."
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// MD2026 Color Palette
const MD2026 = {
  orbCenter: '#0099FF',
  orbMid: '#0077DD',
  orbEdge: '#0055AA',
  glowPrimary: 'rgba(0, 153, 255, 0.6)',
  glowSecondary: 'rgba(0, 119, 221, 0.4)',
  glowTertiary: 'rgba(0, 85, 170, 0.3)',
  listeningGlow: 'rgba(0, 200, 255, 0.8)',
  speakingGlow: 'rgba(0, 255, 200, 0.6)',
  processingGlow: 'rgba(139, 92, 246, 0.6)',
};

export interface GalionVoiceOrbProps {
  /** Orb size in pixels (default: 120) */
  size?: number;
  /** Whether the orb is listening to user */
  isListening?: boolean;
  /** Whether the orb is speaking */
  isSpeaking?: boolean;
  /** Whether the orb is processing */
  isProcessing?: boolean;
  /** Audio level from 0-1 */
  audioLevel?: number;
  /** Current emotion (optional, for future use) */
  emotion?: string;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

export function GalionVoiceOrb({
  size = 120,
  isListening = false,
  isSpeaking = false,
  isProcessing = false,
  audioLevel = 0,
  onClick,
  className = '',
}: GalionVoiceOrbProps) {
  // Calculate dynamic scale based on audio level
  const audioScale = useMemo(() => {
    if (isListening) {
      return 1 + audioLevel * 0.15; // Grow up to 15% when speaking loudly
    }
    if (isSpeaking) {
      return 1 + audioLevel * 0.1; // Subtle growth when AI speaking
    }
    return 1;
  }, [isListening, isSpeaking, audioLevel]);

  // Determine glow color based on state
  const glowColor = useMemo(() => {
    if (isListening) return MD2026.listeningGlow;
    if (isSpeaking) return MD2026.speakingGlow;
    if (isProcessing) return MD2026.processingGlow;
    return MD2026.glowPrimary;
  }, [isListening, isSpeaking, isProcessing]);

  // Glow intensity based on state
  const glowIntensity = useMemo(() => {
    if (isListening) return 1 + audioLevel * 0.5;
    if (isSpeaking) return 1.2;
    if (isProcessing) return 0.8;
    return 0.6;
  }, [isListening, isSpeaking, isProcessing, audioLevel]);

  return (
    <motion.div
      className={`relative cursor-pointer ${className}`}
      style={{ width: size * 2, height: size * 2 }}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Outer glow layers */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          opacity: glowIntensity * 0.5,
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [glowIntensity * 0.4, glowIntensity * 0.6, glowIntensity * 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Secondary glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${MD2026.glowSecondary} 0%, transparent 60%)`,
          filter: 'blur(60px)',
          opacity: 0.4,
        }}
        animate={{
          scale: [1.1, 1.2, 1.1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main orb container - centered */}
      <div
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* The Orb - MD2026 Spec */}
        <motion.div
          className="rounded-full overflow-hidden"
          style={{
            width: size,
            height: size,
            background: `radial-gradient(circle at 35% 35%,
              ${MD2026.orbCenter} 0%,
              ${MD2026.orbMid} 40%,
              ${MD2026.orbEdge} 100%
            )`,
            boxShadow: `
              0 0 ${40 * glowIntensity}px ${glowColor},
              0 0 ${80 * glowIntensity}px ${MD2026.glowSecondary},
              inset 0 0 30px rgba(255, 255, 255, 0.1)
            `,
          }}
          animate={{
            scale: isListening || isSpeaking
              ? audioScale
              : [1, 1.05, 1], // MD2026 pulse: 1.0 → 1.05 → 1.0
          }}
          transition={
            isListening || isSpeaking
              ? { duration: 0.1, ease: 'easeOut' }
              : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          {/* Primary highlight */}
          <div
            className="absolute top-[15%] left-[20%] w-8 h-8 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
            }}
          />

          {/* Secondary highlight */}
          <div
            className="absolute top-[10%] left-[15%] w-4 h-4 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 60%)',
            }}
          />

          {/* Internal swirl - rotating particles */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{
              duration: 8, // 360°/8s as per MD2026
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i / 10) * 360;
              const radius = 25 + (i % 3) * 8;
              const particleSize = 2 + (i % 3);
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: particleSize,
                    height: particleSize,
                    background: 'rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 0 4px rgba(255, 255, 255, 0.6)',
                    left: '50%',
                    top: '50%',
                    transform: `rotate(${angle}deg) translateX(${radius}px) translateY(-50%)`,
                  }}
                  animate={{
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 2 + i * 0.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              );
            })}
          </motion.div>

          {/* Breath effect overlay */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)',
            }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        {/* State indicator ring */}
        <AnimatePresence>
          {(isListening || isSpeaking || isProcessing) && (
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: size + 20,
                height: size + 20,
                left: -10,
                top: -10,
                border: `2px solid ${glowColor}`,
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.6, 0.3, 0.6],
              }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{
                duration: isProcessing ? 1 : 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Processing spinner */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size + 40,
              height: size + 40,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2px dashed rgba(139, 92, 246, 0.4)',
            }}
            initial={{ rotate: 0, opacity: 0 }}
            animate={{ rotate: 360, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
              opacity: { duration: 0.3 },
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default GalionVoiceOrb;
