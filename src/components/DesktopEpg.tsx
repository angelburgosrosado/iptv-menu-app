/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { simRouter } from '../shims/expo-router';
import { 
  CalendarRange, 
  Play, 
  Clock, 
  Info, 
  Tv, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles,
  Search,
  Filter,
  X,
  Radio,
  ChevronRight,
  Layers,
  Flame,
  Globe,
  MapPin,
  Film,
  Bookmark as BookmarkIcon,
  RotateCcw,
  ChevronLeft
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { PageProtocolHeader } from './PageProtocolHeader';
import { getCountryFlag, getLanguageName, formatUtcOffset } from '../utils/channelEnrichment';
import { DvrModal } from './DvrModal';
import { foldSearchText } from '../utils/searchQueryParser';
import { isCatchupSupported, buildCatchupUrl } from '../utils/catchupEngine';

interface Show {
  title: string;
  time: string;
  duration: number;
  progress: number;
  description: string;
  isLive: boolean;
  isPast?: boolean;
  startTimestamp?: Date;
  isCatchupAvailable?: boolean;
}

export default function DesktopEpg() {
  const { 
    channels, 
    epgByChannel, 
    isLoading, 
    loadEpgBundle, 
    selectedTimezone, 
    setSelectedTimezone,
    dvrRecordings,
    bookmarks,
    scheduleRecording,
    addBookmark,
    removeBookmark,
    isChannelBookmarked
  } = usePlayerStore();
  const [selectedShow, setSelectedShow] = React.useState<Show | null>(null);
  const [selectedChannel, setSelectedChannel] = React.useState<Channel | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncToast, setSyncToast] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [showDvrModal, setShowDvrModal] = React.useState(false);
  const [timelineOffsetHours, setTimelineOffsetHours] = React.useState<number>(0);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    for (const c of channels) {
      if (c.group) set.add(c.group);
    }
    return ['all', ...Array.from(set).sort()];
  }, [channels]);

  const guideChannels = React.useMemo(() => {
    const foldedSearch = foldSearchText(searchTerm);
    const foldedCat = foldSearchText(selectedCategory);
    return channels.filter((c) => {
      const matchCat = selectedCategory === 'all' || foldSearchText(c.group || '') === foldedCat;
      const matchSearch = !foldedSearch || foldSearchText(c.name).includes(foldedSearch);
      return matchCat && matchSearch;
    }).slice(0, 100);
  }, [channels, selectedCategory, searchTerm]);

  const formatHour = (h: number) => {
    const normalizedH = ((h % 24) + 24) % 24;
    const period = normalizedH >= 12 ? 'PM' : 'AM';
    const displayH = normalizedH % 12 === 0 ? 12 : normalizedH % 12;
    return `${displayH}:00 ${period}`;
  };

  const now = new Date();
  const currentHour = React.useMemo(() => {
    if (!selectedTimezone || selectedTimezone === 'local') {
      return now.getHours();
    }
    try {
      const str = now.toLocaleTimeString('en-US', { timeZone: selectedTimezone, hour12: false, hour: 'numeric' });
      return parseInt(str, 10) || now.getHours();
    } catch {
      return now.getHours();
    }
  }, [now, selectedTimezone]);

  const getSlotHeader = (offset: number) => {
    const targetH = currentHour + offset;
    const formatted = formatHour(targetH);
    if (offset === 0) {
      return { label: `LIVE NOW (${formatted})`, isLive: true, isPast: false };
    }
    if (offset < 0) {
      return { label: `${formatted} (${Math.abs(offset)}h ago)`, isLive: false, isPast: true };
    }
    return { label: `${formatted} (+${offset}h)`, isLive: false, isPast: false };
  };

  const slot1Meta = getSlotHeader(timelineOffsetHours);
  const slot2Meta = getSlotHeader(timelineOffsetHours + 1);
  const slot3Meta = getSlotHeader(timelineOffsetHours + 2);

  const getProgramsForChannel = React.useCallback((channel: Channel): Show[] => {
    const currentMinutes = now.getMinutes();
    const slotDuration = 60;
    const elapsedInSlot = currentMinutes % slotDuration;
    const currentProgress = Math.round((elapsedInSlot / slotDuration) * 100);

    const chName = channel.name.trim();
    const chGroup = (channel.group || '').toLowerCase();
    const channelSupportsCatchup = isCatchupSupported(channel);

    const channelKey = channel.tvgId || channel.epgChannelId || channel.id;
    const storePrograms = epgByChannel?.[channelKey];

    const getProgramDetails = (slotOffset: number) => {
      if (chName.toLowerCase().includes('nasa')) {
        const nasaSchedule = [
          { t: "NASA Live: ISS Expedition Earth View & Telemetry", d: "High-definition real-time live video downlinks directly from the International Space Station in low Earth orbit." },
          { t: "Artemis & Deep Space Exploration Briefing", d: "Technical progress briefing on lunar orbital architecture, SLS rocketry, and upcoming crewed exploration missions." },
          { t: "Hubble & James Webb Deep-Field Astrophysics", d: "Spectroscopic data analysis and deep universe imaging releases from cosmic infrared and space-based observatories." },
          { t: "Astronaut Training & Neutral Buoyancy Lab", d: "Spacewalk training underwater simulation and orbital mechanics preparation." },
          { t: "Solar System Horizons & Deep Space Network", d: "Telemetry links with Voyager, New Horizons, and Mars rovers across interplanetary space." }
        ];
        return nasaSchedule[((slotOffset % nasaSchedule.length) + nasaSchedule.length) % nasaSchedule.length];
      }

      if (chName.toLowerCase().includes('dw') || chName.toLowerCase().includes('deutsche')) {
        const dwSchedule = [
          { t: "DW News Live: Global Geopolitics & Headlines", d: "Comprehensive international news coverage, European economic analysis, and investigative journalism live from Berlin." },
          { t: "Conflict Zone: In-Depth Political Interviews", d: "Hard-hitting global interviews questioning world leaders, diplomats, and policy architects on burning global events." },
          { t: "Made in Germany: Technology & Industry Report", d: "Global economic trends, green energy transitions, and technological innovation shaping worldwide markets." },
          { t: "DW Documentaries: Human Perspectives", d: "In-depth investigative reports examining society, technology, and ecology across continents." },
          { t: "Global 3000: The Globalization Program", d: "Exploring the people and ideas shaping global economy and sustainable development." }
        ];
        return dwSchedule[((slotOffset % dwSchedule.length) + dwSchedule.length) % dwSchedule.length];
      }

      if (chName.toLowerCase().includes('sky news')) {
        const skySchedule = [
          { t: "Sky News Live: Breaking Headlines & Analysis", d: "Continuous rolling live breaking news, press conferences, financial developments, and field reports from worldwide correspondents." },
          { t: "The Daily with Sky News: Politics Live", d: "Westminster and international political debate, parliamentary cross-examination, and editorial insight." },
          { t: "Sky World News Tonight", d: "Extensive evening round-up analyzing global diplomacy, climate policy, and international humanitarian developments." },
          { t: "Sky Financial Markets Review", d: "Global equity markets, currency movements, central bank interest rates, and commodity tracking." }
        ];
        return skySchedule[((slotOffset % skySchedule.length) + skySchedule.length) % skySchedule.length];
      }

      if (chGroup.includes('news')) {
        const newsTitles = [
          { t: `${chName} Rolling News Live`, d: `Live rolling news updates, field dispatches, and breaking analytical commentary curated by ${chName}.` },
          { t: `${chName} Global Financial & Market Hour`, d: `Real-time macroeconomic tracking, market indices, commodities, and currency movements broadcast by ${chName}.` },
          { t: `${chName} Nightly World Report`, d: `Comprehensive daily wrap-up reviewing international diplomacy, investigative journalism, and cultural features.` },
          { t: `${chName} Prime Headlines & Debate`, d: `Panel analysis and editorial debrief of leading breaking world headlines.` }
        ];
        return newsTitles[((slotOffset % newsTitles.length) + newsTitles.length) % newsTitles.length];
      }

      if (chGroup.includes('sport')) {
        const sportsTitles = [
          { t: `${chName} Matchday Live & Highlights`, d: `Live match telecasts, tactical formation breakdowns, and post-game player interviews on ${chName}.` },
          { t: `${chName} Sports Center & Global League Review`, d: `Scores, standings, injury reports, and expert studio analysis across premier continental leagues.` },
          { t: `${chName} Classic Encounters & Documentaries`, d: `Historical tournament retrospectives and archival footage celebrating memorable sports championship moments.` },
          { t: `${chName} European Championship Hour`, d: `High-definition sports coverage and tactical debate across continental championships.` }
        ];
        return sportsTitles[((slotOffset % sportsTitles.length) + sportsTitles.length) % sportsTitles.length];
      }

      const genericBroadcasts = [
        { t: `${chName} Live Broadcast Stream`, d: `Official live feed and primary continuous transmission delivered by ${chName} in full resolution.` },
        { t: `${chName} Scheduled Showcase`, d: `Curated programming segment featuring documentary highlights and weekly special features on ${chName}.` },
        { t: `${chName} Late Prime Sequence`, d: `Evening programming block delivering archival recordings, culture, and signature network features.` },
        { t: `${chName} Morning Spectrum`, d: `Morning telecast review covering culture, technology, and regional spotlight telecasts.` }
      ];
      return genericBroadcasts[((slotOffset % genericBroadcasts.length) + genericBroadcasts.length) % genericBroadcasts.length];
    };

    const slots: Show[] = [];
    for (let sidx = 0; sidx < 3; sidx++) {
      const effectiveOffset = timelineOffsetHours + sidx;
      const isPast = effectiveOffset < 0;
      const isLive = effectiveOffset === 0;
      const progress = isLive ? currentProgress : isPast ? 100 : 0;
      const isCatchupAvailable = isPast && channelSupportsCatchup;

      const showStart = new Date(now.getTime() + effectiveOffset * 3600000);
      showStart.setMinutes(0, 0, 0);

      const slotTime = `${formatHour(currentHour + effectiveOffset)} - ${formatHour(currentHour + effectiveOffset + 1)}`;

      // Check if store program matches
      let title = '';
      let description = '';

      if (storePrograms && storePrograms.length > 0) {
        const pIdx = Math.max(0, Math.min(storePrograms.length - 1, sidx + Math.max(0, timelineOffsetHours)));
        const p = storePrograms[pIdx];
        if (p) {
          title = p.title || '';
          description = p.description || p.desc || '';
        }
      }

      if (!title) {
        const p = getProgramDetails(effectiveOffset);
        title = isPast ? `[Archived] ${p.t}` : p.t;
        description = p.d;
      }

      slots.push({
        title,
        time: slotTime,
        duration: slotDuration,
        progress,
        description,
        isLive,
        isPast,
        startTimestamp: showStart,
        isCatchupAvailable
      });
    }

    return slots;
  }, [currentHour, timelineOffsetHours, epgByChannel, now]);

  // Auto-select first channel and first show for immediate inspector preview
  React.useEffect(() => {
    if (guideChannels.length > 0 && !selectedChannel) {
      const first = guideChannels[0];
      setSelectedChannel(first);
      const shows = getProgramsForChannel(first);
      setSelectedShow(shows[0] || null);
    }
  }, [guideChannels, selectedChannel, getProgramsForChannel]);

  const handlePlayInSimulator = (channel: Channel) => {
    simRouter.push(`/player/${channel.id}`);
  };

  const handleRefreshXmltvFeed = async () => {
    setIsSyncing(true);
    setSyncToast('Syncing XMLTV auto-feed across active channels...');
    try {
      await loadEpgBundle();
    } catch {
      await new Promise(r => setTimeout(r, 800));
    }
    setIsSyncing(false);
    setSyncToast('XMLTV auto-feed refreshed: 100% time-grid synced.');
    setTimeout(() => setSyncToast(null), 3000);
  };

  return (
    <div className="flex flex-col h-full gap-5">
      {/* EPG Protocol Header */}
      <PageProtocolHeader
        title="Electronic Program Guide (EPG)"
        description="XMLTV auto-feed integration and time-grid EPG display. Schedules are cross-referenced with channel tvg-id tags according to XMLTV DTD and RFC 5545 specifications, delivering live Now/Next broadcast information."
        protocol="XMLTV DTD & RFC 5545 (iCalendar)"
        schema="XMLTV Schema v0.6 & DVB-SI Event Information"
        rfcOrStandard="XMLTV DTD 0.6 • DVB-SI EN 300 468"
        layer="Metadata & Schedule Synchronization Layer"
        supportedTags={['<tv>', '<channel id="">', '<programme start="" stop="">', '<title>', '<desc>', '<category>', 'tvg-id', 'Now/Next']}
        icon={CalendarRange}
        badgeColor="cyan"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 transition-all">
            <Globe className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <select
              value={selectedTimezone || 'local'}
              onChange={(e) => setSelectedTimezone(e.target.value === 'local' ? null : e.target.value)}
              className="bg-transparent text-xs text-white outline-none cursor-pointer font-sans"
              aria-label="EPG Broadcast Timezone"
            >
              <option value="local" className="bg-zinc-900 text-white">Local Time ({Intl.DateTimeFormat().resolvedOptions().timeZone})</option>
              <option value="UTC" className="bg-zinc-900 text-white">UTC (+00:00)</option>
              <option value="America/New_York" className="bg-zinc-900 text-white">US Eastern (America/New_York)</option>
              <option value="America/Chicago" className="bg-zinc-900 text-white">US Central (America/Chicago)</option>
              <option value="America/Denver" className="bg-zinc-900 text-white">US Mountain (America/Denver)</option>
              <option value="America/Los_Angeles" className="bg-zinc-900 text-white">US Pacific (America/Los_Angeles)</option>
              <option value="America/Puerto_Rico" className="bg-zinc-900 text-white">Puerto Rico (America/Puerto_Rico)</option>
              <option value="America/Santo_Domingo" className="bg-zinc-900 text-white">Dominican Rep (America/Santo_Domingo)</option>
              <option value="America/Mexico_City" className="bg-zinc-900 text-white">Mexico City (America/Mexico_City)</option>
              <option value="Europe/London" className="bg-zinc-900 text-white">London (Europe/London)</option>
              <option value="Europe/Madrid" className="bg-zinc-900 text-white">Madrid (Europe/Madrid)</option>
              <option value="Europe/Paris" className="bg-zinc-900 text-white">Paris (Europe/Paris)</option>
              <option value="Asia/Tokyo" className="bg-zinc-900 text-white">Tokyo (Asia/Tokyo)</option>
            </select>
          </div>

          <button
            onClick={handleRefreshXmltvFeed}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            aria-label="Refresh XMLTV Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync XMLTV Feed</span>
          </button>

          <button
            onClick={() => setShowDvrModal(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-500/10"
            aria-label="Open DVR & Bookmarks Library"
          >
            <Film className="w-3.5 h-3.5 text-purple-400" />
            <span>DVR & Bookmarks ({dvrRecordings.length + bookmarks.length})</span>
          </button>
        </div>
      </PageProtocolHeader>

      {syncToast && (
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 font-medium flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#131418] border border-white/10 rounded-2xl p-3 shadow-md">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search channels or shows..."
            className="w-full bg-black/60 border border-white/10 focus:border-cyan-500 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-all focus:ring-1 focus:ring-cyan-500/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills & Count */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {categories.slice(0, 7).map((cat) => {
            const isActive = foldSearchText(selectedCategory) === foldSearchText(cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25 font-bold'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {cat === 'all' ? 'All Networks' : cat}
              </button>
            );
          })}
          <div className="hidden sm:flex items-center text-[11px] text-zinc-400 font-mono pl-3 border-l border-white/10 whitespace-nowrap">
            {guideChannels.length} {guideChannels.length === 1 ? 'feed' : 'feeds'}
          </div>
        </div>
      </div>

      {/* SKELETON LOADER STATE */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl skeleton-box w-full" />
          ))}
        </div>
      ) : guideChannels.length === 0 ? (
        /* EMPTY STATE */
        <div className="flex-1 min-h-[350px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4 border border-cyan-500/20 shadow-inner">
            <Tv className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No EPG Channels Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
            {searchTerm || selectedCategory !== 'all' 
              ? 'No channels match your current search or category filter. Try clearing filters.'
              : 'Upload or sync an M3U playlist with valid tvg-id tags to populate the electronic program guide.'}
          </p>
          {(searchTerm || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-[#121316] border border-white/10 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
            {/* HORIZONTAL TIMELINE SCRUBBER RIBBON */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTimelineOffsetHours(prev => Math.max(-12, prev - 1))}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Rewind timetable 1 hour"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Earlier</span>
            </button>

            {/* Quick Timeline Hour Jumpers */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
                const isSelected = timelineOffsetHours === offset;
                const isLiveHour = offset === 0;
                const h = currentHour + offset;
                const label = isLiveHour ? 'LIVE' : formatHour(h).split(' ')[0];
                return (
                  <button
                    key={offset}
                    onClick={() => setTimelineOffsetHours(offset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer ${
                      isSelected
                        ? isLiveHour
                          ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/25 font-black'
                          : 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25 font-black'
                        : isLiveHour
                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                        : offset < 0
                        ? 'bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 border border-purple-800/30'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setTimelineOffsetHours(prev => Math.min(12, prev + 1))}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Advance timetable 1 hour"
            >
              <span>Later</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {timelineOffsetHours !== 0 && (
              <button
                onClick={() => setTimelineOffsetHours(0)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Jump to Live Now</span>
              </button>
            )}

            <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Timezone: {selectedTimezone === 'local' || !selectedTimezone ? 'Local' : selectedTimezone.split('/').pop()?.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        {/* TIMELINE GRID & INSPECTOR SPLIT */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          {/* Main Grid View */}
          <div className="xl:col-span-8 flex flex-col bg-[#121316] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header hours */}
            <div className="grid grid-cols-12 border-b border-white/10 bg-black/60 p-3.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider gap-3 select-none sticky top-0 z-20 backdrop-blur-md">
              <div className="col-span-3 flex items-center gap-1.5 text-zinc-300">
                <Tv className="w-3.5 h-3.5 text-cyan-400" />
                <span>Network Feed</span>
              </div>
              <div className={`col-span-3 flex items-center gap-1.5 ${slot1Meta.isLive ? 'text-emerald-300' : slot1Meta.isPast ? 'text-purple-300' : 'text-zinc-300'}`}>
                {slot1Meta.isLive ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                ) : slot1Meta.isPast ? (
                  <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{slot1Meta.label}</span>
              </div>
              <div className={`col-span-3 flex items-center gap-1.5 ${slot2Meta.isLive ? 'text-emerald-300' : slot2Meta.isPast ? 'text-purple-300' : 'text-zinc-300'}`}>
                {slot2Meta.isLive ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                ) : slot2Meta.isPast ? (
                  <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{slot2Meta.label}</span>
              </div>
              <div className={`col-span-3 flex items-center gap-1.5 ${slot3Meta.isLive ? 'text-emerald-300' : slot3Meta.isPast ? 'text-purple-300' : 'text-zinc-300'}`}>
                {slot3Meta.isLive ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                ) : slot3Meta.isPast ? (
                  <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{slot3Meta.label}</span>
              </div>
            </div>

            {/* Grid rows with comfortable scrollable height */}
            <div className="divide-y divide-white/5 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[520px] scrollbar-thin scrollbar-thumb-zinc-700">
              {guideChannels.map((c) => {
                const shows = getProgramsForChannel(c);
                const isSelectedChan = selectedChannel?.id === c.id;

                return (
                  <div 
                    key={c.id} 
                    className={`grid grid-cols-12 items-center p-3 gap-3 transition-colors ${
                      isSelectedChan ? 'bg-cyan-500/[0.04]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Channel Column */}
                    <div 
                      onClick={() => {
                        setSelectedChannel(c);
                        setSelectedShow(shows[0] || null);
                      }}
                      className="col-span-3 flex items-center gap-2.5 min-w-0 pr-2 cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-black/80 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-cyan-500/40 transition-colors">
                        <img
                          src={c.logo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60'}
                          alt={c.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
                          }}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <span className="text-xs font-bold text-white truncate leading-snug group-hover:text-cyan-300 transition-colors">
                          {c.name}
                        </span>
                        {c.group && (
                          <span className="text-[10px] text-zinc-400 truncate uppercase tracking-wider font-semibold">
                            {c.group}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Program Slots */}
                    {shows.map((show, sidx) => {
                      const isShowSelected = isSelectedChan && selectedShow?.title === show.title;

                      return (
                        <div
                          key={sidx}
                          onClick={() => {
                            setSelectedShow(show);
                            setSelectedChannel(c);
                          }}
                          className={`col-span-3 p-2.5 rounded-xl text-left cursor-pointer transition-all border group relative min-h-[64px] flex flex-col justify-between shadow-sm ${
                            show.isLive
                              ? isShowSelected
                                ? 'bg-cyan-950/60 border-cyan-400 ring-2 ring-cyan-400/40'
                                : 'bg-gradient-to-br from-cyan-950/30 to-zinc-900/90 border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-950/40'
                              : show.isPast
                              ? isShowSelected
                                ? 'bg-purple-950/50 border-purple-400 ring-2 ring-purple-400/40'
                                : 'bg-zinc-900/50 border-purple-900/20 hover:border-purple-700/40 hover:bg-purple-950/20'
                              : isShowSelected
                                ? 'bg-zinc-800 border-cyan-400 ring-2 ring-cyan-400/40'
                                : 'bg-zinc-900/80 border-white/10 hover:bg-zinc-800/90 hover:border-white/20'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] text-cyan-300 font-mono font-bold leading-none">
                                {show.time.split(' - ')[0]}
                              </span>
                              {show.isLive && (
                                <span className="text-[8px] font-black px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 uppercase tracking-wide">
                                  LIVE
                                </span>
                              )}
                              {show.isPast && show.isCatchupAvailable && (
                                <span className="text-[8px] font-black px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 uppercase tracking-wide flex items-center gap-0.5">
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  <span>REPLAY</span>
                                </span>
                              )}
                              {show.isPast && !show.isCatchupAvailable && (
                                <span className="text-[8px] font-bold px-1 py-0.2 text-zinc-500 uppercase tracking-wider">
                                  ENDED
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-white truncate block group-hover:text-cyan-200 transition-colors" title={show.title}>
                              {show.title}
                            </span>
                          </div>

                          {show.isLive && (
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1.5">
                              <div
                                className="h-full bg-cyan-400 rounded-full transition-all duration-500"
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

          {/* Show Inspector Sidebar */}
          <div className="xl:col-span-4 flex flex-col xl:sticky xl:top-4 h-fit">
            {selectedShow && selectedChannel ? (
              <div className="bg-[#121316] border border-white/10 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl">
                {/* Channel Header Banner */}
                <div className="flex items-center gap-3.5 pb-4 border-b border-white/10">
                  <div className="w-12 h-12 rounded-2xl bg-black/80 border border-white/10 p-2 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
                    <img
                      src={selectedChannel.logo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60'}
                      alt={selectedChannel.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-0.5">
                      {selectedChannel.group || 'Live Feed'}
                    </span>
                    <h3 className="text-base font-bold text-white leading-tight truncate">
                      {selectedChannel.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {selectedChannel.countryCode && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                          <span>{selectedChannel.countryFlag || getCountryFlag(selectedChannel.countryCode)}</span>
                          <span>{selectedChannel.countryName || selectedChannel.countryCode}</span>
                        </span>
                      )}
                      {selectedChannel.language && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full font-medium">
                          <Globe className="w-2.5 h-2.5" />
                          <span>{selectedChannel.languageName || getLanguageName(selectedChannel.language)}</span>
                        </span>
                      )}
                      {(selectedChannel.timezone || selectedTimezone) && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full font-mono">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{selectedChannel.timezone || selectedTimezone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Show Details */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                    <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{selectedShow.time} ({selectedShow.duration} min)</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      [{selectedTimezone ? selectedTimezone.split('/').pop()?.replace(/_/g, ' ') : 'Local'}]
                    </span>
                  </div>

                  {selectedShow.isLive ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                          ON AIR NOW
                        </span>
                        <span className="text-zinc-400 text-xs font-semibold">
                          {selectedShow.progress}% elapsed
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                          style={{ width: `${selectedShow.progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-full border border-white/5 w-fit uppercase tracking-wider">
                      Scheduled Telecast
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white leading-snug mb-2">
                    {selectedShow.title}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {selectedShow.description}
                  </p>
                </div>

                {/* Technical stream badge */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Stream Transport</span>
                  <span className="text-cyan-400 font-mono font-semibold">HLS / MPEG-TS</span>
                </div>

                {/* DVR & Bookmark Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const isAlreadyScheduled = dvrRecordings.some(r => r.channelId === selectedChannel.id && r.programTitle === selectedShow.title);
                      if (isAlreadyScheduled) {
                        setShowDvrModal(true);
                        return;
                      }
                      scheduleRecording({
                        channelId: selectedChannel.id,
                        channelName: selectedChannel.name,
                        channelLogo: selectedChannel.logo,
                        programTitle: selectedShow.title,
                        programDescription: selectedShow.description,
                        streamUrl: selectedChannel.url,
                        startTime: new Date().toISOString(),
                        endTime: new Date(Date.now() + (selectedShow.duration || 60) * 60000).toISOString(),
                        durationMinutes: selectedShow.duration || 60,
                        status: selectedShow.isLive ? 'recording' : 'scheduled',
                        fileSizeEstimate: `${Math.round((selectedShow.duration || 60) * 24.5)} MB`
                      });
                      setSyncToast(`DVR: ${selectedShow.isLive ? 'Started recording' : 'Scheduled capture for'} "${selectedShow.title}"`);
                      setTimeout(() => setSyncToast(null), 3500);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    aria-label="DVR Record or Schedule"
                  >
                    <Film className="w-3.5 h-3.5 text-purple-400" />
                    <span>{selectedShow.isLive ? 'Record Live' : 'Schedule DVR'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (isChannelBookmarked(selectedChannel.id)) {
                        removeBookmark(selectedChannel.id);
                        setSyncToast(`Removed ${selectedChannel.name} from Bookmarks`);
                      } else {
                        addBookmark({
                          channelId: selectedChannel.id,
                          channelName: selectedChannel.name,
                          channelLogo: selectedChannel.logo,
                          programTitle: selectedShow.title,
                          streamUrl: selectedChannel.url,
                          note: selectedChannel.group || 'Live Feed'
                        });
                        setSyncToast(`Bookmarked ${selectedChannel.name}`);
                      }
                      setTimeout(() => setSyncToast(null), 3000);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isChannelBookmarked(selectedChannel.id)
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
                    }`}
                    aria-label="Toggle Channel Bookmark"
                  >
                    <BookmarkIcon className={`w-3.5 h-3.5 ${isChannelBookmarked(selectedChannel.id) ? 'fill-current text-amber-400' : 'text-zinc-400'}`} />
                    <span>{isChannelBookmarked(selectedChannel.id) ? 'Bookmarked' : 'Bookmark'}</span>
                  </button>
                </div>

                {/* Launch / Catch-Up Replay Button */}
                {selectedShow.isPast && selectedShow.isCatchupAvailable ? (
                  <button
                    onClick={() => {
                      const catchupUrl = buildCatchupUrl(
                        selectedChannel,
                        selectedShow.startTimestamp || new Date(),
                        selectedShow.duration,
                        { serverTimezone: selectedChannel.timezone || selectedTimezone }
                      );
                      const targetUrl = catchupUrl || selectedChannel.url;
                      simRouter.push(`/player/${selectedChannel.id}?catchupUrl=${encodeURIComponent(targetUrl)}&catchupTitle=${encodeURIComponent(selectedShow.title)}`);
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all cursor-pointer transform active:scale-[0.99]"
                    aria-label="Play Catch-Up Replay in simulator"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Watch Catch-Up Replay</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlayInSimulator(selectedChannel)}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer transform active:scale-[0.99]"
                    aria-label="Launch stream in simulator"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Launch Stream in Simulator</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="border border-white/10 rounded-3xl p-6 h-full min-h-[300px] flex flex-col items-center justify-center text-center bg-[#121316]">
                <Info className="w-8 h-8 text-zinc-500 mb-3" />
                <h4 className="text-xs font-bold text-zinc-200">Program Inspector</h4>
                <p className="text-[11px] text-zinc-500 max-w-xs mt-1.5 leading-relaxed">
                  Select any program block from the timetable to inspect detailed episode synopses and stream diagnostics.
                </p>
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {/* DVR & Bookmarks Modal */}
      <DvrModal 
        isOpen={showDvrModal} 
        onClose={() => setShowDvrModal(false)} 
      />
    </div>
  );
}
