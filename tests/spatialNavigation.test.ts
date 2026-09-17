/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePlayerStore } from '../src/store/usePlayerStore';
import { 
  SpatialNavManager, 
  calculateSpatialDistance, 
  BoundingBox 
} from '../src/utils/spatialNavigation';

describe('Phase 24: 10-Foot Leanback TV Spatial Remote Navigation Engine', () => {
  beforeEach(() => {
    usePlayerStore.getState().clearCache();
  });

  describe('Spatial Directional Distance Calculations', () => {
    const originBox: BoundingBox = {
      left: 100,
      top: 100,
      right: 200,
      bottom: 200,
      width: 100,
      height: 100,
      centerX: 150,
      centerY: 150,
    };

    it('should compute valid distance for candidates strictly in the target direction', () => {
      const rightBox: BoundingBox = {
        left: 220,
        top: 100,
        right: 320,
        bottom: 200,
        width: 100,
        height: 100,
        centerX: 270,
        centerY: 150,
      };

      const distRight = calculateSpatialDistance(originBox, rightBox, 'right');
      expect(distRight).toBeLessThan(Infinity);
      expect(distRight).toBe(20); // 220 - 200

      // Cannot move left to an element on the right
      const distLeft = calculateSpatialDistance(originBox, rightBox, 'left');
      expect(distLeft).toBe(Infinity);
    });

    it('should calculate down and up directions correctly', () => {
      const downBox: BoundingBox = {
        left: 100,
        top: 220,
        right: 200,
        bottom: 320,
        width: 100,
        height: 100,
        centerX: 150,
        centerY: 270,
      };

      const distDown = calculateSpatialDistance(originBox, downBox, 'down');
      expect(distDown).toBeLessThan(Infinity);
      expect(distDown).toBe(20);

      const distUp = calculateSpatialDistance(originBox, downBox, 'up');
      expect(distUp).toBe(Infinity);
    });

    it('should prioritize aligned targets over diagonal targets', () => {
      const straightRight: BoundingBox = {
        left: 220,
        top: 100,
        right: 320,
        bottom: 200,
        width: 100,
        height: 100,
        centerX: 270,
        centerY: 150, // Perfectly aligned on Y
      };

      const diagonalRight: BoundingBox = {
        left: 220,
        top: 220,
        right: 320,
        bottom: 320,
        width: 100,
        height: 100,
        centerX: 270,
        centerY: 270, // Offset Y by 120px
      };

      const distStraight = calculateSpatialDistance(originBox, straightRight, 'right');
      const distDiagonal = calculateSpatialDistance(originBox, diagonalRight, 'right');

      expect(distStraight).toBeLessThan(distDiagonal);
    });
  });

  describe('SpatialNavManager Grid Traversal & Focus State', () => {
    function createMockElement(id: string, rect: { x: number; y: number; w: number; h: number }): HTMLElement {
      const el = {
        id,
        attributes: {} as Record<string, string>,
        setAttribute: (name: string, val: string) => { el.attributes[name] = val; },
        removeAttribute: (name: string) => { delete el.attributes[name]; },
        getAttribute: (name: string) => el.attributes[name],
        getBoundingClientRect: () => ({
          left: rect.x,
          top: rect.y,
          right: rect.x + rect.w,
          bottom: rect.y + rect.h,
          width: rect.w,
          height: rect.h,
          x: rect.x,
          y: rect.y,
        }),
        focus: vi.fn(),
        scrollIntoView: vi.fn(),
        click: vi.fn(),
      };
      return el as unknown as HTMLElement;
    }

    it('should navigate a 2x2 spatial channel grid seamlessly', () => {
      const manager = new SpatialNavManager();

      // Setup 2x2 grid:
      // (0,0) [ch-1]    (200,0) [ch-2]
      // (0,200) [ch-3]  (200,200) [ch-4]
      const el1 = createMockElement('ch-1', { x: 0, y: 0, w: 150, h: 100 });
      const el2 = createMockElement('ch-2', { x: 200, y: 0, w: 150, h: 100 });
      const el3 = createMockElement('ch-3', { x: 0, y: 200, w: 150, h: 100 });
      const el4 = createMockElement('ch-4', { x: 200, y: 200, w: 150, h: 100 });

      manager.register('ch-1', el1, 'channels');
      manager.register('ch-2', el2, 'channels');
      manager.register('ch-3', el3, 'channels');
      manager.register('ch-4', el4, 'channels');

      expect(manager.getNodes().length).toBe(4);

      // Start focus on top-left (ch-1)
      manager.setFocus('ch-1');
      expect(manager.getCurrentFocusId()).toBe('ch-1');
      expect(el1.getAttribute('data-tv-focused')).toBe('true');

      // Move Right -> ch-2
      const movedRight = manager.move('right');
      expect(movedRight).toBe(true);
      expect(manager.getCurrentFocusId()).toBe('ch-2');
      expect(el1.getAttribute('data-tv-focused')).toBeUndefined();
      expect(el2.getAttribute('data-tv-focused')).toBe('true');

      // Move Down -> ch-4
      const movedDown = manager.move('down');
      expect(movedDown).toBe(true);
      expect(manager.getCurrentFocusId()).toBe('ch-4');

      // Move Left -> ch-3
      const movedLeft = manager.move('left');
      expect(movedLeft).toBe(true);
      expect(manager.getCurrentFocusId()).toBe('ch-3');

      // Move Up -> ch-1
      const movedUp = manager.move('up');
      expect(movedUp).toBe(true);
      expect(manager.getCurrentFocusId()).toBe('ch-1');
    });

    it('should trigger click on selectCurrent()', () => {
      const manager = new SpatialNavManager();
      const el = createMockElement('ch-test', { x: 0, y: 0, w: 100, h: 100 });
      manager.register('ch-test', el, 'channels');
      manager.setFocus('ch-test');

      const clicked = manager.selectCurrent();
      expect(clicked).toBe(true);
      expect(el.click).toHaveBeenCalledTimes(1);
    });

    it('should unregister nodes cleanly', () => {
      const manager = new SpatialNavManager();
      const el = createMockElement('ch-temp', { x: 0, y: 0, w: 100, h: 100 });
      manager.register('ch-temp', el, 'channels');
      manager.setFocus('ch-temp');
      expect(manager.getCurrentFocusId()).toBe('ch-temp');

      manager.unregister('ch-temp');
      expect(manager.getCurrentFocusId()).toBeNull();
      expect(manager.getNodes().length).toBe(0);
    });
  });

  describe('Player Store TV Navigation Integration', () => {
    it('should update TV navigation enabled state and focus in store', () => {
      const store = usePlayerStore.getState();

      expect(store.tvNavigation.isEnabled).toBe(false);
      expect(store.tvNavigation.activeFocusId).toBeNull();

      store.setTvNavigationEnabled(true);
      expect(usePlayerStore.getState().tvNavigation.isEnabled).toBe(true);

      store.setTvFocus('ch-cbs-news', 'channels');
      const updated = usePlayerStore.getState().tvNavigation;
      expect(updated.isEnabled).toBe(true);
      expect(updated.activeFocusId).toBe('ch-cbs-news');
      expect(updated.activeZone).toBe('channels');

      // Toggle high contrast ring
      const initialContrast = updated.highContrastFocusRing;
      store.toggleHighContrastFocusRing();
      expect(usePlayerStore.getState().tvNavigation.highContrastFocusRing).toBe(!initialContrast);
    });
  });
});
