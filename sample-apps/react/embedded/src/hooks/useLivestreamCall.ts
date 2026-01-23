import { useEffect, useState } from 'react';
import {
  CallingState,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

export type UseLivestreamCallProps = {
  onError?: (error: unknown) => void;
};

/**
 * Hook that handles smart join logic for livestream calls.
 * Extracted from LivestreamPlayer - handles join timing based on
 * whether the call is live, the user can join early, or has backstage access.
 */
export const useLivestreamCall = (props: UseLivestreamCallProps = {}) => {
  const { onError } = props;
  const call = useCall();
  const { useIsCallLive, useOwnCapabilities } = useCallStateHooks();
  const canJoinLive = useIsCallLive();
  const canJoinEarly = useCanJoinEarly();
  const canJoinBackstage =
    useOwnCapabilities()?.includes('join-backstage') ?? false;
  const canJoin = canJoinLive || canJoinEarly || canJoinBackstage;

  useEffect(() => {
    if (call && call.state.callingState === CallingState.IDLE && canJoin) {
      call.join().catch((e) => {
        console.error('Failed to join call', e);
        onError?.(e);
      });
    }
  }, [call, canJoin, onError]);

  return call;
};

/**
 * Hook that checks if the user can join the call early based on
 * the `join_ahead_time_seconds` setting.
 */
const useCanJoinEarly = () => {
  const { useCallStartsAt, useCallSettings } = useCallStateHooks();
  const startsAt = useCallStartsAt();
  const settings = useCallSettings();
  const joinAheadTimeSeconds = settings?.backstage.join_ahead_time_seconds;
  const [canJoinEarly, setCanJoinEarly] = useState(() =>
    checkCanJoinEarly(startsAt, joinAheadTimeSeconds),
  );

  useEffect(() => {
    if (!canJoinEarly) {
      const handle = setInterval(() => {
        setCanJoinEarly(checkCanJoinEarly(startsAt, joinAheadTimeSeconds));
      }, 1000);

      return () => clearInterval(handle);
    }
  }, [canJoinEarly, startsAt, joinAheadTimeSeconds]);

  return canJoinEarly;
};

const checkCanJoinEarly = (
  startsAt: Date | undefined,
  joinAheadTimeSeconds: number | undefined,
) => {
  if (!startsAt) {
    return false;
  }

  return Date.now() >= +startsAt - (joinAheadTimeSeconds ?? 0) * 1000;
};
