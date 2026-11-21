// GalionOrbV7.2 - Complete Emotion System
// 50 Emotions across 4 tiers with visual configurations

export type EmotionTier = 'primary' | 'secondary' | 'complex' | 'transcendent';

export interface EmotionConfig {
  name: string;
  tier: EmotionTier;
  color: string;
  secondaryColor: string;
  energy: number; // 0-1 intensity
  particles: {
    count: number;
    speed: number;
    size: number;
  };
  aurora: boolean;
  pulse: number; // Pulse rate multiplier
  description: string;
}

// Primary Emotions - Basic, fundamental states
export const PRIMARY_EMOTIONS: Record<string, EmotionConfig> = {
  joy: {
    name: 'Joy',
    tier: 'primary',
    color: '#FFD700',
    secondaryColor: '#FFA500',
    energy: 0.9,
    particles: { count: 200, speed: 1.2, size: 1.5 },
    aurora: true,
    pulse: 1.5,
    description: 'Pure happiness radiating warmth',
  },
  sadness: {
    name: 'Sadness',
    tier: 'primary',
    color: '#4169E1',
    secondaryColor: '#1E3A8A',
    energy: 0.3,
    particles: { count: 80, speed: 0.3, size: 0.8 },
    aurora: false,
    pulse: 0.5,
    description: 'Deep melancholy, gentle waves',
  },
  anger: {
    name: 'Anger',
    tier: 'primary',
    color: '#DC2626',
    secondaryColor: '#7F1D1D',
    energy: 1.0,
    particles: { count: 300, speed: 2.0, size: 2.0 },
    aurora: false,
    pulse: 3.0,
    description: 'Intense fire, explosive energy',
  },
  fear: {
    name: 'Fear',
    tier: 'primary',
    color: '#6B21A8',
    secondaryColor: '#1C1917',
    energy: 0.7,
    particles: { count: 150, speed: 1.5, size: 0.6 },
    aurora: false,
    pulse: 2.5,
    description: 'Dark shadows, rapid flickering',
  },
  surprise: {
    name: 'Surprise',
    tier: 'primary',
    color: '#F59E0B',
    secondaryColor: '#FBBF24',
    energy: 0.85,
    particles: { count: 250, speed: 1.8, size: 1.8 },
    aurora: true,
    pulse: 2.0,
    description: 'Sudden burst of light',
  },
  disgust: {
    name: 'Disgust',
    tier: 'primary',
    color: '#65A30D',
    secondaryColor: '#3F6212',
    energy: 0.5,
    particles: { count: 100, speed: 0.8, size: 1.0 },
    aurora: false,
    pulse: 0.8,
    description: 'Unsettled, murky swirls',
  },
  trust: {
    name: 'Trust',
    tier: 'primary',
    color: '#06B6D4',
    secondaryColor: '#0891B2',
    energy: 0.6,
    particles: { count: 120, speed: 0.6, size: 1.2 },
    aurora: true,
    pulse: 0.7,
    description: 'Calm, steady glow',
  },
  anticipation: {
    name: 'Anticipation',
    tier: 'primary',
    color: '#EC4899',
    secondaryColor: '#BE185D',
    energy: 0.75,
    particles: { count: 180, speed: 1.0, size: 1.3 },
    aurora: true,
    pulse: 1.2,
    description: 'Building excitement, pulsing light',
  },
};

