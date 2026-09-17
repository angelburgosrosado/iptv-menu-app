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
  Radio
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { usePlayerStore } from '../store/usePlayerStore';
import { PageProtocolHeader } from './PageProtocolHeader';

interface MatrixSlotVideoProps {
  channel: Channel;
  isMuted: boolean;
  volume: number;
}

function MatrixSlotVideo({ channel, isMuted, volume }: MatrixSlotVideoProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const hlsRef = React.useRef<any>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel?.url) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const rawUrl = channel.url;
    const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isHttp = rawUrl.startsWith('http://');
    const effectiveUrl = (isHttpsPage && isHttp && !rawUrl.includes('/api/stream/proxy'))
      ? `/api/stream/proxy?url=${encodeURIComponent(rawUrl)}`
      : rawUrl;

    if (effectiveUrl.includes('.m3u8') || effectiveUrl.includes('/api/stream/proxy')) {
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
          if (data.fatal && !effectiveUrl.includes('/api/stream/proxy')) {
            hls.destroy();
            hlsRef.current = null;
            const proxyUrl = `/api/stream/proxy?url=${encodeURIComponent(rawUrl)}`;
            if (HlsClass.isSupported()) {
              const fallbackHls = new HlsClass({ enableWorker: true, lowLatencyMode: true });
              hlsRef.current = fallbackHls;
              fallbackHls.loadSource(proxyUrl);
              fallbackHls.attachMedia(video);
              fallbackHls.on(HlsClass.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
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
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel?.url]);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume));
    }
  }, [isMuted, volume]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      className="w-full h-full object-cover"
    />
  );
}

