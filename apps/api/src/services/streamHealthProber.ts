/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '@iptv-menu/logging';
import { isSafeTargetUrl, DEFAULT_UPSTREAM_USER_AGENT } from './streamProxyService';

const logger = new Logger('stream-health-prober');

export interface StreamProbeResult {
  url: string;
  isOnline: boolean;
  httpStatus?: number;
  latencyMs: number;
  contentType?: string;
  isHls: boolean;
  bandwidthEstimateBps?: number;
  corsHeadersPresent: boolean;
  error?: string;
  timestamp: string;
}

export class StreamHealthProber {
  private static instance: StreamHealthProber;
  private cache = new Map<string, { result: StreamProbeResult; expiresAt: number }>();
  private readonly cacheTtlMs = 1000 * 60 * 15; // 15 minutes TTL

  private constructor() {}

  public static getInstance(): StreamHealthProber {
    if (!StreamHealthProber.instance) {
      StreamHealthProber.instance = new StreamHealthProber();
    }
    return StreamHealthProber.instance;
  }

  /**
   * Probes an upstream stream URL (GET with Range header or fast HEAD)
   * to measure round-trip latency, HTTP status, and MIME format.
   */
  public async probeStream(rawUrl: string, force = false): Promise<StreamProbeResult> {
    const cached = this.cache.get(rawUrl);
    if (!force && cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    const { safe, reason } = isSafeTargetUrl(rawUrl);
    if (!safe) {
      const failedResult: StreamProbeResult = {
        url: rawUrl,
        isOnline: false,
        latencyMs: 0,
        isHls: false,
        corsHeadersPresent: false,
        error: reason || 'URL not permitted',
        timestamp: new Date().toISOString()
      };
      return failedResult;
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    try {
      const response = await fetch(rawUrl, {
        method: 'GET',
        headers: {
          'User-Agent': DEFAULT_UPSTREAM_USER_AGENT,
          Range: 'bytes=0-1024' // Request only first 1KB for minimal bandwidth consumption
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;
      const contentType = response.headers.get('content-type') || '';
      const corsOrigin = response.headers.get('access-control-allow-origin');
      const isOnline = response.ok || response.status === 206 || response.status === 302 || response.status === 301;
      const isHls = contentType.includes('mpegurl') || rawUrl.toLowerCase().includes('.m3u8');

      const result: StreamProbeResult = {
        url: rawUrl,
        isOnline,
        httpStatus: response.status,
        latencyMs,
        contentType,
        isHls,
        corsHeadersPresent: !!corsOrigin,
        timestamp: new Date().toISOString()
      };

      this.cache.set(rawUrl, {
        result,
        expiresAt: Date.now() + this.cacheTtlMs
      });

      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      const isAbort = err.name === 'AbortError';

      const errorResult: StreamProbeResult = {
        url: rawUrl,
        isOnline: false,
        latencyMs,
        isHls: rawUrl.toLowerCase().includes('.m3u8'),
        corsHeadersPresent: false,
        error: isAbort ? 'Probe timed out after 6000ms' : err.message,
        timestamp: new Date().toISOString()
      };

      this.cache.set(rawUrl, {
        result: errorResult,
        expiresAt: Date.now() + (1000 * 60 * 2) // Shorter cache for failures
      });

      return errorResult;
    }
  }

  /**
   * Batch probe up to 10 streams concurrently
   */
  public async probeBatch(urls: string[]): Promise<Record<string, StreamProbeResult>> {
    const limitedUrls = urls.slice(0, 10);
    const results = await Promise.all(limitedUrls.map((u) => this.probeStream(u)));
    const map: Record<string, StreamProbeResult> = {};
    for (let i = 0; i < limitedUrls.length; i++) {
      map[limitedUrls[i]] = results[i];
    }
    return map;
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const streamHealthProber = StreamHealthProber.getInstance();
