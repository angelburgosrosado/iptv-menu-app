/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { AppState, Channel, EpgSource, DvrRecording, Bookmark } from '../types/iptv';
import { parseM3U } from '../utils/m3uParser';
import { buildCountrySections } from '../utils/channelEnrichment';

// Initialize react-native-mmkv storage container
const storage = new MMKV({ id: 'iptv_user_storage_v1' });

// Pre-provided high-definition royalty-free & public IPTV streams fallback
// Keeps the app fully operational instantly on first launch with CORS-friendly streams
const FALLBACK_PLAYLIST = `#EXTM3U
#EXTINF:-1 tvg-id="CBSNews" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/CBS_News_247_logo.svg/960px-CBS_News_247_logo.svg.png" group-title="News",CBS News 24/7 HD
https://lineup.cbsivideo.com/playout/8877a7d5-b094-4ac8-bc72-75a5fed68e5b/index.m3u8

#EXTINF:-1 tvg-id="AlJazeera" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/c/c1/Al_Jazeera_English_logo_2022.svg" group-title="News",Al Jazeera English HD
https://live-hls-apps-aje-fa.getaj.net/AJE/01.m3u8

#EXTINF:-1 tvg-id="DW" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/5/5b/Deutsche_Welle_logo_2012.svg" group-title="News",Deutsche Welle (DW) English HD
https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8

#EXTINF:-1 tvg-id="France24" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/8/82/France_24_logo.svg" group-title="News",France 24 Live HD
https://live.france24.com/hls/live/2037179-b/F24_FR_HI_HLS/master_5000.m3u8

#EXTINF:-1 tvg-id="RedBull" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/c/c8/Red_Bull_Double_Bull_Logo.svg" group-title="Sports",Red Bull TV Live HD
https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8

#EXTINF:-1 tvg-id="BigBuckBunny" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg" group-title="Cinema",Big Buck Bunny (60fps HD Demo)
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8

#EXTINF:-1 tvg-id="TearsOfSteel" tvg-logo="https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=120" group-title="Cinema",Tears of Steel (4K Cinema Test)
https://test-streams.mux.dev/test_001/stream.m3u8`;

const DEFAULT_PLAYLIST_URL = 'https://iptv-org.github.io/iptv/countries/us.m3u';

import { MELHATA_CHANNELS } from '../data/melhataChannels';

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

