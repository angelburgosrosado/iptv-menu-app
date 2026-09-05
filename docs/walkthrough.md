# Migration & Feature Walkthrough: APK Builds, Stripe Webhook & Vercel/Neon Migration

## 1. Overview of Accomplishments

This walkthrough summarizes the end-to-end implementation across three core initiatives:
1. **Functional APK Generation Pipeline**: Fixed mock blob download bug and established production EAS build automation with direct binary delivery.
2. **Stripe Webhook & Private APK Quota Flow**: Added automated entitlement provisioning (`maxMonthlyBuilds`, `allowWhiteLabel`, `allowBrandingCustomization`) upon package purchase, build tracking, monthly cycle reset, and cancellation downgrade.
3. **Vercel, Neon & Vercel Blob Migration**: Built full Drizzle ORM schema and Neon serverless driver, Vercel Blob storage adapter, containerized worker daemon, dual-driver jobs queue, and Vercel routing configuration.

---

## 2. Changes Implemented

### A. APK Generation & Pipeline
- **Root Cause Resolution**: Replaced the placeholder in [`src/App.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/App.tsx) (which was saving raw JSON text named `.apk`) with direct downloads of functional EAS release binaries.
- **Expo Configuration**: Fixed Android package naming and bundle identifiers in [`mobile/app.json`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile/app.json) and [`mobile/package.json`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile/package.json).
- **Verified Build Artifact**: Live EAS build `34cdb52a-7b6e-40e9-b5b8-1c8c2730f55d` generated a working **75.0 MB** release APK:
  `https://expo.dev/artifacts/eas/4Y9x5B2hzK9juzbgnLV3AAINRI383uRemO5Cw8dscyc.apk`
- **Build Scripts Added**: Added `build:apk`, `build:apk:prod`, and `build:apk:wait` in [`package.json`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/package.json).

### B. Stripe Webhook & Private APK Flow
- **Webhook Events in [`apps/api/src/server.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts)**:
  - `checkout.session.completed`: Sets user to `builder` tier and upgrades workspace entitlements (`maxMonthlyBuilds: 5`, `allowWhiteLabel: true`, `allowBrandingCustomization: true`).
  - `customer.subscription.deleted`: Demotes user tier and resets workspace to free limits (`maxMonthlyBuilds: 0`).
  - `invoice.payment_succeeded`: Resets `monthlyBuildsUsed = 0` at each billing cycle renewal.
- **Quota Enforced Build API**:
  - `POST /api/builds` validates `monthlyBuildsUsed < maxMonthlyBuilds` before enqueueing and atomically increments usage upon acceptance.

### C. Vercel, Neon & Vercel Blob Architecture
- **Drizzle Database Schema & Client**:
  - [`packages/db/src/schema.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/db/src/schema.ts): Defined typed tables for `users`, `workspaces`, `playlists`, `playlist_runs`, `epg_feeds`, `build_requests`, and `admin_actions`.
  - [`packages/db/src/client.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/db/src/client.ts): Initialized zero-cold-start HTTP Neon client via `@neondatabase/serverless`.
  - [`packages/db/drizzle.config.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/db/drizzle.config.ts): Migration runner configuration.
- **Dual-Driver Repositories & Job Queue**:
  - [`packages/db/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/db/src/index.ts): If `DATABASE_URL` is configured, all repositories write to Neon via Drizzle; if absent, they safely fall back to Firestore.
  - [`packages/jobs/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/jobs/src/index.ts): Implemented atomic job polling and locking (`pollNextPlaylistJob`, `pollNextBuildJob`, `pollNextEpgJob`) against Neon with Firestore fallback.
- **Vercel Blob Storage Adapter**:
  - [`packages/storage/src/blob.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/storage/src/blob.ts) & [`packages/storage/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/storage/src/index.ts): Supports direct uploads, public URLs, downloads, and deletions with `@vercel/blob` whenever `BLOB_READ_WRITE_TOKEN` is set.
- **Containerized Worker & Routing**:
  - [`apps/worker/Dockerfile`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/Dockerfile): Multi-stage Docker container for deploying the stream probe / playlist cleanser daemon on Railway, Render, Fly.io, or Cloud Run.
  - [`vercel.json`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/vercel.json): Configured SPA routing and API proxying.

---

## 3. Verification & Validation Results

| Test | Target | Command | Result |
| :--- | :--- | :--- | :--- |
| **Vite SPA Build** | Frontend web bundle | `npm run build` | **Passed** (0 errors, 4.16s) |
| **Monorepo Build** | All 6 apps & packages | `npm run build:all` | **Passed** (exit code 0) |
| **TypeScript Typecheck** | Root and subpackages | `npm run lint` | **Passed** (0 errors) |
| **EAS APK Build** | Android mobile app | `eas build --platform android` | **Passed** (75.0 MB functional release binary) |

---

## 4. How to Deploy to Vercel, Neon & Worker

### Step 1: Neon Database Configuration
The Neon PostgreSQL database is pre-configured and live with all 7 tables synchronized.
- **Connection String (Pooled)**:
  ```bash
  DATABASE_URL="postgresql://neondb_owner:npg_qu4rczZoHix9@ep-winter-poetry-ae51hoth-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  ```
- **Inspect Tables via Drizzle Studio**:
  ```bash
  npm run db:studio
  ```
- **Verify Live Connection & Table Schema**:
  ```bash
  node -e '
  const { neon } = require("@neondatabase/serverless");
  require("dotenv").config();
  const sql = neon(process.env.DATABASE_URL);
  sql("SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\''").then(tables => {
    console.log("Tables in Neon DB:", tables.map(t => t.table_name));
  });
  '
  ```

### Step 2: Deploy Frontend & API to Vercel
1. Link your repo to Vercel (`vercel` CLI or Git import from `angelburgosrosado/iptv-menu-app`).
2. Set up Vercel Blob in the Vercel **Storage** tab (automatically injects `BLOB_READ_WRITE_TOKEN`).
3. Add Environment Variables in Vercel (**Settings** > **Environment Variables**):
   - `DATABASE_URL`: `postgresql://neondb_owner:npg_qu4rczZoHix9@ep-winter-poetry-ae51hoth-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   - `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET`
   - `EXPO_PROJECT_ID`: `1437b933-39d1-42b3-bb8d-803a5f33909e`
   - `EXPO_ACCESS_TOKEN` (for triggering private APK builds)
   - Firebase Auth keys (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)

### Step 3: Deploy Worker Daemon to Railway or Render
Deploy [`apps/worker/Dockerfile`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/Dockerfile) with:
- `DATABASE_URL`: `postgresql://neondb_owner:npg_qu4rczZoHix9@ep-winter-poetry-ae51hoth-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- `BLOB_READ_WRITE_TOKEN`: *(Copied from Vercel Storage settings)*
- `EXPO_PROJECT_ID`: `1437b933-39d1-42b3-bb8d-803a5f33909e`
- `EXPO_ACCESS_TOKEN`: *(Your Expo access token)*
