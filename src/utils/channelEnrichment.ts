/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  PlaylistChannel, 
  CountrySection, 
  XmltvProgramme, 
  UpgradeAppConfig,
  IptvOrgCountry,
  IptvOrgCategory,
  IptvOrgRegion
} from '../types/iptv';
import countriesData from '../data/iptv-org/countries.json';
import categoriesData from '../data/iptv-org/categories.json';
import regionsData from '../data/iptv-org/regions.json';

export type Json = Record<string, any>;

export const IPTV_ORG_COUNTRIES: IptvOrgCountry[] = countriesData as IptvOrgCountry[];
export const IPTV_ORG_CATEGORIES: IptvOrgCategory[] = categoriesData as IptvOrgCategory[];
export const IPTV_ORG_REGIONS: IptvOrgRegion[] = regionsData as IptvOrgRegion[];

export const COUNTRIES_BY_CODE = new Map<string, IptvOrgCountry>(
  IPTV_ORG_COUNTRIES.map((c) => [c.code.toUpperCase(), c])
);

export const COUNTRY_FLAGS: Record<string, string> = {};
export const COUNTRY_NAMES: Record<string, string> = {
  UN: 'International / Unknown'
};
export const COUNTRY_LANGUAGES: Record<string, string[]> = {};

for (const c of IPTV_ORG_COUNTRIES) {
  const code = c.code.toUpperCase();
  COUNTRY_FLAGS[code] = c.flag;
  COUNTRY_NAMES[code] = c.name;
  COUNTRY_LANGUAGES[code] = c.languages;
}
COUNTRY_FLAGS['UN'] = '🌐';

// Alias standard ISO variants (e.g. GB <-> UK)
if (COUNTRY_FLAGS['UK'] && !COUNTRY_FLAGS['GB']) {
  COUNTRY_FLAGS['GB'] = COUNTRY_FLAGS['UK'];
  COUNTRY_NAMES['GB'] = COUNTRY_NAMES['UK'];
  COUNTRY_LANGUAGES['GB'] = COUNTRY_LANGUAGES['UK'];
}

export const REGIONS_BY_CODE = new Map<string, IptvOrgRegion>(
  IPTV_ORG_REGIONS.map((r) => [r.code.toUpperCase(), r])
);

// Map each country code to the list of region codes it belongs to
export const COUNTRY_TO_REGIONS = new Map<string, string[]>();
for (const region of IPTV_ORG_REGIONS) {
  for (const countryCode of region.countries) {
    const code = countryCode.toUpperCase();
    const current = COUNTRY_TO_REGIONS.get(code) || [];
    current.push(region.code);
    COUNTRY_TO_REGIONS.set(code, current);
    if (code === 'UK') {
      const gbCurrent = COUNTRY_TO_REGIONS.get('GB') || [];
      gbCurrent.push(region.code);
      COUNTRY_TO_REGIONS.set('GB', gbCurrent);
    }
  }
}

export const MAJOR_REGIONS = [
  { code: 'ALL', name: 'All Regions', icon: '🌍' },
  { code: 'AMER', name: 'Americas', icon: '🌎' },
  { code: 'LATAM', name: 'Latin America', icon: '🌎' },
  { code: 'CARIB', name: 'Caribbean', icon: '🏝️' },
  { code: 'EUR', name: 'Europe', icon: '🌍' },
  { code: 'APAC', name: 'Asia-Pacific', icon: '🌏' },
  { code: 'MIDEAST', name: 'Middle East', icon: '🕌' },
  { code: 'AFR', name: 'Africa', icon: '🌍' }
];

export function getCountryFlag(code?: string): string {
  if (!code) return '🌐';
  const upper = code.toUpperCase();
  return COUNTRY_FLAGS[upper] || '🌐';
}

export function getCountryName(code?: string): string {
  if (!code) return 'International / Unknown';
  const upper = code.toUpperCase();
  return COUNTRY_NAMES[upper] || code;
}

export function getCountriesByRegion(regionCode: string): string[] {
  if (!regionCode || regionCode === 'ALL') {
    return Array.from(new Set([...IPTV_ORG_COUNTRIES.map((c) => c.code.toUpperCase()), 'GB']));
  }
  const reg = REGIONS_BY_CODE.get(regionCode.toUpperCase());
  if (!reg) return [];
  const list = reg.countries.map((c) => c.toUpperCase());
  if (list.includes('UK') && !list.includes('GB')) {
    list.push('GB');
  }
  return list;
}

