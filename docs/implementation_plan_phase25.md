# Implementation Plan - Phase 25: Multi-Language Subtitle & Closed Caption Customization Engine

Provide comprehensive, real-time styling and synchronization controls for Closed Captions (CC) and Subtitles across all live streams, supporting customizable font sizing, high-contrast text colors, background box opacity, edge outlines, timing sync offsets, and broadcast presets.

## User Review Required

> [!NOTE]
> Custom subtitle styles automatically apply to all native HTML5 `::cue` text tracks across live HLS streams and VOD catchup. Subtitle sync offsets ($\pm 5.0\text{s}$) adjust timing dynamically to compensate for upstream broadcast latency differences.

## Proposed Changes

### Core Types & Data Model
#### [MODIFY] [iptv.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/types/iptv.ts)
- Add `SubtitleFontSize`: `'small' | 'medium' | 'large' | 'xlarge'`.
- Add `SubtitleTextColor`: `'white' | 'yellow' | 'cyan' | 'green'`.
- Add `SubtitleBgOpacity`: `0 | 25 | 50 | 75 | 100`.
- Add `SubtitleEdgeStyle`: `'none' | 'dropshadow' | 'raised' | 'outline'`.
- Add `SubtitleFontFamily`: `'sans' | 'serif' | 'mono'`.
- Add `SubtitlePreset`: `'broadcast' | 'cinema' | 'teletext' | 'minimal' | 'custom'`.
- Add `SubtitleConfig` interface:
  - `isEnabled: boolean`
  - `preset: SubtitlePreset`
  - `fontSize: SubtitleFontSize`
  - `textColor: SubtitleTextColor`
  - `bgOpacity: SubtitleBgOpacity`
  - `edgeStyle: SubtitleEdgeStyle`
  - `fontFamily: SubtitleFontFamily`
  - `syncOffsetMs: number` (-5000 to +5000)
- Add `subtitleConfig` and actions to `AppState`:
  - `setSubtitleConfig(updates: Partial<SubtitleConfig>): void`
  - `setSubtitlePreset(preset: SubtitlePreset): void`
  - `setSubtitleSyncOffset(offsetMs: number): void`
  - `resetSubtitleConfig(): void`

---

### Subtitle Engine & CSS Cue Injector
#### [NEW] [subtitleEngine.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/utils/subtitleEngine.ts)
- `generateCueCss(config: SubtitleConfig): string`:
  - Translates configuration into high-specificity `video::cue` CSS rules.
  - Maps font sizes to responsive px values (Small: 14px, Medium: 18px, Large: 24px, Extra Large: 32px).
  - Maps colors to accessible hex codes (`#ffffff`, `#fde047`, `#38bdf8`, `#4ade80`).
  - Maps background opacity to `rgba(0, 0, 0, opacity)`.
  - Maps edge styles to `text-shadow`.
- `applySubtitleStylesToDom(config: SubtitleConfig): void`:
  - Injects or updates `<style id="iptv-custom-subtitles">` in `document.head`.
- `SUBTITLE_PRESETS`:
  - Ready-to-use presets: Broadcast, Cinema High Contrast, Teletext, Clean Minimalist.

---

### Store State & MMKV Persistence
#### [MODIFY] [usePlayerStore.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/store/usePlayerStore.ts)
- Add `DEFAULT_SUBTITLE_CONFIG`.
- Read from MMKV storage: `readJsonFromStorage<SubtitleConfig>('iptv_subtitle_config', DEFAULT_SUBTITLE_CONFIG)`.
- Implement store actions: `setSubtitleConfig`, `setSubtitlePreset`, `setSubtitleSyncOffset`, `resetSubtitleConfig`.
- Auto-call `applySubtitleStylesToDom` on config changes.

---

### UI Components & Modals
#### [NEW] [SubtitleSettingsModal.tsx](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/SubtitleSettingsModal.tsx)
- Sleek modal dialog featuring:
  - **Live Preview Screen Card:** Realistic stream preview showing sample subtitles rendered with active styling.
  - **Preset Quick Selector:** 1-click switching between Broadcast, Cinema, Teletext, and Minimalist.
  - **Font Size Pills:** Small, Medium, Large, Extra Large.
  - **Text Color Swatches:** White, Cinema Yellow, Electric Cyan, High-Vis Green.
  - **Background Opacity Slider / Buttons:** 0% (Transparent), 25%, 50%, 75%, 100% (Solid Black).
  - **Edge Style Selector:** None, Drop Shadow, Raised, Outline.
  - **Sync Timing Offset Control:** Steppers for $\pm 250\text{ms}$ adjustment with reset button.

#### [MODIFY] [VideoPlayer.tsx](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/VideoPlayer.tsx)
- Integrate `SubtitleSettingsModal` toggle into subtitle track flyout.
- Add Subtitle appearance button in controls bar.
- Add keyboard shortcut `KeyC` to toggle subtitles or open subtitle settings.
- Apply `subtitleConfig` upon video element attachment.

---

### Automated Unit Testing
#### [NEW] [subtitleEngine.test.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/tests/subtitleEngine.test.ts)
- Test CSS cue rule generation across all options (colors, opacities, fonts, edge styles).
- Test preset mappings.
- Test sync offset calculation and clamping limits.
- Test store persistence and actions.

## Verification Plan

### Automated Tests
- Run `npm test -- --run tests/subtitleEngine.test.ts`
- Run `npm test -- --run` across all 20 test suites
- Run `npx tsc --noEmit`
- Run `npm run build` and ensure chunks remain strictly $< 1,000\text{ kB}$

### Manual Verification
- Open player, switch subtitles track, and open Subtitle Settings Modal.
- Change font size, color to Cinema Yellow, and opacity to 75%.
- Observe live preview updating instantly and custom styling reflected on video playback.
