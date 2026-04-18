/**
 * E2EE Key Management
 *
 * Centralizes all encryption key operations for the Stream Video E2EE demo.
 * Uses the `EncryptionManager` from `@stream-io/video-react-sdk`.
 *
 * ## Key Lifecycle
 *
 * 1. `initializeKey()`  — Generate and set initial key when a participant joins
 * 2. `exchangeKeys()`   — Bidirectional key share between new + existing participants
 * 3. `rotateKey()`      — Generate a new key and distribute to all participants
 * 4. `setKeyFromInput()`— Set a key from hex string or passphrase, then distribute
 * 5. `revokeKeys()`     — Remove a departed participant's keys from all others
 *
 * ## Key Transport (Demo vs. Production)
 *
 * All distribution functions accept a {@link SendKeyFn} callback that abstracts
 * how keys are delivered to other participants.
 *
 * **In this demo**, all participants share the same browser tab, so the callback
 * directly calls `EncryptionManager.setKey()` on each recipient.
 *
 * **In production**, participants are on different devices. Implement `SendKeyFn`
 * to deliver keys over your secure channel (REST API, WebSocket, etc.):
 *
 * ```ts
 * // Sending side — wrap your transport
 * const sendKey: SendKeyFn = async (toUserId, fromUserId, keyIndex, key) => {
 *   await fetch('/api/e2ee/keys', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       to: toUserId,
 *       from: fromUserId,
 *       keyIndex,
 *       key: btoa(String.fromCharCode(...new Uint8Array(key))),
 *     }),
 *   });
 * };
 *
 * // Receiving side — listen for key deliveries
 * ws.addEventListener('message', ({ data }) => {
 *   const msg = JSON.parse(data);
 *   if (msg.type === 'e2ee-key') {
 *     const raw = Uint8Array.from(atob(msg.key), (c) => c.charCodeAt(0)).buffer;
 *     e2ee.setKey(msg.from, msg.keyIndex, raw);
 *   }
 * });
 * ```
 *
 * **Security note:** In production, keys should be encrypted in transit
 * (TLS at minimum). For maximum security, wrap keys with per-recipient
 * public keys (ECDH / ECIES) so only the intended recipient can decrypt.
 */

import type { EncryptionManager } from '@stream-io/video-react-sdk';

// ---------------------------------------------------------------------------
// Transport abstraction
// ---------------------------------------------------------------------------

/**
 * Callback invoked when a key needs to be delivered to another participant.
 *
 * The recipient should call `e2ee.setKey(fromUserId, keyIndex, key)` on their
 * own `EncryptionManager` when they receive the key.
 */
export type SendKeyFn = (
  toUserId: string,
  fromUserId: string,
  keyIndex: number,
  key: ArrayBuffer,
) => void;

// ---------------------------------------------------------------------------
// Participant interface (what key functions need)
// ---------------------------------------------------------------------------

/** Key state for a participant — pure data, no SDK references. */
export interface E2EEParticipant {
  userId: string;
  currentKey?: ArrayBuffer;
  keyIndex: number;
}

// ---------------------------------------------------------------------------
// Key generation & derivation
// ---------------------------------------------------------------------------

/** Generate a random 16-byte AES-128 key. */
export const generateKey = (): ArrayBuffer => {
  const key = new ArrayBuffer(16);
  crypto.getRandomValues(new Uint8Array(key));
  return key;
};

/** Convert an ArrayBuffer to a hex string. */
export const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

/** Convert a hex string (32 chars) to a 16-byte ArrayBuffer. */
export const fromHex = (hex: string): ArrayBuffer => {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
};

/** Check if a string is valid 32-character hex. */
export const isValidHex = (value: string): boolean =>
  /^[0-9a-fA-F]{32}$/.test(value);

/**
 * Derive a 16-byte AES-128 key from an arbitrary passphrase using PBKDF2.
 */
export const deriveKeyFromPassphrase = async (
  passphrase: string,
): Promise<ArrayBuffer> => {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode('stream-e2ee'),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    baseKey,
    128,
  );
};

/**
 * Parse user input as either a hex key or a passphrase.
 * - 32-character hex string -> convert directly to 16 bytes
 * - Anything else -> derive via PBKDF2
 */
export const parseKeyInput = async (input: string): Promise<ArrayBuffer> => {
  if (isValidHex(input)) {
    return fromHex(input);
  }
  return deriveKeyFromPassphrase(input);
};

// ---------------------------------------------------------------------------
// Key lifecycle operations
// ---------------------------------------------------------------------------

