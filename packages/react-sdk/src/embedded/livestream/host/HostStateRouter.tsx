import { useCallback } from 'react';
import { CallingState } from '@stream-io/video-client';
import {
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';

import { HostLayout } from './HostLayout';
import { LoadingIndicator } from '../../../components';
import { CallFeedback } from '../../shared/CallFeedback/CallFeedback';
import { useEmbeddedConfiguration } from '../../context';
import { Lobby } from '../../shared/Lobby/Lobby';

export const HostStateRouter = () => {
  const call = useCall();
  const { t } = useI18n();
  const { onError } = useEmbeddedConfiguration();
  const {
    useCallCallingState,
    useIsCallLive,
    useCallSettings,
    useLocalParticipant,
  } = useCallStateHooks();
  const callingState = useCallCallingState();
  const isLive = useIsCallLive();
  const localParticipant = useLocalParticipant();
  const settings = useCallSettings();
  const isBackstageEnabled = settings?.backstage?.enabled ?? true;

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
  }, [call, onError, callingState]);

  const handleGoLive = useCallback(async () => {
    if (!call) return;
    try {
      await call.goLive();
    } catch (err) {
      console.error('Failed to go live:', err);
      onError?.(err);
    }
  }, [call, onError]);

  const handleStopLive = useCallback(async () => {
    if (!call) return;
    try {
      await call.stopLive();
    } catch (err) {
      console.error('Failed to stop live:', err);
      onError?.(err);
    }
  }, [call, onError]);

  if (
    callingState === CallingState.IDLE ||
    callingState === CallingState.UNKNOWN
  ) {
    return (
      <Lobby
        onJoin={handleJoin}
        title={
          isBackstageEnabled
            ? t('Prepare your livestream')
            : t('Ready to go live')
        }
        joinLabel={isBackstageEnabled ? t('Enter Backstage') : t('Go Live')}
      />
    );
  }

  if (callingState === CallingState.JOINING && !localParticipant) {
    return <LoadingIndicator className="str-video__embedded-loading" />;
  }

  if (callingState === CallingState.LEFT) {
    return <CallFeedback onJoin={handleJoin} />;
  }

  return (
    <HostLayout
      isLive={isLive}
      isBackstageEnabled={isBackstageEnabled}
      onGoLive={handleGoLive}
      onStopLive={handleStopLive}
    />
  );
};
