/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Channel {
  id: string;               // Unique channel identifier
  name: string;             // Public-facing channel name
  logo: string;             // URL to channel logo
  url: string;              // Primary stream URL (HLS or TS)
  fallbackUrls?: string[];  // Alternate format URLs (e.g., .m3u8 if url is .ts, or vice-versa)
  group: string;            // Group category name (e.g., News, Sports)
  tvgId: string;            // Raw EPG identifier
  tvgName?: string;
  tvgCountry?: string;
  language?: string;
  countryCode?: string;
  countryName?: string;
  epgChannelId?: string;
  metadataSource?: 'playlist' | 'iptv-org' | 'xtream' | 'manual';
  isLive?: boolean;
  resolution?: string;      // e.g., '1080p', '4K', '720p'
  streamType?: 'live' | 'vod' | 'series';
  catchupDays?: number;
  actors?: string[];
  cast?: string[];
}

export interface CountrySection {
  code: string;
  name: string;
  channelCount: number;
  channels: Channel[];
  featuredLogos: string[];
}

export interface EpgProgramme {
  channelId: string;
  title: string;
  desc?: string;
  start: string;            // ISO timestamp
  stop: string;             // ISO timestamp
  category?: string[];
  sourcePriority?: number;
}

export interface NowNextProgrammes {
  now?: EpgProgramme;
  next?: EpgProgramme;
}

export interface EpgSource {
  key: string;
  label: string;
  priority: number;
  enabled: boolean;
}

export interface Group {
  name: string;
  channels: Channel[];
}

export interface RemoteTheme {
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
}

export interface XtreamAccount {
  serverUrl: string;
  username: string;
  password?: string;        // Populated in memory or decrypted via SecureStore
  name?: string;
  outputFormat?: 'ts' | 'm3u8';
  userInfo?: {
    status?: string;
    exp_date?: string;
    is_trial?: string;
    active_cons?: string;
    max_connections?: string;
    message?: string;
  };
  serverInfo?: {
    url?: string;
    port?: string;
    server_protocol?: string;
    time_now?: string;
    timezone?: string;
  };
}

export interface PlaybackState {
  currentChannel: Channel | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isPiPActive: boolean;
  playbackError: string | null;
  activeStreamUrl: string | null;
  usingFallbackUrl: boolean;
}

export interface AppState {
  // Channel Collections & State
  channels: Channel[];
  groups: string[];
  favorites: string[];      // Channel IDs
  history: string[];        // Channel IDs
  currentPlayingChannel: Channel | null;

  // Country & EPG Enhancements
  countrySections: CountrySection[];
  selectedCountry: string | null;
  selectedGroup: string | null;
  selectedStreamType: 'all' | 'live' | 'vod' | 'series';
  searchTerm: string;
  epgSources: EpgSource[];
  epgByChannel: Record<string, NowNextProgrammes>;
  epgOverrides: Record<string, string>;

  // Xtream Codes Account Management
  xtreamAccount: XtreamAccount | null;
  savedXtreamAccounts: XtreamAccount[];

  // Async Loading States
  isLoading: boolean;
  isEpgLoading: boolean;
  parseProgress: number;     // 0 to 100
  error: string | null;
  playlistUrl: string;

  // Dynamic Remote OTA Configuration
  appConfigId: string | null;
  remoteVersion: number;
  announcement: string | null;
  theme: RemoteTheme;

  // Actions
  setPlaylistUrl: (url: string) => void;
  loadPlaylist: (url?: string) => Promise<void>;
  connectXtreamAccount: (account: XtreamAccount) => Promise<{ success: boolean; error?: string }>;
  disconnectXtreamAccount: () => void;
  removeSavedAccount: (serverUrl: string, username: string) => void;
  setCurrentPlayingChannel: (channel: Channel | null) => void;
  setSelectedCountry: (code: string | null) => void;
  setSelectedGroup: (group: string | null) => void;
  setSelectedStreamType: (type: 'all' | 'live' | 'vod' | 'series') => void;
  setSearchTerm: (term: string) => void;
  loadMetadataBundle: () => Promise<void>;
  loadEpgBundle: () => Promise<void>;
  setCustomEpgOverride: (channelId: string, tvgId: string) => void;
  removeCustomEpgOverride: (channelId: string) => void;
  syncRemoteConfig: (appId?: string) => Promise<void>;
  dismissAnnouncement: () => void;
  toggleFavorite: (channelId: string) => void;
  addToHistory: (channelId: string) => void;
  clearHistory: () => void;
  clearCache: () => void;
}