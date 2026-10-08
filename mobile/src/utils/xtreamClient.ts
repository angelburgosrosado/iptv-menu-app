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
    const timeout = setTimeout(() => controller.abort(), 16000);
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
    const timeout = setTimeout(() => controller.abort(), 18000);
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      return parseM3U(text);
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
