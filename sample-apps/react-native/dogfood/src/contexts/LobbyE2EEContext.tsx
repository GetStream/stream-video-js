import { createContext, useContext } from 'react';

/**
 * The meeting's end-to-end encryption key, mirroring the react-dogfood app.
 *
 * Whether a call is encrypted is decided before the lobby, on the join screen,
 * because a call's encryption setting is fixed when it is created. The shared
 * key is client-side only and belongs to this one call, so editing it never
 * recreates the call. Provided by the meeting screens; consumed by the lobby
 * control, the join flow, the invite link and the in-call key notification.
 */
export type LobbyE2EEContextValue = {
  /** The current shared key, or undefined when none was given. */
  encryptionKey: string | undefined;
  /** Change the shared key of the current call, re-keying it once joined. */
  updateEncryptionKey: (key: string) => void;
};

export const LobbyE2EEContext = createContext<LobbyE2EEContextValue | null>(
  null,
);

/**
 * Returns the meeting's E2EE key controls, or `null` outside a provider (e.g.
 * non-pronto environments where E2EE is not wired, or ringing calls).
 */
export const useLobbyE2EE = (): LobbyE2EEContextValue | null =>
  useContext(LobbyE2EEContext);
