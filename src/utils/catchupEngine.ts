/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Channel } from '../types/iptv';

export interface CatchupBuildOptions {
  serverTimezone?: string;
  xtreamAccount?: {
    serverUrl: string;
    username: string;
    password: string;
  };
}

export interface CatchupMetadata {
  isSupported: boolean;
  type: 'xtream' | 'flussonic' | 'template' | 'append' | 'shift' | 'generic';
  maxDays: number;
  isExpired: boolean;
  formattedAge: string;
}

/**
 * Checks if a channel supports catch-up / timeshift archive replay.
 */
export function isCatchupSupported(channel: Channel): boolean {
  if (!channel) return false;

  // 1. Explicit M3U catchup tags
  if (channel.catchup && channel.catchup !== 'default') return true;
  if (channel.catchupSource) return true;
  if (channel.catchupDays && channel.catchupDays > 0) return true;
  if (channel.tvArchive === true || (channel.tvArchiveDuration && channel.tvArchiveDuration > 0)) return true;

  // 2. Xtream Codes streams (almost all Xtream live streams support /timeshift/)
  if (channel.directSource === 'xtream' || channel.metadataSource === 'xtream') return true;
  if (/\/live\/[^/]+\/[^/]+\/\d+/i.test(channel.url || '')) return true;

  return false;
}

/**
 * Converts a date or timestamp into normalized time segments in a target timezone.
 */
export function getNormalizedTimeParts(
  dateInput: Date | string | number,
  timezone?: string
): {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
  epochSeconds: number;
} {
  let d: Date;
  if (dateInput instanceof Date) {
    d = dateInput;
  } else if (typeof dateInput === 'number') {
    d = new Date(dateInput < 1e11 ? dateInput * 1000 : dateInput);
  } else {
    const parsed = Date.parse(dateInput);
    d = isNaN(parsed) ? new Date() : new Date(parsed);
  }

  const epochSeconds = Math.floor(d.getTime() / 1000);

  // If no specific timezone, or local timezone
  if (!timezone || timezone === 'local') {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      year: d.getFullYear().toString(),
      month: pad(d.getMonth() + 1),
      day: pad(d.getDate()),
      hour: pad(d.getHours()),
      minute: pad(d.getMinutes()),
      second: pad(d.getSeconds()),
      epochSeconds
    };
  }

  // Use Intl.DateTimeFormat for exact target timezone conversion
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(d);
    const map: Record<string, string> = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = p.value;
    }

    return {
      year: map.year || d.getFullYear().toString(),
      month: map.month || (d.getMonth() + 1).toString().padStart(2, '0'),
      day: map.day || d.getDate().toString().padStart(2, '0'),
      hour: map.hour || d.getHours().toString().padStart(2, '0'),
      minute: map.minute || d.getMinutes().toString().padStart(2, '0'),
      second: map.second || d.getSeconds().toString().padStart(2, '0'),
      epochSeconds
    };
  } catch {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      year: d.getFullYear().toString(),
      month: pad(d.getMonth() + 1),
      day: pad(d.getDate()),
      hour: pad(d.getHours()),
      minute: pad(d.getMinutes()),
      second: pad(d.getSeconds()),
      epochSeconds
    };
  }
}

/**
 * Builds an archive playback stream URL for recorded broadcasts.
 * Normalized to the upstream server's timezone.
 */
