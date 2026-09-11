/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { Logger } from '@iptv-menu/logging';
import { AdSenseConfig, AdSenseSlotConfig } from '@iptv-menu/types';

const logger = new Logger('adsense-service');

const DEFAULT_CLIENT_ID = process.env.VITE_ADSENSE_CLIENT_ID || process.env.ADSENSE_CLIENT_ID || 'ca-pub-1578853238313624';

const DEFAULT_SLOTS: AdSenseSlotConfig = {
  topBannerSlot: '8849201938',       // Designated Area: Workspace Top Header
  bottomBannerSlot: '9938102948',    // Designated Area: Workspace Bottom Leaderboard
  sidebarSlot: '7748192031',         // Designated Area: EPG & Sidebar Inspector
  channelListSlot: '6638192042',     // Designated Area: Channel List Inline
  playerOverlaySlot: '5529102831'    // Designated Area: Stream Player / Simulator
};

const DEFAULT_CONFIG: AdSenseConfig = {
  enabled: true,
  clientId: DEFAULT_CLIENT_ID,
  testMode: false,
  autoAdsEnabled: false,
  slots: DEFAULT_SLOTS,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system-default'
};

export class AdSenseService {
  private config: AdSenseConfig;
  private filePath: string;

  constructor() {
    this.filePath = path.resolve(process.cwd(), 'data', 'adsense_config.json');
    this.config = { ...DEFAULT_CONFIG };
    this.loadFromDisk();
  }

  /**
   * Normalizes client publisher ID to ensure ca-pub- format
   */
  public normalizeClientId(raw?: string): string {
    if (!raw) return DEFAULT_CLIENT_ID;
    const clean = raw.trim();
    if (clean.startsWith('ca-pub-')) return clean;
    if (clean.startsWith('pub-')) return `ca-${clean}`;
    if (/^\d+$/.test(clean)) return `ca-pub-${clean}`;
    return clean;
  }

  /**
   * Loads saved configuration from local disk persistence
   */
  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.config = {
            ...DEFAULT_CONFIG,
            ...parsed,
            slots: {
              ...DEFAULT_SLOTS,
              ...(parsed.slots || {})
            },
            clientId: this.normalizeClientId(parsed.clientId)
          };
          logger.info(`Loaded AdSense config from disk (publisher: ${this.config.clientId}, enabled: ${this.config.enabled})`);
          return;
        }
      }
    } catch (err) {
      logger.warn('Could not read adsense_config.json from disk, falling back to defaults', err);
    }
  }

  /**
   * Persists configuration to disk
   */
  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.config, null, 2), 'utf-8');
      logger.info(`Persisted AdSense configuration to ${this.filePath}`);
    } catch (err) {
      logger.warn('Could not persist adsense_config.json to disk', err);
    }
  }

  /**
   * Retrieve active Google AdSense settings
   */
  public async getConfig(): Promise<AdSenseConfig> {
    return { ...this.config, slots: { ...this.config.slots } };
  }

  /**
   * Update Google AdSense settings and persist
   */
  public async updateConfig(updates: {
    clientId?: string;
    enabled?: boolean;
    testMode?: boolean;
    autoAdsEnabled?: boolean;
    slots?: Partial<AdSenseSlotConfig>;
    updatedBy?: string;
  }): Promise<AdSenseConfig> {
    const nextClientId = updates.clientId 
      ? this.normalizeClientId(updates.clientId) 
      : this.config.clientId;

    const mergedSlots: AdSenseSlotConfig = {
      ...this.config.slots,
      ...(updates.slots || {})
    };

    // Sanitize slot values
    for (const key of Object.keys(mergedSlots)) {
      if (typeof mergedSlots[key] === 'string') {
        mergedSlots[key] = (mergedSlots[key] as string).trim();
      }
    }

    this.config = {
      ...this.config,
      clientId: nextClientId,
      enabled: updates.enabled !== undefined ? Boolean(updates.enabled) : this.config.enabled,
      testMode: updates.testMode !== undefined ? Boolean(updates.testMode) : this.config.testMode,
      autoAdsEnabled: updates.autoAdsEnabled !== undefined ? Boolean(updates.autoAdsEnabled) : this.config.autoAdsEnabled,
      slots: mergedSlots,
      updatedAt: new Date().toISOString(),
      updatedBy: updates.updatedBy || 'admin'
    };

    this.saveToDisk();
    return this.getConfig();
  }

  /**
   * Reset to factory defaults
   */
  public async resetToDefaults(): Promise<AdSenseConfig> {
    this.config = { ...DEFAULT_CONFIG, updatedAt: new Date().toISOString() };
    this.saveToDisk();
    return this.getConfig();
  }
}

export const adsenseService = new AdSenseService();
