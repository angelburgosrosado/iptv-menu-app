# IPTV Data Format Upgrade & Country Enrichment Walkthrough

This update integrates the architecture, data models, and enrichment pipelines from the uploaded TypeScript script into the application codebase.

---

## What Changed

### 1. Extended Data Types & Schema
- **Files**: [`src/types/iptv.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/types/iptv.ts), [`packages/types/src/index.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/packages/types/src/index.ts)
- Added extended metadata properties to `Channel` and `PlaylistChannel`:
  - `countryCode?: string` (ISO-3166-1 alpha-2 code, e.g. `US`, `MX`, `PR`)
  - `language?: string`
  - `tvgCountry?: string`
  - `tvgName?: string`
  - `epgChannelId?: string`
  - `metadataSource?: 'playlist' | 'iptv-org' | 'manual'`
- Added schemas for `CountrySection`, `XmltvChannel`, `XmltvProgramme`, `EpgProvider`, and `UpgradeAppConfig`.

---

### 2. M3U Parser Enhancement
- **File**: [`src/utils/m3uParser.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/utils/m3uParser.ts)
- Extracts `tvg-country`, `tvg-name`, `tvg-language` directly from `#EXTINF` header lines.
- Incorporates heuristic country extraction from channel names and group titles (e.g., `[US]`, `[PR]`, `US:`) when `tvg-country` is omitted.
- Assigns initial `metadataSource: 'playlist'`.

---

### 3. Channel Enrichment & XMLTV Merging Engine
- **File**: [`src/utils/channelEnrichment.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/utils/channelEnrichment.ts)
- `COUNTRY_NAMES`: ISO alpha-2 country name dictionary.
- `slugify(value)` & `normalize(value)`: Diacritics-stripping (Unicode NFKD normalization) string sanitizers.
- `buildIptvOrgIndex(records)`: Builds dual indexing maps (by ID and composite `name__country`).
- `enrichChannels(channels, index)`: Enriches playlist channels with matching IPTV-Org logos, categories, languages, and country codes.
- `buildCountrySections(channels, countries)`: Aggregates channels into country sections with channel counts and alphabetical sorting.
- `mergeProgrammes(primary, fallback, fallbackWindowHours)`: Merges multi-source schedule programs, enforcing source priorities and dropping expired programs past the fallback window.
- `generateCountryMarkup(countrySections)`: Generates semantic HTML representation.
- `generateReactSectionPatch()`: Generates the drop-in React section code.

---

### 4. Country Sections UI Component & Desktop Integration
- **Files**: [`src/components/CountryChannelSections.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/CountryChannelSections.tsx), [`src/components/DesktopChannels.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/DesktopChannels.tsx)
- Added a 3rd viewing mode to the channel catalog: **Grid**, **List**, and **Country Sections** (with Globe icon).
- Provides instant country filter pills, search input, channel count badges, and one-click actions:
  - **Watch in Web Cinema Player** (with stream proxy relay support)
  - **Preview in Phone Simulator**
  - **Toggle Favorite**

---

### 5. CLI Batch Upgrade Runner & NPM Script
- **Files**: [`scripts/iptv-upgrade.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/scripts/iptv-upgrade.ts), [`package.json`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/package.json)
- Added command:
  ```bash
  npm run iptv:upgrade
  ```
- Generates build artifacts to `output/iptv-upgrade-artifacts/`:
  - `channels.enriched.json`
  - `channels.by-country.json`
  - `epg.public-merged.json`
  - `country-sections.html`
  - `CountryChannelSections.tsx`
  - `README.md`

---

## Verification & Testing

### 1. Automated Unit Tests
Executed `npm test` across all 7 test suites:
```
Test Files  7 passed (7)
     Tests  57 passed (57)
```
- [`tests/channelEnrichment.test.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/tests/channelEnrichment.test.ts) (7 tests): Tests slugification, diacritic-insensitive normalization, iptv-org dual-indexing, metadata enrichment, country grouping, prioritized programme merging, and HTML markup generation.
- [`tests/m3uParser.test.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/tests/m3uParser.test.ts) (8 tests): Verifies standard M3U parsing and extended IPTV metadata (`tvg-country`, `tvg-name`, `language`, `countryCode`).
- [`tests/streamProxy.test.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/tests/streamProxy.test.ts) (10 tests)
- [`tests/apiRoutes.test.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/tests/apiRoutes.test.ts) (15 tests)
- [`tests/auth.test.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/tests/auth.test.ts) (11 tests)
- [`tests/workspaceQuota.test.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/tests/workspaceQuota.test.ts) (4 tests)
- [`tests/storage.test.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/tests/storage.test.ts) (2 tests)

### 2. Full Monorepo Build
Executed `npm run build`:
- Clean compile of all 9 workspace packages (`@iptv-menu/types`, `@iptv-menu/logging`, `@iptv-menu/config`, `@iptv-menu/ui`, `@iptv-menu/storage`, `@iptv-menu/auth`, `@iptv-menu/db`, `@iptv-menu/billing`, `@iptv-menu/jobs`).
- Clean compile of `apps/api`.
- Clean production bundle of Vite web client (`dist/index.html`, `dist/assets/index-*.css`, `dist/assets/index-*.js`).
