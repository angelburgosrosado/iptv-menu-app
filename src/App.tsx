/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import {
  Code2,
  Check,
  Sparkles,
  Tv,
  Heart,
  CalendarRange,
  UploadCloud,
  Settings,
  Crown,
  LayoutGrid,
  Server,
  User,
  LogIn,
  LogOut,
  Maximize2,
  Film,
  Clapperboard,
  Home,
  Search,
  PlayCircle,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import DesktopHome from './components/DesktopHome';
import DesktopChannels from './components/DesktopChannels';
import DesktopFavorites from './components/DesktopFavorites';
import DesktopEpg from './components/DesktopEpg';
import DesktopM3uUpload from './components/DesktopM3uUpload';
import DesktopSettings from './components/DesktopSettings';
import DesktopPremium from './components/DesktopPremium';
import UserProfileModal from './components/UserProfileModal';
import OnboardingModal from './components/OnboardingModal';
import LegalModal, { LegalTab } from './components/LegalModal';
import XtreamConnector from './components/XtreamConnector';
import MultiScreenMatrix from './components/MultiScreenMatrix';
import AuthModal from './components/AuthModal';
import { DvrModal } from './components/DvrModal';
import WorkspaceSwitcher from './components/WorkspaceSwitcher';
import FloatingPiPPlayer from './components/FloatingPiPPlayer';
import WebCinemaPlayer from './components/WebCinemaPlayer';
import PhoneSimulatorModal from './components/PhoneSimulatorModal';
import TvPairingModal from './components/TvPairingModal';

const BuilderPage = React.lazy(() => import('./pages/BuilderPage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));

import { Channel } from './types/iptv';
import { usePlayerStore } from './store/usePlayerStore';
import { useAuth, authStore } from './authStore';
import { fetchWithAuth } from './lib/apiClient';
import { useSpatialNavigation } from './hooks/useSpatialNavigation';
import './styles/tvNavigation.css';

export default function App() {
  const auth = useAuth();
  const { tvNavigation } = useSpatialNavigation();

  // URL Path Routing State
  const getInitialRoute = (): 'watch' | 'builder' | 'pricing' | 'admin' => {
    if (typeof window === 'undefined') return 'watch';
    const path = window.location.pathname.toLowerCase();
    if (path === '/builder' || path === '/studio') return 'builder';
    if (path === '/pricing') return 'pricing';
    if (path === '/admin') return 'admin';
    return 'watch';
  };

  const [currentRoute, setCurrentRoute] = React.useState<'watch' | 'builder' | 'pricing' | 'admin'>(getInitialRoute);

  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    const normalized = path.replace('/', '').toLowerCase();
    if (normalized === 'builder' || normalized === 'studio') setCurrentRoute('builder');
    else if (normalized === 'pricing') setCurrentRoute('pricing');
    else if (normalized === 'admin') setCurrentRoute('admin');
    else setCurrentRoute('watch');
  };

  React.useEffect(() => {
    const onPopState = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [isDvrModalOpen, setIsDvrModalOpen] = React.useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = React.useState(false);
  const [isTvPairingOpen, setIsTvPairingOpen] = React.useState(false);
  const [pairingParamCode, setPairingParamCode] = React.useState('');
  const [legalModalState, setLegalModalState] = React.useState<{ isOpen: boolean; tab: LegalTab }>({
    isOpen: false,
    tab: 'privacy'
  });
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [globalCinemaChannel, setGlobalCinemaChannel] = React.useState<Channel | null>(null);

  // Default directly to 'home' matching the wireframe architecture
  const [activeMenu, setActiveMenu] = React.useState<string>('home');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const { sleepTimer, tickSleepTimer, channels, hydrateSavedXtreamSession, searchTerm, setSearchTerm } = usePlayerStore();

  React.useEffect(() => {
    if (channels.length === 0 && hydrateSavedXtreamSession) {
      hydrateSavedXtreamSession();
    }
  }, [channels.length, hydrateSavedXtreamSession]);

  React.useEffect(() => {
    if (!sleepTimer.isActive) return;
    const interval = setInterval(() => {
      tickSleepTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimer.isActive, tickSleepTimer]);

  // Stripe Checkout Redirect & Session Refresh Handler + TV Pairing Link Handler
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const pairCode = params.get('code') || params.get('pair');
        if (pairCode) {
          setPairingParamCode(pairCode);
          setIsTvPairingOpen(true);
        }
        if (params.get('checkout') === 'success') {
          authStore.setState({ isPremium: true, role: 'pro' });
          triggerToast('🎉 Payment successful! Pro capabilities are now activated.');
          window.history.replaceState({}, document.title, window.location.pathname);
          fetchWithAuth('/api/me').then((profile) => {
            if (profile?.role) {
              authStore.setState({
                role: profile.role,
                isPremium: profile.role !== 'user' || profile.subscriptionTier !== 'free'
              });
            }
          }).catch(() => null);
        } else if (params.get('checkout') === 'cancel') {
          triggerToast('Checkout was cancelled. No charges were made.');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Navigation matching wireframe: Search, Home, Live TV, VOD, Series, Recordings, Settings, Profile
  const SIDEBAR_ITEMS = [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'home', label: 'Home', icon: Home },
    { id: 'channels', label: 'Live TV', icon: Tv },
    { id: 'vod', label: 'VOD', icon: PlayCircle },
    { id: 'series', label: 'Series', icon: Clapperboard },
    { id: 'recordings', label: 'Recordings', icon: Video },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const MOBILE_TAB_ITEMS = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'channels', label: 'Live TV', icon: Tv },
    { id: 'vod', label: 'VOD', icon: PlayCircle },
    { id: 'series', label: 'Series', icon: Clapperboard },
    { id: 'recordings', label: 'Recordings', icon: Video },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderActiveSection = () => {
    switch (activeMenu) {
      case 'home':
        return (
          <DesktopHome 
            onSelectChannel={(ch) => setGlobalCinemaChannel(ch)} 
            onNavigateTab={(tab) => {
              if (tab === 'recordings') setIsDvrModalOpen(true);
              else setActiveMenu(tab);
            }} 
          />
        );
      case 'channels':
        return <DesktopChannels initialStreamType="live" onSwitchToMultiScreen={() => setActiveMenu('multiscreen')} onNavigateTab={(tab) => setActiveMenu(tab)} />;
      case 'vod':
        return <DesktopChannels initialStreamType="vod" onSwitchToMultiScreen={() => setActiveMenu('multiscreen')} onNavigateTab={(tab) => setActiveMenu(tab)} />;
      case 'series':
        return <DesktopChannels initialStreamType="series" onSwitchToMultiScreen={() => setActiveMenu('multiscreen')} onNavigateTab={(tab) => setActiveMenu(tab)} />;
      case 'multiscreen':
        return <MultiScreenMatrix />;
      case 'favorites':
        return <DesktopFavorites />;
      case 'epg':
        return <DesktopEpg />;
      case 'xtream':
        return <XtreamConnector onNavigateTab={(tab) => setActiveMenu(tab)} />;
      case 'upload':
        return <DesktopM3uUpload />;
      case 'settings':
        return <DesktopSettings />;
      case 'premium':
        return <DesktopPremium onTriggerAuth={() => setIsAuthModalOpen(true)} />;
      default:
        return (
          <DesktopHome 
            onSelectChannel={(ch) => setGlobalCinemaChannel(ch)} 
            onNavigateTab={(tab) => {
              if (tab === 'recordings') setIsDvrModalOpen(true);
              else setActiveMenu(tab);
            }} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#fff] flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200 antialiased overflow-x-hidden relative">
      
      {/* Background Ambient Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-900 rounded-full blur-[160px] opacity-20 pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[-100px] w-96 h-96 bg-indigo-900 rounded-full blur-[160px] opacity-15 pointer-events-none z-0" />
      <div className="absolute -bottom-40 -left-20 w-[450px] h-[450px] bg-blue-950 rounded-full blur-[180px] opacity-20 pointer-events-none z-0" />

      {/* 1. Global Navigation Navbar */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 text-lg font-black italic text-white ring-1 ring-white/20 select-none group-hover:scale-105 transition-transform">
              IP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">IPTV.MENU</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Universal Web & TV Player</p>
            </div>
          </button>

          {currentRoute !== 'watch' && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/25 hover:bg-blue-500 transition-all cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Return to Watch TV</span>
            </button>
          )}

          {auth.isLoggedIn && (
            <div className="hidden lg:block">
              <WorkspaceSwitcher />
            </div>
          )}
        </div>

        {/* Center/Left Search Pill matching wireframe */}
        <div className="flex-1 max-w-lg mx-2 hidden sm:flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="global-header-search"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (activeMenu !== 'home' && activeMenu !== 'channels') {
                  setActiveMenu('channels');
                }
              }}
              placeholder="Search Movies, Shows, Channels..."
              className="w-full bg-zinc-900/90 border border-white/10 focus:border-blue-500/60 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/20"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Toolbar: Studio, TV Pairing, Settings, and User Auth */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* Quick Settings Shortcut matching wireframe */}
          <button
            onClick={() => setActiveMenu('settings')}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              activeMenu === 'settings'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/30'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
            }`}
            title="Open Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          {/* App Studio Quick Link */}
          <button
            onClick={() => navigate(currentRoute === 'builder' ? '/' : '/builder')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              currentRoute === 'builder'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
            }`}
            title="Open React Native App Studio & APK Compiler"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>App Studio</span>
          </button>

          {/* Quick TV Device Pairing Button */}
          <button
            onClick={() => setIsTvPairingOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Pair Apple TV, Android TV, or Fire TV"
          >
            <Tv className="w-3.5 h-3.5 text-sky-400" />
            <span>Pair TV</span>
          </button>

          {/* Root Admin Shortcut */}
          {auth.role === 'admin' && (
            <button
              onClick={() => navigate(currentRoute === 'admin' ? '/' : '/admin')}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                currentRoute === 'admin'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/25'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
              }`}
            >
              <span>Admin</span>
            </button>
          )}
          {auth.isLoggedIn ? (
            <div className="flex items-center gap-2.5 bg-zinc-900/90 border border-white/10 rounded-full pl-2 pr-3 py-1.5 shadow-lg shadow-black/40 backdrop-blur-md">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 cursor-pointer outline-none"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs ring-1 ring-white/20 shadow-md">
                  {auth.email ? auth.email.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-white text-xs max-w-[150px] truncate">
                    {auth.email}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-bold">
                    {auth.role === 'admin' ? 'Root Admin' : 'Member'}
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  authStore.logout();
                  triggerToast('Logged out successfully');
                }}
                className="ml-1 p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-full shadow-lg shadow-blue-500/20 border border-blue-400/30 text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. PAGE ROUTING RENDERER */}
      {currentRoute === 'builder' ? (
        <React.Suspense fallback={
          <div className="flex-1 w-full flex items-center justify-center p-12">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <BuilderPage onBackToPlayer={() => navigate('/')} />
        </React.Suspense>
      ) : currentRoute === 'pricing' ? (
        <React.Suspense fallback={
          <div className="flex-1 w-full flex items-center justify-center p-12">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <PricingPage
            onBackToPlayer={() => navigate('/')}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        </React.Suspense>
      ) : currentRoute === 'admin' ? (
        <React.Suspense fallback={
          <div className="flex-1 w-full flex items-center justify-center p-12">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <AdminPage
            onBackToPlayer={() => navigate('/')}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        </React.Suspense>
      ) : (
        /* PRIMARY FULL-WIDTH WATCH TV EXPERIENCE */
          <div className="flex-1 w-full max-w-[1700px] mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8 flex flex-col gap-6 relative z-10 min-h-0">
          <div id="workspace-section" className="flex-1 flex flex-col md:flex-row gap-6 lg:gap-8 items-stretch min-h-0">
            
            {/* Left Sidebar Navigation matching wireframe */}
            <aside 
              className="hidden md:flex w-24 bg-black/50 backdrop-blur-xl border border-white/10 rounded-[28px] flex-col items-center py-5 gap-3 flex-shrink-0 z-20 min-h-[600px] shadow-2xl relative"
            >
              {/* Top (Logo/App Name) */}
              <button
                onClick={() => setActiveMenu('home')}
                className="flex flex-col items-center gap-1 group cursor-pointer mb-2"
                title="IPTV.MENU"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 text-base font-extrabold text-white select-none group-hover:scale-105 transition-transform">
                  IP
                </div>
                <span className="text-[10px] font-black tracking-tight text-zinc-400 group-hover:text-white transition-colors">
                  IPTV.MENU
                </span>
              </button>

              {/* Navigation Items List with stacked icon + label */}
              <nav className="flex flex-col gap-2 items-center w-full px-2 relative">
                {SIDEBAR_ITEMS.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeMenu === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'recordings') {
                          setIsDvrModalOpen(true);
                        } else if (item.id === 'search') {
                          const searchInput = document.getElementById('global-header-search');
                          if (searchInput) searchInput.focus();
                        } else {
                          setActiveMenu(item.id);
                        }
                      }}
                      tabIndex={0}
                      aria-label={item.label}
                      className={`w-full py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 outline-none cursor-pointer border ${
                        isActive
                          ? 'bg-zinc-800/95 text-white border-white/20 shadow-xl shadow-black/50 ring-1 ring-white/10 scale-[1.02]'
                          : 'text-zinc-400 hover:text-white border-transparent bg-transparent hover:bg-white/5'
                      }`}
                    >
                      <IconComponent className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                      <span className={`text-[10px] font-semibold tracking-tight text-center leading-none ${isActive ? 'text-white font-bold' : 'text-zinc-400'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Bottom Profile Button matching wireframe */}
              <div className="mt-auto flex flex-col items-center gap-2 w-full px-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    if (auth.isLoggedIn) {
                      setIsProfileModalOpen(true);
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className={`w-full py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 outline-none cursor-pointer border ${
                    isProfileModalOpen
                      ? 'bg-zinc-800/90 text-white border-white/25 shadow-xl'
                      : 'text-zinc-400 hover:text-white border-transparent bg-transparent hover:bg-white/5'
                  }`}
                  title="Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs ring-1 ring-white/20 shadow-md">
                    {auth.email ? auth.email.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[10px] font-semibold tracking-tight text-center leading-none text-zinc-400">
                    Profile
                  </span>
                </button>
              </div>
            </aside>

            {/* Main Full-Width Content Container */}
            <main className="flex-1 flex flex-col min-w-0">
              {/* Active Tab Screen Content */}
              <div className="flex-1 flex flex-col min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeMenu}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex flex-col glass rounded-[32px] p-5 lg:p-6 border border-white/10 relative backdrop-blur-md min-w-0 overflow-hidden"
                  >
                    {renderActiveSection()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>

          </div>
        </div>
      )}

      {/* Footer copyright block & Compliance Legal Links */}
      <footer className="py-6 pb-24 md:pb-6 border-t border-white/5 bg-[#0e0e10]/90 text-center text-xs text-zinc-500 font-medium relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" />
            <p className="text-zinc-400 font-mono text-[11px]">
              IPTV Menu Pro • High-Performance Multi-Platform Streaming Platform
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono">
            <button
              onClick={() => setLegalModalState({ isOpen: true, tab: 'privacy' })}
              className="text-zinc-400 hover:text-[#00d4ff] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-zinc-700">•</span>
            <button
              onClick={() => setLegalModalState({ isOpen: true, tab: 'terms' })}
              className="text-zinc-400 hover:text-[#00d4ff] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span className="text-zinc-700">•</span>
            <button
              onClick={() => setLegalModalState({ isOpen: true, tab: 'dmca' })}
              className="text-zinc-400 hover:text-[#00d4ff] transition-colors cursor-pointer"
            >
              DMCA Notice
            </button>
            <span className="text-zinc-700">•</span>
            <button
              onClick={() => setIsOnboardingModalOpen(true)}
              className="text-[#00d4ff] hover:underline cursor-pointer"
            >
              Setup Guide
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Tab Bar */}
      {currentRoute === 'watch' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/90 backdrop-blur-xl border-t border-white/10 z-40 flex items-center justify-around px-2 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
          {MOBILE_TAB_ITEMS.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id);
                  document.getElementById('workspace-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 cursor-pointer ${
                  isActive ? 'text-blue-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <IconComponent className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                <span className="text-[9px] uppercase tracking-wider mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Global Modals */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        triggerToast={triggerToast}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenUpgrade={() => {
          setIsProfileModalOpen(false);
          navigate('/pricing');
        }}
        triggerToast={triggerToast}
      />

      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        onComplete={() => {
          setIsOnboardingModalOpen(false);
          setActiveMenu('channels');
        }}
      />

      <LegalModal
        isOpen={legalModalState.isOpen}
        initialTab={legalModalState.tab}
        onClose={() => setLegalModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      <TvPairingModal
        isOpen={isTvPairingOpen}
        onClose={() => setIsTvPairingOpen(false)}
        triggerToast={triggerToast}
        initialCode={pairingParamCode}
      />

      {/* Global DVR Recordings Modal */}
      <DvrModal
        isOpen={isDvrModalOpen}
        onClose={() => setIsDvrModalOpen(false)}
      />

      {/* Global Feedback Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-[100] bg-zinc-950/95 border border-emerald-500/30 text-white px-5 py-4 rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.25)] flex items-center gap-3 backdrop-blur-md max-w-sm"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Notification</h5>
              <p className="text-[11px] font-bold text-zinc-300 mt-0.5 leading-snug">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Picture-in-Picture Mini-Player */}
      <FloatingPiPPlayer onMaximize={(channel) => setGlobalCinemaChannel(channel)} />

      {/* Global Web Cinema Mode Player Overlay */}
      {globalCinemaChannel && (
        <WebCinemaPlayer
          initialChannel={globalCinemaChannel}
          onClose={() => setGlobalCinemaChannel(null)}
          onSwitchToMultiScreen={() => {
            setGlobalCinemaChannel(null);
            setActiveMenu('multiscreen');
          }}
        />
      )}

      {/* Global Interactive Mobile Phone Simulator Modal */}
      {currentRoute !== 'builder' && (
        <PhoneSimulatorModal
          onNavigateToBuilder={() => navigate('/builder')}
          onOpenCinema={(channel) => setGlobalCinemaChannel(channel)}
        />
      )}

      {/* 10-Foot TV Spatial Navigation Indicator */}
      {tvNavigation.isEnabled && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-zinc-950/90 border border-sky-500/40 shadow-2xl backdrop-blur-md text-xs font-semibold text-sky-300">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span>TV Mode Active</span>
          <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">(D-Pad Navigate • Enter Selects)</span>
        </div>
      )}

    </div>
  );
}
