/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Tv, 
  GripHorizontal, 
  Volume2, 
  VolumeX, 
  ExternalLink,
  Sparkles,
  Move
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { usePlayerStore } from '../store/usePlayerStore';
import { VideoPlayer } from './VideoPlayer';

interface FloatingPiPPlayerProps {
  onMaximize?: (channel: Channel) => void;
}

export default function FloatingPiPPlayer({ onMaximize }: FloatingPiPPlayerProps) {
  const { 
    isPiPActive, 
    pipChannel, 
    pipStreamUrl, 
    pipSize, 
    setPiPSize, 
    closePiP 
  } = usePlayerStore();

  const [position, setPosition] = React.useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Derive pixel dimensions based on pipSize
  const dimensions = React.useMemo(() => {
    switch (pipSize) {
      case 'compact':
        return { width: 280, height: 185 };
      case 'large':
        return { width: 480, height: 300 };
      case 'normal':
      default:
        return { width: 360, height: 235 };
    }
  }, [pipSize]);

  // Handle Drag Pointer Events
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from header handle
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = position ? position.x : rect.left;
    const currentY = position ? position.y : rect.top;

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: currentX,
      startY: currentY
    };

    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    const newX = dragStartRef.current.startX + deltaX;
    const newY = dragStartRef.current.startY + deltaY;

    // Clamp inside viewport
    const maxX = window.innerWidth - dimensions.width - 12;
    const maxY = window.innerHeight - dimensions.height - 12;

    setPosition({
      x: Math.max(12, Math.min(maxX, newX)),
      y: Math.max(12, Math.min(maxY, newY))
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Cycle sizes: compact -> normal -> large -> compact
  const handleCycleSize = () => {
    if (pipSize === 'compact') setPiPSize('normal');
    else if (pipSize === 'normal') setPiPSize('large');
    else setPiPSize('compact');
  };

  const handleMaximize = () => {
    if (!pipChannel) return;
    const targetChannel = pipChannel;
    closePiP();
    onMaximize?.(targetChannel);
  };

  // Handle window resize clamp
  React.useEffect(() => {
    const handleResize = () => {
      if (position) {
        const maxX = window.innerWidth - dimensions.width - 12;
        const maxY = window.innerHeight - dimensions.height - 12;
        setPosition((prev) => {
          if (!prev) return null;
          return {
            x: Math.max(12, Math.min(maxX, prev.x)),
            y: Math.max(12, Math.min(maxY, prev.y))
          };
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dimensions, position]);

  // Keyboard shortcut to close PiP (Esc when active)
  React.useEffect(() => {
    if (!isPiPActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        closePiP();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPiPActive, closePiP]);

  if (!isPiPActive || !pipChannel) return null;

  const stylePosition: React.CSSProperties = position
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${dimensions.width}px`,
      }
    : {
        right: '24px',
        bottom: '24px',
        width: `${dimensions.width}px`,
      };

  return (
    <aside
      ref={containerRef}
      role="region"
      aria-label="Picture in Picture Floating Mini-Player"
      style={stylePosition}
      className={`fixed z-40 bg-zinc-950/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-cyan-500/30 overflow-hidden flex flex-col transition-[width] duration-200 select-none ${
        isDragging ? 'opacity-95 shadow-cyan-500/20' : ''
      }`}
    >
      {/* Draggable Glassmorphic Titlebar */}
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="h-9 px-2.5 bg-gradient-to-r from-zinc-900/90 to-zinc-950/90 border-b border-white/10 flex items-center justify-between cursor-move text-zinc-300 hover:text-white transition-colors"
        title="Click and drag to reposition mini-player"
      >
        <div className="flex items-center gap-1.5 min-w-0 pr-2 pointer-events-none">
          <GripHorizontal className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
          <div className="w-4 h-4 rounded-md bg-cyan-600/20 flex items-center justify-center border border-cyan-500/30 flex-shrink-0">
            {pipChannel.logo ? (
              <img src={pipChannel.logo} alt="" className="w-3 h-3 object-contain" />
            ) : (
              <Tv className="w-2.5 h-2.5 text-cyan-400" />
            )}
          </div>
          <span className="text-xs font-bold text-white truncate font-sans">
            {pipChannel.name}
          </span>
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20 flex items-center gap-1 flex-shrink-0">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
            PiP
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Size Cycle Switcher */}
          <button
            type="button"
            onClick={handleCycleSize}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors text-[10px] font-bold font-mono px-1.5"
            title={`Current: ${pipSize.toUpperCase()} (Click to toggle size)`}
            aria-label="Resize PiP player"
          >
            {pipSize === 'compact' ? 'S' : pipSize === 'normal' ? 'M' : 'L'}
          </button>

          {/* Maximize to full cinema */}
          <button
            type="button"
            onClick={handleMaximize}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-cyan-300 transition-colors"
            title="Expand to Full Cinema Player"
            aria-label="Maximize player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Close PiP */}
          <button
            type="button"
            onClick={closePiP}
            className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
            title="Close Mini-Player (Esc)"
            aria-label="Close PiP"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Embedded Video Surface */}
      <div 
        style={{ height: `${dimensions.height - 36}px` }} 
        className="w-full bg-black relative overflow-hidden flex items-center justify-center"
      >
        <VideoPlayer
          streamUrl={pipStreamUrl || pipChannel.url}
          channelName={pipChannel.name}
          groupTitle={pipChannel.group}
          alternateUrls={pipChannel.alternateUrls}
          corsProxyRecommended={pipChannel.corsProxyRecommended}
          enableKeyboardNavigation={false}
        />
      </div>
    </aside>
  );
}
