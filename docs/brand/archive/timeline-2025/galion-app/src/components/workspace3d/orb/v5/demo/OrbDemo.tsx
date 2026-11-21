/**
 * GALION Orb V5.2 Demo Component
 *
 * Interactive demo for testing all states and emotions
 */

"use client";

import { useCallback, useState } from "react";
import { Sparkles } from "lucide-react";
import { EMOTION_CONFIGS } from "../config/emotions";
import { STATE_CONFIGS } from "../config/states";
import { GalionOrbV5 } from "../GalionOrbV5";
import { EmotionVisualModal } from "../modals/EmotionVisualModal";
import { OrbState } from "../types";
import { Emotion } from "../types/emotion.types";

// Get all states and emotions
const ALL_STATES = Object.keys(STATE_CONFIGS) as OrbState[];
const ALL_EMOTIONS = Object.keys(EMOTION_CONFIGS) as Emotion[];

// Group emotions by tier
const EMOTION_TIERS = {
  primary: ALL_EMOTIONS.filter((e) => EMOTION_CONFIGS[e].tier === "primary"),
  secondary: ALL_EMOTIONS.filter(
    (e) => EMOTION_CONFIGS[e].tier === "secondary"
  ),
  complex: ALL_EMOTIONS.filter((e) => EMOTION_CONFIGS[e].tier === "complex"),
  transcendent: ALL_EMOTIONS.filter(
    (e) => EMOTION_CONFIGS[e].tier === "transcendent"
  ),
};

export function OrbDemo() {
  const [currentState, setCurrentState] = useState<OrbState>("idle");
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>("neutral");
  const [emotionIntensity, setEmotionIntensity] = useState(1.0);
  const [quality, setQuality] = useState<
    "auto" | "low" | "medium" | "high" | "ultra"
  >("auto");
  const [debug, setDebug] = useState(true);
  const [showEmotionModal, setShowEmotionModal] = useState(false);

  const handleStateChange = useCallback((newState: OrbState) => {
    console.log("[OrbDemo] State changed to:", newState);
  }, []);

  const handleEmotionChange = useCallback((newEmotion: string) => {
    console.log("[OrbDemo] Emotion changed to:", newEmotion);
  }, []);

  const handleOrbClick = useCallback(() => {
    console.log("[OrbDemo] Orb clicked!");
    setShowEmotionModal(true);
  }, []);

  const handleEmotionSelect = useCallback(
    (emotion: Emotion, intensity?: number) => {
      setCurrentEmotion(emotion);
      if (intensity !== undefined) {
        setEmotionIntensity(intensity);
      }
      console.log(
        "[OrbDemo] Emotion selected:",
        emotion,
        "Intensity:",
        intensity
      );
    },
    []
  );

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Orb Display */}
      <div className="flex-1 relative">
        <GalionOrbV5
          initialState={currentState}
          initialEmotion={currentEmotion}
          quality={quality}
          debug={debug}
          onClick={handleOrbClick}
          onStateChange={handleStateChange}
          onEmotionChange={handleEmotionChange}
        />

        {/* Emotion Modal Trigger Button */}
        <button
          onClick={() => setShowEmotionModal(true)}
          className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          <Sparkles className="w-5 h-5" />
          <span>Emotions</span>
        </button>
      </div>

      {/* Emotion Visual Modal */}
      <EmotionVisualModal
        isOpen={showEmotionModal}
        onClose={() => setShowEmotionModal(false)}
        currentEmotion={currentEmotion}
        onEmotionSelect={handleEmotionSelect}
        intensity={emotionIntensity}
      />

      {/* Control Panel */}
      <div className="w-80 bg-gray-800 p-4 overflow-y-auto text-white">
        <h1 className="text-xl font-bold mb-4">GALION Orb V5.2 Demo</h1>

        {/* Quality Control */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Quality</h2>
          <div className="flex flex-wrap gap-2">
            {(["auto", "low", "medium", "high", "ultra"] as const).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`px-3 py-1 rounded text-sm ${quality === q
                    ? "bg-blue-600"
                    : "bg-gray-700 hover:bg-gray-600"
                  }`}
              >
                {q}
              </button>
            ))}
          </div>
        </section>

        {/* Debug Toggle */}
        <section className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={debug}
              onChange={(e) => setDebug(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Show Debug Info</span>
          </label>
        </section>

        {/* State Control */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            States ({ALL_STATES.length})
          </h2>
          <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
            {ALL_STATES.map((state) => (
              <button
                key={state}
                onClick={() => setCurrentState(state)}
                className={`px-2 py-1 rounded text-xs ${currentState === state
                    ? "bg-green-600"
                    : "bg-gray-700 hover:bg-gray-600"
                  }`}
              >
                {state}
              </button>
            ))}
          </div>
        </section>

        {/* Emotion Control by Tier */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Emotions ({ALL_EMOTIONS.length})
          </h2>

          {Object.entries(EMOTION_TIERS).map(([tier, emotions]) => (
            <div key={tier} className="mb-3">
              <h3 className="text-sm font-medium text-gray-400 capitalize mb-1">
                {tier} ({emotions.length})
              </h3>
              <div className="flex flex-wrap gap-1">
                {emotions.map((emotion) => {
                  const config = EMOTION_CONFIGS[emotion];
                  return (
                    <button
                      key={emotion}
                      onClick={() => setCurrentEmotion(emotion)}
                      className={`px-2 py-1 rounded text-xs transition-all ${currentEmotion === emotion
                          ? "ring-2 ring-white"
                          : "hover:opacity-80"
                        }`}
                      style={{
                        backgroundColor: config.colors.primary,
                        color: "#fff",
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                      }}
                    >
                      {emotion}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* Current State Info */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Current Selection</h2>
          <div className="bg-gray-700 rounded p-3 text-sm">
            <div>
              <strong>State:</strong> {currentState}
            </div>
            <div>
              <strong>Emotion:</strong> {currentEmotion}
            </div>
            <div>
              <strong>Quality:</strong> {quality}
            </div>
            {STATE_CONFIGS[currentState] && (
              <div className="mt-2 text-xs text-gray-400">
                <div>Animation: {STATE_CONFIGS[currentState].animation}</div>
                <div>Pulse: {STATE_CONFIGS[currentState].visual.pulseRate}</div>
              </div>
            )}
            {EMOTION_CONFIGS[currentEmotion] && (
              <div className="mt-2 text-xs text-gray-400">
                <div>Tier: {EMOTION_CONFIGS[currentEmotion].tier}</div>
                <div>
                  Sparkle: {EMOTION_CONFIGS[currentEmotion].particles.sparkle}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default OrbDemo;
