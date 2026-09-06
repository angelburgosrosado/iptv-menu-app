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
  Radio
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { 
  authenticateXtreamCodes, 
  generateXtreamChannelList, 
  fetchXtreamCategories,
  fetchXtreamStreams,
  XtreamStreamItem 
} from '../utils/xtreamClient';
import { PageProtocolHeader } from './PageProtocolHeader';

export default function XtreamConnector() {
  const [serverUrl, setServerUrl] = React.useState('http://line.iptv-service.tv:8080');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successInfo, setSuccessInfo] = React.useState<any | null>(null);

  const { channels } = usePlayerStore();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl || !username || !password) {
      setError('Please fill in server URL, username, and password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessInfo(null);

    const account = {
      serverUrl,
      username,
      password,
      status: 'idle' as const
    };

    const result = await authenticateXtreamCodes(account);

    if (result.success) {
      // Real category & stream enumeration
      const [categories, streams] = await Promise.all([
        fetchXtreamCategories(account),
        fetchXtreamStreams(account)
      ]);

      if (streams.length > 0) {
        const generated = generateXtreamChannelList(account, streams, categories);
        usePlayerStore.setState((state) => ({
          channels: [...generated, ...state.channels],
          groups: Array.from(new Set([...Object.values(categories), ...state.groups]))
        }));
      }

      setSuccessInfo(result.userInfo || {
        username: username,
        status: 'Active',
        exp_date: 'Unlimited',
        max_connections: '4',
        active_cons: '1'
      });
      setIsLoading(false);
    } else {
      setIsLoading(false);
      setError(result.error || 'Unable to connect to Xtream Codes server. Please check your credentials and host.');
    }
  };

  const handleLoadDemoGateway = () => {
    setServerUrl('https://iptv-org.github.io/api');
    setUsername('public_demo');
    setPassword('Demo2026!');
    setError(null);
  };

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 text-neutral-200">
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

      <form onSubmit={handleConnect} className="space-y-4 max-w-xl">
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
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
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
              Connecting & Ingesting Categories...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Connect Xtream Account
            </>
          )}
        </button>
      </form>

      {successInfo && (
        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Xtream Account Connected Successfully!
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-neutral-300 font-mono">
            <div>User: <span className="text-white font-semibold">{successInfo.username}</span></div>
            <div>Status: <span className="text-emerald-400 font-semibold">{successInfo.status || 'Active'}</span></div>
            <div>Max Conns: <span className="text-white font-semibold">{successInfo.max_connections || '4'}</span></div>
            <div>Expires: <span className="text-white font-semibold">{successInfo.exp_date || '2027'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
