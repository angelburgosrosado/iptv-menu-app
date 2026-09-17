/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  languageName?: string;
  countryCode?: string;
  countryName?: string;
  countryFlag?: string;
  category?: string;
  timezone?: string;
  subdivision?: string;
  epgChannelId?: string;
  metadataSource?: 'playlist' | 'iptv-org' | 'manual';
  resolution?: string; // 4K, 1080p, 720p, SD
  bitrate?: string;    // e.g., 4.5 Mbps
  fps?: number;        // e.g., 60, 30
  pingMs?: number;     // live latency ms
  codec?: string;      // H.264 / AAC / HEVC
  streamType?: 'live' | 'vod' | 'series';
  directSource?: 'm3u' | 'xtream';
  healthStatus?: 'online' | 'degraded' | 'blocked' | 'offline';
  blockedReason?: string;
  blockedRef?: string;
  corsProxyRecommended?: boolean;
}

export type PlaylistChannel = Channel;

export interface IptvOrgBlocklistEntry {
  channel: string;
  reason: string;
  ref: string;
}

export interface StreamHealthMetric {
  channelId: string;
  url: string;
  status: 'online' | 'degraded' | 'blocked' | 'offline';
  latencyMs?: number;
  httpStatus?: number;
  contentType?: string;
  isHls?: boolean;
  blockedReason?: string;
  lastChecked: number;
}

export interface CountrySection {
  code: string;
  name: string;
  channelCount: number;
  channels: Channel[];
  featuredLogos: string[];
  flag?: string;
  languages?: string[];
  region?: string;
}

export interface IptvOrgCountry {
  name: string;
  code: string;
  languages: string[];
  flag: string;
}

export interface IptvOrgCategory {
  id: string;
  name: string;
  description: string;
}

export interface IptvOrgRegion {
  code: string;
  name: string;
  countries: string[];
}

export interface IptvOrgLanguage {
  code: string;
  name: string;
}

export interface IptvOrgTimezone {
  id: string;
  utc_offset: string;
  countries: string[];
}

export interface IptvOrgSubdivision {
  country: string;
  code: string;
  name: string;
  parent: string | null;
}

export interface EpgSource {
  key: string;
  label: string;
  priority: number;
  enabled: boolean;
}

export interface XmltvChannel {
  id: string;
  displayNames: string[];
  icon?: string;
  countryCode?: string;
  language?: string;
}

export interface XmltvProgramme {
  channel: string;
  start: string;
  stop?: string;
  title: string;
  desc?: string;
  category?: string[];
  icon?: string;
  sourcePriority: number;
}

export interface EpgProvider {
  key: string;
  kind: 'licensed' | 'public-xmltv' | 'community';
  priority: number;
  enabled: boolean;
  baseUrl?: string;
  token?: string;
  countries?: string[];
}

export interface UpgradeAppConfig {
  paths: {
    channelsFile: string;
    iptvOrgChannelsFile: string;
    iptvOrgCountriesFile: string;
    publicXmltvDirectory: string;
    outputDirectory: string;
  };
  epg: {
    timezone: string;
    providers: EpgProvider[];
    fallbackWindowHours: number;
    includeUnmatchedChannels: boolean;
  };
}

export type Json = Record<string, any>;

export interface XtreamAccount {
  serverUrl: string;
  username: string;
  password: string;
  port?: string;
  status: 'connected' | 'error' | 'idle';
  expirationDate?: string;
  maxConnections?: number;
}

export interface Group {
  name: string;
  channels: Channel[];
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
  selectedRegion: string | null;
  selectedLanguage: string | null;
  selectedTimezone: string | null;
  selectedGroup: string | null;
  searchTerm: string;
  epgSources: EpgSource[];
  epgByChannel: Record<string, any>;

  // Async Loading States
  isLoading: boolean;
  parseProgress: number; // 0 to 100
  error: string | null;
  playlistUrl: string;

  // Actions
  setPlaylistUrl: (url: string) => void;
  loadPlaylist: (url?: string) => Promise<void>;
  setSelectedCountry: (code: string | null) => void;
  setSelectedRegion: (region: string | null) => void;
  setSelectedLanguage: (lang: string | null) => void;
  setSelectedTimezone: (tz: string | null) => void;
  setSelectedGroup: (group: string | null) => void;
  setSearchTerm: (term: string) => void;
  loadMetadataBundle: () => Promise<void>;
  loadEpgBundle: () => Promise<void>;
  toggleFavorite: (channelId: string) => void;
  addToHistory: (channelId: string) => void;
  clearHistory: () => void;
  clearCache: () => void;
}

export interface AdSenseSlotConfig {
  topBannerSlot: string;      // Designated Area: Workspace Top Banner
  bottomBannerSlot: string;   // Designated Area: Workspace Bottom Banner
  sidebarSlot?: string;       // Designated Area: EPG & Sidebar Inspector
  channelListSlot?: string;   // Designated Area: Channel Guide Inline
  playerOverlaySlot?: string; // Designated Area: Video Player / Simulator
  [key: string]: string | undefined;
}

export interface AdSenseConfig {
  enabled: boolean;
  clientId: string;
  slots: AdSenseSlotConfig;
  autoAdsEnabled?: boolean;
  testMode?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}
