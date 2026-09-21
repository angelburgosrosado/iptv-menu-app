/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { resolvePlaybackUrlSourceKind } from '../utils/streamDispatcher';

export interface VideoSource {
  uri: string;
}

export type PlaybackEngineType = 'auto' | 'hls' | 'mpegts' | 'native';

export function useVideoPlayer(source: VideoSource | string, setup?: (player: any) => void) {
  const uri = typeof source === 'string' ? source : source?.uri;
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolumeState] = React.useState(1.0);
  const [audioTracks, setAudioTracks] = React.useState<{ id: number; name: string; lang?: string }[]>([]);
  const [currentAudioTrack, setCurrentAudioTrack] = React.useState<number>(-1);
  const [subtitleTracks, setSubtitleTracks] = React.useState<{ id: number; name: string; lang?: string }[]>([]);
  const [currentSubtitleTrack, setCurrentSubtitleTrack] = React.useState<number>(-1);
  const [activeEngine, setActiveEngine] = React.useState<'hls' | 'mpegts' | 'native'>('hls');
  const [engineOverride, setEngineOverride] = React.useState<PlaybackEngineType>('auto');

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const subscribersRef = React.useRef(new Set<(el: HTMLVideoElement | null) => void>());
  const hlsRef = React.useRef<any>(null);
  const mpegtsRef = React.useRef<any>(null);

  const player = React.useMemo(() => {
    return {
      _uri: uri,
      _videoRef: videoRef,
      _engineOverride: engineOverride,
      activeEngine,
      setEngine: (engine: PlaybackEngineType) => {
        setEngineOverride(engine);
      },
      _attachVideo: (el: HTMLVideoElement | null) => {
        videoRef.current = el;
        subscribersRef.current.forEach((sub) => {
          try {
            sub(el);
          } catch (err) {
            console.error('Video subscriber error:', err);
          }
        });
      },
      _attachHls: (hlsInstance: any) => {
        hlsRef.current = hlsInstance;
      },
      _attachMpegts: (mpegtsInstance: any) => {
        mpegtsRef.current = mpegtsInstance;
      },
      _setActiveEngine: (engine: 'hls' | 'mpegts' | 'native') => {
        setActiveEngine(engine);
      },
      subscribe: (callback: (el: HTMLVideoElement | null) => void) => {
        subscribersRef.current.add(callback);
        if (videoRef.current) {
          callback(videoRef.current);
        }
        return () => {
          subscribersRef.current.delete(callback);
        };
      },
      play: () => {
        if (videoRef.current) {
          const p = videoRef.current.play();
          if (p !== undefined) {
            p.catch(err => {
              console.log('playback error, attempting muted fallback:', err);
              if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch(e => console.log('muted playback also suppressed:', e));
              }
            });
          }
          setIsPlaying(true);
        }
      },
      pause: () => {
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
      seekTo: (seconds: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = seconds;
          setCurrentTime(seconds);
        }
      },
      setVolume: (vol: number) => {
        const clamped = Math.max(0, Math.min(1, vol));
        if (videoRef.current) {
          videoRef.current.volume = clamped;
          videoRef.current.muted = clamped === 0;
        }
        setVolumeState(clamped);
        setIsMuted(clamped === 0);
      },
      toggleMute: () => {
        if (videoRef.current) {
          const nextMuted = !videoRef.current.muted;
          videoRef.current.muted = nextMuted;
          setIsMuted(nextMuted);
          return nextMuted;
        }
        return false;
      },
      toggleFullscreen: async () => {
        if (!videoRef.current) return false;
        try {
          if (!document.fullscreenElement) {
            const container = videoRef.current.parentElement || videoRef.current;
            if (container.requestFullscreen) {
              await container.requestFullscreen();
            } else if ((videoRef.current as any).webkitRequestFullscreen) {
              await (videoRef.current as any).webkitRequestFullscreen();
            }
            return true;
          } else {
            if (document.exitFullscreen) {
              await document.exitFullscreen();
            }
            return false;
          }
        } catch (err) {
          console.warn('Fullscreen request failed', err);
          return false;
        }
      },
      togglePiP: async () => {
        if (!videoRef.current) return false;
        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
            return false;
          } else if (document.pictureInPictureEnabled && videoRef.current.requestPictureInPicture) {
            await videoRef.current.requestPictureInPicture();
            return true;
          }
        } catch (err) {
          console.warn('Picture-in-picture failed', err);
        }
        return false;
      },
      replace: (newSource: VideoSource | string) => {
        const newUri = typeof newSource === 'string' ? newSource : newSource?.uri;
        player._uri = newUri;
        if (videoRef.current) {
          videoRef.current.src = newUri;
          videoRef.current.load();
        }
      },
      // Track Management
      audioTracks,
      currentAudioTrack,
      subtitleTracks,
      currentSubtitleTrack,
      setAudioTrack: (trackId: number) => {
        if (hlsRef.current) {
          hlsRef.current.audioTrack = trackId;
        }
        setCurrentAudioTrack(trackId);
      },
      setSubtitleTrack: (trackId: number) => {
        if (hlsRef.current) {
          hlsRef.current.subtitleTrack = trackId;
        }
        if (videoRef.current && (videoRef.current as any).textTracks) {
          const tt = (videoRef.current as any).textTracks;
          for (let i = 0; i < tt.length; i++) {
            tt[i].mode = (i === trackId) ? 'showing' : 'disabled';
          }
        }
        setCurrentSubtitleTrack(trackId);
      },
      _updateAudioTracks: (tracks: { id: number; name: string; lang?: string }[], current: number) => {
        setAudioTracks(tracks);
        setCurrentAudioTrack(current);
      },
      _updateSubtitleTracks: (tracks: { id: number; name: string; lang?: string }[], current: number) => {
        setSubtitleTracks(tracks);
        setCurrentSubtitleTrack(current);
      },
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      status: {
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted
      }
    };
  }, [uri, isPlaying, currentTime, duration, volume, isMuted, audioTracks, currentAudioTrack, subtitleTracks, currentSubtitleTrack, activeEngine, engineOverride]);

  // Handle source callbacks
  React.useEffect(() => {
    if (setup) {
      setup(player);
    }
  }, [player, setup]);

  return player;
}

