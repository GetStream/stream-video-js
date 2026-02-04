import { useCallback, useState } from 'react';
import { CallingState, OwnCapability } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import { HostBackstage } from './HostBackstage';
import { HostLiveControls } from './HostLiveControls';
import { ViewerLobby } from './ViewerLobby';
import { ViewerWaitingForLive } from './ViewerWaitingForLive';
import { LivestreamView } from './LivestreamView';
import { ConnectionErrorScreen } from './ConnectionErrorScreen';
import { StreamEndedScreen } from './StreamEndedScreen';
import { LoadingScreen } from '../shared';
import { useCanJoinEarly } from '../../hooks';

export type LivestreamUIProps = {
  skipLobby?: boolean;
};

export const LivestreamUI = ({ skipLobby = false }: LivestreamUIProps) => {
  const call = useCall();
  const {
    useCallCallingState,
    useIsCallLive,
    useHasPermissions,
    useCallSettings,
  } = useCallStateHooks();
  const callingState = useCallCallingState();
  const isLive = useIsCallLive();
  const settings = useCallSettings();
  const isBackstageEnabled = settings?.backstage?.enabled ?? true;

  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);

  const hasHostCapabilities = useHasPermissions(OwnCapability.JOIN_BACKSTAGE);
  const canJoinEarly = useCanJoinEarly();

  const canViewerJoin = hasHostCapabilities || isLive || canJoinEarly;

  const handleJoin = useCallback(async () => {
    if (!call) return;
    const canJoin =
      call.state.callingState === CallingState.IDLE ||
      call.state.callingState === CallingState.UNKNOWN;
    if (!canJoin) return;
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
    if (hasHostCapabilities) {
      return <HostBackstage onJoin={handleJoin} skipLobby={skipLobby} />;
    }

    if (skipLobby || isInWaitingRoom) {
      return (
        <ViewerWaitingForLive onJoin={handleJoin} canJoin={canViewerJoin} />
      );
    }

    return (
      <ViewerLobby
        onJoin={canViewerJoin ? handleJoin : () => setIsInWaitingRoom(true)}
        skipLobby={false}
        isLive={isLive}
      />
    );
  }

  if (callingState === CallingState.JOINING) {
    return <LoadingScreen message="Joining" />;
  }

  if (callingState === CallingState.JOINED) {
    if (isLive) {
      return <LivestreamView onStopLive={handleStopLive} />;
    }

    if (hasHostCapabilities) {
      if (!isBackstageEnabled) {
        return <LoadingScreen message="Starting stream..." />;
      }
      return <HostLiveControls onGoLive={handleGoLive} onLeave={handleLeave} />;
    }

    return <ViewerWaitingForLive onJoin={() => {}} canJoin={false} />;
  }

  if (callingState === CallingState.LEFT) {
    return <StreamEndedScreen onRejoin={handleJoin} />;
  }

  return <LoadingScreen />;
};
