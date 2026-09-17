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
  LayoutGrid,
  Download,
  Tag,
  ArrowUpDown,
  PictureInPicture,
  SlidersHorizontal,
  HelpCircle,
  X,
  ShieldAlert,
  Lock,
  Unlock
} from 'lucide-react';
import { Channel } from '../types/iptv';
import WebCinemaPlayer from './WebCinemaPlayer';
import CountryChannelSections from './CountryChannelSections';
import { PageProtocolHeader } from './PageProtocolHeader';
import { downloadM3UFile } from '../utils/m3uParser';
import { ChannelTagModal } from './ChannelTagModal';
import { ParentalPinModal } from './ParentalPinModal';
import { parseSearchQuery, matchChannelWithQuery } from '../utils/searchQueryParser';
import { 
  getCountryFlag, 
  normalizeCategory, 
  POPULAR_LANGUAGES, 
  getLanguageName,
  getSubdivisionsForCountry,
  getSubdivisionName,
  getChannelAvatarDataUri
} from '../utils/channelEnrichment';

interface DesktopChannelsProps {
  onSwitchToMultiScreen?: () => void;
}

export default function DesktopChannels({ onSwitchToMultiScreen }: DesktopChannelsProps) {
  const { 
    channels, 
    groups, 
    favorites, 
    toggleFavorite, 
    addToHistory,
    selectedCountry,
    setSelectedCountry,
    selectedLanguage,
    setSelectedLanguage,
    selectedSubdivision,
    setSelectedSubdivision,
    customTags,
    getAllUniqueCustomTags,
    openPiP,
    parentalControls,
    isChannelLocked,
    toggleChannelLock,
    tvNavigation,
    isLoading,
    error,
    matrixConfig,
    setMatrixSlot
  } = usePlayerStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSyntaxHelp, setShowSyntaxHelp] = React.useState(false);
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list' | 'country'>('grid');
  const [cinemaChannel, setCinemaChannel] = React.useState<Channel | null>(null);

  const handleAddToMultiScreen = (c: Channel) => {
    const emptyIdx = matrixConfig.slots.findIndex((s: Channel | null) => s === null);
    const targetIdx = emptyIdx >= 0 ? emptyIdx : 0;
    setMatrixSlot(targetIdx, c);
    if (onSwitchToMultiScreen) {
      onSwitchToMultiScreen();
    }
  };
  const [sortMode, setSortMode] = React.useState<'default' | 'name-asc' | 'name-desc' | 'health' | 'country'>('default');
  const [selectedCustomTag, setSelectedCustomTag] = React.useState<string | null>(null);
  const [taggingChannel, setTaggingChannel] = React.useState<Channel | null>(null);
  const [showParentalModal, setShowParentalModal] = React.useState(false);

  const parsedSearch = React.useMemo(() => parseSearchQuery(searchQuery), [searchQuery]);

  const allCustomTags = React.useMemo(() => {
    return getAllUniqueCustomTags();
  }, [customTags, getAllUniqueCustomTags]);

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

  // Filter & sort channels based on group/category, language, subdivision, custom tags, and sortMode
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
    if (selectedCustomTag) {
      const targetTag = selectedCustomTag.toLowerCase();
      list = list.filter((c) => {
        const tags = customTags[c.id] || [];
        return tags.some((t) => t.toLowerCase() === targetTag);
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
    } else if (sortMode === 'country') {
      list = [...list].sort((a, b) => (a.countryCode || 'ZZ').localeCompare(b.countryCode || 'ZZ'));
    }

    // Parental Controls: Conceal locked channels if setting is enabled and session is locked
    if (parentalControls.isEnabled && parentalControls.hideLockedChannelsInGuide && !parentalControls.isSessionUnlocked) {
      list = list.filter((c) => !isChannelLocked({ id: c.id, name: c.name, group: c.group }));
    }

    return list;
  }, [channels, selectedCountry, selectedSubdivision, selectedGroup, selectedLanguage, selectedCustomTag, searchQuery, sortMode, customTags, parentalControls, isChannelLocked]);

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
    setSelectedCustomTag(null);
    setSortMode('default');
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
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as any)}
              className="bg-transparent text-xs text-white outline-none cursor-pointer font-sans"
              aria-label="Sort channels"
            >
              <option value="default" className="bg-zinc-900 text-white">Default Order</option>
              <option value="name-asc" className="bg-zinc-900 text-white">Name (A → Z)</option>
              <option value="name-desc" className="bg-zinc-900 text-white">Name (Z → A)</option>
              <option value="health" className="bg-zinc-900 text-white">Health (Online First)</option>
              <option value="country" className="bg-zinc-900 text-white">Country Code (A → Z)</option>
            </select>
          </div>

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
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">
            Showing <strong className="text-white">{filteredChannels.length}</strong> streams across{' '}
            <strong className="text-white">{groups.length}</strong> categories
          </span>
          <button
            onClick={() => downloadM3UFile(filteredChannels, `iptv-curated-${filteredChannels.length}.m3u`)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Download currently filtered channels as standard M3U playlist file"
            aria-label="Export M3U Playlist"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export M3U</span>
          </button>

          <button
            onClick={() => setShowParentalModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
              parentalControls.isEnabled
                ? parentalControls.isSessionUnlocked
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border-white/10'
            }`}
            title="Parental Controls & Content Security PIN"
            aria-label="Parental Controls"
          >
            {parentalControls.isEnabled ? (
              parentalControls.isSessionUnlocked ? (
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
              )
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span>
              {parentalControls.isEnabled
                ? parentalControls.isSessionUnlocked
                  ? 'Parental (Unlocked)'
                  : 'Parental (Locked)'
                : 'Parental PIN'}
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-96 relative">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search or syntax (e.g. country:us quality:hd tag:sports)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-16 py-2 bg-[#16161a] hover:bg-[#1c1c21] focus:bg-black border border-white/10 focus:border-cyan-500/50 rounded-xl text-xs text-white outline-none placeholder-zinc-500 transition-all font-sans shadow-inner"
              aria-label="Advanced search query"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowSyntaxHelp((prev) => !prev)}
                className={`p-1 rounded-md border transition-all ${
                  showSyntaxHelp
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'text-zinc-400 hover:text-white border-transparent hover:bg-white/10'
                }`}
                title="Syntax Filter Guide (country:, lang:, quality:, tag:)"
                aria-label="Toggle search syntax guide"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Syntax Help Guide Popover */}
          {showSyntaxHelp && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-zinc-950/95 backdrop-blur-xl border border-white/15 rounded-2xl p-3.5 shadow-2xl z-30 flex flex-col gap-2.5 text-left text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Advanced Search Syntax</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSyntaxHelp(false)}
                  className="text-zinc-500 hover:text-white p-0.5 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5 text-[11px] font-mono text-zinc-300">
                <div className="flex items-center justify-between">
                  <code className="text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded">country:us</code>
                  <span className="text-zinc-400 font-sans text-[10px]">Filter by ISO country code</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded">lang:en</code>
                  <span className="text-zinc-400 font-sans text-[10px]">Filter by broadcast language</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded">quality:4k / quality:hd</code>
                  <span className="text-zinc-400 font-sans text-[10px]">Filter stream resolution</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded">tag:sports</code>
                  <span className="text-zinc-400 font-sans text-[10px]">Filter by custom user tag</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded">group:news</code>
                  <span className="text-zinc-400 font-sans text-[10px]">Category or channel group</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">-status:blocked</code>
                  <span className="text-zinc-400 font-sans text-[10px]">Exclude flagged/blocked</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">-country:ru</code>
                  <span className="text-zinc-400 font-sans text-[10px]">Exclude country code</span>
                </div>
              </div>

              {/* Quick Preset Injectors */}
              <div className="border-t border-white/10 pt-2 flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Quick Filters</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '4K Streams', query: 'quality:4k' },
                    { label: 'US HD', query: 'country:us quality:hd' },
                    { label: 'English News', query: 'lang:en group:news' },
                    { label: 'Verified Only', query: '-status:blocked' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setSearchQuery((prev) => (prev ? `${prev.trim()} ${preset.query}` : preset.query));
                      }}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-cyan-500/20 text-zinc-300 hover:text-cyan-300 border border-white/10 text-[10px] font-semibold transition-colors"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Badges */}
          {parsedSearch.hasFilters && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {parsedSearch.countries.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-bold text-cyan-300">
                  Country: {c}
                  <button
                    type="button"
                    onClick={() => setSearchQuery((prev) => prev.replace(new RegExp(`\\b(country|cc):${c}\\b`, 'gi'), '').trim())}
                    className="hover:text-white"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              {parsedSearch.languages.map((l) => (
                <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-[10px] font-bold text-blue-300">
                  Lang: {l}
                  <button
                    type="button"
                    onClick={() => setSearchQuery((prev) => prev.replace(new RegExp(`\\b(lang|language):${l}\\b`, 'gi'), '').trim())}
                    className="hover:text-white"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              {parsedSearch.qualities.map((q) => (
                <span key={q} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-[10px] font-bold text-purple-300">
                  Quality: {q.toUpperCase()}
                  <button
                    type="button"
                    onClick={() => setSearchQuery((prev) => prev.replace(new RegExp(`\\b(quality|res|resolution):${q}\\b`, 'gi'), '').trim())}
                    className="hover:text-white"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              {parsedSearch.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300">
                  Tag: #{t}
                  <button
                    type="button"
                    onClick={() => setSearchQuery((prev) => prev.replace(new RegExp(`\\btag:${t}\\b`, 'gi'), '').trim())}
                    className="hover:text-white"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              {parsedSearch.groups.map((g) => (
                <span key={g} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                  Group: {g}
                  <button
                    type="button"
                    onClick={() => setSearchQuery((prev) => prev.replace(new RegExp(`\\b(group|cat|category):${g}\\b`, 'gi'), '').trim())}
                    className="hover:text-white"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              {parsedSearch.negatedCountries.map((nc) => (
                <span key={nc} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-[10px] font-bold text-rose-300">
                  Exclude: {nc}
                  <button
                    type="button"
                    onClick={() => setSearchQuery((prev) => prev.replace(new RegExp(`-(country|cc):${nc}\\b`, 'gi'), '').trim())}
                    className="hover:text-white"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
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

      {/* Custom User Tags Filter Bar */}
      {allCustomTags.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-cyan-400" />
              Filter by Custom Tag
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              User Tagging Engine
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
            <button
              onClick={() => setSelectedCustomTag(null)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                !selectedCustomTag
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-zinc-200'
              }`}
            >
              All Tags ({allCustomTags.length})
            </button>
            {allCustomTags.map((tag) => {
              const isSelected = selectedCustomTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedCustomTag(isSelected ? null : tag)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                      : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-zinc-200'
                  }`}
                >
                  #{tag}
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
            const isLocked = isChannelLocked({ id: c.id, name: c.name, group: c.group });
            return (
              <div
                key={c.id}
                data-tv-focus-id={`ch-${c.id}`}
                data-tv-zone="channels"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleOpenCinema(c);
                  }
                }}
                className="group relative bg-[#16161a] hover:bg-[#1c1c21] border border-white/5 hover:border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/5 flex items-center justify-center p-2.5 overflow-hidden flex-shrink-0 relative">
                    <img
                      src={c.logo || getChannelAvatarDataUri(c.name)}
                      alt={c.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getChannelAvatarDataUri(c.name);
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
                      {isLocked && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-0.5" title="Locked by Parental Controls">
                          <Lock className="w-2.5 h-2.5" /> LOCKED
                        </span>
                      )}
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
                      {customTags[c.id]?.map((tag) => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold" title={`Custom tag: #${tag}`}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (!parentalControls.pinHash) {
                        setShowParentalModal(true);
                      } else {
                        toggleChannelLock(c.id);
                      }
                    }}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isLocked
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                        : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-white'
                    }`}
                    title={isLocked ? "Unlock Channel with PIN" : "Lock Channel with PIN"}
                    aria-label="Parental Lock"
                  >
                    {isLocked ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => setTaggingChannel(c)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      customTags[c.id]?.length > 0
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                        : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-white'
                    }`}
                    title={customTags[c.id]?.length > 0 ? `Tags: ${customTags[c.id].join(', ')}` : "Manage Custom Tags"}
                    aria-label="Manage Custom Tags"
                  >
                    <Tag className="w-3.5 h-3.5" />
                  </button>

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
                    onClick={() => openPiP(c)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-zinc-400 hover:text-cyan-300 border border-white/10 transition-all cursor-pointer"
                    title="Watch in Picture-in-Picture Mini-Player"
                    aria-label="Picture-in-Picture"
                  >
                    <PictureInPicture className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleAddToMultiScreen(c)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-zinc-400 hover:text-cyan-300 border border-white/10 transition-all cursor-pointer"
                    title="Send to Multi-Screen Canvas"
                    aria-label="Send to Multi-Screen"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
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
            const isLocked = isChannelLocked({ id: c.id, name: c.name, group: c.group });
            return (
              <div
                key={c.id}
                data-tv-focus-id={`ch-${c.id}`}
                data-tv-zone="channels"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleOpenCinema(c);
                  }
                }}
                className="grid grid-cols-12 gap-4 items-center px-4 py-2.5 bg-[#16161a] hover:bg-[#1c1c21] border border-white/5 hover:border-white/10 rounded-xl transition-all cursor-pointer"
              >
                <div className="col-span-6 md:col-span-8 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/5 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0 relative">
                    <img
                      src={c.logo || getChannelAvatarDataUri(c.name, 64)}
                      alt={c.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getChannelAvatarDataUri(c.name, 64);
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
                    {isLocked && (
                      <span className="text-[8px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> LOCKED
                      </span>
                    )}
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
                    onClick={() => {
                      if (!parentalControls.pinHash) {
                        setShowParentalModal(true);
                      } else {
                        toggleChannelLock(c.id);
                      }
                    }}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      isLocked
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                        : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-white'
                    }`}
                    title={isLocked ? "Unlock Channel with PIN" : "Lock Channel with PIN"}
                    aria-label="Parental Lock"
                  >
                    {isLocked ? <Lock className="w-3 h-3 text-rose-400" /> : <Unlock className="w-3 h-3" />}
                  </button>

                  <button
                    onClick={() => setTaggingChannel(c)}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      customTags[c.id]?.length > 0
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                        : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-white'
                    }`}
                    title={customTags[c.id]?.length > 0 ? `Tags: ${customTags[c.id].join(', ')}` : "Manage Custom Tags"}
                  >
                    <Tag className="w-3 h-3" />
                  </button>

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
                    onClick={() => openPiP(c)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-zinc-400 hover:text-cyan-300 border border-white/10 transition-all cursor-pointer"
                    title="Watch in Picture-in-Picture Mini-Player"
                    aria-label="Picture-in-Picture"
                  >
                    <PictureInPicture className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleAddToMultiScreen(c)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-zinc-400 hover:text-cyan-300 border border-white/10 transition-all cursor-pointer"
                    title="Send to Multi-Screen Canvas"
                    aria-label="Send to Multi-Screen"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
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

      {/* Custom Channel Tagging Modal */}
      <ChannelTagModal
        channel={taggingChannel}
        isOpen={!!taggingChannel}
        onClose={() => setTaggingChannel(null)}
      />

      {/* Parental Controls & PIN Management Modal */}
      <ParentalPinModal
        isOpen={showParentalModal}
        onClose={() => setShowParentalModal(false)}
        initialMode={parentalControls.pinHash ? (parentalControls.isSessionUnlocked ? 'settings' : 'unlock') : 'setup'}
      />
    </div>
  );
}
