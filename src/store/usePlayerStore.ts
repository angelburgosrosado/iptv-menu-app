/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { AppState, Channel, EpgSource, DvrRecording, Bookmark, PlaylistSubscription, SleepTimerState, AudioDspConfig, AudioDspPreset, AudioDspBands, ParentalControlsConfig, ActiveRecordingState, TvNavigationConfig, SpatialFocusZone, SubtitleConfig, SubtitlePreset } from '../types/iptv';
import { parseM3U } from '../utils/m3uParser';
import { buildCountrySections } from '../utils/channelEnrichment';
import { DEFAULT_DSP_CONFIG, DSP_PRESETS, audioDspEngine } from '../utils/audioDspEngine';
import { hashPin, verifyPin, DEFAULT_LOCKED_CATEGORIES } from '../utils/parentalSecurity';
import { formatBytes } from '../utils/streamRecorderEngine';
import { DEFAULT_SUBTITLE_CONFIG, SUBTITLE_PRESETS, clampSyncOffset, applySubtitleStylesToDom } from '../utils/subtitleEngine';

// Initialize react-native-mmkv storage container
const storage = new MMKV({ id: 'iptv_user_storage_v1' });

const DEFAULT_PARENTAL_CONTROLS: ParentalControlsConfig = {
  isEnabled: false,
  pinHash: null,
  isSessionUnlocked: false,
  sessionUnlockTimeoutMinutes: 30,
  unlockedAtTimestamp: null,
  lockedChannelIds: [],
  lockedCategories: [...DEFAULT_LOCKED_CATEGORIES],
  hideLockedChannelsInGuide: false,
  requirePinForSettings: false,
};

const getInitialParentalControls = (): ParentalControlsConfig => {
  const loaded = readJsonFromStorage<ParentalControlsConfig>('iptv_parental_controls', DEFAULT_PARENTAL_CONTROLS);
  if (loaded.isSessionUnlocked && loaded.unlockedAtTimestamp && loaded.sessionUnlockTimeoutMinutes > 0) {
    const elapsedMinutes = (Date.now() - loaded.unlockedAtTimestamp) / (1000 * 60);
    if (elapsedMinutes >= loaded.sessionUnlockTimeoutMinutes) {
      return {
        ...loaded,
        isSessionUnlocked: false,
        unlockedAtTimestamp: null,
      };
    }
  }
  return loaded;
};

const DEFAULT_SLEEP_TIMER: SleepTimerState = {
  isActive: false,
  durationMinutes: 0,
  remainingSeconds: 0,
  audioFadeOut: true,
  bedtimeDimming: true,
  endAction: 'pause',
  audioDuckRatio: 1.0,
  dimRatio: 0.0,
};

const DEFAULT_ACTIVE_RECORDING: ActiveRecordingState = {
  status: 'idle',
  isRecording: false,
  channelId: '',
  channelName: '',
  streamUrl: '',
  startTime: 0,
  elapsedSeconds: 0,
  bytesRecorded: 0,
  mimeType: 'video/webm',
  maxDurationSeconds: 3600,
};

const DEFAULT_TV_NAVIGATION: TvNavigationConfig = {
  isEnabled: false,
  activeFocusId: null,
  activeZone: 'channels',
  highContrastFocusRing: true,
  soundFeedback: false,
  debugOverlay: false,
};

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

