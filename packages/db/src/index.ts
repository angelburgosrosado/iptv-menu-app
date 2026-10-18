import { getFirebaseAdmin } from '@iptv-menu/auth';
import { Logger } from '@iptv-menu/logging';
import { 
  UserProfile, Playlist, PlaylistRun, EpgFeed, BuildRequest, 
  AdminAction, UserRole, AccountStatus, Workspace, AppConfig, TvPairing
} from '@iptv-menu/types';
import { eq, desc, sql } from 'drizzle-orm';
import { getDb, schema } from './client';

export * from './schema';
export * from './client';
export { eq, desc, asc, and, sql } from 'drizzle-orm';

const logger = new Logger('db-repository');

// Fast in-memory state fallbacks for local test suite and offline environments
export const memoryUsers = new Map<string, UserProfile>();
export const memoryWorkspaces = new Map<string, Workspace>();
export const memoryPlaylists = new Map<string, Playlist>();
export const memoryPlaylistRuns = new Map<string, PlaylistRun[]>();
export const memoryEpgFeeds = new Map<string, EpgFeed>();
export const memoryBuilds = new Map<string, BuildRequest>();
export const memoryPairings = new Map<string, TvPairing>();
export const memoryAppConfigs = new Map<string, AppConfig>();
export const memoryAuditLogs: AdminAction[] = [];

// Lazy-initialized Firestore instance for fallback/hybrid operations
let dbInstance: any = null;

export function getFirestoreDB(): any {
  if (dbInstance) return dbInstance;
  const adminApp = getFirebaseAdmin();
  if (!adminApp || typeof adminApp.firestore !== 'function') {
    const memoryStore = new Map<string, Map<string, any>>();
    const getCol = (name: string) => {
      if (!memoryStore.has(name)) memoryStore.set(name, new Map());
      return memoryStore.get(name)!;
    };

    dbInstance = {
      collection: (colName: string) => {
        const col = getCol(colName);
        return {
          doc: (docId: string) => ({
            get: async () => ({
              exists: col.has(docId),
              data: () => col.get(docId) || null
            }),
            set: async (data: any) => { col.set(docId, data); },
            update: async (data: any) => {
              const prev = col.get(docId) || {};
              col.set(docId, { ...prev, ...data });
            },
            delete: async () => { col.delete(docId); }
          }),
          where: (field: string, op: string, val: any) => {
            const matches = Array.from(col.values()).filter((item: any) => item && item[field] === val);
            return {
              limit: (n: number) => ({
                get: async () => ({
                  empty: matches.length === 0,
                  docs: matches.slice(0, n).map(m => ({ data: () => m, exists: true }))
                })
              }),
              get: async () => ({
                empty: matches.length === 0,
                docs: matches.map(m => ({ data: () => m, exists: true }))
              })
            };
          },
          orderBy: () => ({
            limit: (n: number) => ({
              get: async () => {
                const items = Array.from(col.values());
                return { docs: items.slice(0, n).map(m => ({ data: () => m, exists: true })) };
              }
            }),
            get: async () => {
              const items = Array.from(col.values());
              return { docs: items.map(m => ({ data: () => m, exists: true })) };
            }
          }),
          limit: (n: number) => ({
            get: async () => {
              const items = Array.from(col.values());
              return { docs: items.slice(0, n).map(m => ({ data: () => m, exists: true })) };
            }
          }),
          get: async () => {
            const items = Array.from(col.values());
            return {
              empty: items.length === 0,
              docs: items.map(m => ({ data: () => m, exists: true }))
            };
          }
        };
      }
    };
    return dbInstance;
  }
  dbInstance = adminApp.firestore();
  return dbInstance;
}

export enum DbOperation {
  GET = 'get',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list'
}

function handleFirestoreError(error: any, op: DbOperation, collection: string, docId?: string): never {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType: op,
    path: docId ? `${collection}/${docId}` : collection,
    timestamp: new Date().toISOString(),
  };

  logger.error(`Firestore Error during ${op} on ${collection}`, error, errInfo);
  throw new Error(JSON.stringify(errInfo));
}

// ==========================================
// USER REPOSITORY
// ==========================================
export class UserRepository {
  private collection = 'users';

  private get db() {
    return getFirestoreDB();
  }

  async getUser(uid: string): Promise<UserProfile | null> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const [row] = await db.select().from(schema.users).where(eq(schema.users.uid, uid)).limit(1);
        if (row) {
          return {
            uid: row.uid,
            email: row.email,
            displayName: row.displayName || undefined,
            photoURL: row.photoURL || null,
            role: row.role as any,
            accountStatus: row.accountStatus as any,
            subscriptionTier: row.subscriptionTier as any,
            passwordHash: row.passwordHash || null,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        logger.warn('Neon Drizzle error in getUser, checking memory fallback', err);
      }
    }

    if (memoryUsers.has(uid)) {
      return memoryUsers.get(uid)!;
    }

