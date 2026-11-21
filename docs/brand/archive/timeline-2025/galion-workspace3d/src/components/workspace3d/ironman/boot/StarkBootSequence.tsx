"use client";

/**
 * StarkBootSequence - System Boot Animation
 *
 * Cinematic boot sequence with animated progress and system messages.
 *
 * "J.A.R.V.I.S., boot up. Let's get to work."
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHUDSounds } from "../audio/useHUDSounds";
import { GalionLogger } from "@/utils/logger";
import {
  useBootSequence,
  useStarkWorkspace,
} from "../context/useStarkWorkspace";
import {
  STARK_BOOT_STEPS,
  calculateBootTimeline,
  calculateProgress,
  getRandomGreeting,
} from "./BootTimeline";

// ============================================================================
// TYPES
// ============================================================================

interface StarkBootSequenceProps {
  /** Callback when boot is complete */
  onComplete?: () => void;
  /** Skip boot sequence */
  skip?: boolean;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    fontFamily: "'Rajdhani', 'Orbitron', 'Segoe UI', monospace",
    color: "rgba(0, 200, 255, 0.9)",
    overflow: "hidden",
  },
  fadeOut: {
    opacity: 0,
    transition: "opacity 0.8s ease-out",
  },
  logo: {
    marginBottom: 60,
    fontSize: 48,
    fontWeight: 700,
    letterSpacing: "0.2em",
    textShadow: "0 0 30px rgba(0, 200, 255, 0.5)",
  },
  content: {
    width: "100%",
    maxWidth: 500,
    padding: "0 20px",
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(0, 200, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "rgba(0, 200, 255, 0.9)",
    boxShadow: "0 0 10px rgba(0, 200, 255, 0.5)",
    transition: "width 0.1s linear",
  },
  progressText: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "rgba(0, 200, 255, 0.6)",
  },
  steps: {
    marginBottom: 30,
  },
  step: {
    display: "flex",
    alignItems: "center",
    marginBottom: 8,
    fontSize: 13,
  },
  stepIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
  },
  stepPending: {
    color: "rgba(0, 200, 255, 0.3)",
  },
  stepActive: {
    color: "rgba(0, 200, 255, 0.9)",
  },
  stepComplete: {
    color: "rgba(0, 255, 136, 0.9)",
  },
  message: {
    textAlign: "center" as const,
    fontSize: 14,
    color: "rgba(0, 200, 255, 0.8)",
    letterSpacing: "0.05em",
    marginTop: 20,
    minHeight: 24,
  },
  subMessage: {
    fontSize: 11,
    color: "rgba(0, 200, 255, 0.5)",
    marginTop: 4,
  },
  skipButton: {
    position: "absolute" as const,
    bottom: 40,
    right: 40,
    background: "transparent",
    border: "1px solid rgba(0, 200, 255, 0.3)",
    color: "rgba(0, 200, 255, 0.5)",
    padding: "8px 16px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
    letterSpacing: "0.1em",
    transition: "all 0.2s ease",
  },
  glowLine: {
    position: "absolute" as const,
    top: "50%",
    left: 0,
    right: 0,
    height: 1,
    background:
      "linear-gradient(90deg, transparent, rgba(0, 200, 255, 0.5), transparent)",
    animation: "scanLineMove 2s linear infinite",
  },
  cornerDecor: {
    position: "absolute" as const,
    width: 50,
    height: 50,
    borderColor: "rgba(0, 200, 255, 0.3)",
    borderStyle: "solid",
    borderWidth: 0,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function StarkBootSequence({
  onComplete,
  skip = false,
}: StarkBootSequenceProps) {
  const { state, completeBoot } = useStarkWorkspace();
  const bootSequence = useBootSequence();
  const sounds = useHUDSounds();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [greeting, setGreeting] = useState("");
  const startTime = useRef<number>(0);
  const animationRef = useRef<number>(0);
  const lastSoundStep = useRef<number>(-1);
  const hasSkipped = useRef(false);
  const hasStartedAnimation = useRef(false);
  const hasCalledComplete = useRef(false);

  // Memoize timeline to prevent recalculation on every render
  const timeline = useMemo(() => calculateBootTimeline(STARK_BOOT_STEPS), []);
  const progressData = calculateProgress(elapsedTime, timeline);

  // Handle skip - only call once
  const handleSkip = useCallback(() => {
    if (hasSkipped.current || hasCalledComplete.current) return;
    hasSkipped.current = true;
    hasCalledComplete.current = true;

    setElapsedTime(timeline.totalDuration);
    setIsComplete(true);
    setFadeOut(true);
    sounds.bootComplete();

    setTimeout(() => {
      completeBoot();
      onComplete?.();
    }, 800);
  }, [timeline.totalDuration, completeBoot, onComplete, sounds]);

  // Skip if requested - only run once when skip conditions are met
  useEffect(() => {
    if (
      (skip || bootSequence.skipBoot) &&
      !hasSkipped.current &&
      !hasCalledComplete.current
    ) {
      handleSkip();
    }
  }, [skip, bootSequence.skipBoot]); // eslint-disable-line react-hooks/exhaustive-deps

  // Boot animation - only start once
  useEffect(() => {
    // Guard: only run once, never after skipped or already started
    if (hasStartedAnimation.current || hasSkipped.current || skip) return;
    hasStartedAnimation.current = true;

    startTime.current = performance.now();
    sounds.bootSequence();

    const animate = (time: number) => {
      // Don't continue if we've been skipped
      if (hasSkipped.current) return;

      const elapsed = time - startTime.current;
      setElapsedTime(elapsed);

      // Check for step sound triggers
      const { currentStepIndex, currentStep } = calculateProgress(
        elapsed,
        timeline
      );

      if (currentStepIndex > lastSoundStep.current && currentStep?.sound) {
        lastSoundStep.current = currentStepIndex;
        // Log meaningful boot steps to terminal
        if (currentStep.label) {
          GalionLogger.info("SYSTEM", `Protocols: ${currentStep.label}`);
        }

        if (currentStep.sound === "confirm") {
          sounds.confirm();
        } else if (currentStep.sound === "notification") {
          sounds.notification();
        }
      }

      if (elapsed < timeline.totalDuration) {
        animationRef.current = requestAnimationFrame(animate);
      } else if (!hasCalledComplete.current) {
        // Boot complete - only call once
        hasCalledComplete.current = true;
        setIsComplete(true);
        setGreeting(getRandomGreeting());
        sounds.bootComplete();

        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => {
            completeBoot();
            onComplete?.();
          }, 800);
        }, 1500);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Don't render if already booted
  if (!bootSequence.shouldShow && !state.isBooting) {
    return null;
  }

  return (
    <>
      {/* Animation keyframes */}
      <style>{`
        @keyframes scanLineMove {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          ...styles.container,
          ...(fadeOut ? styles.fadeOut : {}),
        }}
      >
        {/* Corner decorations */}
        <div
          style={{
            ...styles.cornerDecor,
            top: 20,
            left: 20,
            borderTopWidth: 2,
            borderLeftWidth: 2,
          }}
        />
        <div
          style={{
            ...styles.cornerDecor,
            top: 20,
            right: 20,
            borderTopWidth: 2,
            borderRightWidth: 2,
          }}
        />
        <div
          style={{
            ...styles.cornerDecor,
            bottom: 20,
            left: 20,
            borderBottomWidth: 2,
            borderLeftWidth: 2,
          }}
        />
        <div
          style={{
            ...styles.cornerDecor,
            bottom: 20,
            right: 20,
            borderBottomWidth: 2,
            borderRightWidth: 2,
          }}
        />

        {/* Scan line effect */}
        <div style={styles.glowLine} />

        {/* Logo */}
        <div style={styles.logo}>STARK</div>

        {/* Content */}
        <div style={styles.content}>
          {/* Progress bar */}
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${progressData.progress * 100}%`,
                }}
              />
            </div>
            <div style={styles.progressText}>
              <span>INITIALIZING SYSTEMS</span>
              <span>{Math.round(progressData.progress * 100)}%</span>
            </div>
          </div>

          {/* Steps */}
          <div style={styles.steps}>
            {STARK_BOOT_STEPS.map((step, index) => {
              const isPast = index < progressData.currentStepIndex;
              const isCurrent = index === progressData.currentStepIndex;
              const isPending = index > progressData.currentStepIndex;

              return (
                <div
                  key={step.id}
                  style={{
                    ...styles.step,
                    ...(isPending ? styles.stepPending : {}),
                    ...(isCurrent ? styles.stepActive : {}),
                    ...(isPast ? styles.stepComplete : {}),
                  }}
                >
                  <div style={styles.stepIcon}>
                    {isPast ? "✓" : isCurrent ? "►" : "○"}
                  </div>
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Current sub-step message */}
          <div style={styles.message}>
            {isComplete
              ? greeting
              : progressData.currentSubStep || "Processing..."}
            {!isComplete && progressData.currentStep && (
              <div style={styles.subMessage}>
                {progressData.currentStep.label}
              </div>
            )}
          </div>
        </div>

        {/* Skip button */}
        {!isComplete && (
          <button
            type="button"
            style={styles.skipButton}
            onClick={handleSkip}
            onMouseEnter={() => sounds.hover()}
          >
            SKIP [ESC]
          </button>
        )}
      </div>
    </>
  );
}

export default StarkBootSequence;
