/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  Trash2, 
  X, 
  Search, 
  Sparkles, 
  Zap, 
  Filter,
  Check
} from 'lucide-react';
import { Channel } from '../types/iptv';

export interface ChannelProbeStatus {
  channel: Channel;
  isOnline: boolean;
  latencyMs: number;
  httpStatus?: number;
  corsHeadersPresent?: boolean;
  error?: string;
}

interface PlaylistHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelsTested: number;
  healthyCount: number;
  deadCount: number;
  avgLatencyMs: number;
  probeResults: ChannelProbeStatus[];
  onApplyCleaned: () => void;
  onExportCleaned: () => void;
  isCleaning: boolean;
  hasAppliedCleaned?: boolean;
}

export function PlaylistHealthModal({
  isOpen,
  onClose,
  channelsTested,
  healthyCount,
  deadCount,
  avgLatencyMs,
  probeResults,
  onApplyCleaned,
  onExportCleaned,
  isCleaning,
  hasAppliedCleaned = false,
}: PlaylistHealthModalProps) {
  const [filterTab, setFilterTab] = React.useState<'all' | 'healthy' | 'dead'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  if (!isOpen) return null;

  const filteredResults = probeResults.filter((item) => {
    if (filterTab === 'healthy' && !item.isOnline) return false;
    if (filterTab === 'dead' && item.isOnline) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.channel.name.toLowerCase().includes(q);
      const matchGroup = (item.channel.group || '').toLowerCase().includes(q);
      const matchUrl = item.channel.url.toLowerCase().includes(q);
      return matchName || matchGroup || matchUrl;
    }
    return true;
  });

  const successRate = channelsTested > 0 ? Math.round((healthyCount / channelsTested) * 100) : 100;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="playlist-health-title"
    >
      <div
        className="bg-[#0c0d14] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-cyan-950/30 via-transparent to-purple-950/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="playlist-health-title" className="text-lg sm:text-xl font-bold tracking-tight">
                  Playlist Health & Stream Diagnostics
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-medium">
                  RFC 8216
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Upstream manifest verification, latency telemetry, and dead link pruning.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 bg-white/[0.01] border-b border-white/5">
          {/* Total Tested */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col">
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Streams Tested</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold">{channelsTested}</span>
              <span className="text-xs text-white/40">manifests</span>
            </div>
          </div>

          {/* Healthy */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/20 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-400/80 uppercase tracking-wider">Verified Live</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-400">{healthyCount}</span>
              <span className="text-xs font-semibold text-emerald-500/90">({successRate}%)</span>
            </div>
          </div>

          {/* Dead Streams */}
          <div className="p-3.5 rounded-2xl bg-rose-500/[0.05] border border-rose-500/20 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-rose-400/80 uppercase tracking-wider">Dead / Offline</span>
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-rose-400">{deadCount}</span>
              <span className="text-xs text-rose-400/70">unreachable</span>
            </div>
          </div>

          {/* Avg Latency */}
          <div className="p-3.5 rounded-2xl bg-cyan-500/[0.05] border border-cyan-500/20 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-cyan-400/80 uppercase tracking-wider">Avg Response</span>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-cyan-400">{avgLatencyMs}</span>
              <span className="text-xs text-cyan-400/70">ms</span>
            </div>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterTab === 'all'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              All ({probeResults.length})
            </button>
            <button
              onClick={() => setFilterTab('healthy')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterTab === 'healthy'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-white/60 hover:text-emerald-300'
              }`}
            >
              Healthy ({healthyCount})
            </button>
            <button
              onClick={() => setFilterTab('dead')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterTab === 'dead'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-white/60 hover:text-rose-300'
              }`}
            >
              Dead ({deadCount})
            </button>
          </div>

          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stream or group..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* Scrollable Stream Diagnostic Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03] p-2 sm:p-3 min-h-[220px]">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-white/40 text-xs">
              No streams matching the selected filter.
            </div>
          ) : (
            filteredResults.map((item, idx) => (
              <div 
                key={`${item.channel.id || item.channel.url}-${idx}`}
                className="p-3 rounded-xl hover:bg-white/[0.02] flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Status Indicator */}
                  {item.isOnline ? (
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 shrink-0 border border-rose-500/20">
                      <XCircle className="w-4 h-4" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-white truncate">
                        {item.channel.name}
                      </span>
                      {item.channel.group && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/5 shrink-0">
                          {item.channel.group}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/40 font-mono truncate mt-0.5 max-w-md sm:max-w-xl">
                      {item.channel.url}
                    </p>
                  </div>
                </div>

                {/* Right Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.isOnline ? (
                    <>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-white/5 text-white/70 border border-white/5">
                        {item.httpStatus ? `HTTP ${item.httpStatus}` : '200 OK'}
                      </span>
                      <span 
                        className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-lg border ${
                          item.latencyMs < 180 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : item.latencyMs < 400
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}
                      >
                        {item.latencyMs}ms
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {item.error || 'Unreachable'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-white/50">
            {hasAppliedCleaned ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Check className="w-4 h-4" /> Cleaned playlist applied to active player session.
              </span>
            ) : deadCount > 0 ? (
              <span>{deadCount} dead streams can be removed to optimize channel hopping.</span>
            ) : (
              <span>All tested streams responded with valid playback manifests.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCleaned}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-white/70" />
              Export Cleaned (.m3u)
            </button>

            {deadCount > 0 && !hasAppliedCleaned && (
              <button
                onClick={onApplyCleaned}
                disabled={isCleaning}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Prune {deadCount} Dead Streams
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
