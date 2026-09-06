import { ScrollView, Pressable, Text, View } from 'react-native';
import { usePlayerStore } from '@/store/usePlayerStore';

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: active ? '#0f8e84' : 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: active ? '#32d0bf' : 'rgba(255,255,255,0.08)'
      }}
    >
      <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export function ChannelFilters() {
  const { countrySections, groups, selectedCountry, selectedGroup, setSelectedCountry, setSelectedGroup } = usePlayerStore();

  return (
    <View style={{ gap: 16 }}>
      <View>
        <Text style={{ color: 'rgba(255,255,255,0.66)', marginBottom: 8, fontSize: 12, fontWeight: '700' }}>Browse by country</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Pill label="All countries" active={!selectedCountry} onPress={() => setSelectedCountry(null)} />
          {countrySections.map((section) => (
            <Pill
              key={section.code}
              label={`${section.name} (${section.channelCount})`}
              active={selectedCountry === section.code}
              onPress={() => setSelectedCountry(section.code)}
            />
          ))}
        </ScrollView>
      </View>

      <View>
        <Text style={{ color: 'rgba(255,255,255,0.66)', marginBottom: 8, fontSize: 12, fontWeight: '700' }}>Browse by group</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Pill label="All groups" active={!selectedGroup} onPress={() => setSelectedGroup(null)} />
          {groups.map((group) => (
            <Pill key={group} label={group} active={selectedGroup === group} onPress={() => setSelectedGroup(group)} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
