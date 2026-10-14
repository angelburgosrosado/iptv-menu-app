/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  Tv, 
  KeyRound, 
  Server, 
  User, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  Radio, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  Layers,
  Sparkles,
  Network,
  CalendarRange,
  Clock
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { simRouter } from '../shims/expo-router';
import { 
  authenticateXtreamCodes, 
  generateXtreamChannelList, 
  fetchXtreamCategories,
  fetchXtreamStreams,
  fetchXtreamM3uChannels,
  fetchXtreamVodCategories,
  fetchXtreamVodStreams,
  generateXtreamVodChannelList,
  fetchXtreamSeriesCategories,
  fetchXtreamSeries,
  generateXtreamSeriesChannelList,
  fetchXtreamShortEpg,
  parseXtreamUrl,
  XtreamStreamItem,
  XtreamEpgListing
} from '../utils/xtreamClient';
import { 
  Film,
  Tv2,
  Clapperboard,
} from 'lucide-react';
import { 
  authenticateStalkerPortal, 
  fetchStalkerGenres, 
  fetchStalkerChannels 
} from '../utils/stalkerClient';
import { buildCountrySections } from '../utils/channelEnrichment';
import { PageProtocolHeader } from './PageProtocolHeader';
import { Channel } from '../types/iptv';

export interface SavedXtreamAccount {
  id: string;
  serverUrl: string;
  username: string;
  password?: string;
  status: string;
  channelCount: number;
  lastConnected: string;
  type?: 'xtream' | 'stalker';
  macAddress?: string;
}

const DEFAULT_SAVED_ACCOUNTS: SavedXtreamAccount[] = [];

