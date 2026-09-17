/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  X, 
  Subtitles, 
  RotateCcw, 
  Sliders, 
  Clock, 
  Eye, 
  Check, 
  Sparkles,
  Minus,
  Plus
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { 
  SubtitleFontSize, 
  SubtitleTextColor, 
  SubtitleBgOpacity, 
  SubtitleEdgeStyle, 
  SubtitlePreset 
} from '../types/iptv';
import { 
  FONT_SIZE_MAP, 
  TEXT_COLOR_MAP, 
  EDGE_STYLE_MAP, 
  FONT_FAMILY_MAP, 
  formatSyncOffset 
} from '../utils/subtitleEngine';

interface SubtitleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubtitleSettingsModal({ isOpen, onClose }: SubtitleSettingsModalProps) {
  const { 
    subtitleConfig, 
    setSubtitleConfig, 
    setSubtitlePreset, 
    setSubtitleSyncOffset, 
    resetSubtitleConfig 
  } = usePlayerStore();

  if (!isOpen) return null;

  const previewColor = TEXT_COLOR_MAP[subtitleConfig.textColor]?.hex || '#ffffff';
  const previewSize = FONT_SIZE_MAP[subtitleConfig.fontSize]?.px || '20px';
  const previewShadow = EDGE_STYLE_MAP[subtitleConfig.edgeStyle]?.shadow || 'none';
  const previewBg = `rgba(0, 0, 0, ${(subtitleConfig.bgOpacity / 100).toFixed(2)})`;
  const previewFont = FONT_FAMILY_MAP[subtitleConfig.fontFamily]?.css || 'sans-serif';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col scrollbar-thin">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-zinc-950/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Subtitles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Subtitles & CC Appearance
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  REAL-TIME STYLER
                </span>
              </h3>
              <p className="text-xs text-zinc-400">Customize closed caption size, typography, high-contrast colors, and audio sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Live Preview Box */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                Live Video Subtitle Preview
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Simulated Broadcast Frame</span>
            </div>
            <div className="relative w-full h-36 rounded-2xl bg-gradient-to-tr from-zinc-900 via-slate-900 to-indigo-950/50 border border-white/10 flex items-end justify-center p-4 overflow-hidden shadow-inner">
              <div className="absolute top-2 left-3 text-[10px] font-bold text-zinc-500 tracking-wider uppercase">
                4K HDR Live Playout
              </div>
              <div 
                style={{
                  color: previewColor,
                  fontSize: previewSize,
                  textShadow: previewShadow,
                  backgroundColor: previewBg,
                  fontFamily: previewFont,
                }}
                className="px-3 py-1.5 rounded-lg text-center font-semibold leading-snug transition-all duration-200 max-w-[90%]"
              >
                Welcome to IPTV.menu broadcast • High-fidelity captions active
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Subtitle Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['broadcast', 'cinema', 'teletext', 'minimal'] as SubtitlePreset[]).map((p) => {
                const isSelected = subtitleConfig.preset === p;
                const labels: Record<string, string> = {
                  broadcast: 'Broadcast',
                  cinema: 'Cinema Yellow',
                  teletext: 'Teletext Cyan',
                  minimal: 'Minimal Outline'
                };
                return (
                  <button
                    key={p}
                    onClick={() => setSubtitlePreset(p)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer capitalize flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                        : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{labels[p]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Size & Text Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Font Size */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400">Font Size</label>
              <div className="grid grid-cols-2 gap-2">
                {(['small', 'medium', 'large', 'xlarge'] as SubtitleFontSize[]).map((size) => {
                  const isSelected = subtitleConfig.fontSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSubtitleConfig({ fontSize: size })}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{FONT_SIZE_MAP[size].label}</span>
                      <span className="text-[10px] font-mono text-zinc-500">{FONT_SIZE_MAP[size].px}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text Color */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400">Text Color</label>
              <div className="grid grid-cols-2 gap-2">
                {(['white', 'yellow', 'cyan', 'green'] as SubtitleTextColor[]).map((c) => {
                  const isSelected = subtitleConfig.textColor === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setSubtitleConfig({ textColor: c })}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-black/50 flex-shrink-0"
                        style={{ backgroundColor: TEXT_COLOR_MAP[c].hex }}
                      />
                      <span className="truncate">{TEXT_COLOR_MAP[c].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Background Opacity & Edge Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Background Opacity */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400">Background Opacity</label>
              <div className="grid grid-cols-5 gap-1">
                {([0, 25, 50, 75, 100] as SubtitleBgOpacity[]).map((op) => {
                  const isSelected = subtitleConfig.bgOpacity === op;
                  return (
                    <button
                      key={op}
                      onClick={() => setSubtitleConfig({ bgOpacity: op })}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {op}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Edge Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400">Edge Style</label>
              <div className="grid grid-cols-2 gap-2">
                {(['none', 'dropshadow', 'raised', 'outline'] as SubtitleEdgeStyle[]).map((edge) => {
                  const isSelected = subtitleConfig.edgeStyle === edge;
                  return (
                    <button
                      key={edge}
                      onClick={() => setSubtitleConfig({ edgeStyle: edge })}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {EDGE_STYLE_MAP[edge].label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Audio / Subtitle Sync Offset Controls */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">Audio/Subtitle Sync Offset</span>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {formatSyncOffset(subtitleConfig.syncOffsetMs)}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              If upstream captions appear ahead of or behind the live audio stream, adjust the sync timing offset in 250ms increments.
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSubtitleSyncOffset(subtitleConfig.syncOffsetMs - 500)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <Minus className="w-3 h-3" /> 500ms
              </button>
              <button
                onClick={() => setSubtitleSyncOffset(subtitleConfig.syncOffsetMs - 250)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <Minus className="w-3 h-3" /> 250ms
              </button>
              <button
                onClick={() => setSubtitleSyncOffset(0)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  subtitleConfig.syncOffsetMs === 0
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
                }`}
              >
                Sync (0ms)
              </button>
              <button
                onClick={() => setSubtitleSyncOffset(subtitleConfig.syncOffsetMs + 250)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" /> 250ms
              </button>
              <button
                onClick={() => setSubtitleSyncOffset(subtitleConfig.syncOffsetMs + 500)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" /> 500ms
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between sticky bottom-0 bg-zinc-950/95 backdrop-blur-md z-10">
          <button
            onClick={resetSubtitleConfig}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubtitleSettingsModal;
