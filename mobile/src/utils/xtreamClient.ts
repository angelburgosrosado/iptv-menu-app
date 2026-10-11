/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Platform } from 'react-native';
import { Channel, XtreamAccount } from '../types/iptv';
import { parseM3U } from './m3uParser';

export interface XtreamStreamItem {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon?: string;
  epg_channel_id?: string;
  added?: string;
  category_id?: string;
  custom_sid?: string;
  tv_archive?: number;
  direct_source?: string;
  tv_archive_duration?: number;
}

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
  'Accept': '*/*',
};

export function cleanBaseUrl(url: string): string {
  let cleaned = (url || '').trim();
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `http://${cleaned}`;
  }
  return cleaned.replace(/\/+$/, '');
}

export interface ParsedXtreamUrl {
  isXtream: boolean;
  serverUrl: string;
  username: string;
  password: string;
  action?: string;
  type?: string;
  m3uUrl?: string;
}

/**
 * Parses and extracts Xtream Codes server host, username, and password from any
 * standard Xtream URL (player_api.php, get.php, /live/U/P/ID, etc.).
 */
export function parseXtreamUrl(inputUrl: string): ParsedXtreamUrl {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { isXtream: false, serverUrl: '', username: '', password: '' };
  }

  const trimmed = inputUrl.trim();
  try {
    const parsed = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `http://${trimmed}`);
    const pathname = parsed.pathname.toLowerCase();
    const searchParams = parsed.searchParams;

    const username = searchParams.get('username') || searchParams.get('user') || '';
    const password = searchParams.get('password') || searchParams.get('pass') || '';
    const serverUrl = `${parsed.protocol}//${parsed.host}`;

    // Pattern 1: get.php, player_api.php, or xmltv.php with username & password
    if (username && password && (pathname.includes('player_api.php') || pathname.includes('get.php') || pathname.includes('xmltv.php') || pathname === '/' || pathname === '')) {
      return {
        isXtream: true,
        serverUrl,
        username,
        password,
        action: searchParams.get('action') || undefined,
        type: searchParams.get('type') || undefined,
        m3uUrl: `${serverUrl}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus&output=m3u8`
      };
    }

    // Pattern 2: /live/USERNAME/PASSWORD/STREAM_ID.m3u8 or /movie/... or /series/...
    const pathParts = pathname.split('/').filter(Boolean);
    if ((pathParts[0] === 'live' || pathParts[0] === 'movie' || pathParts[0] === 'series') && pathParts.length >= 3) {
      const u = pathParts[1];
      const p = pathParts[2];
      return {
        isXtream: true,
        serverUrl,
        username: u,
        password: p,
        type: pathParts[0],
        m3uUrl: `${serverUrl}/get.php?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}&type=m3u_plus&output=m3u8`
      };
    }

    // Pattern 3: Any IPTV endpoint carrying username and password
    if (username && password) {
      return {
        isXtream: true,
        serverUrl,
        username,
        password,
        m3uUrl: `${serverUrl}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus&output=m3u8`
      };
    }

    return { isXtream: false, serverUrl: serverUrl || trimmed, username: '', password: '' };
  } catch {
    return { isXtream: false, serverUrl: trimmed, username: '', password: '' };
  }
}

/**
 * Determine default streaming container format.
 * iOS / tvOS AVPlayer requires HLS (m3u8) as raw MPEG-TS is not supported natively.
 */
export function getDefaultOutputFormat(userSpecified?: 'ts' | 'm3u8'): 'ts' | 'm3u8' {
  if (userSpecified) return userSpecified;
  if (Platform.OS === 'ios') return 'm3u8';
  return 'ts';
}

export async function authenticateXtreamCodes(account: XtreamAccount): Promise<{
  success: boolean;
  userInfo?: any;
  serverInfo?: any;
  error?: string;
}> {
  try {
    const baseUrl = cleanBaseUrl(account.serverUrl);
    const authUrl = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password || '')}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(authUrl, {
      headers: DEFAULT_HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { success: false, error: `Server returned HTTP ${res.status}` };
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      return { success: false, error: 'Provider returned an HTML error or Cloudflare challenge' };
    }

    const data = await res.json();
    if (!data || !data.user_info) {
      return { success: false, error: 'Invalid response from server' };
    }

    if (data.user_info.auth === 0 || data.user_info.status === 'Disabled') {
      return { success: false, error: data.user_info.message || 'Account disabled or invalid credentials' };
    }

    return {
      success: true,
      userInfo: data.user_info,
      serverInfo: data.server_info,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Connection timed out. Check server URL and port.' };
    }
    return { success: false, error: err.message || 'Network error connecting to Xtream server' };
  }
}

