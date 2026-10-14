/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tv, QrCode, Check, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '../lib/apiClient';
import { useAuth } from '../authStore';

interface TvPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (msg: string) => void;
  initialCode?: string;
}

export default function TvPairingModal({
  isOpen,
  onClose,
  triggerToast,
  initialCode = ''
}: TvPairingModalProps) {
  const auth = useAuth();
  const [digits, setDigits] = React.useState<string[]>(() => {
    if (initialCode && initialCode.length === 6) {
      return initialCode.split('');
    }
    return ['', '', '', '', '', ''];
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pairedDevice, setPairedDevice] = React.useState<string | null>(null);

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setDigits(initialCode && initialCode.length === 6 ? initialCode.split('') : ['', '', '', '', '', '']);
      setError(null);
      setPairedDevice(null);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen, initialCode]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/[^0-9]/g, '');
    const newDigits = [...digits];

    if (clean.length > 1) {
      // Handle paste
      const pasted = clean.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        newDigits[i] = char;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = clean;
    setDigits(newDigits);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fullCode = digits.join('');

  const handleClaim = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (fullCode.length !== 6) {
      setError('Please enter a 6-digit code shown on your TV screen.');
      return;
    }

    if (!auth.isLoggedIn) {
      setError('Please sign in first to link your account with your TV.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchWithAuth('/api/pair/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authorize device.');
      }

      setPairedDevice(data.deviceName || 'Smart TV');
      triggerToast(`🎉 TV device successfully paired for ${auth.email}`);
    } catch (err: any) {
      setError(err.message || 'Pairing failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
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
          className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden"
        >
          {/* Ambient flare */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Pair Smart TV Device</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Approve access without typing passwords on a remote</p>
            </div>
          </div>

          {pairedDevice ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Device Authorized!</h4>
              <p className="text-xs text-zinc-400 max-w-xs mb-6">
                <strong className="text-zinc-200">{pairedDevice}</strong> has been linked to your account. Your playlists and favorites are now available on your TV screen.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleClaim} className="flex flex-col gap-6">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                <p className="text-xs text-zinc-300 font-medium mb-4">
                  Enter the 6-digit code shown on your Apple TV, Android TV, or Fire TV app:
                </p>

                {/* 6 Digit Input Boxes */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-xl bg-zinc-900 border border-white/10 focus:border-sky-400 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-mono"
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || fullCode.length !== 6}
                className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing Device...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Authorize TV Device</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Code expires in 10 minutes</span>
                <span>Instant Cloud Sync</span>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
