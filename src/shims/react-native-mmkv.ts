/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface MMKVConfiguration {
  id: string;
  path?: string;
  encryptionKey?: string;
}

const getStorageSafe = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  const memoryStore: Record<string, string> = {};
  return {
    getItem: (k: string) => memoryStore[k] ?? null,
    setItem: (k: string, v: string) => { memoryStore[k] = v; },
    removeItem: (k: string) => { delete memoryStore[k]; },
    clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); },
    get length() { return Object.keys(memoryStore).length; },
    key: (i: number) => Object.keys(memoryStore)[i] ?? null,
  };
};

export class MMKV {
  private id: string;

  constructor(configuration?: MMKVConfiguration) {
    this.id = configuration?.id || 'default_mmkv';
  }

  private getPrefixedKey(key: string): string {
    return `@MMKV:${this.id}:${key}`;
  }

  public set(key: string, value: boolean | string | number): void {
    const storage = getStorageSafe();
    const prefixed = this.getPrefixedKey(key);
    storage.setItem(prefixed, JSON.stringify(value));
  }

  public getString(key: string): string | undefined {
    const storage = getStorageSafe();
    const prefixed = this.getPrefixedKey(key);
    const item = storage.getItem(prefixed);
    if (item === null || item === undefined) return undefined;
    try {
      const parsed = JSON.parse(item);
      return typeof parsed === 'string' ? parsed : item;
    } catch {
      return item;
    }
  }

  public getNumber(key: string): number | undefined {
    const storage = getStorageSafe();
    const prefixed = this.getPrefixedKey(key);
    const item = storage.getItem(prefixed);
    if (item === null || item === undefined) return undefined;
    try {
      const num = Number(JSON.parse(item));
      return isNaN(num) ? undefined : num;
    } catch {
      return undefined;
    }
  }

  public getBoolean(key: string): boolean | undefined {
    const storage = getStorageSafe();
    const prefixed = this.getPrefixedKey(key);
    const item = storage.getItem(prefixed);
    if (item === null || item === undefined) return undefined;
    try {
      const parsed = JSON.parse(item);
      return typeof parsed === 'boolean' ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  public delete(key: string): void {
    const storage = getStorageSafe();
    const prefixed = this.getPrefixedKey(key);
    storage.removeItem(prefixed);
  }

  public clearAll(): void {
    const storage = getStorageSafe();
    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(window.localStorage);
      const prefix = `@MMKV:${this.id}:`;
      keys.forEach((k) => {
        if (k.startsWith(prefix)) {
          window.localStorage.removeItem(k);
        }
      });
    }
  }
}
