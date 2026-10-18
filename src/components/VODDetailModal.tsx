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
      <div className="relative w-full max-w-5xl bg-[#0b0d14]/95 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-white/10 flex flex-col md:flex-row min-h-[420px]">
        
        {/* Background Blur Overlay */}
        <div 
          className="absolute inset-0 opacity-25 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${bgImage})`, filter: 'blur(50px)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#06070b] via-[#06070b]/80 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 bg-black/60 hover:bg-white/20 border border-white/10 rounded-full text-zinc-300 hover:text-white transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Poster Column */}
        <div className="relative z-10 w-full md:w-1/3 flex items-center justify-center p-6 bg-black/30">
          {posterImage ? (
            <img 
              src={posterImage} 
              alt={title} 
              className="w-full max-w-[240px] aspect-[2/3] object-cover rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-white/10"
            />
          ) : (
            <div className="w-full max-w-[240px] aspect-[2/3] bg-zinc-900 rounded-2xl border border-white/10 flex items-center justify-center text-zinc-600">
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
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
                {title}
              </h2>
              
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-300 mb-6">
                {releaseDate && (
                  <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    {releaseDate.substring(0, 4)}
                  </span>
                )}
                {metadata?.vote_average ? (
                  <span className="flex items-center gap-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {metadata.vote_average.toFixed(1)}
                  </span>
                ) : null}
                <span className="bg-[#7c5cff]/15 text-[#a78bfa] px-2.5 py-1 rounded-lg border border-[#7c5cff]/30 font-bold uppercase tracking-wider text-[11px]">
                  {channel.group || 'VOD Cinema'}
                </span>
              </div>

              <p className="text-zinc-300 text-sm md:text-base leading-relaxed max-w-2xl mb-8 line-clamp-5">
                {metadata?.overview || "No synopsis available for this title. It may be a live event, a niche release, or not indexed in the global database."}
              </p>

              <div className="mt-auto pt-4 border-t border-white/10 flex gap-4">
                <button
                  onClick={() => {
                    onPlay(channel);
                    onClose();
                  }}
                  className="flex items-center gap-2.5 bg-gradient-to-r from-[#7c5cff] to-[#00e0c6] hover:brightness-110 text-black font-black px-8 py-3.5 rounded-xl transition-all shadow-[0_4px_25px_rgba(124,92,255,0.4)] hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Play Now</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
