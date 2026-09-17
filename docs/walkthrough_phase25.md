# Walkthrough: Phase 25 — Multi-Language Subtitle & Closed Caption Customization Engine

## Overview
Phase 25 introduces a real-time Subtitle & Closed Caption Customization Engine for the IPTV Menu web player. This system provides broadcast-grade visual accessibility, custom cue styling (`video::cue`), timing synchronization offsets ($\pm 5.0\text{s}$), and seamless live preview controls.

---

## Changes Implemented

### 1. Type Definitions & Contracts
- [`src/types/iptv.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/types/iptv.ts):
  - Defined `SubtitlePreset` (`'broadcast' | 'cinema' | 'teletext' | 'minimal' | 'custom'`).
  - Defined `SubtitleFontSize` (`'small' | 'medium' | 'large' | 'xlarge'`).
  - Defined `SubtitleTextColor` (`'white' | 'yellow' | 'cyan' | 'green'`).
  - Defined `SubtitleBgOpacity` (`0 | 25 | 50 | 75 | 100`).
  - Defined `SubtitleEdgeStyle` (`'none' | 'dropshadow' | 'raised' | 'outline'`).
  - Defined `SubtitleFontFamily` (`'sans' | 'serif' | 'mono'`).
  - Defined `SubtitleConfig` interface and player store actions (`setSubtitleConfig`, `setSubtitlePreset`, `setSubtitleSyncOffset`, `resetSubtitleConfig`).

### 2. Core Subtitle Engine
- [`src/utils/subtitleEngine.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/utils/subtitleEngine.ts):
  - Created lookup maps: `FONT_SIZE_MAP`, `TEXT_COLOR_MAP`, `EDGE_STYLE_MAP`, `FONT_FAMILY_MAP`.
  - Implemented `generateCueCss(config)` generating standard `video::cue` pseudo-element CSS rules with `!important` overriding browser defaults.
  - Implemented `applySubtitleStylesToDom(config)` injecting and updating `<style id="iptv-custom-subtitle-styles">` into `document.head` in real time.
  - Implemented `clampSyncOffset(offsetMs)` with 250ms interval snapping and $\pm 5000\text{ms}$ bounds, preventing `-0` edge cases.
  - Implemented `formatSyncOffset(offsetMs)` displaying human-readable sync delta (e.g., `+500 ms (+0.50s Delayed)` or `-750 ms (-0.75s Ahead)`).

### 3. State Management & Persistence
- [`src/store/usePlayerStore.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/store/usePlayerStore.ts):
  - Added `subtitleConfig` state initialized with `DEFAULT_SUBTITLE_CONFIG`.
  - Stored and hydrated via MMKV with key `iptv_subtitle_config`.
  - Implemented partial updater `setSubtitleConfig`, preset switcher `setSubtitlePreset` (preserving sync offset), `setSubtitleSyncOffset`, and `resetSubtitleConfig`.

### 4. Interactive Live Preview & Customization UI
- [`src/components/SubtitleSettingsModal.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/SubtitleSettingsModal.tsx):
  - Interactive modal dialog featuring:
    - **Live Video Preview Box**: Simulates realistic stream scene rendering dynamic sample caption text (`"Welcome to IPTV Menu Platform — High Fidelity Live Broadcast."`) reflecting changes in font size, color, background opacity, font family, and drop shadow.
    - **Broadcast Presets**: Broadcast (standard), Cinema (yellow on black), Teletext (cyan monospace), Minimalist (transparent background with heavy outline).
    - **Granular Controls**: Size selectors, contrast color swatches, background opacity percentages, edge outline styles, and typography families.
    - **Timing Sync Stepper**: Stepper buttons ($-250\text{ms}$ and $+250\text{ms}$) with reset button to adjust desynchronized audio/caption streams.

### 5. Video Player Integration & Keyboard Shortcuts
- [`src/components/VideoPlayer.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/VideoPlayer.tsx):
  - Added real-time DOM injection effect synchronizing `subtitleConfig` to video tracks.
  - Added `Customize CC Styles & Timing` button to the subtitle/CC track selector flyout.
  - Bound `KeyC` shortcut to toggle the Subtitle Settings modal.
  - Mounted `<SubtitleSettingsModal />` at the root player level.

---

## Verification Results

### 1. Test Suite Coverage
- **Suite Command:** `npm test -- --run`
- **Result:** **20 passed (20 suites), 214 passed (214 tests)**
  - `tests/subtitleEngine.test.ts`: 19/19 tests passing.
  - All existing suites (recording, spatial nav, parental controls, audio DSP, API routes, EPG) 100% passing.

### 2. TypeScript Type Check
- **Command:** `npx tsc --noEmit`
- **Result:** 0 errors.

### 3. Production Bundle Build
- **Command:** `npm run build`
- **Result:**
  - Build finished successfully in 4.56s.
  - All chunks remain safely below 1,000 kB (largest chunk: `index-Be0_CS07.js` at `914.55 kB`).
  - Zero chunk warnings.
