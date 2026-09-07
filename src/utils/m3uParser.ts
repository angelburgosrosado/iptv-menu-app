/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Channel } from '../types/iptv';

// Fast DJB2 non-cryptographic string hashing for unique channel IDs
function generateStableId(name: string, url: string): string {
  let hash = 5381;
  const combined = name + url;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 33) ^ combined.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

// Resilient parsing options
export interface ParserOptions {
  onProgress?: (progress: number) => void;
}

/**
 * Resiliently parses M3U / M3U8 IPTV playlists.
 * Handles missing tags, loose quotes, non-standard line breaks, and duplicates.
 */
export function parseM3U(m3uContent: string, options?: ParserOptions): Channel[] {
  const { onProgress } = options || {};
  const channels: Channel[] = [];
  const urlSet = new Set<string>(); // Used for deduplication

  if (!m3uContent || !m3uContent.includes('#EXTM3U')) {
    console.warn('Invalid file format. Does not contain #EXTM3U header.');
    return [];
  }

  // Handle various line separators (CR, LF, CR+LF)
  const lines = m3uContent.split(/\r?\n/);
  const totalLines = lines.length;
  
  let currentExtinf: {
    tvgId: string;
    logo: string;
    group: string;
    name: string;
    tvgName?: string;
    tvgCountry?: string;
    countryCode?: string;
    language?: string;
  } | null = null;

  for (let i = 0; i < totalLines; i++) {
    const line = lines[i].trim();

    // Report progress periodically (every 500 lines) to prevent locking main thread
    if (onProgress && i % 500 === 0) {
      onProgress(Math.min(99, Math.round((i / totalLines) * 100)));
    }

    if (!line) {
      continue;
    }

    if (line.startsWith('#EXTINF:')) {
      // 1. Resilient Metadata Parsing
      // Handle key-value extractions with or without quotation marks
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/) || line.match(/tvg-id=([^ ,]*)/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/) || line.match(/tvg-logo=([^ ,]*)/);
      const groupMatch = line.match(/group-title="([^"]*)"/) || line.match(/group-title=([^ \n,]*)/);
      const tvgCountryMatch = line.match(/tvg-country="([^"]*)"/) || line.match(/tvg-country=([^ ,]*)/);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/) || line.match(/tvg-name=([^ ,]*)/);
      const tvgLangMatch = line.match(/tvg-language="([^"]*)"/) || line.match(/tvg-lang="([^"]*)"/) || line.match(/group-lang="([^"]*)"/);

      // 2. Resilient Channel Name Parsing
      // Identify the name which resides after the final comma on the #EXTINF line
      let name = 'Unknown Channel';
      const lastCommaIdx = line.lastIndexOf(',');
      if (lastCommaIdx !== -1) {
        name = line.substring(lastCommaIdx + 1).trim();
      }

      // Infer country code if not explicitly in tvg-country
      let countryCode = tvgCountryMatch ? tvgCountryMatch[1].trim().toUpperCase() : '';
      if (!countryCode) {
        const groupStr = groupMatch ? groupMatch[1] : '';
        const combined = `${name} ${groupStr}`;
        const codeInName = combined.match(/\b(US|CA|MX|GB|UK|FR|DE|ES|IT|BR|IN|PH|DO|PR)\b/i);
        if (codeInName) {
          const raw = codeInName[1].toUpperCase();
          countryCode = raw === 'UK' ? 'GB' : raw;
        } else {
          countryCode = 'UN';
        }
      }

      currentExtinf = {
        tvgId: tvgIdMatch ? tvgIdMatch[1].trim() : '',
        tvgName: tvgNameMatch ? tvgNameMatch[1].trim() : '',
        tvgCountry: tvgCountryMatch ? tvgCountryMatch[1].trim().toUpperCase() : '',
        language: tvgLangMatch ? tvgLangMatch[1].trim() : '',
        countryCode,
        logo: logoMatch ? logoMatch[1].trim() : '',
        group: groupMatch ? groupMatch[1].trim() : 'Uncategorized',
        name: name || 'Unknown Channel',
      };
    } else if (line.startsWith('#')) {
      // Skip other custom IPTV headers/comments (e.g. #EXTGRP, #EXTMY, etc.)
      continue;
    } else if (currentExtinf) {
      // 3. Resilient Stream URL Match
      // Valid HTTP/HTTPS/RTMP streams
      const isStreamUrl = /^(https?|rtmp|rtsp):\/\/[^\s]+$/i.test(line);
      
      if (isStreamUrl) {
        const streamUrl = line;

        // Skip absolute duplicates of the same stream URL to keep rendering lightning fast
        if (!urlSet.has(streamUrl)) {
          urlSet.add(streamUrl);

          const stableId = currentExtinf.tvgId || generateStableId(currentExtinf.name, streamUrl);
          
          channels.push({
            id: stableId,
            name: currentExtinf.name,
            logo: currentExtinf.logo,
            url: streamUrl,
            group: currentExtinf.group || 'Uncategorized',
            tvgId: currentExtinf.tvgId,
            tvgName: currentExtinf.tvgName || currentExtinf.name,
            tvgCountry: currentExtinf.tvgCountry,
            countryCode: currentExtinf.countryCode || 'UN',
            language: currentExtinf.language,
            epgChannelId: currentExtinf.tvgId,
            metadataSource: 'playlist',
          });
        }
      }
      currentExtinf = null; // Clear state machine for next item
    }
  }

  if (onProgress) {
    onProgress(100);
  }

  return channels;
}
