import { Channel, XtreamAccount } from '../types/iptv';

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
    
    // In browser context, fetch or proxy fallback
    const res = await fetch(authUrl, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) {
      return { success: false, error: `Server responded with HTTP ${res.status}` };
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { success: false, error: 'Server returned HTML instead of Xtream API JSON.' };
    }

    const data = await res.json().catch(() => null);
    if (!data) {
      return { success: false, error: 'Malformed JSON returned from Xtream server.' };
    }
    if (data.user_info && data.user_info.auth === 1) {
      return {
        success: true,
        userInfo: data.user_info,
        serverInfo: data.server_info
      };
    } else {
      return {
        success: false,
        error: 'Authentication failed. Please check your credentials.'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unable to connect to Xtream Codes server.'
    };
  }
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
