import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from '@iptv-menu/config';
import { Logger } from '@iptv-menu/logging';
import { 
  authenticateFirebaseToken, 
  authorizeRoles, 
  getFirebaseAdmin 
} from '@iptv-menu/auth';
import { 
  UserRepository, 
  PlaylistRepository, 
  EpgRepository, 
  BuildRepository, 
  AuditLogRepository,
  WorkspaceRepository
} from '@iptv-menu/db';
import { 
  getSignedUrl, 
  uploadToBucket, 
  deleteFromBucket 
} from '@iptv-menu/storage';
import { 
  createCheckoutSession, 
  createBillingPortalSession, 
  verifyWebhookSignature,
  createOrRetrieveCustomer
} from '@iptv-menu/billing';
import { 
  dispatchPlaylistJob, 
  dispatchBuildJob,
  dispatchEpgJob
} from '@iptv-menu/jobs';
import { UserProfile, Playlist, EpgFeed, BuildRequest, AdminAction, UserRole, Workspace } from '@iptv-menu/types';
import { attachWorkspaceContext, checkWorkspaceQuota } from './middleware/workspaceGuard';

const logger = new Logger('api-server');

const app = express();
const PORT = process.env.PORT || 3001; // Can run alongside web on port 3000

// Repositories
const userRepo = new UserRepository();
const playlistRepo = new PlaylistRepository();
const epgRepo = new EpgRepository();
const buildRepo = new BuildRepository();
const auditRepo = new AuditLogRepository();
const workspaceRepo = new WorkspaceRepository();

// Global Middlewares
app.use(cors({ origin: true }));
// Standard body parsers (Stripe webhook needs raw body, handled specifically)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhooks/stripe') {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});

// ==========================================
// PUBLIC ROUTES
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.APP_ENV,
    service: 'iptv-api'
  });
});

app.get('/api/public/pricing', (req, res) => {
  res.json({
    plans: [
      { id: 'free', name: 'Free Tier', price: 0, features: ['1 Playlist upload', 'EPG test feeds', 'Basic player simulator'] },
      { id: 'pro', name: 'Pro Tier', price: 9.99, stripePriceId: 'price_pro_subscription', features: ['Unlimited uploads', 'Auto-clean duplicates', 'Channel validator', 'Full offline support'] },
      { id: 'builder', name: 'App Builder Tier', price: 29.99, stripePriceId: 'price_builder_subscription', features: ['Everything in Pro', 'Custom branding configuration', 'Expo mobile compilation export', 'Personalized IPTV android/iOS launcher APKs'] }
    ]
  });
});

app.get('/api/public/devices', (req, res) => {
  res.json({
    certified: [
      { id: 'shield_tv', brand: 'NVIDIA', name: 'Shield TV Pro 4K', status: 'certified' },
      { id: 'firestick_max', brand: 'Amazon', name: 'Fire TV Stick 4K Max', status: 'certified' },
      { id: 'chromecast_4k', brand: 'Google', name: 'Chromecast with Google TV', status: 'certified' },
      { id: 'formuler_z11', brand: 'Formuler', name: 'Z11 Pro Max Android Box', status: 'certified' }
    ]
  });
});

app.post('/api/public/contact', async (req, res) => {
  const { name, email, message } = req.body;
  logger.info('Contact request submitted', { name, email });
  // In v1, log it and return success
  res.status(200).json({ success: true, message: 'Message sent successfully.' });
});

// ==========================================
// AUTHENTICATED USER ROUTES
// ==========================================

// Authenticated requests pass through this middleware
app.use('/api/me', authenticateFirebaseToken);
app.use('/api/playlists', authenticateFirebaseToken, attachWorkspaceContext);
app.use('/api/epg', authenticateFirebaseToken, attachWorkspaceContext);
app.use('/api/builds', authenticateFirebaseToken, attachWorkspaceContext);
app.use('/api/billing', authenticateFirebaseToken);
app.use('/api/workspaces', authenticateFirebaseToken);

