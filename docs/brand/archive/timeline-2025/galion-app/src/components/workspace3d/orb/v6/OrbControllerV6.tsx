/**
 * GALION Orb V6 - Controller Component
 *
 * A controller wrapper that provides the same interface as the old OrbController
 * but uses the new 3D GalionOrbV6 under the hood.
 *
 * Handles:
 * - Click interactions (start/stop recording)
 * - State management (listening, speaking, processing)
 * - Emotion mapping from old types to new types
 * - Accessibility (ARIA labels, keyboard navigation)
 */

'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { GalionOrbV6 } from './GalionOrbV6';
import type { OrbEmotion, OrbState as V6OrbState } from './types';

// =============================================================================
// LEGACY TYPE COMPATIBILITY
// =============================================================================

/** Legacy emotion types from old orb */
export type EmotionType =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'thinking'
  | 'excited'
  | 'calm'
  | 'curious'
  | 'confident'
  | 'empathetic'
  | 'focused'
  | 'playful'
  | 'serious'
  | 'surprised';

/** Legacy orb state */
export interface OrbState {
  emotion: EmotionType;
  intensity: number;
  isListening: boolean;
  isSpeaking: boolean;
}

/** Legacy custom colors (for backward compatibility) */
export interface OrbCustomColors {
  primary?: string;
  secondary?: string;
  glow?: string;
}

// =============================================================================
// EMOTION MAPPING
// =============================================================================

/** Map legacy emotion types to V6 emotions */
function mapEmotionToV6(emotion: EmotionType): OrbEmotion {
  const mapping: Record<EmotionType, OrbEmotion> = {
    neutral: 'neutral',
    happy: 'happy',
    sad: 'sad',
    thinking: 'focused',
    excited: 'excited',
    calm: 'calm',
    curious: 'curious',
    confident: 'determined',
    empathetic: 'empathetic',
    focused: 'focused',
    playful: 'happy',
    serious: 'determined',
    surprised: 'wonder',
  };
  return mapping[emotion] || 'neutral';
}

/** Map state flags to V6 orb state */
function mapStateToV6(
  isListening: boolean,
  isSpeaking: boolean,
  isProcessing: boolean
): V6OrbState {
  if (isSpeaking) return 'speaking';
  if (isProcessing) return 'thinking';
  if (isListening) return 'listening';
  return 'idle';
}

// =============================================================================
// COMPONENT
// =============================================================================

export interface OrbControllerV6Props {
  /** Current emotion */
  emotion?: EmotionType;
  /** Intensity (0-1) - maps to audio level */
  intensity?: number;
  /** Whether the orb is listening */
  isListening?: boolean;
  /** Whether the orb is speaking */
  isSpeaking?: boolean;
  /** Whether the orb is processing/thinking */
  isProcessing?: boolean;
  /** Called when user clicks to start recording */
  onStartRecording?: () => void;
  /** Called when user clicks to stop recording */
  onStopRecording?: () => void;
  /** Called when orb state changes */
  onStateChange?: (state: OrbState) => void;
  /** ARIA label override */
  ariaLabel?: string;
  /** Custom theme colors (legacy support) */
  customColors?: OrbCustomColors;
  /** Real-time audio level (0-1) for visual reactivity */
  audioLevel?: number;
  /** Click handler override */
  onClick?: () => void;
  /** Custom class name */
  className?: string;
}

export function OrbControllerV6({
  emotion: externalEmotion,
  intensity: externalIntensity,
  isListening: externalIsListening,
  isSpeaking: externalIsSpeaking,
  isProcessing: externalIsProcessing,
  onStartRecording,
  onStopRecording,
  onStateChange,
  ariaLabel,
  customColors,
  audioLevel = 0,
  onClick,
  className = '',
}: OrbControllerV6Props) {
  // Internal state
  const [emotion, setEmotion] = useState<EmotionType>(externalEmotion || 'neutral');
  const [intensity, setIntensity] = useState(externalIntensity || 0.5);
  const [isListening, setIsListening] = useState(externalIsListening || false);
  const [isSpeaking, setIsSpeaking] = useState(externalIsSpeaking || false);

  // Sync with external props
  useEffect(() => {
    if (externalEmotion !== undefined) setEmotion(externalEmotion);
  }, [externalEmotion]);

  useEffect(() => {
    if (externalIntensity !== undefined) {
      setIntensity(prev => Math.abs(prev - externalIntensity) > 0.05 ? externalIntensity : prev);
    }
  }, [externalIntensity]);

  useEffect(() => {
    if (externalIsListening !== undefined) setIsListening(externalIsListening);
  }, [externalIsListening]);

  useEffect(() => {
    if (externalIsSpeaking !== undefined) setIsSpeaking(externalIsSpeaking);
  }, [externalIsSpeaking]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.({ emotion, intensity, isListening, isSpeaking });
  }, [emotion, intensity, isListening, isSpeaking, onStateChange]);

  // Map to V6 types
  const v6Emotion = useMemo(() => mapEmotionToV6(emotion), [emotion]);
  const v6State = useMemo(
    () => mapStateToV6(isListening, isSpeaking, externalIsProcessing || false),
    [isListening, isSpeaking, externalIsProcessing]
  );

  // Effective audio level (combine intensity and audioLevel)
  const effectiveAudioLevel = useMemo(() => {
    // Use audioLevel if provided, otherwise use intensity as fallback
    return Math.max(audioLevel, intensity * 0.3);
  }, [audioLevel, intensity]);

  // Click handler
  const handleOrbClick = useCallback(() => {
    // Custom onClick takes precedence
    if (onClick) {
      onClick();
      return;
    }

    // Don't interrupt when AI is speaking
    if (isSpeaking) return;

    if (isListening) {
      setIsListening(false);
      onStopRecording?.();
    } else {
      setIsListening(true);
      onStartRecording?.();
    }
  }, [isListening, isSpeaking, onStartRecording, onStopRecording, onClick]);

  // Keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleOrbClick();
    }
  }, [handleOrbClick]);

  // Generate accessible label
  const getStateLabel = useCallback(() => {
    if (isSpeaking) return 'Galion is speaking';
    if (externalIsProcessing) return 'Galion is thinking';
    if (isListening) return 'Galion is listening';
    return 'Galion is ready. Click or press space to speak.';
  }, [isSpeaking, externalIsProcessing, isListening]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || getStateLabel()}
      aria-live="polite"
      onKeyDown={handleKeyDown}
      onClick={handleOrbClick}
      className={`
        relative cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50
        focus-visible:ring-offset-4 focus-visible:ring-offset-[#0a0a0f]
        rounded-full
        ${className}
      `}
      style={{
        width: '320px',
        height: '320px',
      }}
    >
      <GalionOrbV6
        emotion={v6Emotion}
        state={v6State}
        audioLevel={effectiveAudioLevel}
        quality="high"
        size={1.0}
        className="w-full h-full"
      />
    </div>
  );
}

OrbControllerV6.displayName = 'OrbControllerV6';

export default OrbControllerV6;
