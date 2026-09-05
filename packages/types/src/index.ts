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
