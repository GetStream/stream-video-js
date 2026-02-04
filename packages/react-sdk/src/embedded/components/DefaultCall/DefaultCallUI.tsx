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
  const { skipLobby } = useEmbeddedConfiguration();
  const call = useCall();

  const { useCallCallingState, useLocalParticipant } = useCallStateHooks();
  const callingState = useCallCallingState();
  const localParticipant = useLocalParticipant();

  const hasAutoJoinedRef = useRef(false);

  useEffect(() => {
    if (!call) return;

    if (
      skipLobby &&
      callingState === CallingState.IDLE &&
      !hasAutoJoinedRef.current
    ) {
      hasAutoJoinedRef.current = true;
      call.join().catch((err) => {
        console.error('Failed to auto-join call:', err);
        hasAutoJoinedRef.current = false;
      });
    }
  }, [skipLobby, call, callingState]);

  const handleJoin = useCallback(async () => {
    if (!call) return;

    try {
      if (call.state.callingState !== CallingState.JOINED) {
        await call.join();
      }
    } catch (err) {
      console.error('Failed to join call:', err);
    }
  }, [call]);

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
