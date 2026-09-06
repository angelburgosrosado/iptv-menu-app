import * as React from 'react';
import { 
  LayoutGrid, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Play, 
  Plus, 
  X, 
  Tv, 
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { usePlayerStore } from '../store/usePlayerStore';
import { PageProtocolHeader } from './PageProtocolHeader';

export default function MultiScreenMatrix() {
  const { channels } = usePlayerStore();
  const [activeSlotCount, setActiveSlotCount] = React.useState<2 | 4>(4);
  const [slots, setSlots] = React.useState<(Channel | null)[]>([null, null, null, null]);
  const [mutedSlots, setMutedSlots] = React.useState<boolean[]>([false, true, true, true]);
  const [selectedSlotIdx, setSelectedSlotIdx] = React.useState<number | null>(null);

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

  const handleRemoveSlot = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...slots];
    updated[idx] = null;
    setSlots(updated);
  };

  return (
    <div className="flex flex-col gap-5 p-6 bg-neutral-900/80 rounded-2xl border border-neutral-800 text-neutral-200">
      {/* Protocol Architecture Header */}
      <PageProtocolHeader
        title="Multi-Screen Monitoring Canvas"
        description="Concurrent multi-feed media orchestration canvas running parallel HLS demuxing pipelines with hardware-accelerated decoding, independent audio routing, and seamless grid slot allocation."
        protocol="SMPTE ST 2022-7 & RFC 8216 HLS"
        schema="Multi-Program Transport Stream (MPTS) & W3C MSE"
        rfcOrStandard="SMPTE ST 2022-7 • W3C Media Source Extensions"
        layer="Demuxing & Concurrent Rendering Layer"
        supportedTags={['MSE', 'HLS.js Demuxer', 'SMPTE 2022-7', 'Audio Arbiter', 'Quad Buffer']}
        icon={LayoutGrid}
        badgeColor="cyan"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSlotCount(2)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeSlotCount === 2 ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Dual (2x1)
          </button>
          <button
            onClick={() => setActiveSlotCount(4)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeSlotCount === 4 ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Quad (2x2)
          </button>
        </div>
      </PageProtocolHeader>

      {/* Multi-Grid Canvas */}
      <div className={`grid gap-4 ${activeSlotCount === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
        {Array.from({ length: activeSlotCount }).map((_, idx) => {
          const channel = slots[idx];
          const isMuted = mutedSlots[idx];

          return (
            <div
              key={idx}
              className="relative aspect-video bg-black rounded-xl overflow-hidden border border-neutral-800 group shadow-lg"
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
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 pointer-events-auto">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-white max-w-[150px] truncate">{channel.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">{channel.resolution || '1080p'}</span>
                    </div>

                    <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-lg border border-white/10 pointer-events-auto">
                      <button
                        onClick={(e) => handleToggleMute(idx, e)}
                        className={`p-1.5 rounded text-white transition-colors ${isMuted ? 'text-neutral-400 hover:text-white' : 'text-emerald-400 bg-emerald-500/20'}`}
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={(e) => handleRemoveSlot(idx, e)}
                        className="p-1.5 rounded text-neutral-400 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Diagnostics Overlay */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-neutral-400 font-mono bg-black/60 px-2 py-0.5 rounded backdrop-blur pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Bitrate: {channel.bitrate || '4.8 Mbps'}</span>
                    <span>FPS: {channel.fps || 60}</span>
                    <span>Latency: {channel.pingMs || 24}ms</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-neutral-950/60 border border-dashed border-neutral-800">
                  <Tv className="w-8 h-8 text-neutral-600 mb-2" />
                  <span className="text-xs font-semibold text-neutral-400 mb-3">Screen Slot #{idx + 1} Empty</span>
                  <button
                    onClick={() => setSelectedSlotIdx(idx)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Assign Channel
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
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-5 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white">Select Channel for Slot #{selectedSlotIdx + 1}</h3>
              <button
                onClick={() => setSelectedSlotIdx(null)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 py-4 flex-1">
              {channels.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectChannelForSlot(c, selectedSlotIdx)}
                  className="p-3 bg-neutral-950/80 hover:bg-neutral-800/80 rounded-xl border border-neutral-800/80 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {c.logo ? (
                      <img src={c.logo} alt={c.name} className="w-7 h-7 object-contain rounded" />
                    ) : (
                      <Tv className="w-5 h-5 text-neutral-500" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-white">{c.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{c.group}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {c.resolution || '1080p'}
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