// Secondary Emotions - Combinations of primary
export const SECONDARY_EMOTIONS: Record<string, EmotionConfig> = {
  love: {
    name: 'Love',
    tier: 'secondary',
    color: '#F43F5E',
    secondaryColor: '#FDA4AF',
    energy: 0.95,
    particles: { count: 250, speed: 0.8, size: 1.6 },
    aurora: true,
    pulse: 1.0,
    description: 'Warm embrace, heart-like pulse',
  },
  optimism: {
    name: 'Optimism',
    tier: 'secondary',
    color: '#FBBF24',
    secondaryColor: '#FDE047',
    energy: 0.8,
    particles: { count: 200, speed: 1.0, size: 1.4 },
    aurora: true,
    pulse: 1.1,
    description: 'Sunrise glow, hopeful rays',
  },
  curiosity: {
    name: 'Curiosity',
    tier: 'secondary',
    color: '#8B5CF6',
    secondaryColor: '#C4B5FD',
    energy: 0.7,
    particles: { count: 180, speed: 1.2, size: 1.1 },
    aurora: true,
    pulse: 1.3,
    description: 'Inquisitive sparks, exploring tendrils',
  },
  serenity: {
    name: 'Serenity',
    tier: 'secondary',
    color: '#22D3EE',
    secondaryColor: '#A5F3FC',
    energy: 0.4,
    particles: { count: 100, speed: 0.4, size: 1.0 },
    aurora: true,
    pulse: 0.4,
    description: 'Still waters, peaceful glow',
  },
  admiration: {
    name: 'Admiration',
    tier: 'secondary',
    color: '#A78BFA',
    secondaryColor: '#DDD6FE',
    energy: 0.65,
    particles: { count: 160, speed: 0.7, size: 1.3 },
    aurora: true,
    pulse: 0.9,
    description: 'Awe-struck shimmer',
  },
  terror: {
    name: 'Terror',
    tier: 'secondary',
    color: '#1C1917',
    secondaryColor: '#7C2D12',
    energy: 0.95,
    particles: { count: 350, speed: 2.5, size: 0.7 },
    aurora: false,
    pulse: 4.0,
    description: 'Chaotic darkness, fractured light',
  },
  amazement: {
    name: 'Amazement',
    tier: 'secondary',
    color: '#F97316',
    secondaryColor: '#FDBA74',
    energy: 0.9,
    particles: { count: 280, speed: 1.5, size: 1.7 },
    aurora: true,
    pulse: 1.8,
    description: 'Fireworks of wonder',
  },
  grief: {
    name: 'Grief',
    tier: 'secondary',
    color: '#1E3A8A',
    secondaryColor: '#0F172A',
    energy: 0.2,
    particles: { count: 60, speed: 0.2, size: 0.6 },
    aurora: false,
    pulse: 0.3,
    description: 'Deep ocean depths, slow fade',
  },
  loathing: {
    name: 'Loathing',
    tier: 'secondary',
    color: '#4D7C0F',
    secondaryColor: '#1A2E05',
    energy: 0.6,
    particles: { count: 140, speed: 1.0, size: 0.9 },
    aurora: false,
    pulse: 1.5,
    description: 'Toxic swirl, repelling waves',
  },
  rage: {
    name: 'Rage',
    tier: 'secondary',
    color: '#B91C1C',
    secondaryColor: '#450A0A',
    energy: 1.0,
    particles: { count: 400, speed: 3.0, size: 2.2 },
    aurora: false,
    pulse: 4.0,
    description: 'Volcanic eruption, searing flames',
  },
  vigilance: {
    name: 'Vigilance',
    tier: 'secondary',
    color: '#EA580C',
    secondaryColor: '#9A3412',
    energy: 0.75,
    particles: { count: 200, speed: 1.3, size: 1.2 },
    aurora: true,
    pulse: 1.4,
    description: 'Alert scanning, focused beam',
  },
  ecstasy: {
    name: 'Ecstasy',
    tier: 'secondary',
    color: '#FACC15',
    secondaryColor: '#FEF08A',
    energy: 1.0,
    particles: { count: 350, speed: 1.5, size: 2.0 },
    aurora: true,
    pulse: 2.0,
    description: 'Blinding joy, transcendent light',
  },
};

