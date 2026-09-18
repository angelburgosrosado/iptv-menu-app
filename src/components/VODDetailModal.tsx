import * as React from 'react';
import { X, Play, Star, Calendar, Info } from 'lucide-react';
import { Channel } from '../types/iptv';
import { fetchTmdbMetadata, TmdbResult } from '../utils/tmdbService';
import { usePlayerStore } from '../store/usePlayerStore';

interface VODDetailModalProps {
  channel: Channel;
  onClose: () => void;
  onPlay: (channel: Channel) => void;
}

export function VODDetailModal({ channel, onClose, onPlay }: VODDetailModalProps) {
  const { tmdbApiKey } = usePlayerStore();
  const [metadata, setMetadata] = React.useState<TmdbResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const isSeries = channel.category?.toLowerCase().includes('series') || channel.group?.toLowerCase().includes('series');
    
    fetchTmdbMetadata(channel.name, tmdbApiKey, isSeries ? 'tv' : 'movie')
      .then(res => {
        setMetadata(res);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [channel, tmdbApiKey]);

  const bgImage = metadata?.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${metadata.backdrop_path}` 
    : channel.logo || '';
    
  const posterImage = metadata?.poster_path 
    ? `https://image.tmdb.org/t/p/w500${metadata.poster_path}` 
    : channel.logo || '';

  const title = metadata?.title || metadata?.name || channel.name;
  const releaseDate = metadata?.release_date || metadata?.first_air_date;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-8 animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row min-h-[400px]">
        
        {/* Background Blur Overlay */}
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${bgImage})`, filter: 'blur(40px)' }}
        />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Poster Column */}
        <div className="relative z-10 w-full md:w-1/3 flex items-center justify-center p-6 bg-black/40">
          {posterImage ? (
            <img 
              src={posterImage} 
              alt={title} 
              className="w-full max-w-[240px] rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/10"
            />
          ) : (
            <div className="w-full max-w-[240px] aspect-[2/3] bg-zinc-900 rounded-xl border border-white/10 flex items-center justify-center text-zinc-600">
              <Info className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Content Column */}
        <div className="relative z-10 w-full md:w-2/3 p-6 md:p-10 flex flex-col justify-center">
          {isLoading ? (
            <div className="animate-pulse flex flex-col gap-4">
              <div className="h-8 bg-white/10 rounded w-2/3"></div>
              <div className="h-4 bg-white/10 rounded w-1/4"></div>
              <div className="h-24 bg-white/10 rounded w-full mt-4"></div>
              <div className="h-12 bg-white/10 rounded w-32 mt-6"></div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-2">
                {title}
              </h2>
              
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-400 mb-6">
                {releaseDate && (
                  <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md">
                    <Calendar className="w-4 h-4 text-zinc-500" />
                    {releaseDate.substring(0, 4)}
                  </span>
                )}
                {metadata?.vote_average ? (
                  <span className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-2.5 py-1 rounded-md">
                    <Star className="w-4 h-4 fill-current" />
                    {metadata.vote_average.toFixed(1)}
                  </span>
                ) : null}
                <span className="bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-md border border-cyan-500/20">
                  {channel.group || 'VOD'}
                </span>
              </div>

              <p className="text-zinc-300 text-sm md:text-base leading-relaxed max-w-2xl mb-8 line-clamp-5">
                {metadata?.overview || "No synopsis available for this title. It may be a live event, a niche release, or not indexed in the global database."}
              </p>

              <div className="mt-auto pt-4 border-t border-white/5 flex gap-4">
                <button
                  onClick={() => {
                    onPlay(channel);
                    onClose();
                  }}
                  className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Play Now
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
