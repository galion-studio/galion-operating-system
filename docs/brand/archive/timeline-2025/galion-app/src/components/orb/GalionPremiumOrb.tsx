'use client';

/**
 * Galion Premium Blue Orb - MD2026 Specification
 * ===============================================
 *
 * A premium 120px diameter blue glowing orb with:
 * - Radial gradient: Center #0099FF -> Mid #0077DD -> Edge #0055AA (40% opacity)
 * - Box-shadow glow: 40px + 80px layers
 * - Internal swirl: 8-12 light particles rotating 360 degrees over 8s
 * - Pulse animation: Scale 1.0 -> 1.05 -> 1.0 over 2.5s
 *
 * Animation Sequence (2.5s total):
 * - 0.0s: Dark background #0F0F1F
 * - 0.2s: Orb fades in (600ms, ease-out-quad)
 * - 0.5s: "Hello [Username]" fades in (400ms staggered)
 * - 0.7s: Subtext fades in (400ms staggered)
 * - 1.0s: Input bar slides up with bounce easing
 * - 1.5s+: Continuous orb pulse loop
 *
 * Optimized for 60fps performance with GPU acceleration.
 */

import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation, Variants } from 'framer-motion';

// =============================================================================
// Types
// =============================================================================

export interface GalionPremiumOrbProps {
  /** User's name for greeting */
  username?: string;
  /** Subtext message */
  subtext?: string;
  /** Orb diameter in pixels (default: 120) */
  size?: number;
  /** Whether to show the input bar */
  showInput?: boolean;
  /** Input placeholder text */
  inputPlaceholder?: string;
  /** Callback when input is submitted */
  onSubmit?: (value: string) => void;
  /** Callback when orb is clicked */
  onOrbClick?: () => void;
  /** Whether to auto-start the entrance animation */
  autoStart?: boolean;
  /** Additional class names */
  className?: string;
  /** Reduced motion preference override */
  reducedMotion?: boolean;
}

// =============================================================================
// Constants - MD2026 Spec
// =============================================================================

const MD2026_COLORS = {
  background: '#0F0F1F',
  orbCenter: '#0099FF',
  orbMid: '#0077DD',
  orbEdge: '#0055AA',
  glowPrimary: 'rgba(0, 153, 255, 0.6)',
  glowSecondary: 'rgba(0, 119, 221, 0.4)',
  particleColor: 'rgba(255, 255, 255, 0.8)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  inputBorder: 'rgba(0, 153, 255, 0.3)',
  inputBg: 'rgba(15, 15, 31, 0.8)',
};

const MD2026_TIMING = {
  orbFadeStart: 0.2,
  orbFadeDuration: 0.6,
  greetingStart: 0.5,
  greetingDuration: 0.4,
  subtextStart: 0.7,
  subtextDuration: 0.4,
  inputStart: 1.0,
  inputDuration: 0.5,
  pulseCycleStart: 1.5,
  pulseCycleDuration: 2.5,
  particleRotationDuration: 8,
};

const PARTICLE_COUNT = 10; // 8-12 range, using 10

// =============================================================================
// Easing Functions
// =============================================================================

const easeOutQuad = [0.25, 0.46, 0.45, 0.94];
const easeOutBack = [0.175, 0.885, 0.32, 1.275];
const easeInOutSine = [0.37, 0, 0.63, 1];

// =============================================================================
// Particle Component
// =============================================================================

interface ParticleProps {
  index: number;
  orbSize: number;
  isAnimating: boolean;
}

const Particle: React.FC<ParticleProps> = React.memo(({ index, orbSize, isAnimating }) => {
  const angle = (index / PARTICLE_COUNT) * 360;
  const radius = orbSize * 0.35; // Particles orbit at 35% from center
  const particleSize = 3 + Math.random() * 2; // 3-5px particles
  const delay = (index / PARTICLE_COUNT) * MD2026_TIMING.particleRotationDuration;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: particleSize,
        height: particleSize,
        backgroundColor: MD2026_COLORS.particleColor,
        boxShadow: `0 0 6px ${MD2026_COLORS.particleColor}, 0 0 12px ${MD2026_COLORS.glowPrimary}`,
        left: '50%',
        top: '50%',
        marginLeft: -particleSize / 2,
        marginTop: -particleSize / 2,
        willChange: 'transform',
      }}
      initial={{
        x: Math.cos((angle * Math.PI) / 180) * radius,
        y: Math.sin((angle * Math.PI) / 180) * radius,
        opacity: 0,
        scale: 0,
      }}
      animate={isAnimating ? {
        x: [
          Math.cos((angle * Math.PI) / 180) * radius,
          Math.cos(((angle + 180) * Math.PI) / 180) * radius,
          Math.cos(((angle + 360) * Math.PI) / 180) * radius,
        ],
        y: [
          Math.sin((angle * Math.PI) / 180) * radius,
          Math.sin(((angle + 180) * Math.PI) / 180) * radius,
          Math.sin(((angle + 360) * Math.PI) / 180) * radius,
        ],
        opacity: [0.6, 1, 0.6],
        scale: [0.8, 1.2, 0.8],
      } : { opacity: 0, scale: 0 }}
      transition={{
        duration: MD2026_TIMING.particleRotationDuration,
        repeat: Infinity,
        ease: 'linear',
        delay: isAnimating ? delay : 0,
      }}
    />
  );
});

