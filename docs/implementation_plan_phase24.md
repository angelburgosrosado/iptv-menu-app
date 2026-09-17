# Implementation Plan - Phase 24: 10-Foot Leanback TV Spatial Remote Navigation Engine

Enable true 10-foot leanback smart TV experience (Android TV, Fire TV, Apple TV, Chromecast, set-top boxes, and leanback keyboard controls) with 2D spatial grid focus traversal, high-contrast animated focus rings, auto-scrolling viewport arbiter, and TV remote key event interception.

## User Review Required

> [!NOTE]
> TV Remote navigation automatically activates whenever a D-Pad / Arrow key is pressed, placing a high-contrast glowing focus ring on the active channel or control. Mouse movement or pointer clicks gracefully maintain standard desktop/mobile interaction without interference.

## Proposed Changes

### Core Types & Configuration
#### [MODIFY] [iptv.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/types/iptv.ts)
- Add `SpatialFocusZone`: `'nav' | 'sidebar' | 'channels' | 'player' | 'modal'`.
- Add `SpatialDirection`: `'up' | 'down' | 'left' | 'right'`.
- Add `TvNavigationConfig` interface (`isEnabled`, `activeFocusId`, `activeZone`, `highContrastFocusRing`, `soundFeedback`).
- Add `tvNavigation` state and actions to `AppState`:
  - `setTvNavigationEnabled(enabled: boolean): void`
  - `setTvFocus(focusId: string | null, zone?: SpatialFocusZone): void`
  - `toggleHighContrastFocusRing(): void`

---

### Spatial Navigation Engine & Algorithms
#### [NEW] [spatialNavigation.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/utils/spatialNavigation.ts)
- Implement `SpatialNavManager` singleton:
  - Register and unregister focusable DOM nodes (`registerNode`, `unregisterNode`).
  - Calculate 2D Euclidean & Manhattan directional vectors:
    - Prioritize closest element in the traversal hemisphere with secondary axis alignment weighting.
  - Traverse boundaries: from channel cards up into filter categories or header navigation, and down into channel lists.
  - Safe auto-scroll: `scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })`.
  - Simulate selection on `Enter`/`OK`.

---

### React Hook & Controller
#### [NEW] [useSpatialNavigation.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/hooks/useSpatialNavigation.ts)
- Global remote & keyboard handler:
  - Listens for `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`, `NumpadEnter`, `Space`, `Escape`, `Backspace`.
  - Traps focus within open modals (DVR, Equalizer, PIN, Sleep Timer).
  - Skips interception when typing in text inputs.
  - Prevents unintended document scroll jumps when navigating cards.

---

### Store State & Integration
#### [MODIFY] [usePlayerStore.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/store/usePlayerStore.ts)
- Add `DEFAULT_TV_NAVIGATION` and `tvNavigation` state.
- Implement actions: `setTvNavigationEnabled`, `setTvFocus`, `toggleHighContrastFocusRing`.

---

### UI Integration & Visual Focus Styling
#### [NEW] [tvNavigation.css](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/styles/tvNavigation.css)
- CSS styles for `[data-tv-focused="true"]`:
  - Glowing cyan/blue border (`outline: 3px solid #38bdf8`).
  - Pulsing aura (`box-shadow: 0 0 24px rgba(56, 189, 248, 0.5)`).
  - Smooth subtle scale transform (`scale(1.025)`).

#### [MODIFY] [DesktopChannels.tsx](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/DesktopChannels.tsx)
- Add `data-tv-focus-id` attributes to channel cards, group buttons, and country chips.
- Add TV Remote leanback indicator badge showing active focus navigation hints.

#### [MODIFY] [App.tsx](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/App.tsx)
- Mount `useSpatialNavigation` at application root level.
- Import `tvNavigation.css`.

---

### Automated Unit Testing
#### [NEW] [spatialNavigation.test.ts](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/tests/spatialNavigation.test.ts)
- Test 2D directional neighbor calculations across multi-column, multi-row grids.
- Test node registration, unregistration, and focus switching.
- Test modal focus trapping and zone boundary handling.
- Test store persistence and enable/disable toggling.

## Verification Plan

### Automated Tests
- Run `npm test -- --run tests/spatialNavigation.test.ts`
- Run `npm test -- --run` across all 19 test suites
- Run `npx tsc --noEmit`
- Run `npm run build` and ensure chunks remain strictly $< 1,000\text{ kB}$

### Manual Verification
- Press Arrow keys (Up, Down, Left, Right) to watch focus ring seamlessly traverse channels and jump into categories.
- Press Enter to launch channel into Web Cinema Player.
- Press Escape / Back to return to channel guide.
