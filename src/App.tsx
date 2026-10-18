/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import {
  Compass,
  Tv,
  Clapperboard,
  PlaySquare,
  Heart,
  CalendarRange,
  Search,
  Settings,
  Server,
  LayoutGrid,
  User,
  LogIn,
  LogOut,
  Sparkles,
  Smartphone,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  Radio,
  Sliders,
  Maximize2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import DesktopHome from './components/DesktopHome';
import DesktopChannels from './components/DesktopChannels';
import DesktopFavorites from './components/DesktopFavorites';
import DesktopEpg from './components/DesktopEpg';
import DesktopM3uUpload from './components/DesktopM3uUpload';
import DesktopSettings from './components/DesktopSettings';
import DesktopPremium from './components/DesktopPremium';
import DesktopDownloads from './components/DesktopDownloads';
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
import BrandMark from './components/BrandMark';
import { SectionErrorBoundary } from './components/ErrorBoundary';
import NetworkResilienceBanner from './components/NetworkResilienceBanner';

const BuilderPage = React.lazy(() => import('./pages/BuilderPage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));

import { Channel } from './types/iptv';
import { usePlayerStore } from './store/usePlayerStore';
import { useAuth, authStore } from './authStore';
import { fetchWithAuth } from './lib/apiClient';
import { useSpatialNavigation } from './hooks/useSpatialNavigation';
import { useXtreamSessionKeeper } from './hooks/useXtreamSessionKeeper';
import './styles/tvNavigation.css';

export default function App() {
  const auth = useAuth();
  const { tvNavigation } = useSpatialNavigation();

  // Collapsible sidebar state (Streamly desktop sidebar)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('streamly_sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('streamly_sidebar_collapsed', String(next));
      return next;
    });
  };

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
    else {
      setCurrentRoute('watch');
      if (normalized === 'download' || normalized === 'downloads') {
        setActiveMenu('downloads');
      }
    }
  };

  React.useEffect(() => {
    const onPopState = () => {
      setCurrentRoute(getInitialRoute());
      const path = window.location.pathname.toLowerCase();
      if (path === '/download' || path === '/downloads') {
        setActiveMenu('downloads');
      }
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

  // Active navigation tab
  const getInitialActiveMenu = (): string => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.toLowerCase();
    if (path === '/download' || path === '/downloads') return 'downloads';
    return 'home';
  };

  const [activeMenu, setActiveMenu] = React.useState<string>(getInitialActiveMenu);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const { sleepTimer, tickSleepTimer, channels, hydrateSavedXtreamSession, searchTerm, setSearchTerm, isConnectedToXtream } = usePlayerStore();
  
  // Background Xtream session keeper & credential health heartbeat
  useXtreamSessionKeeper();

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

  // Global Keyboard shortcuts: ⌘K for search, Esc to close
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchEl = document.getElementById('global-header-search');
        if (searchEl) {
          searchEl.focus();
        }
      }
      if (e.key === 'Escape') {
        if (globalCinemaChannel) {
          setGlobalCinemaChannel(null);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [globalCinemaChannel]);

  // Stripe Checkout & TV Pairing Link Handler
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

  // Primary Navigation list matching Streamly
  const NAV_ITEMS = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'channels', label: 'Live TV', icon: Tv },
    { id: 'vod', label: 'Movies', icon: Clapperboard },
    { id: 'series', label: 'Series', icon: PlaySquare },
    { id: 'epg', label: 'EPG Guide', icon: CalendarRange },
    { id: 'favorites', label: 'My List', icon: Heart },
    { id: 'multiscreen', label: 'Multi-Screen', icon: LayoutGrid },
    { id: 'xtream', label: 'Xtream Codes', icon: Server },
    { id: 'downloads', label: 'Download App', icon: Download },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Mobile Bottom Tab Bar Items
  const MOBILE_TAB_ITEMS = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'channels', label: 'Live', icon: Tv },
    { id: 'vod', label: 'Movies', icon: Clapperboard },
    { id: 'series', label: 'Series', icon: PlaySquare },
    { id: 'downloads', label: 'Get App', icon: Download },
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
        return <DesktopFavorites onSelectChannel={(ch) => setGlobalCinemaChannel(ch)} />;
      case 'epg':
        return <DesktopEpg onSelectChannel={(ch) => setGlobalCinemaChannel(ch)} />;
      case 'xtream':
        return <XtreamConnector onNavigateTab={(tab) => setActiveMenu(tab)} />;
      case 'downloads':
        return <DesktopDownloads />;
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
    <div className="min-h-screen bg-[#06070b] text-[#eef0f6] flex flex-col font-sans selection:bg-[#7c5cff]/30 selection:text-white antialiased overflow-x-hidden relative">
      
      {/* 1. TOPBAR (Streamly TopBar) */}
      <header className="border-b border-[#1f2330] bg-[#06070b]/80 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              navigate('/');
              setActiveMenu('home');
            }}
            className="flex items-center gap-2.5 text-left cursor-pointer group select-none"
          >
            <BrandMark size={9} />
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white leading-none">
                  IPTV.MENU
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#7c5cff]/20 text-[#00e0c6] border border-[#7c5cff]/40">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-[#6b7180] mt-0.5 font-medium leading-none">Self-Hosted IPTV Player</p>
            </div>
          </button>

          {currentRoute !== 'watch' && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7c5cff] to-[#00e0c6] text-white text-xs font-bold shadow-md shadow-[#7c5cff]/25 hover:opacity-90 transition-all cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Back to IPTV.Menu Pro</span>
            </button>
          )}

          {auth.isLoggedIn && (
            <div className="hidden xl:block">
              <WorkspaceSwitcher />
            </div>
          )}
        </div>

        {/* Center Search Bar with ⌘K Indicator */}
        <div className="flex-1 max-w-lg mx-2 hidden sm:flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#6b7180] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              placeholder="Search Movies, Shows, Live Channels..."
              className="w-full bg-[#11141c]/90 border border-[#1f2330] focus:border-[#7c5cff]/70 rounded-full pl-10 pr-16 py-2 text-xs text-white placeholder-[#6b7180] outline-none transition-all focus:ring-2 focus:ring-[#7c5cff]/20"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="pointer-events-auto text-[#6b7180] hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              ) : (
                <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-[#6b7180]">
                  ⌘K
                </kbd>
              )}
            </div>
          </div>
        </div>

        {/* Right Status Toolbar */}
        <div className="flex items-center gap-2 text-xs">
          
          {/* Provider / Xtream Status Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#11141c] border border-[#1f2330]">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[11px] font-medium text-[#9aa0b3]">
              {channels.length > 0 ? `${channels.length} Streams Loaded` : 'Xtream Codes Ready'}
            </span>
          </div>

          {/* TV Pairing Quick Action */}
          <button
            onClick={() => setIsTvPairingOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#11141c] hover:bg-[#181c27] border border-[#1f2330] text-[#9aa0b3] hover:text-white transition-all cursor-pointer"
            title="Link TV Browser with 6-digit code"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#00e0c6]" />
            <span>TV Link</span>
          </button>

          {/* Download App Quick Action */}
          <button
            onClick={() => {
              if (currentRoute !== 'watch') navigate('/');
              setActiveMenu('downloads');
            }}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
              activeMenu === 'downloads'
                ? 'bg-[#7c5cff]/20 border-[#7c5cff]/40 text-[#00e0c6]'
                : 'bg-[#11141c] hover:bg-[#181c27] border-[#1f2330] text-[#9aa0b3] hover:text-white'
            }`}
            title="Download IPTV.Menu Pro for Android TV, Fire TV, & Mobile"
          >
            <Download className="w-3.5 h-3.5 text-[#00e0c6]" />
            <span>Download</span>
          </button>

          {/* App Studio link */}
          <button
            onClick={() => navigate(currentRoute === 'builder' ? '/' : '/builder')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
              currentRoute === 'builder'
                ? 'bg-[#7c5cff]/20 border-[#7c5cff]/40 text-[#00e0c6]'
                : 'bg-[#11141c] hover:bg-[#181c27] border-[#1f2330] text-[#9aa0b3] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>Studio</span>
          </button>

          {/* Settings button */}
          <button
            onClick={() => setActiveMenu('settings')}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              activeMenu === 'settings'
                ? 'bg-[#7c5cff] text-white border-[#7c5cff] shadow-md shadow-[#7c5cff]/30'
                : 'bg-[#11141c] hover:bg-[#181c27] border-[#1f2330] text-[#9aa0b3] hover:text-white'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile / Auth */}
          {auth.isLoggedIn ? (
            <div className="flex items-center gap-2 bg-[#11141c] border border-[#1f2330] rounded-full pl-2 pr-3 py-1">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 cursor-pointer outline-none"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#7c5cff] to-[#00e0c6] flex items-center justify-center font-bold text-white text-[11px] ring-1 ring-white/20">
                  {auth.email ? auth.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="font-semibold text-white text-xs max-w-[120px] truncate hidden md:inline">
                  {auth.email?.split('@')[0]}
                </span>
              </button>

              <button
                onClick={() => {
                  authStore.logout();
                  triggerToast('Logged out successfully');
                }}
                className="p-1 text-[#6b7180] hover:text-red-400 rounded-full transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#7c5cff] to-[#00e0c6] text-white font-bold rounded-full shadow-md shadow-[#7c5cff]/20 text-xs transition-all hover:opacity-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN APPLICATION CONTENT WITH COLLAPSIBLE SIDEBAR */}
      {currentRoute === 'builder' ? (
        <React.Suspense fallback={
          <div className="flex-1 w-full flex items-center justify-center p-12">
            <div className="w-8 h-8 border-2 border-[#00e0c6] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <BuilderPage onBackToPlayer={() => navigate('/')} />
        </React.Suspense>
      ) : currentRoute === 'pricing' ? (
        <React.Suspense fallback={
          <div className="flex-1 w-full flex items-center justify-center p-12">
            <div className="w-8 h-8 border-2 border-[#00e0c6] border-t-transparent rounded-full animate-spin" />
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
            <div className="w-8 h-8 border-2 border-[#00e0c6] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <AdminPage
            onBackToPlayer={() => navigate('/')}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        </React.Suspense>
      ) : (
        /* STREAMLY WATCH SHELL */
        <div className="flex-1 flex w-full min-h-0 relative z-10">
          
          {/* STREAMLY COLLAPSIBLE SIDEBAR */}
          <aside
            className={`hidden lg:flex shrink-0 flex-col sticky top-[61px] h-[calc(100vh-61px)] border-r border-[#1f2330] bg-[#0b0d14]/70 backdrop-blur-xl transition-[width,padding] duration-200 ease-out z-20 ${
              sidebarCollapsed ? 'w-[76px] px-2 py-4' : 'w-64 px-4 py-4'
            }`}
          >
            {/* Sidebar Header with Collapse / Expand Toggle */}
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} mb-4 px-1`}>
              {!sidebarCollapsed && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7180]">
                  Menu
                </span>
              )}
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-[#6b7180] hover:text-white hover:bg-[#181c27] transition-colors"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Nav Items List */}
            <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto scrollbar-hide">
              {NAV_ITEMS.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeMenu === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`flex items-center rounded-xl text-sm transition-all duration-150 cursor-pointer ${
                      sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'
                    } ${
                      isActive
                        ? 'bg-[#181c27] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-[#7c5cff]/30 font-bold'
                        : 'text-[#9aa0b3] hover:bg-[#11141c] hover:text-white font-medium'
                    }`}
                  >
                    <IconComponent
                      className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                        isActive ? 'text-[#00e0c6]' : 'text-[#6b7180]'
                      }`}
                    />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Bottom Account Card */}
            <div className="mt-auto pt-3 border-t border-[#1f2330]">
              {!sidebarCollapsed ? (
                <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-[#11141c]/60">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c5cff] to-[#00e0c6] flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm">
                    {auth.email ? auth.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">
                      {auth.email || 'Xtream User'}
                    </div>
                    <div className="text-[10px] text-[#22c55e] flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                      Connected
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-lg bg-[#181c27] text-[#00e0c6] flex items-center justify-center font-bold text-xs">
                    {auth.email ? auth.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* MAIN PAGE VIEW */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMenu}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="flex-1 min-w-0"
              >
                <SectionErrorBoundary
                  sectionName={NAV_ITEMS.find((n) => n.id === activeMenu)?.label || activeMenu}
                  onResetToHome={() => setActiveMenu('home')}
                >
                  {renderActiveSection()}
                </SectionErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </main>

        </div>
      )}

      {/* 3. MOBILE BOTTOM NAVIGATION (Streamly Mobile Nav) */}
      {currentRoute === 'watch' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#06070b]/95 backdrop-blur-2xl border-t border-[#1f2330] z-40 flex items-center justify-around px-2 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
          {MOBILE_TAB_ITEMS.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-150 cursor-pointer ${
                  isActive ? 'text-[#00e0c6] font-bold' : 'text-[#6b7180] hover:text-[#eef0f6]'
                }`}
              >
                <IconComponent className={`w-5 h-5 ${isActive ? 'text-[#00e0c6]' : 'text-[#6b7180]'}`} />
                <span className="text-[10px] tracking-tight mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. FOOTER */}
      <footer className="py-5 pb-20 lg:pb-5 border-t border-[#1f2330] bg-[#06070b] text-center text-xs text-[#6b7180] relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00e0c6] shadow-[0_0_8px_#00e0c6]" />
            <p className="text-[#9aa0b3] font-mono text-[11px]">
              IPTV.Menu Pro • High-Performance Web & Living Room TV Streaming
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono">
            <button
              onClick={() => setLegalModalState({ isOpen: true, tab: 'privacy' })}
              className="text-[#9aa0b3] hover:text-[#00e0c6] transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <span className="text-[#1f2330]">•</span>
            <button
              onClick={() => setLegalModalState({ isOpen: true, tab: 'terms' })}
              className="text-[#9aa0b3] hover:text-[#00e0c6] transition-colors cursor-pointer"
            >
              Terms
            </button>
            <span className="text-[#1f2330]">•</span>
            <button
              onClick={() => setIsTvPairingOpen(true)}
              className="text-[#00e0c6] hover:underline cursor-pointer"
            >
              Pair Living Room TV
            </button>
          </div>
        </div>
      </footer>

      {/* 5. GLOBAL MODALS */}
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
            className="fixed top-6 right-6 z-[100] bg-[#11141c]/95 border border-[#22c55e]/40 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl max-w-sm"
          >
            <div className="w-8 h-8 rounded-full bg-[#22c55e]/15 flex items-center justify-center border border-[#22c55e]/30 text-[#22c55e]">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-black text-[#22c55e] uppercase tracking-widest">Notification</h5>
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

      {/* Phone Simulator Modal */}
      {currentRoute !== 'builder' && (
        <PhoneSimulatorModal
          onNavigateToBuilder={() => navigate('/builder')}
          onOpenCinema={(channel) => setGlobalCinemaChannel(channel)}
        />
      )}

      {/* 10-Foot TV Spatial Navigation Indicator */}
      {tvNavigation.isEnabled && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#06070b]/90 border border-[#00e0c6]/40 shadow-2xl backdrop-blur-md text-xs font-semibold text-[#00e0c6]">
          <span className="w-2 h-2 rounded-full bg-[#00e0c6] animate-ping" />
          <span>TV Remote Active</span>
          <span className="text-[10px] text-[#9aa0b3] font-mono hidden sm:inline">(D-Pad Navigate • OK Selects)</span>
        </div>
      )}

      {/* Network Resilience Status Banner */}
      <NetworkResilienceBanner />

    </div>
  );
}
