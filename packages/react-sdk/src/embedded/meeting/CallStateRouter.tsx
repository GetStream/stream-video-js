import { useCallback } from 'react';
import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import { useEmbeddedConfiguration } from '../context';
import { useWakeLock } from '../hooks';
import { LoadingIndicator } from '../../components';
import { Lobby } from '../shared/Lobby/Lobby';
import { CallLayout } from './CallLayout';
import { CallFeedback } from '../shared/CallFeedback/CallFeedback';

/**
 * CallStateRouter is the state decider component that manages view state transitions.
 */
export const CallStateRouter = () => {
  const call = useCall();
  useWakeLock();

  const { onError } = useEmbeddedConfiguration();
  const { useCallCallingState, useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const callingState = useCallCallingState();

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

  const handleRejoin = useCallback(() => {
    void handleJoin().catch(() => {});
  }, [handleJoin]);

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
    return <CallFeedback onJoin={handleRejoin} />;
  }

  return <CallLayout />;
};
