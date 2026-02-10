import { useCallback } from 'react';
import { CallingState } from '@stream-io/video-client';
import {
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';

import { HostView } from './HostView';
import { LoadingIndicator } from '../../../components';
import { CallFeedback } from '../../shared/CallFeedback/CallFeedback';
import { useEmbeddedConfiguration } from '../../context';
import { Lobby } from '../../shared/Lobby/Lobby';
import { useLivestreamSortPreset } from '../../hooks';

export const HostUI = () => {
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

  useLivestreamSortPreset();

  const handleJoin = useCallback(async () => {
    if (!call) return;
    try {
      if (call.state.callingState !== CallingState.JOINED) {
        await call.join();
      }
    } catch (err) {
      console.error('Failed to join call:', err);
      onError?.(err);
    }
  }, [call, onError]);

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
    <HostView
      isLive={isLive}
      isBackstageEnabled={isBackstageEnabled}
      onGoLive={handleGoLive}
      onStopLive={handleStopLive}
    />
  );
};