    try {
      const doc = await this.db.collection(this.collection).doc(uid).get();
      if (!doc.exists) return null;
      return doc.data() as UserProfile;
    } catch {
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const [row] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
        if (row) {
          return {
            uid: row.uid,
            email: row.email,
            displayName: row.displayName || undefined,
            photoURL: row.photoURL || null,
            role: row.role as any,
            accountStatus: row.accountStatus as any,
            subscriptionTier: row.subscriptionTier as any,
            passwordHash: row.passwordHash || null,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        logger.warn('Neon Drizzle error in getUserByEmail, checking memory fallback', err);
      }
    }

    const memoryUser = Array.from(memoryUsers.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (memoryUser) return memoryUser;

    try {
      const snap = await this.db.collection(this.collection).where('email', '==', email).limit(1).get();
      if (snap.empty) return null;
      return snap.docs[0].data() as UserProfile;
    } catch {
      return null;
    }
  }

  async createUser(profile: UserProfile): Promise<void> {
    memoryUsers.set(profile.uid, { ...profile });

    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        await db.insert(schema.users).values({
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName || null,
          photoURL: profile.photoURL || null,
          role: profile.role || 'user',
          accountStatus: profile.accountStatus || 'active',
          subscriptionTier: profile.subscriptionTier || 'free',
          passwordHash: profile.passwordHash || null,
        } as any).onConflictDoUpdate({
          target: schema.users.uid,
          set: {
            email: profile.email,
            displayName: profile.displayName || null,
            photoURL: profile.photoURL || null,
            role: profile.role,
            accountStatus: profile.accountStatus,
            subscriptionTier: profile.subscriptionTier,
            passwordHash: profile.passwordHash !== undefined ? profile.passwordHash : undefined,
            updatedAt: new Date(),
          } as any,
        });
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in createUser', err);
      }
    }

    try {
      await this.db.collection(this.collection).doc(profile.uid).set({
        ...profile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch {
      // Memory state preserved
    }
  }

  async updateUser(uid: string, data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>): Promise<void> {
    const existing = memoryUsers.get(uid);
    if (existing) {
      memoryUsers.set(uid, {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString()
      });
    }

    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const updatePayload: any = {
          ...data,
          updatedAt: new Date(),
        };
        await db.update(schema.users).set(updatePayload).where(eq(schema.users.uid, uid));
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in updateUser', err);
      }
    }

    try {
      await this.db.collection(this.collection).doc(uid).update({
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch {
      // Memory state preserved
    }
  }

  async listUsers(limit = 100, offset = 0): Promise<UserProfile[]> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const rows = await db.select().from(schema.users)
          .orderBy(desc(schema.users.createdAt))
          .limit(limit)
          .offset(offset);
        return rows.map((row) => ({
          uid: row.uid,
          email: row.email,
          displayName: row.displayName || undefined,
          photoURL: row.photoURL || null,
          role: row.role as any,
          accountStatus: row.accountStatus as any,
          subscriptionTier: row.subscriptionTier as any,
          passwordHash: row.passwordHash || null,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }));
      } catch (err) {
        logger.warn('Neon Drizzle error in listUsers, falling back to memory', err);
      }
    }

    return Array.from(memoryUsers.values());
  }
}

// ==========================================
// PLAYLIST REPOSITORY
// ==========================================
export class PlaylistRepository {
  private collection = 'playlists';

  private get db() {
    return getFirestoreDB();
  }

  async getPlaylist(playlistId: string): Promise<Playlist | null> {
    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const [row] = await db.select().from(schema.playlists).where(eq(schema.playlists.playlistId, playlistId)).limit(1);
        if (row) {
          return {
            playlistId: row.playlistId,
            uid: row.uid,
            name: row.name,
            sourceType: row.sourceType as any,
            originalFilePath: row.originalFilePath || null,
            cleanedFilePath: row.cleanedFilePath || null,
            channelCount: row.channelCount,
            status: row.status as any,
            visibility: (row.visibility as any) || 'private',
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        logger.warn('Neon Drizzle error in getPlaylist, checking memory fallback', err);
      }
    }

    if (memoryPlaylists.has(playlistId)) {
      return memoryPlaylists.get(playlistId)!;
    }

    try {
      const doc = await this.db.collection(this.collection).doc(playlistId).get();
      if (!doc.exists) return null;
      return doc.data() as Playlist;
    } catch {
      return null;
    }
  }

