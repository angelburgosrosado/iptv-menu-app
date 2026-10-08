/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  Play,
  Pause,
  RotateCcw,
  AlertCircle,
  Volume2,
  VolumeX,
  ChevronLeft,
  Tv,
  Radio,
  PictureInPicture,
  Layers,
} from 'lucide-react-native';
import { PALETTE, RADII } from '../theme/tokens';
import { Focusable } from './Focusable';

interface VideoPlayerProps {
  streamUrl: string;
  channelName: string;
  fallbackUrls?: string[];
  channelGroup?: string;
  onBackPress?: () => void;
  onZapNext?: () => void;
  onZapPrev?: () => void;
}

export function VideoPlayer({
  streamUrl,
  channelName,
  fallbackUrls = [],
  channelGroup,
  onBackPress,
  onZapNext,
  onZapPrev,
}: VideoPlayerProps) {
  const [activeUrlIndex, setActiveUrlIndex] = useState(0);
  const allUrls = [streamUrl, ...fallbackUrls].filter(Boolean);
  const currentUrl = allUrls[activeUrlIndex] || streamUrl;

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const player = useVideoPlayer({ uri: currentUrl }, (playerRef) => {
    playerRef.loop = false;
    playerRef.play();
  });

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  }, []);

  // Update source if currentUrl changes
  useEffect(() => {
    if (!player || !currentUrl) return;
    setHasError(false);
    setIsLoading(true);
    player.replace({ uri: currentUrl });
    player.play();
  }, [player, currentUrl]);

  // Clean up timer and playback on unmount
  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      try {
        player?.pause();
      } catch {}
    };
  }, [player, resetControlsTimer]);

  // Listen to expo-video events
  useEffect(() => {
    if (!player) return;

    const subStatus = player.addListener('statusChange', (statusPayload: any) => {
      const status = statusPayload?.status || statusPayload;
      if (status === 'readyToPlay' || status === 'playing') {
        setIsPlaying(true);
        setIsLoading(false);
        setHasError(false);
      } else if (status === 'loading') {
        setIsLoading(true);
      } else if (status === 'error') {
        setIsLoading(false);
        // Automatic Container Fallback: Try alternate URL (e.g., TS <-> M3U8)
        if (activeUrlIndex < allUrls.length - 1) {
          console.warn(`Stream failed on ${currentUrl}, attempting fallback URL...`);
          setActiveUrlIndex((prev) => prev + 1);
        } else {
          setHasError(true);
        }
      }
    });

    const subPlay = player.addListener('playingChange', (payload: any) => {
      const playing = typeof payload === 'boolean' ? payload : payload?.isPlaying;
      setIsPlaying(Boolean(playing));
    });

    return () => {
      subStatus?.remove?.();
      subPlay?.remove?.();
    };
  }, [player, activeUrlIndex, allUrls, currentUrl]);

  const togglePlayPause = () => {
    resetControlsTimer();
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    resetControlsTimer();
    player.muted = !player.muted;
    setIsMuted(player.muted);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setActiveUrlIndex(0);
    player.replace({ uri: streamUrl });
    player.play();
    setIsPlaying(true);
  };

  return (
    <View style={styles.container}>
      {/* Underlying Video View with native PiP */}
      <VideoView
        player={player}
        style={styles.video}
        allowsPictureInPicture
        startsPictureInPictureAutomatically
        contentFit="contain"
      />

      {/* Touch surface to reveal OSD controls */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={resetControlsTimer}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Loading Buffering Indicator */}
      {isLoading && !hasError && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
          <Text style={styles.overlayText}>Buffering live feed...</Text>
          {activeUrlIndex > 0 && (
            <Text style={styles.fallbackNotice}>Testing alternate container stream...</Text>
          )}
        </View>
      )}

      {/* Error & Automatic Fallback Overlay */}
      {hasError && (
        <View style={styles.errorOverlay}>
          <AlertCircle size={40} color={PALETTE.accentLive} />
          <Text style={styles.errorTitle}>Stream Temporarily Unavailable</Text>
          <Text style={styles.errorSubtitle}>
            Failed to resolve live broadcast feed. Check your connection or provider limits.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
            <RotateCcw size={16} color="#fff" />
            <Text style={styles.retryText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Glassmorphic OSD Overlay */}
      {showControls && (
        <View style={styles.osdContainer} pointerEvents="box-none">
          {/* Top Bar: Back Button, Channel Info, Live Badge */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              {onBackPress && (
                <TouchableOpacity
                  onPress={onBackPress}
                  hitSlop={12}
                  style={styles.backBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Return to channels"
                >
                  <ChevronLeft size={24} color="#fff" />
                </TouchableOpacity>
              )}
              <View>
                <Text style={styles.channelName} numberOfLines={1}>
                  {channelName}
                </Text>
                {channelGroup && (
                  <Text style={styles.channelGroup}>{channelGroup}</Text>
                )}
              </View>
            </View>

            <View style={styles.topBarRight}>
              <View style={styles.liveBadge}>
                <Radio size={12} color="#fff" />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowDiagnostics((prev) => !prev)}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Stream diagnostics"
              >
                <Layers size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Diagnostics HUD */}
          {showDiagnostics && (
            <View style={styles.diagnosticsBox}>
              <Text style={styles.diagTitle}>STREAM DIAGNOSTICS</Text>
              <Text style={styles.diagText}>URL: {currentUrl}</Text>
              <Text style={styles.diagText}>Format: {currentUrl.includes('.m3u8') ? 'HLS' : 'MPEG-TS'}</Text>
              <Text style={styles.diagText}>Fallback Active: {activeUrlIndex > 0 ? 'YES' : 'NO'}</Text>
              <Text style={styles.diagText}>Status: {isPlaying ? 'PLAYING' : 'PAUSED'}</Text>
            </View>
          )}

          {/* Bottom Bar: Play/Pause, Mute, Channel Switchers */}
          <View style={styles.bottomBar}>
            <View style={styles.controlsRow}>
              <TouchableOpacity
                onPress={togglePlayPause}
                style={styles.playbackBtn}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause size={22} color="#fff" />
                ) : (
                  <Play size={22} color="#fff" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={toggleMute}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX size={20} color={PALETTE.accentLive} />
                ) : (
                  <Volume2 size={20} color="#fff" />
                )}
              </TouchableOpacity>

              {onZapPrev && (
                <TouchableOpacity onPress={onZapPrev} style={styles.zapBtn}>
                  <Text style={styles.zapBtnText}>CH -</Text>
                </TouchableOpacity>
              )}

              {onZapNext && (
                <TouchableOpacity onPress={onZapNext} style={styles.zapBtn}>
                  <Text style={styles.zapBtnText}>CH +</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  overlayText: {
    color: PALETTE.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  fallbackNotice: {
    color: PALETTE.primary,
    fontSize: 12,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PALETTE.bgBase,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  errorTitle: {
    color: PALETTE.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 6,
  },
  errorSubtitle: {
    color: PALETTE.textMuted,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PALETTE.primaryDark,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADII.md,
    marginTop: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  osdContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 18,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 9, 14, 0.72)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelName: {
    color: PALETTE.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  channelGroup: {
    color: PALETTE.primary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PALETTE.accentLive,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diagnosticsBox: {
    backgroundColor: 'rgba(7, 9, 14, 0.92)',
    padding: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    gap: 4,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  diagTitle: {
    color: PALETTE.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  diagText: {
    color: PALETTE.textSecondary,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bottomBar: {
    backgroundColor: 'rgba(7, 9, 14, 0.72)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  playbackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PALETTE.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zapBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.md,
  },
  zapBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});