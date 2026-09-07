/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { Lock, Crown, ShieldAlert, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredTier?: 'pro' | 'builder' | 'admin';
  fallbackTitle?: string;
  fallbackDescription?: string;
  onTriggerAuth?: () => void;
  onTriggerUpgrade?: () => void;
}

export default function ProtectedRoute({
  children,
  requiredTier,
  fallbackTitle,
  fallbackDescription,
  onTriggerAuth,
  onTriggerUpgrade,
}: ProtectedRouteProps) {
  const auth = useAuth();

  if (!auth.isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px] bg-white/[0.02] border border-white/10 rounded-3xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          {fallbackTitle || 'Authentication Required'}
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
          {fallbackDescription || 'Please sign in or create an account to access this feature, synchronize playlists, and manage your streaming apps.'}
        </p>
        <button
          onClick={onTriggerAuth}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
        >
          <User className="w-4 h-4" />
          Sign In / Create Account
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Tier checking
  if (requiredTier) {
    const isAllowed = 
      auth.role === 'admin' ||
      (requiredTier === 'pro' && (auth.role === 'pro' || auth.role === 'builder' || auth.isPremium)) ||
      (requiredTier === 'builder' && auth.role === 'builder');

    if (!isAllowed) {
      return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px] bg-white/[0.02] border border-amber-500/20 rounded-3xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
            <Crown className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {requiredTier === 'builder' ? 'App Builder Suite Tier Required' : 'Pro Streamer Tier Required'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
            {requiredTier === 'builder'
              ? 'This module requires the App Builder Suite ($29.99/mo) which unlocks automated cloud APK builds, dynamic white-labeling, and OTA version control.'
              : 'This module is reserved for Pro Streamer subscribers ($9.99/mo). Upgrade today to unlock automated dead link cleanups, 10 active playlists, and 5 hosted URLs.'}
          </p>
          <button
            onClick={onTriggerUpgrade}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Crown className="w-4 h-4" />
            Upgrade Subscription Tier
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }
  }

  return <>{children}</>;
}
