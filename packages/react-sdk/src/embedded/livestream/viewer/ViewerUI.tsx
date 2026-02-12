import { useCallback, useEffect, useState } from 'react';
import { CallingState, OwnCapability } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import { ViewerLobby } from './ViewerLobby';
import { LoadingIndicator } from '../../../components';
import { LivestreamLayout } from '../../../core';
import { CallFeedback } from '../../shared/CallFeedback/CallFeedback';
import { useEmbeddedConfiguration } from '../../context';
import { useLivestreamSortPreset } from '../../hooks';

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
  const canJoinAsap = isLive || canJoinEarly;

  const handleJoin = useCallback(async () => {
    if (!call) return;

    try {
      if (call.state.callingState !== CallingState.JOINED) {
        await call.join();
      }
    } catch (err) {
      console.error('Failed to join call:', err);
      onError?.(err, 'join');
      throw err;
    }
  }, [call, onError]);

  const handleRejoin = useCallback(() => {
    void handleJoin().catch(() => {});
  }, [handleJoin]);

  if (
    callingState === CallingState.IDLE ||
    callingState === CallingState.UNKNOWN
  ) {
    return (
      <ViewerLobby onJoin={handleJoin} canJoin={canJoinAsap} isLive={isLive} />
    );
  }

  if (callingState === CallingState.JOINING && !localParticipant) {
    return <LoadingIndicator className="str-video__embedded-loading" />;
  }

  if (callingState === CallingState.LEFT) {
    const canRejoin = canJoinAsap && (!endedAt || canJoinEndedCall);
    return <CallFeedback onJoin={canRejoin ? handleRejoin : undefined} />;
  }

  return (
    <LivestreamLayout
      showParticipantCount
      showDuration
      showLiveBadge
      showSpeakerName
    />
  );
};