  async createPlaylist(playlist: Playlist): Promise<void> {
    memoryPlaylists.set(playlist.playlistId, { ...playlist });

    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        await db.insert(schema.playlists).values({
          playlistId: playlist.playlistId,
          uid: playlist.uid,
          name: playlist.name,
          sourceType: playlist.sourceType,
          originalFilePath: playlist.originalFilePath || null,
          cleanedFilePath: playlist.cleanedFilePath || null,
          channelCount: playlist.channelCount || 0,
          status: playlist.status || 'ready',
          visibility: playlist.visibility || 'private',
        } as any).onConflictDoUpdate({
          target: schema.playlists.playlistId,
          set: {
            name: playlist.name,
            sourceType: playlist.sourceType,
            originalFilePath: playlist.originalFilePath || null,
            cleanedFilePath: playlist.cleanedFilePath || null,
            channelCount: playlist.channelCount,
            status: playlist.status,
            visibility: playlist.visibility || 'private',
            updatedAt: new Date(),
          } as any,
        });
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in createPlaylist', err);
      }
    }
  }

  async updatePlaylist(playlistId: string, data: Partial<Omit<Playlist, 'playlistId' | 'uid' | 'createdAt'>>): Promise<void> {
    const existing = memoryPlaylists.get(playlistId);
    if (existing) {
      memoryPlaylists.set(playlistId, {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString()
      });
    }

    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const updatePayload: any = {
          ...data,
          updatedAt: new Date(),
        };
        await db.update(schema.playlists).set(updatePayload).where(eq(schema.playlists.playlistId, playlistId));
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in updatePlaylist', err);
      }
    }
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    memoryPlaylists.delete(playlistId);

    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        await db.delete(schema.playlists).where(eq(schema.playlists.playlistId, playlistId));
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in deletePlaylist', err);
      }
    }
  }

  async listUserPlaylists(uid: string): Promise<Playlist[]> {
    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const rows = await db.select().from(schema.playlists)
          .where(eq(schema.playlists.uid, uid))
          .orderBy(desc(schema.playlists.createdAt));
        return rows.map((row) => ({
          playlistId: row.playlistId,
          uid: row.uid,
          name: row.name,
          sourceType: row.sourceType as any,
          originalFilePath: row.originalFilePath || null,
          cleanedFilePath: row.cleanedFilePath || null,
          channelCount: row.channelCount,
          status: row.status as any,
          visibility: (row.visibility as any) || 'private',
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }));
      } catch (err) {
        logger.warn('Neon Drizzle error in listUserPlaylists, checking memory fallback', err);
      }
    }

    return Array.from(memoryPlaylists.values()).filter(p => p.uid === uid);
  }

  async listAllPlaylists(): Promise<Playlist[]> {
    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const rows = await db.select().from(schema.playlists)
          .orderBy(desc(schema.playlists.createdAt));
        return rows.map((row) => ({
          playlistId: row.playlistId,
          uid: row.uid,
          name: row.name,
          sourceType: row.sourceType as any,
          originalFilePath: row.originalFilePath || null,
          cleanedFilePath: row.cleanedFilePath || null,
          channelCount: row.channelCount,
          status: row.status as any,
          visibility: (row.visibility as any) || 'private',
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }));
      } catch (err) {
        logger.warn('Neon Drizzle error in listAllPlaylists, checking memory fallback', err);
      }
    }

    return Array.from(memoryPlaylists.values());
  }

  // Subcollection / Runs
  async createPlaylistRun(playlistId: string, run: PlaylistRun): Promise<void> {
    const runs = memoryPlaylistRuns.get(playlistId) || [];
    runs.unshift({ ...run, startedAt: run.startedAt || new Date().toISOString() });
    memoryPlaylistRuns.set(playlistId, runs);

    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        await db.insert(schema.playlistRuns).values({
          runId: run.runId,
          playlistId,
          type: run.type,
          status: run.status || 'queued',
          summary: run.summary || null,
          error: run.error || null,
        } as any);
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in createPlaylistRun', err);
      }
    }
  }

  async updatePlaylistRun(playlistId: string, runId: string, data: Partial<Omit<PlaylistRun, 'runId' | 'playlistId' | 'startedAt'>>): Promise<void> {
    const runs = memoryPlaylistRuns.get(playlistId) || [];
    const idx = runs.findIndex(r => r.runId === runId);
    if (idx !== -1) {
      runs[idx] = {
        ...runs[idx],
        ...data,
        completedAt: data.status === 'completed' || data.status === 'failed' ? new Date().toISOString() : runs[idx].completedAt
      };
      memoryPlaylistRuns.set(playlistId, runs);
    }

    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const updatePayload: any = {
          ...data,
          completedAt: data.status === 'completed' || data.status === 'failed' ? new Date() : null,
        };
        await db.update(schema.playlistRuns).set(updatePayload).where(eq(schema.playlistRuns.runId, runId));
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in updatePlaylistRun', err);
      }
    }
  }

  async getPlaylistRuns(playlistId: string): Promise<PlaylistRun[]> {
    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const rows = await db.select().from(schema.playlistRuns)
          .where(eq(schema.playlistRuns.playlistId, playlistId))
          .orderBy(desc(schema.playlistRuns.startedAt));
        return rows.map((row) => ({
          runId: row.runId,
          playlistId: row.playlistId,
          type: row.type as any,
          status: row.status as any,
          startedAt: row.startedAt.toISOString(),
          completedAt: row.completedAt ? row.completedAt.toISOString() : null,
          summary: row.summary || null,
          error: row.error || null,
        }));
      } catch (err) {
        logger.warn('Neon Drizzle error in getPlaylistRuns, falling back to memory', err);
      }
    }

    return memoryPlaylistRuns.get(playlistId) || [];
  }

  async listPlaylistRuns(playlistId: string): Promise<PlaylistRun[]> {
    return this.getPlaylistRuns(playlistId);
  }
}

