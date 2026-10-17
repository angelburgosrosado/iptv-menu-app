/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlaybackSourceKind = 'hls' | 'mpegts' | 'dash' | 'native' | 'radio';

export type DiagnosticErrorCategory = 
  | 'NETWORK' 
  | 'CODEC_UNSUPPORTED' 
  | 'CORS_BLOCKED' 
  | 'FORMAT_MISMATCH' 
  | 'STREAM_OFFLINE' 
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface RecoveryAction {
  id: string;
  label: string;
  description: string;
  type: 'SWITCH_ENGINE' | 'SWITCH_FORMAT' | 'TOGGLE_PROXY' | 'TRY_CANDIDATE' | 'RETRY';
  targetValue?: any;
  primary?: boolean;
}

export interface PlaybackDiagnostic {
  category: DiagnosticErrorCategory;
  message: string;
  details: string;
  recommendedEngine?: 'hls' | 'mpegts' | 'native';
  alternativeFormatUrl?: string;
  recoveryActions: RecoveryAction[];
  timestamp: string;
}

/**
 * Determines the optimal decoding engine for an IPTV stream URL.
 * Inspired by IPTVnator's resolvePlaybackUrlSourceKind.
 */
export function resolvePlaybackUrlSourceKind(url: string, isRadio = false): PlaybackSourceKind {
  if (!url) return 'native';
  if (isRadio) return 'radio';

  // If this is a proxied URL, extract the inner stream URL for accurate format inspection
  let targetUrl = url;
  try {
    if (url.includes('/api/stream/proxy') || url.includes('/stream/proxy')) {
      const parsed = new URL(url, 'http://localhost');
      const inner = parsed.searchParams.get('url');
      if (inner) {
        targetUrl = inner;
      }
    }
  } catch {
    // fallback to original url if parsing fails
  }

  const clean = targetUrl.split('?')[0].toLowerCase().trim();

  // DASH Manifests
  if (clean.endsWith('.mpd')) {
    return 'dash';
  }

  // HLS Manifests
  if (clean.endsWith('.m3u8') || clean.endsWith('.m3u')) {
    return 'hls';
  }

  // MPEG-TS Streams (.ts, .m2ts, or Xtream live streams with extensionless/numeric paths)
  if (
    clean.endsWith('.ts') || 
    clean.endsWith('.m2ts') || 
    /\/live\/[^/]+\/[^/]+\/\d+$/i.test(clean) ||
    /\/timeshift\/[^/]+\/[^/]+/i.test(clean)
  ) {
    return 'mpegts';
  }

  // Common direct video files (MP4, MKV, WebM, MOV, AVI, FLV, M4V, etc.) or Xtream movie/series endpoints
  if (
    /\.(mp4|mkv|webm|mov|avi|flv|m4v|3gp|wmv)$/i.test(clean) ||
    /\/movie\/[^/]+\/[^/]+\/\d+/i.test(clean) ||
    /\/series\/[^/]+\/[^/]+\/\d+/i.test(clean)
  ) {
    return 'native';
  }

  // Audio stream formats
  if (/\.(mp3|aac|ogg|wav|flac|m4a)$/i.test(clean)) {
    return 'radio';
  }

  // If path doesn't have an extension, IPTV streams are typically MPEG-TS or HLS
  // By default, route through HLS if /hls/ or output=hls is in path, else MPEG-TS
  if (clean.includes('/hls/') || clean.includes('output=hls')) {
    return 'hls';
  }

  if (clean.includes('/ts/') || clean.includes('output=ts') || clean.includes('/ch/')) {
    return 'mpegts';
  }

  if (clean.includes('/stalker') || clean.includes('/cmd/')) {
    return clean.includes('.m3u8') ? 'hls' : 'mpegts';
  }

  // Default to HLS for modern IPTV playlists
  return 'hls';
}

/**
 * Derives the alternative stream format for a stream URL.
 * Detects Xtream Codes patterns and converts between .m3u8 and .ts.
 */
export function deriveAlternativeStreamFormat(url: string): { url: string; format: 'ts' | 'hls' } | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;

    // Pattern 1: Xtream /live/username/password/12345.m3u8 -> .ts
    if (pathname.endsWith('.m3u8')) {
      const newPath = pathname.replace(/\.m3u8$/i, '.ts');
      parsed.pathname = newPath;
      return { url: parsed.toString(), format: 'ts' };
    }

    // Pattern 2: Xtream /live/username/password/12345.ts -> .m3u8
    if (pathname.endsWith('.ts')) {
      const newPath = pathname.replace(/\.ts$/i, '.m3u8');
      parsed.pathname = newPath;
      return { url: parsed.toString(), format: 'hls' };
    }

    // Pattern 3: Xtream extension-less numeric stream id: /live/user/pass/12345
    if (/\/live\/[^/]+\/[^/]+\/\d+$/i.test(pathname)) {
      parsed.pathname = `${pathname}.ts`;
      return { url: parsed.toString(), format: 'ts' };
    }

    // Pattern 4: Query parameter based (e.g. output=m3u8 <-> output=ts)
    if (parsed.searchParams.get('output') === 'm3u8') {
      parsed.searchParams.set('output', 'ts');
      return { url: parsed.toString(), format: 'ts' };
    } else if (parsed.searchParams.get('output') === 'ts') {
      parsed.searchParams.set('output', 'm3u8');
      return { url: parsed.toString(), format: 'hls' };
    }

    return null;
  } catch {
    // If not a valid URL or proxy wrapped, regex fallback
    if (url.includes('.m3u8')) {
      return { url: url.replace(/\.m3u8(\?|$)/i, '.ts$1'), format: 'ts' };
    }
    if (url.includes('.ts')) {
      return { url: url.replace(/\.ts(\?|$)/i, '.m3u8$1'), format: 'hls' };
    }
    return null;
  }
}

