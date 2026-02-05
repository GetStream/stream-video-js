import { useCallback } from 'react';
import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import { useEmbeddedConfiguration } from '../context';
import { LoadingScreen } from '../shared';
import { Lobby } from './lobby/Lobby';
import { ActiveCall } from './ActiveCall';
import { CallFeedback } from './feedback/CallFeedback';

/**
 * CallStateRouter is the state decider component that manages view state transitions.
 */
export const CallStateRouter = () => {
  const call = useCall();

  const { onError } = useEmbeddedConfiguration();
  const { useCallCallingState, useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const callingState = useCallCallingState();

  const handleJoin = useCallback(async () => {
    if (!call) return;

    try {
      if (call.state.callingState !== CallingState.JOINED) {
        await call.join();
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error('Failed to join call:', error);
      onError?.(error);
    }
  }, [call, onError]);

  if (
    callingState === CallingState.IDLE ||
    callingState === CallingState.UNKNOWN
  ) {
    return <Lobby onJoin={handleJoin} />;
  }

  if (callingState === CallingState.JOINING && !localParticipant) {
    return <LoadingScreen />;
  }

  if (callingState === CallingState.LEFT) {
    return <CallFeedback onJoin={handleJoin} />;
  }

  return <ActiveCall />;
};
