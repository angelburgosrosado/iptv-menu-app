import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { 
  fetchXtreamSeriesCategories, 
  fetchXtreamSeries, 
  fetchXtreamSeriesInfo, 
  generateXtreamSeriesChannelList, 
  generateXtreamEpisodesList,
  fetchXtreamVodCategories,
  fetchXtreamVodStreams,
  generateXtreamVodChannelList,
  generateXtreamChannelList,
  parseXtreamUrl
} from '../src/utils/xtreamClient';
import { resolvePlaybackUrlSourceKind } from '../src/utils/streamDispatcher';
import { usePlayerStore } from '../src/store/usePlayerStore';
import { XtreamAccount } from '../src/types/iptv';

describe('Xtream Codes: Live Feeds, VOD & Series Access Engine', () => {
  const mockAccount: XtreamAccount = {
    serverUrl: 'http://xtream.example.com:8080',
    username: 'test_user',
    password: 'secret_password',
    status: 'connected'
  };

  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    usePlayerStore.setState({
      selectedStreamType: 'all',
      channels: []
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fetchXtreamSeriesCategories should parse categories mapping', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => [
        { category_id: '10', category_name: 'Drama Series', parent_id: 0 },
        { category_id: '20', category_name: 'Sci-Fi & Fantasy', parent_id: 0 }
      ]
    } as any);

    const categories = await fetchXtreamSeriesCategories(mockAccount);
    expect(categories).toEqual({
      '10': 'Drama Series',
      '20': 'Sci-Fi & Fantasy'
    });
  });

  it('fetchXtreamSeries should return series item catalog', async () => {
    const mockSeries = [
      {
        series_id: 101,
        name: 'Breaking Bad',
        cover: 'http://img.example.com/bb.jpg',
        plot: 'High school chemistry teacher turned meth kingpin',
        category_id: '10',
        rating: '9.5'
      }
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockSeries
    } as any);

    const series = await fetchXtreamSeries(mockAccount);
    expect(series).toHaveLength(1);
    expect(series[0].name).toBe('Breaking Bad');
  });

  it('fetchXtreamSeriesInfo should return detailed seasons and episodes payload', async () => {
    const mockInfo = {
      info: {
        name: 'Breaking Bad',
        cover: 'http://img.example.com/bb.jpg',
        plot: 'High school chemistry teacher turned meth kingpin'
      },
      seasons: [
        { season_number: 1, name: 'Season 1', episode_count: 7 }
      ],
      episodes: {
        '1': [
          {
            id: '5001',
            episode_num: 1,
            title: 'Pilot',
            container_extension: 'mkv',
            info: { duration: '00:58:00' }
          },
          {
            id: '5002',
            episode_num: 2,
            title: "Cat's in the Bag...",
            container_extension: 'mp4',
            info: { duration: '00:48:00' }
          }
        ]
      }
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockInfo
    } as any);

    const result = await fetchXtreamSeriesInfo(mockAccount, 101);
    expect(result).not.toBeNull();
    expect(result?.info?.name).toBe('Breaking Bad');
    expect(result?.episodes?.['1']).toHaveLength(2);
  });

  it('generateXtreamSeriesChannelList should transform series into standard Channel objects', () => {
    const seriesItems = [
      {
        series_id: 101,
        name: 'Stranger Things',
        cover: 'http://img.example.com/st.jpg',
        category_id: '20',
        rating: '8.7'
      }
    ];
    const catMap = { '20': 'Sci-Fi & Mystery' };

    const channels = generateXtreamSeriesChannelList(mockAccount, seriesItems, catMap);
    expect(channels).toHaveLength(1);
    expect(channels[0].id).toBe('xtream_series_101');
    expect(channels[0].name).toBe('Stranger Things');
    expect(channels[0].group).toBe('Series: Sci-Fi & Mystery');
    expect(channels[0].streamType).toBe('series');
    expect(channels[0].directSource).toBe('xtream');
    expect(channels[0].resolution).toBe('★ 8.7');
  });

  it('generateXtreamEpisodesList should generate playable direct streaming channels for all episodes', () => {
    const seriesInfo = {
      info: { name: 'Stranger Things', cover: 'http://img.example.com/st.jpg' },
      episodes: {
        '1': [
          {
            id: '9901',
            episode_num: 1,
            title: 'The Vanishing of Will Byers',
            container_extension: 'mp4',
            info: { video: { height: 1080 }, duration: '48m' }
          }
        ]
      }
    };

    const episodeChannels = generateXtreamEpisodesList(mockAccount, 'Stranger Things', seriesInfo);
    expect(episodeChannels).toHaveLength(1);
    expect(episodeChannels[0].id).toBe('xtream_ep_9901');
    expect(episodeChannels[0].name).toBe('Stranger Things S01E01 - The Vanishing of Will Byers');
    expect(episodeChannels[0].url).toBe('http://xtream.example.com:8080/series/test_user/secret_password/9901.mp4');
    expect(episodeChannels[0].group).toBe('Season 1');
    expect(episodeChannels[0].streamType).toBe('series');
    expect(episodeChannels[0].resolution).toBe('1080p');
  });

  it('generateXtreamVodChannelList should transform movie VODs with movie stream URL formatting', () => {
    const vodItems = [
      {
        stream_id: 888,
        name: 'Inception (2010)',
        stream_icon: 'http://img.example.com/inception.jpg',
        category_id: '5',
        container_extension: 'mkv',
        rating: '8.8'
      }
    ];
    const categories = { '5': 'Action & Thriller' };

    const vodChannels = generateXtreamVodChannelList(mockAccount, vodItems, categories);
    expect(vodChannels).toHaveLength(1);
    expect(vodChannels[0].id).toBe('xtream_vod_888');
    expect(vodChannels[0].name).toBe('Inception (2010)');
    expect(vodChannels[0].url).toBe('http://xtream.example.com:8080/movie/test_user/secret_password/888.mkv');
    expect(vodChannels[0].group).toBe('VOD: Action & Thriller');
    expect(vodChannels[0].streamType).toBe('vod');
    expect(vodChannels[0].resolution).toBe('★ 8.8');
  });

  it('usePlayerStore should support selectedStreamType state and updates', () => {
    const store = usePlayerStore.getState();
    expect(store.selectedStreamType).toBe('all');

    store.setSelectedStreamType('live');
    expect(usePlayerStore.getState().selectedStreamType).toBe('live');

    store.setSelectedStreamType('vod');
    expect(usePlayerStore.getState().selectedStreamType).toBe('vod');

    store.setSelectedStreamType('series');
    expect(usePlayerStore.getState().selectedStreamType).toBe('series');

    store.setSelectedStreamType('all');
    expect(usePlayerStore.getState().selectedStreamType).toBe('all');
  });

  describe('Xtream Address & Catalog Auto-Detection Engine', () => {
    it('parseXtreamUrl should recognize get.php M3U Plus URLs with credentials', () => {
      const url = 'http://line.provider.cc:8080/get.php?username=vipuser&password=vippass&type=m3u_plus&output=m3u8';
      const parsed = parseXtreamUrl(url);

      expect(parsed.isXtream).toBe(true);
      expect(parsed.serverUrl).toBe('http://line.provider.cc:8080');
      expect(parsed.username).toBe('vipuser');
      expect(parsed.password).toBe('vippass');
      expect(parsed.m3uUrl).toContain('get.php');
      expect(parsed.m3uUrl).toContain('username=vipuser');
    });

    it('parseXtreamUrl should recognize player_api.php URLs and generate canonical M3U Plus streaming target', () => {
      const url = 'http://iptv.server.net:25461/player_api.php?username=alpha&password=beta123';
      const parsed = parseXtreamUrl(url);

      expect(parsed.isXtream).toBe(true);
      expect(parsed.serverUrl).toBe('http://iptv.server.net:25461');
      expect(parsed.username).toBe('alpha');
      expect(parsed.password).toBe('beta123');
      expect(parsed.m3uUrl).toBe('http://iptv.server.net:25461/get.php?username=alpha&password=beta123&type=m3u_plus&output=m3u8');
    });

    it('parseXtreamUrl should recognize /live/user/pass/id.m3u8 stream links', () => {
      const url = 'https://stream.iptvbox.io/live/streamer/secretkey/9912.m3u8';
      const parsed = parseXtreamUrl(url);

      expect(parsed.isXtream).toBe(true);
      expect(parsed.serverUrl).toBe('https://stream.iptvbox.io');
      expect(parsed.username).toBe('streamer');
      expect(parsed.password).toBe('secretkey');
      expect(parsed.type).toBe('live');
    });

    it('parseXtreamUrl should return isXtream: false for generic M3U playlists', () => {
      const url = 'https://iptv-org.github.io/iptv/countries/us.m3u';
      const parsed = parseXtreamUrl(url);

      expect(parsed.isXtream).toBe(false);
      expect(parsed.username).toBe('');
      expect(parsed.password).toBe('');
    });
  });

  describe('Stream Dispatcher VOD & Proxied URL Classification', () => {
    it('should classify direct MP4/MKV VOD files as native video', () => {
      expect(resolvePlaybackUrlSourceKind('http://iptv.server:8080/movie/user/pass/12345.mp4')).toBe('native');
      expect(resolvePlaybackUrlSourceKind('http://iptv.server:8080/movie/user/pass/12345.mkv')).toBe('native');
      expect(resolvePlaybackUrlSourceKind('http://iptv.server:8080/movie/user/pass/12345')).toBe('native');
      expect(resolvePlaybackUrlSourceKind('http://iptv.server:8080/series/user/pass/9876.mp4')).toBe('native');
    });

    it('should unwrap proxied VOD URLs and classify as native instead of incorrectly defaulting to HLS', () => {
      const proxiedVod = '/api/stream/proxy?url=' + encodeURIComponent('http://iptv.server:8080/movie/user/pass/54321.mp4');
      expect(resolvePlaybackUrlSourceKind(proxiedVod)).toBe('native');

      const proxiedSeries = '/api/stream/proxy?url=' + encodeURIComponent('http://iptv.server:8080/series/user/pass/8765.mkv');
      expect(resolvePlaybackUrlSourceKind(proxiedSeries)).toBe('native');
    });

    it('should still correctly classify proxied HLS and MPEG-TS live feeds', () => {
      const proxiedHls = '/api/stream/proxy?url=' + encodeURIComponent('http://iptv.server:8080/live/user/pass/101.m3u8');
      expect(resolvePlaybackUrlSourceKind(proxiedHls)).toBe('hls');

      const proxiedTs = '/api/stream/proxy?url=' + encodeURIComponent('http://iptv.server:8080/live/user/pass/101.ts');
      expect(resolvePlaybackUrlSourceKind(proxiedTs)).toBe('mpegts');
    });
  });
});