const readJsonFromStorage = <T>(key: string, fallback: T): T => {
  const json = storage.getString(key);
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

const writeJsonToStorage = (key: string, data: any): void => {
  storage.set(key, JSON.stringify(data));
};

const INITIAL_FALLBACK_CHANNELS = [...parseM3U(FALLBACK_PLAYLIST), ...MELHATA_CHANNELS];
const INITIAL_GROUPS = Array.from(new Set(INITIAL_FALLBACK_CHANNELS.map((c) => c.group))).sort();

const getApiUrl = (path: string): string => {
  if (typeof window !== 'undefined') return path;
  return `http://localhost:${process.env.PORT || 3001}${path}`;
};

export const usePlayerStore = create<AppState>((set, get) => ({
  // Active state holders (pre-seeded with verified streams + Melhata Xtream channels)
  channels: INITIAL_FALLBACK_CHANNELS,
  groups: INITIAL_GROUPS,
  favorites: readArrayFromStorage('favorites'),
  history: readArrayFromStorage('history'),
  dvrRecordings: readJsonFromStorage<DvrRecording[]>('iptv_dvr_recordings', []),
  bookmarks: readJsonFromStorage<Bookmark[]>('iptv_bookmarks', []),
  customTags: readJsonFromStorage<Record<string, string[]>>('iptv_custom_channel_tags', {}),

  // Picture-in-Picture (PiP) Floating Mini-Player
  pipChannel: null,
  pipStreamUrl: undefined,
  isPiPActive: false,
  pipSize: readJsonFromStorage<'compact' | 'normal' | 'large'>('iptv_pip_size', 'normal'),
  isPiPMuted: false,
  
  // Country & EPG Backbone enhancements
  countrySections: buildCountrySections(INITIAL_FALLBACK_CHANNELS),
  selectedCountry: null,
  selectedRegion: null,
  selectedLanguage: null,
  selectedTimezone: null,
  selectedSubdivision: null,
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

  setSelectedCountry: (code: string | null) => set({ selectedCountry: code, selectedSubdivision: null }),
  setSelectedRegion: (region: string | null) => set({ selectedRegion: region }),
  setSelectedLanguage: (lang: string | null) => set({ selectedLanguage: lang }),
  setSelectedTimezone: (tz: string | null) => set({ selectedTimezone: tz }),
  setSelectedSubdivision: (sub: string | null) => set({ selectedSubdivision: sub }),
  setSelectedGroup: (group: string | null) => set({ selectedGroup: group }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),

  loadMetadataBundle: async () => {
    let currentChannels = get().channels;
    if (!currentChannels || currentChannels.length === 0) {
      await get().loadPlaylist();
      currentChannels = get().channels;
    }
    if (!currentChannels || currentChannels.length === 0) return;

    try {
      // Backend metadata enrichment via Option 1
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(getApiUrl('/api/channels/enrich'), {
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
      console.warn('Backend channel enrichment unavailable, using local fallback matching', enrichErr);
    }

    const sections = buildCountrySections(currentChannels);
    set({ countrySections: sections });
  },

  loadEpgBundle: async () => {
    let currentChannels = get().channels;
    if (!currentChannels || currentChannels.length === 0) {
      currentChannels = parseM3U(FALLBACK_PLAYLIST);
    }

    const channelKeys = Array.from(
      new Set(
        currentChannels
          .map((c) => c.tvgId || c.epgChannelId || c.id)
          .filter(Boolean)
      )
    );

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(getApiUrl(`/api/epg/live?channelIds=${encodeURIComponent(channelKeys.join(','))}`), {
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
              { key: 'licensed-primary', label: 'Licensed Primary Backbone', priority: 2, enabled: true },
              { key: 'open-epg', label: 'Public XMLTV Interchange', priority: 3, enabled: true }
            ],
            epgByChannel: formattedMap
          });
          return;
        }
      }
    } catch (epgErr) {
      console.warn('Backend live EPG unavailable, utilizing local schedule backbone', epgErr);
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
    set({ favorites: [], history: [], dvrRecordings: [], bookmarks: [], customTags: {} });
  },

  scheduleRecording: (recordingData: Omit<DvrRecording, 'id' | 'recordedAt'>) => {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const recordedAt = new Date().toISOString();
    const duration = recordingData.durationMinutes || 60;
    const fileSizeEstimate = recordingData.fileSizeEstimate || `${Math.round(duration * 24.5)} MB`;
    
    const newRecording: DvrRecording = {
      ...recordingData,
      id,
      recordedAt,
      fileSizeEstimate
    };

    const updatedRecordings = [newRecording, ...get().dvrRecordings];
    writeJsonToStorage('iptv_dvr_recordings', updatedRecordings);
    set({ dvrRecordings: updatedRecordings });
    return newRecording;
  },

  deleteRecording: (id: string) => {
    const updatedRecordings = get().dvrRecordings.filter((r) => r.id !== id);
    writeJsonToStorage('iptv_dvr_recordings', updatedRecordings);
    set({ dvrRecordings: updatedRecordings });
  },

  updateRecordingStatus: (id: string, status: 'completed' | 'recording' | 'scheduled') => {
    const updatedRecordings = get().dvrRecordings.map((r) => 
      r.id === id ? { ...r, status } : r
    );
    writeJsonToStorage('iptv_dvr_recordings', updatedRecordings);
    set({ dvrRecordings: updatedRecordings });
  },

  addBookmark: (bookmarkData: Omit<Bookmark, 'id' | 'savedAt'>) => {
    const existing = get().bookmarks.find((b) => b.channelId === bookmarkData.channelId);
    if (existing) return existing;
    
    const id = `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const savedAt = new Date().toISOString();
    const newBookmark: Bookmark = {
      ...bookmarkData,
      id,
      savedAt
    };

    const updatedBookmarks = [newBookmark, ...get().bookmarks];
    writeJsonToStorage('iptv_bookmarks', updatedBookmarks);
    set({ bookmarks: updatedBookmarks });
    return newBookmark;
  },

  removeBookmark: (idOrChannelId: string) => {
    const updatedBookmarks = get().bookmarks.filter((b) => b.id !== idOrChannelId && b.channelId !== idOrChannelId);
    writeJsonToStorage('iptv_bookmarks', updatedBookmarks);
    set({ bookmarks: updatedBookmarks });
  },

  isChannelBookmarked: (channelId: string) => {
    return get().bookmarks.some((b) => b.channelId === channelId);
  },

  addChannelTag: (channelId: string, rawTag: string) => {
    const tag = rawTag.trim();
    if (!tag) return;
    const currentTags = get().customTags;
    const existingForChannel = currentTags[channelId] || [];
    if (existingForChannel.some((t) => t.toLowerCase() === tag.toLowerCase())) return;

    const updated = {
      ...currentTags,
      [channelId]: [...existingForChannel, tag]
    };
    writeJsonToStorage('iptv_custom_channel_tags', updated);
    set({ customTags: updated });
  },

  removeChannelTag: (channelId: string, rawTag: string) => {
    const tag = rawTag.trim();
    const currentTags = get().customTags;
    const existingForChannel = currentTags[channelId] || [];
    const filtered = existingForChannel.filter((t) => t.toLowerCase() !== tag.toLowerCase());

    const updated = {
      ...currentTags,
      [channelId]: filtered
    };
    writeJsonToStorage('iptv_custom_channel_tags', updated);
    set({ customTags: updated });
  },

  getChannelTags: (channelId: string) => {
    return get().customTags[channelId] || [];
  },

  getAllUniqueCustomTags: () => {
    const allTags = new Set<string>();
    Object.values(get().customTags).forEach((tags) => {
      if (Array.isArray(tags)) {
        tags.forEach((t) => allTags.add(t));
      }
    });
    return Array.from(allTags).sort();
  },

  // Picture-in-Picture (PiP) Actions
  openPiP: (channel: Channel, streamUrl?: string) => {
    set({
      pipChannel: channel,
      pipStreamUrl: streamUrl || channel.url,
      isPiPActive: true
    });
    get().addToHistory(channel.id);
  },

  closePiP: () => {
    set({
      isPiPActive: false,
      pipChannel: null,
      pipStreamUrl: undefined
    });
  },

  setPiPSize: (size: 'compact' | 'normal' | 'large') => {
    writeJsonToStorage('iptv_pip_size', size);
    set({ pipSize: size });
  },

  togglePiPMute: () => {
    set((state) => ({ isPiPMuted: !state.isPiPMuted }));
  },
}));
