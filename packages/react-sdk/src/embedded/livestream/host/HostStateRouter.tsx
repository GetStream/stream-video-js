import { useCallback, useState } from 'react';
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
import { JoinError } from '../../shared/JoinError/JoinError';

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

  const [joinError, setJoinError] = useState(false);
  const handleJoin = useCallback(async () => {
    if (!call) return;

    setJoinError(false);
    try {
      if (callingState !== CallingState.JOINED) {
        await call.join();
      }
    } catch (err) {
      onError?.(err);
      setJoinError(true);
    }
  }, [call, onError, callingState]);

  const handleGoLive = useCallback(async () => {
    if (!call) return;
    try {
      await call.goLive();
    } catch (err) {
      onError?.(err);
    }
  }, [call, onError]);

  const handleStopLive = useCallback(async () => {
    if (!call) return;
    try {
      await call.stopLive();
    } catch (err) {
      onError?.(err);
    }
  }, [call, onError]);

  if (joinError) {
    return <JoinError onJoin={handleJoin} />;
  }

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
