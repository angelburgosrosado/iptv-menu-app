/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { ChannelCard } from './ChannelCard';
import { usePlayerStore } from '../store/usePlayerStore';
import { Channel } from '../types/iptv';
import { PALETTE, RADII } from '../theme/tokens';
import { useDeviceClass } from '../theme/useDeviceClass';

export function CountryChannelSections() {
  const router = useRouter();
  const { isTV, columns } = useDeviceClass();
  const {
    countrySections,
    searchTerm,
    selectedCountry,
    selectedGroup,
    favorites,
    toggleFavorite,
    setCurrentPlayingChannel,
  } = usePlayerStore();

  const handlePlayChannel = useCallback(
    (channel: Channel) => {
      setCurrentPlayingChannel(channel);
      router.push({
        pathname: '/player/[id]',
        params: { id: channel.id },
      });
    },
    [router, setCurrentPlayingChannel]
  );

  // Filter channels based on search, country, and group
  const flatChannelList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result: Channel[] = [];

    for (const section of countrySections) {
      if (selectedCountry && section.code !== selectedCountry) continue;

      for (const channel of section.channels) {
        if (selectedGroup && channel.group !== selectedGroup) continue;

        if (term) {
          const match =
            channel.name.toLowerCase().includes(term) ||
            channel.group.toLowerCase().includes(term) ||
            (channel.countryName && channel.countryName.toLowerCase().includes(term)) ||
            (channel.language && channel.language.toLowerCase().includes(term));
          if (!match) continue;
        }

        result.push(channel);
      }
    }
    return result;
  }, [countrySections, searchTerm, selectedCountry, selectedGroup]);

  const renderItem = useCallback(
    ({ item, index }: { item: Channel; index: number }) => {
      const isFav = favorites.includes(item.id);
      return (
        <View style={[styles.itemContainer, { flex: 1 / columns, padding: 4 }]}>
          <ChannelCard
            channel={item}
            onPress={() => handlePlayChannel(item)}
            isFavorite={isFav}
            onFavoriteToggle={() => toggleFavorite(item.id)}
            hasTVPreferredFocus={isTV && index === 0}
          />
        </View>
      );
    },
    [favorites, handlePlayChannel, toggleFavorite, isTV, columns]
  );

  if (flatChannelList.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No channels found</Text>
        <Text style={styles.emptySubtitle}>
          Try adjusting your search query, country selection, or genre filter.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listWrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>
          {selectedCountry ? `Country: ${selectedCountry}` : 'All Channels'}
        </Text>
        <Text style={styles.channelCount}>
          {flatChannelList.length} channels available
        </Text>
      </View>

      <FlashList
        data={flatChannelList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={76}
        numColumns={columns}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listWrapper: {
    flex: 1,
    minHeight: 400,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: PALETTE.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  channelCount: {
    color: PALETTE.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  itemContainer: {
    minWidth: 260,
  },
  listContent: {
    paddingBottom: 60,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.bgCard,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    marginVertical: 16,
  },
  emptyTitle: {
    color: PALETTE.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: PALETTE.textMuted,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
  },
});