Particle.displayName = 'Particle';

// =============================================================================
// Orb Core Component
// =============================================================================

interface OrbCoreProps {
  size: number;
  isAnimating: boolean;
  isPulsing: boolean;
  onClick?: () => void;
}

const OrbCore: React.FC<OrbCoreProps> = React.memo(({ size, isAnimating, isPulsing, onClick }) => {
  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => i),
    []
  );

  return (
    <motion.div
      className="relative cursor-pointer"
      style={{
        width: size,
        height: size,
        willChange: 'transform, opacity',
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isAnimating ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{
        duration: MD2026_TIMING.orbFadeDuration,
        delay: MD2026_TIMING.orbFadeStart,
        ease: easeOutQuad,
      }}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Outer glow layer - 80px */}
      <div
        className="absolute rounded-full"
        style={{
          inset: -40,
          background: `radial-gradient(circle, ${MD2026_COLORS.glowSecondary} 0%, transparent 70%)`,
          filter: 'blur(20px)',
          willChange: 'transform',
        }}
      />

      {/* Inner glow layer - 40px */}
      <div
        className="absolute rounded-full"
        style={{
          inset: -20,
          background: `radial-gradient(circle, ${MD2026_COLORS.glowPrimary} 0%, transparent 60%)`,
          filter: 'blur(10px)',
          willChange: 'transform',
        }}
      />

      {/* Main orb with MD2026 gradient */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 35%,
            ${MD2026_COLORS.orbCenter} 0%,
            ${MD2026_COLORS.orbMid} 40%,
            ${MD2026_COLORS.orbEdge}66 100%
          )`,
          boxShadow: `
            0 0 40px ${MD2026_COLORS.glowPrimary},
            0 0 80px ${MD2026_COLORS.glowSecondary},
            inset 0 0 30px rgba(255, 255, 255, 0.1)
          `,
          willChange: 'transform',
        }}
        animate={isPulsing ? {
          scale: [1, 1.05, 1],
        } : { scale: 1 }}
        transition={{
          duration: MD2026_TIMING.pulseCycleDuration,
          repeat: Infinity,
          ease: easeInOutSine,
        }}
      >
        {/* Specular highlight */}
        <div
          className="absolute rounded-full"
          style={{
            top: '10%',
            left: '15%',
            width: '40%',
            height: '30%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)',
            filter: 'blur(3px)',
            borderRadius: '50%',
          }}
        />

        {/* Inner swirl particles */}
        {particles.map((i) => (
          <Particle
            key={i}
            index={i}
            orbSize={size}
            isAnimating={isPulsing}
          />
        ))}
      </motion.div>
    </motion.div>
  );
});

OrbCore.displayName = 'OrbCore';

// =============================================================================
// Greeting Text Component
// =============================================================================

interface GreetingTextProps {
  username: string;
  isVisible: boolean;
}

const GreetingText: React.FC<GreetingTextProps> = React.memo(({ username, isVisible }) => {
  const greeting = `Hello ${username}`;
  const chars = greeting.split('');

  return (
    <motion.div
      className="text-center mt-8"
      initial={{ opacity: 0 }}
      animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.3, delay: MD2026_TIMING.greetingStart }}
    >
      <h1 className="text-3xl font-light tracking-wide">
        {chars.map((char, index) => (
          <motion.span
            key={`${char}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
              duration: MD2026_TIMING.greetingDuration,
              delay: MD2026_TIMING.greetingStart + (index * 0.03),
              ease: easeOutQuad,
            }}
            style={{
              color: MD2026_COLORS.textPrimary,
              display: 'inline-block',
              minWidth: char === ' ' ? '0.5em' : 'auto',
            }}
          >
            {char}
          </motion.span>
        ))}
      </h1>
    </motion.div>
  );
});

GreetingText.displayName = 'GreetingText';

// =============================================================================
// Subtext Component
// =============================================================================

interface SubtextProps {
  text: string;
  isVisible: boolean;
}

