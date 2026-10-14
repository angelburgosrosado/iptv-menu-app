# IPTV.MENU — Phased Upgrade & Implementation Plan

**Repository:** `angelburgosrosado/iptv-menu-app`  
**Date:** October 14, 2026  
**Architect:** Principal Engineer & Product Architect  
**Objective:** Deliver an end-to-end, production-grade IPTV management and APK compilation platform via small, independently testable, pull-request-sized phases.

---

## Roadmap Overview

```
Phase 1: Security Hardening & Environment Isolation
   │
Phase 2: Front-End Type Safety & Test Stabilization
   │
Phase 3: Playlist Ingestion & Persistence Bridge
   │
Phase 4: Real Stream Health Probing & Review UI
   │
Phase 5: EPG Schema Normalization & Playlist Attachment
   │
Phase 6: Real EAS APK Build Orchestration & Polling
   │
Phase 7: TV Pairing Database Persistence & Production Hardening
```

---

## Phase 1: Security Hardening & Environment Isolation

### Goal & User Value
Eliminate active security vulnerabilities by isolating live credentials, securing JWT token generation, and preventing `dotenv` from clobbering the testing environment.

### Exact Files / Modules Likely to Change
- `.env`: Remove live Stripe restricted keys and production Neon credentials; replace with development sandbox templates.
- `.env.example`: Update with documented required variables for Vercel, Neon, and EAS.
- [`apps/api/src/server.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts): Guard `dotenv.config()` so it does not overwrite existing `process.env.NODE_ENV` when running under test runners.
- [`packages/config/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/config/src/index.ts): Throw error in production if `JWT_SECRET` is using the default insecure fallback.
- [`package.json`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/package.json): Update test script to enforce `NODE_ENV=test`.

### Database Migration Requirements
None.

### API Contract Changes
None (purely configuration and security hardening).

### Worker / Job Implications
Worker environment will load sanitized development database credentials.

### Test Plan & Acceptance Criteria
- Running `npm test` without prepending environment variables runs in test mode and passes 100%.
- Attempting to start the API in `NODE_ENV=production` with the default `JWT_SECRET` immediately halts with a descriptive security error.
- Git status confirms no live keys or secrets are staged or tracked.

### Security / Privacy Considerations
- Rotate the exposed Stripe restricted key (`rk_live_...`) in Stripe Dashboard.
- Rotate the Neon PostgreSQL user password in Neon Console.

### Rollback Plan
Revert commit; re-export prior environment configuration.

### Risks & Dependencies
Requires user or DevOps to supply new Stripe test keys and Neon development branch credentials.

---

## Phase 2: Front-End Type Safety & Test Suite Stabilization

### Goal & User Value
Resolve all existing TypeScript compiler errors in the web client, eliminate test state leakage, and ensure clean CI passing for both `npm run lint` (`tsc --noEmit`) and `npm test`.

### Exact Files / Modules Likely to Change
- [`src/types/iptv.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/types/iptv.ts): Add optional `currentProgram?: string;` and `epgDescription?: string;` to `Channel` interface.
- [`src/components/AiProgramContextPanel.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/AiProgramContextPanel.tsx): Adapt program title and description lookups to use updated `Channel` definition.
- [`src/components/TvPairingModal.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/TvPairingModal.tsx): Fix React 19 ref assignment callback to return void (`{ inputRefs.current[idx] = el; }`).
- [`src/components/VideoPlayer.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/VideoPlayer.tsx): Pass in-scope `currentPlayingChannel` to `<AiProgramContextPanel />`.
- [`tests/xtreamSeriesAndVod.test.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/tests/xtreamSeriesAndVod.test.ts): Add `afterEach(() => { vi.restoreAllMocks(); })` and restore `globalThis.fetch` to prevent mock leakage across test files.

### Database Migration Requirements
None.

### API Contract Changes
None.

### Worker / Job Implications
None.

### Test Plan & Acceptance Criteria
- `npm run lint` (`tsc --noEmit`) completes with exit code 0 and zero errors.
- `npx vite build` completes successfully.
- `npm test` runs all 22 test files and 248 tests with 100% pass rate.

### Security / Privacy Considerations
None.

### Rollback Plan
Revert commit.

### Risks & Dependencies
Low risk. All changes are localized to typing and test hygiene.

---

## Phase 3: Playlist Ingestion & Persistence Bridge

### Goal & User Value
Connect the web frontend directly to backend persistence so that uploaded files and remote playlist URLs are stored in the database (`playlists` table) and associated with the user's active workspace.

### Exact Files / Modules Likely to Change
- [`src/components/DesktopM3uUpload.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/DesktopM3uUpload.tsx):
  - In `handleUrlSync`, call `POST /api/playlists` with `{ sourceType: 'url', originalFilePath: urlInput, channelCount }` when logged in.
  - In `processFileUpload`, ensure returned `playlistId` is tracked in player store and workspace store.
