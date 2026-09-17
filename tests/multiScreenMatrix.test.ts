/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore, DEFAULT_MATRIX_CONFIG } from '../src/store/usePlayerStore';
import { Channel } from '../src/types/iptv';

describe('Phase 26: Multi-Stream Split-Screen & Quad-View PIP Matrix Engine', () => {
  const mockChannelA: Channel = {
    id: 'ch-alpha',
    name: 'Sports 1 HD',
    url: 'https://stream.example.com/sports1.m3u8',
    group: 'Sports',
    logo: 'https://example.com/sports1.png'
  };

  const mockChannelB: Channel = {
    id: 'ch-beta',
    name: 'News 24 Live',
    url: 'https://stream.example.com/news24.m3u8',
    group: 'News',
    logo: 'https://example.com/news24.png'
  };

  const mockChannelC: Channel = {
    id: 'ch-gamma',
    name: 'Cinema Premiere',
    url: 'https://stream.example.com/cinema.m3u8',
    group: 'Movies',
    logo: 'https://example.com/cinema.png'
  };

  const mockChannelD: Channel = {
    id: 'ch-delta',
    name: 'Music Top 40',
    url: 'https://stream.example.com/music.m3u8',
    group: 'Music',
    logo: 'https://example.com/music.png'
  };

  beforeEach(() => {
    usePlayerStore.getState().resetMatrixConfig();
  });

  describe('Default Configuration & Initialization', () => {
    it('should initialize with default 4-screen Quad layout', () => {
      const { matrixConfig } = usePlayerStore.getState();
      expect(matrixConfig.layout).toBe('quad');
      expect(matrixConfig.slots).toHaveLength(4);
      expect(matrixConfig.slots.every(s => s === null)).toBe(true);
      expect(matrixConfig.mutedSlots).toEqual([false, true, true, true]);
      expect(matrixConfig.volumes).toEqual([0.8, 0.8, 0.8, 0.8]);
      expect(matrixConfig.focusedAudioSlot).toBe(0);
    });

    it('should match exported DEFAULT_MATRIX_CONFIG constant structure', () => {
      expect(DEFAULT_MATRIX_CONFIG.layout).toBe('quad');
      expect(DEFAULT_MATRIX_CONFIG.slots).toHaveLength(4);
      expect(DEFAULT_MATRIX_CONFIG.focusedAudioSlot).toBe(0);
    });
  });

  describe('Layout Mode Switching', () => {
    it('should update layout mode between dual, triple, hero, and quad', () => {
      const store = usePlayerStore.getState();

      store.setMatrixLayout('dual');
      expect(usePlayerStore.getState().matrixConfig.layout).toBe('dual');

      store.setMatrixLayout('triple');
      expect(usePlayerStore.getState().matrixConfig.layout).toBe('triple');

      store.setMatrixLayout('hero');
      expect(usePlayerStore.getState().matrixConfig.layout).toBe('hero');

      store.setMatrixLayout('quad');
      expect(usePlayerStore.getState().matrixConfig.layout).toBe('quad');
    });
  });

  describe('Slot Channel Assignment & Clearing', () => {
    it('should assign a channel to a designated slot', () => {
      const store = usePlayerStore.getState();
      store.setMatrixSlot(1, mockChannelB);

      const { slots } = usePlayerStore.getState().matrixConfig;
      expect(slots[1]).toEqual(mockChannelB);
      expect(slots[0]).toBeNull();
    });

    it('should safely ignore assignment to invalid slot indices', () => {
      const store = usePlayerStore.getState();
      store.setMatrixSlot(-1, mockChannelA);
      store.setMatrixSlot(4, mockChannelA);

      const { slots } = usePlayerStore.getState().matrixConfig;
      expect(slots.every(s => s === null)).toBe(true);
    });

    it('should clear an active slot and reassign audio focus if the focused slot is cleared', () => {
      const store = usePlayerStore.getState();
      store.setMatrixSlot(0, mockChannelA);
      store.setMatrixSlot(2, mockChannelC);
      store.setMatrixAudioSolo(0);

      expect(usePlayerStore.getState().matrixConfig.focusedAudioSlot).toBe(0);

      // Clear slot 0 -> should fall back to next available (slot 2)
      store.clearMatrixSlot(0);

      const { slots, focusedAudioSlot, mutedSlots } = usePlayerStore.getState().matrixConfig;
      expect(slots[0]).toBeNull();
      expect(slots[2]).toEqual(mockChannelC);
      expect(focusedAudioSlot).toBe(2);
      expect(mutedSlots[2]).toBe(false);
      expect(mutedSlots[0]).toBe(true);
    });

    it('should set focusedAudioSlot to null if all populated slots are cleared', () => {
      const store = usePlayerStore.getState();
      store.setMatrixSlot(1, mockChannelB);
      store.setMatrixAudioSolo(1);

      store.clearMatrixSlot(1);
      expect(usePlayerStore.getState().matrixConfig.focusedAudioSlot).toBeNull();
    });
  });

  describe('Slot Swapping & Hero Promotion', () => {
    it('should swap channel, volume, and mute states between two slots', () => {
      const store = usePlayerStore.getState();
      store.setMatrixSlot(0, mockChannelA);
      store.setMatrixSlot(2, mockChannelC);
      store.setMatrixSlotVolume(0, 0.9);
      store.setMatrixSlotVolume(2, 0.4);
      store.setMatrixAudioSolo(0); // slot 0 unmuted, slot 2 muted

      store.swapMatrixSlots(0, 2);

      const { slots, volumes, mutedSlots, focusedAudioSlot } = usePlayerStore.getState().matrixConfig;
      expect(slots[0]).toEqual(mockChannelC);
      expect(slots[2]).toEqual(mockChannelA);
      expect(volumes[0]).toBe(0.4);
      expect(volumes[2]).toBe(0.9);
      expect(mutedSlots[0]).toBe(true);
      expect(mutedSlots[2]).toBe(false);
      // Audio focus should track slot A moving to index 2
      expect(focusedAudioSlot).toBe(2);
    });

    it('should no-op when swapping identical slots or invalid indices', () => {
      const store = usePlayerStore.getState();
      store.setMatrixSlot(0, mockChannelA);

      store.swapMatrixSlots(0, 0);
      store.swapMatrixSlots(0, 5);
      store.swapMatrixSlots(-1, 2);

      expect(usePlayerStore.getState().matrixConfig.slots[0]).toEqual(mockChannelA);
    });

    it('should promote any satellite slot to Slot #0 (Hero) and grant solo audio', () => {
      const store = usePlayerStore.getState();
      store.setMatrixSlot(0, mockChannelA);
      store.setMatrixSlot(3, mockChannelD);

      store.promoteToHeroSlot(3);

      const { slots, focusedAudioSlot, mutedSlots } = usePlayerStore.getState().matrixConfig;
      expect(slots[0]).toEqual(mockChannelD); // promoted to hero
      expect(slots[3]).toEqual(mockChannelA);
      expect(focusedAudioSlot).toBe(0);
      expect(mutedSlots[0]).toBe(false);
      expect(mutedSlots[3]).toBe(true);
    });
  });

  describe('Audio Solo Arbiter & Master Muting', () => {
    it('should unmute target slot and mute all other slots on setMatrixAudioSolo', () => {
      const store = usePlayerStore.getState();
      store.setMatrixAudioSolo(2);

      const { mutedSlots, focusedAudioSlot } = usePlayerStore.getState().matrixConfig;
      expect(focusedAudioSlot).toBe(2);
      expect(mutedSlots).toEqual([true, true, false, true]);
    });

    it('should toggle master mute on all active slots', () => {
      const store = usePlayerStore.getState();
      store.setMatrixAudioSolo(1); // slot 1 unmuted

      // First toggle: mute everything
      store.toggleMatrixMuteAll();
      expect(usePlayerStore.getState().matrixConfig.mutedSlots).toEqual([true, true, true, true]);
      expect(usePlayerStore.getState().matrixConfig.focusedAudioSlot).toBeNull();

      // Second toggle: restore solo audio on previous/default slot
      store.toggleMatrixMuteAll();
      expect(usePlayerStore.getState().matrixConfig.mutedSlots).toEqual([false, true, true, true]);
      expect(usePlayerStore.getState().matrixConfig.focusedAudioSlot).toBe(0);
    });
  });

  describe('Per-Slot Volume & Mute Controls', () => {
    it('should adjust volume for a specific slot and clamp to [0, 1]', () => {
      const store = usePlayerStore.getState();

      store.setMatrixSlotVolume(1, 0.65);
      expect(usePlayerStore.getState().matrixConfig.volumes[1]).toBe(0.65);

      store.setMatrixSlotVolume(1, 1.5);
      expect(usePlayerStore.getState().matrixConfig.volumes[1]).toBe(1.0);

      store.setMatrixSlotVolume(1, -0.5);
      expect(usePlayerStore.getState().matrixConfig.volumes[1]).toBe(0.0);
    });

    it('should automatically mute a slot when volume is set to 0', () => {
      const store = usePlayerStore.getState();
      store.setMatrixAudioSolo(2);
      expect(usePlayerStore.getState().matrixConfig.mutedSlots[2]).toBe(false);

      store.setMatrixSlotVolume(2, 0);
      expect(usePlayerStore.getState().matrixConfig.mutedSlots[2]).toBe(true);
      expect(usePlayerStore.getState().matrixConfig.focusedAudioSlot).toBeNull();
    });

    it('should toggle mute state on an individual slot and synchronize audio focus', () => {
      const store = usePlayerStore.getState();
      store.setMatrixAudioSolo(0);

      // Mute slot 0
      store.toggleMatrixSlotMute(0);
      expect(usePlayerStore.getState().matrixConfig.mutedSlots[0]).toBe(true);
      expect(usePlayerStore.getState().matrixConfig.focusedAudioSlot).toBeNull();

      // Unmute slot 0
      store.toggleMatrixSlotMute(0);
      expect(usePlayerStore.getState().matrixConfig.mutedSlots[0]).toBe(false);
      expect(usePlayerStore.getState().matrixConfig.focusedAudioSlot).toBe(0);
    });

    it('should reset all matrix state to clean quad defaults on resetMatrixConfig', () => {
      const store = usePlayerStore.getState();
      store.setMatrixLayout('hero');
      store.setMatrixSlot(0, mockChannelA);
      store.setMatrixSlot(1, mockChannelB);
      store.setMatrixSlotVolume(1, 0.3);

      store.resetMatrixConfig();

      const { matrixConfig } = usePlayerStore.getState();
      expect(matrixConfig.layout).toBe('quad');
      expect(matrixConfig.slots.every(s => s === null)).toBe(true);
      expect(matrixConfig.volumes).toEqual([0.8, 0.8, 0.8, 0.8]);
      expect(matrixConfig.focusedAudioSlot).toBe(0);
    });
  });
});
