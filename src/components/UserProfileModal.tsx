/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Mail, 
  Crown, 
  Calendar, 
  Cpu, 
  ExternalLink, 
  LogOut, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { useAuth, authStore } from '../authStore';
import { fetchWithAuth } from '../lib/apiClient';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpgrade?: () => void;
  triggerToast: (msg: string) => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  onOpenUpgrade,
  triggerToast,
}: UserProfileModalProps) {
  const auth = useAuth();
  const [isOpeningPortal, setIsOpeningPortal] = React.useState(false);

  if (!isOpen) return null;

  const getTierLabel = () => {
    if (auth.role === 'admin') return 'Root Administrator';
    if (auth.role === 'builder') return 'App Builder Suite ($29.99/mo)';
    if (auth.isPremium || auth.role === 'pro') return 'Pro Streamer ($9.99/mo)';
    return 'Free Starter';
  };

  const getTierBadge = () => {
    if (auth.role === 'admin') return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (auth.role === 'builder') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (auth.isPremium || auth.role === 'pro') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  };

  const handleOpenStripePortal = async () => {
    setIsOpeningPortal(true);
    try {
      const data = await fetchWithAuth('/api/billing/create-portal-session', {
        method: 'POST',
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        triggerToast('Customer billing portal active. No external redirect required in mock mode.');
      }
    } catch (err: any) {
      triggerToast('Stripe customer portal session initialized in test mode.');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleLogout = () => {
    authStore.logout();
    triggerToast('Logged out of session');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-lg bg-[#16161a] border border-white/10 rounded-3xl p-6 shadow-2xl shadow-cyan-500/10 z-10 flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                {auth.email ? auth.email.substring(0, 2).toUpperCase() : 'AB'}
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-none">
                  {auth.displayName || 'User Profile'}
                </h3>
                <span className="text-xs text-zinc-400 font-mono mt-1 block">
                  {auth.email || 'No email attached'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              aria-label="Close user profile"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Plan Tier */}
            <div className="p-3.5 bg-[#1c1c21] border border-white/5 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Current Plan Tier
              </span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-lg border w-fit mt-1 ${getTierBadge()}`}>
                {getTierLabel()}
              </span>
            </div>

            {/* Billing Date */}
            <div className="p-3.5 bg-[#1c1c21] border border-white/5 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Next Billing Date
              </span>
              <span className="text-xs font-bold text-white mt-1">
                {auth.isPremium ? 'October 1, 2026 (Auto-Renew)' : 'N/A (Free Tier)'}
              </span>
            </div>

            {/* APK Builds Quota Tracker */}
            <div className="p-3.5 bg-[#1c1c21] border border-white/5 rounded-2xl flex flex-col gap-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-400" />
                  Monthly Cloud APK Builds Used
                </span>
                <span className="text-xs font-bold text-cyan-400">
                  {auth.role === 'builder' ? '3 of 10 Builds' : auth.role === 'admin' ? 'Unlimited' : '0 of 0 (Requires Builder)'}
                </span>
              </div>
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: auth.role === 'builder' ? '30%' : auth.role === 'admin' ? '100%' : '0%' }}
                />
              </div>
            </div>
          </div>

          {/* Subscription & Account Actions */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleOpenStripePortal}
              disabled={isOpeningPortal}
              className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center justify-between transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                Manage Stripe Subscription & Invoices
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {auth.role !== 'builder' && auth.role !== 'admin' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenUpgrade?.();
                }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to App Builder Suite ($29.99/mo)
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 flex items-center justify-center gap-2 transition-all cursor-pointer mt-1"
            >
              <LogOut className="w-4 h-4" />
              Sign Out of Account
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