/**
 * Analyzes playback failures and recommends ranked recovery actions.
 * Inspired by IPTVnator's recommendPlaybackRecovery policy.
 */
export function analyzePlaybackError(
  error: any,
  currentEngine: 'hls' | 'mpegts' | 'native',
  url: string,
  hasAlternateCandidates = false,
  isCurrentlyProxy = false
): PlaybackDiagnostic {
  const altFormat = deriveAlternativeStreamFormat(url);
  const actions: RecoveryAction[] = [];
  const cleanUrl = url.split('?')[0].toLowerCase();

  let category: DiagnosticErrorCategory = 'UNKNOWN';
  let message = 'Playback Stalled or Unreachable';
  let details = 'The video decoder encountered a playback disruption.';

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isMixedContent = isHttps && url.startsWith('http://') && !isCurrentlyProxy;

  // 1. Mixed Content / CORS Block Detection
  if (isMixedContent) {
    category = 'CORS_BLOCKED';
    message = 'Insecure Mixed Content Blocked';
    details = 'Your browser blocked this HTTP stream because the application is running over HTTPS.';
    actions.push({
      id: 'toggle-proxy',
      label: 'Route via CORS Proxy Relay',
      description: 'Wrap the stream in our secure backend proxy to bypass browser mixed-content restrictions.',
      type: 'TOGGLE_PROXY',
      primary: true
    });
  } 
  // 2. MPEG-TS format fed to Native or HLS without TS demuxer
  else if ((cleanUrl.endsWith('.ts') || cleanUrl.endsWith('.m2ts')) && currentEngine !== 'mpegts') {
    category = 'FORMAT_MISMATCH';
    message = 'Raw MPEG-TS Format Detected';
    details = 'Browsers cannot decode MPEG-TS files natively. The mpegts.js demuxer engine is required.';
    actions.push({
      id: 'switch-mpegts',
      label: 'Switch to MPEG-TS Decoder',
      description: 'Activate the mpegts.js MSE demuxer to decode this stream.',
      type: 'SWITCH_ENGINE',
      targetValue: 'mpegts',
      primary: true
    });
    if (altFormat) {
      actions.push({
        id: 'swap-format',
        label: `Switch Stream to ${altFormat.format.toUpperCase()} (${altFormat.format === 'ts' ? '.ts' : '.m3u8'})`,
        description: `Attempt connection using the ${altFormat.format.toUpperCase()} broadcast format.`,
        type: 'SWITCH_FORMAT',
        targetValue: altFormat.url
      });
    }
  }
  // 3. Xtream format error (HLS failing on server that only serves TS, or vice-versa)
  else if (altFormat) {
    category = 'FORMAT_MISMATCH';
    message = `Feed format (${altFormat.format === 'ts' ? 'HLS' : 'MPEG-TS'}) failed to decode`;
    details = `Provider server may not support ${altFormat.format === 'ts' ? '.m3u8' : '.ts'} for this stream. Swapping format is recommended.`;
    actions.push({
      id: 'swap-format',
      label: `Switch Stream to ${altFormat.format.toUpperCase()} (${altFormat.format === 'ts' ? '.ts' : '.m3u8'})`,
      description: `Attempt connection using the ${altFormat.format.toUpperCase()} broadcast format.`,
      type: 'SWITCH_FORMAT',
      targetValue: altFormat.url,
      primary: true
    });
  } 
  // 4. General Network or Codec Error
  else if (error?.type === 'networkError' || error?.code === 2) {
    category = 'NETWORK';
    message = 'Network Stream Timeout';
    details = 'Upstream IPTV provider server did not respond within the timeout window.';
    if (!isCurrentlyProxy) {
      actions.push({
        id: 'toggle-proxy',
        label: 'Route via CORS Proxy Relay',
        description: 'Try tunneling through the proxy relay to bypass firewall/ISP blocks.',
        type: 'TOGGLE_PROXY',
        primary: true
      });
    }
  } else if (error?.code === 3 || error?.code === 4) {
    category = 'CODEC_UNSUPPORTED';
    message = 'Media Codec or Container Unsupported';
    details = 'The audio or video stream uses a codec (e.g. HEVC/H.265 or AC3 audio) unsupported by this decoder.';
    if (currentEngine !== 'mpegts') {
      actions.push({
        id: 'switch-mpegts',
        label: 'Try MPEG-TS Demuxer',
        description: 'Attempt parsing with the mpegts.js engine.',
        type: 'SWITCH_ENGINE',
        targetValue: 'mpegts',
        primary: true
      });
    } else {
      actions.push({
        id: 'switch-hls',
        label: 'Try HLS.js Demuxer',
        description: 'Attempt parsing with the HLS.js engine.',
        type: 'SWITCH_ENGINE',
        targetValue: 'hls',
        primary: true
      });
    }
  }

  // Always offer alternate feed candidate if available
  if (hasAlternateCandidates) {
    actions.push({
      id: 'try-candidate',
      label: 'Switch to Alternate Feed',
      description: 'Switch to another broadcast source candidate configured for this channel.',
      type: 'TRY_CANDIDATE'
    });
  }

  // Always offer standard retry
  actions.push({
    id: 'retry',
    label: 'Reload & Reconnect',
    description: 'Re-initialize the active decoding engine and retry buffer.',
    type: 'RETRY'
  });

  return {
    category,
    message,
    details,
    recommendedEngine: actions.find(a => a.type === 'SWITCH_ENGINE')?.targetValue,
    alternativeFormatUrl: altFormat?.url,
    recoveryActions: actions.slice(0, 3), // Return top 3 ranked actions
    timestamp: new Date().toLocaleTimeString()
  };
}
