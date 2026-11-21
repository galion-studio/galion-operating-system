"use client";

/**
 * StarkSoundBank - Synthesized HUD Sounds
 *
 * Pure Web Audio API synthesized sounds - no external audio files needed!
 * These create authentic sci-fi HUD sounds using oscillators, filters, and envelopes.
 *
 * "The suit is talking to me."
 */

// ============================================================================
// TYPES
// ============================================================================

export type SoundType =
  // UI Interactions
  | "hover"
  | "click"
  | "confirm"
  | "cancel"
  | "error"
  | "warning"
  // Transitions
  | "panelOpen"
  | "panelClose"
  | "bootSequence"
  | "bootComplete"
  // Notifications
  | "notification"
  | "notificationUrgent"
  // Ambient
  | "ambientHum"
  | "ambientPulse"
  // Voice
  | "voiceStart"
  | "voiceEnd";

export interface SoundConfig {
  volume: number;
  duration: number;
  detune?: number;
}

// ============================================================================
// SOUND BANK CLASS
// ============================================================================

export class StarkSoundBank {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isInitialized: boolean = false;
  private masterVolume: number = 0.5;
  private activeSounds: Set<OscillatorNode | AudioBufferSourceNode> = new Set();

  // Ambient sound nodes
  private ambientOscillator: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create context
      this.audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();

      // Create compressor for clean audio
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      // Create master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.masterVolume;