// ==========================================
// EPG REPOSITORY
// ==========================================
export class EpgRepository {
  private collection = 'epgFeeds';

  private get db() {
    return getFirestoreDB();
  }

  async getEpg(epgId: string): Promise<EpgFeed | null> {
    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const [row] = await db.select().from(schema.epgFeeds).where(eq(schema.epgFeeds.epgId, epgId)).limit(1);
        if (row) {
          return {
            epgId: row.epgId,
            uid: row.uid,
            playlistId: row.playlistId || null,
            status: row.status as any,
            sourceConfig: row.sourceConfig,
            outputFilePath: row.outputFilePath || null,
            createdAt: row.createdAt.toISOString(),
            lastGeneratedAt: row.lastGeneratedAt ? row.lastGeneratedAt.toISOString() : null,
          };
        }
      } catch (err) {
        logger.warn('Neon Drizzle error in getEpg, checking memory fallback', err);
      }
    }

    if (memoryEpgFeeds.has(epgId)) {
      return memoryEpgFeeds.get(epgId)!;
    }

    try {
      const doc = await this.db.collection(this.collection).doc(epgId).get();
      if (!doc.exists) return null;
      return doc.data() as EpgFeed;
    } catch {
      return null;
    }
  }

  async createEpg(epg: EpgFeed): Promise<void> {
    memoryEpgFeeds.set(epg.epgId, { ...epg });

    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        await db.insert(schema.epgFeeds).values({
          epgId: epg.epgId,
          uid: epg.uid,
          playlistId: epg.playlistId || null,
          status: epg.status || 'pending',
          sourceConfig: epg.sourceConfig,
          outputFilePath: epg.outputFilePath || null,
          lastGeneratedAt: epg.lastGeneratedAt ? new Date(epg.lastGeneratedAt) : null,
        } as any).onConflictDoUpdate({
          target: schema.epgFeeds.epgId,
          set: {
            playlistId: epg.playlistId || null,
            status: epg.status,
            sourceConfig: epg.sourceConfig,
            outputFilePath: epg.outputFilePath || null,
            lastGeneratedAt: epg.lastGeneratedAt ? new Date(epg.lastGeneratedAt) : null,
          } as any,
        });
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in createEpg', err);
      }
    }
  }

  async updateEpg(epgId: string, data: Partial<Omit<EpgFeed, 'epgId' | 'uid' | 'createdAt'>>): Promise<void> {
    const existing = memoryEpgFeeds.get(epgId);
    if (existing) {
      memoryEpgFeeds.set(epgId, {
        ...existing,
        ...data,
      });
    }

    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const updatePayload: any = { ...data };
        if (data.lastGeneratedAt) {
          updatePayload.lastGeneratedAt = new Date(data.lastGeneratedAt);
        }
        await db.update(schema.epgFeeds).set(updatePayload).where(eq(schema.epgFeeds.epgId, epgId));
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in updateEpg', err);
      }
    }
  }

  async listUserEpgs(uid: string): Promise<EpgFeed[]> {
    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const rows = await db.select().from(schema.epgFeeds)
          .where(eq(schema.epgFeeds.uid, uid))
          .orderBy(desc(schema.epgFeeds.createdAt));
        return rows.map((row) => ({
          epgId: row.epgId,
          uid: row.uid,
          playlistId: row.playlistId || null,
          status: row.status as any,
          sourceConfig: row.sourceConfig,
          outputFilePath: row.outputFilePath || null,
          createdAt: row.createdAt.toISOString(),
          lastGeneratedAt: row.lastGeneratedAt ? row.lastGeneratedAt.toISOString() : null,
        }));
      } catch (err) {
        logger.warn('Neon Drizzle error in listUserEpgs, checking memory fallback', err);
      }
    }

    return Array.from(memoryEpgFeeds.values()).filter(feed => feed.uid === uid);
  }
}

// ==========================================
// BUILD REPOSITORY
// ==========================================
export class BuildRepository {
  private collection = 'buildRequests';

  private get db() {
    return getFirestoreDB();
  }

  async getBuild(buildId: string): Promise<BuildRequest | null> {
    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const [row] = await db.select().from(schema.buildRequests).where(eq(schema.buildRequests.buildId, buildId)).limit(1);
        if (row) {
          return {
            buildId: row.buildId,
            uid: row.uid,
            appName: row.appName,
            brandConfig: row.brandConfig,
            playlistSource: row.playlistSource,
            status: row.status as any,
            artifactPath: row.artifactPath || null,
            buildLogPath: row.buildLogPath || null,
            appConfigId: row.appConfigId || null,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        logger.warn('Neon Drizzle error in getBuild, checking memory fallback', err);
      }
    }

    if (memoryBuilds.has(buildId)) {
      return memoryBuilds.get(buildId)!;
    }

    try {
      const doc = await this.db.collection(this.collection).doc(buildId).get();
      if (!doc.exists) return null;
      return doc.data() as BuildRequest;
    } catch {
      return null;
    }
  }

