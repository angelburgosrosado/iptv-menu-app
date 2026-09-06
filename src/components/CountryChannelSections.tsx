/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Channel } from '../types/iptv';
import { COUNTRY_NAMES } from '../utils/channelEnrichment';
import { Play, Heart, Smartphone, Globe, Search, Tv } from 'lucide-react';

interface CountryChannelSectionsProps {
  onOpenCinema?: (channel: Channel) => void;
  onPlayInSimulator?: (channel: Channel) => void;
}

export function CountryChannelSections({
  onOpenCinema,
  onPlayInSimulator
}: CountryChannelSectionsProps) {
  const { channels, favorites, toggleFavorite } = usePlayerStore();
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Filter channels based on query
  const filteredChannels = useMemo(() => {
    if (!filterQuery.trim()) return channels;
    const q = filterQuery.toLowerCase();
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.group && c.group.toLowerCase().includes(q)) ||
        (c.countryCode && c.countryCode.toLowerCase().includes(q))
    );
  }, [channels, filterQuery]);

  // Group channels by country
  const countrySections = useMemo(() => {
    const grouped = new Map<string, Channel[]>();
    for (const channel of filteredChannels) {
      const code = (channel.countryCode || channel.tvgCountry || 'UN').toUpperCase();
      const bucket = grouped.get(code) || [];
      bucket.push(channel);
      grouped.set(code, bucket);
    }

    return [...grouped.entries()]
      .map(([code, items]) => ({
        code,
        name: COUNTRY_NAMES[code] || code,
        items: items.sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => {
        // Prioritize US, CA, GB, MX, etc. or sort alphabetically by country name
        if (a.code === 'UN') return 1;
        if (b.code === 'UN') return -1;
        return a.name.localeCompare(b.name);
      });
  }, [filteredChannels]);

  const activeSections = useMemo(() => {
    if (!selectedCountry) return countrySections;
    return countrySections.filter((s) => s.code === selectedCountry);
  }, [countrySections, selectedCountry]);

  return (
    <div className="flex flex-col gap-6">
      {/* Search & Country Quick Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search channels within country groups..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 hover:bg-white/10 focus:bg-zinc-900 border border-white/10 focus:border-blue-500/50 rounded-xl text-xs text-white outline-none placeholder-zinc-500 transition-all"
          />
        </div>

        {/* Country Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCountry(null)}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              !selectedCountry
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200'
            }`}
          >
            All Countries ({countrySections.length})
          </button>
          {countrySections.map((sec) => (
            <button
              key={sec.code}
              onClick={() => setSelectedCountry(sec.code)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCountry === sec.code
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200'
              }`}
            >
              {sec.name} ({sec.items.length})
            </button>
          ))}
        </div>
      </div>

      {/* Country Sections Stream Grid */}
      <div className="space-y-10">
        {activeSections.map((section) => (
          <section key={section.code} id={`country-${section.code.toLowerCase()}`} className="space-y-3">
            {/* Country Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-xs font-bold">
                  {section.code}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {section.name}
                  </h3>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                    ISO-{section.code} Region
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-zinc-400 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                {section.items.length} {section.items.length === 1 ? 'channel' : 'channels'}
              </span>
            </div>

            {/* Channels Grid in Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {section.items.map((channel) => {
                const isFav = favorites.includes(channel.id);
                return (
                  <article
                    key={channel.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-white/5 hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                      <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
                        <img
                          src={channel.logo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60'}
                          alt={`${channel.name} logo`}
                          loading="lazy"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                          {channel.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-zinc-400 truncate">
                            {channel.group || 'General'}
                          </span>
                          {channel.language && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-zinc-500 font-mono">
                              {channel.language}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => toggleFavorite(channel.id)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isFav
                            ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                            : 'bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-white'
                        }`}
                        title={isFav ? 'Remove Favorite' : 'Save Favorite'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      {onOpenCinema && (
                        <button
                          onClick={() => onOpenCinema(channel)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                          title="Watch in Full Web Cinema Player"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Watch</span>
                        </button>
                      )}

                      {onPlayInSimulator && (
                        <button
                          onClick={() => onPlayInSimulator(channel)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all"
                          title="Preview on Phone Simulator"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default CountryChannelSections;
