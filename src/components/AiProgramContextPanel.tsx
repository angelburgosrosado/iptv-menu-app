/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Users, Lightbulb, Compass, Loader2, RefreshCw } from 'lucide-react';
import { Channel } from '../types/iptv';

interface AiProgramContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel;
}

interface AiInsightsData {
  summary: string;
  castOrKeyFigures: string[];
  triviaOrTip: string;
  mood: string;
}

export default function AiProgramContextPanel({
  isOpen,
  onClose,
  channel
}: AiProgramContextPanelProps) {
  const [data, setData] = React.useState<AiInsightsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAiGenerated, setIsAiGenerated] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchContext = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/program-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: channel.currentProgram || channel.name,
          channelName: channel.name,
          category: channel.category || 'Live TV',
          description: channel.epgDescription || ''
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch program context.');
      }

      setData(json.data);
      setIsAiGenerated(Boolean(json.aiGenerated));
    } catch (err: any) {
      setError(err.message || 'Unable to load program insights.');
    } finally {
      setIsLoading(false);
    }
  }, [channel]);

  React.useEffect(() => {
    if (isOpen) {
      fetchContext();
    }
  }, [isOpen, fetchContext]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end p-0 sm:p-4 pointer-events-none">
        {/* Backdrop for mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto sm:hidden"
        />

        {/* Panel Window */}
        <motion.aside
          initial={{ x: '100%', opacity: 0.8 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0.8 }}
          transition={{ type: 'spring', damping: 26, stiffness: 240 }}
          className="relative w-full sm:w-[420px] h-full sm:h-[88vh] bg-zinc-950/95 border-l sm:border border-white/10 sm:rounded-[32px] p-6 shadow-2xl backdrop-blur-2xl pointer-events-auto flex flex-col justify-between overflow-hidden"
        >
          {/* Neon AI Ambient Background Glow */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>Live AI Insights</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold font-mono">
                      {isAiGenerated ? 'Gemini 2.5' : 'Smart Guide'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 truncate max-w-[220px]">
                    {channel.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={fetchContext}
                  disabled={isLoading}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                  title="Refresh Insights"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current Broadcast Tag */}
            <div className="mt-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Current Program</span>
              <h3 className="text-sm font-black text-white mt-0.5 leading-snug">
                {channel.currentProgram || channel.name}
              </h3>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 my-4 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                <span className="text-xs font-medium">Synthesizing program context...</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            ) : data ? (
              <>
                {/* Mood pill */}
                {data.mood && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium">
                    <Compass className="w-3.5 h-3.5" />
                    <span>{data.mood}</span>
                  </div>
                )}

                {/* Synopsis */}
                <div className="space-y-1">
                  <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Synopsis & Context</h5>
                  <p className="text-xs text-zinc-200 leading-relaxed bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                    {data.summary}
                  </p>
                </div>

                {/* Cast / Key Figures */}
                {data.castOrKeyFigures && data.castOrKeyFigures.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Key Figures & Cast</span>
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {data.castOrKeyFigures.map((person, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-300 shadow-sm"
                        >
                          {person}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trivia & Viewer Tip */}
                {data.triviaOrTip && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 text-amber-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400 text-[11px] uppercase tracking-wider">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Viewer Tip & Trivia</span>
                    </div>
                    <p className="leading-snug text-zinc-300 text-[11px]">
                      {data.triviaOrTip}
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Bottom Footer Action */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Dynamic IPTV Analysis</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
