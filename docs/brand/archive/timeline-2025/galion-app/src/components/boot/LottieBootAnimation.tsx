'use client';

/**
 * Lottie Boot Animation Component
 * 
 * Based on Galion.app-v3-guide.md Part 2 & Part 3:
 * 
 * MOTION DESIGNER INSTRUCTIONS:
 * =============================
 * 
 * Create a Lottie JSON animation file with these specs:
 * 
 * TOTAL DURATION: 3.5-4.0 seconds
 * 
 * STAGE A (0-1.5s): GalionOS Boot
 * - Background: Near-black (#0a0a0f), subtle vignette
 * - Center: "GALION" wordmark in clean modern sans-serif
 * - Below: "Your imagination is the limit" in ultra-light type
 * - 0.0-0.3s: Logo and subtext fade in from black
 * - 0.3-1.0s: Soft glow behind logo pulses once
 * - 0.8-1.5s: Poetic lines fade in/out:
 *   * "Initializing GalionOS…"
 *   * "Linking voice, memory, and space…"
 * 
 * STAGE B (1.5-3.0s): Birth of the Orb
 * - 1.5-1.7s: Point of light appears (white/soft cyan), pulses gently
 * - 1.7-2.2s: Point grows into sphere with inner gradient (deep blue → teal → warm accent)
 * - 2.2-3.0s: Sphere reaches final size with:
 *   * Subtle highlight at top-left
 *   * Soft shadow/halo underneath
 *   * Internal gradients moving slowly
 * 
 * STAGE C (3.0-3.5s): Final Breath
 * - 3.0-3.5s: Orb performs one deeper breath
 *   * Scale up 5-8% over 400ms
 *   * Inner gradients brighten at peak
 *   * Return to idle with smooth easing
 * 
 * EXPORT REQUIREMENTS:
 * - Format: Lottie JSON
 * - Background: Transparent
 * - Resolution: Vector (scalable)
 * - Frame rate: 60fps recommended
 * - Final frame must match live orb size/position for seamless handover
 * 
 * SAVE AS: /public/animations/galion-boot.json
 * 
 * COLOR PALETTE:
 * - Background: #0a0a0f
 * - Logo: #ffffff
 * - Subtext: #94a3b8 (40% opacity)
 * - Orb primary: Deep blue → teal → magenta/rose
 * - Glow: Soft cyan (#06b6d4) with blur
 * - Highlight: Warm white (#fef08a) at 20-30% opacity
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Lottie from 'lottie-react';
import { GalionOSBoot } from './GalionOSBoot';

export interface LottieBootAnimationProps {
  /** Called when animation completes */
  onComplete: () => void;
  /** Called when ready to play greeting (Stage C - at 3.0s) */
  onReadyForGreeting?: () => void;
  /** Use fallback Framer Motion animation if Lottie fails/unavailable */
  useFallback?: boolean;
}

export function LottieBootAnimation({
  onComplete,
  onReadyForGreeting,
  useFallback = false,
}: LottieBootAnimationProps) {
  const lottieRef = useRef<any>(null);
  const [animationData, setAnimationData] = useState<any>(null);
  const [loadError, setLoadError] = useState(false);
  const [greetingTriggered, setGreetingTriggered] = useState(false);

  // Load Lottie animation JSON
  useEffect(() => {
    if (useFallback) {
      setLoadError(true);
      return;
    }

    fetch('/animations/galion-boot.json')
      .then(res => {
        if (!res.ok) throw new Error('Animation file not found');
        return res.json();
      })
      .then(data => {
        setAnimationData(data);
      })
      .catch(err => {
        console.error('[LottieBootAnimation] Failed to load animation:', err);
        console.log('[LottieBootAnimation] Falling back to Framer Motion');
        setLoadError(true);
      });
  }, [useFallback]);

  // Handle animation frame updates
  const handleFrame = useCallback((frame: number) => {
    if (!lottieRef.current) return;

    const totalFrames = lottieRef.current.getDuration(true) * 60; // Assuming 60fps
    const progress = frame / totalFrames;

    // Trigger greeting at 3.0s (85% through 3.5s animation)
    if (progress >= 0.857 && !greetingTriggered && onReadyForGreeting) {
      setGreetingTriggered(true);
      onReadyForGreeting();
    }
  }, [greetingTriggered, onReadyForGreeting]);

  // Handle animation complete
  const handleComplete = useCallback(() => {
    console.log('[LottieBootAnimation] Animation complete');
    onComplete();
  }, [onComplete]);

  // Fallback to Framer Motion if Lottie fails or is unavailable
  if (loadError || useFallback) {
    return (
      <GalionOSBoot
        onComplete={onComplete}
        onReadyForGreeting={onReadyForGreeting}
      />
    );
  }

  // Loading state while fetching animation
  if (!animationData) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/50 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={false}
        autoplay={true}
        onComplete={handleComplete}
        onEnterFrame={(e: any) => handleFrame(e.currentTime)}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      />
    </div>
  );
}

export default LottieBootAnimation;

