import { pbkdf2Sync } from 'react-native-quick-crypto';
import {
  Call,
  EncryptionManager,
  EncryptionSettingsRequestModeEnum,
  EncryptionSettingsResponseModeEnum,
  type CallSettingsResponse,
  type EncryptionSettingsRequest,
} from '@stream-io/video-react-native-sdk';
import { mmkvStorage } from '../contexts/createStoreContext';

/**
 * Settings override that creates a call as end-to-end encrypted, to match the
 * `e2ee: true` flag the SDK sends on join whenever a manager is attached.
 * Without it the backend rejects the join.
 *
 * `auto-on` (E2EE required) rather than `available` (E2EE merely permitted):
 * under `available` some participants could publish unencrypted, so a lock
 * indicator would be claiming more than the call guarantees.
 */
const ENCRYPTION_OVERRIDE: EncryptionSettingsRequest = {
  mode: EncryptionSettingsRequestModeEnum.AUTO_ON,
};

/**
 * Whether the call these settings describe is end-to-end encrypted.
 *
 * Prefer the `useE2eeEnabled()` hook, which reads the SFU's join response and so
 * reports whether E2EE is actually in effect. This settings-based check exists
 * for the lobby, which runs before the call is joined - at that point the SFU has
 * said nothing and the hook is still `false`, so the requested mode from the
 * coordinator is the only thing to go on.
 */
export const isCallEncrypted = (
  settings: CallSettingsResponse | undefined,
): boolean =>
  settings?.encryption?.mode === EncryptionSettingsResponseModeEnum.AUTO_ON;

/** The MMKV key the debug UI writes the passphrase to. */
const E2EE_KEY_INPUT_STORE_KEY = 'e2eeKeyInput';

/**
 * The single key index this app uses for its shared key.
 *
 * Everyone derives the key from the same passphrase, so everyone has to agree on
 * the index too: a frame carries the index it was encrypted with, and a receiver
 * that looked elsewhere would fail every decrypt. Re-keying reuses this index
 * rather than bumping it - a bump would only be visible to peers told about it.
 */
const SHARED_KEY_INDEX = 0;

/**
 * Derivation parameters shared with the web and iOS demo apps. The salt and
 * iteration count are part of the contract between participants: change either
 * and peers on another build derive a different key from the same passphrase and
 * nothing decrypts.
 *
 * Known answers, so a change here can be checked in seconds. `fingerprint` is
 * what `requestKeyState()` reports, i.e. the first 8 bytes of SHA-256 over the
 * installed key - so matching it proves the whole path, derivation through the
 * native key store, not just this function:
 *
 * ```
 * passphrase             key                               fingerprint
 * secret                 0471688454b3f5f7b815c11a525e8fac  b4b4a78d820b0893
 * noun-rover-waitress    d30b96af272a8791e237e83571639cf2  e78898acaa1c62cb
 * ```
 */
const PBKDF2_SALT = 'stream-e2ee';
const PBKDF2_ITERATIONS = 100_000;
const AES_128_KEY_BYTES = 16;

/** Read the raw text the user typed, straight from storage. */
const getE2EEKeyInput = (): string | undefined => {
  const stored = mmkvStorage.getString(E2EE_KEY_INPUT_STORE_KEY);
  if (!stored) return undefined;
  try {
    // the store persists every value JSON-encoded
    const parsed = JSON.parse(stored);
    return typeof parsed === 'string' && parsed.trim() ? parsed : undefined;
  } catch {
    return undefined;
  }
};

/** PBKDF2-HMAC-SHA256, matching the react-dogfood byte for byte. */
const deriveKeyFromPassphrase = (passphrase: string): ArrayBuffer =>
  // slice() so the key sits in its own exact-length buffer rather than a view
  // onto whatever the Buffer implementation allocated
  new Uint8Array(
    pbkdf2Sync(
      passphrase,
      PBKDF2_SALT,
      PBKDF2_ITERATIONS,
      AES_128_KEY_BYTES,
      'sha256',
    ),
  ).slice().buffer;

/**
 * Whether calls should be created and joined end-to-end encrypted.
 *
 * Device support is part of the answer, not a separate check: a call created
 * with `auto-on` requires E2EE, so creating one on a device that cannot encrypt
 * would produce a call this client is then rejected from joining.
 */
export const isE2EEConfigured = (): boolean => {
  if (!getE2EEKeyInput()) return false;
  if (!EncryptionManager.isSupported()) {
    console.warn('E2EE key is set but E2EE is not supported on this device');
    return false;
  }
  return true;
};

/**
 * The `settings_override` to create a call with, or `undefined` when E2EE is off.
 *
 * Spread into the create (or `join({ create: true })`) data. Encryption is frozen
 * when the call is created, so this has to be set there rather than at join time.
 *
 * It answers to the same predicate as {@link attachE2EEIfConfigured} on purpose:
 * creating an `auto-on` call this client then cannot encrypt for would produce a
 * call it is rejected from joining.
 */