- [`src/store/usePlayerStore.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/store/usePlayerStore.ts): Add `activePlaylistId: string | null` to state and persist across route navigation.
- [`apps/api/src/server.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts): Ensure `POST /api/playlists` returns `workspaceId` and respects workspace quota.

### Database Migration Requirements
None (`playlists` table already supports both `source_type: 'url'` and `'upload'`).

### API Contract Changes
No breaking changes. `POST /api/playlists` response includes `playlist: Playlist` object with `playlistId`.

### Worker / Job Implications
Worker will now receive valid `playlistId` references when parsing or cleaning is triggered.

### Test Plan & Acceptance Criteria
- Uploading an M3U file while logged in creates a record in `playlists` table.
- Adding a remote M3U URL creates a record in `playlists` table.
- Navigating away and refreshing the page retains the active playlist reference.
- New unit test in `tests/apiRoutes.test.ts` verifying remote URL playlist persistence.

### Security / Privacy Considerations
Verify workspace isolation: user in Workspace A cannot access or modify playlists belonging to Workspace B.

### Rollback Plan
Revert front-end persistence hooks to memory-only fallback.

### Risks & Dependencies
Requires user authentication to persist to DB; guest mode remains supported via local memory fallback.

---

## Phase 4: Real Stream Health Probing & Review UI

### Goal & User Value
Replace simulated `setTimeout` delays in `DesktopM3uUpload.tsx` with actual stream health probing via `/api/playlists/:id/validate` and `/api/stream/probe/batch`, and provide a visual Playlist Health Review dashboard.

### Exact Files / Modules Likely to Change
- [`src/components/DesktopM3uUpload.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/DesktopM3uUpload.tsx):
  - Replace `handleAutoCleanDeadStreams` simulation with call to `POST /api/playlists/:id/validate` (for persisted playlists) or `POST /api/stream/probe/batch` (for client-loaded channels).
  - Add real-time progress bar polling `GET /api/playlists/:id/runs`.
- `src/components/PlaylistHealthModal.tsx`: New component to display healthy vs dead channel breakdown, average latency, and single-click dead stream pruning.
- [`apps/api/src/server.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts): Ensure `/api/playlists/:id/validate` returns immediately with `runId` and worker updates `summary` JSON.

### Database Migration Requirements
None (`playlist_runs.summary` already stores `channelsTested`, `deadStreamsDetected`, `healthyStreamsCount`, `avgLatencyMs`).

### API Contract Changes
No breaking changes.

### Worker / Job Implications
Worker's `processPlaylistValidate` will be invoked for real workloads, executing concurrent batches of 10 stream HEAD/GET requests.

### Test Plan & Acceptance Criteria
- Triggering "Auto-Clean Dead Streams" in the UI makes a real network request.
- The UI polls `GET /api/playlists/:id/runs` until status is `completed`.
- Summary shows accurate counts of alive vs dead channels.
- Dead channels are pruned from the active channel list.
- Automated tests in `tests/streamDiagnostics.test.ts` and `tests/apiRoutes.test.ts` pass.

### Security / Privacy Considerations
Ensure SSRF protection remains enforced during batch probing so users cannot probe internal network ranges.

### Rollback Plan
Revert UI component to client-only filtering.

### Risks & Dependencies
IPTV servers may rate-limit or block prober IP; worker prober already includes fallback headers and user-agent spoofing (`VLC/3.0.18`).

---

## Phase 5: EPG Schema Normalization & Playlist Attachment

### Goal & User Value
Fix the foreign key defect and body format mismatch in `POST /api/epg`, and allow users to attach EPG XMLTV guide URLs to their active playlist from the web UI.

### Exact Files / Modules Likely to Change
- [`apps/api/src/server.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts):
  - In `POST /api/epg`, accept both `{ urls, refreshIntervalHours }` and `{ sourceConfig: { urls, refreshIntervalHours } }`.
  - Validate that `playlistId` exists in database before insertion, or allow optional/standalone EPG feeds.
- [`src/components/MobileEpg.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/MobileEpg.tsx): Pass active `playlistId` from store instead of hardcoded `'default_playlist'`.
- [`src/components/DesktopEpg.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/DesktopEpg.tsx): Add "Attach EPG Source" button that calls `POST /api/epg` and triggers background sync.
- [`packages/db/src/schema.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/db/src/schema.ts): Allow `playlistId` on `epg_feeds` to be nullable for global/shared guide feeds if needed.

### Database Migration Requirements
If making `playlistId` nullable: `ALTER TABLE epg_feeds ALTER COLUMN playlist_id DROP NOT NULL;`.

