import { Image, Pressable, Text, View } from 'react-native';
import type { Channel } from '@/types/iptv';

type Props = {
  channel: Channel;
  onPress?: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
};

export function ChannelCard({ channel, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: 14,
        gap: 12
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Image
          source={{ uri: channel.logo || 'https://cdn.jsdelivr.net/gh/iptv-org/database@master/logos/no-logo.png' }}
          style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: '#10161c' }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>{channel.name}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12, marginTop: 2 }}>
            {channel.group || 'General'} • {channel.countryName || channel.countryCode || 'Global'}
          </Text>
          <Text style={{ color: '#56d6c2', fontSize: 11, marginTop: 4 }}>
            {channel.metadataSource === 'iptv-org' ? 'iptv-org metadata' : 'playlist metadata'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}