  async createBuild(build: BuildRequest): Promise<void> {
    memoryBuilds.set(build.buildId, { ...build });

    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        await db.insert(schema.buildRequests).values({
          buildId: build.buildId,
          uid: build.uid,
          appName: build.appName,
          brandConfig: build.brandConfig,
          playlistSource: build.playlistSource,
          status: build.status || 'queued',
          artifactPath: build.artifactPath || null,
          buildLogPath: build.buildLogPath || null,
          appConfigId: build.appConfigId || null,
        } as any).onConflictDoUpdate({
          target: schema.buildRequests.buildId,
          set: {
            appName: build.appName,
            brandConfig: build.brandConfig,
            playlistSource: build.playlistSource,
            status: build.status,
            artifactPath: build.artifactPath || null,
            buildLogPath: build.buildLogPath || null,
            appConfigId: build.appConfigId || null,
            updatedAt: new Date(),
          } as any,
        });
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in createBuild', err);
      }
    }
  }

  async updateBuild(buildId: string, data: Partial<Omit<BuildRequest, 'buildId' | 'uid' | 'createdAt'>>): Promise<void> {
    const existing = memoryBuilds.get(buildId);
    if (existing) {
      memoryBuilds.set(buildId, {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString()
      });
    }

    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const updatePayload: any = {
          ...data,
          updatedAt: new Date(),
        };
        await db.update(schema.buildRequests).set(updatePayload).where(eq(schema.buildRequests.buildId, buildId));
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in updateBuild', err);
      }
    }
  }

  async listUserBuilds(uid: string): Promise<BuildRequest[]> {
    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const rows = await db.select().from(schema.buildRequests)
          .where(eq(schema.buildRequests.uid, uid))
          .orderBy(desc(schema.buildRequests.createdAt));
        return rows.map((row) => ({
          buildId: row.buildId,
          uid: row.uid,
          appName: row.appName,
          brandConfig: row.brandConfig,
          playlistSource: row.playlistSource,
          status: row.status as any,
          artifactPath: row.artifactPath || null,
          buildLogPath: row.buildLogPath || null,
          appConfigId: row.appConfigId || null,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }));
      } catch (err) {
        logger.warn('Neon Drizzle error in listUserBuilds, checking memory fallback', err);
      }
    }

    return Array.from(memoryBuilds.values()).filter(b => b.uid === uid);
  }

  async listAllBuilds(): Promise<BuildRequest[]> {
    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const rows = await db.select().from(schema.buildRequests)
          .orderBy(desc(schema.buildRequests.createdAt));
        return rows.map((row) => ({
          buildId: row.buildId,
          uid: row.uid,
          appName: row.appName,
          brandConfig: row.brandConfig,
          playlistSource: row.playlistSource,
          status: row.status as any,
          artifactPath: row.artifactPath || null,
          buildLogPath: row.buildLogPath || null,
          appConfigId: row.appConfigId || null,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }));
      } catch (err) {
        logger.warn('Neon Drizzle error in listAllBuilds, checking memory fallback', err);
      }
    }

    return Array.from(memoryBuilds.values());
  }
}

// ==========================================
// WORKSPACE REPOSITORY
// ==========================================
export class WorkspaceRepository {
  private collection = 'workspaces';

  private get db() {
    return getFirestoreDB();
  }

  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const [row] = await db.select().from(schema.workspaces).where(eq(schema.workspaces.workspaceId, workspaceId)).limit(1);
        if (row) {
          return {
            workspaceId: row.workspaceId,
            name: row.name,
            ownerUid: row.ownerUid,
            plan: row.plan as any,
            subscriptionStatus: row.subscriptionStatus as any,
            stripeCustomerId: row.stripeCustomerId || null,
            stripeSubscriptionId: row.stripeSubscriptionId || null,
            entitlements: row.entitlements,
            usage: row.usage,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        logger.warn('Neon Drizzle error in getWorkspace, checking memory fallback', err);
      }
    }

    if (memoryWorkspaces.has(workspaceId)) {
      return memoryWorkspaces.get(workspaceId)!;
    }

