import { useCallback, useEffect, useRef } from 'react';
import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import { Lobby } from './Lobby';
import { CallFeedback } from '../CallFeedback';
import { useEmbeddedConfiguration } from '../../context';
import { ActiveCall } from './ActiveCall';
import { LoadingScreen } from '../shared';

/**
 * DefaultCallUI is the state decider component that manages view state transitions.
 * It determines which view to render (lobby, loading, active-call, feedback)
 * based on calling state and user actions.
 */
const DefaultCallUI = () => {
  const call = useCall();

  const { skipLobby, onError } = useEmbeddedConfiguration();
  const { useCallCallingState, useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const callingState = useCallCallingState();

  const hasAutoJoinedRef = useRef(false);
  useEffect(() => {
    if (!call) return;

    if (
      skipLobby &&
      callingState === CallingState.IDLE &&
      !hasAutoJoinedRef.current
    ) {
      hasAutoJoinedRef.current = true;
      call.join().catch((e) => {
        const error = e instanceof Error ? e : new Error(String(e));
        console.error('Failed to auto-join call:', error);
        onError?.(error);
        hasAutoJoinedRef.current = false;
      });
    }
  }, [skipLobby, call, callingState, onError]);

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
    !skipLobby &&
    (callingState === CallingState.IDLE ||
      callingState === CallingState.UNKNOWN)
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

export default DefaultCallUI;
