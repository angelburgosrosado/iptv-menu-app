import * as React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { fetchWithAuth } from '../lib/apiClient';
import { CalendarRange, Loader, Play, Settings } from 'lucide-react';
import { simRouter } from '../shims/expo-router';

export default function MobileEpg() {
  const { channels } = usePlayerStore();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState<string | null>(null);

  // Take the first 5 channels (or fallback list) to build an incredibly rich and functional schedule grid
  const guideChannels = React.useMemo(() => {
    return channels.slice(0, 5);
  }, [channels]);

  const handleGenerateEpg = async () => {
    try {
      setIsGenerating(true);
      setStatusMsg('Dispatching EPG generation job to backend...');
      const res = await fetchWithAuth('/api/epg', {
        method: 'POST',
        body: JSON.stringify({
          playlistId: 'default_playlist',
          sourceConfig: {
            urls: [],
            refreshIntervalHours: 24,
          }
        })
      });

      setStatusMsg(`Job dispatched! EPG ID: ${res.epgId}. The backend worker is now generating the XMLTV feed.`);
    } catch (err: any) {
      setStatusMsg(`Failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Mobile EPG Header */}
      <div className="p-4 border-b border-white/10 bg-zinc-950 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
            <CalendarRange className="w-5 h-5 text-blue-500" />
            Mobile TV Guide
          </h2>
          <p className="text-[10px] text-zinc-400 mt-0.5">Horizontal Timetable View</p>
        </div>
        
        <button 
          onClick={handleGenerateEpg} 
          disabled={isGenerating}
          className="bg-blue-600 p-2 rounded-full disabled:opacity-50"
        >
          {isGenerating ? <Loader className="w-4 h-4 text-white animate-spin" /> : <Settings className="w-4 h-4 text-white" />}
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-blue-900/20 text-blue-400 text-xs border-b border-blue-900/40">
          {statusMsg}
        </div>
      )}

      {/* Horizontal EPG Scroll */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="min-w-[800px] flex flex-col p-4 gap-3">
          {guideChannels.length === 0 ? (
            <div className="text-center text-zinc-500 text-xs mt-10">
              No channels available. Load a playlist first.
            </div>
          ) : (
            guideChannels.map((c) => (
              <div key={c.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-2 h-[80px]">
                {/* Channel Icon Fixed Left */}
                <div className="w-12 h-12 bg-black/40 rounded-lg p-1 flex-shrink-0">
                  <img src={c.logo} alt={c.name} className="w-full h-full object-contain" />
                </div>
                
                {/* Dynamic Time-Synchronized Programs */}
                <div className="flex flex-1 gap-2 overflow-x-auto h-full items-center px-2 snap-x hide-scrollbar">
                  {(() => {
                    const now = new Date();
                    const hour = now.getHours();
                    const formatHour = (h: number) => {
                      const nh = ((h % 24) + 24) % 24;
                      const period = nh >= 12 ? 'PM' : 'AM';
                      const dh = nh % 12 === 0 ? 12 : nh % 12;
                      return `${dh}:00 ${period}`;
                    };
                    const chGroup = (c.group || '').toLowerCase();
                    const p1Title = chGroup.includes('sport') ? `${c.name} Matchday LIVE` : chGroup.includes('news') ? `${c.name} World Report LIVE` : `${c.name} Live Stream`;
                    const p2Title = chGroup.includes('sport') ? 'Sports Center Analysis' : chGroup.includes('news') ? 'Global Headlines & Finance' : `${c.name} Prime Showcase`;
                    const p3Title = chGroup.includes('sport') ? 'Championship Retrospective' : 'Feature Documentary Hour';

                    return (
                      <>
                        <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-2 min-w-[200px] h-full flex flex-col justify-center snap-start relative">
                          <span className="text-[9px] text-blue-400 font-bold">{formatHour(hour)} - LIVE</span>
                          <span className="text-xs text-white font-bold truncate">{p1Title}</span>
                          <div className="absolute bottom-0 left-0 h-1 bg-blue-500 w-1/2 rounded-bl-lg" />
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 min-w-[170px] h-full flex flex-col justify-center snap-start">
                          <span className="text-[9px] text-zinc-400 font-bold">{formatHour(hour + 1)}</span>
                          <span className="text-xs text-zinc-200 font-bold truncate">{p2Title}</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 min-w-[220px] h-full flex flex-col justify-center snap-start">
                          <span className="text-[9px] text-zinc-400 font-bold">{formatHour(hour + 2)}</span>
                          <span className="text-xs text-zinc-200 font-bold truncate">{p3Title}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Play Button */}
                <button 
                  onClick={() => simRouter.push(`/player/${c.id}`)}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-white/20"
                >
                  <Play className="w-4 h-4 text-white fill-current" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
