import { create } from 'zustand';
import { AppState, Channel } from '../types/iptv';
import { parseM3U } from '../utils/m3uParser';

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

const getStoredString = (key: string, defaultVal: string): string => {
  try {
    if (storage) return storage.getString(key) || defaultVal;
    return memoryStore.get(key) || defaultVal;
  } catch {
    return defaultVal;
  }
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

  setPlaylistUrl: (url: string) => {
    try {
      if (storage) storage.set('playlistUrl', url);
      else memoryStore.set('playlistUrl', url);
    } catch {}
    set({ playlistUrl: url });
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
    set({ favorites: [], history: [] });
  },
}));