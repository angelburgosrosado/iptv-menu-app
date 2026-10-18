/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Extracted from kvnpyy/streamly
 */

export type ChannelMeta = {
  /** Country flag emoji (e.g. "🇺🇸"). */
  flag?: string;
  /** Human-readable country (e.g. "United States"). */
  country?: string;
  /** ISO 3166-1 alpha-2 country code (e.g. "US", "GB"). Used by the
   *  external EPG fallback to pick the right country file. */
  countryCode?: string;
  /** Detected broadcast network or producer (e.g. "ABC", "BBC", "ESPN"). */
  network?: string;
  /** Detected top-level topic (e.g. "Sports", "News", "Movies"). */
  topic?: string;
  /** Emoji that goes with the topic, if any. */
  topicEmoji?: string;
  /** Quality tag (HD, FHD, 4K, etc.). */
  quality?: string;
  /** Specific detail like a city, sub-league, or event. */
  detail?: string;
  /** Cleaned channel display name with prefixes/suffixes stripped. */
  cleanName?: string;
  /** True if we found nothing useful. */
  isEmpty?: boolean;
};

const COUNTRY_TABLE: Array<{
  codes: string[];
  flag: string;
  name: string;
  iso2?: string;
}> = [
  { codes: ["USA", "US", "UNITED STATES"], flag: "🇺🇸", name: "United States", iso2: "US" },
  { codes: ["UK", "GB", "ENGLAND", "BRITAIN"], flag: "🇬🇧", name: "United Kingdom", iso2: "GB" },
  { codes: ["CA", "CAN", "CANADA"], flag: "🇨🇦", name: "Canada", iso2: "CA" },
  { codes: ["AU", "AUS", "AUSTRALIA"], flag: "🇦🇺", name: "Australia", iso2: "AU" },
  { codes: ["DE", "GER", "GERMANY"], flag: "🇩🇪", name: "Germany", iso2: "DE" },
  { codes: ["FR", "FRA", "FRANCE"], flag: "🇫🇷", name: "France", iso2: "FR" },
  { codes: ["ES", "ESP", "SPAIN"], flag: "🇪🇸", name: "Spain", iso2: "ES" },
  { codes: ["IT", "ITA", "ITALY"], flag: "🇮🇹", name: "Italy", iso2: "IT" },
  { codes: ["PT", "POR", "PORTUGAL"], flag: "🇵🇹", name: "Portugal", iso2: "PT" },
  { codes: ["BR", "BRA", "BRAZIL"], flag: "🇧🇷", name: "Brazil", iso2: "BR" },
  { codes: ["MX", "MEX", "MEXICO"], flag: "🇲🇽", name: "Mexico", iso2: "MX" },
  { codes: ["AR", "ARG", "ARGENTINA"], flag: "🇦🇷", name: "Argentina", iso2: "AR" },
  { codes: ["IN", "IND", "INDIA"], flag: "🇮🇳", name: "India", iso2: "IN" },
  { codes: ["PK", "PAK", "PAKISTAN"], flag: "🇵🇰", name: "Pakistan", iso2: "PK" },
  { codes: ["NL", "NED", "NETHERLANDS"], flag: "🇳🇱", name: "Netherlands", iso2: "NL" },
  { codes: ["BE", "BEL", "BELGIUM"], flag: "🇧🇪", name: "Belgium", iso2: "BE" },
  { codes: ["AT", "AUT", "AUSTRIA"], flag: "🇦🇹", name: "Austria", iso2: "AT" },
  { codes: ["CH", "SUI", "SWITZERLAND"], flag: "🇨🇭", name: "Switzerland", iso2: "CH" },
  { codes: ["IE", "IRL", "IRELAND"], flag: "🇮🇪", name: "Ireland", iso2: "IE" },
  { codes: ["JP", "JPN", "JAPAN"], flag: "🇯🇵", name: "Japan", iso2: "JP" },
  { codes: ["KR", "KOR", "KOREA"], flag: "🇰🇷", name: "Korea", iso2: "KR" },
  { codes: ["TR", "TUR", "TURKEY"], flag: "🇹🇷", name: "Türkiye", iso2: "TR" },
  { codes: ["GR", "GRE", "GREECE"], flag: "🇬🇷", name: "Greece", iso2: "GR" },
  { codes: ["AE", "UAE", "EMIRATES"], flag: "🇦🇪", name: "UAE", iso2: "AE" },
  { codes: ["SA", "KSA", "SAUDI"], flag: "🇸🇦", name: "Saudi Arabia", iso2: "SA" },
  { codes: ["SE", "SWE", "SWEDEN"], flag: "🇸🇪", name: "Sweden", iso2: "SE" },
  { codes: ["NO", "NOR", "NORWAY"], flag: "🇳🇴", name: "Norway", iso2: "NO" },
  { codes: ["DK", "DEN", "DENMARK"], flag: "🇩🇰", name: "Denmark", iso2: "DK" },
  { codes: ["EN", "ENG"], flag: "🇬🇧", name: "English", iso2: "GB" },
  { codes: ["LATIN", "LATAM"], flag: "🌎", name: "Latin America" },
];

const COUNTRY_LOOKUP: Record<string, { flag: string; name: string; iso2?: string }> = COUNTRY_TABLE.reduce(
  (acc, row) => {
    for (const code of row.codes) {
      acc[code] = { flag: row.flag, name: row.name, iso2: row.iso2 };
    }
    return acc;
  },
  {} as Record<string, { flag: string; name: string; iso2?: string }>
);

