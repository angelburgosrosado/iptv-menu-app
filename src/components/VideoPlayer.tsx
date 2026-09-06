/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { 
  Play, 
  Pause, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  ChevronLeft,
  Tv,
  Airplay,
  Radio,
  Sliders
} from 'lucide-react';

interface VideoPlayerProps {
  streamUrl: string;
  channelName: string;
  groupTitle?: string;
  onBackPress?: () => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  enableKeyboardNavigation?: boolean;
}

export function VideoPlayer({ 
  streamUrl, 
  channelName, 
  groupTitle,
  onBackPress,
  onNextChannel,
  onPrevChannel,
  enableKeyboardNavigation = true
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1.0);
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [retryCount, setRetryCount] = React.useState(0);
  const [showControls, setShowControls] = React.useState(true);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [volumeHudText, setVolumeHudText] = React.useState<string | null>(null);
  const [channelHudText, setChannelHudText] = React.useState<string | null>(null);

  const containerRef = React.useRef<any>(null);
  const controlsTimeout = React.useRef<any>(null);
  const volumeHudTimeout = React.useRef<any>(null);
  const channelHudTimeout = React.useRef<any>(null);

  // Initialize the native expo-video controller (or shimmed counterpart)
  const player = useVideoPlayer({ uri: streamUrl }, (playerRef) => {
    playerRef.play();
  });

  // Automatically fade out controls after 4 seconds of inactivity
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    controlsTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  const triggerVolumeHud = (text: string) => {
    setVolumeHudText(text);
    if (volumeHudTimeout.current) clearTimeout(volumeHudTimeout.current);
    volumeHudTimeout.current = setTimeout(() => setVolumeHudText(null), 1800);
  };

  const triggerChannelHud = (text: string) => {
    setChannelHudText(text);
    if (channelHudTimeout.current) clearTimeout(channelHudTimeout.current);
    channelHudTimeout.current = setTimeout(() => setChannelHudText(null), 2500);
  };

  React.useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      if (volumeHudTimeout.current) clearTimeout(volumeHudTimeout.current);
      if (channelHudTimeout.current) clearTimeout(channelHudTimeout.current);
    };
  }, []);

  // Sync isPlaying state with the actual video element using native video status hooks
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
    const newMuted = player.toggleMute ? player.toggleMute() : !isMuted;
    setIsMuted(newMuted);
    triggerVolumeHud(newMuted ? 'Muted' : `Volume: ${Math.round(volume * 100)}%`);
  };

  const changeVolume = (delta: number) => {
    resetControlsTimer();
    const newVol = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVol);
    if (player.setVolume) {
      player.setVolume(newVol);
    }
    setIsMuted(newVol === 0);
    triggerVolumeHud(newVol === 0 ? 'Muted' : `Volume: ${Math.round(newVol * 100)}%`);
  };

  const toggleFullscreen = async () => {
    resetControlsTimer();
    if (player.toggleFullscreen) {
      const active = await player.toggleFullscreen();
      setIsFullscreen(active);
    }
  };

  const togglePiP = async () => {
    resetControlsTimer();
    if (player.togglePiP) {
      await player.togglePiP();
    }
  };

  // Perform HLS Stream Error Recovery / Reload
  const handleReloadStream = () => {
    setHasError(false);
    setIsLoading(true);
    setRetryCount((prev) => prev + 1);
    
    // Force native stream reload
    const decodedUrl = decodeURI(streamUrl);
    player.replace({ uri: decodedUrl });
    player.play();
    setIsPlaying(true);
  };

  // Safe wrapper for React Native video status listeners
  React.useEffect(() => {
    const video = player._videoRef?.current;
    if (!video) return;

    const onPlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setHasError(false);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    const onError = (e: any) => {
      console.warn('IPTV Stream Error:', e);
      setIsLoading(false);
      setHasError(true);
    };

    const onLoad = () => {
      setIsLoading(false);
      setHasError(false);
    };

    video.addEventListener('playing', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);
    video.addEventListener('loadedmetadata', onLoad);

    return () => {
      video.removeEventListener('playing', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onError);
      video.removeEventListener('loadedmetadata', onLoad);
    };
  }, [player, retryCount]);

  // 10-Foot D-Pad & TV Remote / Keyboard Navigation Listener
  React.useEffect(() => {
    if (!enableKeyboardNavigation || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      switch (e.code) {
        case 'ArrowUp':
          e.preventDefault();
          if (onPrevChannel) {
            onPrevChannel();
            triggerChannelHud('▲ Previous Channel');
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (onNextChannel) {
            onNextChannel();
            triggerChannelHud('▼ Next Channel');
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyP':
          e.preventDefault();
          togglePiP();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardNavigation, volume, isPlaying, isMuted, onNextChannel, onPrevChannel]);

  return (
    <View 
      ref={containerRef}
      style={styles.container} 
      onTouchStart={resetControlsTimer}
    >
      {/* 1. Underlying Native Video View */}
      <VideoView
        player={player}
        style={styles.videoStyle}
        startsInFullscreen={false}
      />

      {/* 2. Floating TV HUD Badges (Volume & Channel Switch) */}
      {volumeHudText && (
        <View style={styles.hudBadgeContainer}>
          <View style={styles.hudPill}>
            {isMuted || volume === 0 ? (
              <VolumeX size={16} color="#ef4444" />
            ) : (
              <Volume2 size={16} color="#60a5fa" />
            )}
            <Text style={styles.hudPillText}>{volumeHudText}</Text>
          </View>
        </View>
      )}

      {channelHudText && (
        <View style={styles.hudBadgeContainer}>
          <View style={styles.channelPill}>
            <Tv size={16} color="#3b82f6" />
            <Text style={styles.hudPillText}>{channelHudText}</Text>
          </View>
        </View>
      )}

      {/* 3. Loading State Overlay */}
      {isLoading && !hasError && (
        <View style={styles.centerOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.overlayText}>Decoding IPTV stream via HLS Engine...</Text>
        </View>
      )}

      {/* 4. Error Recovery Overlay */}
      {hasError && (
        <View style={styles.errorOverlay}>
          <AlertCircle size={42} color="#ef4444" />
          <Text style={styles.errorText}>Stream Temporarily Offline</Text>
          <Text style={styles.errorDetails}>This feed was unreachable or blocked by CORS. Automatic stream relay available.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleReloadStream}
            activeOpacity={0.7}
          >
            <RotateCcw size={16} color="#ffffff" />
            <Text style={styles.retryButtonText}>Auto-Recover via Relay</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 5. Custom Video HUD Overlays */}
      {showControls && (
        <View style={styles.hudOverlay}>
          {/* Top Control Bar */}
          <View style={styles.topBar}>
            {onBackPress && (
              <TouchableOpacity onPress={onBackPress} style={styles.hudIconBtn}>
                <ChevronLeft size={24} color="#ffffff" />
              </TouchableOpacity>
            )}
            <View style={styles.titleContainer}>
              <Text numberOfLines={1} style={styles.hudTitle}>
                {channelName}
              </Text>
              <Text style={styles.hudSubtitle}>
                {groupTitle ? `${groupTitle} • ` : ''}Live HLS Stream
              </Text>
            </View>

            {/* D-Pad / Remote Hint Badge */}
            <View style={styles.remoteHintBadge}>
              <Radio size={12} color="#60a5fa" />
              <Text style={styles.remoteHintText}>D-Pad Active (↑↓ Ch, ←→ Vol, F Fullscreen, P PiP)</Text>
            </View>
          </View>

          {/* Center Playback Overlay Button */}
          <View style={styles.centerPlayBtnContainer}>
            {!isLoading && !hasError && (
              <TouchableOpacity
                onPress={togglePlayPause}
                style={styles.centerPlayBtn}
              >
                {isPlaying ? (
                  <Pause size={28} color="#ffffff" fill="#ffffff" />
                ) : (
                  <Play size={28} color="#ffffff" fill="#ffffff" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom Control Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity onPress={togglePlayPause} style={styles.hudIconBtn} title="Play/Pause (Space)">
              {isPlaying ? <Pause size={20} color="#ffffff" /> : <Play size={20} color="#ffffff" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleMute} style={styles.hudIconBtn} title="Mute (M)">
              {isMuted ? <VolumeX size={20} color="#ef4444" /> : <Volume2 size={20} color="#ffffff" />}
            </TouchableOpacity>

            <View style={styles.spacer} />

            {/* Picture-in-Picture Button */}
            <TouchableOpacity onPress={togglePiP} style={styles.hudIconBtn} title="Picture in Picture (P)">
              <Airplay size={18} color="#94a3b8" />
            </TouchableOpacity>

            {/* Fullscreen Button */}
            <TouchableOpacity onPress={toggleFullscreen} style={styles.hudIconBtn} title="Fullscreen (F)">
              {isFullscreen ? <Minimize size={18} color="#ffffff" /> : <Maximize size={18} color="#ffffff" />}
            </TouchableOpacity>

            <Text style={styles.liveIndicator}>● LIVE</Text>
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
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  videoStyle: {
    width: '100%',
    height: '100%',
  },
  hudBadgeContainer: {
    position: 'absolute',
    top: 24,
    alignSelf: 'center',
    zIndex: 40,
  },
  hudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    backdropFilter: 'blur(12px)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  channelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 58, 138, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    backdropFilter: 'blur(12px)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  hudPillText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0b0f19',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 20,
  },
  overlayText: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 12,
  },
  errorText: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  errorDetails: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    maxWidth: 300,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  hudOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
    zIndex: 30,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  hudTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  hudSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
  },
  remoteHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  remoteHintText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  centerPlayBtnContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlayBtn: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  hudIconBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  liveIndicator: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    letterSpacing: 1,
  },
});

export default VideoPlayer;
