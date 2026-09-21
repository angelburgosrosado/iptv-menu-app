/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Channel, StalkerAccount } from '../types/iptv';
import { hostConnectivityGuard, HostConnectivityFastFailError } from './hostConnectivityGuard';

export interface StalkerGenre {
  id: string;
  title: string;
  alias: string;
}

export interface StalkerRawChannel {
  id: string;
  number: number | string;
  name: string;
  cmd: string;
  logo?: string;
  tv_genre_id?: string;
  censored?: number;
  status?: number;
  archive?: number;
}

export interface StalkerAuthResult {
  success: boolean;
  token?: string;
  account?: StalkerAccount;
  profile?: any;
  error?: string;
}

/**
 * Normalizes user-entered portal URLs to point to Stalker load.php API endpoint.
 * Handles common Stalker variants:
 * - http://example.com/c/ -> http://example.com/server/load.php
 * - http://example.com/stalker_portal/c/ -> http://example.com/stalker_portal/server/load.php
 * - http://example.com -> http://example.com/server/load.php
 */
export function normalizeStalkerPortalUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // Ensure scheme
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `http://${url}`;
  }

  // Remove index.html or trailing slashes
  url = url.replace(/\/index\.(html|php)$/i, '').replace(/\/+$/, '');

  // If ends with /c, point to /server/load.php
  if (url.endsWith('/c')) {
    return `${url.slice(0, -2)}/server/load.php`;
  }

  // If already ends with load.php, keep as is
  if (url.endsWith('/load.php')) {
    return url;
  }

  // If ends with /server, append /load.php
  if (url.endsWith('/server')) {
    return `${url}/load.php`;
  }

  // Default Stalker middleware path
  return `${url}/server/load.php`;
}

/**
 * Standard STB headers emulating a MAG250 / Infomir STB.
 */
