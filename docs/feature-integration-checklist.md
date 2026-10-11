# IPTV Menu Pro — Next-Gen Feature Integration Checklist

Based on the feature audit of **IPTVX (`iptvx.app`)**, the following checklist outlines the high-value features implemented into **IPTV Menu Pro**:

- [x] **Phase 1: Feature Audit & Comparative Benchmark**
  - [x] Scanned all 35 features on `iptvx.app` (Apple TV, iOS, macOS, iPadOS cross-platform suite).
  - [x] Compared against `iptv.menu` and documented legal/technical boundaries (no unlicensed scraping; clean API contracts & state architectures).

- [x] **Phase 2: TV Device Pairing Engine (`tv-pairing`)**
  - [x] **Backend API (`apps/api/src/server.ts`)**:
    - [x] `POST /api/public/pair/generate`: Generate temporary 6-digit numeric pairing code (600s TTL).
    - [x] `POST /api/pair/claim`: Authenticated client (phone/browser) claims pairing code with user token/profile.
    - [x] `GET /api/public/pair/status/:code`: TV client polls for status; receives token upon approval.
  - [x] **Web Interface (`src/components/TvPairingModal.tsx` & `src/App.tsx`)**:
    - [x] Added "Pair TV" button in web navigation header and `/pair` or `?code=` URL listener.
    - [x] Built Midnight Glass modal with 6-digit numeric input, QR URL launcher, and instant claim confirmation.
  - [x] **Mobile / Android TV App (`mobile/src/components/TvPairModal.tsx` & `mobile/app/index.tsx`)**:
    - [x] Added "Pair TV" Focusable button in top header bar.
    - [x] Built TV Pairing modal displaying big 6-digit code with live expiration countdown and 2.5s polling.

- [x] **Phase 3: Live AI Interactive Panel (`live-ai-panel`)**
  - [x] **Backend API (`apps/api/src/server.ts`)**:
    - [x] Added `POST /api/ai/program-context` route powered by `@google/genai` (Gemini 2.5 Flash) with resilient heuristic fallback.
  - [x] **Player UI (Web & Mobile)**:
    - [x] Added "✨ Live AI Insights" button to Video Player HUD (`src/components/VideoPlayer.tsx`).
    - [x] Created `src/components/AiProgramContextPanel.tsx` Midnight Glass drawer displaying synopsis, key figures/cast, viewer tips, and mood badge.

- [x] **Phase 4: Custom EPG Channel Re-Mapping (`custom-epg`)**
  - [x] **State & Store (`src/store/usePlayerStore.ts` & `mobile/src/store/usePlayerStore.ts`)**:
    - [x] Added `epgOverrides: Record<string, string>` persisted to MMKV / local storage.
    - [x] Added `setCustomEpgOverride(channelId, tvgId)` and `removeCustomEpgOverride(channelId)` actions.
  - [x] **UI Controls (`src/components/DesktopEpg.tsx` & `src/components/ChannelCard.tsx`)**:
    - [x] Added "REMAP" button to desktop EPG channel column.
    - [x] Built Channel EPG Re-Mapping modal allowing users to enter custom XMLTV IDs or select from all available channel identifiers.
    - [x] Channel card and EPG timetable automatically resolve custom EPG overrides before falling back to default IDs.

- [x] **Phase 5: Search by Actor / Cast Members (`search-by-actor`)**
  - [x] Added `actors?: string[]` and `cast?: string[]` to `Channel` types (`src/types/iptv.ts` & `mobile/src/types/iptv.ts`).
  - [x] Enhanced `src/utils/searchQueryParser.ts`:
    - [x] Added `actors: string[]` to `ParsedSearchQuery`.
    - [x] Supported `actor:"Name"` and `cast:Name` syntax alongside phrase tokenization.
    - [x] Integrated actor matching into `matchChannelWithQuery` and universal free-text search.
  - [x] Displayed `🎭 Actor` pill badges on `src/components/ChannelCard.tsx`.
  - [x] Added automated unit tests in `tests/searchQueryParser.test.ts`.

- [x] **Phase 6: External Subtitle Discovery Engine (`external-subtitles`)**
  - [x] Updated `src/utils/subtitleEngine.ts`:
    - [x] Added `ExternalSubtitleTrack` interface and `convertSrtToVtt(srt)` converter.
    - [x] Added `searchExternalSubtitles(query, language)` with OpenSubtitles REST API query and curated fallback tracks.
  - [x] Created `src/components/ExternalSubtitleModal.tsx`:
    - [x] On-demand subtitle search dialog with language filters (EN, ES, FR, DE, IT, PT), SDH badges, and download counts.
  - [x] Integrated with `src/components/VideoPlayer.tsx`:
    - [x] Added "Search OpenSubtitles On Demand" button to the CC flyout menu.
    - [x] Dynamically injects WebVTT `<track>` into the HTML5 video element with active track switching.

- [x] **Phase 7: Testing & Verification**
  - [x] Unit & integration test suites passed: **21 test files, 237 tests passing (100% green)**.
  - [x] Mobile TypeScript verification passed: `cd mobile && npx tsc --noEmit` (**0 errors**).
  - [x] Production web bundle built successfully via Vite & esbuild (**0 errors**).
