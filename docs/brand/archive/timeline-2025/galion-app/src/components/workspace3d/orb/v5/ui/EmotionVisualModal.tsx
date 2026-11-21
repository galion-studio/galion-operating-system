/**
 * GALION Orb V5.2 - Emotion Visual UI Modal
 *
 * A comprehensive modal for visualizing and selecting emotions for the orb.
 * Displays all 50 emotions across 4 tiers with visual color representations.
 */

"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Heart,
  Infinity as InfinityIcon,
  Search,
  Sparkles,
  Waves,
  X,
  Zap,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { getEmotionConfig } from "../config/emotions";
import {
  ComplexEmotion,
  Emotion,
  EmotionConfig,
  EmotionTier,
  PrimaryEmotion,
  SecondaryEmotion,
  TranscendentEmotion,
} from "../types/emotion.types";

// ============================================================================
// TYPES
// ============================================================================

interface EmotionVisualModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmotion: Emotion;
  onEmotionSelect: (emotion: Emotion, intensity?: number) => void;
  intensity?: number;
  className?: string;
}

interface EmotionCardProps {
  emotion: EmotionConfig;
  isSelected: boolean;
  onClick: () => void;
  intensity: number;
}

// ============================================================================
// EMOTION GROUPINGS
// ============================================================================

const PRIMARY_EMOTIONS: PrimaryEmotion[] = [
  "neutral",
  "happy",
  "sad",
  "angry",
  "fearful",
  "surprised",
  "disgusted",
  "contempt",
  "trust",
  "anticipation",
];

const SECONDARY_EMOTIONS: SecondaryEmotion[] = [
  "love",
  "submission",
  "awe",
  "disapproval",
  "remorse",
  "contempt_hot",
  "aggressiveness",
  "optimism",
  "anxiety",
  "envy",
  "guilt",
  "pride",
  "hope",
  "despair",
  "shame",
];

const COMPLEX_EMOTIONS: ComplexEmotion[] = [
  "nostalgia",
  "melancholy",
  "determination",
  "admiration",
  "embarrassment",
  "frustration",
  "loneliness",
  "contentment",
  "inspiration",
  "vulnerability",
  "empowerment",
  "ambivalence",
  "curiosity",
];

const TRANSCENDENT_EMOTIONS: TranscendentEmotion[] = [
  "enlightenment",
  "unity",
  "bliss",
  "cosmic_wonder",
  "infinite_peace",
  "divine_love",
  "transcendence",
  "pure_awareness",
  "sacred_awe",
  "eternal_now",
  "universal_compassion",
  "sublime_joy",
];

// ============================================================================
// TIER ICONS & COLORS
// ============================================================================

const TIER_CONFIG: Record<
  EmotionTier,
  {
    icon: React.ReactNode;
    label: string;
    color: string;
    bgGradient: string;
  }
> = {
  primary: {
    icon: <Heart className="w-4 h-4" />,
    label: "Primary Emotions",
    color: "text-rose-400",
    bgGradient: "from-rose-500/20 to-rose-600/10",
  },
  secondary: {
    icon: <Brain className="w-4 h-4" />,
    label: "Secondary Emotions",
    color: "text-violet-400",
    bgGradient: "from-violet-500/20 to-violet-600/10",
  },
  complex: {
    icon: <Sparkles className="w-4 h-4" />,
    label: "Complex Emotions",
    color: "text-amber-400",
    bgGradient: "from-amber-500/20 to-amber-600/10",
  },
  transcendent: {
    icon: <InfinityIcon className="w-4 h-4" />,
    label: "Transcendent Emotions",
    color: "text-cyan-400",
    bgGradient: "from-cyan-500/20 to-cyan-600/10",
  },
};

// ============================================================================
// EMOTION CARD COMPONENT
// ============================================================================

