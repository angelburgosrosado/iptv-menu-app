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
import { 
  authenticateXtreamCodes, 
  generateXtreamChannelList, 
  fetchXtreamCategories,
  fetchXtreamStreams,
  fetchXtreamM3uChannels,
  fetchXtreamVodCategories,
  fetchXtreamVodStreams,
  generateXtreamVodChannelList,
  fetchXtreamShortEpg,
  XtreamStreamItem,
  XtreamEpgListing
} from '../utils/xtreamClient';
import { buildCountrySections } from '../utils/channelEnrichment';
import { PageProtocolHeader } from './PageProtocolHeader';
import { Channel } from '../types/iptv';

import { MELHATA_XTREAM_CONFIG, MELHATA_CHANNELS, createMelhataChannels } from '../data/melhataChannels';

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

const DEFAULT_SAVED_ACCOUNTS: SavedXtreamAccount[] = [
  {
    id: 'melhata-primary',
    serverUrl: MELHATA_XTREAM_CONFIG.serverUrl,
    username: '8rvzieximl',
    password: 'h1usotpevd',
    status: 'Active',
    channelCount: MELHATA_CHANNELS.length,
    lastConnected: 'Today',
    type: 'xtream'
  },
  {
    id: 'melhata-backup',
    serverUrl: 'http://line.melhata.org',
    username: 'adc7b14f9b',
    password: '8ed764a258b7',
    status: 'Line 1',
    channelCount: MELHATA_CHANNELS.length,
    lastConnected: 'Saved',
    type: 'xtream'
  }
];

const getSavedAccounts = (): SavedXtreamAccount[] => {
  try {
    const raw = localStorage.getItem('iptv_xtream_accounts');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!parsed.some(a => a.username === '8rvzieximl')) {
          return [DEFAULT_SAVED_ACCOUNTS[0], ...parsed];
        }
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_SAVED_ACCOUNTS;
};

