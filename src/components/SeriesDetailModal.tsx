/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  X, 
  Play, 
  Star, 
  Calendar, 
  Tv, 
  Clock, 
  Film, 
  Layers, 
  Info,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { fetchTmdbMetadata, TmdbResult } from '../utils/tmdbService';
import { usePlayerStore } from '../store/usePlayerStore';
import { fetchXtreamSeriesInfo, generateXtreamEpisodesList } from '../utils/xtreamClient';

interface SeriesDetailModalProps {
  channel: Channel;
  onClose: () => void;
  onPlayEpisode: (episodeChannel: Channel) => void;
}

export function SeriesDetailModal({ channel, onClose, onPlayEpisode }: SeriesDetailModalProps) {
  const { tmdbApiKey } = usePlayerStore();
  const [metadata, setMetadata] = React.useState<TmdbResult | null>(null);
  const [seriesInfo, setSeriesInfo] = React.useState<any | null>(null);
  const [episodes, setEpisodes] = React.useState<Channel[]>([]);
  const [selectedSeason, setSelectedSeason] = React.useState<string>('1');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    async function loadSeriesData() {
      setIsLoading(true);

      // 1. Fetch TMDB TV metadata
      try {
        const tmdb = await fetchTmdbMetadata(channel.name, tmdbApiKey, 'tv');
        if (isMounted) setMetadata(tmdb);
      } catch (e) {
        // TMDB is supplementary
      }

      // 2. Fetch Xtream Series Info if channel originates from Xtream
      try {
        const rawAccounts = localStorage.getItem('iptv_xtream_accounts');
        let activeAccount: any = null;
        if (rawAccounts) {
          const parsed = JSON.parse(rawAccounts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            activeAccount = parsed[0];
          }
        }

        if (activeAccount && channel.tvgId) {
          const sId = channel.tvgId.replace(/^xtream_series_/, '');
          const info = await fetchXtreamSeriesInfo(
            {
              serverUrl: activeAccount.serverUrl,
              username: activeAccount.username,
              password: activeAccount.password || '',
              status: 'connected'
            },
            sId
          );

          if (isMounted && info && info.episodes) {
            setSeriesInfo(info);
            const eps = generateXtreamEpisodesList(
              {
                serverUrl: activeAccount.serverUrl,
                username: activeAccount.username,
                password: activeAccount.password || '',
                status: 'connected'
              },
              channel.name,
              info
            );
            setEpisodes(eps);
            const firstSeason = Object.keys(info.episodes)[0] || '1';
            setSelectedSeason(firstSeason);
          }
        }
      } catch (err) {
        console.warn('Could not fetch Xtream series info', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSeriesData();

    return () => {
      isMounted = false;
    };
  }, [channel, tmdbApiKey]);

  // Derived season keys from episodes or fallback
  const seasons = React.useMemo(() => {
    if (seriesInfo && seriesInfo.episodes) {
      return Object.keys(seriesInfo.episodes).sort((a, b) => Number(a) - Number(b));
    }
    const derived = new Set<string>();
    episodes.forEach(ep => {
      const match = ep.group.match(/Season (\d+)/i);
      if (match) derived.add(match[1]);
    });
    return derived.size > 0 ? Array.from(derived).sort((a, b) => Number(a) - Number(b)) : ['1'];
  }, [seriesInfo, episodes]);

  // Filter episodes for the active season
  const currentSeasonEpisodes = React.useMemo(() => {
    if (seriesInfo && seriesInfo.episodes && seriesInfo.episodes[selectedSeason]) {
      return episodes.filter(ep => ep.group === `Season ${selectedSeason}`);
    }
    // Fallback if no specific season breakdown, return playable channel as Episode 1
    if (episodes.length > 0) {
      return episodes;
    }
    return [
      {
        ...channel,
        id: `${channel.id}_ep1`,
        name: `${channel.name} - Episode 1 (Pilot)`,
        streamType: 'series' as const
      }
    ];
  }, [seriesInfo, episodes, selectedSeason, channel]);

  const bgImage = metadata?.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${metadata.backdrop_path}` 
    : channel.logo || '';
    
  const posterImage = metadata?.poster_path 
    ? `https://image.tmdb.org/t/p/w500${metadata.poster_path}` 
    : channel.logo || '';

  const title = metadata?.name || metadata?.title || channel.name;
  const firstAirDate = metadata?.first_air_date;
  const rating = metadata?.vote_average || (channel.resolution?.includes('★') ? channel.resolution : null);
  const overview = metadata?.overview || seriesInfo?.info?.plot || "Stream this multi-season series on-demand with high-definition episodes.";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6 md:p-8 animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl bg-[#0b0d14]/95 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-white/10 flex flex-col max-h-[92vh]">
        
        {/* Background Blur Overlay */}
        <div 
          className="absolute inset-0 opacity-25 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${bgImage})`, filter: 'blur(50px)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#06070b] via-[#06070b]/80 to-transparent pointer-events-none" />

        {/* Top Header / Close Button */}
        <div className="relative z-10 flex items-center justify-between p-5 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#7c5cff]/15 text-[#a78bfa] border border-[#7c5cff]/30">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white truncate max-w-md sm:max-w-xl">
                {title}
              </h2>
              <span className="text-[11px] font-mono text-[#a78bfa]">
                TV Series • {seasons.length} {seasons.length === 1 ? 'Season' : 'Seasons'}
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 bg-black/60 hover:bg-white/20 rounded-full text-zinc-400 hover:text-white transition-all cursor-pointer border border-white/10"
            aria-label="Close series modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 overflow-y-auto flex-1 p-5 sm:p-7 flex flex-col gap-6 custom-scrollbar">
          
          {/* Hero Banner Row */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-28 sm:w-36 flex-shrink-0 aspect-[2/3] bg-zinc-900 rounded-2xl overflow-hidden shadow-xl border border-white/10">
              {posterImage ? (
                <img 
                  src={posterImage} 
                  alt={title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <Film className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                {firstAirDate && (
                  <span className="flex items-center gap-1 bg-white/5 text-zinc-300 px-2 py-0.5 rounded-lg border border-white/10">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    {firstAirDate.substring(0, 4)}
                  </span>
                )}
                {rating && (
                  <span className="flex items-center gap-1 bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/30 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {typeof rating === 'number' ? rating.toFixed(1) : rating}
                  </span>
                )}
                <span className="bg-[#7c5cff]/15 text-[#a78bfa] px-2.5 py-0.5 rounded-lg border border-[#7c5cff]/30 font-bold uppercase tracking-wider text-[11px]">
                  {channel.group || 'TV Series'}
                </span>
              </div>

              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed line-clamp-3 mb-4">
                {overview}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (currentSeasonEpisodes[0]) {
                      onPlayEpisode(currentSeasonEpisodes[0]);
                      onClose();
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cff] to-[#00e0c6] hover:brightness-110 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-[#7c5cff]/30 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Watching</span>
                </button>
              </div>
            </div>
          </div>

          {/* Season Selector Tabs */}
          {seasons.length > 1 && (
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-zinc-400 mr-2 flex items-center gap-1 flex-shrink-0">
                <Layers className="w-3.5 h-3.5 text-[#a78bfa]" />
                Seasons:
              </span>
              {seasons.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSeason(s)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                    selectedSeason === s
                      ? 'bg-gradient-to-r from-[#7c5cff] to-[#5a36ea] text-white shadow-md shadow-[#7c5cff]/25'
                      : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Season {s}
                </button>
              ))}
            </div>
          )}

          {/* Episodes List Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Season {selectedSeason} Episodes ({currentSeasonEpisodes.length})
              </h3>
            </div>

            {isLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : currentSeasonEpisodes.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 text-zinc-500 text-xs">
                No episodes found for Season {selectedSeason}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {currentSeasonEpisodes.map((ep, idx) => (
                  <div
                    key={ep.id || idx}
                    onClick={() => {
                      onPlayEpisode(ep);
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-all flex-shrink-0">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                          {ep.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                          <span>{ep.resolution || '1080p'}</span>
                          <span>•</span>
                          <span>{ep.bitrate || 'Episode'}</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
