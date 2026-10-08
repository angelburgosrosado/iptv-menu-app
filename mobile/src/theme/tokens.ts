/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Platform, Dimensions } from 'react-native';

export const PALETTE = {
  // Midnight Glass Foundations
  bgBase: '#07090e',
  bgSurface: '#0d111a',
  bgElevated: '#141a26',
  bgCard: 'rgba(20, 26, 38, 0.75)',

  // Glassmorphic Fills & Borders
  glassFill: 'rgba(22, 28, 42, 0.65)',
  glassFillHover: 'rgba(32, 41, 60, 0.85)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderActive: 'rgba(56, 189, 248, 0.35)',

  // Accents
  primary: '#38bdf8',       // Sky neon
  primaryDark: '#0284c7',
  accentPurple: '#818cf8',  // Indigo neon
  accentLive: '#f43f5e',    // Live red beacon
  accentSuccess: '#10b981', // Emerald confirmation
  accentWarning: '#f59e0b', // Amber alert

  // High-Contrast Typography
  textPrimary: '#f8fafc',   // 98% white
  textSecondary: '#cbd5e1', // 80% slate
  textMuted: '#94a3b8',     // 60% slate
  textDim: '#64748b',       // 45% dark slate

  // TV 10-foot Focus & Interaction States
  focusRing: '#38bdf8',
  focusGlow: 'rgba(56, 189, 248, 0.45)',
  focusBg: 'rgba(56, 189, 248, 0.12)',
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
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 18,
    elevation: 12,
  },
};
