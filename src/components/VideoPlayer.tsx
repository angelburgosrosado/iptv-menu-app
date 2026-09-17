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
  Sliders,
  Layers,
  ShieldAlert,
  Server,
  Headphones,
  Subtitles,
  Check,
  Film,
  Bookmark as BookmarkIcon,
  Activity,
  Moon
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { DiagnosticsHUD } from './DiagnosticsHUD';
import SleepTimerModal from './SleepTimerModal';
import AudioEqualizerModal from './AudioEqualizerModal';
import { audioDspEngine } from '../utils/audioDspEngine';

interface VideoPlayerProps {
  streamUrl: string;
  channelName: string;
  groupTitle?: string;
  alternateUrls?: string[];
  corsProxyRecommended?: boolean;
  onBackPress?: () => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  enableKeyboardNavigation?: boolean;
  onStreamSourceChange?: (url: string, index: number, isProxy: boolean) => void;
}

export function VideoPlayer({ 
  streamUrl, 
  channelName, 
  groupTitle,
  alternateUrls = [],
  corsProxyRecommended = false,
  onBackPress,
  onNextChannel,
  onPrevChannel,
  enableKeyboardNavigation = true,
  onStreamSourceChange
}: VideoPlayerProps) {
  // Build deduplicated list of stream candidates
  const streamCandidates = React.useMemo(() => {
    const list: string[] = [];
    if (streamUrl && streamUrl.trim()) list.push(streamUrl.trim());
    for (const alt of alternateUrls) {
      if (alt && alt.trim() && !list.includes(alt.trim())) {
        list.push(alt.trim());
      }
    }
    return list;
  }, [streamUrl, alternateUrls]);

  const [activeCandidateIndex, setActiveCandidateIndex] = React.useState(0);
  const [isUsingProxyRelay, setIsUsingProxyRelay] = React.useState(corsProxyRecommended);

  // Compute actual active stream URL (either candidate or proxy wrapped)
  const activeRawUrl = streamCandidates[activeCandidateIndex] || streamUrl;
  const activeEffectiveUrl = React.useMemo(() => {
    if (isUsingProxyRelay && !activeRawUrl.includes('/api/stream/proxy')) {
      return `/api/stream/proxy?url=${encodeURIComponent(activeRawUrl)}`;
    }
    return activeRawUrl;
  }, [activeRawUrl, isUsingProxyRelay]);

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
  const [showTrackModal, setShowTrackModal] = React.useState<'audio' | 'subtitle' | null>(null);
  const [showDiagnostics, setShowDiagnostics] = React.useState(false);
  const [showSleepTimer, setShowSleepTimer] = React.useState(false);
  const [showEqualizer, setShowEqualizer] = React.useState(false);

  const { addBookmark, removeBookmark, isChannelBookmarked, scheduleRecording, sleepTimer, audioDsp } = usePlayerStore();
  const isBookmarked = isChannelBookmarked(channelName.toLowerCase().replace(/[^a-z0-9]/g, '-')) || isChannelBookmarked(channelName);

  const containerRef = React.useRef<any>(null);
  const controlsTimeout = React.useRef<any>(null);
  const volumeHudTimeout = React.useRef<any>(null);
  const channelHudTimeout = React.useRef<any>(null);

  // Initialize the native expo-video controller (or shimmed counterpart)
  const player = useVideoPlayer({ uri: activeEffectiveUrl }, (playerRef) => {
    playerRef.play();
  });

  // Attach Web Audio API DSP engine to player HTMLVideoElement
  React.useEffect(() => {
    if (player && (player as any).subscribe) {
      const unsubscribe = (player as any).subscribe((el: HTMLVideoElement | null) => {
        if (el) {
          audioDspEngine.attachMediaElement(el, audioDsp);
        }
      });
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, [player]);

  // Sync DSP config updates to Web Audio API engine
  React.useEffect(() => {
    audioDspEngine.applyConfig(audioDsp);
  }, [audioDsp]);

  // Dynamic audio ducking during Sleep Timer fade-out (last 60s)
  React.useEffect(() => {
    if (player && player.setVolume) {
      const effectiveVol = isMuted ? 0 : volume * (sleepTimer.isActive && sleepTimer.audioFadeOut ? sleepTimer.audioDuckRatio : 1.0);
      player.setVolume(effectiveVol);
    }
  }, [sleepTimer.isActive, sleepTimer.audioFadeOut, sleepTimer.audioDuckRatio, volume, isMuted, player]);

  // Sleep Timer expiration handler (pause / mute)
  React.useEffect(() => {
    if (!sleepTimer.isActive && sleepTimer.remainingSeconds === 0 && sleepTimer.durationMinutes > 0) {
      if (sleepTimer.endAction === 'pause' && isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else if (sleepTimer.endAction === 'mute' && !isMuted) {
        setIsMuted(true);
        if (player.setVolume) player.setVolume(0);
      }
    }
  }, [sleepTimer.isActive, sleepTimer.remainingSeconds, sleepTimer.durationMinutes, sleepTimer.endAction, isPlaying, isMuted, player]);

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

  // Switch stream source candidate or toggle proxy relay
  const switchCandidate = (nextIndex: number, useProxy = isUsingProxyRelay) => {
    if (nextIndex < 0 || nextIndex >= streamCandidates.length) return;
    setActiveCandidateIndex(nextIndex);
    setIsUsingProxyRelay(useProxy);
    setHasError(false);
    setIsLoading(true);
    setRetryCount((prev) => prev + 1);

    const targetRaw = streamCandidates[nextIndex];
    const targetUrl = useProxy && !targetRaw.includes('/api/stream/proxy')
      ? `/api/stream/proxy?url=${encodeURIComponent(targetRaw)}`
      : targetRaw;

    const decodedUrl = decodeURI(targetUrl);
    player.replace({ uri: decodedUrl });
    player.play();
    setIsPlaying(true);
    triggerChannelHud(`Feed ${nextIndex + 1}/${streamCandidates.length}${useProxy ? ' (Proxy)' : ''}`);
    onStreamSourceChange?.(targetRaw, nextIndex, useProxy);
  };

  // Perform HLS Stream Error Recovery / Reload / Cascade
  const handleReloadStream = () => {
    setHasError(false);
    setIsLoading(true);
    setRetryCount((prev) => prev + 1);
    
    // Force native stream reload
    const decodedUrl = decodeURI(activeEffectiveUrl);
    player.replace({ uri: decodedUrl });
    player.play();
    setIsPlaying(true);
  };

  // Attempt next alternate feed candidate on failure
  const handleTryNextCandidate = () => {
    if (activeCandidateIndex + 1 < streamCandidates.length) {
      switchCandidate(activeCandidateIndex + 1, false);
    } else if (!isUsingProxyRelay) {
      // If all direct candidate streams failed, attempt proxy relay on primary stream
      switchCandidate(0, true);
    } else {
      // Exhausted all candidate streams and proxy relay
      handleReloadStream();
    }
  };

  const [videoEl, setVideoEl] = React.useState<HTMLVideoElement | null>(() => player._videoRef?.current || null);

  React.useEffect(() => {
    if (player._videoRef?.current) {
      setVideoEl(player._videoRef.current);
    }
    const unsub = player.subscribe ? player.subscribe((el: HTMLVideoElement | null) => {
      setVideoEl(el);
    }) : undefined;
    return () => unsub?.();
  }, [player]);

  // Safe wrapper for video status listeners
  React.useEffect(() => {
    if (!videoEl) return;

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

    if (videoEl.readyState >= 2) {
      setIsLoading(false);
      setHasError(false);
    }

    videoEl.addEventListener('playing', onPlay);
    videoEl.addEventListener('canplay', onLoad);
    videoEl.addEventListener('loadeddata', onLoad);
    videoEl.addEventListener('pause', onPause);
    videoEl.addEventListener('waiting', onWaiting);
    videoEl.addEventListener('error', onError);
    videoEl.addEventListener('loadedmetadata', onLoad);

    return () => {
      videoEl.removeEventListener('playing', onPlay);
      videoEl.removeEventListener('canplay', onLoad);
      videoEl.removeEventListener('loadeddata', onLoad);
      videoEl.removeEventListener('pause', onPause);
      videoEl.removeEventListener('waiting', onWaiting);
      videoEl.removeEventListener('error', onError);
      videoEl.removeEventListener('loadedmetadata', onLoad);
    };
  }, [videoEl, retryCount, activeEffectiveUrl]);

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
        case 'KeyD':
          e.preventDefault();
          setShowDiagnostics((prev) => !prev);
          break;
        case 'KeyZ':
          e.preventDefault();
          setShowSleepTimer((prev) => !prev);
          break;
        case 'KeyQ':
          e.preventDefault();
          setShowEqualizer((prev) => !prev);
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
          <Text style={styles.errorDetails}>
            {streamCandidates.length > 1
              ? `Feed ${activeCandidateIndex + 1} of ${streamCandidates.length} is unreachable. You can switch to an alternate broadcast feed or route through the proxy relay.`
              : 'This upstream feed is currently unreachable or locked by the provider (e.g. connection limit, IP restriction, or stream offline).'}
          </Text>

          {/* Alternate candidate quick pills if multiple feeds are available */}
          {streamCandidates.length > 1 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              {streamCandidates.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.candidatePill,
                    activeCandidateIndex === idx && styles.candidatePillActive
                  ]}
                  onPress={() => switchCandidate(idx, isUsingProxyRelay)}
                  activeOpacity={0.7}
                >
                  <Layers size={12} color={activeCandidateIndex === idx ? '#60a5fa' : '#94a3b8'} />
                  <Text style={[
                    styles.candidatePillText,
                    activeCandidateIndex === idx && styles.candidatePillTextActive
                  ]}>
                    Feed {idx + 1} {idx === 0 ? '(Primary)' : `(Alt ${idx})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 4 }}>
            {streamCandidates.length > 1 && (
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: '#0284c7' }]}
                onPress={handleTryNextCandidate}
                activeOpacity={0.7}
              >
                <Layers size={16} color="#ffffff" />
                <Text style={styles.retryButtonText}>
                  {activeCandidateIndex + 1 < streamCandidates.length ? 'Try Next Feed' : 'Try Feed 1 via Proxy'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.retryButton,
                isUsingProxyRelay ? { backgroundColor: '#9333ea' } : { backgroundColor: '#374151' }
              ]}
              onPress={() => switchCandidate(activeCandidateIndex, !isUsingProxyRelay)}
              activeOpacity={0.7}
            >
              <Server size={16} color="#ffffff" />
              <Text style={styles.retryButtonText}>
                {isUsingProxyRelay ? 'Proxy Active (Disable)' : 'Route via Proxy'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleReloadStream}
              activeOpacity={0.7}
            >
              <RotateCcw size={16} color="#ffffff" />
              <Text style={styles.retryButtonText}>Retry Feed</Text>
            </TouchableOpacity>

            {onNextChannel && (
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: '#2563eb' }]}
                onPress={() => {
                  setHasError(false);
                  setIsLoading(true);
                  onNextChannel();
                }}
                activeOpacity={0.7}
              >
                <Tv size={16} color="#ffffff" />
                <Text style={styles.retryButtonText}>Next Channel</Text>
              </TouchableOpacity>
            )}
          </View>
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
              <Text style={styles.remoteHintText}>D-Pad Active (↑↓ Ch, ←→ Vol, F Fullscreen, P PiP, D Telemetry HUD)</Text>
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

            {/* Multi-Feed Candidate Cycle Button */}
            {streamCandidates.length > 1 && (
              <TouchableOpacity 
                onPress={() => switchCandidate((activeCandidateIndex + 1) % streamCandidates.length, isUsingProxyRelay)} 
                style={[styles.hudIconBtn, styles.hudFeedBadge]} 
                title="Cycle Alternate Broadcast Feeds"
              >
                <Layers size={14} color="#60a5fa" />
                <Text style={styles.hudFeedBadgeText}>Feed {activeCandidateIndex + 1}/{streamCandidates.length}</Text>
              </TouchableOpacity>
            )}

            {/* Gateway Proxy Toggle Button */}
            <TouchableOpacity 
              onPress={() => switchCandidate(activeCandidateIndex, !isUsingProxyRelay)} 
              style={[
                styles.hudIconBtn, 
                isUsingProxyRelay ? styles.hudProxyBadgeActive : styles.hudProxyBadgeInactive
              ]} 
              title={isUsingProxyRelay ? "Relayed via Proxy Gateway (Click to use direct stream)" : "Direct Stream (Click to route via Proxy Gateway)"}
            >
              <Server size={14} color={isUsingProxyRelay ? "#c084fc" : "#94a3b8"} />
              <Text style={[
                styles.hudProxyBadgeText,
                isUsingProxyRelay ? { color: "#c084fc" } : { color: "#94a3b8" }
              ]}>
                {isUsingProxyRelay ? "PROXY" : "DIRECT"}
              </Text>
            </TouchableOpacity>

            {/* Audio Track Selector Button */}
            {player.audioTracks && player.audioTracks.length > 1 && (
              <TouchableOpacity
                onPress={() => {
                  resetControlsTimer();
                  setShowTrackModal((prev) => prev === 'audio' ? null : 'audio');
                }}
                style={[
                  styles.hudIconBtn,
                  showTrackModal === 'audio' ? styles.hudTrackActive : styles.hudTrackInactive
                ]}
                title="Select Audio Track"
              >
                <Headphones size={14} color={showTrackModal === 'audio' ? "#38bdf8" : "#94a3b8"} />
                <Text style={[styles.hudTrackBadgeText, showTrackModal === 'audio' ? { color: '#38bdf8' } : {}]}>
                  Audio ({player.audioTracks.length})
                </Text>
              </TouchableOpacity>
            )}

            {/* Subtitle / Closed Caption Selector Button */}
            {player.subtitleTracks && player.subtitleTracks.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  resetControlsTimer();
                  setShowTrackModal((prev) => prev === 'subtitle' ? null : 'subtitle');
                }}
                style={[
                  styles.hudIconBtn,
                  showTrackModal === 'subtitle' ? styles.hudTrackActive : styles.hudTrackInactive
                ]}
                title="Select Subtitles / CC"
              >
                <Subtitles size={14} color={showTrackModal === 'subtitle' ? "#38bdf8" : (player.currentSubtitleTrack >= 0 ? "#22c55e" : "#94a3b8")} />
                <Text style={[
                  styles.hudTrackBadgeText, 
                  showTrackModal === 'subtitle' ? { color: '#38bdf8' } : (player.currentSubtitleTrack >= 0 ? { color: '#22c55e' } : {})
                ]}>
                  {player.currentSubtitleTrack >= 0 ? 'CC ON' : 'CC'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Instant DVR Stream Capture Button */}
            <TouchableOpacity
              onPress={() => {
                resetControlsTimer();
                const duration = 60;
                scheduleRecording({
                  channelId: channelName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                  channelName: channelName,
                  programTitle: `${channelName} Live Capture`,
                  programDescription: `Direct stream recording from ${channelName} initiated from live player controls.`,
                  streamUrl: activeEffectiveUrl,
                  startTime: new Date().toISOString(),
                  endTime: new Date(Date.now() + duration * 60000).toISOString(),
                  durationMinutes: duration,
                  status: 'recording',
                  fileSizeEstimate: '1.47 GB'
                });
                triggerChannelHud(`DVR: Recording ${channelName} (60 min)`);
              }}
              style={[
                styles.hudIconBtn, 
                { backgroundColor: 'rgba(168, 85, 247, 0.15)', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)' }
              ]}
              title="Instant DVR Record (60 min capture)"
            >
              <Film size={14} color="#c084fc" />
              <Text style={[styles.hudTrackBadgeText, { color: '#c084fc' }]}>REC</Text>
            </TouchableOpacity>

            {/* Bookmark Toggle Button */}
            <TouchableOpacity
              onPress={() => {
                resetControlsTimer();
                const chanId = channelName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                if (isBookmarked) {
                  removeBookmark(chanId);
                  removeBookmark(channelName);
                  triggerChannelHud('Removed from Bookmarks');
                } else {
                  addBookmark({
                    channelId: chanId,
                    channelName: channelName,
                    streamUrl: activeEffectiveUrl,
                    note: groupTitle || 'Live Stream'
                  });
                  triggerChannelHud(`Bookmarked ${channelName}`);
                }
              }}
              style={[
                styles.hudIconBtn, 
                isBookmarked 
                  ? { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)' }
                  : { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
              ]}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark Channel"}
            >
              <BookmarkIcon size={14} color={isBookmarked ? "#fbbf24" : "#94a3b8"} fill={isBookmarked ? "#fbbf24" : "none"} />
            </TouchableOpacity>

            {/* Stream Telemetry & Diagnostics HUD Toggle Button */}
            <TouchableOpacity
              onPress={() => {
                resetControlsTimer();
                setShowDiagnostics((prev) => !prev);
              }}
              style={[
                styles.hudIconBtn, 
                showDiagnostics 
                  ? { backgroundColor: 'rgba(6, 182, 212, 0.2)', borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.4)' }
                  : { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
              ]}
              title="Stream Telemetry & Diagnostics HUD (D)"
            >
              <Activity size={14} color={showDiagnostics ? "#22d3ee" : "#94a3b8"} />
              <Text style={[styles.hudTrackBadgeText, showDiagnostics ? { color: '#22d3ee' } : {}]}>HUD</Text>
            </TouchableOpacity>

            {/* Sleep Timer Automation Button */}
            <TouchableOpacity
              onPress={() => {
                resetControlsTimer();
                setShowSleepTimer((prev) => !prev);
              }}
              style={[
                styles.hudIconBtn,
                sleepTimer.isActive
                  ? { backgroundColor: 'rgba(99, 102, 241, 0.2)', borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.4)' }
                  : { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
              ]}
              title="Sleep Timer (Z)"
            >
              <Moon size={14} color={sleepTimer.isActive ? "#a5b4fc" : "#94a3b8"} />
              {sleepTimer.isActive && (
                <Text style={[styles.hudTrackBadgeText, { color: '#a5b4fc' }]}>
                  {Math.ceil(sleepTimer.remainingSeconds / 60)}m
                </Text>
              )}
            </TouchableOpacity>

            {/* Audio Equalizer & DSP Button */}
            <TouchableOpacity
              onPress={() => {
                resetControlsTimer();
                setShowEqualizer((prev) => !prev);
              }}
              style={[
                styles.hudIconBtn,
                audioDsp.enabled
                  ? { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.4)' }
                  : { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
              ]}
              title="Audio Equalizer & Sound Normalization DSP (Q)"
            >
              <Sliders size={14} color={audioDsp.enabled ? "#34d399" : "#94a3b8"} />
              <Text style={[styles.hudTrackBadgeText, audioDsp.enabled ? { color: '#34d399' } : {}]}>EQ</Text>
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

          {/* Audio & Subtitle Track Selector Flyout Popover */}
          {showTrackModal && (
            <View style={styles.trackFlyoutModal}>
              <View style={styles.trackFlyoutHeader}>
                <Text style={styles.trackFlyoutTitle}>
                  {showTrackModal === 'audio' ? 'Select Audio Track' : 'Select Subtitles / CC'}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTrackModal(null)}
                  style={styles.trackFlyoutClose}
                >
                  <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.trackFlyoutList}>
                {showTrackModal === 'subtitle' && (
                  <TouchableOpacity
                    onPress={() => {
                      player.setSubtitleTrack?.(-1);
                      setShowTrackModal(null);
                      triggerChannelHud('Subtitles: Off');
                    }}
                    style={[
                      styles.trackItem,
                      player.currentSubtitleTrack === -1 && styles.trackItemActive
                    ]}
                  >
                    <Text style={[styles.trackItemText, player.currentSubtitleTrack === -1 && styles.trackItemTextActive]}>
                      Off
                    </Text>
                    {player.currentSubtitleTrack === -1 && <Check size={14} color="#38bdf8" />}
                  </TouchableOpacity>
                )}

                {(showTrackModal === 'audio' ? player.audioTracks : player.subtitleTracks)?.map((track: any) => {
                  const isSelected = showTrackModal === 'audio'
                    ? player.currentAudioTrack === track.id
                    : player.currentSubtitleTrack === track.id;

                  return (
                    <TouchableOpacity
                      key={track.id}
                      onPress={() => {
                        if (showTrackModal === 'audio') {
                          player.setAudioTrack?.(track.id);
                          triggerChannelHud(`Audio: ${track.name}`);
                        } else {
                          player.setSubtitleTrack?.(track.id);
                          triggerChannelHud(`Subtitles: ${track.name}`);
                        }
                        setShowTrackModal(null);
                      }}
                      style={[styles.trackItem, isSelected && styles.trackItemActive]}
                    >
                      <View>
                        <Text style={[styles.trackItemText, isSelected && styles.trackItemTextActive]}>
                          {track.name}
                        </Text>
                        {track.lang && (
                          <Text style={styles.trackItemSubtext}>
                            {track.lang.toUpperCase()}
                          </Text>
                        )}
                      </View>
                      {isSelected && <Check size={14} color="#38bdf8" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}

      {/* 6. Stream Telemetry & Bitrate Diagnostics Overlay */}
      {showDiagnostics && (
        <DiagnosticsHUD
          streamUrl={activeEffectiveUrl}
          channelName={channelName}
          groupTitle={groupTitle}
          isProxy={isUsingProxyRelay}
          audioTracksCount={player.audioTracks ? player.audioTracks.length : 1}
          subtitleTracksCount={player.subtitleTracks ? player.subtitleTracks.length : 0}
          onClose={() => setShowDiagnostics(false)}
        />
      )}

      {/* 7. Sleep Timer Configuration & Playback Automation Modal */}
      <SleepTimerModal
        isOpen={showSleepTimer}
        onClose={() => setShowSleepTimer(false)}
      />

      {/* 8. Audio Equalizer & Sound Normalization DSP Modal */}
      <AudioEqualizerModal
        isOpen={showEqualizer}
        onClose={() => setShowEqualizer(false)}
      />
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
  candidatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  candidatePillActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  candidatePillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  candidatePillTextActive: {
    color: '#60a5fa',
    fontWeight: '700',
  },
  hudFeedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  hudFeedBadgeText: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '700',
  },
  hudProxyBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  hudProxyBadgeInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  hudProxyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hudTrackActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  hudTrackInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  hudTrackBadgeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trackFlyoutModal: {
    position: 'absolute',
    bottom: 74,
    left: 20,
    width: 240,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    padding: 12,
    zIndex: 50,
    backdropFilter: 'blur(16px)',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  trackFlyoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  trackFlyoutTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  trackFlyoutClose: {
    padding: 4,
  },
  trackFlyoutList: {
    maxHeight: 200,
    overflow: 'scroll',
    gap: 4,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  trackItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  trackItemText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  trackItemTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  trackItemSubtext: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
});

export default VideoPlayer;

