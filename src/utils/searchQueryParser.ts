/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Channel } from '../types/iptv';

export interface ParsedSearchQuery {
  raw: string;
  freeTerms: string[];
  countries: string[];
  languages: string[];
  subdivisions: string[];
  groups: string[];
  tags: string[];
  qualities: string[];
  statuses: string[];
  negatedCountries: string[];
  negatedStatuses: string[];
  hasFilters: boolean;
}

/**
 * Canonical Unicode search folding across all languages.
 * Extracted from IPTVnator's foldSearchText algorithm.
 * 
 * Performs lowercase conversion, Unicode NFD decomposition, strips combining diacritics,
 * normalizes language-specific characters (German ß, Scandinavian æ/ø, Turkish İ),
 * and re-composes with NFC.
 */
export function foldSearchText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Strip combining accent marks
    .replace(/ß/g, 'ss')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .normalize('NFC')
    .trim();
}

/**
 * Tokenizes a query string while respecting quotes.
 * Example: 'country:us "news 24" tag:sports' -> ['country:us', 'news 24', 'tag:sports']
 */
export function tokenizeQuery(query: string): string[] {
  const tokens: string[] = [];
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(query)) !== null) {
    if (match[1] !== undefined) {
      // Double quoted
      tokens.push(match[1]);
    } else if (match[2] !== undefined) {
      // Single quoted
      tokens.push(match[2]);
    } else {
      tokens.push(match[0]);
    }
  }

  return tokens;
}

/**
 * Parses an advanced search string containing syntax key:value pairs and free text.
 * Supported keys:
 *  - country: / cc:
 *  - lang: / language:
 *  - group: / cat: / category:
 *  - sub: / subdivision:
 *  - tag:
 *  - quality: / res: / resolution:
 *  - status:
 *  - -country: / -cc: / -status:
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const raw = query.trim();
  const tokens = tokenizeQuery(raw);

  const freeTerms: string[] = [];
  const countries: string[] = [];
  const languages: string[] = [];
  const subdivisions: string[] = [];
  const groups: string[] = [];
  const tags: string[] = [];
  const qualities: string[] = [];
  const statuses: string[] = [];
  const negatedCountries: string[] = [];
  const negatedStatuses: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();

    // Negations
    if (lower.startsWith('-country:') || lower.startsWith('-cc:')) {
      const val = token.substring(token.indexOf(':') + 1).trim().toUpperCase();
      if (val) negatedCountries.push(val);
      continue;
    }
    if (lower.startsWith('-status:')) {
      const val = token.substring(token.indexOf(':') + 1).trim().toLowerCase();
      if (val) negatedStatuses.push(val);
      continue;
    }

    // Direct key-values
    if (lower.startsWith('country:') || lower.startsWith('cc:')) {
      const val = token.substring(token.indexOf(':') + 1).trim().toUpperCase();
      if (val) countries.push(val);
      continue;
    }
    if (lower.startsWith('lang:') || lower.startsWith('language:')) {
      const val = foldSearchText(token.substring(token.indexOf(':') + 1));
      if (val) languages.push(val);
      continue;
    }
    if (lower.startsWith('group:') || lower.startsWith('cat:') || lower.startsWith('category:')) {
      const val = foldSearchText(token.substring(token.indexOf(':') + 1));
      if (val) groups.push(val);
      continue;
    }
    if (lower.startsWith('sub:') || lower.startsWith('subdivision:')) {
      const val = foldSearchText(token.substring(token.indexOf(':') + 1));
      if (val) subdivisions.push(val);
      continue;
    }
    if (lower.startsWith('tag:')) {
      const val = foldSearchText(token.substring(token.indexOf(':') + 1));
      if (val) tags.push(val);
      continue;
    }
    if (lower.startsWith('quality:') || lower.startsWith('res:') || lower.startsWith('resolution:')) {
      const val = token.substring(token.indexOf(':') + 1).trim().toLowerCase();
      if (val) qualities.push(val);
      continue;
    }
    if (lower.startsWith('status:')) {
      const val = token.substring(token.indexOf(':') + 1).trim().toLowerCase();
      if (val) statuses.push(val);
      continue;
    }

    // Free text (folded for universal accent-insensitive matching)
    if (token.trim()) {
      const folded = foldSearchText(token);
      if (folded) freeTerms.push(folded);
    }
  }

  const hasFilters = 
    freeTerms.length > 0 ||
    countries.length > 0 ||
    languages.length > 0 ||
    subdivisions.length > 0 ||
    groups.length > 0 ||
    tags.length > 0 ||
    qualities.length > 0 ||
    statuses.length > 0 ||
    negatedCountries.length > 0 ||
    negatedStatuses.length > 0;

  return {
    raw,
    freeTerms,
    countries,
    languages,
    subdivisions,
    groups,
    tags,
    qualities,
    statuses,
    negatedCountries,
    negatedStatuses,
    hasFilters
  };
}

/**
 * Determines whether a channel matches the parsed search query.
 * Uses foldSearchText for universal Unicode diacritic normalization.
 */
