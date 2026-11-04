import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Call,
  CallingState,
  CallRequest,
  EncryptionManager,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';

import {
  deriveKeyFromPassphrase,
  ENCRYPTION_OVERRIDE,
  SHARED_KEY_INDEX,
} from '../lib/e2ee';
import { meetingId } from '../lib/idGenerators';
import type { LobbyE2EEContextValue } from '../context/LobbyE2EEContext';

export type UseLobbyCallParams = {
  client: StreamVideoClient | undefined;
  callId: string;
  callType: string;
  userId: string | undefined;
  /** Whether the initial call should be created end-to-end encrypted. */
  e2eeEnabled: boolean;
  /** Shared key present in the URL on load (drives the initial E2EE state). */
  initialEncryptionKey: string | undefined;
};

export type UseLobbyCallResult = {
  call: Call | undefined;
  callError: string | null;
  e2eeControls: LobbyE2EEContextValue;
};

/**
 * Owns the join page's active call and the E2EE toggle controls.
 *
 * A call's encryption setting is fixed at creation, so toggling E2EE
 * swaps the active call for a freshly created one (of the same type) *in place*
 * - no navigation, no remount - and rewrites the URL via the History API so the
 * invite link stays shareable. `getOrCreate` is awaited before the swap so the
 * new call is fully ready (no capability race on noise cancellation). The shared
 * key is client-side only, so editing it updates the current call without
 * creating a new one.
 */
export const useLobbyCall = ({
  client,
  callId,
  callType,
  userId,
  e2eeEnabled,
  initialEncryptionKey,
}: UseLobbyCallParams): UseLobbyCallResult => {
  const [call, setCall] = useState<Call>();
  const [callError, setCallError] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | undefined>(
    e2eeEnabled ? initialEncryptionKey : undefined,
  );
  const activeCallRef = useRef<Call | undefined>(undefined);

  // Point the provider tree at `next`, leaving the previous (never-joined) call
  // behind. Swapping the call object in place avoids a navigation/remount.
  const swapCall = useCallback((next: Call) => {
    const prev = activeCallRef.current;
    if (
      prev &&
      prev !== next &&
      prev.state.callingState !== CallingState.LEFT
    ) {
      prev.leave().catch((e) => console.error('Failed to leave call', e));
    }
    activeCallRef.current = next;
    window.call = next;
    setCall(next);
  }, []);

  useEffect(() => {
    if (!client) return;
    const initial = client.call(callType, callId, { reuseInstance: true });
    swapCall(initial);
    // "restricted" is a special call type that only allows the `call_member`
    // role to join the call.
    const data: CallRequest =
      callType === 'restricted'
        ? { members: [{ user_id: userId || '!anon', role: 'call_member' }] }
        : {};
    if (e2eeEnabled) {
      data.settings_override = { encryption: ENCRYPTION_OVERRIDE };
    }
    initial.getOrCreate({ data }).catch((err) => {
      console.error(`Failed to get or create call`, err);
      setCallError(
        err instanceof Error ? err.message : 'Could not get or create call',
      );
    });

    return () => {
      const active = activeCallRef.current;
      if (active && active.state.callingState !== CallingState.LEFT) {
        active.leave().catch((e) => console.error('Failed to leave call', e));
      }
      activeCallRef.current = undefined;
      window.call = undefined;
      setCall(undefined);
    };
  }, [callId, callType, client, e2eeEnabled, userId, swapCall]);

  // Rewrite the URL (call id + shared key) without a Next.js navigation, so the
  // invite link stays shareable and the router's leave-on-route-change handler
  // does not fire.
  const replaceUrl = useCallback((id: string, key: string | undefined) => {
    const url = new URL(window.location.href);
    url.pathname = url.pathname.replace(/[^/]+$/, id);
    if (key) url.searchParams.set('encryption_key', key);
    else url.searchParams.delete('encryption_key');
    window.history.replaceState(window.history.state, '', url.toString());
  }, []);

  // Encryption is fixed at creation, so toggling swaps in a freshly created call
  // of the same type. getOrCreate is awaited so the call is fully ready before it
  // is handed to the providers (no capability race on noise cancellation).
  const switchEncryption = useCallback(
    async (enabled: boolean, key?: string) => {
      if (!client) return;
      const next = client.call(callType, meetingId());
      await next.getOrCreate({
        data: enabled
          ? { settings_override: { encryption: ENCRYPTION_OVERRIDE } }
          : {},
      });
      swapCall(next);
      setEncryptionKey(enabled ? key : undefined);
      replaceUrl(next.id, enabled ? key : undefined);
    },
    [client, callType, swapCall, replaceUrl],
  );

  const e2eeControls = useMemo<LobbyE2EEContextValue>(
    () => ({
      encryptionKey,
      enableEncryption: (key: string) => switchEncryption(true, key),
      disableEncryption: () => switchEncryption(false),
      updateEncryptionKey: (key: string) => {
        setEncryptionKey(key);
        const activeCall = activeCallRef.current;
        if (activeCall) replaceUrl(activeCall.id, key);
        // Before joining there is no manager yet and the key is picked up from
        // state at join time. Once joined, the worker already holds the old key
        // and has to be told about the new one, otherwise correcting a mistyped
        // key would mean rejoining the call. Re-using SHARED_KEY_INDEX replaces
        // the key in place; the worker clears its failure count for that index on
        // the first frame that decrypts and reports `e2ee.decryption_resumed`.
        const manager = activeCall?.e2eeManager;
        if (!(manager instanceof EncryptionManager)) return;
        deriveKeyFromPassphrase(key)
          .then((rawKey) => manager.setSharedKey(SHARED_KEY_INDEX, rawKey))
          .catch((err) =>
            console.error('Failed to apply the new encryption key', err),
          );
      },
    }),
    [encryptionKey, switchEncryption, replaceUrl],
  );

  return { call, callError, e2eeControls };
};
