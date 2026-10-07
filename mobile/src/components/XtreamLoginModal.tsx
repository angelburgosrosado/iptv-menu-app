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
  StyleSheet
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
  Tv
} from 'lucide-react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { XtreamAccount } from '../types/iptv';

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
    removeSavedAccount
  } = usePlayerStore();

  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [outputFormat, setOutputFormat] = useState<'ts' | 'm3u8'>('ts');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConnect = async (customAccount?: XtreamAccount) => {
    setErrorMessage(null);

    const targetAccount: XtreamAccount = customAccount || {
      serverUrl: serverUrl.trim(),
      username: username.trim(),
      password: password.trim(),
      outputFormat
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
      setErrorMessage(result.error || 'Failed to authenticate with Xtream server.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Tv size={22} color="#56d6c2" />
              <Text style={styles.headerTitle}>Xtream Codes Accounts</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Active Account Card */}
            {xtreamAccount && (
              <View style={styles.activeCard}>
                <View style={styles.activeHeader}>
                  <View style={styles.statusBadge}>
                    <CheckCircle size={14} color="#10b981" />
                    <Text style={styles.statusText}>Connected</Text>
                  </View>
                  <TouchableOpacity onPress={disconnectXtreamAccount} style={styles.disconnectBtn}>
                    <LogOut size={14} color="#f43f5e" />
                    <Text style={styles.disconnectText}>Disconnect</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.activeServer}>{xtreamAccount.serverUrl}</Text>
                <Text style={styles.activeUser}>User: {xtreamAccount.username}</Text>

                {xtreamAccount.userInfo && (
                  <View style={styles.accountMetaRow}>
                    <Text style={styles.metaLabel}>
                      Status: <Text style={styles.metaValue}>{xtreamAccount.userInfo.status || 'Active'}</Text>
                    </Text>
                    {xtreamAccount.userInfo.exp_date && (
                      <Text style={styles.metaLabel}>
                        Expires: <Text style={styles.metaValue}>
                          {isNaN(Number(xtreamAccount.userInfo.exp_date))
                            ? xtreamAccount.userInfo.exp_date
                            : new Date(Number(xtreamAccount.userInfo.exp_date) * 1000).toLocaleDateString()}
                        </Text>
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Error Message */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#f43f5e" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Login Form */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Add New Account</Text>

              {/* Server URL */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Server Portal URL</Text>
                <View style={styles.inputRow}>
                  <Server size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="http://provider.com:8080"
                    placeholderTextColor="#475569"
                    value={serverUrl}
                    onChangeText={setServerUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.inputRow}>
                  <User size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter Xtream username"
                    placeholderTextColor="#475569"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputRow}>
                  <Key size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter Xtream password"
                    placeholderTextColor="#475569"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Format Switcher */}
              <View style={styles.formatGroup}>
                <Text style={styles.inputLabel}>Stream Format (Firestick / TV)</Text>
                <View style={styles.formatToggleRow}>
                  <TouchableOpacity
                    style={[styles.formatBtn, outputFormat === 'ts' && styles.formatBtnActive]}
                    onPress={() => setOutputFormat('ts')}
                  >
                    <Text style={[styles.formatBtnText, outputFormat === 'ts' && styles.formatBtnTextActive]}>
                      MPEG-TS (.ts) — Native Hardware
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formatBtn, outputFormat === 'm3u8' && styles.formatBtnActive]}
                    onPress={() => setOutputFormat('m3u8')}
                  >
                    <Text style={[styles.formatBtnText, outputFormat === 'm3u8' && styles.formatBtnTextActive]}>
                      HLS (.m3u8)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => handleConnect()}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#071018" />
                ) : (
                  <>
                    <LogIn size={18} color="#071018" />
                    <Text style={styles.submitBtnText}>Connect & Load Channels</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Saved Accounts */}
            {savedXtreamAccounts && savedXtreamAccounts.length > 0 && (
              <View style={styles.savedSection}>
                <Text style={styles.sectionTitle}>Saved Accounts</Text>
                {savedXtreamAccounts.map((acc, index) => (
                  <View key={`${acc.serverUrl}_${acc.username}_${index}`} style={styles.savedItem}>
                    <TouchableOpacity
                      style={styles.savedInfo}
                      onPress={() => handleConnect(acc)}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.savedServer} numberOfLines={1}>{acc.serverUrl}</Text>
                      <Text style={styles.savedUser}>User: {acc.username}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeSavedAccount(acc.serverUrl, acc.username)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={16} color="#94a3b8" />
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  container: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#0c131d',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800'
  },
  closeBtn: {
    padding: 4
  },
  scrollArea: {
    flexGrow: 1
  },
  scrollContent: {
    padding: 20,
    gap: 18
  },
  activeCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 14,
    gap: 6
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  statusText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 13
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  disconnectText: {
    color: '#f43f5e',
    fontSize: 12,
    fontWeight: '600'
  },
  activeServer: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  },
  activeUser: {
    color: '#94a3b8',
    fontSize: 13
  },
  accountMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 12
  },
  metaValue: {
    color: '#cbd5e1',
    fontWeight: '600'
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    padding: 12,
    borderRadius: 10
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 13,
    flex: 1
  },
  formSection: {
    gap: 14
  },
  sectionTitle: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  inputGroup: {
    gap: 6
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12
  },
  inputIcon: {
    marginRight: 8
  },
  textInput: {
    flex: 1,
    height: 44,
    color: '#ffffff',
    fontSize: 14
  },
  formatGroup: {
    gap: 8
  },
  formatToggleRow: {
    flexDirection: 'column',
    gap: 8
  },
  formatBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10
  },
  formatBtnActive: {
    backgroundColor: 'rgba(86, 214, 194, 0.12)',
    borderColor: '#56d6c2'
  },
  formatBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600'
  },
  formatBtnTextActive: {
    color: '#56d6c2',
    fontWeight: '700'
  },
  submitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#56d6c2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6
  },
  submitBtnText: {
    color: '#071018',
    fontSize: 15,
    fontWeight: '800'
  },
  savedSection: {
    gap: 10,
    marginTop: 8
  },
  savedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12
  },
  savedInfo: {
    flex: 1
  },
  savedServer: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  savedUser: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2
  },
  deleteBtn: {
    padding: 8
  }
});
