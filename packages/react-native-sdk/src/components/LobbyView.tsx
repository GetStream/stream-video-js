import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import { Mic, MicOff, Video, VideoSlash } from '../icons';
import {
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { useStreamVideoStoreValue } from '../contexts/StreamVideoContext';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../theme';
import { useCallCycleContext } from '../contexts';
import { useMutingState } from '../hooks/useMutingState';
import { useLocalVideoStream } from '../hooks';
import { VideoRenderer } from './VideoRenderer';
import { Avatar } from './Avatar';
import { StreamVideoParticipant } from '@stream-io/video-client';

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
  const { isAudioMuted, isVideoMuted } = useMutingState();
  return (
    <View style={styles.status}>
      <Text style={styles.userNameLabel}>{connectedUser?.id}</Text>
      {isAudioMuted && (
        <View style={styles.svgWrapper}>
          <MicOff color={theme.light.error} />
        </View>
      )}
      {isVideoMuted && (
        <View style={styles.svgWrapper}>
          {isVideoMuted && <VideoSlash color={theme.light.error} />}
        </View>
      )}
    </View>
  );
};

export const LobbyView = (props: LobbyViewProps) => {
  const localVideoStream = useLocalVideoStream();
  const videoClient = useStreamVideoClient();
  const connectedUser = useConnectedUser();
  const { callCycleHandlers } = useCallCycleContext();
  const { isAudioMuted, isVideoMuted, toggleAudioState, toggleVideoState } =
    useMutingState();
  const isCameraOnFrontFacingMode = useStreamVideoStoreValue(
    (store) => store.isCameraOnFrontFacingMode,
  );
  const isVideoAvailable = !!localVideoStream && !isVideoMuted;
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
  const connectedUserAsParticipant = {
    userId: connectedUser?.id,
    // @ts-ignore
    image: connectedUser?.imageUrl,
    name: connectedUser?.name,
  } as StreamVideoParticipant;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Before Joining</Text>
      <Text style={styles.subHeading}>Setup your audio and video</Text>
      <View style={styles.videoView}>
        {isVideoAvailable ? (
          <VideoRenderer
            mirror={isCameraOnFrontFacingMode}
            mediaStream={localVideoStream}
            objectFit="cover"
            style={styles.stream}
          />
        ) : (
          <Avatar participant={connectedUserAsParticipant} />
        )}
        <ParticipantStatus />
      </View>

      <View style={styles.buttons}>
        <CallControlsButton
          onPress={toggleAudioState}
          color={
            !isAudioMuted ? theme.light.static_white : theme.light.static_black
          }
          style={styles.button}
        >
          {MicIcon}
        </CallControlsButton>
        <CallControlsButton
          onPress={toggleVideoState}
          color={
            !isVideoMuted ? theme.light.static_white : theme.light.static_black
          }
          style={styles.button}
        >
          {VideoIcon}
        </CallControlsButton>
      </View>
      <View style={styles.info}>
        <Text style={styles.infoText}>
          You are about to join a test call at Stream. 3 more people are in the
          call now.
        </Text>
        <Pressable style={styles.joinButton} onPress={joinCallHandler}>
          <Text style={styles.joinButtonText}>Join</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.light.static_grey,
    justifyContent: 'center',
    flex: 1,
  },
  content: {
    position: 'absolute',
    bottom: 10,
  },
  heading: {
    color: theme.light.static_white,
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stream: {
    height: '100%',
    width: '100%',
  },
  subHeading: {
    color: theme.light.text_low_emphasis,
    fontSize: 20,
    textAlign: 'center',
  },
  videoView: {
    backgroundColor: theme.light.disabled,
    height: 280,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginVertical: 30,
    borderRadius: 20,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '90%',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    height: 70,
    width: 70,
    borderRadius: 70,
    marginHorizontal: 10,
  },
  info: {
    backgroundColor: theme.light.static_overlay,
    padding: 15,
    marginHorizontal: '5%',
    borderRadius: 10,
    marginVertical: 30,
  },
  infoText: {
    color: theme.light.static_white,
    fontSize: 15,
    fontWeight: '600',
  },
  joinButton: {
    width: '100%',
    backgroundColor: theme.light.primary,
    borderRadius: 10,
    marginTop: 20,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  joinButtonText: {
    color: theme.light.static_white,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: 6,
    bottom: 6,
    padding: 6,
    borderRadius: 6,
    backgroundColor: theme.light.static_overlay,
    zIndex: 10,
  },
  avatar: {
    height: 100,
    width: 100,
    borderRadius: 100,
    alignSelf: 'center',
  },
  userNameLabel: {
    color: theme.light.static_white,
    fontSize: 12,
  },
  svgWrapper: {
    height: 12,
    width: 12,
    marginLeft: 6,
  },
});
