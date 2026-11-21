"use client";

/**
 * Orb - The Living AI Presence for Galion V3
 *
 * Based on Galion.app-v3-guide.md Part 4:
 *
 * VISUAL STYLE (Part 3.2):
 * - Smooth, deep gradient: blues → teals → warm accents
 * - Soft outer glow (bloom effect)
 * - Subtle inner light and highlight at top-left (depth/3D)
 * - Slight shadow/halo underneath (spatial anchoring)
 * - Size: ~20-25% viewport width
 *
 * STATES (Part 4.1):
 * | State      | Pulse  | Glow          | Gradient Motion        | Scale      |
 * |------------|--------|---------------|------------------------|------------|
 * | Idle       | 1-2%   | Soft, constant| Almost imperceptible   | 100%       |
 * | Listening  | 2-3%   | More pronounced| Slight acceleration   | 101-102%   |
 * | Speaking   | Speech sync | Brighter, pulsing | Gradients brighten | 100-103% |
 * | Thinking   | 1-2%   | Warm glow     | Subtle internal swirl  | 100%       |
 * | Task Active| Deep, slow | Task-state shift | Gentle motion    | 98-102%    |
 *
 * EMOTION OVERLAYS (Part 4.2):
 * - Calm: cool blues, slow motion, dim glow
 * - Warm/Supportive: soft warm accents, steady pulse
 * - Focused: cool teals, sharper gradients, slight intensity increase
 * - Alert: brighter palette, faster pulse
 *
 * Emotion changes: 200-400ms with smooth easing
 * State transitions: 150-300ms, ease-out for scale, ease-in-out for color
 */

import { motion } from "framer-motion";

// Emotion types that affect color palette
export type EmotionType =
  | "happy"
  | "sad"
  | "angry"
  | "excited"
  | "neutral"
  | "calm"
  | "warm"
  | "focused"
  | "alert"
  | "fearful"
  | "curious"
  | "playful"
  | "confident"
  | "melancholic"
  | "surprised"
  | "thoughtful"
  | "empathetic"
  | "determined"
  | "confused"
  | "thinking";

// Orb behavioral states
export type OrbStateType =
  | "idle"
  | "listening"
  | "speaking"
  | "thinking"
  | "task";

export interface OrbCustomColors {
  primary: string;
  secondary: string;
  glow: string;
}

export interface OrbProps {
  emotion: EmotionType;
  intensity: number; // 0-1
  isListening: boolean;
  isSpeaking: boolean;
  isThinking?: boolean;
  onClick: () => void;
  customColors?: OrbCustomColors; // Custom theme colors override emotion palette
}

/**
 * Color palettes for each emotion - matches boot animation exactly
 * Primary gradient: Deep blue → teal → warm accent
 */
const emotionPalettes: Partial<
  Record<
    EmotionType,
    {
      primary: string;
      secondary: string;
      accent: string;
      warm: string;
      glow: string;
      glowSecondary: string;
    }
  >
