/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface HostRecord {
  origin: string;
  consecutiveFailures: number;
  state: CircuitState;
  lastFailureTime: number;
  openUntilTime: number;
  trialInFlight: boolean;
  totalSuccesses: number;
  totalFastFails: number;
}

export class HostConnectivityFastFailError extends Error {
  public readonly origin: string;
  public readonly waitSecondsRemaining: number;

  constructor(origin: string, waitSecondsRemaining: number) {
    super(`Host ${origin} is temporarily unreachable. Circuit breaker active for ${waitSecondsRemaining}s.`);
    this.name = 'HostConnectivityFastFailError';
    this.origin = origin;
    this.waitSecondsRemaining = waitSecondsRemaining;
  }
}

export interface GuardOptions {
  failureThreshold?: number;    // Consecutive connection failures before tripping (default 2)
  openDurationMs?: number;      // How long to fast-fail in milliseconds (default 30,000ms / 30s)
  happyEyeballsTimeoutMs?: number; // Per-attempt connection timeout (default 2500ms)
}

/**
 * Per-origin Network Circuit Breaker & Connection Health Tracker.
 * Directly extracted from IPTVnator's HostConnectivityGuard architecture.
 * 
 * Prevents cascading UI freezes when an IPTV provider host is down or dropping packets.
 */
export class HostConnectivityGuard {
  private hosts = new Map<string, HostRecord>();
  private failureThreshold: number;
  private openDurationMs: number;

  constructor(options: GuardOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 2;
    this.openDurationMs = options.openDurationMs ?? 30000;
  }

  /**
   * Extracts canonical origin (scheme + host + port).
   * Distinguishes http:// from https:// on the same domain.
   */
  public extractOrigin(targetUrl: string): string {
    try {
      const u = new URL(targetUrl);
      return u.origin;
    } catch {
      // Fallback for relative or proxy-wrapped URLs
      const match = targetUrl.match(/^(https?:\/\/[^/?#]+)/i);
      return match ? match[1].toLowerCase() : 'unknown-origin';
    }
  }

  private getOrCreateRecord(origin: string): HostRecord {
    let rec = this.hosts.get(origin);
    if (!rec) {
      rec = {
        origin,
        consecutiveFailures: 0,
        state: 'CLOSED',
        lastFailureTime: 0,
        openUntilTime: 0,
        trialInFlight: false,
        totalSuccesses: 0,
        totalFastFails: 0
      };
      this.hosts.set(origin, rec);
    }
    return rec;
  }

  /**
   * Checks if an outbound request to the target host is admissible.
   */
  public isHostAdmissible(url: string, skipBreaker = false): { admissible: boolean; waitSecondsRemaining?: number; origin: string } {
    const origin = this.extractOrigin(url);
    if (skipBreaker || origin === 'unknown-origin') {
      return { admissible: true, origin };
    }

    const rec = this.getOrCreateRecord(origin);
    const now = Date.now();

    // 1. If currently OPEN, check if cooldown period has elapsed
    if (rec.state === 'OPEN') {
      if (now >= rec.openUntilTime) {
        // Transition to HALF_OPEN (allow one trial probe)
        rec.state = 'HALF_OPEN';
        rec.trialInFlight = true;
        return { admissible: true, origin };
      } else {
        const remainingSec = Math.max(1, Math.ceil((rec.openUntilTime - now) / 1000));
        rec.totalFastFails++;
        return { admissible: false, waitSecondsRemaining: remainingSec, origin };
      }
    }

    // 2. If HALF_OPEN, allow only 1 trial request at a time
    if (rec.state === 'HALF_OPEN') {
      if (rec.trialInFlight) {
        const remainingSec = Math.max(1, Math.ceil((rec.openUntilTime - now) / 1000));
        rec.totalFastFails++;
        return { admissible: false, waitSecondsRemaining: remainingSec, origin };
      }
      rec.trialInFlight = true;
      return { admissible: true, origin };
    }

    // 3. CLOSED state: healthy, admissible
    return { admissible: true, origin };
  }

  /**
   * Records a successful network response from a host.
   * Any HTTP response (including 4xx/5xx) indicates the host is reachable, resetting the failure streak.
   */
  public reportSuccess(url: string): void {
    const origin = this.extractOrigin(url);
    const rec = this.getOrCreateRecord(origin);
    rec.consecutiveFailures = 0;
    rec.state = 'CLOSED';
    rec.openUntilTime = 0;
    rec.trialInFlight = false;
    rec.totalSuccesses++;
  }

  /**
   * Records a connection-level failure (timeout, network drop, refused port).
   */
  public reportFailure(url: string, error?: any): void {
    const origin = this.extractOrigin(url);
    const rec = this.getOrCreateRecord(origin);
    const now = Date.now();

    rec.consecutiveFailures++;
    rec.lastFailureTime = now;
    rec.trialInFlight = false;

    // Trip circuit breaker if threshold reached
    if (rec.consecutiveFailures >= this.failureThreshold) {
      rec.state = 'OPEN';
      rec.openUntilTime = now + this.openDurationMs;
      console.warn(`[HostConnectivityGuard] Breaker TRIPPED for origin: ${origin} (consecutive failures: ${rec.consecutiveFailures}). Fast-failing for ${this.openDurationMs / 1000}s.`);
    }
  }

  /**
   * Manually resets a host's failure streak (e.g. when user clicks "Retry" or "Refresh").
   */
  public resetHost(url: string): void {
    const origin = this.extractOrigin(url);
    const rec = this.hosts.get(origin);
    if (rec) {
      rec.consecutiveFailures = 0;
      rec.state = 'CLOSED';
      rec.openUntilTime = 0;
      rec.trialInFlight = false;
    }
  }

  /**
   * Resets all tracked hosts.
   */
  public resetAll(): void {
    this.hosts.clear();
  }

  /**
   * Returns a snapshot of all circuit states for HUD telemetry / diagnostics.
   */
  public getAllCircuitStates(): HostRecord[] {
    return Array.from(this.hosts.values());
  }

  /**
   * Returns the circuit record for a specific URL/host.
   */
  public getHostRecord(url: string): HostRecord | undefined {
    const origin = this.extractOrigin(url);
    return this.hosts.get(origin);
  }

  /**
   * Executes an async network operation guarded by the circuit breaker.
   * Fast-fails immediately if the breaker is OPEN.
   */
  public async executeWithBreaker<T>(
    url: string,
    operation: () => Promise<T>,
    options?: { skipBreaker?: boolean; fallbackOnFastFail?: () => Promise<T> }
  ): Promise<T> {
    const check = this.isHostAdmissible(url, options?.skipBreaker);

    if (!check.admissible) {
      if (options?.fallbackOnFastFail) {
        return options.fallbackOnFastFail();
      }
      throw new HostConnectivityFastFailError(check.origin, check.waitSecondsRemaining ?? 30);
    }

    try {
      const result = await operation();
      this.reportSuccess(url);
      return result;
    } catch (err: any) {
      // Don't report failure if it was already a fast-fail error
      if (!(err instanceof HostConnectivityFastFailError)) {
        this.reportFailure(url, err);
      }
      throw err;
    }
  }
}

// Global process-wide singleton
export const hostConnectivityGuard = new HostConnectivityGuard();
