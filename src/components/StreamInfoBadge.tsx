/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, Wifi, Radio, Zap, ShieldCheck } from 'lucide-react';
import { getCountryFlag, getCountryName } from '../utils/channelEnrichment';

interface StreamInfoBadgeProps {
  resolution?: string;
  bitrate?: string;
  fps?: number;
  codec?: string;
  countryCode?: string;
  countryName?: string;
  countryFlag?: string;
  streamType?: 'live' | 'vod' | 'series';
  directSource?: 'm3u' | 'xtream' | 'stalker';
  healthStatus?: 'online' | 'degraded' | 'blocked' | 'offline';
  className?: string;
  showBitrate?: boolean;
  showCountry?: boolean;
}

export function StreamResolutionBadge({ 
  resolution, 
  className = '' 
}: { 
  resolution?: string; 
  className?: string;
}) {
  if (!resolution) return null;
  const res = resolution.toUpperCase();

  const is4K = res.includes('4K') || res.includes('UHD') || res.includes('2160');
  const is1080 = res.includes('1080') || res.includes('FHD');
  const is60Fps = res.includes('60') || res.includes('60FPS');
  const is720 = res.includes('720') || res.includes('HD');

  let styleClasses = 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60';
  let label = resolution;

  if (is4K) {
    styleClasses = 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10';
    label = resolution.includes('Ultra') ? resolution : '4K UHD';
  } else if (is1080) {
    styleClasses = 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/10';
    label = is60Fps ? '1080p 60fps' : '1080p FHD';
  } else if (is720) {
    styleClasses = 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    label = '720p HD';
  }

  return (
    <span className={`inline-flex items-center gap-1 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-md border tracking-wide uppercase backdrop-blur-md ${styleClasses} ${className}`}>
      {is4K && <Zap className="w-2.5 h-2.5 text-amber-400 fill-current" />}
      <span>{label}</span>
    </span>
  );
}

export function StreamBitrateBadge({ 
  bitrate,
  fps,
  className = '' 
}: { 
  bitrate?: string; 
  fps?: number;
  className?: string;
}) {
  if (!bitrate && !fps) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold tracking-tight ${className}`}>
      <Activity className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
      <span>{bitrate || (fps ? `${fps} FPS` : '')}</span>
    </span>
  );
}

export function StreamCountryBadge({
  countryCode,
  countryName,
  countryFlag,
  className = ''
}: {
  countryCode?: string;
  countryName?: string;
  countryFlag?: string;
  className?: string;
}) {
  if (!countryCode && !countryName && !countryFlag) return null;

  const flag = countryFlag || (countryCode ? getCountryFlag(countryCode) : '🌐');
  const name = countryName || (countryCode ? getCountryName(countryCode) : countryCode);

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/[0.04] text-zinc-300 border border-white/10 text-[9px] font-medium truncate max-w-[120px] ${className}`}>
      <span className="text-[11px] leading-none shrink-0">{flag}</span>
      <span className="truncate">{name}</span>
    </span>
  );
}

export function StreamLiveIndicator({
  streamType,
  healthStatus,
  className = ''
}: {
  streamType?: 'live' | 'vod' | 'series';
  healthStatus?: 'online' | 'degraded' | 'blocked' | 'offline';
  className?: string;
}) {
  if (streamType === 'vod') {
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[9px] font-black uppercase tracking-wider ${className}`}>
        VOD
      </span>
    );
  }

  if (streamType === 'series') {
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[9px] font-black uppercase tracking-wider ${className}`}>
        SERIES
      </span>
    );
  }

  // Live TV stream
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-black tracking-wider uppercase ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        healthStatus === 'blocked' ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
      }`} />
      <span>LIVE</span>
    </span>
  );
}

export function StreamTechRibbon({
  resolution,
  bitrate,
  fps,
  codec,
  countryCode,
  countryName,
  countryFlag,
  directSource,
  className = ''
}: StreamInfoBadgeProps) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <StreamResolutionBadge resolution={resolution} />
      <StreamBitrateBadge bitrate={bitrate} fps={fps} />
      {codec && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[9px] font-mono font-bold uppercase">
          {codec}
        </span>
      )}
      <StreamCountryBadge 
        countryCode={countryCode} 
        countryName={countryName} 
        countryFlag={countryFlag} 
      />
      {directSource && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-mono font-bold uppercase">
          {directSource === 'xtream' ? 'XTREAM' : directSource === 'stalker' ? 'STALKER' : 'HLS'}
        </span>
      )}
    </div>
  );
}