// User info
app.get('/api/me', async (req: any, res) => {
  try {
    const uid = req.user.uid;
    let profile = await userRepo.getUser(uid);
    if (!profile) {
      // Auto-register user profile in database
      const newProfile: UserProfile = {
        uid,
        email: req.user.email || '',
        displayName: req.user.name || null,
        photoURL: req.user.picture || null,
        role: 'user',
        subscriptionTier: 'free',
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await userRepo.createUser(newProfile);
      profile = newProfile;
    }
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/me/profile', async (req: any, res) => {
  try {
    const uid = req.user.uid;
    const { displayName, photoURL } = req.body;
    await userRepo.updateUser(uid, { displayName, photoURL });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/me/subscription', async (req: any, res) => {
  try {
    const uid = req.user.uid;
    const profile = await userRepo.getUser(uid);
    res.json({
      uid,
      tier: profile?.subscriptionTier || 'free',
      status: profile?.accountStatus || 'active'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Playlists
app.post('/api/playlists', checkWorkspaceQuota('maxPlaylists'), async (req: any, res) => {
  try {
    const uid = req.user.uid;
    const { name, sourceType, originalFileName } = req.body;
    const playlistId = `pl_${Math.random().toString(36).substring(2, 15)}`;

    const originalFilePath = `users/${uid}/uploads/${playlistId}_${originalFileName || 'playlist.m3u'}`;
    const uploadUrl = await getSignedUrl(config.GCS_UPLOAD_BUCKET, originalFilePath, 'write');

    const playlist: Playlist = {
      playlistId,
      uid,
      name,
      sourceType,
      originalFilePath,
      cleanedFilePath: null,
      channelCount: 0,
      status: 'pending',
      visibility: 'private',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await playlistRepo.createPlaylist(playlist);
    res.status(201).json({ playlist, uploadUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/playlists', async (req: any, res) => {
  try {
    const uid = req.user.uid;
    const list = await playlistRepo.listUserPlaylists(uid);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/playlists/:playlistId', async (req: any, res) => {
  try {
    const { playlistId } = req.params;
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist || playlist.uid !== req.user.uid) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    res.json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/playlists/:playlistId', async (req: any, res) => {
  try {
    const { playlistId } = req.params;
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist || playlist.uid !== req.user.uid) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    
    // Cleanup GCS resources
    if (playlist.originalFilePath) {
      await deleteFromBucket(config.GCS_UPLOAD_BUCKET, playlist.originalFilePath).catch(() => {});
    }
    if (playlist.cleanedFilePath) {
      await deleteFromBucket(config.GCS_OUTPUT_BUCKET, playlist.cleanedFilePath).catch(() => {});
    }

    await playlistRepo.deletePlaylist(playlistId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dispatch Worker Jobs
app.post('/api/playlists/:playlistId/parse', async (req: any, res) => {
  try {
    const { playlistId } = req.params;
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist || playlist.uid !== req.user.uid) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    const runId = await dispatchPlaylistJob(playlistId, 'parse');
    res.json({ success: true, runId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/playlists/:playlistId/clean', async (req: any, res) => {
  try {
    const { playlistId } = req.params;
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist || playlist.uid !== req.user.uid) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    const runId = await dispatchPlaylistJob(playlistId, 'clean');
    res.json({ success: true, runId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/playlists/:playlistId/validate', async (req: any, res) => {
  try {
    const { playlistId } = req.params;
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist || playlist.uid !== req.user.uid) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    const runId = await dispatchPlaylistJob(playlistId, 'validate');
    res.json({ success: true, runId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/playlists/:playlistId/runs', async (req: any, res) => {
  try {
    const { playlistId } = req.params;
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist || playlist.uid !== req.user.uid) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    const runs = await playlistRepo.getPlaylistRuns(playlistId);
    res.json(runs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// EPG
app.post('/api/epg', checkWorkspaceQuota('maxHostedPlaylists'), async (req: any, res) => {
  try {
    const uid = req.user.uid;
    const { playlistId, urls, refreshIntervalHours } = req.body;
    const epgId = `epg_${Math.random().toString(36).substring(2, 15)}`;

    const feed: EpgFeed = {
      epgId,
      uid,
      playlistId,
      status: 'pending',
      sourceConfig: { urls, refreshIntervalHours },
      outputFilePath: `users/${uid}/epg/${epgId}_xmltv.xml`,
      lastGeneratedAt: null,
      createdAt: new Date().toISOString()
    };

    await epgRepo.createEpg(feed);

    // Dispatch the EPG job to the worker queue
    await dispatchEpgJob(epgId);

    res.status(201).json({ success: true, epgId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/epg', async (req: any, res) => {
  try {
    const uid = req.user.uid;
    const list = await epgRepo.listUserEpgs(uid);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/epg/:epgId', async (req: any, res) => {
  try {
    const { epgId } = req.params;
    const epg = await epgRepo.getEpg(epgId);
    if (!epg || epg.uid !== req.user.uid) {
      return res.status(404).json({ error: 'EPG Feed not found' });
    }
    res.json(epg);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Workspaces
app.post('/api/workspaces', async (req: any, res) => {
  try {
    const uid = req.user.uid;
    const { name } = req.body;
    const workspaceId = `ws_${Math.random().toString(36).substring(2, 15)}`;

    const newWorkspace: Workspace = {
      workspaceId,
      name,
      ownerUid: uid,
      plan: 'free',
      subscriptionStatus: 'active',
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      entitlements: {
        maxPlaylists: 1,
        maxHostedPlaylists: 0,
        maxDailyCleanups: 1,
        maxMonthlyBuilds: 0,
        allowBrandingCustomization: false,
        allowWhiteLabel: false
      },
      usage: {
        activePlaylistsCount: 0,
        activeHostedPlaylistsCount: 0,
        dailyCleanupsUsed: 0,
        monthlyBuildsUsed: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await workspaceRepo.createWorkspace(newWorkspace);
    res.status(201).json(newWorkspace);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/workspaces', async (req: any, res) => {
  try {
    const uid = req.user.uid;
    let list = await workspaceRepo.listUserWorkspaces(uid);
    
    // Auto-bootstrap a personal workspace if none exist
    if (list.length === 0) {
      const workspaceId = `ws_${Math.random().toString(36).substring(2, 15)}`;
      const personalWs: Workspace = {
        workspaceId,
        name: 'Personal Workspace',
        ownerUid: uid,
        plan: 'free',
        subscriptionStatus: 'active',
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        entitlements: {
          maxPlaylists: 1,
          maxHostedPlaylists: 0,
          maxDailyCleanups: 1,
          maxMonthlyBuilds: 0,
          allowBrandingCustomization: false,
          allowWhiteLabel: false
        },
        usage: {
          activePlaylistsCount: 0,
          activeHostedPlaylistsCount: 0,
          dailyCleanupsUsed: 0,
          monthlyBuildsUsed: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await workspaceRepo.createWorkspace(personalWs);
      list = [personalWs];
    }
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/workspaces/:workspaceId', async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const ws = await workspaceRepo.getWorkspace(workspaceId);
    if (!ws || ws.ownerUid !== req.user.uid) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    res.json(ws);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Builds
app.post('/api/builds', checkWorkspaceQuota('maxMonthlyBuilds'), async (req: any, res) => {
  try {
    const uid = req.user.uid;
    const { appName, brandConfig, playlistSource } = req.body;
    
    const buildId = await dispatchBuildJob(uid, appName, brandConfig, playlistSource);
    res.status(201).json({ success: true, buildId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/builds', async (req: any, res) => {
  try {
    const uid = req.user.uid;
    const list = await buildRepo.listUserBuilds(uid);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/builds/:buildId', async (req: any, res) => {
  try {
    const { buildId } = req.params;
    const build = await buildRepo.getBuild(buildId);
    if (!build || build.uid !== req.user.uid) {
      return res.status(404).json({ error: 'Build request not found' });
    }
    res.json(build);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Billing
app.post('/api/billing/create-checkout-session', async (req: any, res) => {
  try {
    const uid = req.user.uid;
    const { priceId, successUrl, cancelUrl } = req.body;

    const profile = await userRepo.getUser(uid);
    if (!profile) return res.status(404).json({ error: 'User profile not found' });

    // Lookup existing stripe customer id or register new
    const stripeCustomerId = await createOrRetrieveCustomer(profile.email, profile.displayName || profile.email);
    
    const url = await createCheckoutSession(
      stripeCustomerId,
      profile.email,
      priceId,
      successUrl,
      cancelUrl,
      { uid, email: profile.email }
    );

    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/billing/create-portal-session', async (req: any, res) => {
  try {
    const uid = req.user.uid;
    const { returnUrl } = req.body;

    const profile = await userRepo.getUser(uid);
    if (!profile) return res.status(404).json({ error: 'User profile not found' });

    const firebaseAdmin = getFirebaseAdmin();
    // Fetch customer profile from Stripe or DB (for simplicity, lookup Stripe by email)
    const stripeCustomerId = await createOrRetrieveCustomer(profile.email, profile.displayName || profile.email);

    const url = await createBillingPortalSession(stripeCustomerId, returnUrl);
    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// WEBHOOKS / PUBLIC INCOMING
// ==========================================

app.post('/api/webhooks/stripe', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = verifyWebhookSignature(req.body, sig as string, config.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle billing webhook events
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const uid = session.metadata.uid;
      const planPriceId = session.line_items?.data[0]?.price?.id;
      
      const tier = planPriceId === 'price_builder_subscription' ? 'builder' : 'pro';
      
      await userRepo.updateUser(uid, { subscriptionTier: tier });
      logger.info(`Upgraded user via Stripe webhook`, { uid, tier });
    }
    
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      const customerId = subscription.customer;
      
      // Look up user with stripe customer email
      const stripe = require('stripe')(config.STRIPE_SECRET_KEY);
      const customer = await stripe.customers.retrieve(customerId);
      const email = customer.email;
      
      // Demote subscription
      const db = getFirestoreDB();
      const userSnap = await db.collection('users').where('email', '==', email).get();
      if (!userSnap.empty) {
        const uid = userSnap.docs[0].id;
        await userRepo.updateUser(uid, { subscriptionTier: 'free' });
        logger.info(`Downgraded user due to Stripe subscription cancellation`, { uid });
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    logger.error('Stripe event parsing failure', err);
    res.status(500).json({ error: 'Internal logic handler failed' });
  }
});

// Internal loops for jobs (invoked securely by GCP Cloud Scheduler or Service-to-Service)
app.post('/api/internal/jobs/playlist-clean', async (req, res) => {
  logger.info('Internal route invoked to trigger cleaning queue run');
  res.json({ success: true, processed: 0 });
});

app.post('/api/internal/jobs/playlist-validate', async (req, res) => {
  logger.info('Internal route invoked to trigger validate queue run');
  res.json({ success: true, processed: 0 });
});

// ==========================================
// ADMIN-ONLY SECURE OPERATIONS
// ==========================================

// Guard all admin routes under administrative authorization gate
const adminGuard = [authenticateFirebaseToken, authorizeRoles(['admin'])];

app.get('/api/admin/users', adminGuard, async (req, res) => {
  try {
    const list = await userRepo.listUsers();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/users/:userId', adminGuard, async (req, res) => {
  try {
    const profile = await userRepo.getUser(req.params.userId);
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/admin/users/:userId/role', adminGuard, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    await userRepo.updateUser(userId, { role });
    
    // Propagate role changes straight into Firebase Auth custom claims
    const firebaseAdmin = getFirebaseAdmin();
    await firebaseAdmin.auth().setCustomUserClaims(userId, { role });

    // Auditing
    const adminAction: AdminAction = {
      actionId: `act_${Math.random().toString(36).substring(2, 15)}`,
      adminUid: req.user.uid,
      actionType: 'ROLE_UPDATE',
      targetType: 'user',
      targetId: userId,
      notes: `Updated role to: ${role}`,
      createdAt: new Date().toISOString()
    };
    await auditRepo.logAction(adminAction);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/admin/users/:userId/status', adminGuard, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'active' | 'suspended'

    await userRepo.updateUser(userId, { accountStatus: status });

    // Block token session in Firebase Auth instantly on suspension
    const firebaseAdmin = getFirebaseAdmin();
    if (status === 'suspended') {
      await firebaseAdmin.auth().revokeRefreshTokens(userId);
    }
    await firebaseAdmin.auth().setCustomUserClaims(userId, { accountStatus: status });

    const adminAction: AdminAction = {
      actionId: `act_${Math.random().toString(36).substring(2, 15)}`,
      adminUid: req.user.uid,
      actionType: 'STATUS_UPDATE',
      targetType: 'user',
      targetId: userId,
      notes: `Set account status to: ${status}`,
      createdAt: new Date().toISOString()
    };
    await auditRepo.logAction(adminAction);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/playlists', adminGuard, async (req, res) => {
  try {
    const list = await playlistRepo.listAllPlaylists();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/audit-logs', adminGuard, async (req, res) => {
  try {
    const logs = await auditRepo.listActions();
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bind server and listen
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`IPTV REST API Server is boot-running successfully on port ${PORT}`);
});
