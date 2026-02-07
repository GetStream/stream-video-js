import { useCallback } from 'react';
import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import { ViewerLobby } from './ViewerLobby';
import { LoadingIndicator } from '../../../components';
import { LivestreamLayout } from '../../../core';
import { CallFeedback } from '../../shared/CallFeedback/CallFeedback';
import { useEmbeddedConfiguration } from '../../context';

export const ViewerUI = () => {
  const call = useCall();
  const { onError } = useEmbeddedConfiguration();
  const { useCallCallingState, useIsCallLive } = useCallStateHooks();
  const callingState = useCallCallingState();
  const isLive = useIsCallLive();

  const handleJoin = useCallback(async () => {
    if (!call) return;
    try {
      await call.join();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Failed to join call:', error);
      onError?.(error);
    }
  }, [call, onError]);

  if (
    callingState === CallingState.IDLE ||
    callingState === CallingState.UNKNOWN
  ) {
    return <ViewerLobby onJoin={handleJoin} isLive={isLive} />;
  }

  if (callingState === CallingState.JOINING) {
    return <LoadingIndicator className="str-video__embedded-loading" />;
  }

  if (callingState === CallingState.JOINED) {
    return (
      <LivestreamLayout
        showParticipantCount
        showDuration
        showLiveBadge
        showSpeakerName
      />
    );
  }

  if (callingState === CallingState.LEFT) {
    return <CallFeedback onJoin={handleJoin} />;
  }

  return <LoadingIndicator className="str-video__embedded-loading" />;
};
