import { IV_PREFIX_LEN } from './constants';
import { reportError } from './notifications';
import type { ResolvedKey } from './types';

/** Nested rather than a `"userId:keyIndex"` string key, which a colon in the
 * userId would make ambiguous. */
type UserKeyMap<V> = Map<string, Map<number, V>>;

const getOrCreate = <V>(map: UserKeyMap<V>, userId: string): Map<number, V> => {
  let inner = map.get(userId);
  if (!inner) {
    inner = new Map();
    map.set(userId, inner);
  }
  return inner;
};

/** One imported key. Always written and deleted as a unit. */
interface KeyMaterial {
  key: CryptoKey;
  /**
   * Sender-side, fresh per import, so two imports of the same raw key get
   * different prefixes and cannot reuse an IV. Receivers read the prefix off
   * the frame trailer instead.
   */
  ivPrefix: Uint8Array;
  /** First 8 bytes of SHA-256(rawKey). Not reversible, so safe to expose. */
  fingerprint: Uint8Array;
}

const randomBytes = (n: number): Uint8Array => {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return bytes;
};

const fingerprint = async (rawKey: ArrayBuffer): Promise<Uint8Array> => {
  const hash = await crypto.subtle.digest('SHA-256', rawKey);
  return new Uint8Array(hash, 0, 8);
};

/**
 * The buffer length picks the variant; EncryptionManager already validated it
 * as 16 or 32 bytes. Passing `length` keeps WebCrypto unambiguous across
 * browsers.
 */
const aesGcmParams = (rawKey: ArrayBuffer): AesKeyAlgorithm => ({
  name: 'AES-GCM',
  length: rawKey.byteLength * 8,
});

/**
 * Import into a non-extractable CryptoKey, with a fresh random IV prefix and
 * the fingerprint. The fresh prefix is what lets the same raw key be imported
 * again without IV reuse.
 */
const importKeyMaterial = async (rawKey: ArrayBuffer): Promise<KeyMaterial> => {
  const [key, fp] = await Promise.all([
    crypto.subtle.importKey('raw', rawKey, aesGcmParams(rawKey), false, [
      'encrypt',
      'decrypt',
    ]),
    fingerprint(rawKey),
  ]);
  return { key, ivPrefix: randomBytes(IV_PREFIX_LEN), fingerprint: fp };
};

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export class KeyStore {
  private perUserKeys: UserKeyMap<KeyMaterial> = new Map();
  private latestKeyIndex = new Map<string, number>();
  /** Shared receive keys retained by epoch so in-flight frames survive rotation. */
  private sharedKeys = new Map<number, KeyMaterial>();
  /** The shared epoch used for encode fallback. Older retained epochs never win. */
  private activeSharedKeyIndex: number | undefined;

  /**
   * Decryption key for (userId, keyIndex): per-user entry, else the shared key
   * at that index. The keyIndex comes from the frame trailer.
   */
  getKey = (userId: string, keyIndex: number): CryptoKey | undefined => {
    const perUser = this.perUserKeys.get(userId)?.get(keyIndex);
    if (perUser) return perUser.key;
    return this.sharedKeys.get(keyIndex)?.key;
  };

  /**
   * The encode path's only lookup: latest per-user key, else the explicitly
   * active shared key. Retained shared epochs are receive-only. The `ivPrefix`
   * rides along so the encoder never resolves the same material twice.
   */
  getLatestKey = (
    userId: string,
  ): (ResolvedKey & { ivPrefix: Uint8Array }) | null => {
    const idx = this.latestKeyIndex.get(userId);
    if (idx !== undefined) {
      const km = this.perUserKeys.get(userId)?.get(idx);
      if (km) return { key: km.key, keyIndex: idx, ivPrefix: km.ivPrefix };
    }
    if (this.activeSharedKeyIndex === undefined) return null;
    const shared = this.sharedKeys.get(this.activeSharedKeyIndex);
    return shared
      ? {
          key: shared.key,
          keyIndex: this.activeSharedKeyIndex,
          ivPrefix: shared.ivPrefix,
        }
      : null;
  };

  importKey = async (userId: string, keyIndex: number, rawKey: ArrayBuffer) => {
    try {
      getOrCreate(this.perUserKeys, userId).set(
        keyIndex,
        await importKeyMaterial(rawKey),
      );
      this.latestKeyIndex.set(userId, keyIndex);
    } catch (e: any) {
      reportError(
        `Failed to import key for user ${userId}: ${e?.message || e}`,
      );
    }
  };

  importSharedKey = async (keyIndex: number, rawKey: ArrayBuffer) => {
    try {
      const material = await importKeyMaterial(rawKey);
      this.sharedKeys.set(keyIndex, material);
      this.activeSharedKeyIndex = keyIndex;
    } catch (e: any) {
      reportError(`Failed to import shared key: ${e?.message || e}`);
    }
  };

  /**
   * Leaves the frame counters intact on purpose: a reset counter would reuse
   * IVs if the same raw key is imported again later. They live in
   * `frameCounter.ts`, so this cannot reach them even by accident.
   */
  removeKeys = (userId: string) => {
    this.perUserKeys.delete(userId);
    this.latestKeyIndex.delete(userId);
  };

  /**
   * Removes exactly one shared receive epoch. Removing the active epoch also
   * disables shared-key encode fallback; an older epoch is never reactivated
   * implicitly because doing so could resume sending with a retired key.
   */
  removeSharedKey = (keyIndex: number) => {
    this.sharedKeys.delete(keyIndex);
    if (this.activeSharedKeyIndex === keyIndex) {
      this.activeSharedKeyIndex = undefined;
    }
  };

  /**
   * Debug snapshot. Fingerprints only: enough to confirm a sender and receiver
   * hold matching key material, and it exposes no key.
   */
  dump = () => ({
    perUserKeys: Array.from(this.perUserKeys).flatMap(([userId, perKeyIndex]) =>
      Array.from(perKeyIndex, ([keyIndex, km]) => ({
        userId,
        keyIndex,
        fingerprint: toHex(km.fingerprint),
      })),
    ),
    sharedKeys: Array.from(this.sharedKeys, ([keyIndex, material]) => ({
      keyIndex,
      fingerprint: toHex(material.fingerprint),
      isActive: keyIndex === this.activeSharedKeyIndex,
    })),
  });

  /**
   * @internal Test-only. Production teardown is `Worker.terminate()`, which
   * reclaims the whole worker.
   */
  clear = () => {
    this.perUserKeys.clear();
    this.latestKeyIndex.clear();
    this.sharedKeys.clear();
    this.activeSharedKeyIndex = undefined;
  };
}

/** The worker has exactly one. */
export const keyStore = new KeyStore();
