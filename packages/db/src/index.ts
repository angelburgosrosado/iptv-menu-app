import { getFirebaseAdmin } from '@iptv-menu/auth';
import { Logger } from '@iptv-menu/logging';
import { 
  UserProfile, Playlist, PlaylistRun, EpgFeed, BuildRequest, 
  AdminAction, UserRole, AccountStatus, Workspace, AppConfig
} from '@iptv-menu/types';
import { eq, desc } from 'drizzle-orm';
import { getDb, schema } from './client';

export * from './schema';
export * from './client';
export { eq, desc, asc, and } from 'drizzle-orm';

const logger = new Logger('db-repository');

// Lazy-initialized Firestore instance for fallback/hybrid operations
let dbInstance: any = null;

export function getFirestoreDB(): any {
  if (dbInstance) return dbInstance;
  const adminApp = getFirebaseAdmin();
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
        if (!row) return null;
        return {
          uid: row.uid,
          email: row.email,
          displayName: row.displayName || undefined,
          photoURL: row.photoURL || null,
          role: row.role as any,
          accountStatus: row.accountStatus as any,
          subscriptionTier: row.subscriptionTier as any,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        };
      } catch (err) {
        logger.error('Neon Drizzle error in getUser', err);
        throw err;
      }
    }

    try {
      const doc = await this.db.collection(this.collection).doc(uid).get();
      if (!doc.exists) return null;
      return doc.data() as UserProfile;
    } catch (err) {
      handleFirestoreError(err, DbOperation.GET, this.collection, uid);
    }
  }

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const [row] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
        if (!row) return null;
        return {
          uid: row.uid,
          email: row.email,
          displayName: row.displayName || undefined,
          photoURL: row.photoURL || null,
          role: row.role as any,
          accountStatus: row.accountStatus as any,
          subscriptionTier: row.subscriptionTier as any,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        };
      } catch (err) {
        logger.error('Neon Drizzle error in getUserByEmail', err);
        throw err;
      }
    }

    try {
      const snap = await this.db.collection(this.collection).where('email', '==', email).limit(1).get();
      if (snap.empty) return null;
      return snap.docs[0].data() as UserProfile;
    } catch (err) {
      handleFirestoreError(err, DbOperation.GET, this.collection, email);
    }
  }

  async createUser(profile: UserProfile): Promise<void> {
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
        } as any).onConflictDoUpdate({
          target: schema.users.uid,
          set: {
            email: profile.email,
            displayName: profile.displayName || null,
            photoURL: profile.photoURL || null,
            role: profile.role,
            accountStatus: profile.accountStatus,
            subscriptionTier: profile.subscriptionTier,
            updatedAt: new Date(),
          } as any,
        });
        return;
      } catch (err) {
        logger.error('Neon Drizzle error in createUser', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection).doc(profile.uid).set({
        ...profile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, DbOperation.CREATE, this.collection, profile.uid);
    }
  }

  async updateUser(uid: string, data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>): Promise<void> {
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
        logger.error('Neon Drizzle error in updateUser', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection).doc(uid).update({
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, DbOperation.UPDATE, this.collection, uid);
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
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }));
      } catch (err) {
        logger.error('Neon Drizzle error in listUsers', err);
        throw err;
      }
    }

    try {
      const snapshot = await this.db.collection(this.collection)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map((d: any) => d.data() as UserProfile);
    } catch (err) {
      handleFirestoreError(err, DbOperation.LIST, this.collection);
    }
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
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const [row] = await db.select().from(schema.playlists).where(eq(schema.playlists.playlistId, playlistId)).limit(1);
        if (!row) return null;
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
      } catch (err) {
        logger.error('Neon Drizzle error in getPlaylist', err);
        throw err;
      }
    }

    try {
      const doc = await this.db.collection(this.collection).doc(playlistId).get();
      if (!doc.exists) return null;
      return doc.data() as Playlist;
    } catch (err) {
      handleFirestoreError(err, DbOperation.GET, this.collection, playlistId);
    }
  }

  async createPlaylist(playlist: Playlist): Promise<void> {
    if (process.env.DATABASE_URL) {
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
        logger.error('Neon Drizzle error in createPlaylist', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection).doc(playlist.playlistId).set({
        ...playlist,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, DbOperation.CREATE, this.collection, playlist.playlistId);
    }
  }

  async updatePlaylist(playlistId: string, data: Partial<Omit<Playlist, 'playlistId' | 'uid' | 'createdAt'>>): Promise<void> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const updatePayload: any = {
          ...data,
          updatedAt: new Date(),
        };
        await db.update(schema.playlists).set(updatePayload).where(eq(schema.playlists.playlistId, playlistId));
        return;
      } catch (err) {
        logger.error('Neon Drizzle error in updatePlaylist', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection).doc(playlistId).update({
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, DbOperation.UPDATE, this.collection, playlistId);
    }
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        await db.delete(schema.playlists).where(eq(schema.playlists.playlistId, playlistId));
        return;
      } catch (err) {
        logger.error('Neon Drizzle error in deletePlaylist', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection).doc(playlistId).delete();
    } catch (err) {
      handleFirestoreError(err, DbOperation.DELETE, this.collection, playlistId);
    }
  }

  async listUserPlaylists(uid: string): Promise<Playlist[]> {
    if (process.env.DATABASE_URL) {
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
        logger.error('Neon Drizzle error in listUserPlaylists', err);
        throw err;
      }
    }

    try {
      const snapshot = await this.db.collection(this.collection)
        .where('uid', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((d: any) => d.data() as Playlist);
    } catch (err) {
      handleFirestoreError(err, DbOperation.LIST, this.collection);
    }
  }

  async listAllPlaylists(): Promise<Playlist[]> {
    if (process.env.DATABASE_URL) {
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
        logger.error('Neon Drizzle error in listAllPlaylists', err);
        throw err;
      }
    }

    try {
      const snapshot = await this.db.collection(this.collection)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((d: any) => d.data() as Playlist);
    } catch (err) {
      handleFirestoreError(err, DbOperation.LIST, this.collection);
    }
  }

  // Subcollection / Runs
  async createPlaylistRun(playlistId: string, run: PlaylistRun): Promise<void> {
    if (process.env.DATABASE_URL) {
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
        logger.error('Neon Drizzle error in createPlaylistRun', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection)
        .doc(playlistId)
        .collection('runs')
        .doc(run.runId)
        .set({
          ...run,
          startedAt: new Date().toISOString()
        });
    } catch (err) {
      handleFirestoreError(err, DbOperation.CREATE, `${this.collection}/${playlistId}/runs`, run.runId);
    }
  }

  async updatePlaylistRun(playlistId: string, runId: string, data: Partial<Omit<PlaylistRun, 'runId' | 'playlistId' | 'startedAt'>>): Promise<void> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const updatePayload: any = {
          ...data,
          completedAt: data.status === 'completed' || data.status === 'failed' ? new Date() : null,
        };
        await db.update(schema.playlistRuns).set(updatePayload).where(eq(schema.playlistRuns.runId, runId));
        return;
      } catch (err) {
        logger.error('Neon Drizzle error in updatePlaylistRun', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection)
        .doc(playlistId)
        .collection('runs')
        .doc(runId)
        .update({
          ...data,
          completedAt: data.status === 'completed' || data.status === 'failed' ? new Date().toISOString() : null
        });
    } catch (err) {
      handleFirestoreError(err, DbOperation.UPDATE, `${this.collection}/${playlistId}/runs`, runId);
    }
  }

  async getPlaylistRuns(playlistId: string): Promise<PlaylistRun[]> {
    if (process.env.DATABASE_URL) {
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
        logger.error('Neon Drizzle error in getPlaylistRuns', err);
        throw err;
      }
    }

    try {
      const snapshot = await this.db.collection(this.collection)
        .doc(playlistId)
        .collection('runs')
        .orderBy('startedAt', 'desc')
        .get();
      return snapshot.docs.map((d: any) => d.data() as PlaylistRun);
    } catch (err) {
      handleFirestoreError(err, DbOperation.LIST, `${this.collection}/${playlistId}/runs`);
    }
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
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const [row] = await db.select().from(schema.epgFeeds).where(eq(schema.epgFeeds.epgId, epgId)).limit(1);
        if (!row) return null;
        return {
          epgId: row.epgId,
          uid: row.uid,
          playlistId: row.playlistId,
          status: row.status as any,
          sourceConfig: row.sourceConfig,
          outputFilePath: row.outputFilePath || null,
          createdAt: row.createdAt.toISOString(),
          lastGeneratedAt: row.lastGeneratedAt ? row.lastGeneratedAt.toISOString() : null,
        };
      } catch (err) {
        logger.error('Neon Drizzle error in getEpg', err);
        throw err;
      }
    }

    try {
      const doc = await this.db.collection(this.collection).doc(epgId).get();
      if (!doc.exists) return null;
      return doc.data() as EpgFeed;
    } catch (err) {
      handleFirestoreError(err, DbOperation.GET, this.collection, epgId);
    }
  }

  async createEpg(epg: EpgFeed): Promise<void> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        await db.insert(schema.epgFeeds).values({
          epgId: epg.epgId,
          uid: epg.uid,
          playlistId: epg.playlistId,
          status: epg.status || 'pending',
          sourceConfig: epg.sourceConfig,
          outputFilePath: epg.outputFilePath || null,
          lastGeneratedAt: epg.lastGeneratedAt ? new Date(epg.lastGeneratedAt) : null,
        } as any).onConflictDoUpdate({
          target: schema.epgFeeds.epgId,
          set: {
            playlistId: epg.playlistId,
            status: epg.status,
            sourceConfig: epg.sourceConfig,
            outputFilePath: epg.outputFilePath || null,
            lastGeneratedAt: epg.lastGeneratedAt ? new Date(epg.lastGeneratedAt) : null,
          } as any,
        });
        return;
      } catch (err) {
        logger.error('Neon Drizzle error in createEpg', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection).doc(epg.epgId).set({
        ...epg,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, DbOperation.CREATE, this.collection, epg.epgId);
    }
  }

  async updateEpg(epgId: string, data: Partial<Omit<EpgFeed, 'epgId' | 'uid' | 'createdAt'>>): Promise<void> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const updatePayload: any = { ...data };
        if (data.lastGeneratedAt) {
          updatePayload.lastGeneratedAt = new Date(data.lastGeneratedAt);
        }
        await db.update(schema.epgFeeds).set(updatePayload).where(eq(schema.epgFeeds.epgId, epgId));
        return;
      } catch (err) {
        logger.error('Neon Drizzle error in updateEpg', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection).doc(epgId).update(data);
    } catch (err) {
      handleFirestoreError(err, DbOperation.UPDATE, this.collection, epgId);
    }
  }

  async listUserEpgs(uid: string): Promise<EpgFeed[]> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const rows = await db.select().from(schema.epgFeeds)
          .where(eq(schema.epgFeeds.uid, uid))
          .orderBy(desc(schema.epgFeeds.createdAt));
        return rows.map((row) => ({
          epgId: row.epgId,
          uid: row.uid,
          playlistId: row.playlistId,
          status: row.status as any,
          sourceConfig: row.sourceConfig,
          outputFilePath: row.outputFilePath || null,
          createdAt: row.createdAt.toISOString(),
          lastGeneratedAt: row.lastGeneratedAt ? row.lastGeneratedAt.toISOString() : null,
        }));
      } catch (err) {
        logger.error('Neon Drizzle error in listUserEpgs', err);
        throw err;
      }
    }

    try {
      const snapshot = await this.db.collection(this.collection)
        .where('uid', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((d: any) => d.data() as EpgFeed);
    } catch (err) {
      handleFirestoreError(err, DbOperation.LIST, this.collection);
    }
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
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const [row] = await db.select().from(schema.buildRequests).where(eq(schema.buildRequests.buildId, buildId)).limit(1);
        if (!row) return null;
        return {
          buildId: row.buildId,
          uid: row.uid,
          appName: row.appName,
          brandConfig: row.brandConfig,
          playlistSource: row.playlistSource,
          status: row.status as any,
          artifactPath: row.artifactPath || null,
          buildLogPath: row.buildLogPath || null,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        };
      } catch (err) {
        logger.error('Neon Drizzle error in getBuild', err);
        throw err;
      }
    }

    try {
      const doc = await this.db.collection(this.collection).doc(buildId).get();
      if (!doc.exists) return null;
      return doc.data() as BuildRequest;
    } catch (err) {
      handleFirestoreError(err, DbOperation.GET, this.collection, buildId);
    }
  }

  async createBuild(build: BuildRequest): Promise<void> {
    if (process.env.DATABASE_URL) {
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
        } as any).onConflictDoUpdate({
          target: schema.buildRequests.buildId,
          set: {
            appName: build.appName,
            brandConfig: build.brandConfig,
            playlistSource: build.playlistSource,
            status: build.status,
            artifactPath: build.artifactPath || null,
            buildLogPath: build.buildLogPath || null,
            updatedAt: new Date(),
          } as any,
        });
        return;
      } catch (err) {
        logger.error('Neon Drizzle error in createBuild', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection).doc(build.buildId).set({
        ...build,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, DbOperation.CREATE, this.collection, build.buildId);
    }
  }

  async updateBuild(buildId: string, data: Partial<Omit<BuildRequest, 'buildId' | 'uid' | 'createdAt'>>): Promise<void> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const updatePayload: any = {
          ...data,
          updatedAt: new Date(),
        };
        await db.update(schema.buildRequests).set(updatePayload).where(eq(schema.buildRequests.buildId, buildId));
        return;
      } catch (err) {
        logger.error('Neon Drizzle error in updateBuild', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection).doc(buildId).update({
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, DbOperation.UPDATE, this.collection, buildId);
    }
  }

  async listUserBuilds(uid: string): Promise<BuildRequest[]> {
    if (process.env.DATABASE_URL) {
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
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }));
      } catch (err) {
        logger.error('Neon Drizzle error in listUserBuilds', err);
        throw err;
      }
    }

    try {
      const snapshot = await this.db.collection(this.collection)
        .where('uid', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((d: any) => d.data() as BuildRequest);
    } catch (err) {
      handleFirestoreError(err, DbOperation.LIST, this.collection);
    }
  }

  async listAllBuilds(): Promise<BuildRequest[]> {
    if (process.env.DATABASE_URL) {
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
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }));
      } catch (err) {
        logger.error('Neon Drizzle error in listAllBuilds', err);
        throw err;
      }
    }

    try {
      const snapshot = await this.db.collection(this.collection)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((d: any) => d.data() as BuildRequest);
    } catch (err) {
      handleFirestoreError(err, DbOperation.LIST, this.collection);
    }
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
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const [row] = await db.select().from(schema.workspaces).where(eq(schema.workspaces.workspaceId, workspaceId)).limit(1);
        if (!row) return null;
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
      } catch (err) {
        logger.error('Neon Drizzle error in getWorkspace', err);
        throw err;
      }
    }

    try {
      const doc = await this.db.collection(this.collection).doc(workspaceId).get();
      if (!doc.exists) return null;
      return doc.data() as Workspace;
    } catch (err) {
      handleFirestoreError(err, DbOperation.GET, this.collection, workspaceId);
    }
  }

  async createWorkspace(workspace: Workspace): Promise<void> {
    if (process.env.DATABASE_URL) {
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
        logger.error('Neon Drizzle error in createWorkspace', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection).doc(workspace.workspaceId).set({
        ...workspace,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, DbOperation.CREATE, this.collection, workspace.workspaceId);
    }
  }

  async updateWorkspace(workspaceId: string, data: Partial<Omit<Workspace, 'workspaceId' | 'ownerUid' | 'createdAt'>>): Promise<void> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const updatePayload: any = {
          ...data,
          updatedAt: new Date(),
        };
        await db.update(schema.workspaces).set(updatePayload).where(eq(schema.workspaces.workspaceId, workspaceId));
        return;
      } catch (err) {
        logger.error('Neon Drizzle error in updateWorkspace', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection).doc(workspaceId).update({
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, DbOperation.UPDATE, this.collection, workspaceId);
    }
  }

  async listUserWorkspaces(uid: string): Promise<Workspace[]> {
    if (process.env.DATABASE_URL) {
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
        logger.error('Neon Drizzle error in listUserWorkspaces', err);
        throw err;
      }
    }

    try {
      const snapshot = await this.db.collection(this.collection)
        .where('ownerUid', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((d: any) => d.data() as Workspace);
    } catch (err) {
      handleFirestoreError(err, DbOperation.LIST, this.collection);
    }
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
        logger.error('Neon Drizzle error in logAction', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection).doc(action.actionId).set({
        ...action,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, DbOperation.CREATE, this.collection, action.actionId);
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
        logger.error('Neon Drizzle error in listActions', err);
        throw err;
      }
    }

    try {
      const snapshot = await this.db.collection(this.collection)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map((d: any) => d.data() as AdminAction);
    } catch (err) {
      handleFirestoreError(err, DbOperation.LIST, this.collection);
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
        if (!row) return null;
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
      } catch (err) {
        logger.error('Neon Drizzle error in getAppConfig', err);
        throw err;
      }
    }

    try {
      const doc = await this.db.collection(this.collection).doc(appId).get();
      if (!doc.exists) return null;
      return doc.data() as AppConfig;
    } catch (err) {
      handleFirestoreError(err, DbOperation.GET, this.collection, appId);
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
        logger.error('Neon Drizzle error in createAppConfig', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection).doc(configRecord.appId).set(configRecord);
      return configRecord;
    } catch (err) {
      handleFirestoreError(err, DbOperation.CREATE, this.collection, configRecord.appId);
    }
  }

  async updateAppConfig(appId: string, updates: Partial<Omit<AppConfig, 'appId' | 'workspaceId' | 'ownerUid'>>): Promise<AppConfig> {
    const now = new Date();
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        const [existing] = await db.select().from(schema.appConfigs).where(eq(schema.appConfigs.appId, appId)).limit(1);
        if (!existing) throw new Error(`AppConfig ${appId} not found`);

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
        return {
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
      } catch (err) {
        logger.error('Neon Drizzle error in updateAppConfig', err);
        throw err;
      }
    }

    try {
      const docRef = this.db.collection(this.collection).doc(appId);
      const snapshot = await docRef.get();
      if (!snapshot.exists) throw new Error(`AppConfig ${appId} not found`);
      const existing = snapshot.data() as AppConfig;
      const newVersion = (existing.version || 1) + 1;
      const finalData: AppConfig = {
        ...existing,
        ...updates,
        version: newVersion,
        updatedAt: now.toISOString(),
      };
      await docRef.set(finalData, { merge: true });
      return finalData;
    } catch (err) {
      handleFirestoreError(err, DbOperation.UPDATE, this.collection, appId);
    }
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
        logger.error('Neon Drizzle error in listAppConfigsByWorkspace', err);
        throw err;
      }
    }

    try {
      const snapshot = await this.db.collection(this.collection)
        .where('workspaceId', '==', workspaceId)
        .orderBy('updatedAt', 'desc')
        .get();
      return snapshot.docs.map((d: any) => d.data() as AppConfig);
    } catch (err) {
      handleFirestoreError(err, DbOperation.LIST, this.collection);
    }
  }

  async deleteAppConfig(appId: string): Promise<void> {
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        await db.delete(schema.appConfigs).where(eq(schema.appConfigs.appId, appId));
        return;
      } catch (err) {
        logger.error('Neon Drizzle error in deleteAppConfig', err);
        throw err;
      }
    }

    try {
      await this.db.collection(this.collection).doc(appId).delete();
    } catch (err) {
      handleFirestoreError(err, DbOperation.DELETE, this.collection, appId);
    }
  }
}
