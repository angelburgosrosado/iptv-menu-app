/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { simRouter } from '../shims/expo-router';
import { 
  Search, 
  Play, 
  Heart, 
  Tv, 
  Grid, 
  List, 
  Smartphone, 
  RotateCcw,
  LayoutGrid,
  Download,
  Tag,
  ArrowUpDown,
  PictureInPicture,
  SlidersHorizontal,
  X,
  Lock,
  Unlock,
  Film,
  Clapperboard,
  Server,
  RefreshCw,
  MoreVertical,
  ChevronDown,
  Sparkles,
  Radio,
  Activity,
  Wifi,
  Zap
} from 'lucide-react';
import { Channel } from '../types/iptv';
import WebCinemaPlayer from './WebCinemaPlayer';
import CountryChannelSections from './CountryChannelSections';
import { 
  StreamResolutionBadge, 
  StreamBitrateBadge, 
  StreamCountryBadge, 
  StreamLiveIndicator, 
  StreamTechRibbon 
} from './StreamInfoBadge';
import { downloadM3UFile } from '../utils/m3uParser';
import { ChannelTagModal } from './ChannelTagModal';
import { ParentalPinModal } from './ParentalPinModal';
import { VODDetailModal } from './VODDetailModal';
import { SeriesDetailModal } from './SeriesDetailModal';
import { parseSearchQuery, matchChannelWithQuery, foldSearchText } from '../utils/searchQueryParser';
import { 
  normalizeCategory, 
  getChannelAvatarDataUri
} from '../utils/channelEnrichment';

