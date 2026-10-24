# IPTV.MENU — Security and Reliability Risk Assessment

**Repository:** `angelburgosrosado/iptv-menu-app`  
**Date of Audit:** October 14, 2026  
**Auditor Roles:** Principal Security Reviewer, QA Lead, Infrastructure Architect

---

## 1. Threat Modeling & Risk Categorization

This assessment catalogs all verified security vulnerabilities, architectural reliability risks, authorization flaws, and production-readiness gaps across the codebase.

| Risk ID | Title | Domain | Severity | Status |
|---|---|---|---|---|
| **SEC-01** | Live Stripe Secret Key Present in Unencrypted Local `.env` | Secret Exposure | **CRITICAL** | Active on disk |
| **SEC-02** | Live Production Database Connection String with Credentials in Local `.env` | Secret Exposure | **CRITICAL** | Active on disk |
| **SEC-03** | Hardcoded/Predictable JWT Secrets in Config and Environment | Cryptography / Auth | **HIGH** | Verified in code |
| **SEC-04** | SSRF Vector via Stream Proxy and Logo Proxy Gateway | Network Security | **HIGH** | Mitigated (strict mode needed) |
| **SEC-05** | Permissive Wildcard CORS (`Access-Control-Allow-Origin: *`) on Stream Gateway | API Security | **HIGH** | Verified in code |
| **SEC-06** | Unauthenticated Public Access to AI Program Insights Endpoint | Authorization / Abuse | **MEDIUM** | Verified in code |
| **SEC-07** | In-Memory Ephemeral Storage for TV Pairing Codes in Serverless Gateway | Reliability / Auth | **HIGH** | Verified in code |
| **SEC-08** | Plaintext Token & Password Persistence in Browser `localStorage` | Client Security | **MEDIUM** | Verified in code |
| **REL-01** | `dotenv.config()` Overwriting `NODE_ENV` and Breaking Test Verification | CI / Testing Reliability | **HIGH** | Verified in code |
| **REL-02** | TypeScript Compiler Errors in Web Client Blocking Strict Verification | Code Quality / Build | **HIGH** | Verified in code (5 errors) |
| **REL-03** | Foreign Key Violation in `POST /api/epg` on Database Insertion | Data Integrity | **HIGH** | Verified in code |
| **REL-04** | Disconnected Client-Side Mocking in Primary Workflow (M3U & APK Builder) | Product Reliability | **HIGH** | Verified in code |
| **REL-05** | Worker Polling Scalability & Memory Spikes on Large M3U/XMLTV Ingestion | Worker Queue Architecture | **MEDIUM** | Architectural |
| **REL-06** | Framework and Dependency Version Skew Between Web (React 19) and Mobile (React 18) | Ecosystem Compatibility | **MEDIUM** | Verified in config |

---

## 2. Detailed Security Risk Analysis

### SEC-01: Live Stripe Secret Key Present in Local `.env`
- **Severity:** **CRITICAL**
- **Location:** [`.env`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/.env) line 15:  
  `STRIPE_SECRET_KEY=rk_live_REDACTED_STRIPE_SECRET_KEY`
- **Impact:** An attacker gaining access to this key can inspect transactions, create charges, view customer PII, and cancel active subscriptions on the live Stripe account.
- **Root Cause:** A live production restricted key was populated into local development `.env` rather than using test keys (`sk_test_...`) or secret managers.
- **Mitigation Recommendation:**
  1. Immediately roll and deactivate this restricted key in the Stripe Dashboard.
  2. Replace local development keys with sandbox test keys (`sk_test_...`).
  3. Load production keys exclusively via Vercel Project Environment Variables and Cloud Run Secret Manager.

---

### SEC-02: Live Production Database Connection String in Local `.env`
- **Severity:** **CRITICAL**
- **Location:** [`.env`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/.env) line 2:  
  `DATABASE_URL="postgresql://USER:PASSWORD@ep-winter-poetry-ae51hoth.us-east-2.aws.neon.tech/neondb?sslmode=require"`
- **Impact:** Direct read/write access to the Neon PostgreSQL cluster hosting user records, hashed passwords, workspaces, and playlist feeds. Anyone with disk access can dump or modify all customer data.
- **Mitigation Recommendation:**
  1. Reset the `neondb_owner` password immediately in the Neon console.
  2. Utilize Neon branch databases for local development and CI testing rather than the root production branch.
  3. Ensure `.env` is never committed (it is currently in `.gitignore`, but plaintext storage on dev disks carries risk).

---

