import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../apps/api/src/server';
import { BuildRepository, WorkspaceRepository, TvPairingRepository } from '@iptv-menu/db';

const createBearerToken = (payload: object) => {
  const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `Bearer fakeHdr.${base64}.fakeSig`;
};

const adminToken = createBearerToken({
  uid: 'admin_master',
  email: 'admin@iptv.menu',
  role: 'admin'
});

const regularUserToken = createBearerToken({
  uid: 'user_regular',
  email: 'viewer@gmail.com',
  role: 'user'
});

describe('apps/api - REST API Endpoints & Public Services', () => {
  describe('GET /api/health', () => {
    it('should return 200 OK with health status and service metadata', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'iptv-api'
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/public/pricing', () => {
    it('should return platform pricing tiers including Free, Pro, and App Builder', async () => {
      const response = await request(app).get('/api/public/pricing');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('plans');
      expect(Array.isArray(response.body.plans)).toBe(true);
      expect(response.body.plans.length).toBeGreaterThanOrEqual(3);

      const planIds = response.body.plans.map((p: any) => p.id);
      expect(planIds).toContain('free');
      expect(planIds).toContain('pro');
      expect(planIds).toContain('builder');
    });
  });

  describe('GET /api/public/devices', () => {
    it('should return certified hardware devices for IPTV streaming', async () => {
      const response = await request(app).get('/api/public/devices');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('certified');
      expect(Array.isArray(response.body.certified)).toBe(true);
      expect(response.body.certified.length).toBeGreaterThanOrEqual(1);

      const firstDevice = response.body.certified[0];
      expect(firstDevice).toHaveProperty('brand');
      expect(firstDevice).toHaveProperty('name');
      expect(firstDevice.status).toBe('certified');
    });
  });

  describe('POST /api/public/contact', () => {
    it('should accept customer inquiries and return 200', async () => {
      const response = await request(app)
        .post('/api/public/contact')
        .send({
          name: 'Angel Burgos',
          email: 'angel@iptv.menu',
          message: 'Interested in White-Label IPTV Builder platform.'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('successfully')
      });
    });
  });

  describe('Dynamic Remote OTA App Config Endpoint', () => {
    it('should return 404 for unknown or inactive app IDs', async () => {
      const response = await request(app).get('/api/v1/apps/non_existent_app_id/config');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Authentication Gate Enforcement', () => {
    it('should reject unauthenticated requests to /api/me with 401', async () => {
      const response = await request(app).get('/api/me');
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Unauthorized');
    });

    it('should reject unauthenticated requests to /api/playlists with 401', async () => {
      const response = await request(app).get('/api/playlists');
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Unauthorized');
    });

    it('should reject unauthenticated requests to /api/apps with 401', async () => {
      const response = await request(app).get('/api/apps');
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Unauthorized');
    });
  });

  describe('Production Administrative Backend (adminGuard)', () => {
    it('should deny unauthenticated requests to /api/admin/metrics with 401', async () => {
      const response = await request(app).get('/api/admin/metrics');
      expect(response.status).toBe(401);
    });

    it('should deny non-admin users access to /api/admin/metrics with 403 Forbidden', async () => {
      const response = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', regularUserToken);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });

    it('should grant admin access to /api/admin/metrics and return system telemetry', async () => {
      const response = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('system');
      expect(response.body.system).toMatchObject({
        status: 'operational',
        service: 'iptv-api',
        stack: expect.stringContaining('Neon')
      });
      expect(response.body).toHaveProperty('counts');
      expect(response.body.counts).toHaveProperty('totalUsers');
      expect(response.body.counts).toHaveProperty('totalWorkspaces');
      expect(response.body).toHaveProperty('buildsByStatus');
      expect(response.body).toHaveProperty('usersByRole');
    });

    it('should allow admin to list users via GET /api/admin/users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', adminToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should allow admin to list workspaces via GET /api/admin/workspaces', async () => {
      const response = await request(app)
        .get('/api/admin/workspaces')
        .set('Authorization', adminToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should allow admin to inspect jobs queue via GET /api/admin/jobs', async () => {
      const response = await request(app)
        .get('/api/admin/jobs')
        .set('Authorization', adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('buildJobs');
      expect(Array.isArray(response.body.buildJobs)).toBe(true);
    });

    it('should allow admin to view audit trail via GET /api/admin/audit-logs', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', adminToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should deny unauthenticated requests to /api/admin/adsense with 401', async () => {
      const response = await request(app).get('/api/admin/adsense');
      expect(response.status).toBe(401);
    });

    it('should deny non-admin users access to /api/admin/adsense with 403', async () => {
      const response = await request(app)
        .get('/api/admin/adsense')
        .set('Authorization', regularUserToken);
      expect(response.status).toBe(403);
    });

    it('should allow admin to retrieve full AdSense config via GET /api/admin/adsense', async () => {
      const response = await request(app)
        .get('/api/admin/adsense')
        .set('Authorization', adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('clientId');
      expect(response.body).toHaveProperty('slots');
      expect(response.body.slots).toHaveProperty('topBannerSlot');
      expect(response.body.slots).toHaveProperty('bottomBannerSlot');
    });

    it('should allow admin to update AdSense publisher ID and designated slots via PUT /api/admin/adsense', async () => {
      const updatePayload = {
        clientId: 'ca-pub-9999888877776666',
        enabled: true,
        testMode: true,
        slots: {
          topBannerSlot: '1111222233',
          bottomBannerSlot: '4444555566',
          sidebarSlot: '7777888899'
        }
      };

      const putRes = await request(app)
        .put('/api/admin/adsense')
        .set('Authorization', adminToken)
        .send(updatePayload);

      expect(putRes.status).toBe(200);
      expect(putRes.body.success).toBe(true);
      expect(putRes.body.config.clientId).toBe('ca-pub-9999888877776666');
      expect(putRes.body.config.testMode).toBe(true);
      expect(putRes.body.config.slots.topBannerSlot).toBe('1111222233');

      // Verify that the public endpoint immediately returns the updated config
      const pubRes = await request(app).get('/api/public/adsense');
      expect(pubRes.status).toBe(200);
      expect(pubRes.body.clientId).toBe('ca-pub-9999888877776666');
      expect(pubRes.body.testMode).toBe(true);
      expect(pubRes.body.slots.topBannerSlot).toBe('1111222233');
    });
  });

    describe('GET /api/public/adsense', () => {
    it('should return public AdSense configuration with active client and designated slots', async () => {
      const response = await request(app).get('/api/public/adsense');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('enabled');
      expect(response.body).toHaveProperty('clientId');
      expect(response.body).toHaveProperty('slots');
      expect(response.body.slots).toHaveProperty('topBannerSlot');
      expect(response.body.slots).toHaveProperty('bottomBannerSlot');
    });
  });

  describe('Universal Stream Diagnostic Prober API', () => {
    it('should reject probe requests with missing url parameter with 400', async () => {
      const response = await request(app).get('/api/stream/probe');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should prevent SSRF by rejecting probe to private / loopback IP addresses', async () => {
      const response = await request(app).get('/api/stream/probe?url=http://169.254.169.254/latest/meta-data');
      expect(response.status).toBe(200);
      expect(response.body.isOnline).toBe(false);
      expect(response.body.error).toContain('Access to private or loopback addresses is prohibited');
    });

    it('should reject invalid batch probe request missing urls array', async () => {
      const response = await request(app).post('/api/stream/probe/batch').send({});
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle batch probe request and return results map', async () => {
      const response = await request(app)
        .post('/api/stream/probe/batch')
        .send({
          urls: [
            'http://169.254.169.254/secret',
            'ftp://invalid.protocol/stream.ts'
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(response.body.totalProbed).toBe(2);
      expect(response.body.results['http://169.254.169.254/secret'].isOnline).toBe(false);
      expect(response.body.results['ftp://invalid.protocol/stream.ts'].isOnline).toBe(false);
    });
  });

  describe('Cloud Logo Proxy & SVG Fallback Avatar Generator', () => {
    it('should generate high-resolution SVG fallback avatar via /api/channels/avatar', async () => {
      const response = await request(app)
        .get('/api/channels/avatar?name=CNN%20News&size=120')
        .buffer();
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('image/svg+xml');
      const bodyText = response.text || response.body.toString();
      expect(bodyText).toContain('<svg');
      expect(bodyText).toContain('CN'); // Initials for CNN News
      expect(bodyText).toContain('linearGradient');
    });

    it('should return SVG fallback on /api/channels/logo when no url is supplied', async () => {
      const response = await request(app)
        .get('/api/channels/logo?name=ESPN%20Sports')
        .buffer();
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('image/svg+xml');
      const bodyText = response.text || response.body.toString();
      expect(bodyText).toContain('ES');
    });

    it('should block SSRF attempts on /api/channels/logo and fall back to SVG avatar', async () => {
      const response = await request(app)
        .get('/api/channels/logo?url=http://169.254.169.254/metadata&name=Locked%20Channel')
        .buffer();
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('image/svg+xml');
      const bodyText = response.text || response.body.toString();
      expect(bodyText).toContain('LC');
    });
  });

  describe('Dynamic M3U8 Playlist Export API', () => {
    it('should generate formatted M3U playlist file with attachment headers', async () => {
      const mockChannels = [
        {
          id: 'test-1',
          name: 'Global News HD',
          logo: 'https://cdn.example.com/logo.png',
          url: 'https://cdn.example.com/live/stream.m3u8',
          group: 'News',
          tvgId: 'global.news',
          countryCode: 'US',
          language: 'English'
        }
      ];

      const response = await request(app)
        .post('/api/export/playlist.m3u')
        .send({
          playlistName: 'Custom-Bundle',
          channels: mockChannels
        })
        .buffer();

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('audio/x-mpegurl');
      expect(response.headers['content-disposition']).toContain('attachment; filename="Custom-Bundle.m3u"');
      const bodyText = response.text || response.body.toString();
      expect(bodyText).toContain('#EXTM3U');
      expect(bodyText).toContain('#PLAYLIST:Custom-Bundle');
      expect(bodyText).toContain('tvg-id="global.news"');
      expect(bodyText).toContain('Global News HD');
      expect(bodyText).toContain('https://cdn.example.com/live/stream.m3u8');
    });

    it('should return 400 when channels array is missing', async () => {
      const response = await request(app)
        .post('/api/export/playlist.m3u')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Xtream Codes Live EPG & Catchup Proxy API', () => {
    it('should return 400 when required parameters are missing', async () => {
      const response = await request(app)
        .get('/api/xtream/epg?serverUrl=http://line.melhata.org');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required parameters');
    });

    it('should block SSRF attempts to private or metadata IP addresses with 403', async () => {
      const response = await request(app)
        .get('/api/xtream/epg?serverUrl=http://169.254.169.254&username=admin&password=pass&streamId=123');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('prohibited');
    });
  });

  describe('Phase 3: Playlist Ingestion & Persistence Bridge', () => {
    let createdPlaylistId = '';

    it('should create and persist remote URL playlist via POST /api/playlists', async () => {
      const response = await request(app)
        .post('/api/playlists')
        .set('Authorization', regularUserToken)
        .send({
          name: 'US Pluto TV Stream Feed',
          sourceType: 'url',
          url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pluto.m3u',
          channelCount: 142
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('playlist');
      expect(response.body.playlist.playlistId).toBeDefined();
      expect(response.body.playlist.name).toBe('US Pluto TV Stream Feed');
      expect(response.body.playlist.sourceType).toBe('url');
      expect(response.body.playlist.originalFilePath).toBe('https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pluto.m3u');
      expect(response.body.playlist.channelCount).toBe(142);
      expect(response.body.playlist.status).toBe('ready');

      createdPlaylistId = response.body.playlist.playlistId;
    });

    it('should retrieve persisted playlists for the authenticated user via GET /api/playlists', async () => {
      const response = await request(app)
        .get('/api/playlists')
        .set('Authorization', regularUserToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      const found = response.body.find((p: any) => p.playlistId === createdPlaylistId);
      expect(found).toBeDefined();
      expect(found.name).toBe('US Pluto TV Stream Feed');
    });

    it('should retrieve a single playlist by id via GET /api/playlists/:playlistId', async () => {
      const response = await request(app)
        .get(`/api/playlists/${createdPlaylistId}`)
        .set('Authorization', regularUserToken);

      expect(response.status).toBe(200);
      expect(response.body.playlistId).toBe(createdPlaylistId);
      expect(response.body.uid).toBe('user_regular');
    });

    it('should enforce workspace/user isolation: second user cannot access first user playlist', async () => {
      const secondUserToken = createBearerToken({
        uid: 'user_other_tenant',
        email: 'other@iptv.menu',
        role: 'user'
      });

      const response = await request(app)
        .get(`/api/playlists/${createdPlaylistId}`)
        .set('Authorization', secondUserToken);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should delete playlist and decrement workspace quota via DELETE /api/playlists/:playlistId', async () => {
      const response = await request(app)
        .delete(`/api/playlists/${createdPlaylistId}`)
        .set('Authorization', regularUserToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const verifyResponse = await request(app)
        .get(`/api/playlists/${createdPlaylistId}`)
        .set('Authorization', regularUserToken);

      expect(verifyResponse.status).toBe(404);
    });
  });

  describe('Phase 4: Real Stream Health Probing & Validation Workflow', () => {
    let testPlaylistId = '';

    it('should setup a playlist and dispatch a real validation job via POST /api/playlists/:id/validate', async () => {
      const createRes = await request(app)
        .post('/api/playlists')
        .set('Authorization', regularUserToken)
        .send({
          name: 'Stream Health Test Feed',
          sourceType: 'url',
          url: 'https://cdn.example.com/live/feed.m3u8',
          channelCount: 50
        });

      expect(createRes.status).toBe(201);
      testPlaylistId = createRes.body.playlist.playlistId;

      const validateRes = await request(app)
        .post(`/api/playlists/${testPlaylistId}/validate`)
        .set('Authorization', regularUserToken);

      expect(validateRes.status).toBe(200);
      expect(validateRes.body).toHaveProperty('success', true);
      expect(validateRes.body).toHaveProperty('runId');
      expect(validateRes.body.runId).toMatch(/^run_/);
    });

    it('should query playlist runs list via GET /api/playlists/:id/runs', async () => {
      const runsRes = await request(app)
        .get(`/api/playlists/${testPlaylistId}/runs`)
        .set('Authorization', regularUserToken);

      expect(runsRes.status).toBe(200);
      expect(Array.isArray(runsRes.body)).toBe(true);
      expect(runsRes.body.length).toBeGreaterThanOrEqual(1);
      expect(runsRes.body[0].type).toBe('validate');
    });

    it('should execute batch stream health probe via POST /api/stream/probe/batch with realistic telemetry', async () => {
      const probeRes = await request(app)
        .post('/api/stream/probe/batch')
        .send({
          urls: [
            'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pluto.m3u',
            'https://169.254.169.254/latest/meta-data'
          ]
        });

      expect(probeRes.status).toBe(200);
      expect(probeRes.body).toHaveProperty('results');
      expect(probeRes.body).toHaveProperty('totalProbed', 2);

      const results = probeRes.body.results;
      // SSRF target should be blocked and marked offline
      const blocked = results['https://169.254.169.254/latest/meta-data'];
      expect(blocked).toBeDefined();
      expect(blocked.isOnline).toBe(false);
      expect(blocked.error).toContain('prohibited');
    });

    afterAll(async () => {
      if (testPlaylistId) {
        await request(app)
          .delete(`/api/playlists/${testPlaylistId}`)
          .set('Authorization', regularUserToken);
      }
    });
  });

  describe('Phase 5: EPG Schema Normalization & Playlist Attachment', () => {
    let epgPlaylistId = '';
    let createdEpgId = '';

    afterAll(async () => {
      if (epgPlaylistId) {
        await request(app)
          .delete(`/api/playlists/${epgPlaylistId}`)
          .set('Authorization', regularUserToken);
      }
    });

    it('should create an attached EPG feed with top-level urls and playlist reference', async () => {
      const createPlRes = await request(app)
        .post('/api/playlists')
        .set('Authorization', regularUserToken)
        .send({
          name: 'EPG Target Playlist',
          sourceType: 'url',
          url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us.m3u',
          channelCount: 30
        });

      expect(createPlRes.status).toBe(201);
      epgPlaylistId = createPlRes.body.playlist.playlistId;

      const createEpgRes = await request(app)
        .post('/api/epg')
        .set('Authorization', regularUserToken)
        .send({
          playlistId: epgPlaylistId,
          urls: ['https://iptv-org.github.io/epg/guides/us.xml'],
          refreshIntervalHours: 12
        });

      expect(createEpgRes.status).toBe(201);
      expect(createEpgRes.body).toHaveProperty('success', true);
      expect(createEpgRes.body).toHaveProperty('epgId');
      expect(createEpgRes.body.feed.playlistId).toBe(epgPlaylistId);
      expect(createEpgRes.body.feed.sourceConfig.urls).toEqual(['https://iptv-org.github.io/epg/guides/us.xml']);
      expect(createEpgRes.body.feed.sourceConfig.refreshIntervalHours).toBe(12);

      createdEpgId = createEpgRes.body.epgId;
    });

    it('should create a standalone EPG feed with nested sourceConfig and null playlist', async () => {
      const standaloneRes = await request(app)
        .post('/api/epg')
        .set('Authorization', regularUserToken)
        .send({
          sourceConfig: {
            urls: ['https://iptv-org.github.io/epg/guides/uk.xml'],
            refreshIntervalHours: 24
          }
        });

      expect(standaloneRes.status).toBe(201);
      expect(standaloneRes.body.feed.playlistId).toBeNull();
      expect(standaloneRes.body.feed.sourceConfig.urls).toEqual(['https://iptv-org.github.io/epg/guides/uk.xml']);
    });

    it('should retrieve user EPG feeds via GET /api/epg', async () => {
      const listRes = await request(app)
        .get('/api/epg')
        .set('Authorization', regularUserToken);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body)).toBe(true);
      const found = listRes.body.find((f: any) => f.epgId === createdEpgId);
      expect(found).toBeDefined();
      expect(found.playlistId).toBe(epgPlaylistId);
    });

    it('should retrieve single EPG feed via GET /api/epg/:epgId', async () => {
      const singleRes = await request(app)
        .get(`/api/epg/${createdEpgId}`)
        .set('Authorization', regularUserToken);

      expect(singleRes.status).toBe(200);
      expect(singleRes.body.epgId).toBe(createdEpgId);
      expect(singleRes.body.uid).toBe('user_regular');
    });

    it('should enforce tenant isolation on GET /api/epg/:epgId', async () => {
      const otherTenantToken = createBearerToken({
        uid: 'user_stranger',
        email: 'stranger@iptv.menu',
        role: 'user'
      });

      const singleRes = await request(app)
        .get(`/api/epg/${createdEpgId}`)
        .set('Authorization', otherTenantToken);

      expect(singleRes.status).toBe(404);
      expect(singleRes.body.error).toContain('not found');
    });

    it('should reject SSRF loopback/private target URLs on POST /api/epg with 403', async () => {
      const ssrfRes = await request(app)
        .post('/api/epg')
        .set('Authorization', regularUserToken)
        .send({
          urls: ['http://127.0.0.1:8080/internal.xml'],
          refreshIntervalHours: 24
        });

      expect(ssrfRes.status).toBe(403);
      expect(ssrfRes.body.error).toContain('prohibited');
    });
  });

  describe('Phase 6: Real EAS APK Build Orchestration & Polling', () => {
    let createdBuildId = '';
    const buildRepo = new BuildRepository();
    const workspaceRepo = new WorkspaceRepository();

    it('should reject build request with 403 on free tier when monthly quota is 0', async () => {
      const response = await request(app)
        .post('/api/builds')
        .set('Authorization', regularUserToken)
        .send({
          appName: 'Free User Streamer',
          brandConfig: { primaryColor: '#00d4ff', accentColor: '#10b981' },
          playlistSource: { type: 'url', value: 'https://iptv-org.github.io/iptv/countries/us.m3u' }
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Quota exceeded');
      expect(response.body.error).toContain('maxMonthlyBuilds');
    });

    it('should allow admin or provisioned workspace to dispatch build job via POST /api/builds', async () => {
      const response = await request(app)
        .post('/api/builds')
        .set('Authorization', adminToken)
        .send({
          appName: 'IPTV Player Pro',
          brandConfig: {
            primaryColor: '#00d4ff',
            accentColor: '#10b981',
            logoUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7'
          },
          playlistSource: {
            type: 'url',
            value: 'https://iptv-org.github.io/iptv/countries/us.m3u'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.buildId).toBeDefined();
      expect(typeof response.body.buildId).toBe('string');

      createdBuildId = response.body.buildId;
    });

    it('should retrieve queued build status via GET /api/builds/:buildId', async () => {
      const response = await request(app)
        .get(`/api/builds/${createdBuildId}`)
        .set('Authorization', adminToken);

      expect(response.status).toBe(200);
      expect(response.body.buildId).toBe(createdBuildId);
      expect(response.body.appName).toBe('IPTV Player Pro');
      expect(response.body.status).toBe('queued');
      expect(response.body.uid).toBe('admin_master');
    });

    it('should list all user builds via GET /api/builds', async () => {
      const response = await request(app)
        .get('/api/builds')
        .set('Authorization', adminToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      const found = response.body.find((b: any) => b.buildId === createdBuildId);
      expect(found).toBeDefined();
      expect(found.appName).toBe('IPTV Player Pro');
    });

    it('should reflect updated status and artifactPath when build finishes successfully', async () => {
      const cdnArtifactUrl = `https://expo.dev/artifacts/eas/${createdBuildId}.apk`;
      await buildRepo.updateBuild(createdBuildId, {
        status: 'succeeded',
        artifactPath: cdnArtifactUrl
      });

      const response = await request(app)
        .get(`/api/builds/${createdBuildId}`)
        .set('Authorization', adminToken);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('succeeded');
      expect(response.body.artifactPath).toBe(cdnArtifactUrl);
    });

    it('should enforce tenant isolation on GET /api/builds/:buildId for other users', async () => {
      const response = await request(app)
        .get(`/api/builds/${createdBuildId}`)
        .set('Authorization', regularUserToken);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should allow a Pro workspace with maxMonthlyBuilds to dispatch builds and increment monthlyBuildsUsed', async () => {
      const proUserToken = createBearerToken({
        uid: 'user_pro_builder',
        email: 'pro@iptv.menu',
        role: 'user'
      });

      // Provision a Pro workspace with 5 builds
      const proWsId = 'ws_pro_test';
      await workspaceRepo.createWorkspace({
        workspaceId: proWsId,
        name: 'Pro Studio Workspace',
        ownerUid: 'user_pro_builder',
        plan: 'pro',
        subscriptionStatus: 'active',
        entitlements: {
          maxPlaylists: 10,
          maxHostedPlaylists: 2,
          maxDailyCleanups: 50,
          maxMonthlyBuilds: 5,
          allowBrandingCustomization: true,
          allowWhiteLabel: true
        },
        usage: {
          activePlaylistsCount: 1,
          activeHostedPlaylistsCount: 0,
          dailyCleanupsUsed: 0,
          monthlyBuildsUsed: 1
        },
        stripeSubscriptionId: 'sub_pro_123',
        stripeCustomerId: 'cus_pro_123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const response = await request(app)
        .post('/api/builds')
        .set('Authorization', proUserToken)
        .set('x-workspace-id', proWsId)
        .send({
          appName: 'Pro Studio Leanback',
          brandConfig: { primaryColor: '#6366f1', accentColor: '#ec4899' },
          playlistSource: { type: 'url', value: 'https://iptv-org.github.io/iptv/countries/uk.m3u' }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verify quota was incremented
      const updatedWs = await workspaceRepo.getWorkspace(proWsId);
      expect(updatedWs?.usage.monthlyBuildsUsed).toBe(2);
    });
  });

  describe('Phase 7: TV Pairing Database Persistence & Production Hardening', () => {
    const tvPairingRepo = new TvPairingRepository();
    let generatedCode = '';

    it('should generate a 6-digit TV pairing code with expiration via POST /api/public/pair/generate', async () => {
      const response = await request(app)
        .post('/api/public/pair/generate')
        .send({ deviceName: 'Living Room Sony Bravia TV' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.code).toBeDefined();
      expect(response.body.code).toMatch(/^\d{6}$/);
      expect(response.body.ttlSeconds).toBe(600);
      expect(response.body.pairingUrl).toContain(response.body.code);

      generatedCode = response.body.code;

      // Verify persistence in repository
      const saved = await tvPairingRepo.getPairing(generatedCode);
      expect(saved).toBeDefined();
      expect(saved?.status).toBe('pending');
      expect(saved?.deviceName).toBe('Living Room Sony Bravia TV');
    });

    it('should also support POST /api/auth/tv/code route alias for mobile/TV clients', async () => {
      const response = await request(app)
        .post('/api/auth/tv/code')
        .send({ deviceName: 'Bedroom Fire TV' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.code).toMatch(/^\d{6}$/);
    });

    it('should return pending status when TV polls GET /api/public/pair/status/:code', async () => {
      const response = await request(app)
        .get(`/api/public/pair/status/${generatedCode}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('pending');
      expect(response.body.remainingSeconds).toBeGreaterThan(0);
    });

    it('should reject claim request when code is missing or unauthenticated', async () => {
      const unauthResponse = await request(app)
        .post('/api/pair/claim')
        .send({ code: generatedCode });

      expect(unauthResponse.status).toBe(401);

      const missingCodeResponse = await request(app)
        .post('/api/pair/claim')
        .set('Authorization', regularUserToken)
        .send({});

      expect(missingCodeResponse.status).toBe(400);
    });

    it('should claim pairing code when authenticated user submits POST /api/pair/claim', async () => {
      const response = await request(app)
        .post('/api/pair/claim')
        .set('Authorization', regularUserToken)
        .send({ code: generatedCode });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('authorized');
      expect(response.body.deviceName).toBe('Living Room Sony Bravia TV');

      // Verify status in DB updated to claimed
      const saved = await tvPairingRepo.getPairing(generatedCode);
      expect(saved?.status).toBe('claimed');
      expect(saved?.user?.email).toBe('viewer@gmail.com');
    });

    it('should return claimed token and user payload when TV polls claimed code', async () => {
      const response = await request(app)
        .get(`/api/public/pair/status/${generatedCode}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('claimed');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('viewer@gmail.com');
    });

    it('should handle expired pairing codes with expired status', async () => {
      const expiredCode = '999888';
      await tvPairingRepo.createPairing({
        code: expiredCode,
        deviceName: 'Expired Apple TV',
        status: 'pending',
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      });

      const response = await request(app)
        .get(`/api/public/pair/status/${expiredCode}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('expired');

      const claimResponse = await request(app)
        .post('/api/pair/claim')
        .set('Authorization', regularUserToken)
        .send({ code: expiredCode });

      expect(claimResponse.status).toBe(404);
      expect(claimResponse.body.error).toContain('expired');
    });

    it('should enforce rate limiting on registration when requests exceed quota', async () => {
      const testIp = '198.51.100.42';
      // Make 10 rapid registration attempts from this test IP
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/public/auth/register')
          .set('X-Forwarded-For', testIp)
          .send({
            email: `ratelimit_user_${i}@example.com`,
            password: 'ValidPassword123!'
          });
      }

      // The 11th attempt from the same IP must be rate-limited (HTTP 429)
      const rateLimitedResponse = await request(app)
        .post('/api/public/auth/register')
        .set('X-Forwarded-For', testIp)
        .send({
          email: 'ratelimit_user_11@example.com',
          password: 'ValidPassword123!'
        });

      expect(rateLimitedResponse.status).toBe(429);
      expect(rateLimitedResponse.headers['retry-after']).toBeDefined();
      expect(rateLimitedResponse.body.error).toContain('Too many registration attempts');
    });
  });
});




