import { Channel, XtreamAccount } from '../types/iptv';
import { parseM3U } from './m3uParser';
import { hostConnectivityGuard, HostConnectivityFastFailError } from './hostConnectivityGuard';

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
 * Executes a network fetch guarded by HostConnectivityGuard circuit breaker.
 * Employs direct hit with automatic CORS proxy fallback.
 * Generous default timeouts (30s / 45s) accommodate large IPTV catalogs with thousands of channels.
 */
async function guardedFetch(
  url: string,
  timeoutMs = 30000,
  proxyTimeoutMs = 45000,
  skipBreaker = false
): Promise<Response> {
  return hostConnectivityGuard.executeWithBreaker(
    url,
    async () => {
      try {
        return await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      } catch (directErr) {
        const proxyUrl = `/api/stream/proxy?url=${encodeURIComponent(url)}`;
        return await fetch(proxyUrl, { signal: AbortSignal.timeout(proxyTimeoutMs) });
      }
    },
    { skipBreaker }
  );
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

    // Reset circuit breaker state for explicit user test connection
    hostConnectivityGuard.resetHost(baseUrl);

    const authUrl = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}`;
    
    let res: Response;
    try {
      res = await guardedFetch(authUrl, 6000, 7000, true);
    } catch (err: any) {
      if (err instanceof HostConnectivityFastFailError) {
        return { success: false, error: err.message };
      }
      return { success: false, error: `Unable to reach server ${baseUrl}. Please verify the host portal and port.` };
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
    const res = await guardedFetch(url, 6000, 7000);
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
  } catch (e: any) {
    if (e instanceof HostConnectivityFastFailError) {
      console.warn(`[XtreamClient] Categories fast-failed: ${e.message}`);
    } else {
      console.warn('Could not fetch Xtream categories', e);
    }
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
    const res = await guardedFetch(url, 35000, 45000);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e: any) {
    if (e instanceof HostConnectivityFastFailError) {
      console.warn(`[XtreamClient] Live streams fast-failed: ${e.message}`);
    } else {
      console.warn('Could not fetch Xtream live streams', e);
    }
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
    // For large playlists (10k-80k channels), allow up to 60s direct / 75s proxy and skipBreaker to prevent premature fast-fail
    const res = await guardedFetch(url, 60000, 75000, true);
    if (res.ok) {
      let text = await res.text();
      if (text.includes('#EXTM3U') || text.includes('#EXTINF:')) {
        if (!text.includes('#EXTM3U') && text.includes('#EXTINF:')) {
          text = '#EXTM3U\n' + text;
        }
        const parsed = parseM3U(text);
        return parsed.map((c) => ({
          ...c,
          directSource: 'xtream'
        }));
      }
    }
  } catch (e: any) {
    if (e instanceof HostConnectivityFastFailError) {
      console.warn(`[XtreamClient] M3U fallback fast-failed: ${e.message}`);
    } else {
      console.warn('Could not fetch Xtream M3U fallback playlist', e);
    }
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
    const res = await guardedFetch(url, 8000, 9000);
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
  } catch (e: any) {
    if (e instanceof HostConnectivityFastFailError) {
      console.warn(`[XtreamClient] VOD categories fast-failed: ${e.message}`);
    } else {
      console.warn('Could not fetch Xtream VOD categories', e);
    }
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
    const res = await guardedFetch(url, 60000, 90000, true);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e: any) {
    if (e instanceof HostConnectivityFastFailError) {
      console.warn(`[XtreamClient] VOD streams fast-failed: ${e.message}`);
    } else {
      console.warn('Could not fetch Xtream VOD streams', e);
    }
  }
  return [];
}

export async function fetchXtreamSeriesCategories(account: XtreamAccount): Promise<Record<string, string>> {
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}&action=get_series_categories`;
  try {
    const res = await guardedFetch(url, 8000, 9000);
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
  } catch (e: any) {
    if (e instanceof HostConnectivityFastFailError) {
      console.warn(`[XtreamClient] Series categories fast-failed: ${e.message}`);
    } else {
      console.warn('Could not fetch Xtream series categories', e);
    }
  }
  return {};
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
    const res = await guardedFetch(url, 60000, 90000, true);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e: any) {
    if (e instanceof HostConnectivityFastFailError) {
      console.warn(`[XtreamClient] Series fast-failed: ${e.message}`);
    } else {
      console.warn('Could not fetch Xtream series', e);
    }
  }
  return [];
}

