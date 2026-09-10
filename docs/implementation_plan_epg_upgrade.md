# Implementation Plan - Backend & Worker Ingestion for Channel Metadata and EPG Upgrade (Option 1)

This plan implements **Option 1**: an automated backend & worker pipeline that ingests `https://iptv-org.github.io/api/channels.json` along with XMLTV EPG schedule feeds. It offloads all heavy parsing, deduplication, and matching to the server/worker, exposing lightweight, sliced REST APIs (`/api/channels/enrich` and `/api/epg/live`) to the Web and Mobile clients.

---

## Architecture Overview

```
[iptv-org channels.json] + [XMLTV EPG Feeds]
                 │
                 ▼
        ┌──────────────────┐
        │   apps/worker    │  <-- Periodic background sync & on-demand EPG jobs
        └────────┬─────────┘
                 │ (Indexed in Memory / DB / Storage)
                 ▼
        ┌──────────────────┐
        │     apps/api     │  <-- Fast REST endpoints:
        └────────┬─────────┘      • POST /api/channels/enrich
                 │                • GET  /api/epg/live (Now/Next)
                 │                • GET  /api/epg/schedule/:channelId
                 ▼
     ┌───────────────────────┐
     │ Web & Mobile Clients  │  <-- usePlayerStore (loadMetadataBundle, loadEpgBundle)
     │ (Web React + RN Expo) │      Zero heavy XML/JSON parsing on device!
     └───────────────────────┘
```

---

## Key Decisions & Resilience

> [!IMPORTANT]
> **Default EPG Sources & Fallbacks**:
> We will configure iptv-org's public XMLTV guide endpoints as the primary open backbone, while keeping support for licensed EPG provider tokens via environment variables (`LICENSED_EPG_URL`, `LICENSED_EPG_TOKEN`).
>
> **Offline / Resilient Fallback**:
> If the backend API service is temporarily unreachable (e.g. device is offline), the client store will gracefully fall back to local parsing so playback is never blocked.

---

## Proposed Changes

### 1. Shared Types (`packages/types`)

#### [MODIFY] [packages/types/src/index.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/types/src/index.ts)
- Add typed definitions for `EpgProgramme`:
  ```ts
  export interface EpgProgramme {
    channelId: string;
    title: string;
    desc?: string;
    start: string; // ISO 8601
    stop: string;  // ISO 8601
    category?: string[];
    icon?: string;
    sourcePriority: number;
  }

  export interface NowNextProgrammes {
    now?: EpgProgramme;
    next?: EpgProgramme;
  }
  ```
- Add request/response types for `/api/channels/enrich` and `/api/epg/live`.

---

### 2. Backend API Services (`apps/api`)

#### [NEW] [apps/api/src/services/channelMetadataService.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/services/channelMetadataService.ts)
- Fetches and caches `https://iptv-org.github.io/api/channels.json` (and `countries.json` / `categories.json`).
- Builds in-memory lookup index by:
  - `id` (exact match on `tvgId`)
  - Normalized name + 2-letter country code
  - Alternative names / aliases (`alt_names`)
- Implements `enrichChannels(channels: Channel[]): Channel[]` that:
  - Fills high-resolution official logos
  - Assigns clean canonical category / group title
  - Sets ISO countryCode & countryName
  - Sets `epgChannelId` (linking to XMLTV)
  - Identifies `is_nsfw` for parental controls

#### [NEW] [apps/api/src/services/epgService.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/services/epgService.ts)
- Ingests XMLTV schedule streams (supports gzipped or plain XMLTV).
- Normalizes XMLTV into fast memory/cache maps keyed by `channelId`.
- Provides:
  - `getNowNextForChannels(channelIds: string[]): Record<string, NowNextProgrammes>`
  - `getChannelSchedule(channelId: string, hoursAhead?: number): EpgProgramme[]`
  - Automatic purging of expired schedule data (older than current time - window).

#### [MODIFY] [apps/api/src/server.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts)
- Add route: `POST /api/channels/enrich`
  - Accepts a list of channels and enriches them in bulk in milliseconds.
- Add route: `GET /api/epg/live`
  - Query param: `?channelIds=id1,id2,id3`
  - Returns current (Now) and upcoming (Next) programme details for requested channels.
- Add route: `GET /api/epg/schedule/:channelId`
  - Returns full schedule timeline for a specific channel.
- Add route: `POST /api/epg/sync`
  - Admin/system trigger to force immediate refresh of EPG feeds and iptv-org data.

---

### 3. Background Worker (`apps/worker`)

#### [MODIFY] [apps/worker/src/index.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/src/index.ts)
- Replace mock XML in `pollNextEpgJob` with real XMLTV fetching and parsing logic.
- Adds an automated scheduled refresh task (e.g. every 12 hours) to keep channel metadata and EPG schedules fresh in shared storage/cache.

---

### 4. Client State & UI Integration (`src/` and `mobile/`)

#### [MODIFY] [src/store/usePlayerStore.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/store/usePlayerStore.ts) and [mobile/src/store/usePlayerStore.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile/src/store/usePlayerStore.ts)
- Update `loadMetadataBundle()`:
  - Calls `POST /api/channels/enrich` with the loaded playlist channels.
  - Updates store with enriched channels and properly sorted `countrySections`.
  - Seamless fallback to client-side heuristic matching if API is offline.
- Update `loadEpgBundle()`:
  - Collects active `epgChannelId` or `tvgId` list from channels.
  - Calls `GET /api/epg/live?channelIds=...`.
  - Populates `epgByChannel` with real live program data (title, description, start/stop times).

#### [MODIFY] [src/components/ChannelCard.tsx](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/ChannelCard.tsx) and [mobile/src/components/ChannelCard.tsx](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile/src/components/ChannelCard.tsx)
- Connect to `epgByChannel`:
  - Show the current live show title ("Now Playing: ...") with a progress bar if available.
  - Display verified high-res logo and country badge.

#### [MODIFY] [src/components/EpgBackbonePanel.tsx](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/EpgBackbonePanel.tsx)
- Reflect real statistics from the live backend EPG sync (accurate schedule coverage %, real source list).

---

## Verification Plan

### Automated Tests
- Run unit test suite:
  ```bash
  npm test
  ```
- Run tests for channel enrichment & EPG parsing:
  ```bash
  npx vitest run tests/channelEnrichment.test.ts
  ```
- Add unit test `tests/epgService.test.ts` to verify XMLTV ingestion, timestamp normalization, and Now/Next slicing.

### Manual Verification
1. **API Verification**:
   - Query `POST /api/channels/enrich` with sample channels (e.g. CNN, Azteca 7) and verify returned logos, categories, and `epgChannelId`.
   - Query `GET /api/epg/live` and verify `now` and `next` programme blocks.
2. **Frontend UI Verification**:
   - Open Web app, verify `loadMetadataBundle()` and `loadEpgBundle()` populate enriched channel cards and EPG timeline.
   - Confirm country sections correctly group channels with flags.
