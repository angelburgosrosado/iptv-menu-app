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

export interface ParserOptions {
  onProgress?: (progress: number) => void;
}

export function parseM3U(m3uContent: string, options?: ParserOptions): Channel[] {
  const { onProgress } = options || {};
  const channels: Channel[] = [];
  const urlSet = new Set<string>();

  if (!m3uContent || !m3uContent.includes('#EXTM3U')) {
    console.warn('Invalid file format. Missing #EXTM3U header.');
    return [];
  }

  const lines = m3uContent.split(/\r?\n/);
  const totalLines = lines.length;
  
  let currentExtinf: {
    tvgId: string;
    logo: string;
    group: string;
    name: string;
  } | null = null;

  for (let i = 0; i < totalLines; i++) {
    const line = lines[i].trim();

    if (onProgress && i % 500 === 0) {
      onProgress(Math.min(99, Math.round((i / totalLines) * 100)));
    }

    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/) || line.match(/tvg-id=([^ ,]*)/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/) || line.match(/tvg-logo=([^ ,]*)/);
      const groupMatch = line.match(/group-title="([^"]*)"/) || line.match(/group-title=([^ \n,]*)/);

      let name = 'Unknown Channel';
      const lastCommaIdx = line.lastIndexOf(',');
      if (lastCommaIdx !== -1) {
        name = line.substring(lastCommaIdx + 1).trim();
      }

      currentExtinf = {
        tvgId: tvgIdMatch ? tvgIdMatch[1].trim() : '',
        logo: logoMatch ? logoMatch[1].trim() : '',
        group: groupMatch ? groupMatch[1].trim() : 'Uncategorized',
        name: name || 'Unknown Channel',
      };
    } else if (line.startsWith('#')) {
      continue;
    } else if (currentExtinf) {
      const isStreamUrl = /^(https?|rtmp|rtsp):\/\/[^\s]+$/i.test(line);
      
      if (isStreamUrl) {
        const streamUrl = line;

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
          });
        }
      }
      currentExtinf = null;
    }
  }

  if (onProgress) onProgress(100);
  return channels;
}