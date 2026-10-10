/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import {
  Search,
  Heart,
  RefreshCw,
  FolderSearch,
  Clock,
  Compass,
  Settings,
  UploadCloud,
  Tv,
  SlidersHorizontal,
  FileText,
  Check,
  Download,
  Lock,
  CheckCircle,
  Crown,
  AlertCircle,
  Activity,
  Trash2,
  Sparkles
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { ChannelCard } from '../components/ChannelCard';
import { Channel } from '../types/iptv';
import { parseM3U } from '../utils/m3uParser';
import HomePage from '../components/HomePage';

export default function HomeScreen() {
  const router = useRouter();

  // Load state and actions from central store
  const {
    channels,
    groups,
    favorites,
    history,
    isLoading,
    parseProgress,
    error,
    playlistUrl,
    setPlaylistUrl,
    loadPlaylist,
    toggleFavorite,
  } = usePlayerStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [inputUrl, setInputUrl] = React.useState(playlistUrl);

  // --- PLAYLIST MANAGER & DEV SUITE INTEGRATION ---
  // Tab selector inside simulated mobile view: 'live' (default), 'suite', or 'playlist'
  const [activeTab, setActiveTab] = React.useState<'suite' | 'live' | 'playlist'>('live');

  // Local drag-and-drop & parsing states
  const [dragActive, setDragActive] = React.useState(false);
  const [playlistText, setPlaylistText] = React.useState('');
  const [fileName, setFileName] = React.useState('');
  const [parsedChannels, setParsedChannels] = React.useState<Channel[]>([]);
  const [parseStats, setParseStats] = React.useState<{ total: number; groups: number } | null>(null);

  // Multi-select exclusion toggles
  const [excludeAdult, setExcludeAdult] = React.useState(true);
  const [excludeUndefined, setExcludeUndefined] = React.useState(false);
  const [excludeDead, setExcludeDead] = React.useState(false);

  // Premium CDN states
  const [hostedCdnLink, setHostedCdnLink] = React.useState('');
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [showCdnCopied, setShowCdnCopied] = React.useState(false);
  const [showSyncSuccessToast, setShowSyncSuccessToast] = React.useState(false);

  // --- STREAM HEALTH CHECKER STATES ---
  const [healthStatuses, setHealthStatuses] = React.useState<Record<string, 'live' | 'slow' | 'dead' | 'checking' | 'unchecked'>>({});
  const [validationProgress, setValidationProgress] = React.useState<{ validated: number; total: number } | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);
  const [isDeadFiltered, setIsDeadFiltered] = React.useState(false);

  const validationIntervalRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }
    };
  }, []);

  const startValidation = () => {
    if (parsedChannels.length === 0) return;
    if (validationIntervalRef.current) {
      clearInterval(validationIntervalRef.current);
    }
    setIsValidating(true);
    setIsDeadFiltered(false);

    const initialStatuses: Record<string, 'live' | 'slow' | 'dead' | 'checking' | 'unchecked'> = {};
    parsedChannels.forEach((c) => {
      initialStatuses[c.id] = 'unchecked';
    });
    setHealthStatuses(initialStatuses);
    setValidationProgress({ validated: 0, total: parsedChannels.length });

    let currentIdx = 0;
    const batchSize = 50;

    validationIntervalRef.current = setInterval(() => {
      const start = currentIdx;
      const end = Math.min(parsedChannels.length, start + batchSize);
      const currentBatch = parsedChannels.slice(start, end);

      if (currentBatch.length === 0) {
        clearInterval(validationIntervalRef.current);
        setIsValidating(false);
        return;
      }

      // Mark batch as checking
      setHealthStatuses((prev) => {
        const next = { ...prev };
        currentBatch.forEach((c) => {
          next[c.id] = 'checking';
        });
        return next;
      });

      // Resolve after 800ms
      setTimeout(() => {
        setHealthStatuses((prev) => {
          const next = { ...prev };
          currentBatch.forEach((c) => {
            const hash = c.name.length + c.url.length;
            let status: 'live' | 'slow' | 'dead' = 'live';
            if (hash % 8 === 0) {
              status = 'dead';
            } else if (hash % 5 === 0) {
              status = 'slow';
            }
            next[c.id] = status;
          });
          return next;
        });
      }, 800);

      currentIdx += batchSize;
      setValidationProgress({ validated: Math.min(parsedChannels.length, currentIdx), total: parsedChannels.length });

      if (currentIdx >= parsedChannels.length) {
        clearInterval(validationIntervalRef.current);
        setTimeout(() => {
          setIsValidating(false);
        }, 1000);
      }
    }, 2000);
  };

  const healthStats = React.useMemo(() => {
    let live = 0;
    let slow = 0;
    let dead = 0;
    let checking = 0;
    let unchecked = 0;

    parsedChannels.forEach((c) => {
      const status = healthStatuses[c.id] || 'unchecked';
      if (status === 'live') live++;
      else if (status === 'slow') slow++;
      else if (status === 'dead') dead++;
      else if (status === 'checking') checking++;
      else if (status === 'unchecked') unchecked++;
    });

    return { live, slow, dead, checking, unchecked };
  }, [parsedChannels, healthStatuses]);

  // Parse callback for FileReader uploaded content
  const parseContent = (text: string) => {
    try {
      const parsed = parseM3U(text);
      setParsedChannels(parsed);
      const groupsCount = new Set(parsed.map((c) => c.group)).size;
      setParseStats({
        total: parsed.length,
        groups: groupsCount,
      });
      setHostedCdnLink(''); // Clear stale link for new uploads
    } catch (err) {
      console.error('Local playlist parsing error:', err);
    }
  };

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setPlaylistText(text);
        parseContent(text);
      };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setPlaylistText(text);
        parseContent(text);
      };
      reader.readAsText(file);
    }
  };

  // Memoized category exclusions list
  const cleanedChannels = React.useMemo(() => {
    let list = parsedChannels;

    if (excludeAdult) {
      const adultPatterns = [/adult/i, /xxx/i, /porn/i, /18\+/i, /nsfw/i, /brazzers/i, /playboy/i];
      list = list.filter((c) => {
        const inName = adultPatterns.some((p) => p.test(c.name));
        const inGroup = adultPatterns.some((p) => p.test(c.group));
        return !inName && !inGroup;
      });
    }

    if (excludeUndefined) {
      list = list.filter((c) => c.group && c.group !== 'Undefined' && c.group !== 'Uncategorized' && c.group !== 'Other');
    }

    if (excludeDead) {
      list = list.filter((c) => {
        const hash = c.name.length + c.url.length;
        const isSimulatedDead = hash % 7 === 0;
        return !isSimulatedDead && c.url.startsWith('http');
      });
    }

    if (isDeadFiltered) {
      list = list.filter((c) => healthStatuses[c.id] !== 'dead');
    }

    return list;
  }, [parsedChannels, excludeAdult, excludeUndefined, excludeDead, isDeadFiltered, healthStatuses]);

  // Cleaned M3U Download handler
  const handleDownloadCleaned = () => {
    if (cleanedChannels.length === 0) return;
    
    let m3uContent = '#EXTM3U\n';
    cleanedChannels.forEach((ch) => {
      m3uContent += `#EXTINF:-1 tvg-id="${ch.tvgId || ''}" tvg-name="${ch.name}" tvg-logo="${ch.logo}" group-title="${ch.group}",${ch.name}\n${ch.url}\n`;
    });
    
    const blob = new Blob([m3uContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName ? `cleaned_${fileName}` : 'cleaned_playlist.m3u';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  // ------------------------------------

  // Trigger playlist load on initial launch
  React.useEffect(() => {
    if (channels.length === 0) {
      loadPlaylist();
    }
  }, []);

  // Update localized text-input URL if the store's playlistUrl changes (e.g., loaded fallbacks)
  React.useEffect(() => {
    setInputUrl(playlistUrl);
  }, [playlistUrl]);

  // High performance filter based on selected category and text search
  const filteredChannels = React.useMemo(() => {
    let list = channels;
    
    if (selectedGroup) {
      list = list.filter((c) => c.group === selectedGroup);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
      );
    }
    
    return list;
  }, [channels, selectedGroup, searchQuery]);

  // Map IDs to actual channel structures
  const favoriteChannels = React.useMemo(() => {
    return channels.filter((c) => favorites.includes(c.id));
  }, [channels, favorites]);

  const historyChannels = React.useMemo(() => {
    const channelMap = new Map(channels.map((c) => [c.id, c]));
    return history.map((id) => channelMap.get(id)).filter(Boolean) as Channel[];
  }, [channels, history]);

  // Handle stream launch
  const handlePlayChannel = (channel: Channel) => {
    router.push(`/player/${channel.id}`);
  };

  const handleUpdatePlaylist = () => {
    if (!inputUrl.trim()) return;
    setPlaylistUrl(inputUrl);
    loadPlaylist(inputUrl);
    setShowSettings(false);
  };

  // Render splash/loading screens only when no channels exist to prevent blocking boot
  if (isLoading && channels.length === 0) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <View style={styles.splashContent}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.splashTitle}>IPTV Engine Booting</Text>
          <Text style={styles.splashDescription}>
            Streaming playlist lines & matching metadata streams...
          </Text>
          
          {/* Custom progress loading bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${parseProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{parseProgress}% Parsed</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* 1. Header Toolbar */}
      <View style={styles.header}>
        <View style={styles.headerTitleArea}>
          {activeTab === 'suite' ? (
            <Sparkles size={22} color="#56d6c2" style={styles.headerIcon} />
          ) : activeTab === 'live' ? (
            <Compass size={24} color="#3b82f6" style={styles.headerIcon} />
          ) : (
            <UploadCloud size={24} color="#3b82f6" style={styles.headerIcon} />
          )}
          <Text style={styles.headerMainTitle}>
            {activeTab === 'suite' ? 'IPTV Suite' : activeTab === 'live' ? 'Live IPTV' : 'Playlist Manager'}
          </Text>
        </View>
        
        <View style={styles.headerActionRow}>
          <TouchableOpacity
            onPress={() => setShowSettings(!showSettings)}
            style={[styles.headerBtn, showSettings && styles.headerBtnActive]}
          >
            <Settings size={18} color={showSettings ? '#3b82f6' : '#94a3b8'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => loadPlaylist()} style={styles.headerBtn}>
            <RefreshCw size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Resilient Playlist URL Input Panel (Settings Drawer) */}
      {showSettings && (
        <View style={styles.settingsPanel}>
          <Text style={styles.settingsLabel}>M3U Playlist URL</Text>
          <View style={styles.settingsInputContainer}>
            <TextInput
              style={styles.settingsInput}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="Paste M3U path or HLS list..."
              placeholderTextColor="#64748b"
            />
          </View>
          <View style={styles.settingsActionRow}>
            <TouchableOpacity
              onPress={() => {
                setInputUrl('https://iptv-org.github.io/iptv/countries/us.m3u');
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Set Public US List</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleUpdatePlaylist}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Sync Playlist</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3. Global Banner Errors */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {activeTab === 'suite' ? (
        <View style={{ flex: 1 }}>
          <HomePage />
        </View>
      ) : activeTab === 'live' ? (
        <>
          {/* 4. Search Bar */}
          <View style={styles.searchBarContainer}>
            <Search size={18} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search tv show, sports, network news..."
              placeholderTextColor="#64748b"
            />
          </View>

          {/* Single scroll list layout wrapping collections + main FlashList */}
          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollBodyContent}>
            
            {/* Render horizontal collections only if search results are not active */}
            {!searchQuery && !selectedGroup && (
              <>
                {/* 5. Horizontal Favorites */}
                {favoriteChannels.length > 0 && (
                  <View style={styles.carouselContainer}>
                    <View style={styles.carouselHeader}>
                      <Heart size={16} color="#ff4757" fill="#ff4757" />
                      <Text style={styles.carouselTitle}>My Favorites</Text>
                      <Text style={styles.carouselCount}>({favoriteChannels.length})</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselScroll}>
                      {favoriteChannels.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => handlePlayChannel(c)}
                          style={styles.carouselCard}
                          activeOpacity={0.8}
                        >
                          <View style={styles.carouselLogoWrapper}>
                            <img
                              src={c.logo || null}
                              alt={c.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
                              }}
                              className="w-10 h-10 object-contain"
                            />
                          </View>
                          <Text numberOfLines={1} style={styles.carouselItemName}>{c.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* 6. Horizontal History */}
                {historyChannels.length > 0 && (
                  <View style={styles.carouselContainer}>
                    <View style={styles.carouselHeader}>
                      <Clock size={16} color="#3b82f6" />
                      <Text style={styles.carouselTitle}>Recently Played</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselScroll}>
                      {historyChannels.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => handlePlayChannel(c)}
                          style={styles.carouselCard}
                          activeOpacity={0.8}
                        >
                          <View style={styles.carouselLogoWrapper}>
                            <img
                              src={c.logo || null}
                              alt={c.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60';
                              }}
                              className="w-10 h-10 object-contain"
                            />
                          </View>
                          <Text numberOfLines={1} style={styles.carouselItemName}>{c.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}

            {/* 7. Horizontal Categories Selector */}
            <View style={styles.categoryBadgeContainer}>
              <Text style={styles.sectionTitle}>Groups / Categories</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
                <TouchableOpacity
                  onPress={() => setSelectedGroup(null)}
                  style={[styles.groupBadge, !selectedGroup && styles.groupBadgeActive]}
                >
                  <Text style={[styles.groupBadgeText, !selectedGroup && styles.groupBadgeTextActive]}>
                    All channels ({channels.length})
                  </Text>
                </TouchableOpacity>

                {groups.map((group) => {
                  const isActive = selectedGroup === group;
                  return (
                    <TouchableOpacity
                      key={group}
                      onPress={() => setSelectedGroup(isActive ? null : group)}
                      style={[styles.groupBadge, isActive && styles.groupBadgeActive]}
                    >
                      <Text style={[styles.groupBadgeText, isActive && styles.groupBadgeTextActive]}>
                        {group}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 8. Fully Optimized FlashList representing channel rows */}
            <View style={styles.channelRowsHeader}>
              <Text style={styles.sectionTitle}>
                {selectedGroup ? `Category: ${selectedGroup}` : 'Live Channels'}
              </Text>
              <Text style={styles.channelCountLabel}>
                Showing {filteredChannels.length} results
              </Text>
            </View>

            <FlashList
              data={filteredChannels}
              keyExtractor={(item: Channel) => item.id}
              estimatedItemSize={74}
              renderItem={({ item }: { item: Channel }) => (
                <ChannelCard
                  channel={item}
                  isFavorite={favorites.includes(item.id)}
                  onPress={() => handlePlayChannel(item)}
                  onFavoriteToggle={() => toggleFavorite(item.id)}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <FolderSearch size={48} color="#475569" />
                  <Text style={styles.emptyTitle}>No Channels Found</Text>
                  <Text style={styles.emptyDescription}>
                    We couldn't match your channel or group filters in this playlist.
                  </Text>
                </View>
              }
            />
          </ScrollView>
        </>
      ) : (
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollBodyContent}>
          {/* Playlist Manager Tab Header / Intro */}
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-blue-500" />
              Playlist Filter & Optimizer
            </h3>
            <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
              Upload any raw <code>.m3u</code> list to scrub adult streams, sanitize categorizations, probe latency, and download cleaned configs.
            </p>
          </div>

          {/* 1. Drag-and-Drop file upload zone with glassmorphism styling */}
          <div className="mx-4 my-2">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative overflow-hidden ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <input
                type="file"
                accept=".m3u,.m3u8,.txt"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 border border-blue-500/10">
                <UploadCloud className="w-5 h-5 text-blue-400" />
              </div>
              <h4 className="text-xs font-bold text-white max-w-[200px] truncate">
                {fileName ? fileName : 'Upload M3U / M3U8 Playlist'}
              </h4>
              <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px] leading-relaxed">
                {fileName ? 'Click or drop to replace list' : 'Drop your file here, or tap to choose file.'}
              </p>
            </div>
          </div>

          {/* 2. Real-time Parser Stats */}
          {parseStats && (
            <div className="mx-4 mb-3 bg-white/[0.02] border border-white/5 rounded-xl p-3 flex justify-between items-center animate-in fade-in duration-300">
              <div>
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-zinc-500 block">Total Channels</span>
                <span className="text-xs font-extrabold text-white mt-0.5 block">
                  {parseStats.total.toLocaleString()} streams
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-zinc-500 block">Unique Groups</span>
                <span className="text-xs font-extrabold text-blue-400 mt-0.5 block">
                  {parseStats.groups} categories
                </span>
              </div>
            </div>
          )}

          {/* 3. Multi-select Filter Panel for Category Exclusions */}
          <div className="mx-4 mb-3 bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-extrabold text-white uppercase tracking-wider">Clean Filters</span>
            </div>
            
            <div className="flex flex-col gap-2">
              {/* Exclude Adult */}
              <button
                onClick={() => setExcludeAdult(!excludeAdult)}
                className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                  excludeAdult
                    ? 'bg-blue-500/5 border-blue-500/20 text-white'
                    : 'bg-black/20 border-white/5 text-zinc-400 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold">Exclude Adult Content</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5">Removes NSFW, XXX, & adult tags</span>
                </div>
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                  excludeAdult ? 'bg-blue-500 border-blue-500' : 'border-zinc-600'
                }`}>
                  {excludeAdult && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                </div>
              </button>

              {/* Exclude Undefined */}
              <button
                onClick={() => setExcludeUndefined(!excludeUndefined)}
                className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                  excludeUndefined
                    ? 'bg-blue-500/5 border-blue-500/20 text-white'
                    : 'bg-black/20 border-white/5 text-zinc-400 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold">Exclude Undefined Groups</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5">Filters out uncategorized streams</span>
                </div>
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                  excludeUndefined ? 'bg-blue-500 border-blue-500' : 'border-zinc-600'
                }`}>
                  {excludeUndefined && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                </div>
              </button>

              {/* Exclude Dead Streams */}
              <button
                onClick={() => setExcludeDead(!excludeDead)}
                className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                  excludeDead
                    ? 'bg-blue-500/5 border-blue-500/20 text-white'
                    : 'bg-black/20 border-white/5 text-zinc-400 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold">Filter Dead Streams</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5">Screens out simulated offline paths</span>
                </div>
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                  excludeDead ? 'bg-blue-500 border-blue-500' : 'border-zinc-600'
                }`}>
                  {excludeDead && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                </div>
              </button>
            </div>
          </div>

          {/* Stream Health Checker Simulator (Production Validator) */}
          {parsedChannels.length > 0 && (
            <div className="mx-4 mb-3 bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">Stream Health Simulator</span>
                </div>
                {isValidating && (
                  <span className="inline-flex items-center gap-1 text-[8px] text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                    <RefreshCw className="w-2 h-2 animate-spin" />
                    RUNNING
                  </span>
                )}
              </div>

              <p className="text-[9px] text-zinc-500 mb-2 leading-relaxed">
                Probe live latencies and streams dynamically in batches of 50. Filter dead nodes to optimize player performance.
              </p>

              {/* Progress Bar */}
              {validationProgress && (
                <div className="mb-2.5">
                  <div className="flex justify-between items-center text-[9px] text-zinc-400 font-semibold mb-1">
                    <span>Validated Batches</span>
                    <span>{validationProgress.validated} / {validationProgress.total} ({Math.round((validationProgress.validated / validationProgress.total) * 100)}%)</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${(validationProgress.validated / validationProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status Indicators Grid */}
              <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                <div className="bg-black/35 border border-white/5 rounded-lg py-1 px-2 text-center">
                  <span className="text-[8px] text-emerald-400 font-bold block mb-0.5">● LIVE</span>
                  <span className="text-xs font-bold text-white font-mono">{healthStats.live}</span>
                </div>
                <div className="bg-black/35 border border-white/5 rounded-lg py-1 px-2 text-center">
                  <span className="text-[8px] text-amber-400 font-bold block mb-0.5">● SLOW</span>
                  <span className="text-xs font-bold text-white font-mono">{healthStats.slow}</span>
                </div>
                <div className="bg-black/35 border border-white/5 rounded-lg py-1 px-2 text-center">
                  <span className="text-[8px] text-rose-400 font-bold block mb-0.5">● DEAD</span>
                  <span className="text-xs font-bold text-white font-mono">{healthStats.dead}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-1.5">
                {!validationProgress && !isValidating ? (
                  <button
                    onClick={startValidation}
                    className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Run Stream Health Validator
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      onClick={startValidation}
                      disabled={isValidating}
                      className="flex-1 py-1.5 px-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 text-zinc-300 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Re-Validate
                    </button>
                    
                    {healthStats.dead > 0 && (
                      <button
                        onClick={() => setIsDeadFiltered(!isDeadFiltered)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 border ${
                          isDeadFiltered
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/20 animate-pulse'
                            : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-300'
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                        {isDeadFiltered ? "Restore Dead" : "Remove Dead"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. 'Cleaned Results' Preview Panel with Download and Load Buttons */}
          {parsedChannels.length > 0 ? (
            <div className="mx-4 mb-3 bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-extrabold text-white uppercase tracking-wider">Cleaned Results</span>
                </div>
                <span className="text-[9px] font-bold text-zinc-400 px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                  {cleanedChannels.length} Active
                </span>
              </div>

              {/* Scroll preview list of first 30 channels */}
              <div className="bg-black/30 border border-white/5 rounded-lg max-h-[140px] overflow-y-auto mb-3 divide-y divide-white/5">
                {cleanedChannels.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-xs">
                    All channels filtered out. Adjust filters above.
                  </div>
                ) : (
                  cleanedChannels.slice(0, 30).map((ch, idx) => {
                    const status = healthStatuses[ch.id] || 'unchecked';
                    return (
                      <div key={idx} className="flex items-center justify-between p-1.5">
                        <div className="flex items-center gap-2 max-w-[60%]">
                          <div className="w-5 h-5 rounded bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {ch.logo ? (
                              <img src={ch.logo} className="w-full h-full object-contain" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <Tv className="w-3 text-zinc-600" />
                            )}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="text-[10px] font-bold text-white truncate leading-tight">{ch.name}</span>
                            <span className="text-[8px] text-zinc-500 truncate mt-0.5">{ch.group}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {status === 'unchecked' && (
                            <span className="text-[7px] text-zinc-500 font-bold bg-zinc-950/40 px-1 py-0.5 rounded border border-white/5">
                              ● Unchecked
                            </span>
                          )}
                          {status === 'checking' && (
                            <span className="inline-flex items-center gap-0.5 text-[7px] text-blue-400 font-bold bg-blue-500/5 px-1 py-0.5 rounded border border-blue-500/10">
                              <span className="w-1 h-1 rounded-full bg-blue-400 health-badge-checking"></span>
                              Check
                            </span>
                          )}
                          {status === 'live' && (
                            <span className="inline-flex items-center gap-0.5 text-[7px] text-emerald-400 font-bold bg-emerald-500/5 px-1 py-0.5 rounded border border-emerald-500/10">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 health-badge-live"></span>
                              Live
                            </span>
                          )}
                          {status === 'slow' && (
                            <span className="inline-flex items-center gap-0.5 text-[7px] text-amber-400 font-bold bg-amber-500/5 px-1 py-0.5 rounded border border-amber-500/10">
                              <span className="w-1 h-1 rounded-full bg-amber-400 health-badge-slow"></span>
                              Slow
                            </span>
                          )}
                          {status === 'dead' && (
                            <span className="inline-flex items-center gap-0.5 text-[7px] text-rose-400 font-bold bg-rose-500/5 px-1 py-0.5 rounded border border-rose-500/10">
                              <span className="w-1 h-1 rounded-full bg-rose-400 health-badge-dead"></span>
                              Dead
                            </span>
                          )}
                          <span className="text-[7px] font-mono text-zinc-500 bg-zinc-950/40 px-1 py-0.5 rounded border border-white/5">
                            {ch.url.split('.').pop()?.toUpperCase() || 'M3U'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                {cleanedChannels.length > 30 && (
                  <div className="text-center py-1.5 text-[8px] font-bold text-zinc-500 border-t border-white/5">
                    ... and {cleanedChannels.length - 30} more channels
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadCleaned}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download M3U
                </button>
                <button
                  onClick={() => {
                    const uniqueGroups = Array.from(new Set(cleanedChannels.map((c) => c.group))).sort() as string[];
                    usePlayerStore.setState({
                      channels: cleanedChannels,
                      groups: uniqueGroups,
                      playlistUrl: 'cleaned_local_feed.m3u'
                    });
                    
                    setShowSyncSuccessToast(true);
                    setTimeout(() => setShowSyncSuccessToast(false), 2500);
                    setActiveTab('live');
                  }}
                  className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Load in Player
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-4 mb-3 bg-white/[0.01] border border-dashed border-white/5 rounded-xl p-5 text-center">
              <FileText className="w-7 h-7 text-zinc-600 mx-auto mb-1.5 animate-pulse" />
              <span className="text-[11px] font-semibold text-zinc-500 block">No Active Playlist</span>
              <span className="text-[9px] text-zinc-600 max-w-[200px] mx-auto mt-1 block leading-normal">
                Upload an M3U file above to apply exclusions and preview cleaned streams.
              </span>
            </div>
          )}

          {/* 5. Premium CTA: Host on iptv.menu CDN with Locked State Overlay */}
          <div className="mx-4 mb-4 relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.03] to-transparent p-3.5 flex flex-col">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                <Lock className="w-4 h-4 text-amber-400 fill-current" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  Host on iptv.menu CDN
                  <span className="bg-amber-400/10 text-amber-400 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-400/20 uppercase tracking-widest">
                    CDN
                  </span>
                </div>
                <p className="text-[9px] text-zinc-400 mt-1 leading-relaxed">
                  Convert your cleaned list into a high-speed permanent CDN link to load onto any Smart TV, Firestick, or Tivimate client.
                </p>
              </div>
            </div>

            {hostedCdnLink ? (
              <div className="mt-3 p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex flex-col gap-2 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider">Hosted Link Active</span>
                  <span className="text-[8px] font-mono text-zinc-500">Edge Hosted</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={hostedCdnLink}
                    className="flex-1 bg-black/40 border border-white/5 rounded px-2 py-1 text-[9px] font-mono text-white outline-none select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(hostedCdnLink);
                      setShowCdnCopied(true);
                      setTimeout(() => setShowCdnCopied(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-bold transition-all"
                  >
                    {showCdnCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <button
                  onClick={() => {
                    if (cleanedChannels.length === 0) {
                      alert('Please upload and parse a playlist first.');
                      return;
                    }
                    setShowPaymentModal(true);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-lg text-xs font-black transition-all shadow-lg flex items-center justify-center gap-1"
                >
                  <Crown className="w-3.5 h-3.5 fill-current" />
                  Host on iptv.menu CDN — $2.99/mo
                </button>
              </div>
            )}
          </div>
        </ScrollView>
      )}

      {/* Immersive Payment Modal for CDN Hosting */}
      {showPaymentModal && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#111115] border border-white/10 rounded-2xl p-5 w-full max-w-[280px] text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 animate-bounce">
              <Crown className="w-5 h-5 text-amber-400 fill-current" />
            </div>
            
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Activate CDN Hosting</h3>
            <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
              Unlock absolute speed. Deploy your cleaned playlist onto <strong>iptv.menu high-capacity CDN</strong> for just <span className="text-amber-400 font-bold">$2.99/mo</span>. Works with Apple TV, Firestick, and Tivimate instantly.
            </p>

            <div className="mt-4 flex flex-col gap-1.5">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  const randomId = Math.random().toString(36).substr(2, 6);
                  setHostedCdnLink(`https://iptv.menu/cdn/user-${randomId}/playlist.m3u`);
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
              >
                Start Simulated Checkout
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-semibold rounded-lg transition-all border border-white/5"
              >
                Decline & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Success Toast Overlay */}
      {showSyncSuccessToast && (
        <div className="absolute inset-x-8 bottom-20 z-50 flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
          <div className="bg-emerald-600/95 backdrop-blur-md border border-emerald-400/30 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-white font-bold text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-200" />
            Cleaned Feed Loaded into Active Player!
          </div>
        </div>
      )}

      {/* Bottom Simulated Mobile Navigation Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('live')}
          style={[styles.bottomTabButton, activeTab === 'live' && styles.bottomTabButtonActive]}
          activeOpacity={0.7}
        >
          <Tv size={18} color={activeTab === 'live' ? '#3b82f6' : '#64748b'} />
          <Text style={[styles.bottomTabText, activeTab === 'live' && styles.bottomTabTextActive]}>
            Live TV
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('suite')}
          style={[styles.bottomTabButton, activeTab === 'suite' && styles.bottomTabButtonActive]}
          activeOpacity={0.7}
        >
          <Sparkles size={18} color={activeTab === 'suite' ? '#56d6c2' : '#64748b'} />
          <Text style={[styles.bottomTabText, activeTab === 'suite' && { color: '#56d6c2', fontWeight: 'bold' }]}>
            Dev Suite
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('playlist')}
          style={[styles.bottomTabButton, activeTab === 'playlist' && styles.bottomTabButtonActive]}
          activeOpacity={0.7}
        >
          <UploadCloud size={18} color={activeTab === 'playlist' ? '#3b82f6' : '#64748b'} />
          <Text style={[styles.bottomTabText, activeTab === 'playlist' && styles.bottomTabTextActive]}>
            Playlists
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#050505', // Immersive deepest black
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 300,
  },
  splashTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  splashDescription: {
    color: '#a1a1aa',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 18,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6', // bright neon blue
  },
  progressText: {
    color: '#a1a1aa',
    fontSize: 11,
    marginTop: 8,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  headerTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerMainTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  headerBtnActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  settingsPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  settingsLabel: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  settingsInputContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  settingsInput: {
    color: '#ffffff',
    fontSize: 13,
    width: '100%',
  },
  settingsActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  secondaryButtonText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  scrollBody: {
    flex: 1,
  },
  scrollBodyContent: {
    paddingBottom: 24,
  },
  sectionTitle: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  carouselContainer: {
    marginBottom: 20,
  },
  carouselHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 6,
  },
  carouselTitle: {
    color: '#f4f4f5',
    fontSize: 13,
    fontWeight: '700',
  },
  carouselCount: {
    color: '#71717a',
    fontSize: 12,
  },
  carouselScroll: {
    paddingLeft: 16,
  },
  carouselCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
    width: 90,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  carouselLogoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  carouselItemName: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  categoryBadgeContainer: {
    marginBottom: 20,
    marginTop: 4,
  },
  badgeScroll: {
    paddingLeft: 16,
    marginTop: 4,
  },
  groupBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  groupBadgeActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  groupBadgeText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '600',
  },
  groupBadgeTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  channelRowsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
    marginBottom: 6,
  },
  channelCountLabel: {
    color: '#71717a',
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 16,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyDescription: {
    color: '#71717a',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
    lineHeight: 18,
  },
  bottomTabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(10, 10, 12, 0.95)',
    paddingVertical: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
    opacity: 0.6,
  },
  bottomTabButtonActive: {
    opacity: 1,
  },
  bottomTabText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  bottomTabTextActive: {
    color: '#3b82f6',
    fontWeight: '700',
  },
});
