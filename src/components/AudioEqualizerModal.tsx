/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  Sliders, 
  X, 
  Volume2, 
  Zap, 
  RotateCcw, 
  Activity, 
  Sparkles, 
  Mic, 
  Radio,
  VolumeX,
  Volume1,
  Check
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { AudioDspPreset, AudioDspBands } from '../types/iptv';
import { DSP_PRESETS, audioDspEngine } from '../utils/audioDspEngine';

interface AudioEqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_OPTIONS: { id: AudioDspPreset; label: string; description: string }[] = [
  { id: 'flat', label: 'Flat (Reference)', description: 'Neutral unaltered studio baseline' },
  { id: 'bass_boost', label: 'Bass Boost', description: 'Enhanced low-end sub-bass & warmth' },
  { id: 'vocal_clarity', label: 'Vocal Clarity', description: 'Crisp dialogue & speech emphasis' },
  { id: 'night_mode', label: 'Night Mode', description: 'Soft bass, tight dynamics for late night' },
  { id: 'treble_boost', label: 'Treble Air', description: 'Brighter high-frequencies & sparkle' },
];

const BAND_METADATA: { key: keyof AudioDspBands; label: string; freq: string }[] = [
  { key: 'subBass', label: 'Sub-Bass', freq: '60 Hz' },
  { key: 'lowMid', label: 'Bass', freq: '250 Hz' },
  { key: 'mid', label: 'Mids', freq: '1 kHz' },
  { key: 'upperMid', label: 'Presence', freq: '4 kHz' },
  { key: 'high', label: 'Treble', freq: '14 kHz' },
];

