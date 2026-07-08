/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play, Pause, Maximize, RotateCcw, AlertCircle, Volume2, VolumeX, ChevronLeft } from 'lucide-react';

interface VideoPlayerProps {
  streamUrl: string;
  channelName: string;
  onBackPress?: () => void;
}

export function VideoPlayer({ streamUrl, channelName, onBackPress }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isMuted, setIsMuted] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [retryCount, setRetryCount] = React.useState(0);
  const [showControls, setShowControls] = React.useState(true);
  const controlsTimeout = React.useRef<any>(null);

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

  React.useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
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
    const videoElement = player._videoRef?.current;
    if (videoElement) {
      videoElement.muted = !isMuted;
      setIsMuted(!isMuted);
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

  return (
    <View style={styles.container} onTouchStart={resetControlsTimer}>
      {/* 1. Underlying Native Video View */}
      <VideoView
        player={player}
        style={styles.videoStyle}
        startsInFullscreen={false}
      />

      {/* 2. Loading State Overlay */}
      {isLoading && !hasError && (
        <View style={styles.centerOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.overlayText}>Decoding IPTV stream...</Text>
        </View>
      )}

      {/* 3. Error Recovery Overlay */}
      {hasError && (
        <View style={styles.errorOverlay}>
          <AlertCircle size={42} color="#ef4444" />
          <Text style={styles.errorText}>Stream Temporary Offline</Text>
          <Text style={styles.errorDetails}>This HLS feed or player request was refused or timed out.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleReloadStream}
            activeOpacity={0.7}
          >
            <RotateCcw size={16} color="#ffffff" />
            <Text style={styles.retryButtonText}>Auto-Recover Stream</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 4. Custom Video HUD Overlays */}
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
              <Text style={styles.hudSubtitle}>Live Streaming HLS</Text>
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
                  <Play size={28} color="#ffffff" fill="#ffffff" className="ml-1" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom Control Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity onPress={togglePlayPause} style={styles.hudIconBtn}>
              {isPlaying ? <Pause size={20} color="#ffffff" /> : <Play size={20} color="#ffffff" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleMute} style={styles.hudIconBtn}>
              {isMuted ? <VolumeX size={20} color="#ef4444" /> : <Volume2 size={20} color="#ffffff" />}
            </TouchableOpacity>

            <View style={styles.spacer} />

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
    color: '#94a3b8', // text-slate-400
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  errorDetails: {
    color: '#64748b', // text-slate-500
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb', // bg-blue-600
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
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
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  hudTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  hudSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
  },
  centerPlayBtnContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlayBtn: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(30, 41, 59, 0.8)', // bg-slate-800/80
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
    gap: 16,
    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
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
    color: '#ef4444', // Red-500
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    letterSpacing: 1,
  },
});
export default VideoPlayer;