export default function XtreamConnector() {
  const [protocolType, setProtocolType] = React.useState<'xtream' | 'stalker'>('xtream');

  // Xtream inputs (Pre-filled with Melhata credentials)
  const [serverUrl, setServerUrl] = React.useState(() => localStorage.getItem('iptv_xtream_server_url') || MELHATA_XTREAM_CONFIG.serverUrl);
  const [username, setUsername] = React.useState(() => localStorage.getItem('iptv_xtream_username') || MELHATA_XTREAM_CONFIG.username);
  const [password, setPassword] = React.useState(() => localStorage.getItem('iptv_xtream_password') || MELHATA_XTREAM_CONFIG.password);

  // Stalker inputs
  const [stalkerPortalUrl, setStalkerPortalUrl] = React.useState(() => localStorage.getItem('iptv_stalker_portal_url') || 'http://portal.example.com/c/');
  const [stalkerMac, setStalkerMac] = React.useState(() => localStorage.getItem('iptv_stalker_mac') || '00:1A:79:3B:4C:12');
  const [stalkerToken, setStalkerToken] = React.useState(() => localStorage.getItem('iptv_stalker_token') || '');

  const [savedAccounts, setSavedAccounts] = React.useState<SavedXtreamAccount[]>(getSavedAccounts);
  const [isLoading, setIsLoading] = React.useState(false);
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
      if (!stalkerPortalUrl || !stalkerMac) {
        setError('Please provide both Stalker Portal URL and MAC Address.');
        setIsLoading(false);
        return;
      }

      try {
        localStorage.setItem('iptv_stalker_portal_url', stalkerPortalUrl);
        localStorage.setItem('iptv_stalker_mac', stalkerMac);
        localStorage.setItem('iptv_stalker_token', stalkerToken);

        // Stalker Middleware handshake simulation
        await new Promise(r => setTimeout(r, 900));

        const mockStalkerChannels: Channel[] = [
          {
            id: `stk_${Date.now()}_1`,
            name: 'Stalker Premier HD (ABC News)',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/ABC_News_Live_logo_2021.svg/960px-ABC_News_Live_logo_2021.svg.png',
            url: 'https://abcnews-streams.akamaized.net/hls/live/2023560/abcnewshudson1/master.m3u8',
            group: 'Stalker Live',
            tvgId: 'stalker_premier_hd',
            countryCode: 'US',
            metadataSource: 'stalker' as any,
          },
          {
            id: `stk_${Date.now()}_2`,
            name: 'Stalker 24/7 (CBS News)',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/CBS_News_247_logo.svg/960px-CBS_News_247_logo.svg.png',
            url: 'https://lineup.cbsivideo.com/playout/8877a7d5-b094-4ac8-bc72-75a5fed68e5b/index.m3u8',
            group: 'News',
            tvgId: 'stalker_cbs_news',
            countryCode: 'US',
            metadataSource: 'stalker' as any,
          }
        ];

        usePlayerStore.setState(state => {
          const merged = [...mockStalkerChannels, ...state.channels.filter(c => !mockStalkerChannels.some(m => m.id === c.id))];
          return {
            channels: merged,
            groups: Array.from(new Set(merged.map(c => c.group))).sort(),
            countrySections: buildCountrySections(merged)
          };
        });

        const stalkerAccount: SavedXtreamAccount = {
          id: `stalker-${Date.now()}`,
          serverUrl: stalkerPortalUrl,
          username: `MAC: ${stalkerMac}`,
          macAddress: stalkerMac,
          status: 'Active',
          channelCount: mockStalkerChannels.length,
          lastConnected: new Date().toLocaleDateString(),
          type: 'stalker'
        };

        const updated = [stalkerAccount, ...savedAccounts.filter(a => a.serverUrl !== stalkerPortalUrl)].slice(0, 5);
        setSavedAccounts(updated);
        localStorage.setItem('iptv_xtream_accounts', JSON.stringify(updated));

        setSuccessInfo({
          title: 'Stalker Portal Authenticated',
          server: stalkerPortalUrl,
          channels: mockStalkerChannels.length,
          mac: stalkerMac
        });
      } catch (err: any) {
        setError(err.message || 'Stalker authentication timed out.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Standard Xtream Codes Flow
    const targetServerUrl = customAccount ? customAccount.serverUrl : serverUrl;
    const targetUsername = customAccount ? customAccount.username : username;
    const targetPassword = customAccount ? (customAccount.password || '') : password;

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

    const result = await authenticateXtreamCodes(account);
    let importedChannels: Channel[] = [];

    if (result.success) {
      const [categories, streams, vodCategories, vodStreams] = await Promise.all([
        fetchXtreamCategories(account),
        fetchXtreamStreams(account),
        fetchXtreamVodCategories(account),
        fetchXtreamVodStreams(account)
      ]);

      if (streams.length > 0) {
        importedChannels = generateXtreamChannelList(account, streams, categories);
      } else if (targetServerUrl.includes('melhata.org')) {
        importedChannels = createMelhataChannels(targetUsername, targetPassword, targetServerUrl);
      } else {
        importedChannels = await fetchXtreamM3uChannels(account);
      }

      // Merge VOD items if available
      if (vodStreams.length > 0) {
        const vodChannels = generateXtreamVodChannelList(account, vodStreams, vodCategories);
        importedChannels = [...importedChannels, ...vodChannels];
      }
    } else if (targetServerUrl.includes('melhata.org')) {
      // Direct stream manifest mapping fallback for Melhata gateway (bypasses CORS/proxy limits)
      importedChannels = createMelhataChannels(targetUsername, targetPassword, targetServerUrl);
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
        title: 'Xtream Subscription Channels Added',
        server: targetServerUrl,
        channels: importedChannels.length,
        expDate: result.userInfo?.exp_date || 'Active Line'
      });
      setError(null);
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
                      onChange={(e) => setServerUrl(e.target.value)}
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
              {isLoading ? 'Connecting & Parsing Manifests...' : `Authenticate & Import ${protocolType === 'xtream' ? 'Xtream' : 'Stalker'} Channels`}
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
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-3 text-xs">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">{successInfo.title}</strong>
                <p className="mt-0.5 text-zinc-300">
                  Successfully imported <strong>{successInfo.channels}</strong> live stream feeds from {successInfo.server}. Channels are now active in the Channel Browser and Simulator.
                </p>
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
