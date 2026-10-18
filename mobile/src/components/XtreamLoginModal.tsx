/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Server,
  User,
  Key,
  CheckCircle,
  AlertCircle,
  X,
  Trash2,
  LogIn,
  LogOut,
  Tv,
  ShieldCheck,
} from 'lucide-react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { XtreamAccount } from '../types/iptv';
import { PALETTE, RADII } from '../theme/tokens';
import { getDefaultOutputFormat } from '../utils/xtreamClient';

interface XtreamLoginModalProps {
  visible: boolean;
  onClose: () => void;
}

export function XtreamLoginModal({ visible, onClose }: XtreamLoginModalProps) {
  const {
    xtreamAccount,
    savedXtreamAccounts,
    connectXtreamAccount,
    disconnectXtreamAccount,
    removeSavedAccount,
  } = usePlayerStore();

  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [outputFormat, setOutputFormat] = useState<'ts' | 'm3u8'>(() =>
    getDefaultOutputFormat()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConnect = async (customAccount?: XtreamAccount) => {
    setErrorMessage(null);

    const targetAccount: XtreamAccount = customAccount || {
      serverUrl: serverUrl.trim(),
      username: username.trim(),
      password: password.trim(),
      outputFormat,
    };

    if (!targetAccount.serverUrl || !targetAccount.username || !targetAccount.password) {
      setErrorMessage('Please fill in Server URL, Username, and Password.');
      return;
    }

    setIsSubmitting(true);
    const result = await connectXtreamAccount(targetAccount);
    setIsSubmitting(false);

    if (result.success) {
      setServerUrl('');
      setUsername('');
      setPassword('');
      onClose();
    } else {
      setErrorMessage(result.error || 'Failed to authenticate with Xtream Codes server.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Server size={20} color={PALETTE.primary} />
              <Text style={styles.title}>Xtream Codes IPTV</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <X size={20} color={PALETTE.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Active Account Status */}
            {xtreamAccount ? (
              <View style={styles.activeBanner}>
                <View style={styles.activeHeader}>
                  <CheckCircle size={18} color={PALETTE.accentSuccess} />
                  <Text style={styles.activeTitle}>Connected Profile</Text>
                </View>
                <Text style={styles.activeServer}>{xtreamAccount.serverUrl}</Text>
                <Text style={styles.activeUser}>User: {xtreamAccount.username}</Text>
                {xtreamAccount.userInfo?.exp_date && (
                  <Text style={styles.activeExpiry}>
                    Expires: {new Date(parseInt(xtreamAccount.userInfo.exp_date, 10) * 1000).toLocaleDateString()}
                  </Text>
                )}
                <TouchableOpacity
                  onPress={disconnectXtreamAccount}
                  style={styles.disconnectBtn}
                >
                  <LogOut size={16} color="#fff" />
                  <Text style={styles.disconnectBtnText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color={PALETTE.accentLive} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* New Credentials Form */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>
                {xtreamAccount ? 'Add or Switch Server' : 'Enter Server Credentials'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Server URL & Port</Text>
                <View style={styles.inputWrapper}>
                  <Server size={16} color={PALETTE.textDim} style={styles.inputIcon} />
                  <TextInput
                    value={serverUrl}
                    onChangeText={setServerUrl}
                    placeholder="http://provider-domain.com:8080"
                    placeholderTextColor={PALETTE.textDim}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.inputWrapper}>
                  <User size={16} color={PALETTE.textDim} style={styles.inputIcon} />
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Account username"
                    placeholderTextColor={PALETTE.textDim}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Key size={16} color={PALETTE.textDim} style={styles.inputIcon} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Account password"
                    placeholderTextColor={PALETTE.textDim}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Stream Container Format (HLS vs TS) */}
              <View style={styles.formatGroup}>
                <Text style={styles.inputLabel}>Stream Format</Text>
                <View style={styles.formatRow}>
                  <TouchableOpacity
                    onPress={() => setOutputFormat('m3u8')}
                    style={[styles.formatBtn, outputFormat === 'm3u8' && styles.formatBtnActive]}
                  >
                    <Text style={[styles.formatBtnText, outputFormat === 'm3u8' && styles.formatBtnTextActive]}>
                      HLS (.m3u8) {Platform.OS === 'ios' ? '★ Apple Recommended' : ''}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setOutputFormat('ts')}
                    style={[styles.formatBtn, outputFormat === 'ts' && styles.formatBtnActive]}
                  >
                    <Text style={[styles.formatBtnText, outputFormat === 'ts' && styles.formatBtnTextActive]}>
                      MPEG-TS (.ts)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleConnect()}
                disabled={isSubmitting}
                style={styles.connectBtn}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <LogIn size={18} color="#fff" />
                    <Text style={styles.connectBtnText}>Connect & Load Channels</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Saved Accounts */}
            {savedXtreamAccounts.length > 0 && (
              <View style={styles.savedSection}>
                <Text style={styles.formSectionTitle}>Saved Profiles</Text>
                {savedXtreamAccounts.map((account) => (
                  <View key={`${account.serverUrl}_${account.username}`} style={styles.savedCard}>
                    <View style={styles.savedDetails}>
                      <Text style={styles.savedName}>{account.name || account.username}</Text>
                      <Text style={styles.savedUrl} numberOfLines={1}>{account.serverUrl}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeSavedAccount(account.serverUrl, account.username)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={16} color={PALETTE.accentLive} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: PALETTE.bgSurface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: PALETTE.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  scrollContent: {
    padding: 20,
    gap: 18,
  },
  activeBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 14,
    gap: 4,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  activeTitle: {
    color: PALETTE.accentSuccess,
    fontSize: 14,
    fontWeight: '700',
  },
  activeServer: {
    color: PALETTE.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  activeUser: {
    color: PALETTE.textMuted,
    fontSize: 12,
  },
  activeExpiry: {
    color: PALETTE.textDim,
    fontSize: 11,
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.85)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADII.md,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  disconnectBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  errorText: {
    color: PALETTE.accentLive,
    fontSize: 13,
    flex: 1,
  },
  formSection: {
    gap: 14,
  },
  formSectionTitle: {
    color: PALETTE.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: PALETTE.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.bgElevated,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: PALETTE.textPrimary,
    fontSize: 14,
    paddingVertical: 12,
  },
  formatGroup: {
    gap: 8,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formatBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADII.md,
    backgroundColor: PALETTE.bgElevated,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  formatBtnActive: {
    borderColor: PALETTE.primary,
    backgroundColor: 'rgba(124, 92, 255, 0.12)',
  },
  formatBtnText: {
    color: PALETTE.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  formatBtnTextActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PALETTE.primaryDark,
    paddingVertical: 14,
    borderRadius: RADII.md,
    marginTop: 6,
  },
  connectBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  savedSection: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.bgElevated,
    padding: 12,
    borderRadius: RADII.md,
  },
  savedDetails: {
    flex: 1,
    gap: 2,
  },
  savedName: {
    color: PALETTE.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  savedUrl: {
    color: PALETTE.textDim,
    fontSize: 12,
  },
  deleteBtn: {
    padding: 8,
  },
});
