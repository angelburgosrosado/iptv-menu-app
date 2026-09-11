/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useAdSenseStore } from '../../store/useAdSenseStore';

export type AdDesignatedArea = 
  | 'topBanner' 
  | 'bottomBanner' 
  | 'sidebar' 
  | 'channelList' 
  | 'playerOverlay';

interface AdSenseSlotProps {
  client?: string;
  slot?: string;
  designatedArea?: AdDesignatedArea;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export default function AdSenseSlot({
  client: propClient,
  slot: propSlot,
  designatedArea,
  format = 'auto',
  responsive = true,
  className = '',
  style = {}
}: AdSenseSlotProps) {
  const { enabled, clientId: storeClient, slots, testMode } = useAdSenseStore();
  const adRef = React.useRef<HTMLModElement | null>(null);
  const [adLoaded, setAdLoaded] = React.useState(false);

  // Determine effective client ID
  const effectiveClient = propClient || storeClient || 'ca-pub-1578853238313624';

  // Determine effective slot ID from designated area or direct prop
  const effectiveSlot = React.useMemo(() => {
    if (designatedArea) {
      const areaKey = `${designatedArea}Slot` as keyof typeof slots;
      if (slots[areaKey]) return slots[areaKey];
    }
    return propSlot || slots.topBannerSlot || '8849201938';
  }, [designatedArea, propSlot, slots]);

  React.useEffect(() => {
    if (!enabled || testMode) return;

    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      }
    } catch (e) {
      console.warn('AdSense push notice:', e);
    }
  }, [enabled, testMode, effectiveSlot, effectiveClient]);

  // If ads are disabled globally from the backend, do not render or shift layout
  if (!enabled) {
    return null;
  }

  // Designated area human label
  const areaLabel = designatedArea
    ? designatedArea === 'topBanner'
      ? 'Top Banner'
      : designatedArea === 'bottomBanner'
      ? 'Bottom Banner'
      : designatedArea === 'sidebar'
      ? 'Sidebar & EPG Inspector'
      : designatedArea === 'channelList'
      ? 'Channel List In-Feed'
      : 'Player Overlay'
    : 'Designated Placement';

  // Test Mode / Staging visual preview
  if (testMode) {
    return (
      <div 
        className={`adsense-container overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-neutral-900/80 to-amber-500/10 border border-amber-500/30 p-3 text-center text-xs text-neutral-400 backdrop-blur-md shadow-lg ${className}`}
        style={style}
      >
        <div className="mb-1.5 uppercase tracking-widest text-[10px] text-amber-400 font-bold flex items-center justify-between px-2">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Google AdSense Simulated Unit
          </span>
          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
            {areaLabel}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row h-16 items-center justify-between px-4 bg-black/50 rounded-xl border border-dashed border-amber-500/20 text-neutral-300 gap-2 font-mono text-[11px]">
          <div>
            <span className="text-zinc-500 block text-[9px] uppercase tracking-wider text-left">Publisher ID</span>
            <span className="text-white font-bold">{effectiveClient}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[9px] uppercase tracking-wider text-left">Slot ID</span>
            <span className="text-amber-400 font-bold">#{effectiveSlot}</span>
          </div>
          <div className="hidden md:block text-right">
            <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">Format</span>
            <span className="text-zinc-400 capitalize">{format}</span>
          </div>
        </div>
      </div>
    );
  }

  // Live Google AdSense Container
  return (
    <div className={`adsense-container overflow-hidden rounded-xl bg-neutral-900/60 border border-neutral-800 p-2 text-center text-xs text-neutral-500 ${className}`}>
      <div className="mb-1 uppercase tracking-widest text-[10px] text-neutral-500 flex items-center justify-between px-2">
        <span>Advertisement</span>
        <span className="text-[9px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">Sponsored</span>
      </div>
      <ins
        ref={adRef}
        className="adsbygoogle block"
        style={{ display: 'block', minHeight: '90px', ...style }}
        data-ad-client={effectiveClient}
        data-ad-slot={effectiveSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
      {!adLoaded && (
        <div className="flex h-20 items-center justify-center text-neutral-600 bg-neutral-950/40 rounded border border-dashed border-neutral-800/80 font-mono text-[11px]">
          Google AdSense Placement Slot #{effectiveSlot}
        </div>
      )}
    </div>
  );
}
