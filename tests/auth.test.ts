import { describe, it, expect, vi } from 'vitest';
import { 
  parseTokenPayload, 
  authenticateFirebaseToken, 
  authorizeRoles,
  createSignedToken,
  verifySignedToken,
  hashPassword,
  verifyPassword
} from '../packages/auth/src/index';

describe('packages/auth - Auth & Cryptographic Token Verification', () => {
  describe('createSignedToken & verifySignedToken', () => {
    it('should create and verify a signed HMAC-SHA256 JWT', () => {
      const payload = { uid: 'usr_secure123', email: 'test@iptv.menu', role: 'admin' };
      const token = createSignedToken(payload);
      
      expect(token).toBeTypeOf('string');
      expect(token.split('.')).toHaveLength(3);

      const verified = verifySignedToken(token);
      expect(verified).toMatchObject({
        uid: 'usr_secure123',
        email: 'test@iptv.menu',
        role: 'admin'
      });
      expect(verified.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should reject a forged token where payload is altered without valid signature', () => {
      const token = createSignedToken({ uid: 'user_regular', role: 'user' });
      const parts = token.split('.');
      
      // Attacker attempts to tamper payload to grant admin role
      const tamperedPayload = Buffer.from(JSON.stringify({ uid: 'user_regular', role: 'admin' })).toString('base64');
      const forgedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      const verified = verifySignedToken(forgedToken);
      expect(verified).toBeNull();
    });

    it('should reject a token with wrong secret key', () => {
      const token = createSignedToken({ uid: 'usr_123' }, 'secret_key_a');
      const verified = verifySignedToken(token, 'secret_key_b');
      expect(verified).toBeNull();
    });
  });

  describe('Password Hashing & Verification (scrypt)', () => {
    it('should securely hash password with random salt and verify correctly', () => {
      const password = 'SuperSecurePassword!123';
      const hash = hashPassword(password);

      expect(hash).toContain(':');
      expect(verifyPassword(password, hash)).toBe(true);
      expect(verifyPassword('WrongPassword123', hash)).toBe(false);
    });

    it('should generate distinct hashes for identical passwords due to salt', () => {
      const p = 'SamePassword';
      const h1 = hashPassword(p);
      const h2 = hashPassword(p);

      expect(h1).not.toBe(h2);
      expect(verifyPassword(p, h1)).toBe(true);
      expect(verifyPassword(p, h2)).toBe(true);
    });
  });

  describe('parseTokenPayload', () => {
    it('should correctly verify signed JWT token payload', () => {
      const payload = { uid: 'usr_abc123', email: 'vip@iptv.menu', role: 'admin', accountStatus: 'active' };
      const token = createSignedToken(payload);

      const parsed = parseTokenPayload(token);
      expect(parsed).toMatchObject({
        uid: 'usr_abc123',
        email: 'vip@iptv.menu',
        role: 'admin',
        accountStatus: 'active'
      });
    });

    it('should return null for malformed or completely invalid tokens', () => {
      expect(verifySignedToken('invalid.token')).toBeNull();
      expect(verifySignedToken('')).toBeNull();
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

    it('should successfully authenticate valid signed Bearer token and attach req.user', async () => {
      const payload = { uid: 'user_live_99', email: 'alex@iptv.menu', role: 'user' };
      const token = createSignedToken(payload);

      const req: any = { headers: { authorization: `Bearer ${token}` } };
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
      const token = createSignedToken(payload);

      const req: any = { headers: { authorization: `Bearer ${token}` } };
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
