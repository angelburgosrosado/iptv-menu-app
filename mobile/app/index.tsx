import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Tv, KeyRound, CheckCircle2 } from 'lucide-react-native';
import { ChannelFilters } from '@/components/ChannelFilters';
import { CountryChannelSections } from '@/components/CountryChannelSections';
import { EpgBackbonePanel } from '@/components/EpgBackbonePanel';
import { XtreamLoginModal } from '@/components/XtreamLoginModal';
import { usePlayerStore } from '@/store/usePlayerStore';

export default function HomePage() {
  const { loadMetadataBundle, loadEpgBundle, searchTerm, setSearchTerm, xtreamAccount } = usePlayerStore();
  const [isXtreamModalVisible, setIsXtreamModalVisible] = useState(false);

  useEffect(() => {
    loadMetadataBundle();
    loadEpgBundle();
  }, [loadMetadataBundle, loadEpgBundle]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#071018' }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 18, paddingBottom: 120 }}>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#56d6c2', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }}>IPTV DEVELOPER SUITE</Text>
            
            {/* Xtream Codes Account Area Button */}
            <TouchableOpacity
              onPress={() => setIsXtreamModalVisible(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: xtreamAccount ? 'rgba(16, 185, 129, 0.15)' : 'rgba(86, 214, 194, 0.15)',
                borderWidth: 1,
                borderColor: xtreamAccount ? '#10b981' : '#56d6c2',
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 20
              }}
            >
              {xtreamAccount ? (
                <>
                  <CheckCircle2 size={14} color="#10b981" />
                  <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '700' }}>
                    Xtream: {xtreamAccount.username}
                  </Text>
                </>
              ) : (
                <>
                  <KeyRound size={14} color="#56d6c2" />
                  <Text style={{ color: '#56d6c2', fontSize: 12, fontWeight: '700' }}>
                    + Add Xtream Codes
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={{ color: 'white', fontSize: 32, fontWeight: '900' }}>Global channels, country sections, and upgraded EPG coverage</Text>
          <Text style={{ color: 'rgba(255,255,255,0.66)', fontSize: 14, lineHeight: 20 }}>
            Connect your private Xtream Codes server, browse channels by country, and stream high-bitrate MPEG-TS feeds natively on your Firestick.
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

      {/* Xtream Codes Login & Account Management Modal */}
      <XtreamLoginModal
        visible={isXtreamModalVisible}
        onClose={() => setIsXtreamModalVisible(false)}
      />
    </SafeAreaView>
  );
}