/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { AppState, Channel, RemoteTheme, EpgSource, XtreamAccount, NowNextProgrammes } from '../types/iptv';
import { parseM3U } from '../utils/m3uParser';
import { buildCountrySections } from '../utils/channelEnrichment';
import { syncStorage, setSecureItem, getSecureItem, deleteSecureItem } from '../utils/secureStorage';
import {
  authenticateXtreamCodes,
  fetchXtreamCategories,
  fetchXtreamStreams,
  generateXtreamChannelList,
  fetchXtreamM3uChannels,
  fetchXtreamVodCategories,
  fetchXtreamVodStreams,
  generateXtreamVodChannelList,
  fetchXtreamSeriesCategories,
  fetchXtreamSeries,
  generateXtreamSeriesChannelList,
  parseXtreamUrl,
} from '../utils/xtreamClient';

const defaultTheme: RemoteTheme = {
  primaryColor: '#38bdf8',
  accentColor: '#818cf8',
  logoUrl: '',
};

// In-flight playlist loading promise to avoid duplicate concurrent fetches (Fix B3)
let activePlaylistPromise: Promise<void> | null = null;

export const usePlayerStore = create<AppState>((set, get) => ({
  channels: [],
  groups: [],
  favorites: syncStorage.getObject<string[]>('favorites', []),
  history: syncStorage.getObject<string[]>('history', []),
  currentPlayingChannel: syncStorage.getObject<Channel | null>('active_channel', null),
  isLoading: false,
  isEpgLoading: false,
  parseProgress: 0,
  error: null,
  playlistUrl: syncStorage.getString('playlistUrl', 'https://iptv-org.github.io/iptv/countries/us.m3u'),

  // Xtream Codes Account Management
  xtreamAccount: syncStorage.getObject<XtreamAccount | null>('active_xtream_account', null),
  savedXtreamAccounts: syncStorage.getObject<XtreamAccount[]>('saved_xtream_accounts', []),

  // Country & EPG Enhancements
  countrySections: [],
  selectedCountry: null,
  selectedGroup: null,
  selectedStreamType: 'all',
  searchTerm: '',
  epgSources: [
    { key: 'backend-live-epg', label: 'Global Live EPG Backbone', priority: 1, enabled: true },
    { key: 'licensed-primary', label: 'Primary Licensed Slices', priority: 2, enabled: true },
    { key: 'open-epg', label: 'Public XMLTV Aggregator', priority: 3, enabled: true }
  ],
  epgByChannel: {},
  epgOverrides: syncStorage.getObject<Record<string, string>>('epg_overrides', {}),

  setCurrentPlayingChannel: (channel: Channel | null) => {
    syncStorage.setObject('active_channel', channel);
    set({ currentPlayingChannel: channel });
    if (channel?.id) {
      get().addToHistory(channel.id);
    }
  },

  setSelectedCountry: (code: string | null) => set({ selectedCountry: code }),
  setSelectedGroup: (group: string | null) => set({ selectedGroup: group }),
  setSelectedStreamType: (type: 'all' | 'live' | 'vod' | 'series') => set({ selectedStreamType: type }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),

  loadMetadataBundle: async () => {
    let currentChannels = get().channels;
    if (!currentChannels || currentChannels.length === 0) {
      const activeXtream = get().xtreamAccount;
      if (activeXtream) {
        // Hydrate password from secure store if needed
        const securePass = await getSecureItem(`xtream_pwd_${activeXtream.username}_${activeXtream.serverUrl}`);
        const accountWithPass: XtreamAccount = {
          ...activeXtream,
          password: securePass || activeXtream.password,
        };
        await get().connectXtreamAccount(accountWithPass);
        currentChannels = get().channels;
      } else {
        await get().loadPlaylist();
        currentChannels = get().channels;
      }
    }
    if (!currentChannels || currentChannels.length === 0) return;

    const apiBase = process.env.EXPO_PUBLIC_API_URL || 'https://iptv.menu';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${apiBase}/api/channels/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: currentChannels.slice(0, 500) }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.channels) && data.channels.length > 0) {
          const merged = currentChannels.map((c, i) => data.channels[i] || c);
          const uniqueGroups = Array.from(new Set(merged.map((c) => c.group || 'General'))).sort();
          const sections = buildCountrySections(merged);
          set({
            channels: merged,
            groups: uniqueGroups,
            countrySections: sections
          });
          return;
        }
      }
    } catch (enrichErr) {
      // Local fallback
    }

    const sections = buildCountrySections(currentChannels);
    set({ countrySections: sections });
  },

  loadEpgBundle: async () => {
    let currentChannels = get().channels;
    if (!currentChannels || currentChannels.length === 0) {
      await get().loadPlaylist();
      currentChannels = get().channels;
    }

    if (currentChannels.length === 0) return;

    set({ isEpgLoading: true });
    const channelKeys = Array.from(
      new Set(
        currentChannels
          .map((c) => c.tvgId || c.epgChannelId || c.id)
          .filter(Boolean)
      )
    ).slice(0, 300); // Batch slice

    const apiBase = process.env.EXPO_PUBLIC_API_URL || 'https://iptv.menu';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Try POST batch first (prevents URL length overflow)
      const res = await fetch(`${apiBase}/api/epg/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelIds: channelKeys }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const liveData = await res.json();
        if (liveData && liveData.channels) {
          set({
            epgByChannel: liveData.channels,
            isEpgLoading: false,
          });
          return;
        }
      }
    } catch (epgErr) {
      // fallback
    }

    // Secondary fallback: query parameters
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${apiBase}/api/epg/live?channelIds=${encodeURIComponent(channelKeys.slice(0, 50).join(','))}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const liveData = await res.json();
        if (liveData && liveData.channels) {
          set({
            epgByChannel: liveData.channels,
            isEpgLoading: false,
          });
          return;
        }
      }
    } catch {}

    set({ isEpgLoading: false });
  },

  // Dynamic Remote OTA Configuration
  appConfigId: syncStorage.getString('appConfigId', process.env.EXPO_PUBLIC_APP_CONFIG_ID || '') || null,
  remoteVersion: parseInt(syncStorage.getString('remoteVersion', '0'), 10) || 0,
  announcement: syncStorage.getString('announcement', '') || null,
  theme: {
    primaryColor: syncStorage.getString('themePrimary', defaultTheme.primaryColor),
    accentColor: syncStorage.getString('themeAccent', defaultTheme.accentColor),
    logoUrl: syncStorage.getString('themeLogo', defaultTheme.logoUrl || ''),
  },

  setPlaylistUrl: (url: string) => {
    syncStorage.setString('playlistUrl', url);
    set({ playlistUrl: url });
  },

  connectXtreamAccount: async (account: XtreamAccount) => {
    set({ isLoading: true, error: null });
    try {
      const auth = await authenticateXtreamCodes(account);
      if (!auth.success) {
        set({ isLoading: false, error: auth.error || 'Authentication failed' });
        return { success: false, error: auth.error || 'Authentication failed' };
      }

      // Securely store the password in KeyStore / Keychain
      if (account.password) {
        await setSecureItem(`xtream_pwd_${account.username}_${account.serverUrl}`, account.password);
      }

      // Sanitize password before storing account object to disk
      const sanitizedAccount: XtreamAccount = {
        ...account,
        password: undefined, // Password protected in SecureStore
        userInfo: auth.userInfo,
        serverInfo: auth.serverInfo,
        name: account.name || auth.userInfo?.username || account.username,
      };

      const [
        categories,
        streams,
        vodCategories,
        vodStreams,
        seriesCategories,
        seriesItems,
      ] = await Promise.all([
        fetchXtreamCategories(account),
        fetchXtreamStreams(account),
        fetchXtreamVodCategories(account),
        fetchXtreamVodStreams(account),
        fetchXtreamSeriesCategories(account),
        fetchXtreamSeries(account),
      ]);

      let channels: Channel[] = [];
      if (streams && streams.length > 0) {
        channels = generateXtreamChannelList(account, streams, categories);
      } else {
        channels = await fetchXtreamM3uChannels(account);
      }

      // Merge VOD movies
      if (vodStreams && vodStreams.length > 0) {
        const vodChannels = generateXtreamVodChannelList(account, vodStreams, vodCategories);
        channels = [...channels, ...vodChannels];
      }

      // Merge TV series
      if (seriesItems && seriesItems.length > 0) {
        const seriesChannels = generateXtreamSeriesChannelList(account, seriesItems, seriesCategories);
        channels = [...channels, ...seriesChannels];
      }

      if (channels.length === 0) {
        set({ isLoading: false, error: 'No channels, movies, or series found in this Xtream account' });
        return { success: false, error: 'No channels, movies, or series found in this Xtream account' };
      }

      const uniqueGroups = Array.from(new Set(channels.map((c) => c.group))).sort();
      const countrySections = buildCountrySections(channels);

      const existing = get().savedXtreamAccounts.filter(
        (a) => !(a.serverUrl.toLowerCase() === account.serverUrl.toLowerCase() && a.username.toLowerCase() === account.username.toLowerCase())
      );
      const updatedSaved = [sanitizedAccount, ...existing];

      syncStorage.setObject('active_xtream_account', sanitizedAccount);
      syncStorage.setObject('saved_xtream_accounts', updatedSaved);

      set({
        channels,
        groups: uniqueGroups,
        countrySections,
        xtreamAccount: sanitizedAccount,
        savedXtreamAccounts: updatedSaved,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Connection failed' });
      return { success: false, error: err.message || 'Connection failed' };
    }
  },

  disconnectXtreamAccount: () => {
    syncStorage.delete('active_xtream_account');
    set({ xtreamAccount: null });
    get().loadPlaylist();
  },

  removeSavedAccount: (serverUrl: string, username: string) => {
    deleteSecureItem(`xtream_pwd_${username}_${serverUrl}`).catch(() => {});
    const updated = get().savedXtreamAccounts.filter(
      (a) => !(a.serverUrl.toLowerCase() === serverUrl.toLowerCase() && a.username.toLowerCase() === username.toLowerCase())
    );
    syncStorage.setObject('saved_xtream_accounts', updated);
    set({ savedXtreamAccounts: updated });
  },

  loadPlaylist: async (customUrl?: string) => {
    if (activePlaylistPromise) {
      return activePlaylistPromise;
    }

    const run = async () => {
      const rawUrl = customUrl || get().playlistUrl;
      const parsedXtream = parseXtreamUrl(rawUrl);
      const url = (parsedXtream.isXtream && parsedXtream.m3uUrl) ? parsedXtream.m3uUrl : rawUrl;

      set({ isLoading: true, parseProgress: 0, error: null });

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP status ${response.status}`);
        let m3uText = await response.text();

        if (!m3uText.includes('#EXTM3U') && m3uText.includes('#EXTINF:')) {
          m3uText = '#EXTM3U\n' + m3uText;
        }

        const parsedChannels = parseM3U(m3uText, {
          onProgress: (progress) => set({ parseProgress: progress }),
        });

        const uniqueGroups = Array.from(new Set(parsedChannels.map((c) => c.group))).sort();
        const countrySections = buildCountrySections(parsedChannels);

        set({
          channels: parsedChannels,
          groups: uniqueGroups,
          countrySections,
          isLoading: false,
          parseProgress: 100,
        });
      } catch (err: any) {
        console.warn('Playlist fetch failed, loading default fallback list', err);
        const fallbackChannels: Channel[] = [
          {
            id: 'fb-bloomberg',
            name: 'Bloomberg TV Live',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Bloomberg_News_logo.svg/320px-Bloomberg_News_logo.svg.png',
            url: 'https://live-bloomberg-us.akamaized.net/hls/live/2042971/bloomberg_us/master.m3u8',
            group: 'News',
            tvgId: 'bloomberg.us',
            isLive: true,
          },
          {
            id: 'fb-redbull',
            name: 'Red Bull TV',
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Red_Bull_TV_logo.svg/320px-Red_Bull_TV_logo.svg.png',
            url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
            group: 'Sports',
            tvgId: 'redbull.sports',
            isLive: true,
          },
          {
            id: 'fb-nasa',
            name: 'NASA TV Live',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/320px-NASA_logo.svg.png',
            url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
            group: 'Documentary',
            tvgId: 'nasa.live',
            isLive: true,
          }
        ];
        const countrySections = buildCountrySections(fallbackChannels);
        set({
          channels: fallbackChannels,
          groups: ['Documentary', 'News', 'Sports'],
          countrySections,
          isLoading: false,
          error: null,
        });
      } finally {
        activePlaylistPromise = null;
      }
    };

    activePlaylistPromise = run();
    return activePlaylistPromise;
  },

  syncRemoteConfig: async (customAppId?: string) => {
    const targetId = customAppId || get().appConfigId || process.env.EXPO_PUBLIC_APP_CONFIG_ID;
    if (!targetId) {
      if (get().channels.length === 0) {
        await get().loadPlaylist();
      }
      return;
    }

    const apiBase = process.env.EXPO_PUBLIC_API_URL || 'https://iptv.menu';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${apiBase}/api/v1/apps/${targetId}/config`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const config = await res.json().catch(() => null);
        if (!config) return;

        const currentVersion = get().remoteVersion;
        const currentUrl = get().playlistUrl;
        const newVersion = typeof config.version === 'number' ? config.version : currentVersion;
        const newPlaylistUrl = config.playlistUrl || currentUrl;
        const newTheme: RemoteTheme = {
          primaryColor: config.theme?.primaryColor || get().theme.primaryColor,
          accentColor: config.theme?.accentColor || get().theme.accentColor,
          logoUrl: config.theme?.logoUrl || get().theme.logoUrl,
        };
        const newAnnouncement = config.announcement || null;

        syncStorage.setString('appConfigId', targetId);
        syncStorage.setString('remoteVersion', String(newVersion));
        syncStorage.setString('playlistUrl', newPlaylistUrl);
        if (newAnnouncement) syncStorage.setString('announcement', newAnnouncement);
        else syncStorage.delete('announcement');
        syncStorage.setString('themePrimary', newTheme.primaryColor);
        syncStorage.setString('themeAccent', newTheme.accentColor);
        if (newTheme.logoUrl) syncStorage.setString('themeLogo', newTheme.logoUrl);

        set({
          appConfigId: targetId,
          remoteVersion: newVersion,
          announcement: newAnnouncement,
          theme: newTheme,
          playlistUrl: newPlaylistUrl,
        });

        if (newPlaylistUrl !== currentUrl || get().channels.length === 0) {
          await get().loadPlaylist(newPlaylistUrl);
        }
        return;
      }
    } catch {}

    if (get().channels.length === 0) {
      await get().loadPlaylist();
    }
  },

  setCustomEpgOverride: (channelId: string, tvgId: string) => {
    const current = get().epgOverrides || {};
    const updated = { ...current, [channelId]: tvgId.trim() };
    syncStorage.setObject('epg_overrides', updated);
    set({ epgOverrides: updated });
  },

  removeCustomEpgOverride: (channelId: string) => {
    const current = { ...(get().epgOverrides || {}) };
    delete current[channelId];
    syncStorage.setObject('epg_overrides', current);
    set({ epgOverrides: current });
  },

  dismissAnnouncement: () => {
    syncStorage.delete('announcement');
    set({ announcement: null });
  },

  toggleFavorite: (channelId: string) => {
    const { favorites } = get();
    const newFavorites = favorites.includes(channelId)
      ? favorites.filter((id) => id !== channelId)
      : [...favorites, channelId];

    syncStorage.setObject('favorites', newFavorites);
    set({ favorites: newFavorites });
  },

  addToHistory: (channelId: string) => {
    const { history } = get();
    const filteredHistory = history.filter((id) => id !== channelId);
    const newHistory = [channelId, ...filteredHistory].slice(0, 30);

    syncStorage.setObject('history', newHistory);
    set({ history: newHistory });
  },

  clearHistory: () => {
    syncStorage.setObject('history', []);
    set({ history: [] });
  },

  clearCache: () => {
    syncStorage.clear();
    set({ favorites: [], history: [], appConfigId: null, remoteVersion: 0, announcement: null });
  },
}));