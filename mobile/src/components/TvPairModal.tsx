/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Tv,
  CheckCircle2,
  RefreshCw,
  X,
  Smartphone,
  Sparkles,
} from 'lucide-react-native';
import { PALETTE, RADII } from '../theme/tokens';
import { Focusable } from './Focusable';

interface TvPairModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TvPairModal({ visible, onClose }: TvPairModalProps) {
  const [code, setCode] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(600);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [claimedUser, setClaimedUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  const apiBase = process.env.EXPO_PUBLIC_API_URL || 'https://iptv.menu';

  const generateCode = async () => {
    setIsGenerating(true);
    setError(null);
    setIsClaimed(false);
    setClaimedUser(null);
    try {
      const res = await fetch(`${apiBase}/api/public/pair/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: Platform.OS === 'android' ? 'Android / Fire TV' : 'Apple TV' }),
      });
      if (res.ok) {
        const data = await res.json();
        setCode(data.code);
        setExpiresIn(data.expiresIn || 600);
      } else {
        setError('Failed to generate pairing code. Please try again.');
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (visible) {
      generateCode();
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setCode(null);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [visible]);

  // Polling for claim status
  useEffect(() => {
    if (!code || isClaimed || !visible) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${apiBase}/api/public/pair/status/${code}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'claimed') {
            setIsClaimed(true);
            setClaimedUser(data.user);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        }
      } catch {
        // Silently retry polling
      }
    }, 2500);

    timerIntervalRef.current = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [code, isClaimed, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <Tv size={20} color={PALETTE.primary} />
              </View>
              <View>
                <Text style={styles.title}>Pair TV Device</Text>
                <Text style={styles.subtitle}>Quick Connect with Mobile / Web</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={PALETTE.textDim} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {isClaimed ? (
              <View style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <CheckCircle2 size={44} color={PALETTE.accentSuccess} />
                </View>
                <Text style={styles.successTitle}>TV Device Paired!</Text>
                <Text style={styles.successDesc}>
                  Successfully connected to{' '}
                  <Text style={styles.boldWhite}>
                    {claimedUser?.name || claimedUser?.email || 'IPTV Account'}
                  </Text>
                  . Your playlist and favorites are now synced.
                </Text>
                <Focusable onPress={onClose} style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>Start Watching</Text>
                </Focusable>
              </View>
            ) : isGenerating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PALETTE.primary} />
                <Text style={styles.loadingText}>Generating secure pairing session...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <Focusable onPress={generateCode} style={styles.retryBtn}>
                  <RefreshCw size={14} color="#fff" />
                  <Text style={styles.retryBtnText}>Generate New Code</Text>
                </Focusable>
              </View>
            ) : (
              <View style={styles.codeContainer}>
                <View style={styles.instructionBanner}>
                  <Smartphone size={16} color={PALETTE.primary} />
                  <Text style={styles.instructionText}>
                    On your phone or laptop, visit{' '}
                    <Text style={styles.boldCyan}>iptv.menu/pair</Text>
                  </Text>
                </View>

                {/* Big 6-Digit Code */}
                <View style={styles.digitsBox}>
                  {code ? (
                    code.split('').map((char, index) => (
                      <View key={index} style={styles.digitSlot}>
                        <Text style={styles.digitText}>{char}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.digitText}>------</Text>
                  )}
                </View>

                {/* Countdown & Refresh */}
                <View style={styles.timerRow}>
                  <Text style={styles.timerText}>
                    Expires in {Math.floor(expiresIn / 60)}:
                    {(expiresIn % 60).toString().padStart(2, '0')}
                  </Text>
                  <TouchableOpacity onPress={generateCode} style={styles.refreshBtn}>
                    <RefreshCw size={12} color={PALETTE.textDim} />
                    <Text style={styles.refreshBtnText}>New Code</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: PALETTE.bgSurface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.glassBorder,
    paddingBottom: 16,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(124, 92, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.25)',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: PALETTE.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  body: {
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: PALETTE.textDim,
    fontSize: 12,
  },
  errorContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: PALETTE.accentLive,
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PALETTE.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADII.md,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  codeContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 18,
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(124, 92, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADII.md,
    width: '100%',
    justifyContent: 'center',
  },
  instructionText: {
    color: PALETTE.textMuted,
    fontSize: 12,
  },
  boldCyan: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
  boldWhite: {
    color: '#fff',
    fontWeight: '700',
  },
  digitsBox: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  digitSlot: {
    width: 44,
    height: 56,
    borderRadius: RADII.md,
    backgroundColor: '#0a0d14',
    borderWidth: 1.5,
    borderColor: PALETTE.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  timerText: {
    color: PALETTE.textDim,
    fontSize: 11,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshBtnText: {
    color: PALETTE.textDim,
    fontSize: 11,
  },
  successContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginBottom: 6,
  },
  successTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  successDesc: {
    color: PALETTE.textDim,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  actionBtn: {
    marginTop: 12,
    width: '100%',
    backgroundColor: PALETTE.primary,
    paddingVertical: 12,
    borderRadius: RADII.md,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
