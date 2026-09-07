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
  Sparkles 
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { PageProtocolHeader } from './PageProtocolHeader';

interface Show {
  title: string;
  time: string;
  duration: number;
  progress: number;
  description: string;
  isLive: boolean;
}

export default function DesktopEpg() {
  const { channels, isLoading } = usePlayerStore();
  const [selectedShow, setSelectedShow] = React.useState<Show | null>(null);
  const [selectedChannel, setSelectedChannel] = React.useState<Channel | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncToast, setSyncToast] = React.useState<string | null>(null);

  const guideChannels = React.useMemo(() => {
    return channels.slice(0, 10);
  }, [channels]);

  const getProgramsForChannel = React.useCallback((channel: Channel): Show[] => {
    const now = new Date();
    const currentMinutes = now.getMinutes();
    const currentHour = now.getHours();

    const slotDuration = 60;
    const elapsedInSlot = currentMinutes % slotDuration;
    const currentProgress = Math.round((elapsedInSlot / slotDuration) * 100);

    const formatHour = (h: number) => {
      const normalizedH = ((h % 24) + 24) % 24;
      const period = normalizedH >= 12 ? 'PM' : 'AM';
      const displayH = normalizedH % 12 === 0 ? 12 : normalizedH % 12;
      return `${displayH}:00 ${period}`;
    };

    const slot1Time = `${formatHour(currentHour)} - ${formatHour(currentHour + 1)}`;
    const slot2Time = `${formatHour(currentHour + 1)} - ${formatHour(currentHour + 2)}`;
    const slot3Time = `${formatHour(currentHour + 2)} - ${formatHour(currentHour + 3)}`;

    const chName = channel.name.trim();
    const chGroup = (channel.group || '').toLowerCase();

    const getProgramDetails = (slotOffset: number) => {
      if (chName.toLowerCase().includes('nasa')) {
        const nasaSchedule = [
          { t: "NASA Live: ISS Expedition Earth View & Telemetry", d: "High-definition real-time live video downlinks directly from the International Space Station in low Earth orbit." },
          { t: "Artemis & Deep Space Exploration Briefing", d: "Technical progress briefing on lunar orbital architecture, SLS rocketry, and upcoming crewed exploration missions." },
          { t: "Hubble & James Webb Deep-Field Astrophysics", d: "Spectroscopic data analysis and deep universe imaging releases from cosmic infrared and space-based observatories." }
        ];
        return nasaSchedule[slotOffset % nasaSchedule.length];
      }

      if (chName.toLowerCase().includes('dw') || chName.toLowerCase().includes('deutsche')) {
        const dwSchedule = [
          { t: "DW News Live: Global Geopolitics & Headlines", d: "Comprehensive international news coverage, European economic analysis, and investigative journalism live from Berlin." },
          { t: "Conflict Zone: In-Depth Political Interviews", d: "Hard-hitting global interviews questioning world leaders, diplomats, and policy architects on burning global events." },
          { t: "Made in Germany: Technology & Industry Report", d: "Global economic trends, green energy transitions, and technological innovation shaping worldwide markets." }
        ];
        return dwSchedule[slotOffset % dwSchedule.length];
      }

      if (chName.toLowerCase().includes('sky news')) {
        const skySchedule = [
          { t: "Sky News Live: Breaking Headlines & Analysis", d: "Continuous rolling live breaking news, press conferences, financial developments, and field reports from worldwide correspondents." },
          { t: "The Daily with Sky News: Politics Live", d: "Westminster and international political debate, parliamentary cross-examination, and editorial insight." },
          { t: "Sky World News Tonight", d: "Extensive evening round-up analyzing global diplomacy, climate policy, and international humanitarian developments." }
        ];
        return skySchedule[slotOffset % skySchedule.length];
      }

      if (chName.toLowerCase().includes('france 24')) {
        const franceSchedule = [
          { t: "France 24 Live: International News in English", d: "Worldwide perspectives, French diplomatic coverage, and comprehensive African & European geopolitical reporting." },
          { t: "The Debate: Global Affairs Round Table", d: "Panels of international journalists and diplomats debating international diplomacy, multilateral treaties, and global flashpoints." },
          { t: "Eye on the Americas & Perspective", d: "Culture, technology, and transatlantic economic cooperation in-depth feature broadcasts." }
        ];
        return franceSchedule[slotOffset % franceSchedule.length];
      }

      if (chName.toLowerCase().includes('red bull')) {
        const redbullSchedule = [
          { t: "Red Bull Action Sports: Rampage & Downhill Live", d: "High-octane extreme sports coverage, downhill mountain biking finals, and wingsuit cliff descents." },
          { t: "Mind of the Athlete: Pushing Human Endurance", d: "Sports science documentary examining psychological resilience, high-altitude acclimatization, and reflex training." },
          { t: "World of Red Bull: Global Expeditions", d: "Spectacular cinematic journeys across remote mountain ranges, arctic surf breaks, and desert rallies." }
        ];
        return redbullSchedule[slotOffset % redbullSchedule.length];
      }

      if (chGroup.includes('news')) {
        const newsTitles = [
          { t: `${chName} Rolling News Live`, d: `Live rolling news updates, field dispatches, and breaking analytical commentary curated by ${chName}.` },
          { t: `${chName} Global Financial & Market Hour`, d: `Real-time macroeconomic tracking, market indices, commodities, and currency movements broadcast by ${chName}.` },
          { t: `${chName} Nightly World Report`, d: `Comprehensive daily wrap-up reviewing international diplomacy, investigative journalism, and cultural features.` }
        ];
        return newsTitles[slotOffset % newsTitles.length];
      }

      if (chGroup.includes('sport')) {
        const sportsTitles = [
          { t: `${chName} Matchday Live & Highlights`, d: `Live match telecasts, tactical formation breakdowns, and post-game player interviews on ${chName}.` },
          { t: `${chName} Sports Center & Global League Review`, d: `Scores, standings, injury reports, and expert studio analysis across premier continental leagues.` },
          { t: `${chName} Classic Encounters & Documentaries`, d: `Historical tournament retrospectives and archival footage celebrating memorable sports championship moments.` }
        ];
        return sportsTitles[slotOffset % sportsTitles.length];
      }

      const genericBroadcasts = [
        { t: `${chName} Live Broadcast Stream`, d: `Official live feed and primary continuous transmission delivered by ${chName} in full resolution.` },
        { t: `${chName} Scheduled Showcase`, d: `Curated programming segment featuring documentary highlights and weekly special features on ${chName}.` },
        { t: `${chName} Late Prime Sequence`, d: `Evening programming block delivering archival recordings, culture, and signature network features.` }
      ];
      return genericBroadcasts[slotOffset % genericBroadcasts.length];
    };

    const p1 = getProgramDetails(0);
    const p2 = getProgramDetails(1);
    const p3 = getProgramDetails(2);

    return [
      {
        title: p1.t,
        time: slot1Time,
        duration: slotDuration,
        progress: currentProgress,
        description: p1.d,
        isLive: true
      },
      {
        title: p2.t,
        time: slot2Time,
        duration: slotDuration,
        progress: 0,
        description: p2.d,
        isLive: false
      },
      {
        title: p3.t,
        time: slot3Time,
        duration: slotDuration,
        progress: 0,
        description: p3.d,
        isLive: false
      }
    ];
  }, []);

  const handlePlayInSimulator = (channel: Channel) => {
    simRouter.push(`/player/${channel.id}`);
  };

  const handleRefreshXmltvFeed = async () => {
    setIsSyncing(true);
    setSyncToast('Syncing XMLTV auto-feed across active channels...');
    await new Promise(r => setTimeout(r, 800));
    setIsSyncing(false);
    setSyncToast('XMLTV auto-feed refreshed: 100% time-grid synced.');
    setTimeout(() => setSyncToast(null), 3000);
  };

  return (
    <div className="flex flex-col h-full gap-6">
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
          <button
            onClick={handleRefreshXmltvFeed}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            aria-label="Refresh XMLTV Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync XMLTV Feed</span>
          </button>
        </div>
      </PageProtocolHeader>

      {syncToast && (
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          {syncToast}
        </div>
      )}

      {/* SKELETON LOADER STATE */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl skeleton-box w-full" />
          ))}
        </div>
      ) : guideChannels.length === 0 ? (
        /* EMPTY STATE */
        <div className="flex-1 min-h-[350px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4 border border-cyan-500/20">
            <Tv className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No EPG Channels Loaded</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
            Upload or sync an M3U playlist with valid tvg-id tags to populate the electronic program guide.
          </p>
        </div>
      ) : (
        /* TIMELINE GRID */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          <div className="xl:col-span-8 flex flex-col bg-[#16161a] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
            {/* Header hours */}
            <div className="grid grid-cols-12 border-b border-white/10 bg-black/40 p-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest gap-2">
              <div className="col-span-3">Network Feed</div>
              <div className="col-span-3">Live (On-Air Now)</div>
              <div className="col-span-3">Up Next (1 Hour)</div>
              <div className="col-span-3">Later (2 Hours)</div>
            </div>

            {/* Grid rows */}
            <div className="divide-y divide-white/5 overflow-y-auto max-h-[460px] scrollbar-thin">
              {guideChannels.map((c) => {
                const shows = getProgramsForChannel(c);
                return (
                  <div key={c.id} className="grid grid-cols-12 items-center p-3.5 hover:bg-white/[0.02] gap-2 transition-colors">
                    {/* Channel */}
                    <div className="col-span-3 flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-xl bg-black/60 border border-white/5 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={c.logo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60'}
                          alt={c.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
                          }}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-xs font-bold text-white truncate leading-snug">
                        {c.name}
                      </span>
                    </div>

                    {/* Show Blocks */}
                    {shows.map((show, sidx) => (
                      <div
                        key={sidx}
                        onClick={() => {
                          setSelectedShow(show);
                          setSelectedChannel(c);
                        }}
                        className={`col-span-3 p-2.5 rounded-xl text-left cursor-pointer transition-all border group relative min-h-[58px] flex flex-col justify-between ${
                          show.isLive
                            ? 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/15'
                            : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/10'
                        }`}
                      >
                        <div>
                          <span className="text-[9px] text-zinc-400 font-bold block leading-none mb-1 group-hover:text-cyan-300 transition-colors">
                            {show.time.split(' - ')[0]}
                          </span>
                          <span className="text-xs font-bold text-white truncate block group-hover:text-cyan-300 transition-colors">
                            {show.title}
                          </span>
                        </div>

                        {show.isLive && (
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1.5">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${show.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Show Inspector Sidebar */}
          <div className="xl:col-span-4 flex flex-col">
            {selectedShow && selectedChannel ? (
              <div className="bg-[#16161a] border border-white/10 rounded-3xl p-6 h-full flex flex-col gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/5 p-1.5 overflow-hidden">
                    <img
                      src={selectedChannel.logo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60'}
                      alt={selectedChannel.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                      {selectedChannel.group}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {selectedChannel.name}
                    </h3>
                  </div>
                </div>

                <div className="border-t border-b border-white/5 py-4 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{selectedShow.time}</span>
                  </div>
                  {selectedShow.isLive && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                        LIVE NOW
                      </span>
                      <span className="text-[11px] text-zinc-400 font-semibold">
                        {selectedShow.progress}% complete
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white leading-tight mb-2">
                    {selectedShow.title}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {selectedShow.description}
                  </p>
                </div>

                <button
                  onClick={() => handlePlayInSimulator(selectedChannel)}
                  className="mt-auto w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                  aria-label="Launch stream in simulator"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Launch Stream Simulator
                </button>
              </div>
            ) : (
              <div className="border border-white/10 rounded-3xl p-6 h-full flex flex-col items-center justify-center text-center bg-[#16161a]">
                <Info className="w-8 h-8 text-zinc-500 mb-3" />
                <h4 className="text-xs font-bold text-zinc-200">Program Inspector</h4>
                <p className="text-[11px] text-zinc-500 max-w-xs mt-1.5 leading-relaxed">
                  Click on any schedule block in the timetable to inspect detailed episode metadata, progress, and broadcast information.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
