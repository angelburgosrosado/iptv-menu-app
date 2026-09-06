import { describe, it, expect, vi } from 'vitest';
import { parseM3U } from '../src/utils/m3uParser';

describe('m3uParser utility', () => {
  it('should parse a standard M3U8 playlist with full attributes', () => {
    const m3u = `#EXTM3U
#EXTINF:-1 tvg-id="cnn.us" tvg-logo="https://example.com/cnn.png" group-title="News",CNN HD
https://stream.example.com/cnn/live.m3u8
#EXTINF:-1 tvg-id="espn.us" tvg-logo="https://example.com/espn.png" group-title="Sports",ESPN 1
https://stream.example.com/espn/live.m3u8`;

    const channels = parseM3U(m3u);

    expect(channels).toHaveLength(2);
    expect(channels[0]).toEqual({
      id: 'cnn.us',
      name: 'CNN HD',
      logo: 'https://example.com/cnn.png',
      url: 'https://stream.example.com/cnn/live.m3u8',
      group: 'News',
      tvgId: 'cnn.us',
    });
    expect(channels[1]).toEqual({
      id: 'espn.us',
      name: 'ESPN 1',
      logo: 'https://example.com/espn.png',
      url: 'https://stream.example.com/espn/live.m3u8',
      group: 'Sports',
      tvgId: 'espn.us',
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
});
