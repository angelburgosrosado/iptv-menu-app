import { describe, it, expect, vi } from 'vitest';
import { parseM3U, generateM3UPlaylist } from '../src/utils/m3uParser';
import { Channel } from '../src/types/iptv';

describe('m3uParser utility', () => {
  it('should parse a standard M3U8 playlist with full attributes', () => {
    const m3u = `#EXTM3U
#EXTINF:-1 tvg-id="cnn.us" tvg-logo="https://example.com/cnn.png" group-title="News",CNN HD
https://stream.example.com/cnn/live.m3u8
#EXTINF:-1 tvg-id="espn.us" tvg-logo="https://example.com/espn.png" group-title="Sports",ESPN 1
https://stream.example.com/espn/live.m3u8`;

    const channels = parseM3U(m3u);

    expect(channels).toHaveLength(2);
    expect(channels[0]).toMatchObject({
      id: 'cnn.us',
      name: 'CNN HD',
      logo: 'https://example.com/cnn.png',
      url: 'https://stream.example.com/cnn/live.m3u8',
      group: 'News',
      tvgId: 'cnn.us',
      countryCode: 'UN',
      epgChannelId: 'cnn.us',
      metadataSource: 'playlist'
    });
    expect(channels[1]).toMatchObject({
      id: 'espn.us',
      name: 'ESPN 1',
      logo: 'https://example.com/espn.png',
      url: 'https://stream.example.com/espn/live.m3u8',
      group: 'Sports',
      tvgId: 'espn.us',
      countryCode: 'UN',
      epgChannelId: 'espn.us',
      metadataSource: 'playlist'
    });
  });

  it('should parse extended IPTV metadata including tvg-country, tvg-name, and language', () => {
    const m3u = `#EXTM3U
#EXTINF:-1 tvg-id="bbc1.uk" tvg-name="BBC One HD" tvg-country="GB" tvg-language="English" group-title="United Kingdom",BBC One HD
https://stream.example.com/bbc1.m3u8`;

    const channels = parseM3U(m3u);

    expect(channels).toHaveLength(1);
    expect(channels[0]).toMatchObject({
      id: 'bbc1.uk',
      name: 'BBC One HD',
      tvgName: 'BBC One HD',
      tvgCountry: 'GB',
      countryCode: 'GB',
      language: 'English',
      epgChannelId: 'bbc1.uk',
      metadataSource: 'playlist'
    });
  });

  it('should return empty array if #EXTM3U header is missing', () => {
    const invalidM3u = `#EXTINF:-1,Invalid Channel
https://stream.example.com/invalid.m3u8`;

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const channels = parseM3U(invalidM3u);

    expect(channels).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Does not contain #EXTM3U header'));
    consoleSpy.mockRestore();
  });

  it('should handle unquoted attributes and fall back to default group', () => {
    const m3u = `#EXTM3U
#EXTINF:-1 tvg-id=bbc1 tvg-logo=https://example.com/bbc.png group-title=UK,BBC One
https://stream.example.com/bbc1.m3u8
#EXTINF:-1,Standalone Channel
https://stream.example.com/standalone.m3u8`;

    const channels = parseM3U(m3u);

    expect(channels).toHaveLength(2);
    expect(channels[0].tvgId).toBe('bbc1');
    expect(channels[0].group).toBe('UK');
    expect(channels[1].group).toBe('Uncategorized');
    expect(channels[1].name).toBe('Standalone Channel');
  });

  it('should deduplicate identical stream URLs', () => {
    const m3u = `#EXTM3U
#EXTINF:-1 tvg-id="ch1",Channel One
https://stream.example.com/duplicate.m3u8
#EXTINF:-1 tvg-id="ch1-dup",Channel One Duplicate
https://stream.example.com/duplicate.m3u8`;

    const channels = parseM3U(m3u);

    expect(channels).toHaveLength(1);
    expect(channels[0].name).toBe('Channel One');
  });

  it('should handle Windows CRLF line breaks and whitespace lines', () => {
    const m3u = "#EXTM3U\r\n\r\n#EXTINF:-1 tvg-id=\"crlf\",Channel CRLF\r\nhttps://stream.example.com/crlf.m3u8\r\n\r\n";

    const channels = parseM3U(m3u);

    expect(channels).toHaveLength(1);
    expect(channels[0].name).toBe('Channel CRLF');
    expect(channels[0].url).toBe('https://stream.example.com/crlf.m3u8');
  });

  it('should generate stable hash IDs when tvgId is not provided', () => {
    const m3u = `#EXTM3U
#EXTINF:-1,No TVG Channel
https://stream.example.com/notvg.m3u8`;

    const channels = parseM3U(m3u);

    expect(channels).toHaveLength(1);
    expect(channels[0].id).toBeTruthy();
    expect(typeof channels[0].id).toBe('string');
  });

  it('should invoke onProgress callback', () => {
    const onProgress = vi.fn();
    const m3u = `#EXTM3U
#EXTINF:-1,Test Channel
https://stream.example.com/test.m3u8`;

    parseM3U(m3u, { onProgress });

    expect(onProgress).toHaveBeenCalledWith(100);
  });

  describe('generateM3UPlaylist', () => {
    const mockChannels: Channel[] = [
      {
        id: 'cnn-hd',
        name: 'CNN HD',
        logo: 'https://images.iptv.menu/cnn.png',
        url: 'https://stream.cnn.com/live.m3u8',
        group: 'News',
        tvgId: 'cnn.us',
        tvgName: 'CNN USA',
        countryCode: 'US',
        language: 'English',
        epgChannelId: 'cnn.us'
      },
      {
        id: 'espn-sports',
        name: 'ESPN',
        logo: 'https://images.iptv.menu/espn.png',
        url: 'https://stream.espn.com/live.m3u8',
        group: 'Sports',
        tvgId: 'espn.us',
        countryCode: 'US',
        epgChannelId: 'espn.us'
      }
    ];

    it('should generate valid M3U8 content with metadata tags', () => {
      const output = generateM3UPlaylist(mockChannels, { playlistName: 'Custom List' });

      expect(output).toContain('#EXTM3U');
      expect(output).toContain('#PLAYLIST:Custom List');
      expect(output).toContain('tvg-id="cnn.us"');
      expect(output).toContain('tvg-name="CNN USA"');
      expect(output).toContain('tvg-logo="https://images.iptv.menu/cnn.png"');
      expect(output).toContain('tvg-country="US"');
      expect(output).toContain('tvg-language="English"');
      expect(output).toContain('group-title="News"');
      expect(output).toContain(',CNN HD');
      expect(output).toContain('https://stream.cnn.com/live.m3u8');
      expect(output).toContain('https://stream.espn.com/live.m3u8');
    });

    it('should respect custom options when generating M3U', () => {
      const output = generateM3UPlaylist(mockChannels, {
        includeLogos: false,
        includeGroupTitle: false,
        includeEpgInfo: false
      });

      expect(output).not.toContain('tvg-logo=');
      expect(output).not.toContain('group-title=');
      expect(output).not.toContain('tvg-id=');
      expect(output).toContain('https://stream.cnn.com/live.m3u8');
    });
  });
});

