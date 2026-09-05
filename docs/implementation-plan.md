# Full Platform Roadmap Implementation Plan: Options 1 to 5

This implementation plan executes all five requested capability enhancements sequentially, turning IPTV.menu into a fully automated, revenue-ready IPTV distribution and app management platform.

---

## User Review Required

> [!IMPORTANT]
> - **EAS Process Cleanup**: There is currently a hung background process (`eas build --platform all`) launched from `/Volumes/MacAI/ABGlobalCEO` instead of the `mobile/` directory. We will terminate this hung process and run `npm run build:apk` inside `mobile/` in non-interactive mode.
> - **Stripe Webhook Secret**: Stripe webhooks require a raw request body buffer before body parsing middleware. We will mount `/api/billing/webhook` with `express.raw({ type: 'application/json' })` so signature verification succeeds.

---

## Execution Sequence

### Phase 1: Build Updated `.apk` with Dynamic OTA Engine (Option 1)
- Terminate the hung EAS build process running outside the workspace.
- Navigate to [`mobile/`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile).
- Launch `npm run build:apk` (`eas build --platform android --profile preview --non-interactive`).
- Monitor build status using `npx eas-cli build:list` and retrieve the downloadable `.apk` URL with the Dynamic OTA client pre-installed.

---

### Phase 2: Deploy & Configure Background Worker (`apps/worker`) (Option 2)
- **Containerization Fix**: Update [`apps/worker/Dockerfile`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/Dockerfile) to build all packages using `npm run build:packages && npm --workspace=iptv-worker run build`, ensuring all TypeScript dependencies and compiled dist artifacts are copied into the runner stage.
- **Worker Optimization**: Refactor [`apps/worker/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/src/index.ts):
  - Clean up redundant imports and ensure proper singleton repositories (`playlistRepo`, `buildRepo`, `epgRepo`).
  - Add robust graceful shutdown handlers (`SIGTERM`, `SIGINT`) for Docker/Cloud Run deployment.
  - Implement task polling with exponential backoff on idle queues.

---

### Phase 3: Automated Stream Health Monitor & Channel Validator (Option 3)
- **Stream Prober Engine**: Enhance `processPlaylistValidate` in [`apps/worker/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/src/index.ts):
  - Concurrency pool (batch probing 10 streams simultaneously via `p-limit` or chunked promises).
  - Send lightweight `HEAD` request with fallback to streaming `GET` with abort controller (to catch providers blocking HEAD).
  - Verify HLS manifest headers (`Content-Type: application/vnd.apple.mpegurl` or `application/x-mpegurl`).
  - Calculate channel latency, online/offline status, and dead stream counts.
- **Auto-Cleaner Option**: When validating, automatically generate a pruned M3U file with dead links stripped, saving the clean output to storage and updating the playlist record.

---

### Phase 4: Stripe Billing Webhooks & Workspace Entitlement Sync (Option 4)
- **Webhook Endpoint**: In [`apps/api/src/server.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts), mount `POST /api/billing/webhook` with `express.raw({ type: 'application/json' })`.
- **Event Lifecycle Handlers**:
  - `checkout.session.completed`: Detect subscription plan (`pro` vs `builder`), find associated workspace, and upgrade plan status to `active`.
  - `customer.subscription.updated`: Update subscription status and adjust quotas:
    - **Free Tier**: 1 playlist, 0 hosted, 1 daily cleanup, 0 builds.
    - **Pro Tier ($9.99/mo)**: 10 playlists, 5 hosted, 20 daily cleanups, 2 builds, custom branding enabled.
    - **App Builder Tier ($29.99/mo)**: Unlimited playlists, 20 hosted, unlimited cleanups, 10 builds, white label enabled.
  - `customer.subscription.deleted`: Revert workspace to free tier.

---

### Phase 5: Browser Verification of the OTA Dashboard (Option 5)
- Verify that the local Vite dev server is active and accessible.
- Launch browser subagent to inspect the **"Remote Apps (OTA)"** view:
  - Verify layout, icons, glassmorphism cards, and responsiveness.
  - Test creating a new remote app configuration.
  - Verify that version bumps reflect on the live preview card.
  - Take a screenshot artifact to document visual correctness.

---

## Verification Plan

### Automated Verification
```bash
# 1. Monorepo and package integrity
npm run build:packages

# 2. Worker compilation
npm run build --workspace=iptv-worker

# 3. API server compilation
npm run build --workspace=iptv-api

# 4. Web client compilation
npm run build

# 5. Mobile client TypeScript checks
cd mobile && npx tsc --noEmit
```

### Functional Verification
- Check EAS CLI build status for Android `.apk`.
- Test Stripe webhook signature and mock event dispatch.
- Test stream validator on sample live HLS streams.
- Live DOM and screenshot verification of the Web Dashboard.
