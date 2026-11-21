/**
 * Galion V3 Animation Utilities
 * 
 * Reusable Framer Motion variants and animation presets
 * following the "22nd-century Apple" design philosophy.
 * 
 * Key principles:
 * - Smooth, elegant transitions (never abrupt)
 * - Spring-based animations for natural feel
 * - Consistent timing across all components
 * - GPU-accelerated (transform + opacity only)
 */

import { Variants, Transition } from 'framer-motion';

// ============================================================================
// SPRING CONFIGURATIONS
// ============================================================================

export const springConfigs = {
  // Gentle spring - for subtle, relaxed movements
  gentle: {
    type: 'spring' as const,
    damping: 30,
    stiffness: 200,
    mass: 1,
  },
  
  // Default spring - balanced for most use cases
  default: {
    type: 'spring' as const,
    damping: 25,
    stiffness: 300,
    mass: 1,
  },
  
  // Bouncy spring - for playful, attention-grabbing movements
  bouncy: {
    type: 'spring' as const,
    damping: 15,
    stiffness: 400,
    mass: 0.8,
  },
  
  // Stiff spring - for quick, snappy interactions
  stiff: {
    type: 'spring' as const,
    damping: 30,
    stiffness: 500,
    mass: 0.5,
  },
  
  // Panel spring - optimized for sliding panels
  panel: {
    type: 'spring' as const,
    damping: 30,
    stiffness: 300,
    mass: 0.8,
  },
} as const;

// ============================================================================
// TWEEN CONFIGURATIONS
// ============================================================================

export const tweenConfigs = {
  // Fast tween - for micro-interactions
  fast: {
    type: 'tween' as const,
    duration: 0.15,
    ease: 'easeOut',
  },
  
  // Normal tween - for standard transitions
  normal: {
    type: 'tween' as const,
    duration: 0.25,
    ease: [0.4, 0, 0.2, 1], // ease-in-out
  },
  
  // Slow tween - for dramatic reveals
  slow: {
    type: 'tween' as const,
    duration: 0.4,
    ease: [0.4, 0, 0.2, 1],
  },
  
  // Fade tween - optimized for opacity changes
  fade: {
    type: 'tween' as const,
    duration: 0.2,
    ease: 'easeInOut',
  },
} as const;

// ============================================================================
// PANEL VARIANTS - For sliding panels/drawers
// ============================================================================

export const panelVariants: Variants = {
  hidden: {
    y: '100%',
    opacity: 0.5,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: springConfigs.panel,
  },
  exit: {
    y: '100%',
    opacity: 0.5,
    transition: {
      ...springConfigs.panel,
      stiffness: 400,
    },
  },
};

// Side panel variants (for left/right sliding)
export const sidePanelVariants = {
  left: {
    hidden: { x: '-100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: springConfigs.panel },
    exit: { x: '-100%', opacity: 0, transition: springConfigs.stiff },
  },
  right: {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1, transition: springConfigs.panel },
    exit: { x: '100%', opacity: 0, transition: springConfigs.stiff },
  },
};

// ============================================================================
// BACKDROP VARIANTS - For overlay backgrounds
// ============================================================================

export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: tweenConfigs.fade,
  },
  exit: {
    opacity: 0,
    transition: tweenConfigs.fade,
  },
};

// ============================================================================
// FADE VARIANTS - Simple opacity transitions
// ============================================================================

export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: tweenConfigs.normal,
  },
  exit: {
    opacity: 0,
    transition: tweenConfigs.fast,
  },
};

// Fade with scale - for more dramatic appearances
export const fadeScaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springConfigs.default,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: tweenConfigs.fast,
  },
};

// ============================================================================
// SLIDE VARIANTS - For sliding elements
// ============================================================================

export const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springConfigs.default,
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: tweenConfigs.fast,
  },
};

export const slideDownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springConfigs.default,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: tweenConfigs.fast,
  },
};

// ============================================================================
// STAGGER CONTAINER VARIANTS - For staggered children
// ============================================================================

export const staggerContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

// Slower stagger for dramatic reveals
export const staggerContainerSlowVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

// ============================================================================
// STAGGER ITEM VARIANTS - Children of stagger containers
// ============================================================================

export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springConfigs.default,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: tweenConfigs.fast,
  },
};

// Scale variant for stagger items
export const staggerItemScaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springConfigs.default,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: tweenConfigs.fast,
  },
};

// ============================================================================
// ORB DIMMING VARIANTS - For when panels open
// ============================================================================

export const orbDimVariants: Variants = {
  normal: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: tweenConfigs.slow,
  },
  dimmed: {
    opacity: 0.4,
    scale: 0.95,
    filter: 'blur(2px)',
    transition: tweenConfigs.slow,
  },
};

// ============================================================================
// CARD VARIANTS - For interactive cards
// ============================================================================

