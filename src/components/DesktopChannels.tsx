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
  Maximize2, 
  Smartphone, 
  Globe, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Sparkles,
  LayoutGrid
} from 'lucide-react';
import { Channel } from '../types/iptv';
import WebCinemaPlayer from './WebCinemaPlayer';
import CountryChannelSections from './CountryChannelSections';
import { PageProtocolHeader } from './PageProtocolHeader';
import { 
  getCountryFlag, 
  normalizeCategory, 
  POPULAR_LANGUAGES, 
  getLanguageName,
  getSubdivisionsForCountry,
  getSubdivisionName
} from '../utils/channelEnrichment';

interface DesktopChannelsProps {
  onSwitchToMultiScreen?: () => void;
}

export default function DesktopChannels({ onSwitchToMultiScreen }: DesktopChannelsProps = {}) {
  const { 
    channels, 
    groups, 
    favorites, 
    toggleFavorite, 
    isLoading, 
    error,
    selectedLanguage,
    setSelectedLanguage,
    selectedCountry,
    selectedSubdivision,
    setSelectedSubdivision
  } = usePlayerStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list' | 'country'>('grid');
  const [cinemaChannel, setCinemaChannel] = React.useState<Channel | null>(null);

  // Derive standardized categories from loaded channels
  const availableCategories = React.useMemo(() => {
    const cats = new Set<string>();
    for (const ch of channels) {
      const norm = ch.category || normalizeCategory(ch.group);
      if (norm) cats.add(norm);
    }
    return Array.from(cats).sort();
  }, [channels]);

  // Available subdivisions for the active country (if a country is selected or derived)
  const activeCountryCode = selectedCountry || 'US';
  const availableSubdivisions = React.useMemo(() => {
    return getSubdivisionsForCountry(activeCountryCode).slice(0, 25);
  }, [activeCountryCode]);

  // Filter channels based on group/category, language, subdivision, and full-text search (name, category, country, network, language)
  const filteredChannels = React.useMemo(() => {
    let list = channels;
    if (selectedCountry) {
      list = list.filter((c) => (c.countryCode || '').toUpperCase() === selectedCountry.toUpperCase());
    }
    if (selectedSubdivision) {
      const subTarget = selectedSubdivision.toLowerCase();
      list = list.filter((c) => {
        const cSub = (c.subdivision || '').toLowerCase();
        const cName = c.name.toLowerCase();
        return cSub === subTarget || cName.includes(subTarget);
      });
    }
    if (selectedGroup) {
      list = list.filter((c) => {
        const cat = c.category || normalizeCategory(c.group);
        return c.group === selectedGroup || cat === selectedGroup;
      });
    }
    if (selectedLanguage && selectedLanguage !== 'ALL') {
      const target = selectedLanguage.toLowerCase();
      list = list.filter((c) => {
        const lang = (c.language || '').toLowerCase();
        const langName = (c.languageName || '').toLowerCase();
        return lang === target || lang.startsWith(target) || target.startsWith(lang) || langName.includes(target);
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) => 
          c.name.toLowerCase().includes(q) || 
          c.group.toLowerCase().includes(q) ||
          (c.category && c.category.toLowerCase().includes(q)) ||
          (c.countryName && c.countryName.toLowerCase().includes(q)) ||
          (c.countryCode && c.countryCode.toLowerCase().includes(q)) ||
          (c.languageName && c.languageName.toLowerCase().includes(q)) ||
          (c.language && c.language.toLowerCase().includes(q)) ||
          (c.tvgId && c.tvgId.toLowerCase().includes(q)) ||
          (c.subdivision && c.subdivision.toLowerCase().includes(q))
      );
    }
    return list;
  }, [channels, selectedCountry, selectedSubdivision, selectedGroup, selectedLanguage, searchQuery]);

  const handlePlayInSimulator = (channel: Channel) => {
    simRouter.push(`/player/${channel.id}`);
  };

  const handleOpenCinema = (channel: Channel) => {
    setCinemaChannel(channel);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGroup(null);
    setSelectedLanguage(null);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Protocol & Specification Architecture Header */}
      <PageProtocolHeader
        title="Live Channel Browser & Stream Simulator"
        description="Real-time multi-resolution stream index and manifest catalog for live HLS feeds. Streams are parsed from M3U playlists, normalized with ISO-3166-1 regional tags, and dispatched to native players or low-latency Web Cinema playback."
        protocol="RFC 8216 (HLS) & ISO-3166-1"
        schema="Extended M3U & IPTV-Org Canonical v1.2"
        rfcOrStandard="RFC 8216 §4.3.2 • ISO-3166-1 Alpha-2"
        layer="Transport & Manifest Parsing Layer"
        supportedTags={['#EXTM3U', '#EXTINF', 'tvg-id', 'tvg-name', 'tvg-country', 'group-title', 'tvg-logo', '60 FPS Web Player']}
        icon={Tv}
        badgeColor="cyan"
      >
        <div className="flex items-center gap-2">
          {onSwitchToMultiScreen && (
            <button
              onClick={onSwitchToMultiScreen}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              aria-label="Switch to Quad Multi-Screen View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Quad View</span>
            </button>
          )}

          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-cyan-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-cyan-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
              title="List View"
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('country')}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                viewMode === 'country' ? 'bg-cyan-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
              title="Country Sections View"
              aria-label="Country Sections View"
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>
        </div>
      </PageProtocolHeader>

      {/* Stream Health & Metrics Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-[#16161a] border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Total Channels</span>
            <span className="text-sm font-black text-white">{channels.length}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#16161a] border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Live Streams</span>
            <span className="text-sm font-black text-emerald-400">{channels.length} Online</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#16161a] border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Favorites</span>
            <span className="text-sm font-black text-purple-400">{favorites.length} Saved</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#16161a] border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Categories</span>
            <span className="text-sm font-black text-blue-400">{groups.length} Groups</span>
          </div>
        </div>
      </div>

      {/* Directory Search & Filter Subbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-zinc-400">
            Showing <strong className="text-white">{filteredChannels.length}</strong> streams across{' '}
            <strong className="text-white">{groups.length}</strong> categories
          </span>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, sport, or network..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#16161a] hover:bg-[#1c1c21] focus:bg-black border border-white/10 focus:border-cyan-500/50 rounded-xl text-xs text-white outline-none placeholder-zinc-500 transition-all font-sans"
            aria-label="Full-text channel search"
          />
        </div>
      </div>

      {/* Group & Genre Quick Filter Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">
            Filter by Genre & Category
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            IPTV-Org Standardized Taxonomy
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
          <button
            onClick={() => setSelectedGroup(null)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              !selectedGroup
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-zinc-200'
            }`}
          >
            All Genres ({channels.length})
          </button>
          {availableCategories.map((g) => {
            const isActive = selectedGroup === g;
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
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Language Quick Filter Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">
            Filter by Broadcast Language
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            ISO-639 Multilingual Engine
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
          {POPULAR_LANGUAGES.map((lang) => {
            const isSelected = (!selectedLanguage && lang.code === 'ALL') || selectedLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code === 'ALL' ? null : lang.code)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                    : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-zinc-200'
                }`}
              >
                <span className="text-xs">{lang.icon}</span>
                <span>{lang.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Regional Subdivisions / States Filter Bar */}
      {availableSubdivisions.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">
              Filter by Region / State ({activeCountryCode})
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              ISO-3166-2 Subdivisions
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
            <button
              onClick={() => setSelectedSubdivision(null)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                !selectedSubdivision
                  ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                  : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-zinc-200'
              }`}
            >
              All Regions
            </button>
            {availableSubdivisions.map((sub) => {
              const isSelected = selectedSubdivision === sub.name || selectedSubdivision === sub.code;
              return (
                <button
                  key={sub.code}
                  onClick={() => setSelectedSubdivision(isSelected ? null : sub.name)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                      : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-zinc-200'
                  }`}
                  title={`${sub.code}: ${sub.name}`}
                >
                  <span>{sub.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SKELETON LOADER STATE */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl bg-[#16161a] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3 w-3/4">
                <div className="w-12 h-12 rounded-xl skeleton-box flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 skeleton-box rounded" />
                  <div className="h-2 w-1/2 skeleton-box rounded" />
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl skeleton-box" />
            </div>
          ))}
        </div>
      ) : viewMode === 'country' ? (
        <div className="overflow-y-auto max-h-[600px] pr-2 scrollbar-thin">
          <CountryChannelSections
            onOpenCinema={handleOpenCinema}
            onPlayInSimulator={handlePlayInSimulator}
          />
        </div>
      ) : filteredChannels.length === 0 ? (
        /* DESIGNED EMPTY STATE */
        <div className="flex-1 min-h-[350px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4 border border-cyan-500/20">
            <Tv className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No Channels Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
            {searchQuery 
              ? `No channels matching "${searchQuery}" in ${selectedGroup || 'any category'}.`
              : 'No channels currently loaded in this view.'}
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto max-h-[520px] pr-2 scrollbar-thin">
          {filteredChannels.map((c) => {
            const isFav = favorites.includes(c.id);
            return (
              <div
                key={c.id}
                className="group relative bg-[#16161a] hover:bg-[#1c1c21] border border-white/5 hover:border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between transition-all hover:-translate-y-0.5 shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/5 flex items-center justify-center p-2.5 overflow-hidden flex-shrink-0 relative">
                    <img
                      src={c.logo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60'}
                      alt={c.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
                      }}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-black/80"
                      title={c.healthStatus === 'blocked' ? `Flagged in Blocklist: ${c.blockedReason || 'Policy restriction'}` : 'Verified Live Stream'}
                    >
                      <div className={`w-full h-full rounded-full ${
                        c.healthStatus === 'blocked' ? 'bg-amber-400' : 'bg-emerald-400 health-badge-live'
                      }`} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate leading-tight group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                      <span className="text-xs flex-shrink-0" title={`Country: ${c.countryName || c.countryCode || 'International'}`}>
                        {c.countryFlag || getCountryFlag(c.countryCode)}
                      </span>
                      <span className="truncate">{c.name}</span>
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="inline-block text-[9px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full font-semibold text-zinc-400 uppercase tracking-wider">
                        {c.category || c.group}
                      </span>
                      {c.countryCode && c.countryCode !== 'UN' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-bold">
                          {c.countryCode}
                        </span>
                      )}
                      {(c.languageName || c.language) && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-zinc-400 border border-white/5 font-medium truncate max-w-[100px]" title={`Language: ${c.languageName || getLanguageName(c.language)}`}>
                          {c.languageName || getLanguageName(c.language)}
                        </span>
                      )}
                      {c.healthStatus === 'blocked' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-bold" title={c.blockedReason}>
                          {c.blockedReason ? c.blockedReason.toUpperCase() : 'FLAGGED'}
                        </span>
                      )}
                      {c.corsProxyRecommended && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono text-[8px]" title="CORS & Mixed-Content Protected via Gateway">
                          PROXY
                        </span>
                      )}
                      {c.alternateUrls && c.alternateUrls.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono font-bold text-[8px]" title={`${c.alternateUrls.length + 1} broadcast feeds available`}>
                          {c.alternateUrls.length + 1} FEEDS
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleFavorite(c.id)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isFav
                        ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                        : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-white'
                    }`}
                    title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                    aria-label={isFav ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleOpenCinema(c)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-500/20 text-xs font-bold transition-all cursor-pointer"
                    title="Watch in Full Web Cinema Player"
                    aria-label="Watch stream"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch</span>
                  </button>

                  <button
                    onClick={() => handlePlayInSimulator(c)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                    title="Preview in Mobile Phone Simulator"
                    aria-label="Preview in simulator"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[520px] pr-2 scrollbar-thin">
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
                className="grid grid-cols-12 gap-4 items-center px-4 py-2.5 bg-[#16161a] hover:bg-[#1c1c21] border border-white/5 hover:border-white/10 rounded-xl transition-all"
              >
                <div className="col-span-6 md:col-span-8 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/5 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0 relative">
                    <img
                      src={c.logo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60'}
                      alt={c.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
                      }}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-black/80"
                      title={c.healthStatus === 'blocked' ? `Flagged: ${c.blockedReason}` : 'Online Live Stream'}
                    >
                      <div className={`w-full h-full rounded-full ${
                        c.healthStatus === 'blocked' ? 'bg-amber-400' : 'bg-emerald-400 health-badge-live'
                      }`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="text-sm flex-shrink-0" title={c.countryName || c.countryCode || 'International'}>
                      {c.countryFlag || getCountryFlag(c.countryCode)}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                    {c.healthStatus === 'blocked' && (
                      <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-bold">
                        {c.blockedReason ? c.blockedReason.toUpperCase() : 'FLAGGED'}
                      </span>
                    )}
                    {c.corsProxyRecommended && (
                      <span className="text-[8px] px-1 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                        PROXY
                      </span>
                    )}
                    {c.alternateUrls && c.alternateUrls.length > 0 && (
                      <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono font-bold">
                        {c.alternateUrls.length + 1} FEEDS
                      </span>
                    )}
                  </div>
                </div>

                <div className="col-span-3 md:col-span-2 min-w-0 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block truncate">
                    {c.category || c.group}
                  </span>
                  {(c.languageName || c.language) && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-zinc-400 border border-white/5 font-medium hidden sm:inline-block truncate" title={`Language: ${c.languageName || getLanguageName(c.language)}`}>
                      {c.languageName || getLanguageName(c.language)}
                    </span>
                  )}
                </div>

                <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => toggleFavorite(c.id)}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      isFav
                        ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                        : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-white'
                    }`}
                    aria-label={isFav ? "Remove favorite" : "Add favorite"}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleOpenCinema(c)}
                    className="px-2 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    title="Watch in Web Cinema Player"
                    aria-label="Watch stream"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Watch</span>
                  </button>

                  <button
                    onClick={() => handlePlayInSimulator(c)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                    title="Play in Phone Simulator"
                    aria-label="Play in simulator"
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
