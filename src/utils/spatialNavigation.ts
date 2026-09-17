/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SpatialDirection, SpatialFocusZone } from '../types/iptv';

export interface FocusableNode {
  id: string;
  element: HTMLElement;
  zone: SpatialFocusZone;
  priority?: number;
}

export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Get normalized bounding box for an element or mock coordinates
 */
export function getBoundingBox(el: HTMLElement): BoundingBox {
  if (typeof el.getBoundingClientRect === 'function') {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width || rect.right - rect.left || 1,
      height: rect.height || rect.bottom - rect.top || 1,
      centerX: rect.left + (rect.width || 0) / 2,
      centerY: rect.top + (rect.height || 0) / 2
    };
  }

  // Fallback for mocked elements in tests
  const x = (el as any).offsetLeft ?? 0;
  const y = (el as any).offsetTop ?? 0;
  const w = (el as any).offsetWidth ?? 100;
  const h = (el as any).offsetHeight ?? 100;
  return {
    left: x,
    top: y,
    right: x + w,
    bottom: y + h,
    width: w,
    height: h,
    centerX: x + w / 2,
    centerY: y + h / 2
  };
}

/**
 * Calculate directional distance between two 2D bounding boxes.
 * Returns Infinity if the candidate is not within the directional hemisphere.
 */
export function calculateSpatialDistance(
  current: BoundingBox,
  candidate: BoundingBox,
  direction: SpatialDirection
): number {
  const dx = candidate.centerX - current.centerX;
  const dy = candidate.centerY - current.centerY;

  const threshold = 4; // minimum movement delta threshold in px

  let primaryDist = 0;
  let secondaryDist = 0;

  switch (direction) {
    case 'right':
      if (candidate.centerX <= current.centerX + threshold) return Infinity;
      primaryDist = candidate.left - current.right;
      secondaryDist = Math.abs(dy);
      break;

    case 'left':
      if (candidate.centerX >= current.centerX - threshold) return Infinity;
      primaryDist = current.left - candidate.right;
      secondaryDist = Math.abs(dy);
      break;

    case 'down':
      if (candidate.centerY <= current.centerY + threshold) return Infinity;
      primaryDist = candidate.top - current.bottom;
      secondaryDist = Math.abs(dx);
      break;

    case 'up':
      if (candidate.centerY >= current.centerY - threshold) return Infinity;
      primaryDist = current.top - candidate.bottom;
      secondaryDist = Math.abs(dx);
      break;
  }

  // Allow negative gap if elements overlap slightly or border-to-border
  const nonNegativePrimary = Math.max(0, primaryDist);

  // Apply alignment penalty to prioritize straight line trajectory over diagonal jump
  const ALIGNMENT_PENALTY = 2.5;
  return nonNegativePrimary + (secondaryDist * ALIGNMENT_PENALTY);
}

/**
 * Spatial Navigation Manager
 */
export class SpatialNavManager {
  private nodes: Map<string, FocusableNode> = new Map();
  private currentFocusId: string | null = null;
  private currentZone: SpatialFocusZone = 'channels';
  private onFocusChangeListeners: Set<(id: string | null, zone: SpatialFocusZone) => void> = new Set();

  public register(id: string, element: HTMLElement, zone: SpatialFocusZone = 'channels', priority = 0): void {
    if (!id || !element) return;
    this.nodes.set(id, { id, element, zone, priority });
  }

  public unregister(id: string): void {
    if (this.currentFocusId === id) {
      this.clearCurrentFocusVisual();
      this.currentFocusId = null;
    }
    this.nodes.delete(id);
  }

  public clear(): void {
    this.clearCurrentFocusVisual();
    this.nodes.clear();
    this.currentFocusId = null;
  }

  public getNodes(): FocusableNode[] {
    return Array.from(this.nodes.values());
  }

  public getCurrentFocusId(): string | null {
    return this.currentFocusId;
  }

  public getCurrentZone(): SpatialFocusZone {
    return this.currentZone;
  }

  public onFocusChange(callback: (id: string | null, zone: SpatialFocusZone) => void): () => void {
    this.onFocusChangeListeners.add(callback);
    return () => this.onFocusChangeListeners.delete(callback);
  }

