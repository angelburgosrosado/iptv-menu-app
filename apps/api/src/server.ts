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
  WorkspaceRepository,
  AppConfigRepository,
  getFirestoreDB
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
import { UserProfile, Playlist, EpgFeed, BuildRequest, AdminAction, UserRole, Workspace, AppConfig } from '@iptv-menu/types';
import { attachWorkspaceContext, checkWorkspaceQuota } from './middleware/workspaceGuard';

const logger = new Logger('api-server');

const app = express();
const PORT = Number(process.env.PORT) || 3001; // Can run alongside web on port 3000

// Repositories
const userRepo = new UserRepository();
const playlistRepo = new PlaylistRepository();
const epgRepo = new EpgRepository();
const buildRepo = new BuildRepository();
const auditRepo = new AuditLogRepository();
const workspaceRepo = new WorkspaceRepository();
const appConfigRepo = new AppConfigRepository();

// Global Middlewares
app.use(cors({ origin: true }));
// Standard body parsers (Stripe webhook needs raw body, handled specifically)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhooks/stripe' || req.originalUrl === '/api/billing/webhook') {
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
// DYNAMIC REMOTE OTA APP CONFIGURATION (PUBLIC CLIENT API)
// ==========================================
app.get('/api/v1/apps/:appId/config', async (req, res) => {
  try {
    const { appId } = req.params;
    const config = await appConfigRepo.getAppConfig(appId);
    if (!config || !config.active) {
      return res.status(404).json({ error: 'App configuration not found or currently inactive.' });
    }

    // Set high-performance edge cache headers: cache for 60s, serve stale up to 5min
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.json({
      appId: config.appId,
      name: config.name,
      slug: config.slug,
      theme: config.theme,
      playlistUrl: config.playlistUrl,
      epgUrl: config.epgUrl,
      announcement: config.announcement,
      version: config.version,
      updatedAt: config.updatedAt
    });
  } catch (error: any) {
    logger.error('Error serving dynamic app config', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// AUTHENTICATED USER ROUTES
// ==========================================

// Authenticated requests pass through this middleware
app.use('/api/me', authenticateFirebaseToken);
app.use('/api/playlists', authenticateFirebaseToken, attachWorkspaceContext);
app.use('/api/epg', authenticateFirebaseToken, attachWorkspaceContext);
app.use('/api/builds', authenticateFirebaseToken, attachWorkspaceContext);
app.use('/api/apps', authenticateFirebaseToken, attachWorkspaceContext);
app.use('/api/billing/create-checkout-session', authenticateFirebaseToken);
app.use('/api/billing/create-portal-session', authenticateFirebaseToken);
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
    const { appName, brandConfig, playlistSource, appConfigId } = req.body;
    
    const buildId = await dispatchBuildJob(uid, appName, brandConfig, playlistSource, appConfigId);

    // Track monthlyBuildsUsed quota in active workspace
    if (req.workspace) {
      const currentUsed = req.workspace.usage?.monthlyBuildsUsed || 0;
      await workspaceRepo.updateWorkspace(req.workspace.workspaceId, {
        usage: {
          ...req.workspace.usage,
          monthlyBuildsUsed: currentUsed + 1
        }
      });
      logger.info('Tracked build quota usage in workspace', {
        workspaceId: req.workspace.workspaceId,
        monthlyBuildsUsed: currentUsed + 1
      });
    }

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

// ==========================================
// DYNAMIC REMOTE APPS (OPERATOR MANAGEMENT)
// ==========================================

app.get('/api/apps', async (req: any, res) => {
  try {
    const workspaceId = req.workspace.workspaceId;
    const list = await appConfigRepo.listAppConfigsByWorkspace(workspaceId);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/apps', async (req: any, res) => {
  try {
    const { name, theme, playlistUrl, epgUrl, announcement } = req.body;
    if (!name || !playlistUrl) {
      return res.status(400).json({ error: 'App name and playlistUrl are required.' });
    }
    const workspaceId = req.workspace.workspaceId;
    const uid = req.user.uid;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const appId = `app_${slug}_${Math.random().toString(36).substring(2, 7)}`;

    const created = await appConfigRepo.createAppConfig({
      appId,
      workspaceId,
      ownerUid: uid,
      name,
      slug,
      theme: theme || { primaryColor: '#059669', accentColor: '#f59e0b' },
      playlistUrl,
      epgUrl: epgUrl || null,
      announcement: announcement || null,
      active: true,
    });

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/apps/:appId', async (req: any, res) => {
  try {
    const { appId } = req.params;
    const config = await appConfigRepo.getAppConfig(appId);
    if (!config || config.workspaceId !== req.workspace.workspaceId) {
      return res.status(404).json({ error: 'App configuration not found.' });
    }
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/apps/:appId', async (req: any, res) => {
  try {
    const { appId } = req.params;
    const existing = await appConfigRepo.getAppConfig(appId);
    if (!existing || existing.workspaceId !== req.workspace.workspaceId) {
      return res.status(404).json({ error: 'App configuration not found.' });
    }

    const { name, theme, playlistUrl, epgUrl, announcement, active } = req.body;
    const updated = await appConfigRepo.updateAppConfig(appId, {
      ...(name !== undefined && { name }),
      ...(theme !== undefined && { theme }),
      ...(playlistUrl !== undefined && { playlistUrl }),
      ...(epgUrl !== undefined && { epgUrl }),
      ...(announcement !== undefined && { announcement }),
      ...(active !== undefined && { active }),
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/apps/:appId', async (req: any, res) => {
  try {
    const { appId } = req.params;
    const existing = await appConfigRepo.getAppConfig(appId);
    if (!existing || existing.workspaceId !== req.workspace.workspaceId) {
      return res.status(404).json({ error: 'App configuration not found.' });
    }
    await appConfigRepo.deleteAppConfig(appId);
    res.json({ success: true });
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
      { uid, email: profile.email, priceId: priceId || '' }
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

    // Fetch customer profile from Stripe or DB (lookup Stripe by email)
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

const handleStripeWebhook = async (req: any, res: any) => {
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
      const uid = session.metadata?.uid;
      const planPriceId = session.line_items?.data?.[0]?.price?.id || session.metadata?.priceId;
      
      const isBuilder = 
        planPriceId === 'price_builder_subscription' ||
        planPriceId === 'price_enterprise_tier' ||
        planPriceId?.includes('builder') ||
        planPriceId?.includes('enterprise');

      const tier = isBuilder ? 'builder' : 'pro';
      
      if (uid) {
        // 1. Upgrade User
        await userRepo.updateUser(uid, { subscriptionTier: tier });
        logger.info(`Upgraded user tier via Stripe webhook`, { uid, tier, planPriceId });

        // 2. Upgrade Workspace Entitlements
        const userWorkspaces = await workspaceRepo.listUserWorkspaces(uid);
        for (const ws of userWorkspaces) {
          const entitlements = isBuilder
            ? {
                maxPlaylists: 20,
                maxHostedPlaylists: 10,
                maxDailyCleanups: 50,
                maxMonthlyBuilds: 5,
                allowBrandingCustomization: true,
                allowWhiteLabel: true
              }
            : {
                maxPlaylists: 10,
                maxHostedPlaylists: 5,
                maxDailyCleanups: 20,
                maxMonthlyBuilds: 0,
                allowBrandingCustomization: false,
                allowWhiteLabel: false
              };

          await workspaceRepo.updateWorkspace(ws.workspaceId, {
            plan: tier === 'pro' ? 'starter' : (tier as any),
            subscriptionStatus: 'active',
            stripeCustomerId: session.customer || ws.stripeCustomerId,
            stripeSubscriptionId: session.subscription || ws.stripeSubscriptionId,
            entitlements
          });

          logger.info(`Promoted workspace entitlements via Stripe webhook`, {
            workspaceId: ws.workspaceId,
            tier,
            maxMonthlyBuilds: entitlements.maxMonthlyBuilds,
            allowWhiteLabel: entitlements.allowWhiteLabel
          });
        }
      }
    }
    
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      const customerId = subscription.customer;
      
      // Look up user with stripe customer email
      const stripe = require('stripe')(config.STRIPE_SECRET_KEY);
      const customer = await stripe.customers.retrieve(customerId);
      const email = customer.email;
      
      if (email) {
        const user = await userRepo.getUserByEmail(email);
        if (user) {
          const uid = user.uid;
          await userRepo.updateUser(uid, { subscriptionTier: 'free' });
          
          // Reset workspace entitlements to free tier
          const userWorkspaces = await workspaceRepo.listUserWorkspaces(uid);
          for (const ws of userWorkspaces) {
            await workspaceRepo.updateWorkspace(ws.workspaceId, {
              plan: 'free',
              subscriptionStatus: 'canceled',
              entitlements: {
                maxPlaylists: 1,
                maxHostedPlaylists: 0,
                maxDailyCleanups: 1,
                maxMonthlyBuilds: 0,
                allowBrandingCustomization: false,
                allowWhiteLabel: false
              }
            });
          }
          logger.info(`Downgraded user & workspaces due to Stripe subscription cancellation`, { uid });
        }
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      // Monthly cycle rollover: reset usage counters for active billing period
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;
      if (subscriptionId) {
        try {
          const stripe = require('stripe')(config.STRIPE_SECRET_KEY);
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const uid = sub.metadata?.uid;
          if (uid) {
            const userWorkspaces = await workspaceRepo.listUserWorkspaces(uid);
            for (const ws of userWorkspaces) {
              await workspaceRepo.updateWorkspace(ws.workspaceId, {
                usage: {
                  ...ws.usage,
                  monthlyBuildsUsed: 0,
                  dailyCleanupsUsed: 0
                }
              });
              logger.info('Reset workspace monthly build quotas for new billing cycle', {
                workspaceId: ws.workspaceId,
                uid
              });
            }
          }
        } catch (subErr) {
          logger.warn('Could not inspect subscription for cycle reset', subErr);
        }
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    logger.error('Stripe event parsing failure', err);
    res.status(500).json({ error: 'Internal logic handler failed' });
  }
};

app.post('/api/webhooks/stripe', bodyParser.raw({ type: 'application/json' }), handleStripeWebhook);
app.post('/api/billing/webhook', bodyParser.raw({ type: 'application/json' }), handleStripeWebhook);

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

// 1. Master System Health & Telemetry Metrics
app.get('/api/admin/metrics', adminGuard, async (req, res) => {
  try {
    let dbStatus = 'operational';
    let dbLatencyMs = 0;
    if (process.env.DATABASE_URL) {
      try {
        const start = Date.now();
        const dbModule = await import('@iptv-menu/db');
        const db = dbModule.getDb();
        const { sql } = await import('drizzle-orm');
        await db.execute(sql`SELECT 1`);
        dbLatencyMs = Date.now() - start;
      } catch (dbErr: any) {
        dbStatus = 'degraded';
      }
    }

    const [users, playlists, workspaces, builds, auditLogs] = await Promise.all([
      userRepo.listUsers(500).catch(() => []),
      playlistRepo.listAllPlaylists().catch(() => []),
      workspaceRepo.listAllWorkspaces(500).catch(() => []),
      buildRepo.listAllBuilds().catch(() => []),
      auditRepo.listActions(50).catch(() => []),
    ]);

    const buildsByStatus = {
      queued: builds.filter((b: any) => b.status === 'queued').length,
      building: builds.filter((b: any) => b.status === 'building').length,
      completed: builds.filter((b: any) => b.status === 'completed').length,
      failed: builds.filter((b: any) => b.status === 'failed').length,
    };

    const usersByRole = {
      free: users.filter((u: any) => u.subscriptionTier === 'free' || !u.subscriptionTier).length,
      pro: users.filter((u: any) => u.subscriptionTier === 'pro').length,
      builder: users.filter((u: any) => u.subscriptionTier === 'builder').length,
      admin: users.filter((u: any) => u.role === 'admin').length,
    };

    const memory = process.memoryUsage();

    res.json({
      system: {
        status: 'operational',
        env: config.APP_ENV,
        service: 'iptv-api',
        stack: 'Vercel / Neon PostgreSQL / Render Worker',
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        memory: {
          rssMb: Math.round(memory.rss / (1024 * 1024)),
          heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        },
        database: {
          driver: 'Neon Serverless (PostgreSQL)',
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        storage: {
          driver: process.env.BLOB_READ_WRITE_TOKEN ? 'Vercel Blob' : 'Dual-driver / Object Store',
          status: 'ready',
        },
      },
      counts: {
        totalUsers: users.length,
        totalPlaylists: playlists.length,
        totalWorkspaces: workspaces.length,
        totalBuilds: builds.length,
        totalAuditLogs: auditLogs.length,
      },
      buildsByStatus,
      usersByRole,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. User Management
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
    
    // Propagate role changes to custom claims if Firebase Admin is available
    try {
      const firebaseAdmin = getFirebaseAdmin();
      if (firebaseAdmin && typeof firebaseAdmin.auth === 'function') {
        await firebaseAdmin.auth().setCustomUserClaims(userId, { role });
      }
    } catch (authErr) {
      logger.warn('Could not sync custom claims with Firebase Admin', authErr);
    }

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

    // Revoke tokens if Firebase Admin is available
    try {
      const firebaseAdmin = getFirebaseAdmin();
      if (firebaseAdmin && typeof firebaseAdmin.auth === 'function') {
        if (status === 'suspended') {
          await firebaseAdmin.auth().revokeRefreshTokens(userId);
        }
        await firebaseAdmin.auth().setCustomUserClaims(userId, { accountStatus: status });
      }
    } catch (authErr) {
      logger.warn('Could not sync session revocation with Firebase Admin', authErr);
    }

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

// 3. Playlist Oversight
app.get('/api/admin/playlists', adminGuard, async (req, res) => {
  try {
    const list = await playlistRepo.listAllPlaylists();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Multi-Tenant Workspace Oversight & Quotas
app.get('/api/admin/workspaces', adminGuard, async (req, res) => {
  try {
    const list = await workspaceRepo.listAllWorkspaces(200);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/admin/workspaces/:workspaceId/quota', adminGuard, async (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const { entitlements, usage, plan } = req.body;

    const existing = await workspaceRepo.getWorkspace(workspaceId);
    if (!existing) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    await workspaceRepo.updateWorkspace(workspaceId, {
      ...(plan && { plan }),
      ...(entitlements && { entitlements: { ...existing.entitlements, ...entitlements } }),
      ...(usage && { usage: { ...existing.usage, ...usage } }),
    });

    const adminAction: AdminAction = {
      actionId: `act_${Math.random().toString(36).substring(2, 15)}`,
      adminUid: req.user.uid,
      actionType: 'WORKSPACE_QUOTA_UPDATE',
      targetType: 'workspace',
      targetId: workspaceId,
      notes: `Updated quota/entitlements: ${JSON.stringify(req.body)}`,
      createdAt: new Date().toISOString()
    };
    await auditRepo.logAction(adminAction);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Job Queue Oversight & Retries
app.get('/api/admin/jobs', adminGuard, async (req, res) => {
  try {
    const builds = await buildRepo.listAllBuilds();
    res.json({
      buildJobs: builds.slice(0, 50),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/jobs/:jobType/:jobId/retry', adminGuard, async (req: any, res) => {
  try {
    const { jobType, jobId } = req.params;
    if (jobType === 'build') {
      await buildRepo.updateBuild(jobId, { status: 'queued', buildLogPath: null });
    }

    const adminAction: AdminAction = {
      actionId: `act_${Math.random().toString(36).substring(2, 15)}`,
      adminUid: req.user.uid,
      actionType: 'JOB_RETRY',
      targetType: jobType,
      targetId: jobId,
      notes: `Admin triggered retry for ${jobType} job ${jobId}`,
      createdAt: new Date().toISOString()
    };
    await auditRepo.logAction(adminAction);

    res.json({ success: true, message: `Job ${jobId} reset to queued` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Security Audit Trail
app.get('/api/admin/audit-logs', adminGuard, async (req, res) => {
  try {
    const logs = await auditRepo.listActions();
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bind server and listen if running directly as standalone service
if (!process.env.VERCEL && (typeof require !== 'undefined' && require.main === module)) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`IPTV REST API Server is boot-running successfully on port ${PORT}`);
  });
}

export default app;
export { app };
