"use client";

/**
 * StarkWorkspaceContext - Central State Provider
 *
 * Manages the entire STARK HUB system state:
 * - Quality tier (auto-detected or manual)
 * - Audio settings
 * - HUD visibility
 * - Performance monitoring
 *
 * "All systems nominal, sir."
 */

import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  STARK_QUALITY_PRESETS,
  StarkQualityPreset,
  StarkQualityTier,
  getNextTierDown,
  getNextTierUp,
} from "../config/StarkQualityPresets";
import {
  DeviceCapabilities,
  useDeviceCapabilities,
} from "../hooks/useDeviceCapabilities";
import { GalionLogger } from "@/utils/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface StarkPreferences {
  // Quality
  qualityTier: StarkQualityTier | "auto";
  manualOverride: boolean;

  // Sound
  soundEnabled: boolean;
  masterVolume: number;
  uiSoundsMuted: boolean;
  ambientEnabled: boolean;

  // HUD
  hudVisible: boolean;
  minimapEnabled: boolean;
  diagnosticsExpanded: boolean;
  compassEnabled: boolean;

  // Boot
  skipBoot: boolean;

  // Timestamps
  lastUpdated: number;
}

export interface PerformanceMetrics {
  fps: number;
  fpsHistory: number[];
  drawCalls: number;
  triangles: number;
  textureMemory: number;
  jsHeap: number;
  lastUpdate: number;
}

export interface StarkWorkspaceState {
  // Core
  isInitialized: boolean;
  isBooting: boolean;
  bootProgress: number;

  // Quality
  activePreset: StarkQualityPreset;
  effectiveTier: StarkQualityTier;
  isAutoQuality: boolean;

  // Device
  deviceCapabilities: DeviceCapabilities | null;

  // Preferences
  preferences: StarkPreferences;

  // Performance
  performance: PerformanceMetrics;

  // UI State
  activePanel: string | null;
  notifications: StarkNotification[];
}

export interface StarkNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
}

// ============================================================================
// ACTIONS
// ============================================================================

type StarkAction =
  | { type: "INITIALIZE" }
  | { type: "SET_BOOTING"; payload: boolean }
  | { type: "SET_BOOT_PROGRESS"; payload: number }
  | { type: "SET_QUALITY_TIER"; payload: StarkQualityTier | "auto" }
  | { type: "SET_DEVICE_CAPABILITIES"; payload: DeviceCapabilities }
  | { type: "UPDATE_PREFERENCES"; payload: Partial<StarkPreferences> }
  | { type: "UPDATE_PERFORMANCE"; payload: Partial<PerformanceMetrics> }
  | { type: "AUTO_ADJUST_QUALITY"; payload: "upgrade" | "downgrade" }
  | { type: "SET_ACTIVE_PANEL"; payload: string | null }
  | {
    type: "ADD_NOTIFICATION";
    payload: Omit<StarkNotification, "id" | "timestamp">;
  }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "TOGGLE_HUD" }
  | { type: "TOGGLE_SOUND" };

// ============================================================================
// DEFAULT STATE
// ============================================================================

const DEFAULT_PREFERENCES: StarkPreferences = {
  qualityTier: "auto",
  manualOverride: false,
  soundEnabled: true,
  masterVolume: 0.5,
  uiSoundsMuted: false,
  ambientEnabled: true,
  hudVisible: true,
  minimapEnabled: true,
  diagnosticsExpanded: false,
  compassEnabled: true,
  skipBoot: false,
  lastUpdated: Date.now(),
};

const DEFAULT_PERFORMANCE: PerformanceMetrics = {
  fps: 60,
  fpsHistory: [],
  drawCalls: 0,
  triangles: 0,
  textureMemory: 0,
  jsHeap: 0,
  lastUpdate: Date.now(),
};

const initialState: StarkWorkspaceState = {
  isInitialized: false,
  isBooting: false,
  bootProgress: 0,
  activePreset: STARK_QUALITY_PRESETS.medium,
  effectiveTier: "medium",
  isAutoQuality: true,
  deviceCapabilities: null,
  preferences: DEFAULT_PREFERENCES,
  performance: DEFAULT_PERFORMANCE,
  activePanel: null,
  notifications: [],
};

// ============================================================================
// REDUCER
// ============================================================================

