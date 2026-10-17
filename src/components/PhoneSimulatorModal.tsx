/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { Smartphone, X, Maximize2, Sparkles, Tv, RotateCcw } from 'lucide-react';
import { Stack, simRouter, useSimulatorModal } from '../shims/expo-router';
import HomeScreen from '../app/index';
import PlayerScreen from '../app/player/[id]';
import { usePlayerStore } from '../store/usePlayerStore';
import { Channel } from '../types/iptv';

interface PhoneSimulatorModalProps {
  onNavigateToBuilder?: () => void;
  onOpenCinema?: (channel: Channel) => void;
}

export default function PhoneSimulatorModal({
  onNavigateToBuilder,
  onOpenCinema
}: PhoneSimulatorModalProps) {
  const { isOpen, close } = useSimulatorModal();
  const { channels, vodChannels = [], seriesChannels = [] } = usePlayerStore();

  // Close on ESC key press
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  // Determine current playing channel from current params if available
  const currentParams = simRouter.currentParams();
  const playingChannelId = currentParams?.id;
  const currentChannel = playingChannelId
    ? channels.find((c) => c.id === playingChannelId) ||
      vodChannels.find((c) => c.id === playingChannelId) ||
      seriesChannels.find((c) => c.id === playingChannelId)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          close();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Phone Simulator"
    >
      <div className="flex flex-col items-center max-w-full max-h-full">
        {/* Simulator Top Control Toolbar */}
        <div className="w-full max-w-[390px] flex items-center justify-between gap-2 px-3 py-2 bg-zinc-900/90 border border-white/10 rounded-2xl mb-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Smartphone className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white truncate">Phone Simulator</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                  60 FPS
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate">
                {currentChannel ? currentChannel.name : 'Interactive React Native Engine'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {currentChannel && onOpenCinema && (
              <button
                onClick={() => {
                  close();
                  onOpenCinema(currentChannel);
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Switch to Web Cinema Player (Full Desktop)"
              >
                <Tv className="w-4 h-4" />
              </button>
            )}

            {onNavigateToBuilder && (
              <button
                onClick={() => {
                  close();
                  onNavigateToBuilder();
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Open in App Studio (Code & APK Builder)"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
              </button>
            )}

            <button
              onClick={() => simRouter.replace('/')}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Return to Mobile Home Screen"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={close}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
              title="Close Simulator (Esc)"
              aria-label="Close Simulator"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Apple iPhone Glass Device Frame */}
        <div className="w-[330px] sm:w-[360px] h-[670px] sm:h-[720px] max-h-[calc(100vh-100px)] rounded-[48px] bg-black/95 backdrop-blur-2xl p-3 shadow-[0_25px_90px_-10px_rgba(59,130,246,0.3)] border-[6px] border-zinc-700/80 relative z-10 overflow-hidden ring-1 ring-white/20 flex flex-col">
          
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-5 bg-black rounded-full z-40 flex items-center justify-between px-3 border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            <div className="w-3 h-1 bg-zinc-800 rounded-full" />
          </div>

          {/* iOS Status Bar */}
          <div className="h-8 pt-0.5 px-6 flex items-center justify-between text-[11px] font-semibold text-zinc-300 select-none z-30">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">5G</span>
              <div className="w-5 h-2.5 rounded-[3px] border border-zinc-500 p-[1px] flex items-center">
                <div className="h-full w-4/5 bg-zinc-300 rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* Simulator Screen Root Content */}
          <div className="flex-1 w-full bg-[#050505] rounded-[34px] overflow-hidden relative flex flex-col ring-1 ring-white/10 shadow-inner">
            <Stack>
              <Stack.Screen name="index" component={HomeScreen} />
              <Stack.Screen name="player/[id]" component={PlayerScreen} />
            </Stack>
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="h-4 flex items-center justify-center z-30 pt-1">
            <div 
              onClick={() => simRouter.replace('/')} 
              className="w-28 h-1 bg-zinc-600 hover:bg-zinc-400 rounded-full cursor-pointer transition-colors"
              title="Tap to return home"
            />
          </div>
        </div>

        {/* Bottom Helper Hint */}
        <p className="text-[11px] text-zinc-500 mt-2 text-center">
          Interactive touch simulator • Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[10px]">Esc</kbd> or click outside to dismiss
        </p>
      </div>
    </div>
  );
}
