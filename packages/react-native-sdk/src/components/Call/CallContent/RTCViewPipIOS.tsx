import {
  CallingState,
  hasAudio,
  hasScreenShare,
  hasVideo,
  speakerLayoutSortPreset,
  type StreamVideoParticipant,
  videoLoggerSystem,
  type VideoTrackType,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import type { MediaStream } from '@stream-io/react-native-webrtc';
import React, { useEffect, useMemo, useCallback } from 'react';
import { findNodeHandle } from 'react-native';
import {
  onNativeCallClosed,
  onNativeDimensionsUpdated,
  RTCViewPipNative,
} from './RTCViewPipNative';
import { useDebouncedValue } from '../../../utils/hooks';
import { shouldDisableIOSLocalVideoOnBackgroundRef } from '../../../utils/internal/shouldDisableIOSLocalVideoOnBackground';
import { useTrackDimensions } from '../../../hooks/useTrackDimensions';
import { isInPiPMode$ } from '../../../utils/internal/rxSubjects';

type Props = {
  includeLocalParticipantVideo?: boolean;
  /**
   * Callback that is called when the PiP mode state changes.
   * @param active - true when PiP started, false when PiP stopped
   */
  onPiPChange?: (active: boolean) => void;
};

export const RTCViewPipIOS = React.memo((props: Props) => {
  const { includeLocalParticipantVideo, onPiPChange } = props;
  const call = useCall();
  const { useParticipants, useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const _allParticipants = useParticipants({
    sortBy: speakerLayoutSortPreset,
  });
  const allParticipants = useDebouncedValue(_allParticipants, 300); // we debounce the participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously

  const [dominantSpeaker, dominantSpeaker2] = allParticipants.filter(
    (participant) =>
      includeLocalParticipantVideo ? true : !participant.isLocalParticipant,
  );

  // show the dominant remote speaker in PiP mode
  // local speaker is shown only if remote doesn't exist
  let participantInSpotlight: StreamVideoParticipant | undefined =
    dominantSpeaker;
  if (dominantSpeaker?.isLocalParticipant && dominantSpeaker2) {
    participantInSpotlight = dominantSpeaker2;
  }

  useEffect(() => {
    shouldDisableIOSLocalVideoOnBackgroundRef.current =
      !includeLocalParticipantVideo;
  }, [includeLocalParticipantVideo]);

  const nativeRef = React.useRef<any>(null);

  React.useEffect(() => {
    let callClosedInvokedOnce = false;
    const onCallClosed = () => {
      if (callClosedInvokedOnce) {
        return;
      }
      callClosedInvokedOnce = true;
      const node = findNodeHandle(nativeRef.current);
      if (node !== null) {
        onNativeCallClosed(node);
      }
      shouldDisableIOSLocalVideoOnBackgroundRef.current = true;
    };
    const unsubFunc = call?.on('call.ended', () => {
      videoLoggerSystem
        .getLogger('RTCViewPipIOS')
        .debug(`onCallClosed due to call.ended event`);
      onCallClosed();
    });
    const subscription = call?.state.callingState$.subscribe((state) => {
      if (state === CallingState.LEFT) {
        videoLoggerSystem
          .getLogger('RTCViewPipIOS')
          .debug(`onCallClosed due to callingState: ${state}`);
        onCallClosed();
      }
    });
    return () => {
      onCallClosed();
      unsubFunc?.();
      subscription?.unsubscribe();
    };
  }, [call]);

  const onDimensionsUpdated = useCallback((width: number, height: number) => {
    const node = findNodeHandle(nativeRef.current);
    if (node !== null && width > 0 && height > 0) {
      onNativeDimensionsUpdated(node, width, height);
    }
  }, []);

  const { videoStream, screenShareStream } = participantInSpotlight || {};

  const isScreenSharing = participantInSpotlight
    ? hasScreenShare(participantInSpotlight)
    : false;

  const videoStreamToRender = (isScreenSharing
    ? screenShareStream
    : videoStream) as unknown as MediaStream | undefined;

  const streamURL = useMemo(() => {
    if (!videoStreamToRender) {
      return undefined;
    }
    return videoStreamToRender?.toURL();
  }, [videoStreamToRender]);

  const handlePiPChange = (event: { nativeEvent: { active: boolean } }) => {
    isInPiPMode$.next(event.nativeEvent.active);
    onPiPChange?.(event.nativeEvent.active);
  };

  // Determine if participant has video enabled
  // For screen sharing, we check if the screen share stream is available
  // For regular video, we check if the video stream is available and camera is publishing
  const isVideoEnabled = useMemo(() => {
    if (!participantInSpotlight) return false;
    if (isScreenSharing) {
      return !!screenShareStream;
    }
    return !!videoStream && hasVideo(participantInSpotlight);
  }, [participantInSpotlight, isScreenSharing, screenShareStream, videoStream]);

  // Get participant info for avatar placeholder
  const participantName = participantInSpotlight?.name || undefined;
  const participantImageURL = participantInSpotlight?.image || undefined;

  // Determine if the call is reconnecting
  const isReconnecting =
    callingState === CallingState.RECONNECTING ||
    callingState === CallingState.RECONNECTING_FAILED;

  // Determine if participant's audio is muted
  const isMuted = useMemo(() => {
    if (!participantInSpotlight) return false;
    return !hasAudio(participantInSpotlight);
  }, [participantInSpotlight]);

  return (
    <>
      <RTCViewPipNative
        streamURL={streamURL}
        ref={nativeRef}
        onPiPChange={handlePiPChange}
        participantName={participantName}
        participantImageURL={participantImageURL}
        isVideoEnabled={isVideoEnabled}
        isReconnecting={isReconnecting}
        isScreenSharing={isScreenSharing}
        isMuted={isMuted}
      />
      {participantInSpotlight && (
        <DimensionsUpdatedRenderless
          participant={participantInSpotlight}
          trackType={isScreenSharing ? 'screenShareTrack' : 'videoTrack'}
          onDimensionsUpdated={onDimensionsUpdated}
          key={streamURL}
        />
      )}
    </>
  );
});

const DimensionsUpdatedRenderless = React.memo(
  ({
    participant,
    trackType,
    onDimensionsUpdated,
  }: {
    participant: StreamVideoParticipant;
    trackType: VideoTrackType;
    onDimensionsUpdated: (width: number, height: number) => void;
  }) => {
    const { width, height } = useTrackDimensions(participant, trackType);

    useEffect(() => {
      onDimensionsUpdated(width, height);
    }, [width, height, onDimensionsUpdated]);

    return null;
  },
);

DimensionsUpdatedRenderless.displayName = 'DimensionsUpdatedRenderless';
RTCViewPipIOS.displayName = 'RTCViewPipIOS';
