import { Channel, XtreamAccount } from '../types/iptv';
import { parseM3U } from './m3uParser';

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface XtreamStreamItem {
  num: number;
  name: string;
  stream_type: 'live' | 'movie' | 'series';
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
}

export async function authenticateXtreamCodes(account: XtreamAccount): Promise<{
  success: boolean;
  userInfo?: any;
  serverInfo?: any;
  error?: string;
}> {
  try {
    let baseUrl = account.serverUrl.trim();
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `http://${baseUrl}`;
    }
    // Strip trailing slash
    baseUrl = baseUrl.replace(/\/+$/, '');

    const authUrl = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}`;
    
    // Attempt direct fetch, fallback to server proxy if CORS prevents direct browser hitting
    let res: Response;
    try {
      res = await fetch(authUrl, { signal: AbortSignal.timeout(6000) });
    } catch (directErr) {
      try {
        const proxyUrl = `/api/stream/proxy?url=${encodeURIComponent(authUrl)}`;
        res = await fetch(proxyUrl, { signal: AbortSignal.timeout(7000) });
      } catch (proxyErr: any) {
        throw new Error(`Unable to reach server ${baseUrl}. Please verify the host portal and port.`);
      }
    }

    if (!res.ok) {
      return { success: false, error: `Server responded with HTTP ${res.status}` };
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      if (!text.startsWith('{')) {
        return { success: false, error: 'Server returned HTML or invalid response instead of Xtream API JSON.' };
      }
    }

    const data = await res.json().catch(() => null);
    if (!data) {
      return { success: false, error: 'Malformed JSON returned from Xtream server.' };
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
        error: data.user_info?.message || 'Authentication failed. Please verify your Xtream username and password.'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unable to connect to Xtream Codes server.'
    };
  }
}

export async function fetchXtreamCategories(account: XtreamAccount): Promise<Record<string, string>> {
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}&action=get_live_categories`;
  try {
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    } catch {
      res = await fetch(`/api/stream/proxy?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(7000) });
    }
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
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}&action=get_live_streams`;
  try {
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    } catch {
      res = await fetch(`/api/stream/proxy?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(25000) });
    }
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
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }
  const url = `${baseUrl}/get.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}&type=m3u_plus&output=m3u8`;
  try {
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    } catch {
      res = await fetch(`/api/stream/proxy?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(25000) });
    }
    if (res.ok) {
      const text = await res.text();
      if (text.includes('#EXTM3U')) {
        const parsed = parseM3U(text);
        return parsed.map((c) => ({
          ...c,
          directSource: 'xtream'
        }));
      }
    }
  } catch (e) {
    console.warn('Could not fetch Xtream M3U fallback playlist', e);
  }
  return [];
}

export function generateXtreamChannelList(
  account: XtreamAccount,
  streams: XtreamStreamItem[],
  categories: Record<string, string>
): Channel[] {
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }

  return streams.map((item) => {
    const group = categories[item.category_id] || (item.stream_type === 'live' ? 'Live TV' : 'VOD / Movies');
    const streamUrl = `${baseUrl}/live/${account.username}/${account.password}/${item.stream_id}.m3u8`;

    return {
      id: `xtream_${item.stream_id}`,
      name: item.name,
      logo: item.stream_icon,
      url: streamUrl,
      group: group,
      tvgId: item.epg_channel_id || String(item.stream_id),
      resolution: '1080p',
      bitrate: '5.2 Mbps',
      fps: 60,
      pingMs: Math.floor(Math.random() * 40) + 18,
      codec: 'H.264 / AAC',
      streamType: item.stream_type === 'movie' ? 'vod' : item.stream_type,
      directSource: 'xtream'
    };
  });
}

export async function fetchXtreamVodCategories(account: XtreamAccount): Promise<Record<string, string>> {
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}&action=get_vod_categories`;
  try {
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    } catch {
      res = await fetch(`/api/stream/proxy?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(9000) });
    }
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
    console.warn('Could not fetch Xtream VOD categories', e);
  }
  return {};
}

