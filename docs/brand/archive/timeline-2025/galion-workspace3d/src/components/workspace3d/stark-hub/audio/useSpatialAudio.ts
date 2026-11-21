'use client';

/**
 * useSpatialAudio - 3D Positional Audio Hook for STARK HUB
 *
 * Provides spatial audio capabilities using THREE.PositionalAudio.
 * All sounds are procedurally generated - no external audio files needed.
 *
 * Features:
 * - 3D positional audio attached to camera listener
 * - Sound sources at station positions
 * - Distance-based volume falloff
 * - Procedural audio buffer generation
 *
 * "The audio system is calibrated to your position, sir."
 */

import { useRef, useCallback, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================================
// TYPES
// ============================================================================

export interface SpatialSoundOptions {
  volume?: number;
  loop?: boolean;
  refDistance?: number;
  rolloffFactor?: number;
  maxDistance?: number;
  distanceModel?: 'linear' | 'inverse' | 'exponential';
  coneInnerAngle?: number;
  coneOuterAngle?: number;
  coneOuterGain?: number;
}

export interface SpatialSoundSource {
  id: string;
  position: THREE.Vector3;
  audio: THREE.PositionalAudio;
  isPlaying: boolean;
}

export type ProceduralSoundType =
  | 'hum'
  | 'energy_pulse'
  | 'servo_whir'
  | 'data_stream'
  | 'arc_reactor'
  | 'hologram_flicker'
  | 'system_beep'
  | 'power_surge';

// Station positions in the STARK HUB (approximate 3D coordinates)
export const STATION_POSITIONS = {
  jarvisOrb: new THREE.Vector3(0, 2, 0),      // Center, elevated
  suitPlatform: new THREE.Vector3(-5, 0, 2),   // Left side
  dataWall: new THREE.Vector3(5, 1.5, -3),     // Right side, wall
  hotrodCorner: new THREE.Vector3(-4, 0, -6),  // Back left
  workbench: new THREE.Vector3(3, 1, 4),       // Front right
  arcReactor: new THREE.Vector3(0, 0.5, -2),   // Center floor
} as const;

// ============================================================================
// PROCEDURAL AUDIO GENERATOR
// ============================================================================

class ProceduralAudioGenerator {
  private audioContext: AudioContext | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();

  getContext(): AudioContext | null {
    if (!this.audioContext && typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioContext = new AudioContextClass();
      } catch (e) {
        console.warn('[ProceduralAudio] Failed to create AudioContext:', e);
      }
    }
    return this.audioContext;
  }

  async resume(): Promise<void> {
    const ctx = this.getContext();
    if (ctx?.state === 'suspended') {
      await ctx.resume();
    }
  }

  /**
   * Generate a low-frequency hum sound (workshop ambient)
   */
  generateHum(duration: number = 4, baseFreq: number = 60): AudioBuffer | null {
    const cacheKey = `hum_${duration}_${baseFreq}`;
    if (this.bufferCache.has(cacheKey)) {
      return this.bufferCache.get(cacheKey)!;
    }

    const ctx = this.getContext();
    if (!ctx) return null;

    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Multiple harmonics for rich hum
        const fundamental = Math.sin(2 * Math.PI * baseFreq * t) * 0.3;
        const harmonic2 = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.15;
        const harmonic3 = Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.08;
        // Subtle modulation
        const modulation = 1 + 0.1 * Math.sin(2 * Math.PI * 0.5 * t);
        // Channel offset for stereo width
        const channelOffset = channel === 0 ? 0 : 0.002;
        const tOffset = t + channelOffset;
        const offsetMod = Math.sin(2 * Math.PI * 0.3 * tOffset);

        data[i] = (fundamental + harmonic2 + harmonic3) * modulation * (1 + offsetMod * 0.05);
      }
    }

    this.bufferCache.set(cacheKey, buffer);
    return buffer;
  }

  /**
   * Generate an energy pulse sound (arc reactor)
   */
  generateEnergyPulse(duration: number = 2): AudioBuffer | null {
    const cacheKey = `energy_pulse_${duration}`;
    if (this.bufferCache.has(cacheKey)) {
      return this.bufferCache.get(cacheKey)!;
    }

    const ctx = this.getContext();
    if (!ctx) return null;

    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const phase = (t % 1) * 2 * Math.PI;

        // Pulsing synth tone
        const pulse = Math.sin(phase * 100) * Math.pow(Math.sin(phase * 0.5), 2);
        // High frequency shimmer
        const shimmer = Math.sin(2 * Math.PI * 2000 * t + Math.sin(2 * Math.PI * 5 * t) * 200) * 0.1;
        // Low rumble
        const rumble = Math.sin(2 * Math.PI * 40 * t) * 0.2;

        data[i] = (pulse * 0.3 + shimmer + rumble) * 0.5;
      }
    }

    this.bufferCache.set(cacheKey, buffer);
    return buffer;
  }

  /**
   * Generate servo/mechanical whir sound
   */
  generateServoWhir(duration: number = 3): AudioBuffer | null {
    const cacheKey = `servo_whir_${duration}`;
    if (this.bufferCache.has(cacheKey)) {
      return this.bufferCache.get(cacheKey)!;
    }

    const ctx = this.getContext();
    if (!ctx) return null;

    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Multiple oscillating frequencies
        const freq1 = 400 + Math.sin(2 * Math.PI * 2 * t) * 50;
        const freq2 = 800 + Math.sin(2 * Math.PI * 3 * t) * 100;
        const freq3 = 1200 + Math.sin(2 * Math.PI * 5 * t) * 150;

        const wave1 = Math.sin(2 * Math.PI * freq1 * t) * 0.2;
        const wave2 = Math.sin(2 * Math.PI * freq2 * t) * 0.1;
        const wave3 = Math.sin(2 * Math.PI * freq3 * t) * 0.05;

        data[i] = (wave1 + wave2 + wave3) * 0.4;
      }
    }

    this.bufferCache.set(cacheKey, buffer);
    return buffer;
  }

  /**
   * Generate data stream sound (computer processing)
   */
  generateDataStream(duration: number = 4): AudioBuffer | null {
    const cacheKey = `data_stream_${duration}`;
    if (this.bufferCache.has(cacheKey)) {
      return this.bufferCache.get(cacheKey)!;
    }

    const ctx = this.getContext();
    if (!ctx) return null;

    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);

    // Use seeded random for consistent generation
    let seed = 12345;
    const seededRandom = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;

        // Random clicking/beeping pattern
        const beepPhase = (t * 15) % 1;
        const beepGate = beepPhase < 0.1 ? 1 : 0;
        const beepFreq = 1000 + seededRandom() * 2000;
        const beep = Math.sin(2 * Math.PI * beepFreq * t) * beepGate * 0.15;

        // Subtle white noise (data transfer)
        const noise = (seededRandom() - 0.5) * 0.05;

        // Rhythmic pulse
        const pulsePhase = (t * 4) % 1;
        const pulse = Math.sin(2 * Math.PI * 800 * t) * Math.pow(Math.sin(pulsePhase * Math.PI), 4) * 0.1;

        data[i] = beep + noise + pulse;
      }
    }

    this.bufferCache.set(cacheKey, buffer);
    return buffer;
  }

  /**
   * Generate arc reactor core sound
   */
  generateArcReactor(duration: number = 5): AudioBuffer | null {
    const cacheKey = `arc_reactor_${duration}`;
    if (this.bufferCache.has(cacheKey)) {
      return this.bufferCache.get(cacheKey)!;
    }

    const ctx = this.getContext();
    if (!ctx) return null;

    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;

        // Deep resonant core hum
        const core = Math.sin(2 * Math.PI * 50 * t) * 0.3;

        // Energy crackling (modulated high frequency)
        const crackle = Math.sin(2 * Math.PI * 3000 * t) *
          Math.pow(Math.sin(2 * Math.PI * 7 * t), 4) * 0.1;

        // Plasma oscillation
        const plasma = Math.sin(2 * Math.PI * 200 * t + Math.sin(2 * Math.PI * 2 * t) * 50) * 0.15;

        // Heartbeat-like pulse
        const heartbeat = Math.pow(Math.sin(2 * Math.PI * 1.2 * t), 8) *
          Math.sin(2 * Math.PI * 80 * t) * 0.2;

        data[i] = (core + crackle + plasma + heartbeat) * 0.5;
      }
    }

    this.bufferCache.set(cacheKey, buffer);
    return buffer;
  }

  /**
   * Generate hologram flicker sound
   */
  generateHologramFlicker(duration: number = 2): AudioBuffer | null {
    const cacheKey = `hologram_flicker_${duration}`;
    if (this.bufferCache.has(cacheKey)) {
      return this.bufferCache.get(cacheKey)!;
    }

    const ctx = this.getContext();
    if (!ctx) return null;

    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;

        // High frequency buzz
        const buzz = Math.sin(2 * Math.PI * 4000 * t) * 0.05;

        // Flickering modulation
        const flicker = Math.sin(2 * Math.PI * 800 * t) *
          (0.5 + 0.5 * Math.sin(2 * Math.PI * 20 * t)) * 0.1;

        // Electric hum
        const hum = Math.sin(2 * Math.PI * 120 * t) * 0.1;

        data[i] = (buzz + flicker + hum) * 0.6;
      }
    }

    this.bufferCache.set(cacheKey, buffer);
    return buffer;
  }

  /**
   * Generate system beep sequence
   */
  generateSystemBeep(duration: number = 1): AudioBuffer | null {
    const cacheKey = `system_beep_${duration}`;
    if (this.bufferCache.has(cacheKey)) {
      return this.bufferCache.get(cacheKey)!;
    }

    const ctx = this.getContext();
    if (!ctx) return null;

    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const phase = t / duration;

        // Multiple beeps at different intervals
        const beep1 = phase < 0.1 ? Math.sin(2 * Math.PI * 880 * t) * 0.3 : 0;
        const beep2 = (phase > 0.2 && phase < 0.3) ? Math.sin(2 * Math.PI * 1100 * t) * 0.25 : 0;
        const beep3 = (phase > 0.4 && phase < 0.5) ? Math.sin(2 * Math.PI * 1320 * t) * 0.2 : 0;

        data[i] = beep1 + beep2 + beep3;
      }
    }

    this.bufferCache.set(cacheKey, buffer);
    return buffer;
  }

  /**
   * Generate power surge sound
   */
  generatePowerSurge(duration: number = 1.5): AudioBuffer | null {
    const cacheKey = `power_surge_${duration}`;
    if (this.bufferCache.has(cacheKey)) {
      return this.bufferCache.get(cacheKey)!;
    }

    const ctx = this.getContext();
    if (!ctx) return null;

    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const phase = t / duration;

        // Rising frequency sweep
        const freq = 100 + phase * 2000;
        const sweep = Math.sin(2 * Math.PI * freq * t) * (1 - phase) * 0.3;

        // Crackling overlay
        const crackle = Math.sin(2 * Math.PI * 5000 * t) *
          Math.pow(Math.sin(2 * Math.PI * 30 * t), 2) * phase * 0.2;

        // Low bass punch
        const bass = Math.sin(2 * Math.PI * 60 * t) * Math.exp(-t * 2) * 0.4;

        data[i] = sweep + crackle + bass;
      }
    }

    this.bufferCache.set(cacheKey, buffer);
    return buffer;
  }

  getBuffer(type: ProceduralSoundType): AudioBuffer | null {
    switch (type) {
      case 'hum': return this.generateHum();
      case 'energy_pulse': return this.generateEnergyPulse();
      case 'servo_whir': return this.generateServoWhir();
      case 'data_stream': return this.generateDataStream();
      case 'arc_reactor': return this.generateArcReactor();
      case 'hologram_flicker': return this.generateHologramFlicker();
      case 'system_beep': return this.generateSystemBeep();
      case 'power_surge': return this.generatePowerSurge();
      default: return null;
    }
  }

  dispose(): void {
    this.bufferCache.clear();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// ============================================================================
// SINGLETON GENERATOR
// ============================================================================

let generatorInstance: ProceduralAudioGenerator | null = null;

function getGenerator(): ProceduralAudioGenerator {
  if (!generatorInstance) {
    generatorInstance = new ProceduralAudioGenerator();
  }
  return generatorInstance;
}

// ============================================================================
// SPATIAL AUDIO HOOK
// ============================================================================

export function useSpatialAudio() {
  const { camera } = useThree();

  const listenerRef = useRef<THREE.AudioListener | null>(null);
  const sourcesRef = useRef<Map<string, SpatialSoundSource>>(new Map());
  const isInitializedRef = useRef(false);

  // Initialize audio listener on camera
  useEffect(() => {
    if (isInitializedRef.current) return;
    if (typeof window === 'undefined') return;

    const listener = new THREE.AudioListener();
    camera.add(listener);
    listenerRef.current = listener;
    isInitializedRef.current = true;

    // Resume audio context on user interaction
    const resumeAudio = async () => {
      await getGenerator().resume();
      if (listener.context.state === 'suspended') {
        await listener.context.resume();
      }
    };

    const events = ['click', 'keydown', 'touchstart', 'mousedown'];
    events.forEach(event => {
      window.addEventListener(event, resumeAudio, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resumeAudio);
      });

      // Cleanup all sources
      sourcesRef.current.forEach(source => {
        if (source.audio.isPlaying) {
          source.audio.stop();
        }
        source.audio.disconnect();
      });
      sourcesRef.current.clear();

      // Remove listener from camera
      if (listenerRef.current) {
        camera.remove(listenerRef.current);
        listenerRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [camera]);

  /**
   * Create a positional audio source at a given position
   */
  const createSource = useCallback((
    id: string,
    position: THREE.Vector3 | [number, number, number],
    soundType: ProceduralSoundType,
    options: SpatialSoundOptions = {}
  ): SpatialSoundSource | null => {
    if (!listenerRef.current) return null;

    const generator = getGenerator();
    const buffer = generator.getBuffer(soundType);
    if (!buffer) return null;

    // Remove existing source with same ID
    const existingSource = sourcesRef.current.get(id);
    if (existingSource) {
      if (existingSource.audio.isPlaying) {
        existingSource.audio.stop();
      }
      existingSource.audio.disconnect();
    }

    const audio = new THREE.PositionalAudio(listenerRef.current);
    audio.setBuffer(buffer);
    audio.setRefDistance(options.refDistance ?? 2);
    audio.setRolloffFactor(options.rolloffFactor ?? 1);
    audio.setMaxDistance(options.maxDistance ?? 50);
    audio.setDistanceModel(options.distanceModel ?? 'inverse');
    audio.setVolume(options.volume ?? 0.5);
    audio.setLoop(options.loop ?? false);

    // Set directional properties if specified
    if (options.coneInnerAngle !== undefined) {
      audio.setDirectionalCone(
        options.coneInnerAngle,
        options.coneOuterAngle ?? 360,
        options.coneOuterGain ?? 0
      );
    }

    const pos = Array.isArray(position) ? new THREE.Vector3(...position) : position;
    audio.position.copy(pos);

    const source: SpatialSoundSource = {
      id,
      position: pos.clone(),
      audio,
      isPlaying: false,
    };

    sourcesRef.current.set(id, source);
    return source;
  }, []);

  /**
   * Play a spatial sound at a position
   */
  const playSpatialSound = useCallback((
    id: string,
    position: THREE.Vector3 | [number, number, number],
    soundType: ProceduralSoundType,
    options: SpatialSoundOptions = {}
  ): void => {
    const source = createSource(id, position, soundType, options);
    if (!source) return;

    try {
      if (!source.audio.isPlaying) {
        source.audio.play();
        source.isPlaying = true;
      }
    } catch (e) {
      console.warn('[SpatialAudio] Failed to play sound:', e);
    }
  }, [createSource]);

  /**
   * Stop a specific spatial sound
   */
  const stopSpatialSound = useCallback((id: string): void => {
    const source = sourcesRef.current.get(id);
    if (source && source.audio.isPlaying) {
      source.audio.stop();
      source.isPlaying = false;
    }
  }, []);

  /**
   * Stop all spatial sounds
   */
  const stopAllSpatialSounds = useCallback((): void => {
    sourcesRef.current.forEach(source => {
      if (source.audio.isPlaying) {
        source.audio.stop();
        source.isPlaying = false;
      }
    });
  }, []);

  /**
   * Update the position of an existing source
   */
  const updateSourcePosition = useCallback((
    id: string,
    newPosition: THREE.Vector3 | [number, number, number]
  ): void => {
    const source = sourcesRef.current.get(id);
    if (source) {
      const pos = Array.isArray(newPosition) ? new THREE.Vector3(...newPosition) : newPosition;
      source.position.copy(pos);
      source.audio.position.copy(pos);
    }
  }, []);

  /**
   * Set volume for a specific source
   */
  const setSourceVolume = useCallback((id: string, volume: number): void => {
    const source = sourcesRef.current.get(id);
    if (source) {
      source.audio.setVolume(Math.max(0, Math.min(1, volume)));
    }
  }, []);

  /**
   * Get the audio listener (for external use)
   */
  const getListener = useCallback((): THREE.AudioListener | null => {
    return listenerRef.current;
  }, []);

  /**
   * Check if a source is currently playing
   */
  const isPlaying = useCallback((id: string): boolean => {
    const source = sourcesRef.current.get(id);
    return source?.audio.isPlaying ?? false;
  }, []);

  /**
   * Get all active source IDs
   */
  const getActiveSources = useCallback((): string[] => {
    return Array.from(sourcesRef.current.keys()).filter(id => {
      const source = sourcesRef.current.get(id);
      return source?.audio.isPlaying;
    });
  }, []);

  // Memoized station positions for easy access
  const stationPositions = useMemo(() => STATION_POSITIONS, []);

  return {
    // Core functions
    createSource,
    playSpatialSound,
    stopSpatialSound,
    stopAllSpatialSounds,
    updateSourcePosition,
    setSourceVolume,
    getListener,

    // Utility functions
    isPlaying,
    getActiveSources,

    // Constants
    stationPositions,
  };
}

export default useSpatialAudio;
