/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Heart, Play, Share2, Tv, Radio } from 'lucide-react';
import { Channel } from '../types/iptv';
import { usePlayerStore } from '../store/usePlayerStore';
import { StreamResolutionBadge, StreamBitrateBadge, StreamCountryBadge } from './StreamInfoBadge';

interface ChannelCardProps {
  channel: Channel;
  isFavorite?: boolean;
  onPress?: () => void;
  onFavoriteToggle?: () => void;
}

// Wrap with React.memo to completely bypass re-renders during high-speed FlashList scrolls
export const ChannelCard = React.memo(({
  channel,
  isFavorite = false,
  onPress = () => {},
  onFavoriteToggle = () => {},
}: ChannelCardProps) => {
  const epgByChannel = usePlayerStore((s) => s.epgByChannel);
  const epgOverrides = usePlayerStore((s) => s.epgOverrides);
  const channelKey = epgOverrides?.[channel.id] || channel.tvgId || channel.epgChannelId || channel.id;
  const currentProgram = epgByChannel?.[channelKey]?.[0];

  const [imageError, setImageError] = React.useState(!channel.logo);
  const [streamStatus, setStreamStatus] = React.useState<'idle' | 'checking' | 'online' | 'offline'>('idle');
  const [showSharedToast, setShowSharedToast] = React.useState(false);

  // Swipe-left gesture simulation states
  const [translateX, setTranslateX] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);

  const dragStartXRef = React.useRef(0);
  const currentTranslateXRef = React.useRef(0);
  const isDraggingRef = React.useRef(false);

  // Synchronize state to refs for real-time document listeners access without closure stale state
  const isOpenRef = React.useRef(isOpen);
  React.useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const translateXRef = React.useRef(translateX);
  React.useEffect(() => {
    translateXRef.current = translateX;
  }, [translateX]);

  // Probing live stream status for HLS streams that resolve 200
  React.useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const checkStream = async () => {
      try {
        setStreamStatus('checking');
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s probe timeout
        const response = await fetch(channel.url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Range': 'bytes=0-0' // Request smallest byte chunk to avoid heavy streams download
          }
        });
        clearTimeout(timeoutId);

        if (isMounted) {
          if (response.ok || response.status === 200 || response.type === 'opaque') {
            setStreamStatus('online');
          } else {
            setStreamStatus('offline');
          }
        }
      } catch (err) {
        if (isMounted) {
          setStreamStatus('offline');
        }
      }
    };

    // Debounce stream checks by 500ms to avoid network thrashing on fast scroll
    const delayId = setTimeout(() => {
      checkStream();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(delayId);
      controller.abort();
    };
  }, [channel.url]);

  // Swipe Action event triggers
  const handleDragStart = (clientX: number) => {
    dragStartXRef.current = clientX;
    currentTranslateXRef.current = translateXRef.current;
    isDraggingRef.current = true;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const diffX = clientX - dragStartXRef.current;
    let newTranslate = currentTranslateXRef.current + diffX;
    
    // Slide left boundary controls (max slide reveals actions, slide right back to zero)
    if (newTranslate > 0) {
      newTranslate = 0;
    }
    if (newTranslate < -150) {
      newTranslate = -150; // extra swipe stretch resistance
    }
    setTranslateX(newTranslate);
  };

  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    
    // Gesture snap threshold checks
    if (translateXRef.current < -60) {
      setTranslateX(-120);
      setIsOpen(true);
    } else {
      setTranslateX(0);
      setIsOpen(false);
    }
  };

  // Setup document-level listeners to cleanly track mouse drag outside card bounds
  React.useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleDragMove(e.clientX);
      }
    };
    
    const onMouseUp = () => {
      if (isDraggingRef.current) {
        handleDragEnd();
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  const handleCardPress = () => {
    if (isOpen) {
      // If actions are swiped open, press closes swipe instead of playing
      setTranslateX(0);
      setIsOpen(false);
    } else {
      onPress();
    }
  };

  return (
    <div style={styles.cardWrapper as any}>
      {/* 1. Behind-the-card Action Buttons (revealed on swipe left) */}
      <div style={styles.actionsContainer as any}>
        {/* Favorite Swipe Action */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
            // Snap shut
            setTranslateX(0);
            setIsOpen(false);
          }}
          activeOpacity={0.7}
          style={[styles.actionBtn, styles.favoriteBtn]}
        >
          <Heart size={16} color="#ffffff" fill={isFavorite ? '#ffffff' : 'transparent'} />
          <Text style={styles.actionBtnText}>{isFavorite ? 'Remove' : 'Favorite'}</Text>
        </TouchableOpacity>

        {/* Share Swipe Action */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(channel.url);
            setShowSharedToast(true);
            setTimeout(() => setShowSharedToast(false), 2000);
            // Snap shut
            setTranslateX(0);
            setIsOpen(false);
          }}
          activeOpacity={0.7}
          style={[styles.actionBtn, styles.shareBtn]}
        >
          <Share2 size={16} color="#ffffff" />
          <Text style={styles.actionBtnText}>Share</Text>
        </TouchableOpacity>
      </div>

      {/* 2. Main foreground Channel Card with transition styles */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={(e) => {
          if (e.button === 0) {
            handleDragStart(e.clientX);
          }
        }}
        style={{
          ...styles.foregroundCard,
          transform: `translate3d(${translateX}px, 0, 0)`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <TouchableOpacity
          onPress={handleCardPress}
          activeOpacity={0.7}
          style={styles.containerInside}
        >
          {/* Logo / Fallback Container */}
          <View style={styles.imageWrapper}>
            {/* Live status dot with pulsing glow overlay */}
            {streamStatus === 'online' && (
              <div className="absolute top-1 left-1 z-30 flex h-2 w-2" title="HLS Stream: ACTIVE (200 OK)">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
            )}
            {streamStatus === 'offline' && (
              <div className="absolute top-1 left-1 z-30 flex h-1.5 w-1.5 rounded-full bg-red-500" title="HLS Stream: UNSTABLE (Offline)" />
            )}
            {streamStatus === 'checking' && (
              <div className="absolute top-1 left-1 z-30 flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" title="HLS Stream: Probing..." />
            )}
            
            {imageError ? (
              <View style={styles.fallbackIconContainer}>
                <Tv size={22} color="#a1a1aa" />
              </View>
            ) : (
              <Image
                source={{ uri: channel.logo }}
                contentFit="contain"
                transition={150}
                style={styles.logo}
                onError={() => setImageError(true)}
              />
            )}
            {/* Play Button Overlay */}
            <View style={styles.playOverlay}>
              <Play size={10} color="#ffffff" fill="#ffffff" />
            </View>
          </View>

          {/* Details Area */}
          <View style={styles.details}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text numberOfLines={1} style={styles.channelName}>
                {channel.name}
              </Text>
              <StreamResolutionBadge resolution={channel.resolution || '1080p'} />
              {channel.bitrate && <StreamBitrateBadge bitrate={channel.bitrate} fps={channel.fps} />}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <Text numberOfLines={1} style={styles.groupName}>
                {channel.group || 'General'}
              </Text>
              <StreamCountryBadge countryCode={channel.countryCode} countryName={channel.countryName} countryFlag={channel.countryFlag} />
            </View>
            {currentProgram?.title && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                  {currentProgram.title}
                </Text>
              </View>
            )}
            {((channel.actors && channel.actors.length > 0) || (channel.cast && channel.cast.length > 0)) && (
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                {[...(channel.actors || []), ...(channel.cast || [])].slice(0, 2).map((actor, idx) => (
                  <span key={idx} className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 truncate max-w-[120px]">
                    🎭 {actor}
                  </span>
                ))}
              </div>
            )}
          </View>

          {/* Favorite Quick Action (Heart) */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onFavoriteToggle();
            }}
            activeOpacity={0.6}
            style={styles.heartButton}
          >
            <Heart
              size={18}
              color={isFavorite ? '#ff4757' : '#4b5563'}
              fill={isFavorite ? '#ff4757' : 'transparent'}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </div>

      {/* 3. Copied Confirmation Toast Overlay */}
      {showSharedToast && (
        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-blue-600/95 backdrop-blur-md border border-blue-400/30 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-white font-semibold text-xs">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
            Link Copied!
          </div>
        </div>
      )}
    </div>
  );
});

ChannelCard.displayName = 'ChannelCard';

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#0c0c0e', // dark base underlay so actions look integrated
    overflow: 'hidden',
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 120,
    flexDirection: 'row',
    zIndex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionBtn: {
    width: 60,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 4,
  },
  favoriteBtn: {
    backgroundColor: '#dc2626', // red-600
  },
  shareBtn: {
    backgroundColor: '#2563eb', // blue-600
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  foregroundCard: {
    width: '100%',
    backgroundColor: '#111115', // darker rich grey-black
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  containerInside: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  imageWrapper: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  fallbackIconContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  playOverlay: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#3b82f6', // Tailwind bg-blue-500
    borderTopLeftRadius: 6,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    paddingRight: 8,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff', // Clean white display text
  },
  groupName: {
    fontSize: 11,
    color: '#71717a', // Muted zinc text
    marginTop: 2,
  },
  heartButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
});