    try {
      const doc = await this.db.collection(this.collection).doc(workspaceId).get();
      if (!doc.exists) return null;
      return doc.data() as Workspace;
    } catch {
      return null;
    }
  }

  async createWorkspace(workspace: Workspace): Promise<void> {
    memoryWorkspaces.set(workspace.workspaceId, { ...workspace });

    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        await db.insert(schema.workspaces).values({
          workspaceId: workspace.workspaceId,
          name: workspace.name,
          ownerUid: workspace.ownerUid,
          plan: workspace.plan || 'free',
          subscriptionStatus: workspace.subscriptionStatus || 'active',
          stripeCustomerId: workspace.stripeCustomerId || null,
          stripeSubscriptionId: workspace.stripeSubscriptionId || null,
          entitlements: workspace.entitlements,
          usage: workspace.usage,
        } as any).onConflictDoUpdate({
          target: schema.workspaces.workspaceId,
          set: {
            name: workspace.name,
            plan: workspace.plan,
            subscriptionStatus: workspace.subscriptionStatus,
            stripeCustomerId: workspace.stripeCustomerId || null,
            stripeSubscriptionId: workspace.stripeSubscriptionId || null,
            entitlements: workspace.entitlements,
            usage: workspace.usage,
            updatedAt: new Date(),
          } as any,
        });
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in createWorkspace', err);
      }
    }
  }

  async updateWorkspace(workspaceId: string, data: Partial<Omit<Workspace, 'workspaceId' | 'ownerUid' | 'createdAt'>>): Promise<void> {
    const existing = memoryWorkspaces.get(workspaceId);
    if (existing) {
      memoryWorkspaces.set(workspaceId, {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString()
      });
    }

    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const updatePayload: any = {
          ...data,
          updatedAt: new Date(),
        };
        await db.update(schema.workspaces).set(updatePayload).where(eq(schema.workspaces.workspaceId, workspaceId));
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in updateWorkspace', err);
      }
    }
  }

  async listUserWorkspaces(uid: string): Promise<Workspace[]> {
    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const rows = await db.select().from(schema.workspaces)
          .where(eq(schema.workspaces.ownerUid, uid))
          .orderBy(desc(schema.workspaces.createdAt));
        return rows.map((row) => ({
          workspaceId: row.workspaceId,
          name: row.name,
          ownerUid: row.ownerUid,
          plan: row.plan as any,
          subscriptionStatus: row.subscriptionStatus as any,
          stripeCustomerId: row.stripeCustomerId || null,
          stripeSubscriptionId: row.stripeSubscriptionId || null,
          entitlements: row.entitlements,
          usage: row.usage,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }));
      } catch (err) {
        logger.warn('Neon Drizzle error in listUserWorkspaces, falling back to memory', err);
      }
    }

    return Array.from(memoryWorkspaces.values()).filter(ws => ws.ownerUid === uid);
  }

  async listAllWorkspaces(limit = 100): Promise<Workspace[]> {
    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const rows = await db.select().from(schema.workspaces)
          .orderBy(desc(schema.workspaces.createdAt))
          .limit(limit);
        return rows.map((row) => ({
          workspaceId: row.workspaceId,
          name: row.name,
          ownerUid: row.ownerUid,
          plan: row.plan as any,
          subscriptionStatus: row.subscriptionStatus as any,
          stripeCustomerId: row.stripeCustomerId || null,
          stripeSubscriptionId: row.stripeSubscriptionId || null,
          entitlements: row.entitlements,
          usage: row.usage,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }));
      } catch (err) {
        logger.warn('Neon Drizzle error in listAllWorkspaces, returning memory workspaces', err);
      }
    }

    return Array.from(memoryWorkspaces.values()).slice(0, limit);
  }
}

// ==========================================
// AUDIT LOG REPOSITORY
// ==========================================
export class AuditLogRepository {
  private collection = 'adminActions';

  private get db() {
    return getFirestoreDB();
  }

  async logAction(action: AdminAction): Promise<void> {
    memoryAuditLogs.unshift({ ...action });

    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        await db.insert(schema.adminActions).values({
          actionId: action.actionId,
          adminUid: action.adminUid,
          actionType: action.actionType,
          targetType: action.targetType,
          targetId: action.targetId,
          notes: action.notes,
        });
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in logAction', err);
      }
    }

    try {
      await this.db.collection(this.collection).doc(action.actionId).set({
        ...action,
        createdAt: new Date().toISOString()
      });
    } catch {
      // Memory state preserved
    }
  }

  async listActions(limit = 100): Promise<AdminAction[]> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const rows = await db.select().from(schema.adminActions)
          .orderBy(desc(schema.adminActions.createdAt))
          .limit(limit);
        return rows.map((row) => ({
          actionId: row.actionId,
          adminUid: row.adminUid,
          actionType: row.actionType,
          targetType: row.targetType,
          targetId: row.targetId,
          notes: row.notes,
          createdAt: row.createdAt.toISOString(),
        }));
      } catch (err) {
        logger.warn('Neon Drizzle error in listActions, falling back to memory', err);
      }
    }

    try {
      const snapshot = await this.db.collection(this.collection)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map((d: any) => d.data() as AdminAction);
    } catch {
      return memoryAuditLogs.slice(0, limit);
    }
  }
}

// ==========================================
// APP CONFIG REPOSITORY (DYNAMIC REMOTE OTA)
// ==========================================
export class AppConfigRepository {
  private collection = 'app_configs';

  private get db() {
    return getFirestoreDB();
  }

