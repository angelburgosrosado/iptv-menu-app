/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { AdSenseConfig, AdSenseSlotConfig } from '../types/iptv';
import { fetchWithAuth } from '../lib/apiClient';

const getApiUrl = (path: string) => {
  if (typeof window !== 'undefined') {
    return path;
  }
  const port = process.env.PORT || '3001';
  return `http://localhost:${port}${path}`;
};

interface AdSenseStoreState {
  enabled: boolean;
  clientId: string;
  testMode: boolean;
  autoAdsEnabled: boolean;
  slots: AdSenseSlotConfig;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Actions
  fetchConfig: () => Promise<void>;
  updateConfig: (updates: Partial<AdSenseConfig>) => Promise<{ success: boolean; error?: string }>;
  syncScriptTag: (clientId: string) => void;
}

const DEFAULT_SLOTS: AdSenseSlotConfig = {
  topBannerSlot: '8849201938',
  bottomBannerSlot: '9938102948',
  sidebarSlot: '7748192031',
  channelListSlot: '6638192042',
  playerOverlaySlot: '5529102831'
};

const DEFAULT_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-1578853238313624';

export const useAdSenseStore = create<AdSenseStoreState>((set, get) => ({
  enabled: false,
  clientId: DEFAULT_CLIENT_ID,
  testMode: false,
  autoAdsEnabled: false,
  slots: DEFAULT_SLOTS,
  isLoading: false,
  isSaving: false,
  error: null,
  lastUpdated: null,

  syncScriptTag: (clientId: string) => {
    if (typeof document === 'undefined' || !clientId) return;
    const existing = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
    const targetSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;

    if (existing) {
      if (existing.getAttribute('src') !== targetSrc) {
        existing.setAttribute('src', targetSrc);
      }
    } else {
      const script = document.createElement('script');
      script.async = true;
      script.src = targetSrc;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  },

  fetchConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(getApiUrl('/api/public/adsense'));
      if (res.ok) {
        const data = await res.json();
        const client = data.clientId || DEFAULT_CLIENT_ID;
        set({
          enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
          clientId: client,
          testMode: Boolean(data.testMode),
          autoAdsEnabled: Boolean(data.autoAdsEnabled),
          slots: {
            ...DEFAULT_SLOTS,
            ...(data.slots || {})
          },
          lastUpdated: data.updatedAt || null,
          isLoading: false
        });

        // Ensure script tag matches active client ID
        get().syncScriptTag(client);
        return;
      }
    } catch (err: any) {
      console.warn('AdSense public config fetch notice:', err.message);
    }
    set({ isLoading: false });
  },

  updateConfig: async (updates) => {
    set({ isSaving: true, error: null });
    try {
      const res = await fetchWithAuth('/api/admin/adsense', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (res && res.success && res.config) {
        const c = res.config;
        set({
          enabled: c.enabled,
          clientId: c.clientId,
          testMode: c.testMode,
          autoAdsEnabled: c.autoAdsEnabled,
          slots: {
            ...DEFAULT_SLOTS,
            ...(c.slots || {})
          },
          lastUpdated: c.updatedAt,
          isSaving: false
        });

        get().syncScriptTag(c.clientId);
        return { success: true };
      }
      throw new Error(res?.error || 'Failed to update AdSense configuration');
    } catch (err: any) {
      const errMsg = err.message || 'Error updating AdSense configuration';
      set({ error: errMsg, isSaving: false });
      return { success: false, error: errMsg };
    }
  }
}));

// Eagerly fetch public config in browser environment
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useAdSenseStore.getState().fetchConfig();
  }, 100);
}
