import * as React from 'react';
import { ArrowLeft, Smartphone, Code2, Sparkles, Copy, Check, ChevronRight } from 'lucide-react';
import { Stack } from 'expo-router';
import HomeScreen from '../app/index';
import PlayerScreen from '../app/player/[id]';
import DesktopApkBuilder from '../components/DesktopApkBuilder';
import { EXPO_CODEBASE } from '../data/rawExpoCode';

interface BuilderPageProps {
  onBackToPlayer: () => void;
}

export default function BuilderPage({ onBackToPlayer }: BuilderPageProps) {
  const [subTab, setSubTab] = React.useState<'builder' | 'code'>('builder');
  const [selectedFileIdx, setSelectedFileIdx] = React.useState(1);
  const [copied, setCopied] = React.useState(false);

  const selectedFile = EXPO_CODEBASE[selectedFileIdx] || EXPO_CODEBASE[0];

  const handleCopyCode = () => {
    if (selectedFile?.code) {
      navigator.clipboard.writeText(selectedFile.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[1700px] mx-auto flex flex-col gap-6 py-6 px-4 sm:px-6">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToPlayer}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Live TV Player</span>
          </button>

          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Whitelabel App Studio <span className="text-cyan-400 text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 font-mono">EAS Engine</span>
            </h1>
            <p className="text-xs text-zinc-400">Design custom branded Android APKs with live 60 FPS mobile simulation</p>
          </div>
        </div>

        {/* Studio Sub-tabs */}
        <div className="flex bg-zinc-950/80 p-1 border border-white/10 rounded-2xl">
          <button
            onClick={() => setSubTab('builder')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'builder'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>Custom APK Builder</span>
          </button>

          <button
            onClick={() => setSubTab('code')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'code'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>React Native Codebase</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Mobile Simulator on Left (5 cols), Builder/Code on Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Mobile Simulator */}
        <div className="col-span-1 lg:col-span-5 flex flex-col items-center justify-start lg:sticky lg:top-24">
          <div className="w-full max-w-[380px] relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/15 to-indigo-500/15 rounded-[54px] blur-3xl opacity-80 pointer-events-none" />

            {/* Apple iPhone Glass Simulator */}
            <div className="w-full aspect-[9/19] rounded-[48px] bg-black/90 backdrop-blur-2xl p-3.5 shadow-[0_25px_80px_-15px_rgba(59,130,246,0.25)] border-[6px] border-white/10 relative z-10 overflow-hidden ring-1 ring-white/15 flex flex-col">
              
              {/* Dynamic Island */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-5 bg-black rounded-full z-40 flex items-center justify-between px-3">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                <div className="w-3 h-1 bg-zinc-900 rounded-full" />
              </div>

              {/* Status Bar */}
              <div className="h-8 pt-0.5 px-6 flex items-center justify-between text-[11px] font-semibold text-zinc-300 select-none z-30">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">5G</span>
                  <div className="w-5 h-2.5 rounded-[3px] border border-zinc-500 p-[1px] flex items-center">
                    <div className="h-full w-4/5 bg-zinc-300 rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* Simulator Screen Root */}
              <div className="flex-1 w-full bg-[#050505] rounded-[36px] overflow-hidden relative flex flex-col ring-1 ring-white/10">
                <Stack>
                  <Stack.Screen name="index" component={HomeScreen} />
                  <Stack.Screen name="player/[id]" component={PlayerScreen} />
                </Stack>
              </div>

              {/* Home Indicator */}
              <div className="h-5 flex items-center justify-center z-30">
                <div className="w-28 h-1 bg-zinc-700 rounded-full" />
              </div>
            </div>

            <div className="text-center mt-3">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/60 border border-white/10 text-xs text-zinc-300 font-medium backdrop-blur-md">
                <Smartphone className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                Live 60 FPS Mobile Touch Simulator
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Custom APK Builder or Code Explorer */}
        <div className="col-span-1 lg:col-span-7 flex flex-col min-w-0">
          {subTab === 'builder' ? (
            <div className="glass rounded-[32px] p-6 border border-white/10 backdrop-blur-md">
              <DesktopApkBuilder />
            </div>
          ) : (
            <div className="glass rounded-[32px] p-6 border border-white/10 backdrop-blur-md flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-blue-400" />
                    <span>{selectedFile.path}</span>
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{selectedFile.description}</p>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* File List Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {EXPO_CODEBASE.map((file, idx) => {
                  const isActive = selectedFileIdx === idx;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFileIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-bold'
                          : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {file.path.split('/').pop()}
                    </button>
                  );
                })}
              </div>

              {/* Code Pre Container */}
              <div className="bg-black/80 rounded-2xl border border-white/10 p-4 font-mono text-xs overflow-x-auto max-h-[580px] text-zinc-300 leading-relaxed">
                <pre>{selectedFile.code}</pre>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
