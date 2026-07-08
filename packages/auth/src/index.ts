import * as admin from 'firebase-admin';
import { config } from '@iptv-menu/config';
import { UserRole } from '@iptv-menu/types';

let adminApp: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (adminApp) return adminApp;

  // Use application default credentials if local config is missing
  if (!config.FIREBASE_CLIENT_EMAIL || !config.FIREBASE_PRIVATE_KEY) {
    // If running in Cloud Run, IAM automatically configures default credentials
    if (process.env.K_SERVICE) {
      adminApp = admin.initializeApp();
      return adminApp;
    }
    
    // In local dev, if env variables aren't loaded yet, use dummy credentials to prevent startup crashes
    console.warn('Initializing Firebase Admin in Dev Mode with dummy credentials.');
    adminApp = admin.initializeApp({
      projectId: config.FIREBASE_PROJECT_ID,
      credential: admin.credential.applicationDefault()
    });
    return adminApp;
  }

  adminApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.FIREBASE_PROJECT_ID,
      clientEmail: config.FIREBASE_CLIENT_EMAIL,
      privateKey: config.FIREBASE_PRIVATE_KEY,
    }),
  });

  return adminApp;
}

export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken & { role?: UserRole };
}

/**
 * Express Middleware to verify the Firebase ID Token
 */
export async function authenticateFirebaseToken(req: any, res: any, next: () => void) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    }

    const token = authHeader.split('Bearer ')[1];
    const firebaseAdmin = getFirebaseAdmin();
    
    // Verify token
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    
    // Check if user account is suspended by looking up metadata in custom claims or db
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

/**
 * Role-based authorization guard factory
 */
export function authorizeRoles(allowedRoles: UserRole[]) {
  return (req: any, res: any, next: () => void) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Role is stored in Custom Claims (populated by our admin console or db triggers)
    // Fall back to 'user' if no role claim is set
    const userRole: UserRole = req.user.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: `Forbidden: Access restricted. Required: [${allowedRoles.join(', ')}]. Current: ${userRole}` 
      });
    }

    next();
  };
}
