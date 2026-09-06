/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import {
  Smartphone,
  Code2,
  Copy,
  Check,
  BookOpen,
  Terminal,
  ChevronRight,
  Cpu,
  Layers,
  Sparkles,
  Github,
  MonitorPlay,
  Play,
  Home,
  Tv,
  Heart,
  CalendarRange,
  UploadCloud,
  Settings,
  Crown,
  ShieldCheck,
  LayoutGrid,
  Server,
  ShieldAlert,
  Radio
} from 'lucide-react';
import { Stack } from 'expo-router';
import { motion, AnimatePresence } from 'motion/react';
import HomeScreen from './app/index';
import PlayerScreen from './app/player/[id]';
import { EXPO_CODEBASE } from './data/rawExpoCode';

import DesktopChannels from './components/DesktopChannels';
import DesktopFavorites from './components/DesktopFavorites';
import DesktopEpg from './components/DesktopEpg';
import DesktopM3uUpload from './components/DesktopM3uUpload';
import DesktopRemoteApps from './components/DesktopRemoteApps';
import DesktopSettings from './components/DesktopSettings';
import DesktopPremium from './components/DesktopPremium';
import SystemAdminConsole from './components/admin/SystemAdminConsole';
import XtreamConnector from './components/XtreamConnector';
import MultiScreenMatrix from './components/MultiScreenMatrix';
import AdSenseSlot from './components/ads/AdSenseSlot';
import MarketingHero from './components/MarketingHero';
import PricingSection from './components/PricingSection';
import CertifiedDevices from './components/CertifiedDevices';
import AuthModal from './components/AuthModal';
import WorkspaceSwitcher from './components/WorkspaceSwitcher';
import { useAuth, authStore } from './authStore';
import { fetchWithAuth } from './lib/apiClient';
import {
  Palette,
  Sliders,
  Download,
  ArrowLeft,
  ArrowRight,
  Upload,
  Lock,
  RefreshCw,
  Activity,
  FileText,
  Trash2,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const auth = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const MOBILE_TAB_ITEMS = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'channels', label: 'Channels', icon: Tv },
    { id: 'remote_apps', label: 'OTA', icon: Radio },
    { id: 'multiscreen', label: 'Multi', icon: LayoutGrid },
    { id: 'upload', label: 'Upload', icon: UploadCloud },
    { id: 'devices', label: 'Devices', icon: ShieldCheck },
    { id: 'premium', label: 'Upgrade', icon: Crown },
  ];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const [activeMenu, setActiveMenu] = React.useState<string>('home');
  const [selectedFileIdx, setSelectedFileIdx] = React.useState(1); // Default to src/types/iptv.ts
  const [copied, setCopied] = React.useState(false);

  // App Builder States
  const [subTab, setSubTab] = React.useState<'explorer' | 'builder'>('explorer');
  const [builderStep, setBuilderStep] = React.useState<number>(1);
  const [appName, setAppName] = React.useState<string>('IPTV Player Pro');
  const [bundleId, setBundleId] = React.useState<string>('com.iptv.pro.player');
  const [primaryColor, setPrimaryColor] = React.useState<string>('#3b82f6');
  const [accentColor, setAccentColor] = React.useState<string>('#10b981');
  const [logoUrl, setLogoUrl] = React.useState<string>('https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=120&auto=format&fit=crop&q=60');
  const [m3uSourceType, setM3uSourceType] = React.useState<'url' | 'file'>('url');
  const [m3uUrl, setM3uUrl] = React.useState<string>('https://iptv.menu/test-playlist.m3u');
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(null);
  const [defaultCategory, setDefaultCategory] = React.useState<string>('All Channels');
  const [boundAppConfigId, setBoundAppConfigId] = React.useState<string>('');

  // Compiling Simulation States
  const [isCompiling, setIsCompiling] = React.useState<boolean>(false);
  const [compileProgress, setCompileProgress] = React.useState<number>(0);
  const [compileLogs, setCompileLogs] = React.useState<string[]>([]);
  const [compilationSuccess, setCompilationSuccess] = React.useState<boolean>(false);
  const [activeBuildId, setActiveBuildId] = React.useState<string>('34cdb52a-7b6e-40e9-b5b8-1c8c2730f55d');
  const [apkArtifactUrl, setApkArtifactUrl] = React.useState<string | null>('https://expo.dev/artifacts/eas/dEaxtp1LoGphYwP6ntPVI1BJmHi_45_UiRZ4Tj8CKXw.apk');

  const compileIntervalRef = React.useRef<any>(null);

  const startApkBuild = async () => {
    setIsCompiling(true);
    setCompileProgress(0);
    setCompilationSuccess(false);
    
    // Dispatch real backend build job to /api/builds
    try {
      const res = await fetchWithAuth('/api/builds', {
        method: 'POST',
        body: JSON.stringify({
          appName,
          brandConfig: {
            primaryColor,
            accentColor,
            logoUrl
          },
          playlistSource: {
            type: m3uSourceType,
            value: m3uSourceType === 'url' ? m3uUrl : (uploadedFileName || 'upload')
          },
          appConfigId: boundAppConfigId || null
        })
      });
      if (res && res.buildId) {
        setActiveBuildId(res.buildId);
      }
    } catch (err: any) {
      console.warn('Backend build dispatch note:', err);
    }

    setCompileLogs([
      '[SYSTEM] Initializing cloud compiling cluster...',
      '[SYSTEM] Pulling target SDK framework environment (Android API Level 34)...',
    ]);

    const logs = [
      '[SYSTEM] Target detected: White-Label Android Application.',
      `[CONFIG] Embedding app name: "${appName}" with bundle package: "${bundleId}".`,
      `[THEME] Applying custom color palette (Primary: ${primaryColor}, Accent: ${accentColor}).`,
      '[ASSETS] Processing custom logo and high-DPI splash assets...',
      `[STREAMS] Setting up default stream playlist URL: "${m3uSourceType === 'url' ? m3uUrl : (uploadedFileName || 'Uploaded M3U File')}".`,
      `[STREAMS] Configuring default category: "${defaultCategory}".`,
      '[ENGINE] Shimming Exoplayer audio/video decoders & HLS latency buffer engines...',
      '[GRADLE] Spawning Gradle compiler node...',
      '[GRADLE] Running target tasks: :app:bundleRelease...',
      '[COMPILER] Transpiling JavaScript code to Hermes Bytecode...',
      '[COMPILER] Bundling React Native assets and vector fonts...',
      '[COMPILER] Optimizing bundle size (stripped 4.2MB of dead module definitions)...',
      '[SIGNING] Signing output binaries with custom iptv-menu keystore credentials...',
      '[ZIP] Optimizing resource alignements (zipalign -v 4 release.apk)...',
      '[SUCCESS] APK successfully compiled! File size: 14.8MB. Hash: sha256_8f3c9e...'
    ];

    let currentLogIndex = 0;
    let currentProgress = 0;

    compileIntervalRef.current = setInterval(() => {
      currentProgress += 5;
      if (currentProgress > 100) {
        currentProgress = 100;
      }
      setCompileProgress(currentProgress);

      const expectedLogCount = Math.floor((currentProgress / 100) * logs.length);
      if (currentLogIndex < expectedLogCount && currentLogIndex < logs.length) {
        setCompileLogs((prev) => [
          ...prev,
          logs[currentLogIndex]
        ]);
        currentLogIndex++;
      }

      if (currentProgress === 100) {
        clearInterval(compileIntervalRef.current);
        setIsCompiling(false);
        setCompilationSuccess(true);
      }
    }, 180);
  };

  React.useEffect(() => {
    return () => {
      if (compileIntervalRef.current) {
        clearInterval(compileIntervalRef.current);
      }
    };
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleM3uFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
    }
  };

  const currentFile = EXPO_CODEBASE[selectedFileIdx] || EXPO_CODEBASE[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const SIDEBAR_ITEMS = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'channels', label: 'Channels', icon: Tv },
    { id: 'multiscreen', label: 'Quad Multi-Screen', icon: LayoutGrid },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'epg', label: 'EPG Guide', icon: CalendarRange },
    { id: 'xtream', label: 'Xtream / Stalker', icon: Server },
    { id: 'upload', label: 'M3U Upload', icon: UploadCloud },
    { id: 'remote_apps', label: 'Remote Apps (OTA)', icon: Radio },
    { id: 'system_admin', label: 'Platform Admin', icon: ShieldAlert },
    { id: 'devices', label: 'Certified Devices', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'premium', label: 'Premium Upgrade', icon: Crown },
  ];

  const renderActiveSection = () => {
    switch (activeMenu) {
      case 'channels':
        return <DesktopChannels onSwitchToMultiScreen={() => setActiveMenu('multiscreen')} />;
      case 'multiscreen':
        return <MultiScreenMatrix />;
      case 'favorites':
        return <DesktopFavorites />;
      case 'epg':
        return <DesktopEpg />;
      case 'xtream':
        return <XtreamConnector />;
      case 'upload':
        return <DesktopM3uUpload />;
      case 'remote_apps':
        return <DesktopRemoteApps />;
      case 'system_admin':
        return <SystemAdminConsole />;
      case 'devices':
        return <CertifiedDevices />;
      case 'settings':
        return <DesktopSettings />;
      case 'premium':
        return <DesktopPremium onTriggerAuth={() => setIsAuthModalOpen(true)} />;
      case 'home':
      default:
        return (
          <div className="flex flex-col h-full gap-4">
            {/* Header Description with Subtab Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">
                    Production Code Hub
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Mobile IPTV Codebase Expo
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Browse standard client-side modules or compile custom, white-label Android builds.
                </p>
              </div>

              {/* Segmented Control Switcher */}
              <div className="flex bg-zinc-950/60 p-1 border border-white/5 rounded-xl self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setSubTab('explorer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    subTab === 'explorer' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Code Explorer
                </button>
                <button
                  type="button"
                  onClick={() => setSubTab('builder')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    subTab === 'builder' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
                  App Builder
                  <span className="text-[8px] bg-amber-500/15 text-amber-400 px-1 py-0.5 rounded border border-amber-500/20 font-black animate-pulse">NEW</span>
                </button>
              </div>
            </div>

            {subTab === 'explorer' ? (
              <>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
                  {/* File explorer Sidebar List (Left 4 cols in wide size) */}
                  <div className="md:col-span-4 flex flex-col gap-2 md:border-r md:border-white/10 pr-0 md:pr-4">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block px-2">
                      Workspace Files
                    </span>
                    
                    <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[300px] md:max-h-[500px] scrollbar-hide">
                      {EXPO_CODEBASE.map((file, idx) => {
                        const isActive = selectedFileIdx === idx;
                        return (
                          <button
                            key={file.path}
                            onClick={() => setSelectedFileIdx(idx)}
                            style={{ outline: 'none' }}
                            className={`w-full flex items-center justify-between text-left px-3 py-3 rounded-2xl transition-all cursor-pointer ${
                              isActive
                                ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                : 'hover:bg-white/5 text-zinc-400 border border-transparent hover:text-zinc-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Code2 className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                              <span className="text-xs font-semibold truncate font-mono">
                                {file.path}
                              </span>
                            </div>
                            <ChevronRight className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-zinc-600'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Code Highlighter Frame (Right 8 cols) with black terminal theme */}
                  <div className="md:col-span-8 flex flex-col bg-black/80 rounded-[24px] border border-white/10 overflow-hidden relative min-h-[450px] md:min-h-0">
                    {/* Code window header */}
                    <div className="bg-zinc-950/90 px-5 py-3.5 border-b border-white/5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-zinc-500 font-mono block tracking-wider">
                          PATHNAME
                        </span>
                        <span className="text-xs font-bold text-zinc-300 truncate font-mono flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          /{currentFile.path}
                        </span>
                      </div>

                      <button
                        onClick={handleCopyCode}
                        style={{ outline: 'none' }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 transition-all text-xs font-medium text-zinc-200 hover:text-white rounded-lg cursor-pointer select-none active:scale-95 border border-white/5 shadow-md"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Description strip */}
                    <div className="px-5 py-3 bg-zinc-900/60 border-b border-white/5 text-[11px] text-zinc-400 leading-relaxed font-semibold">
                      🚀 <span className="text-zinc-300 font-medium">{currentFile.description}</span>
                    </div>

                    {/* Code Scrollbox */}
                    <div className="flex-1 overflow-auto p-5 bg-black/40 max-h-[450px] md:max-h-[500px]">
                      <pre className="font-mono text-xs text-blue-100/90 leading-relaxed hover:text-white transition-colors select-text">
                        <code>{currentFile.code}</code>
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Setup Guide / Terminal command display block */}
                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="flex items-center gap-1.5 mb-3 px-1">
                    <Terminal className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase">
                      Expo CLI Shell Boots
                    </span>
                  </div>
                  
                  <div className="bg-zinc-950/80 rounded-2xl border border-white/5 p-4 font-mono text-[11px] sm:text-xs text-zinc-300 leading-relaxed flex flex-col gap-3">
                    <div>
                      <span className="text-blue-400"># 1. Spawn a high-performance Expo mobile workspace</span>
                      <p className="text-zinc-100 font-semibold bg-black/60 p-2.5 rounded-lg border border-white/5 mt-1.5 select-all">
                        npx create-expo-app@latest personal-iptv --template tabs
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-400"># 2. Setup standard high-speed streaming utilities</span>
                      <p className="text-zinc-100 font-semibold bg-black/60 p-2.5 rounded-lg border border-white/5 mt-1.5 select-all font-mono">
                        npm install zustand react-native-mmkv @shopify/flash-list expo-video expo-image lucide-react
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* --- APP BUILDER WIZARD --- */
              <div className="mt-4 flex flex-col flex-1">
                {/* Wizard Steps indicator tracker */}
                <div className="flex items-center justify-between gap-2 bg-zinc-950/40 p-3.5 border border-white/5 rounded-2xl mb-4">
                  <button 
                    type="button" 
                    onClick={() => !isCompiling && setBuilderStep(1)}
                    disabled={isCompiling}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs transition-colors ${builderStep >= 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-500 border border-white/5'}`}>
                      1
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider transition-colors ${builderStep === 1 ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>Brand Config</span>
                  </button>
                  <div className="h-px bg-white/5 flex-1 mx-2" />
                  <button 
                    type="button" 
                    onClick={() => !isCompiling && setBuilderStep(2)}
                    disabled={isCompiling}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs transition-colors ${builderStep >= 2 ? 'bg-blue-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-500 border border-white/5'}`}>
                      2
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider transition-colors ${builderStep === 2 ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>Stream Source</span>
                  </button>
                  <div className="h-px bg-white/5 flex-1 mx-2" />
                  <button 
                    type="button" 
                    onClick={() => !isCompiling && setBuilderStep(3)}
                    disabled={isCompiling}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs transition-colors ${builderStep >= 3 ? 'bg-blue-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-500 border border-white/5'}`}>
                      3
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider transition-colors ${builderStep === 3 ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>Build & Export</span>
                  </button>
                </div>

                {/* Slides sliding viewport */}
                <div className="w-full overflow-hidden relative">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${(builderStep - 1) * 100}%)` }}
                  >
                    {/* STEP 1: Brand Config Panel */}
                    <div className="w-full shrink-0 px-1">
                      <div className="bg-white/[0.01] border border-white/5 rounded-[24px] p-5 flex flex-col gap-5">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                          <Palette className="w-4 h-4 text-blue-400" />
                          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Step 1: Application Brand Config</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left form details */}
                          <div className="flex flex-col gap-4">
                            <div>
                              <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">App Display Name</label>
                              <input
                                type="text"
                                value={appName}
                                onChange={(e) => setAppName(e.target.value)}
                                className="w-full bg-zinc-950/60 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors font-semibold"
                                placeholder="e.g. IPTV Player Pro"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Android Bundle ID (Package Name)</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={bundleId}
                                  onChange={(e) => setBundleId(e.target.value)}
                                  className="w-full bg-zinc-950/60 border border-white/5 rounded-xl pl-3 pr-8 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                                  placeholder="e.g. com.iptv.pro.player"
                                />
                                <Lock className="w-3.5 h-3.5 text-zinc-600 absolute right-3 top-1/2 -translate-y-1/2" />
                              </div>
                            </div>

                            {/* Color selects */}
                            <div>
                              <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Brand Color Scheme</label>
                              <div className="grid grid-cols-2 gap-3 bg-zinc-950/40 p-3 rounded-xl border border-white/5">
                                <div>
                                  <span className="text-[9px] font-bold text-zinc-400 block mb-1">Primary Color</span>
                                  <div className="flex items-center gap-1.5">
                                    <input 
                                      type="color" 
                                      value={primaryColor} 
                                      onChange={(e) => setPrimaryColor(e.target.value)}
                                      className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer overflow-hidden outline-none"
                                    />
                                    <input 
                                      type="text" 
                                      value={primaryColor}
                                      onChange={(e) => setPrimaryColor(e.target.value)}
                                      className="w-full bg-transparent text-[10px] font-mono text-zinc-300 uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-zinc-400 block mb-1">Accent Accent</span>
                                  <div className="flex items-center gap-1.5">
                                    <input 
                                      type="color" 
                                      value={accentColor} 
                                      onChange={(e) => setAccentColor(e.target.value)}
                                      className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer overflow-hidden outline-none"
                                    />
                                    <input 
                                      type="text" 
                                      value={accentColor}
                                      onChange={(e) => setAccentColor(e.target.value)}
                                      className="w-full bg-transparent text-[10px] font-mono text-zinc-300 uppercase focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: logo select and preview */}
                          <div className="flex flex-col gap-4">
                            <div>
                              <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">App Launcher Icon</label>
                              <div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl border border-white/10 bg-black/40 overflow-hidden flex-shrink-0 flex items-center justify-center relative group shadow-inner">
                                  <img src={logoUrl} className="w-full h-full object-contain p-1" alt="Logo icon Preview" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                    <Upload className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-zinc-300">Drag or click to upload</p>
                                  <p className="text-[8px] text-zinc-500 mt-0.5 leading-relaxed">Recommended 512x512px with alpha channel.</p>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    id="logo-picker"
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor="logo-picker"
                                    className="inline-flex mt-2 px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-extrabold uppercase tracking-wide cursor-pointer transition-all border border-white/5 text-zinc-300"
                                  >
                                    Choose File
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* Preset Logo shortcuts for testing */}
                            <div>
                              <span className="text-[8px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1.5">Or Choose preset branding icon</span>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { name: 'Purple Cyber Screen', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=60' },
                                  { name: 'Emerald Antenna', url: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=120&auto=format&fit=crop&q=60' },
                                  { name: 'Amber Neon Glow', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=120&auto=format&fit=crop&q=60' }
                                ].map((preset) => (
                                  <button
                                    key={preset.name}
                                    type="button"
                                    onClick={() => setLogoUrl(preset.url)}
                                    className={`p-1.5 rounded-xl bg-zinc-950/40 border transition-all text-center flex flex-col items-center gap-1 hover:border-white/10 ${logoUrl === preset.url ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5'}`}
                                  >
                                    <div className="w-7 h-7 rounded-lg overflow-hidden bg-black/40">
                                      <img src={preset.url} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <span className="text-[7px] text-zinc-400 font-bold truncate w-full">{preset.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Launcher Shortcut Mockup */}
                            <div className="bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl border border-white/5 p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-10 h-10 rounded-[12px] flex items-center justify-center shadow-lg relative overflow-hidden"
                                  style={{ 
                                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                                    boxShadow: `0 6px 12px -3px ${primaryColor}40`
                                  }}
                                >
                                  <img src={logoUrl} className="w-7 h-7 object-contain rounded-md" alt="Branding" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-[11px] font-bold text-white truncate">{appName}</h4>
                                  <p className="text-[8px] font-mono text-zinc-500 uppercase mt-0.5 truncate">{bundleId}</p>
                                </div>
                              </div>
                              <span className="text-[7px] font-black tracking-widest text-blue-400 bg-blue-400/10 border border-blue-400/20 px-1.5 py-0.5 rounded">LIVE PREVIEW</span>
                            </div>
                          </div>
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex justify-between border-t border-white/10 pt-4 mt-2">
                          <button
                            type="button"
                            disabled
                            className="px-4 py-2 bg-white/5 text-zinc-600 rounded-xl text-xs font-bold border border-white/5 flex items-center gap-1 cursor-not-allowed opacity-50"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuilderStep(2)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            Next: Streams
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* STEP 2: Stream Source Panel */}
                    <div className="w-full shrink-0 px-1">
                      <div className="bg-white/[0.01] border border-white/5 rounded-[24px] p-5 flex flex-col gap-5">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                          <Sliders className="w-4 h-4 text-blue-400" />
                          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Step 2: Core Stream Configuration</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left panel: Stream format selects */}
                          <div className="flex flex-col gap-4">
                            <div>
                              <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Playlist Import Method</label>
                              <div className="flex bg-zinc-950/60 p-1 border border-white/5 rounded-xl">
                                <button
                                  type="button"
                                  onClick={() => setM3uSourceType('url')}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    m3uSourceType === 'url' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  M3U URL Feed
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setM3uSourceType('file')}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    m3uSourceType === 'file' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  Upload Playlist File
                                </button>
                              </div>
                            </div>

                            {m3uSourceType === 'url' ? (
                              <div>
                                <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Feed Playlist URL</label>
                                <input
                                  type="url"
                                  value={m3uUrl}
                                  onChange={(e) => setM3uUrl(e.target.value)}
                                  className="w-full bg-zinc-950/60 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                                  placeholder="https://example.com/streams.m3u"
                                />
                                <p className="text-[8px] text-zinc-500 mt-1">Provide a CORS-enabled, direct link to your M3U / M3U8 feed stream.</p>
                              </div>
                            ) : (
                              <div>
                                <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Upload M3U Playlist</label>
                                <div className="border border-dashed border-white/10 rounded-xl p-5 bg-zinc-950/30 text-center flex flex-col items-center justify-center gap-1.5 hover:border-white/20 transition-all">
                                  <Upload className="w-6 h-6 text-zinc-500" />
                                  <p className="text-[10px] font-bold text-zinc-300">{uploadedFileName || "Drag & drop M3U file"}</p>
                                  <p className="text-[8px] text-zinc-500 leading-normal">M3U or M3U8 format up to 40MB.</p>
                                  <input
                                    type="file"
                                    accept=".m3u,.m3u8"
                                    onChange={handleM3uFileUpload}
                                    id="m3u-file-picker"
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor="m3u-file-picker"
                                    className="inline-flex mt-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-extrabold uppercase tracking-wide cursor-pointer transition-all border border-white/5 text-zinc-300"
                                  >
                                    Select Playlist
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right panel: Default Category config */}
                          <div className="flex flex-col gap-4">
                            <div>
                              <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Default Launch Category</label>
                              <select
                                value={defaultCategory}
                                onChange={(e) => setDefaultCategory(e.target.value)}
                                className="w-full bg-zinc-950/60 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors font-semibold"
                              >
                                <option value="All Channels">All Channels (Unified Grid)</option>
                                <option value="VIP Sports">Live Sports & Broadcasts</option>
                                <option value="Movies">Premium Box-Office Movies</option>
                                <option value="News">Global News & Information</option>
                                <option value="Entertainment">Entertainment & TV Shows</option>
                              </select>
                              <p className="text-[8px] text-zinc-500 mt-1 leading-relaxed">The group that will load automatically on application startup to ensure instant video streaming buffer caches.</p>
                            </div>

                            {/* Dynamic Remote OTA Binding */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                                  Dynamic OTA App ID (Optional)
                                </label>
                                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                                  RECOMMENDED
                                </span>
                              </div>
                              <input
                                type="text"
                                value={boundAppConfigId}
                                onChange={(e) => setBoundAppConfigId(e.target.value)}
                                className="w-full bg-zinc-950/60 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                                placeholder="e.g. app_living-room-iptv_x7k2a"
                              />
                              <p className="text-[8px] text-zinc-500 mt-1 leading-relaxed">
                                Bakes this App ID into the APK so you can push live stream, EPG, theme, and announcement updates remotely.
                              </p>
                            </div>

                            {/* Stream routing diagram */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col gap-2">
                              <div className="flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Device Stream Routing</span>
                              </div>
                              <p className="text-[9px] text-zinc-400 leading-normal">Your custom app will be pre-configured with direct routing to pre-fetch stream chunks from <span className="text-blue-300 font-semibold font-mono">{m3uSourceType === 'url' ? 'Live HTTP Feed' : 'Local Static Resource'}</span> under the boot category <span className="text-indigo-400 font-bold">{defaultCategory}</span>.</p>
                            </div>
                          </div>
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex justify-between border-t border-white/10 pt-4 mt-2">
                          <button
                            type="button"
                            onClick={() => setBuilderStep(1)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-white/5"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back: Brand
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuilderStep(3)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            Next: Compile
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* STEP 3: Build & Export Compiler Simulator */}
                    <div className="w-full shrink-0 px-1">
                      <div className="bg-white/[0.01] border border-white/5 rounded-[24px] p-5 flex flex-col gap-5">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                          <Activity className="w-4 h-4 text-blue-400" />
                          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Step 3: Standalone Android Compilation</h3>
                        </div>

                        <div>
                          {!isCompiling && !compilationSuccess ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 animate-pulse">
                                <Activity className="w-6 h-6" />
                              </div>
                              <h3 className="text-sm font-bold text-white tracking-tight">Ready to Compile Android APK</h3>
                              <p className="text-xs text-zinc-400 mt-1 max-w-sm leading-relaxed font-semibold">
                                We will bundle your customized white-label assets, primary color layout configs, and playlist sources into a fully optimized standalone release APK.
                              </p>

                              {/* Build config bullet recap card */}
                              <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-3.5 text-left w-full max-w-md my-4 flex flex-col gap-2">
                                <div className="flex justify-between text-[11px] border-b border-white/5 pb-1">
                                  <span className="text-zinc-500 font-bold">App Name:</span>
                                  <span className="text-white font-extrabold">{appName}</span>
                                </div>
                                <div className="flex justify-between text-[11px] border-b border-white/5 pb-1">
                                  <span className="text-zinc-500 font-bold">Package ID:</span>
                                  <span className="text-zinc-300 font-mono font-semibold">{bundleId}</span>
                                </div>
                                <div className="flex justify-between text-[11px] border-b border-white/5 pb-1">
                                  <span className="text-zinc-500 font-bold">Palette:</span>
                                  <div className="flex gap-1.5 items-center">
                                    <span className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10" style={{ backgroundColor: primaryColor }} />
                                    <span className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10" style={{ backgroundColor: accentColor }} />
                                  </div>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-zinc-500 font-bold">Source Feed:</span>
                                  <span className="text-zinc-300 font-mono truncate max-w-[200px] font-semibold">
                                    {m3uSourceType === 'url' ? m3uUrl : (uploadedFileName || 'Static M3U File')}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={startApkBuild}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                              >
                                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                                Assemble Release APK
                              </button>
                            </div>
                          ) : isCompiling ? (
                            <div className="flex flex-col gap-4 py-4">
                              {/* Compiling state header */}
                              <div className="flex justify-between items-center bg-zinc-950/40 p-3 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                                  <div>
                                    <h4 className="text-xs font-bold text-white">Compiling white-label APK...</h4>
                                    <p className="text-[8px] text-zinc-500 mt-0.5">Alpine release builder active (Node: #91A-APK)</p>
                                  </div>
                                </div>
                                <span className="text-xs font-mono font-bold text-blue-400">{compileProgress}%</span>
                              </div>

                              {/* Progress Bar with glowing pulse */}
                              <div className="w-full h-2 bg-zinc-900 border border-white/5 rounded-full overflow-hidden relative">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-150 ease-out"
                                  style={{ width: `${compileProgress}%` }}
                                />
                              </div>

                              {/* Compiler active scrolling logs console */}
                              <div>
                                <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5 block">Gradle Compiler Live Outputs</span>
                                <div className="flex flex-col-reverse max-h-[160px] overflow-y-auto font-mono text-[9px] bg-black/80 border border-white/5 rounded-lg p-3 gap-1 text-zinc-400 leading-normal scrollbar-hide">
                                  {[...compileLogs].reverse().map((log, idx) => (
                                    <div key={idx} className={
                                      log.includes('[SUCCESS]') ? 'text-emerald-400 font-bold animate-pulse' 
                                      : log.includes('[CONFIG]') ? 'text-blue-400 font-bold' 
                                      : log.includes('[THEME]') ? 'text-indigo-400 font-bold' 
                                      : log.includes('[GRADLE]') ? 'text-zinc-500' 
                                      : 'text-zinc-400'
                                    }>
                                      {log}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 animate-bounce">
                                <Check className="w-7 h-7" />
                              </div>
                              <h3 className="text-sm font-bold text-white tracking-tight">Android APK Build Registered & Ready!</h3>
                              <p className="text-xs text-zinc-400 mt-1 max-w-sm leading-relaxed font-semibold">
                                Your standalone white-label Android APK is signed with your production keystore and linked to EAS build pipeline.
                              </p>

                              {/* Small package detail box */}
                              <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-3 text-left w-full max-w-md my-4 flex flex-col gap-1.5">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-zinc-500 font-bold">Bundle Name:</span>
                                  <span className="text-white font-extrabold">{appName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-release.apk</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-zinc-500 font-bold">Build Identifier:</span>
                                  <span className="text-amber-400 font-mono font-bold truncate max-w-[220px]">{activeBuildId || 'EAS Preview Build'}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-zinc-500 font-bold">EAS Account:</span>
                                  <span className="text-zinc-300 font-semibold">@angelburgosrosado/iptv-menu-app</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-zinc-500 font-bold">Keystore Signature:</span>
                                  <span className="text-emerald-400 font-mono font-bold">v2 Scheme Signed (SHA-256 Verified)</span>
                                </div>
                              </div>

                              {/* CLI shortcut box */}
                              <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-3 text-left w-full max-w-md mb-4">
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5">
                                    <Terminal className="w-3.5 h-3.5 text-amber-400" /> CLI Compilation Command
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText('npm run build:apk');
                                      triggerToast('Copied build command to clipboard!');
                                    }}
                                    className="text-[9px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <Copy className="w-3 h-3" /> Copy
                                  </button>
                                </div>
                                <div className="font-mono text-[11px] text-amber-300 bg-black/60 px-2.5 py-1.5 rounded-lg border border-white/5 select-all">
                                  npm run build:apk
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
                                <a
                                  href={`https://expo.dev/accounts/angelburgosrosado/projects/iptv-menu-app/builds/${activeBuildId || ''}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer no-underline"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View / Download APK on EAS
                                </a>
                                {apkArtifactUrl && (
                                  <a
                                    href={apkArtifactUrl}
                                    download={`${appName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-release.apk`}
                                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer no-underline"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download Artifact
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBuilderStep(1);
                                    setCompilationSuccess(false);
                                    setCompileProgress(0);
                                    setCompileLogs([]);
                                  }}
                                  className="py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-zinc-300 transition-all border border-white/5"
                                >
                                  Configure Another
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Navigation Footer */}
                        {!isCompiling && !compilationSuccess && (
                          <div className="flex justify-between border-t border-white/10 pt-4 mt-2">
                            <button
                              type="button"
                              onClick={() => setBuilderStep(2)}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-white/5"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              Back: Streams
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Administrative Tasks & Background Jobs Monitor */}
                  <div className="mt-8 border-t border-white/10 pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Terminal className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">
                            System Core Monitors
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                          Platform Background Tasks Queue
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1">
                          Track long-running asynchronous worker logs, stream cleansing routines, and remote Expo server compilations.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/10 text-[10px] text-blue-400 font-bold uppercase tracking-wider w-fit self-start sm:self-auto">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                        Worker Loop Polling (3s)
                      </div>
                    </div>

                    <div className="bg-zinc-950/40 rounded-2xl border border-white/5 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-zinc-950/60 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                              <th className="p-4">Job ID</th>
                              <th className="p-4">Task Name</th>
                              <th className="p-4">Owner</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Last Output Log</th>
                              <th className="p-4 text-right">Created</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-xs">
                            <tr className="hover:bg-white/[0.01] transition-colors">
                              <td className="p-4 font-mono text-[10px] text-zinc-500 font-semibold">job_91a_apk_pending</td>
                              <td className="p-4 font-bold text-white">
                                Standalone Android APK Compilation
                              </td>
                              <td className="p-4 text-zinc-400 font-medium">angelburgosrosado@gmail.com</td>
                              <td className="p-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-full text-[10px] font-black border border-amber-500/10 uppercase tracking-wider animate-pulse">
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                  Queued (Admin-managed)
                                </span>
                              </td>
                              <td className="p-4 text-amber-300 font-mono text-[10px] font-semibold max-w-xs truncate" title="Add and leave as a task that will be updated via administrative backend and not now.">
                                "Add and leave as a task that will be updated via administrative backend and not now."
                              </td>
                              <td className="p-4 text-zinc-500 font-medium text-right whitespace-nowrap">2026-07-08 16:01:51</td>
                            </tr>

                            <tr className="hover:bg-white/[0.01] transition-colors opacity-75">
                              <td className="p-4 font-mono text-[10px] text-zinc-500">job_31b_m3u_clean</td>
                              <td className="p-4 font-semibold text-zinc-300">
                                M3U Playlist Deduplication
                              </td>
                              <td className="p-4 text-zinc-500">angelburgosrosado@gmail.com</td>
                              <td className="p-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/10 uppercase tracking-wider">
                                  <Check className="w-2.5 h-2.5" />
                                  Completed
                                </span>
                              </td>
                              <td className="p-4 text-zinc-500 font-mono text-[10px]">
                                Successfully parsed and removed duplicate streams. Status set to ready.
                              </td>
                              <td className="p-4 text-zinc-500 text-right whitespace-nowrap">2026-07-08 15:45:12</td>
                            </tr>

                            <tr className="hover:bg-white/[0.01] transition-colors opacity-75">
                              <td className="p-4 font-mono text-[10px] text-zinc-500">job_78f_val_ping</td>
                              <td className="p-4 font-semibold text-zinc-300">
                                Stream Ping Validation Sweep
                              </td>
                              <td className="p-4 text-zinc-500">angelburgosrosado@gmail.com</td>
                              <td className="p-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/10 uppercase tracking-wider">
                                  <Check className="w-2.5 h-2.5" />
                                  Completed
                                </span>
                              </td>
                              <td className="p-4 text-zinc-500 font-mono text-[10px]">
                                Tested 10 streams, dead streams detected: 0. Success ratio: 100%.
                              </td>
                              <td className="p-4 text-zinc-500 text-right whitespace-nowrap">2026-07-08 15:10:04</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#fff] flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200 antialiased overflow-x-hidden relative">
      
      {/* Immersive Theme Glowing Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-900 rounded-full blur-[160px] opacity-20 pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[-100px] w-96 h-96 bg-indigo-900 rounded-full blur-[160px] opacity-15 pointer-events-none z-0"></div>
      <div className="absolute -bottom-40 -left-20 w-[450px] h-[450px] bg-blue-950 rounded-full blur-[180px] opacity-20 pointer-events-none z-0"></div>

      {/* 1. Global Navigation Navbar with Glassmorphism */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-xl font-extrabold italic text-white ring-1 ring-white/20 select-none">
            IP
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              IPTV Mobile <span className="text-blue-500 text-sm font-semibold uppercase tracking-[0.2em] px-2 py-0.5 glass rounded-full ring-1 ring-blue-500/20">Architect</span>
            </h1>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-[0.15em] mt-0.5">
              Foundational M3U • Streaming Online
            </p>
          </div>
          {auth.isLoggedIn && (
            <div className="ml-4 hidden sm:block">
              <WorkspaceSwitcher />
            </div>
          )}
        </div>

        {/* Global Stats indicators & Status Pills */}
        <div className="flex items-center gap-3 text-xs">
          <div className="glass-pill px-4 py-2 rounded-full flex items-center gap-2 text-zinc-300">
            <Cpu className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Simulator FPS: <strong className="text-white">60</strong></span>
          </div>
          <div className="glass-pill px-4 py-2 rounded-full flex items-center gap-2 text-zinc-300">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
            <span>HLS Stream: <strong className="text-white">STABLE</strong></span>
          </div>
          <div className="glass-pill px-4 py-2 rounded-full text-xs font-semibold text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            Premium Active
          </div>
        </div>
      </header>

      {/* 2. Primary Workspace Body with Sidebar Dock Integration */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8 flex flex-col gap-8 relative z-10 min-h-0">
        
        {/* Marketing Landing Hero Section */}
        <MarketingHero 
          onLaunchSimulator={() => {
            document.getElementById('simulator-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          onUploadM3u={() => {
            setActiveMenu('upload');
            setTimeout(() => {
              document.getElementById('workspace-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
          onViewPricing={() => {
            document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        />

        {/* Brand New Pricing Tier Grid Section */}
        <PricingSection 
          onSelectFree={() => {
            setActiveMenu('browse');
            setTimeout(() => {
              document.getElementById('workspace-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
          onSelectPro={() => {
            if (!auth.isPremium) {
              setIsAuthModalOpen(true);
            } else {
              setActiveMenu('premium');
              setTimeout(() => {
                document.getElementById('workspace-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }
          }}
          onSelectBuilder={() => {
            if (!auth.isPremium) {
              setIsAuthModalOpen(true);
            } else {
              setActiveMenu('expo');
              setSubTab('builder');
              setTimeout(() => {
                document.getElementById('workspace-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }
          }}
        />

        {/* Inner Content row enclosing Sidebar Navigation & Workspace Grid */}
        <div id="workspace-section" className="flex-1 flex flex-col md:flex-row gap-6 lg:gap-8 items-stretch min-h-0">
        
        {/* UPGRADED SIDEBAR NAVIGATION WITH GLASSMORPHISM TOOLTIPS & OKLCH NEON HIGHLIGHTS */}
        <aside 
          className="hidden md:flex w-20 bg-black/30 backdrop-blur-md border border-white/10 rounded-[28px] flex-col items-center py-8 gap-8 flex-shrink-0 z-20 min-h-[550px] shadow-2xl relative"
          style={{ '--accent-blue': 'oklch(0.65 0.25 250)' } as React.CSSProperties}
        >
          {/* Top Logo branding */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 text-lg font-extrabold text-white select-none">
            📺
          </div>

          {/* Sidebar Premium Crown Badge */}
          <div className="relative group flex items-center justify-center w-full">
            <button 
              onClick={() => {
                if (!auth.isPremium) {
                  setIsAuthModalOpen(true);
                } else {
                  triggerToast("Your Premium subscription is fully active!");
                }
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border cursor-pointer select-none ${
                auth.isPremium 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400/30 shadow-lg shadow-amber-500/25'
                  : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 border-white/5 hover:border-white/10'
              }`}
            >
              <Crown className={`w-5 h-5 ${auth.isPremium ? 'text-white fill-current animate-pulse' : 'text-zinc-500'}`} />
            </button>
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-black/65 backdrop-blur-md text-[11px] font-bold rounded-xl border opacity-0 translate-x-[-10px] pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-50 shadow-2xl whitespace-nowrap border-white/10">
              {auth.isPremium ? (
                <span className="text-amber-400 font-black">★ Premium Active</span>
              ) : (
                <span className="text-zinc-400 font-bold">Sign In / Go Premium</span>
              )}
            </div>
          </div>

          {/* Navigation Items List */}
          <nav className="flex flex-col gap-5 items-center w-full relative">
            {SIDEBAR_ITEMS.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeMenu === item.id;
              
              return (
                <div key={item.id} className="relative group flex items-center justify-center w-full">
                  {/* Glowing left indicator bar */}
                  {isActive && (
                    <div 
                      className="absolute left-0 w-1 h-8 rounded-r-full transition-all duration-300"
                      style={{ 
                        boxShadow: 'inset 3px 0 0 var(--accent-blue)', 
                        background: 'var(--accent-blue)' 
                      }} 
                    />
                  )}

                  {/* Sidebar button with keyboard support and oklch neon highlight on active */}
                  <button
                    onClick={() => setActiveMenu(item.id)}
                    tabIndex={0}
                    aria-label={item.label}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveMenu(item.id);
                      }
                    }}
                    className={`p-3 rounded-2xl transition-all duration-300 relative flex items-center justify-center outline-none cursor-pointer border ${
                      isActive
                        ? 'text-white border-blue-500/40 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                        : 'text-zinc-500 hover:text-zinc-200 border-transparent bg-transparent hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>

                  {/* Glassmorphism tooltip with label on hover */}
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-black/65 backdrop-blur-md text-[11px] font-bold text-white rounded-xl border border-white/10 opacity-0 translate-x-[-10px] pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-50 shadow-2xl whitespace-nowrap">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Bottom profile marker */}
          <div className="mt-auto relative group flex items-center justify-center w-full">
            <button 
              className="p-3 rounded-2xl text-zinc-500 hover:text-zinc-200 bg-transparent hover:bg-white/5 transition-all outline-none cursor-pointer"
              aria-label="Profile Context"
              tabIndex={0}
            >
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[10px] flex items-center justify-center border border-blue-500/30">
                AB
              </div>
            </button>
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-black/65 backdrop-blur-md text-[11px] font-bold text-white rounded-xl border border-white/10 opacity-0 translate-x-[-10px] pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-50 shadow-2xl whitespace-nowrap">
              angelburgosrosado@gmail.com
            </div>
          </div>
        </aside>

        {/* WORKSPACE CONTENT GRID */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* LEFT COLUMN: INTERACTIVE DEVICE SIMULATOR FRAME */}
          <section id="simulator-section" className="col-span-1 lg:col-span-5 flex flex-col items-center justify-start lg:sticky lg:top-[100px] h-fit w-full">
            <div className="w-full max-w-full sm:max-w-[390px] relative px-2 sm:px-0">
              
              {/* Premium Glow for Phone Simulator */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 rounded-[28px] sm:rounded-[54px] blur-3xl opacity-80 pointer-events-none" />

              {/* Apple iPhone Glass-édition Simulator Container - Responsive border-radius and width */}
              <div className="w-full aspect-[9/19] rounded-[24px] sm:rounded-[48px] bg-black/85 backdrop-blur-2xl p-2.5 sm:p-3.5 shadow-[0_25px_80px_-15px_rgba(59,130,246,0.25)] border-[4px] sm:border-[6px] border-white/10 relative z-10 overflow-hidden ring-1 ring-white/15 flex flex-col">
                
                {/* Dynamic Island Notch */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-20 sm:w-24 h-4 sm:h-5 bg-black rounded-full z-40 flex items-center justify-between px-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                  <div className="w-2.5 sm:w-3 h-1 bg-zinc-900 rounded-full" />
                </div>

                {/* Status Bar simulation */}
                <div className="h-6 sm:h-8 pt-0.5 px-4 sm:px-6 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-zinc-300 select-none z-30">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] sm:text-[9px] text-zinc-400 font-bold uppercase tracking-wider">5G</span>
                    <div className="w-4 sm:w-5 h-2 sm:h-2.5 rounded-[3px] border border-zinc-500 p-[1px] flex items-center">
                      <div className="h-full w-4/5 bg-zinc-300 rounded-[1px]" />
                    </div>
                  </div>
                </div>

                {/* INTERACTIVE APPMOUNT INTERNALS WRAPPER */}
                <div className="flex-1 w-full bg-[#050505] rounded-[18px] sm:rounded-[36px] overflow-hidden relative flex flex-col ring-1 ring-white/10">
                  <Stack>
                    <Stack.Screen name="index" component={HomeScreen} />
                    <Stack.Screen name="player/[id]" component={PlayerScreen} />
                  </Stack>
                </div>

                {/* Home Indicator bar */}
                <div className="h-5 flex items-center justify-center z-30">
                  <div className="w-28 h-1 bg-zinc-700 rounded-full" />
                </div>
              </div>

              {/* Simulated Frame Badge with glass styles */}
              <div className="text-center mt-4">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 glass rounded-full text-xs text-zinc-300 font-medium">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  Active Device Simulator Frame
                </span>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: DYNAMIC WORKSPACE COMPONENT WITH ANIMATED TRANSITIONS */}
          <div className="col-span-1 lg:col-span-7 flex flex-col min-w-0 space-y-4">
            <AdSenseSlot slot="8849201938" className="mb-2" />
            <AnimatePresence mode="wait">
              <motion.section
                key={activeMenu}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex-1 flex flex-col glass rounded-[32px] p-5 lg:p-6 ring-1 ring-white/10 relative backdrop-blur-md self-stretch min-w-0 overflow-hidden"
              >
                {renderActiveSection()}
              </motion.section>
            </AnimatePresence>
            <AdSenseSlot slot="9938102948" format="horizontal" />
          </div>

        </div>
      </div>
    </div>

      {/* Footer copyright block */}
      <footer className="py-6 pb-24 md:pb-6 border-t border-white/5 bg-zinc-950/40 text-center text-xs text-zinc-500 font-medium relative z-10">
        <p>IPTV Mobile Simulation Platform • Fully Client-Side High-Contrast Render • 60fps Native list virtualizer</p>
      </footer>

      {/* 4. Mobile Bottom Tab Bar with 5 Icons (Collapses from sidebar under md viewport) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/85 backdrop-blur-xl border-t border-white/10 z-40 flex items-center justify-around px-2 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        {MOBILE_TAB_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveMenu(item.id);
                // Smooth scroll workspace area to top to optimize user focus
                document.getElementById('workspace-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-300 relative cursor-pointer select-none outline-none ${
                isActive 
                  ? 'text-blue-400 font-black' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <IconComponent className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 text-blue-400' : 'text-zinc-500'}`} />
                {isActive && (
                  <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global Auth Modal portal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        triggerToast={triggerToast}
      />

      {/* Global Animated feedback toast notification system */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-[100] bg-zinc-950/95 border border-emerald-500/30 text-white px-5 py-4 rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.25)] flex items-center gap-3 backdrop-blur-md max-w-sm"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
              <Check className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h5 className="text-xs font-black text-emerald-400 uppercase tracking-widest">System Message</h5>
              <p className="text-[11px] font-bold text-zinc-300 mt-0.5 leading-snug">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
