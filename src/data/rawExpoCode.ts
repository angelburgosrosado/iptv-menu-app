export const EXPO_CODEBASE = [
  {
    path: 'package.json',
    language: 'json',
    description: 'Dependencies list for clean initiation in mobile structures.',
    code: `{
  "name": "personal-iptv-mobile",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-status-bar": "~1.12.1",
    "react-native": "0.74.1",
    "react-native-safe-area-context": "4.10.1",
    "react-native-screens": "3.31.1",
    "zustand": "^4.5.2",
    "react-native-mmkv": "^2.12.2",
    "@shopify/flash-list": "^1.6.4",
    "expo-video": "~1.1.0",
    "expo-image": "~1.12.11",
    "expo-build-properties": "~0.12.5",
    "expo-constants": "~16.0.2",
    "expo-linking": "~6.3.1",
    "lucide-react-native": "^0.379.0",
    "react-native-svg": "15.2.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "babel-preset-expo": "~11.0.0",
    "@types/react": "~18.2.45",
    "typescript": "^5.1.3"
  },
  "private": true
}`
  },
  {
    path: 'src/types/iptv.ts',
    language: 'typescript',
    description: 'Interfaces for parsed Channel streams, grouped collection models, and Zustand hooks.',
    code: `export interface Channel {
  id: string;         // Unique channel identifier (derived or parsed from tvg-id)
  name: string;       // Public-facing channel name
  logo: string;       // URL to channel logo/favicon
  url: string;        // HLS H3U8 stream URL
  group: string;      // Group category name (e.g., News, Entertainment)
  tvgId: string;      // Raw epg identifier
}

export interface Group {
  name: string;
  channels: Channel[];
}

export interface AppState {
  // Collection States
  channels: Channel[];
  groups: string[];
  favorites: string[]; // List of channel IDs
  history: string[];   // List of recently watched channel IDs
  
  // Async Loading States
  isLoading: boolean;
  parseProgress: number; // 0 to 100
  error: string | null;
  playlistUrl: string;

  // Actions
  setPlaylistUrl: (url: string) => void;
  loadPlaylist: (url?: string) => Promise<void>;
  toggleFavorite: (channelId: string) => void;
  addToHistory: (channelId: string) => void;
  clearHistory: () => void;
  clearCache: () => void;
}`
  },
  {
    path: 'src/utils/m3uParser.ts',
    language: 'typescript',
    description: 'Ultra-resilient raw playlist stream analyzer. Recovers from loose quotes and broken tags.',
    code: `import { Channel } from '../types/iptv';

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

  const lines = m3uContent.split(/\\r?\\n/);
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
      const groupMatch = line.match(/group-title="([^"]*)"/) || line.match(/group-title=([^ \\n,]*)/);

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
      const isStreamUrl = /^(https?|rtmp|rtsp):\\/\\/[^\\s]+$/i.test(line);
      
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
}`
  },
  {
    path: 'src/store/usePlayerStore.ts',
    language: 'typescript',
    description: 'Zustand global engine integrated with high-performance C++ MMKV KV storage hooks.',
    code: `import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { AppState, Channel } from '../types/iptv';
import { parseM3U } from '../utils/m3uParser';

const storage = new MMKV({ id: 'iptv_user_storage_v1' });

const readArrayFromStorage = (key: string): string[] => {
  const json = storage.getString(key);
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
};

const writeArrayToStorage = (key: string, data: string[]): void => {
  storage.set(key, JSON.stringify(data));
};

export const usePlayerStore = create<AppState>((set, get) => ({
  channels: [],
  groups: [],
  favorites: readArrayFromStorage('favorites'),
  history: readArrayFromStorage('history'),
  isLoading: false,
  parseProgress: 0,
  error: null,
  playlistUrl: storage.getString('playlistUrl') || 'https://iptv-org.github.io/iptv/countries/us.m3u',

  setPlaylistUrl: (url: string) => {
    storage.set('playlistUrl', url);
    set({ playlistUrl: url });
  },

  loadPlaylist: async (customUrl?: string) => {
    const url = customUrl || get().playlistUrl;
    set({ isLoading: true, parseProgress: 0, error: null });

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(\`HTTP status \${response.status}\`);
      const m3uText = await response.text();

      const parsedChannels = parseM3U(m3uText, {
        onProgress: (progress) => set({ parseProgress: progress }),
      });

      const uniqueGroups = Array.from(new Set(parsedChannels.map((c) => c.group))).sort();

      set({
        channels: parsedChannels,
        groups: uniqueGroups,
        isLoading: false,
        parseProgress: 100,
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || err });
    }
  },

  toggleFavorite: (channelId: string) => {
    const { favorites } = get();
    const newFavorites = favorites.includes(channelId)
      ? favorites.filter((id) => id !== channelId)
      : [...favorites, channelId];

    writeArrayToStorage('favorites', newFavorites);
    set({ favorites: newFavorites });
  },

  addToHistory: (channelId: string) => {
    const { history } = get();
    const filteredHistory = history.filter((id) => id !== channelId);
    const newHistory = [channelId, ...filteredHistory].slice(0, 20);

    writeArrayToStorage('history', newHistory);
    set({ history: newHistory });
  },

  clearHistory: () => {
    writeArrayToStorage('history', []);
    set({ history: [] });
  },

  clearCache: () => {
    storage.clearAll();
    set({ favorites: [], history: [] });
  },
}));`
  },
  {
    path: 'src/components/ChannelCard.tsx',
    language: 'typescript',
    description: 'React.memo memoized listItem layout matching Shopify FlashList constraints.',
    code: `import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Heart, Play } from 'lucide-react';
import { Channel } from '../types/iptv';

interface ChannelCardProps {
  channel: Channel;
  isFavorite: boolean;
  onPress: () => void;
  onFavoriteToggle: () => void;
}

export const ChannelCard = React.memo(({
  channel,
  isFavorite,
  onPress,
  onFavoriteToggle,
}: ChannelCardProps) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: channel.logo }}
          contentFit="contain"
          transition={150}
          style={styles.logo}
        />
        <View style={styles.playOverlay}>
          <Play size={10} color="#ffffff" fill="#ffffff" />
        </View>
      </View>

      <View style={styles.details}>
        <Text numberOfLines={1} style={styles.channelName}>{channel.name}</Text>
        <Text numberOfLines={1} style={styles.groupName}>{channel.group}</Text>
      </View>

      <TouchableOpacity onPress={onFavoriteToggle} style={styles.heartButton}>
        <Heart size={18} color={isFavorite ? '#ff4757' : '#9ca3af'} fill={isFavorite ? '#ff4757' : 'transparent'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

ChannelCard.displayName = 'ChannelCard';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  imageWrapper: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    padding: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: '100%', height: '100%' },
  playOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    borderTopLeftRadius: 6,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { flex: 1, marginLeft: 12 },
  channelName: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  groupName: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  heartButton: { padding: 8 },
});`
  },
  {
    path: 'src/components/VideoPlayer.tsx',
    language: 'typescript',
    description: 'Robust live video player container using expo-video with deep HLS/M3U8 event error recovery.',
    code: `import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play, Pause, RotateCcw, AlertCircle, Volume2, VolumeX, ChevronLeft } from 'lucide-react';

interface VideoPlayerProps {
  streamUrl: string;
  channelName: string;
  onBackPress?: () => void;
}

export function VideoPlayer({ streamUrl, channelName, onBackPress }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isMuted, setIsMuted] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [retryCount, setRetryCount] = React.useState(0);
  const [showControls, setShowControls] = React.useState(true);
  
  const player = useVideoPlayer({ uri: streamUrl }, (playerRef) => {
    playerRef.play();
  });

  const togglePlayPause = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const handleReloadStream = () => {
    setHasError(false);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
    player.replace({ uri: streamUrl });
    player.play();
    setIsPlaying(true);
  };

  React.useEffect(() => {
    const video = player._videoRef?.current;
    if (!video) return;

    const onPlay = () => { setIsPlaying(true); setIsLoading(false); setHasError(false); };
    const onPause = () => { setIsPlaying(false); };
    const onWaiting = () => { setIsLoading(true); };
    const onError = () => { setIsLoading(false); setHasError(true); };

    video.addEventListener('playing', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('playing', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onError);
    };
  }, [player, retryCount]);

  return (
    <View style={styles.container}>
      <VideoView player={player} style={styles.video} />

      {isLoading && !hasError && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.overlayText}>Buffering stream...</Text>
        </View>
      )}

      {hasError && (
        <View style={styles.errorOverlay}>
          <AlertCircle size={36} color="#ef4444" />
          <Text style={styles.errorText}>Stream Temporary Offline</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleReloadStream}>
            <RotateCcw size={16} color="#fff" />
            <Text style={styles.retryText}>Retry Link</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', backgroundColor: '#000', position: 'relative' },
  video: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center' },
  overlayText: { color: '#94a3b8', marginTop: 12 },
  errorOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0b0f19', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#fff', fontSize: 16, marginVertical: 12 },
  retryBtn: { flexDirection: 'row', backgroundColor: '#2563eb', padding: 10, borderRadius: 8, gap: 6 },
  retryText: { color: '#fff', fontWeight: '600' }
});`
  },
  {
    path: 'src/app/index.tsx',
    language: 'typescript',
    description: 'Dynamic mobile main screen housing categories, Search bars, favorites, and FlashList renders.',
    code: `import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Search, Heart, RefreshCw, Compass } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { ChannelCard } from '../components/ChannelCard';
import { Channel } from '../types/iptv';

export default function HomeScreen() {
  const router = useRouter();
  const { channels, groups, favorites, history, isLoading, parseProgress, loadPlaylist, toggleFavorite } = usePlayerStore();
  const [search, setSearch] = React.useState('');
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (channels.length === 0) loadPlaylist();
  }, []);

  const filteredChannels = React.useMemo(() => {
    let list = channels;
    if (selectedGroup) list = list.filter(c => c.group === selectedGroup);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
    }
    return list;
  }, [channels, selectedGroup, search]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.splashTitle}>Loading Live Channels</Text>
        <Text style={styles.splashProgress}>{parseProgress}% parsed</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HLS IPTV Client</Text>
        <TouchableOpacity onPress={() => loadPlaylist()} style={styles.reloadBtn}>
          <RefreshCw size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={16} color="#475569" style={styles.searchIcon} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search channels..." style={styles.searchInput} placeholderTextColor="#475569" />
      </View>

      <ScrollView horizontal style={styles.groupsScroll} showsHorizontalScrollIndicator={false}>
        <TouchableOpacity onPress={() => setSelectedGroup(null)} style={[styles.badge, !selectedGroup && styles.badgeActive]}>
          <Text style={styles.badgeText}>All</Text>
        </TouchableOpacity>
        {groups.map(g => (
          <TouchableOpacity key={g} onPress={() => setSelectedGroup(g)} style={[styles.badge, selectedGroup === g && styles.badgeActive]}>
            <Text style={styles.badgeText}>{g}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlashList
        data={filteredChannels}
        keyExtractor={(item) => item.id}
        estimatedItemSize={74}
        renderItem={({ item }) => (
          <ChannelCard
            channel={item}
            isFavorite={favorites.includes(item.id)}
            onPress={() => router.push(\`/player/\${item.id}\`)}
            onFavoriteToggle={() => toggleFavorite(item.id)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  splashContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  splashTitle: { color: '#fff', fontSize: 16, marginTop: 12 },
  splashProgress: { color: '#475569', marginTop: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#111827' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  reloadBtn: { padding: 4 },
  searchBar: { flexDirection: 'row', padding: 10, backgroundColor: '#1e293b', margin: 12, borderRadius: 8 },
  searchInput: { color: '#fff', flex: 1, marginLeft: 8 },
  searchIcon: { marginTop: 2 },
  groupsScroll: { paddingHorizontal: 12, marginBottom: 10, maxHeight: 40 },
  badge: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#1e293b', borderRadius: 9999, marginRight: 8 },
  badgeActive: { backgroundColor: '#3b82f6' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' }
});`
  },
  {
    path: 'src/app/player/[id].tsx',
    language: 'typescript',
    description: 'Dynamic path segment receiver rendering full-width video box and heart markers.',
    code: `import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, ChevronLeft } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { VideoPlayer } from '../../components/VideoPlayer';

export default function PlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { channels, favorites, toggleFavorite, addToHistory } = usePlayerStore();

  const channel = React.useMemo(() => channels.find(c => c.id === id), [channels, id]);
  const isFavorite = React.useMemo(() => id ? favorites.includes(id) : false, [favorites, id]);

  React.useEffect(() => {
    if (id && channel) addToHistory(id);
  }, [id, channel]);

  if (!channel) {
    return (
      <SafeAreaView style={styles.error}>
        <Text style={styles.errorText}>Channel Not Found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.playerContainer}>
        <VideoPlayer streamUrl={channel.url} channelName={channel.name} onBackPress={() => router.back()} />
      </View>

      <View style={styles.details}>
        <Text style={styles.title}>{channel.name}</Text>
        <Text style={styles.group}>{channel.group}</Text>

        <TouchableOpacity onPress={() => toggleFavorite(channel.id)} style={[styles.favBtn, isFavorite && styles.favBtnActive]}>
          <Heart size={20} color={isFavorite ? '#ff4757' : '#94a3b8'} fill={isFavorite ? '#ff4757' : 'transparent'} />
          <Text style={[styles.btnText, isFavorite && styles.btnTextActive]}>
            {isFavorite ? 'In Favorites' : 'Add to Favorites'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0f17' },
  playerContainer: { width: '100%', aspectRatio: 16/9, backgroundColor: '#000' },
  details: { padding: 16, backgroundColor: '#0f172a', flex: 1, borderTopLeftRadius: 16, borderTopRightRadius: 16, marginTop: -6 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  group: { color: '#3b82f6', fontSize: 12, marginTop: 4, textTransform: 'uppercase' },
  favBtn: { flexDirection: 'row', width: '100%', backgroundColor: '#1e293b', padding: 14, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 },
  favBtnActive: { backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  btnText: { color: '#cbd5e1', fontWeight: '700' },
  btnTextActive: { color: '#ff4757' },
  error: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#fff' }
});`
  }
];
