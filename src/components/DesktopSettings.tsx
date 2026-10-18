/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuth, authStore } from '../authStore';
import { 
  Settings, 
  Shield, 
  HardDrive, 
  Trash2, 
  Cpu, 
  Terminal, 
  Play, 
  RotateCcw,
  Sun,
  Moon,
  Link,
  UserX,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Tv,
  Smartphone,
  Radio,
  Zap
} from 'lucide-react';

export default function DesktopSettings() {
  const { clearHistory, clearCache, playlistUrl, setPlaylistUrl, loadPlaylist, isConnectedToXtream, xtreamAccount } = usePlayerStore();
  const auth = useAuth();

  const [bufferSize, setBufferSize] = React.useState('1.5s (Low Latency)');
  const [videoEngine, setVideoEngine] = React.useState('Hls.js Core');
  const [themeMode, setThemeMode] = React.useState<'dark' | 'light'>('dark');
  const [defaultUrl, setDefaultUrl] = React.useState(playlistUrl);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  const [logs, setLogs] = React.useState<string[]>([
    `[INFO] Streamly engine mounted with HLS.js 1.7.3`,
    `[INFO] Dual MSE & hardware video decoders online`,
    `[INFO] Local EPG cache active (30min TTL)`
  ]);

  const addSimulatedLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-6));
  };

  const handleBufferSizeChange = (size: string) => {
    setBufferSize(size);
    addSimulatedLog(`HLS forward buffer adjusted to: ${size}`);
  };

  const handleEngineChange = (engine: string) => {
    setVideoEngine(engine);
    addSimulatedLog(`Playback pipeline set to: ${engine}`);
  };

  const handleSaveDefaultUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defaultUrl.trim()) return;
    setPlaylistUrl(defaultUrl.trim());
    loadPlaylist(defaultUrl.trim());
    addSimulatedLog(`Ingestion playlist URL updated: ${defaultUrl}`);
    setStatusMessage('Default playlist URL saved and re-synced.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleResetCache = () => {
    clearCache();
    clearHistory();
    addSimulatedLog("[WARNING] Local storage cache and EPG indexes successfully pruned.");
    setStatusMessage("Streamly local cache, history, and stored preferences pruned.");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="flex flex-col h-full gap-6 px-4 sm:px-6 py-2">
      {/* Streamly Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2330]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#7c5cff]" />
              <span>Settings & Preferences</span>
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7c5cff]/20 text-[#00e0c6] border border-[#7c5cff]/30">
              System Configuration
            </span>
          </div>
          <p className="text-xs text-[#9aa0b3] mt-1">
            Configure stream buffer latency, hardware acceleration, playback engine, and data storage
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e] text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Config cards (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Buffer Size / Latency preferences */}
          <div className="bg-[#11141c]/90 border border-[#1f2330] rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Cpu className="w-4 h-4 text-[#00e0c6]" />
              <span>Playback Pipeline & Low-Latency Buffer</span>
            </h3>

            <div>
              <span className="text-[10px] font-bold text-[#9aa0b3] uppercase tracking-wider block mb-2">
                HLS Forward Buffer Length
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['1.5s (Low Latency)', '3.0s (Standard)', '6.0s (High Bandwidth)'].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleBufferSizeChange(size)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      bufferSize === size
                        ? 'bg-[#7c5cff]/20 text-white border-[#7c5cff]/60 shadow-sm'
                        : 'bg-[#06070b] text-[#9aa0b3] border-[#1f2330] hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-[#9aa0b3] uppercase tracking-wider block mb-2">
                Underlying Video Engine
              </span>
              <div className="grid grid-cols-2 gap-2">
                {['Hls.js Core', 'Native HTML5 Video'].map((engine) => (
                  <button
                    key={engine}
                    onClick={() => handleEngineChange(engine)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      videoEngine === engine
                        ? 'bg-[#7c5cff]/20 text-white border-[#7c5cff]/60 shadow-sm'
                        : 'bg-[#06070b] text-[#9aa0b3] border-[#1f2330] hover:text-white'
                    }`}
                  >
                    {engine}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Default Playlist URL */}
          <form onSubmit={handleSaveDefaultUrl} className="bg-[#11141c]/90 border border-[#1f2330] rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Link className="w-4 h-4 text-[#7c5cff]" />
              <span>Default M3U Playlist Feed</span>
            </h3>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#9aa0b3] mb-1.5 block">
                Automatic Ingestion URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={defaultUrl}
                  onChange={(e) => setDefaultUrl(e.target.value)}
                  placeholder="https://example.com/playlist.m3u"
                  className="flex-1 px-3.5 py-2.5 bg-[#06070b] border border-[#1f2330] focus:border-[#7c5cff]/60 rounded-xl text-xs text-white font-mono outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gradient-to-r from-[#7c5cff] to-[#00e0c6] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#7c5cff]/20 cursor-pointer"
                >
                  Save URL
                </button>
              </div>
            </div>
          </form>

          {/* Cache Clear Action */}
          <div className="bg-[#11141c]/90 border border-[#1f2330] rounded-3xl p-6 flex items-center justify-between gap-4 shadow-xl">
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block">Purge Local Stream Cache</span>
              <span className="text-[11px] text-[#9aa0b3] block mt-0.5">
                Prunes local storage indexes, cached EPG XMLTV schedules, and history tokens.
              </span>
            </div>
            <button
              onClick={handleResetCache}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              Purge Cache
            </button>
          </div>
        </div>

        {/* Right Column: Account & Live Diagnostics (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Account Profile Card */}
          <div className="bg-[#11141c]/90 border border-[#1f2330] rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Shield className="w-4 h-4 text-[#00e0c6]" />
              <span>Account & Authentication</span>
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7c5cff] to-[#00e0c6] flex items-center justify-center font-bold text-white text-base shadow-md">
                {auth.email ? auth.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{auth.email || 'Xtream Guest User'}</h4>
                <p className="text-[10px] text-[#22c55e] font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                  IPTV.Menu Pro Session Active
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex flex-col gap-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#9aa0b3]">Active Subscription</span>
                <span className="font-semibold text-white">IPTV.Menu Pro</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#9aa0b3]">Hardware DRM</span>
                <span className="font-mono text-[#00e0c6]">Widevine / Clearkey Enabled</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#9aa0b3]">Storage Persistence</span>
                <span className="font-mono text-[#22c55e]">Local IndexedDB Active</span>
              </div>
            </div>
          </div>

          {/* System Terminal Console */}
          <div className="bg-[#0b0d14] border border-[#1f2330] rounded-3xl p-5 shadow-xl flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between text-xs text-[#9aa0b3] border-b border-white/5 pb-2">
              <span className="flex items-center gap-1.5 font-bold text-[#eef0f6]">
                <Terminal className="w-3.5 h-3.5 text-[#00e0c6]" />
                IPTV.Menu System Console
              </span>
              <span className="text-[10px] text-[#22c55e] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-ping" />
                ONLINE
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-[11px] text-[#9aa0b3] min-h-[100px]">
              {logs.map((log, idx) => (
                <p key={idx} className="leading-tight break-all">
                  <span className="text-[#00e0c6]">{log.slice(0, log.indexOf(']') + 1)}</span>
                  <span className="text-[#eef0f6]">{log.slice(log.indexOf(']') + 1)}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
