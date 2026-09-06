import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../apps/api/src/server';

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
});
