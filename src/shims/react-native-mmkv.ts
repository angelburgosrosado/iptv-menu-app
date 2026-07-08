/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface MMKVConfiguration {
  id: string;
  path?: string;
  encryptionKey?: string;
}

export class MMKV {
  private id: string;

  constructor(configuration?: MMKVConfiguration) {
    this.id = configuration?.id || 'default_mmkv';
  }

  private getPrefixedKey(key: string): string {
    return `@MMKV:${this.id}:${key}`;
  }

  public set(key: string, value: boolean | string | number): void {
    const prefixed = this.getPrefixedKey(key);
    localStorage.setItem(prefixed, JSON.stringify(value));
  }

  public getString(key: string): string | undefined {
    const prefixed = this.getPrefixedKey(key);
    const item = localStorage.getItem(prefixed);
    if (item === null) return undefined;
    try {
      const parsed = JSON.parse(item);
      return typeof parsed === 'string' ? parsed : item;
    } catch {
      return item;
    }
  }

  public getNumber(key: string): number | undefined {
    const prefixed = this.getPrefixedKey(key);
    const item = localStorage.getItem(prefixed);
    if (item === null) return undefined;
    try {
      const num = Number(JSON.parse(item));
      return isNaN(num) ? undefined : num;
    } catch {
      return undefined;
    }
  }

  public getBoolean(key: string): boolean | undefined {
    const prefixed = this.getPrefixedKey(key);
    const item = localStorage.getItem(prefixed);
    if (item === null) return undefined;
    try {
      const parsed = JSON.parse(item);
      return typeof parsed === 'boolean' ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  public delete(key: string): void {
    const prefixed = this.getPrefixedKey(key);
    localStorage.removeItem(prefixed);
  }

  public clearAll(): void {
    const keys = Object.keys(localStorage);
    const prefix = `@MMKV:${this.id}:`;
    keys.forEach((k) => {
      if (k.startsWith(prefix)) {
        localStorage.removeItem(k);
      }
    });
  }
}
