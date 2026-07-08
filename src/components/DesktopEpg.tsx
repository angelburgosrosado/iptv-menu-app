import * as React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { simRouter } from '../shims/expo-router';
import { CalendarRange, Play, Clock, Info, Tv } from 'lucide-react';
import { Channel } from '../types/iptv';

interface Show {
  title: string;
  time: string;
  duration: number; // in minutes
  progress: number; // percentage completed
  description: string;
  isLive: boolean;
}

export default function DesktopEpg() {
  const { channels } = usePlayerStore();
  const [selectedShow, setSelectedShow] = React.useState<Show | null>(null);
  const [selectedChannel, setSelectedChannel] = React.useState<Channel | null>(null);

  // Take the first 5 channels (or fallback list) to build an incredibly rich and functional schedule grid
  const guideChannels = React.useMemo(() => {
    return channels.slice(0, 7);
  }, [channels]);

  // Generates randomized/stable television programs for each stream to simulate real TV
  const getProgramsForChannel = React.useCallback((channel: Channel): Show[] => {
    const hash = channel.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const programTemplates = [
      { t: "Morning Bulletin LIVE", d: "Top stories around the globe, live reporting, and financial digests." },
      { t: "The Tech Orbit Show", d: "Diving deep into cloud containers, quantum silicon, and artificial agents." },
      { t: "Stadium Live Wrap-Up", d: "High-octane summaries of motorsport finals, champions leagues, and courtside play." },
      { t: "Wired Indie Film Spotlight", d: "Curated cinematic masterpieces and documentary highlights from global artists." },
      { t: "Oceanic Planet Deep-Dive", d: "Sub-sea exploration showcasing rare coral ecosystems and marine migration streams." },
      { t: "Lofi Beats Chill Room", d: "Visualizers and acoustic synthesizer rhythms compiled for deep focus." },
      { t: "Astronomy & Universe Now", d: "Telescopic broadcasts and deep space orbit updates live from active observatories." },
      { t: "The Global Market Hour", d: "Real-time commodities trading, crypto charts, and stock exchange coverage." },
      { t: "Prime-Time Comedy Hour", d: "An archival stream of standups, late-night satirical skits, and retro sitcoms." }
    ];

    const idx1 = hash % programTemplates.length;
    const idx2 = (hash + 3) % programTemplates.length;
    const idx3 = (hash + 7) % programTemplates.length;

    return [
      {
        title: programTemplates[idx1].t,
        time: "10:00 AM - 11:30 AM",
        duration: 90,
        progress: 82,
        description: programTemplates[idx1].d,
        isLive: true
      },
      {
        title: programTemplates[idx2].t,
        time: "11:30 AM - 1:00 PM",
        duration: 90,
        progress: 0,
        description: programTemplates[idx2].d,
        isLive: false
      },
      {
        title: programTemplates[idx3].t,
        time: "1:00 PM - 2:30 PM",
        duration: 90,
        progress: 0,
        description: programTemplates[idx3].d,
        isLive: false
      }
    ];
  }, []);

  const handlePlayInSimulator = (channel: Channel) => {
    simRouter.push(`/player/${channel.id}`);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* EPG Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarRange className="w-6 h-6 text-blue-500" />
            Electronic Program Guide (EPG)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Browse schedule matrices, find active on-air broadcasts, and sync with simulator playback.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/10 text-[10px] text-green-400 font-bold uppercase tracking-wider w-fit self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          Simulated GMT Timetable Active
        </div>
      </div>

      {guideChannels.length === 0 ? (
        <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/2 p-8">
          <Tv className="w-12 h-12 text-zinc-600 mb-3" />
          <h3 className="text-sm font-bold text-zinc-300">No Channels for EPG</h3>
          <p className="text-xs text-zinc-500 text-center max-w-sm mt-1">
            Ensure an M3U playlist is parsed and sync'd to render schedule timelines.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          
          {/* Timeline Grid (8 cols) */}
          <div className="xl:col-span-8 flex flex-col bg-black/40 border border-white/15 rounded-2xl overflow-hidden">
            
            {/* Header Timeline hours */}
            <div className="grid grid-cols-12 border-b border-white/10 bg-zinc-950/60 p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest gap-2">
              <div className="col-span-3">Network Feed</div>
              <div className="col-span-3">Live (On-Air Now)</div>
              <div className="col-span-3">Up Next (11:30 AM)</div>
              <div className="col-span-3">Later (1:00 PM)</div>
            </div>

            {/* Scrollable grid channels rows */}
            <div className="divide-y divide-white/5 overflow-y-auto max-h-[400px]">
              {guideChannels.map((c) => {
                const shows = getProgramsForChannel(c);
                return (
                  <div key={c.id} className="grid grid-cols-12 items-center p-4 hover:bg-white/[0.01] gap-2">
                    {/* Channel Metadata */}
                    <div className="col-span-3 flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-black/50 border border-white/5 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={c.logo}
                          alt={c.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
                          }}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-xs font-bold text-zinc-200 truncate leading-snug">
                        {c.name}
                      </span>
                    </div>

                    {/* Show Blocks */}
                    {shows.map((show, sidx) => {
                      return (
                        <div
                          key={sidx}
                          onClick={() => {
                            setSelectedShow(show);
                            setSelectedChannel(c);
                          }}
                          className={`col-span-3 p-2.5 rounded-xl text-left cursor-pointer transition-all border group relative min-h-[58px] flex flex-col justify-between ${
                            show.isLive
                              ? 'bg-blue-600/10 border-blue-500/20 hover:bg-blue-600/15'
                              : 'bg-white/3 border-transparent hover:bg-white/5 hover:border-white/5'
                          }`}
                        >
                          <div>
                            <span className="text-[9px] text-zinc-400 font-bold block leading-none mb-1 group-hover:text-zinc-200 transition-colors">
                              {show.time.split(' - ')[0]}
                            </span>
                            <span className="text-xs font-bold text-white truncate block group-hover:text-blue-300 transition-colors">
                              {show.title}
                            </span>
                          </div>

                          {show.isLive && (
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1.5">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${show.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Inspector Sidebar (4 cols) */}
          <div className="xl:col-span-4 flex flex-col">
            {selectedShow && selectedChannel ? (
              <div className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 rounded-2xl p-5 h-full flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 p-1.5 overflow-hidden">
                    <img
                      src={selectedChannel.logo}
                      alt={selectedChannel.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
                      }}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                      {selectedChannel.group}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {selectedChannel.name}
                    </h3>
                  </div>
                </div>

                <div className="border-t border-b border-white/5 py-4 flex flex-col gap-2">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>{selectedShow.time}</span>
                  </div>
                  {selectedShow.isLive && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full">
                        LIVE NOW
                      </span>
                      <span className="text-[11px] text-zinc-400 font-semibold">
                        {selectedShow.progress}% complete
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-white leading-tight mb-2">
                    {selectedShow.title}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                    {selectedShow.description}
                  </p>
                </div>

                <button
                  onClick={() => handlePlayInSimulator(selectedChannel)}
                  className="mt-auto w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Launch Network Stream
                </button>
              </div>
            ) : (
              <div className="border border-white/10 rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center bg-white/[0.01]">
                <Info className="w-8 h-8 text-zinc-600 mb-3" />
                <h4 className="text-xs font-bold text-zinc-300">Select Program</h4>
                <p className="text-[11px] text-zinc-500 max-w-xs mt-1.5 leading-relaxed">
                  Click on any schedule block in the grid timetable to load metadata, timelines, and quick streaming triggers.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
