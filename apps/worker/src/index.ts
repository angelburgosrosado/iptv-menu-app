import { pollNextPlaylistJob, pollNextBuildJob, pollNextEpgJob } from '@iptv-menu/jobs';
import { PlaylistRepository, BuildRepository, EpgRepository } from '@iptv-menu/db';
import { uploadToBucket, downloadFromBucket } from '@iptv-menu/storage';
import { Logger } from '@iptv-menu/logging';
import { config } from '@iptv-menu/config';
import axios from 'axios';

const logger = new Logger('async-worker');
const playlistRepo = new PlaylistRepository();
const buildRepo = new BuildRepository();
const epgRepo = new EpgRepository();

let isRunning = true;

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, finishing current task and terminating worker');
  isRunning = false;
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, finishing current task and terminating worker');
  isRunning = false;
});

/**
 * Parses and cleanses duplicate or broken channels in an M3U file
 */
async function processPlaylistClean(playlistId: string, runId: string) {
  logger.info(`Starting M3U Playlist cleaning run`, { playlistId, runId });
  
  try {
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist) throw new Error('Playlist document not found in database');
    if (!playlist.originalFilePath) throw new Error('Missing original file path');

    logger.info(`Fetching original playlist stream from storage...`);
    const fileBuffer = await downloadFromBucket(config.GCS_UPLOAD_BUCKET, playlist.originalFilePath);
    const m3uContent = fileBuffer.toString('utf-8');

    const lines = m3uContent.split('\n');
    const uniqueChannels: string[] = [];
    let channelsProcessed = 0;
    let channelsRemoved = 0;

    // Fast inline deduplication logic
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF')) {
        channelsProcessed++;
        const chanInfo = lines[i];
        const streamUrl = lines[i + 1]?.trim();
        if (streamUrl && !uniqueChannels.includes(streamUrl)) {
          uniqueChannels.push(chanInfo);
          uniqueChannels.push(streamUrl);
        } else {
          channelsRemoved++;
        }
      }
    }

    const cleanedM3U = `#EXTM3U\n` + uniqueChannels.join('\n');
    const cleanedPath = `users/${playlist.uid}/cleaned/${playlistId}_cleaned.m3u`;
    
    // Save output back to Storage
    await uploadToBucket(config.GCS_OUTPUT_BUCKET, cleanedPath, cleanedM3U, 'text/plain');

    // Update database records
    await playlistRepo.updatePlaylist(playlistId, {
      cleanedFilePath: cleanedPath,
      channelCount: uniqueChannels.length / 2,
      status: 'ready',
    });

    await playlistRepo.updatePlaylistRun(playlistId, runId, {
      status: 'completed',
      summary: {
        channelsProcessed,
        channelsRemoved,
        errorsCount: 0,
      },
      error: null,
    });

    logger.info(`M3U cleaning run completed successfully`, { playlistId, channelsRemoved });
  } catch (error: any) {
    logger.error(`Failed to clean playlist ${playlistId}`, error);
    await playlistRepo.updatePlaylist(playlistId, { status: 'failed' });
    await playlistRepo.updatePlaylistRun(playlistId, runId, {
      status: 'failed',
      error: error.message,
    });
  }
}

interface ProbeResult {
  isAlive: boolean;
  latencyMs: number;
  statusCode?: number;
  contentType?: string;
}

/**
 * Probes a live HLS or TS stream URL with HEAD and fallback to GET with byte-range
 */
async function probeStream(url: string, timeoutMs: number = 4000): Promise<ProbeResult> {
  const startTime = Date.now();
  const headers = {
    'User-Agent': 'IPTV.menu StreamProber/2.0 (HLS/M3U8 client)',
    'Accept': '*/*',
  };

  try {
    // 1. Try HEAD request first for fast verification without downloading data
    const res = await axios.head(url, {
      timeout: timeoutMs,
      headers,
      maxRedirects: 4,
      validateStatus: (status) => status < 400,
    });
    return {
      isAlive: true,
      latencyMs: Date.now() - startTime,
      statusCode: res.status,
      contentType: res.headers['content-type'] ? String(res.headers['content-type']) : undefined,
    };
  } catch (headErr: any) {
    // 2. Some IPTV servers reject HEAD requests (HTTP 405 or 403) but allow GET
    try {
      const getStartTime = Date.now();
      const getRes = await axios.get(url, {
        timeout: timeoutMs,
        headers: {
          ...headers,
          'Range': 'bytes=0-2048', // Request only initial bytes / playlist headers
        },
        responseType: 'stream',
        maxRedirects: 4,
        validateStatus: (status) => status < 400 || status === 206,
      });

      // Abort stream download immediately after receiving response headers
      if (getRes.data && typeof getRes.data.destroy === 'function') {
        getRes.data.destroy();
      }

      return {
        isAlive: true,
        latencyMs: Date.now() - getStartTime,
        statusCode: getRes.status,
        contentType: getRes.headers['content-type'] ? String(getRes.headers['content-type']) : undefined,
      };
    } catch {
      return {
        isAlive: false,
        latencyMs: Date.now() - startTime,
      };
    }
  }
}