function starkReducer(
  state: StarkWorkspaceState,
  action: StarkAction
): StarkWorkspaceState {
  switch (action.type) {
    case "INITIALIZE":
      return { ...state, isInitialized: true };

    case "SET_BOOTING":
      return { ...state, isBooting: action.payload };

    case "SET_BOOT_PROGRESS":
      return { ...state, bootProgress: action.payload };

    case "SET_QUALITY_TIER": {
      const isAuto = action.payload === "auto";
      const tier: StarkQualityTier = isAuto
        ? state.deviceCapabilities?.recommendedTier || "medium"
        : (action.payload as StarkQualityTier);

      return {
        ...state,
        effectiveTier: tier,
        activePreset: STARK_QUALITY_PRESETS[tier],
        isAutoQuality: isAuto,
        preferences: {
          ...state.preferences,
          qualityTier: action.payload,
          manualOverride: !isAuto,
          lastUpdated: Date.now(),
        },
      };
    }

    case "SET_DEVICE_CAPABILITIES": {
      const capabilities = action.payload;
      // Auto-adjust quality if in auto mode
      if (state.isAutoQuality) {
        const recommendedTier = capabilities.recommendedTier;
        return {
          ...state,
          deviceCapabilities: capabilities,
          effectiveTier: recommendedTier,
          activePreset: STARK_QUALITY_PRESETS[recommendedTier],
        };
      }
      return { ...state, deviceCapabilities: capabilities };
    }

    case "UPDATE_PREFERENCES":
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
          lastUpdated: Date.now(),
        },
      };

    case "UPDATE_PERFORMANCE": {
      const newPerformance = {
        ...state.performance,
        ...action.payload,
        lastUpdate: Date.now(),
      };

      // Keep FPS history (last 60 samples)
      if (action.payload.fps !== undefined) {
        newPerformance.fpsHistory = [
          ...state.performance.fpsHistory.slice(-59),
          action.payload.fps,
        ];
      }

      return { ...state, performance: newPerformance };
    }

    case "AUTO_ADJUST_QUALITY": {
      if (state.preferences.manualOverride) return state;

      const currentTier = state.effectiveTier;
      const newTier =
        action.payload === "upgrade"
          ? getNextTierUp(currentTier)
          : getNextTierDown(currentTier);

      if (!newTier) return state;

      return {
        ...state,
        effectiveTier: newTier,
        activePreset: STARK_QUALITY_PRESETS[newTier],
        notifications: [
          ...state.notifications,
          {
            id: `quality-${Date.now()}`,
            type: "info",
            title: "Quality Adjusted",
            message: `${action.payload === "upgrade" ? "Upgraded" : "Downgraded"
              } to ${STARK_QUALITY_PRESETS[newTier].name}`,
            timestamp: Date.now(),
            duration: 3000,
          },
        ],
      };
    }

    case "SET_ACTIVE_PANEL":
      return { ...state, activePanel: action.payload };

    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            ...action.payload,
            id: `notif-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            timestamp: Date.now(),
          },
        ],
      };

    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => n.id !== action.payload
        ),
      };

    case "TOGGLE_HUD":
      return {
        ...state,
        preferences: {
          ...state.preferences,
          hudVisible: !state.preferences.hudVisible,
          lastUpdated: Date.now(),
        },
      };

    case "TOGGLE_SOUND":
      return {
        ...state,
        preferences: {
          ...state.preferences,
          soundEnabled: !state.preferences.soundEnabled,
          lastUpdated: Date.now(),
        },
      };

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

export interface StarkWorkspaceContextValue {
  state: StarkWorkspaceState;

  // Actions
  setQualityTier: (tier: StarkQualityTier | "auto") => void;
  updatePreferences: (prefs: Partial<StarkPreferences>) => void;
  updatePerformance: (metrics: Partial<PerformanceMetrics>) => void;
  toggleHUD: () => void;
  toggleSound: () => void;
  setActivePanel: (panel: string | null) => void;
  addNotification: (
    notification: Omit<StarkNotification, "id" | "timestamp">
  ) => void;
  removeNotification: (id: string) => void;
  startBoot: () => void;
  completeBoot: () => void;

  // Computed
  preset: StarkQualityPreset;
  isUltra: boolean;
  isHigh: boolean;
  isMedium: boolean;
  isLight: boolean;
}

export const StarkWorkspaceContext =
  createContext<StarkWorkspaceContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

const STORAGE_KEY = "stark-workspace-preferences";

export function StarkWorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(starkReducer, initialState);
  const deviceCapabilities = useDeviceCapabilities();

  // Refs to prevent duplicate dispatches
  const hasLoadedPreferences = useRef(false);
  const hasSetDeviceCapabilities = useRef(false);
  const hasInitialized = useRef(false);

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasLoadedPreferences.current) return;
    hasLoadedPreferences.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs = JSON.parse(stored) as Partial<StarkPreferences>;
        dispatch({ type: "UPDATE_PREFERENCES", payload: prefs });

        if (prefs.qualityTier && prefs.qualityTier !== "auto") {
          dispatch({ type: "SET_QUALITY_TIER", payload: prefs.qualityTier });
        }
      }
    } catch (e) {
      console.warn("[StarkWorkspace] Failed to load preferences:", e);
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.preferences));
    } catch (e) {
      console.warn("[StarkWorkspace] Failed to save preferences:", e);
    }
  }, [state.preferences]);

  // Update device capabilities - only once when loading completes
  useEffect(() => {
    if (!deviceCapabilities.isLoading && !hasSetDeviceCapabilities.current) {
      hasSetDeviceCapabilities.current = true;
      dispatch({
        type: "SET_DEVICE_CAPABILITIES",
        payload: deviceCapabilities,
      });
    }
  }, [deviceCapabilities.isLoading]);

  // Initialize - only once
  useEffect(() => {
    if (
      !state.isInitialized &&
      !deviceCapabilities.isLoading &&
      !hasInitialized.current
    ) {
      hasInitialized.current = true;
      GalionLogger.info("SYSTEM", "Stark Workspace Context Initialized");
      dispatch({ type: "INITIALIZE" });
    }
  }, [state.isInitialized, deviceCapabilities.isLoading]);

  // Auto-remove notifications
  useEffect(() => {
    const timers = state.notifications
      .filter((n) => n.duration)
      .map((n) =>
        setTimeout(() => {
          dispatch({ type: "REMOVE_NOTIFICATION", payload: n.id });
        }, n.duration)
      );

    return () => timers.forEach(clearTimeout);
  }, [state.notifications]);

  // Actions
  const setQualityTier = useCallback((tier: StarkQualityTier | "auto") => {
    dispatch({ type: "SET_QUALITY_TIER", payload: tier });
  }, []);

  const updatePreferences = useCallback((prefs: Partial<StarkPreferences>) => {
    dispatch({ type: "UPDATE_PREFERENCES", payload: prefs });
  }, []);

  const updatePerformance = useCallback(
    (metrics: Partial<PerformanceMetrics>) => {
      dispatch({ type: "UPDATE_PERFORMANCE", payload: metrics });
    },
    []
  );

  const toggleHUD = useCallback(() => {
    dispatch({ type: "TOGGLE_HUD" });
  }, []);

  const toggleSound = useCallback(() => {
    dispatch({ type: "TOGGLE_SOUND" });
  }, []);

  const setActivePanel = useCallback((panel: string | null) => {
    dispatch({ type: "SET_ACTIVE_PANEL", payload: panel });
  }, []);

  const addNotification = useCallback(
    (notification: Omit<StarkNotification, "id" | "timestamp">) => {
      dispatch({ type: "ADD_NOTIFICATION", payload: notification });
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
  }, []);

  const startBoot = useCallback(() => {
    dispatch({ type: "SET_BOOTING", payload: true });
    dispatch({ type: "SET_BOOT_PROGRESS", payload: 0 });
  }, []);

  const completeBoot = useCallback(() => {
    dispatch({ type: "SET_BOOTING", payload: false });
    dispatch({ type: "SET_BOOT_PROGRESS", payload: 100 });
  }, []);

  // Computed values
  const value = useMemo<StarkWorkspaceContextValue>(
    () => ({
      state,
      setQualityTier,
      updatePreferences,
      updatePerformance,
      toggleHUD,
      toggleSound,
      setActivePanel,
      addNotification,
      removeNotification,
      startBoot,
      completeBoot,
      preset: state.activePreset,
      isUltra: state.effectiveTier === "ultra",
      isHigh: state.effectiveTier === "high",
      isMedium: state.effectiveTier === "medium",
      isLight: state.effectiveTier === "light",
    }),
    [
      state,
      setQualityTier,
      updatePreferences,
      updatePerformance,
      toggleHUD,
      toggleSound,
      setActivePanel,
      addNotification,
      removeNotification,
      startBoot,
      completeBoot,
    ]
  );

  return (
    <StarkWorkspaceContext.Provider value={value}>
      {children}
    </StarkWorkspaceContext.Provider>
  );
}

export default StarkWorkspaceProvider;
