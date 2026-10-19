/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import {
  Download,
  Tv,
  Smartphone,
  Globe,
  Apple,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  Code2,
  Terminal,
  FileCode
} from 'lucide-react';
import BrandMark from './BrandMark';

export default function DesktopDownloads() {
  const [copiedLink, setCopiedLink] = React.useState<boolean>(false);
  const [copiedCode, setCopiedCode] = React.useState<boolean>(false);
  const [copiedClone, setCopiedClone] = React.useState<boolean>(false);

  const downloadUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/download/latest.apk`
    : 'https://iptv.menu/api/download/latest.apk';

  const sourceZipUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/download/source.zip`
    : 'https://iptv.menu/api/download/source.zip';

  const downloaderCode = '3739589';
  const downloaderShortUrl = 'http://aftv.news/3739589';
  const gitCloneCmd = 'git clone https://github.com/angelburgosrosado/iptv-menu-app.git';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(downloadUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(downloaderCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyClone = () => {
    navigator.clipboard.writeText(gitCloneCmd);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2500);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* 1. HERO SECTION */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0b0d14] via-[#11141c] to-[#06070b] border border-white/10 p-6 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#7c5cff]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00e0c6]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c5cff]/15 border border-[#7c5cff]/30 text-[#a78bfa] text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-[#00e0c6]" />
            <span>OFFICIAL CLIENTS & DOWNLOADS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Get <span className="bg-gradient-to-r from-[#7c5cff] via-[#a78bfa] to-[#00e0c6] bg-clip-text text-transparent">IPTV.Menu Pro</span> on Any Device
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
            Enjoy ultra-fast live television, on-demand cinema, electronic program guides, and spatial 10-foot remote control across your living room TV, Android device, iPhone, and desktop.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="/api/download/latest.apk"
              download="IPTV.Menu_Pro_v1.0.apk"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#7c5cff] to-[#00e0c6] text-black font-black text-sm shadow-lg shadow-[#7c5cff]/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Android APK (Direct)</span>
            </a>

            <a
              href="/api/download/source.zip"
              download="iptv-menu-pro-main.zip"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-sm font-semibold transition-all cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-[#00e0c6]" />
              <span>Download Source Code (.zip)</span>
            </a>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#11141c] hover:bg-[#181c27] text-zinc-300 hover:text-white border border-[#1f2330] text-sm font-semibold transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[#22c55e]" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Direct APK URL'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PLATFORMS MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Android TV & Fire TV */}
        <div className="bg-[#0b0d14]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-[#7c5cff]/40 transition-all shadow-xl group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#7c5cff]/15 border border-[#7c5cff]/30 flex items-center justify-center text-[#a78bfa]">
                <Tv className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7c5cff]/20 text-[#00e0c6] border border-[#7c5cff]/40">
                Recommended
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#a78bfa] transition-colors">
                Android TV & Fire TV
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                NVIDIA Shield, Amazon FireStick, Chromecast Google TV, and Android smart TVs.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00e0c6] shrink-0" />
                <span>10-foot remote D-pad spatial focus</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00e0c6] shrink-0" />
                <span>Hardware 4K / HEVC video decoding</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00e0c6] shrink-0" />
                <span>Audio DSP normalizer & equalizer</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-6 border-t border-white/5 space-y-3">
            <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Downloader Code</span>
                <span className="text-base font-black font-mono text-[#00e0c6]">{downloaderCode}</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 font-medium transition-colors"
                title="Copy Downloader Code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <a
              href="/api/download/latest.apk"
              download="IPTV.Menu_Pro_v1.0.apk"
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download TV APK</span>
            </a>
          </div>
        </div>

        {/* Card 2: Android Phone & Tablet */}
        <div className="bg-[#0b0d14]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-[#00e0c6]/40 transition-all shadow-xl group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#00e0c6]/15 border border-[#00e0c6]/30 flex items-center justify-center text-[#00e0c6]">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10">
                Mobile
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-[#00e0c6] transition-colors">
                Android Phone & Tablet
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Samsung Galaxy, Google Pixel, Xiaomi, OnePlus, and modern Android tablets.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00e0c6] shrink-0" />
                <span>Touch momentum shelf navigation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00e0c6] shrink-0" />
                <span>Picture-in-Picture floating mini player</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00e0c6] shrink-0" />
                <span>Background audio mode & sleep timer</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-6 border-t border-white/5 space-y-3">
            <a
              href="/api/download/latest.apk"
              download="IPTV.Menu_Pro_v1.0.apk"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00e0c6] to-[#00b4d8] text-black font-black text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Mobile APK</span>
            </a>
          </div>
        </div>

        {/* Card 3: Web Player (Zero-Install) */}
        <div className="bg-[#0b0d14]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-xl group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Globe className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Instant Access
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                Web Cinema Player (PWA)
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Stream directly in Chrome, Edge, Safari, Brave, LG webOS & Samsung Tizen TV browsers.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero installation or setup required</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Dual MSE HLS + MPEG-TS demuxer</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Installable as desktop standalone app</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-6 border-t border-white/5 space-y-3">
            <a
              href="/"
              className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Launch Web Player</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Card 4: Apple iOS & macOS */}
        <div className="bg-[#0b0d14]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-zinc-400/40 transition-all shadow-xl group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                <Apple className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10">
                Apple
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-zinc-200 transition-colors">
                iOS & macOS Safari
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                iPhone, iPad, and Apple Silicon Mac desktops via native Safari PWA.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00e0c6] shrink-0" />
                <span>Tap Share &gt; &quot;Add to Home Screen&quot;</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00e0c6] shrink-0" />
                <span>AirPlay streaming to Apple TV</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00e0c6] shrink-0" />
                <span>Native AVPlayer HLS hardware pipeline</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-6 border-t border-white/5 space-y-3">
            <div className="bg-white/5 rounded-xl p-2.5 text-[11px] text-zinc-400 text-center font-medium">
              Open in Safari &rarr; Tap Share &rarr; Add to Home Screen
            </div>
          </div>
        </div>

      </div>

      {/* 3. 3-STEP SIDELOAD GUIDE FOR LIVING ROOM TVS */}
      <div className="bg-[#0b0d14]/80 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Tv className="w-5 h-5 text-[#00e0c6]" />
              <span>How to Install on Amazon Fire TV & Android TV in 60 Seconds</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Follow these simple steps using the official Downloader app from your TV app store.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 w-fit">
            <span>Downloader Code:</span>
            <span className="font-bold text-[#00e0c6]">{downloaderCode}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#7c5cff]/20 text-[#a78bfa] font-black text-sm flex items-center justify-center">
              1
            </div>
            <h4 className="text-sm font-bold text-white">Get Downloader App</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              On your TV home screen, search for <strong className="text-zinc-200">Downloader</strong> (orange icon by AFTVnews) in the Amazon Appstore or Google Play Store and install it.
            </p>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#7c5cff]/20 text-[#a78bfa] font-black text-sm flex items-center justify-center">
              2
            </div>
            <h4 className="text-sm font-bold text-white">Enter Downloader Code</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Open Downloader, enter numeric code <strong className="text-[#00e0c6] font-mono">{downloaderCode}</strong> (or short URL <code className="text-zinc-300">aftv.news/3739589</code>), and click <strong className="text-zinc-200">Go</strong>.
            </p>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#7c5cff]/20 text-[#a78bfa] font-black text-sm flex items-center justify-center">
              3
            </div>
            <h4 className="text-sm font-bold text-white">Click Install & Launch</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The APK will download automatically. Click <strong className="text-zinc-200">Install</strong>, open IPTV.Menu Pro, and enter your playlist or Xtream Codes login.
            </p>
          </div>
        </div>
      </div>

      {/* 4. DEVELOPER & SELF-HOSTING: FULL SOURCE CODE & DEPLOYMENT */}
      <div className="bg-[#0b0d14]/80 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-[#7c5cff]" />
              <span>Developer & Self-Host Source Code</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Download the complete full-stack TypeScript codebase, build custom APKs, or deploy your private streaming cluster.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/api/download/source.zip"
              download="iptv-menu-pro-main.zip"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7c5cff] to-[#00e0c6] text-black font-black text-xs shadow-md shadow-[#7c5cff]/20 hover:brightness-110 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Source (.zip)</span>
            </a>

            <a
              href="https://github.com/angelburgosrosado/iptv-menu-app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <span>GitHub Repo</span>
            </a>
          </div>
        </div>

        {/* Git Clone & Command Box */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#00e0c6]" />
              <span>Clone Repository via Git</span>
            </span>
            <button
              onClick={handleCopyClone}
              className="text-[#00e0c6] hover:underline flex items-center gap-1 font-mono cursor-pointer"
            >
              {copiedClone ? <Check className="w-3 h-3 text-[#22c55e]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedClone ? 'Copied to Clipboard!' : 'Copy Command'}</span>
            </button>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-2xl p-4 font-mono text-xs text-zinc-300 overflow-x-auto flex items-center justify-between gap-4">
            <code>git clone https://github.com/angelburgosrosado/iptv-menu-app.git</code>
            <button
              onClick={handleCopyClone}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors shrink-0"
              title="Copy"
            >
              {copiedClone ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Quick Dev & Build Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-white/5 rounded-2xl p-4 space-y-2 border border-white/5">
            <div className="text-[11px] font-bold text-[#a78bfa] uppercase tracking-wider">Web & API Local Dev</div>
            <pre className="text-[11px] font-mono text-zinc-300 bg-black/40 p-2.5 rounded-xl overflow-x-auto">
              npm install{'\n'}npm run dev
            </pre>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Launches React 19 web player on port 3000 and Express API proxy on port 3001.
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 space-y-2 border border-white/5">
            <div className="text-[11px] font-bold text-[#00e0c6] uppercase tracking-wider">Build Android TV APK</div>
            <pre className="text-[11px] font-mono text-zinc-300 bg-black/40 p-2.5 rounded-xl overflow-x-auto">
              cd mobile{'\n'}npm run build:apk
            </pre>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Compiles optimized universal Android APK with 10-foot TV D-pad focus engine.
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 space-y-2 border border-white/5">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Run All Unit Tests</div>
            <pre className="text-[11px] font-mono text-zinc-300 bg-black/40 p-2.5 rounded-xl overflow-x-auto">
              npm test
            </pre>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Executes full test suite verifying stream proxy, IndexedDB cache, EPG, and player.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