export const getE2EESettingsOverride = () =>
  isE2EEConfigured() ? { encryption: ENCRYPTION_OVERRIDE } : undefined;

/** Events worth seeing in the log while debugging an interop failure. */
const LOGGED_E2EE_EVENTS = [
  'e2ee.missing_key',
  'e2ee.encryption_failed',
  'e2ee.unencrypted_frame',
  'e2ee.unsupported_version',
  'e2ee.decryption_failed',
  'e2ee.decryption_stalled',
  'e2ee.decryption_resumed',
] as const;

/**
 * Log the key fingerprints and every E2EE event, for cross-platform debugging.
 *
 * An interop failure is otherwise close to invisible from the publishing side: a
 * wrong key still encrypts happily, so nothing local complains and the only
 * evidence lives on the peers who cannot decrypt us. The fingerprint is the first
 * thing to compare - the same passphrase must produce the same 16-hex
 * fingerprint on every SDK - and it is safe to log, being a truncated SHA-256 of
 * the key rather than the key.
 */
const logE2EEDiagnostics = (manager: EncryptionManager) => {
  manager.on('e2ee.key_state', ({ sharedKeys, perUserKeys }) => {
    console.log('[e2ee] key_state', {
      shared: sharedKeys.map(
        (key) =>
          `#${key.keyIndex} ${key.fingerprint}${key.isActive ? ' (active)' : ''}`,
      ),
      perUser: perUserKeys.map(
        (key) => `${key.userId} #${key.keyIndex} ${key.fingerprint}`,
      ),
    });
  });
  LOGGED_E2EE_EVENTS.forEach((event) => {
    manager.on(event, (payload: unknown) => {
      console.log(`[e2ee] ${event}`, payload);
    });
  });
  manager.requestKeyState();
};

/**
 * Replace the shared key on a call that is already joined.
 *
 * Re-using {@link SHARED_KEY_INDEX} replaces the key in place, so correcting a
 * mistyped passphrase does not cost a rejoin: the native side clears its failure
 * count for an index on the first frame that decrypts and reports
 * `e2ee.decryption_resumed`.
 */
export const updateE2EESharedKeys = (call: Call, input: string): void => {
  const manager = call.e2eeManager;
  if (!(manager instanceof EncryptionManager)) return;
  try {
    manager.setSharedKey(SHARED_KEY_INDEX, deriveKeyFromPassphrase(input));
    manager.requestKeyState();
  } catch (error) {
    console.error('Failed to apply the new E2EE key', error);
  }
};

/**
 * Release the encryption manager attached to a call, if it is one of ours.
 *
 * There is no native detach and closing the peer connections does not free the
 * native manager, so unlike on web this cannot be left to garbage collection.
 * `setE2EEManager` accepts any `E2EEManager`, hence the instance check.
 */
export const disposeE2EEManager = (call: Call | undefined) => {
  const manager = call?.e2eeManager;
  if (manager instanceof EncryptionManager) manager.dispose();
};

/**
 * Attach an encryption manager to a call, if the debug menu holds a key.
 *
 * Call it **awaited, immediately before `call.join()`**, the way the web app
 * does: the join request carries the E2EE flag and the peer connections are
 * built with the transforms in place, so `setE2EEManager` throws afterwards.
 * Attaching from the join handler also means the client has long since connected
 * a user, which is what `call.currentUserId` needs.
 *
 * A no-op when no key is configured, so it is safe to call unconditionally.
 *
 * Key derivation lives here rather than in the SDK by design: generating,
 * deriving and distributing keys is the integrator's responsibility.
 */
export const attachE2EEIfConfigured = async (call: Call): Promise<void> => {
  if (!isE2EEConfigured()) {
    // Say so out loud: silence here is ambiguous between "no key set" and "this
    // build has no E2EE code at all", which is a stale bundle rather than a bug.
    console.log('[e2ee] no usable key configured, joining unencrypted');
    return;
  }
  const input = getE2EEKeyInput()!;

  const userId = call.currentUserId;
  if (!userId) {
    // The manager labels the frames it encrypts with the local user, so there is
    // nothing sane to attach before the client has connected one.
    console.warn('Cannot enable E2EE before the user is connected');
    return;
  }

  // Re-joining from the lobby attaches a second manager, and nothing else
  // releases the native side of the first one.
  disposeE2EEManager(call);

  let manager: EncryptionManager | undefined;
  try {
    manager = await EncryptionManager.create(userId);
    manager.setSharedKey(SHARED_KEY_INDEX, deriveKeyFromPassphrase(input));
    console.log(`[e2ee] attaching manager for ${userId}`);
    if (__DEV__) {
      // The remaining interop tests - screen share, simulcast, reconnect - signal
      // pass or fail through `decryption_stalled` / `decryption_resumed`, and a
      // wrong key is otherwise invisible from the publishing side.
      logE2EEDiagnostics(manager);
    }
    call.setE2EEManager(manager);
  } catch (error) {
    manager?.dispose();
    console.error('Failed to enable E2EE for the call', error);
  }
};
