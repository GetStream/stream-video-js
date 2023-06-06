import React, { useEffect, useRef } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MediaStream, RTCView } from 'react-native-webrtc';
import {
  SfuModels,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
  VisibilityState,
} from '@stream-io/video-client';
import { VideoRenderer } from './VideoRenderer';
import { Avatar } from './Avatar';
import { useStreamVideoStoreValue } from '../contexts';
import { MicOff, ScreenShare, VideoSlash } from '../icons';
import { theme } from '../theme';
import { palette } from '../theme/constants';
import { ParticipantReaction } from './ParticipantReaction';
import { useCall } from '@stream-io/video-react-bindings';
import { NetworkQualityIndicator } from './NetworkQualityIndicator';

/**
 * Props to be passed for the ParticipantView component.
 */
interface ParticipantViewProps {
  /**
   * The participant that will be displayed
   */
  participant: StreamVideoParticipant | StreamVideoLocalParticipant;
  /**
   * The video kind that will be displayed
   */
  kind: 'video' | 'screen';
  /**
   * Any custom style to be merged with the participant view
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Any custom style to be merged with the VideoRenderer
   */
  videoRendererStyle?: StyleProp<ViewStyle>;
  /**
   * When set to false, the video stream will not be shown even if it is available.
   */
  isVisible?: boolean;
  /**
   * When set to true, the audio stream will not be played even if it is available.
   */
  disableAudio?: boolean;
}

/**
 * Renders either the participants' video track or screenShare track
 * and additional info, by an absence of a video track or when disableVideo is truthy,
 * only an avatar and audio track will be rendered.
 *
 * | When Video is Enabled | When Video is Disabled |
 * | :--- | :----: |
 * |![participant-view-1](https://user-images.githubusercontent.com/25864161/217489213-d4532ca1-49ee-4ef5-940c-af2e55bc0a5f.png)|![participant-view-2](https://user-images.githubusercontent.com/25864161/217489207-fb20c124-8bce-4c2b-87f9-4fe67bc50438.png)|
 */
