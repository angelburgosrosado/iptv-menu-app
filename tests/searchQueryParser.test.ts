/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { 
  parseSearchQuery, 
  tokenizeQuery, 
  matchChannelWithQuery 
} from '../src/utils/searchQueryParser';
import { Channel } from '../src/types/iptv';

describe('Advanced Search Query Parser', () => {
  describe('tokenizeQuery', () => {
    it('should split whitespace and preserve quoted phrases', () => {
      const tokens = tokenizeQuery('country:us "bbc world" lang:en \'high def\'');
      expect(tokens).toEqual(['country:us', 'bbc world', 'lang:en', 'high def']);
    });
  });

  describe('parseSearchQuery', () => {
    it('should parse key-value syntax and extract free terms', () => {
      const parsed = parseSearchQuery('country:us lang:en quality:hd news "breaking live"');
      expect(parsed.countries).toEqual(['US']);
      expect(parsed.languages).toEqual(['en']);
      expect(parsed.qualities).toEqual(['hd']);
      expect(parsed.freeTerms).toEqual(['news', 'breaking live']);
      expect(parsed.hasFilters).toBe(true);
    });

    it('should parse negation operators', () => {
      const parsed = parseSearchQuery('-country:ru -status:blocked tag:sports');
      expect(parsed.negatedCountries).toEqual(['RU']);
      expect(parsed.negatedStatuses).toEqual(['blocked']);
      expect(parsed.tags).toEqual(['sports']);
    });

    it('should support alternative aliases (cc:, cat:, res:)', () => {
      const parsed = parseSearchQuery('cc:gb cat:movies res:4k sub:england');
      expect(parsed.countries).toEqual(['GB']);
      expect(parsed.groups).toEqual(['movies']);
      expect(parsed.qualities).toEqual(['4k']);
      expect(parsed.subdivisions).toEqual(['england']);
    });
  });

  describe('matchChannelWithQuery', () => {
    const channel1: Channel = {
      id: 'c-1',
      name: 'CBS News 24/7 HD',
      url: 'https://example.com/cbs.m3u8',
      group: 'News',
      countryCode: 'US',
      countryName: 'United States',
      language: 'eng',
      languageName: 'English',
      resolution: '1080p',
      healthStatus: 'online'
    };

    const channel2: Channel = {
      id: 'c-2',
      name: 'RT News Moscow',
      url: 'https://example.com/rt.m3u8',
      group: 'News',
      countryCode: 'RU',
      countryName: 'Russia',
      language: 'rus',
      languageName: 'Russian',
      resolution: '720p',
      healthStatus: 'blocked',
      blockedReason: 'Sanctions / Copyright'
    };

    const channel3: Channel = {
      id: 'c-3',
      name: 'Red Bull TV 4K UHD',
      url: 'https://example.com/redbull.m3u8',
      group: 'Sports',
      countryCode: 'AT',
      countryName: 'Austria',
      language: 'eng',
      languageName: 'English',
      resolution: '4K',
      healthStatus: 'online'
    };

    it('should match channels using country and language syntax', () => {
      const query = parseSearchQuery('country:us lang:eng');
      expect(matchChannelWithQuery(channel1, query)).toBe(true);
      expect(matchChannelWithQuery(channel2, query)).toBe(false);
      expect(matchChannelWithQuery(channel3, query)).toBe(false);
    });

    it('should match resolution / quality syntax', () => {
      const query4k = parseSearchQuery('quality:4k');
      expect(matchChannelWithQuery(channel3, query4k)).toBe(true);
      expect(matchChannelWithQuery(channel1, query4k)).toBe(false);

      const queryHD = parseSearchQuery('quality:hd');
      expect(matchChannelWithQuery(channel1, queryHD)).toBe(true);
    });

    it('should respect negation filters like -country:ru and -status:blocked', () => {
      const query = parseSearchQuery('-status:blocked');
      expect(matchChannelWithQuery(channel1, query)).toBe(true);
      expect(matchChannelWithQuery(channel2, query)).toBe(false);

      const queryNoRu = parseSearchQuery('-country:ru news');
      expect(matchChannelWithQuery(channel1, queryNoRu)).toBe(true);
      expect(matchChannelWithQuery(channel2, queryNoRu)).toBe(false);
    });

    it('should match custom user tags', () => {
      const query = parseSearchQuery('tag:favorite');
      expect(matchChannelWithQuery(channel1, query, ['favorite', 'primetime'])).toBe(true);
      expect(matchChannelWithQuery(channel1, query, ['sports'])).toBe(false);
    });

    it('should combine free text search with syntax filters', () => {
      const query = parseSearchQuery('country:us "cbs news"');
      expect(matchChannelWithQuery(channel1, query)).toBe(true);

      const mismatch = parseSearchQuery('country:us "al jazeera"');
      expect(matchChannelWithQuery(channel1, mismatch)).toBe(false);
    });
  });
});
