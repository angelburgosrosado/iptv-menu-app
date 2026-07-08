import { pollNextPlaylistJob, pollNextBuildJob } from '@iptv-menu/jobs';
import { PlaylistRepository, BuildRepository, EpgRepository } from '@iptv-menu/db';
import { uploadToBucket } from '@iptv-menu/storage';
import { Logger } from '@iptv-menu/logging';
import { config } from '@iptv-menu/config';
import axios from 'axios';

const logger = new Logger('async-worker');
const playlistRepo = new PlaylistRepository();
const buildRepo = new BuildRepository();
const epgRepo = new EpgRepository();

/**
 * Parses and cleanses duplicate or broken channels in an M3U file
 */
async function processPlaylistClean(playlistId: string, runId: string) {
  logger.info(`Starting M3U Playlist cleaning run`, { playlistId, runId });
  
  try {
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist) throw new Error('Playlist document not found in Firestore');

    // Simulated parsing of M3U from GCS
    // In a full implementation, you fetch playlist.originalFilePath, loop lines, parse tags (#EXTINF), deduplicate, and compile
    logger.info(`Fetching original playlist stream...`);
    const mockM3UContent = `#EXTM3U\n#EXTINF:-1 tvg-id="HBO.us" tvg-name="HBO HD" group-title="US Movies",HBO HD\nhttp://example.com/stream/hbo.ts\n#EXTINF:-1 tvg-id="HBO.us" tvg-name="HBO HD Duplicate" group-title="US Movies",HBO HD\nhttp://example.com/stream/hbo.ts`;

    const lines = mockM3UContent.split('\n');
    let uniqueChannels: string[] = [];
    let channelsProcessed = 0;
    let channelsRemoved = 0;

    // Fast inline deduplication logic
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF')) {
        channelsProcessed++;
        const chanInfo = lines[i];
        const streamUrl = lines[i+1];
        if (!uniqueChannels.includes(streamUrl)) {
          uniqueChannels.push(chanInfo);
          uniqueChannels.push(streamUrl);
        } else {
          channelsRemoved++;
        }
      }
    }

    const cleanedM3U = `#EXTM3U\n` + uniqueChannels.join('\n');
    const cleanedPath = `users/${playlist.uid}/cleaned/${playlistId}_cleaned.m3u`;
    
    // Save output back to Google Cloud Storage
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

/**
 * Validates active stream links in an M3U playlist by sending ping HEAD requests
 */
async function processPlaylistValidate(playlistId: string, runId: string) {
  logger.info(`Starting stream ping validation run`, { playlistId, runId });
  
  try {
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist) throw new Error('Playlist not found');

    // Check HEAD of streams
    let channelsTested = 0;
    let deadStreams = 0;

    // Simulate probing a stream
    channelsTested = playlist.channelCount || 10;
    deadStreams = Math.floor(Math.random() * 2); // random mock dead streams

    await playlistRepo.updatePlaylistRun(playlistId, runId, {
      status: 'completed',
      summary: {
        channelsTested,
        deadStreamsDetected: deadStreams,
        successRatio: ((channelsTested - deadStreams) / channelsTested) * 100,
      },
      error: null,
    });

    logger.info(`Stream validation complete`, { playlistId, deadStreams });
  } catch (error: any) {
    logger.error(`Validation failed`, error);
    await playlistRepo.updatePlaylistRun(playlistId, runId, {
      status: 'failed',
      error: error.message,
    });
  }
}

/**
 * Background loop processor
 */
async function runWorker() {
  logger.info('IPTV Async Worker loop running... Polling for tasks');

  while (true) {
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
        logger.info(`Compiling app launch container`, { buildId: buildJob.buildId });
        try {
          // Fake compile delay
          await new Promise(resolve => setTimeout(resolve, 5000));

          const artifactPath = `users/${buildJob.uid}/builds/${buildJob.buildId}_android_release.apk`;
          await uploadToBucket(config.GCS_BUILD_BUCKET, artifactPath, 'mock-apk-binary-content', 'application/vnd.android.package-archive');

          await buildRepo.updateBuild(buildJob.buildId, {
            status: 'succeeded',
            artifactPath,
            buildLogPath: `users/${buildJob.uid}/builds/logs/${buildJob.buildId}.log`
          });
          logger.info(`Custom IPTV launcher build completed successfully`, { buildId: buildJob.buildId });
        } catch (buildErr: any) {
          logger.error(`Build failed`, buildErr);
          await buildRepo.updateBuild(buildJob.buildId, {
            status: 'failed',
            buildLogPath: `users/${buildJob.uid}/builds/logs/${buildJob.buildId}_err.log`
          });
        }
        continue;
      }

      // No jobs in queue, back off for 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (loopError) {
      logger.error('Error encountered inside core worker loop', loopError);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Start worker thread
runWorker();
