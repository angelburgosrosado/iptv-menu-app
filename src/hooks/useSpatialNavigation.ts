/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { spatialNav } from '../utils/spatialNavigation';
import { SpatialDirection } from '../types/iptv';

export function useSpatialNavigation() {
  const { 
    tvNavigation, 
    setTvNavigationEnabled, 
    setTvFocus 
  } = usePlayerStore();

  // Sync store state with spatialNav manager
  React.useEffect(() => {
    const unsub = spatialNav.onFocusChange((id, zone) => {
      setTvFocus(id, zone);
    });
    return () => unsub();
  }, [setTvFocus]);

  // Periodic DOM scanner to discover newly rendered channel cards & buttons
  React.useEffect(() => {
    if (typeof document === 'undefined') return;

    const scan = () => {
      spatialNav.scanDom(document);
    };

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedScan = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        scan();
      }, 200);
    };

    scan();

    // Observe DOM changes (e.g. infinite scroll, filter switches) with debouncing
    const observer = new MutationObserver(() => {
      debouncedScan();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, []);

  // Global Remote Controller / Keyboard Navigation Event Listener
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a search bar, textarea, or input field
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
        // Allow Escape inside input to defocus and return to spatial nav
        if (e.code === 'Escape') {
          target?.blur();
        }
        return;
      }

      let dir: SpatialDirection | null = null;
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          dir = 'up';
          break;
        case 'ArrowDown':
        case 'KeyS':
          dir = 'down';
          break;
        case 'ArrowLeft':
        case 'KeyA':
          dir = 'left';
          break;
        case 'ArrowRight':
        case 'KeyD':
          dir = 'right';
          break;
        case 'Enter':
        case 'NumpadEnter':
          if (tvNavigation.isEnabled && spatialNav.getCurrentFocusId()) {
            e.preventDefault();
            spatialNav.selectCurrent();
          }
          return;
        default:
          return;
      }

      if (dir) {
        e.preventDefault();

        if (!tvNavigation.isEnabled) {
          setTvNavigationEnabled(true);
        }

        spatialNav.scanDom(document);

        // If no node is currently focused, focus the first available node
        if (!spatialNav.getCurrentFocusId()) {
          const nodes = spatialNav.getNodes();
          if (nodes.length > 0) {
            spatialNav.setFocus(nodes[0].id, true);
            return;
          }
        }

        spatialNav.move(dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tvNavigation.isEnabled, setTvNavigationEnabled]);

  return {
    tvNavigation,
    setTvFocus: (id: string | null) => spatialNav.setFocus(id),
    move: (dir: SpatialDirection) => spatialNav.move(dir),
    select: () => spatialNav.selectCurrent()
  };
}
