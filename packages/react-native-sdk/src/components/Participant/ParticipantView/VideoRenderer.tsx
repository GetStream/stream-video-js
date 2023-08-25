import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { RTCView } from '@stream-io/react-native-webrtc';
import { ParticipantViewProps } from './ParticipantView';
import {
  CallingState,
  SfuModels,
  VisibilityState,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { ParticipantVideoFallback as DefaultParticipantVideoFallback } from './ParticipantVideoFallback';
import { useTheme } from '../../../contexts/ThemeContext';

const DEFAULT_VIEWPORT_VISIBILITY_STATE = {
  screen: VisibilityState.UNKNOWN,
  video: VisibilityState.UNKNOWN,
} as const;

/**
 * Props for the VideoRenderer component.
 */
export type VideoRendererProps = Pick<
  ParticipantViewProps,
  | 'ParticipantVideoFallback'
  | 'videoMode'
  | 'participant'
  | 'isVisible'
  | 'videoZOrder'
>;

/**
 * This component is used to display the video of the participant and fallback when the video is muted.
 *
 * It internally used `RTCView` to render video stream.
 */
export const VideoRenderer = ({
  videoMode = 'video',
  participant,
  isVisible = true,
  ParticipantVideoFallback = DefaultParticipantVideoFallback,
  videoZOrder = 0,
}: VideoRendererProps) => {
  const {
    theme: { videoRenderer },
  } = useTheme();
  const call = useCall();
  const { useCallCallingState, useCameraState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const pendingVideoLayoutRef = useRef<SfuModels.VideoDimension>();
  const subscribedVideoLayoutRef = useRef<SfuModels.VideoDimension>();
  const { direction } = useCameraState();
  const {
    isLocalParticipant,
    sessionId,
    publishedTracks,
    viewportVisibilityState,
    videoStream,
    screenShareStream,
  } = participant;

  const isScreenSharing = videoMode === 'screen';
  const isPublishingVideoTrack = publishedTracks.includes(
    isScreenSharing
      ? SfuModels.TrackType.SCREEN_SHARE
      : SfuModels.TrackType.VIDEO,
  );
  const hasJoinedCall = callingState === CallingState.JOINED;
  const canShowVideo = !!videoStream && isVisible && isPublishingVideoTrack;
  const videoStreamToRender = isScreenSharing ? screenShareStream : videoStream;
  const mirror = isLocalParticipant && direction === 'front';

  /**
   * This effect updates the participant's viewportVisibilityState
   * Additionally makes sure that when this view becomes visible again, the layout to subscribe is known
   */
  useEffect(() => {
    if (!call) {
      return;
    }
    if (!isVisible) {
      if (viewportVisibilityState?.video !== VisibilityState.VISIBLE) {
        call.state.updateParticipant(sessionId, (p) => ({
          ...p,
          viewportVisibilityState: {
            ...(p.viewportVisibilityState ?? DEFAULT_VIEWPORT_VISIBILITY_STATE),
            video: VisibilityState.VISIBLE,
          },
        }));
      }
    } else {
      if (viewportVisibilityState?.video !== VisibilityState.INVISIBLE) {
        call.state.updateParticipant(sessionId, (p) => ({
          ...p,
          viewportVisibilityState: {
            ...(p.viewportVisibilityState ?? DEFAULT_VIEWPORT_VISIBILITY_STATE),
            video: VisibilityState.INVISIBLE,
          },
        }));
      }
      if (subscribedVideoLayoutRef.current) {
        // when video is enabled again, we want to use the last subscribed dimension to resubscribe
        pendingVideoLayoutRef.current = subscribedVideoLayoutRef.current;
        subscribedVideoLayoutRef.current = undefined;
      }
    }
  }, [sessionId, viewportVisibilityState, isVisible, call]);

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
    // NOTE: We only want to update the subscription if the pendingVideoLayoutRef is set
    const updateIsNeeded = pendingVideoLayoutRef.current;

    if (!updateIsNeeded || !call || !isPublishingVideoTrack || !hasJoinedCall) {
      return;
    }

    // NOTE: When the view is not visible, we want to subscribe to audio only.
    // We unsubscribe their video by setting the dimension to undefined
    const dimension = isVisible ? pendingVideoLayoutRef.current : undefined;

    call.updateSubscriptionsPartial(videoMode, {
      [sessionId]: { dimension },
    });

    if (dimension) {
      subscribedVideoLayoutRef.current = pendingVideoLayoutRef.current;
      pendingVideoLayoutRef.current = undefined;
    }
  }, [
    call,
    isPublishingVideoTrack,
    videoMode,
    isVisible,
    sessionId,
    hasJoinedCall,
  ]);

  useEffect(() => {
    return () => {
      subscribedVideoLayoutRef.current = undefined;
      pendingVideoLayoutRef.current = undefined;
    };
  }, [videoMode, sessionId]);

  const onLayout: React.ComponentProps<typeof RTCView>['onLayout'] = (
    event,
  ) => {
    const dimension = {
      width: Math.trunc(event.nativeEvent.layout.width),
      height: Math.trunc(event.nativeEvent.layout.height),
    };

    // NOTE: If the participant hasn't published a video track yet,
    // or the view is not viewable, we store the dimensions and handle it
    // when the track is published or the video is enabled.
    if (!call || !isPublishingVideoTrack || !isVisible || !hasJoinedCall) {
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
    call.updateSubscriptionsPartial(videoMode, {
      [sessionId]: {
        dimension,
      },
    });
    subscribedVideoLayoutRef.current = dimension;
    pendingVideoLayoutRef.current = undefined;
  };

  return (
    <View
      onLayout={onLayout}
      style={[styles.container, videoRenderer.container]}
    >
      {canShowVideo ? (
        <RTCView
          style={[styles.videoStream, videoRenderer.videoStream]}
          streamURL={videoStreamToRender?.toURL()}
          mirror={mirror}
          objectFit={isScreenSharing ? 'contain' : 'cover'}
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
