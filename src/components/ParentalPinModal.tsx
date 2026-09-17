/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  X, 
  Delete, 
  RotateCcw, 
  Check, 
  Settings, 
  Plus, 
  Trash2,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

interface ParentalPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'unlock' | 'setup' | 'settings';
  channelName?: string;
  onSuccess?: () => void;
}

export const ParentalPinModal: React.FC<ParentalPinModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'unlock',
  channelName,
  onSuccess
}) => {
  const { 
    parentalControls, 
    setParentalPin, 
    verifyParentalPin, 
    removeParentalPin,
    setParentalControlsEnabled, 
    toggleCategoryLock,
    setHideLockedChannels, 
    setParentalSessionTimeout,
    lockParentalSession,
    unlockParentalSession
  } = usePlayerStore();

  const [mode, setMode] = useState<'unlock' | 'setup' | 'settings'>(initialMode);
  const [pinInput, setPinInput] = useState<string>('');
  const [setupConfirmPin, setSetupConfirmPin] = useState<string>('');
  const [setupStep, setSetupStep] = useState<'enter' | 'confirm'>('enter');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');

  // Synchronize initial mode when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!parentalControls.pinHash) {
        setMode('setup');
      } else {
        setMode(initialMode);
      }
      setPinInput('');
      setSetupConfirmPin('');
      setSetupStep('enter');
      setErrorMessage(null);
      setIsSuccess(false);
    }
  }, [isOpen, initialMode, parentalControls.pinHash]);

  const handleDigitPress = useCallback((digit: string) => {
    setErrorMessage(null);
    if (pinInput.length < 4) {
      setPinInput((prev) => prev + digit);
    }
  }, [pinInput]);

  const handleBackspace = useCallback(() => {
    setErrorMessage(null);
    setPinInput((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setErrorMessage(null);
    setPinInput('');
  }, []);

  // Process PIN when all 4 digits are entered
  useEffect(() => {
    if (pinInput.length === 4) {
      if (mode === 'unlock') {
        verifyParentalPin(pinInput).then((valid) => {
          if (valid) {
            setIsSuccess(true);
            setErrorMessage(null);
            setTimeout(() => {
              if (onSuccess) onSuccess();
              onClose();
            }, 500);
          } else {
            setErrorMessage('Incorrect PIN. Please try again.');
            setPinInput('');
          }
        });
      } else if (mode === 'setup') {
        if (setupStep === 'enter') {
          setSetupConfirmPin(pinInput);
          setPinInput('');
          setSetupStep('confirm');
        } else if (setupStep === 'confirm') {
          if (pinInput === setupConfirmPin) {
            setParentalPin(pinInput).then(() => {
              setIsSuccess(true);
              setTimeout(() => {
                if (initialMode === 'settings') {
                  setMode('settings');
                  setIsSuccess(false);
                  setPinInput('');
                } else {
                  if (onSuccess) onSuccess();
                  onClose();
                }
              }, 600);
            });
          } else {
            setErrorMessage('PINs do not match. Please re-enter.');
            setPinInput('');
            setSetupConfirmPin('');
            setSetupStep('enter');
          }
        }
      }
    }
  }, [pinInput, mode, setupStep, setupConfirmPin, verifyParentalPin, setParentalPin, onSuccess, onClose, initialMode]);

  // Handle hardware keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDigitPress, handleBackspace, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md p-6 bg-slate-900/95 border border-slate-700/60 rounded-2xl shadow-2xl backdrop-blur-xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${mode === 'settings' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {mode === 'settings' ? <Settings size={20} /> : <ShieldAlert size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {mode === 'unlock' && (channelName ? 'Channel Locked' : 'Parental Controls')}
                {mode === 'setup' && (setupStep === 'enter' ? 'Create Parental PIN' : 'Confirm Parental PIN')}
                {mode === 'settings' && 'Parental Security Settings'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'unlock' && (channelName ? `Protected stream: ${channelName}` : 'Enter 4-digit PIN to unlock session')}
                {mode === 'setup' && (setupStep === 'enter' ? 'Set a 4-digit master security PIN' : 'Re-enter your 4-digit PIN to verify')}
                {mode === 'settings' && 'Manage restrictions, categories, and relock timeouts'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode: Unlock or Setup PIN Input */}
        {(mode === 'unlock' || mode === 'setup') && (
          <div className="flex flex-col items-center py-2">
            {/* PIN Dots Display */}
            <div className="flex items-center justify-center gap-4 my-6">
              {[0, 1, 2, 3].map((index) => {
                const filled = pinInput.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      isSuccess
                        ? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-500/50'
                        : filled
                        ? 'bg-indigo-400 scale-110 shadow-lg shadow-indigo-500/50'
                        : 'bg-slate-800 border-2 border-slate-600'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error or Success feedback message */}
            <div className="h-6 mb-2 flex items-center justify-center">
              {errorMessage && (
                <span className="text-xs font-medium text-rose-400 animate-bounce">{errorMessage}</span>
              )}
              {isSuccess && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Check size={14} /> PIN Verified!
                </span>
              )}
            </div>

            {/* Numeric Keypad Grid */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px] my-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDigitPress(digit)}
                  className="h-12 flex items-center justify-center text-lg font-semibold bg-slate-800/80 hover:bg-slate-700/80 active:bg-indigo-600 active:scale-95 text-white rounded-xl transition-all border border-slate-700/50 shadow-sm"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="h-12 flex items-center justify-center text-xs font-medium bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all border border-slate-800"
                title="Clear all"
              >
                Clear
              </button>
              <button
                onClick={() => handleDigitPress('0')}
                className="h-12 flex items-center justify-center text-lg font-semibold bg-slate-800/80 hover:bg-slate-700/80 active:bg-indigo-600 active:scale-95 text-white rounded-xl transition-all border border-slate-700/50 shadow-sm"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="h-12 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700/80 active:bg-rose-600 text-slate-300 rounded-xl transition-all border border-slate-700/50 shadow-sm"
                title="Backspace"
              >
                <Delete size={18} />
              </button>
            </div>

            {/* Footer switcher */}
            {parentalControls.pinHash && (
              <div className="mt-4 pt-3 w-full border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Use keyboard digits 0-9 or remote</span>
                {mode === 'unlock' ? (
                  <button
                    onClick={() => setMode('settings')}
                    className="text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Settings size={12} /> Settings
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMode('unlock');
                      setPinInput('');
                    }}
                    className="text-indigo-400 hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mode: Settings Manager */}
        {mode === 'settings' && (
          <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1">
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/40 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${parentalControls.isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}`}>
                  {parentalControls.isEnabled ? <Lock size={16} /> : <Unlock size={16} />}
                </div>
                <div>
                  <span className="text-sm font-medium text-white">Master Parental Lock</span>
                  <p className="text-xs text-slate-400">Enforce PIN on locked channels & categories</p>
                </div>
              </div>
              <button
                onClick={() => setParentalControlsEnabled(!parentalControls.isEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${parentalControls.isEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${parentalControls.isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Hide Locked Channels in Guide */}
            <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/40 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  {parentalControls.hideLockedChannelsInGuide ? <EyeOff size={16} /> : <Eye size={16} />}
                </div>
                <div>
                  <span className="text-sm font-medium text-white">Hide Locked Channels</span>
                  <p className="text-xs text-slate-400">Completely conceal locked channels from guide</p>
                </div>
              </div>
              <button
                onClick={() => setHideLockedChannels(!parentalControls.hideLockedChannelsInGuide)}
                className={`relative w-12 h-6 rounded-full transition-colors ${parentalControls.hideLockedChannelsInGuide ? 'bg-indigo-500' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${parentalControls.hideLockedChannelsInGuide ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Session Auto-Relock Timeout */}
            <div className="p-3 bg-slate-800/50 border border-slate-700/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Clock size={16} className="text-indigo-400" />
                <span>Auto-Relock Timeout</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '15m', val: 15 },
                  { label: '30m', val: 30 },
                  { label: '60m', val: 60 },
                  { label: 'Session', val: 0 },
                ].map(({ label, val }) => (
                  <button
                    key={val}
                    onClick={() => setParentalSessionTimeout(val)}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all ${
                      parentalControls.sessionUnlockTimeoutMinutes === val
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Restricted Categories */}
            <div className="p-3 bg-slate-800/50 border border-slate-700/40 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Restricted Categories</span>
                <span className="text-[10px] text-slate-400">{parentalControls.lockedCategories.length} active</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {parentalControls.lockedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-full"
                  >
                    {cat}
                    <button
                      onClick={() => toggleCategoryLock(cat)}
                      className="hover:text-rose-100"
                      title={`Remove ${cat}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add custom category filter */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCategoryInput.trim()) {
                      e.preventDefault();
                      toggleCategoryLock(newCategoryInput.trim());
                      setNewCategoryInput('');
                    }
                  }}
                  placeholder="Add category (e.g. violent, adult)..."
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => {
                    if (newCategoryInput.trim()) {
                      toggleCategoryLock(newCategoryInput.trim());
                      setNewCategoryInput('');
                    }
                  }}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  title="Add category"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Action Buttons: Relock Session, Change PIN, Remove PIN */}
            <div className="pt-2 flex flex-col gap-2">
              {parentalControls.isSessionUnlocked ? (
                <button
                  onClick={() => {
                    lockParentalSession();
                    setMode('unlock');
                  }}
                  className="w-full py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 rounded-xl transition-colors"
                >
                  <Lock size={14} /> Relock Session Immediately
                </button>
              ) : (
                <button
                  onClick={() => setMode('unlock')}
                  className="w-full py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 rounded-xl transition-colors"
                >
                  <Unlock size={14} /> Unlock Session with PIN
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMode('setup');
                    setSetupStep('enter');
                    setPinInput('');
                  }}
                  className="flex-1 py-2 px-3 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors"
                >
                  Change 4-Digit PIN
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to completely disable parental controls and delete the PIN?')) {
                      removeParentalPin();
                      onClose();
                    }
                  }}
                  className="py-2 px-3 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-colors"
                  title="Reset & Delete PIN"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentalPinModal;
