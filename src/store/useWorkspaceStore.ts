import { create } from 'zustand';
import { fetchWithAuth } from '../lib/apiClient';
import { Workspace } from '@iptv-menu/types';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  
  fetchWorkspaces: () => Promise<void>;
  setActiveWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const workspacesList = await fetchWithAuth('/api/workspaces');
      set({ 
        workspaces: workspacesList,
        activeWorkspace: workspacesList[0] || null,
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setActiveWorkspace: (workspaceId: string) => {
    const ws = get().workspaces.find(w => w.workspaceId === workspaceId) || null;
    set({ activeWorkspace: ws });
  },

  createWorkspace: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const newWs = await fetchWithAuth('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      set(state => ({
        workspaces: [newWs, ...state.workspaces],
        activeWorkspace: newWs,
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  }
}));