> & {
  neutral: {
    primary: string;
    secondary: string;
    accent: string;
    warm: string;
    glow: string;
    glowSecondary: string;
  };
} = {
  // Default/neutral - matches boot animation
  neutral: {
    primary: "#1e3a8a", // Deep blue
    secondary: "#0891b2", // Teal
    accent: "#134e4a", // Dark teal
    warm: "#f472b6", // Subtle pink accent
    glow: "rgba(99, 102, 241, 0.25)",
    glowSecondary: "rgba(6, 182, 212, 0.15)",
  },
  // Calm - cool blues, dim glow
  calm: {
    primary: "#1e40af",
    secondary: "#0ea5e9",
    accent: "#0c4a6e",
    warm: "#a5b4fc",
    glow: "rgba(99, 102, 241, 0.2)",
    glowSecondary: "rgba(14, 165, 233, 0.1)",
  },
  // Warm/Supportive - soft warm accents
  warm: {
    primary: "#7c3aed",
    secondary: "#ec4899",
    accent: "#f472b6",
    warm: "#fbbf24",
    glow: "rgba(236, 72, 153, 0.25)",
    glowSecondary: "rgba(251, 191, 36, 0.15)",
  },
  // Focused - cool teals, sharper
  focused: {
    primary: "#0e7490",
    secondary: "#06b6d4",
    accent: "#14b8a6",
    warm: "#22d3ee",
    glow: "rgba(6, 182, 212, 0.3)",
    glowSecondary: "rgba(20, 184, 166, 0.2)",
  },
  // Alert - brighter palette
  alert: {
    primary: "#dc2626",
    secondary: "#f97316",
    accent: "#fbbf24",
    warm: "#fef08a",
    glow: "rgba(239, 68, 68, 0.35)",
    glowSecondary: "rgba(249, 115, 22, 0.2)",
  },
  // Legacy emotions
  happy: {
    primary: "#059669",
    secondary: "#10b981",
    accent: "#34d399",
    warm: "#a7f3d0",
    glow: "rgba(16, 185, 129, 0.25)",
    glowSecondary: "rgba(52, 211, 153, 0.15)",
  },
  sad: {
    primary: "#4338ca",
    secondary: "#6366f1",
    accent: "#818cf8",
    warm: "#c7d2fe",
    glow: "rgba(99, 102, 241, 0.25)",
    glowSecondary: "rgba(129, 140, 248, 0.15)",
  },
  angry: {
    primary: "#b91c1c",
    secondary: "#ef4444",
    accent: "#f87171",
    warm: "#fecaca",
    glow: "rgba(239, 68, 68, 0.35)",
    glowSecondary: "rgba(248, 113, 113, 0.2)",
  },
  excited: {
    primary: "#be185d",
    secondary: "#ec4899",
    accent: "#f472b6",
    warm: "#fbbf24",
    glow: "rgba(236, 72, 153, 0.3)",
    glowSecondary: "rgba(251, 191, 36, 0.2)",
  },
};