export async function fetchXtreamCategories(account: XtreamAccount): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const baseUrl = cleanBaseUrl(account.serverUrl);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password || '')}&action=get_live_categories`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        list.forEach((cat: any) => {
          if (cat.category_id && cat.category_name) {
            map[String(cat.category_id)] = String(cat.category_name);
          }
        });
      }
    }
  } catch (e) {
    console.warn('Failed to fetch Xtream categories', e);
  }
  return map;
}

export async function fetchXtreamStreams(account: XtreamAccount): Promise<XtreamStreamItem[]> {
  const baseUrl = cleanBaseUrl(account.serverUrl);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password || '')}&action=get_live_streams`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn('Failed to fetch Xtream streams via player_api', e);
  }
  return [];
}

export async function fetchXtreamM3uChannels(account: XtreamAccount): Promise<Channel[]> {
  const baseUrl = cleanBaseUrl(account.serverUrl);
  const format = getDefaultOutputFormat(account.outputFormat);
  const url = `${baseUrl}/get.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password || '')}&type=m3u_plus&output=${format}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      let text = await res.text();
      if (text.includes('#EXTM3U') || text.includes('#EXTINF:')) {
        if (!text.includes('#EXTM3U') && text.includes('#EXTINF:')) {
          text = '#EXTM3U\n' + text;
        }
        return parseM3U(text);
      }
    }
  } catch (e) {
    console.warn('Failed to fetch Xtream m3u fallback', e);
  }
  return [];
}

export function generateXtreamChannelList(
  account: XtreamAccount,
  streams: XtreamStreamItem[],
  categoryMap: Record<string, string>
): Channel[] {
  const baseUrl = cleanBaseUrl(account.serverUrl);
  const primaryFormat = getDefaultOutputFormat(account.outputFormat);
  const fallbackFormat = primaryFormat === 'ts' ? 'm3u8' : 'ts';
  const u = encodeURIComponent(account.username);
  const p = encodeURIComponent(account.password || '');

  return streams.map((stream) => {
    const groupName = (stream.category_id && categoryMap[stream.category_id]) || 'General';
    const primaryUrl = `${baseUrl}/live/${u}/${p}/${stream.stream_id}.${primaryFormat}`;
    const altUrl = `${baseUrl}/live/${u}/${p}/${stream.stream_id}.${fallbackFormat}`;

    return {
      id: `xtream_${stream.stream_id}`,
      name: stream.name || `Channel ${stream.stream_id}`,
      logo: stream.stream_icon || '',
      url: primaryUrl,
      fallbackUrls: [altUrl],
      group: groupName,
      tvgId: stream.epg_channel_id || `xtream_${stream.stream_id}`,
      epgChannelId: stream.epg_channel_id || undefined,
      metadataSource: 'xtream',
      isLive: true,
      catchupDays: stream.tv_archive_duration || (stream.tv_archive ? 3 : 0),
    };
  });
}

/**
 * Fetch short EPG guide for a specific Xtream stream
 */
export async function fetchXtreamShortEpg(
  account: XtreamAccount,
  streamId: number | string,
  limit = 5
): Promise<any[]> {
  const baseUrl = cleanBaseUrl(account.serverUrl);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password || '')}&action=get_short_epg&stream_id=${streamId}&limit=${limit}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.epg_listings)) {
        return data.epg_listings;
      }
    }
  } catch (e) {
    // optional epg
  }
  return [];
}

export async function fetchXtreamVodCategories(account: XtreamAccount): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const baseUrl = cleanBaseUrl(account.serverUrl);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password || '')}&action=get_vod_categories`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        list.forEach((cat: any) => {
          if (cat.category_id && cat.category_name) {
            map[String(cat.category_id)] = String(cat.category_name);
          }
        });
      }
    }
  } catch (e) {
    console.warn('Failed to fetch Xtream VOD categories', e);
  }
  return map;
}

export async function fetchXtreamVodStreams(account: XtreamAccount, categoryId?: string): Promise<any[]> {
  const baseUrl = cleanBaseUrl(account.serverUrl);
  let url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password || '')}&action=get_vod_streams`;
  if (categoryId) {
    url += `&category_id=${encodeURIComponent(categoryId)}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 16000);
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn('Failed to fetch Xtream VOD streams', e);
  }
  return [];
}

