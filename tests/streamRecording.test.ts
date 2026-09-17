/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { usePlayerStore } from '../src/store/usePlayerStore';
import { 
  StreamRecorderEngine, 
  formatBytes, 
  formatDuration, 
  getSupportedMimeType 
} from '../src/utils/streamRecorderEngine';

describe('Phase 23: Live Stream Recording Engine & Local DVR Exporter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    usePlayerStore.getState().clearCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Formatting Utilities', () => {
    it('should format bytes accurately across units', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(-50)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1024 * 1024 * 4.25)).toBe('4.3 MB');
      expect(formatBytes(1024 * 1024 * 1024 * 1.75)).toBe('1.8 GB');
    });

    it('should format durations correctly into MM:SS and HH:MM:SS', () => {
      expect(formatDuration(0)).toBe('00:00');
      expect(formatDuration(-10)).toBe('00:00');
      expect(formatDuration(9)).toBe('00:09');
      expect(formatDuration(75)).toBe('01:15');
      expect(formatDuration(3600)).toBe('01:00:00');
      expect(formatDuration(3665)).toBe('01:01:05');
    });

    it('should return a valid media MIME type fallback', () => {
      const mime = getSupportedMimeType();
      expect(typeof mime).toBe('string');
      expect(mime.length).toBeGreaterThan(0);
      expect(mime.startsWith('video/')).toBe(true);
    });
  });

  describe('StreamRecorderEngine Lifecycle', () => {
    it('should initialize in idle state and reject duplicate starts', () => {
      const engine = new StreamRecorderEngine();
      expect(engine.getStatus()).toBe('idle');
      expect(engine.isRecording()).toBe(false);
      expect(engine.getElapsedSeconds()).toBe(0);
      expect(engine.getBytesRecorded()).toBe(0);

      const started1 = engine.start(null, {
        channelId: 'cbs-news',
        channelName: 'CBS News 24/7 HD',
        streamUrl: 'https://example.com/cbs.m3u8',
        autoDownload: false
      });
      expect(started1).toBe(true);
      expect(engine.isRecording()).toBe(true);
      expect(engine.getStatus()).toBe('recording');

      // Duplicate start attempt
      const started2 = engine.start(null, {
        channelId: 'cbs-news',
        channelName: 'CBS News 24/7 HD',
        streamUrl: 'https://example.com/cbs.m3u8'
      });
      expect(started2).toBe(false);

      engine.cancel();
      expect(engine.isRecording()).toBe(false);
      expect(engine.getStatus()).toBe('idle');
    });

    it('should tick progress, record bytes, and finalize on stop()', () => {
      const engine = new StreamRecorderEngine();
      const progressUpdates: any[] = [];
      let completionResult: any = null;

      engine.start(null, {
        channelId: 'nasa-tv',
        channelName: 'NASA TV HD',
        streamUrl: 'https://example.com/nasa.m3u8',
        autoDownload: false,
        onProgress: (p) => progressUpdates.push(p),
        onComplete: (res) => { completionResult = res; }
      });

      // Advance simulated timer by 3 seconds
      vi.advanceTimersByTime(3000);

      expect(engine.getElapsedSeconds()).toBe(3);
      expect(engine.getBytesRecorded()).toBeGreaterThan(0);
      expect(progressUpdates.length).toBe(3);
      expect(progressUpdates[2].elapsedSeconds).toBe(3);

      // Stop recording
      engine.stop();

      expect(engine.isRecording()).toBe(false);
      expect(engine.getStatus()).toBe('idle');
      expect(completionResult).not.toBeNull();
      expect(completionResult.channelId).toBe('nasa-tv');
      expect(completionResult.channelName).toBe('NASA TV HD');
      expect(completionResult.durationSeconds).toBe(3);
      expect(completionResult.filename).toContain('recording-nasa-tv-hd-');
      expect(completionResult.blob).toBeInstanceOf(Blob);
    });

    it('should respect auto-stop safety ceiling (maxDurationSeconds)', () => {
      const engine = new StreamRecorderEngine();
      let completed = false;

      engine.start(null, {
        channelId: 'dw-english',
        channelName: 'DW English',
        streamUrl: 'https://example.com/dw.m3u8',
        maxDurationSeconds: 5,
        autoDownload: false,
        onComplete: () => { completed = true; }
      });

      expect(engine.isRecording()).toBe(true);

      // Advance by 5 seconds to hit max ceiling
      vi.advanceTimersByTime(5000);

      expect(completed).toBe(true);
      expect(engine.isRecording()).toBe(false);
      expect(engine.getElapsedSeconds()).toBe(5);
    });

    it('should support cancel without firing onComplete', () => {
      const engine = new StreamRecorderEngine();
      let completed = false;

      engine.start(null, {
        channelId: 'test-ch',
        channelName: 'Test Channel',
        streamUrl: 'https://example.com/test.m3u8',
        autoDownload: false,
        onComplete: () => { completed = true; }
      });

      vi.advanceTimersByTime(2000);
      engine.cancel();

      expect(completed).toBe(false);
      expect(engine.isRecording()).toBe(false);
      expect(engine.getStatus()).toBe('idle');
    });
  });

  describe('Player Store Recording Actions & DVR Persistence', () => {
    it('should start and update active recording progress in usePlayerStore', () => {
      const store = usePlayerStore.getState();

      expect(store.activeRecording.isRecording).toBe(false);
      expect(store.activeRecording.status).toBe('idle');

      store.startActiveRecording({
        channelId: 'redbull-tv',
        channelName: 'Red Bull TV HD',
        streamUrl: 'https://example.com/redbull.m3u8',
        maxDurationSeconds: 1800
      });

      const current = usePlayerStore.getState().activeRecording;
      expect(current.isRecording).toBe(true);
      expect(current.status).toBe('recording');
      expect(current.channelName).toBe('Red Bull TV HD');
      expect(current.maxDurationSeconds).toBe(1800);

      // Update progress
      store.updateActiveRecordingProgress(15, 1024 * 1024 * 5); // 15s, ~5MB

      const updated = usePlayerStore.getState().activeRecording;
      expect(updated.elapsedSeconds).toBe(15);
      expect(updated.bytesRecorded).toBe(1024 * 1024 * 5);
    });

    it('should auto-register completed recording into dvrRecordings on stopActiveRecording', () => {
      const store = usePlayerStore.getState();

      store.startActiveRecording({
        channelId: 'al-jazeera',
        channelName: 'Al Jazeera English HD',
        streamUrl: 'https://example.com/aje.m3u8'
      });

      store.updateActiveRecordingProgress(120, 1024 * 1024 * 40); // 2 min, 40MB

      const dvrEntry = store.stopActiveRecording({
        blobUrl: 'blob:http://localhost/mock-video-uuid',
        downloadFilename: 'al-jazeera-capture.webm',
        bytesRecorded: 1024 * 1024 * 40,
        elapsedSeconds: 120
      });

      expect(dvrEntry).not.toBeNull();
      expect(dvrEntry?.channelId).toBe('al-jazeera');
      expect(dvrEntry?.programTitle).toBe('Al Jazeera English HD Live Capture');
      expect(dvrEntry?.status).toBe('completed');
      expect(dvrEntry?.durationMinutes).toBe(2);
      expect(dvrEntry?.fileSizeEstimate).toBe('40.0 MB');
      expect(dvrEntry?.blobUrl).toBe('blob:http://localhost/mock-video-uuid');
      expect(dvrEntry?.downloadFilename).toBe('al-jazeera-capture.webm');

      // Check store dvrRecordings list
      const allRecordings = usePlayerStore.getState().dvrRecordings;
      expect(allRecordings.length).toBe(1);
      expect(allRecordings[0].id).toBe(dvrEntry?.id);

      // Active recording should be reset to idle
      const recordingState = usePlayerStore.getState().activeRecording;
      expect(recordingState.isRecording).toBe(false);
      expect(recordingState.status).toBe('idle');
    });

    it('should set error state on cancelActiveRecording with error message', () => {
      const store = usePlayerStore.getState();

      store.startActiveRecording({
        channelId: 'error-ch',
        channelName: 'Error Channel',
        streamUrl: 'https://example.com/err.m3u8'
      });

      expect(usePlayerStore.getState().activeRecording.isRecording).toBe(true);

      store.cancelActiveRecording('MediaRecorder capture stream failed');

      const state = usePlayerStore.getState().activeRecording;
      expect(state.isRecording).toBe(false);
      expect(state.status).toBe('error');
      expect(state.error).toBe('MediaRecorder capture stream failed');
    });
  });
});
