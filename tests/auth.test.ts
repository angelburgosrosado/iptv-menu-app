import { describe, it, expect, vi } from 'vitest';
import { 
  parseTokenPayload, 
  authenticateFirebaseToken, 
  authorizeRoles 
} from '../packages/auth/src/index';

describe('packages/auth - Auth & Token Verification (Vercel/Neon/Render Native)', () => {
  describe('parseTokenPayload', () => {
    it('should correctly parse a standard JWT 3-part token payload', () => {
      const payload = { uid: 'usr_abc123', email: 'vip@iptv.menu', role: 'admin', accountStatus: 'active' };
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const fakeJwt = `header.${base64Payload}.signature`;

      const parsed = parseTokenPayload(fakeJwt);
      expect(parsed).toMatchObject({
        uid: 'usr_abc123',
        email: 'vip@iptv.menu',
        role: 'admin',
        accountStatus: 'active'
      });
    });

    it('should parse a base64 encoded JSON string', () => {
      const payload = { uid: 'usr_base64', email: 'user@example.com', role: 'user' };
      const base64Str = Buffer.from(JSON.stringify(payload)).toString('base64');

      const parsed = parseTokenPayload(base64Str);
      expect(parsed).toMatchObject({
        uid: 'usr_base64',
        email: 'user@example.com',
        role: 'user'
      });
    });

    it('should parse direct JSON string token', () => {
      const jsonStr = JSON.stringify({ uid: 'usr_direct', role: 'pro' });
      const parsed = parseTokenPayload(jsonStr);
      expect(parsed).toMatchObject({ uid: 'usr_direct', role: 'pro' });
    });

    it('should fall back to uid derivation for plain identifier strings', () => {
      const token = 'my_test_uid';
      const parsed = parseTokenPayload(token);
      expect(parsed).toEqual({
        uid: 'my_test_uid',
        sub: 'my_test_uid',
        email: 'my_test_uid@iptv.menu',
        role: 'user',
        accountStatus: 'active'
      });
    });
  });

  describe('authenticateFirebaseToken middleware', () => {
    it('should reject requests without authorization header with 401', async () => {
      const req: any = { headers: {} };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await authenticateFirebaseToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Missing or invalid token') }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid token prefix with 401', async () => {
      const req: any = { headers: { authorization: 'Basic 12345' } };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await authenticateFirebaseToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should successfully authenticate valid Bearer token and attach req.user', async () => {
      const payload = { uid: 'user_live_99', email: 'alex@iptv.menu', role: 'user' };
      const fakeJwt = `hdr.${Buffer.from(JSON.stringify(payload)).toString('base64')}.sig`;

      const req: any = { headers: { authorization: `Bearer ${fakeJwt}` } };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await authenticateFirebaseToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.uid).toBe('user_live_99');
    });

    it('should reject suspended user accounts with 403 Forbidden', async () => {
      const payload = { uid: 'user_bad', email: 'spammer@iptv.menu', accountStatus: 'suspended' };
      const fakeJwt = `hdr.${Buffer.from(JSON.stringify(payload)).toString('base64')}.sig`;

      const req: any = { headers: { authorization: `Bearer ${fakeJwt}` } };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await authenticateFirebaseToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('suspended') }));
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorizeRoles guard', () => {
    it('should call next when user role matches allowed roles', () => {
      const guard = authorizeRoles(['admin', 'support']);
      const req: any = { user: { uid: 'u1', role: 'admin' } };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      guard(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 when user role is not permitted', () => {
      const guard = authorizeRoles(['admin']);
      const req: any = { user: { uid: 'u2', role: 'user' } };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      guard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Forbidden') }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when req.user is missing', () => {
      const guard = authorizeRoles(['admin']);
      const req: any = {};
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      guard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
