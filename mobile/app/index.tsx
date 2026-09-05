import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Search, RefreshCw, Bell, X } from 'lucide-react-native';
import { usePlayerStore } from '../src/store/usePlayerStore';
import { ChannelCard } from '../src/components/ChannelCard';

export default function HomeScreen() {
  const router = useRouter();
  const {
    channels,
    groups,
    favorites,
    isLoading,
    parseProgress,
    loadPlaylist,
    toggleFavorite,
    syncRemoteConfig,
    announcement,
    dismissAnnouncement,
    theme
  } = usePlayerStore();

  const [search, setSearch] = React.useState('');
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null);

  React.useEffect(() => {
    syncRemoteConfig();
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

  const activeColor = theme?.primaryColor || '#3b82f6';
  const accentColor = theme?.accentColor || '#10b981';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <ActivityIndicator size="large" color={activeColor} />
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

      {announcement ? (
        <View style={[styles.announcementBanner, { borderLeftColor: accentColor }]}>
          <Bell size={18} color={accentColor} style={styles.announcementIcon} />
          <Text style={styles.announcementText} numberOfLines={2}>
            {announcement}
          </Text>
          <TouchableOpacity onPress={dismissAnnouncement} style={styles.announcementClose}>
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.searchBar}>
        <Search size={16} color="#475569" style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search channels..."
          style={styles.searchInput}
          placeholderTextColor="#475569"
        />
      </View>

      <ScrollView horizontal style={styles.groupsScroll} showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          onPress={() => setSelectedGroup(null)}
          style={[styles.badge, !selectedGroup && { backgroundColor: activeColor }]}
        >
          <Text style={styles.badgeText}>All</Text>
        </TouchableOpacity>
        {groups.map(g => (
          <TouchableOpacity
            key={g}
            onPress={() => setSelectedGroup(g)}
            style={[styles.badge, selectedGroup === g && { backgroundColor: activeColor }]}
          >
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
            onPress={() => router.push(`/player/${item.id}`)}
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
  announcementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  announcementIcon: { marginRight: 8 },
  announcementText: { color: '#e2e8f0', fontSize: 13, flex: 1, fontWeight: '500' },
  announcementClose: { padding: 4, marginLeft: 6 },
  searchBar: { flexDirection: 'row', padding: 10, backgroundColor: '#1e293b', margin: 12, borderRadius: 8 },
  searchInput: { color: '#fff', flex: 1, marginLeft: 8 },
  searchIcon: { marginTop: 2 },
  groupsScroll: { paddingHorizontal: 12, marginBottom: 10, maxHeight: 40 },
  badge: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#1e293b', borderRadius: 9999, marginRight: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' }
});