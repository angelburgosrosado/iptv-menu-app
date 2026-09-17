/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePlayerStore } from '../src/store/usePlayerStore';
import {
  DEFAULT_SUBTITLE_CONFIG,
  SUBTITLE_PRESETS,
  FONT_SIZE_MAP,
  TEXT_COLOR_MAP,
  EDGE_STYLE_MAP,
  FONT_FAMILY_MAP,
  generateCueCss,
  applySubtitleStylesToDom,
  formatSyncOffset,
  clampSyncOffset
} from '../src/utils/subtitleEngine';

describe('Phase 25: Multi-Language Subtitle & Closed Caption Customization Engine', () => {
  beforeEach(() => {
    usePlayerStore.getState().resetSubtitleConfig();
  });

  describe('Default Configuration and Constants', () => {
    it('should provide standard broadcast defaults in DEFAULT_SUBTITLE_CONFIG', () => {
      expect(DEFAULT_SUBTITLE_CONFIG).toEqual({
        isEnabled: true,
        preset: 'broadcast',
        fontSize: 'medium',
        textColor: 'white',
        bgOpacity: 50,
        edgeStyle: 'dropshadow',
        fontFamily: 'sans',
        syncOffsetMs: 0
      });
    });

    it('should contain all 4 standard industry presets with distinct styling', () => {
      expect(SUBTITLE_PRESETS.broadcast).toBeDefined();
      expect(SUBTITLE_PRESETS.cinema).toBeDefined();
      expect(SUBTITLE_PRESETS.teletext).toBeDefined();
      expect(SUBTITLE_PRESETS.minimal).toBeDefined();

      expect(SUBTITLE_PRESETS.broadcast.textColor).toBe('white');
      expect(SUBTITLE_PRESETS.broadcast.bgOpacity).toBe(50);
      expect(SUBTITLE_PRESETS.broadcast.edgeStyle).toBe('dropshadow');

      expect(SUBTITLE_PRESETS.cinema.textColor).toBe('yellow');
      expect(SUBTITLE_PRESETS.cinema.edgeStyle).toBe('outline');
      expect(SUBTITLE_PRESETS.cinema.fontSize).toBe('large');

      expect(SUBTITLE_PRESETS.teletext.textColor).toBe('cyan');
      expect(SUBTITLE_PRESETS.teletext.fontFamily).toBe('mono');
      expect(SUBTITLE_PRESETS.teletext.bgOpacity).toBe(100);

      expect(SUBTITLE_PRESETS.minimal.bgOpacity).toBe(0);
      expect(SUBTITLE_PRESETS.minimal.edgeStyle).toBe('outline');
    });

    it('should correctly map all font size tiers to pixel sizes and scale ratios', () => {
      expect(FONT_SIZE_MAP.small.px).toBe('15px');
      expect(FONT_SIZE_MAP.small.scale).toBe(0.85);
      expect(FONT_SIZE_MAP.medium.px).toBe('20px');
      expect(FONT_SIZE_MAP.medium.scale).toBe(1.0);
      expect(FONT_SIZE_MAP.large.px).toBe('28px');
      expect(FONT_SIZE_MAP.large.scale).toBe(1.3);
      expect(FONT_SIZE_MAP.xlarge.px).toBe('36px');
      expect(FONT_SIZE_MAP.xlarge.scale).toBe(1.6);
    });

    it('should map high-contrast text color palettes with compliant hex values', () => {
      expect(TEXT_COLOR_MAP.white.hex).toBe('#ffffff');
      expect(TEXT_COLOR_MAP.yellow.hex).toBe('#fde047');
      expect(TEXT_COLOR_MAP.cyan.hex).toBe('#38bdf8');
      expect(TEXT_COLOR_MAP.green.hex).toBe('#4ade80');
    });

    it('should define edge text-shadow styling for contrast enhancement', () => {
      expect(EDGE_STYLE_MAP.none.shadow).toBe('none');
      expect(EDGE_STYLE_MAP.dropshadow.shadow).toContain('rgba(0, 0, 0, 0.95)');
      expect(EDGE_STYLE_MAP.outline.shadow).toContain('rgba(0,0,0,0.9)');
      expect(EDGE_STYLE_MAP.raised.shadow).toBeDefined();
    });

    it('should map typography options to web-safe CSS font stacks', () => {
      expect(FONT_FAMILY_MAP.sans.css).toContain('sans-serif');
      expect(FONT_FAMILY_MAP.serif.css).toContain('serif');
      expect(FONT_FAMILY_MAP.mono.css).toContain('monospace');
    });
  });

  describe('generateCueCss', () => {
    it('should produce standard video::cue rules matching the provided configuration', () => {
      const css = generateCueCss(DEFAULT_SUBTITLE_CONFIG);
      expect(css).toContain('video::cue {');
      expect(css).toContain('font-size: 20px !important;');
      expect(css).toContain('color: #ffffff !important;');
      expect(css).toContain('background-color: rgba(0, 0, 0, 0.50) !important;');
      expect(css).toContain('font-family: \'Inter\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif !important;');
    });

    it('should return hidden visibility rules when isEnabled is false', () => {
      const css = generateCueCss({
        ...DEFAULT_SUBTITLE_CONFIG,
        isEnabled: false
      });
      expect(css).toContain('visibility: hidden !important;');
      expect(css).toContain('opacity: 0 !important;');
    });

    it('should format custom color, font size, and edge shadow in generated CSS', () => {
      const customConfig = {
        isEnabled: true,
        preset: 'custom' as const,
        fontSize: 'large' as const,
        textColor: 'yellow' as const,
        bgOpacity: 75 as const,
        edgeStyle: 'outline' as const,
        fontFamily: 'mono' as const,
        syncOffsetMs: 250
      };
      const css = generateCueCss(customConfig);
      expect(css).toContain('color: #fde047 !important;');
      expect(css).toContain('background-color: rgba(0, 0, 0, 0.75) !important;');
      expect(css).toContain('font-size: 28px !important;');
      expect(css).toContain('font-family: \'SF Mono\', Menlo, Monaco, Consolas, monospace !important;');
      expect(css).toContain(EDGE_STYLE_MAP.outline.shadow);
    });
  });

  describe('Timing Sync Offset & Clamping Utilities', () => {
    it('should clamp values outside the [-5000, 5000] milliseconds boundary', () => {
      expect(clampSyncOffset(-9000)).toBe(-5000);
      expect(clampSyncOffset(9000)).toBe(5000);
      expect(clampSyncOffset(0)).toBe(0);
      expect(clampSyncOffset(2500)).toBe(2500);
    });

    it('should snap non-aligned offsets to the nearest 250ms interval step and avoid -0', () => {
      expect(clampSyncOffset(120)).toBe(0);
      expect(clampSyncOffset(130)).toBe(250);
      expect(clampSyncOffset(390)).toBe(500);
      expect(clampSyncOffset(-380)).toBe(-500);
      expect(clampSyncOffset(-120)).toBe(0);
      expect(Object.is(clampSyncOffset(-120), -0)).toBe(false);
    });

    it('should format human-readable sync offset status strings', () => {
      expect(formatSyncOffset(0)).toBe('0 ms (In Sync)');
      expect(formatSyncOffset(500)).toBe('+500 ms (+0.50s Delayed)');
      expect(formatSyncOffset(1250)).toBe('+1250 ms (+1.25s Delayed)');
      expect(formatSyncOffset(-750)).toBe('-750 ms (-0.75s Ahead)');
      expect(formatSyncOffset(-2500)).toBe('-2500 ms (-2.50s Ahead)');
    });
  });

  describe('applySubtitleStylesToDom', () => {
    let originalDocument: any;

    beforeEach(() => {
      originalDocument = (globalThis as any).document;
    });

    afterEach(() => {
      (globalThis as any).document = originalDocument;
    });

    it('should gracefully no-op when document is undefined (SSR)', () => {
      (globalThis as any).document = undefined;
      expect(() => applySubtitleStylesToDom(DEFAULT_SUBTITLE_CONFIG)).not.toThrow();
    });

    it('should inject style#iptv-custom-subtitle-styles into document head and update in-place', () => {
      let existingStyle: any = null;
      const headAppended: any[] = [];

      (globalThis as any).document = {
        getElementById: vi.fn((id: string) => {
          return id === 'iptv-custom-subtitle-styles' ? existingStyle : null;
        }),
        createElement: vi.fn((tagName: string) => {
          return { id: '', tagName: tagName.toUpperCase(), textContent: '' };
        }),
        head: {
          appendChild: vi.fn((node: any) => {
            headAppended.push(node);
            existingStyle = node;
            return node;
          })
        }
      };

      applySubtitleStylesToDom(DEFAULT_SUBTITLE_CONFIG);

      expect(globalThis.document.createElement).toHaveBeenCalledWith('style');
      expect(globalThis.document.head.appendChild).toHaveBeenCalled();
      expect(existingStyle.id).toBe('iptv-custom-subtitle-styles');
      expect(existingStyle.textContent).toContain('video::cue');
      expect(existingStyle.textContent).toContain('color: #ffffff !important;');

      // Second call should update textContent on the existing style element without appending new node
      applySubtitleStylesToDom({
        ...DEFAULT_SUBTITLE_CONFIG,
        textColor: 'yellow'
      });

      expect(headAppended.length).toBe(1);
      expect(existingStyle.textContent).toContain('color: #fde047 !important;');
    });
  });

  describe('Zustand Player Store Subtitle Actions', () => {
    it('should initialize with default subtitleConfig in player store', () => {
      const store = usePlayerStore.getState();
      expect(store.subtitleConfig).toEqual(DEFAULT_SUBTITLE_CONFIG);
    });

    it('should allow partial updates to subtitle appearance settings via setSubtitleConfig', () => {
      const store = usePlayerStore.getState();
      store.setSubtitleConfig({
        fontSize: 'xlarge',
        textColor: 'cyan',
        bgOpacity: 100
      });

      const updated = usePlayerStore.getState().subtitleConfig;
      expect(updated.fontSize).toBe('xlarge');
      expect(updated.textColor).toBe('cyan');
      expect(updated.bgOpacity).toBe(100);
      expect(updated.edgeStyle).toBe(DEFAULT_SUBTITLE_CONFIG.edgeStyle);
      expect(updated.fontFamily).toBe(DEFAULT_SUBTITLE_CONFIG.fontFamily);
    });

    it('should switch settings to predefined presets via setSubtitlePreset while preserving sync offset', () => {
      const store = usePlayerStore.getState();
      store.setSubtitleSyncOffset(750);
      store.setSubtitlePreset('cinema');

      const updated = usePlayerStore.getState().subtitleConfig;
      expect(updated.preset).toBe('cinema');
      expect(updated.textColor).toBe('yellow');
      expect(updated.edgeStyle).toBe('outline');
      expect(updated.fontSize).toBe('large');
      expect(updated.syncOffsetMs).toBe(750); // Preserved
    });

    it('should clamp and set sync timing offset via setSubtitleSyncOffset', () => {
      const store = usePlayerStore.getState();
      store.setSubtitleSyncOffset(1240); // should round to 1250

      expect(usePlayerStore.getState().subtitleConfig.syncOffsetMs).toBe(1250);

      store.setSubtitleSyncOffset(-10000); // should clamp to -5000
      expect(usePlayerStore.getState().subtitleConfig.syncOffsetMs).toBe(-5000);
    });

    it('should reset all subtitle configurations to default via resetSubtitleConfig', () => {
      const store = usePlayerStore.getState();
      store.setSubtitleConfig({
        fontSize: 'small',
        textColor: 'green',
        bgOpacity: 0,
        syncOffsetMs: -1500
      });

      expect(usePlayerStore.getState().subtitleConfig.textColor).toBe('green');

      store.resetSubtitleConfig();
      expect(usePlayerStore.getState().subtitleConfig).toEqual(DEFAULT_SUBTITLE_CONFIG);
    });
  });
});
