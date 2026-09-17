/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'node:http';
import https from 'node:https';
import { isSafeTargetUrl, DEFAULT_UPSTREAM_USER_AGENT } from './streamProxyService';
import { Logger } from '@iptv-menu/logging';

const logger = new Logger('logo-proxy');

export interface LogoCacheEntry {
  buffer: Buffer;
  contentType: string;
  cachedAt: number;
}

// 12-hour TTL in-memory cache for downloaded logos
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const logoCache = new Map<string, LogoCacheEntry>();

// Deterministic curated gradients for initials-based SVG avatars
const GRADIENT_PALETTES = [
  ['#3b82f6', '#1d4ed8'], // Blue
  ['#8b5cf6', '#6d28d9'], // Purple
  ['#ec4899', '#be185d'], // Pink
  ['#06b6d4', '#0e7490'], // Cyan
  ['#10b981', '#047857'], // Emerald
  ['#f59e0b', '#b45309'], // Amber
  ['#6366f1', '#4338ca'], // Indigo
  ['#14b8a6', '#0f766e'], // Teal
  ['#f43f5e', '#be123c'], // Rose
];

/**
 * Deterministically pick a color palette based on channel name
 */
export function getPaletteForName(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[idx] as [string, string];
}

/**
 * Extract 1 to 3 uppercase initials from channel name
 */
export function extractInitials(name: string): string {
  if (!name || !name.trim()) return 'TV';
  const clean = name.replace(/[^\w\s]/gi, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'TV';
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/**
 * Generate a high-resolution SVG fallback avatar with dynamic gradient and typography
 */
export function generateLogoSvg(name: string, size = 120): string {
  const [startColor, endColor] = getPaletteForName(name);
  const initials = extractInitials(name);
  const fontSize = Math.round(size * 0.38);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${startColor}" />
      <stop offset="100%" stop-color="${endColor}" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#grad)" />
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
  <text x="50%" y="54%" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="900" fill="#ffffff" letter-spacing="1" text-anchor="middle" dominant-baseline="middle" filter="url(#shadow)">
    ${initials}
  </text>
</svg>`;
}

/**
 * Fetch remote logo image with caching and timeout
 */
export async function fetchAndCacheLogo(logoUrl: string): Promise<LogoCacheEntry | null> {
  const cached = logoCache.get(logoUrl);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  const check = isSafeTargetUrl(logoUrl);
  if (!check.safe) {
    logger.warn(`Logo proxy blocked unsafe URL: ${logoUrl} (${check.reason})`);
    return null;
  }

  return new Promise((resolve) => {
    try {
      const parsed = check.parsedUrl || new URL(logoUrl);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;

      const req = client.get(
        parsed.href,
        {
          headers: {
            'User-Agent': DEFAULT_UPSTREAM_USER_AGENT,
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
          timeout: 6000,
        },
        (res) => {
          if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
            // Handle one level of redirect
            fetchAndCacheLogo(res.headers.location).then(resolve);
            return;
          }

          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            resolve(null);
            return;
          }

          const contentType = res.headers['content-type'] || 'image/png';
          const chunks: Buffer[] = [];
          let totalBytes = 0;

          res.on('data', (chunk) => {
            totalBytes += chunk.length;
            // Limit logo size to 5MB to avoid memory abuse
            if (totalBytes <= 5 * 1024 * 1024) {
              chunks.push(chunk);
            }
          });

          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const entry: LogoCacheEntry = {
              buffer,
              contentType,
              cachedAt: Date.now(),
            };

            // Maintain max entries bound
            if (logoCache.size >= MAX_CACHE_ENTRIES) {
              const firstKey = logoCache.keys().next().value;
              if (firstKey) logoCache.delete(firstKey);
            }

            logoCache.set(logoUrl, entry);
            resolve(entry);
          });
        }
      );

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Clear the logo cache (for testing or administrative reset)
 */
export function clearLogoCache(): void {
  logoCache.clear();
}
