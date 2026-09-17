/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  SubtitleConfig, 
  SubtitlePreset, 
  SubtitleFontSize, 
  SubtitleTextColor, 
  SubtitleEdgeStyle, 
  SubtitleFontFamily 
} from '../types/iptv';

export const DEFAULT_SUBTITLE_CONFIG: SubtitleConfig = {
  isEnabled: true,
  preset: 'broadcast',
  fontSize: 'medium',
  textColor: 'white',
  bgOpacity: 50,
  edgeStyle: 'dropshadow',
  fontFamily: 'sans',
  syncOffsetMs: 0,
};

export const SUBTITLE_PRESETS: Record<Exclude<SubtitlePreset, 'custom'>, Omit<SubtitleConfig, 'isEnabled' | 'preset' | 'syncOffsetMs'>> = {
  broadcast: {
    fontSize: 'medium',
    textColor: 'white',
    bgOpacity: 50,
    edgeStyle: 'dropshadow',
    fontFamily: 'sans',
  },
  cinema: {
    fontSize: 'large',
    textColor: 'yellow',
    bgOpacity: 75,
    edgeStyle: 'outline',
    fontFamily: 'sans',
  },
  teletext: {
    fontSize: 'medium',
    textColor: 'cyan',
    bgOpacity: 100,
    edgeStyle: 'none',
    fontFamily: 'mono',
  },
  minimal: {
    fontSize: 'medium',
    textColor: 'white',
    bgOpacity: 0,
    edgeStyle: 'outline',
    fontFamily: 'sans',
  },
};

export const FONT_SIZE_MAP: Record<SubtitleFontSize, { label: string; px: string; scale: number }> = {
  small: { label: 'Small', px: '15px', scale: 0.85 },
  medium: { label: 'Medium', px: '20px', scale: 1.0 },
  large: { label: 'Large', px: '28px', scale: 1.3 },
  xlarge: { label: 'Extra Large', px: '36px', scale: 1.6 },
};

export const TEXT_COLOR_MAP: Record<SubtitleTextColor, { label: string; hex: string }> = {
  white: { label: 'White', hex: '#ffffff' },
  yellow: { label: 'Cinema Yellow', hex: '#fde047' },
  cyan: { label: 'Electric Cyan', hex: '#38bdf8' },
  green: { label: 'High-Vis Green', hex: '#4ade80' },
};

export const EDGE_STYLE_MAP: Record<SubtitleEdgeStyle, { label: string; shadow: string }> = {
  none: { label: 'None', shadow: 'none' },
  dropshadow: { label: 'Drop Shadow', shadow: '2px 2px 4px rgba(0, 0, 0, 0.95)' },
  raised: { label: 'Raised', shadow: '-1px -1px 0px rgba(0, 0, 0, 0.8), 1px 1px 0px rgba(255, 255, 255, 0.4)' },
  outline: { 
    label: 'Heavy Outline', 
    shadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 6px rgba(0,0,0,0.9)' 
  },
};

export const FONT_FAMILY_MAP: Record<SubtitleFontFamily, { label: string; css: string }> = {
  sans: { label: 'Sans-Serif', css: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  serif: { label: 'Serif', css: "Georgia, Cambria, 'Times New Roman', serif" },
  mono: { label: 'Monospace', css: "'SF Mono', Menlo, Monaco, Consolas, monospace" },
};

/**
 * Format subtitle sync offset into a human readable description
 */
export function formatSyncOffset(offsetMs: number): string {
  if (offsetMs === 0) return '0 ms (In Sync)';
  const seconds = (Math.abs(offsetMs) / 1000).toFixed(2);
  if (offsetMs > 0) {
    return `+${offsetMs} ms (+${seconds}s Delayed)`;
  }
  return `${offsetMs} ms (-${seconds}s Ahead)`;
}

/**
 * Clamp subtitle sync offset within standard [-5000ms, +5000ms] range
 */
export function clampSyncOffset(offsetMs: number): number {
  const rounded = Math.round(offsetMs / 250) * 250;
  const clamped = Math.max(-5000, Math.min(5000, rounded));
  return Object.is(clamped, -0) || clamped === 0 ? 0 : clamped;
}

/**
 * Generate CSS rules for video cue pseudo-element
 */
export function generateCueCss(config: SubtitleConfig): string {
  if (!config.isEnabled) {
    return `
      video::cue {
        visibility: hidden !important;
        opacity: 0 !important;
      }
    `;
  }

  const fontSize = FONT_SIZE_MAP[config.fontSize]?.px || '20px';
  const color = TEXT_COLOR_MAP[config.textColor]?.hex || '#ffffff';
  const bgColor = `rgba(0, 0, 0, ${(config.bgOpacity / 100).toFixed(2)})`;
  const textShadow = EDGE_STYLE_MAP[config.edgeStyle]?.shadow || 'none';
  const fontFamily = FONT_FAMILY_MAP[config.fontFamily]?.css || 'sans-serif';

  return `
    video::cue {
      font-size: ${fontSize} !important;
      color: ${color} !important;
      background-color: ${bgColor} !important;
      text-shadow: ${textShadow} !important;
      font-family: ${fontFamily} !important;
      line-height: 1.4 !important;
      white-space: pre-wrap !important;
    }
  `;
}

/**
 * Inject or update the dynamic subtitle CSS style tag into DOM head
 */
export function applySubtitleStylesToDom(config: SubtitleConfig): void {
  if (typeof document === 'undefined') return;

  const styleId = 'iptv-custom-subtitle-styles';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = generateCueCss(config);
}
