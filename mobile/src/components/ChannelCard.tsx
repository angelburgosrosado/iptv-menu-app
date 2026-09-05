import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Heart, Play } from 'lucide-react-native';
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
});