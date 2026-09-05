import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, ChevronLeft } from 'lucide-react-native';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { VideoPlayer } from '../../src/components/VideoPlayer';

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
});