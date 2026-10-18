/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { Play, Heart, Radio, Tv } from 'lucide-react';
import { Channel } from '../types/iptv';

interface LiveChannelTileProps {
  channel: Channel;
  currentProgram?: {
    title: string;
    start?: string;
    end?: string;
    progressPercent?: number;
    minutesRemaining?: number;
  };
  isFavorite?: boolean;
  onPlay: (channel: Channel) => void;
  onToggleFavorite?: (channel: Channel) => void;
  className?: string;
}

export function LiveChannelTile({
  channel,
  currentProgram,
  isFavorite,
  onPlay,
  onToggleFavorite,
  className = ''
}: LiveChannelTileProps) {
  const [logoError, setLogoError] = React.useState(false);

  // Compute dummy progress if not provided but program exists
  const progress = currentProgram?.progressPercent ?? 45;
  const programTitle = currentProgram?.title || 'Live Broadcast';
  const remaining = currentProgram?.minutesRemaining ?? 30;

  return (
    <div
      onClick={() => onPlay(channel)}
      className={`group relative flex flex-col justify-between w-[280px] sm:w-[320px] shrink-0 rounded-2xl bg-[#11141c]/90 border border-[#1f2330] p-3.5 hover:border-[#7c5cff]/60 hover:bg-[#181c27] transition-all duration-300 hover:shadow-xl hover:shadow-[#7c5cff]/15 cursor-pointer select-none ${className}`}
    >
      {/* Top Header: Channel Logo / Name / Live Dot */}
      <div className="flex items-start gap-3">
        {/* Logo / Thumbnail Box */}
        <div className="relative w-12 h-12 rounded-xl bg-[#06070b] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
          {channel.logo && !logoError ? (
            <img
              src={channel.logo}
              alt={channel.name}
              onError={() => setLogoError(true)}
              loading="lazy"
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7c5cff]/30 to-[#00e0c6]/20 text-[#00e0c6] font-black text-sm">
              <Tv className="w-5 h-5 text-white/80" />
            </div>
          )}

          {/* Quick Play Hover Indicator */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-5 h-5 fill-[#00e0c6] text-[#00e0c6]" />
          </div>
        </div>

        {/* Channel Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm font-bold text-[#eef0f6] group-hover:text-white truncate">
              {channel.name}
            </h4>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e] text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              LIVE
            </span>
            {channel.category && (
              <span className="text-[11px] text-[#9aa0b3] truncate">
                {channel.category}
              </span>
            )}
          </div>
        </div>

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(channel);
            }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors border ${
              isFavorite
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-white/5 border-white/5 text-[#6b7180] hover:text-white hover:bg-white/10'
            }`}
            title={isFavorite ? 'Remove from My List' : 'Add to My List'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Program Schedule & Progress Bar */}
      <div className="mt-3 pt-2.5 border-t border-white/5">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-[#eef0f6] font-medium truncate pr-2">
            {programTitle}
          </span>
          <span className="text-[11px] text-[#9aa0b3] whitespace-nowrap shrink-0">
            {remaining}m left
          </span>
        </div>

        {/* EPG Progress Bar */}
        <div className="relative w-full h-1.5 bg-[#06070b] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#7c5cff] to-[#00e0c6] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default LiveChannelTile;
