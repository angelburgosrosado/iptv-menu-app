/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  LayoutGrid, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Maximize2, 
  Plus, 
  X, 
  Tv, 
  Headphones, 
  Radio,
  Crown,
  ArrowLeftRight,
  RotateCcw,
  Search,
  Filter,
  AlertTriangle,
  Columns,
  Square
} from 'lucide-react';
import { Channel, MatrixLayoutMode } from '../types/iptv';
import { usePlayerStore } from '../store/usePlayerStore';
import { PageProtocolHeader } from './PageProtocolHeader';
import { resolvePlaybackUrlSourceKind } from '../utils/streamDispatcher';
import { buildStreamProxyUrl } from '../lib/apiClient';
import { DEMO_FAST_CHANNELS } from '../data/demoChannels';
import { StreamResolutionBadge, StreamCountryBadge } from './StreamInfoBadge';

interface MatrixSlotVideoProps {
  channel: Channel;
  isMuted: boolean;
  volume: number;
  slotIdx: number;
  onRetry?: () => void;
}

function MatrixSlotVideo({ channel, isMuted, volume, slotIdx, onRetry }: MatrixSlotVideoProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const hlsRef = React.useRef<any>(null);
  const mpegtsRef = React.useRef<any>(null);
  const [hasError, setHasError] = React.useState(false);
  const [isBuffering, setIsBuffering] = React.useState(true);
  const [retryCount, setRetryCount] = React.useState(0);

  const handleManualRetry = () => {
    setHasError(false);
    setIsBuffering(true);
    setRetryCount(prev => prev + 1);
    if (onRetry) onRetry();
  };

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel?.url) return;

    setHasError(false);
    setIsBuffering(true);

    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch {}
      hlsRef.current = null;
    }
    if (mpegtsRef.current) {
      try {
        mpegtsRef.current.pause?.();
        mpegtsRef.current.unload?.();
        mpegtsRef.current.detachMediaElement?.();
        mpegtsRef.current.destroy?.();
      } catch {}
      mpegtsRef.current = null;
    }

    const rawUrl = channel.url;
    const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isHttp = rawUrl.startsWith('http://');
    const effectiveUrl = (isHttpsPage && isHttp && !rawUrl.includes('/api/stream/proxy'))
      ? buildStreamProxyUrl(rawUrl)
      : rawUrl;

    const handlePlaying = () => setIsBuffering(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleError = () => {
      setIsBuffering(false);
      setHasError(true);
    };

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('error', handleError);

    const kind = resolvePlaybackUrlSourceKind(effectiveUrl);

    if (kind === 'mpegts' && (window as any).mpegts?.isSupported()) {
      try {
        const mpegtsPlayer = (window as any).mpegts.createPlayer({
          type: 'mse',
          isLive: true,
          url: effectiveUrl
        }, {
          enableWorker: true,
          lazyLoadMaxDuration: 60,
          seekType: 'range'
        });
        mpegtsRef.current = mpegtsPlayer;
        mpegtsPlayer.attachMediaElement(video);
        mpegtsPlayer.load();
        mpegtsPlayer.play().catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
        mpegtsPlayer.on((window as any).mpegts.Events.ERROR, () => {
          setHasError(true);
          setIsBuffering(false);
        });
      } catch {
        video.src = effectiveUrl;
        video.play().catch(() => {});
      }
    } else if (effectiveUrl.includes('.m3u8') || effectiveUrl.includes('/api/stream/proxy')) {
      const HlsClass = (window as any).Hls;
      if (HlsClass?.isSupported()) {
        const hls = new HlsClass({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 15,
          liveSyncDurationCount: 3,
        });
        hlsRef.current = hls;
        hls.loadSource(effectiveUrl);
        hls.attachMedia(video);

        hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {
            video.muted = true;
            video.play().catch(() => {});
          });
        });

        hls.on(HlsClass.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            if (!effectiveUrl.includes('/api/stream/proxy')) {
              hls.destroy();
              hlsRef.current = null;
              const proxyUrl = buildStreamProxyUrl(rawUrl);
              if (HlsClass.isSupported()) {
                const fallbackHls = new HlsClass({ enableWorker: true, lowLatencyMode: true });
                hlsRef.current = fallbackHls;
                fallbackHls.loadSource(proxyUrl);
                fallbackHls.attachMedia(video);
                fallbackHls.on(HlsClass.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
                fallbackHls.on(HlsClass.Events.ERROR, (_: any, fallbackData: any) => {
                  if (fallbackData.fatal) {
                    setHasError(true);
                    setIsBuffering(false);
                  }
                });
              }
            } else {
              setHasError(true);
              setIsBuffering(false);
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = effectiveUrl;
        video.play().catch(() => {});
      }
    } else {
      video.src = effectiveUrl;
      video.play().catch(() => {});
    }

    return () => {
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('error', handleError);
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
      if (mpegtsRef.current) {
        try {
          mpegtsRef.current.pause?.();
          mpegtsRef.current.unload?.();
          mpegtsRef.current.detachMediaElement?.();
          mpegtsRef.current.destroy?.();
        } catch {}
        mpegtsRef.current = null;
      }
    };
  }, [channel?.url, retryCount]);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume));
    }
  }, [isMuted, volume]);

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="w-full h-full object-cover"
      />

      {/* Buffering Spinner */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Stream Error Recovery Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-zinc-950/90 text-center z-10">
          <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
          <span className="text-xs font-bold text-white mb-1">Stream Playback Stalled</span>
          <p className="text-[11px] text-zinc-400 mb-3 max-w-xs">
            Feed transmission interrupted by source host or network timeout.
          </p>
          <button
            onClick={handleManualRetry}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Feed</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function MultiScreenMatrix() {
  const { 
    channels,
    matrixConfig,
    setMatrixLayout,
    setMatrixSlot,
    clearMatrixSlot,
    swapMatrixSlots,
    promoteToHeroSlot,
    setMatrixAudioSolo,
    toggleMatrixMuteAll,
    setMatrixSlotVolume,
    toggleMatrixSlotMute
  } = usePlayerStore();

  const [selectedSlotIdx, setSelectedSlotIdx] = React.useState<number | null>(null);
  const [swapSourceSlotIdx, setSwapSourceSlotIdx] = React.useState<number | null>(null);
  const [activeVolumePopupIdx, setActiveVolumePopupIdx] = React.useState<number | null>(null);
  const [fullscreenSlotIdx, setFullscreenSlotIdx] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const { layout, slots, mutedSlots, volumes, focusedAudioSlot } = matrixConfig;

  const effectiveChannels = React.useMemo(() => {
    return channels && channels.length > 0 ? channels : DEMO_FAST_CHANNELS;
  }, [channels]);

  // Initial seed: If all slots are null, populate slots with the first available channels
  React.useEffect(() => {
    const pool = channels && channels.length > 0 ? channels : DEMO_FAST_CHANNELS;
    if (pool.length > 0 && slots.every(s => s === null)) {
      setMatrixSlot(0, pool[0] || null);
      setMatrixSlot(1, pool[1] || null);
      setMatrixSlot(2, pool[2] || null);
      setMatrixSlot(3, pool[3] || null);
    }
  }, [channels]);

  // Determine active slots count for current layout mode
  const activeSlotCount = React.useMemo(() => {
    switch (layout) {
      case 'dual': return 2;
      case 'triple': return 3;
      case 'hero':
      case 'quad':
      default:
        return 4;
    }
  }, [layout]);

  // Filtered channels for stream assignment modal
  const filteredChannels = React.useMemo(() => {
    let result = effectiveChannels;
    if (selectedCategory !== 'All') {
      result = result.filter(c => (c.group || '').toLowerCase().includes(selectedCategory.toLowerCase()));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.group || '').toLowerCase().includes(q) ||
        (c.countryName || c.countryCode || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [effectiveChannels, selectedCategory, searchQuery]);

  // Unique channel groups for filter chips
  const channelGroups = React.useMemo(() => {
    const set = new Set<string>();
    effectiveChannels.forEach(c => {
      if (c.group) set.add(c.group);
    });
    return ['All', ...Array.from(set).slice(0, 8)];
  }, [effectiveChannels]);

  const handleSelectChannelForSlot = (channel: Channel, slotIdx: number) => {
    setMatrixSlot(slotIdx, channel);
    setSelectedSlotIdx(null);
    setSearchQuery('');
  };

  const handleSwapSlots = (targetIdx: number) => {
    if (swapSourceSlotIdx !== null && swapSourceSlotIdx !== targetIdx) {
      swapMatrixSlots(swapSourceSlotIdx, targetIdx);
      setSwapSourceSlotIdx(null);
    }
  };

  // Keyboard Hotkeys: 1-4 for solo audio focus, M for mute all, Esc to exit fullscreen
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      if (e.key === '1') setMatrixAudioSolo(0);
      if (e.key === '2' && activeSlotCount >= 2) setMatrixAudioSolo(1);
      if (e.key === '3' && activeSlotCount >= 3) setMatrixAudioSolo(2);
      if (e.key === '4' && activeSlotCount >= 4) setMatrixAudioSolo(3);
      if (e.key === 'm' || e.key === 'M') toggleMatrixMuteAll();
      if (e.key === 'Escape') {
        if (fullscreenSlotIdx !== null) setFullscreenSlotIdx(null);
        if (swapSourceSlotIdx !== null) setSwapSourceSlotIdx(null);
        if (selectedSlotIdx !== null) setSelectedSlotIdx(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlotCount, fullscreenSlotIdx, swapSourceSlotIdx, selectedSlotIdx, setMatrixAudioSolo, toggleMatrixMuteAll]);

  const allMuted = mutedSlots.slice(0, activeSlotCount).every(m => m);

  // Render a specific slot quadrant
  const renderSlot = (idx: number, isHeroSlot: boolean = false) => {
    const channel = slots[idx];
    const isMuted = mutedSlots[idx];
    const volume = volumes[idx] ?? 0.8;
    const isAudioFocused = focusedAudioSlot === idx && !isMuted;
    const isFullscreen = fullscreenSlotIdx === idx;
    const isSwapping = swapSourceSlotIdx === idx;

    return (
      <div
        key={idx}
        onClick={() => {
          if (swapSourceSlotIdx !== null) {
            handleSwapSlots(idx);
          } else {
            setMatrixAudioSolo(idx);
          }
        }}
        className={`relative aspect-video bg-black rounded-2xl overflow-hidden border group shadow-xl transition-all cursor-pointer ${
          isHeroSlot && layout === 'hero' ? 'lg:aspect-auto lg:h-full' : ''
        } ${
          isAudioFocused 
            ? 'border-cyan-500 ring-2 ring-cyan-500/40 shadow-cyan-500/20' 
            : isSwapping
              ? 'border-amber-500 ring-2 ring-amber-500/50'
              : 'border-white/10 ring-1 ring-white/5'
        } ${isFullscreen ? '!fixed inset-4 z-50 !aspect-auto !h-auto' : ''}`}
      >
        {channel ? (
          <>
            {/* Native Multi-Feed Video with HLS Demuxing Engine */}
            <MatrixSlotVideo
              channel={channel}
              isMuted={isMuted}
              volume={volume}
              slotIdx={idx}
            />

            {/* Slot Top Navigation Overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
              <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 pointer-events-auto">
                <div className="w-2 h-2 rounded-full bg-emerald-400 health-badge-live" />
                <span className="text-xs font-bold text-white max-w-[130px] truncate">{channel.name}</span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">
                  {idx === 0 && (layout === 'hero' || layout === 'triple') ? '★ HERO' : `#Q${idx + 1}`}
                </span>

                {/* Animated Audio Solo VU Meter */}
                {isAudioFocused && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-black tracking-wider uppercase">
                    <span className="flex items-center gap-0.5">
                      <span className="w-0.5 h-2 bg-cyan-400 animate-pulse rounded-full" />
                      <span className="w-0.5 h-3.5 bg-cyan-400 animate-pulse rounded-full delay-75" />
                      <span className="w-0.5 h-1.5 bg-cyan-400 animate-pulse rounded-full delay-150" />
                    </span>
                    <span className="hidden sm:inline">SOLO</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/10 pointer-events-auto relative">
                {/* Promote to Hero / Slot 1 (for satellite slots) */}
                {idx > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      promoteToHeroSlot(idx);
                    }}
                    className="p-1.5 rounded-lg text-amber-400/80 hover:text-amber-300 hover:bg-amber-400/10 transition-colors cursor-pointer"
                    title={`Promote Q#${idx + 1} to Hero Slot (Slot #1)`}
                    aria-label="Promote to Hero"
                  >
                    <Crown className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Swap Slot Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSwapSourceSlotIdx(swapSourceSlotIdx === idx ? null : idx);
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isSwapping 
                      ? 'bg-amber-500 text-black shadow-sm' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={isSwapping ? 'Cancel Swap' : `Swap Q#${idx + 1} with another quadrant`}
                  aria-label="Swap Quadrant"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>

                {/* Solo Audio Focus Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMatrixAudioSolo(idx);
                  }}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    isAudioFocused
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/40'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={`Solo Audio on Quadrant #${idx + 1} (Hotkey: ${idx + 1})`}
                  aria-label={`Solo Audio Quadrant ${idx + 1}`}
                >
                  <Headphones className="w-3.5 h-3.5" />
                </button>

                {/* Volume slider toggle button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveVolumePopupIdx(activeVolumePopupIdx === idx ? null : idx);
                  }}
                  className={`p-1.5 rounded-lg text-white transition-colors cursor-pointer ${
                    isMuted ? 'text-zinc-400 hover:text-white' : 'text-cyan-400 bg-cyan-500/20'
                  }`}
                  title="Volume & Mute Control"
                  aria-label="Adjust Volume"
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Volume Slider Dropdown Popup */}
                {activeVolumePopupIdx === idx && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full right-0 mt-2 p-3 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 flex items-center gap-2 min-w-[150px]"
                  >
                    <button
                      onClick={() => toggleMatrixSlotMute(idx)}
                      className="text-xs font-bold text-zinc-300 hover:text-white cursor-pointer"
                    >
                      {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setMatrixSlotVolume(idx, parseFloat(e.target.value))}
                      className="w-20 accent-cyan-400 cursor-pointer"
                      aria-label={`Volume for quadrant ${idx + 1}`}
                    />
                    <span className="text-[10px] text-cyan-400 font-mono w-7">
                      {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                    </span>
                  </div>
                )}

                {/* Fullscreen Quadrant Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenSlotIdx(fullscreenSlotIdx === idx ? null : idx);
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen Quadrant'}
                  aria-label="Toggle Quadrant Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                {/* Change Channel */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSlotIdx(idx);
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                  title="Switch Channel"
                  aria-label="Switch Channel for Quadrant"
                >
                  <Tv className="w-3.5 h-3.5" />
                </button>

                {/* Clear / Remove Slot */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearMatrixSlot(idx);
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Clear Quadrant Slot"
                  aria-label="Clear Quadrant Stream"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom HUD Overlay on Hover */}
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-zinc-400 font-mono bg-black/75 px-3 py-1 rounded-xl backdrop-blur-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border border-white/5">
              <span className="text-white flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-cyan-400" />
                <span>Live Feed • HLS Engine</span>
              </span>
              <span className="text-cyan-400">Audio: {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}</span>
              <span>Hotkeys: 1-4 • M</span>
            </div>
          </>
        ) : (
          /* Empty Quadrant Slot */
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-zinc-900/60 border border-dashed border-white/10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 mb-2">
              <Tv className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-zinc-300 mb-1">
              {idx === 0 && (layout === 'hero' || layout === 'triple') ? 'Hero Master Feed Ready' : `Quadrant #${idx + 1} Ready`}
            </span>
            <p className="text-[10px] text-zinc-500 mb-3 max-w-xs">
              Assign any channel from your active playlist to this monitor slot.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSlotIdx(idx);
              }}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
              aria-label={`Assign channel to quadrant ${idx + 1}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Stream</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Sleek, Content-First MultiScreen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-cyan-400" />
              <span>MultiScreen Quad Matrix</span>
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Live Sports & News Wall
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Concurrent multi-feed broadcast canvas with audio solo switching and dynamic multi-screen layouts
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Master Mute All / Solo Audio Toggle */}
          <button
            onClick={toggleMatrixMuteAll}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
              allMuted
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-sm'
            }`}
            title="Toggle Master Audio Mute (Hotkey: M)"
            aria-label="Master Audio Mute"
          >
            {allMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Headphones className="w-3.5 h-3.5" />}
            <span>{allMuted ? 'Muted All' : `Solo Q#${(focusedAudioSlot ?? 0) + 1}`}</span>
          </button>

          {/* Layout Selector Chips */}
          <div className="flex items-center bg-[#16161a] border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setMatrixLayout('dual')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                layout === 'dual'
                  ? 'bg-cyan-600 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Dual 2x1 Split Screen"
            >
              Dual (2x1)
            </button>
            <button
              onClick={() => setMatrixLayout('triple')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                layout === 'triple'
                  ? 'bg-cyan-600 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Triple 1+2 Split View"
            >
              Triple (1+2)
            </button>
            <button
              onClick={() => setMatrixLayout('hero')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                layout === 'hero'
                  ? 'bg-cyan-600 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Hero 1+3 Broadcast Command Center"
            >
              Hero (1+3)
            </button>
            <button
              onClick={() => setMatrixLayout('quad')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                layout === 'quad'
                  ? 'bg-cyan-600 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Quad 2x2 Matrix View"
            >
              Quad (2x2)
            </button>
          </div>
        </div>
      </div>

      {/* Swapping Active Alert Notification */}
      {swapSourceSlotIdx !== null && (
        <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs font-bold">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-amber-400" />
            <span>Click any other quadrant to swap with Slot #{swapSourceSlotIdx + 1}</span>
          </div>
          <button 
            onClick={() => setSwapSourceSlotIdx(null)}
            className="text-[11px] underline hover:text-white cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Multi-Grid Canvas with Dynamic Layouts */}
      {layout === 'quad' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {renderSlot(0)}
          {renderSlot(1)}
          {renderSlot(2)}
          {renderSlot(3)}
        </div>
      )}

      {layout === 'dual' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {renderSlot(0)}
          {renderSlot(1)}
        </div>
      )}

      {layout === 'hero' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
          {/* Main Hero Slot (spans 2 columns and full height on desktop) */}
          <div className="lg:col-span-2">
            {renderSlot(0, true)}
          </div>
          {/* 3 Satellite Slots stacked vertically */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            {renderSlot(1)}
            {renderSlot(2)}
            {renderSlot(3)}
          </div>
        </div>
      )}

      {layout === 'triple' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
          {/* Primary Stream on Left */}
          <div className="lg:col-span-2">
            {renderSlot(0, true)}
          </div>
          {/* 2 Satellite Streams on Right */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            {renderSlot(1)}
            {renderSlot(2)}
          </div>
        </div>
      )}

      {/* Stream Assignment Modal with Fast Search & Category Filtering */}
      {selectedSlotIdx !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-xl p-6 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Assign Stream to Quadrant #{selectedSlotIdx + 1}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select a live stream to pipe into this multi-screen monitor slot.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedSlotIdx(null);
                  setSearchQuery('');
                }}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                aria-label="Close stream selector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="pt-4 pb-2">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search channels by name, group, or country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
                  autoFocus
                />
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
              {channelGroups.map((group) => (
                <button
                  key={group}
                  onClick={() => setSelectedCategory(group)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === group
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>

            {/* Channels List */}
            <div className="overflow-y-auto space-y-2 py-3 flex-1 scrollbar-thin">
              {filteredChannels.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  No channels match your search criteria.
                </div>
              ) : (
                filteredChannels.map((c) => {
                  const isAssignedToOtherSlot = slots.findIndex((s, i) => s?.id === c.id && i !== selectedSlotIdx);

                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectChannelForSlot(c, selectedSlotIdx)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/40 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-black/80 border border-white/10 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0 group-hover:border-cyan-500/40 transition-colors">
                          <img
                            src={c.logo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60'}
                            alt={c.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 truncate">{c.name}</h4>
                            <StreamResolutionBadge resolution={c.resolution || '1080p FHD'} />
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-zinc-400 truncate">{c.group || 'General'}</span>
                            <StreamCountryBadge countryCode={c.countryCode} countryName={c.countryName} countryFlag={c.countryFlag} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isAssignedToOtherSlot >= 0 && (
                          <span className="text-[10px] text-amber-400/90 font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            Slot #{isAssignedToOtherSlot + 1}
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-cyan-400 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-white transition-all shadow-sm">
                          Assign Slot
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
