'use client';

/**
 * Birth of a Star - Premium Cinematic Boot Animation
 *
 * A cosmic journey showing intelligence being born like a star emerging from darkness.
 * Design principles:
 * - Golden Ratio (phi = 1.618)
 * - The number 42 (sacred geometry)
 * - Cosmic imagery and particle effects
 * - Duration: 5-8 seconds, skippable for returning users
 *
 * Phases:
 * 1. Void (0-1s) - Pure darkness, anticipation
 * 2. Spark (1-2s) - First light emerges
 * 3. Expansion (2-4s) - Sacred geometry unfolds
 * 4. Nebula (4-5.5s) - Cosmic cloud formation
 * 5. Convergence (5.5-7s) - Energy coalesces into orb
 * 6. Birth (7-8s) - The orb awakens
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Golden Ratio and sacred constants
const PHI = 1.618033988749895;
const SACRED_42 = 42;

// Seeded random for SSR/hydration consistency
function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

export interface BirthOfAStarProps {
  onComplete: () => void;
  onReadyForGreeting?: () => void;
  isFirstVisit?: boolean;
  allowSkip?: boolean;
  reducedMotion?: boolean;
}

type BootStage =
  | 'void'
  | 'spark'
  | 'expansion'
  | 'nebula'
  | 'convergence'
  | 'birth'
  | 'complete';

// Generate particles using golden ratio spiral
interface CosmicParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  color: string;
  angle: number;
}

function generateGoldenSpiralParticles(count: number): CosmicParticle[] {
  const seededRandom = createSeededRandom(42); // Use seeded random for consistency
  const particles: CosmicParticle[] = [];
  const colors = [
    'rgba(99, 102, 241, 0.8)',   // Indigo
    'rgba(139, 92, 246, 0.7)',   // Purple
    'rgba(6, 182, 212, 0.8)',    // Cyan
    'rgba(34, 211, 238, 0.6)',   // Light cyan
    'rgba(255, 255, 255, 0.9)',  // White
  ];

  for (let i = 0; i < count; i++) {
    const angle = i * 137.5 * (Math.PI / 180); // Golden angle
    const radius = Math.sqrt(i) * 8;
    const x = 50 + Math.cos(angle) * radius * 0.5;
    const y = 50 + Math.sin(angle) * radius * 0.5;

    particles.push({
      id: i,
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      size: 1 + seededRandom() * 3,
      delay: (i / count) * 2,
      duration: 3 + seededRandom() * 2,
      opacity: 0.3 + seededRandom() * 0.5,
      color: colors[i % colors.length],
      angle: angle * (180 / Math.PI),
    });
  }

  return particles;
}

// Sacred geometry vertices (using 42 points)
function generateSacredGeometry(): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const centerX = 50;
  const centerY = 50;

  // Flower of Life pattern - 42 points
  for (let i = 0; i < SACRED_42; i++) {
    const angle = (i / SACRED_42) * Math.PI * 2;
    const layerIndex = Math.floor(i / 7);
    const radius = 15 + layerIndex * 8 * (1 / PHI);

    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }

  return points;
}

// Nebula cloud component
function NebulaCloud({
  stage,
  reducedMotion
}: {
  stage: BootStage;
  reducedMotion: boolean;
}) {
  const showNebula = stage === 'nebula' || stage === 'convergence' || stage === 'birth';

  return (
    <AnimatePresence>
      {showNebula && (
        <>
          {/* Primary nebula cloud */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              width: '120vmax',
              height: '120vmax',
              transform: 'translate(-50%, -50%)',
              background: `
                radial-gradient(ellipse 60% 40% at 45% 45%, rgba(139, 92, 246, 0.15) 0%, transparent 70%),
                radial-gradient(ellipse 50% 60% at 55% 55%, rgba(6, 182, 212, 0.12) 0%, transparent 60%),
                radial-gradient(ellipse 70% 50% at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 80%)
              `,
              filter: 'blur(60px)',
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: stage === 'convergence' ? 0.4 : 0.8,
              scale: stage === 'convergence' ? 0.3 : 1,
              rotate: reducedMotion ? 0 : [0, 15, 0],
            }}
            exit={{ opacity: 0, scale: 0.2 }}
            transition={{
              duration: stage === 'convergence' ? 1.5 : 2,
              ease: [0.22, 1, 0.36, 1],
              rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            }}
          />

          {/* Secondary nebula layer - purple */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              width: '100vmax',
              height: '100vmax',
              transform: 'translate(-50%, -50%)',
              background: `
                radial-gradient(ellipse 55% 65% at 40% 60%, rgba(168, 85, 247, 0.12) 0%, transparent 60%),
                radial-gradient(ellipse 65% 45% at 60% 40%, rgba(59, 130, 246, 0.1) 0%, transparent 55%)
              `,
              filter: 'blur(80px)',
            }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{
              opacity: stage === 'convergence' ? 0.2 : 0.6,
              scale: stage === 'convergence' ? 0.2 : 1.2,
              rotate: reducedMotion ? 0 : [0, -10, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2.5,
              ease: [0.22, 1, 0.36, 1],
              rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Sacred geometry overlay
function SacredGeometryOverlay({
  stage,
  reducedMotion
}: {
  stage: BootStage;
  reducedMotion: boolean;
}) {
  const points = useMemo(() => generateSacredGeometry(), []);
  const showGeometry = stage === 'expansion' || stage === 'nebula';

  return (
    <AnimatePresence>
      {showGeometry && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="sacredGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(139, 92, 246, 0.6)" />
              <stop offset="50%" stopColor="rgba(6, 182, 212, 0.5)" />
              <stop offset="100%" stopColor="rgba(99, 102, 241, 0.4)" />
            </linearGradient>
            <filter id="sacredGlow">
              <feGaussianBlur stdDeviation="0.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connecting lines - Flower of Life pattern */}
          {points.map((point, i) => {
            const nextPoint = points[(i + 1) % points.length];
            const oppositePoint = points[(i + Math.floor(points.length / 2)) % points.length];

            return (
              <g key={`line-${i}`}>
                <motion.line
                  x1={point.x}
                  y1={point.y}
                  x2={nextPoint.x}
                  y2={nextPoint.y}
                  stroke="url(#sacredGradient)"
                  strokeWidth="0.1"
                  filter="url(#sacredGlow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: stage === 'nebula' ? [0.3, 0.1] : 0.4,
                  }}
                  exit={{ opacity: 0, pathLength: 0 }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.02,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
                {i % 3 === 0 && (
                  <motion.line
                    x1={point.x}
                    y1={point.y}
                    x2={oppositePoint.x}
                    y2={oppositePoint.y}
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="0.05"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.2 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 2,
                      delay: i * 0.03,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* Central circles - Golden ratio proportions */}
          {[1, PHI, PHI * PHI].map((ratio, i) => (
            <motion.circle
              key={`circle-${i}`}
              cx="50"
              cy="50"
              r={10 * ratio}
              fill="none"
              stroke="rgba(99, 102, 241, 0.3)"
              strokeWidth="0.15"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: stage === 'nebula' ? 0.15 : 0.3,
                rotate: reducedMotion ? 0 : (i % 2 === 0 ? 360 : -360),
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 2,
                delay: 0.3 + i * 0.2,
                ease: [0.22, 1, 0.36, 1],
                rotate: { duration: 30 + i * 10, repeat: Infinity, ease: 'linear' },
              }}
            />
          ))}
        </svg>
      )}
    </AnimatePresence>
  );
}

// Cosmic particles layer
function CosmicParticles({
  stage,
  reducedMotion
}: {
  stage: BootStage;
  reducedMotion: boolean;
}) {
  const particles = useMemo(() => generateGoldenSpiralParticles(SACRED_42 * 2), []);
  const showParticles = stage !== 'void' && stage !== 'complete';

  return (
    <AnimatePresence>
      {showParticles && particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity:
              stage === 'convergence' || stage === 'birth'
                ? [particle.opacity, 0]
                : [0, particle.opacity, particle.opacity * 0.5],
            scale:
              stage === 'convergence' || stage === 'birth'
                ? [1, 0]
                : [0, 1, 0.8],
            x:
              stage === 'convergence' || stage === 'birth'
                ? [0, (50 - particle.x) * 3]
                : reducedMotion ? 0 : [0, Math.sin(particle.angle) * 20],
            y:
              stage === 'convergence' || stage === 'birth'
                ? [0, (50 - particle.y) * 3]
                : reducedMotion ? 0 : [0, -30 - (particle.id % 20)],
          }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            duration: stage === 'convergence' ? 1.5 : particle.duration,
            delay: particle.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </AnimatePresence>
  );
}

// Central orb emergence
function OrbEmergence({
  stage,
  reducedMotion
}: {
  stage: BootStage;
  reducedMotion: boolean;
}) {
  const showOrb = stage === 'convergence' || stage === 'birth';

  return (
    <AnimatePresence>
      {showOrb && (
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: stage === 'birth' ? 1 : 0.6,
            opacity: 1,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {/* Outer glow layers */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              width: 320,
              height: 320,
              marginLeft: -160,
              marginTop: -160,
              background: `
                radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(6, 182, 212, 0.2) 40%, transparent 70%)
              `,
              filter: 'blur(40px)',
            }}
            animate={{
              scale: reducedMotion ? 1 : [1, 1.2, 1],
              opacity: [0.6, 1, 0.7],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Energy rings during convergence */}
          {stage === 'convergence' && !reducedMotion && [1, 2, 3].map((ring) => (
            <motion.div
              key={`ring-${ring}`}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 100 + ring * 60,
                height: 100 + ring * 60,
                border: '1px solid rgba(6, 182, 212, 0.4)',
              }}
              initial={{ scale: 3, opacity: 0 }}
              animate={{ scale: 1, opacity: [0, 0.6, 0] }}
              transition={{
                duration: 1,
                delay: ring * 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ))}

          {/* Main orb */}
          <motion.div
            className="relative w-56 h-56 md:w-64 md:h-64 rounded-full overflow-hidden"
            style={{
              background: `
                radial-gradient(ellipse at 28% 22%, rgba(59, 130, 246, 0.8) 0%, transparent 50%),
                radial-gradient(ellipse at 72% 75%, rgba(20, 184, 166, 0.7) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, #0891b2 0%, #115e59 55%, #0f766e 100%)
              `,
              boxShadow: `
                0 0 80px rgba(99, 102, 241, 0.4),
                0 0 140px rgba(6, 182, 212, 0.25),
                0 0 200px rgba(139, 92, 246, 0.15),
                inset 0 0 100px rgba(255, 255, 255, 0.12)
              `,
            }}
            animate={{
              scale: stage === 'birth' ? [1, 1.05, 1] : 1,
            }}
            transition={{
              duration: 0.8,
              ease: 'easeInOut',
            }}
          >
            {/* Primary highlight */}
            <motion.div
              className="absolute top-[8%] left-[12%] w-24 h-24 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            />

            {/* Secondary highlight */}
            <div
              className="absolute top-[6%] left-[10%] w-10 h-10 rounded-full opacity-60"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
              }}
            />

            {/* Internal swirl */}
            <motion.div
              className="absolute inset-3 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg at 42% 38%, #1e40af 0%, #0891b2 20%, #14b8a6 40%, #06b6d4 60%, #0891b2 80%, #1e40af 100%)',
                filter: 'blur(25px)',
                opacity: 0.35,
              }}
              animate={{
                rotate: reducedMotion ? 0 : [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Breath pulse */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 55%)',
              }}
              animate={{
                scale: reducedMotion ? 1 : [1, 1.02, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>

          {/* Shadow underneath */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: -24,
              width: 192,
              height: 40,
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
              filter: 'blur(15px)',
            }}
            initial={{ opacity: 0, scaleX: 0.3 }}
            animate={{ opacity: 0.5, scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Main component
export function BirthOfAStar({
  onComplete,
  onReadyForGreeting,
  isFirstVisit = true,
  allowSkip = true,
  reducedMotion = false,
}: BirthOfAStarProps) {
  const [stage, setStage] = useState<BootStage>('void');
  const [showSkip, setShowSkip] = useState(false);
  const [hasSkipped, setHasSkipped] = useState(false);

  // Check for reduced motion preference - always start with prop value for SSR consistency
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(reducedMotion);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(reducedMotion || mediaQuery.matches);
  }, [reducedMotion]);

  // Stage timing sequence
  useEffect(() => {
    if (hasSkipped) return;

    const timers: NodeJS.Timeout[] = [];
    const duration = isFirstVisit ? 1 : 0.6; // Faster for returning users

    // Show skip button after 1s
    timers.push(setTimeout(() => setShowSkip(true), 1000));

    // Void (0-1s)
    timers.push(setTimeout(() => setStage('spark'), 1000 * duration));

    // Spark (1-2s)
    timers.push(setTimeout(() => setStage('expansion'), 2000 * duration));

    // Expansion (2-4s)
    timers.push(setTimeout(() => setStage('nebula'), 4000 * duration));

    // Nebula (4-5.5s)
    timers.push(setTimeout(() => setStage('convergence'), 5500 * duration));

    // Convergence (5.5-7s) - trigger greeting
    timers.push(setTimeout(() => {
      setStage('birth');
      onReadyForGreeting?.();
    }, 7000 * duration));

    // Birth/Complete (7-8s)
    timers.push(setTimeout(() => {
      setStage('complete');
      onComplete();
    }, 8000 * duration));

    return () => timers.forEach(t => clearTimeout(t));
  }, [isFirstVisit, hasSkipped, onComplete, onReadyForGreeting]);

  // Skip handler
  const handleSkip = useCallback(() => {
    if (!allowSkip) return;
    setHasSkipped(true);
    setStage('complete');
    onComplete();
  }, [allowSkip, onComplete]);

  if (stage === 'complete') return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black">
      {/* Deep space background */}
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

      {/* Star field background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 10% 20%, white 50%, transparent),
            radial-gradient(1px 1px at 30% 50%, white 50%, transparent),
            radial-gradient(1px 1px at 50% 30%, white 50%, transparent),
            radial-gradient(1px 1px at 70% 70%, white 50%, transparent),
            radial-gradient(1px 1px at 90% 40%, white 50%, transparent),
            radial-gradient(1.5px 1.5px at 25% 75%, white 50%, transparent),
            radial-gradient(1.5px 1.5px at 75% 25%, white 50%, transparent)
          `,
          backgroundSize: '250px 250px',
        }}
      />

      {/* Void - single point of light */}
      <AnimatePresence>
        {(stage === 'void' || stage === 'spark') && (
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: stage === 'spark' ? [1, 2, 1.5] : 1,
              opacity: 1,
            }}
            exit={{ scale: 5, opacity: 0 }}
            transition={{
              duration: stage === 'spark' ? 1 : 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: '#ffffff',
                boxShadow: `
                  0 0 20px rgba(255, 255, 255, 0.8),
                  0 0 40px rgba(99, 102, 241, 0.6),
                  0 0 60px rgba(6, 182, 212, 0.4),
                  0 0 80px rgba(139, 92, 246, 0.3)
                `,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sacred Geometry */}
      <SacredGeometryOverlay stage={stage} reducedMotion={prefersReducedMotion} />

      {/* Cosmic Particles */}
      <CosmicParticles stage={stage} reducedMotion={prefersReducedMotion} />

      {/* Nebula Cloud */}
      <NebulaCloud stage={stage} reducedMotion={prefersReducedMotion} />

      {/* Orb Emergence */}
      <OrbEmergence stage={stage} reducedMotion={prefersReducedMotion} />

      {/* Skip button */}
      {allowSkip && showSkip && !hasSkipped && (
        <motion.button
          className="absolute bottom-8 right-8 px-4 py-2 text-sm text-white/40 hover:text-white/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleSkip}
          aria-label="Skip introduction"
        >
          Skip
        </motion.button>
      )}

      {/* Stage indicator (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 text-white/30 text-xs font-mono">
          Stage: {stage}
        </div>
      )}
    </div>
  );
}

export default BirthOfAStar;