export function getStbHeaders(mac: string, token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
    'X-User-Agent': 'Model: MAG250; Link: WiFi',
    'Cookie': `mac=${encodeURIComponent(mac)}; stb_lang=en; timezone=GMT;`
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Performs a network query to the Stalker portal, using guardedFetch and fallback proxy.
 */
async function stalkerFetch(
  loadPhpUrl: string,
  params: Record<string, string>,
  mac: string,
  token?: string,
  timeoutMs = 9000
): Promise<any> {
  const queryParams = new URLSearchParams(params);
  if (token) {
    queryParams.set('token', token);
  }
  queryParams.set('mac', mac);

  const targetUrl = `${loadPhpUrl}?${queryParams.toString()}`;

  return hostConnectivityGuard.executeWithBreaker(
    targetUrl,
    async () => {
      // 1. Try via specialized proxy endpoint if running in browser
      const proxyUrl = `/api/stalker/portal?url=${encodeURIComponent(targetUrl)}&mac=${encodeURIComponent(mac)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;

      try {
        const proxyRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(timeoutMs) });
        if (proxyRes.ok) {
          const data = await proxyRes.json().catch(() => null);
          if (data) return data;
        }
      } catch {
        // Fallback to direct fetch
      }

      // 2. Direct fetch attempt with STB query params
      const directRes = await fetch(targetUrl, {
        headers: getStbHeaders(mac, token),
        signal: AbortSignal.timeout(timeoutMs)
      });

      if (!directRes.ok) {
        throw new Error(`Stalker portal HTTP ${directRes.status}`);
      }

      const text = await directRes.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON response from Stalker Middleware portal.');
      }
    }
  );
}

/**
 * Authenticates with a Stalker / Ministra STB portal using MAC address.
 * 1. Executes handshake to obtain bearer token
 * 2. Fetches user profile to verify active status and expiration
 */
export async function authenticateStalkerPortal(
  portalUrl: string,
  mac: string
): Promise<StalkerAuthResult> {
  try {
    const loadUrl = normalizeStalkerPortalUrl(portalUrl);

    // Reset circuit breaker for explicit user connection test
    hostConnectivityGuard.resetHost(loadUrl);

    // Step 1: Handshake
    const handshakeData = await stalkerFetch(
      loadUrl,
      {
        type: 'stb',
        action: 'handshake',
        token: '',
      },
      mac
    );

    const token = handshakeData?.js?.token || handshakeData?.token;
    if (!token) {
      return {
        success: false,
        error: handshakeData?.js?.error || handshakeData?.error || 'Portal rejected handshake. Please verify your MAC Address.'
      };
    }

    // Step 2: Get Profile
    let profileData: any = null;
    try {
      profileData = await stalkerFetch(
        loadUrl,
        {
          type: 'stb',
          action: 'get_profile',
          auth_second_step: '0',
          hd: '1',
          sn: '1029384756',
          stb_type: 'MAG250',
          client_type: 'STB',
          image_version: '218'
        },
        mac,
        token
      );
    } catch {
      // Some portals skip get_profile or don't require it
    }

    const profile = profileData?.js || profileData || {};

    const account: StalkerAccount = {
      portalUrl,
      macAddress: mac,
      token,
      status: 'connected',
      expirationDate: profile?.expire_date || profile?.end_date || 'Active',
    };

    return {
      success: true,
      token,
      account,
      profile
    };
  } catch (err: any) {
    if (err instanceof HostConnectivityFastFailError) {
      return { success: false, error: err.message };
    }
    return {
      success: false,
      error: err.message || 'Unable to connect to Stalker Portal. Please check server URL and MAC.'
    };
  }
}

/**
 * Fetches Stalker genre categories.
 */
export async function fetchStalkerGenres(
  portalUrl: string,
  mac: string,
  token: string
): Promise<StalkerGenre[]> {
  try {
    const loadUrl = normalizeStalkerPortalUrl(portalUrl);
    const data = await stalkerFetch(
      loadUrl,
      {
        type: 'itv',
        action: 'get_genres'
      },
      mac,
      token
    );

    const list = data?.js?.data || data?.js || [];
    if (!Array.isArray(list)) return [];

    return list.map((g: any) => ({
      id: String(g.id || g.genre_id),
      title: g.title || g.name || 'General',
      alias: g.alias || ''
    }));
  } catch (err) {
    console.warn('[StalkerClient] Failed to load genres:', err);
    return [];
  }
}

/**
 * Fetches all channels from a Stalker STB Portal.
 * Maps Stalker raw channel items into IPTV.MENU Channel interfaces.
 */
export async function fetchStalkerChannels(
  portalUrl: string,
  mac: string,
  token: string,
  genres: StalkerGenre[] = []
): Promise<Channel[]> {
  const loadUrl = normalizeStalkerPortalUrl(portalUrl);
  const data = await stalkerFetch(
    loadUrl,
    {
      type: 'itv',
      action: 'get_all_channels'
    },
    mac,
    token
  );

  const rawChannels: StalkerRawChannel[] = data?.js?.data || data?.js || [];
  if (!Array.isArray(rawChannels) || rawChannels.length === 0) {
    return [];
  }

  const genreMap = new Map<string, string>();
  for (const g of genres) {
    genreMap.set(g.id, g.title);
  }

  let hostOrigin = 'stalker';
  try {
    hostOrigin = new URL(portalUrl).hostname.replace(/[^a-zA-Z0-9]/g, '_');
  } catch {
    // fallback
  }

  return rawChannels.map((item, idx) => {
    const rawCmd = item.cmd || '';
    // Clean initial URL if it's already an HTTP URL inside the cmd
    let cleanUrl = rawCmd;
    const httpMatch = rawCmd.match(/(https?:\/\/[^\s]+)/i);
    if (httpMatch) {
      cleanUrl = httpMatch[1];
    }

    const genreTitle = item.tv_genre_id ? (genreMap.get(String(item.tv_genre_id)) || 'Stalker Live') : 'Stalker Live';

    return {
      id: `stk_${hostOrigin}_${item.id || idx + 1}`,
      name: item.name || `Channel ${item.number || idx + 1}`,
      logo: item.logo ? (item.logo.startsWith('http') ? item.logo : `${loadUrl.replace(/\/server\/load\.php$/, '')}/${item.logo.replace(/^\/+/, '')}`) : '',
      url: cleanUrl || portalUrl,
      group: genreTitle,
      category: genreTitle,
      tvgId: `stalker_${item.id || idx + 1}`,
      metadataSource: 'stalker',
      directSource: 'stalker',
      stalkerCmd: rawCmd,
      stalkerPortalUrl: portalUrl,
      stalkerMac: mac,
      healthStatus: 'online'
    };
  });
}

/**
 * On-demand generation of live playback link for a Stalker channel (action=create_link).
 */
export async function resolveStalkerStreamUrl(
  portalUrl: string,
  mac: string,
  token: string,
  cmd: string
): Promise<string> {
  if (!cmd) return '';

  // If cmd is already a direct playable HTTP stream URL, return it
  if (cmd.startsWith('http://') || cmd.startsWith('https://')) {
    return cmd;
  }

  try {
    const loadUrl = normalizeStalkerPortalUrl(portalUrl);
    const data = await stalkerFetch(
      loadUrl,
      {
        type: 'itv',
        action: 'create_link',
        cmd: cmd,
        series: '',
        forced_storage: 'undefined',
        disable_ad: '0'
      },
      mac,
      token
    );

    const streamCmd = data?.js?.cmd || data?.cmd || '';
    const match = streamCmd.match(/(https?:\/\/[^\s]+)/i);
    if (match) {
      return match[1];
    }
    return streamCmd || cmd;
  } catch (err) {
    console.warn('[StalkerClient] Failed to create stream link:', err);
    // Fallback to embedded URL in cmd if present
    const fallbackMatch = cmd.match(/(https?:\/\/[^\s]+)/i);
    return fallbackMatch ? fallbackMatch[1] : cmd;
  }
}
