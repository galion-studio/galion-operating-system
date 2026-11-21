'use client';

/**
 * OrbDemoController.tsx - UI Controls for Orb Preview
 * 
 * Provides a control panel to test all orb states, emotions, and settings:
 * - State selector (idle, listening, speaking, thinking, task)
 * - Emotion picker (11 emotions)
 * - Intensity slider
 * - Quality toggle
 * - Auto-cycle toggle
 * - Camera preset buttons
 */

import React, { useState, useCallback } from 'react';
import { OrbState } from './orbV3States';
import { OrbEmotion, getAllEmotions } from './orbV3Emotions';

// ============================================================================
// TYPES
// ============================================================================

export interface OrbDemoControllerProps {
  /** Current state */
  state: OrbState;
  /** Current emotion */
  emotion: OrbEmotion;
  /** Current intensity */
  intensity: number;
  /** Current quality */
  quality: 'low' | 'medium' | 'high';
  /** Auto-cycle enabled */
  autoCycle: boolean;
  /** Audio simulation enabled */
  simulateAudio: boolean;
  /** Callbacks */
  onStateChange: (state: OrbState) => void;
  onEmotionChange: (emotion: OrbEmotion) => void;
  onIntensityChange: (intensity: number) => void;
  onQualityChange: (quality: 'low' | 'medium' | 'high') => void;
  onAutoCycleChange: (enabled: boolean) => void;
  onSimulateAudioChange: (enabled: boolean) => void;
  onCameraPreset?: (preset: string) => void;
  /** Position of the controller */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Collapsed state */
  defaultCollapsed?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATES: OrbState[] = ['idle', 'listening', 'speaking', 'thinking', 'task'];

const CAMERA_PRESETS = [
  { id: 'home', label: 'Home' },
  { id: 'closeup', label: 'Close-up' },
  { id: 'dramatic', label: 'Dramatic' },
  { id: 'orbit', label: 'Orbit' },
  { id: 'top', label: 'Top' },
  { id: 'low', label: 'Low' },
];

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    position: 'absolute' as const,
    zIndex: 1000,
    backgroundColor: 'rgba(10, 10, 15, 0.9)',
    borderRadius: '12px',
    padding: '16px',
    minWidth: '280px',
    maxHeight: '80vh',
    overflowY: 'auto' as const,
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    color: '#ffffff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    color: '#06b6d4',
  },
  collapseButton: {
    background: 'transparent',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px 8px',
  },
  section: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    color: '#666',
    marginBottom: '8px',
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  button: {
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#ccc',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  buttonActive: {
    background: 'rgba(6, 182, 212, 0.3)',
    borderColor: '#06b6d4',
    color: '#06b6d4',
  },
  slider: {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    appearance: 'none' as const,
    background: 'rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
  },
  sliderValue: {
    fontSize: '12px',
    color: '#888',
    textAlign: 'right' as const,
    marginTop: '4px',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
  },
  toggleLabel: {
    fontSize: '12px',
    color: '#ccc',
  },
  toggleSwitch: {
    width: '40px',
    height: '20px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    position: 'relative' as const,
    transition: 'background 0.2s ease',
  },
  toggleSwitchActive: {
    background: '#06b6d4',
  },
  toggleKnob: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: '#fff',
    position: 'absolute' as const,
    top: '2px',
    left: '2px',
    transition: 'left 0.2s ease',
  },
  toggleKnobActive: {
    left: '22px',
  },
  emotionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function OrbDemoController({
  state,
  emotion,
  intensity,
  quality,
  autoCycle,
  simulateAudio,
  onStateChange,
  onEmotionChange,
  onIntensityChange,
  onQualityChange,
  onAutoCycleChange,
  onSimulateAudioChange,
  onCameraPreset,
  position = 'top-right',
  defaultCollapsed = false,
}: OrbDemoControllerProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  
  // Position styles
  const positionStyle = {
    'top-left': { top: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' },
  }[position];
  
  const emotions = getAllEmotions();
  
  if (collapsed) {
    return (
      <div style={{ ...styles.container, ...positionStyle, minWidth: 'auto', padding: '8px 16px' }}>
        <button
          style={styles.collapseButton}
          onClick={() => setCollapsed(false)}
          title="Expand Controls"
        >
          ⚙️
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ ...styles.container, ...positionStyle }}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>Orb Controls</span>
        <button
          style={styles.collapseButton}
          onClick={() => setCollapsed(true)}
          title="Collapse"
        >
          ×
        </button>
      </div>
      
      {/* State Selection */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>State</div>
        <div style={styles.buttonGroup}>
          {STATES.map((s) => (
            <button
              key={s}
              style={{
                ...styles.button,
                ...(state === s ? styles.buttonActive : {}),
              }}
              onClick={() => onStateChange(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Emotion Selection */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Emotion</div>
        <div style={styles.emotionGrid}>
          {emotions.map((e) => (
            <button
              key={e}
              style={{
                ...styles.button,
                ...(emotion === e ? styles.buttonActive : {}),
              }}
              onClick={() => onEmotionChange(e)}
            >
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Intensity Slider */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Intensity</div>
        <input
          type="range"
          min="0"
          max="100"
          value={intensity * 100}
          onChange={(e) => onIntensityChange(parseInt(e.target.value) / 100)}
          style={styles.slider}
        />
        <div style={styles.sliderValue}>{Math.round(intensity * 100)}%</div>
      </div>
      
      {/* Quality Selection */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Quality</div>
        <div style={styles.buttonGroup}>
          {(['low', 'medium', 'high'] as const).map((q) => (
            <button
              key={q}
              style={{
                ...styles.button,
                ...(quality === q ? styles.buttonActive : {}),
              }}
              onClick={() => onQualityChange(q)}
            >
              {q.charAt(0).toUpperCase() + q.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Camera Presets */}
      {onCameraPreset && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Camera</div>
          <div style={styles.buttonGroup}>
            {CAMERA_PRESETS.map((preset) => (
              <button
                key={preset.id}
                style={styles.button}
                onClick={() => onCameraPreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Toggles */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Options</div>
        
        {/* Auto Cycle */}
        <div style={styles.toggle}>
          <span style={styles.toggleLabel}>Auto Cycle</span>
          <div
            style={{
              ...styles.toggleSwitch,
              ...(autoCycle ? styles.toggleSwitchActive : {}),
            }}
            onClick={() => onAutoCycleChange(!autoCycle)}
          >
            <div
              style={{
                ...styles.toggleKnob,
                ...(autoCycle ? styles.toggleKnobActive : {}),
              }}
            />
          </div>
        </div>
        
        {/* Simulate Audio */}
        <div style={styles.toggle}>
          <span style={styles.toggleLabel}>Simulate Audio</span>
          <div
            style={{
              ...styles.toggleSwitch,
              ...(simulateAudio ? styles.toggleSwitchActive : {}),
            }}
            onClick={() => onSimulateAudioChange(!simulateAudio)}
          >
            <div
              style={{
                ...styles.toggleKnob,
                ...(simulateAudio ? styles.toggleKnobActive : {}),
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Footer info */}
      <div style={{ fontSize: '10px', color: '#555', marginTop: '12px', textAlign: 'center' as const }}>
        Galion Orb V3 Preview
      </div>
    </div>
  );
}

export default OrbDemoController;

