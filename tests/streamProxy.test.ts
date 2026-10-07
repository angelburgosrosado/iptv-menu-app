/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'node:http';
import { app } from '../apps/api/src/server';
import { 
  isSafeTargetUrl, 
  rewriteM3u8Manifest 
} from '../apps/api/src/services/streamProxyService';

describe('Universal Stream Relay & M3U8 Proxy Gateway', () => {
  let mockServer: http.Server;
  let mockServerPort: number;

  beforeAll(async () => {
    // Spin up a light in-memory HTTP server to mock upstream IPTV servers
    mockServer = http.createServer((req, res) => {
      if (req.url === '/live/master.m3u8') {
        res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl' });
        res.end(`#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720
https://external-cdn.tv/720p.m3u8
`);
      } else if (req.url === '/live/360p.m3u8') {
        res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl' });
        res.end(`#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:1
#EXT-X-KEY:METHOD=AES-128,URI="enc.key"
#EXTINF:10.0,
chunk_001.ts
#EXTINF:10.0,
chunk_002.ts
`);
      } else if (req.url === '/redirect/stream.m3u8') {
        res.writeHead(302, { 'Location': '/destination/playlist.m3u8' });
        res.end();
      } else if (req.url === '/destination/playlist.m3u8') {
        res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl' });
        res.end(`#EXTM3U
#EXTINF:10.0,
relative_segment.ts
`);
      } else if (req.url === '/live/chunk_001.ts') {
        res.writeHead(200, { 
          'Content-Type': 'video/mp2t',
          'Content-Length': '12',
          'Accept-Ranges': 'bytes'
        });
        res.end('FAKE_TS_DATA');
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    await new Promise<void>((resolve) => {
      mockServer.listen(0, () => {
        const address = mockServer.address();
        mockServerPort = (address as any).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      mockServer.close(() => resolve());
    });
  });

  describe('URL Safety & SSRF Validation', () => {
    it('should approve valid public HTTP/HTTPS URLs', () => {
      const httpResult = isSafeTargetUrl('http://streams.example.com/live/stream.m3u8');
      expect(httpResult.safe).toBe(true);

      const httpsResult = isSafeTargetUrl('https://cdn.iptv-provider.net/channel1/index.m3u8?token=xyz');
      expect(httpsResult.safe).toBe(true);
    });

    it('should reject invalid or non-HTTP protocols', () => {
      expect(isSafeTargetUrl('not_a_valid_url').safe).toBe(false);
      expect(isSafeTargetUrl('ftp://example.com/file.ts').safe).toBe(false);
      expect(isSafeTargetUrl('file:///etc/passwd').safe).toBe(false);
      expect(isSafeTargetUrl('gopher://example.com').safe).toBe(false);
    });

    it('should unconditionally reject cloud metadata service', () => {
      expect(isSafeTargetUrl('http://169.254.169.254/latest/meta-data/').safe).toBe(false);
      expect(isSafeTargetUrl('http://169.254.1.1/').safe).toBe(false);
    });

    it('should reject private, loopback, and local network addresses in strict mode', () => {
      expect(isSafeTargetUrl('http://127.0.0.1:8080/stream.m3u8', true).safe).toBe(false);
      expect(isSafeTargetUrl('http://localhost:3000/stream.m3u8', true).safe).toBe(false);
      expect(isSafeTargetUrl('http://10.0.0.1/live/test.ts', true).safe).toBe(false);
      expect(isSafeTargetUrl('http://192.168.1.100/feed.m3u8', true).safe).toBe(false);
      expect(isSafeTargetUrl('http://172.16.0.1/stream.m3u8', true).safe).toBe(false);
      expect(isSafeTargetUrl('http://172.31.255.255/stream.m3u8', true).safe).toBe(false);
      expect(isSafeTargetUrl('http://internal.service.local/stream.m3u8', true).safe).toBe(false);
      expect(isSafeTargetUrl('http://[::1]:8080/stream.m3u8', true).safe).toBe(false);
      expect(isSafeTargetUrl('http://[fe80::1]/stream.m3u8', true).safe).toBe(false);
    });
  });

  describe('M3U8 Manifest Rewriting', () => {
    it('should preserve and encode custom user-agent when rewriting manifest', () => {
      const manifest = `#EXTM3U\nchunk.ts\n`;
      const rewritten = rewriteM3u8Manifest(manifest, 'http://origin.tv/stream.m3u8', '/api/stream/proxy', 'CustomPlayer/1.0');
      expect(rewritten).toContain('ua=CustomPlayer%2F1.0');
      expect(rewritten).toContain('url=' + encodeURIComponent('http://origin.tv/chunk.ts'));
    });
    it('should rewrite relative and absolute media chunk URLs to route through proxy', () => {
      const sampleManifest = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
segment1.ts
#EXTINF:10.0,
https://cdn.tv/segment2.ts
`;
      const baseUrl = 'http://origin.tv/stream/index.m3u8';
      const rewritten = rewriteM3u8Manifest(sampleManifest, baseUrl);

      expect(rewritten).toContain('/api/stream/proxy?url=' + encodeURIComponent('http://origin.tv/stream/segment1.ts'));
      expect(rewritten).toContain('/api/stream/proxy?url=' + encodeURIComponent('https://cdn.tv/segment2.ts'));
    });

    it('should rewrite encrypted #EXT-X-KEY URIs', () => {
      const sampleWithKey = `#EXTM3U
#EXT-X-KEY:METHOD=AES-128,URI="keys/video.key",IV=0x12345
#EXTINF:6.0,
seg1.ts
`;
      const baseUrl = 'https://origin.tv/live/stream.m3u8';
      const rewritten = rewriteM3u8Manifest(sampleWithKey, baseUrl);

      expect(rewritten).toContain('URI="/api/stream/proxy?url=' + encodeURIComponent('https://origin.tv/live/keys/video.key') + '"');
    });

    it('should rewrite master playlist variant streams', () => {
      const masterManifest = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1280000,RESOLUTION=1280x720
720p.m3u8
`;
      const baseUrl = 'http://origin.tv/hls/master.m3u8';
      const rewritten = rewriteM3u8Manifest(masterManifest, baseUrl);

      expect(rewritten).toContain('/api/stream/proxy?url=' + encodeURIComponent('http://origin.tv/hls/720p.m3u8'));
    });
  });

  describe('HTTP Endpoints /api/stream/proxy', () => {
    it('should return 204 No Content for OPTIONS preflight with CORS headers', async () => {
      const res = await request(app)
        .options('/api/stream/proxy')
        .set('Origin', 'https://web.iptv.menu')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toMatch(/\*|https:\/\/web\.iptv\.menu/);
      expect(res.headers['access-control-allow-methods']).toContain('GET');
    });

    it('should return 400 Bad Request when url parameter is missing', async () => {
      const res = await request(app).get('/api/stream/proxy');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Missing stream target URL');
    });

    it('should return 400 Bad Request for unsafe protocol', async () => {
      const res = await request(app).get('/api/stream/proxy?url=' + encodeURIComponent('file:///etc/passwd'));

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should proxy and rewrite M3U8 manifest with permissive CORS headers', async () => {
      const targetUrl = `http://127.0.0.1:${mockServerPort}/live/360p.m3u8`;
      const res = await request(app).get('/api/stream/proxy?url=' + encodeURIComponent(targetUrl));

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('*');
      expect(res.headers['content-type']).toContain('application/vnd.apple.mpegurl');
      expect(res.text).toContain('/api/stream/proxy?url=');
      expect(res.text).toContain('chunk_001.ts');
      expect(res.text).toContain('enc.key');
    });

    it('should stream binary MPEG-TS video chunks', async () => {
      const targetUrl = `http://127.0.0.1:${mockServerPort}/live/chunk_001.ts`;
      const res = await request(app)
        .get('/api/stream/proxy?url=' + encodeURIComponent(targetUrl))
        .responseType('blob');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('*');
      expect(res.headers['content-type']).toContain('video/mp2t');
      expect(res.headers['cache-control']).toContain('public');
      const dataStr = Buffer.isBuffer(res.body) ? res.body.toString('utf8') : (res.text || '');
      expect(dataStr).toBe('FAKE_TS_DATA');
    });

    it('should rewrite relative segments using the final redirected URL', async () => {
      const targetUrl = `http://127.0.0.1:${mockServerPort}/redirect/stream.m3u8`;
      const res = await request(app).get('/api/stream/proxy?url=' + encodeURIComponent(targetUrl));

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/vnd.apple.mpegurl');
      // Must resolve against /destination/playlist.m3u8, NOT /redirect/stream.m3u8
      const expectedSegmentUrl = `http://127.0.0.1:${mockServerPort}/destination/relative_segment.ts`;
      expect(res.text).toContain('/api/stream/proxy?url=' + encodeURIComponent(expectedSegmentUrl));
    });
  });
});
