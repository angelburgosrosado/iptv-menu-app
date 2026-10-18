/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { PALETTE, RADII } from '../theme/tokens';
import { router } from 'expo-router';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[IPTV.Menu Pro Mobile Crash Guard]:', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
    try {
      router.replace('/');
    } catch {
      // Fallback
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>!</Text>
              </View>

              <Text style={styles.title}>IPTV.Menu Pro Recovery</Text>
              <Text style={styles.subtitle}>
                An unexpected exception was safely intercepted to prevent an Android app crash.
              </Text>

              {this.state.error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText} numberOfLines={4}>
                    {this.state.error.message || 'Unknown render exception'}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={this.handleRestart}
                activeOpacity={0.85}
                style={styles.actionBtn}
              >
                <Text style={styles.actionBtnText}>Restart Stream Engine</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.bgBase,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: PALETTE.bgSurface,
    borderRadius: RADII.xl,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 14,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ef4444',
    fontSize: 22,
    fontWeight: '900',
  },
  title: {
    color: PALETTE.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: PALETTE.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  errorBox: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: RADII.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  errorText: {
    color: '#f87171',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  actionBtn: {
    width: '100%',
    backgroundColor: PALETTE.primary,
    paddingVertical: 14,
    borderRadius: RADII.lg,
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default ErrorBoundary;
