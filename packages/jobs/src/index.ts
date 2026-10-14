import { PlaylistRepository, BuildRepository, EpgRepository, memoryBuilds, getFirestoreDB, getDb, schema, eq, sql } from '@iptv-menu/db';
import { PlaylistRun, BuildRequest, RunType, RunStatus, BuildStatus, EpgFeed } from '@iptv-menu/types';
import { Logger } from '@iptv-menu/logging';

export * from './easBuildClient';

const logger = new Logger('jobs-queue');
const playlistRepo = new PlaylistRepository();
const buildRepo = new BuildRepository();
const epgRepo = new EpgRepository();

/**
 * Dispatches a playlist run task by writing a queued run into Firestore or Neon
 */
export async function dispatchPlaylistJob(
  playlistId: string,
  type: RunType
): Promise<string> {
  const runId = `run_${Math.random().toString(36).substring(2, 15)}`;
  
  const run: PlaylistRun = {
    runId,
    playlistId,
    type,
    status: 'queued',
    startedAt: new Date().toISOString(),
    completedAt: null,
    summary: null,
    error: null,
  };

  logger.info(`Dispatching playlist job`, { playlistId, runId, type });
  await playlistRepo.createPlaylistRun(playlistId, run);
  return runId;
}

/**
 * Dispatches a build app task by creating a build request in Firestore or Neon
 */
