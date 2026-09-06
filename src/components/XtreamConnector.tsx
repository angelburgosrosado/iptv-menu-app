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
  Layers
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { 
  authenticateXtreamCodes, 
  generateXtreamChannelList, 
  fetchXtreamCategories,
  fetchXtreamStreams,
  fetchXtreamM3uChannels,
  XtreamStreamItem 
} from '../utils/xtreamClient';
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
}

const getSavedAccounts = (): SavedXtreamAccount[] => {
  try {
    const raw = localStorage.getItem('iptv_xtream_accounts');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

export default function XtreamConnector() {
  const [serverUrl, setServerUrl] = React.useState(() => {
    return localStorage.getItem('iptv_xtream_server_url') || '';
  });
  const [username, setUsername] = React.useState(() => {
    return localStorage.getItem('iptv_xtream_username') || '';
  });
  const [password, setPassword] = React.useState(() => {
    return localStorage.getItem('iptv_xtream_password') || '';
  });
  const [savedAccounts, setSavedAccounts] = React.useState<SavedXtreamAccount[]>(getSavedAccounts);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successInfo, setSuccessInfo] = React.useState<any | null>(null);

  const { channels } = usePlayerStore();

  const handleConnect = async (e?: React.FormEvent, customAccount?: { serverUrl: string; username: string; password?: string }) => {
    if (e) e.preventDefault();
    
    const targetServerUrl = customAccount ? customAccount.serverUrl : serverUrl;
    const targetUsername = customAccount ? customAccount.username : username;
    const targetPassword = customAccount ? (customAccount.password || '') : password;

    if (!targetServerUrl || !targetUsername || !targetPassword) {
      setError('Please fill in server URL, username, and password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessInfo(null);

    // Save inputs to localStorage immediately
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

    if (result.success) {
      // 1. Fetch live categories & live streams in parallel
      const [categories, streams] = await Promise.all([
        fetchXtreamCategories(account),
        fetchXtreamStreams(account)
      ]);

      let importedChannels: Channel[] = [];

      if (streams.length > 0) {
        importedChannels = generateXtreamChannelList(account, streams, categories);
      } else {
        // Fallback: Fetch standard Xtream M3U8 export directly
        importedChannels = await fetchXtreamM3uChannels(account);
      }

      if (importedChannels.length > 0) {
        usePlayerStore.setState((state) => {
          const importedIds = new Set(importedChannels.map(c => c.id));
          const existingRemaining = state.channels.filter(c => !importedIds.has(c.id));
          const merged = [...importedChannels, ...existingRemaining];
          const newGroups = Array.from(new Set([...Object.values(categories), ...merged.map(c => c.group), ...state.groups]));
          return {
            channels: merged,
            groups: newGroups,
            countrySections: buildCountrySections(merged)
          };
        });
      }

      // Save into accounts persistent cache
      const newAccountEntry: SavedXtreamAccount = {
        id: `${targetUsername}@${targetServerUrl}`,
        serverUrl: targetServerUrl,
        username: targetUsername,
        password: targetPassword,
        status: 'Active',
        channelCount: importedChannels.length,
        lastConnected: new Date().toISOString()
      };

      const updatedAccounts = [newAccountEntry, ...savedAccounts.filter(a => a.id !== newAccountEntry.id)];
      setSavedAccounts(updatedAccounts);
      try {
        localStorage.setItem('iptv_xtream_accounts', JSON.stringify(updatedAccounts));
      } catch {}

      setSuccessInfo({
        username: targetUsername,
        serverUrl: targetServerUrl,
        status: result.userInfo?.status || 'Active',
        exp_date: result.userInfo?.exp_date || 'Unlimited',
        max_connections: result.userInfo?.max_connections || '4',
        active_cons: result.userInfo?.active_cons || '1',
        importedCount: importedChannels.length
      });
      setIsLoading(false);
    } else {
      setIsLoading(false);
      setError(result.error || 'Unable to connect to Xtream Codes server. Please check your host portal and credentials.');
    }
  };

  const handleRemoveAccount = (id: string) => {
    const updated = savedAccounts.filter(a => a.id !== id);
    setSavedAccounts(updated);
    try {
      localStorage.setItem('iptv_xtream_accounts', JSON.stringify(updated));
    } catch {}
  };

  const handleLoadAccountIntoForm = (acc: SavedXtreamAccount) => {
    setServerUrl(acc.serverUrl);
    setUsername(acc.username);
    if (acc.password) setPassword(acc.password);
    setError(null);
  };

  const handleViewChannels = () => {
    // Select channels tab across both desktop and mobile
    const buttons = Array.from(document.querySelectorAll('button'));
    const channelsBtn = buttons.find(b => b.textContent?.trim().includes('Channels') || b.getAttribute('aria-label') === 'Channels');
    if (channelsBtn) {
      channelsBtn.click();
    }
    const ws = document.getElementById('workspace-section');
    if (ws) ws.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 text-neutral-200 flex flex-col gap-6">
      {/* Protocol Architecture Header */}
      <PageProtocolHeader
        title="Xtream Codes / Stalker Direct Connect"
        description="Direct client integration with Xtream Codes API v2.9 and Stalker Portal REST backends. Queries player_api.php endpoints to authenticate user sessions, stream live feeds, catalogue VOD items, and poll server concurrency quotas."
        protocol="Xtream Codes API v2 & Stalker Portal"
        schema="JSON REST Player API Schema (action=get_live_streams)"
        rfcOrStandard="Xtream Codes v2.9.2 Protocol • JSON RPC"
        layer="Middleware & Subscription Auth Layer"
        supportedTags={['player_api.php', 'get_live_categories', 'get_live_streams', 'get_vod_streams', 'max_connections', 'exp_date']}
        icon={Server}
        badgeColor="emerald"
      />

      <form onSubmit={(e) => handleConnect(e)} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            Server URL / Host Portal
          </label>
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="http://example-iptv.tv:8080"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 text-xs font-bold uppercase tracking-wider text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Connecting & Ingesting Streams...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Connect & Ingest Xtream Channels
            </>
          )}
        </button>
      </form>

      {/* Success Notification Banner */}
      {successInfo && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Xtream Account Connected & Ingested!
            </div>
            <button
              onClick={handleViewChannels}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Browse {successInfo.importedCount} Ingested Channels</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-neutral-300 font-mono text-[11px] border-t border-emerald-500/20">
            <div>User: <span className="text-white font-semibold">{successInfo.username}</span></div>
            <div>Status: <span className="text-emerald-400 font-semibold">{successInfo.status || 'Active'}</span></div>
            <div>Streams Ingested: <span className="text-white font-semibold">{successInfo.importedCount}</span></div>
            <div>Expires: <span className="text-white font-semibold">{successInfo.exp_date || 'Unlimited'}</span></div>
          </div>
        </div>
      )}

      {/* Saved & Active Xtream Accounts Section */}
      <div className="border-t border-neutral-800 pt-6">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-blue-400" />
          Saved & Connected Xtream Accounts ({savedAccounts.length})
        </h4>

        {savedAccounts.length === 0 ? (
          <p className="text-xs text-neutral-500 italic">
            No saved Xtream accounts yet. Connect an account above to save and sync channels.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedAccounts.map((acc) => (
              <div 
                key={acc.id}
                className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs truncate max-w-[200px]" title={acc.username}>
                      {acc.username}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      {acc.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-mono truncate block mt-0.5" title={acc.serverUrl}>
                    {acc.serverUrl}
                  </span>
                  <div className="text-[11px] text-neutral-500 mt-2 flex items-center gap-2">
                    <Tv className="w-3 h-3 text-blue-400" />
                    <span>{acc.channelCount} Streams Loaded</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-850 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleConnect(undefined, acc)}
                      className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      title="Sync channels from this account"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Sync
                    </button>
                    <button
                      onClick={() => handleLoadAccountIntoForm(acc)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-neutral-300 rounded-lg text-[11px] font-semibold transition-colors"
                      title="Edit in form"
                    >
                      Edit
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemoveAccount(acc.id)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove connection"
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
  );
}
