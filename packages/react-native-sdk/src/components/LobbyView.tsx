import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Mic, MicOff, Video, VideoSlash } from '../icons';
import {
  useCall,
  useConnectedUser,
  useParticipantCount,
} from '@stream-io/video-react-bindings';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../theme';
import { useLocalVideoStream } from '../hooks';
import { VideoRenderer } from './VideoRenderer';
import { Avatar } from './Avatar';
import { AxiosError, StreamVideoParticipant } from '@stream-io/video-client';
import { LOCAL_VIDEO_VIEW_STYLE } from '../constants';
import { useMediaStreamManagement } from '../providers/MediaStreamManagement';

const ParticipantStatus = () => {
  const connectedUser = useConnectedUser();
  const { initialAudioEnabled, initialVideoEnabled } =
    useMediaStreamManagement();
  return (
    <View style={styles.status}>
      <Text style={styles.userNameLabel} numberOfLines={1}>
        {connectedUser?.id}
      </Text>
      {!initialAudioEnabled && (
        <View style={[styles.svgContainerStyle, theme.icon.xs]}>
          <MicOff color={theme.light.error} />
        </View>
      )}
      {!initialVideoEnabled && (
        <View style={[styles.svgContainerStyle, theme.icon.xs]}>
          <VideoSlash color={theme.light.error} />
        </View>
      )}
    </View>
  );
};

export const LobbyView = () => {
  const localVideoStream = useLocalVideoStream();
  const connectedUser = useConnectedUser();
  const {
    initialAudioEnabled,
    initialVideoEnabled,
    toggleInitialAudioMuteState,
    toggleInitialVideoMuteState,
    isCameraOnFrontFacingMode,
  } = useMediaStreamManagement();
  const isVideoAvailable = !!localVideoStream && initialVideoEnabled;
  const count = useParticipantCount();
  const call = useCall();

  const MicIcon = !initialAudioEnabled ? (
    <MicOff color={theme.light.static_white} />
  ) : (
    <Mic color={theme.light.static_black} />
  );
  const VideoIcon = !initialVideoEnabled ? (
    <VideoSlash color={theme.light.static_white} />
  ) : (
    <Video color={theme.light.static_black} />
  );

  const onJoinCallHandler = useCallback(async () => {
    try {
      await call?.join({ create: true });
    } catch (error) {
      console.log('Error joining call:', error);
      if (error instanceof AxiosError) {
        Alert.alert(error.response?.data.message);
      }
    }
  }, [call]);

  const connectedUserAsParticipant = {
    userId: connectedUser?.id,
    image: connectedUser?.image,
    name: connectedUser?.name,
  } as StreamVideoParticipant;

  const muteStatusColor = (muted: boolean) => {
    return muted ? theme.light.static_black : theme.light.static_white;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {connectedUser && (
          <>
            <Text style={styles.heading}>Before Joining</Text>
            <Text style={styles.subHeading}>Setup your audio and video</Text>
            <View style={styles.videoView}>
              <View style={styles.topView} />
              {isVideoAvailable ? (
                <VideoRenderer
                  mirror={isCameraOnFrontFacingMode}
                  mediaStream={localVideoStream}
                  objectFit="cover"
                  style={StyleSheet.absoluteFillObject}
                />
              ) : (
                <Avatar participant={connectedUserAsParticipant} />
              )}
              <ParticipantStatus />
            </View>
            <View style={styles.buttonGroup}>
              <CallControlsButton
                onPress={toggleInitialAudioMuteState}
                color={muteStatusColor(!initialAudioEnabled)}
                style={[
                  styles.button,
                  theme.button.md,
                  {
                    shadowColor: muteStatusColor(!initialAudioEnabled),
                  },
                ]}
              >
                {MicIcon}
              </CallControlsButton>
              <CallControlsButton
                onPress={toggleInitialVideoMuteState}
                color={muteStatusColor(!initialVideoEnabled)}
                style={[
                  styles.button,
                  theme.button.md,
                  {
                    shadowColor: muteStatusColor(!initialVideoEnabled),
                  },
                ]}
              >
                {VideoIcon}
              </CallControlsButton>
            </View>
          </>
        )}
        <View style={styles.info}>
          <Text style={styles.infoText}>
            You are about to join a call with id {call?.id} at Stream.{' '}
            {count
              ? `${count}  more people are in the call now.`
              : 'You are first to Join the call.'}
          </Text>
          <Pressable style={styles.joinButton} onPress={onJoinCallHandler}>
            <Text style={styles.joinButtonText}>Join</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: theme.padding.md,
  },
  heading: {
    color: theme.light.static_white,
    ...theme.fonts.heading4,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    marginVertical: theme.margin.md,
    width: '100%',
    padding: theme.padding.sm,
  },
  topView: {},
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
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.padding.sm,
    borderRadius: theme.rounded.xs,
    backgroundColor: theme.light.static_overlay,
  },
  avatar: {
    height: theme.avatar.sm,
    width: theme.avatar.sm,
    borderRadius: theme.avatar.sm / 2,
    alignSelf: 'center',
  },
  userNameLabel: {
    flexShrink: 1,
    color: theme.light.static_white,
    ...theme.fonts.caption,
  },
  svgContainerStyle: {
    marginLeft: theme.margin.sm,
  },
});
