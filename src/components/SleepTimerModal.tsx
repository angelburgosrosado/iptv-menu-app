/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  Moon, 
  X, 
  Clock, 
  VolumeX, 
  Sparkles, 
  Check, 
  Plus, 
  Pause, 
  PowerOff,
  Volume2,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_DURATIONS = [
  { label: '15 Min', minutes: 15 },
  { label: '30 Min', minutes: 30 },
  { label: '45 Min', minutes: 45 },
  { label: '1 Hour', minutes: 60 },
  { label: '1.5 Hours', minutes: 90 },
  { label: '2 Hours', minutes: 120 },
];

export default function SleepTimerModal({ isOpen, onClose }: SleepTimerModalProps) {
  const { sleepTimer, setSleepTimer, cancelSleepTimer, extendSleepTimer } = usePlayerStore();
  
  const [customMinutes, setCustomMinutes] = React.useState(25);
  const [audioFadeOut, setAudioFadeOut] = React.useState(true);
  const [bedtimeDimming, setBedtimeDimming] = React.useState(true);
  const [endAction, setEndAction] = React.useState<'pause' | 'close' | 'mute'>('pause');

  // Sync state if sleepTimer is already configured
  React.useEffect(() => {
    if (sleepTimer.isActive) {
      setAudioFadeOut(sleepTimer.audioFadeOut);
      setBedtimeDimming(sleepTimer.bedtimeDimming);
      setEndAction(sleepTimer.endAction);
    }
  }, [sleepTimer.isActive, sleepTimer.audioFadeOut, sleepTimer.bedtimeDimming, sleepTimer.endAction]);

  if (!isOpen) return null;

  const formatCountdown = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectPreset = (minutes: number) => {
    setSleepTimer(minutes, { audioFadeOut, bedtimeDimming, endAction });
  };

  const handleStartCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMinutes > 0) {
      setSleepTimer(customMinutes, { audioFadeOut, bedtimeDimming, endAction });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <div 
        className="w-full max-w-lg bg-zinc-950/90 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-white relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Night Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Moon className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Sleep Timer & Automation
                {sleepTimer.isActive && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">
                    Running
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Gentle audio fade-out and bedtime dimming before automatic stream shutdown.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            aria-label="Close sleep timer modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Timer Countdown View */}
        {sleepTimer.isActive ? (
          <div className="flex flex-col items-center justify-center gap-4 py-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5 z-10">
            <div className="flex flex-col items-center">
              <span className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold mb-1">
                Stream Will Automatically {sleepTimer.endAction.toUpperCase()} In
              </span>
              <div className="text-5xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-indigo-400">
                {formatCountdown(sleepTimer.remainingSeconds)}
              </div>
              <span className="text-xs text-zinc-400 mt-1">
                Initial duration: {sleepTimer.durationMinutes} minutes
              </span>
            </div>

            {/* Live Automation Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[10px]">
              {sleepTimer.audioFadeOut && (
                <span className={`px-2.5 py-1 rounded-full border font-bold flex items-center gap-1.5 ${
                  sleepTimer.remainingSeconds <= 60
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                    : 'bg-white/5 text-zinc-300 border-white/10'
                }`}>
                  <Volume2 className="w-3 h-3" />
                  {sleepTimer.remainingSeconds <= 60 
                    ? `Fading Audio (${Math.round(sleepTimer.audioDuckRatio * 100)}%)` 
                    : 'Audio Fade (Final 60s)'}
                </span>
              )}

              {sleepTimer.bedtimeDimming && (
                <span className={`px-2.5 py-1 rounded-full border font-bold flex items-center gap-1.5 ${
                  sleepTimer.remainingSeconds <= 120
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse'
                    : 'bg-white/5 text-zinc-300 border-white/10'
                }`}>
                  <Moon className="w-3 h-3" />
                  {sleepTimer.remainingSeconds <= 120 ? 'Bedtime Dim Active' : 'Dimming (Final 2m)'}
                </span>
              )}

              <span className="px-2.5 py-1 rounded-full bg-white/5 text-zinc-300 border border-white/10 font-bold capitalize">
                End: {sleepTimer.endAction}
              </span>
            </div>

            {/* Quick Extension Buttons */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-400 font-medium">Extend:</span>
              <button
                type="button"
                onClick={() => extendSleepTimer(5)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 text-xs text-zinc-200 hover:text-white rounded-xl font-bold transition-all cursor-pointer"
              >
                +5 Min
              </button>
              <button
                type="button"
                onClick={() => extendSleepTimer(15)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 text-xs text-zinc-200 hover:text-white rounded-xl font-bold transition-all cursor-pointer"
              >
                +15 Min
              </button>
              <button
                type="button"
                onClick={() => extendSleepTimer(30)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 text-xs text-zinc-200 hover:text-white rounded-xl font-bold transition-all cursor-pointer"
              >
                +30 Min
              </button>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={cancelSleepTimer}
              className="w-full mt-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Cancel Sleep Timer
            </button>
          </div>
        ) : (
          /* Timer Configuration & Preset Selection View */
          <div className="flex flex-col gap-4 z-10">
            {/* Quick Presets Grid */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Quick Countdown Presets
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {PRESET_DURATIONS.map((preset) => (
                  <button
                    key={preset.minutes}
                    type="button"
                    onClick={() => handleSelectPreset(preset.minutes)}
                    className="py-3 px-2 rounded-2xl bg-white/[0.03] hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/40 text-xs font-bold text-zinc-200 hover:text-white flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group shadow-sm"
                  >
                    <Clock className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Minutes Input Form */}
            <form onSubmit={handleStartCustom} className="flex flex-col gap-2 pt-1 border-t border-white/5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Or Custom Duration
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono outline-none focus:border-indigo-500/50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none">
                    minutes
                  </span>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Moon className="w-3.5 h-3.5 fill-current" />
                  Start Timer
                </button>
              </div>
            </form>

            {/* Automation Preferences Options */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Automation Preferences
              </span>

              {/* Audio Fade-Out Toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    Gradual Audio Fade-out (60s)
                  </h5>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Slowly ramps volume down to zero during the final minute so you don't wake up.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={audioFadeOut}
                  onChange={(e) => setAudioFadeOut(e.target.checked)}
                  className="rounded border-zinc-700 text-indigo-500 focus:ring-indigo-500/20 bg-zinc-900 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Bedtime Dimming Toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-purple-400" />
                    Bedtime Display Dimming (120s)
                  </h5>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Ramps up a deep low-glare twilight scrim over the final 2 minutes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={bedtimeDimming}
                  onChange={(e) => setBedtimeDimming(e.target.checked)}
                  className="rounded border-zinc-700 text-indigo-500 focus:ring-indigo-500/20 bg-zinc-900 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Shutdown Action Picker */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <div>
                  <h5 className="text-xs font-bold text-white">Action on Expiration</h5>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Choose how playback concludes.</p>
                </div>
                <select
                  value={endAction}
                  onChange={(e) => setEndAction(e.target.value as any)}
                  className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="pause">Pause Stream</option>
                  <option value="close">Close Cinema Player</option>
                  <option value="mute">Mute Stream</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-white/5 z-10">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Runs in background across all views
          </span>
          <span>Shortcut: <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white">Z</kbd></span>
        </div>
      </div>
    </div>
  );
}