const getSavedAccounts = (): SavedXtreamAccount[] => {
  try {
    const raw = localStorage.getItem('iptv_xtream_accounts');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return [];
};

export default function XtreamConnector() {
  const [protocolType, setProtocolType] = React.useState<'xtream' | 'stalker'>('xtream');

  // Xtream inputs (clean inputs, populated only when entered or saved by user)
  const [serverUrl, setServerUrl] = React.useState(() => localStorage.getItem('iptv_xtream_server_url') || '');
  const [username, setUsername] = React.useState(() => localStorage.getItem('iptv_xtream_username') || '');
  const [password, setPassword] = React.useState(() => localStorage.getItem('iptv_xtream_password') || '');

  // Stalker inputs
  const [stalkerPortalUrl, setStalkerPortalUrl] = React.useState(() => localStorage.getItem('iptv_stalker_portal_url') || '');
  const [stalkerMac, setStalkerMac] = React.useState(() => localStorage.getItem('iptv_stalker_mac') || '');
  const [stalkerToken, setStalkerToken] = React.useState(() => localStorage.getItem('iptv_stalker_token') || '');

  const [savedAccounts, setSavedAccounts] = React.useState<SavedXtreamAccount[]>(getSavedAccounts);
  const [isLoading, setIsLoading] = React.useState(false);
  const [connectionStep, setConnectionStep] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);
  const [successInfo, setSuccessInfo] = React.useState<any | null>(null);

  const [epgPreviewAccount, setEpgPreviewAccount] = React.useState<SavedXtreamAccount | null>(null);
  const [epgListings, setEpgListings] = React.useState<XtreamEpgListing[]>([]);
  const [isFetchingEpg, setIsFetchingEpg] = React.useState(false);

  const handlePreviewEpg = async (account: SavedXtreamAccount, e: React.MouseEvent) => {
    e.stopPropagation();
    setEpgPreviewAccount(account);
    setIsFetchingEpg(true);
    setEpgListings([]);
    try {
      const listings = await fetchXtreamShortEpg(
        {
          serverUrl: account.serverUrl,
          username: account.username,
          password: account.password || '',
          status: 'connected'
        },
        101073,
        10
      );
      setEpgListings(listings);
    } catch (err) {
      console.warn('Could not preview Xtream EPG', err);
    } finally {
      setIsFetchingEpg(false);
    }
  };

  const { channels } = usePlayerStore();

  const handleConnect = async (e?: React.FormEvent, customAccount?: SavedXtreamAccount) => {
    if (e) e.preventDefault();

    setIsLoading(true);
    setError(null);
    setSuccessInfo(null);

    if (protocolType === 'stalker') {
      const targetPortal = customAccount ? customAccount.serverUrl : stalkerPortalUrl;
      const targetMac = customAccount ? (customAccount.macAddress || customAccount.username.replace(/^MAC:\s*/i, '')) : stalkerMac;

      if (!targetPortal || !targetMac) {
        setError('Please provide both Stalker Portal URL and MAC Address.');
        setIsLoading(false);
        return;
      }

      try {
        localStorage.setItem('iptv_stalker_portal_url', targetPortal);
        localStorage.setItem('iptv_stalker_mac', targetMac);

        setConnectionStep('Performing MAG250 STB Handshake...');
        const authRes = await authenticateStalkerPortal(targetPortal, targetMac);
        if (!authRes.success || !authRes.token) {
          throw new Error(authRes.error || 'Stalker portal rejected handshake. Check MAC address.');
        }

        localStorage.setItem('iptv_stalker_token', authRes.token);
        setStalkerToken(authRes.token);

        setConnectionStep('Cataloging Genres & Categories...');
        const genres = await fetchStalkerGenres(targetPortal, targetMac, authRes.token);

        setConnectionStep('Importing Channel Lineup...');
        const stalkerChannels = await fetchStalkerChannels(targetPortal, targetMac, authRes.token, genres);

        if (stalkerChannels.length === 0) {
          throw new Error('No active channels returned from Stalker Portal.');
        }

        usePlayerStore.setState(state => {
          const merged = [...stalkerChannels, ...state.channels.filter(c => !stalkerChannels.some(m => m.id === c.id))];
          return {
            channels: merged,
            groups: Array.from(new Set(merged.map(c => c.group))).sort(),
            countrySections: buildCountrySections(merged)
          };
        });

        const stalkerAccount: SavedXtreamAccount = {
          id: `stalker-${Date.now()}`,
          serverUrl: targetPortal,
          username: `MAC: ${targetMac}`,
          macAddress: targetMac,
          status: 'Active',
          channelCount: stalkerChannels.length,
          lastConnected: new Date().toLocaleDateString(),
          type: 'stalker'
        };

        const updated = [stalkerAccount, ...savedAccounts.filter(a => a.serverUrl !== targetPortal)].slice(0, 5);
        setSavedAccounts(updated);
        localStorage.setItem('iptv_xtream_accounts', JSON.stringify(updated));

        setSuccessInfo({
          title: 'Stalker Portal Authenticated',
          server: targetPortal,
          channels: stalkerChannels.length,
          mac: targetMac
        });
      } catch (err: any) {
        setError(err.message || 'Stalker authentication timed out.');
      } finally {
        setIsLoading(false);
        setConnectionStep('');
      }
      return;
    }

    // Standard Xtream Codes Flow
    const rawServerUrl = customAccount ? customAccount.serverUrl : serverUrl;
    const rawUsername = customAccount ? customAccount.username : username;
    const rawPassword = customAccount ? (customAccount.password || '') : password;

    // Auto-extract server URL, username, and password if the user pasted a complete Xtream URL
    const parsedInput = parseXtreamUrl(rawServerUrl);
    const targetServerUrl = parsedInput.isXtream ? parsedInput.serverUrl : rawServerUrl;
    const targetUsername = (parsedInput.isXtream && parsedInput.username) ? parsedInput.username : rawUsername;
    const targetPassword = (parsedInput.isXtream && parsedInput.password) ? parsedInput.password : rawPassword;

    if (!targetServerUrl || !targetUsername || !targetPassword) {
      setError('Please fill in server URL, username, and password.');
      setIsLoading(false);
      return;
    }

    try {
      localStorage.setItem('iptv_xtream_server_url', targetServerUrl);
      localStorage.setItem('iptv_xtream_username', targetUsername);
      localStorage.setItem('iptv_xtream_password', targetPassword);
    } catch {}

    const account = {
      serverUrl: targetServerUrl,
      username: targetUsername,
      password: targetPassword,
      status: 'idle' as const
    };

    setConnectionStep('Authenticating Xtream Portal handshake...');
    const result = await authenticateXtreamCodes(account);
    let importedChannels: Channel[] = [];
    let liveCount = 0;
    let vodCount = 0;
    let seriesCount = 0;

    if (result.success) {
      setConnectionStep('Cataloging Live Streams, VOD & Series Lineup...');
      const [catRes, streamRes, vodCatRes, vodStreamRes, seriesCatRes, seriesRes] = await Promise.allSettled([
        fetchXtreamCategories(account),
        fetchXtreamStreams(account),
        fetchXtreamVodCategories(account),
        fetchXtreamVodStreams(account),
        fetchXtreamSeriesCategories(account),
        fetchXtreamSeries(account)
      ]);

      const categories = catRes.status === 'fulfilled' ? catRes.value : {};
      const streams = streamRes.status === 'fulfilled' ? streamRes.value : [];
      const vodCategories = vodCatRes.status === 'fulfilled' ? vodCatRes.value : {};
      const vodStreams = vodStreamRes.status === 'fulfilled' ? vodStreamRes.value : [];
      const seriesCategories = seriesCatRes.status === 'fulfilled' ? seriesCatRes.value : {};
      const seriesItems = seriesRes.status === 'fulfilled' ? seriesRes.value : [];

      if (streams.length > 0) {
        importedChannels = generateXtreamChannelList(account, streams, categories);
      } else {
        // High-capacity streaming fallback: Essential for large accounts (10k-80k channels) where JSON endpoints time out
        setConnectionStep('Ingesting high-capacity streaming M3U Plus lineup...');
        importedChannels = await fetchXtreamM3uChannels(account);
      }
      liveCount = streams.length || importedChannels.filter(c => c.streamType === 'live' || !c.streamType).length;

      // Merge VOD items if available
      if (vodStreams.length > 0) {
        const vodChannels = generateXtreamVodChannelList(account, vodStreams, vodCategories);
        importedChannels = [...importedChannels, ...vodChannels];
        vodCount = vodChannels.length;
      } else {
        vodCount = importedChannels.filter(c => c.streamType === 'vod').length;
      }

      // Merge Series items if available
      if (seriesItems.length > 0) {
        const seriesChannels = generateXtreamSeriesChannelList(account, seriesItems, seriesCategories);
        importedChannels = [...importedChannels, ...seriesChannels];
        seriesCount = seriesChannels.length;
      } else {
        seriesCount = importedChannels.filter(c => c.streamType === 'series').length;
      }
    }

    if (importedChannels.length > 0) {
      usePlayerStore.setState((state) => {
        const merged = [...importedChannels, ...state.channels.filter(c => !importedChannels.some(i => i.id === c.id))];
        return {
          channels: merged,
          groups: Array.from(new Set(merged.map(c => c.group))).sort(),
          countrySections: buildCountrySections(merged)
        };
      });

      const newAccountRecord: SavedXtreamAccount = {
        id: `account-${Date.now()}`,
        serverUrl: targetServerUrl,
        username: targetUsername,
        password: targetPassword,
        status: result.userInfo?.status || 'Active',
        channelCount: importedChannels.length,
        lastConnected: new Date().toLocaleDateString(),
        type: 'xtream'
      };

      const updated = [newAccountRecord, ...savedAccounts.filter(a => a.username !== targetUsername)].slice(0, 5);
      setSavedAccounts(updated);
      try {
        localStorage.setItem('iptv_xtream_accounts', JSON.stringify(updated));
      } catch {}

      setSuccessInfo({
        title: 'Xtream Live Feeds, VOD & Series Synchronized',
        server: targetServerUrl,
        channels: importedChannels.length,
        liveCount,
        vodCount,
        seriesCount,
        expDate: result.userInfo?.exp_date || 'Active Line'
      });
      setError(null);

      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({ event: 'Playlist_Imported', method: 'Xtream/Stalker' });
      }
    } else {
      setError(result.error || 'Failed to authenticate with Xtream Codes API server.');
    }

    setIsLoading(false);
  };

  const handleRemoveAccount = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedAccounts.filter(a => a.id !== id);
    setSavedAccounts(updated);
    try {
      localStorage.setItem('iptv_xtream_accounts', JSON.stringify(updated));
    } catch {}
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Protocol Architecture Header */}
      <PageProtocolHeader
        title="Xtream Codes & Stalker Protocol Connector"
        description="Direct gateway for Xtream Codes API v2 and Stalker Middleware portal endpoints. Connect with standard server credentials or portal MAC address to auto-load live categories, streams, and EPG channels into your active workspace."
        protocol="Xtream Codes REST API v2 & Stalker Middleware"
        schema="player_api.php Action Schema & Stalker Load API"
        rfcOrStandard="Xtream API Spec • Stalker Portal v5.x"
        layer="Authentication & Middleware Bridge Layer"
        supportedTags={['player_api.php', 'Stalker Portal', 'MAC Binding', 'Live Streams', 'VOD Cat', 'Direct Ingestion']}
        icon={Server}
        badgeColor="cyan"
      >
        <div className="flex items-center gap-1 bg-black/40 p-1 border border-white/10 rounded-xl">
          <button
            onClick={() => setProtocolType('xtream')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              protocolType === 'xtream'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
            aria-label="Xtream Codes API Protocol"
          >
            Xtream Codes API
          </button>
          <button
            onClick={() => setProtocolType('stalker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              protocolType === 'stalker'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
            aria-label="Stalker Middleware Portal Protocol"
          >
            Stalker Portal
          </button>
        </div>
      </PageProtocolHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Credentials Form Box (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <form onSubmit={handleConnect} className="bg-[#16161a] border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                {protocolType === 'xtream' ? 'Xtream Codes API Credentials' : 'Stalker Middleware Portal Credentials'}
              </h3>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                {protocolType === 'xtream' ? 'player_api.php' : 'MAG/Aura MAC Protocol'}
              </span>
            </div>

            {protocolType === 'xtream' ? (
              <>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                    Server URL (Host & Port)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="http://iptv.server.com:8080"
                      value={serverUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setServerUrl(val);
                        const parsed = parseXtreamUrl(val);
                        if (parsed.isXtream && parsed.username && parsed.password) {
                          setServerUrl(parsed.serverUrl);
                          setUsername(parsed.username);
                          setPassword(parsed.password);
                        }
                      }}
                      className="w-full pl-9 pr-4 py-2.5 bg-black/50 border border-white/10 focus:border-cyan-500/50 rounded-xl text-xs text-white outline-none font-mono placeholder-zinc-600 transition-all"
                    />
                    <Server className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                      Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-black/50 border border-white/10 focus:border-cyan-500/50 rounded-xl text-xs text-white outline-none font-mono placeholder-zinc-600 transition-all"
                      />
                      <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-black/50 border border-white/10 focus:border-cyan-500/50 rounded-xl text-xs text-white outline-none font-mono placeholder-zinc-600 transition-all"
                      />
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                    Stalker Portal URL
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="http://portal.provider.com/c/"
                      value={stalkerPortalUrl}
                      onChange={(e) => setStalkerPortalUrl(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-black/50 border border-white/10 focus:border-cyan-500/50 rounded-xl text-xs text-white outline-none font-mono placeholder-zinc-600 transition-all"
                    />
                    <Network className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                      Device MAC Address
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="00:1A:79:XX:XX:XX"
                        value={stalkerMac}
                        onChange={(e) => setStalkerMac(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-black/50 border border-white/10 focus:border-cyan-500/50 rounded-xl text-xs text-white outline-none font-mono placeholder-zinc-600 transition-all"
                      />
                      <Radio className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                      Device Serial / Token (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Optional device token"
                        value={stalkerToken}
                        onChange={(e) => setStalkerToken(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-black/50 border border-white/10 focus:border-cyan-500/50 rounded-xl text-xs text-white outline-none font-mono placeholder-zinc-600 transition-all"
                      />
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              aria-label="Authenticate and Ingest Streams"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? (connectionStep || 'Connecting & Parsing Manifests...') : `Authenticate & Import ${protocolType === 'xtream' ? 'Xtream' : 'Stalker'} Channels`}
            </button>
          </form>

          {/* Feedback alerts */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Authentication Error</strong>
                <p className="mt-0.5 text-zinc-300">{error}</p>
              </div>
            </div>
          )}

          {successInfo && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex flex-col gap-3 text-xs">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">{successInfo.title}</strong>
                  <p className="mt-0.5 text-zinc-300">
                    Successfully loaded <strong>{successInfo.channels}</strong> total streams from {successInfo.server}. All three media tiers are now accessible in the Channel Browser and Video Player.
                  </p>
                </div>
              </div>

              {/* Media Tiers Breakdown Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20 text-center">
                <button
                  type="button"
                  onClick={() => {
                    usePlayerStore.getState().setSelectedStreamType('live');
                    simRouter.push('/channels');
                  }}
                  className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/20 hover:border-emerald-400 hover:bg-emerald-500/20 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
                    <Tv2 className="w-3.5 h-3.5" />
                    <span>Live TV</span>
                  </div>
                  <div className="text-lg font-black text-white mt-1">{successInfo.liveCount ?? 0}</div>
                  <span className="text-[10px] text-zinc-400 group-hover:text-emerald-300">Browse Live →</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    usePlayerStore.getState().setSelectedStreamType('vod');
                    simRouter.push('/channels');
                  }}
                  className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 hover:border-cyan-400 hover:bg-cyan-500/20 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold">
                    <Film className="w-3.5 h-3.5" />
                    <span>VOD Movies</span>
                  </div>
                  <div className="text-lg font-black text-white mt-1">{successInfo.vodCount ?? 0}</div>
                  <span className="text-[10px] text-zinc-400 group-hover:text-cyan-300">Browse Movies →</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    usePlayerStore.getState().setSelectedStreamType('series');
                    simRouter.push('/channels');
                  }}
                  className="p-2.5 rounded-xl bg-black/40 border border-purple-500/20 hover:border-purple-400 hover:bg-purple-500/20 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-purple-400 text-[11px] font-bold">
                    <Clapperboard className="w-3.5 h-3.5" />
                    <span>TV Series</span>
                  </div>
                  <div className="text-lg font-black text-white mt-1">{successInfo.seriesCount ?? 0}</div>
                  <span className="text-[10px] text-zinc-400 group-hover:text-purple-300">Browse Series →</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Saved Accounts & Profiles List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#16161a] border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Saved Server Profiles
            </h3>

            {savedAccounts.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center">
                <Server className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <span className="text-xs font-bold text-zinc-400">No Saved Profiles</span>
                <p className="text-[10px] text-zinc-500 mt-1">Connect your first Xtream or Stalker server to save credentials for instant 1-click reloads.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedAccounts.map((account) => (
                  <div
                    key={account.id}
                    onClick={() => handleConnect(undefined, account)}
                    className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-cyan-500/30 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{account.username}</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-400 rounded font-mono uppercase">
                          {account.type || 'xtream'}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded font-mono">
                          {account.channelCount || 128} ch
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block truncate mt-0.5 font-mono">
                        {account.serverUrl}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handlePreviewEpg(account, e)}
                        className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Inspect live EPG guide from Xtream server"
                      >
                        <CalendarRange className="w-3 h-3" />
                        <span>EPG</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnect(undefined, account);
                        }}
                        className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        title="Load channels into active guide"
                      >
                        Load Channels
                      </button>
                      <button
                        onClick={(e) => handleRemoveAccount(account.id, e)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Profile"
                        aria-label="Delete Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Xtream Live EPG Preview Modal */}
      {epgPreviewAccount && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121216] border border-white/10 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-black text-white">Live Xtream EPG Schedule</h3>
              </div>
              <button
                onClick={() => setEpgPreviewAccount(null)}
                className="text-xs text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-zinc-400 font-mono">
              Server: <strong className="text-white">{epgPreviewAccount.serverUrl}</strong> ({epgPreviewAccount.username})
            </div>

            {isFetchingEpg ? (
              <div className="py-8 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Syncing live EPG data from server...</span>
              </div>
            ) : epgListings.length === 0 ? (
              <div className="py-6 text-center text-zinc-400 text-xs">
                <span>No program data returned for this stream. The channel may have no active XMLTV mapping on this server.</span>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {epgListings.map((item, idx) => (
                  <div key={item.id || idx} className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{item.title}</span>
                      {item.now_playing === 1 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase">
                          NOW PLAYING
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{item.start} - {item.end}</span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-zinc-400 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
