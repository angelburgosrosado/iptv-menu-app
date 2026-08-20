import { getFirebaseAdmin } from '@iptv-menu/auth';
import { Logger } from '@iptv-menu/logging';
import { 
  UserProfile, Playlist, PlaylistRun, EpgFeed, BuildRequest, 
  AdminAction, UserRole, AccountStatus, Workspace
} from '@iptv-menu/types';

const logger = new Logger('db-repository');

// Lazy-initialized Firestore instance
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

/**
 * Robust error-wrapper complying with Firestore requirements
 */
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
    try {
      const doc = await this.db.collection(this.collection).doc(uid).get();
      if (!doc.exists) return null;
      return doc.data() as UserProfile;
    } catch (err) {
      handleFirestoreError(err, DbOperation.GET, this.collection, uid);
    }
  }

  async createUser(profile: UserProfile): Promise<void> {
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
    try {
      const doc = await this.db.collection(this.collection).doc(playlistId).get();
      if (!doc.exists) return null;
      return doc.data() as Playlist;
    } catch (err) {
      handleFirestoreError(err, DbOperation.GET, this.collection, playlistId);
    }
  }

  async createPlaylist(playlist: Playlist): Promise<void> {
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
    try {
      await this.db.collection(this.collection).doc(playlistId).delete();
    } catch (err) {
      handleFirestoreError(err, DbOperation.DELETE, this.collection, playlistId);
    }
  }

  async listUserPlaylists(uid: string): Promise<Playlist[]> {
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
    try {
      const snapshot = await this.db.collection(this.collection)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((d: any) => d.data() as Playlist);
    } catch (err) {
      handleFirestoreError(err, DbOperation.LIST, this.collection);
    }
  }

  // Subcollection: Runs
  async createPlaylistRun(playlistId: string, run: PlaylistRun): Promise<void> {
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
    try {
      const doc = await this.db.collection(this.collection).doc(epgId).get();
      if (!doc.exists) return null;
      return doc.data() as EpgFeed;
    } catch (err) {
      handleFirestoreError(err, DbOperation.GET, this.collection, epgId);
    }
  }

  async createEpg(epg: EpgFeed): Promise<void> {
    try {
      await this.db.collection(this.collection).doc(epg.epgId).set({
        ...epg,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, DbOperation.CREATE, this.collection, epg.epgId);
    }
  }

  async listUserEpgs(uid: string): Promise<EpgFeed[]> {
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
    try {
      const doc = await this.db.collection(this.collection).doc(buildId).get();
      if (!doc.exists) return null;
      return doc.data() as BuildRequest;
    } catch (err) {
      handleFirestoreError(err, DbOperation.GET, this.collection, buildId);
    }
  }

  async createBuild(build: BuildRequest): Promise<void> {
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
// AUDIT LOG REPOSITORY
// ==========================================
export class AuditLogRepository {
  private collection = 'adminActions';

  private get db() {
    return getFirestoreDB();
  }

  async logAction(action: AdminAction): Promise<void> {
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
// WORKSPACE REPOSITORY
// ==========================================
export class WorkspaceRepository {
  private collection = 'workspaces';

  private get db() {
    return getFirestoreDB();
  }

  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    try {
      const doc = await this.db.collection(this.collection).doc(workspaceId).get();
      if (!doc.exists) return null;
      return doc.data() as Workspace;
    } catch (err) {
      handleFirestoreError(err, DbOperation.GET, this.collection, workspaceId);
    }
  }

  async createWorkspace(workspace: Workspace): Promise<void> {
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

