import * as React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Settings, Shield, HardDrive, Trash2, Cpu, Terminal, Play, RotateCcw } from 'lucide-react';
import { PageProtocolHeader } from './PageProtocolHeader';

export default function DesktopSettings() {
  const { clearHistory, clearCache } = usePlayerStore();
  const [bufferSize, setBufferSize] = React.useState('3.0s');
  const [videoEngine, setVideoEngine] = React.useState('Hls.js Core');
  const [simOrientation, setSimOrientation] = React.useState('Portrait');
  const [logs, setLogs] = React.useState<string[]>([
    "[INFO] Initializing high-speed streaming components...",
    "[DEBUG] Mounting React Native Expo shims context.",
    "[INFO] Ready. Stream cache initialized (MMKV: live)."
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

  const handleReset = () => {
    clearCache();
    clearHistory();
    addSimulatedLog("[WARNING] ClearCache triggered. Storage MMKV indexes successfully pruned.");
    alert("Simulator cache and history successfully cleared!");
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Settings Protocol Architecture Header */}
      <PageProtocolHeader
        title="Settings & Stream Pipeline Diagnostics"
        description="Client configuration and pipeline diagnostic panel. Controls player buffer parameters, low-latency HLS tuning, MMKV binary storage state, and console telemetry logging."
        protocol="W3C Web Storage & React Native MMKV Protocol"
        schema="Client Key-Value Storage Schema & HLS Player Diagnostics"
        rfcOrStandard="W3C Web Storage • RFC 8216 LL-HLS"
        layer="Configuration & Local Persistence Layer"
        supportedTags={['MMKV Binary Key-Store', 'HLS.js Buffer', 'LL-HLS Target Duration', 'Cache TTL', 'Diagnostic Console']}
        icon={Settings}
        badgeColor="indigo"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Config cards (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Player Stream buffers */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              Stream Pipeline & Video Buffer
            </h3>

            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                HLS Buffer Length (Pre-fetch buffer)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['1.5s (Low Latency)', '3.0s (Standard)', '6.0s (High Bandwidth)'].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleBufferSizeChange(size)}
                    className={`p-2.5 rounded-xl text-xs font-semibold transition-all border text-center ${
                      bufferSize === size
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        : 'bg-white/3 text-zinc-400 border-transparent hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                Underlying Streaming Engine
              </span>
              <div className="grid grid-cols-2 gap-2">
                {['Hls.js Core', 'Native HTML5 Video'].map((engine) => (
                  <button
                    key={engine}
                    onClick={() => handleEngineChange(engine)}
                    className={`p-2.5 rounded-xl text-xs font-semibold transition-all border text-center ${
                      videoEngine === engine
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        : 'bg-white/3 text-zinc-400 border-transparent hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    {engine}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Device orientation mock configuration */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              Device Sandbox Emulation
            </h3>
            
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-white block">Simulator Device Layout</span>
                <span className="text-[11px] text-zinc-500 font-medium">Configure frame size emulation.</span>
              </div>
              <div className="flex bg-zinc-950/40 p-1 border border-white/10 rounded-xl">
                {['Portrait', 'Landscape'].map((ori) => (
                  <button
                    key={ori}
                    onClick={() => {
                      setSimOrientation(ori);
                      addSimulatedLog(`Simulator rotation shifted: ${ori}`);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      simOrientation === ori ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {ori}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Prune and Clear */}
          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5 mb-1">
                <Trash2 className="w-4 h-4" />
                Reset App Cache
              </h3>
              <p className="text-[11px] text-zinc-500 leading-normal font-medium max-w-md">
                Prunes local store favorites, recent streaming logs history, and reset default public playlists. Irreversible operation.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-500/10 flex-shrink-0"
            >
              Reset Cache
            </button>
          </div>
        </div>

        {/* Right Column: Console logs output terminal (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-black/50 border border-white/10 rounded-2xl overflow-hidden min-h-[300px]">
          <div className="bg-zinc-950/80 px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 font-mono">
              <Terminal className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              LIVE TELEMETRY SHELL
            </span>
            <button
              onClick={() => setLogs([])}
              className="p-1 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Clear Logs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Logs feed scrolling wrapper */}
          <div className="p-4 flex-1 font-mono text-[11px] text-zinc-300 flex flex-col gap-2 overflow-y-auto max-h-[320px] select-text">
            {logs.length === 0 ? (
              <span className="text-zinc-600 italic">No telemetry entries. Interact with Settings to trigger events.</span>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="leading-relaxed whitespace-pre-wrap">
                  <span className="text-blue-500 select-none">$&nbsp;</span>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
