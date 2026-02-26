import {
  CallingState,
  SfuModels,
  hasAudio,
  hasPausedTrack,
  hasScreenShare,
  speakerLayoutSortPreset,
  type StreamVideoParticipant,
  videoLoggerSystem,
  type VideoTrackType,
  hasVideo,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import type { MediaStream } from '@stream-io/react-native-webrtc';
import React, { useEffect, useCallback, useState } from 'react';
import { findNodeHandle } from 'react-native';
import {
  onNativeCallClosed,
  onNativeDimensionsUpdated,
  RTCViewPipNative,
} from './RTCViewPipNative';
import { debounceTime, map } from 'rxjs';
import { shouldDisableIOSLocalVideoOnBackgroundRef } from '../../../utils/internal/shouldDisableIOSLocalVideoOnBackground';
import { useTrackDimensions } from '../../../hooks/useTrackDimensions';
import { isInPiPMode$ } from '../../../utils/internal/rxSubjects';

type Props = {
  includeLocalParticipantVideo?: boolean;
  /**
   * Optional video mirroring override.
   */
  mirror?: boolean;
  /**
   * Callback that is called when the PiP mode state changes.
   * @param active - true when PiP started, false when PiP stopped
   */
  onPiPChange?: (active: boolean) => void;
};

export const RTCViewPipIOS = React.memo((props: Props) => {
  const {
    includeLocalParticipantVideo,
    mirror: mirrorOverride,
    onPiPChange,
  } = props;
  const call = useCall();
  const { useCameraState, useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const { direction } = useCameraState();

  const [allParticipants, setAllParticipants] = useState<
    StreamVideoParticipant[]
  >([]);

  // we debounce the participants to avoid unnecessary rerenders
  // that happen when participant tracks are all subscribed simultaneously
  useEffect(() => {
    if (!call) return;
    const subscription = call.state.participants$
      .pipe(
        debounceTime(300),
        map((ps) => [...ps].sort(speakerLayoutSortPreset)),
      )
      .subscribe(setAllParticipants);
    return () => subscription.unsubscribe();
  }, [call]);

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

  const isPublishingTrack =
    isScreenSharing ||
    (participantInSpotlight && hasVideo(participantInSpotlight));

  const streamURL = isPublishingTrack
    ? videoStreamToRender?.toURL()
    : undefined;

  const mirror = isScreenSharing
    ? false
    : mirrorOverride !== undefined
      ? mirrorOverride
      : !!participantInSpotlight?.isLocalParticipant && direction === 'front';

  const handlePiPChange = (event: { nativeEvent: { active: boolean } }) => {
    isInPiPMode$.next(event.nativeEvent.active);
    onPiPChange?.(event.nativeEvent.active);
  };

  // Get participant info for avatar placeholder
  const participantName = participantInSpotlight?.name || undefined;
  const participantImageURL = participantInSpotlight?.image || undefined;

  // Determine if the call is reconnecting or offline
  const isReconnecting =
    callingState === CallingState.MIGRATING ||
    callingState === CallingState.RECONNECTING ||
    callingState === CallingState.RECONNECTING_FAILED ||
    callingState === CallingState.OFFLINE;

  // Determine if the participant has audio enabled
  const participantHasAudio = participantInSpotlight
    ? hasAudio(participantInSpotlight)
    : true;

  // Determine if the video track is paused
  const trackType: VideoTrackType = isScreenSharing
    ? 'screenShareTrack'
    : 'videoTrack';

  const isVideoTrackPaused = participantInSpotlight
    ? hasPausedTrack(participantInSpotlight, trackType)
    : false;

  // Determine if the participant is pinned
  const participantIsPinned = participantInSpotlight?.pin !== undefined;

  // Determine if the participant is speaking
  const participantIsSpeaking = participantInSpotlight?.isSpeaking ?? false;

  // Get connection quality (convert enum to number: UNSPECIFIED=0, POOR=1, GOOD=2, EXCELLENT=3)
  const participantConnectionQuality =
    participantInSpotlight?.connectionQuality ??
    SfuModels.ConnectionQuality.UNSPECIFIED;

  return (
    <>
      <RTCViewPipNative
        streamURL={streamURL}
        mirror={mirror}
        ref={nativeRef}
        onPiPChange={handlePiPChange}
        participantName={participantName}
        participantImageURL={participantImageURL}
        isReconnecting={isReconnecting}
        isScreenSharing={isScreenSharing}
        hasAudio={participantHasAudio}
        isTrackPaused={isVideoTrackPaused}
        isPinned={participantIsPinned}
        isSpeaking={participantIsSpeaking}
        connectionQuality={participantConnectionQuality}
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
