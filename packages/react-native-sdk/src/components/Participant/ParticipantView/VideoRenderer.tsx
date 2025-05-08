import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { MediaStream } from '@stream-io/react-native-webrtc';
import { RTCView } from '@stream-io/react-native-webrtc';
import type { ParticipantViewProps } from './ParticipantView';
import {
  CallingState,
  hasScreenShare,
  hasVideo,
  SfuModels,
  type VideoTrackType,
  VisibilityState,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { ParticipantVideoFallback as DefaultParticipantVideoFallback } from './ParticipantVideoFallback';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTrackDimensions } from '../../../hooks/useTrackDimensions';
import { useScreenshotIosContext } from '../../../contexts/internal/ScreenshotIosContext';

const DEFAULT_VIEWPORT_VISIBILITY_STATE: Record<
  VideoTrackType,
  VisibilityState
> = {
  videoTrack: VisibilityState.UNKNOWN,
  screenShareTrack: VisibilityState.UNKNOWN,
} as const;

/**
 * Props for the VideoRenderer component.
 */
export type VideoRendererProps = Pick<
  ParticipantViewProps,
  | 'ParticipantVideoFallback'
  | 'trackType'
  | 'participant'
  | 'isVisible'
  | 'objectFit'
  | 'videoZOrder'
>;

/**
 * This component is used to display the video of the participant and fallback when the video is muted.
 *
 * It internally used `RTCView` to render video stream.
 */
