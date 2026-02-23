import { useCallback, useEffect } from 'react';
import { CallingState, OwnCapability } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import { ViewerLobby } from './ViewerLobby';
import { ViewerLayout } from './ViewerLayout';
import { LoadingIndicator } from '../../../components';
import { CallFeedback } from '../../shared/CallFeedback/CallFeedback';
import { useEmbeddedConfiguration } from '../../context';
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

  useEffect(() => {
    if (!call || callingState !== CallingState.LEFT) return;

    return call.on('call.live_started', () => {
      call.get().catch((e) => {
        console.error('Failed to restore call state', e);
      });
    });
  }, [call, callingState]);

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
