import * as React from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import SystemAdminConsole from '../components/admin/SystemAdminConsole';

interface AdminPageProps {
  onBackToPlayer: () => void;
  onOpenAuth: () => void;
}

export default function AdminPage({ onBackToPlayer, onOpenAuth }: AdminPageProps) {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-6 py-6 px-4 sm:px-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToPlayer}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live TV Player</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>System Administration Mode</span>
        </div>
      </div>

      <ProtectedRoute
        requiredTier="admin"
        fallbackTitle="Administrator Clearance Required"
        fallbackDescription="The Platform Admin console is strictly restricted to system administrators with verified credentials."
        onTriggerAuth={onOpenAuth}
      >
        <SystemAdminConsole />
      </ProtectedRoute>
    </div>
  );
}
