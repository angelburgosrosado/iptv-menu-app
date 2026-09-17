import { describe, it, expect } from 'vitest';
import {
  buildIptvOrgIndex,
  enrichChannels,
  buildCountrySections,
  mergeProgrammes,
  generateCountryMarkup,
  slugify,
  normalize,
  COUNTRY_NAMES,
  IPTV_ORG_COUNTRIES,
  IPTV_ORG_CATEGORIES,
  IPTV_ORG_REGIONS,
  getCountryFlag,
  getCountryName,
  normalizeCategory,
  getCountriesByRegion,
  MAJOR_REGIONS
} from '../src/utils/channelEnrichment';
import { PlaylistChannel, XmltvProgramme } from '../src/types/iptv';

describe('IPTV Channel Enrichment Engine', () => {
  it('should slugify strings accurately', () => {
    expect(slugify('CNN International HD!')).toBe('cnn-international-hd');
    expect(slugify('  Univision Puerto Rico   ')).toBe('univision-puerto-rico');
  });

  it('should normalize strings for case and diacritics insensitive matching', () => {
    expect(normalize('Télévision Française 1')).toBe('television francaise 1');
    expect(normalize('HBO Max (East)')).toBe('hbo max east');
  });

  it('should index iptv-org records by ID and by name__country composite key', () => {
    const iptvOrgRecords = [
      {
        id: 'cnn-us',
        name: 'CNN',
        alt_name: 'CNN News',
        network: 'Turner Broadcasting',
        country: 'US',
        category: 'News',
        logo: 'https://example.com/cnn.png',
        lang: 'en'
      },
      {
        id: 'telemundo-pr',
        name: 'Telemundo PR',
        country: 'PR',
        category: 'General'
      }
    ];

    const index = buildIptvOrgIndex(iptvOrgRecords);

    expect(index.byId.get('cnn-us')).toBeDefined();
    expect(index.byId.get('cnn-us')?.name).toBe('CNN');
    expect(index.byNameCountry.get('cnn__US')).toBeDefined();
    expect(index.byNameCountry.get('cnn news__US')).toBeDefined();
    expect(index.byNameCountry.get('turner broadcasting__US')).toBeDefined();
    expect(index.byNameCountry.get('telemundo pr__PR')).toBeDefined();
  });

  it('should enrich channels with iptv-org metadata via tvgId or name/country match', () => {
    const iptvOrgRecords = [
      {
        id: 'wapa-pr',
        name: 'WAPA TV Puerto Rico',
        country: 'PR',
        category: 'Entertainment',
        logo: 'https://example.com/wapa.png',
        lang: 'es'
      }
    ];
    const index = buildIptvOrgIndex(iptvOrgRecords);

    const channels: PlaylistChannel[] = [
      {
        id: 'raw-channel-1',
        name: 'WAPA TV Puerto Rico',
        url: 'https://stream.example.com/wapa.m3u8',
        countryCode: 'PR'
      },
      {
        id: 'raw-channel-2',
        name: 'Unknown Independent Stream',
        url: 'https://stream.example.com/indie.m3u8'
      }
    ];

    const enriched = enrichChannels(channels, index);

    expect(enriched).toHaveLength(2);
    // Channel 1 matched
    expect(enriched[0].metadataSource).toBe('iptv-org');
    expect(enriched[0].logo).toBe('https://example.com/wapa.png');
    expect(enriched[0].group).toBe('Entertainment');
    expect(enriched[0].language).toBe('es');
    expect(enriched[0].countryCode).toBe('PR');

    // Channel 2 unmatched, defaults gracefully
    expect(enriched[1].metadataSource).toBe('playlist');
    expect(enriched[1].countryCode).toBe('UN');
  });

  it('should build country sections grouped and sorted properly', () => {
    const channels: PlaylistChannel[] = [
      {
        id: 'ch-us',
        name: 'ABC News',
        url: 'https://stream.example.com/abc.m3u8',
        countryCode: 'US'
      },
      {
        id: 'ch-pr',
        name: 'WIPR 6',
        url: 'https://stream.example.com/wipr.m3u8',
        countryCode: 'PR'
      },
      {
        id: 'ch-un',
        name: 'Global Feed',
        url: 'https://stream.example.com/global.m3u8'
      }
    ];

    const countries = [
      { code: 'US', name: 'United States' },
      { code: 'PR', name: 'Puerto Rico' }
    ];

    const sections = buildCountrySections(channels, countries);

    expect(sections).toHaveLength(3);
    const codes = sections.map((s) => s.code);
    expect(codes).toContain('US');
    expect(codes).toContain('PR');
    expect(codes).toContain('UN');

    const prSection = sections.find((s) => s.code === 'PR');
    expect(prSection?.name).toBe('Puerto Rico');
    expect(prSection?.channelCount).toBe(1);
    expect(prSection?.channels[0].name).toBe('WIPR 6');
    expect(prSection?.channels[0].countryName).toBe('Puerto Rico');
    expect(Array.isArray(prSection?.featuredLogos)).toBe(true);
  });

  it('should initialize and support country filters, EPG sources, and bundles in usePlayerStore', async () => {
    const { usePlayerStore } = await import('../src/store/usePlayerStore');
    const store = usePlayerStore.getState();
    expect(store.countrySections).toBeDefined();
    expect(Array.isArray(store.countrySections)).toBe(true);
    expect(store.epgSources).toBeDefined();
    expect(store.epgSources.length).toBeGreaterThanOrEqual(3);

    store.setSearchTerm('news');
    expect(usePlayerStore.getState().searchTerm).toBe('news');

    store.setSelectedCountry('US');
    expect(usePlayerStore.getState().selectedCountry).toBe('US');

    store.setSelectedGroup('Sports');
    expect(usePlayerStore.getState().selectedGroup).toBe('Sports');

    await store.loadMetadataBundle();
    expect(usePlayerStore.getState().countrySections.length).toBeGreaterThan(0);

    await store.loadEpgBundle();
    expect(usePlayerStore.getState().epgSources.length).toBe(3);
  });

  it('should merge programmes prioritizing primary source and filtering expired fallback window', () => {
    const now = new Date().toISOString();
    const future = new Date(Date.now() + 3600000).toISOString();
    const oldExpired = new Date(Date.now() - 24 * 3600000).toISOString(); // 24 hours ago

    const primary: XmltvProgramme[] = [
      {
        channel: 'ch1',
        start: now,
        title: 'Primary HD News Broadcast',
        sourcePriority: 10
      }
    ];

    const fallback: XmltvProgramme[] = [
      {
        channel: 'ch1',
        start: now,
        title: 'Primary HD News Broadcast',
        sourcePriority: 50 // lower priority fallback
      },
      {
        channel: 'ch2',
        start: future,
        title: 'Community Special Live',
        sourcePriority: 50
      },
      {
        channel: 'ch3',
        start: oldExpired,
        title: 'Old Expired Show',
        sourcePriority: 50
      }
    ];

    const merged = mergeProgrammes(primary, fallback, 12);

    // oldExpired is beyond 12 hours fallback window, so it's dropped
    expect(merged.find((p) => p.title === 'Old Expired Show')).toBeUndefined();

    // ch1 should keep the primary entry (higher priority / lower priority number)
    const ch1 = merged.find((p) => p.channel === 'ch1');
    expect(ch1).toBeDefined();
    expect(ch1?.sourcePriority).toBe(10);

    // ch2 fallback should be retained
    const ch2 = merged.find((p) => p.channel === 'ch2');
    expect(ch2).toBeDefined();
  });

  it('should generate valid country markup HTML', () => {
    const sections = [
      {
        code: 'US',
        name: 'United States',
        channelCount: 1,
        channels: [
          {
            id: 'us-1',
            name: 'PBS News',
            url: 'https://stream.example.com/pbs.m3u8',
            group: 'News',
            countryCode: 'US'
          }
        ]
      }
    ];

    const html = generateCountryMarkup(sections);
    expect(html).toContain('class="country-block" id="country-us"');
    expect(html).toContain('<h2>United States</h2>');
    expect(html).toContain('PBS News');
  });

  it('should provide complete 250-country dataset with ISO codes and emoji flags', () => {
    expect(IPTV_ORG_COUNTRIES.length).toBe(250);
    expect(getCountryFlag('US')).toBe('🇺🇸');
    expect(getCountryFlag('DO')).toBe('🇩🇴');
    expect(getCountryFlag('PR')).toBe('🇵🇷');
    expect(getCountryFlag('MX')).toBe('🇲🇽');
    expect(getCountryFlag('ES')).toBe('🇪🇸');
    expect(getCountryFlag('UN')).toBe('🌐');
    expect(getCountryFlag('nonexistent')).toBe('🌐');

    expect(getCountryName('US')).toBe('United States');
    expect(getCountryName('DO')).toBe('Dominican Republic');
    expect(getCountryName('PR')).toBe('Puerto Rico');
  });

  it('should categorize channels using iptv-org 30 standardized genres', () => {
    expect(IPTV_ORG_CATEGORIES.length).toBe(30);
    expect(normalizeCategory('news & politics')).toBe('News');
    expect(normalizeCategory('LIVE SPORTS HD')).toBe('Sports');
    expect(normalizeCategory('Cinema Classic Movies')).toBe('Movies');
    expect(normalizeCategory('kids & cartoons')).toBe('Kids');
    expect(normalizeCategory('music hits')).toBe('Music');
    expect(normalizeCategory('documentaries')).toBe('Documentary');
    expect(normalizeCategory('series hd')).toBe('Series');
    expect(normalizeCategory('cooking & food')).toBe('Lifestyle');
    expect(normalizeCategory('unknown tag')).toBe('Unknown tag');
  });

  it('should resolve regional groupings and filter country codes by region', () => {
    expect(IPTV_ORG_REGIONS.length).toBeGreaterThanOrEqual(40);
    expect(MAJOR_REGIONS.length).toBe(8);

    const amerCountries = getCountriesByRegion('AMER');
    expect(amerCountries).toContain('US');
    expect(amerCountries).toContain('CA');
    expect(amerCountries).toContain('MX');
    expect(amerCountries).toContain('DO');

    const eurCountries = getCountriesByRegion('EUR');
    expect(eurCountries).toContain('GB');
    expect(eurCountries).toContain('FR');
    expect(eurCountries).toContain('DE');
    expect(eurCountries).toContain('ES');
  });

  it('should support selectedRegion filter in usePlayerStore', async () => {
    const { usePlayerStore } = await import('../src/store/usePlayerStore');
    const store = usePlayerStore.getState();

    store.setSelectedRegion('AMER');
    expect(usePlayerStore.getState().selectedRegion).toBe('AMER');

    store.setSelectedRegion(null);
    expect(usePlayerStore.getState().selectedRegion).toBeNull();
  });

  it('should resolve language names from ISO 639-1 and ISO 639-3 codes', async () => {
    const { getLanguageName, POPULAR_LANGUAGES, IPTV_ORG_LANGUAGES } = await import('../src/utils/channelEnrichment');
    expect(IPTV_ORG_LANGUAGES.length).toBeGreaterThan(7000);
    expect(POPULAR_LANGUAGES.length).toBe(13); // 'ALL' + 12 languages

    // 2-letter ISO 639-1 aliases
    expect(getLanguageName('es')).toBe('Spanish');
    expect(getLanguageName('en')).toBe('English');
    expect(getLanguageName('fr')).toBe('French');
    expect(getLanguageName('de')).toBe('German');
    expect(getLanguageName('ja')).toBe('Japanese');
    expect(getLanguageName('zh')).toBe('Chinese');

    // 3-letter ISO 639-3 codes from iptv-org dataset
    expect(getLanguageName('spa')).toBe('Spanish');
    expect(getLanguageName('eng')).toBe('English');
    expect(getLanguageName('fra')).toBe('French');

    // Fallback for unknown codes
    expect(getLanguageName('xyz')).toBe('XYZ');
    expect(getLanguageName('')).toBe('Unknown');
  });

  it('should resolve global timezones and formats for countries', async () => {
    const { getTimezonesForCountry, formatUtcOffset, IPTV_ORG_TIMEZONES } = await import('../src/utils/channelEnrichment');
    expect(IPTV_ORG_TIMEZONES.length).toBeGreaterThan(100);

    // Puerto Rico timezone
    const prTz = getTimezonesForCountry('PR');
    expect(prTz.length).toBeGreaterThanOrEqual(1);
    expect(prTz[0].id).toBe('America/Puerto_Rico');

    // US timezones
    const usTz = getTimezonesForCountry('US');
    expect(usTz.length).toBeGreaterThanOrEqual(4);
    const tzIds = usTz.map(t => t.id);
    expect(tzIds).toContain('America/New_York');
    expect(tzIds).toContain('America/Chicago');
    expect(tzIds).toContain('America/Los_Angeles');

    // Spain timezones
    const esTz = getTimezonesForCountry('ES');
    expect(esTz.map(t => t.id)).toContain('Europe/Madrid');

    // Format UTC offset
    expect(formatUtcOffset('-04:00')).toBe('UTC-04:00');
    expect(formatUtcOffset('+00:00')).toBe('UTC+00:00');
    expect(formatUtcOffset('+02:00')).toBe('UTC+02:00');
  });

  it('should support selectedLanguage and selectedTimezone in usePlayerStore', async () => {
    const { usePlayerStore } = await import('../src/store/usePlayerStore');
    const store = usePlayerStore.getState();

    // Language filter
    store.setSelectedLanguage('spa');
    expect(usePlayerStore.getState().selectedLanguage).toBe('spa');
    store.setSelectedLanguage(null);
    expect(usePlayerStore.getState().selectedLanguage).toBeNull();

    // Timezone filter
    store.setSelectedTimezone('America/Puerto_Rico');
    expect(usePlayerStore.getState().selectedTimezone).toBe('America/Puerto_Rico');
    store.setSelectedTimezone(null);
    expect(usePlayerStore.getState().selectedTimezone).toBeNull();
  });

  it('should detect blocked streams via iptv-org blocklist dataset', async () => {
    const { checkChannelBlocklist, IPTV_ORG_BLOCKLIST, BLOCKLIST_BY_CHANNEL } = await import('../src/utils/channelEnrichment');
    expect(IPTV_ORG_BLOCKLIST.length).toBeGreaterThan(500);
    expect(BLOCKLIST_BY_CHANNEL.size).toBeGreaterThan(500);

    // Known blocked items from blocklist
    const entry = checkChannelBlocklist('21Sextury.us');
    expect(entry).toBeDefined();
    expect(entry?.reason).toBe('nsfw');
    expect(entry?.ref).toContain('github.com/iptv-org/iptv/issues');

    const dmcaEntry = checkChannelBlocklist('5StarMax.us');
    expect(dmcaEntry).toBeDefined();
    expect(dmcaEntry?.reason).toBe('dmca');

    // Clean channels
    expect(checkChannelBlocklist('WAPATV.pr')).toBeUndefined();
    expect(checkChannelBlocklist('TelemundoPR.pr')).toBeUndefined();
    expect(checkChannelBlocklist(undefined)).toBeUndefined();
  });

  it('should annotate channel health and proxy recommendation during enrichment', async () => {
    const { enrichChannels, buildIptvOrgIndex } = await import('../src/utils/channelEnrichment');
    const index = buildIptvOrgIndex([]);

    const channels = [
      {
        id: 'clean-channel',
        name: 'Clean Stream',
        url: 'https://cdn.example.com/live.m3u8',
        tvgId: 'clean-channel'
      },
      {
        id: 'blocked-channel',
        name: 'Blocked Channel',
        url: 'https://cdn.example.com/blocked.m3u8',
        tvgId: '21Sextury.us'
      },
      {
        id: 'http-channel',
        name: 'Insecure HTTP Stream',
        url: 'http://playcom.trapemn.tv:1935/live.m3u8',
        tvgId: 'insecure-http'
      }
    ];

    const enriched = enrichChannels(channels as any, index);
    expect(enriched[0].healthStatus).toBe('online');
    expect(enriched[0].corsProxyRecommended).toBe(false);

    expect(enriched[1].healthStatus).toBe('blocked');
    expect(enriched[1].blockedReason).toBe('nsfw');

    expect(enriched[2].corsProxyRecommended).toBe(true);
  });

  it('should resolve regional subdivisions for countries (e.g. US states, Canadian provinces)', async () => {
    const { getSubdivisionsForCountry, getSubdivisionName, IPTV_ORG_SUBDIVISIONS } = await import('../src/utils/channelEnrichment');
    expect(IPTV_ORG_SUBDIVISIONS.length).toBeGreaterThan(4000);

    // US subdivisions
    const usSubs = getSubdivisionsForCountry('US');
    expect(usSubs.length).toBeGreaterThanOrEqual(50);
    const usCodes = usSubs.map(s => s.code);
    expect(usCodes).toContain('US-CA');
    expect(usCodes).toContain('US-NY');
    expect(usCodes).toContain('US-FL');
    expect(usCodes).toContain('US-TX');

    // Canada subdivisions
    const caSubs = getSubdivisionsForCountry('CA');
    expect(caSubs.length).toBeGreaterThanOrEqual(10);
    expect(caSubs.map(s => s.code)).toContain('CA-QC');
    expect(caSubs.map(s => s.code)).toContain('CA-ON');

    // Subdivision name lookup
    expect(getSubdivisionName('US-CA')).toBe('California');
    expect(getSubdivisionName('US-NY')).toBe('New York');
    expect(getSubdivisionName('CA-QC')).toBe('Quebec');
    expect(getSubdivisionName('nonexistent')).toBeUndefined();
  });

  it('should support selectedSubdivision filter and reset on country change in usePlayerStore', async () => {
    const { usePlayerStore } = await import('../src/store/usePlayerStore');
    const store = usePlayerStore.getState();

    // Set subdivision
    store.setSelectedSubdivision('California');
    expect(usePlayerStore.getState().selectedSubdivision).toBe('California');

    // Changing country resets selectedSubdivision
    store.setSelectedCountry('CA');
    expect(usePlayerStore.getState().selectedCountry).toBe('CA');
    expect(usePlayerStore.getState().selectedSubdivision).toBeNull();

    // Reset country
    store.setSelectedCountry(null);
    expect(usePlayerStore.getState().selectedCountry).toBeNull();
  });

  it('should preserve and enrich alternateUrls and feedQuality for multi-stream channels', () => {
    const rawChannels: PlaylistChannel[] = [
      {
        id: 'stream-multi-1',
        name: 'Multi-Feed Sports',
        url: 'https://cdn1.live.tv/primary.m3u8',
        group: 'Sports',
        tvgId: 'multi-sports',
        alternateUrls: [
          'https://cdn2.live.tv/backup-hd.m3u8',
          'https://cdn3.live.tv/backup-sd.m3u8'
        ],
        feedQuality: 'fhd'
      },
      {
        id: 'stream-single-1',
        name: 'Single Feed News',
        url: 'https://news.tv/live.m3u8',
        group: 'News',
        tvgId: 'single-news'
      }
    ];

    const enriched = enrichChannels(rawChannels);

    expect(enriched[0].alternateUrls).toEqual([
      'https://cdn2.live.tv/backup-hd.m3u8',
      'https://cdn3.live.tv/backup-sd.m3u8'
    ]);
    expect(enriched[0].feedQuality).toBe('fhd');
    expect(enriched[1].alternateUrls).toBeUndefined();
    expect(enriched[1].feedQuality).toBeUndefined();
  });

  it('should generate VOD channel items from Xtream VOD stream payloads', async () => {
    const { generateXtreamVodChannelList } = await import('../src/utils/xtreamClient');
    const account = {
      serverUrl: 'http://line.melhata.org',
      username: '8rvzieximl',
      password: 'h1usotpevd',
      status: 'connected' as const
    };
    const mockVod = [
      {
        stream_id: 9988,
        name: 'Inception (2010)',
        stream_icon: 'https://cdn.example.com/inception.jpg',
        category_id: '15',
        container_extension: 'mp4',
        rating: '8.8'
      }
    ];
    const categories = { '15': 'Sci-Fi Movies' };

    const vodList = generateXtreamVodChannelList(account, mockVod, categories);
    expect(vodList).toHaveLength(1);
    expect(vodList[0].id).toBe('xtream_vod_9988');
    expect(vodList[0].name).toBe('Inception (2010)');
    expect(vodList[0].group).toBe('VOD: Sci-Fi Movies');
    expect(vodList[0].url).toBe('http://line.melhata.org/movie/8rvzieximl/h1usotpevd/9988.mp4');
    expect(vodList[0].streamType).toBe('vod');
    expect(vodList[0].resolution).toBe('★ 8.8');
  });

  it('should generate standard Xtream Timeshift catchup stream URLs', async () => {
    const { generateXtreamCatchupUrl } = await import('../src/utils/xtreamClient');
    const account = {
      serverUrl: 'http://line.melhata.org',
      username: '8rvzieximl',
      password: 'h1usotpevd',
      status: 'connected' as const
    };

    // 2026-09-17 14:30:00 UTC timestamp: 1789655400
    const startTimestamp = 1789655400;
    const catchupUrl = generateXtreamCatchupUrl(account, 101073, startTimestamp, 60);

    expect(catchupUrl).toContain('http://line.melhata.org/timeshift/8rvzieximl/h1usotpevd/60/');
    expect(catchupUrl).toContain('/101073.m3u8');
  });
});



