import { useCallback } from 'react';
import { CallingState, OwnCapability } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import { HostBackstage } from './HostBackstage';
import { HostLiveControls } from './HostLiveControls';
import { ViewerLobby } from './ViewerLobby';
import { ViewerWaiting } from './ViewerWaiting';
import { LivestreamView } from './LivestreamView';
import { ConnectionErrorScreen } from './ConnectionErrorScreen';
import { StreamEndedScreen } from './StreamEndedScreen';
import { LoadingScreen } from '../shared';

export type LivestreamUIProps = {
  skipLobby?: boolean;
  onUserNameUpdate?: (name: string) => void;
};

export const LivestreamUI = ({ skipLobby = false }: LivestreamUIProps) => {
  const call = useCall();
  const { useCallCallingState, useIsCallLive, useHasPermissions } =
    useCallStateHooks();
  const callingState = useCallCallingState();
  const isLive = useIsCallLive();

  const hasHostCapabilities = useHasPermissions(OwnCapability.JOIN_BACKSTAGE);

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
      await call.goLive({ start_hls: true });
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

  const handleLeave = useCallback(() => {
    call?.leave();
  }, [call]);

  const handleRetry = useCallback(() => {
    handleJoin();
  }, [handleJoin]);

  if (
    callingState === CallingState.RECONNECTING ||
    callingState === CallingState.RECONNECTING_FAILED ||
    callingState === CallingState.OFFLINE
  ) {
    return (
      <ConnectionErrorScreen
        callingState={callingState}
        onRetry={handleRetry}
      />
    );
  }

  if (
    callingState === CallingState.IDLE ||
    callingState === CallingState.UNKNOWN
  ) {
    return hasHostCapabilities ? (
      <HostBackstage onJoin={handleJoin} skipLobby={skipLobby} />
    ) : (
      <ViewerLobby onJoin={handleJoin} skipLobby={skipLobby} isLive={isLive} />
    );
  }

  // Joining - show loading
  if (callingState === CallingState.JOINING) {
    return <LoadingScreen message="Joining" />;
  }

  // Joined but not live - show backstage (if host) or waiting (if viewer)
  if (callingState === CallingState.JOINED && !isLive) {
    return hasHostCapabilities ? (
      <HostLiveControls onGoLive={handleGoLive} onLeave={handleLeave} />
    ) : (
      <ViewerWaiting />
    );
  }

  // Joined and live - show the livestream
  if (callingState === CallingState.JOINED && isLive) {
    return <LivestreamView onStopLive={handleStopLive} />;
  }

  // Left - show ended screen
  if (callingState === CallingState.LEFT) {
    return <StreamEndedScreen onRejoin={handleJoin} />;
  }

  // Fallback loading for any other state
  return <LoadingScreen />;
};
