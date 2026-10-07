export type UserRole = 'user' | 'pro' | 'builder' | 'admin';
export type AccountStatus = 'active' | 'suspended';

export interface Workspace {
  workspaceId: string;
  name: string;
  ownerUid: string;
  plan: 'free' | 'starter' | 'builder' | 'agency';
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'incomplete';
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  entitlements: {
    maxPlaylists: number;
    maxHostedPlaylists: number;
    maxDailyCleanups: number;
    maxMonthlyBuilds: number;
    allowBrandingCustomization: boolean;
    allowWhiteLabel: boolean;
  };
  usage: {
    activePlaylistsCount: number;
    activeHostedPlaylistsCount: number;
    dailyCleanupsUsed: number;
    monthlyBuildsUsed: number;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserProfile {
  uid: string;
  email: string;
  passwordHash?: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  subscriptionTier: 'free' | 'pro' | 'builder';
  accountStatus: AccountStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Subscription {
  subscriptionId: string;
  uid: string;
  provider: 'stripe';
  providerCustomerId: string;
  providerSubscriptionId: string;
  tier: 'pro' | 'builder';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  renewalDate: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type PlaylistSourceType = 'url' | 'upload';
export type PlaylistStatus = 'pending' | 'parsing' | 'cleaning' | 'validating' | 'ready' | 'failed';
export type PlaylistVisibility = 'private' | 'public';

export interface Playlist {
  playlistId: string;
  uid: string;
  name: string;
  sourceType: PlaylistSourceType;
  originalFilePath: string | null;
  cleanedFilePath: string | null;
  channelCount: number;
  status: PlaylistStatus;
  visibility: PlaylistVisibility;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type RunType = 'parse' | 'clean' | 'validate';
export type RunStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface PlaylistRun {
  runId: string;
  playlistId: string;
  type: RunType;
  status: RunStatus;
  startedAt: Date | string;
  completedAt: Date | string | null;
  summary: {
    channelsProcessed?: number;
    channelsRemoved?: number;
    errorsCount?: number;
    [key: string]: any;
  } | null;
  error: string | null;
}

export interface EpgFeed {
  epgId: string;
  uid: string;
  playlistId: string;
  status: 'pending' | 'generating' | 'ready' | 'failed';
  sourceConfig: {
    urls: string[];
    refreshIntervalHours: number;
  };
  outputFilePath: string | null;
  lastGeneratedAt: Date | string | null;
  createdAt: Date | string;
}

export type BuildStatus = 'queued' | 'building' | 'succeeded' | 'failed';

export interface BuildRequest {
  buildId: string;
  uid: string;
  appName: string;
  brandConfig: {
    primaryColor: string;
    logoUrl: string | null;
    accentColor: string;
  };
  playlistSource: {
    type: 'playlistId' | 'url';
    value: string;
  };
  status: BuildStatus;
  artifactPath: string | null;
  buildLogPath: string | null;
  appConfigId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AffiliateClick {
  clickId: string;
  uid: string | null;
  deviceId: string;
  referrer: string;
  createdAt: Date | string;
}

export interface AdminAction {
  actionId: string;
  adminUid: string;
  actionType: string;
  targetType: string;
  targetId: string;
  notes: string;
  createdAt: Date | string;
}

export interface SystemHealth {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  services: {
    api: 'up' | 'down';
    worker: 'up' | 'down';
    db: 'up' | 'down';
  };
}

export interface AppConfig {
  appId: string;
  workspaceId: string;
  ownerUid: string;
  name: string;
  slug: string;
  theme: {
    primaryColor: string;
    accentColor: string;
    logoUrl?: string;
  };
  playlistUrl: string;
  epgUrl?: string | null;
  announcement?: string | null;
  version: number;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PlaylistChannel {
  id: string;
  name: string;
  logo?: string;
  url: string;
  group?: string;
  tvgId?: string;
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
  channels: PlaylistChannel[];
  featuredLogos: string[];
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

export interface EpgProgramme {
  channelId: string;
  title: string;
  desc?: string;
  start: string; // ISO 8601 string
  stop: string;  // ISO 8601 string
  category?: string[];
  icon?: string;
  sourcePriority: number;
}

export interface NowNextProgrammes {
  now?: EpgProgramme;
  next?: EpgProgramme;
}

export interface IptvOrgChannel {
  id: string;
  name: string;
  alt_names?: string[];
  network?: string | null;
  owners?: string[];
  country?: string;
  categories?: string[];
  is_nsfw?: boolean;
  launched?: string | null;
  closed?: string | null;
  replaced_by?: string | null;
  website?: string | null;
  logo?: string | null;
}

export interface ChannelEnrichmentRequest {
  channels: PlaylistChannel[];
}

export interface ChannelEnrichmentResponse {
  channels: PlaylistChannel[];
  enrichedCount: number;
  totalCount: number;
}

export interface EpgLiveResponse {
  channels: Record<string, NowNextProgrammes>;
  updatedAt: string;
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