export const Orb: React.FC<OrbProps> = ({
  emotion,
  intensity = 0.5,
  isListening,
  isSpeaking,
  isThinking = false,
  onClick,
  customColors,
}) => {
  // Use custom colors if provided, otherwise use emotion palette
  const emotionColors = emotionPalettes[emotion] || emotionPalettes.neutral;
  const colors = customColors
    ? {
        ...emotionColors,
        primary: customColors.primary,
        secondary: customColors.secondary,
        glow: customColors.glow,
        glowSecondary: customColors.glow, // Use same glow for both
      }
    : emotionColors;

  // Determine current state
  const getState = (): OrbStateType => {
    if (isSpeaking) return "speaking";
    if (isListening) return "listening";
    if (isThinking) return "thinking";
    return "idle";
  };

  const state = getState();

  /**
   * Animation variants - tuned to v3 guide Part 4.1
   */
  const pulseVariants = {
    idle: {
      scale: [1, 1.015, 1],
    },
    listening: {
      scale: [1.01, 1.025, 1.01],
    },
    speaking: {
      scale: [1, 1.03, 1.01, 1.025, 1],
    },
    thinking: {
      scale: [1, 1.01, 1],
    },
  };

  const getPulseTransition = () => {
    switch (state) {
      case "idle":
        return { duration: 4, repeat: Infinity, ease: "easeInOut" as const };
      case "listening":
        return { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const };
      case "speaking":
        return { duration: 0.6, repeat: Infinity, ease: "easeInOut" as const };
      case "thinking":
        return { duration: 3, repeat: Infinity, ease: "easeInOut" as const };
      default:
        return { duration: 4, repeat: Infinity, ease: "easeInOut" as const };
    }
  };

  /**
   * Glow animation variants
   */
  const glowVariants = {
    idle: {
      opacity: [0.5, 0.6, 0.5],
      scale: [1, 1.02, 1],
    },
    listening: {
      opacity: [0.6, 0.9, 0.6],
      scale: [1, 1.08, 1],
    },
    speaking: {
      opacity: [0.7, 1, 0.8, 0.95, 0.7],
      scale: [1, 1.12, 1.05, 1.1, 1],
    },
    thinking: {
      opacity: [0.55, 0.7, 0.55],
      scale: [1, 1.03, 1],
    },
  };

  return (
    <div className="flex items-center justify-center min-h-[280px] md:min-h-[340px]">
      <motion.button
        className="relative focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/50 rounded-full"
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        aria-label={
          isListening
            ? "Stop recording"
            : isSpeaking
            ? "AI is speaking"
            : isThinking
            ? "AI is thinking"
            : "Start recording"
        }
      >
        {/* Shadow/halo underneath for spatial anchoring */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-36 h-6 rounded-[100%] pointer-events-none blur-[8px] bg-[radial-gradient(ellipse,rgba(0,0,0,0.25)_0%,transparent_70%)]" />

        {/* Outer glow / bloom effect */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none blur-[30px] scale-150"
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, ${colors.glowSecondary} 40%, transparent 70%)`,
          }}
          variants={glowVariants}
          animate={state}
          transition={{
            duration:
              state === "speaking" ? 0.6 : state === "listening" ? 1.2 : 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Main Orb Sphere */}
        <motion.div
          className="w-52 h-52 md:w-60 md:h-60 rounded-full relative overflow-hidden cursor-pointer"
          style={{
            // Match boot animation gradient exactly
            background: `
              radial-gradient(circle at 30% 25%, ${colors.primary} 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, ${colors.secondary} 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, ${colors.secondary} 0%, ${colors.accent} 60%, ${colors.accent} 100%)
            `,
            boxShadow: `
              0 0 ${40 + intensity * 30}px ${colors.glow},
              0 0 ${60 + intensity * 40}px ${colors.glowSecondary},
              inset 0 0 ${50 + intensity * 20}px rgba(255, 255, 255, ${
              0.06 + intensity * 0.04
            })
            `,
            // Smooth 300ms transitions per guide Part 4.3
            transition: "box-shadow 300ms ease-in-out",
          }}
          variants={pulseVariants}
          animate={state}
          transition={getPulseTransition()}
        >
          {/* Highlight at top-left (light direction) */}
          <motion.div
            className="absolute top-[10%] left-[15%] w-20 h-20 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 40%, transparent 70%)",
            }}
            animate={{
              opacity: state === "speaking" ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 0.6,
              repeat: state === "speaking" ? Infinity : 0,
              ease: "easeInOut",
            }}
          />

          {/* Secondary highlight for 3D depth */}
          <div className="absolute top-[8%] left-[12%] w-8 h-8 rounded-full opacity-35 pointer-events-none bg-[radial-gradient(circle,rgba(255,255,255,0.5)_0%,transparent_70%)]" />

          {/* Internal gradients - slow cloud-like motion */}
          <motion.div
            className="absolute inset-2 rounded-full pointer-events-none"
            style={{
              background: `conic-gradient(from 30deg at 45% 45%, ${colors.primary} 0%, ${colors.secondary} 25%, ${colors.accent} 50%, ${colors.secondary} 75%, ${colors.primary} 100%)`,
              filter: "blur(25px)",
              opacity: 0.15,
            }}
            animate={{
              rotate: state === "thinking" ? [30, 390] : [30, 35],
            }}
            transition={{
              duration: state === "thinking" ? 8 : 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Warm accent layer (subtle rose) */}
          <motion.div
            className="absolute inset-4 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle at 60% 60%, ${colors.warm} 0%, transparent 60%)`,
            }}
            animate={{
              opacity: state === "speaking" ? [0.08, 0.15, 0.08] : 0.08,
            }}
            transition={{
              duration: 0.6,
              repeat: state === "speaking" ? Infinity : 0,
              ease: "easeInOut",
            }}
          />

          {/* Subtle inner light pulse */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 50%)",
            }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: state === "speaking" ? 1.5 : 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Speaking pulse rings */}
        {isSpeaking && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: `1.5px solid ${colors.secondary}`,
                boxShadow: `0 0 15px ${colors.glow}`,
              }}
              animate={{
                scale: [1, 1.25],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: `1px solid ${colors.secondary}`,
                boxShadow: `0 0 10px ${colors.glowSecondary}`,
              }}
              animate={{
                scale: [1, 1.2],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.3,
              }}
            />
          </>
        )}

        {/* Listening indicator */}
        {isListening && !isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: `2px solid ${colors.secondary}`,
              boxShadow: `0 0 20px ${colors.glow}`,
            }}
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.7, 0.4, 0.7],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Thinking swirl indicator */}
        {isThinking && !isSpeaking && !isListening && (
          <motion.div
            className="absolute inset-2 rounded-full pointer-events-none opacity-20"
            style={{
              border: `1px dashed ${colors.secondary}`,
            }}
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
      </motion.button>
    </div>
  );
};

Orb.displayName = "Orb";
