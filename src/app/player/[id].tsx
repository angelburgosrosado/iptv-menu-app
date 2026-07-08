/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ChevronLeft, Heart } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { VideoPlayer } from '../../components/VideoPlayer';

export default function PlayerScreen() {
  const router = useRouter();
  
  // Extract dynamic route parameter
  const { id } = useLocalSearchParams<{ id: string }>();

  // Fetch collections & actions from central store
  const { channels, favorites, toggleFavorite, addToHistory } = usePlayerStore();

  // Find channel structures based on parsed IDs
  const channel = React.useMemo(() => {
    return channels.find((c) => c.id === id);
  }, [channels, id]);

  const isFavorite = React.useMemo(() => {
    if (!id) return false;
    return favorites.includes(id);
  }, [favorites, id]);

  // Log to play-history once loaded
  React.useEffect(() => {
    if (id && channel) {
      addToHistory(id);
    }
  }, [id, channel]);

  // Clean navigation callbacks back to category lists
  const handleBack = () => {
    router.back();
  };

  if (!channel) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <AlertTriangle size={36} color="#ef4444" />
          <Text style={styles.errorTitle}>Channel Not Found</Text>
          <Text style={styles.errorDescription}>
            The stream identifier "{id}" does not exist in the loaded playlist.
          </Text>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={16} color="#ffffff" />
            <Text style={styles.backBtnText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Dynamic Video HUD Display */}
      <View style={styles.playerWrapper}>
        <VideoPlayer
          streamUrl={channel.url}
          channelName={channel.name}
          onBackPress={handleBack}
        />
      </View>

      {/* Under-Player Metadata panel */}
      <View style={styles.metaContainer}>
        <View style={styles.metaMain}>
          <Text style={styles.channelTitle} numberOfLines={2}>
            {channel.name}
          </Text>
          <Text style={styles.groupBadge}>
            {channel.group}
          </Text>
        </View>

        {/* Quick-action buttons */}
        <TouchableOpacity
          onPress={() => toggleFavorite(channel.id)}
          style={[styles.favBtn, isFavorite && styles.favBtnActive]}
          activeOpacity={0.7}
        >
          <Heart
            size={20}
            color={isFavorite ? '#ff4757' : '#94a3b8'}
            fill={isFavorite ? '#ff4757' : 'transparent'}
          />
          <Text style={[styles.favBtnText, isFavorite && styles.favBtnTextActive]}>
            {isFavorite ? 'In Favorites' : 'Add Favorite'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#050505', // Fully blackout for maximum contrast streaming
    justifyContent: 'flex-start',
  },
  playerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9, // Native widescreen stream boxes
    backgroundColor: '#000000',
  },
  metaContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginTop: -8, // Slight slide-under the player
  },
  metaMain: {
    marginBottom: 20,
  },
  channelTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
  },
  groupBadge: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  favBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  favBtnActive: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  favBtnText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '700',
  },
  favBtnTextActive: {
    color: '#ff4757',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxWidth: 320,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    color: '#a1a1aa',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 4,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
