/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as SecureStore from 'expo-secure-store';

let mmkvInstance: any = null;
try {
  const { MMKV } = require('react-native-mmkv');
  mmkvInstance = new MMKV({ id: 'iptv_user_storage_v1' });
} catch (e) {
  // MMKV fallback handled in memory
}

const memoryStore = new Map<string, string>();

export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    if (mmkvInstance) {
      mmkvInstance.set(key, value);
    } else {
      memoryStore.set(key, value);
    }
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    const val = await SecureStore.getItemAsync(key);
    if (val !== null) return val;
  } catch {
    // fallback
  }

  if (mmkvInstance) {
    return mmkvInstance.getString(key) || null;
  }
  return memoryStore.get(key) || null;
}

export async function deleteSecureItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // fallback
  }
  if (mmkvInstance) {
    mmkvInstance.delete(key);
  } else {
    memoryStore.delete(key);
  }
}

export const syncStorage = {
  getString: (key: string, defaultVal = ''): string => {
    try {
      if (mmkvInstance) return mmkvInstance.getString(key) || defaultVal;
      return memoryStore.get(key) || defaultVal;
    } catch {
      return defaultVal;
    }
  },
  setString: (key: string, val: string): void => {
    try {
      if (mmkvInstance) mmkvInstance.set(key, val);
      else memoryStore.set(key, val);
    } catch (e) {
      console.warn('Storage set error', e);
    }
  },
  getObject: <T>(key: string, defaultVal: T): T => {
    try {
      const raw = mmkvInstance ? mmkvInstance.getString(key) : memoryStore.get(key);
      if (!raw) return defaultVal;
      return JSON.parse(raw);
    } catch {
      return defaultVal;
    }
  },
  setObject: (key: string, val: any): void => {
    try {
      const str = JSON.stringify(val);
      if (mmkvInstance) mmkvInstance.set(key, str);
      else memoryStore.set(key, str);
    } catch (e) {
      console.warn('Storage setObject error', e);
    }
  },
  delete: (key: string): void => {
    try {
      if (mmkvInstance) mmkvInstance.delete(key);
      else memoryStore.delete(key);
    } catch {}
  },
  clear: (): void => {
    try {
      if (mmkvInstance) mmkvInstance.clearAll();
      else memoryStore.clear();
    } catch {}
  }
};
