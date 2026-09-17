/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePlayerStore } from '../src/store/usePlayerStore';

describe('M3U Multi-Playlist Subscription Hub & Auto-Sync Engine', () => {
  beforeEach(() => {
    // Reset subscriptions to a known test state
    usePlayerStore.setState({
      subscriptions: [
        {
          id: 'sub-test-1',
          name: 'Primary Test Feed',
          url: 'https://example.com/playlist1.m3u',
          autoSync: true,
          syncIntervalMinutes: 60,
          channelCount: 15,
          status: 'synced',
          lastSyncTime: new Date(Date.now() - 3600000).toISOString(),
          colorTag: '#06b6d4'
        },
        {
          id: 'sub-test-2',
          name: 'Secondary Test Feed',
          url: 'https://example.com/playlist2.m3u',
          autoSync: false,
          syncIntervalMinutes: 360,
          channelCount: 25,
          status: 'synced',
          lastSyncTime: new Date(Date.now() - 7200000).toISOString(),
          colorTag: '#10b981'
        }
      ],
      activeSubscriptionId: 'sub-test-1',
      playlistUrl: 'https://example.com/playlist1.m3u'
    });
  });

  it('should initialize with initial subscriptions list', () => {
    const store = usePlayerStore.getState();
    expect(store.subscriptions).toHaveLength(2);
    expect(store.subscriptions[0].name).toBe('Primary Test Feed');
    expect(store.activeSubscriptionId).toBe('sub-test-1');
  });

  it('should add a new playlist subscription with generated ID and default synced status', () => {
    const store = usePlayerStore.getState();
    const newSub = store.addSubscription({
      name: 'Custom Sports M3U',
      url: 'https://sports.example.com/live.m3u8',
      autoSync: true,
      syncIntervalMinutes: 15,
      colorTag: '#f59e0b'
    });

    expect(newSub.id).toBeDefined();
    expect(newSub.name).toBe('Custom Sports M3U');
    expect(newSub.status).toBe('synced');
    expect(newSub.channelCount).toBe(0);
    expect(newSub.lastSyncTime).toBeDefined();

    const updatedSubs = usePlayerStore.getState().subscriptions;
    expect(updatedSubs).toHaveLength(3);
    expect(updatedSubs.some(s => s.id === newSub.id)).toBe(true);
  });

  it('should toggle autoSync flag for a subscription', () => {
    const store = usePlayerStore.getState();
    expect(store.subscriptions[0].autoSync).toBe(true);

    store.toggleAutoSync('sub-test-1');
    expect(usePlayerStore.getState().subscriptions[0].autoSync).toBe(false);

    store.toggleAutoSync('sub-test-1');
    expect(usePlayerStore.getState().subscriptions[0].autoSync).toBe(true);
  });

  it('should update subscription configuration (e.g. interval or name)', () => {
    const store = usePlayerStore.getState();
    store.updateSubscription('sub-test-2', {
      syncIntervalMinutes: 15,
      name: 'Updated Secondary Feed'
    });

    const target = usePlayerStore.getState().subscriptions.find(s => s.id === 'sub-test-2');
    expect(target?.syncIntervalMinutes).toBe(15);
    expect(target?.name).toBe('Updated Secondary Feed');
  });

  it('should activate a subscription and set activeSubscriptionId and playlistUrl', async () => {
    const store = usePlayerStore.getState();
    // Spy on loadPlaylist to prevent actual network fetch
    const loadSpy = vi.spyOn(usePlayerStore.getState(), 'loadPlaylist').mockResolvedValue(undefined as any);

    await store.activateSubscription('sub-test-2');

    const updated = usePlayerStore.getState();
    expect(updated.activeSubscriptionId).toBe('sub-test-2');
    expect(updated.playlistUrl).toBe('https://example.com/playlist2.m3u');
    expect(loadSpy).toHaveBeenCalledWith('https://example.com/playlist2.m3u');

    loadSpy.mockRestore();
  });

  it('should remove a subscription and clear activeSubscriptionId if it was active', () => {
    const store = usePlayerStore.getState();
    expect(store.activeSubscriptionId).toBe('sub-test-1');

    store.removeSubscription('sub-test-1');

    const updated = usePlayerStore.getState();
    expect(updated.subscriptions.some(s => s.id === 'sub-test-1')).toBe(false);
    expect(updated.activeSubscriptionId).toBeNull();
  });

  it('should sync a single subscription and update its status and lastSyncTime', async () => {
    const store = usePlayerStore.getState();
    const beforeSync = store.subscriptions[0].lastSyncTime;
    const loadSpy = vi.spyOn(usePlayerStore.getState(), 'loadPlaylist').mockResolvedValue(undefined as any);

    // Small delay to ensure timestamp change
    await new Promise(r => setTimeout(r, 10));
    await store.syncSubscription('sub-test-1');

    const updated = usePlayerStore.getState().subscriptions.find(s => s.id === 'sub-test-1');
    expect(updated?.status).toBe('synced');
    expect(updated?.lastSyncTime).not.toBe(beforeSync);

    loadSpy.mockRestore();
  });

  it('should sync all autoSync subscriptions in batch via syncAllSubscriptions', async () => {
    const syncSpy = vi.spyOn(usePlayerStore.getState(), 'syncSubscription').mockResolvedValue(undefined);

    await usePlayerStore.getState().syncAllSubscriptions();

    // Only sub-test-1 has autoSync=true in beforeEach
    expect(syncSpy).toHaveBeenCalledWith('sub-test-1');
    expect(syncSpy).not.toHaveBeenCalledWith('sub-test-2');

    syncSpy.mockRestore();
  });
});
