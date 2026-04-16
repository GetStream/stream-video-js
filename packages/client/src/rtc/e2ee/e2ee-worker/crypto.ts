import { FAILURE_TOLERANCE } from './constants';
import type { ResolvedKey } from './types';

const textEncoder = new TextEncoder();
const toKey = (userId: string, keyIndex: number): string =>
  `${userId}:${keyIndex}`;

/** Map<userId, Map<keyIndex, CryptoKey>> */
const keyStore = new Map<string, Map<number, CryptoKey>>();
/** Map<userId, Map<keyIndex, Uint8Array>> — raw bytes for debug introspection */
const rawKeyStore = new Map<string, Map<number, Uint8Array>>();
/** Map<userId, number> — latest key index for encoding */
const latestKeyIndex = new Map<string, number>();
/** Map<userId, number> — monotonic frame counter for encoding */
const frameCounters = new Map<string, number>();

/** Shared fallback: used when no per-user key is set for a given userId. */
let sharedKey: ResolvedKey | null = null;

export const getKey = (
  userId: string,
  keyIndex: number,
): CryptoKey | undefined => {
  const perUser = keyStore.get(userId)?.get(keyIndex);
  if (perUser) return perUser;
  if (sharedKey && keyIndex === sharedKey.keyIndex) return sharedKey.key;
  return undefined;
};

export const getLatestKey = (userId: string): ResolvedKey | null => {
  const idx = latestKeyIndex.get(userId);
  if (idx !== undefined) {
    const key = keyStore.get(userId)?.get(idx);
    if (key) return { key, keyIndex: idx };
  }
  return sharedKey;
};

export const getSharedKey = () => sharedKey;

/**
 * Cached IV prefixes — Map<"userId:keyIndex", Uint8Array(8)>.
 * The first 8 bytes of the 12-byte AES-GCM IV are derived from
 * SHA-256(rawKey + userId). Cached per (userId, keyIndex) pair.
 */
const ivPrefixes = new Map<string, Uint8Array>();
let sharedRawKeyBytes: Uint8Array | null = null;

const computeIVPrefix = async (
  rawKeyBytes: Uint8Array,
  userId: string,
): Promise<Uint8Array> => {
  const userIdBytes = textEncoder.encode(userId);
  const combined = new Uint8Array(rawKeyBytes.length + userIdBytes.length);
  combined.set(rawKeyBytes, 0);
  combined.set(userIdBytes, rawKeyBytes.length);
  const hash = await crypto.subtle.digest('SHA-256', combined);
  return new Uint8Array(hash, 0, 8);
};

export const getIVPrefix = (
  userId: string,
  keyIndex: number,
): Uint8Array | null => {
  return ivPrefixes.get(toKey(userId, keyIndex)) || null;
};

export const ensureIVPrefix = async (userId: string, keyIndex: number) => {
  const cacheKey = toKey(userId, keyIndex);
  if (ivPrefixes.has(cacheKey)) return;
  if (sharedKey && keyIndex === sharedKey.keyIndex && sharedRawKeyBytes) {
    const prefix = await computeIVPrefix(sharedRawKeyBytes, userId);
    ivPrefixes.set(cacheKey, prefix);
  }
};

/** Fill a pre-allocated IV buffer: [8-byte prefix][4-byte frame counter BE]. */
export const fillIV = (
  iv: Uint8Array,
  ivView: DataView,
  prefix: Uint8Array,
  frameCounter: number,
) => {
  iv.set(prefix, 0);
  ivView.setUint32(8, frameCounter);
};

export const nextFrameCounter = (userId: string): number => {
  const c = (frameCounters.get(userId) || 0) + 1;
  frameCounters.set(userId, c);
  return c;
};

/** Map<"userId:keyIndex", number> — consecutive failure count */
const decryptionFailureCounts = new Map<string, number>();

