/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Crown, 
  UploadCloud, 
  Tv, 
  ArrowRight, 
  Sparkles, 
  Play, 
  Layers, 
  Cpu, 
  X 
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { authStore } from '../authStore';
import { simRouter } from '../shims/expo-router';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingModal({
  isOpen,
  onClose,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [selectedTier, setSelectedTier] = React.useState<'free' | 'pro' | 'builder'>('pro');
  const { channels, loadPlaylist } = usePlayerStore();

  if (!isOpen) return null;

  const handleSelectTierAndContinue = (tier: 'free' | 'pro' | 'builder') => {
    setSelectedTier(tier);
    if (tier !== 'free') {
      authStore.setState({ isPremium: true, role: tier === 'builder' ? 'builder' : 'pro' });
    }
    setStep(2);
  };

  const handleSelectPresetAndContinue = async (url: string) => {
    await loadPlaylist(url);
    setStep(3);
  };

  const handlePreviewFirstChannel = () => {
    const firstChannel = channels[0];
    if (firstChannel) {
      simRouter.push(`/player/${firstChannel.id}`);
    }
    onComplete();
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
          className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-xl bg-[#16161a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 flex flex-col gap-6"
        >
          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-black text-xs flex items-center justify-center border border-cyan-500/30">
                {step}
              </span>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Step {step} of 3: {step === 1 ? 'Choose Tier' : step === 2 ? 'Select Stream Source' : 'Preview Simulator'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              aria-label="Skip onboarding"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          {/* Step 1: Choose Tier */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Welcome to IPTV Menu Pro</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Select your subscription tier to personalize your developer streaming environment.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Free */}
                <div 
                  onClick={() => handleSelectTierAndContinue('free')}
                  className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Free Starter</h4>
                      <p className="text-[11px] text-zinc-400">1 active playlist, single stream simulator</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-zinc-400">$0 / mo</span>
                </div>

                {/* Pro Streamer */}
                <div 
                  onClick={() => handleSelectTierAndContinue('pro')}
                  className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/40 hover:border-cyan-400 cursor-pointer transition-all flex items-center justify-between shadow-lg shadow-cyan-500/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-cyan-500 text-black font-black text-[9px] uppercase tracking-wider rounded-bl-lg">
                    Recommended
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        Pro Streamer
                      </h4>
                      <p className="text-[11px] text-zinc-300">10 playlists, TMDB Cinematic VOD, FAST channels, Custom Proxies</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-cyan-400">$9.99 / mo</span>
                </div>

                {/* App Builder Suite */}
                <div 
                  onClick={() => handleSelectTierAndContinue('builder')}
                  className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">App Builder Suite</h4>
                      <p className="text-[11px] text-zinc-400">10 cloud APK builds/mo, white-label, dynamic OTA</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400">$29.99 / mo</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Content Source Selection */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Connect Your Content Source</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  IPTV.MENU is a standalone media player. Channels and streams are only loaded when added via your own Xtream Codes credentials or M3U playlist.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => onComplete()}
                  className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-cyan-500/40 text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <h4 className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-2">
                      <span>Xtream Codes / Stalker Portal</span>
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Connect with your portal server URL, username, and password.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                </button>

                <button
                  onClick={() => onComplete()}
                  className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-cyan-500/40 text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <h4 className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-2">
                      <span>Custom M3U / M3U8 Playlist</span>
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Load an M3U8 URL or upload a local playlist file.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                </button>

                <button
                  onClick={() => onComplete()}
                  className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-cyan-500/40 text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <h4 className="text-xs font-bold text-zinc-300 group-hover:text-white flex items-center gap-2">
                      <span>Start with Empty Player</span>
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Explore the player interface and configure your stream feeds later.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview Channel in Simulator */}
          {step === 3 && (
            <div className="flex flex-col gap-5 text-center items-center py-2">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-pulse">
                <Play className="w-8 h-8 fill-current" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Your Playlist Is Ready!</h3>
                <p className="text-xs text-zinc-400 max-w-sm mt-1">
                  We've parsed {channels.length} live channels into your active session. Launch the 60 FPS mobile stream simulator now to preview your first feed.
                </p>
              </div>

              <button
                onClick={handlePreviewFirstChannel}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Launch Stream Simulator
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
