import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import { LoadingIndicator } from '../../components';
import { CallFeedback, JoinError, Lobby } from '../shared';
import { CallLayout } from './CallLayout';
import { useCallback, useState } from 'react';
import { useEmbeddedConfiguration } from '../context';

/**
 * CallStateRouter is the state decider component that manages view state transitions.
 */
export const CallStateRouter = () => {
  const call = useCall();

  const { useCallCallingState, useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const callingState = useCallCallingState();
  const { onError } = useEmbeddedConfiguration();

  const [joinError, setJoinError] = useState(false);
  const handleJoin = useCallback(async () => {
    if (!call) return;

    setJoinError(false);
    try {
      if (call.state.callingState !== CallingState.JOINED) {
        await call.join();
      }
    } catch (e) {
      onError?.(e);
      setJoinError(true);
    }
  }, [call, onError]);

  if (joinError) {
    return <JoinError onJoin={handleJoin} />;
  }

  if (
    callingState === CallingState.IDLE ||
    callingState === CallingState.UNKNOWN
  ) {
    return <Lobby onJoin={handleJoin} />;
  }

  if (callingState === CallingState.JOINING && !localParticipant) {
    return <LoadingIndicator className="str-video__embedded-loading" />;
  }

  if (callingState === CallingState.LEFT) {
    return <CallFeedback onJoin={handleJoin} />;
  }

  return <CallLayout />;
};
