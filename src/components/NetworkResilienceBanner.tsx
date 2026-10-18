/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [wasOffline, setWasOffline] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

interface NetworkResilienceBannerProps {
  onRetry?: () => void;
}

export function NetworkResilienceBanner({ onRetry }: NetworkResilienceBannerProps) {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [isRetrying, setIsRetrying] = React.useState(false);

  if (isOnline && !wasOffline) {
    return null;
  }

  const handleManualRetry = () => {
    setIsRetrying(true);
    if (onRetry) {
      onRetry();
    }
    setTimeout(() => {
      setIsRetrying(false);
    }, 1200);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300"
    >
      {!isOnline ? (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0b0d14]/95 backdrop-blur-xl border border-amber-500/30 text-amber-300 shadow-[0_10px_35px_rgba(0,0,0,0.8)] text-xs font-semibold">
          <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
            <WifiOff className="w-4 h-4 animate-pulse" />
          </span>
          <div>
            <p className="text-white font-bold text-xs leading-none">Offline Mode</p>
            <p className="text-[11px] text-amber-300/80 mt-0.5 leading-none">
              Network disconnected • Streams paused until reconnected
            </p>
          </div>
          <button
            onClick={handleManualRetry}
            disabled={isRetrying}
            className="ml-2 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Checking...' : 'Check Network'}</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#0b0d14]/95 backdrop-blur-xl border border-emerald-500/40 text-emerald-300 shadow-[0_10px_35px_rgba(0,0,0,0.8)] text-xs font-semibold">
          <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Wifi className="w-4 h-4" />
          </span>
          <div>
            <span className="text-white font-bold">Connected</span>
            <span className="text-emerald-300/90 text-[11px] ml-1.5">• Network restored, resuming player session</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default NetworkResilienceBanner;
