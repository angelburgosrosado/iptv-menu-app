/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Readable } from 'node:stream';
import { Request, Response } from 'express';
import { Logger } from '@iptv-menu/logging';

const logger = new Logger('stream-proxy');

// Standard user agent spoofing for IPTV server compatibility
export const DEFAULT_UPSTREAM_USER_AGENT = 'VLC/3.0.18 LibVLC/3.0.18';

/**
 * Validates if the target URL is safe to proxy (SSRF prevention).
 */
export function isSafeTargetUrl(
  rawUrl: string,
  forceStrictCheck = false
): { safe: boolean; reason?: string; parsedUrl?: URL } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, reason: 'Protocol must be http or https' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Cloud metadata endpoint (169.254.169.254) is ALWAYS blocked regardless of environment
  if (hostname === '169.254.169.254') {
    return { safe: false, reason: 'Access to private or loopback addresses is prohibited' };
  }

  // Allow local addresses only in testing or when explicitly enabled
  const allowLocal = !forceStrictCheck && (process.env.ALLOW_LOCAL_PROXY === 'true' || process.env.NODE_ENV === 'test');

  if (!allowLocal) {
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.')
    ) {
      return { safe: false, reason: 'Access to private or loopback addresses is prohibited' };
    }

    if (hostname.startsWith('172.')) {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        const secondOctet = parseInt(parts[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) {
          return { safe: false, reason: 'Access to private addresses is prohibited' };
        }
      }
    }
  }

  return { safe: true, parsedUrl: parsed };
}

/**
 * Rewrites an M3U8 manifest so all playlist, segment, media, and key URLs
 * route through our backend proxy gateway.
 */
export function rewriteM3u8Manifest(
  manifest: string,
  baseUrl: string,
  proxyEndpoint = '/api/stream/proxy'
): string {
  const lines = manifest.split(/\r?\n/);
  const rewrittenLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      rewrittenLines.push(rawLine);
      continue;
    }

    if (trimmed.startsWith('#')) {
      // Tags with URI="..." such as #EXT-X-KEY, #EXT-X-MEDIA, #EXT-X-MAP
      if (trimmed.includes('URI="')) {
        const rewrittenTag = trimmed.replace(/URI="([^"]+)"/g, (_, uri) => {
          try {
            const absoluteUrl = new URL(uri, baseUrl).href;
            const uaParam = '&ua=' + encodeURIComponent(proxyEndpoint.includes('&ua=') ? new URL(proxyEndpoint, 'http://localhost').searchParams.get('ua') || '' : '');
            return `URI="${proxyEndpoint.split('&ua=')[0]}?url=${encodeURIComponent(absoluteUrl)}${uaParam !== '&ua=' ? uaParam : ''}"`;
          } catch {
            return `URI="${uri}"`;
          }
        });
        rewrittenLines.push(rewrittenTag);
      } else {
        rewrittenLines.push(rawLine);
      }
    } else {
      // Variant playlist URI or media chunk URL
      try {
        const absoluteUrl = new URL(trimmed, baseUrl).href;
        const uaParam = '&ua=' + encodeURIComponent(proxyEndpoint.includes('&ua=') ? new URL(proxyEndpoint, 'http://localhost').searchParams.get('ua') || '' : '');
        rewrittenLines.push(`${proxyEndpoint.split('&ua=')[0]}?url=${encodeURIComponent(absoluteUrl)}${uaParam !== '&ua=' ? uaParam : ''}`);
      } catch {
        rewrittenLines.push(trimmed);
      }
    }
  }

  return rewrittenLines.join('\n');
}

/**
 * Core handler for /api/stream/proxy
 */
export async function handleStreamProxy(req: Request, res: Response): Promise<void> {
  // 1. Handle CORS pre-flight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).json({ error: 'Missing stream target URL (?url=...)' });
    return;
  }

  const validation = isSafeTargetUrl(targetUrl);
  if (!validation.safe) {
    res.status(400).json({ error: validation.reason || 'Forbidden stream URL target' });
    return;
  }

  const customUserAgent = req.query.ua as string | undefined;

  const abortController = new AbortController();
  req.on('close', () => {
    abortController.abort();
  });

  try {
    const upstreamHeaders: Record<string, string> = {
      'User-Agent': customUserAgent || DEFAULT_UPSTREAM_USER_AGENT,
      'Accept': '*/*'
    };

    if (req.headers.range) {
      upstreamHeaders['Range'] = req.headers.range as string;
    }

    const upstreamResponse = await fetch(targetUrl, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: upstreamHeaders,
      signal: abortController.signal,
      redirect: 'follow'
    });

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      logger.warn(`Upstream returned error status ${upstreamResponse.status}`, { targetUrl });
      res.status(upstreamResponse.status).json({
        error: `Upstream stream server responded with HTTP ${upstreamResponse.status}`,
        statusCode: upstreamResponse.status,
        targetUrl
      });
      return;
    }

    const contentType = upstreamResponse.headers.get('content-type') || '';
    const finalBaseUrl = upstreamResponse.url || targetUrl;
    const isM3u8Url = targetUrl.toLowerCase().includes('.m3u8') || finalBaseUrl.toLowerCase().includes('.m3u8');
    const isM3u8Mime = contentType.includes('mpegurl') || contentType.includes('application/x-mpegURL');

    // If it looks like a manifest, verify by checking content or URL
    if (isM3u8Url || isM3u8Mime) {
      const text = await upstreamResponse.text();

      if (text.trim().startsWith('#EXTM3U') || text.includes('#EXTINF')) {
        let proxyEndpointUrl = '/api/stream/proxy';
        if (customUserAgent) {
           proxyEndpointUrl += `&ua=${encodeURIComponent(customUserAgent)}`;
        }
        const rewritten = rewriteM3u8Manifest(text, finalBaseUrl, proxyEndpointUrl);

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.status(upstreamResponse.status).send(rewritten);
        return;
      }

      // Not an M3U8 playlist after all (binary or error body)
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      res.status(upstreamResponse.status).send(text);
      return;
    }

    // Binary stream chunk (MPEG-TS, AAC, MP4, etc.)
    const resolvedContentType = 
      contentType || 
      (targetUrl.toLowerCase().includes('.ts') ? 'video/mp2t' : 'application/octet-stream');

    res.setHeader('Content-Type', resolvedContentType);
    res.setHeader('Accept-Ranges', 'bytes');

    const contentLength = upstreamResponse.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const contentRange = upstreamResponse.headers.get('content-range');
    if (contentRange) {
      res.setHeader('Content-Range', contentRange);
    }

    // Cache immutable video chunks for 24h
    res.setHeader('Cache-Control', 'public, max-age=86400');

    if (req.method === 'HEAD') {
      res.status(upstreamResponse.status).end();
      return;
    }

    if (upstreamResponse.body) {
      res.status(upstreamResponse.status);
      const nodeStream = Readable.fromWeb(upstreamResponse.body as any);
      nodeStream.pipe(res);
    } else {
      res.status(upstreamResponse.status).end();
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // Client disconnected normally, no error response needed
      return;
    }
    logger.error('Stream proxy relay failed', { error: error.message, targetUrl });
    if (!res.headersSent) {
      res.status(502).json({ error: 'Stream proxy failed to reach upstream video host', details: error.message });
    }
  }
}
