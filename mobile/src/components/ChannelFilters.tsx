/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { Focusable } from './Focusable';
import { PALETTE, RADII } from '../theme/tokens';
import { Globe, Layers } from 'lucide-react-native';

interface FilterPillProps {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

function FilterPill({ label, count, active, onPress, accessibilityLabel }: FilterPillProps) {
  return (
    <Focusable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || `${label} filter`}
      style={[styles.pill, active && styles.pillActive]}
      focusedStyle={styles.pillFocused}
    >
      <View style={styles.pillContent}>
        <Text style={[styles.pillText, active && styles.pillTextActive]}>
          {label}
        </Text>
        {typeof count === 'number' && (
          <View style={[styles.countBadge, active && styles.countBadgeActive]}>
            <Text style={[styles.countText, active && styles.countTextActive]}>
              {count}
            </Text>
          </View>
        )}
      </View>
    </Focusable>
  );
}

export function ChannelFilters() {
  const {
    countrySections,
    groups,
    selectedCountry,
    selectedGroup,
    setSelectedCountry,
    setSelectedGroup,
  } = usePlayerStore();

  return (
    <View style={styles.container}>
      {/* Country Filters */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Globe size={14} color={PALETTE.primary} />
          <Text style={styles.sectionTitle}>Countries</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <FilterPill
            label="All Countries"
            active={!selectedCountry}
            onPress={() => setSelectedCountry(null)}
          />
          {countrySections.map((section) => (
            <FilterPill
              key={section.code}
              label={section.name}
              count={section.channelCount}
              active={selectedCountry === section.code}
              onPress={() => setSelectedCountry(section.code)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Genre / Group Filters */}
      {groups.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Layers size={14} color={PALETTE.accentPurple} />
            <Text style={styles.sectionTitle}>Categories</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <FilterPill
              label="All Categories"
              active={!selectedGroup}
              onPress={() => setSelectedGroup(null)}
            />
            {groups.map((group) => (
              <FilterPill
                key={group}
                label={group}
                active={selectedGroup === group}
                onPress={() => setSelectedGroup(group)}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginVertical: 4,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: PALETTE.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADII.pill,
    backgroundColor: PALETTE.bgCard,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  pillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: PALETTE.primary,
  },
  pillFocused: {
    borderColor: PALETTE.focusRing,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillText: {
    color: PALETTE.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADII.pill,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  countText: {
    color: PALETTE.textDim,
    fontSize: 11,
    fontWeight: '700',
  },
  countTextActive: {
    color: PALETTE.primary,
  },
});