/**
 * Validates stream links in an M3U playlist with concurrent probing and auto-cleaning
 */
async function processPlaylistValidate(playlistId: string, runId: string) {
  logger.info(`Starting stream ping validation run`, { playlistId, runId });
  
  try {
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist) throw new Error('Playlist not found');
    if (!playlist.cleanedFilePath && !playlist.originalFilePath) throw new Error('No playlist file found to validate');

    const targetPath = playlist.cleanedFilePath || playlist.originalFilePath;
    const fileBuffer = await downloadFromBucket(config.GCS_UPLOAD_BUCKET, targetPath as string);
    const m3uContent = fileBuffer.toString('utf-8');

    const lines = m3uContent.split('\n');
    const channelEntries: { extinf: string; url: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF')) {
        const extinf = lines[i];
        const streamUrl = lines[i + 1]?.trim();
        if (streamUrl && !streamUrl.startsWith('#')) {
          channelEntries.push({ extinf, url: streamUrl });
        }
      }
    }

    const maxTest = Math.min(channelEntries.length, 50); // Up to 50 streams for high-speed verification
    logger.info(`Probing ${maxTest} channel streams concurrently in batches of 10...`);

    let aliveCount = 0;
    let deadCount = 0;
    let totalLatency = 0;
    const validatedChannels: string[] = [];

    const BATCH_SIZE = 10;
    for (let i = 0; i < maxTest; i += BATCH_SIZE) {
      const batch = channelEntries.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (entry) => {
          const probe = await probeStream(entry.url);
          return { entry, probe };
        })
      );

      for (const { entry, probe } of results) {
        if (probe.isAlive) {
          aliveCount++;
          totalLatency += probe.latencyMs;
          validatedChannels.push(entry.extinf);
          validatedChannels.push(entry.url);
        } else {
          deadCount++;
        }
      }
    }

    // Add remaining channels beyond maxTest limit to preserved list
    for (let j = maxTest; j < channelEntries.length; j++) {
      validatedChannels.push(channelEntries[j].extinf);
      validatedChannels.push(channelEntries[j].url);
    }

    // Save auto-cleaned stream feed without dead channels
    const validatedM3U = `#EXTM3U\n` + validatedChannels.join('\n');
    const validatedPath = `users/${playlist.uid}/validated/${playlistId}_validated.m3u`;
    await uploadToBucket(config.GCS_OUTPUT_BUCKET, validatedPath, validatedM3U, 'text/plain');

    const avgLatency = aliveCount > 0 ? Math.round(totalLatency / aliveCount) : 0;
    const successRatio = maxTest > 0 ? Math.round((aliveCount / maxTest) * 100) : 100;

    await playlistRepo.updatePlaylist(playlistId, {
      cleanedFilePath: validatedPath,
      channelCount: validatedChannels.length / 2,
      status: 'ready',
    });

    await playlistRepo.updatePlaylistRun(playlistId, runId, {
      status: 'completed',
      summary: {
        channelsTested: maxTest,
        deadStreamsDetected: deadCount,
        healthyStreamsCount: aliveCount,
        successRatio,
        avgLatencyMs: avgLatency,
      },
      error: null,
    });

    logger.info(`Stream validation complete`, { playlistId, aliveCount, deadCount, avgLatency });
  } catch (error: any) {
    logger.error(`Validation failed`, error);
    await playlistRepo.updatePlaylistRun(playlistId, runId, {
      status: 'failed',
      error: error.message,
    });
  }
}

/**
 * Generates EPG XMLTV feed by aggregating configured sources
 */