export async function fetchXtreamVodStreams(account: XtreamAccount, categoryId?: string): Promise<any[]> {
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }
  let url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}&action=get_vod_streams`;
  if (categoryId) {
    url += `&category_id=${encodeURIComponent(categoryId)}`;
  }
  try {
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    } catch {
      res = await fetch(`/api/stream/proxy?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(25000) });
    }
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Could not fetch Xtream VOD streams', e);
  }
  return [];
}

export async function fetchXtreamSeries(account: XtreamAccount, categoryId?: string): Promise<any[]> {
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }
  let url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}&action=get_series`;
  if (categoryId) {
    url += `&category_id=${encodeURIComponent(categoryId)}`;
  }
  try {
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    } catch {
      res = await fetch(`/api/stream/proxy?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(25000) });
    }
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Could not fetch Xtream series', e);
  }
  return [];
}

export function generateXtreamVodChannelList(
  account: XtreamAccount,
  vodItems: any[],
  categories: Record<string, string>
): Channel[] {
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }

  return vodItems.map((item) => {
    const ext = item.container_extension || 'mp4';
    const group = categories[item.category_id] ? `VOD: ${categories[item.category_id]}` : 'VOD / Movies';
    const streamUrl = `${baseUrl}/movie/${account.username}/${account.password}/${item.stream_id}.${ext}`;

    return {
      id: `xtream_vod_${item.stream_id}`,
      name: item.name,
      logo: item.stream_icon,
      url: streamUrl,
      group: group,
      tvgId: String(item.stream_id),
      resolution: item.rating ? `★ ${item.rating}` : '1080p',
      bitrate: 'VOD On-Demand',
      fps: 24,
      codec: 'H.264 / AAC',
      streamType: 'vod' as const,
      directSource: 'xtream' as const
    };
  });
}

export interface XtreamEpgListing {
  id: string;
  ep_id?: string;
  title: string;
  lang?: string;
  start: string;
  end: string;
  description: string;
  channel_id?: string;
  start_timestamp: string | number;
  stop_timestamp: string | number;
  now_playing?: number;
  has_archive?: number;
}

/**
 * Fetches short EPG listings (Now / Next) for an active Xtream live stream
 */
export async function fetchXtreamShortEpg(
  account: XtreamAccount,
  streamId: number | string,
  limit = 10
): Promise<XtreamEpgListing[]> {
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}&action=get_short_epg&stream_id=${encodeURIComponent(streamId)}&limit=${limit}`;

  try {
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    } catch {
      res = await fetch(`/api/stream/proxy?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(8000) });
    }
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && Array.isArray(data.epg_listings)) {
        return data.epg_listings;
      }
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e) {
    console.warn(`Could not fetch short EPG for stream ${streamId}`, e);
  }
  return [];
}

/**
 * Fetches full table EPG schedule for an active Xtream live stream
 */
export async function fetchXtreamFullEpg(
  account: XtreamAccount,
  streamId: number | string
): Promise<XtreamEpgListing[]> {
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}&action=get_simple_data_table&stream_id=${encodeURIComponent(streamId)}`;

  try {
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    } catch {
      res = await fetch(`/api/stream/proxy?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(10000) });
    }
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && Array.isArray(data.epg_listings)) {
        return data.epg_listings;
      }
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e) {
    console.warn(`Could not fetch full EPG for stream ${streamId}`, e);
  }
  return [];
}

/**
 * Generates an Xtream Timeshift (Catchup) stream URL for recorded broadcasts
 */
export function generateXtreamCatchupUrl(
  account: XtreamAccount,
  streamId: number | string,
  startTimestamp: number,
  durationMinutes = 60
): string {
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }

  // Format start time into YYYY-MM-DD:HH-mm
  const date = new Date(startTimestamp * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedStart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}:${pad(date.getHours())}-${pad(date.getMinutes())}`;

  return `${baseUrl}/timeshift/${encodeURIComponent(account.username)}/${encodeURIComponent(account.password)}/${durationMinutes}/${formattedStart}/${streamId}.m3u8`;
}