export const VideoRenderer = ({
  trackType = 'videoTrack',
  participant,
  isVisible = true,
  ParticipantVideoFallback = DefaultParticipantVideoFallback,
  objectFit,
  videoZOrder = 0,
}: VideoRendererProps) => {
  const {
    theme: { videoRenderer },
  } = useTheme();
  const call = useCall();
  const { useCallCallingState, useCameraState, useIncomingVideoSettings } =
    useCallStateHooks();
  const { isParticipantVideoEnabled } = useIncomingVideoSettings();
  const callingState = useCallCallingState();
  const pendingVideoLayoutRef = useRef<SfuModels.VideoDimension | undefined>(
    undefined,
  );
  const subscribedVideoLayoutRef = useRef<SfuModels.VideoDimension | undefined>(
    undefined,
  );
  const { direction } = useCameraState();
  const viewRef = useRef(null);
  const {
    register: registerIosScreenshot,
    deregister: deregisterIosScreenshot,
  } = useScreenshotIosContext();

  const videoDimensions = useTrackDimensions(participant, trackType);
  const {
    isLocalParticipant,
    sessionId,
    viewportVisibilityState,
    videoStream,
    screenShareStream,
  } = participant;

  const isScreenSharing = trackType === 'screenShareTrack';
  const isPublishingVideoTrack = isScreenSharing
    ? hasScreenShare(participant)
    : hasVideo(participant);

  const hasJoinedCall = callingState === CallingState.JOINED;
  const videoStreamToRender = (isScreenSharing
    ? screenShareStream
    : videoStream) as unknown as MediaStream | undefined;

  const canShowVideo =
    !!videoStreamToRender &&
    isVisible &&
    isPublishingVideoTrack &&
    isParticipantVideoEnabled(participant.sessionId);

  React.useEffect(() => {
    if (
      Platform.OS === 'ios' &&
      registerIosScreenshot &&
      viewRef.current &&
      canShowVideo
    ) {
      registerIosScreenshot(participant, trackType, viewRef);
      return () => {
        deregisterIosScreenshot(participant, trackType);
      };
    }
  }, [
    participant,
    trackType,
    registerIosScreenshot,
    canShowVideo,
    deregisterIosScreenshot,
  ]);

  const mirror =
    isLocalParticipant && !isScreenSharing && direction === 'front';

  /**
   * This effect updates the participant's viewportVisibilityState
   * Additionally makes sure that when this view becomes visible again, the layout to subscribe is known
   */
  useEffect(() => {
    if (!call || isLocalParticipant) {
      return;
    }
    if (isVisible) {
      if (
        trackType === 'videoTrack' &&
        viewportVisibilityState?.videoTrack !== VisibilityState.VISIBLE
      ) {
        call.state.updateParticipant(sessionId, (p) => ({
          ...p,
          viewportVisibilityState: {
            ...(p.viewportVisibilityState ?? DEFAULT_VIEWPORT_VISIBILITY_STATE),
            videoTrack: VisibilityState.VISIBLE,
          },
        }));
      }
      if (
        trackType === 'screenShareTrack' &&
        viewportVisibilityState?.screenShareTrack !== VisibilityState.VISIBLE
      ) {
        call.state.updateParticipant(sessionId, (p) => ({
          ...p,
          viewportVisibilityState: {
            ...(p.viewportVisibilityState ?? DEFAULT_VIEWPORT_VISIBILITY_STATE),
            screenShareTrack: VisibilityState.VISIBLE,
          },
        }));
      }
    } else {
      if (
        trackType === 'videoTrack' &&
        viewportVisibilityState?.videoTrack !== VisibilityState.INVISIBLE
      ) {
        call.state.updateParticipant(sessionId, (p) => ({
          ...p,
          viewportVisibilityState: {
            ...(p.viewportVisibilityState ?? DEFAULT_VIEWPORT_VISIBILITY_STATE),
            videoTrack: VisibilityState.INVISIBLE,
          },
        }));
      }
      if (
        trackType === 'screenShareTrack' &&
        viewportVisibilityState?.screenShareTrack !== VisibilityState.INVISIBLE
      ) {
        call.state.updateParticipant(sessionId, (p) => ({
          ...p,
          viewportVisibilityState: {
            ...(p.viewportVisibilityState ?? DEFAULT_VIEWPORT_VISIBILITY_STATE),
            screenShareTrack: VisibilityState.INVISIBLE,
          },
        }));
      }
      if (subscribedVideoLayoutRef.current) {
        // when video is enabled again, we want to use the last subscribed dimension to resubscribe
        pendingVideoLayoutRef.current = subscribedVideoLayoutRef.current;
        subscribedVideoLayoutRef.current = undefined;
      }
    }
  }, [
    sessionId,
    viewportVisibilityState,
    isVisible,
    call,
    trackType,
    isLocalParticipant,
  ]);

  useEffect(() => {
    if (!hasJoinedCall && subscribedVideoLayoutRef.current) {
      // when call is joined again, we want to use the last subscribed dimension to resubscribe
      pendingVideoLayoutRef.current = subscribedVideoLayoutRef.current;
      subscribedVideoLayoutRef.current = undefined;
    }
  }, [hasJoinedCall]);

  /**
   * This effect updates the subscription either
   * 1. when video tracks are published and was unpublished before
   * 2. when the view's visibility changes
   * 3. when call was rejoined
   */
  useEffect(() => {
    if (!call || isLocalParticipant) {
      return;
    }
    // NOTE: We only want to update the subscription if the pendingVideoLayoutRef is set
    const updateIsNeeded = pendingVideoLayoutRef.current;

    if (!updateIsNeeded || !isPublishingVideoTrack || !hasJoinedCall) {
      return;
    }

    // NOTE: When the view is not visible, we want to subscribe to audio only.
    // We unsubscribe their video by setting the dimension to undefined
    const dimension = isVisible ? pendingVideoLayoutRef.current : undefined;
    call.state.updateParticipantTracks(trackType, {
      [sessionId]: { dimension },
    });
    call.dynascaleManager.applyTrackSubscriptions();

    if (dimension) {
      subscribedVideoLayoutRef.current = pendingVideoLayoutRef.current;
      pendingVideoLayoutRef.current = undefined;
    }
  }, [
    call,
    isPublishingVideoTrack,
    trackType,
    isVisible,
    sessionId,
    hasJoinedCall,
    isLocalParticipant,
  ]);

  useEffect(() => {
    return () => {
      subscribedVideoLayoutRef.current = undefined;
      pendingVideoLayoutRef.current = undefined;
    };
  }, [trackType, sessionId]);

  const onLayout: React.ComponentProps<typeof RTCView>['onLayout'] = (
    event,
  ) => {
    if (!call || isLocalParticipant) {
      return;
    }
    const dimension = {
      width: Math.trunc(event.nativeEvent.layout.width),
      height: Math.trunc(event.nativeEvent.layout.height),
    };

    // NOTE: If the participant hasn't published a video track yet,
    // or the view is not viewable, we store the dimensions and handle it
    // when the track is published or the video is enabled.
    if (!isPublishingVideoTrack || !isVisible || !hasJoinedCall) {
      pendingVideoLayoutRef.current = dimension;
      return;
    }

    // NOTE: We don't want to update the subscription if the dimension hasn't changed
    if (
      subscribedVideoLayoutRef.current?.width === dimension.width &&
      subscribedVideoLayoutRef.current?.height === dimension.height
    ) {
      return;
    }
    call.state.updateParticipantTracks(trackType, {
      [sessionId]: {
        dimension,
      },
    });
    call.dynascaleManager.applyTrackSubscriptions();
    subscribedVideoLayoutRef.current = dimension;
    pendingVideoLayoutRef.current = undefined;
  };

  return (
    <View
      onLayout={onLayout}
      style={[styles.container, videoRenderer.container]}
    >
      {canShowVideo && videoStreamToRender ? (
        <RTCView
          style={[styles.videoStream, videoRenderer.videoStream]}
          streamURL={videoStreamToRender.toURL()}
          mirror={mirror}
          ref={viewRef}
          objectFit={
            objectFit ??
            (videoDimensions.width > videoDimensions.height
              ? 'contain'
              : 'cover')
          }
          zOrder={videoZOrder}
        />
      ) : (
        ParticipantVideoFallback && (
          <ParticipantVideoFallback participant={participant} />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  videoStream: {
    ...StyleSheet.absoluteFillObject,
  },
});
