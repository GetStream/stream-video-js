import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { MediaStream } from '@stream-io/react-native-webrtc';
import { RTCView } from '@stream-io/react-native-webrtc';
import type { ParticipantViewProps } from '../ParticipantView';
import {
  hasPausedTrack,
  hasScreenShare,
  hasVideo,
  type VideoTrackType,
  VisibilityState,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { ParticipantVideoFallback as DefaultParticipantVideoFallback } from '../ParticipantVideoFallback';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useTrackDimensions } from '../../../../hooks/useTrackDimensions';
import { useScreenshotIosContext } from '../../../../contexts/internal/ScreenshotIosContext';
import TrackSubscriber, { TrackSubscriberHandle } from './TrackSubscriber';

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
  const { useCameraState, useIncomingVideoSettings } = useCallStateHooks();
  const trackSubscriberRef = useRef<TrackSubscriberHandle>(null);
  const { isParticipantVideoEnabled } = useIncomingVideoSettings();
  const { direction } = useCameraState();
  const viewRef = useRef(null);
  const {
    register: registerIosScreenshot,
    deregister: deregisterIosScreenshot,
  } = useScreenshotIosContext();

  const videoDimensions = useTrackDimensions(participant, trackType);

  const isVideoDimensionsValid =
    videoDimensions.width > 0 && videoDimensions.height > 0;

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

  const videoStreamToRender = (isScreenSharing
    ? screenShareStream
    : videoStream) as unknown as MediaStream | undefined;

  const canShowVideo =
    !!videoStreamToRender &&
    isVisible &&
    isPublishingVideoTrack &&
    !hasPausedTrack(participant, trackType) &&
    isParticipantVideoEnabled(participant.sessionId);

  useEffect(() => {
    if (Platform.OS === 'ios' && registerIosScreenshot && canShowVideo) {
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
    }
  }, [
    sessionId,
    viewportVisibilityState,
    isVisible,
    call,
    trackType,
    isLocalParticipant,
  ]);

  const onLayout: React.ComponentProps<typeof RTCView>['onLayout'] = (
    event,
  ) => {
    trackSubscriberRef.current?.onLayoutUpdate(event);
  };

  return (
    <View
      onLayout={onLayout}
      style={[styles.container, videoRenderer.container]}
    >
      {call && !isLocalParticipant && (
        <TrackSubscriber
          ref={trackSubscriberRef}
          call={call}
          participantSessionId={sessionId}
          trackType={trackType}
          isVisible={isVisible}
        />
      )}
      {canShowVideo &&
      videoStreamToRender &&
      (objectFit || isVideoDimensionsValid) ? (
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
