import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { CallingState } from '@stream-io/video-client';
import {
  getKeepAliveBackend,
  type KeepAliveBackend,
  keepAliveController,
} from '../utils/keepCallAliveController';

type KeepAliveHold = { owner: string; backend: KeepAliveBackend };

/**
 * This hook is used to keep the call alive in the background for Android.
 *
 * It holds a keep-alive for the active call until the call is left:
 * - calls managed by callingx (ringing calls, or `enableOngoingCalls`) are carried by callingx's
 *   call service, acquired as soon as the call is callingx-managed so the ringing-push hand-off has
 *   no gap;
 * - other calls are carried by the SDK's own foreground service, started once the call is joined
 *   and the app is in the foreground.
 *
 * The backend picked first is kept for the rest of the call.
 */
export const useAndroidKeepCallAliveEffect = () => {
  const holdRef = useRef<KeepAliveHold | undefined>(undefined);

  const call = useCall();
  const activeCallCid = call?.cid;
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const isRingingCall = call?.ringing;

  useEffect((): (() => void) | undefined => {
    if (Platform.OS === 'ios' || !activeCallCid) {
      return undefined;
    }

    const releaseHold = () => {
      const hold = holdRef.current;
      if (!hold) return;
      holdRef.current = undefined;
      keepAliveController.release(hold.owner, hold.backend);
    };

    const isCallEnded =
      callingState === CallingState.IDLE || callingState === CallingState.LEFT;
    if (isCallEnded) {
      releaseHold();
      return undefined;
    }

    const owner = `keepalive:${activeCallCid}`;
    if (holdRef.current?.owner === owner) {
      return undefined;
    }
    // the provider switched to another call
    releaseHold();

    const backend = getKeepAliveBackend(!!isRingingCall);

    const acquire = () => {
      if (holdRef.current) return;
      const hold: KeepAliveHold = { owner, backend };
      holdRef.current = hold;
      keepAliveController.acquire(owner, backend, activeCallCid).then((ok) => {
        // only keep the hold when it was accepted, so that a later render or foregrounding can
        // retry
        if (!ok && holdRef.current === hold) {
          holdRef.current = undefined;
        }
      });
    };

    if (backend === 'callingx') {
      acquire();
      return undefined;
    }

    if (callingState !== CallingState.JOINED) {
      return undefined;
    }
    // The SDK service can only be started while the app is in the foreground.
    if (AppState.currentState === 'active') {
      acquire();
    }
    const sub = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          acquire();
        }
      },
    );
    return () => {
      sub.remove();
    };
  }, [activeCallCid, callingState, isRingingCall]);

  useEffect(() => {
    return () => {
      // release the keep-alive when this effect is unmounted
      const hold = holdRef.current;
      if (hold) {
        holdRef.current = undefined;
        keepAliveController.release(hold.owner, hold.backend);
      }
    };
  }, []);
};
