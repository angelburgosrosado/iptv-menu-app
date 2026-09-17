/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_LOCKED_CATEGORIES = [
  'xxx',
  'adult',
  'erotic',
  'nsfw',
  'mature',
  '18+',
  'porn',
  'playboy'
];

/**
 * Computes a SHA-256 hash of a 4-digit PIN with salt
 */
export async function hashPin(pin: string): Promise<string> {
  const normalized = pin.trim();
  const salt = 'iptv_menu_parental_salt_v1';
  const text = `${salt}:${normalized}`;

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Deterministic fallback if subtle crypto is unavailable
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return `fallback_${Math.abs(hash).toString(16)}`;
}

/**
 * Compares an entered PIN against a stored hash
 */
export async function verifyPin(pin: string, storedHash: string | null): Promise<boolean> {
  if (!storedHash) return false;
  const computed = await hashPin(pin);
  return computed === storedHash;
}
