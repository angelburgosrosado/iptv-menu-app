/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  Radio, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Sparkles, 
  Activity,
  Disc3,
  Waves
} from 'lucide-react';

interface RadioPlayerHeroProps {
  channelName: string;
  groupTitle?: string;
  logoUrl?: string;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  activeEngine: string;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onOpenEqualizer?: () => void;
  onSwitchToVideoMode?: () => void;
}

export function RadioPlayerHero({
  channelName,
  groupTitle,
  logoUrl,
  isPlaying,
  isMuted,
  volume,
  activeEngine,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onOpenEqualizer,
  onSwitchToVideoMode
}: RadioPlayerHeroProps) {
  // Generate random heights for animated visualizer bars
  const [waveHeights, setWaveHeights] = React.useState<number[]>([
    40, 65, 85, 30, 95, 75, 50, 80, 60, 90, 45, 70, 85, 40, 60, 95, 50, 75, 80, 45
  ]);

  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setWaveHeights((prev) => 
        prev.map(() => Math.floor(Math.random() * 75) + 20)
      );
    }, 150);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-black select-none">
      {/* Blurred ambient background glow from logo */}
      {logoUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-125 transition-all duration-1000"
          style={{ backgroundImage: `url(${logoUrl})` }}
        />
      )}

      {/* Atmospheric radial grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/15 via-transparent to-transparent pointer-events-none" />

      {/* Top Protocol & Mode Header */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wider">
            <span className="relative flex h-2 w-2">
              {isPlaying && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            LIVE RADIO BROADCAST
          </div>

          <div className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-medium">
            Engine: <span className="text-blue-400 font-mono uppercase">{activeEngine}</span>
          </div>
        </div>

        {onSwitchToVideoMode && (
          <button
            onClick={onSwitchToVideoMode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
            title="Switch to Video Viewport"
          >
            <Activity size={13} className="text-blue-400" />
            Switch to Video View
          </button>
        )}
      </div>

      {/* Centerpiece: Spinning Vinyl Album / Station Logo */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative group cursor-pointer" onClick={onTogglePlay}>
          {/* Vinyl Record Shadow & Outer Ring */}
          <div className={`w-52 h-52 md:w-64 md:h-64 rounded-full bg-slate-950 border-4 border-slate-800 shadow-[0_0_50px_rgba(37,99,235,0.25)] flex items-center justify-center transition-transform duration-700 ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}>
            {/* Grooves texture */}
            <div className="w-44 h-44 md:w-56 md:h-56 rounded-full border border-slate-800/80 flex items-center justify-center">
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full border border-slate-800/60 flex items-center justify-center">
                {/* Station Artwork / Vinyl Center Label */}
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-slate-900 border-2 border-blue-500/40 shadow-inner flex items-center justify-center">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt={channelName} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Disc3 size={48} className="text-blue-400 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
            {/* Center Spindle Hole */}
            <div className="absolute w-4 h-4 rounded-full bg-slate-900 border border-slate-700 z-10" />
          </div>

          {/* Center Play/Pause Overlay Indicator on Hover */}
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            {isPlaying ? (
              <Pause size={36} className="text-white drop-shadow-md" />
            ) : (
              <Play size={36} className="text-white drop-shadow-md ml-1" />
            )}
          </div>
        </div>

        {/* Station Name & Metadata */}
        <div className="mt-8 text-center max-w-lg px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-sm">
            {channelName}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-400">
            {groupTitle ? `${groupTitle} • ` : ''}Digital FM / Audio Stream
          </p>
        </div>

        {/* Audio Visualizer Waves */}
        <div className="mt-6 flex items-end justify-center gap-1.5 h-12 w-80 px-4">
          {waveHeights.map((h, idx) => (
            <div
              key={idx}
              className="w-1.5 rounded-full bg-gradient-to-t from-blue-600 via-sky-400 to-indigo-300 transition-all duration-150"
              style={{
                height: isPlaying ? `${h}%` : '8%',
                opacity: isPlaying ? 0.9 : 0.25
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom Transport & Equalizer Controls */}
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-20 px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl max-w-2xl mx-auto shadow-2xl">
        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>

        {/* Volume Slider & Mute Toggle */}
        <div className="flex items-center gap-3 flex-1 max-w-xs mx-6">
          <button
            onClick={onToggleMute}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={18} className="text-rose-400" />
            ) : (
              <Volume2 size={18} />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs text-slate-400 font-mono w-8 text-right">
            {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
          </span>
        </div>

        {/* DSP Equalizer Launcher */}
        {onOpenEqualizer && (
          <button
            onClick={onOpenEqualizer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-slate-700"
            title="Audio Equalizer & Sound Normalization"
          >
            <Sliders size={14} className="text-emerald-400" />
            <span>EQ</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default RadioPlayerHero;
