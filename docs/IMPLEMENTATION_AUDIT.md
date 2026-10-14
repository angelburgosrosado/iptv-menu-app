# IPTV.MENU — Implementation Audit & Architecture Review

**Target Repository:** `angelburgosrosado/iptv-menu-app`  
**Date of Audit:** October 14, 2026  
**Auditor Roles:** Principal Engineer, Security Reviewer, QA Lead, Product Architect  
**Evaluation Standard:** VERIFIED (tested & passing), PARTIAL (code present but incomplete/unreachable), PLANNED (schema/docs only), NOT FOUND (absent).

---

## 1. Executive Summary

This audit represents a comprehensive, code-level and test-backed investigation of the `angelburgosrosado/iptv-menu-app` repository. The codebase implements a modern Web/Mobile IPTV streaming platform, multi-tenant workspace manager, and white-label Android APK generation suite.

### Key Findings
1. **Primary Workflow Status (Import -> Parse -> Persist -> Validate -> Review Health -> Attach EPG -> Build APK -> Download Artifact):**  
   The primary workflow is currently **PARTIALLY IMPLEMENTED (FRAGMENTED)**. While robust backend APIs and worker jobs exist for parsing, validation probing, EPG generation, and EAS build dispatch, the client-side UI (`DesktopM3uUpload.tsx` and `DesktopApkBuilder.tsx`) currently employs **client-side simulations (`setTimeout`) and hardcoded artifact URLs** rather than connecting to and polling the asynchronous backend job queue.
2. **Test Suite Status:**  
   The repository contains **248 automated tests across 22 test suites**. When executed with `NODE_ENV=test`, **all 248 tests pass (100% pass rate)**. However, executing `npm test` without an explicit `NODE_ENV=test` environment fails due to `.env` declaring `NODE_ENV=development`, which causes `apps/api/src/server.ts` to disable test authentication mocks and localhost stream proxying.
3. **TypeScript Typecheck Status (`npm run lint`):**  
   All monorepo packages (`@iptv-menu/*`), `apps/api`, and `apps/worker` compile cleanly with zero TypeScript errors. However, the root web frontend (`src/`) contains **5 compiler errors in 3 files** (`AiProgramContextPanel.tsx`, `TvPairingModal.tsx`, `VideoPlayer.tsx`), which blocks strict typechecking.
4. **Active Credentials & Secrets:**  
   A live Stripe restricted key (`STRIPE_SECRET_KEY=rk_live_...`), webhook secret, live Neon database connection string, and JWT secret exist in the uncommitted `.env` file on disk. Immediate secret rotation and environment isolation are required.

---

## 2. Application Entry Points & Stack Architecture

### 2.1 Web Front-End
- **Entry Points:** [`index.html`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/index.html) -> [`src/main.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/main.tsx) -> [`src/App.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/App.tsx)
- **Stack:**
  - **Framework:** React 19.0.1 (`react`, `react-dom`)
  - **Build Tool:** Vite 6.2.3 with `@vitejs/plugin-react` 5.0.4
  - **Styling:** Tailwind CSS 4.1.14 (`@tailwindcss/vite`), Vanilla CSS design tokens (`src/index.css`)
  - **State Management:** Zustand 5.0.14 (`src/store/usePlayerStore.ts`, `src/store/useWorkspaceStore.ts`, `src/authStore.ts`)
  - **Animations:** Motion 12.23.24 (`motion/react`)
  - **Icons:** Lucide React 0.546.0
  - **Video Streaming Engines:** `hls.js` 1.7.3 (HTTP Live Streaming), `mpegts.js` 1.8.2 (MPEG-TS over HTTP/WebSocket)
  - **Routing:** Lightweight browser history popstate pushState router inside `App.tsx` with lazy-loaded route pages (`/builder`, `/pricing`, `/admin`, `/`).

### 2.2 API Server
- **Entry Points:**
  - Standalone Node.js: [`apps/api/src/server.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts) (runs on `PORT 3001` or direct invocation)
  - Vercel Serverless Function: [`api/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/api/index.ts) requiring bundled CommonJS output [`api/server.cjs`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/api/server.cjs)
