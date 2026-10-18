/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { Play, Star, Heart, Info, Trash2 } from 'lucide-react';

export interface MediaCardProps {
  title: string;
  subtitle?: string;
  poster?: string;
  rating?: string | number;
  badge?: string;
  duration?: string;
  progressPercent?: number;
  isFavorite?: boolean;
  onPlay?: () => void;
  onDetail?: () => void;
  onToggleFavorite?: () => void;
  onRemove?: () => void;
  aspectRatio?: 'poster' | 'video' | 'square';
  className?: string;
}

/** Deterministic hue from title for fallback avatar */
function getTitleHue(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) & 0xffff;
  }
  return hash % 360;
}

/** First 2 initials from title */
function getInitials(title: string): string {
  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function MediaCard({
  title,
  subtitle,
  poster,
  rating,
  badge,
  duration,
  progressPercent,
  isFavorite,
  onPlay,
  onDetail,
  onToggleFavorite,
  onRemove,
  aspectRatio = 'poster',
  className = ''
}: MediaCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const hue = getTitleHue(title);
  const initials = getInitials(title);

  const aspectClass =
    aspectRatio === 'poster'
      ? 'aspect-[2/3]'
      : aspectRatio === 'video'
      ? 'aspect-video'
      : 'aspect-square';

  return (
    <div
      className={`group relative flex flex-col rounded-2xl bg-[#11141c]/80 border border-[#1f2330] overflow-hidden hover:border-[#7c5cff]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#7c5cff]/15 hover:-translate-y-1 cursor-pointer select-none ${className}`}
      onClick={() => onPlay ? onPlay() : onDetail?.()}
    >
      {/* Media Image / Poster Container */}
      <div className={`relative w-full ${aspectClass} bg-[#0b0d14] overflow-hidden`}>
        {poster && !imageError ? (
          <img
            src={poster}
            alt={title}
            onError={() => setImageError(true)}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4 text-center font-bold"
            style={{
              background: `radial-gradient(circle at 50% 30%, hsl(${hue}, 65%, 25%), hsl(${hue}, 80%, 10%))`
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg ring-1 ring-white/20 mb-2"
              style={{ backgroundColor: `hsl(${hue}, 70%, 40%)` }}
            >
              {initials}
            </div>
            <span className="text-xs text-white/80 line-clamp-2 px-2">{title}</span>
          </div>
        )}

        {/* Ambient Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06070b] via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          {rating ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-amber-300 text-[11px] font-bold shadow-sm">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
            </div>
          ) : badge ? (
            <div className="px-2 py-0.5 rounded-lg bg-[#7c5cff]/90 backdrop-blur-md text-white text-[10px] font-bold tracking-wide uppercase shadow-sm">
              {badge}
            </div>
          ) : <div />}

          {/* Action buttons (Favorite / Remove) */}
          <div className="flex items-center gap-1 pointer-events-auto">
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="w-7 h-7 rounded-lg bg-black/70 hover:bg-red-500/80 text-white/80 hover:text-white flex items-center justify-center transition-colors backdrop-blur-md border border-white/10"
                title="Remove from history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={`w-7 h-7 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors ${
                  isFavorite
                    ? 'text-red-400 fill-red-400 bg-red-500/20 border-red-500/40'
                    : 'text-white/70 hover:text-white hover:bg-white/20'
                }`}
                title={isFavorite ? 'Remove from My List' : 'Save to My List'}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Hover Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#7c5cff] to-[#00e0c6] flex items-center justify-center text-white shadow-lg shadow-[#7c5cff]/40 transform group-hover:scale-110 transition-transform duration-200">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Progress Bar for Continue Watching */}
        {progressPercent !== undefined && progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60 z-10">
            <div
              className="h-full bg-gradient-to-r from-[#7c5cff] to-[#00e0c6]"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        )}
      </div>

      {/* Info Block */}
      <div className="p-3 flex flex-col justify-between flex-1">
        <div>
          <h4 className="text-sm font-semibold text-[#eef0f6] group-hover:text-white line-clamp-1 leading-snug">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[11px] text-[#9aa0b3] mt-0.5 line-clamp-1">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#6b7180] mt-2 pt-1 border-t border-white/5">
          {duration && <span>{duration}</span>}
          {onDetail && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDetail();
              }}
              className="ml-auto flex items-center gap-1 text-[11px] text-[#00e0c6] hover:underline"
            >
              <Info className="w-3 h-3" />
              <span>Details</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MediaCard;
