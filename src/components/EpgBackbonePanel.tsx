import { Text, View } from 'react-native';
import { useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

export function EpgBackbonePanel() {
  const { epgSources, epgByChannel, channels } = usePlayerStore();

  const stats = useMemo(() => {
    const scheduledChannels = new Set(Object.keys(epgByChannel || {})).size;
    return {
      totalChannels: channels.length,
      scheduledChannels,
      coverageRate: channels.length ? Math.round((scheduledChannels / channels.length) * 100) : 0
    };
  }, [epgByChannel, channels]);

  return (
    <View
      style={{
        borderRadius: 24,
        padding: 18,
        backgroundColor: 'rgba(11, 18, 24, 0.92)',
        borderWidth: 1,
        borderColor: 'rgba(83, 214, 196, 0.18)',
        gap: 12
      }}
    >
      <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>EPG backbone</Text>
      <Text style={{ color: 'rgba(255,255,255,0.66)', fontSize: 13 }}>
        XMLTV remains the interchange layer, iptv-org powers metadata matching, and the licensed provider stays primary for schedule authority.
      </Text>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <View style={{ minWidth: 120 }}>
          <Text style={{ color: '#56d6c2', fontSize: 20, fontWeight: '800' }}>{stats.totalChannels}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Channels loaded</Text>
        </View>
        <View style={{ minWidth: 120 }}>
          <Text style={{ color: '#56d6c2', fontSize: 20, fontWeight: '800' }}>{stats.scheduledChannels}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>With schedule data</Text>
        </View>
        <View style={{ minWidth: 120 }}>
          <Text style={{ color: '#56d6c2', fontSize: 20, fontWeight: '800' }}>{stats.coverageRate}%</Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Schedule coverage</Text>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        {(epgSources || []).slice().sort((a, b) => a.priority - b.priority).map((source) => (
          <View key={source.key} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: 'white', fontSize: 13 }}>{source.label}</Text>
            <Text style={{ color: source.enabled ? '#56d6c2' : '#ff8383', fontSize: 12 }}>
              {source.enabled ? `Priority ${source.priority}` : 'Disabled'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default EpgBackbonePanel;