### SEC-03: Hardcoded and Static JWT Secrets
- **Severity:** **HIGH**
- **Location:** [`packages/config/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/config/src/index.ts) line 20:  
  `JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_insecure_replace_in_prod'`
- **Impact:** If `JWT_SECRET` is unset or omitted in any deployment container, the fallback string is used, allowing attackers to forge arbitrary admin tokens (`role: 'admin'`) and gain complete control over the system.
- **Mitigation Recommendation:**
  Throw an explicit runtime exception in production if `JWT_SECRET` is missing or matches the default fallback string.

---

### SEC-04: Server-Side Request Forgery (SSRF) Vectors in Stream & Logo Proxies
- **Severity:** **HIGH**
- **Location:** [`apps/api/src/services/streamProxyService.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/services/streamProxyService.ts), [`apps/api/src/services/logoService.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/services/logoService.ts)
- **Status:** The codebase has implemented `isSafeTargetUrl()` which explicitly blocks cloud metadata (`169.254.169.254`, `169.254.0.0/16`) and private IPv4 ranges (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`, `127.0.0.0/8`).
- **Residual Risk:**
  - DNS Rebinding: An attacker can point a public domain name (e.g., `attacker.com`) to an allowed public IP during pre-check, and rebind it to `127.0.0.1` upon subsequent HTTP resolution by `fetch()`.
  - IPv6 representations and URL redirection targets: `streamProxyService.ts` sets `redirect: 'follow'` on `fetch()`, which can follow an initial benign URL into an internal private address if the redirect destination is not re-checked.
- **Mitigation Recommendation:**
  Validate the IP address of each redirect hop using an agent-level DNS resolver hook (e.g., `ipaddr.js` socket pinning) and enforce `forceStrictCheck = true` unconditionally in production.

---

### SEC-05: Permissive Wildcard CORS on Video Streaming Gateway
- **Severity:** **HIGH**
- **Location:** [`apps/api/src/services/streamProxyService.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/services/streamProxyService.ts) line 147:  
  `res.setHeader('Access-Control-Allow-Origin', '*');`  
  `res.setHeader('Access-Control-Allow-Headers', '*');`
- **Impact:** Any malicious third-party website visited by a user can utilize the IPTV.MENU stream proxy as an open proxy relay to bypass geographical restrictions, bandwidth caps, or content scrapers at IPTV.MENU's bandwidth expense.
- **Mitigation Recommendation:**
  Restrict `Access-Control-Allow-Origin` to verified platform domains (`https://iptv.menu`, verified tenant subdomains, and `http://localhost:*` in development). Require signed stream tokens or user session cookies for stream proxy requests.

---

### SEC-06: Unauthenticated AI Program Insights Endpoint
- **Severity:** **MEDIUM**
- **Location:** [`apps/api/src/server.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts) line 472:  
  `app.post('/api/ai/program-context', async (req, res) => { ... })`
- **Impact:** This endpoint invokes the Google Gemini API directly using the server's `GEMINI_API_KEY`. Because it lacks authentication, rate-limiting, or CAPTCHA, automated bots can spam requests, exhaust API quotas, and inflate Google Cloud billing.
- **Mitigation Recommendation:**
  Apply `authenticateFirebaseToken` middleware and workspace rate-limiting guards to `/api/ai/program-context`.

---

### SEC-07: In-Memory Ephemeral Storage for TV Pairing Codes
- **Severity:** **HIGH**
- **Location:** [`apps/api/src/server.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts) lines 364–450:  
  `const activePairings = new Map<string, PairingSession>();`
- **Impact:** On Vercel Serverless Functions, multiple concurrent instances run across different isolated worker lambdas. A TV generating a code on Instance A cannot be claimed by a smartphone hitting Instance B. Furthermore, serverless cold restarts wipe the entire in-memory map.
- **Mitigation Recommendation:**
  Persist TV pairing sessions in Neon PostgreSQL (`tv_pairings` table) or an external Redis/Upstash instance with TTL expiration (600s).

---

### SEC-08: Token and Password Handling in Browser `localStorage`
- **Severity:** **MEDIUM**
- **Location:** [`src/authStore.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/authStore.ts) line 47:  
  `window.localStorage.setItem('iptv_auth_state', JSON.stringify(authState));`
- **Impact:** JWT bearer tokens stored in browser `localStorage` are vulnerable to exfiltration via Cross-Site Scripting (XSS).
- **Mitigation Recommendation:**
  Transition to HTTP-only, `SameSite=Strict`, `Secure` session cookies for authentication.

---

## 3. Reliability & Architecture Risks

### REL-01: `dotenv.config()` Overwriting `NODE_ENV` and Breaking Test Verification
- **Severity:** **HIGH**
- **Location:** [`apps/api/src/server.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts) lines 3–5:
  ```ts
  dotenv.config();
  dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
  ```
- **Evidence:**
  When `npm test` is run, Vitest starts in test mode. However, when test files import `server.ts`, `dotenv.config()` reads `.env` where `NODE_ENV=development`. This overrides `process.env.NODE_ENV` to `'development'`, which causes:
  1. `authenticateFirebaseToken` in `packages/auth` to disable test mock token parsing, triggering 401 Unauthorized across all authenticated test routes.
  2. `isSafeTargetUrl` in `streamProxyService.ts` to reject `127.0.0.1` and `localhost` as private addresses, triggering 400 Bad Request.
  When tested explicitly with `NODE_ENV=test`, 100% of the 248 tests pass.
- **Mitigation Recommendation:**
  Do not overwrite `NODE_ENV` if it is already defined (`if (!process.env.NODE_ENV) process.env.NODE_ENV = ...`), and update `package.json` test script to `"test": "cross-env NODE_ENV=test vitest run"`.

---

### REL-02: TypeScript Compiler Errors in Front-End (`tsc --noEmit`)
- **Severity:** **HIGH**
- **Evidence:** Running `npm run lint` (`tsc --noEmit`) fails with 5 errors in 3 files:
  1. `src/components/AiProgramContextPanel.tsx:43:26` - `Property 'currentProgram' does not exist on type 'Channel'`.
  2. `src/components/AiProgramContextPanel.tsx:46:32` - `Property 'epgDescription' does not exist on type 'Channel'`.
  3. `src/components/AiProgramContextPanel.tsx:138:26` - `Property 'currentProgram' does not exist on type 'Channel'`.
  4. `src/components/TvPairingModal.tsx:188:23` - `Type '(el: HTMLInputElement) => HTMLInputElement' is not assignable to type 'Ref<HTMLInputElement>'` (React 19 ref assignment return typing).
  5. `src/components/VideoPlayer.tsx:1468:18` - `Cannot find name 'channel'. Did you mean 'channels'?`
- **Mitigation Recommendation:**
  Update `Channel` type to include optional `currentProgram?: string; epgDescription?: string;` or resolve them from EPG store; update ref callback in `TvPairingModal.tsx` to return void; pass `currentPlayingChannel` into `AiProgramContextPanel` in `VideoPlayer.tsx`.

---

### REL-03: Foreign Key Constraint Violation in `POST /api/epg`
- **Severity:** **HIGH**
- **Location:** [`packages/db/src/schema.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/db/src/schema.ts) line 83:  
  `playlistId: text('playlist_id').references(() => playlists.playlistId, { onDelete: 'cascade' }).notNull()`
- **Evidence:** [`src/components/MobileEpg.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/MobileEpg.tsx) line 24 submits `playlistId: 'default_playlist'`. When Neon PostgreSQL evaluates the foreign key against `playlists.playlist_id`, the insert fails with a foreign key constraint violation. Furthermore, `apps/api/src/server.ts` expects top-level `urls` and `refreshIntervalHours` in `req.body`, whereas `MobileEpg.tsx` passes `{ sourceConfig: { urls, refreshIntervalHours } }`.
- **Mitigation Recommendation:**
  Normalize request body parsing in `/api/epg` to accept both formats and require a valid, existing `playlistId` or allow nullable foreign key for global standalone EPG feeds.

---

### REL-04: Disconnected Client-Side Mocking in Primary Workflow
- **Severity:** **HIGH**
- **Evidence:**
  - `DesktopM3uUpload.tsx` lines 310–340 uses `setTimeout` to fake probing of dead streams instead of triggering `/api/playlists/:id/validate` or `/api/stream/probe/batch`.
  - `DesktopApkBuilder.tsx` lines 127–150 uses `setInterval` to fake compilation progress up to 100% and displays a hardcoded Expo artifact URL instead of polling `/api/builds/:id`.
- **Impact:** The core value proposition of the SaaS platform (automated dead link pruning and custom white-label Android APK distribution) does not function end-to-end in the UI despite full backend support.
- **Mitigation Recommendation:**
  Wire the UI buttons directly to the backend asynchronous endpoints and implement status polling with real progress indicators.

---

### REL-05: Worker Queue Architecture & Memory Scalability
- **Severity:** **MEDIUM**
- **Location:** [`apps/worker/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/src/index.ts)
- **Observations:**
  - The worker uses an in-process continuous `while (isRunning)` polling loop with a 3000ms delay. While PostgreSQL `FOR UPDATE SKIP LOCKED` prevents race conditions between multiple worker replicas, polling creates constant database load during idle periods.
  - In `processPlaylistClean` and `processEpgJob`, entire M3U and XMLTV files are downloaded into single in-memory Node.js buffers/strings (`fileBuffer.toString('utf-8')`). Large IPTV playlists (50,000+ channels) or full national XMLTV files (200MB+) can exhaust Node heap memory (`FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`).
- **Mitigation Recommendation:**
  Transition file parsing in the worker from in-memory string splitting (`split('\n')`) to streaming readline pipelines (`readline.createInterface`). For queue distribution, consider Redis BullMQ or GCP Cloud Tasks for push-based execution.

---

### REL-06: Framework Version Skew (Web React 19 vs Mobile React 18)
- **Severity:** **MEDIUM**
- **Location:** Root [`package.json`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/package.json) (`react: "^19.0.1"`) vs [`mobile/package.json`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile/package.json) (`react: "^18.2.0"`).
- **Impact:** React Native 0.74 and Expo SDK 51 do not yet officially support React 19. Attempting to share components directly between `src/components` and `mobile/src/components` leads to JSX runtime typing conflicts (such as the React 19 ref typing issue discovered in `TvPairingModal.tsx`).
- **Mitigation Recommendation:**
  Keep `mobile` as an isolated package workspace with dedicated peer dependencies, and extract only pure business logic / utilities (parsers, formatters, type contracts) into shared `@iptv-menu/*` packages.
