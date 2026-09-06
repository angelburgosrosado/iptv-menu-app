import { describe, it, expect, vi } from 'vitest';
import { checkWorkspaceQuota } from '../apps/api/src/middleware/workspaceGuard';
import { Workspace } from '@iptv-menu/types';

describe('Workspace Quota & Entitlement Middleware', () => {
  const createMockWorkspace = (overrides?: Partial<Workspace>): Workspace => ({
    workspaceId: 'ws_test_123',
    name: 'Test Workspace',
    ownerUid: 'user_123',
    plan: 'free',
    subscriptionStatus: 'active',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    entitlements: {
      maxPlaylists: 1,
      maxHostedPlaylists: 0,
      maxDailyCleanups: 1,
      maxMonthlyBuilds: 0,
      allowBrandingCustomization: false,
      allowWhiteLabel: false,
      ...overrides?.entitlements
    },
    usage: {
      activePlaylistsCount: 0,
      activeHostedPlaylistsCount: 0,
      dailyCleanupsUsed: 0,
      monthlyBuildsUsed: 0,
      ...overrides?.usage
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  });

  it('should return 500 if workspace context is missing from request', () => {
    const middleware = checkWorkspaceQuota('maxPlaylists');
    const req: any = {};
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Workspace context missing') }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 402 if paid subscription is inactive', () => {
    const middleware = checkWorkspaceQuota('maxPlaylists');
    const req: any = {
      workspace: createMockWorkspace({
        plan: 'starter',
        subscriptionStatus: 'canceled'
      })
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(402);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Payment required') }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should block boolean feature when disabled and allow when enabled', () => {
    const middleware = checkWorkspaceQuota('allowWhiteLabel');
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    // 1. Blocked on Free Plan
    const reqBlocked: any = {
      workspace: createMockWorkspace({
        entitlements: {
          maxPlaylists: 1,
          maxHostedPlaylists: 0,
          maxDailyCleanups: 1,
          maxMonthlyBuilds: 0,
          allowBrandingCustomization: false,
          allowWhiteLabel: false
        }
      })
    };

    middleware(reqBlocked, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Upgrade required') }));
    expect(next).not.toHaveBeenCalled();

    // 2. Allowed on Builder Plan
    vi.clearAllMocks();
    const reqAllowed: any = {
      workspace: createMockWorkspace({
        plan: 'builder',
        entitlements: {
          maxPlaylists: 20,
          maxHostedPlaylists: 10,
          maxDailyCleanups: 50,
          maxMonthlyBuilds: 10,
          allowBrandingCustomization: true,
          allowWhiteLabel: true
        }
      })
    };

    middleware(reqAllowed, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should enforce numeric quota when current usage meets or exceeds limit', () => {
    const middleware = checkWorkspaceQuota('maxPlaylists');
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    // Limit is 1, usage is 1 -> Blocked
    const reqExceeded: any = {
      workspace: createMockWorkspace({
        entitlements: {
          maxPlaylists: 1,
          maxHostedPlaylists: 0,
          maxDailyCleanups: 1,
          maxMonthlyBuilds: 0,
          allowBrandingCustomization: false,
          allowWhiteLabel: false
        },
        usage: {
          activePlaylistsCount: 1,
          activeHostedPlaylistsCount: 0,
          dailyCleanupsUsed: 0,
          monthlyBuildsUsed: 0
        }
      })
    };

    middleware(reqExceeded, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Quota exceeded') }));
    expect(next).not.toHaveBeenCalled();

    // Usage is 0 -> Allowed
    vi.clearAllMocks();
    const reqUnderQuota: any = {
      workspace: createMockWorkspace({
        usage: {
          activePlaylistsCount: 0,
          activeHostedPlaylistsCount: 0,
          dailyCleanupsUsed: 0,
          monthlyBuildsUsed: 0
        }
      })
    };

    middleware(reqUnderQuota, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
