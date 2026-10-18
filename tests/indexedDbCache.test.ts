import { describe, it, expect, beforeEach } from 'vitest';
import { indexedDbCache } from '../src/utils/indexedDbCache';

describe('IndexedDB Resilient Cache Engine', () => {
  beforeEach(async () => {
    await indexedDbCache.clear('playlists');
    await indexedDbCache.clear('epg');
  });

  it('should write and read values from cache reliably', async () => {
    const playlistData = [
      { id: 'ch-1', name: 'CNN International', url: 'http://stream.example/cnn.m3u8' },
      { id: 'ch-2', name: 'BBC News HD', url: 'http://stream.example/bbc.m3u8' },
    ];

    await indexedDbCache.set('playlists', 'active_m3u', playlistData);
    const retrieved = await indexedDbCache.get<typeof playlistData>('playlists', 'active_m3u');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.length).toBe(2);
    expect(retrieved?.[0].name).toBe('CNN International');
  });

  it('should return null for non-existent keys', async () => {
    const val = await indexedDbCache.get('epg', 'non_existent_key');
    expect(val).toBeNull();
  });

  it('should delete keys cleanly', async () => {
    await indexedDbCache.set('generic', 'temp_token', 'xyz-123');
    let val = await indexedDbCache.get<string>('generic', 'temp_token');
    expect(val).toBe('xyz-123');

    await indexedDbCache.del('generic', 'temp_token');
    val = await indexedDbCache.get<string>('generic', 'temp_token');
    expect(val).toBeNull();
  });

  it('should support clearing an entire store while preserving others', async () => {
    await indexedDbCache.set('playlists', 'p1', { title: 'Sports' });
    await indexedDbCache.set('epg', 'guide_us', { shows: ['News'] });

    await indexedDbCache.clear('playlists');

    expect(await indexedDbCache.get('playlists', 'p1')).toBeNull();
    const epgVal = await indexedDbCache.get('epg', 'guide_us');
    expect(epgVal).not.toBeNull();
  });
});
