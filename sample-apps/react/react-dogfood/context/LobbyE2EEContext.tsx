import { createContext, useContext } from 'react';

/**
 * Lobby-facing controls for toggling end-to-end encryption.
 *
 * A call's `encryption.enabled` flag is fixed at creation, so enabling/disabling
 * swaps the active call for a freshly created one (of the same type) in place -
 * no navigation, no remount - and rewrites the URL via the History API so the
 * invite link stays shareable. The shared key is client-side only, so editing it
 * does not create a new call. Provided by the call page; consumed by the lobby
 * control and the join flow.
 */
export type LobbyE2EEContextValue = {
  /** The current shared key, or undefined when E2EE is off. */
  encryptionKey: string | undefined;
  /** Swap in a fresh encrypted call and publish the key. */
  enableEncryption: (key: string) => Promise<void>;
  /** Swap in a fresh unencrypted call. */
  disableEncryption: () => Promise<void>;
  /** Change the shared key on the current (already encrypted) call. */
  updateEncryptionKey: (key: string) => void;
};

export const LobbyE2EEContext = createContext<LobbyE2EEContextValue | null>(
  null,
);

/**
 * Returns the lobby E2EE controls, or `null` outside a provider (e.g. non-pronto
 * environments where E2EE is not wired).
 */
export const useLobbyE2EE = (): LobbyE2EEContextValue | null =>
  useContext(LobbyE2EEContext);
