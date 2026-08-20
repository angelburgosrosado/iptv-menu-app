import * as React from 'react';

interface AdSenseSlotProps {
  client?: string;
  slot: string;
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
  client = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-1578853238313624',
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  style = {}
}: AdSenseSlotProps) {
  const adRef = React.useRef<HTMLModElement | null>(null);
  const [adLoaded, setAdLoaded] = React.useState(false);

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      }
    } catch (e) {
      console.error('AdSense push error:', e);
    }
  }, []);

  return (
    <div className={`adsense-container overflow-hidden rounded-lg bg-neutral-900/60 border border-neutral-800 p-2 text-center text-xs text-neutral-500 ${className}`}>
      <div className="mb-1 uppercase tracking-widest text-[10px] text-neutral-500 flex items-center justify-between px-2">
        <span>Advertisement</span>
        <span className="text-[9px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">Sponsored</span>
      </div>
      <ins
        ref={adRef}
        className="adsbygoogle block"
        style={{ display: 'block', minHeight: '90px', ...style }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
      {!adLoaded && (
        <div className="flex h-20 items-center justify-center text-neutral-600 bg-neutral-950/40 rounded border border-dashed border-neutral-800/80">
          Google AdSense Placement Slot #{slot}
        </div>
      )}
    </div>
  );
}
