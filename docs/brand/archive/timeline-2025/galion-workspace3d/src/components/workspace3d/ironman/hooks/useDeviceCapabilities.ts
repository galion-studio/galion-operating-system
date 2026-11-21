"use client";

/**
 * Playback stand-in for the ironman device probe.
 * The boot sequence only needs a settled high tier so the workspace
 * provider can leave its loading state. The original hook measured the
 * GPU; that probe is not part of the boot film.
 */

export type StarkQualityTier = "ultra" | "high" | "medium" | "light";

export interface DeviceCapabilities {
  isLoading: boolean;
  recommendedTier: StarkQualityTier;
  accessibility?: { prefersReducedMotion?: boolean };
}

export function useDeviceCapabilities(): DeviceCapabilities {
  return {
    isLoading: false,
    recommendedTier: "high",
    accessibility: { prefersReducedMotion: false },
  };
}
