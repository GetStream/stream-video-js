import {
  EncryptionSettingsRequestModeEnum,
  EncryptionSettingsResponseModeEnum,
  type CallSettingsResponse,
  type EncryptionSettingsRequest,
} from '@stream-io/video-react-sdk';

/**
 * Settings override that creates a call as end-to-end encrypted, to match the
 * `e2ee: true` flag the SDK sends on join whenever a manager is attached.
 * Without it the backend rejects the join.
 *
 * `auto-on` (E2EE required) rather than `available` (E2EE merely permitted):
 * under `available` some participants could publish unencrypted, so the lock
 * badge would be claiming more than the call guarantees, and gating the Join
 * button on a key would be gating something the call does not actually require.
 */
export const ENCRYPTION_OVERRIDE: EncryptionSettingsRequest = {
  mode: EncryptionSettingsRequestModeEnum.AUTO_ON,
};

/**
 * The single key index this app uses for its shared key.
 *
 * Everyone derives the key from the same passphrase, so everyone has to agree on
 * the index too: a frame carries the index it was encrypted with, and a receiver
 * that looked elsewhere would fail every decrypt. Re-keying reuses this index
 * rather than bumping it - a bump would only be visible to peers told about it.
 */
export const SHARED_KEY_INDEX = 0;

/**
 * Derive the 128-bit AES key every participant shares, from the passphrase in
 * the invite link. The salt and iteration count are part of the wire contract
 * between participants: change either and peers on the old build derive a
 * different key from the same passphrase and nothing decrypts.
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
 * Whether the call these settings describe is end-to-end encrypted.
 *
 * Prefer the `useE2eeEnabled()` hook, which reads the SFU's join response and
 * so reports whether E2EE is actually in effect. This settings-based check
 * exists for the lobby, which runs before the call is joined - at that point the
 * SFU has said nothing and the hook is still `false`, so the requested mode from
 * the coordinator is the only thing to go on.
 */
export const isCallEncrypted = (
  settings: CallSettingsResponse | undefined,
): boolean =>
  settings?.encryption?.mode === EncryptionSettingsResponseModeEnum.AUTO_ON;
