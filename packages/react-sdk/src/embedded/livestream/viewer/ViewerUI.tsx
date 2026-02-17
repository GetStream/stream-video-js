import { useCallback, useEffect, useState } from 'react';
import { CallingState, OwnCapability } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import { ViewerLobby } from './ViewerLobby';
import { ViewerView } from './ViewerView';
import { LoadingIndicator } from '../../../components';
import { CallFeedback } from '../../shared/CallFeedback/CallFeedback';
import { useEmbeddedConfiguration } from '../../context';
import { useLivestreamLifecycle, useLivestreamSortPreset } from '../../hooks';

const checkCanJoinEarly = (
  startsAt: Date | undefined,
  joinAheadTimeSeconds: number | undefined,
) => {
  if (!startsAt) return false;
  const now = Date.now();
  const earliestJoin = +startsAt - (joinAheadTimeSeconds ?? 0) * 1000;
  return now >= earliestJoin && now < +startsAt;
};

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

export const ViewerUI = () => {
  const call = useCall();
  const { onError } = useEmbeddedConfiguration();
  useLivestreamSortPreset();

  const {
    useCallCallingState,
    useIsCallLive,
    useCallEndedAt,
    useHasPermissions,
    useLocalParticipant,
  } = useCallStateHooks();
  const callingState = useCallCallingState();
  const localParticipant = useLocalParticipant();
  const isLive = useIsCallLive();
  const endedAt = useCallEndedAt();
  const canJoinEndedCall = useHasPermissions(OwnCapability.JOIN_ENDED_CALL);
  const canJoinEarly = useCanJoinEarly();

  const livestreamStatus = useLivestreamLifecycle();

  const handleJoin = useCallback(async () => {
    if (!call) return;
    try {
      if (callingState !== CallingState.JOINED) {
        await call.join();
      }
    } catch (err) {
      console.error('Failed to join call:', err);
      onError?.(err);
      throw err;
    }
  }, [call, callingState, onError]);

  switch (callingState) {
    case CallingState.IDLE:
    case CallingState.UNKNOWN:
      return (
        <ViewerLobby
          onJoin={handleJoin}
          canJoin={isLive || canJoinEarly}
          isLive={isLive}
        />
      );

    case CallingState.JOINING:
      if (!localParticipant) {
        return <LoadingIndicator className="str-video__embedded-loading" />;
      }
      break;

    case CallingState.LEFT: {
      if (livestreamStatus !== 'idle') {
        return (
          <ViewerLobby
            onJoin={handleJoin}
            canJoin={livestreamStatus === 'active'}
            isLive={livestreamStatus === 'active'}
          />
        );
      }

      return (
        <CallFeedback
          onJoin={!endedAt || canJoinEndedCall ? handleJoin : undefined}
        />
      );
    }
  }

  return <ViewerView />;
};
