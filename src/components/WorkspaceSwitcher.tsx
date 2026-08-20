import * as React from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { ChevronDown, Plus, LayoutGrid, Check } from 'lucide-react';

export default function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, fetchWorkspaces, setActiveWorkspace, createWorkspace, isLoading } = useWorkspaceStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = React.useState('');

  React.useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    await createWorkspace(newWorkspaceName);
    setNewWorkspaceName('');
    setShowCreateModal(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-3 py-2 w-[180px] bg-zinc-950/40 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-zinc-900/40 transition-all text-left"
      >
        <span className="truncate flex items-center gap-1.5">
          <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
          {activeWorkspace ? activeWorkspace.name : 'No Workspace'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[220px] bg-[#0c0c0e]/95 border border-white/10 rounded-xl shadow-2xl p-1.5 z-[99] backdrop-blur-md animate-fade-in">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 py-1.5">
            Workspaces
          </div>
          
          <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto">
            {workspaces.map((ws) => (
              <button
                key={ws.workspaceId}
                onClick={() => {
                  setActiveWorkspace(ws.workspaceId);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-all ${
                  activeWorkspace?.workspaceId === ws.workspaceId
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="truncate">{ws.name}</span>
                {activeWorkspace?.workspaceId === ws.workspaceId && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-white/5 mt-1.5 pt-1.5">
            <button
              onClick={() => {
                setShowCreateModal(true);
                setIsOpen(false);
              }}
              className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg text-xs font-bold text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-all text-left"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Workspace
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-[#0c0c0e]/90 border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl animate-scale-up"
          >
            <div>
              <h3 className="text-sm font-bold text-white">Create New Workspace</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Organize distinct playlist operators and branding kits.
              </p>
            </div>

            <input
              type="text"
              placeholder="e.g. Reseller Client A"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-all"
              required
            />

            <div className="flex gap-2 justify-end text-xs font-bold mt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
