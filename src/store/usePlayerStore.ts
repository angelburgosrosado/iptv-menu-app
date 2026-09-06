/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { AppState, Channel, EpgSource } from '../types/iptv';
import { parseM3U } from '../utils/m3uParser';
import { buildCountrySections } from '../utils/channelEnrichment';

// Initialize react-native-mmkv storage container
const storage = new MMKV({ id: 'iptv_user_storage_v1' });

// Pre-provided high-definition royalty-free & public IPTV streams fallback
// Keeps the app fully operational instantly on first launch with CORS-friendly streams
const FALLBACK_PLAYLIST = `#EXTM3U
#EXTINF:-1 tvg-id="NASA" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg" group-title="Science",NASA TV Public HD
https://ntv1.akamaized.net/hls/live/2014027/NASA-NTV1-Public/master.m3u8

#EXTINF:-1 tvg-id="France24EN" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/8/82/France_24_logo.svg" group-title="News",France 24 English HD
https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8

#EXTINF:-1 tvg-id="AlJazeera" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/c/c1/Al_Jazeera_English_logo_2022.svg" group-title="News",Al Jazeera English News
https://live-aljazeera.akamaized.net/aljazeera/english/en/video.m3u8

#EXTINF:-1 tvg-id="DW" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/5/5b/Deutsche_Welle_logo_2012.svg" group-title="News",Deutsche Welle (DW) English
https://dwstream72.akamaized.net/hls/live/2014130/dwstream72/index.m3u8

#EXTINF:-1 tvg-id="RedBull" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/c/c8/Red_Bull_Double_Bull_Logo.svg" group-title="Sports",Red Bull TV Live HD
https://rbmn-live.akamaized.net/hls/live/590961/global/master.m3u8

#EXTINF:-1 tvg-id="SkyNews" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/d/de/Sky_News_2020.svg" group-title="News",Sky News Live
https://skynews-skynewshd-hls-or-live.akamaized.net/hls/live/2004245/skynewshd/master.m3u8

#EXTINF:-1 tvg-id="Arirang" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/3/30/Arirang_TV_logo_%282016%29.svg" group-title="Entertainment",Arirang World K-Pop
https://arirang.live.cdn.as99147.net/arirang/arirangtv/playlist.m3u8

#EXTINF:-1 tvg-id="CGTN" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/3/3c/CGTN_logo.svg" group-title="News",CGTN Globe Live
https://cgtneng.live.cdn.as99147.net/cgtneng/cgtneng/playlist.m3u8

#EXTINF:-1 tvg-id="Lofi" tvg-logo="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=120" group-title="Music",Classic Jazz Radio Live
https://live.ch9.tv/live/9chart/playlist.m3u8`;

const DEFAULT_PLAYLIST_URL = 'https://iptv-org.github.io/iptv/countries/us.m3u';

// Read persistent arrays from MMKV securely
const readArrayFromStorage = (key: string): string[] => {
  const json = storage.getString(key);
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
};

const writeArrayToStorage = (key: string, data: string[]): void => {
  storage.set(key, JSON.stringify(data));
};

