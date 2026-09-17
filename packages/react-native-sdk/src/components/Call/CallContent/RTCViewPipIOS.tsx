import {
  CallingState,
  SfuModels,
  hasAudio,
  hasPausedTrack,
  hasScreenShare,
  type StreamVideoParticipant,
  videoLoggerSystem,
  type VideoTrackType,
  hasVideo,
  isPinned,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import type { MediaStream } from '@stream-io/react-native-webrtc';
import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { findNodeHandle } from 'react-native';
import {
  onNativeCallClosed,
  onNativeDimensionsUpdated,
  type PiPBoundsChangeEvent,
  type PiPChangeEvent,
  RTCViewPipNative,
} from './RTCViewPipNative';
import { BehaviorSubject, debounceTime } from 'rxjs';
import { shouldDisableIOSLocalVideoOnBackgroundRef } from '../../../utils/internal/shouldDisableIOSLocalVideoOnBackground';
import { useTrackDimensions } from '../../../hooks/useTrackDimensions';
import { isInPiPMode$ } from '../../../utils/internal/rxSubjects';
import TrackSubscriber from '../../Participant/ParticipantView/VideoRenderer/TrackSubscriber';

// Remount the native view when the Call instance changes, including the same cid.
let nextPipViewKey = 0;

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
  >(call?.state.participants ?? []);

  const pip = useMemo(
    () => ({
      nativeKey: ++nextPipViewKey,
      dimensions$: new BehaviorSubject<SfuModels.VideoDimension | undefined>(
        undefined,
      ),
      isActive: false,
      isClosed: false,
    }),
    // A different Call instance needs a fresh native view and bounds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [call],
  );
  const [isPipActive, setIsPipActive] = useState(false);
  const onPiPChangeRef = React.useRef(onPiPChange);
  onPiPChangeRef.current = onPiPChange;

  const updatePipState = useCallback(
    (active: boolean) => {
      if (pip.isActive === active) return;
      pip.isActive = active;
      setIsPipActive(active);
      isInPiPMode$.next(active);
      onPiPChangeRef.current?.(active);
    },
    [pip],
  );

  // we debounce the participants to avoid unnecessary rerenders
  // that happen when participant tracks are all subscribed simultaneously
  useEffect(() => {
    if (!call) {
      setAllParticipants([]);
      return;
    }
    const subscription = call.state.participants$
      .pipe(debounceTime(300))
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
    const node = findNodeHandle(nativeRef.current);
    pip.isClosed = false;
    const onCallClosed = () => {
      if (pip.isClosed) {
        return;
      }
      pip.isClosed = true;
      if (node !== null) {
        onNativeCallClosed(node);
      }
      shouldDisableIOSLocalVideoOnBackgroundRef.current = true;
      pip.dimensions$.next(undefined);
      updatePipState(false);
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
  }, [call, pip, updatePipState]);

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

  const handlePiPChange = (event: { nativeEvent: PiPChangeEvent }) => {
    const { active } = event.nativeEvent;
    if (pip.isClosed) return;
    updatePipState(active);
  };

  const handlePiPBoundsChange = (event: {
    nativeEvent: PiPBoundsChangeEvent;
  }) => {
    if (pip.isClosed) return;
    const { width, height } = event.nativeEvent;
    pip.dimensions$.next({ width, height });
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
  const participantIsPinned = participantInSpotlight
    ? isPinned(participantInSpotlight)
    : false;

  // Determine if the participant is speaking
  const participantIsSpeaking = participantInSpotlight?.isSpeaking ?? false;

  // Get connection quality (convert enum to number: UNSPECIFIED=0, POOR=1, GOOD=2, EXCELLENT=3)
  const participantConnectionQuality =
    participantInSpotlight?.connectionQuality ??
    SfuModels.ConnectionQuality.UNSPECIFIED;

  // while the native window is on screen, its bounds - and not the hidden
  // inline layout behind it - are the demand of the track it renders. The local
  // preview is never subscribed to.
  const pipTrackOwner =
    isPipActive && participantInSpotlight?.isLocalParticipant !== true
      ? participantInSpotlight
      : undefined;

  return (
    <>
      <RTCViewPipNative
        key={pip.nativeKey}
        streamURL={streamURL}
        mirror={mirror}
        ref={nativeRef}
        onPiPChange={handlePiPChange}
        onPiPBoundsChange={handlePiPBoundsChange}
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
      {pipTrackOwner && call && (
        <TrackSubscriber
          call={call}
          participantSessionId={pipTrackOwner.sessionId}
          trackType={trackType}
          isVisible={true}
          dimensions$={pip.dimensions$}
          isPipWriter
        />
      )}
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
