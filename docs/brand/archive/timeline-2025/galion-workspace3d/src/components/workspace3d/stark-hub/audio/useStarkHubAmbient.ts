'use client';

/**
 * useStarkHubAmbient - Procedural Ambient Sound System for STARK HUB
 *
 * Creates immersive background soundscape using only Web Audio API.
 * No external audio files required - everything is synthesized in real-time.
 *
 * Ambient Layers:
 * - Workshop hum (low-frequency drone)
 * - Arc reactor energy (pulsing synth)
 * - Computer processing (subtle beeps and clicks)
 * - Air circulation (filtered white noise)
 *
 * "The workshop ambiance is set to optimal levels, sir."
 */

import { useRef, useCallback, useEffect, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface AmbientLayerConfig {
  enabled: boolean;
  volume: number;
}

export interface AmbientConfig {
  workshopHum: AmbientLayerConfig;
  arcReactorEnergy: AmbientLayerConfig;
  computerProcessing: AmbientLayerConfig;
  airCirculation: AmbientLayerConfig;
}

export interface AmbientState {
  isPlaying: boolean;
  isInitialized: boolean;
  masterVolume: number;
  config: AmbientConfig;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: AmbientConfig = {
  workshopHum: { enabled: true, volume: 0.15 },
  arcReactorEnergy: { enabled: true, volume: 0.1 },
  computerProcessing: { enabled: true, volume: 0.08 },
  airCirculation: { enabled: true, volume: 0.12 },
};

// ============================================================================
// AMBIENT ENGINE CLASS
// ============================================================================

class AmbientEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Layer nodes
  private workshopHumOsc: OscillatorNode | null = null;
  private workshopHumGain: GainNode | null = null;
  private workshopHumOsc2: OscillatorNode | null = null;
  private workshopHumOsc3: OscillatorNode | null = null;

  private arcReactorOsc: OscillatorNode | null = null;
  private arcReactorGain: GainNode | null = null;
  private arcReactorLFO: OscillatorNode | null = null;
  private arcReactorLFOGain: GainNode | null = null;

  private processingInterval: number | null = null;
  private processingGain: GainNode | null = null;

  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;

  private isPlaying = false;
  private masterVolume = 0.3;
  private config: AmbientConfig = DEFAULT_CONFIG;

  async initialize(): Promise<boolean> {
    if (this.audioContext) return true;

    try {
      const AudioContextClass = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.audioContext.destination);
      return true;
    } catch (e) {
      console.warn('[AmbientEngine] Failed to initialize:', e);
      return false;
    }
  }

  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Workshop Hum - Low frequency drone with harmonics
   */
  private createWorkshopHum(): void {
    if (!this.audioContext || !this.masterGain) return;

    this.workshopHumGain = this.audioContext.createGain();
    this.workshopHumGain.gain.value = this.config.workshopHum.enabled
      ? this.config.workshopHum.volume : 0;
    this.workshopHumGain.connect(this.masterGain);

    // Fundamental hum at 60Hz (electrical frequency)
    this.workshopHumOsc = this.audioContext.createOscillator();
    this.workshopHumOsc.type = 'sine';
    this.workshopHumOsc.frequency.value = 60;

    const humGain1 = this.audioContext.createGain();
    humGain1.gain.value = 0.4;
    this.workshopHumOsc.connect(humGain1);
    humGain1.connect(this.workshopHumGain);

    // Second harmonic at 120Hz
    this.workshopHumOsc2 = this.audioContext.createOscillator();
    this.workshopHumOsc2.type = 'sine';
    this.workshopHumOsc2.frequency.value = 120;

    const humGain2 = this.audioContext.createGain();
    humGain2.gain.value = 0.2;
    this.workshopHumOsc2.connect(humGain2);
    humGain2.connect(this.workshopHumGain);

    // Third harmonic at 180Hz
    this.workshopHumOsc3 = this.audioContext.createOscillator();
    this.workshopHumOsc3.type = 'sine';
    this.workshopHumOsc3.frequency.value = 180;

    const humGain3 = this.audioContext.createGain();
    humGain3.gain.value = 0.1;
    this.workshopHumOsc3.connect(humGain3);
    humGain3.connect(this.workshopHumGain);

    // Add subtle modulation using LFO
    const lfo = this.audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; // Very slow modulation

    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = 2; // Subtle pitch variation

    lfo.connect(lfoGain);
    lfoGain.connect(this.workshopHumOsc.frequency);

    this.workshopHumOsc.start();
    this.workshopHumOsc2.start();
    this.workshopHumOsc3.start();
    lfo.start();
  }

  /**
   * Arc Reactor Energy - Pulsing synth with modulation
   */
  private createArcReactorEnergy(): void {
    if (!this.audioContext || !this.masterGain) return;

    this.arcReactorGain = this.audioContext.createGain();
    this.arcReactorGain.gain.value = this.config.arcReactorEnergy.enabled
      ? this.config.arcReactorEnergy.volume : 0;
    this.arcReactorGain.connect(this.masterGain);

    // Main oscillator with soft tone
    this.arcReactorOsc = this.audioContext.createOscillator();
    this.arcReactorOsc.type = 'sine';
    this.arcReactorOsc.frequency.value = 80; // Low bass frequency

    // Create a filter for warmth
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 1;

    this.arcReactorOsc.connect(filter);
    filter.connect(this.arcReactorGain);

    // Amplitude modulation (pulsing effect)
    this.arcReactorLFO = this.audioContext.createOscillator();
    this.arcReactorLFO.type = 'sine';
    this.arcReactorLFO.frequency.value = 1.2; // Heartbeat-like rhythm

    this.arcReactorLFOGain = this.audioContext.createGain();
    this.arcReactorLFOGain.gain.value = 0.3; // Modulation depth

    this.arcReactorLFO.connect(this.arcReactorLFOGain);
    this.arcReactorLFOGain.connect(this.arcReactorGain.gain);

    // Add second oscillator for richness
    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 160; // Octave up
    const osc2Gain = this.audioContext.createGain();
    osc2Gain.gain.value = 0.15;
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);

    // Add subtle high frequency shimmer
    const shimmer = this.audioContext.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.value = 2000;
    const shimmerGain = this.audioContext.createGain();
    shimmerGain.gain.value = 0.02;

    // Modulate shimmer amplitude
    const shimmerLFO = this.audioContext.createOscillator();
    shimmerLFO.type = 'sine';
    shimmerLFO.frequency.value = 3;
    const shimmerLFOGain = this.audioContext.createGain();
    shimmerLFOGain.gain.value = 0.02;

    shimmer.connect(shimmerGain);
    shimmerLFO.connect(shimmerLFOGain);
    shimmerLFOGain.connect(shimmerGain.gain);
    shimmerGain.connect(this.arcReactorGain);

    this.arcReactorOsc.start();
    this.arcReactorLFO.start();
    osc2.start();
    shimmer.start();
    shimmerLFO.start();
  }

  /**
   * Computer Processing - Random beeps and clicks
   */
  private createComputerProcessing(): void {
    if (!this.audioContext || !this.masterGain) return;

    this.processingGain = this.audioContext.createGain();
    this.processingGain.gain.value = this.config.computerProcessing.enabled
      ? this.config.computerProcessing.volume : 0;
    this.processingGain.connect(this.masterGain);

    // Generate random beeps at intervals
    const generateBeep = () => {
      if (!this.audioContext || !this.processingGain || !this.isPlaying) return;

      // Random chance to play a beep
      if (Math.random() < 0.3) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        // Random frequency selection (musical beeps)
        const frequencies = [800, 1000, 1200, 1400, 1600, 2000, 2400];
        osc.frequency.value = frequencies[Math.floor(Math.random() * frequencies.length)];
        osc.type = 'sine';

        const duration = 0.05 + Math.random() * 0.1;
        const now = this.audioContext.currentTime;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.6, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(this.processingGain);

        osc.start(now);
        osc.stop(now + duration + 0.05);
      }

      // Schedule next potential beep
      const nextDelay = 200 + Math.random() * 600;
      this.processingInterval = window.setTimeout(generateBeep, nextDelay);
    };

    // Start the beep generation
    this.processingInterval = window.setTimeout(generateBeep, 1000);
  }

  /**
   * Air Circulation - Filtered white noise
   */
  private createAirCirculation(): void {
    if (!this.audioContext || !this.masterGain) return;

    this.noiseGain = this.audioContext.createGain();
    this.noiseGain.gain.value = this.config.airCirculation.enabled
      ? this.config.airCirculation.volume : 0;
    this.noiseGain.connect(this.masterGain);

    // Create band-pass filter for air-like sound
    this.noiseFilter = this.audioContext.createBiquadFilter();
    this.noiseFilter.type = 'bandpass';
    this.noiseFilter.frequency.value = 800;
    this.noiseFilter.Q.value = 0.5;
    this.noiseFilter.connect(this.noiseGain);

    // Add low-pass for softness
    const lpFilter = this.audioContext.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.value = 2000;
    lpFilter.connect(this.noiseFilter);

    // Create white noise buffer
    const bufferSize = this.audioContext.sampleRate * 4; // 4 seconds
    const noiseBuffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = noiseBuffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        // Pink-ish noise (weighted towards lower frequencies)
        const white = Math.random() * 2 - 1;
        // Simple pink noise approximation
        data[i] = white * 0.5;
      }
    }

    this.noiseSource = this.audioContext.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;
    this.noiseSource.connect(lpFilter);
    this.noiseSource.start();

    // Add subtle modulation to air flow
    const modulationLFO = this.audioContext.createOscillator();
    modulationLFO.type = 'sine';
    modulationLFO.frequency.value = 0.2;

    const modulationGain = this.audioContext.createGain();
    modulationGain.gain.value = 200;

    modulationLFO.connect(modulationGain);
    modulationGain.connect(this.noiseFilter.frequency);
    modulationLFO.start();
  }

  /**
   * Start all ambient layers
   */
  start(): void {
    if (this.isPlaying || !this.audioContext) return;

    this.createWorkshopHum();
    this.createArcReactorEnergy();
    this.createComputerProcessing();
    this.createAirCirculation();

    this.isPlaying = true;
  }

  /**
   * Stop all ambient layers
   */
  stop(): void {
    if (!this.isPlaying) return;

    // Stop oscillators
    if (this.workshopHumOsc) {
      this.workshopHumOsc.stop();
      this.workshopHumOsc = null;
    }
    if (this.workshopHumOsc2) {
      this.workshopHumOsc2.stop();
      this.workshopHumOsc2 = null;
    }
    if (this.workshopHumOsc3) {
      this.workshopHumOsc3.stop();
      this.workshopHumOsc3 = null;
    }

    if (this.arcReactorOsc) {
      this.arcReactorOsc.stop();
      this.arcReactorOsc = null;
    }
    if (this.arcReactorLFO) {
      this.arcReactorLFO.stop();
      this.arcReactorLFO = null;
    }

    if (this.processingInterval) {
      clearTimeout(this.processingInterval);
      this.processingInterval = null;
    }

    if (this.noiseSource) {
      this.noiseSource.stop();
      this.noiseSource = null;
    }

    // Disconnect gains
    this.workshopHumGain?.disconnect();
    this.workshopHumGain = null;

    this.arcReactorGain?.disconnect();
    this.arcReactorGain = null;

    this.processingGain?.disconnect();
    this.processingGain = null;

    this.noiseGain?.disconnect();
    this.noiseGain = null;

    this.noiseFilter?.disconnect();
    this.noiseFilter = null;

    this.isPlaying = false;
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  /**
   * Update layer configuration
   */
  setLayerConfig(layer: keyof AmbientConfig, config: AmbientLayerConfig): void {
    this.config[layer] = config;

    // Update gain nodes in real-time
    switch (layer) {
      case 'workshopHum':
        if (this.workshopHumGain) {
          this.workshopHumGain.gain.value = config.enabled ? config.volume : 0;
        }
        break;
      case 'arcReactorEnergy':
        if (this.arcReactorGain) {
          this.arcReactorGain.gain.value = config.enabled ? config.volume : 0;
        }
        break;
      case 'computerProcessing':
        if (this.processingGain) {
          this.processingGain.gain.value = config.enabled ? config.volume : 0;
        }
        break;
      case 'airCirculation':
        if (this.noiseGain) {
          this.noiseGain.gain.value = config.enabled ? config.volume : 0;
        }
        break;
    }
  }

  /**
   * Enable/disable a specific layer
   */
  setLayerEnabled(layer: keyof AmbientConfig, enabled: boolean): void {
    const currentConfig = this.config[layer];
    this.setLayerConfig(layer, { ...currentConfig, enabled });
  }

  /**
   * Set volume for a specific layer
   */
  setLayerVolume(layer: keyof AmbientConfig, volume: number): void {
    const currentConfig = this.config[layer];
    this.setLayerConfig(layer, { ...currentConfig, volume: Math.max(0, Math.min(1, volume)) });
  }

  /**
   * Get current state
   */
  getState(): AmbientState {
    return {
      isPlaying: this.isPlaying,
      isInitialized: !!this.audioContext,
      masterVolume: this.masterVolume,
      config: { ...this.config },
    };
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.stop();
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let ambientEngineInstance: AmbientEngine | null = null;

function getAmbientEngine(): AmbientEngine {
  if (!ambientEngineInstance) {
    ambientEngineInstance = new AmbientEngine();
  }
  return ambientEngineInstance;
}

// ============================================================================
// HOOK
// ============================================================================

export function useStarkHubAmbient() {
  const engineRef = useRef<AmbientEngine | null>(null);
  const [state, setState] = useState<AmbientState>({
    isPlaying: false,
    isInitialized: false,
    masterVolume: 0.3,
    config: DEFAULT_CONFIG,
  });

  // Initialize on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const engine = getAmbientEngine();
    engineRef.current = engine;

    // Set up user interaction listener for audio context resume
    const initOnInteraction = async () => {
      if (engineRef.current) {
        await engineRef.current.initialize();
        await engineRef.current.resume();
        setState(engineRef.current.getState());
      }
    };

    const events = ['click', 'keydown', 'touchstart', 'mousedown'];
    events.forEach(event => {
      window.addEventListener(event, initOnInteraction, { once: true, passive: true });
    });

    // Get initial state
    setState(engine.getState());

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, initOnInteraction);
      });
    };
  }, []);

  /**
   * Start ambient sounds
   */
  const start = useCallback(async () => {
    if (!engineRef.current) return;

    await engineRef.current.initialize();
    await engineRef.current.resume();
    engineRef.current.start();
    setState(engineRef.current.getState());
  }, []);

  /**
   * Stop ambient sounds
   */
  const stop = useCallback(() => {
    if (!engineRef.current) return;

    engineRef.current.stop();
    setState(engineRef.current.getState());
  }, []);

  /**
   * Toggle ambient sounds
   */
  const toggle = useCallback(async () => {
    if (!engineRef.current) return;

    const currentState = engineRef.current.getState();
    if (currentState.isPlaying) {
      stop();
    } else {
      await start();
    }
  }, [start, stop]);

  /**
   * Set master volume (0-1)
   */
  const setMasterVolume = useCallback((volume: number) => {
    if (!engineRef.current) return;

    engineRef.current.setMasterVolume(volume);
    setState(engineRef.current.getState());
  }, []);

  /**
   * Enable/disable a layer
   */
  const setLayerEnabled = useCallback((layer: keyof AmbientConfig, enabled: boolean) => {
    if (!engineRef.current) return;

    engineRef.current.setLayerEnabled(layer, enabled);
    setState(engineRef.current.getState());
  }, []);

  /**
   * Set volume for a layer (0-1)
   */
  const setLayerVolume = useCallback((layer: keyof AmbientConfig, volume: number) => {
    if (!engineRef.current) return;

    engineRef.current.setLayerVolume(layer, volume);
    setState(engineRef.current.getState());
  }, []);

  /**
   * Configure a layer
   */
  const setLayerConfig = useCallback((layer: keyof AmbientConfig, config: AmbientLayerConfig) => {
    if (!engineRef.current) return;

    engineRef.current.setLayerConfig(layer, config);
    setState(engineRef.current.getState());
  }, []);

  return {
    // State
    state,
    isPlaying: state.isPlaying,
    isInitialized: state.isInitialized,

    // Controls
    start,
    stop,
    toggle,
    setMasterVolume,

    // Layer controls
    setLayerEnabled,
    setLayerVolume,
    setLayerConfig,

    // Layer shortcuts
    workshopHum: {
      enabled: state.config.workshopHum.enabled,
      volume: state.config.workshopHum.volume,
      setEnabled: (enabled: boolean) => setLayerEnabled('workshopHum', enabled),
      setVolume: (volume: number) => setLayerVolume('workshopHum', volume),
    },
    arcReactorEnergy: {
      enabled: state.config.arcReactorEnergy.enabled,
      volume: state.config.arcReactorEnergy.volume,
      setEnabled: (enabled: boolean) => setLayerEnabled('arcReactorEnergy', enabled),
      setVolume: (volume: number) => setLayerVolume('arcReactorEnergy', volume),
    },
    computerProcessing: {
      enabled: state.config.computerProcessing.enabled,
      volume: state.config.computerProcessing.volume,
      setEnabled: (enabled: boolean) => setLayerEnabled('computerProcessing', enabled),
      setVolume: (volume: number) => setLayerVolume('computerProcessing', volume),
    },
    airCirculation: {
      enabled: state.config.airCirculation.enabled,
      volume: state.config.airCirculation.volume,
      setEnabled: (enabled: boolean) => setLayerEnabled('airCirculation', enabled),
      setVolume: (volume: number) => setLayerVolume('airCirculation', volume),
    },
  };
}

export default useStarkHubAmbient;
