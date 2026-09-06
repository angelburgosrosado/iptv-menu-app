import { useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { ChannelFilters } from './ChannelFilters';
import { CountryChannelSections } from './CountryChannelSections';
import { EpgBackbonePanel } from './EpgBackbonePanel';
import { usePlayerStore } from '../store/usePlayerStore';

export default function HomePage() {
  const { loadMetadataBundle, loadEpgBundle, searchTerm, setSearchTerm } = usePlayerStore();

  useEffect(() => {
    loadMetadataBundle();
    loadEpgBundle();
  }, [loadMetadataBundle, loadEpgBundle]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#071018' }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 18, paddingBottom: 120 }}>
        <View style={{ gap: 8 }}>
          <Text style={{ color: '#56d6c2', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }}>IPTV DEVELOPER SUITE</Text>
          <Text style={{ color: 'white', fontSize: 32, fontWeight: '900' }}>Global channels, country sections, and upgraded EPG coverage</Text>
          <Text style={{ color: 'rgba(255,255,255,0.66)', fontSize: 14, lineHeight: 20 }}>
            Browse channels by country, enrich metadata from iptv-org, and layer public XMLTV fallback feeds behind your licensed schedule provider.
          </Text>
        </View>

        <View
          style={{
            borderRadius: 22,
            padding: 16,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)'
          }}
        >
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search channels, groups, countries, language..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={{ color: 'white', fontSize: 15 }}
          />
        </View>

        <EpgBackbonePanel />
        <ChannelFilters />
        <CountryChannelSections />
      </ScrollView>
    </SafeAreaView>
  );
}

export { HomePage };
