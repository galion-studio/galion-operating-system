// ═══════════════════════════════════════════════════════════════════
// ANIMATED TEXT - Text reveal with elegant animations
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { COLORS, EASING, Z_INDEX } from '../types';

interface AnimatedTextProps {
  children: React.ReactNode;
  subtitle?: string;
  delay?: number;
  duration?: number;
  center?: boolean;
}

export function AnimatedText({
  children,
  subtitle,
  delay = 0,
  duration = 0.8,
  center = true,
}: AnimatedTextProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: Z_INDEX.TEXT,
        textAlign: center ? 'center' : 'left',
        width: '90%',
        maxWidth: '800px',
      }}
    >
      {/* Main text */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{
          duration,
          delay,
          ease: EASING.SMOOTH,
        }}
        style={{
          fontSize: '48px',
          fontWeight: 300,
          color: COLORS.WHITE,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
        }}
      >
        {children}
      </motion.div>
      
      {/* Optional subtitle */}
      {subtitle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.7, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: duration * 0.8,
            delay: delay + 0.3,
            ease: EASING.SMOOTH,
          }}
          style={{
            fontSize: '18px',
            fontWeight: 400,
            color: COLORS.WHITE,
            marginTop: '16px',
            letterSpacing: '-0.01em',
            lineHeight: 1.4,
            fontFamily: '-apple-system, system-ui, sans-serif',
          }}
        >
          {subtitle}
        </motion.div>
      )}
    </div>
  );
}
