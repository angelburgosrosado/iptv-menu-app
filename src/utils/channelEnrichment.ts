/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  PlaylistChannel, 
  CountrySection, 
  XmltvProgramme, 
  UpgradeAppConfig 
} from '../types/iptv';

export type Json = Record<string, any>;

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

    if (!match) {
      return {
        ...channel,
        countryCode: countryCode || 'UN',
        metadataSource: channel.metadataSource || 'playlist'
      };
    }

    return {
      ...channel,
      id: channel.id || String(match.id || slugify(channel.name)),
      name: channel.name || match.name,
      logo: channel.logo || match.logo,
      group: channel.group || (Array.isArray(match.categories) ? match.categories.join(';') : match.category),
      tvgId: channel.tvgId || String(match.id || ''),
      epgChannelId: channel.epgChannelId || String(match.id || ''),
      countryCode: countryCode || String(match.country || 'UN').toUpperCase(),
      language: channel.language || match.lang,
      metadataSource: 'iptv-org' as const
    };
  });
}

export function buildCountrySections(
  channels: PlaylistChannel[], 
  countries: Json[] = []
): CountrySection[] {
  const names = new Map<string, string>(countries.map((c) => [String(c.code).toUpperCase(), c.name]));
  const grouped = new Map<string, PlaylistChannel[]>();

  for (const channel of channels) {
    const code = (channel.countryCode || 'UN').toUpperCase();
    const resolvedCountryName = names.get(code) || COUNTRY_NAMES[code] || code;
    channel.countryName = channel.countryName || resolvedCountryName;
    if (!grouped.has(code)) grouped.set(code, []);
    grouped.get(code)!.push(channel);
  }

  return [...grouped.entries()]
    .map(([code, list]) => {
      const name = names.get(code) || COUNTRY_NAMES[code] || code;
      const featuredLogos = list
        .map((c) => c.logo)
        .filter((logo): logo is string => Boolean(logo && logo.trim()))
        .slice(0, 4);

      return {
        code,
        name,
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
