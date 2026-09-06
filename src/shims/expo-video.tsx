import * as React from 'react';

export interface VideoSource {
  uri: string;
}

export function useVideoPlayer(source: VideoSource | string, setup?: (player: any) => void) {
  const uri = typeof source === 'string' ? source : source?.uri;
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolumeState] = React.useState(1.0);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const player = React.useMemo(() => {
    return {
      _uri: uri,
      _videoRef: videoRef,
      play: () => {
        if (videoRef.current) {
          videoRef.current.play().catch(err => console.log('playback error:', err));
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
  }, [uri, isPlaying, currentTime, duration, volume, isMuted]);

  // Handle source callbacks
  React.useEffect(() => {
    if (setup) {
      setup(player);
    }
  }, [player, setup]);

  return player;
}

export const VideoView = ({ player, style, startsInFullscreen = false, ...props }: any) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const activeHlsRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!player || !videoRef.current) return;
    player._videoRef.current = videoRef.current;

    const rawUri = player._uri;
    if (!rawUri) return;

    // Mixed Content Guard: If page is HTTPS and stream is HTTP, route through backend proxy
    const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isHttpStream = rawUri.startsWith('http://');
    const initialStreamUrl = (isHttpsPage && isHttpStream && !rawUri.includes('/api/stream/proxy'))
      ? `/api/stream/proxy?url=${encodeURIComponent(rawUri)}`
      : rawUri;

    // Clean up previous Hls instance
    if (activeHlsRef.current) {
      activeHlsRef.current.destroy();
      activeHlsRef.current = null;
    }

    if (initialStreamUrl.includes('.m3u8') || initialStreamUrl.includes('/api/stream/proxy')) {
      if ((window as any).Hls) {
        initHls(initialStreamUrl);
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
        script.async = true;
        script.onload = () => initHls(initialStreamUrl);
        document.body.appendChild(script);
      }
    } else {
      videoRef.current.src = initialStreamUrl;
    }

    function initHls(streamUrl: string, isFallbackAttempt = false) {
      const video = videoRef.current;
      if (!video) return;

      if ((window as any).Hls?.isSupported()) {
        const hls = new (window as any).Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 5,
          maxLiveSyncPlaybackRate: 1.1,
        });
        activeHlsRef.current = hls;

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(err => console.log('hls autoplay suppressed:', err));
        });

        hls.on((window as any).Hls.Events.ERROR, (event: any, data: any) => {
          if (data.fatal) {
            switch (data.type) {
              case (window as any).Hls.ErrorTypes.NETWORK_ERROR:
                // Auto-fallback to backend proxy relay if direct stream fails with CORS or network drop
                if (!isFallbackAttempt && !streamUrl.includes('/api/stream/proxy')) {
                  console.log('Direct HLS blocked or network error. Switching to backend stream proxy relay...');
                  hls.destroy();
                  activeHlsRef.current = null;
                  const proxyUrl = `/api/stream/proxy?url=${encodeURIComponent(rawUri)}`;
                  initHls(proxyUrl, true);
                  return;
                }
                hls.startLoad();
                break;
              case (window as any).Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                activeHlsRef.current = null;
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Apple Safari HLS support
        video.src = streamUrl;
      }
    }

    return () => {
      if (activeHlsRef.current) {
        activeHlsRef.current.destroy();
        activeHlsRef.current = null;
      }
    };
  }, [player, player?._uri]);

  return (
    <video
      ref={videoRef}
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