function EmotionCard({
  emotion,
  isSelected,
  onClick,
  intensity,
}: EmotionCardProps) {
  const { colors, name, energy, description } = emotion;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative group flex flex-col items-center p-4 rounded-2xl transition-all duration-300",
        "border backdrop-blur-md",
        "hover:shadow-xl hover:bg-white/5",
        isSelected
          ? "border-white/40 ring-1 ring-white/50 bg-white/10 shadow-lg shadow-white/5"
          : "border-white/5 bg-black/20 hover:border-white/20"
      )}
    >
      {/* Color Orb Preview */}
      <div className="relative w-14 h-14 mb-3">
        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-full blur-md opacity-60"
          style={{ backgroundColor: colors.glow }}
          animate={{
            scale: isSelected ? [1, 1.2, 1] : 1,
            opacity: isSelected ? [0.6, 0.8, 0.6] : 0.6,
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Main Orb */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${colors.accent}, ${colors.primary}, ${colors.secondary})`,
            boxShadow: `0 0 20px ${colors.glow}40`,
          }}
        />

        {/* Shine */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-50" />

        {/* Energy Indicator */}
        <motion.div
          className="absolute bottom-0 right-0 w-5 h-5 translate-x-1 translate-y-1 rounded-full flex items-center justify-center text-[9px] font-bold border border-black/10 shadow-sm z-10"
          style={{
            backgroundColor: colors.primary,
            color: energy > 0.5 ? "#fff" : "#000",
          }}
        >
          {Math.round(energy * 100)}
        </motion.div>
      </div>

      {/* Emotion Name */}
      <span className="text-sm font-medium text-white/90 text-center tracking-tight leading-tight">
        {name}
      </span>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-lg z-20"
        >
          <Zap className="w-3 h-3 text-black fill-current" />
        </motion.div>
      )}

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-black/90 rounded-lg px-3 py-2 text-xs text-white/80 whitespace-nowrap backdrop-blur-sm border border-white/10 shadow-xl">
          {description || `Energy: ${Math.round(energy * 100)}%`}
        </div>
      </div>
    </motion.button>
  );
}

// ============================================================================
// INTENSITY SLIDER
// ============================================================================

function IntensitySlider({
  value,
  onChange,
  color,
}: {
  value: number;
  onChange: (value: number) => void;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
      <span className="text-sm text-white/70">Intensity</span>
      <div className="flex-1 relative">
        <input
          type="range"
          min="0"
          max="100"
          value={value * 100}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} ${value * 100
              }%, rgba(255,255,255,0.1) ${value * 100}%)`,
          }}
        />
      </div>
      <span className="text-sm font-mono text-white/90 w-12 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

// ============================================================================
// EMOTION PREVIEW
// ============================================================================