type TopicMatcher = {
  topic: string;
  emoji: string;
  patterns: RegExp[];
};

const TOPICS: TopicMatcher[] = [
  {
    topic: "News",
    emoji: "📰",
    patterns: [/\bnews\b/i, /\bcnn\b/i, /\bbbc news\b/i, /\bfox news\b/i, /\bmsnbc\b/i, /\beuronews\b/i, /\bsky news\b/i],
  },
  {
    topic: "Sports",
    emoji: "🏆",
    patterns: [
      /\bsports?\b/i, /\bespn\b/i, /\bfox sports?\b/i, /\bsky sports?\b/i, /\btsn\b/i, /\bbein\b/i,
      /\bnba\b/i, /\bnfl\b/i, /\bmlb\b/i, /\bnhl\b/i, /\bufc\b/i, /\bf1\b/i, /\bfootball\b/i, /\bsoccer\b/i
    ],
  },
  {
    topic: "Movies",
    emoji: "🎬",
    patterns: [/\bmovies?\b/i, /\bcinema\b/i, /\bhbo\b/i, /\bshowtime\b/i, /\bstarz\b/i, /\bcinemax\b/i],
  },
  {
    topic: "Kids",
    emoji: "🧸",
    patterns: [/\bkids?\b/i, /\bcartoon\b/i, /\bdisney\b/i, /\bnickelodeon\b/i, /\bnick jr\b/i],
  },
  {
    topic: "Music",
    emoji: "🎵",
    patterns: [/\bmusic\b/i, /\bmtv\b/i, /\bvevo\b/i, /\bvh1\b/i],
  },
  {
    topic: "Documentary",
    emoji: "🌍",
    patterns: [/\bdocu(?:mentary)?\b/i, /\bnat ?geo\b/i, /\bdiscovery\b/i, /\bhistory\b/i, /\banimal planet\b/i],
  },
];

const NETWORKS = [
  "ABC", "CBS", "NBC", "FOX", "PBS", "BBC", "ITV", "CNN", "MSNBC", "ESPN", "ESPN+", "ESPN2",
  "TNT", "TBS", "TLC", "HBO", "MAX", "AMC", "FX", "FXX", "USA NETWORK", "USA", "BRAVO",
  "SHOWTIME", "STARZ", "PARAMOUNT", "PARAMOUNT+", "PEACOCK", "DISNEY", "NICKELODEON",
  "DISCOVERY", "HISTORY", "NAT GEO", "ANIMAL PLANET", "SKY", "SKY SPORTS", "SKY CINEMA", "DAZN", "BEIN"
];

const QUALITY_RE = /\b(4K|UHD|FHD|FULL\s?HD|HEVC|H265|H\.265|HD|SD)\b/i;

function detectQuality(input: string): { quality?: string; cleaned: string } {
  const m = input.match(QUALITY_RE);
  if (!m) return { cleaned: input };
  const cleaned = input.replace(QUALITY_RE, " ").replace(/\s{2,}/g, " ").trim();
  const raw = m[0].toUpperCase().replace(/\s+/g, "");
  const quality = raw === "FULLHD" ? "FHD" : raw === "H265" || raw === "H.265" || raw === "HEVC" ? "HEVC" : raw;
  return { quality, cleaned };
}

function detectCountry(input: string): {
  country?: { flag: string; name: string; iso2?: string };
  cleaned: string;
} {
  const bracket = input.match(/^\s*\[([A-Z][A-Z0-9-]{0,8})\]\s*/);
  if (bracket) {
    const code = bracket[1].split("-")[0].toUpperCase();
    const c = COUNTRY_LOOKUP[code];
    if (c) return { country: c, cleaned: input.slice(bracket[0].length) };
  }
  const dash = input.match(/^\s*([A-Z]{2,3})\s*[-–|]\s*/);
  if (dash) {
    const code = dash[1].toUpperCase();
    const c = COUNTRY_LOOKUP[code];
    if (c) return { country: c, cleaned: input.slice(dash[0].length) };
  }
  return { cleaned: input };
}

function detectNetwork(input: string): string | undefined {
  const upper = input.toUpperCase();
  let best: string | undefined;
  for (const n of NETWORKS) {
    const re = new RegExp(`\\b${n.replace(/\+/g, "\\+")}\\b`, "i");
    if (re.test(upper) && (!best || n.length > best.length)) best = n;
  }
  if (!best) return undefined;
  return best;
}

function detectTopic(input: string): { topic: string; emoji: string } | undefined {
  for (const t of TOPICS) {
    if (t.patterns.some((re) => re.test(input))) {
      return { topic: t.topic, emoji: t.emoji };
    }
  }
  return undefined;
}

export function parseChannelMeta(rawName: string): ChannelMeta {
  const name = (rawName || "").trim();
  if (!name) return { isEmpty: true };

  const { country, cleaned: afterCountry } = detectCountry(name);
  const { quality, cleaned: afterQuality } = detectQuality(afterCountry);
  const topicHit = detectTopic(name);
  const network = detectNetwork(afterQuality);

  const cleanName = afterQuality
    .replace(/^[-–|:\s]+/, "")
    .replace(/[-–|:\s]+$/, "")
    .trim() || name;

  return {
    flag: country?.flag,
    country: country?.name,
    countryCode: country?.iso2,
    quality,
    network,
    topic: topicHit?.topic,
    topicEmoji: topicHit?.emoji,
    cleanName,
    isEmpty: !country && !quality && !network && !topicHit,
  };
}
