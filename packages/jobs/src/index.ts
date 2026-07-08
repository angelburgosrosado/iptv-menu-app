import { PlaylistRepository, BuildRepository, getFirestoreDB } from '@iptv-menu/db';
import { PlaylistRun, BuildRequest, RunType, RunStatus, BuildStatus } from '@iptv-menu/types';
import { Logger } from '@iptv-menu/logging';

const logger = new Logger('jobs-queue');
const playlistRepo = new PlaylistRepository();
const buildRepo = new BuildRepository();

/**
 * Dispatches a playlist run task by writing a queued run into Firestore
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
 * Dispatches a build app task by creating a build request in Firestore
 */
export async function dispatchBuildJob(
  uid: string,
  appName: string,
  brandConfig: BuildRequest['brandConfig'],
  playlistSource: BuildRequest['playlistSource']
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  logger.info(`Dispatching app build job`, { uid, appName, buildId });
  await buildRepo.createBuild(buildRequest);
  return buildId;
}

/**
 * Polling and locking queue helper for workers to safely fetch tasks
 */
export async function pollNextPlaylistJob(): Promise<{ playlistId: string; run: PlaylistRun } | null> {
  const db = getFirestoreDB();
  
  try {
    // Query group for all subcollections named 'runs' that are in 'queued' state
    const snapshot = await db.collectionGroup('runs')
      .where('status', '==', 'queued')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const run = doc.data() as PlaylistRun;
    
    // Acquire optimistic lock by switching state from 'queued' to 'running'
    const docRef = doc.ref;
    await docRef.update({
      status: 'running',
      startedAt: new Date().toISOString(),
    });

    logger.info('Successfully locked next playlist run job', { runId: run.runId, playlistId: run.playlistId });
    return {
      playlistId: run.playlistId,
      run: { ...run, status: 'running' },
    };
  } catch (error) {
    logger.error('Error polling or locking playlist runs', error);
    return null;
  }
}

export async function pollNextBuildJob(): Promise<BuildRequest | null> {
  const db = getFirestoreDB();
  
  try {
    const snapshot = await db.collection('buildRequests')
      .where('status', '==', 'queued')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const build = doc.data() as BuildRequest;
    
    // Lock the task
    const docRef = doc.ref;
    await docRef.update({
      status: 'building',
      updatedAt: new Date().toISOString(),
    });

    logger.info('Locked build request job', { buildId: build.buildId });
    return { ...build, status: 'building' };
  } catch (error) {
    logger.error('Error polling or locking build requests', error);
    return null;
  }
}
