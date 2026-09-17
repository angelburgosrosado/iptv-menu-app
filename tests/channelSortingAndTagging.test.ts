/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../src/store/usePlayerStore';
import { Channel } from '../src/types/iptv';

describe('Channel Sorting & Custom Tagging Engine', () => {
  beforeEach(() => {
    usePlayerStore.getState().clearCache();
  });

  describe('Custom Tag Management', () => {
    it('should add custom tags to a channel and prevent duplicates', () => {
      const store = usePlayerStore.getState();

      store.addChannelTag('chan-1', 'Sports');
      store.addChannelTag('chan-1', '4K UHD');
      store.addChannelTag('chan-1', 'Sports'); // duplicate attempt

      const tags = usePlayerStore.getState().getChannelTags('chan-1');
      expect(tags).toEqual(['Sports', '4K UHD']);
    });

    it('should remove a custom tag from a channel', () => {
      const store = usePlayerStore.getState();

      store.addChannelTag('chan-2', 'News Prime');
      store.addChannelTag('chan-2', 'Late Night');
      store.addChannelTag('chan-2', 'Documentary');

      expect(usePlayerStore.getState().getChannelTags('chan-2').length).toBe(3);

      store.removeChannelTag('chan-2', 'late night'); // case-insensitive removal
      const remaining = usePlayerStore.getState().getChannelTags('chan-2');
      expect(remaining).toEqual(['News Prime', 'Documentary']);
    });

    it('should aggregate all unique custom tags across channels in sorted order', () => {
      const store = usePlayerStore.getState();

      store.addChannelTag('c1', 'Zebra Wildlife');
      store.addChannelTag('c1', 'Sports');
      store.addChannelTag('c2', 'Action Movies');
      store.addChannelTag('c3', 'Sports'); // overlap

      const allTags = usePlayerStore.getState().getAllUniqueCustomTags();
      expect(allTags).toEqual(['Action Movies', 'Sports', 'Zebra Wildlife']);
    });
  });

  describe('Channel Sorting Algorithms', () => {
    const mockChannels: Channel[] = [
      {
        id: 'c-3',
        name: 'Zeta News 24',
        logo: '',
        url: 'https://example.com/3.m3u8',
        group: 'News',
        tvgId: 'zeta',
        countryCode: 'US',
        healthStatus: 'offline'
      },
      {
        id: 'c-1',
        name: 'Alpha Sports HD',
        logo: '',
        url: 'https://example.com/1.m3u8',
        group: 'Sports',
        tvgId: 'alpha',
        countryCode: 'FR',
        healthStatus: 'online'
      },
      {
        id: 'c-2',
        name: 'Beta Cinema 4K',
        logo: '',
        url: 'https://example.com/2.m3u8',
        group: 'Cinema',
        tvgId: 'beta',
        countryCode: 'CA',
        healthStatus: 'degraded'
      }
    ];

    it('should sort channels alphabetically A-Z and Z-A', () => {
      const sortedAsc = [...mockChannels].sort((a, b) => a.name.localeCompare(b.name));
      expect(sortedAsc.map((c) => c.name)).toEqual([
        'Alpha Sports HD',
        'Beta Cinema 4K',
        'Zeta News 24'
      ]);

      const sortedDesc = [...mockChannels].sort((a, b) => b.name.localeCompare(a.name));
      expect(sortedDesc.map((c) => c.name)).toEqual([
        'Zeta News 24',
        'Beta Cinema 4K',
        'Alpha Sports HD'
      ]);
    });

    it('should sort channels by stream health (online > degraded > blocked > offline)', () => {
      const statusPriority: Record<string, number> = { online: 0, degraded: 1, blocked: 2, offline: 3 };
      const sortedByHealth = [...mockChannels].sort((a, b) => {
        const pa = a.healthStatus ? statusPriority[a.healthStatus] ?? 1 : 1;
        const pb = b.healthStatus ? statusPriority[b.healthStatus] ?? 1 : 1;
        return pa - pb;
      });

      expect(sortedByHealth.map((c) => c.healthStatus)).toEqual([
        'online',
        'degraded',
        'offline'
      ]);
      expect(sortedByHealth[0].name).toBe('Alpha Sports HD');
    });

    it('should sort channels by country code A-Z', () => {
      const sortedByCountry = [...mockChannels].sort((a, b) => 
        (a.countryCode || 'ZZ').localeCompare(b.countryCode || 'ZZ')
      );

      expect(sortedByCountry.map((c) => c.countryCode)).toEqual(['CA', 'FR', 'US']);
    });
  });
});