export default function AudioEqualizerModal({ isOpen, onClose }: AudioEqualizerModalProps) {
  const { 
    audioDsp, 
    setDspEnabled, 
    setDspPreset, 
    setDspBand, 
    toggleNormalization, 
    toggleDialogueEnhancer, 
    setPreampGain, 
    resetDsp 
  } = usePlayerStore();

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Real-time audio visualizer animation loop
  React.useEffect(() => {
    if (!isOpen) return;
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(32);

    const renderSpectrum = () => {
      audioDspEngine.getFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / 32) * 2.2;
      let x = 0;

      for (let i = 0; i < 32; i++) {
        const value = dataArray[i];
        const barHeight = Math.max(2, (value / 255) * canvas.height);

        // Gradient color based on frequency
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#6366f1');
        gradient.addColorStop(1, '#a855f7');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1.5, barHeight);

        x += barWidth;
      }

      animationId = requestAnimationFrame(renderSpectrum);
    };

    renderSpectrum();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <div 
        className="w-full max-w-xl bg-zinc-950/95 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-white relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glows */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all ${
              audioDsp.enabled
                ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400 shadow-md shadow-cyan-500/20'
                : 'bg-white/5 border-white/10 text-zinc-500'
            }`}>
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Audio Equalizer & DSP Engine
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                  audioDsp.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/5 text-zinc-400 border-white/10'
                }`}>
                  {audioDsp.enabled ? 'ACTIVE' : 'BYPASSED'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                5-band parametric filters, broadcast loudness normalizer & vocal enhancer.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Master DSP Power Switch */}
            <button
              onClick={() => setDspEnabled(!audioDsp.enabled)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                audioDsp.enabled
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${audioDsp.enabled ? 'fill-current' : ''}`} />
              <span>{audioDsp.enabled ? 'DSP ON' : 'ENABLE'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              aria-label="Close audio equalizer modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Spectrum Visualizer Bar */}
        <div className="bg-black/60 border border-white/5 rounded-2xl p-3 flex flex-col gap-2 z-10">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Live Frequency Spectrum (Web Audio API)
            </span>
            <span className="font-mono text-cyan-300">{audioDsp.preset.toUpperCase()}</span>
          </div>
          <canvas
            ref={canvasRef}
            width={380}
            height={44}
            className="w-full h-11 rounded-lg bg-black/40"
          />
        </div>

        {/* Preset Selector Ribbon */}
        <div className="flex flex-col gap-1.5 z-10">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Audio Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {PRESET_OPTIONS.map((preset) => {
              const isSelected = audioDsp.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDspPreset(preset.id)}
                  className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={preset.description}
                >
                  <span className="truncate">{preset.label.split(' ')[0]}</span>
                  <span className="text-[9px] text-zinc-500 font-normal truncate">
                    {preset.id === 'flat' ? 'Default' : preset.id.replace('_', ' ')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Band Equalizer Sliders */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 z-10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              5-Band Graphic Equalizer
            </span>
            <button
              onClick={resetDsp}
              className="text-[10px] text-zinc-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset all bands to flat baseline"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-5 gap-3 pt-1">
            {BAND_METADATA.map((band) => {
              const gain = audioDsp.bands[band.key];
              return (
                <div key={band.key} className="flex flex-col items-center gap-2">
                  <span className={`text-[11px] font-mono font-bold ${
                    gain > 0 ? 'text-cyan-300' : gain < 0 ? 'text-indigo-400' : 'text-zinc-500'
                  }`}>
                    {gain > 0 ? `+${gain}` : gain} dB
                  </span>

                  {/* Vertical Slider Track Container */}
                  <div className="h-28 flex items-center justify-center relative py-1">
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={0.5}
                      value={gain}
                      onChange={(e) => setDspBand(band.key, parseFloat(e.target.value))}
                      className="accent-cyan-400 w-24 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer -rotate-90"
                      aria-label={`${band.label} (${band.freq}) Gain`}
                    />
                  </div>

                  <div className="text-center">
                    <h5 className="text-xs font-bold text-white leading-none">{band.label}</h5>
                    <span className="text-[9px] font-mono text-zinc-500 mt-0.5 block">{band.freq}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sound Normalization & Enhancements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 z-10">
          {/* Loudness Normalizer (Dynamics Compressor) */}
          <div 
            onClick={toggleNormalization}
            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
              audioDsp.normalization
                ? 'bg-cyan-500/10 border-cyan-500/30'
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
            }`}
          >
            <div className={`p-2 rounded-xl border flex-shrink-0 ${
              audioDsp.normalization ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-zinc-900 text-zinc-500 border-white/10'
            }`}>
              <Volume1 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-white">Broadcast Normalizer</h5>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                  audioDsp.normalization ? 'bg-cyan-500/20 text-cyan-300' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {audioDsp.normalization ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                Smooths volume spikes & eliminates blasted audio across channels.
              </p>
            </div>
          </div>

          {/* Dialogue & Speech Clarity Enhancer */}
          <div 
            onClick={toggleDialogueEnhancer}
            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
              audioDsp.dialogueEnhancer
                ? 'bg-purple-500/10 border-purple-500/30'
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
            }`}
          >
            <div className={`p-2 rounded-xl border flex-shrink-0 ${
              audioDsp.dialogueEnhancer ? 'bg-purple-500 text-white border-purple-400' : 'bg-zinc-900 text-zinc-500 border-white/10'
            }`}>
              <Mic className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-white">Dialogue Enhancer</h5>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                  audioDsp.dialogueEnhancer ? 'bg-purple-500/20 text-purple-300' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {audioDsp.dialogueEnhancer ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                Boosts speech presence (2.5 kHz) to cut through noisy commentary.
              </p>
            </div>
          </div>
        </div>

        {/* Preamp Volume Gain Slider */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-4 z-10 text-xs">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-zinc-400" />
            <div>
              <h5 className="font-bold text-white">Preamp Clean Gain</h5>
              <span className="text-[10px] text-zinc-400">Boost volume on quiet feeds</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={audioDsp.preampGain}
              onChange={(e) => setPreampGain(parseFloat(e.target.value))}
              className="accent-cyan-400 w-28 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-mono text-cyan-300 font-bold w-12 text-right">
              {audioDsp.preampGain.toFixed(1)}x
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-white/5 z-10">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Hardware-accelerated Web Audio DSP
          </span>
          <span>Shortcut: <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white">Q</kbd></span>
        </div>
      </div>
    </div>
  );
}