interface DesktopChannelsProps {
  initialStreamType?: 'all' | 'live' | 'vod' | 'series';
  onSwitchToMultiScreen?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function DesktopChannels({ initialStreamType, onSwitchToMultiScreen, onNavigateTab }: DesktopChannelsProps) {
  const { 
    channels, 
    groups, 
    favorites, 
    toggleFavorite, 
    selectedStreamType, 
    setSelectedStreamType, 
    customTags, 
    openPiP, 
    parentalControls, 
    isChannelLocked, 
    toggleChannelLock, 
    matrixConfig, 
    setMatrixSlot,
    vodChannels,
    seriesChannels,
    vodCategories,
    seriesCategories,
    isVodLoading,
    isSeriesLoading,
    loadXtreamVod,
    loadXtreamSeries,
    loadDemoChannels,
    isLoading
  } = usePlayerStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list' | 'country'>('grid');
  const [sortMode, setSortMode] = React.useState<'default' | 'name-asc' | 'name-desc' | 'health'>('default');
  const [displayLimit, setDisplayLimit] = React.useState(60);
  const [openMenuChannelId, setOpenMenuChannelId] = React.useState<string | null>(null);

  // Active Modals
  const [cinemaChannel, setCinemaChannel] = React.useState<Channel | null>(null);
  const [taggingChannel, setTaggingChannel] = React.useState<Channel | null>(null);
  const [vodDetailChannel, setVodDetailChannel] = React.useState<Channel | null>(null);
  const [seriesDetailChannel, setSeriesDetailChannel] = React.useState<Channel | null>(null);
  const [showParentalModal, setShowParentalModal] = React.useState(false);

  React.useEffect(() => {
    if (initialStreamType) {
      setSelectedStreamType(initialStreamType);
    }
  }, [initialStreamType, setSelectedStreamType]);

  // Close context menu on outside click
  React.useEffect(() => {
    if (!openMenuChannelId) return;
    const handleOutside = () => setOpenMenuChannelId(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, [openMenuChannelId]);

  // Helpers to identify media types across providers
  const isSeriesChannel = React.useCallback((c: Channel) => {
    if (c.streamType === 'series') return true;
    if (c.streamType === 'live' || c.streamType === 'vod') return false;
    const term = (c.category || c.group || c.name || '').toLowerCase();
    return term.includes('series') || term.includes('season') || term.includes('episode');
  }, []);

  const isVodMovieChannel = React.useCallback((c: Channel) => {
    if (c.streamType === 'vod') return true;
    if (c.streamType === 'live' || c.streamType === 'series') return false;
    if (isSeriesChannel(c)) return false;
    const term = (c.category || c.group || c.name || '').toLowerCase();
    return term.includes('movie') || term.includes('vod') || term.includes('film');
  }, [isSeriesChannel]);

  // Segregated Active Catalog: Divided to avoid mixing tens of thousands of items into live TV
  const activeCatalog = React.useMemo(() => {
    if (selectedStreamType === 'vod') {
      if (vodChannels && vodChannels.length > 0) return vodChannels;
      return channels.filter(isVodMovieChannel);
    }
    if (selectedStreamType === 'series') {
      if (seriesChannels && seriesChannels.length > 0) return seriesChannels;
      return channels.filter(isSeriesChannel);
    }
    return channels.filter((c) => c.streamType === 'live' || (!c.streamType && !isVodMovieChannel(c) && !isSeriesChannel(c)));
  }, [selectedStreamType, channels, vodChannels, seriesChannels, isVodMovieChannel, isSeriesChannel]);

  // Available Categories derived cleanly from active catalog only, with top categories prioritized
  const { availableCategories, topCategories, overflowCategories, categoryCounts } = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const ch of activeCatalog) {
      const norm = ch.category || normalizeCategory(ch.group);
      if (norm) {
        counts.set(norm, (counts.get(norm) || 0) + 1);
      }
    }
    const all = Array.from(counts.keys()).sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0));
    const top = all.slice(0, 8);
    const overflow = all.slice(8);
    return { 
      availableCategories: all, 
      topCategories: top, 
      overflowCategories: overflow, 
      categoryCounts: counts 
    };
  }, [activeCatalog]);

  const parsedSearch = React.useMemo(() => parseSearchQuery(searchQuery), [searchQuery]);

  // Filter & sort channels based on active catalog
  const filteredChannels = React.useMemo(() => {
    let list = activeCatalog;

    if (selectedGroup) {
      const groupTarget = foldSearchText(selectedGroup);
      list = list.filter((c) => {
        const cat = foldSearchText(c.category || normalizeCategory(c.group));
        return foldSearchText(c.group) === groupTarget || cat === groupTarget;
      });
    }

    if (searchQuery.trim()) {
      list = list.filter((c) => matchChannelWithQuery(c, parsedSearch, customTags[c.id] || []));
    }

    // Apply Sorting Mode
    if (sortMode === 'name-asc') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === 'name-desc') {
      list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortMode === 'health') {
      const statusPriority: Record<string, number> = { online: 0, degraded: 1, blocked: 2, offline: 3 };
      list = [...list].sort((a, b) => {
        const pa = a.healthStatus ? statusPriority[a.healthStatus] ?? 1 : 1;
        const pb = b.healthStatus ? statusPriority[b.healthStatus] ?? 1 : 1;
        return pa - pb;
      });
    }

    // Parental Controls: Conceal locked channels if setting is enabled and session is locked
    if (parentalControls.isEnabled && parentalControls.hideLockedChannelsInGuide && !parentalControls.isSessionUnlocked) {
      list = list.filter((c) => !isChannelLocked({ id: c.id, name: c.name, group: c.group }));
    }

    return list;
  }, [activeCatalog, selectedGroup, searchQuery, sortMode, customTags, parentalControls, isChannelLocked, parsedSearch]);

  // Reset display limit when query or filter options change
  React.useEffect(() => {
    setDisplayLimit(60);
  }, [selectedStreamType, selectedGroup, searchQuery, sortMode]);

  const visibleChannels = React.useMemo(() => {
    return filteredChannels.slice(0, displayLimit);
  }, [filteredChannels, displayLimit]);

  const handleAddToMultiScreen = (c: Channel) => {
    const emptyIdx = matrixConfig.slots.findIndex((s: Channel | null) => s === null);
    const targetIdx = emptyIdx >= 0 ? emptyIdx : 0;
    setMatrixSlot(targetIdx, c);
    if (onSwitchToMultiScreen) {
      onSwitchToMultiScreen();
    }
  };

  const handlePlayInSimulator = (channel: Channel) => {
    if (isSeriesChannel(channel)) {
      setSeriesDetailChannel(channel);
    } else {
      simRouter.push(`/player/${channel.id}`);
    }
  };

  const handleOpenCinema = (channel: Channel) => {
    if (parentalControls.isEnabled && !parentalControls.isSessionUnlocked) {
      if (isChannelLocked({ id: channel.id, name: channel.name, group: channel.group })) {
        setShowParentalModal(true);
        return;
      }
    }
    // If it's a TV series catalog item without a single stream, open series episode selector
    if (selectedStreamType === 'series' || isSeriesChannel(channel)) {
      setSeriesDetailChannel(channel);
    } else {
      // Live channels and Movies play directly in the cinema player
      setCinemaChannel(channel);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGroup(null);
    setSortMode('default');
  };

  return (
    <div className="flex flex-col h-full gap-5">
      {/* 1. Sleek, Uncluttered Page Header with Stream Type Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                {selectedStreamType === 'vod' ? (
                  <>
                    <Film className="w-5 h-5 text-cyan-400" />
                    <span>On-Demand Movies</span>
                  </>
                ) : selectedStreamType === 'series' ? (
                  <>
                    <Clapperboard className="w-5 h-5 text-purple-400" />
                    <span>TV Series & Shows</span>
                  </>
                ) : (
                  <>
                    <Tv className="w-5 h-5 text-blue-400" />
                    <span>Live Television</span>
                  </>
                )}
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10 font-mono">
                {filteredChannels.length} titles
              </span>
            </div>
          </div>

          <div className="inline-flex items-center p-1 bg-[#16161a] border border-white/10 rounded-2xl shadow-inner sm:ml-2">
            <button
              onClick={() => {
                setSelectedStreamType('live');
                setSelectedGroup(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStreamType === 'live'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Tv className="w-3 h-3" />
              <span>Live</span>
            </button>

            <button
              onClick={() => {
                setSelectedStreamType('vod');
                setSelectedGroup(null);
                if ((!vodChannels || vodChannels.length === 0) && loadXtreamVod) {
                  loadXtreamVod();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStreamType === 'vod'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>Movies</span>
            </button>

            <button
              onClick={() => {
                setSelectedStreamType('series');
                setSelectedGroup(null);
                if ((!seriesChannels || seriesChannels.length === 0) && loadXtreamSeries) {
                  loadXtreamSeries();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStreamType === 'series'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clapperboard className="w-3 h-3" />
              <span>Series</span>
            </button>
          </div>
        </div>

        {/* Quick Search, Sort & View Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${selectedStreamType === 'vod' ? 'movies' : selectedStreamType === 'series' ? 'series' : 'channels'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-[#16161a] hover:bg-[#1c1c21] focus:bg-black border border-white/10 focus:border-cyan-500/50 rounded-xl text-xs text-white outline-none placeholder-zinc-500 transition-all font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#16161a] border border-white/10 text-xs text-zinc-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as any)}
              className="bg-transparent text-xs text-white outline-none cursor-pointer font-sans"
              aria-label="Sort Order"
            >
              <option value="default" className="bg-zinc-900 text-white">Default</option>
              <option value="name-asc" className="bg-zinc-900 text-white">Name (A → Z)</option>
              <option value="name-desc" className="bg-zinc-900 text-white">Name (Z → A)</option>
              <option value="health" className="bg-zinc-900 text-white">Online First</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-[#16161a] border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-cyan-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-cyan-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
              title="List View"
              aria-label="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* MultiScreen shortcut for live TV */}
          {onSwitchToMultiScreen && selectedStreamType === 'live' && (
            <button
              onClick={onSwitchToMultiScreen}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Quad Multi-Screen View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Quad</span>
            </button>
          )}

          {/* Export M3U Button */}
          <button
            onClick={() => downloadM3UFile(filteredChannels, `iptv-curated-${filteredChannels.length}.m3u`)}
            className="p-1.5 rounded-xl bg-[#16161a] hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Export M3U Playlist"
            aria-label="Export M3U"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* 2. Curated Category / Genre Pill Bar with Overflow Dropdown */}
      {availableCategories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setSelectedGroup(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              !selectedGroup
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-zinc-200'
            }`}
          >
            All ({activeCatalog.length})
          </button>

          {topCategories.map((g) => {
            const isActive = selectedGroup === g;
            const count = categoryCounts.get(g) || 0;
            return (
              <button
                key={g}
                onClick={() => setSelectedGroup(isActive ? null : g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-zinc-200'
                }`}
              >
                <span>{g}</span>
                <span className="text-[10px] opacity-60 ml-1">({count})</span>
              </button>
            );
          })}

          {/* Active indicator for selected overflow category */}
          {selectedGroup && overflowCategories.includes(selectedGroup) && (
            <button
              onClick={() => setSelectedGroup(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span>{selectedGroup}</span>
              <span className="text-[10px] opacity-75">({categoryCounts.get(selectedGroup) || 0})</span>
              <X className="w-3 h-3 text-cyan-300 ml-0.5" />
            </button>
          )}

          {/* Clean Overflow Dropdown */}
          {overflowCategories.length > 0 && (
            <div className="relative">
              <select
                value={overflowCategories.includes(selectedGroup || '') ? selectedGroup || '' : ''}
                onChange={(e) => setSelectedGroup(e.target.value ? e.target.value : null)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#16161a] hover:bg-white/10 text-zinc-300 border border-white/10 hover:border-white/20 outline-none cursor-pointer transition-all appearance-none pr-7 font-sans"
                aria-label="More genres"
              >
                <option value="" className="bg-zinc-900 text-zinc-400">
                  More Genres ({overflowCategories.length})...
                </option>
                {overflowCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-zinc-900 text-white">
                    {cat} ({categoryCounts.get(cat) || 0})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>
      )}

      {/* 3. On-Demand VOD Catalog Trigger (Divided Loading) */}
      {selectedStreamType === 'vod' && activeCatalog.length === 0 && channels.length > 0 && (
        <div className="flex-1 min-h-[340px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01] p-8 text-center my-2">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
            <Film className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">On-Demand Movies Catalog</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed font-medium">
            {vodCategories && Object.keys(vodCategories).length > 0
              ? `${Object.keys(vodCategories).length} movie categories are ready. Load your on-demand catalog cleanly without slowing down live channels.`
              : 'Connect your Xtream Codes or M3U provider to stream full-length movies on demand.'}
          </p>
          {loadXtreamVod && (
            <button
              onClick={() => loadXtreamVod()}
              disabled={isVodLoading}
              className="mt-5 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVodLoading ? 'animate-spin' : ''}`} />
              <span>{isVodLoading ? 'Loading Movie Library...' : 'Load Movies Catalog'}</span>
            </button>
          )}
        </div>
      )}

      {/* 4. On-Demand TV Series Catalog Trigger (Divided Loading) */}
      {selectedStreamType === 'series' && activeCatalog.length === 0 && channels.length > 0 && (
        <div className="flex-1 min-h-[340px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01] p-8 text-center my-2">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3 border border-purple-500/20 shadow-lg shadow-purple-500/10">
            <Clapperboard className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">TV Shows & Series Catalog</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed font-medium">
            {seriesCategories && Object.keys(seriesCategories).length > 0
              ? `${Object.keys(seriesCategories).length} television genres are ready. Load seasons and episodes on demand.`
              : 'Connect your Xtream Codes or M3U provider to browse multi-season television shows.'}
          </p>
          {loadXtreamSeries && (
            <button
              onClick={() => loadXtreamSeries()}
              disabled={isSeriesLoading}
              className="mt-5 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeriesLoading ? 'animate-spin' : ''}`} />
              <span>{isSeriesLoading ? 'Loading TV Series Library...' : 'Load TV Series Catalog'}</span>
            </button>
          )}
        </div>
      )}

      {/* 5. Zero Channels / Empty Catalog State */}
      {activeCatalog.length === 0 && !isLoading ? (
        <div className="flex-1 min-h-[340px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01] p-8 text-center my-2">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
            {selectedStreamType === 'vod' ? (
              <Film className="w-7 h-7" />
            ) : selectedStreamType === 'series' ? (
              <Clapperboard className="w-7 h-7" />
            ) : (
              <Tv className="w-7 h-7" />
            )}
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            {selectedStreamType === 'vod' 
              ? 'No Video-on-Demand (Movies) in Current Catalog' 
              : selectedStreamType === 'series'
              ? 'No TV Series in Current Catalog'
              : 'No Channels or Feeds Connected'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed font-medium">
            {selectedStreamType === 'vod' || selectedStreamType === 'series'
              ? `Your current active playlist contains ${channels.length} channels, but no ${selectedStreamType === 'vod' ? 'movies' : 'series'}. You can switch to Live TV or load our demo collection.`
              : 'Load our free FAST channels pack to stream instantly, or connect your Xtream Codes account or M3U playlist.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
            {selectedStreamType !== 'all' && (
              <button
                onClick={() => setSelectedStreamType('all')}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Switch to Live TV</span>
              </button>
            )}
            {loadDemoChannels && (
              <button
                onClick={() => loadDemoChannels()}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Demo FAST Channels</span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab ? onNavigateTab('xtream') : null}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Connect Xtream Codes</span>
            </button>
            <button
              onClick={() => onNavigateTab ? onNavigateTab('upload') : null}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Add M3U Playlist</span>
            </button>
          </div>
        </div>
      ) : filteredChannels.length === 0 && activeCatalog.length > 0 ? (
        /* Empty Search Results State */
        <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01] p-8 text-center">
          <p className="text-xs text-zinc-400">
            No items matching your search or active category filter.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-3 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Search & Filters</span>
          </button>
        </div>
      ) : viewMode === 'country' ? (
        <div className="overflow-y-auto max-h-[600px] pr-2 scrollbar-thin">
          <CountryChannelSections
            onOpenCinema={handleOpenCinema}
            onPlayInSimulator={handlePlayInSimulator}
          />
        </div>
      ) : viewMode === 'grid' ? (
        /* 6. STREAMLINED GRID VIEW - Poster Grid for Movies/Series, Channel Strips for Live TV */
        selectedStreamType === 'vod' || selectedStreamType === 'series' ? (
          /* Movie & TV Series Poster Grid (2:3 Aspect Ratio) */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-y-auto max-h-[620px] pr-2 scrollbar-thin">
            {visibleChannels.map((c) => {
              const isFav = favorites.includes(c.id);
              const isLocked = isChannelLocked({ id: c.id, name: c.name, group: c.group });
              return (
                <div
                  key={c.id}
                  data-tv-focus-id={`ch-${c.id}`}
                  data-tv-zone="channels"
                  tabIndex={0}
                  onClick={() => handleOpenCinema(c)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleOpenCinema(c);
                    }
                  }}
                  className="group relative bg-[#16161a] hover:bg-[#1c1c23] border border-white/5 hover:border-cyan-500/40 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer flex flex-col justify-between"
                >
                  {/* 2:3 Poster Container */}
                  <div className="relative aspect-[2/3] w-full bg-zinc-950 overflow-hidden">
                    <img
                      src={c.logo || getChannelAvatarDataUri(c.name)}
                      alt={c.name}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = 'true';
                          target.src = getChannelAvatarDataUri(c.name);
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {/* Vignette Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#16161a] via-black/20 to-transparent opacity-85 group-hover:opacity-60 transition-opacity" />

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
                      <StreamResolutionBadge resolution={c.resolution || (selectedStreamType === 'series' ? '1080p' : '4K UHD')} />
                      <div className="flex items-center gap-1">
                        <StreamLiveIndicator streamType={selectedStreamType as any} healthStatus={c.healthStatus} />
                        {isLocked && (
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-600/90 backdrop-blur-md text-[9px] font-bold text-white flex items-center gap-1 shadow-sm">
                            <Lock className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Tech Spec Pill over Poster */}
                    {(c.bitrate || c.codec) && (
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                        {c.bitrate ? (
                          <StreamBitrateBadge bitrate={c.bitrate} fps={c.fps} />
                        ) : <span />}
                        {c.codec && (
                          <span className="px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-mono font-bold text-purple-300 uppercase">
                            {c.codec}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Hover Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[1px]">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/40 transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Caption & Metadata */}
                  <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1 leading-snug">
                        {c.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[9px] font-semibold text-zinc-300 border border-white/5 truncate max-w-[110px]">
                          {c.category || c.group || (selectedStreamType === 'series' ? 'TV Series' : 'Movie')}
                        </span>
                        <StreamCountryBadge countryCode={c.countryCode} countryName={c.countryName} countryFlag={c.countryFlag} />
                      </div>
                      {(c.epgDescription || c.currentProgram) && (
                        <p className="text-[9px] text-zinc-400 line-clamp-2 mt-2 leading-relaxed bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
                          {c.epgDescription || c.currentProgram}
                        </p>
                      )}
                    </div>

                    {/* Bottom Action Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleFavorite(c.id)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isFav
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-white'
                        }`}
                        title={isFav ? "Remove Favorite" : "Favorite"}
                      >
                        <Heart className={`w-3 h-3 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      <div className="flex items-center gap-1">
                        {selectedStreamType === 'vod' && (
                          <button
                            onClick={() => setVodDetailChannel(c)}
                            className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] font-bold text-cyan-300 flex items-center gap-1 transition-all cursor-pointer border border-cyan-500/20"
                            title="Movie Synopsis"
                          >
                            <Film className="w-3 h-3" />
                            <span>Info</span>
                          </button>
                        )}

                        {selectedStreamType === 'series' && (
                          <button
                            onClick={() => setSeriesDetailChannel(c)}
                            className="px-2 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-[10px] font-bold text-purple-300 flex items-center gap-1 transition-all cursor-pointer border border-purple-500/20"
                            title="Series Episodes"
                          >
                            <Clapperboard className="w-3 h-3" />
                            <span>Episodes</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenCinema(c)}
                          className="px-2 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                          title="Watch Now"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Play</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More Poster Placeholder */}
            {visibleChannels.length < filteredChannels.length && (
              <div
                data-tv-focus-id="load-more-grid"
                data-tv-zone="channels"
                tabIndex={0}
                onClick={() => setDisplayLimit((prev) => prev + 60)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDisplayLimit((prev) => prev + 60);
                  }
                }}
                className="aspect-[2/3] border border-dashed border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-950/20 hover:bg-cyan-950/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
              >
                <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                  + Load More ({filteredChannels.length - visibleChannels.length})
                </span>
                <span className="text-[10px] text-zinc-400 mt-1">Next 60 titles</span>
              </div>
            )}
          </div>
        ) : (
          /* Live TV Horizontal Strip Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 overflow-y-auto max-h-[580px] pr-2 scrollbar-thin">
            {visibleChannels.map((c) => {
              const isFav = favorites.includes(c.id);
              const isLocked = isChannelLocked({ id: c.id, name: c.name, group: c.group });
              return (
                <div
                  key={c.id}
                  data-tv-focus-id={`ch-${c.id}`}
                  data-tv-zone="channels"
                  tabIndex={0}
                  onClick={() => handleOpenCinema(c)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleOpenCinema(c);
                    }
                  }}
                  className="group relative bg-[#16161a] hover:bg-[#1c1c21] border border-white/5 hover:border-cyan-500/30 rounded-2xl p-3.5 flex items-center justify-between transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer"
                >
                  {/* Channel Thumbnail & Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-black/60 border border-white/5 flex items-center justify-center p-2 overflow-hidden flex-shrink-0 relative">
                      <img
                        src={c.logo || getChannelAvatarDataUri(c.name)}
                        alt={c.name}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallback) {
                            target.dataset.fallback = 'true';
                            target.src = getChannelAvatarDataUri(c.name);
                          }
                        }}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                      <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-black/80">
                        <div className={`w-full h-full rounded-full ${
                          c.healthStatus === 'blocked' ? 'bg-amber-400' : 'bg-emerald-400 health-badge-live'
                        }`} />
                      </div>
                    </div>
                    <div className="min-w-0 pr-2 flex-1">
                      {/* Line 1: Channel Name + Resolution + Bitrate + Lock */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-white truncate leading-tight group-hover:text-cyan-400 transition-colors">
                          {c.name}
                        </h4>
                        <StreamResolutionBadge resolution={c.resolution || '1080p FHD'} />
                        {c.bitrate && <StreamBitrateBadge bitrate={c.bitrate} fps={c.fps} />}
                        {isLocked && (
                          <span className="text-rose-400 flex items-center gap-0.5 font-semibold text-[10px] bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                            <Lock className="w-2.5 h-2.5" /> Locked
                          </span>
                        )}
                      </div>

                      {/* Line 2: Stream Metadata Ribbon (Live Status, Category, Country, Source) */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                        <StreamLiveIndicator streamType="live" healthStatus={c.healthStatus} />
                        <span className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[9px] font-semibold text-zinc-300 border border-white/5 truncate max-w-[100px]">
                          {c.category || c.group}
                        </span>
                        <StreamCountryBadge countryCode={c.countryCode} countryName={c.countryName} countryFlag={c.countryFlag} />
                        {c.directSource && (
                          <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-mono font-bold uppercase">
                            {c.directSource === 'xtream' ? 'XTREAM' : c.directSource === 'stalker' ? 'STALKER' : 'HLS'}
                          </span>
                        )}
                      </div>

                      {/* Line 3: EPG Now Playing Broadcast Row */}
                      {(c.currentProgram || c.epgDescription) && (
                        <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20 text-[10px] text-emerald-300 font-medium">
                          <Radio className="w-3 h-3 text-emerald-400 shrink-0 animate-pulse" />
                          <span className="font-bold text-white truncate">{c.currentProgram || c.epgDescription}</span>
                          {c.currentProgram && c.epgDescription && (
                            <span className="text-zinc-400 truncate hidden md:inline">— {c.epgDescription}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary Actions: Watch, Favorite, and Secondary Menu */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(c.id);
                      }}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isFav
                          ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                          : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-white'
                      }`}
                      title={isFav ? "Remove Favorite" : "Favorite"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCinema(c);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-500/20 text-xs font-bold transition-all cursor-pointer"
                      title="Watch"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Watch</span>
                    </button>

                    {/* Secondary Options Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuChannelId(openMenuChannelId === c.id ? null : c.id);
                        }}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-transparent transition-all cursor-pointer"
                        title="More options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {openMenuChannelId === c.id && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1.5 w-44 bg-[#1a1a20] border border-white/15 rounded-xl shadow-2xl z-40 p-1 flex flex-col gap-0.5 text-xs text-zinc-300 animate-in fade-in duration-100"
                        >
                          <button
                            onClick={() => {
                              openPiP(c);
                              setOpenMenuChannelId(null);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left cursor-pointer"
                          >
                            <PictureInPicture className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Picture-in-Picture</span>
                          </button>
                          <button
                            onClick={() => {
                              handleAddToMultiScreen(c);
                              setOpenMenuChannelId(null);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left cursor-pointer"
                          >
                            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Quad Screen</span>
                          </button>
                          <button
                            onClick={() => {
                              setTaggingChannel(c);
                              setOpenMenuChannelId(null);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left cursor-pointer"
                          >
                            <Tag className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Custom Tags</span>
                          </button>
                          <button
                            onClick={() => {
                              if (!parentalControls.pinHash) {
                                setShowParentalModal(true);
                              } else {
                                toggleChannelLock(c.id);
                              }
                              setOpenMenuChannelId(null);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left cursor-pointer"
                          >
                            {isLocked ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-rose-400" />}
                            <span>{isLocked ? 'Unlock Channel' : 'Lock with PIN'}</span>
                          </button>
                          <button
                            onClick={() => {
                              handlePlayInSimulator(c);
                              setOpenMenuChannelId(null);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left cursor-pointer"
                          >
                            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Phone Simulator</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More Strip Card */}
            {visibleChannels.length < filteredChannels.length && (
              <div
                data-tv-focus-id="load-more-grid"
                data-tv-zone="channels"
                tabIndex={0}
                onClick={() => setDisplayLimit((prev) => prev + 60)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDisplayLimit((prev) => prev + 60);
                  }
                }}
                className="border border-dashed border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-950/20 hover:bg-cyan-950/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[80px] group"
              >
                <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                  + Load More ({filteredChannels.length - visibleChannels.length} channels remaining)
                </span>
                <span className="text-[10px] text-zinc-400 mt-1">Click to load next 60 channels</span>
              </div>
            )}
          </div>
        )
      ) : (
        /* 7. STREAMLINED LIST VIEW */
        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[560px] pr-2 scrollbar-thin">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5">
            <span className="col-span-7 md:col-span-8">Channel Info</span>
            <span className="col-span-2 md:col-span-2">Category</span>
            <span className="col-span-3 md:col-span-2 text-right">Actions</span>
          </div>
          {visibleChannels.map((c) => {
            const isFav = favorites.includes(c.id);
            const isLocked = isChannelLocked({ id: c.id, name: c.name, group: c.group });
            return (
              <div
                key={c.id}
                data-tv-focus-id={`ch-${c.id}`}
                data-tv-zone="channels"
                tabIndex={0}
                onClick={() => handleOpenCinema(c)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleOpenCinema(c);
                  }
                }}
                className="grid grid-cols-12 gap-4 items-center px-4 py-2 bg-[#16161a] hover:bg-[#1c1c21] border border-white/5 hover:border-white/10 rounded-xl transition-all cursor-pointer"
              >
                <div className="col-span-7 md:col-span-8 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/5 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0 relative">
                    <img
                      src={c.logo || getChannelAvatarDataUri(c.name, 64)}
                      alt={c.name}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = 'true';
                          target.src = getChannelAvatarDataUri(c.name, 64);
                        }
                      }}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                      <StreamResolutionBadge resolution={c.resolution || '1080p FHD'} />
                      {c.bitrate && <StreamBitrateBadge bitrate={c.bitrate} fps={c.fps} />}
                      <StreamLiveIndicator streamType={c.streamType} healthStatus={c.healthStatus} />
                    </div>
                    {c.currentProgram && (
                      <p className="text-[10px] text-emerald-400 font-medium truncate mt-0.5">
                        ▶ {c.currentProgram}
                      </p>
                    )}
                  </div>
                </div>

                <div className="col-span-2 md:col-span-2 min-w-0 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block truncate">
                    {c.category || c.group}
                  </span>
                  <StreamCountryBadge countryCode={c.countryCode} countryName={c.countryName} countryFlag={c.countryFlag} />
                </div>

                <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(c.id);
                    }}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      isFav
                        ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                        : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-white'
                    }`}
                    title={isFav ? "Remove favorite" : "Favorite"}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCinema(c);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    title="Watch"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Watch</span>
                  </button>
                </div>
              </div>
            );
          })}
          {visibleChannels.length < filteredChannels.length && (
            <div
              data-tv-focus-id="load-more-list"
              data-tv-zone="channels"
              tabIndex={0}
              onClick={() => setDisplayLimit((prev) => prev + 60)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setDisplayLimit((prev) => prev + 60);
                }
              }}
              className="p-3 border border-dashed border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-950/20 hover:bg-cyan-950/40 rounded-xl flex items-center justify-center transition-all cursor-pointer text-xs font-bold text-cyan-400 hover:text-cyan-300"
            >
              + Load Next 60 Titles ({filteredChannels.length - visibleChannels.length} remaining)
            </div>
          )}
        </div>
      )}

      {/* 8. Pagination & Windowing Toolbar */}
      {visibleChannels.length < filteredChannels.length && (
        <div className="p-3 rounded-2xl bg-[#16161a] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <p className="text-xs text-zinc-400">
            Displaying <span className="text-white font-bold">{visibleChannels.length}</span> of <span className="text-white font-bold">{filteredChannels.length}</span> titles
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 60)}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5"
            >
              Load More (+60)
            </button>
            {filteredChannels.length - visibleChannels.length > 60 && (
              <button
                onClick={() => setDisplayLimit((prev) => prev + 300)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Load +300
              </button>
            )}
            <button
              onClick={() => setDisplayLimit(filteredChannels.length)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Show All
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Video Cinema Overlay */}
      {cinemaChannel && (
        <WebCinemaPlayer
          initialChannel={cinemaChannel}
          onClose={() => setCinemaChannel(null)}
          onSwitchToMultiScreen={onSwitchToMultiScreen}
        />
      )}

      {/* Custom Channel Tagging Modal */}
      {taggingChannel && (
        <ChannelTagModal
          channel={taggingChannel}
          isOpen={true}
          onClose={() => setTaggingChannel(null)}
        />
      )}

      {/* VOD Detail Modal */}
      {vodDetailChannel && (
        <VODDetailModal
          channel={vodDetailChannel}
          onClose={() => setVodDetailChannel(null)}
          onPlay={(c) => {
            setCinemaChannel(c);
          }}
        />
      )}

      {/* Series Detail & Episode Modal */}
      {seriesDetailChannel && (
        <SeriesDetailModal
          channel={seriesDetailChannel}
          onClose={() => setSeriesDetailChannel(null)}
          onPlayEpisode={(ep) => {
            setCinemaChannel(ep);
          }}
        />
      )}

      {/* Parental Controls PIN Modal */}
      <ParentalPinModal
        isOpen={showParentalModal}
        onClose={() => setShowParentalModal(false)}
        initialMode={parentalControls.pinHash ? (parentalControls.isSessionUnlocked ? 'settings' : 'unlock') : 'setup'}
      />
    </div>
  );
}
