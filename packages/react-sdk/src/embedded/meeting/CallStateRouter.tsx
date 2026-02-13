import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import { useWakeLock } from '../hooks';
import { LoadingIndicator } from '../../components';
import { Lobby } from '../shared/Lobby/Lobby';
import { CallLayout } from './CallLayout';
import { CallFeedback } from '../shared/CallFeedback/CallFeedback';
import { useCallback } from 'react';

/**
 * CallStateRouter is the state decider component that manages view state transitions.
 */
export const CallStateRouter = () => {
  const call = useCall();
  useWakeLock();

  const { useCallCallingState, useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const callingState = useCallCallingState();

  const handleJoin = useCallback(async () => {
    if (!call) return;
    if (callingState !== CallingState.JOINED) {
      await call.join();
    }
  }, [call, callingState]);

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
