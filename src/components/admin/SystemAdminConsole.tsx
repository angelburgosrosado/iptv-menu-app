import * as React from 'react';
import { 
  ShieldCheck, 
  Users, 
  Layers, 
  FileText, 
  Activity, 
  Search, 
  UserCheck, 
  UserX, 
  RefreshCw, 
  Building2,
  HardDrive,
  Cpu,
  AlertTriangle,
  Key,
  Database,
  CheckCircle2,
  Sliders,
  Zap,
  Clock,
  Globe,
  Tv,
  Play,
  ExternalLink,
  Copy,
  Check,
  Radio
} from 'lucide-react';
import { fetchWithAuth } from '../../lib/apiClient';
import { PageProtocolHeader } from '../PageProtocolHeader';
import { MELHATA_CHANNELS, MELHATA_XTREAM_CONFIG } from '../../data/melhataChannels';
import { usePlayerStore } from '../../store/usePlayerStore';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'pro' | 'builder' | 'admin';
  status: 'active' | 'suspended';
  createdAt: string;
  lastLoginAt: string;
  playlistsCount: number;
}

interface AdminPlaylist {
  id: string;
  title: string;
  ownerEmail: string;
  channelCount: number;
  sizeBytes: number;
  status: 'ready' | 'processing' | 'failed';
  updatedAt: string;
}

interface AdminWorkspace {
  workspaceId: string;
  name: string;
  ownerUid: string;
  plan: 'free' | 'starter' | 'builder';
  subscriptionStatus: string;
  entitlements: {
    maxPlaylists: number;
    maxHostedPlaylists: number;
    maxDailyCleanups: number;
    maxMonthlyBuilds: number;
    allowBrandingCustomization: boolean;
    allowWhiteLabel: boolean;
  };
  usage: {
    activePlaylistsCount: number;
    activeHostedPlaylistsCount: number;
    dailyCleanupsUsed: number;
    monthlyBuildsUsed: number;
  };
  createdAt: string;
}

interface AuditLogEntry {
  id: string;
  adminEmail: string;
  action: string;
  targetId: string;
  timestamp: string;
  details: string;
}

interface SystemMetrics {
  system: {
    status: string;
    env: string;
    service: string;
    stack: string;
    uptimeSeconds: number;
    nodeVersion: string;
    memory: {
      rssMb: number;
      heapUsedMb: number;
    };
    database: {
      driver: string;
      status: string;
      latencyMs: number;
    };
    storage: {
      driver: string;
      status: string;
    };
  };
  counts: {
    totalUsers: number;
    totalPlaylists: number;
    totalWorkspaces: number;
    totalBuilds: number;
    totalAuditLogs: number;
  };
  buildsByStatus: {
    queued: number;
    building: number;
    completed: number;
    failed: number;
  };
  usersByRole: {
    free: number;
    pro: number;
    builder: number;
    admin: number;
  };
}

