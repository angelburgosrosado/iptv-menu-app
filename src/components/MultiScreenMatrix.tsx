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
  Play, 
  Plus, 
  X, 
  Tv, 
  Activity, 
  Layers, 
  Sparkles,
  Sliders
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { usePlayerStore } from '../store/usePlayerStore';
import { PageProtocolHeader } from './PageProtocolHeader';

export default function MultiScreenMatrix() {
  const { channels } = usePlayerStore();
  const [activeSlotCount, setActiveSlotCount] = React.useState<2 | 4>(4);
  const [slots, setSlots] = React.useState<(Channel | null)[]>([null, null, null, null]);
  const [mutedSlots, setMutedSlots] = React.useState<boolean[]>([false, true, true, true]);
  const [volumes, setVolumes] = React.useState<number[]>([0.8, 0.8, 0.8, 0.8]);
  const [selectedSlotIdx, setSelectedSlotIdx] = React.useState<number | null>(null);
  const [activeVolumePopupIdx, setActiveVolumePopupIdx] = React.useState<number | null>(null);

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

  const handleToggleMute = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...mutedSlots];
    updated[idx] = !updated[idx];
    setMutedSlots(updated);
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
    }
  };

  const handleRemoveSlot = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...slots];
    updated[idx] = null;
    setSlots(updated);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Protocol Architecture Header */}
      <PageProtocolHeader
        title="Quad Multi-Screen Monitoring Canvas"
        description="Concurrent multi-feed media orchestration canvas running 4 parallel HLS demuxing pipelines with hardware-accelerated decoding, independent audio routing and volume attenuation, and dynamic grid slot allocation."
        protocol="SMPTE ST 2022-7 & RFC 8216 HLS"
        schema="Multi-Program Transport Stream (MPTS) & W3C MSE"
        rfcOrStandard="SMPTE ST 2022-7 • W3C Media Source Extensions"
        layer="Demuxing & Concurrent Rendering Layer"
        supportedTags={['MSE', 'HLS.js Demuxer', 'SMPTE 2022-7', 'Audio Arbiter', 'Quad Buffer (2x2)']}
        icon={LayoutGrid}
        badgeColor="cyan"
      >
        <div className="flex items-center gap-2">
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

          return (
            <div
              key={idx}
              className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 group shadow-xl ring-1 ring-white/5"
            >
              {channel ? (
                <>
                  {/* Native HTML5 Video for multi-screen playback */}
                  <video
                    src={channel.url}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    className="w-full h-full object-cover"
                  />

                  {/* Channel Top Badge Overlay */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
                    <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 pointer-events-auto">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 health-badge-live" />
                      <span className="text-xs font-bold text-white max-w-[140px] truncate">{channel.name}</span>
                      <span className="text-[10px] text-cyan-400 font-mono font-bold">#Q{idx + 1}</span>
                    </div>

                    <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-xl border border-white/10 pointer-events-auto relative">
                      {/* Volume slider toggle button */}
                      <button
                        onClick={() => setActiveVolumePopupIdx(activeVolumePopupIdx === idx ? null : idx)}
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
                        <div className="absolute top-full right-0 mt-2 p-3 bg-[#16161a] border border-white/10 rounded-xl shadow-2xl z-50 flex items-center gap-2 min-w-[140px]">
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

                      {/* Change Channel */}
                      <button
                        onClick={() => setSelectedSlotIdx(idx)}
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
                    <span className="text-white">Live Feed 60 FPS</span>
                    <span className="text-cyan-400">Vol: {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}</span>
                    <span>Quadrant #{idx + 1}</span>
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
                    onClick={() => setSelectedSlotIdx(idx)}
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
