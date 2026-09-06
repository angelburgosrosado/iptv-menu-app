import { ScrollView, Text, View, Image } from 'react-native';
import { useMemo } from 'react';
import { ChannelCard } from '@/components/ChannelCard';
import { usePlayerStore } from '@/store/usePlayerStore';

export function CountryChannelSections() {
  const { countrySections, searchTerm, selectedCountry, selectedGroup, toggleFavorite } = usePlayerStore();

  const filteredSections = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return countrySections
      .filter((section) => !selectedCountry || section.code === selectedCountry)
      .map((section) => ({
        ...section,
        channels: section.channels.filter((channel) => {
          const matchesTerm = !term || [channel.name, channel.group, channel.countryName, channel.language]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(term);
          const matchesGroup = !selectedGroup || channel.group === selectedGroup;
          return matchesTerm && matchesGroup;
        })
      }))
      .filter((section) => section.channels.length > 0);
  }, [countrySections, searchTerm, selectedCountry, selectedGroup]);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
      {filteredSections.map((section) => (
        <View key={section.code} style={{ marginBottom: 28 }}>
          <View style={{ marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>{section.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.64)', fontSize: 13 }}>{section.channelCount} available channels</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(section.featuredLogos || []).map((logo) => (
                <Image key={logo} source={{ uri: logo }} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#11161d' }} />
              ))}
            </View>
          </View>
          <View style={{ gap: 10 }}>
            {section.channels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} onPress={() => toggleFavorite(channel.id)} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
