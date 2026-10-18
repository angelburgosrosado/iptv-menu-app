/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Tv, KeyRound, CheckCircle2, Search, X, Sparkles, Heart } from 'lucide-react-native';
import { ChannelFilters } from '../src/components/ChannelFilters';
import { CountryChannelSections } from '../src/components/CountryChannelSections';
import { EpgBackbonePanel } from '../src/components/EpgBackbonePanel';
import { XtreamLoginModal } from '../src/components/XtreamLoginModal';
import { TvPairModal } from '../src/components/TvPairModal';
import { usePlayerStore } from '../src/store/usePlayerStore';
import { PALETTE, RADII } from '../src/theme/tokens';
import { Focusable } from '../src/components/Focusable';
import { useDeviceClass } from '../src/theme/useDeviceClass';

export default function HomePage() {
  const { isTV } = useDeviceClass();
  const {
    loadMetadataBundle,
    loadEpgBundle,
    searchTerm,
    setSearchTerm,
    xtreamAccount,
    favorites,
    channels,
  } = usePlayerStore();
  const [isXtreamModalVisible, setIsXtreamModalVisible] = useState(false);
  const [isTvPairModalVisible, setIsTvPairModalVisible] = useState(false);

  useEffect(() => {
    loadMetadataBundle();
    loadEpgBundle();
  }, [loadMetadataBundle, loadEpgBundle]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.bgBase} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Tv size={18} color="#fff" />
            </View>
            <View>
              <Text style={styles.brandTitle}>IPTV.MENU PRO</Text>
              <Text style={styles.brandSubtitle}>High-Performance Stream Hub</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* TV Pairing Button */}
            <Focusable
              onPress={() => setIsTvPairModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Pair TV Device"
              style={styles.pairTvBtn}
            >
              <View style={styles.xtreamBtnInner}>
                <Tv size={14} color={PALETTE.primary} />
                <Text style={styles.pairTvBtnText}>Pair TV</Text>
              </View>
            </Focusable>

            {/* Xtream Codes Account Button */}
            <Focusable
              onPress={() => setIsXtreamModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={
                xtreamAccount
                  ? `Xtream connected: ${xtreamAccount.username}`
                  : 'Connect Xtream Codes Account'
              }
              style={[
                styles.xtreamBtn,
                xtreamAccount && styles.xtreamBtnConnected,
              ]}
            >
              {xtreamAccount ? (
                <View style={styles.xtreamBtnInner}>
                  <CheckCircle2 size={14} color={PALETTE.accentSuccess} />
                  <Text style={styles.xtreamBtnTextConnected}>
                    {xtreamAccount.username}
                  </Text>
                </View>
              ) : (
                <View style={styles.xtreamBtnInner}>
                  <KeyRound size={14} color={PALETTE.primary} />
                  <Text style={styles.xtreamBtnText}>+ Xtream Codes</Text>
                </View>
              )}
            </Focusable>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroHeading}>
            Live Broadcasts, Global Channels & EPG
          </Text>
          <Text style={styles.heroDesc}>
            Stream licensed live feeds, connect your private Xtream server, and browse seamless program schedules.
          </Text>
        </View>

        {/* Smart Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color={PALETTE.textDim} style={styles.searchIcon} />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search channels, genres, countries, language..."
            placeholderTextColor={PALETTE.textDim}
            style={styles.searchInput}
            autoCorrect={false}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')} hitSlop={10}>
              <X size={16} color={PALETTE.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* EPG Backbone Status Panel */}
        <EpgBackbonePanel />

        {/* Filters & Channel Grid */}
        <ChannelFilters />
        <CountryChannelSections />
      </ScrollView>

      {/* Xtream Login & Account Modal */}
      <XtreamLoginModal
        visible={isXtreamModalVisible}
        onClose={() => setIsXtreamModalVisible(false)}
      />

      {/* TV Pairing Modal */}
      <TvPairModal
        visible={isTvPairModalVisible}
        onClose={() => setIsTvPairModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.bgBase,
  },
  scrollContent: {
    padding: 18,
    gap: 18,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PALETTE.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    color: PALETTE.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    color: PALETTE.textDim,
    fontSize: 10,
    fontWeight: '600',
  },
  pairTvBtn: {
    backgroundColor: 'rgba(124, 92, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
  },
  pairTvBtnText: {
    color: PALETTE.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  xtreamBtn: {
    backgroundColor: 'rgba(124, 92, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.28)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
  },
  xtreamBtnConnected: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  xtreamBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xtreamBtnText: {
    color: PALETTE.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  xtreamBtnTextConnected: {
    color: PALETTE.accentSuccess,
    fontSize: 12,
    fontWeight: '700',
  },
  heroSection: {
    gap: 6,
    marginVertical: 4,
  },
  heroHeading: {
    color: PALETTE.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  heroDesc: {
    color: PALETTE.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: PALETTE.bgCard,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: PALETTE.textPrimary,
    fontSize: 14,
    padding: 0,
  },
});