export default function MultiScreenMatrix() {
  const { channels } = usePlayerStore();
  const [activeSlotCount, setActiveSlotCount] = React.useState<2 | 4>(4);
  const [slots, setSlots] = React.useState<(Channel | null)[]>([null, null, null, null]);
  const [mutedSlots, setMutedSlots] = React.useState<boolean[]>([false, true, true, true]);
  const [volumes, setVolumes] = React.useState<number[]>([0.8, 0.8, 0.8, 0.8]);
  const [focusedAudioSlot, setFocusedAudioSlot] = React.useState<number | null>(0);
  const [selectedSlotIdx, setSelectedSlotIdx] = React.useState<number | null>(null);
  const [activeVolumePopupIdx, setActiveVolumePopupIdx] = React.useState<number | null>(null);
  const [fullscreenSlotIdx, setFullscreenSlotIdx] = React.useState<number | null>(null);

  // Initialize with the first 4 channels if available
  React.useEffect(() => {
    if (channels.length > 0 && slots.every(s => s === null)) {
      setSlots([
        channels[0] || null,
        channels[1] || null,
        channels[2] || null,
        channels[3] || null
      ]);
    }
  }, [channels]);

  const handleSelectChannelForSlot = (channel: Channel, slotIdx: number) => {
    const updated = [...slots];
    updated[slotIdx] = channel;
    setSlots(updated);
    setSelectedSlotIdx(null);
  };

  const handleSoloAudio = (slotIdx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFocusedAudioSlot(slotIdx);
    const newMuted = mutedSlots.map((_, i) => i !== slotIdx);
    setMutedSlots(newMuted);
  };

  const handleToggleMuteAll = () => {
    const isAnyUnmuted = mutedSlots.some(m => !m);
    if (isAnyUnmuted) {
      // Mute everything
      setMutedSlots([true, true, true, true]);
      setFocusedAudioSlot(null);
    } else {
      // Restore solo audio on focused slot (or slot 0)
      const target = focusedAudioSlot ?? 0;
      handleSoloAudio(target);
    }
  };

  const handleToggleMute = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...mutedSlots];
    updated[idx] = !updated[idx];
    setMutedSlots(updated);
    if (!updated[idx]) {
      setFocusedAudioSlot(idx);
    }
  };

  const handleVolumeChange = (idx: number, val: number) => {
    const updated = [...volumes];
    updated[idx] = val;
    setVolumes(updated);
    if (val === 0) {
      const updatedMute = [...mutedSlots];
      updatedMute[idx] = true;
      setMutedSlots(updatedMute);
    } else if (mutedSlots[idx]) {
      const updatedMute = [...mutedSlots];
      updatedMute[idx] = false;
      setMutedSlots(updatedMute);
      setFocusedAudioSlot(idx);
    }
  };

  const handleRemoveSlot = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...slots];
    updated[idx] = null;
    setSlots(updated);
    if (focusedAudioSlot === idx) {
      const nextAvailable = updated.findIndex(s => s !== null);
      if (nextAvailable >= 0) {
        handleSoloAudio(nextAvailable);
      } else {
        setFocusedAudioSlot(null);
      }
    }
  };

  // 1-4 Keyboard Hotkeys for Audio Solo Focus
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      if (e.key === '1') handleSoloAudio(0);
      if (e.key === '2') handleSoloAudio(1);
      if (e.key === '3' && activeSlotCount === 4) handleSoloAudio(2);
      if (e.key === '4' && activeSlotCount === 4) handleSoloAudio(3);
      if (e.key === 'm' || e.key === 'M') handleToggleMuteAll();
      if (e.key === 'Escape' && fullscreenSlotIdx !== null) setFullscreenSlotIdx(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlotCount, fullscreenSlotIdx, mutedSlots, focusedAudioSlot]);

  const allMuted = mutedSlots.every(m => m);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Protocol Architecture Header */}
      <PageProtocolHeader
        title="Quad Multi-Screen Monitoring Canvas"
        description="Concurrent multi-feed media orchestration canvas running parallel HLS demuxing pipelines with hardware-accelerated decoding, audio solo focus arbiter, and dynamic grid slot allocation."
        protocol="SMPTE ST 2022-7 & RFC 8216 HLS"
        schema="Multi-Program Transport Stream (MPTS) & W3C MSE"
        rfcOrStandard="SMPTE ST 2022-7 • W3C Media Source Extensions"
        layer="Demuxing & Concurrent Rendering Layer"
        supportedTags={['MSE', 'HLS.js Demuxer', 'Audio Solo Arbiter', 'SMPTE 2022-7', 'Hotkeys 1-4']}
        icon={LayoutGrid}
        badgeColor="cyan"
      >
        <div className="flex items-center gap-2">
          {/* Master Mute All / Solo Audio Toggle */}
          <button
            onClick={handleToggleMuteAll}
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

          <button
            onClick={() => setActiveSlotCount(2)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSlotCount === 2 
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30' 
                : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
            }`}
            aria-label="Dual 2x1 Screen Layout"
          >
            Dual (2x1)
          </button>
          <button
            onClick={() => setActiveSlotCount(4)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSlotCount === 4 
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30' 
                : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
            }`}
            aria-label="Quad 2x2 Screen Layout"
          >
            Quad (2x2)
          </button>
        </div>
      </PageProtocolHeader>

      {/* Multi-Grid Canvas */}
      <div className={`grid gap-4 flex-1 ${activeSlotCount === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
        {Array.from({ length: activeSlotCount }).map((_, idx) => {
          const channel = slots[idx];
          const isMuted = mutedSlots[idx];
          const volume = volumes[idx] ?? 0.8;
          const isAudioFocused = focusedAudioSlot === idx && !isMuted;
          const isFullscreen = fullscreenSlotIdx === idx;

          return (
            <div
              key={idx}
              onClick={() => handleSoloAudio(idx)}
              className={`relative aspect-video bg-black rounded-2xl overflow-hidden border group shadow-xl transition-all cursor-pointer ${
                isAudioFocused 
                  ? 'border-cyan-500 ring-2 ring-cyan-500/40 shadow-cyan-500/10' 
                  : 'border-white/10 ring-1 ring-white/5'
              } ${isFullscreen ? 'fixed inset-4 z-50 aspect-auto' : ''}`}
            >
              {channel ? (
                <>
                  {/* Native Multi-Feed Video with HLS Demuxing Engine */}
                  <MatrixSlotVideo
                    channel={channel}
                    isMuted={isMuted}
                    volume={volume}
                  />

                  {/* Channel Top Badge Overlay */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
                    <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 pointer-events-auto">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 health-badge-live" />
                      <span className="text-xs font-bold text-white max-w-[140px] truncate">{channel.name}</span>
                      <span className="text-[10px] text-cyan-400 font-mono font-bold">#Q{idx + 1}</span>

                      {/* Solo Audio Focus Pill */}
                      {isAudioFocused && (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-black tracking-wider uppercase">
                          <span className="flex items-center gap-0.5">
                            <span className="w-0.5 h-2 bg-cyan-400 animate-pulse rounded-full" />
                            <span className="w-0.5 h-3 bg-cyan-400 animate-pulse rounded-full delay-75" />
                            <span className="w-0.5 h-1.5 bg-cyan-400 animate-pulse rounded-full delay-150" />
                          </span>
                          <span>PRIMARY AUDIO</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-xl border border-white/10 pointer-events-auto relative">
                      {/* Solo Audio Button */}
                      <button
                        onClick={(e) => handleSoloAudio(idx, e)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isAudioFocused
                            ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/40'
                            : 'text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                        title={`Solo Audio on Quadrant #${idx + 1} (Hotkey: ${idx + 1})`}
                        aria-label={`Solo Audio Quadrant ${idx + 1}`}
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono hidden sm:inline">SOLO</span>
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
                          className="absolute top-full right-0 mt-2 p-3 bg-[#16161a] border border-white/10 rounded-xl shadow-2xl z-50 flex items-center gap-2 min-w-[140px]"
                        >
                          <button
                            onClick={(e) => handleToggleMute(idx, e)}
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
                            onChange={(e) => handleVolumeChange(idx, parseFloat(e.target.value))}
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
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Quadrant'}
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

                      {/* Remove Slot */}
                      <button
                        onClick={(e) => handleRemoveSlot(idx, e)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove Stream"
                        aria-label="Remove Quadrant Stream"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Diagnostics Overlay */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-zinc-400 font-mono bg-black/75 px-3 py-1 rounded-xl backdrop-blur-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border border-white/5">
                    <span className="text-white flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-cyan-400" />
                      <span>Live 60 FPS</span>
                    </span>
                    <span className="text-cyan-400">Vol: {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}</span>
                    <span>Quadrant #{idx + 1} (Hotkey: {idx + 1})</span>
                  </div>
                </>
              ) : (
                /* Empty Quadrant Slot */
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#16161a]/60 border border-dashed border-white/10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 mb-2">
                    <Tv className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-zinc-300 mb-1">Quadrant #{idx + 1} Ready</span>
                  <p className="text-[10px] text-zinc-500 mb-3 max-w-xs">Assign any channel from your active playlist to this quadrant.</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSlotIdx(idx);
                    }}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                    aria-label={`Assign channel to quadrant ${idx + 1}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Assign Stream
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Channel Assignment Selector Modal */}
      {selectedSlotIdx !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#16161a] border border-white/10 rounded-3xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <h3 className="text-sm font-bold text-white">Select Stream for Quadrant #{selectedSlotIdx + 1}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Choose a channel from your active catalog to stream concurrently.</p>
              </div>
              <button
                onClick={() => setSelectedSlotIdx(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                aria-label="Close stream selector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 py-4 flex-1 scrollbar-thin">
              {channels.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectChannelForSlot(c, selectedSlotIdx)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-black/60 border border-white/5 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
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
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 truncate">{c.name}</h4>
                      <span className="text-[10px] text-zinc-500 block truncate">{c.group}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Select & Play
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