export function buildCatchupUrl(
  channel: Channel,
  startTimestamp: Date | string | number,
  durationMinutes = 60,
  options: CatchupBuildOptions = {}
): string | null {
  if (!channel || !channel.url) return null;

  const parts = getNormalizedTimeParts(startTimestamp, options.serverTimezone || channel.timezone);
  const durationSec = durationMinutes * 60;
  const startEpoch = parts.epochSeconds;
  const endEpoch = startEpoch + durationSec;

  // 1. Custom Catchup-Source Template Interpolation
  if (channel.catchupSource) {
    let tpl = channel.catchupSource;
    tpl = tpl.replace(/\$\{utc\}/g, startEpoch.toString())
             .replace(/\{utc\}/g, startEpoch.toString())
             .replace(/\$\{lutc\}/g, endEpoch.toString())
             .replace(/\{lutc\}/g, endEpoch.toString())
             .replace(/\$\{start\}/g, `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`)
             .replace(/\{start\}/g, `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`)
             .replace(/\$\{duration\}/g, durationSec.toString())
             .replace(/\{duration\}/g, durationSec.toString())
             .replace(/\$\{duration_min\}/g, durationMinutes.toString())
             .replace(/\{duration_min\}/g, durationMinutes.toString())
             .replace(/\$\{timestamp\}/g, startEpoch.toString())
             .replace(/\{timestamp\}/g, startEpoch.toString())
             .replace(/\$\{Y\}/g, parts.year)
             .replace(/\$\{m\}/g, parts.month)
             .replace(/\$\{d\}/g, parts.day)
             .replace(/\$\{H\}/g, parts.hour)
             .replace(/\$\{M\}/g, parts.minute)
             .replace(/\$\{S\}/g, parts.second);

    return tpl;
  }

  // 2. Xtream Codes Timeshift Format
  // URL pattern: http://server:port/live/username/password/streamId.m3u8 ->
  //               http://server:port/timeshift/username/password/durationMinutes/YYYY-MM-DD:HH-mm/streamId.m3u8
  const xtreamMatch = channel.url.match(/^(https?:\/\/[^/]+)\/live\/([^/]+)\/([^/]+)\/(\d+)(\.[a-zA-Z0-9]+)?/i);
  if (xtreamMatch || (options.xtreamAccount && (channel.directSource === 'xtream' || channel.metadataSource === 'xtream'))) {
    const serverUrl = xtreamMatch ? xtreamMatch[1] : options.xtreamAccount?.serverUrl.replace(/\/+$/, '') || '';
    const username = xtreamMatch ? xtreamMatch[2] : options.xtreamAccount?.username || '';
    const password = xtreamMatch ? xtreamMatch[3] : options.xtreamAccount?.password || '';
    const streamId = xtreamMatch ? xtreamMatch[4] : channel.id.replace(/[^0-9]/g, '');

    if (serverUrl && username && password && streamId) {
      const formattedStart = `${parts.year}-${parts.month}-${parts.day}:${parts.hour}-${parts.minute}`;
      return `${serverUrl}/timeshift/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${durationMinutes}/${formattedStart}/${streamId}.m3u8`;
    }
  }

  // 3. Flussonic Archive Format
  if (channel.catchup === 'flussonic') {
    const cleanUrl = channel.url.replace(/\.m3u8(\?.*)?$/i, '');
    return `${cleanUrl}/archive-${startEpoch}-${durationSec}.m3u8`;
  }

  // 4. Append format (?utc=...&lutc=...)
  if (channel.catchup === 'append' || channel.catchup === 'default') {
    const sep = channel.url.includes('?') ? '&' : '?';
    return `${channel.url}${sep}utc=${startEpoch}&lutc=${endEpoch}`;
  }

  // 5. Shift format (?timeshift=...&duration=...)
  if (channel.catchup === 'shift') {
    const sep = channel.url.includes('?') ? '&' : '?';
    return `${channel.url}${sep}timeshift=${startEpoch}&duration=${durationSec}`;
  }

  // Fallback: standard UTC append
  const sep = channel.url.includes('?') ? '&' : '?';
  return `${channel.url}${sep}utc=${startEpoch}&lutc=${endEpoch}`;
}

/**
 * Returns descriptive metadata and expiration status for a catchup slot.
 */
export function getCatchupMetadata(
  channel: Channel,
  startTimestamp: Date | string | number
): CatchupMetadata {
  const supported = isCatchupSupported(channel);
  const maxDays = channel.catchupDays || channel.tvArchiveDuration || 7;

  let d: Date;
  if (startTimestamp instanceof Date) {
    d = startTimestamp;
  } else if (typeof startTimestamp === 'number') {
    d = new Date(startTimestamp < 1e11 ? startTimestamp * 1000 : startTimestamp);
  } else {
    const parsed = Date.parse(startTimestamp);
    d = isNaN(parsed) ? new Date() : new Date(parsed);
  }

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  let formattedAge = 'Live';
  if (diffMs > 0) {
    if (diffHours < 1) {
      formattedAge = `${Math.max(1, Math.floor(diffMs / 60000))}m ago`;
    } else if (diffHours < 24) {
      formattedAge = `${diffHours}h ago`;
    } else {
      formattedAge = `${diffDays}d ago`;
    }
  }

  const isExpired = diffDays > maxDays;

  let type: CatchupMetadata['type'] = 'generic';
  if (channel.url.includes('/live/') || channel.directSource === 'xtream' || channel.metadataSource === 'xtream') {
    type = 'xtream';
  } else if (channel.catchup === 'flussonic') {
    type = 'flussonic';
  } else if (channel.catchupSource) {
    type = 'template';
  } else if (channel.catchup === 'append') {
    type = 'append';
  } else if (channel.catchup === 'shift') {
    type = 'shift';
  }

  return {
    isSupported: supported && !isExpired && diffMs > 0,
    type,
    maxDays,
    isExpired,
    formattedAge
  };
}
