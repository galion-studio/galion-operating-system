"use client";

/**
 * useStarkWorkspace - Consumer Hook
 * Source: galion-workspace3d master,
 * src/components/workspace3d/ironman/context/useStarkWorkspace.ts
 */

import { useCallback, useContext, useMemo } from "react";
import {
  StarkNotification,
  StarkWorkspaceContext,
  StarkWorkspaceContextValue,
} from "./StarkWorkspaceContext";

export function useStarkWorkspace(): StarkWorkspaceContextValue {
  const context = useContext(StarkWorkspaceContext);
  if (!context) {
    throw new Error("useStarkWorkspace must be used within a StarkWorkspaceProvider");
  }
  return context;
}

export function useSoundConfig() {
  const { state, preset } = useStarkWorkspace();
  const { preferences } = state;
  return useMemo(
    () => ({
      enabled: preferences.soundEnabled && preset.audio.enabled,
      masterVolume: preferences.masterVolume * preset.audio.masterVolume,
      uiSounds: !preferences.uiSoundsMuted,
      ambientEnabled: preferences.ambientEnabled && preset.audio.ambient,
      spatialAudio: preset.audio.spatialAudio,
      maxConcurrentSounds: preset.audio.maxConcurrent,
    }),
    [preferences, preset]
  );
}

export function useBootSequence() {
  const { state, startBoot, completeBoot } = useStarkWorkspace();
  return {
    isBooting: state.isBooting,
    progress: state.bootProgress,
    skipBoot: state.preferences.skipBoot,
    start: startBoot,
    complete: completeBoot,
    shouldShow: !state.isInitialized || state.isBooting,
  };
}

export function useNotifications() {
  const { addNotification, removeNotification, state } = useStarkWorkspace();
  const notify = useCallback(
    (type: StarkNotification["type"], title: string, message: string, duration?: number) => {
      addNotification({ type, title, message, duration });
    },
    [addNotification]
  );
  return { notifications: state.notifications, notify, remove: removeNotification };
}

export default useStarkWorkspace;