- **Stack:**
  - **HTTP Engine:** Express 4.21.2 with `cors` 2.8.5 and `body-parser` 1.20.2
  - **Bundler:** esbuild 0.25.0 (compiles `apps/api/src/server.ts` to `api/server.cjs` targeting Node 20)
  - **Deployment Target:** Vercel Serverless Functions (configured via [`vercel.json`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/vercel.json)) or Google Cloud Run / Container via [`apps/api/Dockerfile`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/Dockerfile)

### 2.3 Background Async Worker
- **Entry Point:** [`apps/worker/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/src/index.ts)
- **Stack:**
  - Node.js long-running daemon with `SIGINT` / `SIGTERM` graceful shutdown listeners
  - Axios 1.6.0 for network stream probing, XMLTV guide fetching, and EAS build triggering
  - Queue pollers with PostgreSQL row-level locking (`FOR UPDATE SKIP LOCKED`) and Firestore transaction fallbacks
  - Deployment: Render background worker (`render.yaml`) or Docker container (`apps/worker/Dockerfile`)

### 2.4 Mobile App (Expo / React Native)
- **Entry Points:** [`mobile/app/_layout.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile/app/_layout.tsx) -> [`mobile/app/index.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile/app/index.tsx)
- **Stack:**
  - **Framework:** Expo SDK 51 (`expo: "~51.0.0"`) with Expo Router 3.5.24
  - **Runtime:** React Native 0.74.5, React 18.2.0, Hermes engine
  - **Media Engine:** `expo-video` 1.1.0 with background playback and native Picture-in-Picture support
  - **Storage:** `react-native-mmkv` 2.12.2 and `expo-secure-store` 13.0.2 for credential encryption
  - **TV Support:** `mobile/plugins/withTvSupport.js` config plugin injecting Leanback TV intent filters, banner metadata, and DPAD focus borders

### 2.5 Desktop App (Electron)
- **Entry Point:** [`electron/main.cjs`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/electron/main.cjs)
- **Stack:** Electron 44.6.0 wrapping the Vite dev server (`http://localhost:5173`) or packaged `dist/index.html`

---

## 3. Monorepo & Workspace Architecture

The repository is organized as an npm workspaces monorepo:
```
iptv-menu-app/
├── api/                       # Vercel serverless gateway wrapper
│   ├── index.ts               # Serverless handler delegating to server.cjs
│   └── server.cjs             # Bundled standalone API output (esbuild)
├── apps/
│   ├── api/                   # Core Express REST API microservice
│   └── worker/                # Background async processing daemon
├── packages/
│   ├── auth/                  # JWT HS256, scrypt hashing, Firebase Admin verification
│   ├── billing/               # Stripe checkout, portal, and webhook handlers
│   ├── config/                # Central environment variable schema & loader
│   ├── db/                    # Drizzle ORM (Neon PostgreSQL) + Firestore hybrid repositories
│   ├── jobs/                  # Queue dispatchers, row-lock polling, EAS build client
│   ├── logging/               # Structured JSON logger
│   ├── storage/               # Google Cloud Storage + Vercel Blob dual driver
│   ├── types/                 # Universal TypeScript definitions & contracts
│   └── ui/                    # Shared UI primitives
├── mobile/                    # Standalone Expo React Native application
├── electron/                  # Electron desktop wrapper
├── src/                       # Vite Web client application
├── tests/                     # 22 Vitest test suites (248 tests)
├── docs/                      # Architectural specs, runbooks, plans
├── infra/                     # Firestore rules, indexes, storage CORS, Cloud Run scripts
└── scripts/                   # IPTV data aggregation and maintenance scripts
```

### Monorepo Workspaces & Package Responsibilities
| Workspace / Package | Directory | Role / Responsibilities | Build Output |
|---|---|---|---|
| `react-example` (Root) | `/` | Web SPA, Vercel router, npm script orchestrator | `dist/` |
| `iptv-api` | `apps/api` | Express REST API server, endpoints, services, middleware | `apps/api/dist/` |
| `iptv-worker` | `apps/worker` | Background task worker loop for playlist clean, probe, EPG, EAS | `apps/worker/dist/` |
| `@iptv-menu/types` | `packages/types` | Core data models (`Channel`, `Playlist`, `Workspace`, etc.) | `packages/types/dist/` |
| `@iptv-menu/config` | `packages/config` | Environment config parser with default fallbacks | `packages/config/dist/` |
| `@iptv-menu/logging` | `packages/logging` | Production-ready structured logger with severity mapping | `packages/logging/dist/` |
| `@iptv-menu/auth` | `packages/auth` | HMAC-SHA256 JWT sign/verify, scrypt hash, auth middlewares | `packages/auth/dist/` |
| `@iptv-menu/db` | `packages/db` | Neon Serverless PostgreSQL Drizzle client + Firestore fallback repos | `packages/db/dist/` |
| `@iptv-menu/storage`| `packages/storage`| GCS signed URLs + Vercel Blob upload/download/deletion | `packages/storage/dist/` |
| `@iptv-menu/billing`| `packages/billing`| Stripe customer lookup, checkout session, webhook signature | `packages/billing/dist/` |
| `@iptv-menu/jobs`   | `packages/jobs`   | Job dispatching, `FOR UPDATE SKIP LOCKED` pollers, EAS client | `packages/jobs/dist/` |
| `@iptv-menu/ui`     | `packages/ui`     | Shared UI design components | `packages/ui/dist/` |
| `personal-iptv-mobile`| `mobile`        | React Native Expo mobile & Android TV application | Android APK/AAB |

---

## 4. Route, API, and Integration Inventory

### 4.1 Public & Unauthenticated Endpoints
| Endpoint | Method | Status | Implemented Logic | Gaps / Risk Notes |
|---|---|---|---|---|
| `/api/health` | `GET` | **VERIFIED** | Returns service status, timestamp, environment | None |
| `/api/public/adsense` | `GET` | **VERIFIED** | Returns public Google AdSense client ID and slot configs | Backed by `data/adsense_config.json` |
| `/api/public/pricing` | `GET` | **VERIFIED** | Returns plans (Free, Pro, App Builder Suite) | Static response in handler |
| `/api/public/devices` | `GET` | **VERIFIED** | Returns list of certified hardware (Shield, Firestick, etc.) | Static response in handler |
| `/api/public/contact` | `POST` | **VERIFIED** | Logs contact inquiries and returns success | Inquiries only logged to stdout |
| `/api/public/auth/register` | `POST` | **VERIFIED** | Hashes password with scrypt salt, persists user, generates JWT | No rate limiting on registration |
| `/api/public/auth/login` | `POST` | **VERIFIED** | Verifies scrypt password hash, returns user and JWT | No rate limiting / brute-force protection |
| `/api/v1/apps/:appId/config` | `GET` | **VERIFIED** | Returns remote dynamic theme, playlistUrl, epgUrl, announcement | Cache-Control: max-age=60 |
| `/api/public/pair/generate` | `POST` | **VERIFIED** | Generates 6-digit TV pairing code with 10-minute expiry | In-memory `Map` (lost on serverless restart) |
| `/api/public/pair/status/:code` | `GET` | **VERIFIED** | Polls rendezvous state of pairing code | In-memory `Map` (lost on serverless restart) |
| `/api/ai/program-context` | `POST` | **PARTIAL** | Calls Google GenAI SDK (Gemini) for show overview, trivia, cast | Unauthenticated; relies on `GEMINI_API_KEY` |
| `/api/stream/proxy` | `GET, HEAD, OPTIONS` | **VERIFIED** | Proxies stream chunks, rewrites M3U8 manifests, enforces SSRF rules | Memory streaming; wide-open CORS |
| `/api/stream/probe` | `GET` | **VERIFIED** | Probes single stream URL with HEAD/range GET, returns latency | SSRF protection enforced |
| `/api/stream/probe/batch` | `POST` | **VERIFIED** | Concurrently probes up to 25 streams in batches | SSRF protection enforced |
| `/api/channels/enrich` | `POST` | **VERIFIED** | Enriches channels with iptv-org genre, country, language | In-memory dataset joins |
| `/api/channels/metadata/stats`| `GET` | **VERIFIED** | Returns channel, country, language, category counts | Dynamic stats from dataset |
| `/api/channels/logo` | `GET` | **VERIFIED** | Proxies remote logos or generates SVG avatar fallback | SSRF protection enforced |
| `/api/channels/avatar` | `GET` | **VERIFIED** | Generates SVG letter avatar for channel names | Generates dynamic SVG |
| `/api/export/playlist.m3u` | `POST` | **VERIFIED** | Generates downloadable `#EXTM3U` attachment | Returns `audio/x-mpegurl` |
| `/api/xtream/epg` | `GET` | **VERIFIED** | Proxies Xtream Codes `xmltv.php` or `get_short_epg` | SSRF protection enforced |
| `/api/stalker/portal` | `GET` | **VERIFIED** | Proxies Stalker Middleware portal requests | SSRF protection enforced |
| `/api/epg/live` | `GET, POST` | **VERIFIED** | Returns current and next program for requested channel IDs | Slices in-memory ingested XMLTV feed |
| `/api/epg/schedule/:channelId`| `GET` | **VERIFIED** | Returns 24h schedule for given channel ID | Slices in-memory ingested XMLTV feed |

### 4.2 Authenticated User Endpoints (`authenticateFirebaseToken`)
| Endpoint | Method | Status | Implemented Logic | Gaps / Risk Notes |
|---|---|---|---|---|
| `/api/pair/claim` | `POST` | **VERIFIED** | Authorizes pending TV pair code with user's JWT credentials | In-memory code map |
| `/api/me` | `GET` | **VERIFIED** | Fetches user profile from database | Returns UserProfile record |
| `/api/me/profile` | `PATCH` | **VERIFIED** | Updates displayName and photoURL | Persists to DB |
| `/api/me/subscription` | `GET` | **VERIFIED** | Returns user subscription tier and workspace entitlements | Checks active workspace |
| `/api/playlists` | `GET` | **VERIFIED** | Lists playlists owned by authenticated user | Multi-tenant filtered |
| `/api/playlists` | `POST` | **VERIFIED** | Creates playlist record and returns signed upload URL | Enforces `maxPlaylists` quota |
| `/api/playlists/:id` | `GET` | **VERIFIED** | Fetches single playlist metadata | Owner validation |
| `/api/playlists/:id` | `DELETE` | **VERIFIED** | Deletes playlist record and associated storage files | Cascades runs in DB |
| `/api/playlists/:id/parse` | `POST` | **VERIFIED** | Dispatches `parse` background job to queue | Queues row in `playlist_runs` |
| `/api/playlists/:id/clean` | `POST` | **VERIFIED** | Dispatches `clean` background job to queue | Enforces `maxDailyCleanups` quota |
| `/api/playlists/:id/validate` | `POST` | **VERIFIED** | Dispatches `validate` background job to queue | Queues row in `playlist_runs` |
| `/api/playlists/:id/runs` | `GET` | **VERIFIED** | Lists all processing runs and results for playlist | Slices run summaries |
| `/api/epg` | `GET` | **VERIFIED** | Lists user EPG feeds | Returns feeds |
| `/api/epg` | `POST` | **PARTIAL** | Creates EPG feed and dispatches generation job | **Foreign key defect**: requires valid playlistId |
| `/api/epg/:id` | `GET` | **VERIFIED** | Fetches single EPG feed document | Validates ownership |
| `/api/epg/sync` | `POST` | **VERIFIED** | Pulls and parses upstream XMLTV guides into cache | Long-running network fetch |
| `/api/workspaces` | `GET` | **VERIFIED** | Lists user workspaces with entitlements | Slices workspaces |
| `/api/workspaces` | `POST` | **VERIFIED** | Creates new workspace | Initializes default quotas |
| `/api/workspaces/:id` | `GET` | **VERIFIED** | Fetches single workspace with usage counters | Membership validated |
| `/api/builds` | `GET` | **VERIFIED** | Lists user Android build requests | Slices builds |
| `/api/builds` | `POST` | **VERIFIED** | Creates build request and dispatches EAS job | Enforces `maxMonthlyBuilds` quota |
| `/api/builds/:id` | `GET` | **VERIFIED** | Fetches single build request status and artifact URL | Validates ownership |
| `/api/apps` | `GET` | **VERIFIED** | Lists dynamic app configurations in workspace | Slices appConfigs |
| `/api/apps` | `POST` | **VERIFIED** | Creates new remote OTA app configuration | Auto-generates unique slug |
| `/api/apps/:id` | `GET, PUT, DELETE`| **VERIFIED** | Manages remote OTA app config by ID | Validates workspace match |
| `/api/billing/create-checkout-session`| `POST` | **VERIFIED** | Creates Stripe Checkout Session for subscription/lifetime | Checks customer, resolves price ID |
| `/api/billing/create-portal-session`  | `POST` | **VERIFIED** | Creates Stripe Billing Portal session | Directs user to manage subscription |

### 4.3 Webhooks & Internal Endpoints
| Endpoint | Method | Status | Implemented Logic | Gaps / Risk Notes |
|---|---|---|---|---|
| `/api/webhooks/stripe` | `POST` | **VERIFIED** | Verifies HMAC signature; handles `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_succeeded` | Live webhook secret configured |
| `/api/billing/webhook` | `POST` | **VERIFIED** | Alias to `/api/webhooks/stripe` | Identical handler |
| `/api/internal/jobs/playlist-clean` | `POST` | **PLANNED** | Stub for GCP Cloud Scheduler queue trigger | Returns dummy `{ processed: 0 }` |
| `/api/internal/jobs/playlist-validate` | `POST` | **PLANNED** | Stub for GCP Cloud Scheduler queue trigger | Returns dummy `{ processed: 0 }` |

### 4.4 Administrator Endpoints (`adminGuard`: `authenticateFirebaseToken` + `role === 'admin'`)
| Endpoint | Method | Status | Implemented Logic | Gaps / Risk Notes |
|---|---|---|---|---|
| `/api/admin/metrics` | `GET` | **VERIFIED** | Telemetry: user counts, build stats, memory, DB latency | Probes DB with `SELECT 1` |
| `/api/admin/users` | `GET` | **VERIFIED** | Lists all registered platform users | Paginated up to 500 |
| `/api/admin/users/:id` | `GET` | **VERIFIED** | Fetches detailed user profile | Returns UserProfile |
| `/api/admin/users/:id/role` | `PATCH` | **VERIFIED** | Promotes/demotes user role; writes to `admin_actions` audit log | Propagates to Firebase Admin claims |
| `/api/admin/users/:id/status` | `PATCH` | **VERIFIED** | Suspends/activates user account; revokes tokens | Audited in `admin_actions` |
| `/api/admin/playlists` | `GET` | **VERIFIED** | Lists all system playlists across all tenants | Unbounded list |
| `/api/admin/workspaces` | `GET` | **VERIFIED** | Lists all workspaces across tenants | Up to 200 items |
| `/api/admin/workspaces/:id/quota` | `PATCH`| **VERIFIED** | Modifies workspace entitlements, plan, usage | Audited in `admin_actions` |
| `/api/admin/jobs` | `GET` | **VERIFIED** | Lists recent build requests | Up to 50 items |
| `/api/admin/jobs/:jobType/:jobId/retry` | `POST`| **VERIFIED** | Resets failed build job to `queued` status | Audited in `admin_actions` |
| `/api/admin/audit-logs` | `GET` | **VERIFIED** | Lists audit records from `admin_actions` table | Paginated up to 50 |
| `/api/admin/adsense` | `GET, PUT` | **VERIFIED** | Views and updates AdSense publisher ID and slot allocations | Persists to `data/adsense_config.json` |

---

## 5. Primary Intended Workflow: Gap Analysis

The intended end-to-end user workflow was evaluated against the implementation:

$$\text{Import M3U/M3U8} \longrightarrow \text{Parse} \longrightarrow \text{Persist} \longrightarrow \text{Validate/Probe} \longrightarrow \text{Review Health} \longrightarrow \text{Attach EPG} \longrightarrow \text{Initiate APK Build} \longrightarrow \text{Download Artifact}$$

### Step-by-Step Status & Evidence

#### Step 1: Import M3U/M3U8
- **Status:** **VERIFIED**
- **Implementation:** [`src/components/DesktopM3uUpload.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/DesktopM3uUpload.tsx) supports drag-and-drop file upload, file browsing (`input type="file"`), remote URL paste, and 7 quick FAST presets (Pluto TV, Samsung TV Plus, PBS).

#### Step 2: Parse
- **Status:** **VERIFIED (DUAL IMPLEMENTATION)**
- **Client-Side:** [`src/utils/m3uParser.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/utils/m3uParser.ts) parses `#EXTINF` directives, attributes (`tvg-id`, `tvg-name`, `tvg-logo`, `group-title`), and stream URLs in browser memory.
- **Backend/Worker:** [`apps/worker/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/src/index.ts) (`processPlaylistClean`) executes deduplication on `#EXTINF` chunks when triggered via `POST /api/playlists/:id/parse`.

#### Step 3: Persist
- **Status:** **PARTIAL**
- **Backend:** `POST /api/playlists` persists the playlist metadata in `playlists` table in PostgreSQL / Firestore and issues a signed GCS / Vercel Blob upload URL.
- **Client Gap:** While `processFileUpload()` in `DesktopM3uUpload.tsx` lines 245–268 calls `POST /api/playlists` and uploads the file to the signed URL if logged in, entering a remote URL via `handleUrlSync()` (lines 117–135) only saves to browser memory (`usePlayerStore`) and localStorage; it does **not persist to the backend `playlists` database**.

#### Step 4: Validate / Probe
- **Status:** **PARTIAL (DISCONNECTED)**
- **Backend:** `POST /api/playlists/:id/validate` dispatches a job to the worker queue. The worker executes `processPlaylistValidate()` in batches of 10 with HTTP HEAD and byte-range fallback probes, computes average latency, strips dead streams, and saves a validated M3U back to storage.
- **Client Gap:** `DesktopM3uUpload.tsx` line 310 (`handleAutoCleanDeadStreams`) **completely mocks validation** using client `setTimeout` delays (600ms, 700ms, 400ms) and checks string patterns (`c.url.includes('invalid')`). It **never invokes `POST /api/playlists/:id/validate` or `/api/stream/probe/batch`**.

#### Step 5: Review Playlist Health
- **Status:** **PARTIAL**
- **Diagnostics HUD:** [`src/components/DiagnosticsHUD.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/DiagnosticsHUD.tsx) renders ping, bitrate, and resolution for the *active playing stream*.
- **Playlist Health Overview:** There is no dedicated health review screen in `DesktopM3uUpload.tsx` or `DesktopChannels.tsx` displaying the aggregate probe summary (`channelsTested`, `deadStreamsDetected`, `healthyStreamsCount`, `avgLatencyMs`) returned by `playlist_runs`.

#### Step 6: Attach EPG
- **Status:** **PARTIAL**
- **Backend:** `POST /api/epg` creates an EPG feed and enqueues worker aggregation.
- **Defects:**
  - `apps/api/src/server.ts` expects top-level `urls` and `refreshIntervalHours` in `req.body`, while `MobileEpg.tsx` sends a nested `sourceConfig` object.
  - Foreign key constraint in `packages/db/src/schema.ts` (`playlistId references playlists.playlistId`) causes PostgreSQL to reject `'default_playlist'`.
  - `DesktopEpg.tsx` operates exclusively on in-memory channels and overrides; it does not contain a UI action to attach or persist an EPG feed to a stored playlist.

#### Step 7: Initiate Android APK Build
- **Status:** **PARTIAL (SIMULATED UI)**
- **Backend & Worker:** `POST /api/builds` records the build request and enqueues it. The worker calls `triggerEasAndroidBuild()` in `packages/jobs/src/easBuildClient.ts`.
- **Client Gap:** [`src/components/DesktopApkBuilder.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/DesktopApkBuilder.tsx) lines 127–150 fires `POST /api/builds` inside a swallowed `.catch(() => null)`, then runs a client-side `setInterval` timer simulating build steps and finishes with a hardcoded Expo artifact URL (`https://expo.dev/artifacts/eas/dEaxtp1LoGphYwP6ntPVI1BJmHi_45_UiRZ4Tj8CKXw.apk`).

#### Step 8: Download Artifact
- **Status:** **PARTIAL**
- **Client:** The download button in `DesktopApkBuilder.tsx` opens the hardcoded Expo demo URL or simulated GCS bucket path, rather than polling `GET /api/builds/:buildId` to retrieve the real build status and signed download URL.

---

## 6. Database Schema & Storage Analysis

### 6.1 Database Schema (Drizzle ORM / Neon PostgreSQL)
Defined in [`packages/db/src/schema.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/db/src/schema.ts):
1. `users`: `uid` (PK), `email`, `display_name`, `photo_url`, `role` (user/admin), `account_status` (active/suspended), `subscription_tier` (free/pro/builder), `password_hash`, timestamps.
2. `workspaces`: `workspace_id` (PK), `name`, `owner_uid` (FK users), `plan`, `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`, `entitlements` (jsonb), `usage` (jsonb), timestamps.
3. `playlists`: `playlist_id` (PK), `uid` (FK users), `name`, `source_type` (url/upload), `original_file_path`, `cleaned_file_path`, `channel_count`, `status`, `visibility`, timestamps.
4. `playlist_runs`: `run_id` (PK), `playlist_id` (FK playlists), `type` (clean/validate), `status` (queued/running/completed/failed), `started_at`, `completed_at`, `summary` (jsonb), `error`.
5. `epg_feeds`: `epg_id` (PK), `uid` (FK users), `playlist_id` (FK playlists), `status` (pending/generating/ready/failed), `source_config` (jsonb), `output_file_path`, `created_at`, `last_generated_at`.
6. `build_requests`: `build_id` (PK), `uid` (FK users), `app_name`, `brand_config` (jsonb), `playlist_source` (jsonb), `status` (queued/building/succeeded/failed), `artifact_path`, `build_log_path`, `app_config_id`, timestamps.
7. `admin_actions`: `action_id` (PK), `admin_uid`, `action_type`, `target_type`, `target_id`, `notes`, `created_at`.
8. `app_configs`: `app_id` (PK), `workspace_id` (FK workspaces), `owner_uid` (FK users), `name`, `slug`, `theme` (jsonb), `playlist_url`, `epg_url`, `announcement`, `version`, `active`, timestamps.

### 6.2 Dual-Backend Storage Architecture
Implemented in [`packages/storage/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/storage/src/index.ts) and [`packages/storage/src/blob.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/storage/src/blob.ts):
- **Vercel Blob Driver:** If `BLOB_READ_WRITE_TOKEN` is set, calls `@vercel/blob` (`put`, `del`, `fetch`). Files are public URLs.
- **Google Cloud Storage (GCS) Driver:** If `BLOB_READ_WRITE_TOKEN` is absent, uses `@google-cloud/storage`. Generates v4 signed URLs for uploads/downloads.
- **Risk:** If neither `BLOB_READ_WRITE_TOKEN` nor valid GCP credentials are provided, `getStorageClient()` falls back to a warning and returns unauthenticated storage instances that fail on I/O.
