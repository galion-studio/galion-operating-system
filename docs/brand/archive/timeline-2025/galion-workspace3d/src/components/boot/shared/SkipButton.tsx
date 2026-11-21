// ═══════════════════════════════════════════════════════════════════
// SKIP BUTTON - Subtle affordance for skipping phases
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { COLORS, Z_INDEX } from '../types';

interface SkipButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function SkipButton({ onClick, disabled = false }: SkipButtonProps) {
  if (disabled) return null;
  
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 0.5, y: 0 }}
      whileHover={{ opacity: 1, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: Z_INDEX.SKIP_BUTTON,
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        padding: '12px 24px',
        color: COLORS.WHITE,
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      aria-label="Skip boot sequence"
    >
      Skip
    </motion.button>
  );
}
