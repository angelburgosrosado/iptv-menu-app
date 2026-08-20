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
  Database
} from 'lucide-react';
import { fetchWithAuth } from '../../lib/apiClient';

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

interface AuditLogEntry {
  id: string;
  adminEmail: string;
  action: string;
  targetId: string;
  timestamp: string;
  details: string;
}

const MOCK_USERS: AdminUser[] = [
  {
    uid: 'usr-001',
    email: 'admin@abglco.com',
    displayName: 'Chief Administrator',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-10',
    lastLoginAt: '2026-08-19 18:40',
    playlistsCount: 14
  },
  {
    uid: 'usr-002',
    email: 'operations@stream-hub.io',
    displayName: 'Streaming Hub Ops',
    role: 'builder',
    status: 'active',
    createdAt: '2026-03-15',
    lastLoginAt: '2026-08-19 14:12',
    playlistsCount: 6
  },
  {
    uid: 'usr-003',
    email: 'streamer88@gmail.com',
    displayName: 'Carlos Rivera',
    role: 'pro',
    status: 'active',
    createdAt: '2026-06-02',
    lastLoginAt: '2026-08-18 09:25',
    playlistsCount: 3
  },
  {
    uid: 'usr-004',
    email: 'flagged_user@botmail.net',
    displayName: 'Bulk Scraper Test',
    role: 'user',
    status: 'suspended',
    createdAt: '2026-07-29',
    lastLoginAt: '2026-07-30 02:11',
    playlistsCount: 22
  }
];

const MOCK_PLAYLISTS: AdminPlaylist[] = [
  {
    id: 'pl-8812',
    title: 'Global Sports & Premium 4K Feeds',
    ownerEmail: 'operations@stream-hub.io',
    channelCount: 148,
    sizeBytes: 412000,
    status: 'ready',
    updatedAt: '2026-08-19'
  },
  {
    id: 'pl-8813',
    title: 'Global Sports & Premium 4K Feeds',
    ownerEmail: 'streamer88@gmail.com',
    channelCount: 3820,
    sizeBytes: 9840000,
    status: 'ready',
    updatedAt: '2026-08-18'
  },
  {
    id: 'pl-8814',
    title: 'Documentary & Nature 24/7 Streams',
    ownerEmail: 'admin@abglco.com',
    channelCount: 24,
    sizeBytes: 94000,
    status: 'ready',
    updatedAt: '2026-08-15'
  }
];

const MOCK_AUDIT: AuditLogEntry[] = [
  {
    id: 'log-9901',
    adminEmail: 'admin@abglco.com',
    action: 'USER_ROLE_UPDATE',
    targetId: 'usr-002',
    timestamp: '2026-08-19 14:00',
    details: 'Promoted role to builder for multi-tenant streaming integration'
  },
  {
    id: 'log-9902',
    adminEmail: 'admin@abglco.com',
    action: 'USER_SUSPEND',
    targetId: 'usr-004',
    timestamp: '2026-07-30 03:00',
    details: 'Suspended account due to excessive M3U scraper requests'
  }
];

export default function SystemAdminConsole() {
  const [activeTab, setActiveTab] = React.useState<'users' | 'playlists' | 'audit' | 'cluster'>('users');
  const [users, setUsers] = React.useState<AdminUser[]>(MOCK_USERS);
  const [playlists, setPlaylists] = React.useState<AdminPlaylist[]>(MOCK_PLAYLISTS);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogEntry[]>(MOCK_AUDIT);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleToggleUserStatus = (uid: string) => {
    setUsers(prev => prev.map(u => {
      if (u.uid === uid) {
        const nextStatus = u.status === 'active' ? 'suspended' : 'active';
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleRoleChange = (uid: string, newRole: AdminUser['role']) => {
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#08080a] min-h-[85vh] text-neutral-200 rounded-2xl border border-neutral-800 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-neutral-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[10px] font-mono uppercase font-bold">
              Root Authority
            </span>
            <span className="text-xs text-neutral-400 font-mono">System Admin Gateway</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 tracking-tight">Platform Master Console</h1>
          <p className="text-xs text-neutral-400">Manage global users, quota allocations, playlist archives, and audit activity.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 self-start md:self-center">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'playlists' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Playlists ({playlists.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('cluster')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'cluster' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Cluster Health
          </button>
        </div>
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
            <button className="px-3 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 rounded-xl flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Firestore
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Playlists</th>
                  <th className="p-3">Last Active</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/40 font-mono">
                {users
                  .filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()) || u.role.includes(searchTerm.toLowerCase()))
                  .map(user => (
                    <tr key={user.uid} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-white">{user.displayName}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">{user.email}</div>
                      </td>
                      <td className="p-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value as AdminUser['role'])}
                          className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-rose-500"
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
                      <td className="p-3 text-neutral-300">{user.playlistsCount}</td>
                      <td className="p-3 text-neutral-400">{user.lastLoginAt}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(user.uid)}
                          className={`px-2.5 py-1 rounded text-xs font-sans font-medium transition-colors ${
                            user.status === 'active' ? 'bg-rose-950/60 text-rose-300 hover:bg-rose-900' : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900'
                          }`}
                        >
                          {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. PLAYLISTS TAB */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="p-3">Playlist Title</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Channels</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/40 font-mono">
                {playlists.map(p => (
                  <tr key={p.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="p-3 font-sans font-semibold text-white">{p.title}</td>
                    <td className="p-3 text-neutral-400">{p.ownerEmail}</td>
                    <td className="p-3 text-neutral-200">{p.channelCount.toLocaleString()}</td>
                    <td className="p-3 text-neutral-400">{(p.sizeBytes / 1024).toFixed(1)} KB</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-400">{p.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          {auditLogs.map(log => (
            <div key={log.id} className="p-4 bg-neutral-950/80 rounded-xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-mono font-bold uppercase">
                    {log.action}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">{log.timestamp}</span>
                </div>
                <div className="text-xs text-white font-medium mt-1.5">{log.details}</div>
                <div className="text-[11px] text-neutral-500 font-mono mt-0.5">Executor: {log.adminEmail} | Target: {log.targetId}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. CLUSTER HEALTH TAB */}
      {activeTab === 'cluster' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
            <div className="text-neutral-400 flex items-center justify-between">
              <span>API Gateway (Express)</span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-white">Online (Healthy)</div>
            <div className="text-[11px] text-neutral-500">Node.js 22 • Cloud Run instance</div>
          </div>

          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
            <div className="text-neutral-400 flex items-center justify-between">
              <span>Async Queue Worker</span>
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div className="text-lg font-bold text-white">Active Polling</div>
            <div className="text-[11px] text-neutral-500">M3U Parsing & Deduplication Daemon</div>
          </div>

          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
            <div className="text-neutral-400 flex items-center justify-between">
              <span>Storage Buckets</span>
              <HardDrive className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg font-bold text-white">GCS Ready</div>
            <div className="text-[11px] text-neutral-500">Signed URLs & APK Build Artifacts</div>
          </div>
        </div>
      )}
    </div>
  );
}
