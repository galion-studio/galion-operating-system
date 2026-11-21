"use client";

import React, { useCallback, useEffect, useState } from "react";
import { EmotionType, Orb, OrbCustomColors } from "./Orb";

export interface OrbState {
  emotion: EmotionType;
  intensity: number;
  isListening: boolean;
  isSpeaking: boolean;
}

export interface OrbControllerProps {
  emotion?: EmotionType;
  intensity?: number;
  isListening?: boolean;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onStateChange?: (state: OrbState) => void;
  /** ARIA label override */
  ariaLabel?: string;
  /** Custom theme colors for the orb */
  customColors?: OrbCustomColors;
  /** Real-time audio level (0-1) for visual reactivity during playback */
  audioLevel?: number;
}

export const OrbController: React.FC<OrbControllerProps> = ({
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
}) => {
  const [emotion, setEmotion] = useState<EmotionType>(
    externalEmotion || "neutral"
  );
  const [intensity, setIntensity] = useState(externalIntensity || 0.5);
  const [isListening, setIsListening] = useState(externalIsListening || false);
  const [isSpeaking, setIsSpeaking] = useState(externalIsSpeaking || false);

  // Update internal state when external props change
  useEffect(() => {
    if (externalEmotion !== undefined) {
      setEmotion(externalEmotion);
    }
  }, [externalEmotion]);

  useEffect(() => {
    if (externalIntensity !== undefined) {
      setIntensity((prev) => {
        const diff = Math.abs(prev - externalIntensity);
        // Only update if change is significant (>5%)
        return diff > 0.05 ? externalIntensity : prev;
      });
    }
  }, [externalIntensity]);

  useEffect(() => {
    if (externalIsListening !== undefined) {
      setIsListening(externalIsListening);
    }
  }, [externalIsListening]);

  useEffect(() => {
    if (externalIsSpeaking !== undefined) {
      setIsSpeaking(externalIsSpeaking);
    }
  }, [externalIsSpeaking]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.({ emotion, intensity, isListening, isSpeaking });
  }, [emotion, intensity, isListening, isSpeaking, onStateChange]);

  const handleOrbClick = useCallback(() => {
    if (isSpeaking) {
      // Don't interrupt when AI is speaking
      return;
    }

    if (isListening) {
      // Stop recording
      setIsListening(false);
      onStopRecording?.();
    } else {
      // Start recording
      setIsListening(true);
      onStartRecording?.();
    }
  }, [isListening, isSpeaking, onStartRecording, onStopRecording]);

  // Generate accessible label based on state
  const getStateLabel = () => {
    if (isSpeaking) return "Galion is speaking";
    if (externalIsProcessing) return "Galion is thinking";
    if (isListening) return "Galion is listening";
    return "Galion is ready. Click or press space to speak.";
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || getStateLabel()}
      aria-live="polite"
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleOrbClick();
        }
      }}
      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0a0a0f] rounded-full"
    >
      <Orb
        emotion={emotion}
        intensity={intensity}
        isListening={isListening}
        isSpeaking={isSpeaking}
        onClick={handleOrbClick}
        customColors={customColors}
      />
    </div>
  );
};

OrbController.displayName = "OrbController";