  /**
   * Rescan and synchronize DOM nodes marked with [data-tv-focus-id]
   */
  public scanDom(root: Document | HTMLElement = typeof document !== 'undefined' ? document : (null as any)): void {
    if (!root || typeof root.querySelectorAll !== 'function') return;

    const elements = root.querySelectorAll('[data-tv-focus-id]');
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const id = htmlEl.getAttribute('data-tv-focus-id');
      const zone = (htmlEl.getAttribute('data-tv-zone') as SpatialFocusZone) || 'channels';
      if (id) {
        this.register(id, htmlEl, zone);
      }
    });
  }

  /**
   * Set visual focus on specific node by ID
   */
  public setFocus(id: string | null, scroll = true): boolean {
    if (!id) {
      this.clearCurrentFocusVisual();
      this.currentFocusId = null;
      this.notifyListeners(null, this.currentZone);
      return false;
    }

    const target = this.nodes.get(id);
    if (!target || !target.element) {
      return false;
    }

    // Clear old visual state
    this.clearCurrentFocusVisual();

    // Apply new focus state
    this.currentFocusId = id;
    this.currentZone = target.zone;
    target.element.setAttribute('data-tv-focused', 'true');

    if (typeof target.element.focus === 'function') {
      try {
        target.element.focus({ preventScroll: true });
      } catch {
        // Ignored in non-browser environments
      }
    }

    if (scroll && typeof target.element.scrollIntoView === 'function') {
      try {
        target.element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      } catch {
        // Fallback for older DOM implementations
      }
    }

    this.notifyListeners(id, target.zone);
    return true;
  }

  /**
   * Find closest neighboring focusable element in specified 2D direction
   */
  public findNextTarget(direction: SpatialDirection, activeId = this.currentFocusId): string | null {
    if (this.nodes.size === 0) return null;

    let currentNode: FocusableNode | undefined;
    if (activeId) {
      currentNode = this.nodes.get(activeId);
    }

    // If no active node or active node is missing from map, pick the first available node
    if (!currentNode) {
      const first = this.nodes.values().next().value;
      return first ? first.id : null;
    }

    const currentBox = getBoundingBox(currentNode.element);
    let bestCandidateId: string | null = null;
    let shortestDistance = Infinity;

    // First: Search for nearest neighbor within the same zone
    const currentZoneNodes = Array.from(this.nodes.values()).filter((n) => n.zone === currentNode?.zone && n.id !== activeId);

    for (const cand of currentZoneNodes) {
      const candBox = getBoundingBox(cand.element);
      const dist = calculateSpatialDistance(currentBox, candBox, direction);
      if (dist < shortestDistance) {
        shortestDistance = dist;
        bestCandidateId = cand.id;
      }
    }

    // If a neighbor was found in the same zone, return it
    if (bestCandidateId && shortestDistance < Infinity) {
      return bestCandidateId;
    }

    // Second: Search across all other visible zones if boundary of current zone is reached
    const otherNodes = Array.from(this.nodes.values()).filter((n) => n.zone !== currentNode?.zone && n.id !== activeId);

    for (const cand of otherNodes) {
      const candBox = getBoundingBox(cand.element);
      const dist = calculateSpatialDistance(currentBox, candBox, direction);
      if (dist < shortestDistance) {
        shortestDistance = dist;
        bestCandidateId = cand.id;
      }
    }

    return bestCandidateId;
  }

  /**
   * Move focus in given direction
   */
  public move(direction: SpatialDirection): boolean {
    const nextId = this.findNextTarget(direction);
    if (nextId) {
      return this.setFocus(nextId, true);
    }
    return false;
  }

  /**
   * Trigger click / action on currently focused element
   */
  public selectCurrent(): boolean {
    if (!this.currentFocusId) return false;
    const node = this.nodes.get(this.currentFocusId);
    if (node?.element) {
      if (typeof node.element.click === 'function') {
        node.element.click();
        return true;
      }
    }
    return false;
  }

  private clearCurrentFocusVisual(): void {
    if (this.currentFocusId) {
      const prev = this.nodes.get(this.currentFocusId);
      if (prev?.element) {
        prev.element.removeAttribute('data-tv-focused');
      }
    }
  }

  private notifyListeners(id: string | null, zone: SpatialFocusZone): void {
    this.onFocusChangeListeners.forEach((cb) => {
      try {
        cb(id, zone);
      } catch (err) {
        console.error('Error in spatial navigation listener:', err);
      }
    });
  }
}

// Global shared singleton for spatial TV remote controller
export const spatialNav = new SpatialNavManager();
