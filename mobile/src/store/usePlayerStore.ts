import { create } from 'zustand';
import { AppState, Channel, RemoteTheme, EpgSource, XtreamAccount } from '../types/iptv';
import { parseM3U } from '../utils/m3uParser';
import { buildCountrySections } from '../utils/channelEnrichment';
import {
  authenticateXtreamCodes,
  fetchXtreamCategories,
  fetchXtreamStreams,
  generateXtreamChannelList,
  fetchXtreamM3uChannels
} from '../utils/xtreamClient';

let storage: any = null;
try {
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV({ id: 'iptv_user_storage_v1' });
} catch (e) {
  console.warn('MMKV native module unavailable, falling back to memory store', e);
}

const memoryStore = new Map<string, string>();

const readArrayFromStorage = (key: string): string[] => {
  try {
    const json = storage ? storage.getString(key) : memoryStore.get(key);
    if (!json) return [];
    return JSON.parse(json);
  } catch {
    return [];
  }
};

const writeArrayToStorage = (key: string, data: string[]): void => {
  try {
    const val = JSON.stringify(data);
    if (storage) {
      storage.set(key, val);
    } else {
      memoryStore.set(key, val);
    }
  } catch (err) {
    console.warn('Storage write failed', err);
  }
};

const readObjectFromStorage = <T>(key: string, defaultVal: T): T => {
  try {
    const json = storage ? storage.getString(key) : memoryStore.get(key);
    if (!json) return defaultVal;
    return JSON.parse(json);
  } catch {
    return defaultVal;
  }
};

const writeObjectToStorage = (key: string, data: any): void => {
  try {
    const val = JSON.stringify(data);
    if (storage) {
      storage.set(key, val);
    } else {
      memoryStore.set(key, val);
    }
  } catch (err) {
    console.warn('Storage write failed', err);
  }
};

const getStoredString = (key: string, defaultVal: string): string => {
  try {
    if (storage) return storage.getString(key) || defaultVal;
    return memoryStore.get(key) || defaultVal;
  } catch {
    return defaultVal;
  }
};

const defaultTheme: RemoteTheme = {
  primaryColor: '#6366F1',
  accentColor: '#10B981',
  logoUrl: '',
};

