/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '@iptv-menu/logging';
import { EpgProgramme, NowNextProgrammes, XmltvProgramme } from '@iptv-menu/types';

const logger = new Logger('epg-service');

/**
 * Converts XMLTV timestamp (e.g. 20260907230000 +0000) to ISO string
 */
export function parseXmltvDate(rawDate?: string): string | null {
  if (!rawDate) return null;
  const cleaned = rawDate.trim();
  
  // Format: YYYYMMDDHHMMSS (optionally followed by timezone +0000)
  const match = cleaned.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-]\d{4}))?/);
  if (!match) {
    const fallbackParsed = Date.parse(cleaned);
    return Number.isFinite(fallbackParsed) ? new Date(fallbackParsed).toISOString() : null;
  }

  const [, year, month, day, hour, minute, second, tz] = match;
  let iso = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  
  if (tz) {
    const tzFormatted = `${tz.slice(0, 3)}:${tz.slice(3)}`;
    iso += tzFormatted;
  } else {
    iso += 'Z';
  }

  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

/**
 * Decodes standard and numeric XML character entities
 */
export function decodeXmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCharCode(code) : _;
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : _;
    });
}

export class EpgService {
  private static instance: EpgService;
  // Map of channelId (lowercase) -> list of programmes sorted by start time
  private scheduleMap: Map<string, EpgProgramme[]> = new Map();
  private lastRefreshedAt: number = 0;
  private isIngesting: boolean = false;

  private constructor() {}

  public static getInstance(): EpgService {
    if (!EpgService.instance) {
      EpgService.instance = new EpgService();
    }
    return EpgService.instance;
  }

  /**
   * Fast regular expression-based XMLTV parser for low memory footprint
   */
  public ingestXmltv(xmlContent: string, sourcePriority = 10): number {
    let count = 0;
    const programmeRegex = /<programme\s+([^>]+)>([\s\S]*?)<\/programme>/gi;
    let match: RegExpExecArray | null;

    while ((match = programmeRegex.exec(xmlContent)) !== null) {
      const attributesStr = match[1];
      const bodyStr = match[2];

      const startAttr = attributesStr.match(/start=["']([^"']+)["']/i)?.[1];
      const stopAttr = attributesStr.match(/stop=["']([^"']+)["']/i)?.[1];
      const channelAttr = attributesStr.match(/channel=["']([^"']+)["']/i)?.[1];

      if (!channelAttr || !startAttr) continue;

      const titleMatch = bodyStr.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descMatch = bodyStr.match(/<desc[^>]*>([^<]+)<\/desc>/i);
      const categoryMatches = [...bodyStr.matchAll(/<category[^>]*>([^<]+)<\/category>/gi)].map((m) => decodeXmlEntities(m[1].trim()));

      const startIso = parseXmltvDate(startAttr);
      const stopIso = parseXmltvDate(stopAttr) || (startIso ? new Date(Date.parse(startIso) + 3600000).toISOString() : null);

      if (!startIso || !stopIso) continue;

      const programme: EpgProgramme = {
        channelId: channelAttr.trim(),
        title: titleMatch ? decodeXmlEntities(titleMatch[1].trim()) : 'Live Broadcast',
        desc: descMatch ? decodeXmlEntities(descMatch[1].trim()) : undefined,
        start: startIso,
        stop: stopIso,
        category: categoryMatches.length > 0 ? categoryMatches : undefined,
        sourcePriority
      };

      this.addProgramme(programme);
      count++;
    }

    this.purgeExpired();
    return count;
  }

  public addProgramme(programme: EpgProgramme) {
    const key = programme.channelId.toLowerCase();
    const existing = this.scheduleMap.get(key) || [];

    // Avoid duplicate programmes with identical start timestamp
    const isDuplicate = existing.some((p) => p.start === programme.start);
    if (!isDuplicate) {
      existing.push(programme);
      existing.sort((a, b) => a.start.localeCompare(b.start));
      this.scheduleMap.set(key, existing);
    }
  }