// Complex Emotions - Nuanced emotional states
export const COMPLEX_EMOTIONS: Record<string, EmotionConfig> = {
  nostalgia: {
    name: 'Nostalgia',
    tier: 'complex',
    color: '#D97706',
    secondaryColor: '#92400E',
    energy: 0.5,
    particles: { count: 120, speed: 0.5, size: 1.1 },
    aurora: true,
    pulse: 0.6,
    description: 'Sepia-toned memories, gentle warmth',
  },
  melancholy: {
    name: 'Melancholy',
    tier: 'complex',
    color: '#6366F1',
    secondaryColor: '#3730A3',
    energy: 0.35,
    particles: { count: 90, speed: 0.4, size: 0.9 },
    aurora: false,
    pulse: 0.45,
    description: 'Beautiful sadness, rain on glass',
  },
  hope: {
    name: 'Hope',
    tier: 'complex',
    color: '#10B981',
    secondaryColor: '#34D399',
    energy: 0.7,
    particles: { count: 170, speed: 0.9, size: 1.4 },
    aurora: true,
    pulse: 1.0,
    description: 'Dawn breaking, rising light',
  },
  anxiety: {
    name: 'Anxiety',
    tier: 'complex',
    color: '#7C3AED',
    secondaryColor: '#4C1D95',
    energy: 0.8,
    particles: { count: 220, speed: 1.8, size: 0.8 },
    aurora: false,
    pulse: 2.8,
    description: 'Restless static, fragmented pulses',
  },
  pride: {
    name: 'Pride',
    tier: 'complex',
    color: '#EAB308',
    secondaryColor: '#CA8A04',
    energy: 0.75,
    particles: { count: 180, speed: 0.8, size: 1.5 },
    aurora: true,
    pulse: 0.9,
    description: 'Golden crown, majestic aura',
  },
  shame: {
    name: 'Shame',
    tier: 'complex',
    color: '#991B1B',
    secondaryColor: '#450A0A',
    energy: 0.4,
    particles: { count: 80, speed: 0.6, size: 0.7 },
    aurora: false,
    pulse: 1.2,
    description: 'Shrinking inward, dimming light',
  },
  guilt: {
    name: 'Guilt',
    tier: 'complex',
    color: '#374151',
    secondaryColor: '#1F2937',
    energy: 0.45,
    particles: { count: 100, speed: 0.5, size: 0.8 },
    aurora: false,
    pulse: 0.7,
    description: 'Heavy weight, pressing shadows',
  },
  envy: {
    name: 'Envy',
    tier: 'complex',
    color: '#15803D',
    secondaryColor: '#14532D',
    energy: 0.6,
    particles: { count: 150, speed: 1.1, size: 1.0 },
    aurora: false,
    pulse: 1.3,
    description: 'Green flames, reaching tendrils',
  },
  gratitude: {
    name: 'Gratitude',
    tier: 'complex',
    color: '#FB923C',
    secondaryColor: '#FDBA74',
    energy: 0.7,
    particles: { count: 160, speed: 0.7, size: 1.3 },
    aurora: true,
    pulse: 0.8,
    description: 'Warm embrace, grateful glow',
  },
  empathy: {
    name: 'Empathy',
    tier: 'complex',
    color: '#E879F9',
    secondaryColor: '#F0ABFC',
    energy: 0.65,
    particles: { count: 150, speed: 0.6, size: 1.2 },
    aurora: true,
    pulse: 0.7,
    description: 'Connected threads, mirroring light',
  },
  confusion: {
    name: 'Confusion',
    tier: 'complex',
    color: '#9CA3AF',
    secondaryColor: '#6B7280',
    energy: 0.55,
    particles: { count: 180, speed: 1.4, size: 0.9 },
    aurora: false,
    pulse: 2.0,
    description: 'Scattered fragments, searching beams',
  },
  determination: {
    name: 'Determination',
    tier: 'complex',
    color: '#DC2626',
    secondaryColor: '#F97316',
    energy: 0.85,
    particles: { count: 200, speed: 1.0, size: 1.4 },
    aurora: true,
    pulse: 1.2,
    description: 'Focused fire, unwavering beam',
  },
  contentment: {
    name: 'Contentment',
    tier: 'complex',
    color: '#84CC16',
    secondaryColor: '#A3E635',
    energy: 0.5,
    particles: { count: 110, speed: 0.5, size: 1.1 },
    aurora: true,
    pulse: 0.5,
    description: 'Peaceful meadow, gentle sun',
  },
  frustration: {
    name: 'Frustration',
    tier: 'complex',
    color: '#EA580C',
    secondaryColor: '#C2410C',
    energy: 0.7,
    particles: { count: 190, speed: 1.6, size: 1.1 },
    aurora: false,
    pulse: 2.2,
    description: 'Blocked energy, building pressure',
  },
};