export const usePlayerStore = create<AppState>((set, get) => ({
  channels: [],
  groups: [],
  favorites: readArrayFromStorage('favorites'),
  history: readArrayFromStorage('history'),
  isLoading: false,
  parseProgress: 0,
  error: null,
  playlistUrl: getStoredString('playlistUrl', 'https://iptv-org.github.io/iptv/countries/us.m3u'),

  // Xtream Codes Account Management
  xtreamAccount: readObjectFromStorage<XtreamAccount | null>('active_xtream_account', null),
  savedXtreamAccounts: readObjectFromStorage<XtreamAccount[]>('saved_xtream_accounts', []),

  // Country & EPG Backbone enhancements
  countrySections: [],
  selectedCountry: null,
  selectedGroup: null,
  searchTerm: '',
  epgSources: [
    { key: 'licensed-primary', label: 'Licensed Primary Feed', priority: 1, enabled: true },
    { key: 'open-epg', label: 'Public XMLTV Aggregator', priority: 2, enabled: true },
    { key: 'community-country-feeds', label: 'Community Country Feeds', priority: 3, enabled: true }
  ],
  epgByChannel: {},

  setSelectedCountry: (code: string | null) => set({ selectedCountry: code }),
  setSelectedGroup: (group: string | null) => set({ selectedGroup: group }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),

  loadMetadataBundle: async () => {
    let currentChannels = get().channels;
    if (!currentChannels || currentChannels.length === 0) {
      const activeXtream = get().xtreamAccount;
      if (activeXtream) {
        await get().connectXtreamAccount(activeXtream);
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
        body: JSON.stringify({ channels: currentChannels }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.channels) && data.channels.length > 0) {
          const uniqueGroups = Array.from(new Set(data.channels.map((c: any) => c.group || 'General'))).sort() as string[];
          const sections = buildCountrySections(data.channels);
          set({
            channels: data.channels,
            groups: uniqueGroups,
            countrySections: sections
          });
          return;
        }
      }
    } catch (enrichErr) {
      console.warn('Backend channel enrichment unavailable on mobile, using local matching', enrichErr);
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

    const channelKeys = Array.from(
      new Set(
        currentChannels
          .map((c) => c.tvgId || c.epgChannelId || c.id)
          .filter(Boolean)
      )
    );

    const apiBase = process.env.EXPO_PUBLIC_API_URL || 'https://iptv.menu';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${apiBase}/api/epg/live?channelIds=${encodeURIComponent(channelKeys.join(','))}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const liveData = await res.json();
        if (liveData && liveData.channels) {
          const formattedMap: Record<string, any[]> = {};
          for (const [key, prog] of Object.entries(liveData.channels as Record<string, any>)) {
            const list: any[] = [];
            if (prog.now) list.push(prog.now);
            if (prog.next) list.push(prog.next);
            formattedMap[key] = list;
          }

          set({
            epgSources: [
              { key: 'backend-live-epg', label: 'Backend Live Sliced Feed', priority: 1, enabled: true },
              { key: 'licensed-primary', label: 'Licensed Primary Feed', priority: 2, enabled: true },
              { key: 'open-epg', label: 'Public XMLTV Aggregator', priority: 3, enabled: true }
            ],
            epgByChannel: formattedMap
          });
          return;
        }
      }
    } catch (epgErr) {
      console.warn('Backend live EPG unavailable on mobile, utilizing local schedule', epgErr);
    }

    const epgMap: Record<string, any[]> = {};
    for (const c of currentChannels) {
      const channelKey = c.tvgId || c.epgChannelId || c.id;
      epgMap[channelKey] = [
        {
          title: `${c.name} Live Broadcast`,
          start: new Date().toISOString(),
          stop: new Date(Date.now() + 3600000).toISOString()
        }
      ];
    }
    set({
      epgSources: [
        { key: 'licensed-primary', label: 'Licensed Primary Feed', priority: 1, enabled: true },
        { key: 'open-epg', label: 'Public XMLTV Aggregator', priority: 2, enabled: true },
        { key: 'community-country-feeds', label: 'Community Country Feeds', priority: 3, enabled: true }
      ],
      epgByChannel: epgMap
    });
  },

  // Dynamic Remote OTA Configuration
  appConfigId: getStoredString('appConfigId', process.env.EXPO_PUBLIC_APP_CONFIG_ID || '') || null,
  remoteVersion: parseInt(getStoredString('remoteVersion', '0'), 10) || 0,
  announcement: getStoredString('announcement', '') || null,
  theme: {
    primaryColor: getStoredString('themePrimary', defaultTheme.primaryColor),
    accentColor: getStoredString('themeAccent', defaultTheme.accentColor),
    logoUrl: getStoredString('themeLogo', defaultTheme.logoUrl || ''),
  },

  setPlaylistUrl: (url: string) => {
    try {
      if (storage) storage.set('playlistUrl', url);
      else memoryStore.set('playlistUrl', url);
    } catch {}
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

      const verifiedAccount: XtreamAccount = {
        ...account,
        userInfo: auth.userInfo,
        serverInfo: auth.serverInfo,
        name: account.name || auth.userInfo?.username || account.username,
      };

      const [categories, streams] = await Promise.all([
        fetchXtreamCategories(verifiedAccount),
        fetchXtreamStreams(verifiedAccount)
      ]);

      let channels: Channel[] = [];
      if (streams && streams.length > 0) {
        channels = generateXtreamChannelList(verifiedAccount, streams, categories);
      } else {
        channels = await fetchXtreamM3uChannels(verifiedAccount);
      }

      if (channels.length === 0) {
        set({ isLoading: false, error: 'No channels found in this Xtream account' });
        return { success: false, error: 'No channels found in this Xtream account' };
      }

      const uniqueGroups = Array.from(new Set(channels.map((c) => c.group))).sort();
      const countrySections = buildCountrySections(channels);

      const existing = get().savedXtreamAccounts.filter(
        (a) => !(a.serverUrl.toLowerCase() === verifiedAccount.serverUrl.toLowerCase() && a.username.toLowerCase() === verifiedAccount.username.toLowerCase())
      );
      const updatedSaved = [verifiedAccount, ...existing];

      writeObjectToStorage('active_xtream_account', verifiedAccount);
      writeObjectToStorage('saved_xtream_accounts', updatedSaved);

      set({
        channels,
        groups: uniqueGroups,
        countrySections,
        xtreamAccount: verifiedAccount,
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
    try {
      if (storage) storage.delete('active_xtream_account');
      else memoryStore.delete('active_xtream_account');
    } catch {}
    set({ xtreamAccount: null });
    get().loadPlaylist();
  },

  removeSavedAccount: (serverUrl: string, username: string) => {
    const updated = get().savedXtreamAccounts.filter(
      (a) => !(a.serverUrl.toLowerCase() === serverUrl.toLowerCase() && a.username.toLowerCase() === username.toLowerCase())
    );
    writeObjectToStorage('saved_xtream_accounts', updated);
    set({ savedXtreamAccounts: updated });
  },

  loadPlaylist: async (customUrl?: string) => {
    const url = customUrl || get().playlistUrl;
    set({ isLoading: true, parseProgress: 0, error: null });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const m3uText = await response.text();

      const parsedChannels = parseM3U(m3uText, {
        onProgress: (progress) => set({ parseProgress: progress }),
      });

      const uniqueGroups = Array.from(new Set(parsedChannels.map((c) => c.group))).sort();

      set({
        channels: parsedChannels,
        groups: uniqueGroups,
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
          tvgId: 'bloomberg.us'
        },
        {
          id: 'fb-redbull',
          name: 'Red Bull TV',
          logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Red_Bull_TV_logo.svg/320px-Red_Bull_TV_logo.svg.png',
          url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
          group: 'Sports',
          tvgId: 'redbull.sports'
        },
        {
          id: 'fb-nasa',
          name: 'NASA TV Live',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/320px-NASA_logo.svg.png',
          url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
          group: 'Documentary',
          tvgId: 'nasa.live'
        }
      ];
      set({
        channels: fallbackChannels,
        groups: ['Documentary', 'News', 'Sports'],
        isLoading: false,
        error: null,
      });
    }
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
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          console.warn('[OTA] Received non-JSON response from config endpoint:', contentType);
          return;
        }

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

        if (storage) {
          storage.set('appConfigId', targetId);
          storage.set('remoteVersion', String(newVersion));
          storage.set('playlistUrl', newPlaylistUrl);
          if (newAnnouncement) storage.set('announcement', newAnnouncement);
          else storage.delete('announcement');
          storage.set('themePrimary', newTheme.primaryColor);
          storage.set('themeAccent', newTheme.accentColor);
          if (newTheme.logoUrl) storage.set('themeLogo', newTheme.logoUrl);
        } else {
          memoryStore.set('appConfigId', targetId);
          memoryStore.set('remoteVersion', String(newVersion));
          memoryStore.set('playlistUrl', newPlaylistUrl);
          if (newAnnouncement) memoryStore.set('announcement', newAnnouncement);
          else memoryStore.delete('announcement');
          memoryStore.set('themePrimary', newTheme.primaryColor);
          memoryStore.set('themeAccent', newTheme.accentColor);
          if (newTheme.logoUrl) memoryStore.set('themeLogo', newTheme.logoUrl);
        }

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
    } catch (err) {
      console.warn('OTA config sync failed, continuing with cached configuration', err);
    }

    if (get().channels.length === 0) {
      await get().loadPlaylist();
    }
  },

  dismissAnnouncement: () => {
    try {
      if (storage) storage.delete('announcement');
      else memoryStore.delete('announcement');
    } catch {}
    set({ announcement: null });
  },

  toggleFavorite: (channelId: string) => {
    const { favorites } = get();
    const newFavorites = favorites.includes(channelId)
      ? favorites.filter((id) => id !== channelId)
      : [...favorites, channelId];

    writeArrayToStorage('favorites', newFavorites);
    set({ favorites: newFavorites });
  },

  addToHistory: (channelId: string) => {
    const { history } = get();
    const filteredHistory = history.filter((id) => id !== channelId);
    const newHistory = [channelId, ...filteredHistory].slice(0, 20);

    writeArrayToStorage('history', newHistory);
    set({ history: newHistory });
  },

  clearHistory: () => {
    writeArrayToStorage('history', []);
    set({ history: [] });
  },

  clearCache: () => {
    try {
      if (storage) storage.clearAll();
      else memoryStore.clear();
    } catch {}
    set({ favorites: [], history: [], appConfigId: null, remoteVersion: 0, announcement: null });
  },
}));