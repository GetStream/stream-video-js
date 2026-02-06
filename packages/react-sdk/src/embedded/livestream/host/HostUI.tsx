import { useCallback } from 'react';
import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import { HostLobby } from './HostLobby';
import { HostView } from './HostView';
import { LoadingScreen } from '../../shared';

export const HostUI = () => {
  const call = useCall();
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
      console.error('Failed to join call:', err);
    }
  }, [call]);

  const handleGoLive = useCallback(async () => {
    if (!call) return;
    try {
      await call.goLive();
    } catch (err) {
      console.error('Failed to go live:', err);
    }
  }, [call]);

  const handleStopLive = useCallback(async () => {
    if (!call) return;
    try {
      await call.stopLive();
    } catch (err) {
      console.error('Failed to stop live:', err);
    }
  }, [call]);

  if (
    callingState === CallingState.IDLE ||
    callingState === CallingState.UNKNOWN
  ) {
    return (
      <HostLobby onJoin={handleJoin} isBackstageEnabled={isBackstageEnabled} />
    );
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

  return <LoadingScreen />;
};
