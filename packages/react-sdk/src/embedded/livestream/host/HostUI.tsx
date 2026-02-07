import { useCallback } from 'react';
import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import { HostLobby } from './HostLobby';
import { HostView } from './HostView';
import { LoadingIndicator } from '../../../components';
import { CallFeedback } from '../../shared/CallFeedback/CallFeedback';
import { useEmbeddedConfiguration } from '../../context';

export const HostUI = () => {
  const call = useCall();
  const { onError } = useEmbeddedConfiguration();
  const { useCallCallingState, useIsCallLive, useCallSettings } =
    useCallStateHooks();
  const callingState = useCallCallingState();
  const isLive = useIsCallLive();
  const settings = useCallSettings();
  const isBackstageEnabled = settings?.backstage?.enabled ?? true;

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

  const handleGoLive = useCallback(async () => {
    if (!call) return;
    try {
      await call.goLive();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Failed to go live:', error);
      onError?.(error);
    }
  }, [call, onError]);

  const handleStopLive = useCallback(async () => {
    if (!call) return;
    try {
      await call.stopLive();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Failed to stop live:', error);
      onError?.(error);
    }
  }, [call, onError]);

  if (
    callingState === CallingState.IDLE ||
    callingState === CallingState.UNKNOWN
  ) {
    return (
      <HostLobby onJoin={handleJoin} isBackstageEnabled={isBackstageEnabled} />
    );
  }

  if (callingState === CallingState.LEFT) {
    return <CallFeedback onJoin={handleJoin} />;
  }

  if (callingState === CallingState.JOINED) {
    return (
      <HostView
        isLive={isLive}
        onGoLive={handleGoLive}
        onStopLive={handleStopLive}
      />
    );
  }

  return <LoadingIndicator className="str-video__embedded-loading" />;
};