export async function fetchXtreamSeriesInfo(
  account: XtreamAccount, 
  seriesId: number | string
): Promise<{ info?: any; seasons?: any[]; episodes?: Record<string, any[]> } | null> {
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }
  const url = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}&action=get_series_info&series_id=${encodeURIComponent(seriesId)}`;
  try {
    const res = await guardedFetch(url, 25000, 35000, true);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && (data.info || data.episodes || data.seasons)) {
        return data;
      }
    }
  } catch (e: any) {
    if (e instanceof HostConnectivityFastFailError) {
      console.warn(`[XtreamClient] Series info fast-failed: ${e.message}`);
    } else {
      console.warn(`Could not fetch Xtream series info for ${seriesId}`, e);
    }
  }
  return null;
}

export function generateXtreamSeriesChannelList(
  account: XtreamAccount,
  seriesItems: any[],
  categories: Record<string, string>
): Channel[] {
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }

  return seriesItems.map((item) => {
    const sId = item.series_id || item.id;
    const group = categories[item.category_id] ? `Series: ${categories[item.category_id]}` : 'TV Series';
    // Deep-linkable stream URL for series metadata inspection
    const manifestUrl = `${baseUrl}/player_api.php?username=${encodeURIComponent(account.username)}&password=${encodeURIComponent(account.password)}&action=get_series_info&series_id=${sId}`;

    return {
      id: `xtream_series_${sId}`,
      name: item.name,
      logo: item.cover || item.stream_icon || '',
      url: manifestUrl,
      group: group,
      tvgId: String(sId),
      resolution: item.rating ? `★ ${item.rating}` : 'TV Series',
      bitrate: 'Multi-Season TV',
      fps: 24,
      codec: 'H.264 / AAC',
      streamType: 'series' as const,
      directSource: 'xtream' as const
    };
  });
}

export function generateXtreamEpisodesList(
  account: XtreamAccount,
  seriesName: string,
  seriesInfo: { info?: any; episodes?: Record<string, any[]> }
): Channel[] {
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }

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
        const streamUrl = `${baseUrl}/series/${account.username}/${account.password}/${ep.id}.${ext}`;

        channels.push({
          id: `xtream_ep_${ep.id}`,
          name: name,
          logo: ep.info?.movie_image || seriesInfo.info?.cover || '',
          url: streamUrl,
          group: `Season ${seasonNum}`,
          tvgId: String(ep.id),
          resolution: ep.info?.video?.height ? `${ep.info.video.height}p` : '1080p',
          bitrate: ep.info?.duration ? `${ep.info.duration}` : 'HD Stream',
          fps: 24,
          codec: 'H.264 / AAC',
          streamType: 'series' as const,
          directSource: 'xtream' as const
        });
      });
    }
  });

  return channels;
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
    const res = await guardedFetch(url, 6000, 8000);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && Array.isArray(data.epg_listings)) {
        return data.epg_listings;
      }
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e: any) {
    if (e instanceof HostConnectivityFastFailError) {
      console.warn(`[XtreamClient] Short EPG fast-failed for ${streamId}: ${e.message}`);
    } else {
      console.warn(`Could not fetch short EPG for stream ${streamId}`, e);
    }
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
    const res = await guardedFetch(url, 8000, 10000);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && Array.isArray(data.epg_listings)) {
        return data.epg_listings;
      }
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e: any) {
    if (e instanceof HostConnectivityFastFailError) {
      console.warn(`[XtreamClient] Full EPG fast-failed for ${streamId}: ${e.message}`);
    } else {
      console.warn(`Could not fetch full EPG for stream ${streamId}`, e);
    }
  }
  return [];
}

/**
 * Generates an Xtream Timeshift (Catchup) stream URL for recorded broadcasts
 */
export function generateXtreamCatchupUrl(
  account: XtreamAccount,
  streamId: number | string,
  startTimestamp: number | string | Date,
  durationMinutes = 60
): string {
  let baseUrl = account.serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }

  // Format start time into YYYY-MM-DD:HH-mm
  let date: Date;
  if (startTimestamp instanceof Date) {
    date = startTimestamp;
  } else if (typeof startTimestamp === 'number') {
    date = new Date(startTimestamp < 1e11 ? startTimestamp * 1000 : startTimestamp);
  } else {
    const parsed = Date.parse(startTimestamp);
    if (!isNaN(parsed)) {
      date = new Date(parsed);
    } else {
      date = new Date();
    }
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedStart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}:${pad(date.getHours())}-${pad(date.getMinutes())}`;

  return `${baseUrl}/timeshift/${encodeURIComponent(account.username)}/${encodeURIComponent(account.password)}/${durationMinutes}/${formattedStart}/${streamId}.m3u8`;
}