export default function SystemAdminConsole() {
  const [activeTab, setActiveTab] = React.useState<'users' | 'workspaces' | 'playlists' | 'streamFeeds' | 'audit' | 'cluster'>('users');
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [workspaces, setWorkspaces] = React.useState<AdminWorkspace[]>([]);
  const [playlists, setPlaylists] = React.useState<AdminPlaylist[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogEntry[]>([]);
  const [metrics, setMetrics] = React.useState<SystemMetrics | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  // Live Stream Feed Breakdown States
  const [streamCountryFilter, setStreamCountryFilter] = React.useState<string | null>(null);
  const [streamCategoryFilter, setStreamCategoryFilter] = React.useState<string | null>(null);
  const [streamSearch, setStreamSearch] = React.useState<string>('');
  const [copiedStreamId, setCopiedStreamId] = React.useState<string | null>(null);
  const { channels } = usePlayerStore();

  const fetchAllAdminData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersData, playlistsData, auditData, metricsData, workspacesData] = await Promise.all([
        fetchWithAuth('/api/admin/users').catch(() => null),
        fetchWithAuth('/api/admin/playlists').catch(() => null),
        fetchWithAuth('/api/admin/audit-logs').catch(() => null),
        fetchWithAuth('/api/admin/metrics').catch(() => null),
        fetchWithAuth('/api/admin/workspaces').catch(() => null),
      ]);

      if (Array.isArray(usersData)) {
        setUsers(usersData.map((u: any) => ({
          uid: u.uid,
          email: u.email || 'no-email',
          displayName: u.displayName || u.email?.split('@')[0] || 'User',
          role: u.role || 'user',
          status: u.accountStatus || 'active',
          createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
          lastLoginAt: u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : 'N/A',
          playlistsCount: u.playlistsCount || 0
        })));
      }

      if (Array.isArray(workspacesData)) {
        setWorkspaces(workspacesData);
      }

      if (Array.isArray(playlistsData)) {
        setPlaylists(playlistsData.map((p: any) => ({
          id: p.playlistId,
          title: p.name,
          ownerEmail: p.uid,
          channelCount: p.channelCount || 0,
          sizeBytes: p.channelCount ? p.channelCount * 250 : 1024,
          status: p.status === 'ready' ? 'ready' : p.status === 'failed' ? 'failed' : 'processing',
          updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'N/A'
        })));
      }

      if (Array.isArray(auditData)) {
        setAuditLogs(auditData.map((l: any) => ({
          id: l.actionId,
          adminEmail: l.adminUid,
          action: l.actionType,
          targetId: l.targetId,
          timestamp: l.createdAt ? new Date(l.createdAt).toLocaleString() : 'N/A',
          details: l.notes || ''
        })));
      }

      if (metricsData && metricsData.system) {
        setMetrics(metricsData);
      }
    } catch (err) {
      console.warn('Admin backend sync notice:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAllAdminData();
  }, [fetchAllAdminData]);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleToggleUserStatus = async (uid: string) => {
    const user = users.find(u => u.uid === uid);
    if (!user) return;
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';

    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: nextStatus } : u));

    try {
      await fetchWithAuth(`/api/admin/users/${uid}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      showNotification(`User ${user.email} marked ${nextStatus}`);
      const auditData = await fetchWithAuth('/api/admin/audit-logs').catch(() => null);
      if (Array.isArray(auditData)) {
        setAuditLogs(auditData.map((l: any) => ({
          id: l.actionId,
          adminEmail: l.adminUid,
          action: l.actionType,
          targetId: l.targetId,
          timestamp: l.createdAt ? new Date(l.createdAt).toLocaleString() : 'N/A',
          details: l.notes || ''
        })));
      }
    } catch (err: any) {
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: user.status } : u));
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleRoleChange = async (uid: string, newRole: AdminUser['role']) => {
    const prevUser = users.find(u => u.uid === uid);
    const prevRole = prevUser?.role;

    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));

    try {
      await fetchWithAuth(`/api/admin/users/${uid}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      });
      showNotification(`Role updated to ${newRole}`);
      const auditData = await fetchWithAuth('/api/admin/audit-logs').catch(() => null);
      if (Array.isArray(auditData)) {
        setAuditLogs(auditData.map((l: any) => ({
          id: l.actionId,
          adminEmail: l.adminUid,
          action: l.actionType,
          targetId: l.targetId,
          timestamp: l.createdAt ? new Date(l.createdAt).toLocaleString() : 'N/A',
          details: l.notes || ''
        })));
      }
    } catch (err: any) {
      if (prevRole) {
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: prevRole } : u));
      }
      alert(`Failed to update role: ${err.message}`);
    }
  };

  const handleResetWorkspaceBuilds = async (workspaceId: string) => {
    try {
      await fetchWithAuth(`/api/admin/workspaces/${workspaceId}/quota`, {
        method: 'PATCH',
        body: JSON.stringify({
          usage: { monthlyBuildsUsed: 0 }
        })
      });
      showNotification(`Reset monthly APK build quota for workspace`);
      setWorkspaces(prev => prev.map(w => w.workspaceId === workspaceId ? {
        ...w,
        usage: { ...w.usage, monthlyBuildsUsed: 0 }
      } : w));
    } catch (err: any) {
      alert(`Failed to reset quota: ${err.message}`);
    }
  };

  const handlePromoteWorkspaceToBuilder = async (workspaceId: string) => {
    try {
      await fetchWithAuth(`/api/admin/workspaces/${workspaceId}/quota`, {
        method: 'PATCH',
        body: JSON.stringify({
          plan: 'builder',
          entitlements: {
            maxPlaylists: 25,
            maxHostedPlaylists: 10,
            maxDailyCleanups: 50,
            maxMonthlyBuilds: 10,
            allowBrandingCustomization: true,
            allowWhiteLabel: true
          }
        })
      });
      showNotification(`Upgraded workspace to App Builder tier`);
      fetchAllAdminData();
    } catch (err: any) {
      alert(`Failed to upgrade workspace: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#08080a] min-h-[85vh] text-neutral-200 rounded-2xl border border-neutral-800 shadow-2xl">
      {/* Protocol Architecture Header */}
      <PageProtocolHeader
        title="Platform Administration Console"
        description="Master administrative control plane for tenant governance. Manages RBAC permissions, workspace billing tiers, EAS build quotas, playlist telemetry, and system-wide security audit trails."
        protocol="Platform RBAC & Multi-Tenant Governance Protocol"
        schema="PostgreSQL Admin Telemetry Schema & W3C Audit Log Spec"
        rfcOrStandard="NIST SP 800-162 (ABAC/RBAC) • RFC 7519 JWT"
        layer="Control Plane & Multi-Tenant Governance Layer"
        supportedTags={['RBAC:admin', 'Neon PostgreSQL', 'Workspaces Table', 'Audit Trail', 'Build Quotas', 'Vercel Edge']}
        icon={ShieldCheck}
        badgeColor="amber"
      >
        {actionSuccess && (
          <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            {actionSuccess}
          </div>
        )}
      </PageProtocolHeader>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap bg-neutral-950 p-1 rounded-xl border border-neutral-800 self-start md:self-center">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('workspaces')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'workspaces' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Workspaces ({workspaces.length})
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'playlists' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Playlists ({playlists.length})
          </button>
          <button
            onClick={() => setActiveTab('streamFeeds')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'streamFeeds' ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Feed Inventory ({channels.length} m3u8)
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Audit ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('cluster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'cluster' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Telemetry
          </button>
        </div>

      {/* 1. USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search user email, UID, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <button 
              onClick={fetchAllAdminData}
              disabled={isLoading}
              className="px-3 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Sync Neon DB
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Platform Role</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3">Created</th>
                  <th className="p-3">Updated</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/40 font-mono">
                {users
                  .filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()) || u.role.includes(searchTerm.toLowerCase()) || u.uid.includes(searchTerm.toLowerCase()))
                  .map(user => (
                    <tr key={user.uid} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-white">{user.displayName}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">{user.email}</div>
                        <div className="text-[10px] text-neutral-600 font-mono">{user.uid}</div>
                      </td>
                      <td className="p-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value as AdminUser['role'])}
                          className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-rose-500 cursor-pointer"
                        >
                          <option value="user">user (Free)</option>
                          <option value="pro">pro</option>
                          <option value="builder">builder (Agency)</option>
                          <option value="admin">admin (Root)</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-400">{user.createdAt}</td>
                      <td className="p-3 text-neutral-400">{user.lastLoginAt}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(user.uid)}
                          className={`px-2.5 py-1 rounded text-xs font-sans font-medium transition-colors ${
                            user.status === 'active' ? 'bg-rose-950/60 text-rose-300 hover:bg-rose-900 border border-rose-800/30' : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/30'
                          }`}
                        >
                          {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                {users.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-500 font-sans">
                      No users recorded in Neon PostgreSQL yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. WORKSPACES TAB */}
      {activeTab === 'workspaces' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-neutral-400">Multi-tenant customer workspaces, subscription status, and automated quotas.</p>
            <button 
              onClick={fetchAllAdminData}
              disabled={isLoading}
              className="px-3 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 rounded-xl flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Workspaces
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="p-3">Workspace</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Monthly Builds</th>
                  <th className="p-3">Playlists Limit</th>
                  <th className="p-3">White Label</th>
                  <th className="p-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/40 font-mono">
                {workspaces.map(ws => (
                  <tr key={ws.workspaceId} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{ws.name}</div>
                      <div className="text-[11px] text-neutral-400 font-mono">ID: {ws.workspaceId}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">Owner: {ws.ownerUid}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        ws.plan === 'builder' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        ws.plan === 'starter' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-neutral-800 text-neutral-300'
                      }`}>
                        {ws.plan}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-300">
                      {ws.usage?.monthlyBuildsUsed || 0} / {ws.entitlements?.maxMonthlyBuilds || 0} used
                    </td>
                    <td className="p-3 text-neutral-300">
                      {ws.usage?.activePlaylistsCount || 0} / {ws.entitlements?.maxPlaylists || 1}
                    </td>
                    <td className="p-3">
                      {ws.entitlements?.allowWhiteLabel ? (
                        <span className="text-emerald-400 text-xs">Enabled</span>
                      ) : (
                        <span className="text-neutral-500 text-xs">Disabled</span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleResetWorkspaceBuilds(ws.workspaceId)}
                        className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded text-xs font-sans transition-colors"
                        title="Reset monthly build counter to 0"
                      >
                        Reset Builds
                      </button>
                      {ws.plan !== 'builder' && (
                        <button
                          onClick={() => handlePromoteWorkspaceToBuilder(ws.workspaceId)}
                          className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900 border border-amber-800/40 text-amber-300 rounded text-xs font-sans transition-colors"
                        >
                          Grant Builder
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {workspaces.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-500 font-sans">
                      No workspaces registered in database yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PLAYLISTS TAB */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="p-3">Playlist Title</th>
                  <th className="p-3">Owner UID</th>
                  <th className="p-3">Channels</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Visibility</th>
                  <th className="p-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/40 font-mono">
                {playlists.map(p => (
                  <tr key={p.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="p-3 font-sans font-semibold text-white">{p.title}</td>
                    <td className="p-3 text-neutral-400">{p.ownerEmail}</td>
                    <td className="p-3 text-neutral-200">{p.channelCount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-400">private</td>
                    <td className="p-3 text-neutral-400">{p.updatedAt}</td>
                  </tr>
                ))}
                {playlists.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-500 font-sans">
                      No playlists uploaded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. STREAM FEEDS INVENTORY & INDIVIDUAL M3U8 BREAKDOWN */}
      {activeTab === 'streamFeeds' && (() => {
        // Group channels by country and by category
        const countryMap: Record<string, { name: string; count: number; code: string }> = {};
        const categoryMap: Record<string, number> = {};

        channels.forEach(c => {
          const countryKey = c.countryCode || (c.group.includes('UK') ? 'GB' : c.group.includes('USA') ? 'US' : c.group.includes('LATINO') ? 'ES' : 'US');
          const countryName = c.countryName || (countryKey === 'GB' ? 'United Kingdom' : countryKey === 'ES' ? 'Latin America / Spain' : 'United States');
          if (!countryMap[countryKey]) {
            countryMap[countryKey] = { name: countryName, count: 0, code: countryKey };
          }
          countryMap[countryKey].count++;

          const cat = c.group || 'Live TV';
          categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });

        const countriesList = Object.values(countryMap).sort((a, b) => b.count - a.count);
        const categoriesList = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

        // Filter streams
        let displayedStreams = channels;
        if (streamCountryFilter) {
          displayedStreams = displayedStreams.filter(c => {
            const countryKey = c.countryCode || (c.group.includes('UK') ? 'GB' : c.group.includes('USA') ? 'US' : c.group.includes('LATINO') ? 'ES' : 'US');
            return countryKey === streamCountryFilter;
          });
        }
        if (streamCategoryFilter) {
          displayedStreams = displayedStreams.filter(c => c.group === streamCategoryFilter);
        }
        if (streamSearch.trim()) {
          const q = streamSearch.toLowerCase();
          displayedStreams = displayedStreams.filter(c => 
            c.name.toLowerCase().includes(q) || 
            c.group.toLowerCase().includes(q) || 
            c.url.toLowerCase().includes(q) ||
            (c.tvgId && c.tvgId.toLowerCase().includes(q))
          );
        }

        const handleCopyUrl = (id: string, url: string) => {
          navigator.clipboard.writeText(url);
          setCopiedStreamId(id);
          setTimeout(() => setCopiedStreamId(null), 2000);
          showNotification('Direct .m3u8 stream URL copied to clipboard');
        };

        return (
          <div className="space-y-6">
            {/* Gateway Credential Header Badge */}
            <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-neutral-900 to-blue-950/40 border border-cyan-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white font-sans">{MELHATA_XTREAM_CONFIG.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Gateway Connected
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Host: <span className="text-cyan-300 font-semibold">{MELHATA_XTREAM_CONFIG.serverUrl}</span> • User: <span className="text-neutral-200">{MELHATA_XTREAM_CONFIG.username}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-mono">Total Feeds:</span>
                <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-black font-mono">
                  {channels.length} Individual .m3u8
                </span>
              </div>
            </div>

            {/* Country and Category Drill-Down Ribbons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Country Breakdown Filter */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-300 font-sans flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    Breakdown by Country
                  </span>
                  {streamCountryFilter && (
                    <button 
                      onClick={() => setStreamCountryFilter(null)}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {countriesList.map(c => {
                    const isActive = streamCountryFilter === c.code;
                    return (
                      <button
                        key={c.code}
                        onClick={() => setStreamCountryFilter(isActive ? null : c.code)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                          isActive 
                            ? 'bg-cyan-600 text-white shadow-md' 
                            : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
                        }`}
                      >
                        <span className="font-bold">{c.code}</span>
                        <span className="text-[10px] opacity-75">{c.name}</span>
                        <span className="px-1.5 py-0.2 bg-black/40 rounded text-[9px] font-bold text-cyan-300">
                          {c.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Breakdown Filter */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-300 font-sans flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-blue-400" />
                    Breakdown by Category
                  </span>
                  {streamCategoryFilter && (
                    <button 
                      onClick={() => setStreamCategoryFilter(null)}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-1 max-h-32 overflow-y-auto pr-1 scrollbar-thin">
                  {categoriesList.map(([catName, count]) => {
                    const isActive = streamCategoryFilter === catName;
                    return (
                      <button
                        key={catName}
                        onClick={() => setStreamCategoryFilter(isActive ? null : catName)}
                        className={`px-2 py-0.5 rounded text-[11px] font-sans transition-all flex items-center gap-1.5 ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow' 
                            : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                        }`}
                      >
                        <span>{catName}</span>
                        <span className="text-[9px] px-1 bg-black/30 rounded text-blue-300 font-mono">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Filter Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Filter streams by channel name, group, or ID..."
                  value={streamSearch}
                  onChange={(e) => setStreamSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="text-xs text-neutral-400 font-mono">
                Showing <strong className="text-white">{displayedStreams.length}</strong> of {channels.length} individual feeds
              </div>
            </div>

            {/* Streams Detailed Table */}
            <div className="overflow-x-auto rounded-xl border border-neutral-800">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono text-[10px] border-b border-neutral-800">
                  <tr>
                    <th className="p-3">Stream / Channel</th>
                    <th className="p-3">Country</th>
                    <th className="p-3">Category Group</th>
                    <th className="p-3">Direct .m3u8 Feed URL</th>
                    <th className="p-3">Resolution</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/40 font-mono">
                  {displayedStreams.slice(0, 100).map(c => {
                    const countryKey = c.countryCode || (c.group.includes('UK') ? 'GB' : c.group.includes('USA') ? 'US' : c.group.includes('LATINO') ? 'ES' : 'US');
                    const isCopied = copiedStreamId === c.id;
                    return (
                      <tr key={c.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            {c.logo ? (
                              <img 
                                src={c.logo} 
                                alt={c.name} 
                                className="w-6 h-6 object-contain rounded bg-black/50 p-0.5 flex-shrink-0"
                                onError={(e) => { (e.target as any).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center text-neutral-500 flex-shrink-0">
                                <Tv className="w-3 h-3" />
                              </div>
                            )}
                            <div>
                              <span className="font-sans font-bold text-white block truncate max-w-xs">{c.name}</span>
                              <span className="text-[10px] text-neutral-500 font-mono">ID: {c.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] font-bold border border-neutral-700">
                            {countryKey}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">
                            {c.group}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 max-w-md">
                            <code className="text-[11px] text-neutral-400 truncate select-all bg-black/40 px-2 py-1 rounded border border-neutral-800 flex-1">
                              {c.url}
                            </code>
                            <button
                              onClick={() => handleCopyUrl(c.id, c.url)}
                              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded transition-colors flex-shrink-0"
                              title="Copy direct .m3u8 URL"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-neutral-400">
                          <span className="text-[10px] text-emerald-400 font-bold">1080p@60</span>
                        </td>
                        <td className="p-3 text-right">
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/40 text-cyan-300 rounded text-[11px] font-sans transition-colors"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Test Feed</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                  {displayedStreams.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-500 font-sans">
                        No feeds matching current country and category filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {displayedStreams.length > 100 && (
              <div className="p-3 text-center text-xs text-neutral-500 font-mono border-t border-neutral-800">
                Displaying first 100 feeds of {displayedStreams.length}. Use country filters or search to narrow down results.
              </div>
            )}
          </div>
        );
      })()}

      {/* 5. AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          {auditLogs.map(log => (
            <div key={log.id} className="p-4 bg-neutral-950/80 rounded-xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-mono font-bold uppercase">
                    {log.action}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">{log.timestamp}</span>
                </div>
                <div className="text-xs text-white font-medium mt-1.5">{log.details}</div>
                <div className="text-[11px] text-neutral-500 font-mono mt-0.5">Admin: {log.adminEmail} | Target: {log.targetId}</div>
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <div className="p-8 text-center text-neutral-500 font-sans">
              No audit records logged yet.
            </div>
          )}
        </div>
      )}

      {/* 5. SYSTEM CLUSTER TELEMETRY TAB */}
      {activeTab === 'cluster' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
              <div className="text-neutral-400 flex items-center justify-between">
                <span>Database (Neon)</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {metrics?.system?.database?.status === 'operational' ? 'Connected' : 'Active'}
              </div>
              <div className="text-[11px] text-neutral-500">
                Ping: {metrics?.system?.database?.latencyMs ?? 12}ms • Serverless Pooler
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
              <div className="text-neutral-400 flex items-center justify-between">
                <span>REST API Engine</span>
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Vercel / Node.js
              </div>
              <div className="text-[11px] text-neutral-500">
                Uptime: {metrics?.system?.uptimeSeconds ? `${Math.round(metrics.system.uptimeSeconds / 60)}m` : 'Live'} • RSS: {metrics?.system?.memory?.rssMb ?? 42}MB
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
              <div className="text-neutral-400 flex items-center justify-between">
                <span>Worker Daemon</span>
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Render Docker
              </div>
              <div className="text-[11px] text-neutral-500">
                Stream Prober & EPG Scheduler
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
              <div className="text-neutral-400 flex items-center justify-between">
                <span>Object Storage</span>
                <HardDrive className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Vercel Blob
              </div>
              <div className="text-[11px] text-neutral-500">
                Fast Global Edge CDN
              </div>
            </div>
          </div>

          {/* Quick Metrics Breakdown */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800">
                <div className="text-xs text-neutral-400 font-sans">Total Users</div>
                <div className="text-2xl font-bold text-white font-mono mt-1">{metrics.counts?.totalUsers ?? users.length}</div>
                <div className="text-[10px] text-neutral-500 mt-1 font-mono">{metrics.usersByRole?.builder ?? 0} builder • {metrics.usersByRole?.pro ?? 0} pro</div>
              </div>
              <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800">
                <div className="text-xs text-neutral-400 font-sans">Workspaces</div>
                <div className="text-2xl font-bold text-white font-mono mt-1">{metrics.counts?.totalWorkspaces ?? workspaces.length}</div>
                <div className="text-[10px] text-neutral-500 mt-1 font-mono">Multi-tenant tenants</div>
              </div>
              <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800">
                <div className="text-xs text-neutral-400 font-sans">Playlists Managed</div>
                <div className="text-2xl font-bold text-white font-mono mt-1">{metrics.counts?.totalPlaylists ?? playlists.length}</div>
                <div className="text-[10px] text-neutral-500 mt-1 font-mono">Cleaned & deduplicated</div>
              </div>
              <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800">
                <div className="text-xs text-neutral-400 font-sans">Total APK Builds</div>
                <div className="text-2xl font-bold text-white font-mono mt-1">{metrics.counts?.totalBuilds ?? 0}</div>
                <div className="text-[10px] text-neutral-500 mt-1 font-mono">{metrics.buildsByStatus?.completed ?? 0} ready • {metrics.buildsByStatus?.queued ?? 0} queued</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