export function generateXtreamVodChannelList(
  account: XtreamAccount,
  vodItems: any[],
  categoryMap: Record<string, string>
): Channel[] {
  const baseUrl = cleanBaseUrl(account.serverUrl);
  const u = encodeURIComponent(account.username);
  const p = encodeURIComponent(account.password || '');

  return vodItems.map((item) => {
    const ext = item.container_extension || 'mp4';
    const groupName = (item.category_id && categoryMap[item.category_id]) ? `VOD: ${categoryMap[item.category_id]}` : 'VOD / Movies';
    const primaryUrl = `${baseUrl}/movie/${u}/${p}/${item.stream_id}.${ext}`;

    return {
      id: `xtream_vod_${item.stream_id}`,
      name: item.name || `Movie ${item.stream_id}`,
      logo: item.stream_icon || '',
      url: primaryUrl,
      group: groupName,
      tvgId: `xtream_vod_${item.stream_id}`,
      metadataSource: 'xtream',
      streamType: 'vod' as const,
      isLive: false,
    };
  });
}

export async function fetchXtreamSeriesCategories(account: XtreamAccount): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const baseUrl = cleanBaseUrl(account.serverUrl);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password || '')}&action=get_series_categories`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        list.forEach((cat: any) => {
          if (cat.category_id && cat.category_name) {
            map[String(cat.category_id)] = String(cat.category_name);
          }
        });
      }
    }
  } catch (e) {
    console.warn('Failed to fetch Xtream series categories', e);
  }
  return map;
}

export async function fetchXtreamSeries(account: XtreamAccount, categoryId?: string): Promise<any[]> {
  const baseUrl = cleanBaseUrl(account.serverUrl);
  let url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password || '')}&action=get_series`;
  if (categoryId) {
    url += `&category_id=${encodeURIComponent(categoryId)}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 16000);
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn('Failed to fetch Xtream series', e);
  }
  return [];
}

export async function fetchXtreamSeriesInfo(
  account: XtreamAccount,
  seriesId: number | string
): Promise<{ info?: any; seasons?: any[]; episodes?: Record<string, any[]> } | null> {
  const baseUrl = cleanBaseUrl(account.serverUrl);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password || '')}&action=get_series_info&series_id=${encodeURIComponent(seriesId)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 16000);
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && (data.info || data.episodes || data.seasons)) {
        return data;
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch Xtream series info for ${seriesId}`, e);
  }
  return null;
}

export function generateXtreamSeriesChannelList(
  account: XtreamAccount,
  seriesItems: any[],
  categoryMap: Record<string, string>
): Channel[] {
  const baseUrl = cleanBaseUrl(account.serverUrl);
  const u = encodeURIComponent(account.username);
  const p = encodeURIComponent(account.password || '');

  return seriesItems.map((item) => {
    const sId = item.series_id || item.id;
    const groupName = (item.category_id && categoryMap[item.category_id]) ? `Series: ${categoryMap[item.category_id]}` : 'TV Series';
    const manifestUrl = `${baseUrl}/player_api.php?username=${u}&password=${p}&action=get_series_info&series_id=${sId}`;

    return {
      id: `xtream_series_${sId}`,
      name: item.name || `Series ${sId}`,
      logo: item.cover || item.stream_icon || '',
      url: manifestUrl,
      group: groupName,
      tvgId: `xtream_series_${sId}`,
      metadataSource: 'xtream',
      streamType: 'series' as const,
      isLive: false,
    };
  });
}

export function generateXtreamEpisodesList(
  account: XtreamAccount,
  seriesName: string,
  seriesInfo: { info?: any; episodes?: Record<string, any[]> }
): Channel[] {
  const baseUrl = cleanBaseUrl(account.serverUrl);
  const u = encodeURIComponent(account.username);
  const p = encodeURIComponent(account.password || '');
  const channels: Channel[] = [];
  const episodesMap = seriesInfo.episodes || {};

  Object.keys(episodesMap).forEach((seasonNum) => {
    const epList = episodesMap[seasonNum];
    if (Array.isArray(epList)) {
      epList.forEach((ep: any) => {
        const ext = ep.container_extension || 'mp4';
        const epNum = ep.episode_num !== undefined ? ep.episode_num : 1;
        const sFormatted = String(seasonNum).padStart(2, '0');
        const eFormatted = String(epNum).padStart(2, '0');
        const epTitle = ep.title ? ` - ${ep.title}` : '';
        const name = `${seriesName} S${sFormatted}E${eFormatted}${epTitle}`;
        const streamUrl = `${baseUrl}/series/${u}/${p}/${ep.id}.${ext}`;

        channels.push({
          id: `xtream_ep_${ep.id}`,
          name: name,
          logo: ep.info?.movie_image || seriesInfo.info?.cover || '',
          url: streamUrl,
          group: `Season ${seasonNum}`,
          tvgId: `xtream_ep_${ep.id}`,
          metadataSource: 'xtream',
          streamType: 'series' as const,
          isLive: false,
        });
      });
    }
  });

  return channels;
}
