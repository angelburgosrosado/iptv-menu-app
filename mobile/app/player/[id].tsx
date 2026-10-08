/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, ChevronLeft, Radio, Calendar, Info } from 'lucide-react-native';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { VideoPlayer } from '../../src/components/VideoPlayer';
import { PALETTE, RADII } from '../../src/theme/tokens';
import { Channel } from '../../src/types/iptv';

export default function PlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    channels,
    favorites,
    toggleFavorite,
    addToHistory,
    currentPlayingChannel,
    setCurrentPlayingChannel,
    epgByChannel,
    loadPlaylist,
  } = usePlayerStore();

  // Robust channel resolution (fixes Bug B2 on deep link / cold start)
  const channel: Channel | undefined = useMemo(() => {
    if (currentPlayingChannel && currentPlayingChannel.id === id) {
      return currentPlayingChannel;
    }
    const found = channels.find((c) => c.id === id);
    if (found) return found;
    return currentPlayingChannel || undefined;
  }, [channels, currentPlayingChannel, id]);

  useEffect(() => {
    if (channels.length === 0) {
      loadPlaylist();
    }
  }, [channels.length, loadPlaylist]);

  useEffect(() => {
    if (channel && (!currentPlayingChannel || currentPlayingChannel.id !== channel.id)) {
      setCurrentPlayingChannel(channel);
    }
    if (id) {
      addToHistory(id);
    }
  }, [channel, currentPlayingChannel, id, setCurrentPlayingChannel, addToHistory]);

  const isFavorite = useMemo(() => (id ? favorites.includes(id) : false), [favorites, id]);

  // Channel zapping (Next / Previous channel)
  const currentIndex = useMemo(() => {
    if (!channel) return -1;
    return channels.findIndex((c) => c.id === channel.id);
  }, [channels, channel]);

  const handleZapNext = () => {
    if (currentIndex >= 0 && currentIndex < channels.length - 1) {
      const nextChan = channels[currentIndex + 1];
      setCurrentPlayingChannel(nextChan);
      router.setParams({ id: nextChan.id });
    }
  };

  const handleZapPrev = () => {
    if (currentIndex > 0) {
      const prevChan = channels[currentIndex - 1];
      setCurrentPlayingChannel(prevChan);
      router.setParams({ id: prevChan.id });
    }
  };

  const epgKey = channel ? channel.tvgId || channel.epgChannelId || channel.id : '';
  const nowNext = epgByChannel[epgKey];

  if (!channel) {
    return (
      <SafeAreaView style={styles.errorScreen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>Channel Standby</Text>
          <Text style={styles.errorDesc}>
            Connecting to broadcast feed...
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={18} color="#fff" />
            <Text style={styles.backButtonText}>Return to Channel Guide</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Video Surface */}
      <View style={styles.playerContainer}>
        <VideoPlayer
          streamUrl={channel.url}
          fallbackUrls={channel.fallbackUrls}
          channelName={channel.name}
          channelGroup={channel.group}
          onBackPress={() => router.back()}
          onZapNext={channels.length > 1 ? handleZapNext : undefined}
          onZapPrev={channels.length > 1 ? handleZapPrev : undefined}
        />
      </View>

      {/* Program & Channel Details Bar */}
      <View style={styles.detailsSheet}>
        <View style={styles.channelHeaderRow}>
          <View style={styles.channelMeta}>
            <Text style={styles.channelTitle} numberOfLines={1}>
              {channel.name}
            </Text>
            <Text style={styles.channelGroup}>
              {channel.group || 'Live Broadcast'} • {channel.countryName || 'Global'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => toggleFavorite(channel.id)}
            style={[styles.favBtn, isFavorite && styles.favBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'In Favorites' : 'Add to Favorites'}
          >
            <Heart
              size={18}
              color={isFavorite ? PALETTE.accentLive : PALETTE.textSecondary}
              fill={isFavorite ? PALETTE.accentLive : 'transparent'}
            />
            <Text style={[styles.favBtnText, isFavorite && styles.favBtnTextActive]}>
              {isFavorite ? 'Favorited' : 'Favorite'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* EPG Now / Next Schedule Bar */}
        {nowNext?.now && (
          <View style={styles.epgBanner}>
            <View style={styles.epgRow}>
              <View style={styles.epgBadge}>
                <Radio size={10} color={PALETTE.primary} />
                <Text style={styles.epgBadgeText}>ON NOW</Text>
              </View>
              <Text style={styles.epgProgramTitle} numberOfLines={1}>
                {nowNext.now.title}
              </Text>
            </View>

            {nowNext.next && (
              <View style={[styles.epgRow, { marginTop: 4 }]}>
                <Text style={styles.epgUpcomingBadge}>UP NEXT</Text>
                <Text style={styles.epgUpcomingTitle} numberOfLines={1}>
                  {nowNext.next.title}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  detailsSheet: {
    flex: 1,
    backgroundColor: PALETTE.bgSurface,
    padding: 16,
    borderTopLeftRadius: RADII.lg,
    borderTopRightRadius: RADII.lg,
    gap: 14,
  },
  channelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelMeta: {
    flex: 1,
    marginRight: 12,
  },
  channelTitle: {
    color: PALETTE.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  channelGroup: {
    color: PALETTE.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  favBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  favBtnActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: PALETTE.accentLive,
  },
  favBtnText: {
    color: PALETTE.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  favBtnTextActive: {
    color: PALETTE.accentLive,
  },
  epgBanner: {
    backgroundColor: PALETTE.bgElevated,
    borderRadius: RADII.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  epgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  epgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  epgBadgeText: {
    color: PALETTE.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  epgProgramTitle: {
    color: PALETTE.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  epgUpcomingBadge: {
    color: PALETTE.textDim,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  epgUpcomingTitle: {
    color: PALETTE.textMuted,
    fontSize: 12,
    flex: 1,
  },
  errorScreen: {
    flex: 1,
    backgroundColor: PALETTE.bgBase,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
  },
  errorTitle: {
    color: PALETTE.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  errorDesc: {
    color: PALETTE.textMuted,
    fontSize: 13,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PALETTE.primaryDark,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADII.md,
    marginTop: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});