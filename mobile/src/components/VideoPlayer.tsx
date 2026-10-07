import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play, Pause, RotateCcw, AlertCircle, Volume2, VolumeX, ChevronLeft } from 'lucide-react-native';

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
  
  const player = useVideoPlayer({ uri: streamUrl }, (playerRef) => {
    playerRef.loop = false;
    playerRef.play();
  });

  const togglePlayPause = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const handleReloadStream = () => {
    setHasError(false);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
    player.replace({ uri: streamUrl });
    player.play();
    setIsPlaying(true);
  };

  // Synchronize when streamUrl prop changes (e.g., user selects a different channel)
  React.useEffect(() => {
    if (!player || !streamUrl) return;
    setHasError(false);
    setIsLoading(true);
    player.replace({ uri: streamUrl });
    player.play();
  }, [player, streamUrl]);

  // Clean up and stop audio/video on unmount
  React.useEffect(() => {
    return () => {
      try {
        player?.pause();
      } catch {
        // no-op
      }
    };
  }, [player]);

  React.useEffect(() => {
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
        setHasError(true);
      }
    });

    const subPlay = player.addListener('playingChange', (isPlayingPayload: any) => {
      const playing = typeof isPlayingPayload === 'boolean' ? isPlayingPayload : isPlayingPayload?.isPlaying;
      setIsPlaying(Boolean(playing));
    });

    return () => {
      subStatus?.remove?.();
      subPlay?.remove?.();
    };
  }, [player, retryCount]);

  return (
    <View style={styles.container}>
      <VideoView player={player} style={styles.video} />

      {isLoading && !hasError && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.overlayText}>Buffering stream...</Text>
        </View>
      )}

      {hasError && (
        <View style={styles.errorOverlay}>
          <AlertCircle size={36} color="#ef4444" />
          <Text style={styles.errorText}>Stream Temporary Offline</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleReloadStream}>
            <RotateCcw size={16} color="#fff" />
            <Text style={styles.retryText}>Retry Link</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', backgroundColor: '#000', position: 'relative' },
  video: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center' },
  overlayText: { color: '#94a3b8', marginTop: 12 },
  errorOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0b0f19', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#fff', fontSize: 16, marginVertical: 12 },
  retryBtn: { flexDirection: 'row', backgroundColor: '#2563eb', padding: 10, borderRadius: 8, gap: 6 },
  retryText: { color: '#fff', fontWeight: '600' }
});