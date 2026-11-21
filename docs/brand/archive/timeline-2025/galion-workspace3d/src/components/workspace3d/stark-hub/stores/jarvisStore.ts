/**
 * jarvisStore.ts
 * Source: galion-workspace3d master, src/components/workspace3d/stark-hub/stores/jarvisStore.ts
 * The boot sequence calls setMood. The rest of the store is the same state machine.
 */
import { create } from "zustand";

export type JarvisMood =
  | "idle"
  | "listening"
  | "thinking"
  | "executing"
  | "alert"
  | "celebrating";

interface JarvisState {
  mood: JarvisMood;
  previousMood: JarvisMood;
  setMood: (mood: JarvisMood) => void;
  transitionMood: (mood: JarvisMood, duration?: number) => void;
}

export const useJarvisStore = create<JarvisState>((set, get) => ({
  mood: "idle",
  previousMood: "idle",
  setMood: (mood) => set((state) => ({ previousMood: state.mood, mood })),
  transitionMood: (mood, duration = 1000) => {
    const state = get();
    if (state.mood === mood) return;
    set({ previousMood: state.mood, mood });
    if (mood === "celebrating" || mood === "alert") {
      setTimeout(() => set({ mood: "idle", previousMood: mood }), duration);
    }
  },
}));

export default useJarvisStore;
