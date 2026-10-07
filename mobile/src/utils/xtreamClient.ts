/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Channel, XtreamAccount } from '../types/iptv';
import { parseM3U } from './m3uParser';

export interface XtreamStreamItem {
  num: number;
  name: string;
  stream_type: 'live' | 'movie' | 'series';
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
}

const DEFAULT_HEADERS = {
  'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
  'Accept': '*/*'
};

function sanitizeBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `http://${url}`;
  }
  return url;
}

export async function authenticateXtreamCodes(account: XtreamAccount): Promise<{
  success: boolean;
  userInfo?: any;
  serverInfo?: any;
  error?: string;
}> {
  try {
    const baseUrl = sanitizeBaseUrl(account.serverUrl);
    const authUrl = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(authUrl, {
      headers: DEFAULT_HEADERS,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { success: false, error: `Server responded with HTTP ${res.status}` };
    }

    const rawText = await res.text().catch(() => '');
    if (rawText.trim().startsWith('<') || rawText.includes('<html>') || rawText.includes('<!DOCTYPE')) {
      return {
        success: false,
        error: 'Error 513: Server returned an HTML web page instead of Xtream API JSON. Check your port number (e.g. :8080) and protocol (http vs https).'
      };
    }

    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      return { success: false, error: 'Error 513: Malformed JSON syntax returned from Xtream server.' };
    }

    if (data.user_info && (data.user_info.auth === 1 || data.user_info.status === 'Active')) {
      return {
        success: true,
        userInfo: data.user_info,
        serverInfo: data.server_info
      };
    } else {
      return {
        success: false,
        error: data.user_info?.message || 'Authentication failed. Please verify your username and password.'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Connection timed out. Check the server address and port.' : (err.message || 'Unable to connect to Xtream Codes server.')
    };
  }
}

export async function fetchXtreamCategories(account: XtreamAccount): Promise<Record<string, string>> {
  const baseUrl = sanitizeBaseUrl(account.serverUrl);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}&action=get_live_categories`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data)) {
        const catMap: Record<string, string> = {};
        data.forEach((c: any) => {
          if (c.category_id && c.category_name) {
            catMap[String(c.category_id)] = c.category_name;
          }
        });
        return catMap;
      }
    }
  } catch (e) {
    console.warn('Could not fetch Xtream categories', e);
  }
  return {};
}

export async function fetchXtreamStreams(account: XtreamAccount): Promise<XtreamStreamItem[]> {
  const baseUrl = sanitizeBaseUrl(account.serverUrl);
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}&action=get_live_streams`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Could not fetch Xtream live streams', e);
  }
  return [];
}

export async function fetchXtreamM3uChannels(account: XtreamAccount): Promise<Channel[]> {
  const baseUrl = sanitizeBaseUrl(account.serverUrl);
  const format = account.outputFormat === 'm3u8' ? 'm3u8' : 'ts';
  const url = `${baseUrl}/get.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}&type=m3u_plus&output=${format}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      if (text.includes('#EXTM3U')) {
        return parseM3U(text);
      }
    }
  } catch (e) {
    console.warn('Could not fetch Xtream M3U fallback', e);
  }
  return [];
}

export function generateXtreamChannelList(
  account: XtreamAccount,
  streams: XtreamStreamItem[],
  categories: Record<string, string>
): Channel[] {
  const baseUrl = sanitizeBaseUrl(account.serverUrl);
  const extension = account.outputFormat === 'm3u8' ? 'm3u8' : 'ts';

  return streams.map((item) => {
    const group = categories[item.category_id] || (item.stream_type === 'live' ? 'Live TV' : 'VOD');
    const streamUrl = `${baseUrl}/live/${encodeURIComponent(account.username)}/${encodeURIComponent(account.password)}/${item.stream_id}.${extension}`;

    return {
      id: `xtream_${item.stream_id}`,
      name: item.name,
      logo: item.stream_icon || '',
      url: streamUrl,
      group: group,
      tvgId: item.epg_channel_id || String(item.stream_id),
      tvgName: item.name
    };
  });
}
