/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Platform, Dimensions } from 'react-native';

export const PALETTE = {
  // Midnight Glass Foundations (Streamly 2026)
  bgBase: '#06070b',
  bgSurface: '#0b0d14',
  bgElevated: '#11141c',
  bgCard: 'rgba(17, 20, 28, 0.78)',

  // Glassmorphic Fills & Borders
  glassFill: 'rgba(17, 20, 28, 0.65)',
  glassFillHover: 'rgba(28, 33, 46, 0.85)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderActive: 'rgba(124, 92, 255, 0.45)',

  // Accents (Streamly Electric Violet & Neon Teal)
  primary: '#7c5cff',       // Electric Violet
  primaryDark: '#5a36ea',
  accentNeon: '#00e0c6',    // Cyan Teal
  accentPurple: '#a78bfa',  // Soft Violet
  accentLive: '#ef4444',    // Live red beacon
  accentSuccess: '#10b981', // Emerald confirmation
  accentWarning: '#f59e0b', // Amber alert

  // High-Contrast Typography
  textPrimary: '#f8fafc',   // 98% white
  textSecondary: '#cbd5e1', // 80% slate
  textMuted: '#94a3b8',     // 60% slate
  textDim: '#64748b',       // 45% dark slate

  // TV 10-foot Focus & Interaction States
  focusRing: '#7c5cff',
  focusGlow: 'rgba(124, 92, 255, 0.55)',
  focusBg: 'rgba(124, 92, 255, 0.15)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const RADII = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 9999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  focusGlow: {
    shadowColor: '#7c5cff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 18,
    elevation: 12,
  },
};