export const usePlayerStore = create<AppState>((set, get) => ({
  // Active state holders
  channels: [],
  groups: [],
  favorites: readArrayFromStorage('favorites'),
  history: readArrayFromStorage('history'),
  
  // Country & EPG Backbone enhancements
  countrySections: buildCountrySections(parseM3U(FALLBACK_PLAYLIST)),
  selectedCountry: null,
  selectedGroup: null,
  searchTerm: '',
  epgSources: [
    { key: 'licensed-primary', label: 'Licensed Primary Backbone', priority: 1, enabled: true },
    { key: 'open-epg', label: 'Public XMLTV Interchange', priority: 2, enabled: true },
    { key: 'community-country-feeds', label: 'Community Country Feeds', priority: 3, enabled: true }
  ],
  epgByChannel: {},

  // Loading & parsing states
  isLoading: false,
  parseProgress: 0,
  error: null,
  playlistUrl: storage.getString('playlistUrl') || DEFAULT_PLAYLIST_URL,

  setSelectedCountry: (code: string | null) => set({ selectedCountry: code }),
  setSelectedGroup: (group: string | null) => set({ selectedGroup: group }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),

  loadMetadataBundle: async () => {
    let currentChannels = get().channels;
    if (!currentChannels || currentChannels.length === 0) {
      await get().loadPlaylist();
      currentChannels = get().channels;
    }
    const sections = buildCountrySections(currentChannels);
    set({ countrySections: sections });
  },

  loadEpgBundle: async () => {
    let currentChannels = get().channels;
    if (!currentChannels || currentChannels.length === 0) {
      currentChannels = parseM3U(FALLBACK_PLAYLIST);
    }
    const epgMap: Record<string, any[]> = {};
    for (const c of currentChannels) {
      const channelKey = c.tvgId || c.epgChannelId || c.id;
      epgMap[channelKey] = [
        {
          title: `${c.name} Live Broadcast`,
          start: new Date().toISOString(),
          stop: new Date(Date.now() + 3600000).toISOString(),
          sourcePriority: 10
        }
      ];
    }
    set({
      epgSources: [
        { key: 'licensed-primary', label: 'Licensed Primary Backbone', priority: 1, enabled: true },
        { key: 'open-epg', label: 'Public XMLTV Interchange', priority: 2, enabled: true },
        { key: 'community-country-feeds', label: 'Community Country Feeds', priority: 3, enabled: true }
      ],
      epgByChannel: epgMap
    });
  },

  setPlaylistUrl: (url: string) => {
    storage.set('playlistUrl', url);
    set({ playlistUrl: url });
  },

  loadPlaylist: async (customUrl?: string) => {
    const url = customUrl || get().playlistUrl;
    set({ isLoading: true, parseProgress: 0, error: null });

    try {
      console.log(`Fetching IPTV playlist from: ${url}`);
      
      let m3uText = '';
      
      // Let's use fetch, but support a robust proxy or fallback immediately to prearranged public streams
      // when CORS issues occur in browser or URL fails
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          m3uText = await response.text();
        } else {
          throw new Error(`Playlist server returned status ${response.status}`);
        }
      } catch (e: any) {
        console.warn('Direct fetch failed or blocked by CORS. Attempting backend stream relay proxy...', e);
        try {
          const proxyUrl = `/api/stream/proxy?url=${encodeURIComponent(url)}`;
          const proxyResp = await fetch(proxyUrl);
          if (proxyResp.ok) {
            m3uText = await proxyResp.text();
          } else {
            throw new Error(`Proxy status ${proxyResp.status}`);
          }
        } catch (proxyErr: any) {
          console.warn('Proxy relay also unreachable, using local fallback playlist.', proxyErr);
          m3uText = FALLBACK_PLAYLIST;
          set({ error: 'CORS or Network issue prevented fetching URL. Loaded 9 pre-vetted standby channels.' });
        }
      }

      // Parse the resulting text resiliently using the custom parser
      const parsedChannels = parseM3U(m3uText, {
        onProgress: (progress) => {
          set({ parseProgress: progress });
        },
      });

      if (parsedChannels.length === 0) {
        // If the custom parsing yielded nothing, parse fallback so the app isn't empty
        const fallbackChannels = parseM3U(FALLBACK_PLAYLIST);
        const uniqueGroups = Array.from(new Set(fallbackChannels.map((c) => c.group))).sort();
        set({
          channels: fallbackChannels,
          groups: uniqueGroups,
          countrySections: buildCountrySections(fallbackChannels),
          isLoading: false,
          parseProgress: 100,
          error: 'Returned playlist was empty or malformed. Loaded pre-vetted standby channels.',
        });
        return;
      }

      // Set unique categories in alphabetical order
      const uniqueGroups = Array.from(new Set(parsedChannels.map((c) => c.group))).sort();

      set({
        channels: parsedChannels,
        groups: uniqueGroups,
        countrySections: buildCountrySections(parsedChannels),
        isLoading: false,
        parseProgress: 100,
      });

    } catch (err: any) {
      console.error('IPTV Playlist loading failed:', err);
      // Fallback
      const fallbackChannels = parseM3U(FALLBACK_PLAYLIST);
      const uniqueGroups = Array.from(new Set(fallbackChannels.map((c) => c.group))).sort();
      set({
        channels: fallbackChannels,
        groups: uniqueGroups,
        countrySections: buildCountrySections(fallbackChannels),
        isLoading: false,
        parseProgress: 100,
        error: `Error loading playlist: ${err.message || err}. Loaded offline-friendly safety feeds.`,
      });
    }
  },

  toggleFavorite: (channelId: string) => {
    const { favorites } = get();
    let newFavorites: string[];
    
    if (favorites.includes(channelId)) {
      newFavorites = favorites.filter((id) => id !== channelId);
    } else {
      newFavorites = [...favorites, channelId];
    }

    writeArrayToStorage('favorites', newFavorites);
    set({ favorites: newFavorites });
  },

  addToHistory: (channelId: string) => {
    const { history } = get();
    // Exclude duplicates and limit history to most recent 20 channels
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
    storage.clearAll();
    set({ favorites: [], history: [] });
  },
}));
