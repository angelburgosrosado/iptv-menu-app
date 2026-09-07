/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, FileText, Scale, AlertCircle } from 'lucide-react';

export type LegalTab = 'privacy' | 'terms' | 'dmca';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export default function LegalModal({
  isOpen,
  initialTab = 'privacy',
  onClose,
}: LegalModalProps) {
  const [activeTab, setActiveTab] = React.useState<LegalTab>(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

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

        {/* Dialog Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl bg-[#16161a] border border-white/10 rounded-3xl p-6 shadow-2xl z-10 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Compliance & Legal Center</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              aria-label="Close legal modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 border-b border-white/5 py-3">
            {[
              { id: 'privacy' as const, label: 'Privacy Policy', icon: ShieldCheck },
              { id: 'terms' as const, label: 'Terms of Service', icon: FileText },
              { id: 'dmca' as const, label: 'DMCA Notice', icon: AlertCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-zinc-400 hover:text-white bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto pr-2 py-4 text-xs text-zinc-300 leading-relaxed font-sans scrollbar-thin">
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Privacy Policy</h4>
                <p className="text-zinc-400">
                  Last Updated: September 2026. This Privacy Policy describes how IPTV Menu Pro collects, uses, and safeguards information when using our developer platform, HLS stream simulator, and white-label APK compiling services.
                </p>
                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-200">1. Information We Collect</h5>
                  <p>
                    We collect account credentials (email, authentication tokens), workspace settings, uploaded M3U playlist metadata, and configuration files provided to create cloud Android APK builds. We do not store raw media stream content on our servers.
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-200">2. Local Storage and Client Playlists</h5>
                  <p>
                    Your custom stream bookmarks, channel favorites, and viewing history are stored client-side in persistent browser or MMKV storage. We respect client privacy and do not monetize or sell your playlist URLs.
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-200">3. Third-Party Services</h5>
                  <p>
                    Payments are handled securely via Stripe Inc. Authentication can be linked through Supabase or Google OAuth. Telemetry logs are anonymized and retained strictly for diagnosing stream reliability.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Terms of Service</h4>
                <p className="text-zinc-400">
                  By accessing or subscribing to IPTV Menu Pro, you agree to comply with these terms governing platform usage, developer tools, and EAS Android builds.
                </p>
                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-200">1. Permitted Use</h5>
                  <p>
                    IPTV Menu Pro is an administrative dashboard and developer IDE intended for testing, validating, organizing, and distributing authorized stream manifests. Users are strictly responsible for having proper transmission rights for any M3U or Xtream sources connected.
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-200">2. Subscriptions & Quotas</h5>
                  <p>
                    Subscriptions (Pro Streamer at $9.99/mo, App Builder Suite at $29.99/mo) automatically renew unless cancelled prior to billing period expiration. Quotas for daily stream health validation (20 runs) and cloud APK compilation (10 builds/mo) reset monthly.
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-200">3. Disclaimer of Content</h5>
                  <p>
                    IPTV Menu Pro operates solely as software infrastructure. We do not broadcast, host, curate, or sell television programming, satellite feeds, or video streams.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'dmca' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">DMCA & Copyright Compliance Policy</h4>
                <p className="text-zinc-400">
                  IPTV Menu Pro complies with 17 U.S.C. § 512 and the Digital Millennium Copyright Act ("DMCA").
                </p>
                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-200">1. Software Tool Nature</h5>
                  <p>
                    Our platform functions exclusively as a client-side media player simulator, playlist parser, and cloud compiler for developers. We do not host, store, or transmit copyrighted media content.
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-200">2. Takedown Notices</h5>
                  <p>
                    If you believe that a remote hosted URL stored within our database infringes upon your copyright, please submit an official notification containing:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400">
                    <li>Identification of the copyrighted work claimed to have been infringed.</li>
                    <li>The exact URL or hosted manifest within our system.</li>
                    <li>Your legal contact information and authorized agent signature.</li>
                  </ul>
                  <p className="mt-2 text-zinc-400">
                    Send notices to: <span className="text-cyan-400 font-mono">dmca@iptv.menu</span>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 pt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Close Legal Center
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
