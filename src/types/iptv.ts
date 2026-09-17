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
  alternateUrls?: string[];
  feedQuality?: 'auto' | 'fhd' | 'hd' | 'sd' | 'backup';
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

export interface XtreamVodItem {
  num: number;
  name: string;
  streamType: 'movie' | 'vod';
  streamId: number;
  streamIcon: string;
  rating?: string;
  rating5based?: number;
  added?: string;
  categoryId: string;
  containerExtension?: string;
  customSid?: string;
  directSource?: string;
}

export interface XtreamSeriesItem {
  num: number;
  name: string;
  seriesId: number;
  cover: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  releaseDate?: string;
  lastModified?: string;
  rating?: string;
  rating5based?: number;
  categoryId: string;
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
  selectedSubdivision: string | null;
  selectedGroup: string | null;
  searchTerm: string;
  epgSources: EpgSource[];
  epgByChannel: Record<string, any>;

  // Async Loading States
  isLoading: boolean;
  parseProgress: number; // 0 to 100
  error: string | null;
  playlistUrl: string;

  // DVR & Bookmark Systems
  dvrRecordings: DvrRecording[];
  bookmarks: Bookmark[];

  // Custom Channel Tags System
  customTags: Record<string, string[]>;

  // Picture-in-Picture (PiP) Floating Mini-Player
  pipChannel: Channel | null;
  pipStreamUrl?: string;
  isPiPActive: boolean;
  pipSize: 'compact' | 'normal' | 'large';
  isPiPMuted: boolean;

  // Actions
  setPlaylistUrl: (url: string) => void;
  loadPlaylist: (url?: string) => Promise<void>;
  setSelectedCountry: (code: string | null) => void;
  setSelectedRegion: (region: string | null) => void;
  setSelectedLanguage: (lang: string | null) => void;
  setSelectedTimezone: (tz: string | null) => void;
  setSelectedSubdivision: (sub: string | null) => void;
  setSelectedGroup: (group: string | null) => void;
  setSearchTerm: (term: string) => void;
  loadMetadataBundle: () => Promise<void>;
  loadEpgBundle: () => Promise<void>;
  toggleFavorite: (channelId: string) => void;
  addToHistory: (channelId: string) => void;
  clearHistory: () => void;
  clearCache: () => void;

  // DVR & Bookmark Actions
  scheduleRecording: (recording: Omit<DvrRecording, 'id' | 'recordedAt'>) => DvrRecording;
  deleteRecording: (id: string) => void;
  updateRecordingStatus: (id: string, status: 'completed' | 'recording' | 'scheduled') => void;
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'savedAt'>) => Bookmark;
  removeBookmark: (id: string) => void;
  isChannelBookmarked: (channelId: string) => boolean;

  // Custom Tag Actions
  addChannelTag: (channelId: string, tag: string) => void;
  removeChannelTag: (channelId: string, tag: string) => void;
  getChannelTags: (channelId: string) => string[];
  getAllUniqueCustomTags: () => string[];

  // Picture-in-Picture (PiP) Actions
  openPiP: (channel: Channel, streamUrl?: string) => void;
  closePiP: () => void;
  setPiPSize: (size: 'compact' | 'normal' | 'large') => void;
  togglePiPMute: () => void;

  // M3U Feed Subscriptions & Auto-Sync Engine
  subscriptions: PlaylistSubscription[];
  activeSubscriptionId: string | null;

  addSubscription: (sub: Omit<PlaylistSubscription, 'id' | 'lastSyncTime' | 'status' | 'channelCount'> & { channelCount?: number }) => PlaylistSubscription;
  removeSubscription: (id: string) => void;
  toggleAutoSync: (id: string) => void;
  updateSubscription: (id: string, updates: Partial<PlaylistSubscription>) => void;
  syncSubscription: (id: string) => Promise<void>;
  syncAllSubscriptions: () => Promise<void>;
  activateSubscription: (id: string) => Promise<void>;

  // Sleep Timer & Playback Automation Engine
  sleepTimer: SleepTimerState;
  setSleepTimer: (minutes: number, options?: Partial<Pick<SleepTimerState, 'audioFadeOut' | 'bedtimeDimming' | 'endAction'>>) => void;
  cancelSleepTimer: () => void;
  extendSleepTimer: (additionalMinutes: number) => void;
  tickSleepTimer: () => void;

  // Audio Equalizer & Sound Normalization DSP
  audioDsp: AudioDspConfig;
  setDspEnabled: (enabled: boolean) => void;
  setDspPreset: (preset: AudioDspPreset) => void;
  setDspBand: (band: keyof AudioDspBands, gainDb: number) => void;
  toggleNormalization: () => void;
  toggleDialogueEnhancer: () => void;
  setPreampGain: (gain: number) => void;
  resetDsp: () => void;

  // Parental Controls & Content Security Engine
  parentalControls: ParentalControlsConfig;
  setParentalPin: (pin: string) => Promise<void>;
  verifyParentalPin: (pin: string) => Promise<boolean>;
  removeParentalPin: () => void;
  setParentalControlsEnabled: (enabled: boolean) => void;
  toggleChannelLock: (channelId: string) => void;
  isChannelLocked: (channel: { id?: string; name: string; group?: string }) => boolean;
  toggleCategoryLock: (category: string) => void;
  setHideLockedChannels: (hide: boolean) => void;
  setParentalSessionTimeout: (minutes: number) => void;
  lockParentalSession: () => void;
  unlockParentalSession: () => void;
  // Live Stream Recording Engine & Local DVR Exporter
  activeRecording: ActiveRecordingState;
  startActiveRecording: (params: { channelId: string; channelName: string; streamUrl: string; maxDurationSeconds?: number; mimeType?: string }) => void;
  updateActiveRecordingProgress: (elapsedSeconds: number, bytesRecorded: number) => void;
  stopActiveRecording: (result?: { blobUrl?: string; downloadFilename?: string; bytesRecorded?: number; elapsedSeconds?: number }) => DvrRecording | null;
  cancelActiveRecording: (errorMessage?: string) => void;

  // 10-Foot Leanback TV Spatial Remote Navigation Engine
  tvNavigation: TvNavigationConfig;
  setTvNavigationEnabled: (enabled: boolean) => void;
  setTvFocus: (focusId: string | null, zone?: SpatialFocusZone) => void;
  toggleHighContrastFocusRing: () => void;
}

