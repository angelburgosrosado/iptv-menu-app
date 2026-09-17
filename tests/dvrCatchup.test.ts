/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../src/store/usePlayerStore';
import { generateXtreamCatchupUrl } from '../src/utils/xtreamClient';
import { XtreamAccount } from '../src/types/iptv';

describe('Catchup DVR Simulator & Bookmarks Engine', () => {
  beforeEach(() => {
    usePlayerStore.getState().clearCache();
  });

  describe('DVR Recording Lifecycle', () => {
    it('should schedule a DVR recording with auto-generated ID, timestamp, and size estimate', () => {
      const store = usePlayerStore.getState();

      const recording = store.scheduleRecording({
        channelId: 'nasa-tv',
        channelName: 'NASA TV HD',
        programTitle: 'ISS Spacewalk Mission Coverage',
        programDescription: 'Astronauts conduct scheduled extravehicular activities in low Earth orbit.',
        streamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        startTime: '2026-09-17T10:00:00Z',
        endTime: '2026-09-17T11:00:00Z',
        durationMinutes: 60,
        status: 'scheduled',
        fileSizeEstimate: ''
      });

      expect(recording.id).toBeDefined();
      expect(recording.id.startsWith('rec_')).toBe(true);
      expect(recording.recordedAt).toBeDefined();
      expect(recording.fileSizeEstimate).toContain('MB');
      expect(recording.status).toBe('scheduled');

      const currentRecordings = usePlayerStore.getState().dvrRecordings;
      expect(currentRecordings.length).toBe(1);
      expect(currentRecordings[0].programTitle).toBe('ISS Spacewalk Mission Coverage');
    });

    it('should update recording status from scheduled to recording to completed', () => {
      const store = usePlayerStore.getState();

      const rec = store.scheduleRecording({
        channelId: 'dw-english',
        channelName: 'DW English',
        programTitle: 'Conflict Zone',
        streamUrl: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
        startTime: '2026-09-17T12:00:00Z',
        endTime: '2026-09-17T13:00:00Z',
        durationMinutes: 60,
        status: 'scheduled',
        fileSizeEstimate: '1.45 GB'
      });

      expect(usePlayerStore.getState().dvrRecordings[0].status).toBe('scheduled');

      store.updateRecordingStatus(rec.id, 'recording');
      expect(usePlayerStore.getState().dvrRecordings[0].status).toBe('recording');

      store.updateRecordingStatus(rec.id, 'completed');
      expect(usePlayerStore.getState().dvrRecordings[0].status).toBe('completed');
    });

    it('should delete a recording by id', () => {
      const store = usePlayerStore.getState();

      const rec1 = store.scheduleRecording({
        channelId: 'cbs-news',
        channelName: 'CBS News',
        programTitle: 'Evening News',
        streamUrl: 'https://lineup.cbsivideo.com/playout/8877a7d5/index.m3u8',
        startTime: '2026-09-17T18:00:00Z',
        endTime: '2026-09-17T19:00:00Z',
        durationMinutes: 60,
        status: 'completed',
        fileSizeEstimate: '1.5 GB'
      });

      const rec2 = store.scheduleRecording({
        channelId: 'france-24',
        channelName: 'France 24',
        programTitle: 'Global Perspective',
        streamUrl: 'https://live.france24.com/hls/live/2037179-b/F24_FR_HI_HLS/master_5000.m3u8',
        startTime: '2026-09-17T19:00:00Z',
        endTime: '2026-09-17T19:30:00Z',
        durationMinutes: 30,
        status: 'completed',
        fileSizeEstimate: '750 MB'
      });

      expect(usePlayerStore.getState().dvrRecordings.length).toBe(2);

      store.deleteRecording(rec1.id);
      const remaining = usePlayerStore.getState().dvrRecordings;
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(rec2.id);
    });
  });

  describe('Bookmarks Engine', () => {
    it('should add a channel bookmark and check status with isChannelBookmarked', () => {
      const store = usePlayerStore.getState();

      expect(store.isChannelBookmarked('redbull-tv')).toBe(false);

      const bookmark = store.addBookmark({
        channelId: 'redbull-tv',
        channelName: 'Red Bull TV HD',
        streamUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
        note: 'Extreme Sports'
      });

      expect(bookmark.id).toBeDefined();
      expect(bookmark.savedAt).toBeDefined();
      expect(usePlayerStore.getState().isChannelBookmarked('redbull-tv')).toBe(true);
      expect(usePlayerStore.getState().bookmarks.length).toBe(1);
    });

    it('should prevent duplicate bookmarks for the same channel', () => {
      const store = usePlayerStore.getState();

      store.addBookmark({
        channelId: 'al-jazeera',
        channelName: 'Al Jazeera English',
        streamUrl: 'https://live-hls-apps-aje-fa.getaj.net/AJE/01.m3u8'
      });

      store.addBookmark({
        channelId: 'al-jazeera',
        channelName: 'Al Jazeera English',
        streamUrl: 'https://live-hls-apps-aje-fa.getaj.net/AJE/01.m3u8'
      });

      expect(usePlayerStore.getState().bookmarks.length).toBe(1);
    });

    it('should remove bookmark by channelId or id', () => {
      const store = usePlayerStore.getState();

      const bm = store.addBookmark({
        channelId: 'cbs-news-hd',
        channelName: 'CBS News',
        streamUrl: 'https://lineup.cbsivideo.com/playout/8877a7d5/index.m3u8'
      });

      expect(usePlayerStore.getState().isChannelBookmarked('cbs-news-hd')).toBe(true);

      store.removeBookmark('cbs-news-hd');
      expect(usePlayerStore.getState().isChannelBookmarked('cbs-news-hd')).toBe(false);
      expect(usePlayerStore.getState().bookmarks.length).toBe(0);
    });
  });

  describe('Catchup Timeshift Integration', () => {
    it('should formulate proper Xtream catchup timeshift URLs for DVR playback', () => {
      const mockAccount: XtreamAccount = {
        serverUrl: 'http://line.melhata.org',
        username: '8rvzieximl',
        password: 'h1usotpevd',
        status: 'connected'
      };

      const date = new Date(2026, 8, 17, 8, 0); // Sept 17, 2026 08:00
      const catchupUrl = generateXtreamCatchupUrl(
        mockAccount,
        10482,
        date,
        60
      );

      expect(catchupUrl).toContain('http://line.melhata.org/timeshift/8rvzieximl/h1usotpevd/60/');
      expect(catchupUrl).toContain('2026-09-17:08-00/10482.m3u8');
    });
  });
});
