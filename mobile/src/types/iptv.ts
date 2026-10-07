export interface Channel {
  id: string;         // Unique channel identifier (derived or parsed from tvg-id)
  name: string;       // Public-facing channel name
  logo: string;       // URL to channel logo/favicon
  url: string;        // HLS H3U8 stream URL
  group: string;      // Group category name (e.g., News, Entertainment)
  tvgId: string;      // Raw epg identifier
  tvgName?: string;
  tvgCountry?: string;
  language?: string;
  countryCode?: string;
  countryName?: string;
  epgChannelId?: string;
  metadataSource?: 'playlist' | 'iptv-org' | 'manual';
}

export interface CountrySection {
  code: string;
  name: string;
  channelCount: number;
  channels: Channel[];
  featuredLogos: string[];
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

export interface AppState {
  // Collection States
  channels: Channel[];
  groups: string[];
  favorites: string[]; // List of channel IDs
  history: string[];   // List of recently watched channel IDs
  
  // Country & EPG Backbone enhancements
  countrySections: CountrySection[];
  selectedCountry: string | null;
  selectedGroup: string | null;
  searchTerm: string;
  epgSources: EpgSource[];
  epgByChannel: Record<string, any>;

  // Xtream Codes Account Management
  xtreamAccount: XtreamAccount | null;
  savedXtreamAccounts: XtreamAccount[];

  // Async Loading States
  isLoading: boolean;
  parseProgress: number; // 0 to 100
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
  setSelectedCountry: (code: string | null) => void;
  setSelectedGroup: (group: string | null) => void;
  setSearchTerm: (term: string) => void;
  loadMetadataBundle: () => Promise<void>;
  loadEpgBundle: () => Promise<void>;
  syncRemoteConfig: (appId?: string) => Promise<void>;
  dismissAnnouncement: () => void;
  toggleFavorite: (channelId: string) => void;
  addToHistory: (channelId: string) => void;
  clearHistory: () => void;
  clearCache: () => void;
}

export interface XtreamAccount {
  serverUrl: string;
  username: string;
  password: string;
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
  };
}