export type SpatialFocusZone = 'nav' | 'sidebar' | 'channels' | 'player' | 'modal' | 'custom';
export type SpatialDirection = 'up' | 'down' | 'left' | 'right';

export interface TvNavigationConfig {
  isEnabled: boolean;
  activeFocusId: string | null;
  activeZone: SpatialFocusZone;
  highContrastFocusRing: boolean;
  soundFeedback: boolean;
  debugOverlay: boolean;
}

export type StreamRecorderStatus = 'idle' | 'recording' | 'stopping' | 'error';

export interface ActiveRecordingState {
  status: StreamRecorderStatus;
  isRecording: boolean;
  channelId: string;
  channelName: string;
  streamUrl: string;
  startTime: number;
  elapsedSeconds: number;
  bytesRecorded: number;
  mimeType: string;
  maxDurationSeconds: number;
  error?: string;
  blobUrl?: string;
  downloadFilename?: string;
}

export type AudioDspPreset = 'flat' | 'bass_boost' | 'vocal_clarity' | 'night_mode' | 'treble_boost' | 'custom';

export interface AudioDspBands {
  subBass: number;   // 60 Hz (-12 to +12 dB)
  lowMid: number;    // 250 Hz
  mid: number;       // 1000 Hz
  upperMid: number;  // 4000 Hz
  high: number;      // 14000 Hz
}

export interface AudioDspConfig {
  enabled: boolean;
  preset: AudioDspPreset;
  bands: AudioDspBands;
  normalization: boolean;
  dialogueEnhancer: boolean;
  preampGain: number; // 0.5 to 2.0 (default 1.0)
}

export interface SleepTimerState {
  isActive: boolean;
  durationMinutes: number;
  remainingSeconds: number;
  audioFadeOut: boolean;
  bedtimeDimming: boolean;
  endAction: 'pause' | 'close' | 'mute';
  audioDuckRatio: number;
  dimRatio: number;
}

export interface PlaylistSubscription {
  id: string;
  name: string;
  url: string;
  autoSync: boolean;
  syncIntervalMinutes: number; // e.g. 15, 60, 360, 1440
  lastSyncTime?: string;
  channelCount: number;
  status: 'synced' | 'syncing' | 'error';
  errorMessage?: string;
  colorTag?: string;
}

export interface DvrRecording {
  id: string;
  channelId: string;
  channelName: string;
  channelLogo?: string;
  programTitle: string;
  programDescription?: string;
  streamUrl: string;
  catchupUrl?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'completed' | 'recording' | 'scheduled';
  recordedAt: string;
  fileSizeEstimate: string;
  blobUrl?: string;
  downloadFilename?: string;
}

export interface Bookmark {
  id: string;
  channelId: string;
  channelName: string;
  channelLogo?: string;
  programTitle?: string;
  streamUrl: string;
  savedAt: string;
  note?: string;
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

export interface ParentalControlsConfig {
  isEnabled: boolean;
  pinHash: string | null;
  isSessionUnlocked: boolean;
  sessionUnlockTimeoutMinutes: number; // e.g. 15, 30, 60, or 0 (until tab close)
  unlockedAtTimestamp: number | null;
  lockedChannelIds: string[];
  lockedCategories: string[];
  hideLockedChannelsInGuide: boolean;
  requirePinForSettings: boolean;
}