      // Connect chain
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      this.isInitialized = true;
      console.log("[StarkSoundBank] Initialized");
    } catch (error) {
      console.error("[StarkSoundBank] Failed to initialize:", error);
    }
  }

  /**
   * Set master volume (0-1)
   */
  setMasterVolume(volume: number): void {
    // Ensure volume is a finite number between 0 and 1
    if (!Number.isFinite(volume)) {
      volume = 1;
    }
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  /**
   * Resume audio context (required after user interaction in some browsers)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  /**
   * Play a synthesized sound
   */
  play(type: SoundType, config?: Partial<SoundConfig>): void {
    if (!this.isInitialized || !this.audioContext || !this.compressor) {
      return;
    }

    // Resume context if needed
    this.resume();

    // Ensure volume is a finite number to prevent Web Audio API errors
    const safeVolume = Number.isFinite(config?.volume) ? config!.volume : 0.5;

    const baseConfig: SoundConfig = {
      volume: safeVolume,
      duration: 0.15,
      detune: 0,
      ...config,
      volume: safeVolume, // Override again in case config spread a bad value
    };

    switch (type) {
      case "hover":
        this.playHover(baseConfig);
        break;
      case "click":
        this.playClick(baseConfig);
        break;
      case "confirm":
        this.playConfirm(baseConfig);
        break;
      case "cancel":
        this.playCancel(baseConfig);
        break;
      case "error":
        this.playError(baseConfig);
        break;
      case "warning":
        this.playWarning(baseConfig);
        break;
      case "panelOpen":
        this.playPanelOpen(baseConfig);
        break;
      case "panelClose":
        this.playPanelClose(baseConfig);
        break;
      case "bootSequence":
        this.playBootSequence(baseConfig);
        break;
      case "bootComplete":
        this.playBootComplete(baseConfig);
        break;
      case "notification":
        this.playNotification(baseConfig);
        break;
      case "notificationUrgent":
        this.playNotificationUrgent(baseConfig);
        break;
      case "voiceStart":
        this.playVoiceStart(baseConfig);
        break;
      case "voiceEnd":
        this.playVoiceEnd(baseConfig);
        break;
    }
  }

  /**
   * Start ambient background sound
   */
  startAmbient(): void {
    if (!this.audioContext || !this.compressor || this.ambientOscillator)
      return;

    // Create low frequency hum
    this.ambientOscillator = this.audioContext.createOscillator();
    this.ambientOscillator.type = "sine";
    this.ambientOscillator.frequency.value = 60;

    // Very low volume
    this.ambientGain = this.audioContext.createGain();
    this.ambientGain.gain.value = 0;

    // Filter for soft sound
    const filter = this.audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 100;
    filter.Q.value = 1;

    // Connect
    this.ambientOscillator.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.compressor);

    // Fade in
    this.ambientOscillator.start();
    this.ambientGain.gain.linearRampToValueAtTime(
      0.03,
      this.audioContext.currentTime + 2
    );
  }

  /**
   * Stop ambient sound
   */
  stopAmbient(): void {
    if (this.ambientGain && this.audioContext) {
      this.ambientGain.gain.linearRampToValueAtTime(
        0,
        this.audioContext.currentTime + 1
      );
      setTimeout(() => {
        this.ambientOscillator?.stop();
        this.ambientOscillator = null;
        this.ambientGain = null;
      }, 1100);
    }
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    this.activeSounds.forEach((sound) => {
      try {
        sound.stop();
      } catch {
        // Already stopped
      }
    });
    this.activeSounds.clear();
    this.stopAmbient();
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stopAll();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
  }

  // ===========================================================================
  // SOUND SYNTHESIS METHODS
  // ===========================================================================

  private createOscillator(
    type: OscillatorType = "sine",
    frequency: number = 440,
    detune: number = 0
  ): OscillatorNode {
    const osc = this.audioContext!.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    osc.detune.value = detune;
    this.activeSounds.add(osc);
    osc.onended = () => this.activeSounds.delete(osc);
    return osc;
  }

  private createGain(value: number = 1): GainNode {
    const gain = this.audioContext!.createGain();
    // Ensure value is finite and between 0 and 1
    if (!Number.isFinite(value)) {
      value = 1;
    }
    gain.gain.value = value;
    return gain;
  }

  private createFilter(
    type: BiquadFilterType = "lowpass",
    frequency: number = 1000,
    Q: number = 1
  ): BiquadFilterNode {
    const filter = this.audioContext!.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    return filter;
  }

  // ---------------------------------------------------------------------------
  // UI Sounds
  // ---------------------------------------------------------------------------

  private playHover(config: SoundConfig): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Validate volume is finite
    const volume = Number.isFinite(config.volume) ? config.volume : 0.5;

    // High frequency blip
    const osc = this.createOscillator("sine", 2000, config.detune);
    const gain = this.createGain(0);

    // Quick envelope
    gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.compressor!);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  private playClick(config: SoundConfig): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Two-tone click
    const osc1 = this.createOscillator("square", 800, config.detune);
    const osc2 = this.createOscillator("sine", 1200, config.detune);
    const gain = this.createGain(0);
    const filter = this.createFilter("highpass", 500, 2);

    // Snappy envelope
    gain.gain.linearRampToValueAtTime(config.volume * 0.4, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor!);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.12);
    osc2.stop(now + 0.12);
  }

  private playConfirm(config: SoundConfig): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Rising two-tone
    const osc1 = this.createOscillator("sine", 600, config.detune);
    const osc2 = this.createOscillator("sine", 900, config.detune);
    const gain = this.createGain(0);

    gain.gain.linearRampToValueAtTime(config.volume * 0.4, now + 0.02);
    gain.gain.setValueAtTime(config.volume * 0.4, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.frequency.setValueAtTime(600, now);
    osc1.frequency.linearRampToValueAtTime(800, now + 0.1);

    osc2.frequency.setValueAtTime(900, now + 0.08);
    osc2.frequency.linearRampToValueAtTime(1200, now + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.compressor!);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc1.stop(now + 0.25);
    osc2.stop(now + 0.3);
  }

  private playCancel(config: SoundConfig): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Falling tone
    const osc = this.createOscillator("sawtooth", 400, config.detune);
    const gain = this.createGain(0);
    const filter = this.createFilter("lowpass", 2000, 5);

    gain.gain.linearRampToValueAtTime(config.volume * 0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor!);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  private playError(config: SoundConfig): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Harsh buzz
    const osc = this.createOscillator("square", 150, config.detune);
    const gain = this.createGain(0);
    const filter = this.createFilter("bandpass", 300, 3);

    // Pulsing envelope
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.1;
      gain.gain.linearRampToValueAtTime(config.volume * 0.5, t + 0.01);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.08);
    }
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor!);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  private playWarning(config: SoundConfig): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Two-tone warning
    const osc1 = this.createOscillator("sine", 800, config.detune);
    const osc2 = this.createOscillator("sine", 600, config.detune);
    const gain = this.createGain(0);

    // Alternating
    gain.gain.linearRampToValueAtTime(config.volume * 0.4, now + 0.02);
    gain.gain.setValueAtTime(config.volume * 0.4, now + 0.15);
    gain.gain.linearRampToValueAtTime(config.volume * 0.3, now + 0.17);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.compressor!);

    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.35);
  }

  // ---------------------------------------------------------------------------
  // Panel Sounds
  // ---------------------------------------------------------------------------

  private playPanelOpen(config: SoundConfig): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Whoosh up with harmonics
    const osc1 = this.createOscillator("sine", 200, config.detune);
    const osc2 = this.createOscillator("triangle", 400, config.detune);
    const noise = this.createNoise(0.1);
    const gain = this.createGain(0);
    const filter = this.createFilter("bandpass", 1000, 2);

    gain.gain.linearRampToValueAtTime(config.volume * 0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.2);
    osc2.frequency.setValueAtTime(400, now);
    osc2.frequency.exponentialRampToValueAtTime(1600, now + 0.2);

    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 0.2);

    osc1.connect(gain);
    osc2.connect(gain);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor!);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }

  private playPanelClose(config: SoundConfig): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Whoosh down
    const osc = this.createOscillator("sine", 800, config.detune);
    const gain = this.createGain(0);

    gain.gain.linearRampToValueAtTime(config.volume * 0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    osc.connect(gain);
    gain.connect(this.compressor!);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // ---------------------------------------------------------------------------
  // Boot Sounds
  // ---------------------------------------------------------------------------

  private playBootSequence(config: SoundConfig): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Progressive power-up sound
    const duration = 2.0;
    const osc1 = this.createOscillator("sine", 50, config.detune);
    const osc2 = this.createOscillator("triangle", 100, config.detune);
    const osc3 = this.createOscillator("sine", 200, config.detune);
    const gain = this.createGain(0);
    const filter = this.createFilter("lowpass", 200, 1);

    // Slow build
    gain.gain.linearRampToValueAtTime(config.volume * 0.1, now + 0.5);
    gain.gain.linearRampToValueAtTime(
      config.volume * 0.3,
      now + duration * 0.8
    );
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Rising frequencies
    osc1.frequency.setValueAtTime(50, now);
    osc1.frequency.exponentialRampToValueAtTime(200, now + duration);
    osc2.frequency.setValueAtTime(100, now);
    osc2.frequency.exponentialRampToValueAtTime(400, now + duration);
    osc3.frequency.setValueAtTime(200, now);
    osc3.frequency.exponentialRampToValueAtTime(800, now + duration);

    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(4000, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor!);

    osc1.start(now);
    osc2.start(now + 0.3);
    osc3.start(now + 0.6);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
    osc3.stop(now + duration);
  }

  private playBootComplete(config: SoundConfig): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Triumphant chord
    const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const gains: GainNode[] = [];
    const oscs: OscillatorNode[] = [];
    const masterGain = this.createGain(0);

    frequencies.forEach((freq, i) => {
      const osc = this.createOscillator("sine", freq, config.detune);
      const gain = this.createGain(config.volume * 0.15);
      osc.connect(gain);
      gain.connect(masterGain);
      oscs.push(osc);
      gains.push(gain);

      osc.start(now + i * 0.05);
      osc.stop(now + 0.8);
    });

    masterGain.gain.linearRampToValueAtTime(0.8, now + 0.1);
    masterGain.gain.setValueAtTime(0.8, now + 0.4);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    masterGain.connect(this.compressor!);
  }

  // ---------------------------------------------------------------------------
  // Notification Sounds
  // ---------------------------------------------------------------------------

  private playNotification(config: SoundConfig): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Gentle ping
    const osc = this.createOscillator("sine", 880, config.detune);
    const osc2 = this.createOscillator("sine", 1320, config.detune);
    const gain = this.createGain(0);

    gain.gain.linearRampToValueAtTime(config.volume * 0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.compressor!);

    osc.start(now);
    osc2.start(now + 0.08);
    osc.stop(now + 0.2);
    osc2.stop(now + 0.4);
  }

  private playNotificationUrgent(config: SoundConfig): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Urgent double-ping
    for (let i = 0; i < 2; i++) {
      const t = now + i * 0.15;
      const osc = this.createOscillator("square", 1000, config.detune);
      const gain = this.createGain(0);
      const filter = this.createFilter("bandpass", 1000, 5);

      gain.gain.linearRampToValueAtTime(config.volume * 0.4, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor!);

      osc.start(t);
      osc.stop(t + 0.12);
    }
  }

  // ---------------------------------------------------------------------------
  // Voice Sounds
  // ---------------------------------------------------------------------------

  private playVoiceStart(config: SoundConfig): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Soft activation sound
    const osc = this.createOscillator("sine", 440, config.detune);
    const gain = this.createGain(0);

    gain.gain.linearRampToValueAtTime(config.volume * 0.2, now + 0.05);
    gain.gain.linearRampToValueAtTime(config.volume * 0.1, now + 0.15);

    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(660, now + 0.1);

    osc.connect(gain);
    gain.connect(this.compressor!);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  private playVoiceEnd(config: SoundConfig): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Soft deactivation
    const osc = this.createOscillator("sine", 660, config.detune);
    const gain = this.createGain(0);

    gain.gain.linearRampToValueAtTime(config.volume * 0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.frequency.setValueAtTime(660, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.1);

    osc.connect(gain);
    gain.connect(this.compressor!);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // ---------------------------------------------------------------------------
  // Noise Generator
  // ---------------------------------------------------------------------------

  private createNoise(duration: number): AudioBufferSourceNode {
    const ctx = this.audioContext!;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    this.activeSounds.add(source);
    source.onended = () => this.activeSounds.delete(source);

    source.start();
    return source;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let soundBankInstance: StarkSoundBank | null = null;

export function getStarkSoundBank(): StarkSoundBank {
  if (!soundBankInstance) {
    soundBankInstance = new StarkSoundBank();
  }
  return soundBankInstance;
}

export default StarkSoundBank;
