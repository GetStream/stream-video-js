import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import InCallManager from 'react-native-incall-manager';
import { Mic, MicOff, Video, VideoSlash } from '../icons';
import { MediaStream, RTCView } from 'react-native-webrtc';
import { useMediaDevices } from '../contexts/MediaDevicesContext';
import { getVideoStream } from '@stream-io/video-client';
import {
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import {
  useStreamVideoStoreSetState,
  useStreamVideoStoreValue,
} from '../contexts/StreamVideoContext';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../theme';
import { useCallCycleContext } from '../contexts';
import { LOCAL_VIDEO_VIEW_STYLE } from '../constants';

/**
 * Props to be passed for the ActiveCall component.
 */
export interface LobbyViewProps {
  /**
   * Call ID of the call that is to be joined.
   */
  callID: string;
}

const ParticipantStatus = () => {
  const connectedUser = useConnectedUser();
  const isAudioMuted = useStreamVideoStoreValue((store) => store.isAudioMuted);
  const isVideoMuted = useStreamVideoStoreValue((store) => store.isVideoMuted);
  return (
    <View style={styles.status}>
      <Text style={styles.userNameLabel}>{connectedUser?.id}</Text>
      {isAudioMuted && (
        <View style={[styles.svgContainerStyle, theme.icon.xs]}>
          <MicOff color={theme.light.error} />
        </View>
      )}
      {isVideoMuted && (
        <View style={[styles.svgContainerStyle, theme.icon.xs]}>
          {isVideoMuted && <VideoSlash color={theme.light.error} />}
        </View>
      )}
    </View>
  );
};

export const LobbyView = (props: LobbyViewProps) => {
  const [videoStream, setVideoStream] = useState<MediaStream | undefined>(
    undefined,
  );
  const { currentVideoDevice } = useMediaDevices();
  const videoClient = useStreamVideoClient();
  const connectedUser = useConnectedUser();
  const isAudioMuted = useStreamVideoStoreValue((store) => store.isAudioMuted);
  const isVideoMuted = useStreamVideoStoreValue((store) => store.isVideoMuted);
  const setState = useStreamVideoStoreSetState();
  const { callCycleHandlers } = useCallCycleContext();
  const { onActiveCall } = callCycleHandlers;
  const { callID } = props;

  const MicIcon = isAudioMuted ? (
    <MicOff color={theme.light.static_white} />
  ) : (
    <Mic color={theme.light.static_black} />
  );
  const VideoIcon = isVideoMuted ? (
    <VideoSlash color={theme.light.static_white} />
  ) : (
    <Video color={theme.light.static_black} />
  );

  useEffect(() => {
    const loadVideoStream = async () => {
      const stream = await getVideoStream(currentVideoDevice?.deviceId);
      setVideoStream(stream);
    };
    loadVideoStream();
  }, [currentVideoDevice]);

  const toggleAudioState = () => setState({ isAudioMuted: !isAudioMuted });
  const toggleVideoState = () => setState({ isVideoMuted: !isVideoMuted });

  const joinCallHandler = () => {
    videoClient
      ?.joinCall(callID, 'default')
      .then(() => {
        if (onActiveCall) {
          onActiveCall();
          InCallManager.start({ media: 'video' });
          InCallManager.setForceSpeakerphoneOn(true);
        }
      })
      .catch((err) => {
        console.log('Error joining call', err);
      });
  };

  return (
    <SafeAreaView style={[styles.container, StyleSheet.absoluteFillObject]}>
      <View style={styles.content}>
        <Text style={styles.heading}>Before Joining</Text>
        <Text style={styles.subHeading}>Setup your audio and video</Text>
        {videoStream && !isVideoMuted ? (
          <View style={styles.videoView}>
            <RTCView
              streamURL={videoStream?.toURL()}
              objectFit="cover"
              style={styles.stream}
            />
            <ParticipantStatus />
          </View>
        ) : (
          <View style={styles.videoView}>
            <Image
              source={{ uri: connectedUser?.image }}
              style={styles.avatar}
            />
            <ParticipantStatus />
          </View>
        )}
        <View style={styles.buttonGroup}>
          <CallControlsButton
            onPress={toggleAudioState}
            color={
              !isAudioMuted
                ? theme.light.static_white
                : theme.light.static_black
            }
            style={[
              styles.button,
              theme.button.md,
              {
                shadowColor: !isAudioMuted
                  ? theme.light.static_white
                  : theme.light.static_black,
              },
            ]}
          >
            {MicIcon}
          </CallControlsButton>
          <CallControlsButton
            onPress={toggleVideoState}
            color={
              !isVideoMuted
                ? theme.light.static_white
                : theme.light.static_black
            }
            style={[
              styles.button,
              theme.button.md,
              {
                shadowColor: !isVideoMuted
                  ? theme.light.static_white
                  : theme.light.static_black,
              },
            ]}
          >
            {VideoIcon}
          </CallControlsButton>
        </View>
        <View style={styles.info}>
          <Text style={styles.infoText}>
            You are about to join a test call at Stream. 3 more people are in
            the call now.
          </Text>
          <Pressable style={styles.joinButton} onPress={joinCallHandler}>
            <Text style={styles.joinButtonText}>Join</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.light.static_grey,
  },
  content: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'absolute',
    bottom: theme.spacing.lg,
    marginVertical: theme.margin.md,
    paddingHorizontal: theme.padding.md,
  },
  heading: {
    color: theme.light.static_white,
    ...theme.fonts.heading4,
  },
  stream: {
    flex: 1,
  },
  subHeading: {
    color: theme.light.text_low_emphasis,
    ...theme.fonts.subtitle,
    marginBottom: theme.margin.sm,
  },
  videoView: {
    backgroundColor: theme.light.disabled,
    height: LOCAL_VIDEO_VIEW_STYLE.height * 2,
    borderRadius: LOCAL_VIDEO_VIEW_STYLE.borderRadius * 2,
    justifyContent: 'center',
    overflow: 'hidden',
    marginVertical: theme.margin.md,
    width: '100%',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.margin.md,
  },
  button: {
    marginHorizontal: theme.margin.sm,
  },
  info: {
    backgroundColor: theme.light.static_overlay,
    padding: theme.padding.md,
    borderRadius: theme.rounded.sm,
    width: '100%',
  },
  infoText: {
    color: theme.light.static_white,
    ...theme.fonts.subtitleBold,
  },
  joinButton: {
    backgroundColor: theme.light.primary,
    borderRadius: theme.rounded.sm,
    marginTop: theme.margin.md,
    justifyContent: 'center',
    paddingVertical: theme.padding.sm,
  },
  joinButtonText: {
    color: theme.light.static_white,
    textAlign: 'center',
    ...theme.fonts.subtitleBold,
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
    zIndex: 10,
  },
  avatar: {
    height: theme.avatar.sm,
    width: theme.avatar.sm,
    borderRadius: theme.avatar.sm / 2,
    alignSelf: 'center',
  },
  userNameLabel: {
    color: theme.light.static_white,
    ...theme.fonts.caption,
  },
  svgContainerStyle: {
    marginLeft: theme.margin.sm,
  },
});
