/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { AlertTriangle, Crown, ArrowRight, X } from 'lucide-react';

interface RateLimitBannerProps {
  quotaType: 'cleanup' | 'builds' | 'playlists';
  currentUsage: number;
  maxLimit: number;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

export default function RateLimitBanner({
  quotaType,
  currentUsage,
  maxLimit,
  onUpgrade,
  onDismiss,
}: RateLimitBannerProps) {
  const isExceeded = currentUsage >= maxLimit;
  if (!isExceeded) return null;

  const messages = {
    cleanup: {
      title: 'Daily Auto-Cleanup Quota Reached (20/20)',
      desc: 'You have utilized all 20 daily automated stream link checks included with your Pro Streamer tier. Upgrade to the App Builder Suite for unlimited daily automated runs.',
    },
    builds: {
      title: 'Monthly APK Build Quota Reached (10/10)',
      desc: 'Your monthly quota of 10 white-label Android APK cloud builds has been reached for this billing cycle. Additional build packs or enterprise custom runs are available.',
    },
    playlists: {
      title: 'Active Playlist Limit Reached (10/10)',
      desc: 'You have reached the maximum allowance of 10 active playlists and 5 hosted remote URLs. Upgrade your plan to expand playlist capacity.',
    },
  };

  const item = messages[quotaType];

  return (
    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start justify-between gap-4 shadow-lg shadow-amber-500/5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
            {item.title}
          </h4>
          <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed max-w-xl">
            {item.desc}
          </p>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="mt-2.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Crown className="w-3.5 h-3.5" />
              Upgrade Tier
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          aria-label="Dismiss quota alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
