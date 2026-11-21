'use client';

/**
 * JarvisControls.tsx - Interactive Control Panel for Jarvis Hologram
 * 
 * Features:
 * - Quality selector (Low/Medium/High)
 * - Intensity slider
 * - Toggle controls (helmet, ribbons, particles)
 * - Preset management (Movie Accurate, Performance, Ultra Quality)
 * - Reset animation button
 * - Camera orbit control
 * - Settings export/import
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Settings, RotateCcw, Save, Copy, Zap, Layers } from 'lucide-react';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type QualityLevel = 'low' | 'medium' | 'high';

export interface JarvisSettings {
  quality: QualityLevel;
  intensity: number;
  showHelmet: boolean;
  showRibbons: boolean;
  showParticles: boolean;
  autoOrbit: boolean;
  orbitSpeed: number;
}

export const PRESET_CONFIGS: Record<string, JarvisSettings> = {
  'movie-accurate': {
    quality: 'high',
    intensity: 1.0,
    showHelmet: true,
    showRibbons: true,
    showParticles: true,
    autoOrbit: true,
    orbitSpeed: 0.3,
  },
  'performance': {
    quality: 'low',
    intensity: 0.7,
    showHelmet: false,
    showRibbons: true,
    showParticles: false,
    autoOrbit: false,
    orbitSpeed: 0.2,
  },
  'ultra-quality': {
    quality: 'high',
    intensity: 1.5,
    showHelmet: true,
    showRibbons: true,
    showParticles: true,
    autoOrbit: true,
    orbitSpeed: 0.5,
  },
};

// ============================================================================
// COMPONENT: Control Slider
// ============================================================================

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
}

function ControlSlider({ label, value, min, max, step, onChange, unit = '' }: ControlSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm text-white/70 tracking-wider">{label}</label>
        <span className="text-xs font-mono text-amber-500">
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-gradient-to-r from-amber-500/20 to-amber-500/40 rounded-full appearance-none cursor-pointer accent-amber-500"
      />
    </div>
  );
}

// ============================================================================
// COMPONENT: Toggle Button
// ============================================================================

interface ToggleButtonProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  icon?: React.ReactNode;
}

function ToggleButton({ label, enabled, onChange, icon }: ToggleButtonProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`w-full px-4 py-2 rounded-lg border transition-all flex items-center gap-2 justify-between text-sm font-medium ${
        enabled
          ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
          : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <div className={`w-3 h-3 rounded-full transition-colors ${
        enabled ? 'bg-amber-500' : 'bg-white/20'
      }`} />
    </button>
  );
}

// ============================================================================
// COMPONENT: Quality Selector
// ============================================================================

interface QualitySelectorProps {
  quality: QualityLevel;
  onChange: (quality: QualityLevel) => void;
}

function QualitySelector({ quality, onChange }: QualitySelectorProps) {
  const qualities: Array<{ value: QualityLevel; label: string; description: string }> = [
    { value: 'low', label: 'LOW', description: '1500 particles' },
    { value: 'medium', label: 'MEDIUM', description: '4000 particles' },
    { value: 'high', label: 'HIGH', description: '8000 particles' },
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm text-white/70 tracking-wider">QUALITY PRESET</label>
      <div className="grid grid-cols-3 gap-2">
        {qualities.map((q) => (
          <button
            key={q.value}
            onClick={() => onChange(q.value)}
            className={`px-3 py-2 rounded-lg border transition-all text-center ${
              quality === q.value
                ? 'bg-amber-500/30 border-amber-500/60 text-amber-400'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            <div className="text-xs font-bold">{q.label}</div>
            <div className="text-[10px] text-white/40 mt-1">{q.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: Preset Buttons
// ============================================================================

interface PresetButtonsProps {
  currentPreset: string;
  onPresetSelect: (preset: string, settings: JarvisSettings) => void;
}

function PresetButtons({ currentPreset, onPresetSelect }: PresetButtonsProps) {
  const presets = Object.entries(PRESET_CONFIGS);

  return (
    <div className="space-y-2">
      <label className="text-xs text-white/50 tracking-widest">PRESETS</label>
      <div className="grid grid-cols-2 gap-2">
        {presets.map(([preset, settings]) => (
          <button
            key={preset}
            onClick={() => onPresetSelect(preset, settings)}
            className={`px-3 py-2 rounded-lg border transition-all text-xs font-medium ${
              currentPreset === preset
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            {preset.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: JarvisControls
// ============================================================================

export interface JarvisControlsProps {
  settings: JarvisSettings;
  onSettingsChange: (settings: JarvisSettings) => void;
  onResetAnimation?: () => void;
  onExportSettings?: (settings: JarvisSettings) => void;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
}

export function JarvisControls({
  settings,
  onSettingsChange,
  onResetAnimation,
  onExportSettings,
  isOpen = true,
  onToggleOpen,
}: JarvisControlsProps) {
  const [currentPreset, setCurrentPreset] = useState('movie-accurate');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const handleQualityChange = useCallback((quality: QualityLevel) => {
    setCurrentPreset('custom');
    onSettingsChange({ ...settings, quality });
  }, [settings, onSettingsChange]);

  const handleIntensityChange = useCallback((intensity: number) => {
    setCurrentPreset('custom');
    onSettingsChange({ ...settings, intensity });
  }, [settings, onSettingsChange]);

  const handleToggle = useCallback((key: keyof Omit<JarvisSettings, 'quality' | 'intensity' | 'orbitSpeed'>, value: boolean) => {
    setCurrentPreset('custom');
    onSettingsChange({ ...settings, [key]: value });
  }, [settings, onSettingsChange]);

  const handleOrbitSpeedChange = useCallback((speed: number) => {
    setCurrentPreset('custom');
    onSettingsChange({ ...settings, orbitSpeed: speed });
  }, [settings, onSettingsChange]);

  const handlePresetSelect = useCallback((preset: string, config: JarvisSettings) => {
    setCurrentPreset(preset);
    onSettingsChange(config);
  }, [onSettingsChange]);

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(settings, null, 2);
    navigator.clipboard.writeText(dataStr).then(() => {
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    });
    onExportSettings?.(settings);
  }, [settings, onExportSettings]);

  if (!isOpen) {
    return (
      <button
        onClick={() => onToggleOpen?.(true)}
        className="absolute top-6 right-6 p-3 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 hover:border-amber-500/50 text-white hover:text-amber-400 transition-all z-10"
        title="Open Controls"
      >
        <Settings className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="absolute top-6 right-6 w-80 max-h-[90vh] bg-black/80 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-6 overflow-y-auto shadow-2xl z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-white font-semibold tracking-wider">JARVIS CONTROL</h3>
        </div>
        <button
          onClick={() => onToggleOpen?.(false)}
          className="text-white/50 hover:text-white/70 transition-colors"
          title="Close Controls"
        >
          ✕
        </button>
      </div>

      {/* Quality Selector */}
      <div className="mb-6 space-y-4">
        <QualitySelector quality={settings.quality} onChange={handleQualityChange} />
      </div>

      {/* Presets */}
      <div className="mb-6">
        <PresetButtons currentPreset={currentPreset} onPresetSelect={handlePresetSelect} />
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-white/10" />

      {/* Intensity Control */}
      <div className="mb-6">
        <ControlSlider
          label="INTENSITY"
          value={settings.intensity}
          min={0.1}
          max={2}
          step={0.1}
          onChange={handleIntensityChange}
        />
      </div>

      {/* Orbit Speed Control */}
      <div className="mb-6">
        <ControlSlider
          label="ORBIT SPEED"
          value={settings.orbitSpeed}
          min={0}
          max={1}
          step={0.1}
          onChange={handleOrbitSpeedChange}
        />
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-white/10" />

      {/* Toggle Controls */}
      <div className="space-y-3 mb-6">
        <ToggleButton
          label="HELMET"
          enabled={settings.showHelmet}
          onChange={(val) => handleToggle('showHelmet', val)}
          icon={<Layers className="w-4 h-4" />}
        />
        <ToggleButton
          label="DATA RIBBONS"
          enabled={settings.showRibbons}
          onChange={(val) => handleToggle('showRibbons', val)}
          icon={<Layers className="w-4 h-4" />}
        />
        <ToggleButton
          label="PARTICLES"
          enabled={settings.showParticles}
          onChange={(val) => handleToggle('showParticles', val)}
          icon={<Layers className="w-4 h-4" />}
        />
        <ToggleButton
          label="AUTO ORBIT"
          enabled={settings.autoOrbit}
          onChange={(val) => handleToggle('autoOrbit', val)}
          icon={<Layers className="w-4 h-4" />}
        />
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-white/10" />

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => onResetAnimation?.()}
          className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 hover:border-amber-500/60 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          RESET ANIMATION
        </button>

        <button
          onClick={handleExport}
          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Copy className="w-4 h-4" />
          {copiedToClipboard ? 'COPIED!' : 'EXPORT SETTINGS'}
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <p className="text-[10px] text-white/40 text-center tracking-widest">
          STARK INDUSTRIES<br />J.A.R.V.I.S. v1.0
        </p>
      </div>
    </div>
  );
}

export default JarvisControls;