export const isKeyInvalid = (userId: string, keyIndex: number): boolean => {
  return (
    (decryptionFailureCounts.get(toKey(userId, keyIndex)) || 0) >
    FAILURE_TOLERANCE
  );
};

export const recordDecryptionFailure = (userId: string, keyIndex: number) => {
  const k = toKey(userId, keyIndex);
  decryptionFailureCounts.set(k, (decryptionFailureCounts.get(k) || 0) + 1);
};

export const hasDecryptionFailures = (
  userId: string,
  keyIndex: number,
): boolean => decryptionFailureCounts.has(toKey(userId, keyIndex));

export const resetDecryptionFailures = (userId: string, keyIndex: number) => {
  decryptionFailureCounts.delete(toKey(userId, keyIndex));
};

const clearDecryptionFailures = (userId: string) => {
  for (const key of decryptionFailureCounts.keys()) {
    if (key.startsWith(`${userId}:`)) decryptionFailureCounts.delete(key);
  }
};

export const importKey = async (
  userId: string,
  keyIndex: number,
  rawKey: ArrayBuffer,
) => {
  try {
    const rawKeyBytes = new Uint8Array(rawKey);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM', length: 128 },
      false,
      ['encrypt', 'decrypt'],
    );
    if (!keyStore.has(userId)) keyStore.set(userId, new Map());
    keyStore.get(userId)!.set(keyIndex, cryptoKey);
    if (!rawKeyStore.has(userId)) rawKeyStore.set(userId, new Map());
    rawKeyStore.get(userId)!.set(keyIndex, rawKeyBytes);
    latestKeyIndex.set(userId, keyIndex);

    const prefix = await computeIVPrefix(rawKeyBytes, userId);
    ivPrefixes.set(toKey(userId, keyIndex), prefix);
    resetDecryptionFailures(userId, keyIndex);
  } catch (e: any) {
    self.postMessage({
      type: 'error',
      message: `Failed to import key for user ${userId}: ${e.message}`,
    });
  }
};

export const importSharedKey = async (
  keyIndex: number,
  rawKey: ArrayBuffer,
) => {
  try {
    sharedRawKeyBytes = new Uint8Array(rawKey);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM', length: 128 },
      false,
      ['encrypt', 'decrypt'],
    );
    sharedKey = { key: cryptoKey, keyIndex };
    for (const key of ivPrefixes.keys()) {
      if (!keyStore.has(key.split(':')[0])) ivPrefixes.delete(key);
    }
    decryptionFailureCounts.clear();
  } catch (e: any) {
    self.postMessage({
      type: 'error',
      message: `Failed to import shared key: ${e.message}`,
    });
  }
};

export const removeKeys = (userId: string) => {
  keyStore.delete(userId);
  rawKeyStore.delete(userId);
  latestKeyIndex.delete(userId);
  frameCounters.delete(userId);
  for (const key of ivPrefixes.keys()) {
    if (key.startsWith(`${userId}:`)) ivPrefixes.delete(key);
  }
  clearDecryptionFailures(userId);
};

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

/** Dump all key state for debug introspection. */
export const dumpKeyState = () => {
  const perUserKeys: Array<{
    userId: string;
    keyIndex: number;
    keyHex: string;
  }> = [];
  for (const [userId, keys] of rawKeyStore) {
    for (const [keyIndex, rawBytes] of keys) {
      perUserKeys.push({ userId, keyIndex, keyHex: toHex(rawBytes) });
    }
  }
  return {
    perUserKeys,
    sharedKey: sharedRawKeyBytes
      ? { keyIndex: sharedKey!.keyIndex, keyHex: toHex(sharedRawKeyBytes) }
      : null,
  };
};

/** Clear all state — called on worker dispose. */
export const dispose = () => {
  keyStore.clear();
  rawKeyStore.clear();
  latestKeyIndex.clear();
  frameCounters.clear();
  ivPrefixes.clear();
  decryptionFailureCounts.clear();
  sharedRawKeyBytes = null;
  sharedKey = null;
};
