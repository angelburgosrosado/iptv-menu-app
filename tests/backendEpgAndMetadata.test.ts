import { describe, it, expect } from 'vitest';
import { 
  ChannelMetadataService, 
  normalize 
} from '../apps/api/src/services/channelMetadataService';
import { 
  EpgService, 
  parseXmltvDate 
} from '../apps/api/src/services/epgService';
import { PlaylistChannel, IptvOrgChannel } from '@iptv-menu/types';

describe('ChannelMetadataService', () => {
  it('normalizes names and diacritics accurately', () => {
    expect(normalize('CNN International [1080p]')).toBe('cnn international 1080p');
    expect(normalize('Télévision Française')).toBe('television francaise');
    expect(normalize('Telemundo 51 (Miami)')).toBe('telemundo 51 miami');
  });

  it('builds fast in-memory indexes and enriches channels', async () => {
    const service = ChannelMetadataService.getInstance();
    const mockChannels: IptvOrgChannel[] = [
      {
        id: 'CNNInternational.us',
        name: 'CNN International',
        alt_names: ['CNNI', 'CNN World'],
        network: 'Warner Bros Discovery',
        country: 'US',
        categories: ['news'],
        logo: 'https://cdn.example.com/cnn.png'
      },
      {
        id: 'Azteca7.mx',
        name: 'Azteca 7',
        country: 'MX',
        categories: ['entertainment'],
        logo: 'https://cdn.example.com/azteca7.png'
      }
    ];

    const index = service.buildIndex(mockChannels);
    expect(index.byId.has('cnninternational.us')).toBe(true);
    expect(index.byNameCountry.has('cnn international__US')).toBe(true);
    expect(index.byName.has('cnni')).toBe(true);

    const rawPlaylists: PlaylistChannel[] = [
      {
        id: 'raw-1',
        name: 'CNN International',
        url: 'https://stream.example.com/cnn.m3u8',
        group: 'Uncategorized',
        tvgCountry: 'US'
      },
      {
        id: 'raw-2',
        name: 'Azteca 7 HD',
        tvgId: 'Azteca7.mx',
        url: 'https://stream.example.com/azteca.m3u8'
      },
      {
        id: 'raw-3',
        name: 'Unknown Local TV',
        url: 'https://stream.example.com/unknown.m3u8'
      }
    ];

    // Swap index for deterministic testing
    (service as any).index = index;
    const result = await service.enrichChannels(rawPlaylists);

    expect(result.enrichedCount).toBe(2);
    expect(result.totalCount).toBe(3);

    // Channel 1 matched by name + country
    const c1 = result.channels[0];
    expect(c1.tvgId).toBe('CNNInternational.us');
    expect(c1.epgChannelId).toBe('CNNInternational.us');
    expect(c1.logo).toBe('https://cdn.example.com/cnn.png');
    expect(c1.group).toBe('News');
    expect(c1.countryCode).toBe('US');
    expect(c1.countryName).toBe('United States');
    expect(c1.metadataSource).toBe('iptv-org');

    // Channel 2 matched by direct tvgId
    const c2 = result.channels[1];
    expect(c2.epgChannelId).toBe('Azteca7.mx');
    expect(c2.group).toBe('Entertainment');
    expect(c2.countryCode).toBe('MX');
    expect(c2.metadataSource).toBe('iptv-org');

    // Channel 3 remains unmatched with playlist metadata
    const c3 = result.channels[2];
    expect(c3.metadataSource).toBe('playlist');
    expect(c3.countryCode).toBe('UN');
  });
});

describe('EpgService', () => {
  it('parses XMLTV date timestamps correctly', () => {
    const parsed = parseXmltvDate('20260907230000 +0000');
    expect(parsed).toBe('2026-09-07T23:00:00.000Z');

    const parsedTz = parseXmltvDate('20260907200000 -0400');
    expect(parsedTz).toBe('2026-09-08T00:00:00.000Z');
  });

  it('ingests XMLTV feeds and generates Now/Next program slices', () => {
    const service = EpgService.getInstance();
    const nowMs = Date.now();
    const nowIsoStart = new Date(nowMs - 600000); // 10 mins ago
    const nowIsoStop = new Date(nowMs + 2400000);  // 40 mins from now
    const nextIsoStop = new Date(nowMs + 6000000); // 100 mins from now

    const toXmltvTime = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())} +0000`;
    };

    const xmlSample = `<?xml version="1.0" encoding="UTF-8"?>
<tv>
  <channel id="CNNInternational.us">
    <display-name>CNN International</display-name>
  </channel>
  <programme start="${toXmltvTime(nowIsoStart)}" stop="${toXmltvTime(nowIsoStop)}" channel="CNNInternational.us">
    <title>Global Newsroom Live</title>
    <desc>Live breaking news and global financial reports.</desc>
    <category>News</category>
  </programme>
  <programme start="${toXmltvTime(nowIsoStop)}" stop="${toXmltvTime(nextIsoStop)}" channel="CNNInternational.us">
    <title>The Global Brief</title>
    <desc>In-depth analysis of world politics.</desc>
    <category>Current Affairs</category>
  </programme>
</tv>`;

    const count = service.ingestXmltv(xmlSample, 10);
    expect(count).toBe(2);

    const nowNextMap = service.getNowNext(['CNNInternational.us']);
    const cnnSchedule = nowNextMap['CNNInternational.us'];

    expect(cnnSchedule).toBeDefined();
    expect(cnnSchedule.now?.title).toBe('Global Newsroom Live');
    expect(cnnSchedule.next?.title).toBe('The Global Brief');

    const timeline = service.getSchedule('CNNInternational.us', 12);
    expect(timeline.length).toBeGreaterThanOrEqual(2);
  });
});
