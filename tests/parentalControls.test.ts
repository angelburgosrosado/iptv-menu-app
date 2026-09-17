/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../src/store/usePlayerStore';
import { hashPin, verifyPin, DEFAULT_LOCKED_CATEGORIES } from '../src/utils/parentalSecurity';

describe('Parental Controls & Channel Content Security Engine', () => {
  beforeEach(() => {
    usePlayerStore.getState().removeParentalPin();
    usePlayerStore.setState({
      parentalControls: {
        isEnabled: false,
        pinHash: null,
        isSessionUnlocked: false,
        sessionUnlockTimeoutMinutes: 30,
        unlockedAtTimestamp: null,
        lockedChannelIds: [],
        lockedCategories: [...DEFAULT_LOCKED_CATEGORIES],
        hideLockedChannelsInGuide: false,
        requirePinForSettings: false,
      }
    });
  });

  describe('Cryptographic Helpers', () => {
    it('should hash a 4-digit PIN deterministically', async () => {
      const hash1 = await hashPin('1234');
      const hash2 = await hashPin('1234');
      const hashDiff = await hashPin('4321');

      expect(hash1).toBeDefined();
      expect(typeof hash1).toBe('string');
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hashDiff);
    });

    it('should verify matching and non-matching PINs against stored hash', async () => {
      const hash = await hashPin('7890');
      const valid = await verifyPin('7890', hash);
      const invalid = await verifyPin('0000', hash);

      expect(valid).toBe(true);
      expect(invalid).toBe(false);
    });

    it('should return false if stored hash is null', async () => {
      const result = await verifyPin('1234', null);
      expect(result).toBe(false);
    });
  });

  describe('Parental Controls Store Configuration & State', () => {
    it('should initialize with factory default values', () => {
      const state = usePlayerStore.getState().parentalControls;
      expect(state.isEnabled).toBe(false);
      expect(state.pinHash).toBeNull();
      expect(state.isSessionUnlocked).toBe(false);
      expect(state.sessionUnlockTimeoutMinutes).toBe(30);
      expect(state.lockedChannelIds).toEqual([]);
      expect(state.lockedCategories).toContain('xxx');
      expect(state.lockedCategories).toContain('adult');
      expect(state.hideLockedChannelsInGuide).toBe(false);
    });

    it('should set master PIN and auto-activate parental controls and session unlock', async () => {
      const store = usePlayerStore.getState();
      await store.setParentalPin('5566');

      const state = usePlayerStore.getState().parentalControls;
      expect(state.pinHash).not.toBeNull();
      expect(state.isEnabled).toBe(true);
      expect(state.isSessionUnlocked).toBe(true);
      expect(state.unlockedAtTimestamp).toBeGreaterThan(0);
    });

    it('should verify PIN and unlock a locked session', async () => {
      const store = usePlayerStore.getState();
      await store.setParentalPin('9988');

      // Manually relock session
      store.lockParentalSession();
      expect(usePlayerStore.getState().parentalControls.isSessionUnlocked).toBe(false);

      // Verify wrong PIN
      const wrong = await store.verifyParentalPin('1111');
      expect(wrong).toBe(false);
      expect(usePlayerStore.getState().parentalControls.isSessionUnlocked).toBe(false);

      // Verify correct PIN
      const correct = await store.verifyParentalPin('9988');
      expect(correct).toBe(true);
      expect(usePlayerStore.getState().parentalControls.isSessionUnlocked).toBe(true);
    });

    it('should completely remove parental PIN and disable controls', async () => {
      const store = usePlayerStore.getState();
      await store.setParentalPin('1234');
      store.toggleChannelLock('ch-cbs-news');

      store.removeParentalPin();
      const state = usePlayerStore.getState().parentalControls;
      expect(state.pinHash).toBeNull();
      expect(state.isEnabled).toBe(false);
      expect(state.isSessionUnlocked).toBe(false);
      expect(state.unlockedAtTimestamp).toBeNull();
    });

    it('should enable and disable parental controls toggle without deleting PIN', async () => {
      const store = usePlayerStore.getState();
      await store.setParentalPin('4321');

      store.setParentalControlsEnabled(false);
      expect(usePlayerStore.getState().parentalControls.isEnabled).toBe(false);
      expect(usePlayerStore.getState().parentalControls.pinHash).not.toBeNull();

      store.setParentalControlsEnabled(true);
      expect(usePlayerStore.getState().parentalControls.isEnabled).toBe(true);
    });
  });

  describe('Channel & Category Locking Logic', () => {
    it('should toggle individual channel locks in lockedChannelIds', async () => {
      const store = usePlayerStore.getState();
      store.toggleChannelLock('channel-redbull');
      expect(usePlayerStore.getState().parentalControls.lockedChannelIds).toContain('channel-redbull');

      store.toggleChannelLock('channel-redbull');
      expect(usePlayerStore.getState().parentalControls.lockedChannelIds).not.toContain('channel-redbull');
    });

    it('should accurately identify locked channels when controls are enabled and session is locked', async () => {
      const store = usePlayerStore.getState();
      await store.setParentalPin('2468');
      store.toggleChannelLock('cbs-news-24-7-hd');

      // Relock session
      store.lockParentalSession();

      const channelObj = { id: 'cbs-news-24-7-hd', name: 'CBS News 24/7 HD', group: 'News' };
      const safeChannel = { id: 'france-24', name: 'France 24 Live HD', group: 'News' };

      expect(store.isChannelLocked(channelObj)).toBe(true);
      expect(store.isChannelLocked(safeChannel)).toBe(false);

      // When session is unlocked with PIN, channel should not be locked
      store.unlockParentalSession();
      expect(store.isChannelLocked(channelObj)).toBe(false);
    });

    it('should automatically identify channels with restricted categories as locked', async () => {
      const store = usePlayerStore.getState();
      await store.setParentalPin('1234');
      store.lockParentalSession();

      const adultChannelByGroup = { id: 'ch-1', name: 'Night Club Live', group: 'Adult XXX' };
      const adultChannelByName = { id: 'ch-2', name: 'Playboy TV HD', group: 'Entertainment' };
      const matureChannel = { id: 'ch-3', name: 'Late Night Mature Cinema', group: 'Movies' };
      const regularChannel = { id: 'ch-4', name: 'Discovery Channel', group: 'Documentary' };

      expect(store.isChannelLocked(adultChannelByGroup)).toBe(true);
      expect(store.isChannelLocked(adultChannelByName)).toBe(true);
      expect(store.isChannelLocked(matureChannel)).toBe(true);
      expect(store.isChannelLocked(regularChannel)).toBe(false);
    });

    it('should return false for all channels if parental controls are disabled', async () => {
      const store = usePlayerStore.getState();
      await store.setParentalPin('1234');
      store.toggleChannelLock('locked-1');
      store.setParentalControlsEnabled(false);

      const channelObj = { id: 'locked-1', name: 'Locked Channel', group: 'Adult' };
      expect(store.isChannelLocked(channelObj)).toBe(false);
    });

    it('should toggle category restrictions dynamically', () => {
      const store = usePlayerStore.getState();
      expect(store.parentalControls.lockedCategories).toContain('xxx');

      store.toggleCategoryLock('xxx');
      expect(usePlayerStore.getState().parentalControls.lockedCategories).not.toContain('xxx');

      store.toggleCategoryLock('horror');
      expect(usePlayerStore.getState().parentalControls.lockedCategories).toContain('horror');
    });

    it('should update hideLockedChannelsInGuide preference', () => {
      const store = usePlayerStore.getState();
      expect(store.parentalControls.hideLockedChannelsInGuide).toBe(false);

      store.setHideLockedChannels(true);
      expect(usePlayerStore.getState().parentalControls.hideLockedChannelsInGuide).toBe(true);
    });

    it('should update session relock timeout minutes', () => {
      const store = usePlayerStore.getState();
      store.setParentalSessionTimeout(60);
      expect(usePlayerStore.getState().parentalControls.sessionUnlockTimeoutMinutes).toBe(60);
    });

    it('should automatically expire session and relock channels after timeout passes', async () => {
      const store = usePlayerStore.getState();
      await store.setParentalPin('1122');
      store.toggleChannelLock('ch-test');
      store.setParentalSessionTimeout(15); // 15 minutes timeout

      // Simulate session unlocked 16 minutes ago
      const sixteenMinutesAgo = Date.now() - (16 * 60 * 1000);
      usePlayerStore.setState({
        parentalControls: {
          ...usePlayerStore.getState().parentalControls,
          isSessionUnlocked: true,
          unlockedAtTimestamp: sixteenMinutesAgo
        }
      });

      // isChannelLocked should detect expired session and relock
      const channel = { id: 'ch-test', name: 'Test Channel', group: 'General' };
      expect(store.isChannelLocked(channel)).toBe(true);
      expect(usePlayerStore.getState().parentalControls.isSessionUnlocked).toBe(false);
    });
  });
});
