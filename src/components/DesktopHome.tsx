/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  Play, 
  Tv, 
  Calendar, 
  Clock, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Flame, 
  Radio, 
  Film, 
  Clapperboard, 
  Check, 
  Info,
  Maximize2,
  Volume2
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { usePlayerStore } from '../store/usePlayerStore';
import { DEMO_FAST_CHANNELS } from '../data/demoChannels';

interface DesktopHomeProps {
  onSelectChannel: (channel: Channel) => void;
  onNavigateTab: (tab: string) => void;
}

interface FeaturedItem {
  id: string;
  title: string;
  category: string;
  badge: string;
  subTitle: string;
  description: string;
  backdropUrl: string;
  streamUrl?: string;
  rating?: string;
  channelFallback: Channel;
}

interface VodItem {
  id: string;
  title: string;
  duration: string;
  rating: string;
  posterUrl: string;
  category: string;
  channelFallback: Channel;
}

interface EpgRow {
  channelId: string;
  channelName: string;
  logo: React.ReactNode;
  channelObj: Channel;
  programs: {
    title: string;
    start: string;
    end: string;
    durationMinutes: number;
    isCurrent?: boolean;
    progress?: number;
  }[];
}

// Built-in Brand Logos for TV Guide and Live Channels (sharp vector SVGs)
const ChannelLogos = {
  bbcOne: (
    <div className="flex items-center gap-1 px-2 py-1 bg-red-600 rounded-md text-white font-black text-xs tracking-tighter">
      <span>BBC</span>
      <span className="bg-white text-red-600 px-1 rounded text-[10px]">ONE</span>
    </div>
  ),
  espn: (
    <div className="flex items-center px-2 py-0.5 bg-red-700 rounded text-white font-black italic text-xs tracking-wider">
      <span>ESPN</span>
    </div>
  ),
  itv: (
    <div className="flex items-center px-2 py-0.5 bg-yellow-500 rounded text-black font-extrabold text-xs tracking-wide">
      <span>itv</span>
    </div>
  ),
  cnn: (
    <div className="flex items-center px-2 py-0.5 bg-red-600 rounded text-white font-black text-xs tracking-tight">
      <span>CNN</span>
    </div>
  ),
  discovery: (
    <div className="flex items-center gap-0.5 px-2 py-0.5 bg-sky-600 rounded text-white font-bold text-xs">
      <span>Discovery</span>
    </div>
  ),
  skySports: (
    <div className="flex items-center px-2 py-0.5 bg-gradient-to-r from-red-600 to-blue-700 rounded text-white font-extrabold text-xs">
      <span>sky sports</span>
    </div>
  )
};

