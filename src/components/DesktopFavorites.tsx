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
  RotateCcw 
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { PageProtocolHeader } from './PageProtocolHeader';

export default function DesktopFavorites() {
  const { channels, vodChannels = [], seriesChannels = [], favorites, history, toggleFavorite, clearHistory } = usePlayerStore();
  const [activeTab, setActiveTab] = React.useState<'favorites' | 'history'>('favorites');
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  const allChannels = React.useMemo(() => {
    return [...channels, ...vodChannels, ...seriesChannels];
  }, [channels, vodChannels, seriesChannels]);

  // Find all actual channel structures for favorited channel IDs
  const favoriteChannels = React.useMemo(() => {
    return allChannels.filter((c) => favorites.includes(c.id));
  }, [allChannels, favorites]);

  // Find all actual channel structures for history channel IDs (ordered by most recent)
  const historyChannels = React.useMemo(() => {
    return history
      .map((id) => allChannels.find((c) => c.id === id))
      .filter((c): c is Channel => Boolean(c));
  }, [allChannels, history]);

  const handlePlayInSimulator = (channel: Channel) => {
    simRouter.push(`/player/${channel.id}`);
  };

  const handleConfirmClearHistory = () => {
    clearHistory();
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Protocol Architecture Header */}
      <PageProtocolHeader
        title="Favorites & Playback History Ledger"
        description="Personalized stream curation and chronological playback tracker. Caches favorite bookmarks and recently watched channels with zero-latency lookups, session persistence, and history pruning."
        protocol="Client Personalization & Storage Protocol"
        schema="User Favorites & History Schema"
        rfcOrStandard="W3C Storage • MMKV Binary Store"
        layer="Client Presentation & Personalization Layer"
        supportedTags={['user_favorites', 'playback_history', 'tvg-id indexing', 'MMKV Cache', 'Zero-latency Dispatch']}
        icon={Heart}
        badgeColor="purple"
      >
        <div className="flex items-center gap-2">
          {/* Subtab segmented control */}
          <div className="flex bg-black/40 p-1 border border-white/10 rounded-xl">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'favorites'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
              aria-label="Favorites Tab"
            >
              <Heart className={`w-3.5 h-3.5 ${activeTab === 'favorites' ? 'fill-current' : ''}`} />
              Favorites ({favorites.length})
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
              aria-label="Recently Watched History Tab"
            >
              <History className="w-3.5 h-3.5" />
              History ({history.length})
            </button>
          </div>

          {activeTab === 'history' && history.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              aria-label="Clear all watch history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear History
            </button>
          )}
        </div>
      </PageProtocolHeader>

      {/* Confirmation modal for clearing history */}
      {showClearConfirm && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            <span className="text-xs font-bold text-red-300">
              Clear all {history.length} recently watched channels from history?
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
          <div className="flex-1 min-h-[350px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01] p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20 text-purple-400">
              <Star className="w-8 h-8 fill-current" />
            </div>
            <h3 className="text-base font-bold text-white">No Favorites Selected</h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
              You haven't bookmarked any channels yet! Head over to the <strong className="text-white">Channels</strong> browser and click the heart icon on any stream to add it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[520px] pr-2 scrollbar-thin">
            {favoriteChannels.map((c) => (
              <div
                key={c.id}
                className="group relative bg-[#16161a] hover:bg-[#1c1c21] border border-white/5 hover:border-purple-500/30 rounded-2xl p-4 flex flex-col transition-all hover:-translate-y-1 shadow-sm"
              >
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <span className="text-[9px] font-bold text-purple-300 uppercase tracking-widest px-1.5 py-0.5 bg-purple-500/10 rounded-md border border-purple-500/20 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> FAV
                  </span>
                </div>

                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/5 flex items-center justify-center p-2 overflow-hidden flex-shrink-0">
                    <img
                      src={c.logo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60'}
                      alt={c.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
                      }}
                    />
                  </div>
                  <div className="min-w-0 pr-8">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                      {c.name}
                    </h4>
                    <span className="text-[10px] text-zinc-400 font-semibold block truncate uppercase tracking-wider mt-0.5">
                      {c.group}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <button
                    onClick={() => toggleFavorite(c.id)}
                    className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-red-500/20 cursor-pointer"
                    aria-label={`Remove ${c.name} from favorites`}
                  >
                    <Heart className="w-3.5 h-3.5 fill-current text-red-500" />
                    Remove
                  </button>
                  <button
                    onClick={() => handlePlayInSimulator(c)}
                    className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                    aria-label={`Stream ${c.name}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Stream
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* WATCH HISTORY VIEW */}
      {activeTab === 'history' && (
        historyChannels.length === 0 ? (
          <div className="flex-1 min-h-[350px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01] p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4 border border-cyan-500/20 text-cyan-400">
              <History className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">No Playback History Recorded</h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
              When you launch streams in the phone simulator or Web Cinema player, your recently viewed channels will be automatically tracked here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[520px] pr-2 scrollbar-thin">
            {historyChannels.map((c, idx) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3.5 bg-[#16161a] hover:bg-[#1c1c21] border border-white/5 hover:border-cyan-500/30 rounded-2xl transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-6 text-[10px] font-mono text-zinc-500 text-center font-bold">
                    #{idx + 1}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/5 p-1.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={c.logo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60'}
                      alt={c.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      Recently streamed • {c.group}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayInSimulator(c)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
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