// Transcendent Emotions - Higher states of consciousness
export const TRANSCENDENT_EMOTIONS: Record<string, EmotionConfig> = {
  enlightenment: {
    name: 'Enlightenment',
    tier: 'transcendent',
    color: '#FFFFFF',
    secondaryColor: '#F0FDFA',
    energy: 1.0,
    particles: { count: 500, speed: 0.8, size: 1.8 },
    aurora: true,
    pulse: 0.6,
    description: 'Pure white light, infinite clarity',
  },
  awe: {
    name: 'Awe',
    tier: 'transcendent',
    color: '#818CF8',
    secondaryColor: '#C7D2FE',
    energy: 0.9,
    particles: { count: 350, speed: 0.6, size: 1.6 },
    aurora: true,
    pulse: 0.8,
    description: 'Vast cosmos, humbling grandeur',
  },
  transcendence: {
    name: 'Transcendence',
    tier: 'transcendent',
    color: '#E0E7FF',
    secondaryColor: '#FAFAFA',
    energy: 0.95,
    particles: { count: 400, speed: 0.5, size: 1.7 },
    aurora: true,
    pulse: 0.5,
    description: 'Beyond form, pure energy',
  },
  unity: {
    name: 'Unity',
    tier: 'transcendent',
    color: '#00FF88',
    secondaryColor: '#34D399',
    energy: 0.85,
    particles: { count: 300, speed: 0.7, size: 1.5 },
    aurora: true,
    pulse: 0.7,
    description: 'All as one, connected field',
  },
  bliss: {
    name: 'Bliss',
    tier: 'transcendent',
    color: '#FDE68A',
    secondaryColor: '#FFFBEB',
    energy: 1.0,
    particles: { count: 450, speed: 0.9, size: 1.9 },
    aurora: true,
    pulse: 0.9,
    description: 'Absolute joy, radiating perfection',
  },
  presence: {
    name: 'Presence',
    tier: 'transcendent',
    color: '#0EA5E9',
    secondaryColor: '#7DD3FC',
    energy: 0.7,
    particles: { count: 250, speed: 0.4, size: 1.4 },
    aurora: true,
    pulse: 0.4,
    description: 'Here and now, complete awareness',
  },
  creation: {
    name: 'Creation',
    tier: 'transcendent',
    color: '#F472B6',
    secondaryColor: '#FBCFE8',
    energy: 0.95,
    particles: { count: 380, speed: 1.2, size: 1.8 },
    aurora: true,
    pulse: 1.1,
    description: 'Birth of ideas, infinite potential',
  },
  wisdom: {
    name: 'Wisdom',
    tier: 'transcendent',
    color: '#A855F7',
    secondaryColor: '#D8B4FE',
    energy: 0.75,
    particles: { count: 280, speed: 0.5, size: 1.5 },
    aurora: true,
    pulse: 0.6,
    description: 'Deep knowing, ancient light',
  },
  compassion: {
    name: 'Compassion',
    tier: 'transcendent',
    color: '#FB7185',
    secondaryColor: '#FECDD3',
    energy: 0.8,
    particles: { count: 320, speed: 0.6, size: 1.6 },
    aurora: true,
    pulse: 0.7,
    description: 'Universal love, healing embrace',
  },
  flow: {
    name: 'Flow',
    tier: 'transcendent',
    color: '#2DD4BF',
    secondaryColor: '#99F6E4',
    energy: 0.9,
    particles: { count: 350, speed: 1.0, size: 1.5 },
    aurora: true,
    pulse: 1.0,
    description: 'Perfect movement, effortless action',
  },
  stillness: {
    name: 'Stillness',
    tier: 'transcendent',
    color: '#E2E8F0',
    secondaryColor: '#F8FAFC',
    energy: 0.2,
    particles: { count: 50, speed: 0.1, size: 1.0 },
    aurora: false,
    pulse: 0.2,
    description: 'Absolute peace, void before creation',
  },
  infinity: {
    name: 'Infinity',
    tier: 'transcendent',
    color: '#0F172A',
    secondaryColor: '#1E293B',
    energy: 0.6,
    particles: { count: 600, speed: 0.3, size: 0.5 },
    aurora: true,
    pulse: 0.3,
    description: 'Endless cosmos, stars within',
  },
};

