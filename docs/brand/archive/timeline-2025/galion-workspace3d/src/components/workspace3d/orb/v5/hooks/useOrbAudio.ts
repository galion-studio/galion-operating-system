/**
 * GALION Orb V5.2 - Audio Reactivity Hook
 * 
 * Provides audio analysis, voice activity detection, and TTS reactivity
 * for real-time orb visualization responses.
 * 
 * V5.2 Update: Uses Refs for high-frequency analysis data to prevent React re-renders.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface AudioAnalysis {
  /** Overall audio level (0-1) */
  level: number;
  /** Low frequency band (0-1) - bass */
  bass: number;
  /** Mid-low frequency band (0-1) */
  lowMid: number;
  /** Mid frequency band (0-1) - voice fundamental */
  mid: number;
  /** Mid-high frequency band (0-1) - voice harmonics */
  highMid: number;
  /** High frequency band (0-1) - treble */
  treble: number;
  /** Detected beats per minute */
  bpm: number;
  /** Whether a beat was just detected */
  beatDetected: boolean;
  /** Spectral centroid (brightness) */
  brightness: number;
  /** Spectral flux (change rate) */
  flux: number;
}

export interface VoiceActivity {
  /** Whether speech is currently detected */
  isSpeaking: boolean;
  /** Speech confidence (0-1) */
  confidence: number;
  /** Current syllable intensity */
  syllableIntensity: number;
  /** Estimated phoneme type */
  phonemeType: 'vowel' | 'consonant' | 'plosive' | 'fricative' | 'silent';
  /** Speaking pace (syllables per second estimate) */
  pace: number;
}

export interface UseOrbAudioOptions {
  /** Audio source - MediaStream, AudioNode, or HTMLMediaElement */
  source?: MediaStream | AudioNode | HTMLMediaElement | null;
  /** FFT size for frequency analysis (default: 2048) */
  fftSize?: number;
  /** Smoothing time constant (default: 0.8) */
  smoothingTimeConstant?: number;
  /** Enable beat detection (default: true) */
  enableBeatDetection?: boolean;
  /** Enable voice activity detection (default: true) */
  enableVAD?: boolean;
  /** Minimum level threshold to register audio */
  minThreshold?: number;
  /** Callback on beat detection */
  onBeat?: () => void;
  /** Callback on speech start */
  onSpeechStart?: () => void;
  /** Callback on speech end */
  onSpeechEnd?: () => void;
}