/**
 * Generate and set an initial key on an EncryptionManager.
 *
 * Call this when a participant first joins a call, **before** distributing
 * the key to other participants.
 *
 * @returns The generated key (pass to `distributeKey` or `exchangeKeys`).
 */
export const initializeKey = (
  e2ee: EncryptionManager,
  userId: string,
): ArrayBuffer => {
  const key = generateKey();
  e2ee.setKey(userId, 0, key.slice(0));
  return key;
};

/**
 * Distribute one participant's current key to all other participants.
 *
 * Each recipient receives a `.slice(0)` copy of the key, which is important
 * when the underlying transport uses `postMessage` (which transfers ownership).
 */
export const distributeKey = (
  from: E2EEParticipant,
  recipients: Array<{ userId: string }>,
  sendKey: SendKeyFn,
): void => {
  if (!from.currentKey) return;
  for (const recipient of recipients) {
    if (recipient.userId === from.userId) continue;
    sendKey(
      recipient.userId,
      from.userId,
      from.keyIndex,
      from.currentKey.slice(0),
    );
  }
};

/**
 * Bidirectional key exchange when a new participant joins.
 *
 * 1. Sends the new participant's key to all existing participants.
 * 2. Sends each existing participant's key to the new participant.
 *
 * **Production note:** In a real application, step 2 is typically
 * event-driven — existing participants send their keys when they receive
 * a "participant joined" event from the call, rather than the joiner
 * pulling keys directly. The `sendKey` callback handles both directions
 * identically, so the adaptation is in your event wiring, not here.
 */
export const exchangeKeys = (
  newParticipant: E2EEParticipant,
  existingParticipants: E2EEParticipant[],
  sendKey: SendKeyFn,
): void => {
  // Give existing participants the new participant's key
  distributeKey(newParticipant, existingParticipants, sendKey);

  // Give the new participant each existing participant's key
  for (const existing of existingParticipants) {
    if (!existing.currentKey) continue;
    sendKey(
      newParticipant.userId,
      existing.userId,
      existing.keyIndex,
      existing.currentKey.slice(0),
    );
  }
};

/**
 * Rotate a participant's encryption key.
 *
 * Generates a new random key, sets it on the participant's own
 * EncryptionManager, and distributes it to all other participants.
 *
 * Pass `{ localOnly: true }` to skip distribution — useful for testing
 * key mismatch / decryption failure scenarios in the demo.
 *
 * @returns The new key and key index.
 */
export const rotateKey = (
  e2ee: EncryptionManager,
  participant: E2EEParticipant,
  allParticipants: E2EEParticipant[],
  sendKey: SendKeyFn,
  options?: { localOnly?: boolean },
): { key: ArrayBuffer; keyIndex: number } => {
  const key = generateKey();
  const keyIndex = participant.keyIndex + 1;

  // Set on own manager
  e2ee.setKey(participant.userId, keyIndex, key.slice(0));

  // Distribute to others (unless local-only)
  if (!options?.localOnly) {
    distributeKey(
      { ...participant, currentKey: key, keyIndex },
      allParticipants,
      sendKey,
    );
  }

  return { key, keyIndex };
};

/**
 * Set a participant's key from user input (hex string or passphrase)
 * and distribute to all other participants.
 *
 * Async because passphrase input requires PBKDF2 derivation.
 */
export const setKeyFromInput = async (
  e2ee: EncryptionManager,
  participant: E2EEParticipant,
  input: string,
  allParticipants: E2EEParticipant[],
  sendKey: SendKeyFn,
  options?: { localOnly?: boolean },
): Promise<{ key: ArrayBuffer; keyIndex: number }> => {
  const key = await parseKeyInput(input);
  const keyIndex = participant.keyIndex + 1;

  // Set on own manager
  e2ee.setKey(participant.userId, keyIndex, key.slice(0));

  // Distribute to others (unless local-only)
  if (!options?.localOnly) {
    distributeKey(
      { ...participant, currentKey: key, keyIndex },
      allParticipants,
      sendKey,
    );
  }

  return { key, keyIndex };
};

/**
 * Remove a departed participant's keys from all remaining participants.
 *
 * This is always a local operation — each participant removes the departed
 * user's keys from their own EncryptionManager. No transport needed.
 */
export const revokeKeys = (
  departedUserId: string,
  managers: EncryptionManager[],
): void => {
  for (const e2ee of managers) {
    e2ee.removeKeys(departedUserId);
  }
};
