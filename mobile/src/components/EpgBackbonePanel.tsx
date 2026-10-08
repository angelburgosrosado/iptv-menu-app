/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { PALETTE, RADII } from '../theme/tokens';
import { Calendar, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react-native';

export function EpgBackbonePanel() {
  const { epgSources, epgByChannel, channels, isEpgLoading, loadEpgBundle } = usePlayerStore();

  const stats = useMemo(() => {
    const scheduledCount = Object.keys(epgByChannel || {}).length;
    const total = channels.length || 0;
    const rate = total > 0 ? Math.round((scheduledCount / total) * 100) : 0;
    return {
      total,
      scheduled: scheduledCount,
      rate,
    };
  }, [epgByChannel, channels]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Calendar size={18} color={PALETTE.primary} />
          <Text style={styles.title}>Live Electronic Program Guide</Text>
        </View>
        <Pressable
          onPress={() => loadEpgBundle()}
          disabled={isEpgLoading}
          style={styles.refreshBtn}
          accessibilityRole="button"
          accessibilityLabel="Refresh EPG Schedule"
        >
          {isEpgLoading ? (
            <ActivityIndicator size="small" color={PALETTE.primary} />
          ) : (
            <RefreshCw size={14} color={PALETTE.textMuted} />
          )}
        </Pressable>
      </View>

      <Text style={styles.description}>
        Aggregated live schedules with instant caching and fallback coverage.
      </Text>

      {/* Metric Counters */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Channels Loaded</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.scheduled}</Text>
          <Text style={styles.statLabel}>With EPG Data</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: stats.rate > 50 ? PALETTE.accentSuccess : PALETTE.primary }]}>
            {stats.rate}%
          </Text>
          <Text style={styles.statLabel}>Live Coverage</Text>
        </View>
      </View>

      {/* Sources list */}
      <View style={styles.sourcesList}>
        {epgSources.map((source) => (
          <View key={source.key} style={styles.sourceRow}>
            <View style={styles.sourceLabelRow}>
              <CheckCircle2 size={13} color={PALETTE.accentSuccess} />
              <Text style={styles.sourceName}>{source.label}</Text>
            </View>
            <Text style={styles.sourcePriority}>Priority #{source.priority}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.lg,
    padding: 16,
    backgroundColor: PALETTE.bgCard,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: PALETTE.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  description: {
    color: PALETTE.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: PALETTE.bgSurface,
    borderRadius: RADII.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
  },
  statValue: {
    color: PALETTE.primary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: PALETTE.textDim,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  sourcesList: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceName: {
    color: PALETTE.textSecondary,
    fontSize: 12,
  },
  sourcePriority: {
    color: PALETTE.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
});
