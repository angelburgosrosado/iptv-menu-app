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
});