// Helpers for loading external MSE libraries dynamically
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.body.appendChild(script);
  });
}

function loadHlsScript(): Promise<void> {
  if ((window as any).Hls) return Promise.resolve();
  return loadScript('https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js');
}

function loadMpegtsScript(): Promise<void> {
  if ((window as any).mpegts) return Promise.resolve();
  return loadScript('https://cdn.jsdelivr.net/npm/mpegts.js@1.7.3/dist/mpegts.min.js');
}

export const VideoView = ({ player, style, startsInFullscreen = false, ...props }: any) => {
  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const activeHlsRef = React.useRef<any>(null);
  const activeMpegtsRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!player || !localVideoRef.current) return;
    player._attachVideo?.(localVideoRef.current);

    const rawUri = player._uri;
    if (!rawUri) return;

    // Mixed Content Guard: If page is HTTPS and stream is HTTP, route through backend proxy
    const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isHttpStream = rawUri.startsWith('http://');
    const initialStreamUrl = (isHttpsPage && isHttpStream && !rawUri.includes('/api/stream/proxy'))
      ? `/api/stream/proxy?url=${encodeURIComponent(rawUri)}`
      : rawUri;

    // Clean up previous instances
    cleanupCurrentEngines();

    // Determine target engine based on override or auto-detection
    const override = player._engineOverride || 'auto';
    let targetEngine: 'hls' | 'mpegts' | 'native';

    if (override !== 'auto') {
      targetEngine = override;
    } else {
      const kind = resolvePlaybackUrlSourceKind(initialStreamUrl);
      if (kind === 'mpegts') {
        targetEngine = 'mpegts';
      } else if (kind === 'native') {
        targetEngine = 'native';
      } else {
        targetEngine = 'hls';
      }
    }

    if (targetEngine === 'mpegts') {
      initMpegts(initialStreamUrl);
    } else if (targetEngine === 'hls') {
      initHls(initialStreamUrl);
    } else {
      initNativeVideo(initialStreamUrl);
    }

    function cleanupCurrentEngines() {
      if (activeHlsRef.current) {
        try {
          activeHlsRef.current.destroy();
        } catch (e) {
          console.warn('Hls cleanup error:', e);
        }
        activeHlsRef.current = null;
      }
      if (activeMpegtsRef.current) {
        try {
          activeMpegtsRef.current.pause?.();
          activeMpegtsRef.current.unload?.();
          activeMpegtsRef.current.detachMediaElement?.();
          activeMpegtsRef.current.destroy?.();
        } catch (e) {
          console.warn('mpegts cleanup error:', e);
        }
        activeMpegtsRef.current = null;
      }
    }

    function initNativeVideo(streamUrl: string) {
      const video = localVideoRef.current;
      if (!video) return;
      player._setActiveEngine?.('native');
      video.src = streamUrl;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log('Direct video autoplay blocked, falling back to muted:', err);
          if (video) {
            video.muted = true;
            video.play().catch(() => {});
          }
        });
      }
    }

    function initMpegts(streamUrl: string, isFallback = false) {
      const video = localVideoRef.current;
      if (!video) return;

      loadMpegtsScript().then(() => {
        const mpegts = (window as any).mpegts;
        if (!mpegts || !mpegts.isSupported()) {
          console.warn('mpegts.js is not supported, falling back to HLS or native');
          if (!isFallback) {
            initHls(streamUrl, true);
          } else {
            initNativeVideo(streamUrl);
          }
          return;
        }

        player._setActiveEngine?.('mpegts');

        const mpegtsPlayer = mpegts.createPlayer({
          type: 'mse',
          isLive: true,
          url: streamUrl
        }, {
          enableWorker: true,
          lazyLoadMaxDuration: 3 * 60,
          seekType: 'range',
          liveBufferLatencyChasing: true,
          liveBufferLatencyMaxLatency: 2.0,
          liveBufferLatencyMinRemain: 0.5
        });

        activeMpegtsRef.current = mpegtsPlayer;
        player._attachMpegts?.(mpegtsPlayer);

        mpegtsPlayer.attachMediaElement(video);
        mpegtsPlayer.load();
        
        const playPromise = mpegtsPlayer.play();
        if (playPromise !== undefined) {
          playPromise.catch((err: any) => {
            console.log('mpegts autoplay blocked, falling back to muted:', err);
            if (video) {
              video.muted = true;
              video.play().catch(() => {});
            }
          });
        }

        mpegtsPlayer.on(mpegts.Events.ERROR, (errorType: any, errorDetail: any, errorInfo: any) => {
          console.warn('mpegts.js playback error:', errorType, errorDetail, errorInfo);
          video.dispatchEvent(new CustomEvent('error', { 
            detail: { engine: 'mpegts', type: errorType, detail: errorDetail, info: errorInfo } 
          }));
        });
      }).catch((err) => {
        console.error('Failed to load mpegts.js script:', err);
        initNativeVideo(streamUrl);
      });
    }

    function initHls(streamUrl: string, isFallbackAttempt = false) {
      const video = localVideoRef.current;
      if (!video) return;

      loadHlsScript().then(() => {
        const Hls = (window as any).Hls;
        if (Hls?.isSupported()) {
          player._setActiveEngine?.('hls');
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 5,
            maxLiveSyncPlaybackRate: 1.1,
          });
          activeHlsRef.current = hls;
          player._attachHls?.(hls);

          const syncTracks = () => {
            if (!hls) return;
            const aTracks = (hls.audioTracks || []).map((t: any, idx: number) => ({
              id: idx,
              name: t.name || t.lang || `Track ${idx + 1}`,
              lang: t.lang || ''
            }));
            player._updateAudioTracks?.(aTracks, hls.audioTrack ?? -1);

            const sTracks = (hls.subtitleTracks || []).map((t: any, idx: number) => ({
              id: idx,
              name: t.name || t.lang || `Subtitle ${idx + 1}`,
              lang: t.lang || ''
            }));
            player._updateSubtitleTracks?.(sTracks, hls.subtitleTrack ?? -1);
          };

          hls.loadSource(streamUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            syncTracks();
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch((err: any) => {
                console.log('hls unmuted autoplay suppressed by browser policy, trying muted:', err);
                video.muted = true;
                video.play().catch(e => console.log('hls muted autoplay also suppressed:', e));
              });
            }
          });

          hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, syncTracks);
          hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, syncTracks);
          hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, syncTracks);
          hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, syncTracks);

          hls.on(Hls.Events.ERROR, (event: any, data: any) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  // Auto-fallback to backend proxy relay if direct stream fails with CORS or network drop
                  if (!isFallbackAttempt && !streamUrl.includes('/api/stream/proxy')) {
                    console.log('Direct HLS blocked or network error. Switching to backend stream proxy relay...');
                    hls.destroy();
                    activeHlsRef.current = null;
                    const proxyUrl = `/api/stream/proxy?url=${encodeURIComponent(rawUri)}`;
                    initHls(proxyUrl, true);
                    return;
                  }
                  // Auto-fallback to mpegts.js if HLS manifest fails on a URL that might be raw TS
                  if (!isFallbackAttempt && (streamUrl.includes('.ts') || !streamUrl.includes('.m3u8'))) {
                    console.log('HLS manifest fatal error on possible TS stream, attempting mpegts.js fallback...');
                    hls.destroy();
                    activeHlsRef.current = null;
                    initMpegts(streamUrl, true);
                    return;
                  }
                  video.dispatchEvent(new CustomEvent('error', { detail: { engine: 'hls', ...data } }));
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  video.dispatchEvent(new CustomEvent('error', { detail: { engine: 'hls', ...data } }));
                  hls.destroy();
                  activeHlsRef.current = null;
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native Apple Safari HLS support
          player._setActiveEngine?.('native');
          video.src = streamUrl;
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              video.muted = true;
              video.play().catch(() => {});
            });
          }
        } else {
          initNativeVideo(streamUrl);
        }
      }).catch((err) => {
        console.error('Failed to load Hls script:', err);
        initNativeVideo(streamUrl);
      });
    }

    return () => {
      cleanupCurrentEngines();
    };
  }, [player, player?._uri, player?._engineOverride]);

  return (
    <video
      ref={(el) => {
        localVideoRef.current = el;
        if (player) {
          player._attachVideo?.(el);
        }
      }}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        objectFit: 'contain',
        ...style
      }}
      controls={false}
      autoPlay
      playsInline
      {...props}
    />
  );
};

export default VideoView;
