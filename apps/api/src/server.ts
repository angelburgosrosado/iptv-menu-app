import dotenv from 'dotenv';
import path from 'path';
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from '@iptv-menu/config';
import { Logger } from '@iptv-menu/logging';
import { 
  authenticateFirebaseToken, 
  authorizeRoles, 
  getFirebaseAdmin,
  createSignedToken,
  hashPassword,
  verifyPassword
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
import { handleStreamProxy, isSafeTargetUrl } from './services/streamProxyService';
import { channelMetadataService } from './services/channelMetadataService';
import { epgService } from './services/epgService';
import { adsenseService } from './services/adsenseService';
import { streamHealthProber } from './services/streamHealthProber';
import { fetchAndCacheLogo, generateLogoSvg } from './services/logoService';

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

app.get('/api/public/adsense', async (req, res) => {
  try {
    const adsConfig = await adsenseService.getConfig();
    res.json({
      enabled: adsConfig.enabled,
      clientId: adsConfig.clientId,
      slots: adsConfig.slots,
      testMode: adsConfig.testMode ?? false,
      autoAdsEnabled: adsConfig.autoAdsEnabled ?? false,
      updatedAt: adsConfig.updatedAt
    });
  } catch (err: any) {
    logger.error('Failed to retrieve public AdSense configuration', err);
    res.status(500).json({ error: 'Failed to retrieve AdSense configuration' });
  }
});

app.get('/api/public/pricing', (req, res) => {
  res.json({
    plans: [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        priceMonthly: 0,
        priceYearly: 0,
        description: 'Perfect for exploring, validating, and parsing individual stream links.',
        features: [
          '1 M3U playlist upload & parser',
          'Web TV stream preview simulator',
          'Sample public IPTV channels',
          'Standard latency buffer settings',
          'Local M3U export & download'
        ]
      },
      {
        id: 'pro',
        name: 'Pro Streamer',
        price: 9.99,
        priceMonthly: 9.99,
        priceYearly: 7.99,
        stripePriceId: 'price_pro_subscription',
        description: 'Host, synchronize, and auto-clean live stream feeds.',
        features: [
          'Everything in Free tier',
          'Up to 10 active playlists & 5 hosted remote URLs',
          'Automated Stream Health Prober & dead link pruning',
          '20 daily automated stream cleanups',
          'Integrated live EPG (XMLTV) auto-feed',
          'Fast global CDN caching & sync links'
        ]
      },
      {
        id: 'builder',
        name: 'App Builder Suite',
        price: 29.99,
        priceMonthly: 29.99,
        priceYearly: 23.99,
        stripePriceId: 'price_builder_subscription',
        description: 'Launch and distribute white-label Android apps with remote OTA engine.',
        features: [
          'Everything in Pro tier',
          '10 cloud-compiled APK builds / mo (EAS)',
          'Dynamic Remote OTA App Engine (no reinstall needed)',
          '100% white-label branding & custom logos',
          'Direct APK downloads & install QR codes',
          'Dedicated developer support & SLA'
        ]
      }
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
// AUTHENTICATION & REGISTRATION (PUBLIC API)
// ==========================================

// 1. REGISTER
app.post('/api/public/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if user exists
    const existingUser = await userRepo.getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'Account already exists. Please sign in instead.' });
    }

    const uid = `usr_${Buffer.from(normalizedEmail).toString('hex').slice(0, 12)}`;
    const hashedPassword = hashPassword(password);
    const tokenPayload = {
      uid,
      sub: uid,
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      role: 'user',
      subscriptionTier: 'free',
      accountStatus: 'active'
    };
    const token = createSignedToken(tokenPayload);

    await userRepo.createUser({
      uid,
      email: normalizedEmail,
      passwordHash: hashedPassword,
      displayName: normalizedEmail.split('@')[0],
      photoURL: null,
      role: 'user',
      subscriptionTier: 'free',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        uid,
        email: normalizedEmail,
        displayName: normalizedEmail.split('@')[0],
        role: 'user',
        subscriptionTier: 'free',
        isPremium: false
      }
    });

  } catch (error: any) {
    logger.error('Auth register error', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. LOGIN
app.post('/api/public/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up user
    const user = await userRepo.getUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Account not found. Please create an account first.' });
    }

    // Verify password if stored
    if (user.passwordHash) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
      }
    } else {
      // Legacy user without hash: backfill hash on first successful login
      const newHash = hashPassword(password);
      await userRepo.updateUser(user.uid, { passwordHash: newHash });
    }

    const tokenPayload = {
      uid: user.uid,
      sub: user.uid,
      email: user.email,
      name: user.displayName,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      accountStatus: user.accountStatus
    };
    const token = createSignedToken(tokenPayload);

    return res.status(200).json({
      success: true,
      token,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        isPremium: user.role !== 'user' || user.subscriptionTier !== 'free'
      }
    });

  } catch (error: any) {
    logger.error('Auth login error', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// DYNAMIC REMOTE OTA APP CONFIGURATION (PUBLIC CLIENT API)
// ==========================================
app.get('/api/v1/apps/:appId/config', async (req, res) => {
  try {
    const { appId } = req.params;
    const config = await appConfigRepo.getAppConfig(appId).catch((dbErr: any) => {
      logger.warn(`Database unreachable or degraded while fetching app config for ${appId}`, dbErr);
      return null;
    });
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
// TV DEVICE QUICK-PAIRING ENGINE (IPTVX-STYLE)
// ==========================================
interface TvPairingSession {
  code: string;
  deviceName: string;
  createdAt: number;
  expiresAt: number;
  claimed: boolean;
  token?: string;
  user?: any;
}

const tvPairingSessions = new Map<string, TvPairingSession>();

// Cleanup expired codes periodically
setInterval(() => {
  const now = Date.now();
  for (const [code, session] of tvPairingSessions.entries()) {
    if (session.expiresAt < now) {
      tvPairingSessions.delete(code);
    }
  }
}, 60 * 1000);

// 1. TV Client generates 6-digit pairing code
app.post('/api/public/pair/generate', (req, res) => {
  try {
    const { deviceName = 'Smart TV' } = req.body || {};
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const ttlMs = 10 * 60 * 1000; // 10 minutes

    const session: TvPairingSession = {
      code,
      deviceName,
      createdAt: now,
      expiresAt: now + ttlMs,
      claimed: false,
    };

    tvPairingSessions.set(code, session);
    logger.info(`Generated TV pairing code ${code} for device ${deviceName}`);

    res.json({
      success: true,
      code,
      expiresAt: session.expiresAt,
      ttlSeconds: 600,
      pairingUrl: `https://iptv.menu/pair?code=${code}`
    });
  } catch (error: any) {
    logger.error('Error generating TV pairing code', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Phone / Web Client claims the TV pairing code
app.post('/api/pair/claim', authenticateFirebaseToken, (req: any, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Pairing code is required.' });
    }

    const cleanCode = code.trim();
    const session = tvPairingSessions.get(cleanCode);

    if (!session || session.expiresAt < Date.now()) {
      return res.status(404).json({ error: 'Pairing code has expired or is invalid. Please generate a new code on your TV.' });
    }

    const rawAuthHeader = req.headers.authorization;
    const token = rawAuthHeader?.startsWith('Bearer ') ? rawAuthHeader.split('Bearer ')[1] : '';

    session.claimed = true;
    session.token = token;
    session.user = {
      uid: req.user.uid,
      email: req.user.email,
      displayName: req.user.displayName || req.user.name,
      role: req.user.role || 'user',
      subscriptionTier: req.user.subscriptionTier || 'free'
    };

    logger.info(`TV pairing code ${cleanCode} claimed by user ${req.user.email}`);

    res.json({
      success: true,
      message: `Device successfully authorized for ${req.user.email}!`,
      deviceName: session.deviceName
    });
  } catch (error: any) {
    logger.error('Error claiming TV pairing code', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. TV Client polls status of the code
app.get('/api/public/pair/status/:code', (req, res) => {
  try {
    const code = req.params.code?.trim();
    const session = tvPairingSessions.get(code);

    if (!session || session.expiresAt < Date.now()) {
      return res.json({ status: 'expired' });
    }

    if (session.claimed && session.token) {
      const responsePayload = {
        status: 'claimed',
        token: session.token,
        user: session.user
      };
      setTimeout(() => tvPairingSessions.delete(code), 30000);
      return res.json(responsePayload);
    }

    const remainingSeconds = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
    res.json({
      status: 'pending',
      remainingSeconds
    });
  } catch (error: any) {
    logger.error('Error polling TV pairing status', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// LIVE AI PROGRAMME CONTEXT & INSIGHTS PANEL (IPTVX-STYLE)
// ==========================================
app.post('/api/ai/program-context', async (req, res) => {
  try {
    const { title, channelName, category, description } = req.body || {};
    if (!title && !channelName) {
      return res.status(400).json({ error: 'Title or channel name is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.API_KEY;
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a TV guide expert and film/sports critic. Provide a concise, cinematic breakdown for:
Program: "${title || 'Live Broadcast'}"
Channel: "${channelName || 'Television'}"
Category: "${category || 'General'}"
Description: "${description || ''}"

Return a clean JSON object with keys:
"summary": a punchy 2-sentence synopsis or match context,
"castOrKeyFigures": array of 2-4 key actors, presenters, or players,
"triviaOrTip": a 1-sentence fun fact or viewer tip,
"mood": 2-word mood/vibe like "High Energy Sports" or "Gritty Mystery".`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = response.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({
            success: true,
            aiGenerated: true,
            data: parsed,
            generatedAt: new Date().toISOString()
          });
        }
      } catch (genErr: any) {
        logger.warn('Gemini AI inference fallback triggered', genErr.message);
      }
    }

    const cleanTitle = title || channelName || 'Live Broadcast';
    const isSports = /sport|football|soccer|espn|nfl|nba|f1|racing|tennis|ufc|boxing/i.test(`${cleanTitle} ${channelName} ${category}`);
    const isMovie = /movie|cinema|film|action|drama|thriller|comedy/i.test(`${cleanTitle} ${category}`);
    const isNews = /news|live|cnn|bbc|fox|msnbc|bloomberg/i.test(`${cleanTitle} ${channelName}`);

    const fallbackData = {
      summary: description && description.length > 20
        ? description.slice(0, 200) + '...'
        : isSports
          ? `Live coverage and competition streaming on ${channelName}. High-stakes tactical matchup broadcast in real-time.`
          : isMovie
            ? `Cinematic feature presentation: "${cleanTitle}". Engaging storytelling curated for maximum entertainment.`
            : isNews
              ? `Real-time coverage and breaking reports delivered by the ${channelName} newsroom.`
              : `Current scheduled program on ${channelName}. Live IPTV stream with digital audio and dynamic guide sync.`,
      castOrKeyFigures: isSports
        ? ['Team Captains', 'Head Coaches', 'Lead Match Commentator']
        : isMovie
          ? ['Lead Protagonist', 'Supporting Cast', 'Director']
          : ['Broadcast Anchor', 'Correspondents'],
      triviaOrTip: isSports
        ? 'Tip: Use the Video Player Multi-Screen matrix to watch simultaneous camera angles or competing matches.'
        : 'Tip: You can use Audio DSP Speech Boost in player settings to improve dialogue clarity.',
      mood: isSports ? 'High-Intensity Action' : isMovie ? 'Cinematic Experience' : isNews ? 'Live Insight' : 'Entertaining Stream'
    };

    return res.json({
      success: true,
      aiGenerated: false,
      data: fallbackData,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Error generating AI program context', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// UNIVERSAL STREAM RELAY & M3U8 PROXY GATEWAY
// ==========================================
app.use('/api/stream', cors({ origin: '*' }));
app.get('/api/stream/proxy', handleStreamProxy);
app.head('/api/stream/proxy', handleStreamProxy);
app.options('/api/stream/proxy', handleStreamProxy);

app.get('/api/stream/probe', async (req, res) => {
  const targetUrl = (req.query.url as string) || '';
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing required query parameter "url"' });
  }
  const force = req.query.force === 'true';
  const result = await streamHealthProber.probeStream(targetUrl, force);
  res.json(result);
});

app.post('/api/stream/probe/batch', async (req, res) => {
  const { urls } = req.body;
  if (!Array.isArray(urls)) {
    return res.status(400).json({ error: 'Expected "urls" array in request body' });
  }
  const results = await streamHealthProber.probeBatch(urls);
  res.json({ results, totalProbed: Object.keys(results).length });
});

// ==========================================
// CHANNEL METADATA & ENRICHMENT (IPTV-ORG)
// ==========================================
app.use('/api/channels', cors({ origin: '*' }));

app.post('/api/channels/enrich', async (req: any, res) => {
  try {
    const { channels } = req.body;
    if (!Array.isArray(channels)) {
      return res.status(400).json({ error: 'Expected channels array in request body' });
    }
    const result = await channelMetadataService.enrichChannels(channels);
    res.json(result);
  } catch (error: any) {
    logger.error('Error enriching channels', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/channels/metadata/stats', async (req, res) => {
  try {
    res.json(channelMetadataService.getStats());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/channels/logo - Proxy & Cache Remote Logo
app.get('/api/channels/logo', async (req, res) => {
  const url = (req.query.url as string) || '';
  const name = (req.query.name as string) || '';
  
  if (!url) {
    // Generate immediate fallback SVG if no URL provided
    const svg = generateLogoSvg(name || 'TV');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(svg);
  }

  const cached = await fetchAndCacheLogo(url);
  if (cached) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('Cache-Control', 'public, max-age=43200'); // 12h
    return res.send(cached.buffer);
  }

  // Graceful fallback to deterministic initials SVG avatar if remote image is unreachable
  const svg = generateLogoSvg(name || 'TV');
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(svg);
});

// GET /api/channels/avatar - Deterministic Gradient SVG Generator
app.get('/api/channels/avatar', (req, res) => {
  const name = (req.query.name as string) || 'TV';
  const size = Math.min(512, Math.max(32, parseInt(req.query.size as string, 10) || 120));
  const svg = generateLogoSvg(name, size);
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
  res.send(svg);
});

// ==========================================
// M3U PLAYLIST EXPORT API (PHASE 9)
// ==========================================
app.use('/api/export', cors({ origin: '*' }));

app.post('/api/export/playlist.m3u', (req, res) => {
  try {
    const { channels, playlistName, includeGroupTitle, includeLogos, includeEpgInfo } = req.body;
    if (!Array.isArray(channels)) {
      return res.status(400).json({ error: 'Expected channels array in request body' });
    }
    const name = playlistName || 'IPTV-Curated-Playlist';
    const header = `#EXTM3U x-tvg-url="https://iptv-org.github.io/epg/guides.json" tvg-shift="0"\n#PLAYLIST:${name}\n`;
    const entries = channels.map((c: any) => {
      const tvgId = (includeEpgInfo !== false && c.tvgId) ? ` tvg-id="${c.tvgId}"` : '';
      const tvgName = (includeEpgInfo !== false && c.tvgName) ? ` tvg-name="${c.tvgName}"` : ` tvg-name="${c.name || 'Channel'}"`;
      const tvgLogo = (includeLogos !== false && c.logo) ? ` tvg-logo="${c.logo}"` : '';
      const tvgCountry = c.countryCode ? ` tvg-country="${c.countryCode}"` : '';
      const tvgLanguage = c.language ? ` tvg-language="${c.language}"` : '';
      const groupTitle = (includeGroupTitle !== false && c.group) ? ` group-title="${c.group}"` : '';

      const extinf = `#EXTINF:-1${tvgId}${tvgName}${tvgLogo}${tvgCountry}${tvgLanguage}${groupTitle},${c.name || 'Channel'}`;
      return `${extinf}\n${c.url}`;
    });

    const m3uContent = header + entries.join('\n') + '\n';
    const filename = `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.m3u`;
    res.setHeader('Content-Type', 'audio/x-mpegurl; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(m3uContent);
  } catch (error: any) {
    logger.error('Error generating M3U playlist export', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// XTREAM CODES LIVE EPG & CATCHUP PROXY API (PHASE 12)
// ==========================================
app.use('/api/xtream', cors({ origin: '*' }));

app.get('/api/xtream/epg', async (req, res) => {
  try {
    const serverUrl = (req.query.serverUrl as string) || '';
    const username = (req.query.username as string) || '';
    const password = (req.query.password as string) || '';
    const streamId = (req.query.streamId as string) || '';
    const action = (req.query.action as string) === 'get_simple_data_table' 
      ? 'get_simple_data_table' 
      : 'get_short_epg';
    const limit = parseInt(req.query.limit as string, 10) || 10;

    if (!serverUrl || !username || !password || !streamId) {
      return res.status(400).json({ 
        error: 'Missing required parameters: serverUrl, username, password, and streamId are required.' 
      });
    }

    let baseUrl = serverUrl.trim().replace(/\/+$/, '');
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `http://${baseUrl}`;
    }

    const { safe, reason } = isSafeTargetUrl(baseUrl);
    if (!safe) {
      return res.status(403).json({ error: reason || 'Access to private or loopback addresses is prohibited.' });
    }

    const targetUrl = `${baseUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=${action}&stream_id=${encodeURIComponent(streamId)}${action === 'get_short_epg' ? `&limit=${limit}` : ''}`;

    const upstreamRes = await fetch(targetUrl, { signal: AbortSignal.timeout(8000) });
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({ 
        error: `Upstream Xtream server returned HTTP ${upstreamRes.status}` 
      });
    }

    const data: any = await upstreamRes.json().catch(() => null);
    const listings = (data && Array.isArray(data.epg_listings)) 
      ? data.epg_listings 
      : (Array.isArray(data) ? data : []);

    res.json({
      success: true,
      streamId,
      action,
      totalListings: listings.length,
      listings
    });
  } catch (error: any) {
    logger.error('Error proxying Xtream EPG request', error);
    res.status(500).json({ error: error.message || 'Internal server error while fetching Xtream EPG' });
  }
});

// ==========================================
// STALKER / MINISTRA STB PORTAL PROXY API
// ==========================================
app.use('/api/stalker', cors({ origin: '*' }));

app.get('/api/stalker/portal', async (req, res) => {
  try {
    const targetUrl = (req.query.url as string) || '';
    const mac = (req.query.mac as string) || '';
    const token = (req.query.token as string) || '';

    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing target url parameter' });
    }

    const { safe, reason } = isSafeTargetUrl(targetUrl);
    if (!safe) {
      return res.status(403).json({ error: reason || 'Access to private or loopback addresses is prohibited.' });
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
      'X-User-Agent': 'Model: MAG250; Link: WiFi',
      'Cookie': `mac=${encodeURIComponent(mac)}; stb_lang=en; timezone=GMT;`
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const upstreamRes = await fetch(targetUrl, {
      headers,
      signal: AbortSignal.timeout(10000)
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({ error: `Upstream Stalker portal returned HTTP ${upstreamRes.status}` });
    }

    const contentType = upstreamRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await upstreamRes.json().catch(() => null);
      return res.json(data);
    } else {
      const text = await upstreamRes.text();
      try {
        const parsed = JSON.parse(text);
        return res.json(parsed);
      } catch {
        return res.send(text);
      }
    }
  } catch (error: any) {
    logger.error('Error proxying Stalker portal request', error);
    res.status(500).json({ error: error.message || 'Internal server error while fetching Stalker portal' });
  }
});


// ==========================================
// PUBLIC EPG GUIDE & SCHEDULE API
// ==========================================
app.use('/api/epg/live', cors({ origin: '*' }));
app.use('/api/epg/schedule', cors({ origin: '*' }));

app.get('/api/epg/live', async (req, res) => {
  try {
    const rawIds = (req.query.channelIds as string) || '';
    const channelIds = rawIds ? rawIds.split(',').map((id) => id.trim()).filter(Boolean) : [];
    const liveMap = epgService.getNowNext(channelIds);
    res.json({
      channels: liveMap,
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Error serving live EPG', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/epg/live', async (req, res) => {
  try {
    const channelIds: string[] = Array.isArray(req.body?.channelIds)
      ? req.body.channelIds.map((id: any) => String(id).trim()).filter(Boolean)
      : [];
    const liveMap = epgService.getNowNext(channelIds);
    res.json({
      channels: liveMap,
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Error serving live EPG batch', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/epg/schedule/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const hours = Number(req.query.hours) || 24;
    const schedule = epgService.getSchedule(channelId, hours);
    res.json({
      channelId,
      hours,
      programmes: schedule
    });
  } catch (error: any) {
    logger.error('Error serving channel schedule', error);
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

app.post('/api/epg/sync', async (req: any, res) => {
  try {
    const { urls } = req.body || {};
    const targetUrls = Array.isArray(urls) && urls.length > 0
      ? urls
      : ['https://iptv-org.github.io/epg/guides/us.xml'];

    const result = await epgService.fetchAndIngestFeeds(targetUrls);
    await channelMetadataService.refreshIndex();
    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error executing EPG sync', error);
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

// Billing Price Resolver Map
const STRIPE_PRICE_MAP: Record<string, string> = {
  price_pro_monthly: config.STRIPE_PRICE_PRO_MONTHLY || 'price_1UHwUyKXruwBPCzFT7aMvpJ6',
  price_pro_yearly: config.STRIPE_PRICE_PRO_YEARLY || 'price_1UHwUzKXruwBPCzF2iAGrzwY',
  price_pro_lifetime: config.STRIPE_PRICE_PRO_LIFETIME || 'price_1UHwUzKXruwBPCzFk6J0hUie',
  price_builder_monthly: config.STRIPE_PRICE_BUILDER_MONTHLY || 'price_1UHwUzKXruwBPCzFCGewmHQf',
  price_builder_yearly: config.STRIPE_PRICE_BUILDER_YEARLY || 'price_1UHwUzKXruwBPCzF4WJ4W6hQ',
  price_builder_lifetime: config.STRIPE_PRICE_BUILDER_LIFETIME || 'price_1UHwUzKXruwBPCzFfophCqlM',
};

// Billing
app.post('/api/billing/create-checkout-session', async (req: any, res) => {
  try {
    const uid = req.user.uid;
    const { priceId, successUrl, cancelUrl, mode = 'subscription' } = req.body;

    const profile = await userRepo.getUser(uid);
    if (!profile) return res.status(404).json({ error: 'User profile not found' });

    // Lookup existing stripe customer id or register new
    const stripeCustomerId = await createOrRetrieveCustomer(profile.email, profile.displayName || profile.email);
    
    const resolvedPriceId = STRIPE_PRICE_MAP[priceId] || priceId;

    const url = await createCheckoutSession(
      stripeCustomerId,
      profile.email,
      resolvedPriceId,
      successUrl,
      cancelUrl,
      { uid, email: profile.email, priceId: priceId || '', resolvedPriceId },
      mode
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
      const planPriceId = session.line_items?.data?.[0]?.price?.id || session.metadata?.resolvedPriceId || session.metadata?.priceId;
      
      const isBuilder = 
        planPriceId === 'price_builder_subscription' ||
        planPriceId === 'price_enterprise_tier' ||
        planPriceId === config.STRIPE_PRICE_BUILDER_MONTHLY ||
        planPriceId === config.STRIPE_PRICE_BUILDER_YEARLY ||
        planPriceId === config.STRIPE_PRICE_BUILDER_LIFETIME ||
        planPriceId === 'price_1UHwUzKXruwBPCzFCGewmHQf' ||
        planPriceId === 'price_1UHwUzKXruwBPCzF4WJ4W6hQ' ||
        planPriceId === 'price_1UHwUzKXruwBPCzFfophCqlM' ||
        planPriceId === 'price_1UHvjdKXruwBPCzFuZMwZsy6' ||
        planPriceId === 'price_1UHvjdKXruwBPCzFQm7p0Mtb' ||
        planPriceId === 'price_1UHvjdKXruwBPCzFXp3aW0yP' ||
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
    const list = await userRepo.listUsers().catch((dbErr: any) => {
      logger.warn('Database degraded while listing users, returning empty set', dbErr);
      return [];
    });
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
    const list = await workspaceRepo.listAllWorkspaces(200).catch((dbErr: any) => {
      logger.warn('Database degraded while listing workspaces, returning empty set', dbErr);
      return [];
    });
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
    const builds = await buildRepo.listAllBuilds().catch((dbErr: any) => {
      logger.warn('Database degraded while listing builds, returning empty set', dbErr);
      return [];
    });
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
    const logs = await auditRepo.listActions().catch((dbErr: any) => {
      logger.warn('Database degraded while listing audit logs, returning empty set', dbErr);
      return [];
    });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Google AdSense Monetization & Designated Slots Management
app.get('/api/admin/adsense', adminGuard, async (req, res) => {
  try {
    const config = await adsenseService.getConfig();
    res.json(config);
  } catch (err: any) {
    logger.error('Failed to retrieve admin AdSense configuration', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/adsense', adminGuard, async (req: any, res) => {
  try {
    const { clientId, enabled, testMode, autoAdsEnabled, slots } = req.body;

    const updatedConfig = await adsenseService.updateConfig({
      clientId,
      enabled: typeof enabled === 'boolean' ? enabled : undefined,
      testMode: typeof testMode === 'boolean' ? testMode : undefined,
      autoAdsEnabled: typeof autoAdsEnabled === 'boolean' ? autoAdsEnabled : undefined,
      slots: slots && typeof slots === 'object' ? slots : undefined,
      updatedBy: req.user?.email || req.user?.uid || 'admin'
    });

    const adminAction: AdminAction = {
      actionId: `act_${Math.random().toString(36).substring(2, 15)}`,
      adminUid: req.user?.uid || 'admin',
      actionType: 'ADSENSE_CONFIG_UPDATE',
      targetType: 'SYSTEM_SETTINGS',
      targetId: 'adsense',
      notes: `Updated Google AdSense configuration (Publisher: ${updatedConfig.clientId}, Enabled: ${updatedConfig.enabled})`,
      createdAt: new Date().toISOString()
    };
    try {
      await auditRepo.logAction(adminAction);
    } catch (auditErr: any) {
      logger.warn('Database degraded: audit log skipped for AdSense update', auditErr);
    }

    res.json({
      success: true,
      message: 'Google AdSense settings updated successfully',
      config: updatedConfig
    });
  } catch (err: any) {
    logger.error('Failed to update AdSense configuration', err);
    res.status(500).json({ error: err.message });
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
