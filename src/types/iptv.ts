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
  countryCode?: string;
  epgChannelId?: string;
  metadataSource?: 'playlist' | 'iptv-org' | 'manual';
  resolution?: string; // 4K, 1080p, 720p, SD
  bitrate?: string;    // e.g., 4.5 Mbps
  fps?: number;        // e.g., 60, 30
  pingMs?: number;     // live latency ms
  codec?: string;      // H.264 / AAC / HEVC
  streamType?: 'live' | 'vod' | 'series';
  directSource?: 'm3u' | 'xtream';
}

export type PlaylistChannel = Channel;

export interface CountrySection {
  code: string;
  name: string;
  channelCount: number;
  channels: Channel[];
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
  
  // Async Loading States
  isLoading: boolean;
  parseProgress: number; // 0 to 100
  error: string | null;
  playlistUrl: string;

  // Actions
  setPlaylistUrl: (url: string) => void;
  loadPlaylist: (url?: string) => Promise<void>;
  toggleFavorite: (channelId: string) => void;
  addToHistory: (channelId: string) => void;
  clearHistory: () => void;
  clearCache: () => void;
}
