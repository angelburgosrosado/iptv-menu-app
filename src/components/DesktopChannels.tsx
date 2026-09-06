import * as React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { simRouter } from '../shims/expo-router';
import { Search, Play, Heart, Tv, Grid, List, Maximize2, Smartphone, Globe } from 'lucide-react';
import { Channel } from '../types/iptv';
import WebCinemaPlayer from './WebCinemaPlayer';
import CountryChannelSections from './CountryChannelSections';
import { PageProtocolHeader } from './PageProtocolHeader';

interface DesktopChannelsProps {
  onSwitchToMultiScreen?: () => void;
}

export default function DesktopChannels({ onSwitchToMultiScreen }: DesktopChannelsProps = {}) {
  const { channels, groups, favorites, toggleFavorite } = usePlayerStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list' | 'country'>('grid');
  const [cinemaChannel, setCinemaChannel] = React.useState<Channel | null>(null);

  // Filter channels based on group and search term
  const filteredChannels = React.useMemo(() => {
    let list = channels;
    if (selectedGroup) {
      list = list.filter((c) => c.group === selectedGroup);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
      );
    }
    return list;
  }, [channels, selectedGroup, searchQuery]);

  const handlePlayInSimulator = (channel: Channel) => {
    // Navigate simulator to the player screen
    simRouter.push(`/player/${channel.id}`);
  };

  const handleOpenCinema = (channel: Channel) => {
    setCinemaChannel(channel);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Protocol & Specification Architecture Header */}
      <PageProtocolHeader
        title="Global IPTV Stream Catalog"
        description="Real-time multi-resolution stream index and manifest catalog for live HLS feeds. Streams are parsed from M3U playlists, normalized with ISO-3166-1 regional tags, and dispatched to native players or low-latency Web Cinema playback."
        protocol="RFC 8216 (HLS) & ISO-3166-1"
        schema="Extended M3U & IPTV-Org Canonical v1.2"
        rfcOrStandard="RFC 8216 §4.3.2 • ISO-3166-1 Alpha-2"
        layer="Transport & Manifest Parsing Layer"
        supportedTags={['#EXTM3U', '#EXTINF', 'tvg-id', 'tvg-name', 'tvg-country', 'group-title', 'tvg-logo']}
        icon={Tv}
        badgeColor="blue"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('country')}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
                viewMode === 'country' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Country Sections View"
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>
        </div>
      </PageProtocolHeader>

      {/* Directory Search & Filter Subbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 -mt-2">
        <div>
          <span className="text-xs text-zinc-400">
            Showing <strong className="text-white">{filteredChannels.length}</strong> streams across{' '}
            <strong className="text-white">{groups.length}</strong> categories
          </span>
        </div>

        {/* View mode toggle + search */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('country')}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
                viewMode === 'country' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Country Sections View"
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 hover:bg-white/10 focus:bg-zinc-900 border border-white/10 focus:border-blue-500/50 rounded-xl text-xs text-white outline-none placeholder-zinc-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Group Quick Filter Bar */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
          Select Category
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
          <button
            onClick={() => setSelectedGroup(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              !selectedGroup
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-zinc-200'
            }`}
          >
            All Categories ({channels.length})
          </button>
          {groups.map((g) => {
            const isActive = selectedGroup === g;
            return (
              <button
                key={g}
                onClick={() => setSelectedGroup(isActive ? null : g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                    : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-zinc-200'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid/List/Country catalog */}
      {viewMode === 'country' ? (
        <div className="overflow-y-auto max-h-[600px] pr-2 scrollbar-thin">
          <CountryChannelSections
            onOpenCinema={handleOpenCinema}
            onPlayInSimulator={handlePlayInSimulator}
          />
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/2 p-8">
          <Tv className="w-12 h-12 text-zinc-600 mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-zinc-300">No Channels Found</h3>
          <p className="text-xs text-zinc-500 text-center max-w-sm mt-1">
            We couldn't find any channels matching "{searchQuery}" under the selected group. Try altering your filters.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin">
          {filteredChannels.map((c) => {
            const isFav = favorites.includes(c.id);
            return (
              <div
                key={c.id}
                className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center p-2.5 overflow-hidden flex-shrink-0">
                    <img
                      src={c.logo || null}
                      alt={c.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
                      }}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate leading-tight group-hover:text-blue-400 transition-colors">
                      {c.name}
                    </h4>
                    <span className="inline-block text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full font-semibold text-zinc-400 mt-1 uppercase tracking-wider">
                      {c.group}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleFavorite(c.id)}
                    className={`p-2 rounded-xl border transition-all ${
                      isFav
                        ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                        : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-white'
                    }`}
                    title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  {/* Watch in Web Cinema Player (Theater Mode) */}
                  <button
                    onClick={() => handleOpenCinema(c)}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 text-xs font-bold transition-all cursor-pointer"
                    title="Watch in Full Web Cinema Player"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch</span>
                  </button>

                  {/* Simulator option */}
                  <button
                    onClick={() => handlePlayInSimulator(c)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all"
                    title="Preview on Phone Simulator Frame"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5">
            <span className="col-span-6 md:col-span-8">Channel Info</span>
            <span className="col-span-3 md:col-span-2">Group</span>
            <span className="col-span-3 md:col-span-2 text-right">Actions</span>
          </div>
          {filteredChannels.map((c) => {
            const isFav = favorites.includes(c.id);
            return (
              <div
                key={c.id}
                className="grid grid-cols-12 gap-4 items-center px-4 py-2.5 bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-xl transition-all"
              >
                <div className="col-span-6 md:col-span-8 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
                    <img
                      src={c.logo || null}
                      alt={c.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
                      }}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                </div>

                <div className="col-span-3 md:col-span-2 min-w-0">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block truncate">
                    {c.group}
                  </span>
                </div>

                <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => toggleFavorite(c.id)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isFav
                        ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                        : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleOpenCinema(c)}
                    className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg text-[11px] font-bold transition-all flex items-center gap-1"
                    title="Watch in Web Cinema Player"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Watch</span>
                  </button>

                  <button
                    onClick={() => handlePlayInSimulator(c)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all"
                    title="Play in Phone Simulator"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Web Cinema / TV Mode Fullscreen Overlay */}
      {cinemaChannel && (
        <WebCinemaPlayer
          initialChannel={cinemaChannel}
          onClose={() => setCinemaChannel(null)}
          onSwitchToMultiScreen={onSwitchToMultiScreen}
        />
      )}
    </div>
  );
}
