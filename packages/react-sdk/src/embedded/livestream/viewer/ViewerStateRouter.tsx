import { useCallback, useEffect, useState } from 'react';
import { CallingState, OwnCapability } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import { ViewerLobby } from './ViewerLobby';
import { ViewerLayout } from './ViewerLayout';
import { LoadingIndicator } from '../../../components';
import { CallFeedback } from '../../shared/CallFeedback/CallFeedback';
import { useEmbeddedConfiguration } from '../../context';
import { JoinError } from '../../shared/JoinError/JoinError';
import { useIsLivestreamPaused } from '../../hooks';

export const ViewerStateRouter = () => {
  const call = useCall();
  const { onError } = useEmbeddedConfiguration();

  const {
    useCallCallingState,
    useCallEndedAt,
    useHasPermissions,
    useLocalParticipant,
  } = useCallStateHooks();
  const callingState = useCallCallingState();
  const localParticipant = useLocalParticipant();
  const endedAt = useCallEndedAt();
  const canJoinEndedCall = useHasPermissions(OwnCapability.JOIN_ENDED_CALL);

  const isLivestreamPaused = useIsLivestreamPaused();
  const [joinError, setJoinError] = useState(false);
  const handleJoin = useCallback(async () => {
    if (!call) return;

    setJoinError(false);
    try {
      if (callingState !== CallingState.JOINED) {
        await call.join();
      }
    } catch (e) {
      onError?.(e);
      setJoinError(true);
    }
  }, [call, callingState, onError]);

  useEffect(() => {
    if (!call || callingState !== CallingState.LEFT) return;

    return call.on('call.live_started', () => {
      call.get().catch((e) => {
        console.error('Failed to restore call state', e);
      });
    });
  }, [call, callingState]);

  if (joinError) {
    return <JoinError onJoin={handleJoin} />;
  }

  switch (callingState) {
    case CallingState.IDLE:
    case CallingState.UNKNOWN:
      return <ViewerLobby onJoin={handleJoin} />;

    case CallingState.JOINING:
      if (!localParticipant) {
        return <LoadingIndicator className="str-video__embedded-loading" />;
      }
      break;

    case CallingState.LEFT: {
      if (isLivestreamPaused) {
        return <ViewerLobby onJoin={handleJoin} />;
      }

      return (
        <CallFeedback
          onJoin={!endedAt || canJoinEndedCall ? handleJoin : undefined}
        />
      );
    }
  }

  return <ViewerLayout />;
};
