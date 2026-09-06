import * as React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { simRouter } from '../shims/expo-router';
import { Heart, Play, Star, Sparkles } from 'lucide-react';
import { Channel } from '../types/iptv';
import { PageProtocolHeader } from './PageProtocolHeader';

export default function DesktopFavorites() {
  const { channels, favorites, toggleFavorite } = usePlayerStore();

  // Find all actual channel structures for favorited channel IDs
  const favoriteChannels = React.useMemo(() => {
    return channels.filter((c) => favorites.includes(c.id));
  }, [channels, favorites]);

  const handlePlayInSimulator = (channel: Channel) => {
    simRouter.push(`/player/${channel.id}`);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Protocol Architecture Header */}
      <PageProtocolHeader
        title="Personal Favorites Ledger"
        description="Client-side stream bookmark curation ledger. Caches favorited stream channels with instant zero-latency lookups, tvg-id key correlation, and direct playback dispatch."
        protocol="Client Personalization & Bookmark Protocol"
        schema="User Favorites Cache Schema (favorites: string[])"
        rfcOrStandard="W3C Storage • MMKV Binary Store"
        layer="Client Presentation & Personalization Layer"
        supportedTags={['user_favorites', 'tvg-id indexing', 'MMKV Cache', 'Instant Dispatch', 'Local State']}
        icon={Heart}
        badgeColor="purple"
      />

      {favoriteChannels.length === 0 ? (
        <div className="flex-1 min-h-[350px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/2 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/10 animate-bounce">
            <Star className="w-8 h-8 text-red-400 fill-current" />
          </div>
          <h3 className="text-base font-bold text-zinc-200">No Favorites Selected</h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1.5 leading-relaxed">
            You haven't favorited any channels yet! Head over to the <strong className="text-zinc-300">Channels</strong> catalog or explore pages and toggle the heart button to populate this list.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[520px] pr-2 scrollbar-thin">
          {favoriteChannels.map((c) => {
            return (
              <div
                key={c.id}
                className="group relative bg-gradient-to-b from-white/[0.04] to-transparent hover:from-white/[0.08] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex flex-col transition-all hover:-translate-y-1"
              >
                {/* Visual Glass Shine */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <span className="text-[9px] font-bold text-amber-400/80 uppercase tracking-widest px-1.5 py-0.5 bg-amber-400/10 rounded-md border border-amber-400/10 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> FAV
                  </span>
                </div>

                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center p-2 overflow-hidden flex-shrink-0">
                    <img
                      src={c.logo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60'}
                      alt={c.name}
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate leading-snug group-hover:text-blue-400 transition-colors">
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
                    className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-red-500/10"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current text-red-500" />
                    Remove
                  </button>
                  <button
                    onClick={() => handlePlayInSimulator(c)}
                    className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Stream
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