async function processEpgJob(epgId: string, uid: string) {
  logger.info(`Starting EPG generation task for ${epgId}`);
  try {
    const epg = await epgRepo.getEpg(epgId);
    if (!epg) throw new Error(`EPG record ${epgId} not found`);

    await epgRepo.updateEpg(epgId, { status: 'generating' });

    const sourceUrls = epg.sourceConfig?.urls && epg.sourceConfig.urls.length > 0
      ? epg.sourceConfig.urls
      : ['https://iptv-org.github.io/epg/guides/us.xml'];

    let channelsContent = '';
    let programmesContent = '';

    for (const url of sourceUrls) {
      try {
        const resp = await axios.get(url, { timeout: 15000, responseType: 'text' });
        if (resp.status < 400 && resp.data && typeof resp.data === 'string') {
          const raw = resp.data;
          const channelMatches = raw.match(/<channel[\s\S]*?<\/channel>/gi);
          if (channelMatches) {
            channelsContent += '\n' + channelMatches.join('\n');
          }
          const programmeMatches = raw.match(/<programme[\s\S]*?<\/programme>/gi);
          if (programmeMatches) {
            programmesContent += '\n' + programmeMatches.join('\n');
          }
        }
      } catch (fetchErr: any) {
        logger.warn(`Failed fetching EPG feed ${url}: ${fetchErr.message}`);
      }
    }

    const aggregatedXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE tv SYSTEM "xmltv.dtd">
<tv generator-info-name="IPTV Menu EPG Server">${channelsContent}${programmesContent}
</tv>`;

    const artifactPath = `users/${uid}/epg/${epgId}_xmltv.xml`;
    await uploadToBucket(config.GCS_BUILD_BUCKET, artifactPath, aggregatedXml, 'application/xml');

    await epgRepo.updateEpg(epgId, {
      status: 'ready',
      outputFilePath: artifactPath,
      lastGeneratedAt: new Date().toISOString()
    });

    logger.info(`EPG job ${epgId} completed successfully`);
  } catch (err: any) {
    logger.error(`EPG generation failed for ${epgId}`, err);
    await epgRepo.updateEpg(epgId, { status: 'failed' });
  }
}

/**
 * Background loop processor
 */
async function runWorker() {
  logger.info('IPTV Async Worker loop running... Polling for tasks');

  while (isRunning) {
    try {
      // 1. Poll for Playlist Queue Jobs
      const playlistJob = await pollNextPlaylistJob();
      if (playlistJob) {
        const { playlistId, run } = playlistJob;
        
        if (run.type === 'clean' || run.type === 'parse') {
          await processPlaylistClean(playlistId, run.runId);
        } else if (run.type === 'validate') {
          await processPlaylistValidate(playlistId, run.runId);
        }
        continue; // Immediately poll for the next job
      }

      // 2. Poll for App Build Compilation Requests
      const buildJob = await pollNextBuildJob();
      if (buildJob) {
        logger.info(`Compiling app launch container via EAS engine`, { buildId: buildJob.buildId });
        try {
          const { triggerEasAndroidBuild } = require('@iptv-menu/jobs');
          
          const buildResult = await triggerEasAndroidBuild({
            buildId: buildJob.buildId,
            appName: buildJob.appName,
            brandConfig: buildJob.brandConfig,
            playlistSource: buildJob.playlistSource,
          });

          const artifactPath = buildResult.downloadUrl || `users/${buildJob.uid}/builds/${buildJob.buildId}_android_release.apk`;

          await buildRepo.updateBuild(buildJob.buildId, {
            status: buildResult.status === 'FINISHED' ? 'succeeded' : 'building',
            artifactPath,
            buildLogPath: `users/${buildJob.uid}/builds/logs/${buildJob.buildId}.log`,
          });
          logger.info(`Custom IPTV launcher build dispatched successfully`, { buildId: buildJob.buildId, easId: buildResult.easBuildId });
        } catch (buildErr: any) {
          logger.error(`Build failed`, buildErr);
          await buildRepo.updateBuild(buildJob.buildId, {
            status: 'failed',
            buildLogPath: `users/${buildJob.uid}/builds/logs/${buildJob.buildId}_err.log`,
          });
        }
        continue;
      }

      // 3. Poll for EPG Generation Jobs
      const epgJob = await pollNextEpgJob();
      if (epgJob) {
        await processEpgJob(epgJob.epgId, epgJob.uid);
        continue;
      }

      // No jobs in queue, back off for 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (loopError) {
      logger.error('Error encountered inside core worker loop', loopError);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  logger.info('Worker loop exited cleanly.');
}

// Start worker thread
runWorker();
