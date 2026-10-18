/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Tv, Heart, Radio, Sparkles } from 'lucide-react-native';
import { Channel } from '../types/iptv';
import { Focusable } from './Focusable';
import { PALETTE, RADII } from '../theme/tokens';
import { usePlayerStore } from '../store/usePlayerStore';

interface ChannelCardProps {
  channel: Channel;
  onPress: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  hasTVPreferredFocus?: boolean;
}

export const ChannelCard = React.memo(function ChannelCard({
  channel,
  onPress,
  isFavorite,
  onFavoriteToggle,
  hasTVPreferredFocus = false,
}: ChannelCardProps) {
  const { epgByChannel } = usePlayerStore();
  const epgKey = channel.tvgId || channel.epgChannelId || channel.id;
  const nowProg = epgByChannel[epgKey]?.now;

  const accessibleLabel = `${channel.name}, ${channel.group || 'General'}, ${
    channel.countryName || 'Global'
  }${nowProg ? `, now playing: ${nowProg.title}` : ''}`;

  return (
    <Focusable
      onPress={onPress}
      hasTVPreferredFocus={hasTVPreferredFocus}
      accessibilityRole="button"
      accessibilityLabel={accessibleLabel}
      style={styles.container}
      focusedStyle={styles.containerFocused}
    >
      {({ focused }) => (
        <View style={styles.innerRow}>
          {/* Channel Logo with caching & fallback */}
          <View style={styles.logoWrapper}>
            {channel.logo ? (
              <Image
                source={{ uri: channel.logo }}
                style={styles.logo}
                contentFit="contain"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={styles.placeholderLogo}>
                <Tv size={24} color={PALETTE.textMuted} />
              </View>
            )}
            {channel.isLive && (
              <View style={styles.liveIndicator}>
                <Radio size={10} color="#fff" />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>

          {/* Channel Details */}
          <View style={styles.details}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {channel.name}
              </Text>
              {channel.metadataSource === 'xtream' && (
                <View style={styles.badgeXtream}>
                  <Text style={styles.badgeXtreamText}>XTREAM</Text>
                </View>
              )}
            </View>

            {nowProg ? (
              <Text style={styles.epgNow} numberOfLines={1}>
                <Text style={styles.nowPrefix}>NOW: </Text>
                {nowProg.title}
              </Text>
            ) : (
              <Text style={styles.subtitle} numberOfLines={1}>
                {channel.group || 'General'} • {channel.countryName || channel.countryCode || 'Global'}
              </Text>
            )}

            <View style={styles.metaRow}>
              <Text style={styles.metaGroup} numberOfLines={1}>
                {channel.group || 'Live TV'}
              </Text>
              {channel.catchupDays ? (
                <Text style={styles.catchupBadge}>
                  {channel.catchupDays}d Catchup
                </Text>
              ) : null}
            </View>
          </View>

          {/* Favorite Toggle Button */}
          {onFavoriteToggle && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onFavoriteToggle();
              }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              style={[styles.favBtn, isFavorite && styles.favBtnActive]}
            >
              <Heart
                size={18}
                color={isFavorite ? PALETTE.accentLive : PALETTE.textDim}
                fill={isFavorite ? PALETTE.accentLive : 'transparent'}
              />
            </Pressable>
          )}
        </View>
      )}
    </Focusable>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: RADII.lg,
    backgroundColor: PALETTE.bgCard,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    padding: 12,
    marginVertical: 4,
  },
  containerFocused: {
    borderColor: PALETTE.focusRing,
    backgroundColor: PALETTE.focusBg,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrapper: {
    width: 58,
    height: 58,
    borderRadius: RADII.md,
    backgroundColor: PALETTE.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  logo: {
    width: '85%',
    height: '85%',
  },
  placeholderLogo: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: PALETTE.accentLive,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: PALETTE.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  badgeXtream: {
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeXtreamText: {
    color: PALETTE.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  nowPrefix: {
    color: PALETTE.primary,
    fontWeight: '800',
    fontSize: 11,
  },
  epgNow: {
    color: PALETTE.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  subtitle: {
    color: PALETTE.textMuted,
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  metaGroup: {
    color: PALETTE.textDim,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  catchupBadge: {
    color: PALETTE.accentSuccess,
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  favBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  favBtnActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
});