import { useCallback, useEffect, useRef, useState } from 'react';
import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import { Lobby } from './Lobby';
import { LoadingScreen } from '../shared';
import { CallFeedback } from '../CallFeedback';
import { useEmbeddedConfiguration } from '../../context';
import { ActiveCall } from './ActiveCall';

type ViewState = 'lobby' | 'loading' | 'active-call' | 'feedback';

/**
 * DefaultCallUI is the state decider component that manages view state transitions.
 * It determines which view to render (lobby, loading, active-call, feedback)
 * based on calling state and user actions.
 */
const DefaultCallUI = () => {
  const { skipLobby } = useEmbeddedConfiguration();
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const [hasInitiatedJoin, setHasInitiatedJoin] = useState(false);
  const wasInCallRef = useRef(false);
  const hasAutoJoinedRef = useRef(false);

  useEffect(() => {
    const canAutoJoin =
      callingState === CallingState.IDLE ||
      callingState === CallingState.UNKNOWN;

    if (skipLobby && call && canAutoJoin && !hasAutoJoinedRef.current) {
      hasAutoJoinedRef.current = true;
      setHasInitiatedJoin(true);
      call.join().catch((err) => {
        console.error('Failed to auto-join call:', err);
        setHasInitiatedJoin(false);
        hasAutoJoinedRef.current = false;
      });
    }
  }, [skipLobby, call, callingState]);

  if (callingState === CallingState.JOINED) {
    wasInCallRef.current = true;
  }

  const view: ViewState = (() => {
    if (callingState === CallingState.JOINED) {
      return 'active-call';
    }
    if (callingState === CallingState.LEFT && wasInCallRef.current) {
      return 'feedback';
    }
    if (hasInitiatedJoin) {
      return 'loading';
    }
    return 'lobby';
  })();

  const handleJoin = useCallback(async () => {
    if (!call) return;

    setHasInitiatedJoin(true);

    try {
      if (call.state.callingState !== CallingState.JOINED) {
        await call.join();
      }
    } catch (err) {
      console.error('Failed to join call:', err);
      setHasInitiatedJoin(false);
    }
  }, [call]);

  const handleRejoin = useCallback(async () => {
    if (!call) return;

    wasInCallRef.current = false;
    setHasInitiatedJoin(true);

    try {
      await call.join();
    } catch (err) {
      console.error('Failed to rejoin call:', err);
      setHasInitiatedJoin(false);
      wasInCallRef.current = true;
    }
  }, [call]);

  const handleFeedbackSubmit = useCallback((rating: number) => {
    console.log(rating);
  }, []);

  if (view === 'lobby') {
    return <Lobby onJoin={handleJoin} />;
  }

  if (view === 'loading') {
    return <LoadingScreen />;
  }

  if (view === 'feedback') {
    return (
      <CallFeedback onSubmit={handleFeedbackSubmit} onRejoin={handleRejoin} />
    );
  }

  return <ActiveCall />;
};

export default DefaultCallUI;
