/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../src/store/usePlayerStore';
import { Channel } from '../src/types/iptv';

describe('Picture-in-Picture (PiP) Floating Mini-Player Engine', () => {
  beforeEach(() => {
    usePlayerStore.getState().closePiP();
  });

  const sampleChannel: Channel = {
    id: 'test-pip-channel-1',
    name: 'BBC World News HD',
    logo: 'https://example.com/logo.png',
    url: 'https://example.com/bbc/master.m3u8',
    group: 'News',
    countryCode: 'GB',
    countryName: 'United Kingdom',
    language: 'eng',
    languageName: 'English',
    healthStatus: 'online',
    alternateUrls: ['https://backup.example.com/bbc/stream.m3u8']
  };

  it('should initialize with PiP inactive and null channel', () => {
    const store = usePlayerStore.getState();
    expect(store.isPiPActive).toBe(false);
    expect(store.pipChannel).toBeNull();
    expect(store.pipStreamUrl).toBeUndefined();
  });

  it('should open PiP, set active channel, fallback stream URL, and record history', () => {
    const store = usePlayerStore.getState();

    store.openPiP(sampleChannel);

    const updated = usePlayerStore.getState();
    expect(updated.isPiPActive).toBe(true);
    expect(updated.pipChannel?.id).toBe('test-pip-channel-1');
    expect(updated.pipStreamUrl).toBe('https://example.com/bbc/master.m3u8');
    expect(updated.history).toContain('test-pip-channel-1');
  });

  it('should support custom override stream URL (e.g. gateway proxy or alternate feed)', () => {
    const store = usePlayerStore.getState();
    const proxyUrl = '/api/stream/proxy?url=' + encodeURIComponent(sampleChannel.url);

    store.openPiP(sampleChannel, proxyUrl);

    const updated = usePlayerStore.getState();
    expect(updated.isPiPActive).toBe(true);
    expect(updated.pipChannel?.name).toBe('BBC World News HD');
    expect(updated.pipStreamUrl).toBe(proxyUrl);
  });

  it('should cleanly close PiP and reset state', () => {
    const store = usePlayerStore.getState();
    store.openPiP(sampleChannel);
    expect(usePlayerStore.getState().isPiPActive).toBe(true);

    store.closePiP();

    const afterClose = usePlayerStore.getState();
    expect(afterClose.isPiPActive).toBe(false);
    expect(afterClose.pipChannel).toBeNull();
    expect(afterClose.pipStreamUrl).toBeUndefined();
  });

  it('should configure PiP size presets (compact, normal, large)', () => {
    const store = usePlayerStore.getState();

    store.setPiPSize('compact');
    expect(usePlayerStore.getState().pipSize).toBe('compact');

    store.setPiPSize('large');
    expect(usePlayerStore.getState().pipSize).toBe('large');

    store.setPiPSize('normal');
    expect(usePlayerStore.getState().pipSize).toBe('normal');
  });

  it('should toggle PiP audio mute state independently', () => {
    const store = usePlayerStore.getState();
    const initialMuted = store.isPiPMuted;

    store.togglePiPMute();
    expect(usePlayerStore.getState().isPiPMuted).toBe(!initialMuted);

    store.togglePiPMute();
    expect(usePlayerStore.getState().isPiPMuted).toBe(initialMuted);
  });
});
