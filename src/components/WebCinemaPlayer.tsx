/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  X, 
  Tv, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Search, 
  Grid, 
  Maximize2, 
  Minimize2,
  PictureInPicture,
  ShieldCheck, 
  Zap, 
  Radio, 
  Layers,
  Sparkles,
  Moon,
  Sliders,
  Lock,
  Unlock,
  ShieldAlert
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { usePlayerStore } from '../store/usePlayerStore';
import { VideoPlayer } from './VideoPlayer';
import SleepTimerModal from './SleepTimerModal';
import AudioEqualizerModal from './AudioEqualizerModal';
import { ParentalPinModal } from './ParentalPinModal';

interface WebCinemaPlayerProps {
  initialChannel: Channel;
  onClose: () => void;
  onSwitchToMultiScreen?: () => void;
}

export default function WebCinemaPlayer({
  initialChannel,
  onClose,
  onSwitchToMultiScreen
}: WebCinemaPlayerProps) {
  const { 
    channels, 
    favorites, 
    toggleFavorite, 
    addToHistory, 
    openPiP, 
    sleepTimer, 
    audioDsp,
    parentalControls,
    isChannelLocked,
    toggleChannelLock
  } = usePlayerStore();
  const [currentChannel, setCurrentChannel] = React.useState<Channel>(initialChannel);
  const [showChannelDrawer, setShowChannelDrawer] = React.useState(false);
  const [showSleepTimer, setShowSleepTimer] = React.useState(false);
  const [showEqualizer, setShowEqualizer] = React.useState(false);
  const [showParentalModal, setShowParentalModal] = React.useState(false);
  const [drawerSearch, setDrawerSearch] = React.useState('');
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null);

  const isLocked = React.useMemo(() => {
    return isChannelLocked({ id: currentChannel.id, name: currentChannel.name, group: currentChannel.group });
  }, [isChannelLocked, currentChannel]);

  // Keep track of current index in channels array
  const currentIndex = React.useMemo(() => {
    return channels.findIndex((c) => c.id === currentChannel.id);
  }, [channels, currentChannel.id]);

  const isFav = React.useMemo(() => {
    return favorites.includes(currentChannel.id);
  }, [favorites, currentChannel.id]);

  // Log to history on channel change
  React.useEffect(() => {
    if (currentChannel) {
      addToHistory(currentChannel.id);
    }
  }, [currentChannel, addToHistory]);

  // Channel switching functions
  const handleNextChannel = () => {
    if (channels.length === 0) return;
    const nextIdx = (currentIndex + 1) % channels.length;
    setCurrentChannel(channels[nextIdx]);
  };

  const handlePrevChannel = () => {
    if (channels.length === 0) return;
    const prevIdx = (currentIndex - 1 + channels.length) % channels.length;
    setCurrentChannel(channels[prevIdx]);
  };

  const handleMinimizeToPiP = () => {
    openPiP(currentChannel);
    onClose();
  };

  // Auto-close cinema player if sleep timer expires with 'close' action
  React.useEffect(() => {
    if (!sleepTimer.isActive && sleepTimer.remainingSeconds === 0 && sleepTimer.durationMinutes > 0 && sleepTimer.endAction === 'close') {
      onClose();
    }
  }, [sleepTimer.isActive, sleepTimer.remainingSeconds, sleepTimer.durationMinutes, sleepTimer.endAction, onClose]);

  // Close on Escape key, toggle guide on E, minimize on P, sleep timer on Z
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEqualizer) {
          setShowEqualizer(false);
        } else if (showSleepTimer) {
          setShowSleepTimer(false);
        } else if (showChannelDrawer) {
          setShowChannelDrawer(false);
        } else {
          onClose();
        }
      }
      if ((e.key === 'e' || e.key === 'E') && !(e.target instanceof HTMLInputElement)) {
        setShowChannelDrawer((prev) => !prev);
      }
      if ((e.key === 'p' || e.key === 'P') && !(e.target instanceof HTMLInputElement)) {
        handleMinimizeToPiP();
      }
      if ((e.key === 'z' || e.key === 'Z') && !(e.target instanceof HTMLInputElement)) {
        setShowSleepTimer((prev) => !prev);
      }
      if ((e.key === 'q' || e.key === 'Q') && !(e.target instanceof HTMLInputElement)) {
        setShowEqualizer((prev) => !prev);
      }
      if ((e.key === 'l' || e.key === 'L') && !(e.target instanceof HTMLInputElement)) {
        if (!parentalControls.pinHash || isLocked) {
          setShowParentalModal(true);
        } else {
          toggleChannelLock(currentChannel.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showChannelDrawer, showSleepTimer, showEqualizer, showParentalModal, currentChannel, openPiP, parentalControls.pinHash, isLocked, toggleChannelLock]);

  // Filtered channels for drawer
  const filteredDrawerChannels = React.useMemo(() => {
    let list = channels;
    if (selectedGroup) {
      list = list.filter((c) => c.group === selectedGroup);
    }
    if (drawerSearch.trim()) {
      const q = drawerSearch.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
      );
    }
    return list;
  }, [channels, selectedGroup, drawerSearch]);

  const uniqueGroups = React.useMemo(() => {
    return Array.from(new Set(channels.map((c) => c.group))).sort();
  }, [channels]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col overflow-hidden select-none animate-fade-in">
      {/* Top Header Bar */}
      <header className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white tracking-tight">{currentChannel.name}</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {currentChannel.group || 'Live TV'}
              </span>
              {currentChannel.healthStatus === 'blocked' ? (
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20" title={currentChannel.blockedReason}>
                  FLAGGED: {currentChannel.blockedReason?.toUpperCase() || 'RESTRICTED'}
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ONLINE</span>
                </span>
              )}
              {currentChannel.corsProxyRecommended && (
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20" title="Routed via Node.js Stream Proxy Gateway">
                  GATEWAY PROXY
                </span>
              )}
              {currentChannel.alternateUrls && currentChannel.alternateUrls.length > 0 && (
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" title={`${currentChannel.alternateUrls.length + 1} stream feeds available`}>
                  {currentChannel.alternateUrls.length + 1} FEEDS
                </span>
              )}
              {currentChannel.resolution && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10">
                  {currentChannel.resolution}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-2">
              <span>Channel {currentIndex + 1} of {channels.length}</span>
              <span>•</span>
              <span>Use <strong className="text-blue-400 font-bold">↑ ↓</strong> to switch</span>
              {currentChannel.countryName && (
                <>
                  <span>•</span>
                  <span>{currentChannel.countryFlag} {currentChannel.countryName}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-2.5">
          {/* Quick channel drawer toggle */}
          <button
            onClick={() => setShowChannelDrawer((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              showChannelDrawer 
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Channel Guide (E)</span>
          </button>

          {/* Switch to Quad-View Matrix if requested */}
          {onSwitchToMultiScreen && (
            <button
              onClick={() => {
                onClose();
                onSwitchToMultiScreen();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-all flex items-center gap-1.5"
              title="Launch Multi-Screen Quad Canvas"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Quad-View</span>
            </button>
          )}

          {/* Favorite Button */}
          <button
            onClick={() => toggleFavorite(currentChannel.id)}
            className={`p-2 rounded-xl border transition-all ${
              isFav 
                ? 'bg-red-500/15 text-red-400 border-red-500/30' 
                : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
            }`}
            title={isFav ? 'Remove Favorite' : 'Save Favorite'}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
          </button>

          {/* Sleep Timer Button */}
          <button
            onClick={() => setShowSleepTimer(true)}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              sleepTimer.isActive
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-md shadow-indigo-500/10'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10 hover:text-white'
            }`}
            title="Set Sleep Timer (Z)"
            aria-label="Set Sleep Timer"
          >
            <Moon className={`w-4 h-4 ${sleepTimer.isActive ? 'fill-current text-indigo-400 animate-pulse' : 'text-zinc-400'}`} />
            <span className="text-xs font-bold hidden sm:inline">
              {sleepTimer.isActive ? `${Math.ceil(sleepTimer.remainingSeconds / 60)}m` : 'Sleep'}
            </span>
          </button>

          {/* Audio Equalizer & DSP Button */}
          <button
            onClick={() => setShowEqualizer(true)}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              audioDsp.enabled
                ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40 shadow-md shadow-cyan-500/10'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10 hover:text-white'
            }`}
            title="Audio Equalizer & Sound Normalizer (Q)"
            aria-label="Audio Equalizer"
          >
            <Sliders className={`w-4 h-4 ${audioDsp.enabled ? 'text-cyan-400' : 'text-zinc-400'}`} />
            <span className="text-xs font-bold hidden sm:inline">
              {audioDsp.enabled ? audioDsp.preset.toUpperCase() : 'EQ'}
            </span>
          </button>

          {/* Parental Controls Lock Button */}
          <button
            onClick={() => {
              if (!parentalControls.pinHash || isLocked) {
                setShowParentalModal(true);
              } else {
                toggleChannelLock(currentChannel.id);
              }
            }}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              isLocked
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-md shadow-rose-500/10'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10 hover:text-white'
            }`}
            title={isLocked ? "Unlock Channel with PIN (L)" : "Lock Channel with PIN (L)"}
            aria-label="Parental Lock"
          >
            {isLocked ? <Lock className="w-4 h-4 text-rose-400" /> : <Unlock className="w-4 h-4 text-zinc-400" />}
            <span className="text-xs font-bold hidden sm:inline">
              {isLocked ? 'Locked' : 'Lock'}
            </span>
          </button>

          {/* Minimize to PiP Button */}
          <button
            onClick={handleMinimizeToPiP}
            className="p-2 rounded-xl bg-white/5 hover:bg-blue-600/20 text-zinc-300 hover:text-cyan-300 border border-white/10 transition-all flex items-center gap-1.5"
            title="Minimize to Floating PiP (P)"
            aria-label="Minimize to Picture in Picture"
          >
            <PictureInPicture className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold hidden sm:inline">PiP</span>
          </button>

          {/* Close Cinema Mode */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 transition-all ml-1"
            title="Exit Cinema Mode (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Player Canvas Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        
        {/* Left / Right Quick Channel Surfing Chevrons */}
        <button
          onClick={handlePrevChannel}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 hover:bg-blue-600/80 text-white backdrop-blur-md border border-white/10 opacity-40 hover:opacity-100 transition-all cursor-pointer"
          title="Previous Channel (↑)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNextChannel}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 hover:bg-blue-600/80 text-white backdrop-blur-md border border-white/10 opacity-40 hover:opacity-100 transition-all cursor-pointer"
          title="Next Channel (↓)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Video Player Core with Key/D-Pad Navigation */}
        <div className="w-full h-full max-w-7xl max-h-[85vh] p-2 md:p-6 flex items-center justify-center">
          <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black relative">
            <VideoPlayer
              key={currentChannel.id}
              streamUrl={currentChannel.url}
              channelName={currentChannel.name}
              groupTitle={currentChannel.group}
              alternateUrls={currentChannel.alternateUrls}
              corsProxyRecommended={currentChannel.corsProxyRecommended}
              onNextChannel={handleNextChannel}
              onPrevChannel={handlePrevChannel}
              enableKeyboardNavigation={!showChannelDrawer}
            />
          </div>
        </div>

        {/* Slide-in Channel Guide Drawer */}
        {showChannelDrawer && (
          <aside className="absolute inset-y-0 right-0 w-80 md:w-96 bg-zinc-950/95 backdrop-blur-2xl border-l border-white/10 z-40 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Channel Lineup</h3>
              </div>
              <button
                onClick={() => setShowChannelDrawer(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Search */}
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Quick search channels..."
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                />
              </div>

              {/* Category pills */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  onClick={() => setSelectedGroup(null)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap border ${
                    !selectedGroup 
                      ? 'bg-blue-600 text-white border-blue-500' 
                      : 'bg-white/5 text-zinc-400 border-white/5'
                  }`}
                >
                  All ({channels.length})
                </button>
                {uniqueGroups.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGroup(g)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap border ${
                      selectedGroup === g 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'bg-white/5 text-zinc-400 border-white/5'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Channel List */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-white/5 scrollbar-thin">
              {filteredDrawerChannels.map((c, idx) => {
                const isSelected = c.id === currentChannel.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setCurrentChannel(c);
                      setShowChannelDrawer(false);
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-600/20 border border-blue-500/40 text-white' 
                        : 'hover:bg-white/5 text-zinc-300'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-zinc-500 w-5 text-right">{idx + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center p-1 flex-shrink-0">
                      <img
                        src={c.logo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=80&auto=format&fit=crop&q=60'}
                        alt={c.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=80&auto=format&fit=crop&q=60';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate">{c.name}</h4>
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">{c.group}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[9px] text-blue-400 font-bold px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                        NOW
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Bedtime Dimming Scrim Overlay (smooth progressive opacity over final 120s) */}
        {sleepTimer.isActive && sleepTimer.bedtimeDimming && sleepTimer.dimRatio > 0 && (
          <div 
            style={{ backgroundColor: `rgba(0, 0, 0, ${sleepTimer.dimRatio})` }}
            onClick={() => setShowSleepTimer(true)}
            className="absolute inset-0 z-30 pointer-events-auto cursor-pointer transition-all duration-1000 flex items-center justify-center"
          >
            {sleepTimer.remainingSeconds <= 30 && (
              <div className="bg-black/90 border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-2xl backdrop-blur-md animate-pulse">
                <Moon className="w-5 h-5 text-indigo-400 fill-current" />
                <div>
                  <h4 className="text-xs font-bold text-white">Bedtime Mode • Closing Soon</h4>
                  <p className="text-[10px] text-zinc-400">Tap anywhere to extend or cancel timer</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-10 px-6 bg-zinc-950 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500 z-20">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Dual-Engine MSE Engine Active
          </span>
          {sleepTimer.isActive && (
            <>
              <span className="hidden sm:inline">•</span>
              <button
                onClick={() => setShowSleepTimer(true)}
                className="flex items-center gap-1 text-indigo-300 hover:text-indigo-200 font-bold cursor-pointer"
              >
                <Moon className="w-3.5 h-3.5 fill-current animate-pulse" />
                <span>Sleep Timer: {Math.ceil(sleepTimer.remainingSeconds / 60)}m left</span>
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline">
            Shortcuts: <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white">Space</kbd> Pause • <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white">F</kbd> Fullscreen • <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white">P</kbd> PiP • <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white">Z</kbd> Sleep • <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white">Q</kbd> EQ • <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white">L</kbd> Lock • <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white">E</kbd> Guide
          </span>
          <span className="text-blue-400 font-mono text-[10px] font-bold">10-FOOT LEANBACK TV READY</span>
        </div>
      </footer>

      {/* Sleep Timer Configuration & Automation Modal */}
      <SleepTimerModal isOpen={showSleepTimer} onClose={() => setShowSleepTimer(false)} />

      {/* Audio Equalizer & Sound Normalization Modal */}
      <AudioEqualizerModal isOpen={showEqualizer} onClose={() => setShowEqualizer(false)} />

      {/* Parental Controls PIN Modal */}
      <ParentalPinModal 
        isOpen={showParentalModal} 
        onClose={() => setShowParentalModal(false)} 
        channelName={currentChannel.name}
        initialMode={parentalControls.pinHash ? (isLocked ? 'unlock' : 'settings') : 'setup'}
      />
    </div>
  );
}