export default function DesktopHome({ onSelectChannel, onNavigateTab }: DesktopHomeProps) {
  const { channels, vodChannels, seriesChannels, loadDemoChannels } = usePlayerStore();

  const [activeCarouselIndex, setActiveCarouselIndex] = React.useState(0);
  const [isAutoPlay, setIsAutoPlay] = React.useState(true);

  // Fallback demo channel if user has no playlists yet
  const defaultLiveChannel: Channel = channels[0] || DEMO_FAST_CHANNELS[0];

  // 1. Curated Featured Carousel items (matching wireframe: Man City vs Arsenal [4K], Loki S2E4, Dune: Part Two)
  const featuredItems: FeaturedItem[] = React.useMemo(() => [
    {
      id: 'featured-1',
      title: 'LIVE FOOTBALL: Man City vs Arsenal',
      category: 'Premier League Super Sunday',
      badge: '4K',
      subTitle: 'Match of the Season • Etihad Stadium',
      description: 'Title decider clash streaming live in Ultra HD with multi-camera interactive angles and Dolby Atmos audio.',
      backdropUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80',
      channelFallback: channels.find(c => c.category?.toLowerCase().includes('sport') || c.name.toLowerCase().includes('sport')) || {
        ...defaultLiveChannel,
        name: 'Sky Sports Premier League (4K)',
        currentProgram: 'LIVE FOOTBALL: Man City vs Arsenal',
        resolution: '4K Ultra HD'
      }
    },
    {
      id: 'featured-2',
      title: 'Loki - S2E4',
      category: 'Marvel Cinematic Universe',
      badge: '4K',
      subTitle: 'Episode 4 • Heart of the TVA',
      description: 'Loki and Mobius race against time to repair the Temporal Loom before timeline collapse consumes all existence.',
      backdropUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
      channelFallback: vodChannels[0] || seriesChannels[0] || {
        ...defaultLiveChannel,
        name: 'Disney+ / Marvel 4K Feed',
        currentProgram: 'Loki - S2E4: Heart of the TVA',
        resolution: '4K HDR'
      }
    },
    {
      id: 'featured-3',
      title: 'Dune: Part Two',
      category: 'Blockbuster Sci-Fi Cinema',
      badge: '4K',
      subTitle: 'IMAX Enhanced • Master Audio',
      description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
      channelFallback: vodChannels[1] || {
        ...defaultLiveChannel,
        name: 'Cinema Premiere 4K',
        currentProgram: 'Dune: Part Two (2024)',
        resolution: '4K Ultra HD'
      }
    },
    {
      id: 'featured-4',
      title: 'UEFA Champions League Final',
      category: 'European Football Championship',
      badge: '4K',
      subTitle: 'Real Madrid vs Borussia Dortmund • Wembley',
      description: 'The pinnacle of club football live in ultra-crisp 4K 60FPS with dedicated tactical feed and ambient stadium sound.',
      backdropUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1600&q=80',
      channelFallback: {
        ...defaultLiveChannel,
        name: 'TNT Sports Ultimate 4K',
        currentProgram: 'Champions League Final Live',
        resolution: '4K 60fps'
      }
    },
    {
      id: 'featured-5',
      title: 'Oppenheimer',
      category: 'Academy Award Winner',
      badge: '4K',
      subTitle: 'Christopher Nolan Masterwork',
      description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
      backdropUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1600&q=80',
      channelFallback: {
        ...defaultLiveChannel,
        name: 'Universal Cinema 4K',
        currentProgram: 'Oppenheimer (Extended Cut)',
        resolution: '4K Ultra HD'
      }
    }
  ], [channels, vodChannels, seriesChannels, defaultLiveChannel]);

  // Carousel timer
  React.useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setActiveCarouselIndex(prev => (prev + 1) % featuredItems.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlay, featuredItems.length]);

  // 2. LIVE CHANNELS NOW (matches wireframe: BBC One HD, ESPN, BBC Channel HD with live progress bars)
  const liveChannelsNow = React.useMemo(() => {
    return [
      {
        id: 'live-bbc-one',
        name: 'BBC ONE (HD)',
        program: 'News at Ten',
        badge: '4K',
        progress: 68,
        logo: ChannelLogos.bbcOne,
        channel: channels.find(c => c.name.toLowerCase().includes('bbc one')) || {
          ...defaultLiveChannel,
          id: 'bbc-one-4k',
          name: 'BBC ONE (HD)',
          currentProgram: 'News at Ten',
          resolution: '4K 50fps'
        }
      },
      {
        id: 'live-espn',
        name: 'ESPN',
        program: 'NBA Today',
        badge: '4K',
        progress: 42,
        logo: ChannelLogos.espn,
        channel: channels.find(c => c.name.toLowerCase().includes('espn')) || {
          ...defaultLiveChannel,
          id: 'espn-4k',
          name: 'ESPN (HD)',
          currentProgram: 'NBA Today: Courtside Live',
          resolution: '4K 60fps'
        }
      },
      {
        id: 'live-bbc-channe',
        name: 'BBC Channe (HD)',
        program: 'NBA Today',
        badge: '4K',
        progress: 85,
        logo: ChannelLogos.bbcOne,
        channel: channels.find(c => c.name.toLowerCase().includes('bbc')) || {
          ...defaultLiveChannel,
          id: 'bbc-channe-hd',
          name: 'BBC Channel (HD)',
          currentProgram: 'NBA Today International',
          resolution: '4K'
        }
      },
      {
        id: 'live-sky-sports',
        name: 'Sky Sports F1',
        program: 'Grand Prix Qualifiers',
        badge: '4K',
        progress: 54,
        logo: ChannelLogos.skySports,
        channel: channels.find(c => c.name.toLowerCase().includes('sky')) || {
          ...defaultLiveChannel,
          id: 'sky-sports-f1',
          name: 'Sky Sports F1 (4K)',
          currentProgram: 'Grand Prix Qualifiers Live',
          resolution: '4K 60fps'
        }
      }
    ];
  }, [channels, defaultLiveChannel]);

  // 3. POPULAR ON DEMAND (matches wireframe: Barbie, Succession, Ahsoka with ★ 4.5 and runtime)
  const popularOnDemand: VodItem[] = React.useMemo(() => [
    {
      id: 'vod-barbie',
      title: 'Barbie',
      duration: '50m • 26me',
      rating: '4.5',
      category: 'Comedy • Adventure',
      posterUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=600&q=80',
      channelFallback: vodChannels[0] || {
        ...defaultLiveChannel,
        id: 'vod-barbie-movie',
        name: 'Barbie (2023)',
        streamType: 'vod'
      }
    },
    {
      id: 'vod-succession',
      title: 'Succession',
      duration: '50m • 1time',
      rating: '4.5',
      category: 'Drama • HBO Series',
      posterUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
      channelFallback: seriesChannels[0] || {
        ...defaultLiveChannel,
        id: 'vod-succession-series',
        name: 'Succession (Final Season)',
        streamType: 'series'
      }
    },
    {
      id: 'vod-ahsoka',
      title: 'Ahsoka',
      duration: '38m • 1.7time',
      rating: '4.5',
      category: 'Sci-Fi • Star Wars',
      posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      channelFallback: seriesChannels[1] || {
        ...defaultLiveChannel,
        id: 'vod-ahsoka-series',
        name: 'Star Wars: Ahsoka',
        streamType: 'series'
      }
    }
  ], [vodChannels, seriesChannels, defaultLiveChannel]);

  // 4. NEW RELEASES (matches wireframe: New Releases, Succession, New Releases with ★ 4.5 and duration)
  const newReleases: VodItem[] = React.useMemo(() => [
    {
      id: 'rel-1',
      title: 'New Releases',
      duration: '30m • 31me',
      rating: '4.5',
      category: 'Civil War • Action',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
      channelFallback: vodChannels[2] || {
        ...defaultLiveChannel,
        id: 'new-release-civilwar',
        name: 'Civil War (4K Master)',
        streamType: 'vod'
      }
    },
    {
      id: 'rel-2',
      title: 'Succession',
      duration: '50m • 2time',
      rating: '4.5',
      category: 'Drama • Season 4',
      posterUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
      channelFallback: seriesChannels[0] || {
        ...defaultLiveChannel,
        id: 'new-release-succession',
        name: 'Succession: S4 Finale',
        streamType: 'series'
      }
    },
    {
      id: 'rel-3',
      title: 'New Releases',
      duration: '50m • 1time',
      rating: '4.5',
      category: 'Fallout • Sci-Fi Series',
      posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
      channelFallback: seriesChannels[2] || {
        ...defaultLiveChannel,
        id: 'new-release-fallout',
        name: 'Fallout: S1 Premiere',
        streamType: 'series'
      }
    }
  ], [vodChannels, seriesChannels, defaultLiveChannel]);

  // 5. TV GUIDE TIMELINE MATRIX (matches wireframe: 00:00, 08:00, 09:00, 12:00 with itv, CNN, Discovery)
  const epgRows: EpgRow[] = React.useMemo(() => [
    {
      channelId: 'epg-itv',
      channelName: 'itv',
      logo: ChannelLogos.itv,
      channelObj: {
        ...defaultLiveChannel,
        id: 'channel-itv-1',
        name: 'ITV 1 (HD)',
        currentProgram: 'Schedule Program: Good Morning'
      },
      programs: [
        { title: 'Schedule Program', start: '00:00', end: '08:00', durationMinutes: 480, isCurrent: true, progress: 65 },
        { title: 'Schedulet Program', start: '08:00', end: '11:00', durationMinutes: 180 },
        { title: 'Progr', start: '11:00', end: '13:00', durationMinutes: 120 }
      ]
    },
    {
      channelId: 'epg-cnn',
      channelName: 'CNN',
      logo: ChannelLogos.cnn,
      channelObj: {
        ...defaultLiveChannel,
        id: 'channel-cnn-news',
        name: 'CNN International',
        currentProgram: 'CNN TV Shows'
      },
      programs: [
        { title: 'CNN TV Shows', start: '00:00', end: '07:30', durationMinutes: 450, isCurrent: true, progress: 80 },
        { title: 'News at Today', start: '07:30', end: '10:30', durationMinutes: 180 },
        { title: 'Program at mor', start: '10:30', end: '13:00', durationMinutes: 150 }
      ]
    },
    {
      channelId: 'epg-discovery',
      channelName: 'Discovery',
      logo: ChannelLogos.discovery,
      channelObj: {
        ...defaultLiveChannel,
        id: 'channel-discovery-hd',
        name: 'Discovery Channel HD',
        currentProgram: 'Reading Efro'
      },
      programs: [
        { title: 'Reading Efro', start: '00:00', end: '08:00', durationMinutes: 480, isCurrent: true, progress: 45 },
        { title: 'The filtlonost', start: '08:00', end: '11:30', durationMinutes: 210 },
        { title: 'Cone', start: '11:30', end: '13:00', durationMinutes: 90 }
      ]
    }
  ], [defaultLiveChannel]);

  const activeFeatured = featuredItems[activeCarouselIndex];

  return (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-[1600px] mx-auto pb-12 select-none">
      
      {/* 1. FEATURED CONTENT HERO CAROUSEL */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Featured content</span>
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <button
              onClick={() => {
                setIsAutoPlay(false);
                setActiveCarouselIndex(prev => (prev === 0 ? featuredItems.length - 1 : prev - 1));
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Previous featured"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsAutoPlay(false);
                setActiveCarouselIndex(prev => (prev + 1) % featuredItems.length);
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Next featured"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Slide Container */}
        <div 
          className="relative w-full aspect-[21/9] sm:aspect-[2.4/1] md:aspect-[2.6/1] rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 shadow-2xl group cursor-pointer"
          onClick={() => onSelectChannel(activeFeatured.channelFallback)}
        >
          {/* Backdrop Image */}
          <img
            src={activeFeatured.backdropUrl}
            alt={activeFeatured.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-[0.75]"
          />

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />

          {/* Slide Content Overlay */}
          <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end gap-3 z-10 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600/90 text-white font-black text-[11px] tracking-wider uppercase border border-blue-400/30 shadow-md">
                {activeFeatured.category}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/15 text-white font-extrabold text-[10px] tracking-widest border border-white/20">
                {activeFeatured.badge}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
              {activeFeatured.title}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 font-medium line-clamp-2 max-w-2xl drop-shadow">
              {activeFeatured.description}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectChannel(activeFeatured.channelFallback);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black font-extrabold text-sm shadow-xl hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Now</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateTab('channels');
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md border border-white/15 transition-all cursor-pointer"
              >
                <Tv className="w-4 h-4" />
                <span>All Live Channels</span>
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {featuredItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsAutoPlay(false);
                setActiveCarouselIndex(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeCarouselIndex === idx
                  ? 'w-6 bg-white'
                  : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. MIDDLE TWO-COLUMN GRID: LIVE CHANNELS NOW & POPULAR ON DEMAND */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: LIVE CHANNELS NOW */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>LIVE CHANNELS NOW</span>
            </h2>
            <button
              onClick={() => onNavigateTab('channels')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              See all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {liveChannelsNow.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectChannel(item.channel)}
                className="group relative bg-zinc-900/80 hover:bg-zinc-800/90 border border-white/10 hover:border-white/25 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5"
              >
                {/* Logo & Quality Badge */}
                <div className="flex items-center justify-between">
                  <div>{item.logo}</div>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold text-zinc-300 border border-white/15">
                    {item.badge}
                  </span>
                </div>

                {/* Channel & Program Info */}
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {item.program}
                  </p>
                </div>

                {/* Progress bar & Live indicator */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-red-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span>Live</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: POPULAR ON DEMAND */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">
              POPULAR ON DEMAND
            </h2>
            <button
              onClick={() => onNavigateTab('vod')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              See all
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {popularOnDemand.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectChannel(item.channelFallback)}
                className="group relative flex flex-col gap-2 cursor-pointer"
              >
                {/* Poster Artwork */}
                <div className="aspect-[16/10] sm:aspect-[16/11] rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 relative shadow-md group-hover:border-white/30 transition-all">
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  
                  {/* Floating Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <h4 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-0.5">
                    <span>{item.duration}</span>
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{item.rating}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* 3. BOTTOM TWO-COLUMN GRID: NEW RELEASES & TV GUIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: NEW RELEASES */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">
              NEW RELEASES
            </h2>
            <button
              onClick={() => onNavigateTab('series')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              See all
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {newReleases.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectChannel(item.channelFallback)}
                className="group relative flex flex-col gap-2 cursor-pointer"
              >
                {/* Poster Artwork */}
                <div className="aspect-[16/10] sm:aspect-[16/11] rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 relative shadow-md group-hover:border-white/30 transition-all">
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  
                  {/* Floating Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <h4 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-0.5">
                    <span>{item.duration}</span>
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{item.rating}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: TV GUIDE (INTERACTIVE TIMELINE MATRIX) */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>TV GUIDE</span>
            </h2>
            <button
              onClick={() => onNavigateTab('epg')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Full Guide
            </button>
          </div>

          {/* Interactive Guide Table */}
          <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-xl backdrop-blur-md overflow-x-auto">
            
            {/* Timeline Time Header */}
            <div className="grid grid-cols-[80px_1fr_1fr_1fr] items-center text-xs font-bold text-zinc-400 border-b border-white/10 pb-2 px-1">
              <span>Channel</span>
              <span className="text-center">00:00</span>
              <span className="text-center">08:00</span>
              <span className="text-center">12:00</span>
            </div>

            {/* Channels & Programme Blocks */}
            <div className="flex flex-col gap-2.5">
              {epgRows.map((row) => (
                <div 
                  key={row.channelId}
                  className="grid grid-cols-[80px_1fr] items-center gap-2.5 py-1"
                >
                  {/* Channel Logo */}
                  <div 
                    onClick={() => onSelectChannel(row.channelObj)}
                    className="cursor-pointer hover:opacity-80 transition-opacity flex items-center"
                    title={`Watch ${row.channelName}`}
                  >
                    {row.logo}
                  </div>

                  {/* Program timeline blocks */}
                  <div className="grid grid-cols-3 gap-1.5 w-full">
                    {row.programs.map((prog, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => onSelectChannel(row.channelObj)}
                        className={`group relative px-2.5 py-2 rounded-xl text-left cursor-pointer transition-all border ${
                          prog.isCurrent
                            ? 'bg-blue-600/20 border-blue-500/40 text-white shadow-sm hover:bg-blue-600/30'
                            : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'
                        }`}
                        title={`${prog.title} (${prog.start} - ${prog.end})`}
                      >
                        <p className="text-xs font-bold truncate">
                          {prog.title}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {prog.start} - {prog.end}
                        </p>

                        {/* Progress Highlight on Current Program */}
                        {prog.isCurrent && (
                          <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className="h-full bg-blue-400 rounded-full" 
                              style={{ width: `${prog.progress || 50}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

      </div>

    </div>
  );
}
