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
