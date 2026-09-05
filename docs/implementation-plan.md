# Dynamic Remote Over-The-Air (OTA) App Configuration Implementation Plan

Enable IPTV.menu operators to remotely update channel playlists, EPG sources, branding themes, and broadcast announcements across all installed Android APKs in real-time without recompiling or reinstalling the app.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │            Operator Web Dashboard            │
                      │  - Update Playlist URL / EPG Link            │
                      │  - Change Brand Colors / Logo                │
                      │  - Publish Live Banner Announcement          │
                      └───────────────────────┬──────────────────────┘
                                              │ PUT /api/apps/:appId
                                              ▼
                      ┌──────────────────────────────────────────────┐
                      │          Neon PostgreSQL + Drizzle           │
                      │         Table: `app_configs` (Versioned)     │
                      └───────────────────────┬──────────────────────┘
                                              │
                      ┌───────────────────────┴──────────────────────┐
                      │             Vercel Serverless API            │
                      │         GET /api/v1/apps/:appId/config       │
                      │      (Edge-cached, public low-latency)       │
                      └───────────────────────▲──────────────────────┘
                                              │ GET on launch / poll
                                              │
                      ┌───────────────────────┴──────────────────────┐
                      │         Installed Mobile Player (APK)        │
                      │  - Checks config on boot                     │
                      │  - Dynamically switches M3U channels         │
                      │  - Updates UI theme & shows announcement     │
                      │  - Offline fallback to MMKV cache            │
                      └──────────────────────────────────────────────┘
```

---

## User Review Required

> [!IMPORTANT]
> **Zero Downtime Migration**: The new `app_configs` table will be created in Neon PostgreSQL without modifying existing tables. Existing APKs will continue to function normally, while new APKs or configured clients will receive dynamic live updates.

---

## Proposed Changes

### 1. Data Models & Type System (`packages/types`)

#### [MODIFY] [`packages/types/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/types/src/index.ts)
- Add `AppConfig` interface:
  ```ts
  export interface AppConfig {
    appId: string;
    workspaceId: string;
    ownerUid: string;
    name: string;
    slug: string;
    theme: {
      primaryColor: string;
      accentColor: string;
      logoUrl?: string;
    };
    playlistUrl: string;
    epgUrl?: string | null;
    announcement?: string | null;
    version: number;
    active: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
  }
  ```

---

### 2. Database Schema & Repository (`packages/db`)

#### [MODIFY] [`packages/db/src/schema.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/db/src/schema.ts)
- Define `appConfigs` table with foreign keys to `workspaces` and `users`.
- Export typed Drizzle table representation.

#### [MODIFY] [`packages/db/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/db/src/index.ts)
- Implement `AppConfigRepository`:
  - `createAppConfig(data: Omit<AppConfig, 'createdAt' | 'updatedAt' | 'version'>): Promise<AppConfig>`
  - `getAppConfig(appId: string): Promise<AppConfig | null>`
  - `updateAppConfig(appId: string, updates: Partial<AppConfig>): Promise<AppConfig>`
  - `listAppConfigsByWorkspace(workspaceId: string): Promise<AppConfig[]>`
  - `deleteAppConfig(appId: string): Promise<void>`

---

### 3. REST API Engine (`apps/api`)

#### [MODIFY] [`apps/api/src/server.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts)
- **Public Client Endpoint**:
  - `GET /api/v1/apps/:appId/config`:
    - Public edge-cached route (`Cache-Control: public, s-maxage=60, stale-while-revalidate=300`).
    - Returns `{ appId, name, theme, playlistUrl, epgUrl, announcement, version }`.
- **Operator CRUD Endpoints** (Protected by Firebase Auth & Workspace Context):
  - `GET /api/apps`: List all dynamic app configs in active workspace.
  - `POST /api/apps`: Create new dynamic app config.
  - `GET /api/apps/:appId`: Fetch specific configuration.
  - `PUT /api/apps/:appId`: Update config (automatically increments `version`).
  - `DELETE /api/apps/:appId`: Remove config.

---

### 4. Mobile Client Integration (`mobile/`)

#### [MODIFY] [`mobile/src/store/usePlayerStore.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile/src/store/usePlayerStore.ts)
- Add state properties:
  - `appConfigId: string | null`
  - `remoteVersion: number`
  - `announcement: string | null`
  - `theme: { primaryColor: string; accentColor: string }`
- Add `syncRemoteConfig()` action:
  - Fetches `/api/v1/apps/:appId/config` on boot.
  - If `version > cachedVersion` or `playlistUrl` has changed:
    - Stores new config in MMKV.
    - Updates theme and announcement.
    - Triggers `loadPlaylist()` with the newly assigned remote URL.
  - Gracefully falls back to cached channels if device is offline.

#### [MODIFY] [`mobile/app/index.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile/app/index.tsx)
- Call `syncRemoteConfig()` in initial `useEffect`.
- Display dismissible announcement banner if `announcement` is populated.

---

### 5. Web Dashboard UI (`src/`)

#### [NEW] [`src/components/DesktopRemoteApps.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/DesktopRemoteApps.tsx)
- Add "Remote Apps (OTA)" management panel:
  - List of active dynamic applications with real-time status and version badges.
  - Live editor for:
    - Target M3U Playlist URL (switch between source links or hosted playlists with 1 click).
    - Optional XMLTV EPG URL.
    - Brand Colors & Custom Logo.
    - Broadcast Announcement Banner.
  - One-click "Push Live Update" button that bumps version and broadcasts changes.
  - Quick test link to inspect live JSON output.

#### [MODIFY] [`src/App.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/App.tsx)
- Add "Remote Apps (OTA)" tab to the main sidebar.
- Link the APK Builder step to select or generate a Dynamic App Config, pre-binding the APK to live OTA updates.

---

## Verification Plan

### Automated Tests
1. **TypeScript Typecheck**:
   ```bash
   npm run lint
   ```
2. **Monorepo Build**:
   ```bash
   npm run build
   ```

### API & Database Verification
1. Create a test app config via Neon SQL / Drizzle script.
2. Query `GET /api/v1/apps/app_test/config` using curl:
   ```bash
   curl -i http://localhost:3000/api/v1/apps/app_test/config
   ```
   Verify 200 OK, JSON payload, and cache headers.
3. Update config in database and query again: verify `version` increment and updated `playlistUrl`.

### Mobile Simulation Verification
1. Run mobile test harness verifying `syncRemoteConfig()` retrieves and loads channels dynamically.
