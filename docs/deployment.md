# IPTV.MENU Production Deployment Guide: Vercel, Neon & Worker

This document provides step-by-step instructions for deploying the **IPTV.menu** platform across **Vercel** (Frontend & REST API), **Neon PostgreSQL** (Serverless Database), **Vercel Blob** (Object Storage), and **Railway / Render** (Containerized Worker Daemon).

---

## 1. System Architecture Overview

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

---

## 2. Neon PostgreSQL Database

### Connection String
The application connects via the Neon pooled serverless connection:
```bash
DATABASE_URL="postgresql://neondb_owner:[YOUR_NEON_PASSWORD]@ep-winter-poetry-ae51hoth-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

> [!NOTE]
> The `-pooler` endpoint uses Neon's built-in connection pooler (PgBouncer), making it optimal for serverless environments like Vercel and concurrent worker containers.

### Schema Management & Verification
The database contains 7 synchronized tables: `users`, `workspaces`, `playlists`, `playlist_runs`, `epg_feeds`, `build_requests`, and `admin_actions`.

1. **Verify Connection & Tables**:
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

2. **Open Visual Database GUI (Drizzle Studio)**:
   ```bash
   npm run db:studio
   ```
   Opens a browser dashboard at `https://local.drizzle.studio` to inspect records, users, and entitlements.

---

## 3. Deploying to Vercel (Web & API)

### Step 1: Connect Repository to Vercel
1. Navigate to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** > **Project** and import your Git repository (`angelburgosrosado/iptv-menu-app`).
3. Framework Preset: **Vite**
4. Root Directory: `./` (leave default)

### Step 2: Configure Vercel Blob Storage
1. In your Vercel project dashboard, go to the **Storage** tab.
2. Click **Create Database** > select **Blob**.
3. Name the store (e.g. `iptv-menu-storage`) and connect it to your project.
4. Vercel will automatically inject `BLOB_READ_WRITE_TOKEN` into your project's Environment Variables.

### Step 3: Configure Environment Variables in Vercel
Under **Project Settings** > **Environment Variables**, add the following:

| Variable | Recommended Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://neondb_owner:[YOUR_NEON_PASSWORD]@ep-winter-poetry-ae51hoth-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | Live Neon connection string |
| `NODE_ENV` | `production` | Production environment flag |
| `APP_ENV` | `production` | App environment flag |
| `BLOB_READ_WRITE_TOKEN` | *(Injected automatically by Vercel Blob)* | Access token for `@vercel/blob` |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Signing secret from Stripe Webhook Dashboard |
| `EXPO_PROJECT_ID` | `1437b933-39d1-42b3-bb8d-803a5f33909e` | Expo project identifier |
| `EXPO_ACCESS_TOKEN` | `your-expo-access-token` | Token for triggering automated EAS APK builds |
| `FIREBASE_PROJECT_ID` | `iptv-menu-dev` | Firebase project ID for user JWT validation |
| `FIREBASE_CLIENT_EMAIL` | `...` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\n..."` | Firebase private key (with escaped newlines) |

### Step 4: Deploy
Click **Deploy** or push to your `main` branch. Vercel will build the frontend using [`vercel.json`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/vercel.json) and serve both the web client and serverless endpoints.

---

## 4. Deploying the Background Worker (Railway / Render / Fly.io)

The background worker daemon handles playlist stream probing, M3U deduplication, EPG generation, and EAS build polling. It runs continuously as a Docker container.

### Deploying to Railway:
1. In [Railway](https://railway.app), click **New Project** > **Deploy from GitHub repo**.
2. Set the **Dockerfile Path** to:
   ```
   apps/worker/Dockerfile
   ```
3. Set the Service Environment Variables:
   - `DATABASE_URL`: `postgresql://neondb_owner:[YOUR_NEON_PASSWORD]@ep-winter-poetry-ae51hoth-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   - `BLOB_READ_WRITE_TOKEN`: *(Copy your token from Vercel Storage settings)*
   - `EXPO_ACCESS_TOKEN`: *(Your Expo access token)*
   - `EXPO_PROJECT_ID`: `1437b933-39d1-42b3-bb8d-803a5f33909e`
   - `NODE_ENV`: `production`
4. Deploy the service. Railway will build the multi-stage container and start the worker daemon.

### Deploying to Render:
1. In [Render](https://render.com), create a **Background Worker**.
2. Connect the repo and select **Docker** runtime.
3. Set **Dockerfile Path** to `./apps/worker/Dockerfile`.
4. Inject `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN`.

---

## 5. Stripe Webhook Configuration

1. In the [Stripe Dashboard](https://dashboard.stripe.com/webhooks), click **Add destination**.
2. Set the endpoint URL to:
   ```
   https://<your-vercel-domain>.vercel.app/api/billing/webhook
   ```
3. Subscribe to the following events:
   - `checkout.session.completed` (Provisions builder plan & increments private APK quotas)
   - `customer.subscription.deleted` (Downgrades entitlements upon plan cancellation)
   - `invoice.payment_succeeded` (Resets monthly quota usage on renewal cycle)
4. Copy the **Signing secret** (`whsec_...`) and add it to your Vercel and local `.env` as `STRIPE_WEBHOOK_SECRET`.

---

## 6. Mobile Android APK Builds (EAS)

The mobile app has been pre-configured and verified:
- Release Artifact: `https://expo.dev/artifacts/eas/4Y9x5B2hzK9juzbgnLV3AAINRI383uRemO5Cw8dscyc.apk`

To trigger a new build from your local machine:
```bash
# Preview build (non-blocking)
npm run build:apk

# Production release build
npm run build:apk:prod

# Build and wait for download URL
npm run build:apk:wait
```

---

## 7. Legacy / Fallback: Google Cloud & Firebase

The platform features a dual-driver design:
- If `DATABASE_URL` is unset or unreachable, the repositories automatically fall back to Google Cloud Firestore.
- If `BLOB_READ_WRITE_TOKEN` is unset, the storage layer automatically falls back to Google Cloud Storage.

To deploy the legacy GCP Cloud Run services:
```bash
# Authenticate and deploy
gcloud config set project iptv-menu-prod
./infra/cloudrun/deploy.sh
```