export async function dispatchBuildJob(
  uid: string,
  appName: string,
  brandConfig: BuildRequest['brandConfig'],
  playlistSource: BuildRequest['playlistSource'],
  appConfigId?: string | null
): Promise<string> {
  const buildId = `build_${Math.random().toString(36).substring(2, 15)}`;

  const buildRequest: BuildRequest = {
    buildId,
    uid,
    appName,
    brandConfig,
    playlistSource,
    status: 'queued',
    artifactPath: null,
    buildLogPath: null,
    appConfigId: appConfigId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  logger.info(`Dispatching app build job`, { uid, appName, buildId, appConfigId });
  await buildRepo.createBuild(buildRequest);
  return buildId;
}

/**
 * Dispatches an EPG generation job by updating the EPG Feed status
 */
export async function dispatchEpgJob(epgId: string): Promise<void> {
  logger.info(`Dispatching EPG job`, { epgId });
  await epgRepo.updateEpg(epgId, { status: 'pending' });
}

/**
 * Polling and locking queue helper for workers to safely fetch tasks.
 * Uses atomic row locking (FOR UPDATE SKIP LOCKED on Postgres, runTransaction on Firestore)
 * to guarantee that multiple concurrent workers never process the same job.
 */
export async function pollNextPlaylistJob(): Promise<{ playlistId: string; run: PlaylistRun } | null> {
  if (process.env.DATABASE_URL) {
    try {
      const db = getDb();
      const startedAt = new Date();
      const result = await db.execute(sql`
        UPDATE playlist_runs
        SET status = 'running', started_at = ${startedAt}
        WHERE run_id = (
          SELECT run_id
          FROM playlist_runs
          WHERE status = 'queued'
          ORDER BY started_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        RETURNING run_id, playlist_id, type, status, started_at, completed_at, summary, error;
      `);

      const rows = (result as any).rows || result;
      if (!rows || rows.length === 0) return null;
      const row = rows[0];

      logger.info('Successfully locked next playlist run job from Neon', { runId: row.run_id, playlistId: row.playlist_id });
      return {
        playlistId: row.playlist_id,
        run: {
          runId: row.run_id,
          playlistId: row.playlist_id,
          type: row.type as any,
          status: 'running',
          startedAt: new Date(row.started_at).toISOString(),
          completedAt: null,
          summary: row.summary as any,
          error: null,
        },
      };
    } catch (error) {
      logger.error('Error polling or locking playlist runs on Neon', error);
      return null;
    }
  }

  const db = getFirestoreDB();
  
  try {
    const snapshot = await db.collectionGroup('runs')
      .where('status', '==', 'queued')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const docRef = doc.ref;

    const run = await db.runTransaction(async (transaction: any) => {
      const freshDoc = await transaction.get(docRef);
      if (!freshDoc.exists || freshDoc.data().status !== 'queued') {
        return null;
      }
      const data = freshDoc.data() as PlaylistRun;
      const now = new Date().toISOString();
      transaction.update(docRef, {
        status: 'running',
        startedAt: now,
      });
      return { ...data, status: 'running' as RunStatus, startedAt: now };
    });

    if (!run) return null;

    logger.info('Successfully locked next playlist run job', { runId: run.runId, playlistId: run.playlistId });
    return {
      playlistId: run.playlistId,
      run,
    };
  } catch (error) {
    logger.error('Error polling or locking playlist runs', error);
    return null;
  }
}

export async function pollNextBuildJob(): Promise<BuildRequest | null> {
  if (process.env.DATABASE_URL) {
    try {
      const db = getDb();
      const updatedAt = new Date();
      const result = await db.execute(sql`
        UPDATE build_requests
        SET status = 'building', updated_at = ${updatedAt}
        WHERE build_id = (
          SELECT build_id
          FROM build_requests
          WHERE status = 'queued'
          ORDER BY created_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        RETURNING build_id, uid, app_name, brand_config, playlist_source, status, artifact_path, build_log_path, app_config_id, created_at, updated_at;
      `);

      const rows = (result as any).rows || result;
      if (!rows || rows.length === 0) return null;
      const row = rows[0];

      logger.info('Locked build request job from Neon', { buildId: row.build_id });
      return {
        buildId: row.build_id,
        uid: row.uid,
        appName: row.app_name,
        brandConfig: row.brand_config,
        playlistSource: row.playlist_source,
        status: 'building',
        artifactPath: row.artifact_path || null,
        buildLogPath: row.build_log_path || null,
        appConfigId: row.app_config_id || null,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
      };
    } catch (error) {
      logger.error('Error polling or locking build requests on Neon', error);
      return null;
    }
  }

  if (memoryBuilds && memoryBuilds.size > 0) {
    for (const [id, req] of memoryBuilds.entries()) {
      if (req.status === 'queued') {
        const updated: BuildRequest = {
          ...req,
          status: 'building' as BuildStatus,
          updatedAt: new Date().toISOString()
        };
        memoryBuilds.set(id, updated);
        logger.info('Locked build request job from memory', { buildId: id });
        return updated;
      }
    }
  }

  const db = getFirestoreDB();
  
  try {
    const snapshot = await db.collection('buildRequests')
      .where('status', '==', 'queued')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const docRef = doc.ref;

    const build = await db.runTransaction(async (transaction: any) => {
      const freshDoc = await transaction.get(docRef);
      if (!freshDoc.exists || freshDoc.data().status !== 'queued') {
        return null;
      }
      const data = freshDoc.data() as BuildRequest;
      const now = new Date().toISOString();
      transaction.update(docRef, {
        status: 'building',
        updatedAt: now,
      });
      return { ...data, status: 'building' as BuildStatus, updatedAt: now };
    });

    if (!build) return null;

    logger.info('Locked build request job', { buildId: build.buildId });
    return build;
  } catch (error) {
    logger.error('Error polling or locking build requests', error);
    return null;
  }
}

export async function pollNextEpgJob(): Promise<EpgFeed | null> {
  if (process.env.DATABASE_URL) {
    try {
      const db = getDb();
      const lastGeneratedAt = new Date();
      const result = await db.execute(sql`
        UPDATE epg_feeds
        SET status = 'generating', last_generated_at = ${lastGeneratedAt}
        WHERE epg_id = (
          SELECT epg_id
          FROM epg_feeds
          WHERE status = 'pending'
          ORDER BY created_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        RETURNING epg_id, uid, playlist_id, status, source_config, output_file_path, created_at, last_generated_at;
      `);

      const rows = (result as any).rows || result;
      if (!rows || rows.length === 0) return null;
      const row = rows[0];

      logger.info('Locked EPG generation job from Neon', { epgId: row.epg_id });
      return {
        epgId: row.epg_id,
        uid: row.uid,
        playlistId: row.playlist_id,
        status: 'generating',
        sourceConfig: row.source_config,
        outputFilePath: row.output_file_path || null,
        createdAt: new Date(row.created_at).toISOString(),
        lastGeneratedAt: new Date(row.last_generated_at).toISOString(),
      };
    } catch (error) {
      logger.error('Error polling or locking EPG feeds on Neon', error);
      return null;
    }
  }

  const db = getFirestoreDB();
  
  try {
    const snapshot = await db.collection('epgFeeds')
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const docRef = doc.ref;

    const epg = await db.runTransaction(async (transaction: any) => {
      const freshDoc = await transaction.get(docRef);
      if (!freshDoc.exists || freshDoc.data().status !== 'pending') {
        return null;
      }
      const data = freshDoc.data() as EpgFeed;
      const now = new Date().toISOString();
      transaction.update(docRef, {
        status: 'generating',
        lastGeneratedAt: now,
      });
      return { ...data, status: 'generating' as any, lastGeneratedAt: now };
    });

    if (!epg) return null;

    logger.info('Locked EPG generation job', { epgId: epg.epgId });
    return epg;
  } catch (error) {
    logger.error('Error polling or locking EPG feeds', error);
    return null;
  }
}
