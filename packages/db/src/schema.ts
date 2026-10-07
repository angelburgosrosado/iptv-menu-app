import { pgTable, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import type { 
  UserProfile, 
  Playlist, 
  PlaylistRun, 
  EpgFeed, 
  BuildRequest, 
  AdminAction, 
  Workspace,
  AppConfig 
} from '@iptv-menu/types';

// ==========================================
// 1. USERS TABLE
// ==========================================
export const users = pgTable('users', {
  uid: text('uid').primaryKey(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoURL: text('photo_url'),
  role: text('role').default('user').notNull(), // 'user' | 'admin'
  accountStatus: text('account_status').default('active').notNull(), // 'active' | 'suspended'
  subscriptionTier: text('subscription_tier').default('free').notNull(), // 'free' | 'pro' | 'builder'
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 2. WORKSPACES TABLE
// ==========================================
export const workspaces = pgTable('workspaces', {
  workspaceId: text('workspace_id').primaryKey(),
  name: text('name').notNull(),
  ownerUid: text('owner_uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  plan: text('plan').default('free').notNull(), // 'free' | 'pro' | 'builder'
  subscriptionStatus: text('subscription_status').default('active').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  entitlements: jsonb('entitlements').$type<Workspace['entitlements']>().notNull(),
  usage: jsonb('usage').$type<Workspace['usage']>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 3. PLAYLISTS TABLE
// ==========================================
export const playlists = pgTable('playlists', {
  playlistId: text('playlist_id').primaryKey(),
  uid: text('uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  sourceType: text('source_type').notNull(), // 'url' | 'upload'
  originalFilePath: text('original_file_path'),
  cleanedFilePath: text('cleaned_file_path'),
  channelCount: integer('channel_count').default(0).notNull(),
  status: text('status').default('ready').notNull(),
  visibility: text('visibility').default('private').notNull(), // 'private' | 'public'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 4. PLAYLIST RUNS TABLE
// ==========================================
export const playlistRuns = pgTable('playlist_runs', {
  runId: text('run_id').primaryKey(),
  playlistId: text('playlist_id').references(() => playlists.playlistId, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'clean' | 'validate'
  status: text('status').default('queued').notNull(), // 'queued' | 'running' | 'completed' | 'failed'
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  summary: jsonb('summary').$type<PlaylistRun['summary']>(),
  error: text('error'),
});

// ==========================================
// 5. EPG FEEDS TABLE
// ==========================================
export const epgFeeds = pgTable('epg_feeds', {
  epgId: text('epg_id').primaryKey(),
  uid: text('uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  playlistId: text('playlist_id').references(() => playlists.playlistId, { onDelete: 'cascade' }).notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'generating' | 'ready' | 'failed'
  sourceConfig: jsonb('source_config').$type<EpgFeed['sourceConfig']>().notNull(),
  outputFilePath: text('output_file_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastGeneratedAt: timestamp('last_generated_at', { withTimezone: true }),
});

// ==========================================
// 6. BUILD REQUESTS TABLE
// ==========================================
export const buildRequests = pgTable('build_requests', {
  buildId: text('build_id').primaryKey(),
  uid: text('uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  appName: text('app_name').notNull(),
  brandConfig: jsonb('brand_config').$type<BuildRequest['brandConfig']>().notNull(),
  playlistSource: jsonb('playlist_source').$type<BuildRequest['playlistSource']>().notNull(),
  status: text('status').default('queued').notNull(), // 'queued' | 'building' | 'succeeded' | 'failed'
  artifactPath: text('artifact_path'),
  buildLogPath: text('build_log_path'),
  appConfigId: text('app_config_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 7. ADMIN ACTIONS (AUDIT LOGS) TABLE
// ==========================================
export const adminActions = pgTable('admin_actions', {
  actionId: text('action_id').primaryKey(),
  adminUid: text('admin_uid').notNull(),
  actionType: text('action_type').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  notes: text('notes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 8. APP CONFIGS (DYNAMIC REMOTE OTA) TABLE
// ==========================================
export const appConfigs = pgTable('app_configs', {
  appId: text('app_id').primaryKey(),
  workspaceId: text('workspace_id').references(() => workspaces.workspaceId, { onDelete: 'cascade' }).notNull(),
  ownerUid: text('owner_uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  theme: jsonb('theme').$type<AppConfig['theme']>().notNull(),
  playlistUrl: text('playlist_url').notNull(),
  epgUrl: text('epg_url'),
  announcement: text('announcement'),
  version: integer('version').default(1).notNull(),
  active: text('active').default('true').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