function EmotionPreview({
  emotion,
  intensity,
}: {
  emotion: EmotionConfig;
  intensity: number;
}) {
  const { colors, name, energy, nebula, particles } = emotion;

  return (
    <div className="relative p-6 rounded-2xl overflow-hidden">
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.primary}40, ${colors.secondary}20, transparent)`,
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Particle Effect Simulation */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{ backgroundColor: particles.color }}
            initial={{
              x: Math.random() * 300,
              y: Math.random() * 200,
              opacity: 0,
            }}
            animate={{
              x: [null, Math.random() * 300],
              y: [null, Math.random() * 200],
              opacity: [0, particles.opacity, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main Preview Orb */}
      <div className="relative z-10 flex items-center gap-6">
        <div className="relative w-24 h-24">
          {/* Outer Glow */}
          <motion.div
            className="absolute inset-0 rounded-full blur-xl"
            style={{ backgroundColor: colors.glow }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Main Orb */}
          <motion.div
            className="absolute inset-2 rounded-full"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${colors.accent}, ${colors.primary} 50%, ${colors.secondary})`,
              boxShadow: `
                0 0 30px ${colors.glow}60,
                inset 0 0 30px ${colors.accent}40
              `,
            }}
            animate={{
              rotate: [0, 360],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner Core */}
          <div
            className="absolute inset-6 rounded-full"
            style={{
              background: `radial-gradient(circle, white 0%, ${colors.accent} 50%, transparent 70%)`,
              opacity: intensity,
            }}
          />

          {/* Shine */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/40 to-transparent opacity-60" />
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
          <p className="text-sm text-white/60 mb-3">{emotion.description}</p>

          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-white/70">
              <Zap className="w-3 h-3" style={{ color: colors.accent }} />
              <span>Energy: {Math.round(energy * 100)}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70">
              <Waves className="w-3 h-3" style={{ color: colors.accent }} />
              <span>Turbulence: {Math.round(nebula.turbulence * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Color Palette */}
      <div className="relative z-10 flex gap-2 mt-4">
        {Object.entries(colors).map(([key, color]) => (
          <div key={key} className="flex flex-col items-center">
            <div
              className="w-8 h-8 rounded-lg border border-white/20"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] text-white/50 mt-1 capitalize">
              {key}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN MODAL COMPONENT
// ============================================================================

export function EmotionVisualModal({
  isOpen,
  onClose,
  currentEmotion,
  onEmotionSelect,
  intensity: initialIntensity = 1.0,
  className,
}: EmotionVisualModalProps) {
  const [selectedEmotion, setSelectedEmotion] =
    useState<Emotion>(currentEmotion);
  const [intensity, setIntensity] = useState(initialIntensity);
  const [activeTier, setActiveTier] = useState<EmotionTier | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const selectedConfig = useMemo(() => {
    return getEmotionConfig(selectedEmotion);
  }, [selectedEmotion]);

  const filteredEmotions = useMemo((): [string, Emotion[]][] => {
    const allEmotions: Record<string, Emotion[]> = {
      primary: PRIMARY_EMOTIONS,
      secondary: SECONDARY_EMOTIONS,
      complex: COMPLEX_EMOTIONS,
      transcendent: TRANSCENDENT_EMOTIONS,
    };

    let result: [string, Emotion[]][] =
      activeTier === "all"
        ? (Object.entries(allEmotions) as [string, Emotion[]][])
        : [[activeTier, allEmotions[activeTier as EmotionTier]]];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result
        .map(([tier, list]): [string, Emotion[]] => [
          tier,
          list.filter((e) => {
            const config = getEmotionConfig(e);
            return (
              config.name.toLowerCase().includes(query) ||
              config.description?.toLowerCase().includes(query)
            );
          }),
        ])
        .filter(([, list]) => list.length > 0);
    }

    return result;
  }, [activeTier, searchQuery]);

  const handleEmotionClick = useCallback((emotion: Emotion) => {
    setSelectedEmotion(emotion);
  }, []);

  const handleApply = useCallback(() => {
    onEmotionSelect(selectedEmotion, intensity);
    onClose();
  }, [selectedEmotion, intensity, onEmotionSelect, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed inset-4 md:inset-10 lg:inset-20 z-50",
              "bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95",
              "rounded-3xl border border-white/10 shadow-2xl",
              "flex flex-col overflow-hidden backdrop-blur-xl",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${selectedConfig.colors.primary}, ${selectedConfig.colors.secondary})`,
                  }}
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Emotion Visualizer
                  </h2>
                  <p className="text-sm text-white/50">
                    50 emotions for Orb V5.2
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Emotion Grid */}
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                {/* Search & Filters */}
                <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search emotions..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                {/* Tier Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  <button
                    onClick={() => setActiveTier("all")}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                      activeTier === "all"
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    All (50)
                  </button>
                  {Object.entries(TIER_CONFIG).map(([tier, config]) => (
                    <button
                      key={tier}
                      onClick={() => setActiveTier(tier as EmotionTier)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                        activeTier === tier
                          ? `bg-gradient-to-r ${config.bgGradient} text-white`
                          : "bg-white/5 text-white/60 hover:bg-white/10"
                      )}
                    >
                      {config.icon}
                      <span>{config.label.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>

                {/* Emotion Grid */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                  {filteredEmotions.map(([tier, emotions]) => (
                    <div key={tier}>
                      <div
                        className={cn(
                          "flex items-center gap-2 mb-3",
                          TIER_CONFIG[tier as EmotionTier]?.color ||
                          "text-white"
                        )}
                      >
                        {TIER_CONFIG[tier as EmotionTier]?.icon}
                        <span className="text-sm font-semibold">
                          {TIER_CONFIG[tier as EmotionTier]?.label}
                        </span>
                        <span className="text-xs text-white/40">
                          ({emotions.length})
                        </span>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                        {emotions.map((emotion) => {
                          const config = getEmotionConfig(emotion);
                          return (
                            <EmotionCard
                              key={emotion}
                              emotion={config}
                              isSelected={selectedEmotion === emotion}
                              onClick={() => handleEmotionClick(emotion)}
                              intensity={intensity}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel - Preview */}
              <div className="w-80 lg:w-96 border-l border-white/10 p-6 flex flex-col">
                <h3 className="text-sm font-semibold text-white/70 mb-4">
                  Preview
                </h3>

                {/* Emotion Preview */}
                <EmotionPreview
                  emotion={selectedConfig}
                  intensity={intensity}
                />

                {/* Intensity Slider */}
                <div className="mt-6">
                  <IntensitySlider
                    value={intensity}
                    onChange={setIntensity}
                    color={selectedConfig.colors.primary}
                  />
                </div>

                {/* Particle Settings Preview */}
                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-xs font-semibold text-white/50 mb-3">
                    PARTICLE CONFIG
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/50">Pattern:</span>
                      <span className="text-white/90 capitalize">
                        {selectedConfig.particles.pattern}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Count:</span>
                      <span className="text-white/90">
                        {selectedConfig.particles.count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Speed:</span>
                      <span className="text-white/90">
                        {Math.round(selectedConfig.particles.speed * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Sparkle:</span>
                      <span className="text-white/90">
                        {selectedConfig.particles.sparkle ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="mt-auto pt-6">
                  <button
                    onClick={handleApply}
                    className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: `linear-gradient(135deg, ${selectedConfig.colors.primary}, ${selectedConfig.colors.secondary})`,
                      boxShadow: `0 4px 20px ${selectedConfig.colors.glow}40`,
                    }}
                  >
                    Apply {selectedConfig.name}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default EmotionVisualModal;
