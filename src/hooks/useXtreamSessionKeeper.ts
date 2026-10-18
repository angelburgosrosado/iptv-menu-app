/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { authenticateXtreamCodes } from '../utils/xtreamClient';
import { XtreamAccount } from '../types/iptv';

const PING_INTERVAL_MS = 20 * 60 * 1000; // 20 minutes

export function useXtreamSessionKeeper() {
  const { xtreamAccount, setXtreamAccount } = usePlayerStore();
  const [isChecking, setIsChecking] = React.useState(false);
  const [lastVerified, setLastVerified] = React.useState<Date | null>(null);
  const [sessionHealth, setSessionHealth] = React.useState<'active' | 'expired' | 'unreachable' | 'none'>('none');

  const verifyActiveSession = React.useCallback(async (account: XtreamAccount | null) => {
    if (!account || !account.serverUrl || !account.username || !account.password) {
      setSessionHealth('none');
      return;
    }

    setIsChecking(true);
    try {
      const res = await authenticateXtreamCodes(account);
      if (res.success && res.userInfo) {
        setSessionHealth('active');
        setLastVerified(new Date());

        // Check if expiration timestamp or status changed
        const expDate = res.userInfo.exp_date ? new Date(parseInt(res.userInfo.exp_date, 10) * 1000).toISOString() : account.expiresAt;
        if (expDate !== account.expiresAt || account.status !== 'connected') {
          const updated: XtreamAccount = {
            ...account,
            status: 'connected',
            expiresAt: expDate,
            maxConnections: res.userInfo.max_connections ? parseInt(res.userInfo.max_connections, 10) : account.maxConnections,
          };
          setXtreamAccount(updated);
        }
      } else if (res.error?.includes('expired') || res.error?.includes('disabled')) {
        setSessionHealth('expired');
        console.warn('[XtreamSessionKeeper] Session expired or disabled:', res.error);
      } else {
        setSessionHealth('unreachable');
      }
    } catch (err) {
      setSessionHealth('unreachable');
      console.warn('[XtreamSessionKeeper] Background ping failed:', err);
    } finally {
      setIsChecking(false);
    }
  }, [setXtreamAccount]);

  // Periodic heartbeat verification
  React.useEffect(() => {
    if (!xtreamAccount) return;

    // Initial check on mount
    verifyActiveSession(xtreamAccount);

    const interval = setInterval(() => {
      verifyActiveSession(xtreamAccount);
    }, PING_INTERVAL_MS);

    // Re-verify on document focus/visibility recovery
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifyActiveSession(xtreamAccount);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [xtreamAccount, verifyActiveSession]);

  return {
    isChecking,
    lastVerified,
    sessionHealth,
    recheckNow: () => verifyActiveSession(xtreamAccount),
  };
}

export default useXtreamSessionKeeper;
