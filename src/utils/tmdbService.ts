/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Basic title cleaner to remove common IPTV tags from VOD names
export function cleanVodTitle(rawTitle: string): string {
  let title = rawTitle;
  // Remove quality tags
  title = title.replace(/\b(4K|HD|FHD|UHD|1080p|720p|SD)\b/ig, '');
  // Remove years in parentheses or brackets (e.g. (2021) or [2022])
  title = title.replace(/[\(\[]\d{4}[\)\]]/g, '');
  // Remove language or region tags like [EN], (US), [Latino]
  title = title.replace(/\[[A-Za-z]+\]/g, '');
  // Remove file extensions if any
  title = title.replace(/\.(mp4|mkv|avi)$/i, '');
  
  return title.trim().replace(/\s{2,}/g, ' '); // collapse extra spaces
}

export interface TmdbResult {
  id: number;
  title?: string; // Movie
  name?: string;  // TV
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string; // Movie
  first_air_date?: string; // TV
}

export async function fetchTmdbMetadata(
  title: string,
  apiKey: string,
  type: 'movie' | 'tv' = 'movie'
): Promise<TmdbResult | null> {
  if (!apiKey || !title) return null;
  
  const cleanName = cleanVodTitle(title);
  const endpoint = type === 'movie' ? '/search/movie' : '/search/tv';
  const url = `https://api.themoviedb.org/3${endpoint}?query=${encodeURIComponent(cleanName)}&api_key=${apiKey}&language=en-US&page=1&include_adult=false`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0]; // Return the best match
    }
    return null;
  } catch (error) {
    console.error('TMDB Fetch Error:', error);
    return null;
  }
}