export function normalizeCategory(groupOrCategory?: string): string {
  if (!groupOrCategory) return 'General';
  const clean = groupOrCategory.trim();
  const lower = clean.toLowerCase();

  // Check direct match in IPTV_ORG_CATEGORIES
  const direct = IPTV_ORG_CATEGORIES.find(
    (cat) => cat.id.toLowerCase() === lower || cat.name.toLowerCase() === lower
  );
  if (direct) return direct.name;

  // Keyword mapping to standard iptv-org categories
  if (lower.includes('news')) return 'News';
  if (lower.includes('sport')) return 'Sports';
  if (lower.includes('movie') || lower.includes('cinema') || lower.includes('film')) return 'Movies';
  if (lower.includes('music')) return 'Music';
  if (lower.includes('kid') || lower.includes('child') || lower.includes('cartoon') || lower.includes('animation')) return 'Kids';
  if (lower.includes('doc')) return 'Documentary';
  if (lower.includes('comedy')) return 'Comedy';
  if (lower.includes('series') || lower.includes('drama')) return 'Series';
  if (lower.includes('entertain') || lower.includes('variet')) return 'Entertainment';
  if (lower.includes('religio') || lower.includes('faith')) return 'Religious';
  if (lower.includes('educat') || lower.includes('science')) return 'Education';
  if (lower.includes('lifestyle') || lower.includes('cook') || lower.includes('food')) return 'Lifestyle';
  if (lower.includes('business') || lower.includes('finan')) return 'Business';
  if (lower.includes('weather')) return 'Weather';

  // Capitalize first letter
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const normalize = (value?: string): string =>
  (value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  if (typeof window !== 'undefined') return fallback;
  try {
    const fs = await import('node:fs/promises');
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  if (typeof window !== 'undefined') return;
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch {
    // browser or filesystem error
  }
}

export function buildIptvOrgIndex(records: Json[]) {
  const byId = new Map<string, Json>();
  const byNameCountry = new Map<string, Json>();

  for (const item of records) {
    if (item.id) byId.set(String(item.id), item);
    const keys = [item.name, item.alt_name, item.network].filter(Boolean);
    for (const key of keys) {
      const composite = `${normalize(String(key))}__${String(item.country || '').toUpperCase()}`;
      if (!byNameCountry.has(composite)) byNameCountry.set(composite, item);
    }
  }

  return { byId, byNameCountry };
}

export function enrichChannels(
  channels: PlaylistChannel[], 
  iptvOrgIndex: ReturnType<typeof buildIptvOrgIndex>
): PlaylistChannel[] {
  return channels.map((channel) => {
    const tvgId = channel.tvgId || channel.epgChannelId || '';
    const direct = tvgId ? iptvOrgIndex.byId.get(tvgId) : undefined;
    const countryCode = (channel.countryCode || channel.tvgCountry || '').toUpperCase();
    const keyed = iptvOrgIndex.byNameCountry.get(`${normalize(channel.name)}__${countryCode}`);
    const match = direct || keyed;

    const resolvedCountryCode = match ? String(match.country || countryCode || 'UN').toUpperCase() : (countryCode || 'UN');
    const flag = getCountryFlag(resolvedCountryCode);
    const countryName = getCountryName(resolvedCountryCode);

    if (!match) {
      return {
        ...channel,
        countryCode: resolvedCountryCode,
        countryName: channel.countryName || countryName,
        countryFlag: channel.countryFlag || flag,
        category: channel.category || normalizeCategory(channel.group),
        metadataSource: channel.metadataSource || 'playlist'
      };
    }

    return {
      ...channel,
      id: channel.id || String(match.id || slugify(channel.name)),
      name: channel.name || match.name,
      logo: channel.logo || match.logo,
      group: channel.group || (Array.isArray(match.categories) ? match.categories.join(';') : match.category),
      category: channel.category || normalizeCategory(Array.isArray(match.categories) ? match.categories[0] : match.category || channel.group),
      tvgId: channel.tvgId || String(match.id || ''),
      epgChannelId: channel.epgChannelId || String(match.id || ''),
      countryCode: resolvedCountryCode,
      countryName: channel.countryName || countryName,
      countryFlag: flag,
      language: channel.language || match.lang,
      metadataSource: 'iptv-org' as const
    };
  });
}

export function buildCountrySections(
  channels: PlaylistChannel[], 
  countries: Json[] = IPTV_ORG_COUNTRIES
): CountrySection[] {
  const names = new Map<string, string>(countries.map((c) => [String(c.code).toUpperCase(), c.name]));
  const flags = new Map<string, string>(countries.map((c) => [String(c.code).toUpperCase(), c.flag || getCountryFlag(c.code)]));
  const grouped = new Map<string, PlaylistChannel[]>();

  for (const channel of channels) {
    const code = (channel.countryCode || channel.tvgCountry || 'UN').toUpperCase();
    const resolvedCountryName = names.get(code) || COUNTRY_NAMES[code] || code;
    const resolvedFlag = flags.get(code) || COUNTRY_FLAGS[code] || '🌐';

    channel.countryCode = code;
    channel.countryName = channel.countryName || resolvedCountryName;
    channel.countryFlag = channel.countryFlag || resolvedFlag;
    if (!channel.category) {
      channel.category = normalizeCategory(channel.group);
    }

    if (!grouped.has(code)) grouped.set(code, []);
    grouped.get(code)!.push(channel);
  }

  return [...grouped.entries()]
    .map(([code, list]) => {
      const name = names.get(code) || COUNTRY_NAMES[code] || code;
      const flag = flags.get(code) || COUNTRY_FLAGS[code] || '🌐';
      const cObj = COUNTRIES_BY_CODE.get(code);
      const languages = cObj?.languages || [];
      const regions = COUNTRY_TO_REGIONS.get(code) || [];
      const primaryRegion = regions[0] || 'Worldwide';

      const featuredLogos = list
        .map((c) => c.logo)
        .filter((logo): logo is string => Boolean(logo && logo.trim()))
        .slice(0, 4);

      return {
        code,
        name,
        flag,
        languages,
        region: primaryRegion,
        channelCount: list.length,
        channels: list.sort((a, b) => a.name.localeCompare(b.name)),
        featuredLogos
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function readPublicXmltvDirectory(dir: string): Promise<XmltvProgramme[]> {
  if (typeof window !== 'undefined') return [];
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const files = await fs.readdir(dir);
    const programmeBag: XmltvProgramme[] = [];

    for (const file of files.filter((f) => f.endsWith('.json'))) {
      const feed = await readJson<{ programmes?: XmltvProgramme[] }>(path.join(dir, file), {});
      for (const programme of feed.programmes || []) {
        programmeBag.push({ ...programme, sourcePriority: 50 });
      }
    }

    return programmeBag;
  } catch {
    return [];
  }
}

export function mergeProgrammes(
  primary: XmltvProgramme[], 
  fallback: XmltvProgramme[], 
  fallbackWindowHours = 12
): XmltvProgramme[] {
  const map = new Map<string, XmltvProgramme>();
  const cutoff = Date.now() - fallbackWindowHours * 60 * 60 * 1000;

  for (const programme of [...fallback, ...primary].sort((a, b) => a.sourcePriority - b.sourcePriority)) {
    const key = `${programme.channel}__${programme.start}__${normalize(programme.title)}`;
    const start = Date.parse(programme.start);
    if (Number.isFinite(start) && start < cutoff) continue;
    if (!map.has(key)) {
      map.set(key, programme);
    }
  }

  return [...map.values()].sort((a, b) => a.start.localeCompare(b.start));
}

export function generateCountryMarkup(countrySections: CountrySection[]): string {
  return countrySections
    .map(
      (section) => `
<section class="country-block" id="country-${section.code.toLowerCase()}">
  <header class="country-block__header">
    <h2>${section.name}</h2>
    <span>${section.channelCount} channels</span>
  </header>
  <div class="country-grid">
    ${section.channels
      .map(
        (channel) => `
    <article class="channel-card" data-country="${section.code}" data-channel-id="${channel.id}">
      <img src="${channel.logo || '/placeholder-logo.svg'}" alt="${channel.name} logo" loading="lazy" />
      <div>
        <h3>${channel.name}</h3>
        <p>${channel.group || 'General'} • ${channel.language || 'Unknown language'}</p>
      </div>
    </article>`
      )
      .join('')}
  </div>
</section>`
    )
    .join('\n');
}

export function generateReactSectionPatch(): string {
  return `
// src/components/CountryChannelSections.tsx
import React, { useMemo } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

export function CountryChannelSections() {
  const channels = usePlayerStore((s) => s.channels);

  const countrySections = useMemo(() => {
    const grouped = new Map<string, typeof channels>();
    for (const channel of channels) {
      const code = (channel.countryCode || 'UN').toUpperCase();
      const bucket = grouped.get(code) || [];
      bucket.push(channel);
      grouped.set(code, bucket);
    }
    return [...grouped.entries()]
      .map(([code, items]) => ({
        code,
        items: items.sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [channels]);

  return (
    <div className="space-y-8">
      {countrySections.map((section) => (
        <section key={section.code}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{section.code}</h2>
            <span className="text-sm opacity-70">{section.items.length} channels</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {section.items.map((channel) => (
              <article key={channel.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <img src={channel.logo} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  <div>
                    <h3 className="font-medium">{channel.name}</h3>
                    <p className="text-sm opacity-70">{channel.group || 'General'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
`;
}
