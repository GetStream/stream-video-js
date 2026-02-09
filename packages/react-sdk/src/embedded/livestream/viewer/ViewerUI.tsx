import { useCallback } from 'react';
import { CallingState, OwnCapability } from '@stream-io/video-client';
import {
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';

import { ViewerLobby } from './ViewerLobby';
import { LoadingIndicator } from '../../../components';
import { LivestreamLayout } from '../../../core';
import { CallFeedback } from '../../shared/CallFeedback/CallFeedback';
import { useEmbeddedConfiguration } from '../../context';

export const ViewerUI = () => {
  const call = useCall();
  const { t } = useI18n();
  const { onError } = useEmbeddedConfiguration();

  const {
    useCallCallingState,
    useIsCallLive,
    useCallEndedAt,
    useHasPermissions,
  } = useCallStateHooks();
  const callingState = useCallCallingState();
  const isLive = useIsCallLive();
  const endedAt = useCallEndedAt();
  const canJoinEndedCall = useHasPermissions(OwnCapability.JOIN_ENDED_CALL);

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

  if (endedAt && !canJoinEndedCall) {
    return (
      <div className="str-video__embedded-call-feedback">
        <div className="str-video__embedded-call-feedback__container">
          <h2 className="str-video__embedded-call-feedback__title">
            {t('The livestream has ended')}
          </h2>
        </div>
      </div>
    );
  }

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
