import { Channel, CountrySection } from '../types/iptv';

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

export function buildCountrySections(
  channels: Channel[], 
  countries: Array<{ code: string; name: string }> = []
): CountrySection[] {
  const names = new Map<string, string>(countries.map((c) => [String(c.code).toUpperCase(), c.name]));
  const grouped = new Map<string, Channel[]>();

  for (const channel of channels) {
    const code = (channel.countryCode || channel.tvgCountry || 'UN').toUpperCase();
    const countryName = names.get(code) || COUNTRY_NAMES[code] || code;
    channel.countryName = channel.countryName || countryName;
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
