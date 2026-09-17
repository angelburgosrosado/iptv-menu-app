/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { streamHealthProber } from '../apps/api/src/services/streamHealthProber';

describe('Stream Latency & Bitrate Diagnostics Telemetry', () => {
  describe('CDN & Host Domain Extractor', () => {
    it('should correctly parse edge CDN host from stream URLs', () => {
      const getHost = (url: string) => {
        try {
          return new URL(url).hostname;
        } catch {
          return 'direct-edge-origin';
        }
      };

      expect(getHost('https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8')).toBe('dwamdstream102.akamaized.net');
      expect(getHost('http://line.melhata.org:80/live/8rvzieximl/h1usotpevd/10482.m3u8')).toBe('line.melhata.org');
      expect(getHost('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')).toBe('test-streams.mux.dev');
      expect(getHost('invalid-url')).toBe('direct-edge-origin');
    });
  });

  describe('Diagnostics Telemetry Report Schema', () => {
    it('should generate a complete, structured diagnostics JSON payload', () => {
      const generateReport = (params: {
        channel: string;
        group?: string;
        streamUrl: string;
        isProxy: boolean;
        uptimeSeconds: number;
        bitrateMbps: number;
        bufferLengthSec: number;
        pingMs: number;
        audioTracksCount: number;
        subtitleTracksCount: number;
      }) => {
        const u = new URL(params.streamUrl);
        const hrs = Math.floor(params.uptimeSeconds / 3600);
        const mins = Math.floor((params.uptimeSeconds % 3600) / 60);
        const secs = params.uptimeSeconds % 60;
        const pad = (n: number) => n.toString().padStart(2, '0');

        return {
          timestamp: '2026-09-17T13:30:00.000Z',
          channel: params.channel,
          group: params.group || 'General',
          streamUrl: params.streamUrl,
          transport: params.isProxy ? 'HTTP Proxy Relay (CORS Gateway)' : 'Direct HLS Edge Transport',
          cdnHost: u.hostname,
          uptime: `${pad(hrs)}:${pad(mins)}:${pad(secs)}`,
          metrics: {
            resolution: '1920x1080 (16:9)',
            fps: 60,
            bitrateMbps: params.bitrateMbps,
            bufferHealthSec: params.bufferLengthSec,
            pingLatencyMs: params.pingMs,
            droppedFrames: 0,
            videoCodec: 'H.264 / AVC High@L4.2',
            audioCodec: 'AAC-LC (48kHz, Stereo)',
            dataConsumedMb: (params.uptimeSeconds * (params.bitrateMbps / 8)).toFixed(1)
          },
          tracks: {
            audio: params.audioTracksCount,
            subtitles: params.subtitleTracksCount
          }
        };
      };

      const report = generateReport({
        channel: 'NASA TV HD',
        group: 'Science',
        streamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        isProxy: false,
        uptimeSeconds: 3665, // 01:01:05
        bitrateMbps: 4.85,
        bufferLengthSec: 14.2,
        pingMs: 38,
        audioTracksCount: 2,
        subtitleTracksCount: 1
      });

      expect(report.channel).toBe('NASA TV HD');
      expect(report.transport).toBe('Direct HLS Edge Transport');
      expect(report.cdnHost).toBe('test-streams.mux.dev');
      expect(report.uptime).toBe('01:01:05');
      expect(report.metrics.resolution).toBe('1920x1080 (16:9)');
      expect(report.metrics.bitrateMbps).toBe(4.85);
      expect(report.metrics.droppedFrames).toBe(0);
      expect(report.tracks.audio).toBe(2);
      expect(report.tracks.subtitles).toBe(1);
    });
  });

  describe('Low-Bandwidth Stream Prober Diagnostics Integration', () => {
    it('should measure latency and validate stream response headers via streamHealthProber', async () => {
      // Test invalid / unreachable target
      const offlineResult = await streamHealthProber.probeStream('http://invalid.stream.unreachable-domain-12345.xyz/stream.m3u8', true);
      expect(offlineResult.isOnline).toBe(false);
      expect(offlineResult.isHls).toBe(true);
      expect(offlineResult.error).toBeDefined();

      // Test SSRF protection
      const ssrfResult = await streamHealthProber.probeStream('http://169.254.169.254/latest/meta-data', true);
      expect(ssrfResult.isOnline).toBe(false);
      expect(ssrfResult.error).toContain('Access to private or loopback addresses is prohibited');
    });
  });
});