// All emotions combined
export const ALL_EMOTIONS: Record<string, EmotionConfig> = {
  ...PRIMARY_EMOTIONS,
  ...SECONDARY_EMOTIONS,
  ...COMPLEX_EMOTIONS,
  ...TRANSCENDENT_EMOTIONS,
};

// Default emotion for neutral state
export const NEUTRAL_EMOTION: EmotionConfig = {
  name: 'Neutral',
  tier: 'primary',
  color: '#00FF88', // Galion green
  secondaryColor: '#10B981',
  energy: 0.5,
  particles: { count: 150, speed: 0.7, size: 1.2 },
  aurora: true,
  pulse: 0.8,
  description: 'Calm, ready state',
};

// Birth emotion - special state for orb creation
export const BIRTH_EMOTION: EmotionConfig = {
  name: 'Birth',
  tier: 'transcendent',
  color: '#FFFFFF',
  secondaryColor: '#00FF88',
  energy: 1.0,
  particles: { count: 500, speed: 2.0, size: 2.0 },
  aurora: true,
  pulse: 3.0,
  description: 'The moment of creation',
};

// Get emotion by name
export const getEmotion = (name: string): EmotionConfig => {
  return ALL_EMOTIONS[name.toLowerCase()] || NEUTRAL_EMOTION;
};

// Get emotions by tier
export const getEmotionsByTier = (tier: EmotionTier): EmotionConfig[] => {
  return Object.values(ALL_EMOTIONS).filter((e) => e.tier === tier);
};

// Emotion transition helper
export const lerpEmotionConfig = (
  from: EmotionConfig,
  to: EmotionConfig,
  t: number
): EmotionConfig => {
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const lerpColor = (c1: string, c2: string) => {
    // Simple hex lerp (not perfect but works for transitions)
    const r1 = parseInt(c1.slice(1, 3), 16);
    const g1 = parseInt(c1.slice(3, 5), 16);
    const b1 = parseInt(c1.slice(5, 7), 16);
    const r2 = parseInt(c2.slice(1, 3), 16);
    const g2 = parseInt(c2.slice(3, 5), 16);
    const b2 = parseInt(c2.slice(5, 7), 16);
    const r = Math.round(lerp(r1, r2));
    const g = Math.round(lerp(g1, g2));
    const b = Math.round(lerp(b1, b2));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  return {
    name: t < 0.5 ? from.name : to.name,
    tier: t < 0.5 ? from.tier : to.tier,
    color: lerpColor(from.color, to.color),
    secondaryColor: lerpColor(from.secondaryColor, to.secondaryColor),
    energy: lerp(from.energy, to.energy),
    particles: {
      count: Math.round(lerp(from.particles.count, to.particles.count)),
      speed: lerp(from.particles.speed, to.particles.speed),
      size: lerp(from.particles.size, to.particles.size),
    },
    aurora: t < 0.5 ? from.aurora : to.aurora,
    pulse: lerp(from.pulse, to.pulse),
    description: t < 0.5 ? from.description : to.description,
  };
};

export default ALL_EMOTIONS;
