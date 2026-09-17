# Implementation Plan: Phase 26 — Multi-Stream Split-Screen & Quad-View PIP Matrix Engine

## Overview
Phase 26 elevates the IPTV Menu platform's multi-stream monitoring into an enterprise-grade broadcast canvas. It centralizes multi-screen matrix state into the global Zustand store (`usePlayerStore.ts`), introduces 4 responsive broadcast layout modes (`quad`, `dual`, `hero` 1+3, `triple` 1+2), implements an Audio Focus Solo Arbiter with real-time visual VU equalizer meter badges, provides quick channel searching/filtering for slot assignment, enables slot swap/promotion, and adds direct channel queueing from the main channel catalog.

---

## User Review Required

> [!IMPORTANT]
> **Layout Modes**: The matrix will support 4 layouts:
> 1. `quad` (2x2 Quad Grid — 4 equal quadrants)
> 2. `dual` (2x1 Side-by-Side Split View)
> 3. `hero` (1+3 Command Center — 1 primary hero stream + 3 stacked satellite streams)
> 4. `triple` (1+2 Triple View — 1 primary left stream + 2 stacked right streams)
>
> All audio routing will be strictly managed by the **Audio Focus Solo Arbiter**, ensuring no audio overlapping or acoustic feedback while maintaining continuous video streaming across all active feeds.

---

## Proposed Changes

### Component 1: Data Contracts & Types (`src/types/iptv.ts`)
#### [MODIFY] [`src/types/iptv.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/types/iptv.ts)
- Add `MatrixLayoutMode = 'quad' | 'dual' | 'hero' | 'triple'`.
- Add `MatrixSlotState` interface:
  ```ts
  export interface MatrixSlotState {
    id: number; // 0, 1, 2, 3
    channel: Channel | null;
    isMuted: boolean;
    volume: number;
    error: string | null;
  }
  ```
- Add `MultiScreenMatrixConfig` interface:
  ```ts
  export interface MultiScreenMatrixConfig {
    layout: MatrixLayoutMode;
    slots: (Channel | null)[];
    mutedSlots: boolean[];
    volumes: number[];
    focusedAudioSlot: number | null;
  }
  ```
- Extend `PlayerStore` with matrix state and actions:
  - `matrixConfig: MultiScreenMatrixConfig`
  - `setMatrixLayout(layout: MatrixLayoutMode): void`
  - `setMatrixSlot(slotIdx: number, channel: Channel | null): void`
  - `clearMatrixSlot(slotIdx: number): void`
  - `swapMatrixSlots(slotA: number, slotB: number): void`
  - `promoteToHeroSlot(slotIdx: number): void`
  - `setMatrixAudioSolo(slotIdx: number): void`
  - `toggleMatrixMuteAll(): void`
  - `setMatrixSlotVolume(slotIdx: number, volume: number): void`
  - `toggleMatrixSlotMute(slotIdx: number): void`
  - `resetMatrixConfig(): void`

---

### Component 2: Multi-Screen Store Slice (`src/store/usePlayerStore.ts`)
#### [MODIFY] [`src/store/usePlayerStore.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/store/usePlayerStore.ts)
- Initialize `matrixConfig` from MMKV (`iptv_matrix_config`) with fallback defaults (Layout: `quad`, Slots 0-3 initialized with first channels or null, audio focused on slot 0, others muted).
- Implement all store actions with state persistence.
- Provide clean edge-case handling (e.g. promoting slot 2 swaps slot 0 and 2, preserving focused audio).

---

### Component 3: Multi-Screen Matrix Engine UI (`src/components/MultiScreenMatrix.tsx`)
#### [MODIFY] [`src/components/MultiScreenMatrix.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/MultiScreenMatrix.tsx)
- Connect directly to `usePlayerStore`'s `matrixConfig` and actions.
- Support 4 layouts with Tailwind grid/flex styles:
  - `quad`: 2x2 grid.
  - `dual`: 2x1 grid.
  - `hero`: Large 16:9 hero feed + side/bottom column of 3 satellite feeds.
  - `triple`: 1 left column + 2 right stacked feeds.
- Enhance slot controls:
  - Audio Solo indicator with animated VU meter waves and glowing active border ring.
  - Promote to Slot #1 / Hero button (`Star` or `Crown` / `ArrowUpLeft`).
  - Fullscreen toggle per slot with `Escape` handler.
  - Dedicated stream error recovery with inline retry button.
- Channel Selection Modal Upgrade:
  - Search input with instant debounce filtering.
  - Group category pills filter (e.g., News, Sports, Entertainment, Favorites).
  - One-click channel assignment.

---

### Component 4: Catalog Integration (`src/components/DesktopChannels.tsx`)
#### [MODIFY] [`src/components/DesktopChannels.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/DesktopChannels.tsx)
- Add quick action dropdown / button on channel cards and list rows:
  - `Add to Multi-Screen → Slot 1 / Slot 2 / Slot 3 / Slot 4`.
  - When selected, populates that slot in `usePlayerStore` and notifies via HUD toast.

---

### Component 5: Automated Testing (`tests/multiScreenMatrix.test.ts`)
#### [NEW] [`tests/multiScreenMatrix.test.ts`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/tests/multiScreenMatrix.test.ts)
- Test initial matrix configuration and default values.
- Test layout mode transitions (`quad`, `dual`, `hero`, `triple`).
- Test slot channel assignment and clearing.
- Test slot swapping and hero promotion.
- Test Audio Focus Solo Arbiter (solo slot mute routing, master mute all, restore previous solo).
- Test per-slot volume and mute adjustments.
- Test MMKV serialization and hydration.

---

## Verification Plan

### Automated Tests
- Run `npm test -- --run tests/multiScreenMatrix.test.ts` to verify 100% pass rate on new tests.
- Run `npm test -- --run` to verify all 21 test suites pass with 0 regressions.
- Run `npx tsc --noEmit` to verify 0 TypeScript compiler errors.
- Run `npm run build` to verify production bundle builds cleanly and all chunks remain $< 1000\text{ kB}$.

### Git & Code Hygiene
- Check `data/adsense_config.json` and ensure it is clean before committing.
- Commit with atomic git message and push to `origin/main`.
