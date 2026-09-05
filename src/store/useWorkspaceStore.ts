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

const DEFAULT_WORKSPACE: Workspace = {
  workspaceId: 'ws_default',
  name: 'Personal Workspace',
  ownerUid: 'usr_default',
  plan: 'free',
  subscriptionStatus: 'active',
  entitlements: {
    maxPlaylists: 1,
    maxHostedPlaylists: 0,
    maxDailyCleanups: 1,
    maxMonthlyBuilds: 0,
    allowBrandingCustomization: false,
    allowWhiteLabel: false,
  },
  usage: {
    activePlaylistsCount: 0,
    activeHostedPlaylistsCount: 0,
    dailyCleanupsUsed: 0,
    monthlyBuildsUsed: 0,
  },
  stripeSubscriptionId: null,
  stripeCustomerId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [DEFAULT_WORKSPACE],
  activeWorkspace: DEFAULT_WORKSPACE,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const workspacesList = await fetchWithAuth('/api/workspaces');
      if (Array.isArray(workspacesList) && workspacesList.length > 0) {
        set({ 
          workspaces: workspacesList,
          activeWorkspace: workspacesList[0] || null,
          isLoading: false 
        });
        return;
      }
    } catch (err: any) {
      console.warn('Backend workspaces note:', err.message);
    }
    // Fallback to active personal workspace
    set({
      workspaces: [DEFAULT_WORKSPACE],
      activeWorkspace: DEFAULT_WORKSPACE,
      isLoading: false,
      error: null,
    });
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
      if (newWs && newWs.workspaceId) {
        set(state => ({
          workspaces: [newWs, ...state.workspaces],
          activeWorkspace: newWs,
          isLoading: false
        }));
        return;
      }
    } catch (err: any) {
      console.warn('Backend workspace creation fallback:', err);
    }
    const localWs: Workspace = {
      ...DEFAULT_WORKSPACE,
      workspaceId: `ws_${Math.random().toString(36).substring(2, 8)}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set(state => ({
      workspaces: [localWs, ...state.workspaces],
      activeWorkspace: localWs,
      isLoading: false,
      error: null,
    }));
  }
}));
