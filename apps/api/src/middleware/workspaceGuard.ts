import { WorkspaceRepository } from '@iptv-menu/db';
import { Workspace } from '@iptv-menu/types';

const workspaceRepo = new WorkspaceRepository();

/**
 * Middleware that loads the active workspace and attaches it to the request object.
 * Expects workspaceId to be passed in headers ('x-workspace-id').
 */
export async function attachWorkspaceContext(req: any, res: any, next: () => void) {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized: Missing user credentials' });
    }

    if (!workspaceId) {
      // Fallback: Find the first workspace owned by the user
      const workspacesList = await workspaceRepo.listUserWorkspaces(uid);
      if (workspacesList.length === 0) {
        try {
          const newWs = await workspaceRepo.createWorkspace({
            workspaceId: `ws_${Math.random().toString(36).substring(2, 12)}`,
            name: 'Personal Workspace',
            ownerUid: uid,
            plan: 'free',
            subscriptionStatus: 'active',
            entitlements: {
              maxPlaylists: 1,
              maxHostedPlaylists: 0,
              maxDailyCleanups: 1,
              maxMonthlyBuilds: 0,
              allowBrandingCustomization: false,
              allowWhiteLabel: false
            },
            usage: {
              activePlaylistsCount: 0,
              activeHostedPlaylistsCount: 0,
              dailyCleanupsUsed: 0,
              monthlyBuildsUsed: 0
            },
            stripeSubscriptionId: null,
            stripeCustomerId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          req.workspace = newWs;
          return next();
        } catch (wsErr) {
          // If workspace creation failed, return 404
          return res.status(404).json({ error: 'No workspace found. Please create one.' });
        }
      }
      req.workspace = workspacesList[0];
      return next();
    }

    const workspace = await workspaceRepo.getWorkspace(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Verify ownership
    if (workspace.ownerUid !== uid) {
      return res.status(403).json({ error: 'Forbidden: You do not own this workspace' });
    }

    req.workspace = workspace;
    next();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Quota and Feature Gating Middleware Factory
 */
export function checkWorkspaceQuota(key: keyof Workspace['entitlements']) {
  return (req: any, res: any, next: () => void) => {
    const workspace: Workspace = req.workspace;

    if (!workspace) {
      return res.status(500).json({ error: 'Internal Error: Workspace context missing' });
    }

    // 1. Subscription Status Guard
    if (workspace.plan !== 'free' && workspace.subscriptionStatus !== 'active') {
      return res.status(402).json({ error: 'Payment required: Subscription is inactive' });
    }

    // 2. Boolean Feature Gates (e.g. custom branding, white-label)
    const entitlementValue = workspace.entitlements[key];
    if (typeof entitlementValue === 'boolean') {
      if (!entitlementValue) {
        return res.status(403).json({ 
          error: `Upgrade required: Feature [${key}] is not enabled on the ${workspace.plan} plan.` 
        });
      }
      return next();
    }

    // 3. Numeric Quota Gates (e.g. playlist count, builds count)
    if (typeof entitlementValue === 'number') {
      let currentUsage = 0;
      
      if (key === 'maxPlaylists') {
        currentUsage = workspace.usage.activePlaylistsCount;
      } else if (key === 'maxHostedPlaylists') {
        currentUsage = workspace.usage.activeHostedPlaylistsCount;
      } else if (key === 'maxDailyCleanups') {
        currentUsage = workspace.usage.dailyCleanupsUsed;
      } else if (key === 'maxMonthlyBuilds') {
        currentUsage = workspace.usage.monthlyBuildsUsed;
      }

      if (currentUsage >= entitlementValue) {
        return res.status(403).json({ 
          error: `Quota exceeded: Limit for [${key}] is ${entitlementValue}. Current usage: ${currentUsage}. Please upgrade your plan.` 
        });
      }
    }

    next();
  };
}
