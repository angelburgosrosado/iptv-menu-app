# Walkthrough - Option 1: Backend/Worker Ingestion & Sliced EPG Delivery

We have implemented **Option 1**: an automated backend & worker pipeline that ingests `https://iptv-org.github.io/api/channels.json` along with XMLTV EPG schedule feeds. Heavy parsing, matching, and data deduplication are offloaded to the server/worker, exposing lightweight REST endpoints to the Web and Mobile clients.

---

## Changes Implemented

### 1. Shared Types (`packages/types`)
- **[index.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/types/src/index.ts)**:
  - Added `EpgProgramme` (normalized schedule entry with `channelId`, `start`, `stop`, `title`, `desc`, `category`, `sourcePriority`).
  - Added `NowNextProgrammes` (`now` and `next` programme blocks).
  - Added `IptvOrgChannel`, `ChannelEnrichmentRequest`, `ChannelEnrichmentResponse`, and `EpgLiveResponse`.
  - Rebuilt `@iptv-menu/types` package (`dist/index.d.ts`).

### 2. Backend API Services (`apps/api`)
- **[channelMetadataService.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/services/channelMetadataService.ts)**:
  - Ingests and indexes `channels.json` from iptv-org into memory (`byId`, `byNameCountry`, `byName`).
  - Implements fuzzy normalization and multi-factor matching for logos, canonical categories, country codes, and `epgChannelId`.
  - Ingests official country metadata and ISO code names.
- **[epgService.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/services/epgService.ts)**:
  - Ingests XMLTV schedule streams via fast regular expression scanning.
  - Normalizes timestamps across timezones to ISO 8601 strings.
  - Provides windowed slicing:
    - `getNowNext(channelIds: string[])`: Returns instant `now` and `next` programs.
    - `getSchedule(channelId: string, hoursAhead: number)`: Returns timeline up to N hours.
    - `purgeExpired(retentionHours)`: Cleans old schedule history to keep memory minimal.
- **[server.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/api/src/server.ts)**:
  - Added `POST /api/channels/enrich`: Bulk channel enrichment for playlists.
  - Added `GET /api/channels/metadata/stats`: Telemetry on loaded channels & countries.
  - Added `GET /api/epg/live?channelIds=...`: Sliced Now/Next schedule endpoint.
  - Added `GET /api/epg/schedule/:channelId`: Detailed channel guide timeline.
  - Added `POST /api/epg/sync`: On-demand trigger to refresh EPG feeds.

### 3. Background Worker (`apps/worker`)
- **[index.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/src/index.ts)**:
  - Replaced mock EPG XML generation with `processEpgJob(epgId, uid)` to aggregate real XMLTV feeds from configured sources, store the XML in Cloud Storage, and update database records.

### 4. Client Web & Mobile State (`src/` & `mobile/`)
- **[src/store/usePlayerStore.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/store/usePlayerStore.ts)** & **[mobile/src/store/usePlayerStore.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile/src/store/usePlayerStore.ts)**:
  - `loadMetadataBundle()`: Calls `POST /api/channels/enrich` to enrich all active channels with high-res logos, canonical categories, and EPG IDs.
  - `loadEpgBundle()`: Queries `GET /api/epg/live` for all active channels and populates `epgByChannel` with real live program data.
  - Graceful fallback: If device is offline or server is temporarily unreachable, local heuristic matching and standby schedule generators take over without interrupting playback.
- **[ChannelCard.tsx](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/ChannelCard.tsx)**:
  - Subscribed to `epgByChannel` to display a live "Now Playing" show title with a pulse indicator next to channel metadata.

---

## Verification Results

### 1. Automated Unit Tests
- Tested `ChannelMetadataService` and `EpgService` with a dedicated Vitest test suite:
  ```bash
  npx vitest run tests/backendEpgAndMetadata.test.ts
  ```
  **Result:** Passed (4 tests) in 18ms.
- Ran full test suite across the entire repository:
  ```bash
  npx vitest run
  ```
  **Result:** 8 test files passed, 63 tests passed.

### 2. Full Workspace & Production Bundle Build
- Ran `npm run build`:
  - Compiled all shared packages: `@iptv-menu/types`, `@iptv-menu/logging`, `@iptv-menu/config`, `@iptv-menu/ui`, `@iptv-menu/storage`, `@iptv-menu/auth`, `@iptv-menu/db`, `@iptv-menu/billing`, `@iptv-menu/jobs`.
  - Compiled backend API (`iptv-api`).
  - Compiled production Vite bundle (`dist/`).
  **Result:** Exit code 0 (all builds succeeded).
