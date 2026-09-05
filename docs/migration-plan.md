# Migration Plan: Moving to Vercel, Neon & Vercel Blob

This document outlines the end-to-end migration strategy for moving **IPTV.menu** from Google Cloud Platform (GCP) and Firebase Firestore to **Vercel**, **Neon PostgreSQL**, and **Vercel Blob**, with a containerized background worker.

---

## 1. Architecture Overview

```
                      ┌─────────────────────────────────┐
                      │          Vercel (Edge)          │
                      │  - React 19 Frontend (Vite)     │
                      │  - REST API Engine (Express/API)│
                      └────────┬───────────────┬────────┘
                               │               │
                 Database (SQL)│               │Object Uploads
                               ▼               ▼
                      ┌────────────────┐ ┌────────────────┐
                      │  Neon Postgres │ │  Vercel Blob   │
                      │  (Drizzle ORM) │ │  (M3U & APKs)  │
                      └────────▲───────┘ └────────▲───────┘
                               │                  │
                               │  Tasks & Files   │
                               └────────┬─────────┘
                                        │
                      ┌─────────────────┴─────────────────┐
                      │  Container Worker (Railway/Render)│
                      │  - Deduplication, Stream Probes   │
                      │  - EPG & EAS Build Orchestration  │
                      └───────────────────────────────────┘
```

| Service | Previous Stack | New Target Stack |
| :--- | :--- | :--- |
| **Frontend** | Vite + Cloud Run / Firebase | **Vercel** (Standard Vite SPA) |
| **Backend API** | Cloud Run (Express.js) | **Vercel Serverless / Node** |
| **Database** | Cloud Firestore NoSQL | **Neon Serverless PostgreSQL (Drizzle ORM)** |
| **Object Storage** | Google Cloud Storage (GCS) | **Vercel Blob (`@vercel/blob`)** |
| **Authentication** | Firebase Auth | **Firebase Auth (Retained)** |
| **Background Worker** | Cloud Run Service | **Container Daemon (Railway, Render, or Run)** |
| **Mobile Compilation** | Expo EAS | **Expo EAS (Retained)** |
| **Payments** | Stripe | **Stripe (Retained)** |

---

## 2. Target Database Schema (PostgreSQL via Drizzle)

All 7 core entities will be mapped from Firestore documents to typed PostgreSQL tables:

### A. `users` Table
```ts
export const users = pgTable('users', {
  uid: text('uid').primaryKey(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('user').notNull(), // 'user' | 'admin'
  accountStatus: text('account_status').default('active').notNull(),
  subscriptionTier: text('subscription_tier').default('free').notNull(), // 'free' | 'pro' | 'builder'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### B. `workspaces` Table
```ts
export const workspaces = pgTable('workspaces', {
  workspaceId: text('workspace_id').primaryKey(),
  name: text('name').notNull(),
  ownerUid: text('owner_uid').references(() => users.uid).notNull(),
  plan: text('plan').default('free').notNull(),
  subscriptionStatus: text('subscription_status').default('active').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  entitlements: jsonb('entitlements').$type<{
    maxPlaylists: number;
    maxHostedPlaylists: number;
    maxDailyCleanups: number;
    maxMonthlyBuilds: number;
    allowBrandingCustomization: boolean;
    allowWhiteLabel: boolean;
  }>().notNull(),
  usage: jsonb('usage').$type<{
    activePlaylistsCount: number;
    activeHostedPlaylistsCount: number;
    dailyCleanupsUsed: number;
    monthlyBuildsUsed: number;
  }>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### C. `playlists` Table
```ts
export const playlists = pgTable('playlists', {
  playlistId: text('playlist_id').primaryKey(),
  uid: text('uid').references(() => users.uid).notNull(),
  name: text('name').notNull(),
  sourceType: text('source_type').notNull(), // 'url' | 'upload'
  sourceUrl: text('source_url'),
  originalFilePath: text('original_file_path'), // Vercel Blob URL
  cleanedFilePath: text('cleaned_file_path'),   // Vercel Blob URL
  channelCount: integer('channel_count').default(0).notNull(),
  status: text('status').default('ready').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### D. `playlist_runs` Table
```ts
export const playlistRuns = pgTable('playlist_runs', {
  runId: text('run_id').primaryKey(),
  playlistId: text('playlist_id').references(() => playlists.playlistId, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'clean' | 'validate'
  status: text('status').default('queued').notNull(), // 'queued' | 'running' | 'completed' | 'failed'
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  summary: jsonb('summary'),
  error: text('error'),
});
```

### E. `build_requests` Table
```ts
export const buildRequests = pgTable('build_requests', {
  buildId: text('build_id').primaryKey(),
  uid: text('uid').references(() => users.uid).notNull(),
  appName: text('app_name').notNull(),
  brandConfig: jsonb('brand_config').$type<{
    primaryColor: string;
    accentColor: string;
    logoUrl?: string;
  }>().notNull(),
  playlistSource: jsonb('playlist_source').$type<{
    type: 'url' | 'file';
    value: string;
  }>().notNull(),
  status: text('status').default('queued').notNull(), // 'queued' | 'building' | 'succeeded' | 'failed'
  artifactPath: text('artifact_path'), // Vercel Blob or EAS URL
  buildLogPath: text('build_log_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### F. `epg_feeds` & `admin_actions` Tables
- `epg_feeds`: tracks XMLTV generation tasks and output URLs.
- `admin_actions`: immutable audit log of staff operations.

---

## 3. Storage Layer (`@iptv-menu/storage`) via Vercel Blob

Replace `@google-cloud/storage` with `@vercel/blob`:
- `put(pathname, body, { access: 'public' | 'private' })` for file uploads.
- `del(url)` for deleting old playlists or builds.
- Direct upload support via `@vercel/blob/client` for browser-to-storage streaming.

---

## 4. Work Execution Roadmap

1. **Step 1: Database Setup with Drizzle & Neon**
   - Install `drizzle-orm`, `@neondatabase/serverless`, and `drizzle-kit` in `packages/db`.
   - Implement the schema file `packages/db/src/schema.ts`.
   - Update `packages/db/src/index.ts` repositories to execute Drizzle SQL queries.

2. **Step 2: Storage Adapter with Vercel Blob**
   - Install `@vercel/blob` in `packages/storage`.
   - Implement `uploadToBlob`, `downloadBlob`, and `deleteBlob`.

3. **Step 3: Worker Adaptation**
   - Update `apps/worker` to query Neon for queued jobs (with `SELECT ... FOR UPDATE SKIP LOCKED` or status updates) and read/write to Vercel Blob.
   - Add Dockerfile / Procfile for container deployment on Railway/Render.

4. **Step 4: Vercel Project Config**
   - Add `vercel.json` for frontend SPA routing and API proxying.
   - Configure environment variables in Vercel (`DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`).