export interface UseOrbAudioReturn {
  /** 
   * Mutable ref containing current analysis data.
   * Read this in useFrame() loops for 60fps updates without re-renders.
   */
  audioDataRef: React.MutableRefObject<{
    analysis: AudioAnalysis;
    voice: VoiceActivity;
  }>;
  /** Voice activity detection state (slow updates only) */
  voiceState: VoiceActivity;
  /** Whether audio is currently connected */
  isConnected: boolean;
  /** Whether audio is currently active (above threshold) */
  isActive: boolean;
  /** Connect to an audio source */
  connect: (source: MediaStream | AudioNode | HTMLMediaElement) => void;
  /** Disconnect from audio source */
  disconnect: () => void;
  /** Get raw frequency data */
  getFrequencyData: () => Uint8Array | null;
  /** Get raw time domain data */
  getTimeDomainData: () => Uint8Array | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Frequency band ranges (Hz)
const FREQUENCY_BANDS = {
  bass: { min: 20, max: 250 },
  lowMid: { min: 250, max: 500 },
  mid: { min: 500, max: 2000 },
  highMid: { min: 2000, max: 4000 },
  treble: { min: 4000, max: 20000 },
} as const;

// Voice frequency range (Hz)
const VOICE_RANGE = { min: 80, max: 3000 };

// Default audio analysis values
const DEFAULT_ANALYSIS: AudioAnalysis = {
  level: 0,
  bass: 0,
  lowMid: 0,
  mid: 0,
  highMid: 0,
  treble: 0,
  bpm: 0,
  beatDetected: false,
  brightness: 0,
  flux: 0,
};

const DEFAULT_VOICE: VoiceActivity = {
  isSpeaking: false,
  confidence: 0,
  syllableIntensity: 0,
  phonemeType: 'silent',
  pace: 0,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert frequency (Hz) to FFT bin index
 */
function frequencyToBin(frequency: number, sampleRate: number, fftSize: number): number {
  return Math.round((frequency * fftSize) / sampleRate);
}

/**
 * Get average level for a frequency range
 */
function getBandLevel(
  frequencyData: Uint8Array,
  minFreq: number,
  maxFreq: number,
  sampleRate: number,
  fftSize: number
): number {
  const minBin = frequencyToBin(minFreq, sampleRate, fftSize);
  const maxBin = Math.min(frequencyToBin(maxFreq, sampleRate, fftSize), frequencyData.length - 1);

  if (minBin >= maxBin) return 0;

  let sum = 0;
  for (let i = minBin; i <= maxBin; i++) {
    sum += frequencyData[i];
  }

  return (sum / (maxBin - minBin + 1)) / 255;
}

/**
 * Detect phoneme type from frequency distribution
 */
function detectPhonemeType(
  bass: number,
  mid: number,
  highMid: number,
  treble: number
): VoiceActivity['phonemeType'] {
  const total = bass + mid + highMid + treble;
  if (total < 0.1) return 'silent';

  // Vowels have strong mid frequencies
  if (mid > 0.4 && mid > highMid) return 'vowel';

  // Fricatives (s, f, sh) have high frequencies
  if (treble > 0.3 && treble > mid) return 'fricative';

  // Plosives (p, b, t, d) have sharp transients
  if (bass > 0.4 && mid < 0.3) return 'plosive';

  // Consonants are everything else with some energy
  if (total > 0.2) return 'consonant';

  return 'silent';
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useOrbAudio(options: UseOrbAudioOptions = {}): UseOrbAudioReturn {
  const {
    source: initialSource = null,
    fftSize = 2048,
    smoothingTimeConstant = 0.8,
    enableBeatDetection = true,
    enableVAD = true,
    minThreshold = 0.01,
    onBeat,
    onSpeechStart,
    onSpeechEnd,
  } = options;

  // State (Low frequency updates only)
  const [voiceState, setVoiceState] = useState<VoiceActivity>(DEFAULT_VOICE);
  const [isConnected, setIsConnected] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Ref container for high-frequency data
  const audioDataRef = useRef({
    analysis: { ...DEFAULT_ANALYSIS },
    voice: { ...DEFAULT_VOICE }
  });

  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<AudioNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const timeDomainDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Beat detection state
  const beatHistoryRef = useRef<number[]>([]);
  const lastBeatTimeRef = useRef<number>(0);
  const previousFluxRef = useRef<number>(0);

  // Voice detection state
  const wasSpeakingRef = useRef(false);
  const speechStartTimeRef = useRef<number>(0);
  const syllableCountRef = useRef(0);

  // Initialize audio context and analyser
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return;

    audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = fftSize;
    analyserRef.current.smoothingTimeConstant = smoothingTimeConstant;

    frequencyDataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    timeDomainDataRef.current = new Uint8Array(analyserRef.current.fftSize);
  }, [fftSize, smoothingTimeConstant]);

  // Connect to audio source
  const connect = useCallback((source: MediaStream | AudioNode | HTMLMediaElement) => {
    initAudio();

    if (!audioContextRef.current || !analyserRef.current) return;

    // Disconnect previous source
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }

    // Create source node based on type
    let sourceNode: AudioNode;

    if (source instanceof MediaStream) {
      sourceNode = audioContextRef.current.createMediaStreamSource(source);
    } else if (source instanceof HTMLMediaElement) {
      sourceNode = audioContextRef.current.createMediaElementSource(source);
    } else {
      sourceNode = source;
    }

    // Connect source → analyser
    sourceNode.connect(analyserRef.current);
    sourceNodeRef.current = sourceNode;

    setIsConnected(true);
  }, [initAudio]);