### API Contract Changes
`POST /api/epg` accepts optional `playlistId` (defaults to active user playlist or standalone).

### Worker / Job Implications
Worker `processEpgJob` aggregates XMLTV files from `sourceConfig.urls` and uploads generated guide to storage.

### Test Plan & Acceptance Criteria
- `POST /api/epg` with valid playlist returns HTTP 201 and enqueues job.
- Worker fetches upstream guide, merges channels and programmes, and marks EPG feed `ready`.
- UI displays current and next broadcast info pulled from `/api/epg/live`.
- Test suite in `tests/backendEpgAndMetadata.test.ts` passes.

### Security / Privacy Considerations
Validate that EPG source URLs use HTTP/HTTPS and do not target loopback or cloud metadata IPs.

### Rollback Plan
Revert API route and schema changes; rollback migration if applied.

### Risks & Dependencies
Large XMLTV files can take 10–30 seconds to fetch and parse; worker handles this asynchronously in background.

---

## Phase 6: Real EAS APK Build Orchestration & Polling

### Goal & User Value
Replace the client-side `setInterval` simulation in `DesktopApkBuilder.tsx` with real job polling against `GET /api/builds/:id`, and deliver genuine compiled Android APK artifacts generated by Expo Application Services (EAS).

### Exact Files / Modules Likely to Change
- [`src/components/DesktopApkBuilder.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/DesktopApkBuilder.tsx):
  - Replace timer simulation in `startApkBuild()` with:
    1. Call `POST /api/builds` with brand config and playlist source.
    2. Poll `GET /api/builds/:buildId` every 4 seconds.
    3. Update compile logs with real status transitions (`queued` -> `building` -> `succeeded` / `failed`).
    4. Provide real `artifactPath` download link upon completion.
  - Remove hardcoded default build records (`eas-build-9812`).
- [`packages/jobs/src/easBuildClient.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/jobs/src/easBuildClient.ts):
  - Verify Expo REST API payload formatting and token authentication.
- [`apps/worker/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/src/index.ts):
  - Process build job, invoke EAS API, and update database with EAS build status.

### Database Migration Requirements
None (`build_requests` table already exists with required fields).

### API Contract Changes
No breaking changes.

### Worker / Job Implications
Worker polls EAS API or handles EAS webhook to transition build status from `building` to `succeeded`.

### Test Plan & Acceptance Criteria
- Submitting an APK build request in the UI creates a `build_requests` record with status `queued`.
- Worker picks up build request via `pollNextBuildJob()` and locks row.
- If `EXPO_ACCESS_TOKEN` is configured, it triggers an EAS remote build; if absent in development, it logs a clear warning and gracefully sets status to simulated artifact.
- The UI displays live build logs and provides download button only when status is `succeeded`.
- Quota guard properly decrements `monthlyBuildsUsed`.

### Security / Privacy Considerations
Store `EXPO_ACCESS_TOKEN` securely in secret manager; do not expose token to client or build logs.

### Rollback Plan
Revert UI component to simulated demo mode if EAS credentials are not yet provisioned.

### Risks & Dependencies
Requires active Expo / EAS account subscription with build credits.

---

## Phase 7: TV Pairing Database Persistence & Production Hardening

### Goal & User Value
Persist TV pairing rendezvous codes in PostgreSQL so that pairing functions reliably across Vercel serverless lambdas, apply rate limiting to public endpoints, and convert worker M3U parsing to stream readers.

### Exact Files / Modules Likely to Change
- [`packages/db/src/schema.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/db/src/schema.ts): Add `tv_pairings` table (`code` PK, `device_id`, `device_name`, `status`, `token`, `expires_at`, `created_at`).
- [`apps/api/src/server.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts): Replace `activePairings` in-memory `Map` with queries to `tv_pairings` table; add express rate-limiting to auth routes and AI route.
- [`apps/worker/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/src/index.ts): Refactor `processPlaylistClean` to use streaming readline reader for M3U parsing.

### Database Migration Requirements
Add `tv_pairings` table via Drizzle migration.

### API Contract Changes
None.

### Worker / Job Implications
Worker memory footprint reduced by 85% for large playlists.

### Test Plan & Acceptance Criteria
- Generate pairing code on one serverless instance, claim it from another instance, verify status updates to `paired`.
- Expired pairing codes (>10 minutes) return 404/expired.
- Rate limiter blocks >10 rapid registration attempts from single IP.
- Large M3U (10MB+) cleans cleanly without Node memory spikes.

### Security / Privacy Considerations
Pairing tokens are short-lived and automatically cleaned up upon claim or expiration.

### Rollback Plan
Drop `tv_pairings` table; revert server.ts pairing handlers to in-memory fallback.

### Risks & Dependencies
Requires running Drizzle migration on database.