export const cardVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
    transition: springConfigs.stiff,
  },
  tap: {
    scale: 0.98,
    transition: springConfigs.stiff,
  },
};

// Card with glow effect
export const cardGlowVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 20px rgba(103, 232, 249, 0.2)',
    transition: springConfigs.stiff,
  },
  tap: {
    scale: 0.98,
    transition: springConfigs.stiff,
  },
  selected: {
    scale: 1,
    boxShadow: '0 0 0 2px rgba(103, 232, 249, 0.5), 0 0 30px rgba(103, 232, 249, 0.3)',
    transition: springConfigs.default,
  },
};

// ============================================================================
// BUTTON VARIANTS - For interactive buttons
// ============================================================================

export const buttonVariants: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: springConfigs.stiff,
  },
  tap: {
    scale: 0.98,
    transition: springConfigs.stiff,
  },
  disabled: {
    opacity: 0.5,
    scale: 1,
  },
};

// Button with glow
export const buttonGlowVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: 'none',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 0 15px rgba(103, 232, 249, 0.3)',
    transition: springConfigs.stiff,
  },
  tap: {
    scale: 0.98,
    boxShadow: '0 0 5px rgba(103, 232, 249, 0.2)',
    transition: springConfigs.stiff,
  },
};

// ============================================================================
// TOOLTIP VARIANTS
// ============================================================================

export const tooltipVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springConfigs.stiff,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 5,
    transition: tweenConfigs.fast,
  },
};

// ============================================================================
// MODAL VARIANTS
// ============================================================================

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springConfigs.default,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: tweenConfigs.normal,
  },
};

// ============================================================================
// LIST ITEM VARIANTS - For lists with animations
// ============================================================================

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: springConfigs.default,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: tweenConfigs.fast,
  },
};

// ============================================================================
// EXPAND/COLLAPSE VARIANTS
// ============================================================================

export const expandCollapseVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: tweenConfigs.normal,
      opacity: tweenConfigs.fast,
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: tweenConfigs.normal,
      opacity: { ...tweenConfigs.normal, delay: 0.1 },
    },
  },
};

// ============================================================================
// ICON VARIANTS - For animated icons
// ============================================================================

export const iconRotateVariants: Variants = {
  initial: {
    rotate: 0,
  },
  rotated: {
    rotate: 180,
    transition: springConfigs.stiff,
  },
};

export const iconPulseVariants: Variants = {
  initial: {
    scale: 1,
  },
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.3,
      times: [0, 0.5, 1],
    },
  },
};

// ============================================================================
// LOADING VARIANTS
// ============================================================================

export const loadingPulseVariants: Variants = {
  initial: {
    opacity: 0.5,
  },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const loadingSpinVariants: Variants = {
  initial: {
    rotate: 0,
  },
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ============================================================================
// SHAKE VARIANTS - For error states
// ============================================================================

export const shakeVariants: Variants = {
  initial: {
    x: 0,
  },
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

// ============================================================================
// SUCCESS/ERROR VARIANTS
// ============================================================================

export const successVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: springConfigs.bouncy,
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: tweenConfigs.fast,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a stagger transition with custom delay
 */
export function createStaggerTransition(
  staggerDelay: number = 0.05,
  childDelay: number = 0.1
): Transition {
  return {
    staggerChildren: staggerDelay,
    delayChildren: childDelay,
  };
}

/**
 * Create a custom spring transition
 */
export function createSpringTransition(
  damping: number = 25,
  stiffness: number = 300,
  mass: number = 1
): Transition {
  return {
    type: 'spring',
    damping,
    stiffness,
    mass,
  };
}

/**
 * Create a custom tween transition
 */
export function createTweenTransition(
  duration: number = 0.25,
  ease: string | number[] = 'easeInOut'
): Transition {
  return {
    type: 'tween',
    duration,
    ease: ease as any, // Framer Motion accepts string | number[] for ease
  };
}

/**
 * Get transition with delay
 */
export function withDelay(transition: Transition, delay: number): Transition {
  return {
    ...transition,
    delay,
  };
}

// Export default preset
export default {
  springConfigs,
  tweenConfigs,
  panelVariants,
  sidePanelVariants,
  backdropVariants,
  fadeVariants,
  fadeScaleVariants,
  slideUpVariants,
  slideDownVariants,
  staggerContainerVariants,
  staggerContainerSlowVariants,
  staggerItemVariants,
  staggerItemScaleVariants,
  orbDimVariants,
  cardVariants,
  cardGlowVariants,
  buttonVariants,
  buttonGlowVariants,
  tooltipVariants,
  modalVariants,
  listItemVariants,
  expandCollapseVariants,
  iconRotateVariants,
  iconPulseVariants,
  loadingPulseVariants,
  loadingSpinVariants,
  shakeVariants,
  successVariants,
  createStaggerTransition,
  createSpringTransition,
  createTweenTransition,
  withDelay,
};
