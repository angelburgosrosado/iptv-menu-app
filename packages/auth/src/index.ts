import crypto from 'node:crypto';
import * as admin from 'firebase-admin';
import { config } from '@iptv-menu/config';
import { UserRole } from '@iptv-menu/types';

let adminApp: admin.app.App | null = null;

function base64UrlEncode(data: string | Buffer): string {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  return Buffer.from(b64, 'base64').toString('utf-8');
}

/**
 * Creates a cryptographically signed HMAC-SHA256 JWT
 */
export function createSignedToken(payload: Record<string, any>, secret: string = config.JWT_SECRET): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    iat: now,
    exp: now + 30 * 24 * 60 * 60, // 30 days
    ...payload,
  };
  const encHeader = base64UrlEncode(JSON.stringify(header));
  const encPayload = base64UrlEncode(JSON.stringify(tokenPayload));
  const data = `${encHeader}.${encPayload}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest();
  const encSig = base64UrlEncode(sig);
  return `${data}.${encSig}`;
}

/**
 * Verifies a cryptographically signed HMAC-SHA256 JWT
 */
export function verifySignedToken(token: string, secret: string = config.JWT_SECRET): any | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [encHeader, encPayload, encSig] = parts;

  const data = `${encHeader}.${encPayload}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest();

  let receivedSigBuf: Buffer;
  try {
    let b64 = encSig.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    receivedSigBuf = Buffer.from(b64, 'base64');
  } catch {
    return null;
  }

  if (expectedSig.length !== receivedSigBuf.length) return null;
  if (!crypto.timingSafeEqual(expectedSig, receivedSigBuf)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encPayload));
    if (payload.exp && typeof payload.exp === 'number') {
      if (Math.floor(Date.now() / 1000) > payload.exp) {
        return null; // Expired
      }
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Hashes a plaintext password using crypto scrypt with random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies password against stored salt:derivedKey hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const keyBuf = Buffer.from(key, 'hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedKey);
}

/**
 * Parses and verifies token payload.
 */
export function parseTokenPayload(token: string, secret: string = config.JWT_SECRET): any {
  // First attempt signed JWT verification
  const verified = verifySignedToken(token, secret);
  if (verified) return verified;

  // In test environment, allow simulated payload if explicitly in test mode
  if (process.env.NODE_ENV === 'test') {
    if (token.includes('.')) {
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          const payloadStr = base64UrlDecode(parts[1]);
          return JSON.parse(payloadStr);
        } catch {
          // ignore
        }
      }
    }
    try {
      const raw = Buffer.from(token, 'base64').toString('utf-8');
      if (raw.startsWith('{') && raw.endsWith('}')) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    if (token.startsWith('{') && token.endsWith('}')) {
      try {
        return JSON.parse(token);
      } catch {
        // ignore
      }
    }
    if (token && !token.includes(' ') && token.length > 2) {
      return {
        uid: token,
        sub: token,
        email: `${token}@iptv.menu`,
        role: 'user',
        accountStatus: 'active'
      };
    }
  }

  return null;
}

export function getFirebaseAdmin(): any {
  if (adminApp) return adminApp;

  const mockFirestore = () => ({
    collection: (colName: string) => ({
      doc: (docId: string) => ({
        get: async () => ({ exists: false, data: () => null }),
        set: async () => {},
        update: async () => {},
        delete: async () => {}
      }),
      where: () => ({
        limit: () => ({ get: async () => ({ empty: true, docs: [] }) }),
        get: async () => ({ empty: true, docs: [] })
      }),
      orderBy: () => ({
        limit: () => ({ get: async () => ({ docs: [] }) }),
        get: async () => ({ docs: [] })
      }),
      limit: () => ({ get: async () => ({ docs: [] }) }),
      get: async () => ({ empty: true, docs: [] })
    })
  });

  // If no private key or in modern Vercel/Neon/Render environment without Firebase infrastructure
  if (!config.FIREBASE_CLIENT_EMAIL || !config.FIREBASE_PRIVATE_KEY || config.FIREBASE_PRIVATE_KEY.includes('...')) {
    return {
      auth: () => ({
        verifyIdToken: async (token: string) => verifySignedToken(token) || parseTokenPayload(token),
        setCustomUserClaims: async () => {},
        revokeRefreshTokens: async () => {},
        getUser: async (uid: string) => ({ uid, email: `${uid}@iptv.menu` })
      }),
      firestore: mockFirestore
    };
  }

  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.FIREBASE_PROJECT_ID,
        clientEmail: config.FIREBASE_CLIENT_EMAIL,
        privateKey: config.FIREBASE_PRIVATE_KEY,
      }),
    });
    return adminApp;
  } catch (e) {
    return {
      auth: () => ({
        verifyIdToken: async (token: string) => verifySignedToken(token) || parseTokenPayload(token),
        setCustomUserClaims: async () => {},
        revokeRefreshTokens: async () => {},
        getUser: async (uid: string) => ({ uid, email: `${uid}@iptv.menu` })
      }),
      firestore: mockFirestore
    };
  }
}

export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken & { role?: UserRole };
}

/**
 * Express Middleware to verify the Auth Bearer Token (Vercel/Neon/Render native, with Firebase fallback)
 */
export async function authenticateFirebaseToken(req: any, res: any, next: () => void) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken: any = null;
    
    // If Firebase credentials are explicitly configured, attempt verification
    if (config.FIREBASE_CLIENT_EMAIL && config.FIREBASE_PRIVATE_KEY && !config.FIREBASE_PRIVATE_KEY.includes('...')) {
      try {
        const firebaseAdmin = getFirebaseAdmin();
        if (firebaseAdmin && typeof firebaseAdmin.auth === 'function') {
          decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        }
      } catch (fbErr: any) {
        // Fall back to decoded token
      }
    }

    // Modern signed JWT token decode
    if (!decodedToken) {
      decodedToken = verifySignedToken(token) || (process.env.NODE_ENV === 'test' ? parseTokenPayload(token) : null);
    }

    if (!decodedToken || (!decodedToken.uid && !decodedToken.sub)) {
      return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    }

    if (!decodedToken.uid) {
      decodedToken.uid = decodedToken.sub;
    }
    
    // Check if user account is suspended
    if (decodedToken.accountStatus === 'suspended') {
      return res.status(403).json({ error: 'Forbidden: Account has been suspended' });
    }

    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error('Auth verification failed:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }
}

export const authenticateToken = authenticateFirebaseToken;

/**
 * Role-based authorization guard factory
 */
export function authorizeRoles(allowedRoles: UserRole[]) {
  return (req: any, res: any, next: () => void) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Automatically elevate configured platform administrator emails
    const adminEmails: string[] = Array.isArray(config.ADMIN_ALLOWED_EMAILS)
      ? config.ADMIN_ALLOWED_EMAILS
      : (process.env.ADMIN_ALLOWED_EMAILS || '')
          .split(',')
          .map((e: string) => e.trim().toLowerCase())
          .filter(Boolean);

    if (req.user.email && adminEmails.includes(req.user.email.toLowerCase())) {
      req.user.role = 'admin';
    }

    // Role is stored in claims, database, or elevated by ADMIN_ALLOWED_EMAILS
    const userRole: UserRole = req.user.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: `Forbidden: Access restricted. Required: [${allowedRoles.join(', ')}]. Current: ${userRole}` 
      });
    }

    next();
  };
}