  /**
   * Fetches external XMLTV endpoints and loads them into the EPG index
   */
  public async fetchAndIngestFeeds(urls: string[]): Promise<{ ingestedCount: number; channelsCount: number }> {
    if (this.isIngesting) {
      return { ingestedCount: 0, channelsCount: this.scheduleMap.size };
    }

    this.isIngesting = true;
    let totalIngested = 0;

    try {
      for (const url of urls) {
        try {
          logger.info(`Fetching EPG XMLTV feed from: ${url}`);
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 20000);

          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeout);

          if (res.ok) {
            const xmlText = await res.text();
            const ingested = this.ingestXmltv(xmlText);
            totalIngested += ingested;
            logger.info(`Ingested ${ingested} programmes from ${url}`);
          } else {
            logger.warn(`EPG Feed returned ${res.status}: ${url}`);
          }
        } catch (feedErr: any) {
          logger.error(`Failed to ingest EPG feed ${url}`, feedErr);
        }
      }
      this.lastRefreshedAt = Date.now();
    } finally {
      this.isIngesting = false;
    }

    return {
      ingestedCount: totalIngested,
      channelsCount: this.scheduleMap.size
    };
  }

  /**
   * Returns Now and Next programme information for the specified channel IDs
   */
  public getNowNext(channelIds: string[]): Record<string, NowNextProgrammes> {
    const result: Record<string, NowNextProgrammes> = {};
    const nowIso = new Date().toISOString();

    for (const rawId of channelIds) {
      const key = rawId.toLowerCase();
      const programmes = this.scheduleMap.get(key) || [];

      if (programmes.length === 0) {
        // Synthesize standby live broadcast window if no schedule is loaded yet
        const nowMs = Date.now();
        const start = new Date(nowMs - (nowMs % 1800000)).toISOString(); // round to previous half-hour
        const stop = new Date(Date.parse(start) + 3600000).toISOString();
        const nextStop = new Date(Date.parse(stop) + 3600000).toISOString();

        result[rawId] = {
          now: {
            channelId: rawId,
            title: 'Live Transmission',
            desc: 'Regular continuous broadcast',
            start,
            stop,
            sourcePriority: 1
          },
          next: {
            channelId: rawId,
            title: 'Upcoming Broadcast',
            desc: 'Scheduled programming',
            start: stop,
            stop: nextStop,
            sourcePriority: 1
          }
        };
        continue;
      }

      // Find current programme (start <= now < stop)
      const nowProg = programmes.find((p) => p.start <= nowIso && p.stop > nowIso) || programmes[0];
      // Find next programme (start >= nowProg.stop or start > nowIso)
      const nextProg = programmes.find((p) => p.start >= nowProg.stop) || programmes[1];

      result[rawId] = {
        now: nowProg,
        next: nextProg
      };
    }

    return result;
  }

  /**
   * Returns schedule for a specific channel for up to `hoursAhead`
   */
  public getSchedule(channelId: string, hoursAhead = 24): EpgProgramme[] {
    const key = channelId.toLowerCase();
    const programmes = this.scheduleMap.get(key) || [];
    const nowIso = new Date().toISOString();
    const cutoffIso = new Date(Date.now() + hoursAhead * 3600000).toISOString();

    return programmes.filter((p) => p.stop > nowIso && p.start < cutoffIso);
  }

  /**
   * Removes programmes older than cutoff hours to maintain lean memory footprint
   */
  public purgeExpired(retentionHours = 6) {
    const cutoffIso = new Date(Date.now() - retentionHours * 3600000).toISOString();
    for (const [key, programmes] of this.scheduleMap.entries()) {
      const filtered = programmes.filter((p) => p.stop >= cutoffIso);
      if (filtered.length > 0) {
        this.scheduleMap.set(key, filtered);
      } else {
        this.scheduleMap.delete(key);
      }
    }
  }

  public getStats() {
    let totalProgrammes = 0;
    for (const p of this.scheduleMap.values()) {
      totalProgrammes += p.length;
    }
    return {
      channelsWithSchedule: this.scheduleMap.size,
      totalProgrammes,
      lastRefreshedAt: this.lastRefreshedAt ? new Date(this.lastRefreshedAt).toISOString() : null,
      isIngesting: this.isIngesting
    };
  }
}

export const epgService = EpgService.getInstance();