  // Disconnect from audio source
  const disconnect = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        // Ignore
      }
      sourceNodeRef.current = null;
    }

    setIsConnected(false);
    setIsActive(false);

    // Reset data
    audioDataRef.current = {
      analysis: { ...DEFAULT_ANALYSIS },
      voice: { ...DEFAULT_VOICE }
    };
    setVoiceState({ ...DEFAULT_VOICE });
  }, []);

  // Get raw frequency data
  const getFrequencyData = useCallback(() => {
    if (!analyserRef.current || !frequencyDataRef.current) return null;
    analyserRef.current.getByteFrequencyData(frequencyDataRef.current);
    return frequencyDataRef.current;
  }, []);

  // Get raw time domain data
  const getTimeDomainData = useCallback(() => {
    if (!analyserRef.current || !timeDomainDataRef.current) return null;
    analyserRef.current.getByteTimeDomainData(timeDomainDataRef.current);
    return timeDomainDataRef.current;
  }, []);

  // Main analysis loop
  useEffect(() => {
    if (!isConnected) return;

    const analyze = () => {
      if (!analyserRef.current || !frequencyDataRef.current || !audioContextRef.current) {
        animationFrameRef.current = requestAnimationFrame(analyze);
        return;
      }

      const sampleRate = audioContextRef.current.sampleRate;

      // Get frequency data
      analyserRef.current.getByteFrequencyData(frequencyDataRef.current);
      const freqData = frequencyDataRef.current;

      // Calculate band levels
      const bass = getBandLevel(freqData, FREQUENCY_BANDS.bass.min, FREQUENCY_BANDS.bass.max, sampleRate, fftSize);
      const lowMid = getBandLevel(freqData, FREQUENCY_BANDS.lowMid.min, FREQUENCY_BANDS.lowMid.max, sampleRate, fftSize);
      const mid = getBandLevel(freqData, FREQUENCY_BANDS.mid.min, FREQUENCY_BANDS.mid.max, sampleRate, fftSize);
      const highMid = getBandLevel(freqData, FREQUENCY_BANDS.highMid.min, FREQUENCY_BANDS.highMid.max, sampleRate, fftSize);
      const treble = getBandLevel(freqData, FREQUENCY_BANDS.treble.min, FREQUENCY_BANDS.treble.max, sampleRate, fftSize);

      // Overall level (weighted toward voice frequencies)
      const level = bass * 0.1 + lowMid * 0.15 + mid * 0.35 + highMid * 0.25 + treble * 0.15;

      // Calculate spectral brightness (centroid)
      let weightedSum = 0;
      let totalAmplitude = 0;
      for (let i = 0; i < freqData.length; i++) {
        const frequency = (i * sampleRate) / fftSize;
        weightedSum += frequency * freqData[i];
        totalAmplitude += freqData[i];
      }
      const brightness = totalAmplitude > 0 ? (weightedSum / totalAmplitude) / 4000 : 0;

      // Calculate spectral flux (change from previous frame)
      let flux = 0;
      for (let i = 0; i < freqData.length; i++) {
        flux += Math.abs(freqData[i] - (previousFluxRef.current || 0));
      }
      flux = flux / freqData.length / 255;

      // Beat detection
      let beatDetected = false;
      let bpm = audioDataRef.current.analysis.bpm;

      if (enableBeatDetection) {
        const now = performance.now();
        const beatThreshold = 0.15;

        // Detect beat from bass + flux spike
        if (bass > beatThreshold && flux > 0.1 && now - lastBeatTimeRef.current > 250) {
          beatDetected = true;

          const timeSinceLast = now - lastBeatTimeRef.current;
          if (timeSinceLast > 0 && timeSinceLast < 2000) {
            const instantBpm = 60000 / timeSinceLast;
            beatHistoryRef.current.push(instantBpm);
            if (beatHistoryRef.current.length > 8) {
              beatHistoryRef.current.shift();
            }
            bpm = beatHistoryRef.current.reduce((a, b) => a + b, 0) / beatHistoryRef.current.length;
          }

          lastBeatTimeRef.current = now;
          onBeat?.();
        }
      }

      previousFluxRef.current = freqData[0];

      // Voice activity detection
      let voiceActivity = audioDataRef.current.voice;

      if (enableVAD) {
        const voiceLevel = getBandLevel(freqData, VOICE_RANGE.min, VOICE_RANGE.max, sampleRate, fftSize);
        const isSpeaking = voiceLevel > 0.1 && mid > bass;

        // Detect speech start/end
        if (isSpeaking && !wasSpeakingRef.current) {
          wasSpeakingRef.current = true;
          speechStartTimeRef.current = performance.now();
          syllableCountRef.current = 0;
          onSpeechStart?.();
        } else if (!isSpeaking && wasSpeakingRef.current) {
          wasSpeakingRef.current = false;
          onSpeechEnd?.();
        }

        // Syllable detection (simplified)
        if (isSpeaking && mid > 0.3) {
          syllableCountRef.current++;
        }

        // Calculate speaking pace
        const speakingDuration = (performance.now() - speechStartTimeRef.current) / 1000;
        const pace = speakingDuration > 0.5 ? syllableCountRef.current / speakingDuration / 10 : 0;

        const phonemeType = detectPhonemeType(bass, mid, highMid, treble);

        // Update voice activity object
        voiceActivity = {
          isSpeaking,
          confidence: isSpeaking ? Math.min(voiceLevel * 2, 1) : 0,
          syllableIntensity: mid,
          phonemeType,
          pace: Math.min(pace, 5),
        };

        // Only update React state if speaking state changes (to trigger UI changes elsewhere if needed)
        // Check if isSpeaking changed
        if (voiceActivity.isSpeaking !== wasSpeakingRef.current) {
          // This is actually handled by the if block above, but we might want to sync the state
          // For now, we update voiceState only occasionally or on significant changes to avoid rerenders
        }
      }

      // Update active state (React State - low frequency)
      const nowActive = level > minThreshold;
      if (nowActive !== isActive) {
        setIsActive(nowActive);
      }

      // Update Ref Data (High Frequency)
      audioDataRef.current = {
        analysis: {
          level,
          bass,
          lowMid,
          mid,
          highMid,
          treble,
          bpm: Math.round(bpm),
          beatDetected,
          brightness,
          flux,
        },
        voice: voiceActivity
      };

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    animationFrameRef.current = requestAnimationFrame(analyze);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isConnected, fftSize, enableBeatDetection, enableVAD, minThreshold, onBeat, onSpeechStart, onSpeechEnd, isActive]);

  // Connect to initial source
  useEffect(() => {
    if (initialSource) {
      connect(initialSource);
    }

    return () => {
      disconnect();
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, [initialSource, connect, disconnect]);

  return {
    audioDataRef, // EXPOSED REF
    voiceState, // Low frequency hook
    isConnected,
    isActive,
    connect,
    disconnect,
    getFrequencyData,
    getTimeDomainData,
  };
}

export default useOrbAudio;
