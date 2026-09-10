/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '@iptv-menu/logging';
import { PlaylistChannel, IptvOrgChannel } from '@iptv-menu/types';

const logger = new Logger('channel-metadata-service');

export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  MX: 'Mexico',
  GB: 'United Kingdom',
  FR: 'France',
  DE: 'Germany',
  ES: 'Spain',
  IT: 'Italy',
  BR: 'Brazil',
  IN: 'India',
  PH: 'Philippines',
  DO: 'Dominican Republic',
  PR: 'Puerto Rico',
  AU: 'Australia',
  JP: 'Japan',
  KR: 'South Korea',
  AR: 'Argentina',
  CO: 'Colombia',
  CL: 'Chile',
  UN: 'International / Unknown'
};

export const normalize = (value?: string): string =>
  (value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export interface MetadataIndex {
  byId: Map<string, IptvOrgChannel>;
  byNameCountry: Map<string, IptvOrgChannel>;
  byName: Map<string, IptvOrgChannel>;
  countryMap: Map<string, string>;
  lastLoaded: number;
}

export class ChannelMetadataService {
  private static instance: ChannelMetadataService;
  private index: MetadataIndex | null = null;
  private isRefreshing = false;
  private ttlMs = 1000 * 60 * 60 * 12; // 12 hours

  private constructor() {}

  public static getInstance(): ChannelMetadataService {
    if (!ChannelMetadataService.instance) {
      ChannelMetadataService.instance = new ChannelMetadataService();
    }
    return ChannelMetadataService.instance;
  }

  public async getIndex(forceRefresh = false): Promise<MetadataIndex> {
    const isStale = !this.index || (Date.now() - this.index.lastLoaded > this.ttlMs);
    if ((isStale || forceRefresh) && !this.isRefreshing) {
      await this.refreshIndex();
    }
    return this.index || this.createFallbackIndex();
  }

  public async refreshIndex(): Promise<void> {
    if (this.isRefreshing) return;
    this.isRefreshing = true;

    try {
      logger.info('Fetching iptv-org channels dataset...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const [channelsRes, countriesRes] = await Promise.allSettled([
        fetch('https://iptv-org.github.io/api/channels.json', { signal: controller.signal }),
        fetch('https://iptv-org.github.io/api/countries.json', { signal: controller.signal })
      ]);
      clearTimeout(timeoutId);

      let channelsData: IptvOrgChannel[] = [];
      if (channelsRes.status === 'fulfilled' && channelsRes.value.ok) {
        channelsData = await channelsRes.value.json();
        logger.info(`Loaded ${channelsData.length} channels from iptv-org`);
      } else {
        logger.warn('Failed to fetch remote channels.json from iptv-org, using fallback index');
      }

      const countryMap = new Map<string, string>(Object.entries(COUNTRY_NAMES));
      if (countriesRes.status === 'fulfilled' && countriesRes.value.ok) {
        try {
          const countriesData: Array<{ code: string; name: string }> = await countriesRes.value.json();
          for (const c of countriesData) {
            if (c.code && c.name) {
              countryMap.set(c.code.toUpperCase(), c.name);
            }
          }
        } catch {
          // Keep static dictionary
        }
      }

      this.index = this.buildIndex(channelsData, countryMap);
    } catch (err: any) {
      logger.error('Error refreshing iptv-org channel index', err);
      if (!this.index) {
        this.index = this.createFallbackIndex();
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  public buildIndex(records: IptvOrgChannel[], countryMap?: Map<string, string>): MetadataIndex {
    const byId = new Map<string, IptvOrgChannel>();
    const byNameCountry = new Map<string, IptvOrgChannel>();
    const byName = new Map<string, IptvOrgChannel>();

    for (const item of records) {
      if (item.id) {
        byId.set(item.id.toLowerCase(), item);
      }

      const country = (item.country || '').toUpperCase();
      const names = [item.name, ...(item.alt_names || []), item.network].filter(Boolean) as string[];

      for (const rawName of names) {
        const norm = normalize(rawName);
        if (!norm) continue;

        if (country) {
          const composite = `${norm}__${country}`;
          if (!byNameCountry.has(composite)) {
            byNameCountry.set(composite, item);
          }
        }

        if (!byName.has(norm)) {
          byName.set(norm, item);
        }
      }
    }

    return {
      byId,
      byNameCountry,
      byName,
      countryMap: countryMap || new Map(Object.entries(COUNTRY_NAMES)),
      lastLoaded: Date.now()
    };
  }

  public async enrichChannels(channels: PlaylistChannel[]): Promise<{
    channels: PlaylistChannel[];
    enrichedCount: number;
    totalCount: number;
  }> {
    const index = await this.getIndex();
    let enrichedCount = 0;

    const enriched = channels.map((channel) => {
      const tvgId = (channel.tvgId || channel.epgChannelId || '').trim().toLowerCase();
      const direct = tvgId ? index.byId.get(tvgId) : undefined;
      const countryCode = (channel.countryCode || channel.tvgCountry || '').toUpperCase();
      const normName = normalize(channel.name);

      const byCountryMatch = countryCode ? index.byNameCountry.get(`${normName}__${countryCode}`) : undefined;
      const nameMatch = index.byName.get(normName);

      const match = direct || byCountryMatch || nameMatch;

      if (!match) {
        const resolvedCountry = countryCode || 'UN';
        return {
          ...channel,
          countryCode: resolvedCountry,
          countryName: channel.countryName || index.countryMap.get(resolvedCountry) || resolvedCountry,
          metadataSource: channel.metadataSource || 'playlist'
        };
      }

      enrichedCount++;
      const resolvedCountry = (countryCode || match.country || 'UN').toUpperCase();
      const canonicalCategories = Array.isArray(match.categories) && match.categories.length > 0
        ? match.categories.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(' / ')
        : channel.group;

      return {
        ...channel,
        id: channel.id || match.id,
        name: channel.name || match.name,
        logo: channel.logo || match.logo || undefined,
        group: canonicalCategories || channel.group || 'General',
        tvgId: channel.tvgId || match.id,
        epgChannelId: channel.epgChannelId || match.id,
        countryCode: resolvedCountry,
        countryName: channel.countryName || index.countryMap.get(resolvedCountry) || resolvedCountry,
        metadataSource: 'iptv-org' as const
      };
    });

    return {
      channels: enriched,
      enrichedCount,
      totalCount: channels.length
    };
  }

  public getStats() {
    return {
      channelsCount: this.index?.byId.size || 0,
      countriesCount: this.index?.countryMap.size || 0,
      lastLoaded: this.index?.lastLoaded ? new Date(this.index.lastLoaded).toISOString() : null,
      isRefreshing: this.isRefreshing
    };
  }

  private createFallbackIndex(): MetadataIndex {
    const fallbackChannels: IptvOrgChannel[] = [
      { id: 'CNNInternational.us', name: 'CNN International', country: 'US', categories: ['news'] },
      { id: 'Azteca7.mx', name: 'Azteca 7', country: 'MX', categories: ['entertainment'] },
      { id: 'WAPATV.pr', name: 'WAPA TV', country: 'PR', categories: ['general'] },
      { id: 'BBCNews.uk', name: 'BBC News', country: 'GB', categories: ['news'] },
      { id: 'Univision.us', name: 'Univision', country: 'US', categories: ['general'] },
      { id: 'Telemundo.us', name: 'Telemundo', country: 'US', categories: ['general'] },
      { id: 'ESPN.us', name: 'ESPN', country: 'US', categories: ['sports'] }
    ];
    return this.buildIndex(fallbackChannels);
  }
}

export const channelMetadataService = ChannelMetadataService.getInstance();
