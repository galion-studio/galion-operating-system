'use client';

/**
 * useStarkHubSounds - HUD Sound Effects Hook
 *
 * Web Audio API synthesized sounds for STARK HUB - no external audio files needed!
 * Authentic sci-fi HUD sounds using oscillators, filters, and envelopes.
 *
 * Sound Categories:
 * - UI Sounds (hover, click, confirm, cancel, error, warning, panels, boot, notifications, voice)
 * - Ambient sounds (hum, energy, processing)
 * - Movement sounds (footstep, fly start/loop/stop)
 * - Transition sounds (station focus, camera whoosh, mode switch)
 *
 * Features:
 * - Auto-resume AudioContext on any user interaction
 * - Throttled sound playback to prevent audio spam
 * - Looping sound support with cleanup
 *
 * "The suit is talking to me."
 */

import { useCallback, useRef, useEffect, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type SoundType =
  // UI Sounds
  | 'hover'
  | 'click'
  | 'confirm'
  | 'cancel'
  | 'error'
  | 'warning'
  | 'panelOpen'
  | 'panelClose'
  | 'bootStart'
  | 'bootComplete'
  | 'notification'
  | 'voiceStart'
  | 'voiceEnd'
  // Movement sounds (legacy)
  | 'moveStart'
  | 'moveEnd'
  | 'cameraRotate'
  // Ambient sounds
  | 'ambient_hum'
  | 'ambient_energy'
  | 'ambient_processing'
  // Movement sounds (new)
  | 'footstep'
  | 'fly_start'
  | 'fly_loop'
  | 'fly_stop'
  // Transition sounds
  | 'stationFocus'
  | 'station_focus'
  | 'camera_whoosh'
  | 'modeSwitch'
  | 'transition'
  | 'boot';

interface SoundConfig {
  volume?: number;
  detune?: number;
}

// ============================================================================
// SOUND BANK CLASS
// ============================================================================

class StarkHubSoundBank {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;
  private masterVolume = 0.5;
  private lastPlayTime: Record<string, number> = {};
  private minInterval = 50; // Minimum ms between same sound plays

  // Active looping sounds
  private activeLoops: Map<string, { nodes: AudioNode[]; oscillators: OscillatorNode[] }> = new Map();

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (typeof window === 'undefined') return false;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) {
        console.warn('[StarkHubSounds] AudioContext not supported');
        return false;
      }

      this.audioContext = new AudioContextClass();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.audioContext.destination);
      this.isInitialized = true;

      console.log('[StarkHubSounds] Initialized successfully');
      return true;
    } catch (e) {
      console.warn('[StarkHubSounds] Failed to initialize:', e);
      return false;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.audioContext !== null;
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn('[StarkHubSounds] Failed to resume audio context:', e);
      }
    }
  }

  // Throttle repeated sounds
  private canPlay(soundId: string): boolean {
    const now = Date.now();
    const lastTime = this.lastPlayTime[soundId] || 0;
    if (now - lastTime < this.minInterval) {
      return false;
    }
    this.lastPlayTime[soundId] = now;
    return true;
  }

  private createOscillator(
    freq: number,
    type: OscillatorType,
    duration: number,
    volume: number = 0.5,
    detune: number = 0
  ): OscillatorNode | null {
    if (!this.audioContext || !this.masterGain) return null;

    this.resume();

    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;

      const now = this.audioContext.currentTime;
      const safeVolume = Number.isFinite(volume) ? Math.max(0, volume) : 0;
      const safeDuration = Number.isFinite(duration) ? Math.max(0.01, duration) : 0.1;

      if (safeVolume > 0 && safeDuration > 0) {
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(safeVolume, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + safeDuration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + safeDuration + 0.1);

        return osc;
      }
    } catch (err) {
      console.warn('[StarkHubSounds] Oscillator Error:', err);
    }

    return null;
  }

  private createSweep(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3
  ): void {
    if (!this.audioContext || !this.masterGain) return;

    this.resume();

    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = type;

      const now = this.audioContext.currentTime;
      const safeVolume = Number.isFinite(volume) ? Math.max(0, volume) : 0;
      const safeDuration = Number.isFinite(duration) ? Math.max(0.01, duration) : 0.1;
      const safeStartFreq = Number.isFinite(startFreq) && startFreq > 0 ? startFreq : 440;
      const safeEndFreq = Number.isFinite(endFreq) && endFreq > 0 ? endFreq : 440;

      if (safeVolume > 0) {
        osc.frequency.setValueAtTime(safeStartFreq, now);
        osc.frequency.exponentialRampToValueAtTime(safeEndFreq, now + safeDuration);

        gain.gain.setValueAtTime(safeVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + safeDuration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + safeDuration + 0.1);
      }
    } catch (err) {
      console.warn('[StarkHubSounds] Sweep Error:', err);
    }
  }

  // ============================================================================
  // UI SOUNDS
  // ============================================================================

  playHover(config?: SoundConfig) {
    if (!this.canPlay('hover')) return;
    this.createOscillator(1200, 'sine', 0.05, config?.volume ?? 0.2, config?.detune ?? 0);
  }

  playClick(config?: SoundConfig) {
    if (!this.canPlay('click')) return;
    this.createOscillator(800, 'square', 0.06, config?.volume ?? 0.3, config?.detune ?? 0);
    this.createOscillator(1000, 'sine', 0.04, config?.volume ?? 0.15, (config?.detune ?? 0) + 5);
  }

  playConfirm() {
    if (!this.canPlay('confirm')) return;
    this.createOscillator(440, 'sine', 0.2, 0.25);
    setTimeout(() => this.createOscillator(554, 'sine', 0.15, 0.2), 50);
    setTimeout(() => this.createOscillator(659, 'sine', 0.25, 0.25), 100);
  }

  playCancel() {
    if (!this.canPlay('cancel')) return;
    this.createSweep(600, 300, 0.15, 'sawtooth', 0.25);
  }

  playError() {
    if (!this.canPlay('error')) return;
    this.createSweep(800, 200, 0.3, 'sawtooth', 0.3);
    this.createOscillator(150, 'square', 0.2, 0.2);
  }

  playWarning() {
    if (!this.canPlay('warning')) return;
    this.createOscillator(600, 'square', 0.1, 0.25);
    setTimeout(() => this.createOscillator(400, 'square', 0.15, 0.2), 150);
  }

  playPanelOpen() {
    if (!this.canPlay('panelOpen')) return;
    this.createSweep(200, 1200, 0.15, 'sawtooth', 0.2);
    this.createOscillator(800, 'sine', 0.1, 0.1);
  }

  playPanelClose() {
    if (!this.canPlay('panelClose')) return;
    this.createSweep(1000, 200, 0.12, 'sawtooth', 0.15);
  }

  playBootStart() {
    if (!this.canPlay('bootStart')) return;
    const notes = [220, 330, 440, 660];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.createOscillator(freq, 'sine', 0.15, 0.25);
      }, i * 100);
    });
  }

  playBootComplete() {
    if (!this.canPlay('bootComplete')) return;
    this.createOscillator(440, 'sine', 0.4, 0.3);
    this.createOscillator(554, 'sine', 0.4, 0.25);
    this.createOscillator(659, 'sine', 0.4, 0.25);
    setTimeout(() => {
      this.createOscillator(880, 'sine', 0.3, 0.2);
    }, 150);
  }

  playNotification() {
    if (!this.canPlay('notification')) return;
    this.createOscillator(880, 'sine', 0.15, 0.2);
    setTimeout(() => this.createOscillator(1100, 'sine', 0.1, 0.15), 100);
  }

  playVoiceStart() {
    if (!this.canPlay('voiceStart')) return;
    this.createOscillator(600, 'sine', 0.1, 0.2);
    this.createOscillator(800, 'sine', 0.15, 0.25);
  }

  playVoiceEnd() {
    if (!this.canPlay('voiceEnd')) return;
    this.createOscillator(800, 'sine', 0.08, 0.15);
    this.createOscillator(600, 'sine', 0.12, 0.2);
  }

  // ============================================================================
  // MOVEMENT SOUNDS (LEGACY)
  // ============================================================================

  playMoveStart() {
    if (!this.canPlay('moveStart')) return;
    this.createOscillator(150, 'sawtooth', 0.1, 0.1);
    this.createSweep(100, 300, 0.15, 'sine', 0.08);
  }

  playMoveEnd() {
    if (!this.canPlay('moveEnd')) return;
    this.createSweep(300, 100, 0.1, 'sine', 0.06);
  }

  playCameraRotate() {
    if (!this.canPlay('cameraRotate')) return;
    this.createOscillator(2000, 'sine', 0.02, 0.03);
  }

  // ============================================================================
  // AMBIENT SOUNDS
  // ============================================================================

  playAmbientHum(config?: SoundConfig) {
    if (!this.audioContext || !this.masterGain) return;

    this.resume();

    const volume = config?.volume ?? 0.1;
    const now = this.audioContext.currentTime;

    // Low frequency hum with harmonics
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.value = 60;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.5);
    gain.gain.linearRampToValueAtTime(volume * 0.8, now + 2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 3.1);
  }

  playAmbientEnergy(config?: SoundConfig) {
    if (!this.audioContext || !this.masterGain) return;

    this.resume();

    const volume = config?.volume ?? 0.08;
    const now = this.audioContext.currentTime;

    // Pulsing energy with modulation
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.value = 80;

    lfo.type = 'sine';
    lfo.frequency.value = 2;
    lfoGain.gain.value = volume * 0.3;

    gain.gain.setValueAtTime(volume, now);

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    gain.connect(this.masterGain);

    lfo.start(now);
    osc.start(now);

    gain.gain.setValueAtTime(volume, now + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2);

    osc.stop(now + 2.1);
    lfo.stop(now + 2.1);
  }

  playAmbientProcessing(config?: SoundConfig) {
    if (!this.audioContext || !this.masterGain) return;

    this.resume();

    const volume = config?.volume ?? 0.06;

    // Random beeps pattern
    const beepCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < beepCount; i++) {
      const delay = i * (100 + Math.random() * 100);
      const freq = 800 + Math.random() * 1200;
      setTimeout(() => {
        this.createOscillator(freq, 'sine', 0.05 + Math.random() * 0.05, volume);
      }, delay);
    }
  }

  // ============================================================================
  // MOVEMENT SOUNDS (NEW)
  // ============================================================================

  playFootstep(config?: SoundConfig) {
    if (!this.audioContext || !this.masterGain) return;
    if (!this.canPlay('footstep')) return;

    this.resume();

    const volume = config?.volume ?? 0.15;
    const now = this.audioContext.currentTime;

    // Low thud with high click
    const thud = this.audioContext.createOscillator();
    const thudGain = this.audioContext.createGain();
    const click = this.audioContext.createOscillator();
    const clickGain = this.audioContext.createGain();

    thud.type = 'sine';
    thud.frequency.setValueAtTime(100, now);
    thud.frequency.exponentialRampToValueAtTime(50, now + 0.1);

    thudGain.gain.setValueAtTime(volume, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    thud.connect(thudGain);
    thudGain.connect(this.masterGain);

    click.type = 'square';
    click.frequency.value = 2000 + Math.random() * 500;

    clickGain.gain.setValueAtTime(volume * 0.3, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    click.connect(clickGain);
    clickGain.connect(this.masterGain);

    thud.start(now);
    click.start(now);
    thud.stop(now + 0.2);
    click.stop(now + 0.05);
  }

  playFlyStart(config?: SoundConfig) {
    if (!this.audioContext || !this.masterGain) return;
    if (!this.canPlay('fly_start')) return;

    this.resume();

    const volume = config?.volume ?? 0.2;

    // Rising jet whoosh
    this.createSweep(100, 800, 0.3, 'sawtooth', volume);
    this.createSweep(200, 1200, 0.4, 'sine', volume * 0.5);

    // Engine ignition burst
    setTimeout(() => {
      this.createOscillator(300, 'sawtooth', 0.2, volume * 0.6);
    }, 100);
  }

  playFlyLoop(config?: SoundConfig): string {
    if (!this.audioContext || !this.masterGain) return '';

    this.resume();

    const volume = config?.volume ?? 0.12;
    const loopId = `fly_loop_${Date.now()}`;
    const oscillators: OscillatorNode[] = [];
    const nodes: AudioNode[] = [];

    // Continuous engine hum
    const engineOsc = this.audioContext.createOscillator();
    const engineGain = this.audioContext.createGain();

    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 150;
    engineGain.gain.value = volume;

    engineOsc.connect(engineGain);
    engineGain.connect(this.masterGain);
    engineOsc.start();

    oscillators.push(engineOsc);
    nodes.push(engineGain);

    // High frequency whine
    const whineOsc = this.audioContext.createOscillator();
    const whineGain = this.audioContext.createGain();

    whineOsc.type = 'sine';
    whineOsc.frequency.value = 2000;
    whineGain.gain.value = volume * 0.2;

    whineOsc.connect(whineGain);
    whineGain.connect(this.masterGain);
    whineOsc.start();

    oscillators.push(whineOsc);
    nodes.push(whineGain);

    this.activeLoops.set(loopId, { nodes, oscillators });
    return loopId;
  }

  stopFlyLoop(loopId: string) {
    const loop = this.activeLoops.get(loopId);
    if (loop && this.audioContext) {
      const now = this.audioContext.currentTime;

      loop.oscillators.forEach((osc) => {
        try {
          osc.stop(now + 0.3);
        } catch {
          // Ignore errors on stop
        }
      });

      loop.nodes.forEach((node) => {
        if (node instanceof GainNode) {
          try {
            node.gain.setValueAtTime(node.gain.value, now);
            node.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          } catch {
            // Ignore errors
          }
        }
      });

      this.activeLoops.delete(loopId);
    }
  }

  playFlyStop(config?: SoundConfig) {
    if (!this.audioContext || !this.masterGain) return;
    if (!this.canPlay('fly_stop')) return;

    this.resume();

    const volume = config?.volume ?? 0.2;

    // Descending jet wind-down
    this.createSweep(800, 100, 0.4, 'sawtooth', volume);
    this.createSweep(1200, 200, 0.5, 'sine', volume * 0.4);

    // Final thud/landing
    setTimeout(() => {
      this.createOscillator(60, 'sine', 0.15, volume * 0.8);
    }, 300);
  }

  // ============================================================================
  // TRANSITION SOUNDS
  // ============================================================================

  playStationFocus(config?: SoundConfig) {
    if (!this.canPlay('stationFocus')) return;

    const volume = config?.volume ?? 0.25;

    // Lock-on sound
    this.createOscillator(600, 'sine', 0.1, volume);
    setTimeout(() => {
      this.createOscillator(800, 'sine', 0.08, volume * 0.8);
    }, 80);
    setTimeout(() => {
      this.createOscillator(1000, 'sine', 0.15, volume * 0.6);
    }, 140);

    // Confirmation ping
    setTimeout(() => {
      this.createOscillator(1200, 'sine', 0.2, volume * 0.4);
    }, 250);
  }

  playCameraWhoosh(config?: SoundConfig) {
    if (!this.audioContext || !this.masterGain) return;
    if (!this.canPlay('camera_whoosh')) return;

    this.resume();

    const volume = config?.volume ?? 0.18;

    // Fast sweep whoosh
    this.createSweep(300, 1500, 0.2, 'sawtooth', volume);

    // Add wind layer
    const noiseLength = this.audioContext.sampleRate * 0.25;
    const noiseBuffer = this.audioContext.createBuffer(1, noiseLength, this.audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);

    for (let i = 0; i < noiseLength; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseLength);
    }

    const noiseSource = this.audioContext.createBufferSource();
    const noiseGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    noiseSource.buffer = noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;

    noiseGain.gain.value = volume * 0.5;

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start();
  }

  playModeSwitch() {
    if (!this.canPlay('modeSwitch')) return;
    this.createOscillator(600, 'square', 0.05, 0.2);
    this.createOscillator(900, 'sine', 0.08, 0.15);
  }

  playTransition() {
    if (!this.canPlay('transition')) return;
    this.createSweep(300, 800, 0.3, 'sawtooth', 0.15);
    this.createOscillator(600, 'sine', 0.2, 0.1);
  }

  // ============================================================================
  // LOOP MANAGEMENT
  // ============================================================================

  stopAllLoops() {
    this.activeLoops.forEach((_, id) => {
      this.stopFlyLoop(id);
    });
  }

  // ============================================================================
  // DISPATCHER
  // ============================================================================

  play(type: SoundType, config?: SoundConfig): string | void {
    switch (type) {
      // UI Sounds
      case 'hover': return this.playHover(config);
      case 'click': return this.playClick(config);
      case 'confirm': return this.playConfirm();
      case 'cancel': return this.playCancel();
      case 'error': return this.playError();
      case 'warning': return this.playWarning();
      case 'panelOpen': return this.playPanelOpen();
      case 'panelClose': return this.playPanelClose();
      case 'bootStart': return this.playBootStart();
      case 'bootComplete': return this.playBootComplete();
      case 'notification': return this.playNotification();
      case 'voiceStart': return this.playVoiceStart();
      case 'voiceEnd': return this.playVoiceEnd();
      // Movement (legacy)
      case 'moveStart': return this.playMoveStart();
      case 'moveEnd': return this.playMoveEnd();
      case 'cameraRotate': return this.playCameraRotate();
      // Ambient
      case 'ambient_hum': return this.playAmbientHum(config);
      case 'ambient_energy': return this.playAmbientEnergy(config);
      case 'ambient_processing': return this.playAmbientProcessing(config);
      // Movement (new)
      case 'footstep': return this.playFootstep(config);
      case 'fly_start': return this.playFlyStart(config);
      case 'fly_loop': return this.playFlyLoop(config);
      case 'fly_stop': return this.playFlyStop(config);
      // Transition
      case 'stationFocus':
      case 'station_focus':
        return this.playStationFocus(config);
      case 'camera_whoosh': return this.playCameraWhoosh(config);
      case 'modeSwitch': return this.playModeSwitch();
      case 'transition': return this.playTransition();
      case 'boot': return this.playBootComplete();
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let soundBankInstance: StarkHubSoundBank | null = null;

function getSoundBank(): StarkHubSoundBank {
  if (!soundBankInstance) {
    soundBankInstance = new StarkHubSoundBank();
  }
  return soundBankInstance;
}

// ============================================================================
// HOOK
// ============================================================================

export function useStarkHubSounds() {
  const soundBankRef = useRef<StarkHubSoundBank>(getSoundBank());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio on first user interaction (auto-resume AudioContext)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const soundBank = soundBankRef.current;

    const initOnInteraction = async () => {
      const success = await soundBank.initialize();
      if (success) {
        setIsInitialized(true);
      }
    };

    // Check if already initialized
    if (soundBank.isReady()) {
      setIsInitialized(true);
      return;
    }

    // Try immediate initialization
    initOnInteraction();

    // Initialize on any user interaction (comprehensive list)
    const events = ['click', 'keydown', 'touchstart', 'mousedown', 'pointerdown', 'touchend'];
    events.forEach((event) => {
      window.addEventListener(event, initOnInteraction, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, initOnInteraction);
      });
      soundBank.stopAllLoops();
    };
  }, []);

  // Force initialize (for programmatic initialization)
  const forceInit = useCallback(async () => {
    const success = await soundBankRef.current.initialize();
    if (success) {
      setIsInitialized(true);
    }
    return success;
  }, []);

  // Main play function
  const play = useCallback((type: SoundType, config?: SoundConfig) => {
    return soundBankRef.current.play(type, config);
  }, []);

  // Convenience wrapper
  const playSound = useCallback((type: SoundType | string, config?: SoundConfig) => {
    const mappedType = type as SoundType;
    return soundBankRef.current.play(mappedType, config);
  }, []);

  // ============================================================================
  // UI SOUNDS
  // ============================================================================

  const hover = useCallback((config?: SoundConfig) => {
    soundBankRef.current.playHover(config);
  }, []);

  const click = useCallback((config?: SoundConfig) => {
    soundBankRef.current.playClick(config);
  }, []);

  const confirm = useCallback(() => {
    soundBankRef.current.playConfirm();
  }, []);

  const cancel = useCallback(() => {
    soundBankRef.current.playCancel();
  }, []);

  const error = useCallback(() => {
    soundBankRef.current.playError();
  }, []);

  const warning = useCallback(() => {
    soundBankRef.current.playWarning();
  }, []);

  const panelOpen = useCallback(() => {
    soundBankRef.current.playPanelOpen();
  }, []);

  const panelClose = useCallback(() => {
    soundBankRef.current.playPanelClose();
  }, []);

  const bootStart = useCallback(() => {
    soundBankRef.current.playBootStart();
  }, []);

  const bootComplete = useCallback(() => {
    soundBankRef.current.playBootComplete();
  }, []);

  const notification = useCallback(() => {
    soundBankRef.current.playNotification();
  }, []);

  const voiceStart = useCallback(() => {
    soundBankRef.current.playVoiceStart();
  }, []);

  const voiceEnd = useCallback(() => {
    soundBankRef.current.playVoiceEnd();
  }, []);

  // ============================================================================
  // MOVEMENT SOUNDS (LEGACY)
  // ============================================================================

  const moveStart = useCallback(() => {
    soundBankRef.current.playMoveStart();
  }, []);

  const moveEnd = useCallback(() => {
    soundBankRef.current.playMoveEnd();
  }, []);

  const cameraRotate = useCallback(() => {
    soundBankRef.current.playCameraRotate();
  }, []);

  // ============================================================================
  // AMBIENT SOUNDS
  // ============================================================================

  const ambientHum = useCallback((config?: SoundConfig) => {
    soundBankRef.current.playAmbientHum(config);
  }, []);

  const ambientEnergy = useCallback((config?: SoundConfig) => {
    soundBankRef.current.playAmbientEnergy(config);
  }, []);

  const ambientProcessing = useCallback((config?: SoundConfig) => {
    soundBankRef.current.playAmbientProcessing(config);
  }, []);

  // ============================================================================
  // MOVEMENT SOUNDS (NEW)
  // ============================================================================

  const footstep = useCallback((config?: SoundConfig) => {
    soundBankRef.current.playFootstep(config);
  }, []);

  const flyStart = useCallback((config?: SoundConfig) => {
    soundBankRef.current.playFlyStart(config);
  }, []);

  const flyLoop = useCallback((config?: SoundConfig): string => {
    return soundBankRef.current.playFlyLoop(config) ?? '';
  }, []);

  const flyStop = useCallback((config?: SoundConfig) => {
    soundBankRef.current.playFlyStop(config);
  }, []);

  const stopFlyLoop = useCallback((loopId: string) => {
    soundBankRef.current.stopFlyLoop(loopId);
  }, []);

  // ============================================================================
  // TRANSITION SOUNDS
  // ============================================================================

  const stationFocus = useCallback((config?: SoundConfig) => {
    soundBankRef.current.playStationFocus(config);
  }, []);

  const cameraWhoosh = useCallback((config?: SoundConfig) => {
    soundBankRef.current.playCameraWhoosh(config);
  }, []);

  const modeSwitch = useCallback(() => {
    soundBankRef.current.playModeSwitch();
  }, []);

  const transition = useCallback(() => {
    soundBankRef.current.playTransition();
  }, []);

  // ============================================================================
  // UTILITY
  // ============================================================================

  const setVolume = useCallback((volume: number) => {
    soundBankRef.current.setMasterVolume(volume);
  }, []);

  const getVolume = useCallback(() => {
    return soundBankRef.current.getMasterVolume();
  }, []);

  const stopAllLoops = useCallback(() => {
    soundBankRef.current.stopAllLoops();
  }, []);

  return {
    // State
    isInitialized,

    // Init
    forceInit,

    // Generic play
    play,
    playSound,

    // Volume
    setVolume,
    getVolume,

    // UI sounds
    hover,
    click,
    confirm,
    cancel,
    error,
    warning,
    panelOpen,
    panelClose,
    bootStart,
    bootComplete,
    notification,
    voiceStart,
    voiceEnd,

    // Movement (legacy)
    moveStart,
    moveEnd,
    cameraRotate,

    // Ambient sounds
    ambientHum,
    ambientEnergy,
    ambientProcessing,

    // Movement (new)
    footstep,
    flyStart,
    flyLoop,
    flyStop,
    stopFlyLoop,

    // Transition sounds
    stationFocus,
    cameraWhoosh,
    modeSwitch,
    transition,

    // Loop management
    stopAllLoops,
  };
}

export default useStarkHubSounds;
