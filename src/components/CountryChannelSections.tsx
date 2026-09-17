/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Channel } from '../types/iptv';
import { 
  COUNTRY_NAMES, 
  COUNTRY_FLAGS, 
  MAJOR_REGIONS, 
  getCountryFlag, 
  getCountriesByRegion, 
  COUNTRIES_BY_CODE,
  normalizeCategory,
  getChannelAvatarDataUri
} from '../utils/channelEnrichment';
import { Play, Heart, Smartphone, Globe, Search, Tv, MapPin } from 'lucide-react';
import { ScrollView as RNScrollView, Text as RNText, View as RNView, Image as RNImage } from 'react-native';
import { ChannelCard } from './ChannelCard';

interface CountryChannelSectionsProps {
  onOpenCinema?: (channel: Channel) => void;
  onPlayInSimulator?: (channel: Channel) => void;
}

export function DesktopCountryChannelSections({
  onOpenCinema,
  onPlayInSimulator
}: CountryChannelSectionsProps) {
  const { channels, favorites, toggleFavorite, selectedRegion, setSelectedRegion } = usePlayerStore();
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
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.countryCode && c.countryCode.toLowerCase().includes(q)) ||
        (c.countryName && c.countryName.toLowerCase().includes(q))
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
      .map(([code, items]) => {
        const countryInfo = COUNTRIES_BY_CODE.get(code);
        const flag = countryInfo?.flag || COUNTRY_FLAGS[code] || getCountryFlag(code);
        return {
          code,
          name: COUNTRY_NAMES[code] || countryInfo?.name || code,
          flag,
          languages: countryInfo?.languages || [],
          items: items.sort((a, b) => a.name.localeCompare(b.name))
        };
      })
      .sort((a, b) => {
        if (a.code === 'UN') return 1;
        if (b.code === 'UN') return -1;
        return a.name.localeCompare(b.name);
      });
  }, [filteredChannels]);

  // Regional filter on country sections
  const regionFilteredSections = useMemo(() => {
    if (!selectedRegion || selectedRegion === 'ALL') return countrySections;
    const countriesInRegion = new Set(getCountriesByRegion(selectedRegion));
    return countrySections.filter((s) => countriesInRegion.has(s.code));
  }, [countrySections, selectedRegion]);

  const activeSections = useMemo(() => {
    if (!selectedCountry) return regionFilteredSections;
    return regionFilteredSections.filter((s) => s.code === selectedCountry);
  }, [regionFilteredSections, selectedCountry]);

  return (
    <div className="flex flex-col gap-6">
      {/* Search & Global Region Navigation Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search channels, genres, or countries..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 hover:bg-white/10 focus:bg-zinc-900 border border-white/10 focus:border-blue-500/50 rounded-xl text-xs text-white outline-none placeholder-zinc-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Globe className="w-4 h-4 text-blue-400" />
            <span>
              <strong className="text-white">{countrySections.length}</strong> active countries indexed
            </span>
          </div>
        </div>

        {/* Global Region Tabs (Americas, Europe, Asia-Pacific, etc.) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {MAJOR_REGIONS.map((region) => {
            const isSelected = (!selectedRegion && region.code === 'ALL') || selectedRegion === region.code;
            return (
              <button
                key={region.code}
                onClick={() => {
                  setSelectedRegion(region.code === 'ALL' ? null : region.code);
                  setSelectedCountry(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                    : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200'
                }`}
              >
                <span>{region.icon}</span>
                <span>{region.name}</span>
              </button>
            );
          })}
        </div>

        {/* Country Filter Pills with Emoji Flags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCountry(null)}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              !selectedCountry
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200'
            }`}
          >
            All {selectedRegion && selectedRegion !== 'ALL' ? selectedRegion : ''} Countries ({regionFilteredSections.length})
          </button>
          {regionFilteredSections.map((sec) => (
            <button
              key={sec.code}
              onClick={() => setSelectedCountry(sec.code)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                selectedCountry === sec.code
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200'
              }`}
            >
              <span className="text-sm leading-none">{sec.flag}</span>
              <span>{sec.name}</span>
              <span className="text-[10px] opacity-70">({sec.items.length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Country Sections Stream Grid */}
      <div className="space-y-10">
        {activeSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <Globe className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400">No channels found in this country or region selection.</p>
          </div>
        ) : (
          activeSections.map((section) => (
            <section key={section.code} id={`country-${section.code.toLowerCase()}`} className="space-y-3">
              {/* Country Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="text-2xl p-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center leading-none">
                    {section.flag || '🌐'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {section.name}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold">
                        {section.code}
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                      <span className="uppercase tracking-wider font-semibold text-zinc-500">
                        ISO-{section.code} Region
                      </span>
                      {section.languages && section.languages.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-zinc-400">
                            Languages: {section.languages.join(', ')}
                          </span>
                        </>
                      )}
                    </div>
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
                  const flag = channel.countryFlag || section.flag || getCountryFlag(channel.countryCode);
                  const displayCat = channel.category || normalizeCategory(channel.group);

                  return (
                    <article
                      key={channel.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-white/5 hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                        <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0 relative">
                          <img
                            src={channel.logo || getChannelAvatarDataUri(channel.name, 80)}
                            alt={`${channel.name} logo`}
                            loading="lazy"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getChannelAvatarDataUri(channel.name, 80);
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                            <span className="text-xs flex-shrink-0">{flag}</span>
                            <span className="truncate">{channel.name}</span>
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-zinc-400 truncate">
                              {displayCat}
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
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
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
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all cursor-pointer"
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
          ))
        )}
      </div>
    </div>
  );
}

export function CountryChannelSections() {
  const { countrySections, searchTerm, selectedCountry, selectedGroup, toggleFavorite } = usePlayerStore();

  const filteredSections = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    return (countrySections || [])
      .filter((section) => !selectedCountry || section.code === selectedCountry)
      .map((section) => ({
        ...section,
        channels: (section.channels || []).filter((channel) => {
          const matchesTerm = !term || [channel.name, channel.group, channel.category, channel.countryName, channel.language]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(term);
          const matchesGroup = !selectedGroup || channel.group === selectedGroup || channel.category === selectedGroup;
          return matchesTerm && matchesGroup;
        })
      }))
      .filter((section) => section.channels.length > 0);
  }, [countrySections, searchTerm, selectedCountry, selectedGroup]);

  return (
    <RNScrollView contentContainerStyle={{ paddingBottom: 140 }}>
      {filteredSections.map((section) => (
        <RNView key={section.code} style={{ marginBottom: 28 }}>
          <RNView style={{ marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <RNView>
              <RNText style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>
                {section.flag ? `${section.flag} ` : ''}{section.name}
              </RNText>
              <RNText style={{ color: 'rgba(255,255,255,0.64)', fontSize: 13 }}>{section.channelCount} available channels</RNText>
            </RNView>
            <RNView style={{ flexDirection: 'row', gap: 6 }}>
              {(section.featuredLogos || []).map((logo) => (
                <RNImage key={logo} source={{ uri: logo }} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#11161d' }} />
              ))}
            </RNView>
          </RNView>
          <RNView style={{ gap: 10 }}>
            {section.channels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} onPress={() => toggleFavorite(channel.id)} />
            ))}
          </RNView>
        </RNView>
      ))}
    </RNScrollView>
  );
}

export default DesktopCountryChannelSections;