export const ParticipantView = (props: ParticipantViewProps) => {
  const { participant, kind, isVisible = true, disableAudio } = props;
  const call = useCall();
  const pendingVideoLayoutRef = useRef<SfuModels.VideoDimension>();
  const subscribedVideoLayoutRef = useRef<SfuModels.VideoDimension>();
  const { isSpeaking, isLoggedInUser, publishedTracks } = participant;
  const isPublishingVideoTrack = publishedTracks.includes(
    kind === 'video'
      ? SfuModels.TrackType.VIDEO
      : SfuModels.TrackType.SCREEN_SHARE,
  );
  const isCameraOnFrontFacingMode = useStreamVideoStoreValue(
    (store) => store.isCameraOnFrontFacingMode,
  );
  const { connectionQuality, reaction, sessionId } = participant;

  /**
   * This effect updates the participant's viewportVisibilityState
   * Additionally makes sure that when this view becomes visible again, the layout to subscribe is known
   */
  useEffect(() => {
    if (!call) return;
    if (isVisible) {
      if (participant.viewportVisibilityState !== VisibilityState.VISIBLE) {
        call.state.updateParticipant(participant.sessionId, (p) => ({
          ...p,
          viewportVisibilityState: VisibilityState.VISIBLE,
        }));
      }
    } else {
      if (participant.viewportVisibilityState !== VisibilityState.INVISIBLE) {
        call.state.updateParticipant(participant.sessionId, (p) => ({
          ...p,
          viewportVisibilityState: VisibilityState.INVISIBLE,
        }));
      }
      if (subscribedVideoLayoutRef.current) {
        // when video is enabled again, we want to use the last subscribed dimension to resubscribe
        pendingVideoLayoutRef.current = subscribedVideoLayoutRef.current;
        subscribedVideoLayoutRef.current = undefined;
      }
    }
  }, [
    participant.sessionId,
    participant.viewportVisibilityState,
    isVisible,
    call,
  ]);

  /**
   * This effect updates the subscription either
   * 1. when video tracks are published and was unpublished before
   * 2. when the view's visibility changes
   */
  useEffect(() => {
    // NOTE: We only want to update the subscription if the pendingVideoLayoutRef is set
    const updateIsNeeded = pendingVideoLayoutRef.current;
    if (!updateIsNeeded || !call || !isPublishingVideoTrack) return;

    // NOTE: When the view is not visible, we want to subscribe to audio only.
    // We unsubscribe their video by setting the dimension to undefined
    const dimension = isVisible ? pendingVideoLayoutRef.current : undefined;

    call.updateSubscriptionsPartial(kind, {
      [participant.sessionId]: { dimension },
    });

    if (dimension) {
      subscribedVideoLayoutRef.current = pendingVideoLayoutRef.current;
      pendingVideoLayoutRef.current = undefined;
    }
  }, [call, isPublishingVideoTrack, kind, participant.sessionId, isVisible]);

  useEffect(() => {
    return () => {
      subscribedVideoLayoutRef.current = undefined;
      pendingVideoLayoutRef.current = undefined;
    };
  }, [kind, participant.sessionId]);

  const onLayout: React.ComponentProps<typeof View>['onLayout'] = (event) => {
    const dimension = {
      width: Math.trunc(event.nativeEvent.layout.width),
      height: Math.trunc(event.nativeEvent.layout.height),
    };

    // NOTE: If the participant hasn't published a video track yet,
    // or the view is not viewable, we store the dimensions and handle it
    // when the track is published or the video is enabled.
    if (!call || !isPublishingVideoTrack || !isVisible) {
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

    call.updateSubscriptionsPartial(kind, {
      [participant.sessionId]: {
        dimension,
      },
    });
    subscribedVideoLayoutRef.current = dimension;
    pendingVideoLayoutRef.current = undefined;
  };

  // NOTE: We have to cast to MediaStream type from webrtc
  // as JS client sends the web navigators' mediastream type instead
  const videoStream = (
    kind === 'video' ? participant.videoStream : participant.screenShareStream
  ) as MediaStream | undefined;

  const audioStream = participant.audioStream as MediaStream | undefined;
  const isAudioMuted = !publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const isVideoMuted = !publishedTracks.includes(SfuModels.TrackType.VIDEO);
  const hasScreenShareTrack = publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );
  const isScreenSharing = kind === 'screen';
  const hasVideoTrack = isScreenSharing ? hasScreenShareTrack : !isVideoMuted;
  const mirror = isLoggedInUser && isCameraOnFrontFacingMode;
  const isAudioAvailable =
    kind === 'video' && !!audioStream && !isAudioMuted && !disableAudio;
  const canShowVideo = !!videoStream && isVisible && hasVideoTrack;
  const applySpeakerStyle = isSpeaking && !isScreenSharing;
  const speakerStyle = applySpeakerStyle && styles.isSpeaking;
  const videoOnlyStyle = {
    borderColor: palette.grey800,
    borderWidth: 2,
  };

  const participantLabel = participant.userId;

  // if (isScreenSharing) {
  //   console.log({
  //     isScreenSharing,
  //     hasScreenShareTrack,
  //     isPublishingVideoTrack,
  //     hasVideoTrack,
  //     canShowVideo,
  //     isVisible,
  //     pVideoStream: !!participant.videoStream,
  //     pScreenShareStream: !!participant.screenShareStream,
  //   });
  // }

  return (
    <View
      style={[
        styles.containerBase,
        videoOnlyStyle,
        props.containerStyle,
        speakerStyle,
      ]}
      onLayout={onLayout}
    >
      <View style={styles.topView}>
        <ParticipantReaction reaction={reaction} sessionId={sessionId} />
      </View>
      {canShowVideo ? (
        <VideoRenderer
          zOrder={1}
          mirror={mirror}
          mediaStream={videoStream as MediaStream}
          objectFit={isScreenSharing ? 'contain' : 'cover'}
          style={[styles.videoRenderer, props.videoRendererStyle]}
        />
      ) : (
        <Avatar participant={participant} />
      )}
      {isAudioAvailable && (
        <RTCView streamURL={(audioStream as MediaStream).toURL()} />
      )}
      <View style={styles.bottomView}>
        {kind === 'video' && (
          <View style={styles.status}>
            <Text style={styles.userNameLabel} numberOfLines={1}>
              {participantLabel}
            </Text>
            {isAudioMuted && (
              <View style={[styles.svgContainerStyle, theme.icon.xs]}>
                <MicOff color={theme.light.error} />
              </View>
            )}
            {isVideoMuted && (
              <View style={[styles.svgContainerStyle, theme.icon.xs]}>
                <VideoSlash color={theme.light.error} />
              </View>
            )}
          </View>
        )}
        {kind === 'screen' && (
          <View style={styles.screenViewStatus}>
            <View style={[{ marginRight: theme.margin.sm }, theme.icon.md]}>
              <ScreenShare color={theme.light.static_white} />
            </View>
            <Text style={styles.userNameLabel} numberOfLines={1}>
              {participant.userId} is sharing their screen.
            </Text>
          </View>
        )}
        <NetworkQualityIndicator connectionQuality={connectionQuality} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerBase: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.padding.xs,
  },
  topView: {
    alignSelf: 'flex-end',
    zIndex: 10,
  },
  videoRenderer: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomView: {
    alignSelf: 'stretch',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  status: {
    display: 'flex',
    flexDirection: 'row',
    padding: theme.padding.sm,
    borderRadius: theme.rounded.xs,
    backgroundColor: theme.light.static_overlay,
    flexShrink: 1,
    marginRight: theme.margin.sm,
  },
  screenViewStatus: {
    padding: theme.padding.sm,
    borderRadius: theme.rounded.xs,
    backgroundColor: theme.light.static_overlay,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: theme.margin.sm,
  },
  userNameLabel: {
    flexShrink: 1,
    color: theme.light.static_white,
    ...theme.fonts.caption,
  },
  svgContainerStyle: {
    marginLeft: theme.margin.xs,
  },
  isSpeaking: {
    borderColor: theme.light.primary,
    borderWidth: 2,
  },
});