export function matchChannelWithQuery(
  channel: Channel,
  parsed: ParsedSearchQuery,
  channelCustomTags: string[] = []
): boolean {
  if (!parsed.hasFilters) return true;

  // 1. Negated Countries
  if (parsed.negatedCountries.length > 0) {
    const cCode = (channel.countryCode || '').toUpperCase();
    if (parsed.negatedCountries.includes(cCode)) {
      return false;
    }
  }

  // 2. Negated Status
  if (parsed.negatedStatuses.length > 0) {
    const cStatus = (channel.healthStatus || 'online').toLowerCase();
    if (parsed.negatedStatuses.includes(cStatus)) {
      return false;
    }
  }

  // 3. Country Filter
  if (parsed.countries.length > 0) {
    const cCode = (channel.countryCode || '').toUpperCase();
    const cName = foldSearchText(channel.countryName || '').toUpperCase();
    const matchesCountry = parsed.countries.some((c) => {
      if (cCode === c) return true;
      if (c.length <= 3) return cCode === c || cName === c;
      return cName.includes(c);
    });
    if (!matchesCountry) return false;
  }

  // 4. Language Filter (Folded for accents)
  if (parsed.languages.length > 0) {
    const cLang = foldSearchText(channel.language || '');
    const cLangName = foldSearchText(channel.languageName || '');
    const matchesLang = parsed.languages.some(
      (l) => cLang === l || cLang.startsWith(l) || cLangName.includes(l)
    );
    if (!matchesLang) return false;
  }

  // 5. Group / Category Filter (Folded for accents)
  if (parsed.groups.length > 0) {
    const cGroup = foldSearchText(channel.group || '');
    const cCat = foldSearchText(channel.category || '');
    const matchesGroup = parsed.groups.some(
      (g) => cGroup.includes(g) || cCat.includes(g)
    );
    if (!matchesGroup) return false;
  }

  // 6. Subdivision Filter (Folded for accents)
  if (parsed.subdivisions.length > 0) {
    const cSub = foldSearchText(channel.subdivision || '');
    const matchesSub = parsed.subdivisions.some((s) => cSub.includes(s));
    if (!matchesSub) return false;
  }

  // 7. Custom Tags Filter (Folded for accents)
  if (parsed.tags.length > 0) {
    const foldedTags = channelCustomTags.map((t) => foldSearchText(t));
    const matchesTag = parsed.tags.some((t) => foldedTags.includes(t));
    if (!matchesTag) return false;
  }

  // 8. Quality / Resolution Filter
  if (parsed.qualities.length > 0) {
    const res = (channel.resolution || '').toLowerCase();
    const name = channel.name.toLowerCase();
    const matchesQuality = parsed.qualities.some((q) => {
      if (q === '4k' || q === 'uhd') return res.includes('4k') || name.includes('4k') || name.includes('uhd') || res.includes('2160');
      if (q === 'fhd' || q === '1080' || q === '1080p') return res.includes('1080') || name.includes('1080') || name.includes('fhd');
      if (q === 'hd' || q === '720' || q === '720p') return res.includes('720') || name.includes('hd') || name.includes('720') || res.includes('1080');
      if (q === 'sd') return res.includes('576') || res.includes('480') || name.includes('sd');
      return res.includes(q) || name.includes(q);
    });
    if (!matchesQuality) return false;
  }

  // 9. Status Filter
  if (parsed.statuses.length > 0) {
    const cStatus = (channel.healthStatus || 'online').toLowerCase();
    const matchesStatus = parsed.statuses.some((s) => cStatus === s);
    if (!matchesStatus) return false;
  }

  // 10. Free text terms (Universal Unicode accent-folded AND logic across all terms)
  if (parsed.freeTerms.length > 0) {
    const rawSearchable = [
      channel.name,
      channel.group,
      channel.category || '',
      channel.countryName || '',
      channel.countryCode || '',
      channel.languageName || '',
      channel.language || '',
      channel.tvgId || '',
      channel.subdivision || '',
      channel.resolution || '',
      ...channelCustomTags
    ].join(' ');

    const searchableText = foldSearchText(rawSearchable);

    const matchesAllTerms = parsed.freeTerms.every((term) => searchableText.includes(term));
    if (!matchesAllTerms) return false;
  }

  return true;
}
