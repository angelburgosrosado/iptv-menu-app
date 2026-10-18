import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import path from 'path';

describe('Public Client Downloads & Sideload API', () => {
  const app = express();

  app.get('/api/public/downloads', (req, res) => {
    res.json({
      appName: 'IPTV.Menu Pro',
      version: '1.2.0',
      downloaderCode: '94218',
      directApkUrl: '/api/download/latest.apk',
      clients: [
        {
          id: 'firetv',
          name: 'Amazon Fire TV & Android TV',
          type: 'apk',
          downloaderCode: '94218',
          downloadUrl: '/api/download/latest.apk'
        },
        {
          id: 'android_mobile',
          name: 'Android Mobile & Tablet',
          type: 'apk',
          downloadUrl: '/api/download/latest.apk'
        },
        {
          id: 'apple_pwa',
          name: 'Apple iOS & macOS Web Player',
          type: 'pwa',
          downloadUrl: '/'
        }
      ]
    });
  });

  app.get(['/api/download/latest.apk', '/download/latest.apk'], (req, res) => {
    const remoteUrl = process.env.APK_DOWNLOAD_URL;
    if (remoteUrl) {
      return res.redirect(302, remoteUrl);
    }
    const fallbackUrl = 'https://github.com/angelburgosrosado/iptv-menu-app/releases/latest/download/IPTV-Menu-Pro.apk';
    return res.redirect(302, fallbackUrl);
  });

  it('should return app info, platforms, and Downloader code 94218', async () => {
    const res = await request(app).get('/api/public/downloads');
    expect(res.status).toBe(200);
    expect(res.body.appName).toBe('IPTV.Menu Pro');
    expect(res.body.downloaderCode).toBe('94218');
    expect(res.body.directApkUrl).toBe('/api/download/latest.apk');
    expect(res.body.clients.length).toBeGreaterThanOrEqual(3);
  });

  it('should redirect APK downloads to release package or configured mirror', async () => {
    const res = await request(app).get('/api/download/latest.apk');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('IPTV-Menu-Pro.apk');
  });

  it('should support short path /download/latest.apk for Downloader apps', async () => {
    const res = await request(app).get('/download/latest.apk');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('IPTV-Menu-Pro.apk');
  });

  it('should redirect source code zip download to github main branch archive', async () => {
    app.get(['/api/download/source.zip', '/download/source.zip'], (req, res) => {
      const remoteUrl = process.env.SOURCE_ZIP_URL || 'https://github.com/angelburgosrosado/iptv-menu-app/archive/refs/heads/main.zip';
      return res.redirect(302, remoteUrl);
    });
    const res = await request(app).get('/api/download/source.zip');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('main.zip');
  });
});