  async getAppConfig(appId: string): Promise<AppConfig | null> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const [row] = await db.select().from(schema.appConfigs).where(eq(schema.appConfigs.appId, appId)).limit(1);
        if (row) {
          return {
            appId: row.appId,
            workspaceId: row.workspaceId,
            ownerUid: row.ownerUid,
            name: row.name,
            slug: row.slug,
            theme: row.theme,
            playlistUrl: row.playlistUrl,
            epgUrl: row.epgUrl,
            announcement: row.announcement,
            version: row.version,
            active: row.active === 'true',
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        logger.warn('Neon Drizzle error in getAppConfig, checking memory fallback', err);
      }
    }

    if (memoryAppConfigs.has(appId)) {
      return memoryAppConfigs.get(appId)!;
    }

    try {
      const doc = await this.db.collection(this.collection).doc(appId).get();
      if (!doc.exists) return null;
      return doc.data() as AppConfig;
    } catch {
      return null;
    }
  }

  async createAppConfig(data: Omit<AppConfig, 'createdAt' | 'updatedAt' | 'version'>): Promise<AppConfig> {
    const now = new Date();
    const configRecord: AppConfig = {
      ...data,
      version: 1,
      active: data.active ?? true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    memoryAppConfigs.set(configRecord.appId, configRecord);

    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        await db.insert(schema.appConfigs).values({
          appId: configRecord.appId,
          workspaceId: configRecord.workspaceId,
          ownerUid: configRecord.ownerUid,
          name: configRecord.name,
          slug: configRecord.slug,
          theme: configRecord.theme,
          playlistUrl: configRecord.playlistUrl,
          epgUrl: configRecord.epgUrl || null,
          announcement: configRecord.announcement || null,
          version: 1,
          active: configRecord.active ? 'true' : 'false',
          createdAt: now,
          updatedAt: now,
        } as any);
        return configRecord;
      } catch (err) {
        logger.warn('Neon Drizzle error in createAppConfig', err);
      }
    }

    try {
      await this.db.collection(this.collection).doc(configRecord.appId).set(configRecord);
    } catch {
      // Memory state preserved
    }

    return configRecord;
  }

  async updateAppConfig(appId: string, updates: Partial<Omit<AppConfig, 'appId' | 'workspaceId' | 'ownerUid'>>): Promise<AppConfig> {
    const now = new Date();
    const existingMemory = memoryAppConfigs.get(appId);
    let fallbackVersion = existingMemory ? (existingMemory.version || 1) + 1 : 1;

    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const [existing] = await db.select().from(schema.appConfigs).where(eq(schema.appConfigs.appId, appId)).limit(1);
        if (existing) {
          const newVersion = (existing.version || 1) + 1;
          const updatePayload: any = {
            updatedAt: now,
            version: newVersion,
          };
          if (updates.name !== undefined) updatePayload.name = updates.name;
          if (updates.slug !== undefined) updatePayload.slug = updates.slug;
          if (updates.theme !== undefined) updatePayload.theme = updates.theme;
          if (updates.playlistUrl !== undefined) updatePayload.playlistUrl = updates.playlistUrl;
          if (updates.epgUrl !== undefined) updatePayload.epgUrl = updates.epgUrl;
          if (updates.announcement !== undefined) updatePayload.announcement = updates.announcement;
          if (updates.active !== undefined) updatePayload.active = updates.active ? 'true' : 'false';

          await db.update(schema.appConfigs).set(updatePayload).where(eq(schema.appConfigs.appId, appId));

          const [updated] = await db.select().from(schema.appConfigs).where(eq(schema.appConfigs.appId, appId)).limit(1);
          const result: AppConfig = {
            appId: updated.appId,
            workspaceId: updated.workspaceId,
            ownerUid: updated.ownerUid,
            name: updated.name,
            slug: updated.slug,
            theme: updated.theme,
            playlistUrl: updated.playlistUrl,
            epgUrl: updated.epgUrl,
            announcement: updated.announcement,
            version: updated.version,
            active: updated.active === 'true',
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
          };
          memoryAppConfigs.set(appId, result);
          return result;
        }
      } catch (err) {
        logger.warn('Neon Drizzle error in updateAppConfig, checking fallback', err);
      }
    }

    const baseConfig = existingMemory || {
      appId,
      workspaceId: 'default',
      ownerUid: 'system',
      name: updates.name || 'IPTV App',
      slug: updates.slug || 'iptv-app',
      theme: updates.theme || { primaryColor: '#6366f1', accentColor: '#ec4899' },
      playlistUrl: updates.playlistUrl || '',
      epgUrl: updates.epgUrl || null,
      announcement: updates.announcement || null,
      version: 1,
      active: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const finalData: AppConfig = {
      ...baseConfig,
      ...updates,
      version: fallbackVersion,
      updatedAt: now.toISOString(),
    };
    memoryAppConfigs.set(appId, finalData);

    try {
      const docRef = this.db.collection(this.collection).doc(appId);
      await docRef.set(finalData, { merge: true });
    } catch {
      // Memory state preserved
    }

    return finalData;
  }

  async listAppConfigsByWorkspace(workspaceId: string): Promise<AppConfig[]> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const rows = await db.select().from(schema.appConfigs)
          .where(eq(schema.appConfigs.workspaceId, workspaceId))
          .orderBy(desc(schema.appConfigs.updatedAt));
        return rows.map((row) => ({
          appId: row.appId,
          workspaceId: row.workspaceId,
          ownerUid: row.ownerUid,
          name: row.name,
          slug: row.slug,
          theme: row.theme,
          playlistUrl: row.playlistUrl,
          epgUrl: row.epgUrl,
          announcement: row.announcement,
          version: row.version,
          active: row.active === 'true',
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }));
      } catch (err) {
        logger.warn('Neon Drizzle error in listAppConfigsByWorkspace, checking memory fallback', err);
      }
    }

    return Array.from(memoryAppConfigs.values()).filter(c => c.workspaceId === workspaceId);
  }

  async deleteAppConfig(appId: string): Promise<void> {
    memoryAppConfigs.delete(appId);

    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        await db.delete(schema.appConfigs).where(eq(schema.appConfigs.appId, appId));
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in deleteAppConfig', err);
      }
    }

    try {
      await this.db.collection(this.collection).doc(appId).delete();
    } catch {
      // Memory state preserved
    }
  }
}