const Subtext: React.FC<SubtextProps> = React.memo(({ text, isVisible }) => {
  const words = text.split(' ');

  return (
    <motion.p
      className="text-center mt-3 text-lg"
      initial={{ opacity: 0 }}
      animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{
            duration: MD2026_TIMING.subtextDuration,
            delay: MD2026_TIMING.subtextStart + (index * 0.05),
            ease: easeOutQuad,
          }}
          style={{
            color: MD2026_COLORS.textSecondary,
            display: 'inline-block',
            marginRight: '0.3em',
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  );
});

Subtext.displayName = 'Subtext';

// =============================================================================
// Input Bar Component
// =============================================================================

interface InputBarProps {
  isVisible: boolean;
  placeholder: string;
  onSubmit: (value: string) => void;
}

const InputBar: React.FC<InputBarProps> = React.memo(({ isVisible, placeholder, onSubmit }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  }, [value, onSubmit]);

  return (
    <motion.form
      className="w-full max-w-md mt-10"
      initial={{ opacity: 0, y: 40 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{
        duration: MD2026_TIMING.inputDuration,
        delay: MD2026_TIMING.inputStart,
        ease: easeOutBack,
      }}
      onSubmit={handleSubmit}
    >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: MD2026_COLORS.inputBg,
          border: `1px solid ${MD2026_COLORS.inputBorder}`,
          boxShadow: `0 4px 20px rgba(0, 153, 255, 0.1)`,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-6 py-4 bg-transparent text-white placeholder-white/40 outline-none text-base"
          style={{ caretColor: MD2026_COLORS.orbCenter }}
        />
        <motion.button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${MD2026_COLORS.orbCenter}, ${MD2026_COLORS.orbMid})`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!value.trim()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </motion.button>
      </div>
    </motion.form>
  );
});

InputBar.displayName = 'InputBar';

// =============================================================================
// Main Component
// =============================================================================

export const GalionPremiumOrb: React.FC<GalionPremiumOrbProps> = ({
  username = 'User',
  subtext = 'How can I assist you today?',
  size = 120,
  showInput = true,
  inputPlaceholder = 'Ask me anything...',
  onSubmit,
  onOrbClick,
  autoStart = true,
  className = '',
  reducedMotion = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [showSubtext, setShowSubtext] = useState(false);
  const [showInputBar, setShowInputBar] = useState(false);

  // Reduced motion check
  const prefersReducedMotion = useMemo(() => {
    if (reducedMotion) return true;
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }, [reducedMotion]);

  // Start animation sequence
  useEffect(() => {
    if (!autoStart) return;

    // Start orb animation
    const orbTimer = setTimeout(() => setIsAnimating(true), 0);

    // Show greeting
    const greetingTimer = setTimeout(
      () => setShowGreeting(true),
      MD2026_TIMING.greetingStart * 1000
    );

    // Show subtext
    const subtextTimer = setTimeout(
      () => setShowSubtext(true),
      MD2026_TIMING.subtextStart * 1000
    );

    // Show input
    const inputTimer = setTimeout(
      () => setShowInputBar(true),
      MD2026_TIMING.inputStart * 1000
    );

    // Start pulsing
    const pulseTimer = setTimeout(
      () => setIsPulsing(true),
      MD2026_TIMING.pulseCycleStart * 1000
    );

    return () => {
      clearTimeout(orbTimer);
      clearTimeout(greetingTimer);
      clearTimeout(subtextTimer);
      clearTimeout(inputTimer);
      clearTimeout(pulseTimer);
    };
  }, [autoStart]);

  const handleSubmit = useCallback((value: string) => {
    onSubmit?.(value);
  }, [onSubmit]);

  // Simplified version for reduced motion
  if (prefersReducedMotion) {
    return (
      <div
        className={`flex flex-col items-center justify-center min-h-screen p-8 ${className}`}
        style={{ backgroundColor: MD2026_COLORS.background }}
      >
        <div
          className="rounded-full"
          style={{
            width: size,
            height: size,
            background: `radial-gradient(circle, ${MD2026_COLORS.orbCenter}, ${MD2026_COLORS.orbEdge})`,
            boxShadow: `0 0 40px ${MD2026_COLORS.glowPrimary}`,
            cursor: onOrbClick ? 'pointer' : 'default',
          }}
          onClick={onOrbClick}
        />
        <h1
          className="text-3xl font-light mt-8"
          style={{ color: MD2026_COLORS.textPrimary }}
        >
          Hello {username}
        </h1>
        <p
          className="text-lg mt-3"
          style={{ color: MD2026_COLORS.textSecondary }}
        >
          {subtext}
        </p>
        {showInput && (
          <form
            className="w-full max-w-md mt-10"
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.querySelector('input');
              if (input?.value.trim()) {
                handleSubmit(input.value.trim());
                input.value = '';
              }
            }}
          >
            <input
              type="text"
              placeholder={inputPlaceholder}
              className="w-full px-6 py-4 rounded-2xl bg-white/5 text-white placeholder-white/40 outline-none border border-white/10"
            />
          </form>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-8 ${className}`}
      style={{
        backgroundColor: MD2026_COLORS.background,
        willChange: 'contents',
      }}
    >
      {/* Premium Orb */}
      <OrbCore
        size={size}
        isAnimating={isAnimating}
        isPulsing={isPulsing}
        onClick={onOrbClick}
      />

      {/* Greeting */}
      <GreetingText
        username={username}
        isVisible={showGreeting}
      />

      {/* Subtext */}
      <Subtext
        text={subtext}
        isVisible={showSubtext}
      />

      {/* Input Bar */}
      {showInput && (
        <InputBar
          isVisible={showInputBar}
          placeholder={inputPlaceholder}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default GalionPremiumOrb;

// =============================================================================
// Hook for programmatic control
// =============================================================================

export const useGalionPremiumOrb = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(() => setIsPlaying(true), []);
  const reset = useCallback(() => setIsPlaying(false), []);

  return { isPlaying, play, reset };
};
