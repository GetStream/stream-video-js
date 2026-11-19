import { useEffect, useState } from 'react';
import {
  CallingState,
  OwnCapability,
  SfuModels,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

/**
 * Returns `true` when Stop Live took the viewer out of the call, as opposed
 * to the call ending or the viewer leaving on their own. A user who stays in
 * the call backstage is never marked as paused.
 *
 * Resets to `false` on rejoin, on a call change, or when `call.ended`
 * (real end) arrives.
 */
export const useIsLivestreamPaused = () => {
  const call = useCall();
  const { useCallCallingState, useCallSettings, useHasPermissions } =
    useCallStateHooks();
  const callingState = useCallCallingState();
  const settings = useCallSettings();
  const canJoinBackstage = useHasPermissions(OwnCapability.JOIN_BACKSTAGE);
  // the client keeps these users in the call on Stop Live (`applyLiveEnded`)
  const staysBackstage =
    settings?.backstage?.enabled !== false && canJoinBackstage;
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!call) return;
    setIsPaused(false);
    return call.on('call.ended', () => {
      setIsPaused(false);
    });
  }, [call]);

  useEffect(() => {
    if (!call || staysBackstage) return;

    const unsubSfu = call.on('callEnded', (e) => {
      if (e.reason === SfuModels.CallEndedReason.LIVE_ENDED) {
        setIsPaused(true);
      }
    });

    const unsubError = call.on('error', (e) => {
      if (e.error?.code === SfuModels.ErrorCode.LIVE_ENDED) {
        setIsPaused(true);
      }
    });

    return () => {
      unsubSfu();
      unsubError();
    };
  }, [call, staysBackstage]);

  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      setIsPaused(false);
    }
  }, [callingState]);

  return isPaused;
};