export class TvPairingRepository {
  private collection = 'tvPairings';

  get db() {
    return getFirestoreDB();
  }

  async createPairing(pairing: TvPairing): Promise<void> {
    memoryPairings.set(pairing.code, { ...pairing });

    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        await db.insert(schema.tvPairings).values({
          code: pairing.code,
          deviceId: pairing.deviceId || null,
          deviceName: pairing.deviceName,
          status: pairing.status,
          token: pairing.token || null,
          user: pairing.user || null,
          expiresAt: new Date(pairing.expiresAt),
          createdAt: new Date(pairing.createdAt),
        } as any).onConflictDoUpdate({
          target: schema.tvPairings.code,
          set: {
            deviceId: pairing.deviceId || null,
            deviceName: pairing.deviceName,
            status: pairing.status,
            token: pairing.token || null,
            user: pairing.user || null,
            expiresAt: new Date(pairing.expiresAt),
          } as any,
        });
        return;
      } catch (err) {
        logger.warn('Neon Drizzle error in createPairing', err);
      }
    }
  }

  async getPairing(code: string): Promise<TvPairing | null> {
    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        const [row] = await db.select().from(schema.tvPairings).where(eq(schema.tvPairings.code, code)).limit(1);
        if (row) {
          return {
            code: row.code,
            deviceId: row.deviceId || null,
            deviceName: row.deviceName,
            status: row.status as any,
            token: row.token || null,
            user: row.user || null,
            expiresAt: row.expiresAt.toISOString(),
            createdAt: row.createdAt.toISOString(),
          };
        }
      } catch (err) {
        logger.warn('Neon Drizzle error in getPairing, checking memory fallback', err);
      }
    }

    if (memoryPairings.has(code)) {
      return memoryPairings.get(code)!;
    }

    try {
      const doc = await this.db.collection(this.collection).doc(code).get();
      if (!doc.exists) return null;
      return doc.data() as TvPairing;
    } catch {
      return null;
    }
  }

  async claimPairing(code: string, token: string, user: TvPairing['user']): Promise<TvPairing | null> {
    const existing = await this.getPairing(code);
    if (!existing) return null;

    const expiresAtMs = new Date(existing.expiresAt).getTime();
    if (expiresAtMs < Date.now()) {
      return null;
    }

    const updated: TvPairing = {
      ...existing,
      status: 'claimed',
      token,
      user,
    };

    memoryPairings.set(code, updated);

    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        await db.update(schema.tvPairings).set({
          status: 'claimed',
          token,
          user: user as any,
        } as any).where(eq(schema.tvPairings.code, code));
      } catch (err) {
        logger.warn('Neon Drizzle error in claimPairing', err);
      }
    }

    return updated;
  }

  async deletePairing(code: string): Promise<void> {
    memoryPairings.delete(code);

    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        await db.delete(schema.tvPairings).where(eq(schema.tvPairings.code, code));
      } catch (err) {
        logger.warn('Neon Drizzle error in deletePairing', err);
      }
    }
  }

  async cleanupExpiredPairings(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;
    for (const [code, pairing] of memoryPairings.entries()) {
      if (new Date(pairing.expiresAt).getTime() < now) {
        memoryPairings.delete(code);
        cleaned++;
      }
    }

    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      try {
        const db = getDb();
        await db.delete(schema.tvPairings).where(sql`${schema.tvPairings.expiresAt} < ${new Date()}`);
      } catch (err) {
        logger.warn('Neon Drizzle error in cleanupExpiredPairings', err);
      }
    }

    return cleaned;
  }
}

