/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Resilient IndexedDB Cache Engine for IPTV.Menu Pro.
 * Provides unlimited client storage for large playlists (50,000+ channels)
 * and multi-megabyte XMLTV EPG datasets, bypassing browser localStorage 5MB caps.
 * Falls back to an in-memory Map if IndexedDB is disabled, restricted, or in headless environments.
 */

const DB_NAME = 'iptv_menu_cache_v1';
const DB_VERSION = 1;
const STORES = ['playlists', 'epg', 'sessions', 'generic'] as const;
export type StoreName = (typeof STORES)[number];

const memoryFallback = new Map<string, any>();

function getMemoryKey(store: StoreName, key: string): string {
  return `${store}:${key}`;
}

class IndexedDbCache {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
  }

  private async getDb(): Promise<IDBDatabase | null> {
    if (!this.isSupported) return null;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          for (const store of STORES) {
            if (!db.objectStoreNames.contains(store)) {
              db.createObjectStore(store);
            }
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (e) => {
          console.warn('[IndexedDB] Failed to open database, using memory fallback:', e);
          resolve(null);
        };

        request.onblocked = () => {
          console.warn('[IndexedDB] Database upgrade blocked');
          resolve(null);
        };
      } catch (err) {
        console.warn('[IndexedDB] Error initializing IndexedDB:', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  public async get<T>(store: StoreName, key: string): Promise<T | null> {
    try {
      const db = await this.getDb();
      if (!db) {
        const val = memoryFallback.get(getMemoryKey(store, key));
        return (val as T) ?? null;
      }

      return new Promise<T | null>((resolve) => {
        try {
          const tx = db.transaction(store, 'readonly');
          const objectStore = tx.objectStore(store);
          const request = objectStore.get(key);

          request.onsuccess = () => {
            resolve((request.result as T) ?? null);
          };

          request.onerror = () => {
            const fallbackVal = memoryFallback.get(getMemoryKey(store, key));
            resolve((fallbackVal as T) ?? null);
          };
        } catch {
          const fallbackVal = memoryFallback.get(getMemoryKey(store, key));
          resolve((fallbackVal as T) ?? null);
        }
      });
    } catch {
      const fallbackVal = memoryFallback.get(getMemoryKey(store, key));
      return (fallbackVal as T) ?? null;
    }
  }

  public async set<T>(store: StoreName, key: string, value: T): Promise<void> {
    // Always write to memory cache as well for ultra-fast sync read & fallback
    memoryFallback.set(getMemoryKey(store, key), value);

    try {
      const db = await this.getDb();
      if (!db) return;

      return new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(store, 'readwrite');
          const objectStore = tx.objectStore(store);
          const request = objectStore.put(value, key);

          request.onsuccess = () => resolve();
          request.onerror = () => {
            console.warn(`[IndexedDB] Failed writing to store ${store} for key ${key}`);
            resolve();
          };
        } catch (err) {
          console.warn(`[IndexedDB] Transaction error for store ${store}:`, err);
          resolve();
        }
      });
    } catch {
      // Memory fallback already recorded
    }
  }

  public async del(store: StoreName, key: string): Promise<void> {
    memoryFallback.delete(getMemoryKey(store, key));

    try {
      const db = await this.getDb();
      if (!db) return;

      return new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(store, 'readwrite');
          const objectStore = tx.objectStore(store);
          const request = objectStore.delete(key);
          request.onsuccess = () => resolve();
          request.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    } catch {
      // No-op
    }
  }

  public async clear(store: StoreName): Promise<void> {
    // Clear matching memory keys
    for (const k of Array.from(memoryFallback.keys())) {
      if (k.startsWith(`${store}:`)) {
        memoryFallback.delete(k);
      }
    }

    try {
      const db = await this.getDb();
      if (!db) return;

      return new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(store, 'readwrite');
          const objectStore = tx.objectStore(store);
          const request = objectStore.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    } catch {
      // No-op
    }
  }

  public isIndexedDbActive(): boolean {
    return this.isSupported;
  }
}

export const indexedDbCache = new IndexedDbCache();
export default indexedDbCache;
