# IPTV.MENU — Comprehensive Security, Code & Architecture Audit

This audit evaluates the IPTV.MENU application across security, video streaming stability, reliability, Smart TV compatibility, and licensing compliance.

---

## Executive Summary of Findings

| Severity | Count | Primary Impact Areas |
|---|---|---|
| **CRITICAL** | 6 | Total Authentication Bypass, Exposed Production Secrets, Hardcoded Pirate Streams, Missing Password Verification, SSRF / Open Proxy, Database Job Queue Race Conditions |
| **HIGH** | 5 | Broken Storage Signed URLs, Corrupted XMLTV Output, Mobile Video Player Lifecycle & Audio Leaks, TV D-Pad MutationObserver CPU Thrashing, Blocking Main-Thread M3U Parser Freezes |
| **MEDIUM** | 6 | Fractured Triple-Auth Stack, Invalid Cloud Run Worker Config, Incomplete EAS Build Dispatch, XML Entity Mangling, Fragile Manifest Rewriting, Non-Unique Channel ID Collisions |
| **LOW** | 3 | Dynamic Script CDN Injection, Node Punycode Deprecation Warnings, Dead/Stubbed Internal Endpoints |

---

## 1. Critical Severity Findings

### FINDING-CRIT-01: Cryptographically Unsigned Base64 Authentication Tokens (Total Privilege Escalation)
- **Location**: [`packages/auth/src/index.ts:7-45`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/auth/src/index.ts#L7-L45), [`packages/auth/src/index.ts:113-132`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/auth/src/index.ts#L113-L132), [`apps/api/src/server.ts:205`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts#L205), [`apps/api/src/server.ts:264`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts#L264)
- **Impact**: The backend authentication system issues tokens that are simply `Buffer.from(JSON.stringify(payload)).toString('base64')` without an HMAC signature or asymmetric cryptographic key. The auth middleware (`authenticateFirebaseToken`) accepts any base64 JSON payload when Firebase Admin is not configured. Any anonymous user can forge an admin token by sending `Authorization: Bearer <base64({ uid: "attacker", email: "angelburgosrosado@gmail.com", role: "admin" })>`, granting full administrative access to all users, playlists, billing, and system metrics.
- **Recommended Fix**: Implement standard JSON Web Token (JWT) signing using `jsonwebtoken` or `jose` with a strong secret (`JWT_SECRET` in environment variables). Require signature verification on all incoming tokens. Completely remove the fallback to unverified Base64 parsing.
- **Safe to Automate**: **YES** (Create a unified JWT sign/verify module in `@iptv-menu/auth`).

---

### FINDING-CRIT-02: Hardcoded Production Database Credentials & Stripe Secret Keys in Source Control
- **Location**: [`README.md:48`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/README.md#L48), [`README.md:130`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/README.md#L130), [`.env:2`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/.env#L2), [`.env:12-13`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/.env#L12-L13), [`apps/api/src/server.ts:250`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts#L250)
- **Impact**:
  1. A live Neon PostgreSQL database connection string containing a plaintext password (`npg_qu4rczZoHix9`) is committed directly into [`README.md`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/README.md).
  2. Live Stripe API restricted secret key (`rk_live_...`) and Stripe webhook secret (`whsec_...`) are stored in [`.env`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/.env).
  3. A plaintext administrator password (`"Admin123"`) is hardcoded in [`apps/api/src/server.ts:250`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts#L250).
- **Recommended Fix**:
  1. Immediately rotate the Neon PostgreSQL database password in the Neon Console.
  2. Immediately rotate the Stripe secret key and webhook secret in the Stripe Dashboard.
  3. Purge all plaintext secrets from [`README.md`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/README.md) and [`.env`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/.env), replacing them with dummy placeholders.
  4. Remove the hardcoded `Admin123` comparison in [`apps/api/src/server.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts).
- **Safe to Automate**: **PARTIAL** (Code redaction is safe; credentials rotation must be performed by the user in external vendor consoles).

---

### FINDING-CRIT-03: Hardcoded Commercial Pirate IPTV Streams & Xtream Credentials (Licensing & Compliance Hazard)
- **Location**: [`src/data/melhataChannels.ts:8-23`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/data/melhataChannels.ts#L8-L23), [`src/store/usePlayerStore.ts:198-201`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/store/usePlayerStore.ts#L198-L201), [`src/components/DesktopM3uUpload.tsx:43`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/DesktopM3uUpload.tsx#L43)
- **Impact**:
  - `src/data/melhataChannels.ts` hardcodes 2,270+ commercial pay-TV stream URLs (TSN, Sky Sports, HBO, etc.) with active pirate Xtream line credentials (`username="2fc163abd9", password="8b1b9283c02f"`).
  - `src/store/usePlayerStore.ts:200` seeds user subscriptions with a live pirate line (`username=8rvzieximl&password=h1usotpevd`).
  - Distributing unauthorized rebroadcasts of proprietary cable channels violates copyright law (DMCA, EU Copyright Directive) and app store distribution policies (Google Play Developer Program Policy, Apple App Store Review Guidelines 5.2). This creates direct liability for the platform operator and will result in instant app store rejection.
- **Recommended Fix**: Remove all pirate stream definitions, credentials, and `melhataChannels.ts`. Replace default fallback channels exclusively with legally open public broadcast feeds (e.g., NASA TV, PBS, DW News, France 24, Bloomberg, Red Bull TV from `iptv-org` public domain collections). Allow users to provide their own private playlist URLs via user inputs without pre-packaging unauthorized streams.
- **Safe to Automate**: **YES** (Purge pirate assets and replace with clean public feeds).

---

### FINDING-CRIT-04: No Password Storage, Hashing, or Verification for Standard Users (Instant Account Takeover)
- **Location**: [`apps/api/src/server.ts:207-217`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts#L207-L217), [`apps/api/src/server.ts:295-323`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts#L295-L323), [`packages/db/src/schema.ts:16-26`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/db/src/schema.ts#L16-L26)
- **Impact**:
  - In `apps/api/src/server.ts`, `/api/public/auth/register` accepts a password but completely discards it; no password or hash is stored in the database.
  - In `/api/public/auth/login`, for any non-admin email, the endpoint performs:
    ```ts
    const user = await userRepo.getUserByEmail(normalizedEmail);
    if (!user) return res.status(401)...;
    // Generates token and logs user in!
    ```
  - The submitted `password` parameter is never verified! Any person can log in to ANY registered user account simply by typing their email address with any arbitrary password or no password at all.
- **Recommended Fix**: Add a `password_hash` column to the `users` table schema in `packages/db`. Hash passwords using `bcrypt` or `argon2` during registration, and verify password hashes using constant-time comparison on login.
- **Safe to Automate**: **YES**.

---

### FINDING-CRIT-05: Server-Side Request Forgery (SSRF) and Open HTTP Proxy Relay
- **Location**: [`apps/api/src/services/streamProxyService.ts:18-67`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/services/streamProxyService.ts#L18-L67), [`apps/api/src/services/streamProxyService.ts:165-170`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/services/streamProxyService.ts#L165-L170)
- **Impact**:
  - `isSafeTargetUrl` only tests hostname strings against regexes (`localhost`, `127.0.0.1`, `10.*`, `192.168.*`, `169.254.169.254`).
  - It does NOT perform DNS resolution prior to connecting. Domains that resolve to internal IPs (DNS rebinding, `nip.io`, `127.0.0.1.nip.io`), alternative decimal IP representations (`http://2130706433`), or IPv6 encodings (`http://[::1]`) bypass the checks.
  - `fetch(targetUrl, { redirect: 'follow' })` follows HTTP 301/302 redirects blindly. An external server can redirect the backend to `http://169.254.169.254/computeMetadata/v1/` or internal VPC microservices.
  - The endpoint `/api/stream/proxy` is completely unauthenticated and allows any third party on the internet to use the server as an open forward proxy.
- **Recommended Fix**:
  1. Resolve DNS hostnames to IPv4/IPv6 addresses before connection and validate that the resolved IP does not belong to private/link-local/loopback CIDR ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`, `::1/128`, `fc00::/7`, `fe80::/10`).
  2. Set `redirect: 'manual'` and re-validate redirection targets before following.
  3. Require user authentication or HMAC URL signing for stream proxy requests.
- **Safe to Automate**: **YES**.

---

### FINDING-CRIT-06: Database Job Queue Race Conditions in Multi-Instance Asynchronous Worker
- **Location**: [`packages/jobs/src/index.ts:80-99`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/jobs/src/index.ts#L80-L99)
- **Impact**:
  ```ts
  const [row] = await db
    .select()
    .from(schema.playlistRuns)
    .where(eq(schema.playlistRuns.status, 'queued'))
    .limit(1);

  if (!row) return null;

  await db
    .update(schema.playlistRuns)
    .set({ status: 'running', startedAt })
    .where(eq(schema.playlistRuns.runId, row.runId));
  ```
  - This is a non-atomic `SELECT` followed by `UPDATE`. If two worker containers (or concurrent worker loops) poll simultaneously, both select the exact same queued task. Both mark it as running and execute duplicate probing, EAS builds, or EPG generation jobs concurrently.
- **Recommended Fix**: Use atomic row locking or atomic update:
  ```sql
  UPDATE playlist_runs 
  SET status = 'running', started_at = NOW() 
  WHERE run_id = (
    SELECT run_id FROM playlist_runs 
    WHERE status = 'queued' 
    FOR UPDATE SKIP LOCKED 
    LIMIT 1
  ) 
  RETURNING *;
  ```
- **Safe to Automate**: **YES**.

---

## 2. High Severity Findings

### FINDING-HIGH-01: Broken Signed URL Protocol for Vercel Blob in Playlist Uploads
- **Location**: [`packages/storage/src/index.ts:52-55`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/storage/src/index.ts#L52-L55), [`apps/api/src/server.ts:662-679`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts#L662-L679), [`src/lib/apiClient.ts:63-77`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/lib/apiClient.ts#L63-L77)
- **Impact**: When running with `BLOB_READ_WRITE_TOKEN`, `getSignedUrl` returns the raw relative storage path (`users/${uid}/uploads/...`) instead of a valid HTTP upload URL. The frontend attempts to execute `fetch(uploadUrl, { method: 'PUT', body: file })` against this relative path, resulting in HTTP 404/405 errors and preventing users from uploading custom M3U files on Vercel deployments.
- **Recommended Fix**: Use `@vercel/blob`'s client upload token API (`generateClientTokenFromReadWriteToken`) or proxy the file upload through an Express multipart route (`/api/playlists/upload`) that directly pipes to `uploadToBlob`.
- **Safe to Automate**: **YES**.

---

### FINDING-HIGH-02: Corrupted XMLTV Output via Raw String Concatenation in EPG Aggregator
- **Location**: [`apps/worker/src/index.ts:275-285`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/src/index.ts#L275-L285)
- **Impact**: When combining multiple EPG feeds, the worker simply appends raw XML strings:
  ```ts
  let aggregatedXml = '';
  for (const url of sourceUrls) {
    const resp = await axios.get(url, ...);
    aggregatedXml += resp.data;
  }
  ```
  This creates an invalid XML file with multiple `<?xml ...?>` declarations and multiple `<tv>` root tags. Any standard IPTV client attempting to parse this output will fail with XML parse errors.
- **Recommended Fix**: Parse incoming XMLTV documents and extract `<channel>` and `<programme>` elements, merging them under a single root `<tv>` container.
- **Safe to Automate**: **YES**.

---

### FINDING-HIGH-03: Mobile Video Player Missing Prop-Change Watcher & Audio Leak on Screen Unmount
- **Location**: [`mobile/src/components/VideoPlayer.tsx:20-23`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile/src/components/VideoPlayer.tsx#L20-L23), [`mobile/src/components/VideoPlayer.tsx:66-70`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile/src/components/VideoPlayer.tsx#L66-L70), [`mobile/app/player/[id].tsx:31`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile/app/player/[id].tsx#L31)
- **Impact**:
  1. In `mobile/src/components/VideoPlayer.tsx`, `useVideoPlayer({ uri: streamUrl })` initializes once on mount. When the user selects a new channel and `streamUrl` prop changes, no effect triggers `player.replace()`, causing playback to be stuck on the initial channel.
  2. Because `supportsBackgroundPlayback: true` is configured in `app.json`, and `VideoPlayer` does not pause or dispose of the player when the component unmounts, audio continues playing indefinitely in the background after the user navigates back to the channel list.
- **Recommended Fix**: Add a `useEffect` watching `streamUrl` that calls `player.replace({ uri: streamUrl })`, and return a cleanup function in `useEffect` that calls `player.pause()` on unmount.
- **Safe to Automate**: **YES**.

---

### FINDING-HIGH-04: Unthrottled MutationObserver Causing Main-Thread CPU Thrashing on Smart TVs
- **Location**: [`src/hooks/useSpatialNavigation.ts:37-43`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/hooks/useSpatialNavigation.ts#L37-L43), [`src/hooks/useSpatialNavigation.ts:98`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/hooks/useSpatialNavigation.ts#L98)
- **Impact**: `useSpatialNavigation` registers a `MutationObserver` on `document.body` that invokes synchronous `spatialNav.scanDom(document)` (`querySelectorAll('[data-tv-focus]')`) on every single DOM mutation. During stream playback, player time updates, subtitle re-renders, and HUD changes occur several times per second, triggering hundreds of synchronous DOM queries. On resource-constrained Smart TVs (Fire TV Stick, Chromecast with Google TV), this causes UI freezing, frame drops, and remote control input lag.
- **Recommended Fix**: Debounce the `MutationObserver` callback with a 250ms threshold, and eliminate duplicate DOM scans on keydown events.
- **Safe to Automate**: **YES**.

---

### FINDING-HIGH-05: Synchronous Main-Thread Splitting of Large M3U Playlists Freezes Browser
- **Location**: [`src/utils/m3uParser.ts:38`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/utils/m3uParser.ts#L38), [`src/utils/m3uParser.ts:52-141`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/utils/m3uParser.ts#L52-L141)
- **Impact**: Commercial IPTV playlists commonly exceed 50,000 to 100,000 channels (20MB to 100MB+ in text size). Running `m3uContent.split(/\r?\n/)` allocates hundreds of thousands of string objects in a single tick, and the subsequent synchronous loop blocks the JavaScript event loop for several seconds, triggering browser "Page Unresponsive" warnings and crashing memory on low-RAM devices.
- **Recommended Fix**: Implement streaming/chunked parsing using a Web Worker or generator pattern that yields back to the event loop every 500 lines (`await new Promise(r => setTimeout(r, 0))`).
- **Safe to Automate**: **YES**.

---

## 3. Medium Severity Findings

### FINDING-MED-01: Conflicting Triple-Authentication Implementations
- **Location**: [`src/authStore.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/authStore.ts), [`src/lib/firebase.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/lib/firebase.ts), [`src/lib/supabase.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/lib/supabase.ts), [`src/hooks/useSupabaseAuth.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/hooks/useSupabaseAuth.ts)
- **Impact**: The repository contains three separate, competing authentication models: Firebase Auth, Supabase Auth, and a custom Base64 JSON token store. Different components query different auth mechanisms, creating synchronization bugs, confusing session state, and bloated vendor client bundles (Firebase SDK + Supabase SDK together total >500KB of unnecessary JavaScript).
- **Recommended Fix**: Unify on a single primary authentication provider. If Neon Serverless PostgreSQL is the designated database, use standard server-side JWT authentication with secure HTTP-only cookies or bearer tokens, removing unused SDKs.
- **Safe to Automate**: **PARTIAL** (Architectural decision required on preferred auth provider).

---

### FINDING-MED-02: Cloud Run Deployment Configuration Flaws for Background Worker
- **Location**: [`cloudbuild.yaml:40-51`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/cloudbuild.yaml#L40-L51), [`apps/worker/src/index.ts:310-376`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/src/index.ts#L310-L376)
- **Impact**: `cloudbuild.yaml` deploys `apps/worker` to Google Cloud Run as a standard HTTP service (`gcloud run deploy iptv-worker`). However, `apps/worker` does not bind to any HTTP port (it is a polling background worker loop). Cloud Run health checks will fail, causing deployments to be terminated. Furthermore, Cloud Run scales CPU to zero when no incoming HTTP requests exist, halting the polling worker.
- **Recommended Fix**: Either run `iptv-worker` as a Cloud Run Job / Compute Engine instance / Render Background Worker (as specified in `render.yaml`), or add a lightweight Express HTTP health check server (`/healthz`) listening on `$PORT` with `--no-cpu-throttling`.
- **Safe to Automate**: **YES**.

---

### FINDING-MED-03: EAS Cloud Build API Invocation Lacks Project Archive Payload
- **Location**: [`packages/jobs/src/easBuildClient.ts:45-69`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/jobs/src/easBuildClient.ts#L45-L69)
- **Impact**: `triggerEasAndroidBuild` calls `POST https://api.expo.dev/v2/projects/${projectId}/builds` with build parameters but does not provide an uploaded project archive or Git commit reference. The Expo EAS API rejects build triggers that lack an `archiveUrl` or uploaded project tarball.
- **Recommended Fix**: Wrap EAS CLI builds or implement the full EAS v2 tarball upload protocol (create project upload URL, upload compressed mobile directory, then trigger build with `archiveUrl`).
- **Safe to Automate**: **YES**.

---

### FINDING-MED-04: Regex-Based XMLTV Parsing Lacks XML Entity Decoding
- **Location**: [`apps/api/src/services/epgService.ts:73-75`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/services/epgService.ts#L73-L75)
- **Impact**: Title and description tags extracted via regex retain raw XML character entities (`&amp;`, `&quot;`, `&lt;`, `&gt;`, `&#39;`). Program titles in the EPG guide display as `"Law &amp; Order"` instead of `"Law & Order"`.
- **Recommended Fix**: Unescape XML entities using `he` or a lightweight entity decoder before storing programme records.
- **Safe to Automate**: **YES**.

---

### FINDING-MED-05: Fragile Query Parameter String Concatenation in M3U8 Manifest Rewriter
- **Location**: [`apps/api/src/services/streamProxyService.ts:96-97`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/services/streamProxyService.ts#L96-L97), [`apps/api/src/services/streamProxyService.ts:111`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/services/streamProxyService.ts#L111), [`apps/api/src/services/streamProxyService.ts:194`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/services/streamProxyService.ts#L194)
- **Impact**: Line 194 appends `&ua=...` to `proxyEndpointUrl` without a preceding `?`, producing malformed URLs (`/api/stream/proxy&ua=...`). Later parsing logic attempts to split on `&ua=`, generating corrupt segment URLs in proxied HLS streams.
- **Recommended Fix**: Use standard `URL` and `URLSearchParams` objects to construct all proxy query parameters cleanly.
- **Safe to Automate**: **YES**.

---

### FINDING-MED-06: Channel ID Collisions Across Non-Unique `tvg-id` Tags
- **Location**: [`src/utils/m3uParser.ts:121`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/utils/m3uParser.ts#L121)
- **Impact**: `m3uParser.ts` uses `currentExtinf.tvgId` directly as the unique channel `id`. In large playlists, many channels share identical `tvgId` tags (e.g. SD and HD variants, backup feeds, or regional broadcasts sharing `ca.tsn1`). This causes React key duplication warnings and breaks channel selection in the UI.
- **Recommended Fix**: Ensure channel IDs are uniquely derived from a combination of `tvgId`, channel name, and stream URL.
- **Safe to Automate**: **YES**.

---

## 4. Low Severity Findings

### FINDING-LOW-01: Dynamic External CDN Script Injection for Hls.js
- **Location**: [`src/shims/expo-video.tsx:223-228`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/shims/expo-video.tsx#L223-L228)
- **Impact**: The web video player shim dynamically loads `hls.min.js` from `cdn.jsdelivr.net` at runtime. If the user is offline or in a restricted network environment, or if jsDelivr experiences downtime, video playback fails.
- **Recommended Fix**: Install `hls.js` as an explicit npm dependency (`npm install hls.js`) and bundle it locally with the Vite build.
- **Safe to Automate**: **YES**.

---

### FINDING-LOW-02: Node.js Punycode Deprecation Warnings
- **Location**: Triggered during test runs and API bundling (`DEP0040: The punycode module is deprecated`).
- **Impact**: Emits console noise in modern Node.js versions (v20+ / v22+).
- **Recommended Fix**: Upgrade or replace transitive dependencies relying on the legacy core `punycode` module.
- **Safe to Automate**: **YES**.

---

### FINDING-LOW-03: Dead and Stubbed Internal Job Endpoints
- **Location**: [`apps/api/src/server.ts:1316-1324`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts#L1316-L1324)
- **Impact**: `/api/internal/jobs/playlist-clean` and `/api/internal/jobs/playlist-validate` are unauthenticated stub routes that log and return `{ success: true, processed: 0 }`.
- **Recommended Fix**: Secure internal routes with a shared secret header (`X-Internal-Secret`) and implement or cleanly document the webhook dispatch.
- **Safe to Automate**: **YES**.
