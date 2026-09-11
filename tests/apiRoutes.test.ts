import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../apps/api/src/server';

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
});
