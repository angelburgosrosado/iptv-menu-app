import * as React from 'react';

export interface VideoSource {
  uri: string;
}

export function useVideoPlayer(source: VideoSource | string, setup?: (player: any) => void) {
  const uri = typeof source === 'string' ? source : source?.uri;
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
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
      status: {
        isPlaying,
        currentTime,
        duration,
      }
    };
  }, [uri]);

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

  React.useEffect(() => {
    if (player && videoRef.current) {
      player._videoRef.current = videoRef.current;
      // If the player uri is HLS (.m3u8), we can dynamically attach hls.js!
      const uri = player._uri;
      if (uri) {
        if (uri.includes('.m3u8')) {
          // Check if Hls is loaded, if so initialize, else load Hls script dynamically
          if ((window as any).Hls) {
            initHls(uri);
          } else {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
            script.async = true;
            script.onload = () => initHls(uri);
            document.body.appendChild(script);
          }
        } else {
          videoRef.current.src = uri;
        }
      }
    }

    function initHls(streamUrl: string) {
      const video = videoRef.current;
      if (!video) return;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      } else if ((window as any).Hls.isSupported()) {
        const hls = new (window as any).Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(err => console.log('hls autoplay blocked or error:', err));
        });
      }
    }
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
      controls
      autoPlay
      playsInline
      {...props}
    />
  );
};
export default VideoView;
