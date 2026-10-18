# IPTV.Menu Pro

A modern, high-performance IPTV streaming player, multi-screen matrix, Xtream Codes suite, and automated Android TV / Mobile APK generation platform.

Built with **React 19**, **Vite**, **TypeScript**, **Expo React Native**, **Drizzle ORM**, **Neon Serverless PostgreSQL**, **Vercel Blob / GCS**, **Expo EAS**, and containerized background workers.

* **Production Checklist & TV Manual:** [`PRODUCTION_READINESS_CHECKLIST.md`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/PRODUCTION_READINESS_CHECKLIST.md)
* **Living Room TV Sideload Code:** `94218` (via Amazon / Android TV Downloader app)
* **Client & Code Download Portal:** `https://iptv.menu/download`

---

## Architecture Overview

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

## Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** (v20+ recommended)
- **npm** (v10+)
- **Docker** (optional, for running the worker locally)

### 2. Configure Environment
Copy `.env.example` to `.env` or verify the live settings in `.env`:
```bash
# Neon Serverless PostgreSQL Database
DATABASE_URL="postgresql://user:password@ep-winter-poetry-123456-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Vercel Blob (Optional for local testing)
# BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# EAS Mobile Configuration
EXPO_PROJECT_ID=1437b933-39d1-42b3-bb8d-803a5f33909e
EXPO_ACCOUNT_NAME=angelburgosrosado
```

### 3. Install & Build
```bash
# Install root and monorepo workspace dependencies
npm install

# Compile all workspace packages (db, storage, jobs, api, worker)
npm run build:all
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Database Management (Neon & Drizzle ORM)

The database schema is defined in [`packages/db/src/schema.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/db/src/schema.ts) across 7 tables: `users`, `workspaces`, `playlists`, `playlist_runs`, `epg_feeds`, `build_requests`, and `admin_actions`.

- **Test Database Connection**:
  ```bash
  node -e '
  const { neon } = require("@neondatabase/serverless");
  require("dotenv").config();
  const sql = neon(process.env.DATABASE_URL);
  sql("SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\''").then(tables => {
    console.log("Connected to Neon! Tables:", tables.map(t => t.table_name));
  });
  '
  ```

- **Open Drizzle Studio (Visual DB Browser)**:
  ```bash
  npm run db:studio
  ```

- **Push Schema Updates**:
  ```bash
  npm run db:push
  ```

---

## Mobile Android APK Builds & Client Distribution

The platform generates custom-branded, functional Android release APKs with pre-configured playlist links, 10-foot remote D-pad focus, and universal streaming architecture.

- **Direct Endpoints**:
  - Direct APK Download: `/api/download/latest.apk` (or `/download/latest.apk`)
  - Complete Source Code Archive: `/api/download/source.zip` (or `/download/source.zip`)
  - Fire TV Downloader Numeric Code: **`94218`**
  - Web Customer Download Portal: [`/download`](https://iptv.menu/download)

- **Trigger New Builds Locally**:
  ```bash
  # Preview APK build (non-blocking)
  npm run build:apk

  # Production release build
  npm run build:apk:prod

  # Trigger build and stream progress in terminal
  npm run build:apk:wait
  ```

---

## Deployment Instructions

### 1. Deploy Frontend & API to Vercel
1. Import repository `angelburgosrosado/iptv-menu-app` into [Vercel](https://vercel.com).
2. Under the **Storage** tab, create a **Vercel Blob** database (this automatically sets `BLOB_READ_WRITE_TOKEN`).
3. Set the Environment Variables:
   - `DATABASE_URL`: `postgresql://user:password@ep-winter-poetry-123456-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - `EXPO_PROJECT_ID`: `1437b933-39d1-42b3-bb8d-803a5f33909e`
   - `EXPO_ACCESS_TOKEN`: *(Your Expo token)*
   - `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET`
   - Firebase Auth keys for JWT verification

### 2. Deploy Background Worker to Railway or Render
Deploy [`apps/worker/Dockerfile`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/Dockerfile) as a container service:
- Runtime: Docker
- Injected Variables: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `EXPO_ACCESS_TOKEN`, `EXPO_PROJECT_ID`.

Detailed deployment runbooks and guides are available in [`docs/deployment.md`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/docs/deployment.md).
