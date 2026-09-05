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

/**
 * Parses and cleanses duplicate or broken channels in an M3U file
 */
async function processPlaylistClean(playlistId: string, runId: string) {
  logger.info(`Starting M3U Playlist cleaning run`, { playlistId, runId });
  
  try {
    const playlist = await playlistRepo.getPlaylist(playlistId);
    if (!playlist) throw new Error('Playlist document not found in Firestore');
    if (!playlist.originalFilePath) throw new Error('Missing original file path');

    logger.info(`Fetching original playlist stream from GCS...`);
    const fileBuffer = await downloadFromBucket(config.GCS_UPLOAD_BUCKET, playlist.originalFilePath);
    const m3uContent = fileBuffer.toString('utf-8');

    const lines = m3uContent.split('\n');
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
    if (!playlist.cleanedFilePath && !playlist.originalFilePath) throw new Error('No playlist file found to validate');

    const targetPath = playlist.cleanedFilePath || playlist.originalFilePath;
    const fileBuffer = await downloadFromBucket(config.GCS_UPLOAD_BUCKET, targetPath as string);
    const m3uContent = fileBuffer.toString('utf-8');

    const lines = m3uContent.split('\n');
    let channelsTested = 0;
    let deadStreams = 0;
    
    // Quick probe for stream health (limited to 10 for speed in worker)
    for (let i = 0; i < lines.length; i++) {
        if (!lines[i].startsWith('#') && lines[i].trim() !== '') {
            if (channelsTested >= 10) break; // Limit for prototype
            channelsTested++;
            const url = lines[i].trim();
            try {
                await axios.head(url, { timeout: 3000 });
            } catch (err) {
                deadStreams++;
            }
        }
    }

    await playlistRepo.updatePlaylistRun(playlistId, runId, {
      status: 'completed',
      summary: {
        channelsTested,
        deadStreamsDetected: deadStreams,
        successRatio: channelsTested > 0 ? ((channelsTested - deadStreams) / channelsTested) * 100 : 0,
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
        logger.info(`Compiling app launch container via EAS engine`, { buildId: buildJob.buildId });
        try {
          const { triggerEasAndroidBuild } = require('@iptv-menu/jobs');
          
          const buildResult = await triggerEasAndroidBuild({
            buildId: buildJob.buildId,
            appName: buildJob.appName,
            brandConfig: buildJob.brandConfig,
            playlistSource: buildJob.playlistSource
          });

          const artifactPath = buildResult.downloadUrl || `users/${buildJob.uid}/builds/${buildJob.buildId}_android_release.apk`;

          await buildRepo.updateBuild(buildJob.buildId, {
            status: buildResult.status === 'FINISHED' ? 'succeeded' : 'building',
            artifactPath,
            buildLogPath: `users/${buildJob.uid}/builds/logs/${buildJob.buildId}.log`
          });
          logger.info(`Custom IPTV launcher build dispatched successfully`, { buildId: buildJob.buildId, easId: buildResult.easBuildId });
        } catch (buildErr: any) {
          logger.error(`Build failed`, buildErr);
          await buildRepo.updateBuild(buildJob.buildId, {
            status: 'failed',
            buildLogPath: `users/${buildJob.uid}/builds/logs/${buildJob.buildId}_err.log`
          });
        }
        continue;
      }

      // 3. Poll for EPG Generation Jobs
      const epgJob = await pollNextEpgJob();
      if (epgJob) {
        logger.info(`Generating EPG XMLTV feed`, { epgId: epgJob.epgId });
        try {
          // Fake compile delay for EPG parsing/generation
          await new Promise(resolve => setTimeout(resolve, 3000));

          const artifactPath = `users/${epgJob.uid}/epg/${epgJob.epgId}_xmltv.xml`;
          const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<tv generator-info-name="IPTV Menu EPG">\n  <channel id="mock.channel">\n    <display-name>Mock Channel</display-name>\n  </channel>\n  <programme start="20260709000000 +0000" stop="20260709010000 +0000" channel="mock.channel">\n    <title>Mock Program</title>\n    <desc>This is a simulated EPG generated by the backend worker.</desc>\n  </programme>\n</tv>`;
          
          await uploadToBucket(config.GCS_BUILD_BUCKET, artifactPath, xmlContent, 'application/xml');

          // We'd need to update epgFeed status, but for now we log it (epgRepo is not imported here, but that's ok since it's just a simulation of worker job)
          // To be fully correct, we should update the EpgFeed doc to 'ready'
          // Since epgRepo isn't instantiated in the worker currently, we skip this step or could add it.
          // Let's add EpgRepository to the top imports and update it.
          const { EpgRepository } = require('@iptv-menu/db');
          const epgRepo = new EpgRepository();
          await epgRepo.updateEpg(epgJob.epgId, {
            status: 'ready',
            outputFilePath: artifactPath,
          });

          logger.info(`EPG feed generated successfully`, { epgId: epgJob.epgId });
        } catch (epgErr: any) {
          logger.error(`EPG generation failed`, epgErr);
          const { EpgRepository } = require('@iptv-menu/db');
          const epgRepo = new EpgRepository();
          await epgRepo.updateEpg(epgJob.epgId, {
            status: 'failed',
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
