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
  Lock
} from 'lucide-react';
import { PageProtocolHeader } from './PageProtocolHeader';

export default function DesktopSettings() {
  const { clearHistory, clearCache, playlistUrl, setPlaylistUrl, loadPlaylist } = usePlayerStore();
  const auth = useAuth();

  const [bufferSize, setBufferSize] = React.useState('1.5s (Low Latency)');
  const [videoEngine, setVideoEngine] = React.useState('Hls.js Core');
  const [themeMode, setThemeMode] = React.useState<'dark' | 'light'>('dark');
  const [defaultUrl, setDefaultUrl] = React.useState(playlistUrl);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  const [logs, setLogs] = React.useState<string[]>([
    `[INFO] Initializing high-speed streaming components...`,
    `[DEBUG] Mounting React Native Expo shims context.`,
    `[INFO] Ready. Stream cache initialized (MMKV: live).`
  ]);

  const addSimulatedLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-6));
  };

  const handleBufferSizeChange = (size: string) => {
    setBufferSize(size);
    addSimulatedLog(`HLS player stream buffer modified to: ${size}`);
  };

  const handleEngineChange = (engine: string) => {
    setVideoEngine(engine);
    addSimulatedLog(`Player pipeline switched to: ${engine}`);
  };

  const handleThemeChange = (mode: 'dark' | 'light') => {
    setThemeMode(mode);
    addSimulatedLog(`Theme preference set to: ${mode} mode.`);
    setStatusMessage(`Theme switched to ${mode} mode.`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleSaveDefaultUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defaultUrl.trim()) return;
    setPlaylistUrl(defaultUrl.trim());
    loadPlaylist(defaultUrl.trim());
    addSimulatedLog(`Default playlist URL updated to: ${defaultUrl}`);
    setStatusMessage('Default playlist URL saved and re-synced.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleResetCache = () => {
    clearCache();
    clearHistory();
    addSimulatedLog("[WARNING] ClearCache triggered. Storage MMKV indexes successfully pruned.");
    setStatusMessage("Simulator cache, history, and stored preferences pruned.");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDeleteAccount = () => {
    authStore.logout();
    clearCache();
    clearHistory();
    setShowDeleteConfirm(false);
    alert("Account and local data successfully removed from this client.");
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Settings Protocol Architecture Header */}
      <PageProtocolHeader
        title="Settings & Stream Pipeline Preferences"
        description="Client configuration and pipeline diagnostic panel. Controls player buffer latency parameters, theme preferences, default playlist ingestion URL, cache lifecycle, and account deletion."
        protocol="W3C Web Storage & React Native MMKV Protocol"
        schema="Client Key-Value Storage Schema & HLS Player Diagnostics"
        rfcOrStandard="W3C Web Storage • RFC 8216 LL-HLS"
        layer="Configuration & Local Persistence Layer"
        supportedTags={['Buffer Size (1.5s/3s/6s)', 'Theme Toggle', 'Default Playlist URL', 'Cache Pruning', 'Account Deletion']}
        icon={Settings}
        badgeColor="cyan"
      />

      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Config cards (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Buffer Size / Latency preferences */}
          <div className="bg-[#16161a] border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Stream Pipeline & Buffer Latency Preferences
            </h3>

            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                HLS Forward Buffer Length
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['1.5s (Low Latency)', '3.0s (Standard)', '6.0s (High Bandwidth)'].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleBufferSizeChange(size)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      bufferSize === size
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                        : 'bg-black/40 text-zinc-400 border-white/5 hover:text-white'
                    }`}
                    aria-label={`Select buffer size ${size}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Underlying Streaming Engine
              </span>
              <div className="grid grid-cols-2 gap-2">
                {['Hls.js Core', 'Native HTML5 Video'].map((engine) => (
                  <button
                    key={engine}
                    onClick={() => handleEngineChange(engine)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      videoEngine === engine
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                        : 'bg-black/40 text-zinc-400 border-white/5 hover:text-white'
                    }`}
                    aria-label={`Select engine ${engine}`}
                  >
                    {engine}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="bg-[#16161a] border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Sun className="w-4 h-4 text-cyan-400" />
              Theme Appearance Toggle
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Visual Color Scheme</span>
                <span className="text-[11px] text-zinc-400">Default dark-first high-contrast palette or soft studio mode.</span>
              </div>
              <div className="flex bg-black/50 p-1 border border-white/10 rounded-xl">
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    themeMode === 'dark' ? 'bg-cyan-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                  aria-label="Dark Mode Theme"
                >
                  <Moon className="w-3.5 h-3.5" />
                  Dark
                </button>
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    themeMode === 'light' ? 'bg-cyan-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
                  aria-label="Light Studio Mode Theme"
                >
                  <Sun className="w-3.5 h-3.5" />
                  Light
                </button>
              </div>
            </div>
          </div>

          {/* Default Playlist URL */}
          <form onSubmit={handleSaveDefaultUrl} className="bg-[#16161a] border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Link className="w-4 h-4 text-cyan-400" />
              Default Playlist URL Feed
            </h3>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                Automatic Boot Ingestion Source
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={defaultUrl}
                  onChange={(e) => setDefaultUrl(e.target.value)}
                  placeholder="https://example.com/playlist.m3u"
                  className="flex-1 px-3.5 py-2.5 bg-black/50 border border-white/10 focus:border-cyan-500/50 rounded-xl text-xs text-white font-mono outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  Save URL
                </button>
              </div>
            </div>
          </form>

          {/* Cache Clear Action */}
          <div className="bg-[#16161a] border border-white/10 rounded-3xl p-6 flex items-center justify-between gap-4 shadow-xl">
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block">Purge Local Stream Cache</span>
              <span className="text-[11px] text-zinc-400 block mt-0.5">
                Prunes local MMKV storage indexes, favorites, and watch history tokens.
              </span>
            </div>
            <button
              onClick={handleResetCache}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer flex-shrink-0"
              aria-label="Clear cache"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              Clear Cache
            </button>
          </div>

          {/* Dangerous Zone: Account Deletion */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 flex items-center justify-between gap-4 shadow-xl">
            <div className="min-w-0">
              <span className="text-xs font-bold text-red-400 block">Delete Account & Stored Data</span>
              <span className="text-[11px] text-zinc-400 block mt-0.5">
                Permanently prune your account profile, uploaded playlist keys, and cancel active sessions.
              </span>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
              aria-label="Delete Account"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Account
            </button>
          </div>

          {/* Account Deletion Confirmation Dialog */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                Are you sure you want to delete your account ({auth.email || 'guest'})?
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                This action is irreversible. All local bookmarks, history, and credentials will be permanently erased.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Diagnostics Telemetry Terminal (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-[#16161a] border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Real-time Console Diagnostics
            </h3>

            <div className="p-4 bg-black rounded-2xl border border-white/10 font-mono text-[11px] text-zinc-300 min-h-[180px] space-y-2">
              {logs.map((log, idx) => (
                <div key={idx} className="leading-snug">
                  <span className="text-cyan-400 mr-1.5">›</span>
                  {log}
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Active Account:</span>
                <span className="text-white font-bold">{auth.email || 'Guest Session'}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Subscription Status:</span>
                <span className="text-cyan-400 font-bold uppercase">{auth.role}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Storage Backend:</span>
                <span className="text-emerald-400 font-mono">MMKV + LocalStorage</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
