'use client';

/**
 * useHUDSounds - Sound Effect Triggers Hook
 *
 * Source: galion-workspace3d master, src/components/workspace3d/ironman/audio/useHUDSounds.ts
 */

import { useCallback, useEffect, useRef } from 'react';
import { getStarkSoundBank, SoundType, SoundConfig } from './StarkSoundBank';
import { useSoundConfig } from '../context/useStarkWorkspace';

export interface HUDSoundTriggers {
  hover: () => void;
  click: () => void;
  confirm: () => void;
  cancel: () => void;
  error: () => void;
  warning: () => void;
  panelOpen: () => void;
  panelClose: () => void;
  bootSequence: () => void;
  bootComplete: () => void;
  notification: () => void;
  notificationUrgent: () => void;
  voiceStart: () => void;
  voiceEnd: () => void;
  startAmbient: () => void;
  stopAmbient: () => void;
  play: (type: SoundType, config?: Partial<SoundConfig>) => void;
}

export function useHUDSounds(): HUDSoundTriggers {
  const soundConfig = useSoundConfig();
  const isInitialized = useRef(false);
  const soundBank = getStarkSoundBank();

  useEffect(() => {
    if (isInitialized.current) return;

    async function initOnInteraction() {
      if (!isInitialized.current) {
        await soundBank.initialize();
        isInitialized.current = true;
        document.removeEventListener('click', initOnInteraction);
        document.removeEventListener('keydown', initOnInteraction);
      }
    }

    document.addEventListener('click', initOnInteraction, { once: true });
    document.addEventListener('keydown', initOnInteraction, { once: true });

    return () => {
      document.removeEventListener('click', initOnInteraction);
      document.removeEventListener('keydown', initOnInteraction);
    };
  }, [soundBank]);

  useEffect(() => {
    soundBank.setMasterVolume(soundConfig.masterVolume);
  }, [soundConfig.masterVolume, soundBank]);

  const createTrigger = useCallback((type: SoundType) => {
    return () => {
      if (!soundConfig.enabled) return;
      if (!soundConfig.uiSounds && isUISoundType(type)) return;
      soundBank.play(type, { volume: soundConfig.masterVolume });
    };
  }, [soundConfig.enabled, soundConfig.uiSounds, soundConfig.masterVolume, soundBank]);

  const play = useCallback((type: SoundType, config?: Partial<SoundConfig>) => {
    if (!soundConfig.enabled) return;
    soundBank.play(type, { volume: soundConfig.masterVolume, ...config });
  }, [soundConfig.enabled, soundConfig.masterVolume, soundBank]);

  const startAmbient = useCallback(() => {
    if (!soundConfig.enabled || !soundConfig.ambientEnabled) return;
    soundBank.startAmbient();
  }, [soundConfig.enabled, soundConfig.ambientEnabled, soundBank]);

  const stopAmbient = useCallback(() => {
    soundBank.stopAmbient();
  }, [soundBank]);

  return {
    hover: createTrigger('hover'),
    click: createTrigger('click'),
    confirm: createTrigger('confirm'),
    cancel: createTrigger('cancel'),
    error: createTrigger('error'),
    warning: createTrigger('warning'),
    panelOpen: createTrigger('panelOpen'),
    panelClose: createTrigger('panelClose'),
    bootSequence: createTrigger('bootSequence'),
    bootComplete: createTrigger('bootComplete'),
    notification: createTrigger('notification'),
    notificationUrgent: createTrigger('notificationUrgent'),
    voiceStart: createTrigger('voiceStart'),
    voiceEnd: createTrigger('voiceEnd'),
    startAmbient,
    stopAmbient,
    play,
  };
}

function isUISoundType(type: SoundType): boolean {
  return ['hover', 'click', 'confirm', 'cancel'].includes(type);
}

export default useHUDSounds;
