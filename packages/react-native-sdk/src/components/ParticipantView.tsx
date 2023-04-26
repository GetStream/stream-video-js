import React, { useEffect, useRef } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MediaStream, RTCView } from 'react-native-webrtc';
import {
  SfuModels,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { useActiveCall } from '@stream-io/video-react-bindings';
import { VideoRenderer } from './VideoRenderer';
import { Avatar } from './Avatar';
import { useStreamVideoStoreValue } from '../contexts';
import { MicOff, ScreenShare, VideoSlash } from '../icons';
import { theme } from '../theme';
import { palette } from '../theme/constants';

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
   * When set to true, the video stream will not be shown even if it is available.
   */
  disableVideo?: boolean;
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
  const { participant, kind, disableVideo, disableAudio } = props;
  const call = useActiveCall();
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

  useEffect(() => {
    // NOTE: We only want to update the subscription if the pendingVideoLayoutRef is set or if the video is disabled
    const updateIsNeeded = pendingVideoLayoutRef.current || disableVideo;

    if (!updateIsNeeded || !call || !isPublishingVideoTrack) return;

    // NOTE: When the participant's video is disabled, we want to subscribe to audio only.
    // We do this by setting the dimension to width and height 0.
    const dimension = disableVideo
      ? { width: 0, height: 0 }
      : pendingVideoLayoutRef.current;

    call.updateSubscriptionsPartial(kind, {
      [participant.sessionId]: { dimension },
    });

    subscribedVideoLayoutRef.current = pendingVideoLayoutRef.current;
    pendingVideoLayoutRef.current = undefined;
  }, [call, isPublishingVideoTrack, kind, participant.sessionId, disableVideo]);

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
    // or the video is disabled, we store the dimensions and handle it
    // when the track is published or the video is enabled.
    if (!call || !isPublishingVideoTrack || disableVideo) {
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
  const isScreenSharing = kind === 'screen';
  const mirror = isLoggedInUser && isCameraOnFrontFacingMode;
  const isAudioAvailable =
    kind === 'video' && !!audioStream && !isAudioMuted && !disableAudio;
  const isVideoAvailable = !!videoStream && !isVideoMuted && !disableVideo;
  const applySpeakerStyle = isSpeaking && !isScreenSharing;
  const speakerStyle = applySpeakerStyle && styles.isSpeaking;
  const videoOnlyStyle = !isScreenSharing && {
    borderColor: palette.grey800,
    borderWidth: 2,
  };

  const participantLabel =
    participant.userId.length > 15
      ? `${participant.userId.slice(0, 15)}...`
      : participant.userId;

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
      {isVideoAvailable ? (
        <VideoRenderer
          zOrder={1}
          mirror={mirror}
          mediaStream={videoStream as MediaStream}
          objectFit={kind === 'screen' ? 'contain' : 'cover'}
          style={[styles.videoRenderer, props.videoRendererStyle]}
        />
      ) : (
        <Avatar participant={participant} />
      )}
      {isAudioAvailable && (
        <RTCView streamURL={(audioStream as MediaStream).toURL()} />
      )}
      {kind === 'video' && (
        <View style={styles.status}>
          <Text style={styles.userNameLabel}>{participantLabel}</Text>
          <View style={styles.svgContainerStyle}>
            {isAudioMuted && <MicOff color={theme.light.error} />}
          </View>
          <View style={styles.svgContainerStyle}>
            {isVideoMuted && <VideoSlash color={theme.light.error} />}
          </View>
        </View>
      )}
      {kind === 'screen' && (
        <View style={styles.screenViewStatus}>
          <View style={[{ marginRight: theme.margin.sm }, theme.icon.md]}>
            <ScreenShare color={theme.light.static_white} />
          </View>
          <Text style={styles.userNameLabel}>
            {participant.userId} is sharing their screen
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  containerBase: {
    justifyContent: 'center',
  },
  videoRenderer: {
    flex: 1,
    justifyContent: 'center',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: theme.spacing.sm,
    bottom: theme.spacing.sm,
    padding: theme.padding.sm,
    borderRadius: theme.rounded.xs,
    backgroundColor: theme.light.static_overlay,
  },
  screenViewStatus: {
    position: 'absolute',
    top: theme.spacing.md,
    padding: theme.padding.sm,
    borderRadius: theme.rounded.xs,
    backgroundColor: theme.light.static_overlay,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameLabel: {
    color: theme.light.static_white,
    ...theme.fonts.caption,
  },
  svgContainerStyle: {
    marginLeft: theme.margin.xs,
    ...(theme.icon.xs as object),
  },
  isSpeaking: {
    borderColor: theme.light.primary,
    borderWidth: 2,
  },
});
