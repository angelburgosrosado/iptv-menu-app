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
  Film, 
  Clapperboard, 
  Check, 
  Info,
  Heart,
  TrendingUp,
  History,
  Layers,
  Radio,
  Sliders,
  ShieldCheck,
  Download,
  Smartphone
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { usePlayerStore } from '../store/usePlayerStore';
import { DEMO_FAST_CHANNELS } from '../data/demoChannels';
import HorizontalShelfScroll from './HorizontalShelfScroll';
import LiveChannelTile from './LiveChannelTile';
import MediaCard from './MediaCard';

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
  rating?: string;
  duration?: string;
  channelFallback: Channel;
}

export default function DesktopHome({ onSelectChannel, onNavigateTab }: DesktopHomeProps) {
  const { 
    channels, 
    vodChannels, 
    seriesChannels, 
    favorites, 
    toggleFavorite,
    watchHistory,
    removeFromWatchHistory
  } = usePlayerStore();

  const [activeCarouselIndex, setActiveCarouselIndex] = React.useState(0);
  const [isAutoPlay, setIsAutoPlay] = React.useState(true);

  // Fallback demo channel if user has no playlists yet
  const defaultLiveChannel: Channel = channels[0] || DEMO_FAST_CHANNELS[0];

  // 1. Featured Spotlight Carousel items
  const featuredItems: FeaturedItem[] = React.useMemo(() => [
    {
      id: 'featured-1',
      title: 'LIVE FOOTBALL: Man City vs Arsenal',
      category: 'Premier League Super Sunday',
      badge: '4K LIVE',
      subTitle: 'Match of the Season • Etihad Stadium',
      description: 'Title decider clash streaming live in Ultra HD 60fps with spatial multi-audio and high bitrate HLS.',
      backdropUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80',
      rating: '9.8',
      duration: 'Live Now',
      channelFallback: channels.find(c => c.category?.toLowerCase().includes('sport') || c.name.toLowerCase().includes('sport')) || {
        ...defaultLiveChannel,
        id: 'sky-sports-premier-league',
        name: 'Sky Sports Premier League (4K)',
        currentProgram: 'LIVE FOOTBALL: Man City vs Arsenal',
        category: 'Sports',
        resolution: '4K Ultra HD'
      }
    },
    {
      id: 'featured-2',
      title: 'Dune: Part Two',
      category: 'Blockbuster Sci-Fi Cinema',
      badge: '4K HDR',
      subTitle: 'IMAX Enhanced • Dolby Atmos',
      description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
      rating: '8.6',
      duration: '2h 46m',
      channelFallback: vodChannels[0] || {
        ...defaultLiveChannel,
        id: 'dune-part-two',
        name: 'Dune: Part Two (2024)',
        category: 'Movies',
        streamType: 'vod',
        resolution: '4K Ultra HD'
      }
    },
    {
      id: 'featured-3',
      title: 'Loki - Season 2',
      category: 'Marvel Cinematic Universe',
      badge: '4K UHD',
      subTitle: 'Glorious Purpose • Master Audio',
      description: 'Loki and Mobius journey through fractured timelines to preserve reality before the Temporal Loom collapses.',
      backdropUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
      rating: '8.7',
      duration: '6 Episodes',
      channelFallback: seriesChannels[0] || {
        ...defaultLiveChannel,
        id: 'loki-s2',
        name: 'Loki - Season 2',
        category: 'Series',
        streamType: 'series',
        resolution: '4K HDR'
      }
    },
    {
      id: 'featured-4',
      title: 'UEFA Champions League Final',
      category: 'European Football Championship',
      badge: '4K 60FPS',
      subTitle: 'Wembley Stadium • Live Broadcast',
      description: 'The pinnacle of European club football live with tactical view options and crystal clear surround sound.',
      backdropUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1600&q=80',
      rating: '9.9',
      duration: 'Live Now',
      channelFallback: {
        ...defaultLiveChannel,
        id: 'tnt-sports-ultimate',
        name: 'TNT Sports Ultimate 4K',
        currentProgram: 'UEFA Champions League Final Live',
        category: 'Sports',
        resolution: '4K 60fps'
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

  const activeFeatured = featuredItems[activeCarouselIndex] || featuredItems[0];
  const isFeaturedInFavorites = favorites.includes(activeFeatured.channelFallback.id);

  // Live Channels list for trending shelf
  const liveChannelsList = React.useMemo(() => {
    const live = channels.filter(c => !c.streamType || c.streamType === 'live');
    return live.length > 0 ? live.slice(0, 16) : DEMO_FAST_CHANNELS;
  }, [channels]);

  // Movies list for trending movies shelf
  const moviesList = React.useMemo(() => {
    if (vodChannels.length > 0) return vodChannels.slice(0, 14);
    return [
      {
        id: 'vod-1',
        name: 'Dune: Part Two',
        category: 'Sci-Fi / Adventure',
        rating: 8.6,
        year: '2024',
        poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        url: defaultLiveChannel.url,
        streamType: 'vod' as const
      },
      {
        id: 'vod-2',
        name: 'Oppenheimer',
        category: 'Biography / Drama',
        rating: 8.9,
        year: '2023',
        poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80',
        url: defaultLiveChannel.url,
        streamType: 'vod' as const
      },
      {
        id: 'vod-3',
        name: 'Cyberpunk Edgerunners',
        category: 'Sci-Fi / Action',
        rating: 8.3,
        year: '2023',
        poster: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
        url: defaultLiveChannel.url,
        streamType: 'vod' as const
      },
      {
        id: 'vod-4',
        name: 'Interstellar (Extended)',
        category: 'Sci-Fi / Adventure',
        rating: 8.7,
        year: '2014',
        poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
        url: defaultLiveChannel.url,
        streamType: 'vod' as const
      },
      {
        id: 'vod-5',
        name: 'Blade Runner 2049',
        category: 'Sci-Fi / Mystery',
        rating: 8.0,
        year: '2017',
        poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        url: defaultLiveChannel.url,
        streamType: 'vod' as const
      },
      {
        id: 'vod-6',
        name: 'Spider-Man: Across the Spider-Verse',
        category: 'Animation / Action',
        rating: 8.7,
        year: '2023',
        poster: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=600&q=80',
        url: defaultLiveChannel.url,
        streamType: 'vod' as const
      }
    ];
  }, [vodChannels, defaultLiveChannel]);

  // Series list for series shelf
  const seriesList = React.useMemo(() => {
    if (seriesChannels.length > 0) return seriesChannels.slice(0, 14);
    return [
      {
        id: 'ser-1',
        name: 'Loki',
        category: 'Marvel Universe',
        rating: 8.7,
        seasons: '2 Seasons',
        poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
        url: defaultLiveChannel.url,
        streamType: 'series' as const
      },
      {
        id: 'ser-2',
        name: 'The Last of Us',
        category: 'Drama / Sci-Fi',
        rating: 8.8,
        seasons: '1 Season',
        poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        url: defaultLiveChannel.url,
        streamType: 'series' as const
      },
      {
        id: 'ser-3',
        name: 'House of the Dragon',
        category: 'Fantasy / Drama',
        rating: 8.4,
        seasons: '2 Seasons',
        poster: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=600&q=80',
        url: defaultLiveChannel.url,
        streamType: 'series' as const
      },
      {
        id: 'ser-4',
        name: 'Severance',
        category: 'Sci-Fi / Thriller',
        rating: 8.7,
        seasons: '2 Seasons',
        poster: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
        url: defaultLiveChannel.url,
        streamType: 'series' as const
      }
    ];
  }, [seriesChannels, defaultLiveChannel]);

  // Continue watching items (from watchHistory or simulated)
  const continueWatchingItems = React.useMemo(() => {
    if (watchHistory && watchHistory.length > 0) {
      return watchHistory.slice(0, 10).map((h) => ({
        id: h.channelId || h.id,
        title: h.channelName || h.name || 'Stream Playback',
        subtitle: h.category || 'Last watched',
        poster: h.logo || h.poster,
        duration: h.duration ? `${Math.round(h.duration / 60)}m` : 'Paused',
        progress: h.progress || (h.currentTime && h.duration ? Math.round((h.currentTime / h.duration) * 100) : 40),
        channelObj: channels.find(c => c.id === (h.channelId || h.id)) || {
          ...defaultLiveChannel,
          id: h.channelId || h.id,
          name: h.channelName || h.name,
          url: h.url || defaultLiveChannel.url
        }
      }));
    }
    // Default simulated shelf when user opens
    return [
      {
        id: 'cw-1',
        title: 'Sky Sports Premier League (4K)',
        subtitle: 'Man City vs Arsenal',
        poster: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
        duration: '65m left',
        progress: 72,
        channelObj: defaultLiveChannel
      },
      {
        id: 'cw-2',
        title: 'Dune: Part Two',
        subtitle: 'Movie • 1h 14m left',
        poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        duration: '1h 14m left',
        progress: 54,
        channelObj: defaultLiveChannel
      }
    ];
  }, [watchHistory, channels, defaultLiveChannel]);

  return (
    <div className="flex flex-col gap-6 pb-16">
      
      {/* 1. FEATURED CINEMATIC SPOTLIGHT HERO (Streamly Hero) */}
      <div 
        className="relative mx-4 sm:mx-6 rounded-3xl overflow-hidden min-h-[380px] sm:min-h-[460px] flex flex-col justify-end p-6 sm:p-12 border border-white/10 shadow-2xl group transition-all"
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
      >
        {/* Backdrop Image with Smooth Fade */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-100 group-hover:scale-102"
          style={{ backgroundImage: `url(${activeFeatured.backdropUrl})` }}
        />

        {/* Cinematic Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06070b] via-[#06070b]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06070b] via-[#06070b]/70 to-transparent" />

        {/* Content Box */}
        <div className="relative z-10 max-w-2xl flex flex-col gap-3">
          
          {/* Eyebrow / Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-[#7c5cff] text-white text-xs font-black tracking-wider uppercase shadow-md shadow-[#7c5cff]/30">
              {activeFeatured.badge}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[#00e0c6] text-xs font-bold uppercase tracking-wide">
              {activeFeatured.category}
            </span>
            {activeFeatured.rating && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-amber-300 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{activeFeatured.rating}</span>
              </span>
            )}
            {activeFeatured.duration && (
              <span className="text-xs text-[#9aa0b3] font-medium">
                {activeFeatured.duration}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md leading-tight">
            {activeFeatured.title}
          </h1>

          {/* Subtitle & Description */}
          <p className="text-sm sm:text-base font-semibold text-[#00e0c6] drop-shadow">
            {activeFeatured.subTitle}
          </p>
          <p className="text-xs sm:text-sm text-[#9aa0b3] line-clamp-2 max-w-xl leading-relaxed">
            {activeFeatured.description}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <button
              type="button"
              onClick={() => onSelectChannel(activeFeatured.channelFallback)}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7c5cff] to-[#00e0c6] text-white font-bold text-sm shadow-lg shadow-[#7c5cff]/30 hover:opacity-95 hover:scale-102 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Watch Now</span>
            </button>

            <button
              type="button"
              onClick={() => toggleFavorite(activeFeatured.channelFallback.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl backdrop-blur-xl border text-sm font-semibold transition-all cursor-pointer ${
                isFeaturedInFavorites
                  ? 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30'
                  : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFeaturedInFavorites ? 'fill-current text-red-400' : ''}`} />
              <span>{isFeaturedInFavorites ? 'Saved in My List' : '+ My List'}</span>
            </button>
          </div>
        </div>

        {/* Carousel Indicators / Navigation */}
        <div className="absolute bottom-6 right-6 sm:right-12 z-10 flex items-center gap-2">
          {featuredItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActiveCarouselIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === activeCarouselIndex
                  ? 'w-8 bg-[#00e0c6] shadow-sm shadow-[#00e0c6]/50'
                  : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 2. LIBRARY OVERVIEW STATS (Streamly Quick Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mx-4 sm:mx-6">
        <div 
          onClick={() => onNavigateTab('channels')}
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#11141c]/80 border border-[#1f2330] hover:border-[#7c5cff]/50 transition-all cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-xl bg-[#7c5cff]/15 border border-[#7c5cff]/30 flex items-center justify-center text-[#7c5cff] group-hover:scale-105 transition-transform">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{channels.length || 240}</div>
            <div className="text-xs text-[#9aa0b3]">Live Channels</div>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('vod')}
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#11141c]/80 border border-[#1f2330] hover:border-[#00e0c6]/50 transition-all cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-xl bg-[#00e0c6]/15 border border-[#00e0c6]/30 flex items-center justify-center text-[#00e0c6] group-hover:scale-105 transition-transform">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{vodChannels.length || 1850}</div>
            <div className="text-xs text-[#9aa0b3]">Movies & Cinema</div>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('series')}
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#11141c]/80 border border-[#1f2330] hover:border-[#7c5cff]/50 transition-all cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-xl bg-[#7c5cff]/15 border border-[#7c5cff]/30 flex items-center justify-center text-[#7c5cff] group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{seriesChannels.length || 420}</div>
            <div className="text-xs text-[#9aa0b3]">TV Series</div>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('epg')}
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#11141c]/80 border border-[#1f2330] hover:border-[#22c55e]/50 transition-all cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e] group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">EPG Live</div>
            <div className="text-xs text-[#22c55e] flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              Synced & Active
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONTINUE WATCHING SHELF (Streamly Shelf) */}
      {continueWatchingItems.length > 0 && (
        <HorizontalShelfScroll
          title="Continue Watching"
          subtitle="Pick up right where you left off"
          icon={<History className="w-5 h-5 text-[#00e0c6]" />}
          onSeeAll={() => onNavigateTab('favorites')}
        >
          {continueWatchingItems.map((item) => (
            <div key={item.id} className="w-[240px] shrink-0">
              <MediaCard
                title={item.title}
                subtitle={item.subtitle}
                poster={item.poster}
                duration={item.duration}
                progressPercent={item.progress}
                aspectRatio="video"
                onPlay={() => onSelectChannel(item.channelObj)}
                onRemove={() => removeFromWatchHistory?.(item.id)}
              />
            </div>
          ))}
        </HorizontalShelfScroll>
      )}

      {/* 4. TRENDING ON LIVE TV SHELF (Streamly Category Shelf) */}
      <HorizontalShelfScroll
        title="Trending on Live TV"
        subtitle="Most watched channels and live events airing right now"
        icon={<Flame className="w-5 h-5 text-amber-400" />}
        badge="POPULAR"
        onSeeAll={() => onNavigateTab('channels')}
      >
        {liveChannelsList.map((ch) => (
          <LiveChannelTile
            key={ch.id}
            channel={ch}
            isFavorite={favorites.includes(ch.id)}
            currentProgram={{
              title: ch.currentProgram || 'Live HD Stream',
              progressPercent: Math.floor(25 + ((ch.name.length * 11) % 65)),
              minutesRemaining: Math.floor(15 + ((ch.name.length * 7) % 55))
            }}
            onPlay={(selected) => onSelectChannel(selected)}
            onToggleFavorite={(selected) => toggleFavorite(selected.id)}
          />
        ))}
      </HorizontalShelfScroll>

      {/* 5. TOP RATED MOVIES (Streamly Poster Shelf) */}
      <HorizontalShelfScroll
        title="Top Rated Movies"
        subtitle="Cinematic blockbusters and award-winning titles"
        icon={<Clapperboard className="w-5 h-5 text-[#7c5cff]" />}
        onSeeAll={() => onNavigateTab('vod')}
      >
        {moviesList.map((mov) => {
          const chObj: Channel = {
            ...defaultLiveChannel,
            id: mov.id,
            name: mov.name,
            category: mov.category,
            streamType: 'vod',
            logo: (mov as any).poster
          };
          return (
            <div key={mov.id} className="w-[160px] sm:w-[180px] shrink-0">
              <MediaCard
                title={mov.name}
                subtitle={mov.category}
                poster={(mov as any).poster}
                rating={(mov as any).rating}
                badge={(mov as any).year}
                aspectRatio="poster"
                isFavorite={favorites.includes(mov.id)}
                onPlay={() => onSelectChannel(chObj)}
                onToggleFavorite={() => toggleFavorite(mov.id)}
              />
            </div>
          );
        })}
      </HorizontalShelfScroll>

      {/* 6. POPULAR TV SERIES (Streamly Series Shelf) */}
      <HorizontalShelfScroll
        title="Popular TV Series"
        subtitle="Binge-worthy shows, dramas and complete seasons"
        icon={<Film className="w-5 h-5 text-[#00e0c6]" />}
        onSeeAll={() => onNavigateTab('series')}
      >
        {seriesList.map((ser) => {
          const chObj: Channel = {
            ...defaultLiveChannel,
            id: ser.id,
            name: ser.name,
            category: ser.category,
            streamType: 'series',
            logo: (ser as any).poster
          };
          return (
            <div key={ser.id} className="w-[160px] sm:w-[180px] shrink-0">
              <MediaCard
                title={ser.name}
                subtitle={ser.category}
                poster={(ser as any).poster}
                rating={(ser as any).rating}
                badge={(ser as any).seasons}
                aspectRatio="poster"
                isFavorite={favorites.includes(ser.id)}
                onPlay={() => onSelectChannel(chObj)}
                onToggleFavorite={() => toggleFavorite(ser.id)}
              />
            </div>
          );
        })}
      </HorizontalShelfScroll>

      {/* 7. BIG SCREEN & MOBILE DOWNLOAD PROMO BANNER */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#11141c] via-[#161a26] to-[#0f111a] border border-[#1f2330] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#7c5cff]/20 text-[#00e0c6] text-xs font-bold">
            <Tv className="w-3.5 h-3.5" />
            <span>Watch Anywhere</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Take IPTV.Menu Pro to Your TV & Mobile
          </h3>
          <p className="text-sm text-[#9aa0b3]">
            Sideload directly onto Amazon Fire TV and Android TV with Downloader code <span className="font-mono font-bold text-white px-1.5 py-0.5 rounded bg-white/10">3739589</span>, or install on Android & iOS.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('downloads')}
          className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7c5cff] to-[#00e0c6] text-white font-bold text-sm shadow-lg shadow-[#7c5cff]/30 hover:opacity-95 transition-all cursor-pointer group"
        >
          <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          <span>Get the App</span>
        </button>
      </div>

    </div>
  );
}
