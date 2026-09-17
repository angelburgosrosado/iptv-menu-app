/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { simRouter } from '../shims/expo-router';
import { 
  Tv, 
  Play, 
  Trash2, 
  Clock, 
  HardDrive, 
  Bookmark as BookmarkIcon, 
  CheckCircle2, 
  Radio, 
  X, 
  Download, 
  Sparkles, 
  Calendar, 
  Film,
  Plus
} from 'lucide-react';
import { DvrRecording, Bookmark } from '../types/iptv';

interface DvrModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'dvr' | 'bookmarks';
}

export function DvrModal({ isOpen, onClose, initialTab = 'dvr' }: DvrModalProps) {
  const { 
    dvrRecordings, 
    bookmarks, 
    deleteRecording, 
    updateRecordingStatus, 
    removeBookmark, 
    scheduleRecording,
    channels 
  } = usePlayerStore();

  const [activeTab, setActiveTab] = React.useState<'all' | 'completed' | 'scheduled' | 'bookmarks'>(
    initialTab === 'bookmarks' ? 'bookmarks' : 'all'
  );
  const [showManualSchedule, setShowManualSchedule] = React.useState(false);
  const [manualChannelId, setManualChannelId] = React.useState('');
  const [manualDuration, setManualDuration] = React.useState('60');
  const [manualTitle, setManualTitle] = React.useState('');

  if (!isOpen) return null;

  // Filter items
  const filteredRecordings = dvrRecordings.filter((rec) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'completed') return rec.status === 'completed';
    if (activeTab === 'scheduled') return rec.status === 'scheduled' || rec.status === 'recording';
    return false;
  });

  // Calculate simulated storage
  const totalMinutes = dvrRecordings.reduce((acc, r) => acc + (r.durationMinutes || 60), 0);
  const estimatedStorageMb = Math.round(totalMinutes * 24.5);
  const estimatedStorageGb = (estimatedStorageMb / 1024).toFixed(2);
  const storageQuotaGb = 50.0;
  const storagePercent = Math.min(100, Math.round((parseFloat(estimatedStorageGb) / storageQuotaGb) * 100));

  const handlePlayRecording = (rec: DvrRecording) => {
    onClose();
    simRouter.push(`/player/${rec.channelId}`);
  };

  const handlePlayBookmark = (bm: Bookmark) => {
    onClose();
    simRouter.push(`/player/${bm.channelId}`);
  };

  const handleDownloadTicket = (rec: DvrRecording) => {
    const m3uContent = `#EXTM3U
#EXTINF:-1 tvg-id="${rec.channelId}" tvg-name="${rec.channelName}" group-title="DVR Recording",${rec.programTitle} - ${rec.channelName} (${rec.durationMinutes}m Catchup)
${rec.catchupUrl || rec.streamUrl}
`;
    const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dvr-${rec.channelName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${rec.id}.m3u`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateManualCapture = (e: React.FormEvent) => {
    e.preventDefault();
    const ch = channels.find((c) => c.id === manualChannelId) || channels[0];
    if (!ch) return;

    const duration = parseInt(manualDuration, 10) || 60;
    const now = new Date();
    const end = new Date(now.getTime() + duration * 60000);

    scheduleRecording({
      channelId: ch.id,
      channelName: ch.name,
      channelLogo: ch.logo,
      programTitle: manualTitle.trim() || `${ch.name} Custom Stream Capture`,
      programDescription: `Simulated live stream capture from ${ch.name}. High-definition HLS archival feed.`,
      streamUrl: ch.url,
      startTime: now.toISOString(),
      endTime: end.toISOString(),
      durationMinutes: duration,
      status: 'recording',
      fileSizeEstimate: `${Math.round(duration * 24.5)} MB`
    });

    setShowManualSchedule(false);
    setManualTitle('');
    setActiveTab('all');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-[#0f1015] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Catchup DVR & Bookmarks Engine</h2>
                <span className="text-[10px] font-black px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full uppercase tracking-wider">
                  Timeshift Ready
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cloud timeshift simulator, scheduled telecast captures, and persistent channel bookmarks.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close DVR dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Storage Quota & Capacity Bar */}
        <div className="px-5 sm:px-6 py-3 bg-black/40 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <HardDrive className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-300 font-medium">Local Storage Quota:</span>
              <span className="text-white font-bold font-mono">{estimatedStorageGb} GB</span>
              <span className="text-zinc-500">of {storageQuotaGb} GB allocated</span>
              <span className="text-[10px] text-cyan-400 font-semibold">({storagePercent}% utilized)</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-32 sm:w-48 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <button
              onClick={() => setShowManualSchedule((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Capture Stream</span>
            </button>
          </div>
        </div>

        {/* Manual Capture Panel */}
        {showManualSchedule && (
          <form onSubmit={handleCreateManualCapture} className="p-4 sm:p-5 bg-cyan-950/20 border-b border-cyan-500/20 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">Select Channel</label>
              <select
                value={manualChannelId || (channels[0]?.id || '')}
                onChange={(e) => setManualChannelId(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              >
                {channels.slice(0, 50).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.group || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">Recording Title</label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="e.g. Evening News Primetime"
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">Duration</label>
              <select
                value={manualDuration}
                onChange={(e) => setManualDuration(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              >
                <option value="30">30 min (~750 MB)</option>
                <option value="60">60 min (~1.5 GB)</option>
                <option value="120">120 min (~3.0 GB)</option>
                <option value="180">180 min (~4.5 GB)</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Start
              </button>
              <button
                type="button"
                onClick={() => setShowManualSchedule(false)}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Tab Navigation Filter */}
        <div className="px-5 sm:px-6 pt-4 flex items-center gap-2 border-b border-white/5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>All Captures ({dvrRecordings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'completed'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed ({dvrRecordings.filter((r) => r.status === 'completed').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduled')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'scheduled'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled ({dvrRecordings.filter((r) => r.status !== 'completed').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'bookmarks'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookmarkIcon className="w-3.5 h-3.5" />
            <span>Bookmarks ({bookmarks.length})</span>
          </button>
        </div>

        {/* Body Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5 scrollbar-thin">
          {activeTab === 'bookmarks' ? (
            bookmarks.length === 0 ? (
              <div className="text-center py-16 px-4">
                <BookmarkIcon className="w-12 h-12 text-zinc-600 mx-auto mb-3 stroke-1" />
                <h3 className="text-sm font-bold text-white">No Channel Bookmarks Yet</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
                  Bookmark channels from the EPG Guide or Live Player for instant 1-click access here anytime.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3 group shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-black/80 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={bm.channelLogo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120'}
                          alt={bm.channelName}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                          {bm.channelName}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                          <span>Saved {new Date(bm.savedAt).toLocaleDateString()}</span>
                          {bm.note && <span>• {bm.note}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handlePlayBookmark(bm)}
                        className="p-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white transition-colors cursor-pointer"
                        title="Play Bookmarked Channel"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        onClick={() => removeBookmark(bm.id)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove Bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredRecordings.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3 stroke-1" />
                <h3 className="text-sm font-bold text-white">No DVR Recordings Found</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
                  Schedule live or upcoming telecasts from the EPG Guide, or use the "Capture Stream" tool above to simulate archival recordings.
                </p>
              </div>
            ) : (
              filteredRecordings.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-black/80 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <img
                        src={rec.channelLogo || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120'}
                        alt={rec.channelName}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide">
                          {rec.channelName}
                        </span>
                        {rec.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Ready
                          </span>
                        )}
                        {rec.status === 'recording' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full uppercase animate-pulse">
                            <Radio className="w-2.5 h-2.5" />
                            Capturing
                          </span>
                        )}
                        {rec.status === 'scheduled' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full uppercase">
                            <Clock className="w-2.5 h-2.5" />
                            Scheduled
                          </span>
                        )}
                        {rec.catchupUrl && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded">
                            Timeshift
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white leading-snug truncate">
                        {rec.programTitle}
                      </h4>
                      {rec.programDescription && (
                        <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                          {rec.programDescription}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          <span>{new Date(rec.recordedAt).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>{rec.durationMinutes} min</span>
                        </span>
                        <span className="font-mono text-cyan-400 font-semibold">
                          {rec.fileSizeEstimate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {rec.status !== 'completed' && (
                      <button
                        onClick={() => updateRecordingStatus(rec.id, 'completed')}
                        className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Finalize Recording"
                      >
                        Finalize
                      </button>
                    )}

                    <button
                      onClick={() => handlePlayRecording(rec)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                      title="Play Capture in Simulator"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play</span>
                    </button>

                    <button
                      onClick={() => handleDownloadTicket(rec)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title="Export M3U Ticket"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteRecording(rec.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete Recording"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