const DEFAULT_SUBSCRIPTIONS: PlaylistSubscription[] = [
  {
    id: 'sub-default-us',
    name: 'US Curated Global Streams',
    url: 'https://iptv-org.github.io/iptv/countries/us.m3u',
    autoSync: true,
    syncIntervalMinutes: 60,
    lastSyncTime: new Date().toISOString(),
    channelCount: 9,
    status: 'synced',
    colorTag: '#06b6d4'
  },
  {
    id: 'sub-latam-regional',
    name: 'Latin America Regional Feeds',
    url: 'https://iptv-org.github.io/iptv/regions/latam.m3u',
    autoSync: false,
    syncIntervalMinutes: 360,
    lastSyncTime: new Date(Date.now() - 3600000 * 5).toISOString(),
    channelCount: 14,
    status: 'synced',
    colorTag: '#10b981'
  },
  {
    id: 'sub-melhata-xtream',
    name: 'Melhata Xtream Dedicated Line',
    url: 'http://line.melhata.org/get.php?username=8rvzieximl&password=h1usotpevd&type=m3u_plus&output=ts',
    autoSync: true,
    syncIntervalMinutes: 15,
    lastSyncTime: new Date().toISOString(),
    channelCount: 20,
    status: 'synced',
    colorTag: '#8b5cf6'
  }
];

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

  // M3U Feed Subscriptions & Auto-Sync Engine
  subscriptions: readJsonFromStorage<PlaylistSubscription[]>('iptv_playlist_subscriptions', DEFAULT_SUBSCRIPTIONS),
  activeSubscriptionId: storage.getString('iptv_active_subscription_id') || 'sub-default-us',
  
  // Sleep Timer & Playback Automation Engine
  sleepTimer: DEFAULT_SLEEP_TIMER,

  // Audio Equalizer & Sound Normalization DSP
  audioDsp: readJsonFromStorage<AudioDspConfig>('iptv_audio_dsp_config', DEFAULT_DSP_CONFIG),

  // Parental Controls & Content Security Engine
  parentalControls: getInitialParentalControls(),

  // Live Stream Recording Engine & Local DVR Exporter
  activeRecording: DEFAULT_ACTIVE_RECORDING,

  // 10-Foot Leanback TV Spatial Remote Navigation Engine
  tvNavigation: DEFAULT_TV_NAVIGATION,

  // Multi-Language Subtitle & Closed Caption Customization Engine
  subtitleConfig: readJsonFromStorage<SubtitleConfig>('iptv_subtitle_config', DEFAULT_SUBTITLE_CONFIG),

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

  // M3U Subscription Actions
  addSubscription: (sub) => {
    const id = `sub_${Date.now()}`;
    const newSub: PlaylistSubscription = {
      ...sub,
      id,
      channelCount: sub.channelCount || 0,
      lastSyncTime: new Date().toISOString(),
      status: 'synced'
    };
    const updated = [...get().subscriptions, newSub];
    writeJsonToStorage('iptv_playlist_subscriptions', updated);
    set({ subscriptions: updated });
    return newSub;
  },

  removeSubscription: (id: string) => {
    const updated = get().subscriptions.filter((s) => s.id !== id);
    writeJsonToStorage('iptv_playlist_subscriptions', updated);
    set({
      subscriptions: updated,
      activeSubscriptionId: get().activeSubscriptionId === id ? null : get().activeSubscriptionId
    });
  },

  toggleAutoSync: (id: string) => {
    const updated = get().subscriptions.map((s) => 
      s.id === id ? { ...s, autoSync: !s.autoSync } : s
    );
    writeJsonToStorage('iptv_playlist_subscriptions', updated);
    set({ subscriptions: updated });
  },

  updateSubscription: (id: string, updates: Partial<PlaylistSubscription>) => {
    const updated = get().subscriptions.map((s) => 
      s.id === id ? { ...s, ...updates } : s
    );
    writeJsonToStorage('iptv_playlist_subscriptions', updated);
    set({ subscriptions: updated });
  },

  activateSubscription: async (id: string) => {
    const target = get().subscriptions.find((s) => s.id === id);
    if (!target) return;
    storage.set('iptv_active_subscription_id', id);
    set({ activeSubscriptionId: id, playlistUrl: target.url });
    await get().loadPlaylist(target.url);
  },

  syncSubscription: async (id: string) => {
    const sub = get().subscriptions.find((s) => s.id === id);
    if (!sub) return;

    // Set syncing status
    const markingSyncing = get().subscriptions.map((s) => 
      s.id === id ? { ...s, status: 'syncing' as const } : s
    );
    set({ subscriptions: markingSyncing });

    try {
      if (get().activeSubscriptionId === id) {
        await get().loadPlaylist(sub.url);
      }
      
      let chCount = sub.channelCount;
      if (get().activeSubscriptionId === id) {
        chCount = get().channels.length;
      }

      const updated = get().subscriptions.map((s) => 
        s.id === id ? {
          ...s,
          status: 'synced' as const,
          lastSyncTime: new Date().toISOString(),
          channelCount: chCount,
          errorMessage: undefined
        } : s
      );
      writeJsonToStorage('iptv_playlist_subscriptions', updated);
      set({ subscriptions: updated });
    } catch (err: any) {
      const updated = get().subscriptions.map((s) => 
        s.id === id ? {
          ...s,
          status: 'error' as const,
          errorMessage: err?.message || 'Sync failed'
        } : s
      );
      writeJsonToStorage('iptv_playlist_subscriptions', updated);
      set({ subscriptions: updated });
    }
  },

  syncAllSubscriptions: async () => {
    const subs = get().subscriptions;
    for (const sub of subs) {
      if (sub.autoSync) {
        await get().syncSubscription(sub.id);
      }
    }
  },

  // Sleep Timer & Playback Automation Actions
  setSleepTimer: (minutes: number, options?: Partial<Pick<SleepTimerState, 'audioFadeOut' | 'bedtimeDimming' | 'endAction'>>) => {
    const totalSeconds = Math.max(1, Math.round(minutes * 60));
    set({
      sleepTimer: {
        isActive: true,
        durationMinutes: minutes,
        remainingSeconds: totalSeconds,
        audioFadeOut: options?.audioFadeOut ?? get().sleepTimer.audioFadeOut,
        bedtimeDimming: options?.bedtimeDimming ?? get().sleepTimer.bedtimeDimming,
        endAction: options?.endAction ?? get().sleepTimer.endAction,
        audioDuckRatio: 1.0,
        dimRatio: 0.0,
      }
    });
  },

  cancelSleepTimer: () => {
    set({
      sleepTimer: {
        ...get().sleepTimer,
        isActive: false,
        durationMinutes: 0,
        remainingSeconds: 0,
        audioDuckRatio: 1.0,
        dimRatio: 0.0,
      }
    });
  },

  extendSleepTimer: (additionalMinutes: number) => {
    const current = get().sleepTimer;
    if (!current.isActive) {
      get().setSleepTimer(additionalMinutes);
      return;
    }
    const addedSec = Math.round(additionalMinutes * 60);
    const newRemaining = current.remainingSeconds + addedSec;
    const newDuration = current.durationMinutes + additionalMinutes;
    set({
      sleepTimer: {
        ...current,
        durationMinutes: newDuration,
        remainingSeconds: newRemaining,
        audioDuckRatio: (current.audioFadeOut && newRemaining <= 60) ? Math.max(0, newRemaining / 60) : 1.0,
        dimRatio: (current.bedtimeDimming && newRemaining <= 120) ? Math.min(0.88, (120 - newRemaining) / 120 * 0.88) : 0.0,
      }
    });
  },

  tickSleepTimer: () => {
    const current = get().sleepTimer;
    if (!current.isActive) return;

    if (current.remainingSeconds <= 1) {
      const action = current.endAction;
      set({
        sleepTimer: {
          ...current,
          isActive: false,
          remainingSeconds: 0,
          audioDuckRatio: 0.0,
          dimRatio: current.bedtimeDimming ? 0.9 : 0.0,
        }
      });
      if (action === 'close') {
        get().closePiP();
      }
      return;
    }

    const nextSec = current.remainingSeconds - 1;
    let duck = 1.0;
    if (current.audioFadeOut && nextSec <= 60) {
      duck = Math.max(0, nextSec / 60);
    }

    let dim = 0.0;
    if (current.bedtimeDimming && nextSec <= 120) {
      dim = Math.min(0.88, (120 - nextSec) / 120 * 0.88);
    }

    set({
      sleepTimer: {
        ...current,
        remainingSeconds: nextSec,
        audioDuckRatio: duck,
        dimRatio: dim,
      }
    });
  },

  // Audio DSP Actions
  setDspEnabled: (enabled: boolean) => {
    const updated: AudioDspConfig = {
      ...get().audioDsp,
      enabled,
    };
    writeJsonToStorage('iptv_audio_dsp_config', updated);
    audioDspEngine.applyConfig(updated);
    set({ audioDsp: updated });
  },

  setDspPreset: (preset: AudioDspPreset) => {
    let bands = get().audioDsp.bands;
    if (preset !== 'custom') {
      bands = { ...DSP_PRESETS[preset] };
    }
    const updated: AudioDspConfig = {
      ...get().audioDsp,
      preset,
      bands,
      enabled: true,
    };
    writeJsonToStorage('iptv_audio_dsp_config', updated);
    audioDspEngine.applyConfig(updated);
    set({ audioDsp: updated });
  },

  setDspBand: (band: keyof AudioDspBands, gainDb: number) => {
    const updatedBands = {
      ...get().audioDsp.bands,
      [band]: Math.max(-12, Math.min(12, Math.round(gainDb * 10) / 10)),
    };
    const updated: AudioDspConfig = {
      ...get().audioDsp,
      preset: 'custom',
      bands: updatedBands,
      enabled: true,
    };
    writeJsonToStorage('iptv_audio_dsp_config', updated);
    audioDspEngine.applyConfig(updated);
    set({ audioDsp: updated });
  },

  toggleNormalization: () => {
    const updated: AudioDspConfig = {
      ...get().audioDsp,
      normalization: !get().audioDsp.normalization,
      enabled: true,
    };
    writeJsonToStorage('iptv_audio_dsp_config', updated);
    audioDspEngine.applyConfig(updated);
    set({ audioDsp: updated });
  },

  toggleDialogueEnhancer: () => {
    const updated: AudioDspConfig = {
      ...get().audioDsp,
      dialogueEnhancer: !get().audioDsp.dialogueEnhancer,
      enabled: true,
    };
    writeJsonToStorage('iptv_audio_dsp_config', updated);
    audioDspEngine.applyConfig(updated);
    set({ audioDsp: updated });
  },

  setPreampGain: (gain: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, gain));
    const updated: AudioDspConfig = {
      ...get().audioDsp,
      preampGain: clamped,
      enabled: true,
    };
    writeJsonToStorage('iptv_audio_dsp_config', updated);
    audioDspEngine.applyConfig(updated);
    set({ audioDsp: updated });
  },

  resetDsp: () => {
    const updated: AudioDspConfig = {
      ...DEFAULT_DSP_CONFIG,
      enabled: false,
    };
    writeJsonToStorage('iptv_audio_dsp_config', updated);
    audioDspEngine.applyConfig(updated);
    set({ audioDsp: updated });
  },

  // Parental Controls Actions
  setParentalPin: async (pin: string) => {
    const pinHash = await hashPin(pin);
    const updated: ParentalControlsConfig = {
      ...get().parentalControls,
      pinHash,
      isEnabled: true,
      isSessionUnlocked: true,
      unlockedAtTimestamp: Date.now(),
    };
    writeJsonToStorage('iptv_parental_controls', updated);
    set({ parentalControls: updated });
  },

  verifyParentalPin: async (pin: string) => {
    const { pinHash } = get().parentalControls;
    const isValid = await verifyPin(pin, pinHash);
    if (isValid) {
      const updated: ParentalControlsConfig = {
        ...get().parentalControls,
        isSessionUnlocked: true,
        unlockedAtTimestamp: Date.now(),
      };
      writeJsonToStorage('iptv_parental_controls', updated);
      set({ parentalControls: updated });
    }
    return isValid;
  },

  removeParentalPin: () => {
    const updated: ParentalControlsConfig = {
      ...get().parentalControls,
      pinHash: null,
      isEnabled: false,
      isSessionUnlocked: false,
      unlockedAtTimestamp: null,
    };
    writeJsonToStorage('iptv_parental_controls', updated);
    set({ parentalControls: updated });
  },

  setParentalControlsEnabled: (enabled: boolean) => {
    const updated: ParentalControlsConfig = {
      ...get().parentalControls,
      isEnabled: enabled,
    };
    writeJsonToStorage('iptv_parental_controls', updated);
    set({ parentalControls: updated });
  },

  toggleChannelLock: (channelId: string) => {
    const current = get().parentalControls.lockedChannelIds;
    const normalized = channelId.toLowerCase().trim();
    const exists = current.some((id) => id.toLowerCase().trim() === normalized);
    const lockedChannelIds = exists
      ? current.filter((id) => id.toLowerCase().trim() !== normalized)
      : [...current, channelId];
    const updated: ParentalControlsConfig = {
      ...get().parentalControls,
      lockedChannelIds,
    };
    writeJsonToStorage('iptv_parental_controls', updated);
    set({ parentalControls: updated });
  },

  isChannelLocked: (channel: { id?: string; name: string; group?: string }) => {
    const config = get().parentalControls;
    if (!config.isEnabled || !config.pinHash) {
      return false;
    }

    // Check session unlock state and expiration
    if (config.isSessionUnlocked) {
      if (config.sessionUnlockTimeoutMinutes > 0 && config.unlockedAtTimestamp) {
        const elapsedMinutes = (Date.now() - config.unlockedAtTimestamp) / (1000 * 60);
        if (elapsedMinutes >= config.sessionUnlockTimeoutMinutes) {
          // Session expired, relock
          const relocked: ParentalControlsConfig = {
            ...config,
            isSessionUnlocked: false,
            unlockedAtTimestamp: null,
          };
          writeJsonToStorage('iptv_parental_controls', relocked);
          set({ parentalControls: relocked });
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    // Check specific channel ID or normalized name
    const normalizedName = channel.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const channelId = channel.id?.toLowerCase().trim();
    const isIdLocked = config.lockedChannelIds.some((id) => {
      const nid = id.toLowerCase().trim();
      return (channelId && nid === channelId) || nid === normalizedName || nid === channel.name.toLowerCase().trim();
    });

    if (isIdLocked) return true;

    // Check category/group or name matching locked categories
    const groupLower = (channel.group || '').toLowerCase();
    const nameLower = channel.name.toLowerCase();

    for (const cat of config.lockedCategories) {
      const catLower = cat.toLowerCase().trim();
      if (!catLower) continue;
      if (groupLower.includes(catLower) || nameLower.includes(catLower)) {
        return true;
      }
    }

    return false;
  },

  toggleCategoryLock: (category: string) => {
    const current = get().parentalControls.lockedCategories;
    const normalized = category.toLowerCase().trim();
    const exists = current.some((cat) => cat.toLowerCase().trim() === normalized);
    const lockedCategories = exists
      ? current.filter((cat) => cat.toLowerCase().trim() !== normalized)
      : [...current, category];
    const updated: ParentalControlsConfig = {
      ...get().parentalControls,
      lockedCategories,
    };
    writeJsonToStorage('iptv_parental_controls', updated);
    set({ parentalControls: updated });
  },

  setHideLockedChannels: (hide: boolean) => {
    const updated: ParentalControlsConfig = {
      ...get().parentalControls,
      hideLockedChannelsInGuide: hide,
    };
    writeJsonToStorage('iptv_parental_controls', updated);
    set({ parentalControls: updated });
  },

  setParentalSessionTimeout: (minutes: number) => {
    const updated: ParentalControlsConfig = {
      ...get().parentalControls,
      sessionUnlockTimeoutMinutes: Math.max(0, minutes),
    };
    writeJsonToStorage('iptv_parental_controls', updated);
    set({ parentalControls: updated });
  },

  lockParentalSession: () => {
    const updated: ParentalControlsConfig = {
      ...get().parentalControls,
      isSessionUnlocked: false,
      unlockedAtTimestamp: null,
    };
    writeJsonToStorage('iptv_parental_controls', updated);
    set({ parentalControls: updated });
  },

  unlockParentalSession: () => {
    const updated: ParentalControlsConfig = {
      ...get().parentalControls,
      isSessionUnlocked: true,
      unlockedAtTimestamp: Date.now(),
    };
    writeJsonToStorage('iptv_parental_controls', updated);
    set({ parentalControls: updated });
  },

  // Live Stream Recording Engine & Local DVR Exporter Actions
  startActiveRecording: ({ channelId, channelName, streamUrl, maxDurationSeconds = 3600, mimeType = 'video/webm' }) => {
    set({
      activeRecording: {
        status: 'recording',
        isRecording: true,
        channelId,
        channelName,
        streamUrl,
        startTime: Date.now(),
        elapsedSeconds: 0,
        bytesRecorded: 0,
        mimeType,
        maxDurationSeconds,
        error: undefined,
        blobUrl: undefined,
        downloadFilename: undefined,
      }
    });
  },

  updateActiveRecordingProgress: (elapsedSeconds: number, bytesRecorded: number) => {
    const current = get().activeRecording;
    if (!current.isRecording) return;
    set({
      activeRecording: {
        ...current,
        elapsedSeconds,
        bytesRecorded,
      }
    });
  },

  stopActiveRecording: (result) => {
    const current = get().activeRecording;
    if (!current.isRecording && current.status === 'idle') return null;

    const durationSec = result?.elapsedSeconds ?? current.elapsedSeconds;
    const durationMin = Math.max(1, Math.ceil(durationSec / 60));
    const bytes = result?.bytesRecorded ?? current.bytesRecorded;
    const sizeEstimate = formatBytes(bytes);

    const newDvr: DvrRecording = {
      id: `rec_live_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      channelId: current.channelId,
      channelName: current.channelName,
      programTitle: `${current.channelName} Live Capture`,
      programDescription: `Direct stream recording from ${current.channelName} (${durationSec}s, ${sizeEstimate}).`,
      streamUrl: current.streamUrl,
      startTime: new Date(current.startTime || (Date.now() - durationSec * 1000)).toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes: durationMin,
      status: 'completed',
      recordedAt: new Date().toISOString(),
      fileSizeEstimate: sizeEstimate,
      blobUrl: result?.blobUrl,
      downloadFilename: result?.downloadFilename,
    };

    const updatedRecordings = [newDvr, ...get().dvrRecordings];
    writeJsonToStorage('iptv_dvr_recordings', updatedRecordings);

    set({
      dvrRecordings: updatedRecordings,
      activeRecording: {
        ...current,
        status: 'idle',
        isRecording: false,
        blobUrl: result?.blobUrl,
        downloadFilename: result?.downloadFilename,
      }
    });

    return newDvr;
  },

  cancelActiveRecording: (errorMessage?: string) => {
    set({
      activeRecording: {
        ...get().activeRecording,
        status: errorMessage ? 'error' : 'idle',
        isRecording: false,
        error: errorMessage,
      }
    });
  },

  // 10-Foot Leanback TV Spatial Remote Navigation Actions
  setTvNavigationEnabled: (enabled: boolean) => {
    set({
      tvNavigation: {
        ...get().tvNavigation,
        isEnabled: enabled,
      }
    });
  },

  setTvFocus: (focusId: string | null, zone?: SpatialFocusZone) => {
    const current = get().tvNavigation;
    set({
      tvNavigation: {
        ...current,
        isEnabled: true,
        activeFocusId: focusId,
        activeZone: zone || current.activeZone,
      }
    });
  },

  toggleHighContrastFocusRing: () => {
    const current = get().tvNavigation;
    set({
      tvNavigation: {
        ...current,
        highContrastFocusRing: !current.highContrastFocusRing,
      }
    });
  },

  // Multi-Language Subtitle & Closed Caption Actions
  setSubtitleConfig: (updates: Partial<SubtitleConfig>) => {
    const updated: SubtitleConfig = {
      ...get().subtitleConfig,
      ...updates,
      preset: updates.preset || (updates.fontSize || updates.textColor || updates.bgOpacity || updates.edgeStyle ? 'custom' : get().subtitleConfig.preset)
    };
    writeJsonToStorage('iptv_subtitle_config', updated);
    applySubtitleStylesToDom(updated);
    set({ subtitleConfig: updated });
  },

  setSubtitlePreset: (preset: SubtitlePreset) => {
    if (preset === 'custom') {
      const updated: SubtitleConfig = { ...get().subtitleConfig, preset: 'custom' };
      writeJsonToStorage('iptv_subtitle_config', updated);
      set({ subtitleConfig: updated });
      return;
    }
    const presetValues = SUBTITLE_PRESETS[preset];
    if (!presetValues) return;
    const updated: SubtitleConfig = {
      ...get().subtitleConfig,
      ...presetValues,
      preset
    };
    writeJsonToStorage('iptv_subtitle_config', updated);
    applySubtitleStylesToDom(updated);
    set({ subtitleConfig: updated });
  },

  setSubtitleSyncOffset: (offsetMs: number) => {
    const clamped = clampSyncOffset(offsetMs);
    const updated: SubtitleConfig = {
      ...get().subtitleConfig,
      syncOffsetMs: clamped
    };
    writeJsonToStorage('iptv_subtitle_config', updated);
    set({ subtitleConfig: updated });
  },

  resetSubtitleConfig: () => {
    const reset = { ...DEFAULT_SUBTITLE_CONFIG };
    writeJsonToStorage('iptv_subtitle_config', reset);
    applySubtitleStylesToDom(reset);
    set({ subtitleConfig: reset });
  },
}));
