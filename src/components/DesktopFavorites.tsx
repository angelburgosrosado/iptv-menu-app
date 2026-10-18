/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { simRouter } from '../shims/expo-router';
import { 
  Heart, 
  Play, 
  Star, 
  Sparkles, 
  History, 
  Trash2, 
  Clock, 
  Tv, 
  Clapperboard,
  RotateCcw,
  Radio,
  Plus
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { DEMO_FAST_CHANNELS } from '../data/demoChannels';
import MediaCard from './MediaCard';
import LiveChannelTile from './LiveChannelTile';

interface DesktopFavoritesProps {
  onSelectChannel?: (channel: Channel) => void;
}

export default function DesktopFavorites({ onSelectChannel }: DesktopFavoritesProps = {}) {
  const { channels, vodChannels = [], seriesChannels = [], favorites, history, toggleFavorite, clearHistory } = usePlayerStore();
  const [activeTab, setActiveTab] = React.useState<'favorites' | 'history'>('favorites');
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  const effectiveChannels = React.useMemo(() => {
    return channels && channels.length > 0 ? channels : DEMO_FAST_CHANNELS;
  }, [channels]);

  const allChannels = React.useMemo(() => {
    return [...effectiveChannels, ...vodChannels, ...seriesChannels];
  }, [effectiveChannels, vodChannels, seriesChannels]);

  // Find all actual channel structures for favorited channel IDs
  const favoriteChannels = React.useMemo(() => {
    return allChannels.filter((c) => favorites.includes(c.id));
  }, [allChannels, favorites]);

  // Separate favorites into Live Channels vs Movies/Series
  const liveFavorites = React.useMemo(() => {
    return favoriteChannels.filter((c) => !c.streamType || c.streamType === 'live');
  }, [favoriteChannels]);

  const vodFavorites = React.useMemo(() => {
    return favoriteChannels.filter((c) => c.streamType === 'vod' || c.streamType === 'series');
  }, [favoriteChannels]);

  // Find all actual channel structures for history channel IDs (ordered by most recent)
  const historyChannels = React.useMemo(() => {
    return history
      .map((id) => allChannels.find((c) => c.id === id))
      .filter((c): c is Channel => Boolean(c));
  }, [allChannels, history]);

  const handlePlay = (channel: Channel) => {
    if (onSelectChannel) {
      onSelectChannel(channel);
    } else {
      simRouter.push(`/player/${channel.id}`);
    }
  };

  const handleConfirmClearHistory = () => {
    clearHistory();
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col h-full gap-6 px-4 sm:px-6 py-2">
      {/* Streamly Header & Tab Pill Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2330]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#7c5cff] fill-[#7c5cff]/30" />
              <span>My List</span>
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7c5cff]/20 text-[#00e0c6] border border-[#7c5cff]/30">
              Personal Collection
            </span>
          </div>
          <p className="text-xs text-[#9aa0b3] mt-1">
            Bookmarked favorite channels, saved movies, and chronological watch history
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtab segmented control */}
          <div className="flex bg-[#11141c] p-1 border border-[#1f2330] rounded-2xl">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'favorites'
                  ? 'bg-gradient-to-r from-[#7c5cff] to-[#6342e8] text-white shadow-md shadow-[#7c5cff]/30'
                  : 'text-[#9aa0b3] hover:text-white'
              }`}
              aria-label="Favorites Tab"
            >
              <Heart className={`w-3.5 h-3.5 ${activeTab === 'favorites' ? 'fill-current' : ''}`} />
              <span>Favorites ({favorites.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-[#7c5cff] to-[#00e0c6] text-white shadow-md shadow-[#7c5cff]/30'
                  : 'text-[#9aa0b3] hover:text-white'
              }`}
              aria-label="Recently Watched History Tab"
            >
              <History className="w-3.5 h-3.5" />
              <span>History ({history.length})</span>
            </button>
          </div>

          {activeTab === 'history' && history.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              aria-label="Clear all watch history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation modal for clearing history */}
      {showClearConfirm && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            <span className="text-xs font-bold text-red-300">
              Clear all {history.length} recently watched items from history?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmClearHistory}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Yes, Clear
            </button>
          </div>
        </div>
      )}

      {/* FAVORITES VIEW */}
      {activeTab === 'favorites' && (
        favoriteChannels.length === 0 ? (
          <div className="flex flex-col gap-6">
            <div className="p-6 rounded-3xl bg-[#11141c]/80 border border-[#1f2330] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#7c5cff]/15 border border-[#7c5cff]/30 flex items-center justify-center text-[#7c5cff] flex-shrink-0">
                  <Star className="w-7 h-7 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Your List is Empty</h3>
                  <p className="text-xs text-[#9aa0b3] mt-1 max-w-xl">
                    Bookmark your top live channels, movies, and series with the heart icon for fast, 1-click access anytime.
                  </p>
                </div>
              </div>
            </div>

            {/* Recommended starter channels */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#9aa0b3] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#00e0c6]" /> Recommended Channels to Save
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {DEMO_FAST_CHANNELS.slice(0, 8).map((c) => (
                  <LiveChannelTile
                    key={c.id}
                    channel={c}
                    isFavorite={favorites.includes(c.id)}
                    currentProgram={{
                      title: c.currentProgram || 'Live HD Stream',
                      progressPercent: 45,
                      minutesRemaining: 30
                    }}
                    onPlay={() => handlePlay(c)}
                    onToggleFavorite={() => toggleFavorite(c.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 overflow-y-auto max-h-[680px] pr-1 pb-8 scrollbar-hide">
            {/* Live Channels section if any */}
            {liveFavorites.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tv className="w-4 h-4 text-[#00e0c6]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Saved Live TV ({liveFavorites.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {liveFavorites.map((c) => (
                    <LiveChannelTile
                      key={c.id}
                      channel={c}
                      isFavorite={true}
                      currentProgram={{
                        title: c.currentProgram || 'Live HD Stream',
                        progressPercent: 50,
                        minutesRemaining: 30
                      }}
                      onPlay={() => handlePlay(c)}
                      onToggleFavorite={() => toggleFavorite(c.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Movies & Series section if any */}
            {vodFavorites.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clapperboard className="w-4 h-4 text-[#7c5cff]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Saved Movies & Shows ({vodFavorites.length})
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {vodFavorites.map((c) => (
                    <div key={c.id} className="w-full">
                      <MediaCard
                        title={c.name}
                        subtitle={c.category || (c.streamType === 'series' ? 'TV Series' : 'Movie')}
                        poster={c.logo}
                        rating={8.5}
                        aspectRatio="poster"
                        isFavorite={true}
                        onPlay={() => handlePlay(c)}
                        onToggleFavorite={() => toggleFavorite(c.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* WATCH HISTORY VIEW */}
      {activeTab === 'history' && (
        historyChannels.length === 0 ? (
          <div className="flex flex-col gap-6">
            <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center border border-dashed border-[#1f2330] rounded-3xl bg-[#0b0d14]/50 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#7c5cff]/15 flex items-center justify-center mb-4 border border-[#7c5cff]/30 text-[#00e0c6]">
                <History className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">No Playback History Recorded</h3>
              <p className="text-xs text-[#9aa0b3] max-w-sm mt-1.5 leading-relaxed">
                When you launch streams in the Web Cinema player, your recently viewed channels will automatically appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin">
            {historyChannels.map((c, idx) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3.5 bg-[#11141c]/90 hover:bg-[#181c27] border border-[#1f2330] hover:border-[#7c5cff]/40 rounded-2xl transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-6 text-[10px] font-mono text-[#6b7180] text-center font-bold">
                    #{idx + 1}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#06070b] border border-[#1f2330] p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={c.logo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60'}
                      alt={c.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                      {c.resolution && (
                        <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/5 text-[#9aa0b3] border border-white/10">
                          {c.resolution}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#9aa0b3] flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-[#00e0c6]" />
                      Recently streamed • {c.group || 'Live'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlay(c)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7c5cff] to-[#00e0c6] hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#7c5cff]/20 transition-all cursor-pointer"
                    aria-label={`Resume stream ${c.name}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Resume
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
