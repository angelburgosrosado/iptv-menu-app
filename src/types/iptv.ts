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
