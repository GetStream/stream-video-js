import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Mic, MicOff, Video, VideoSlash } from '../icons';
import {
  useCall,
  useConnectedUser,
  useParticipantCount,
} from '@stream-io/video-react-bindings';
import { useStreamVideoStoreValue } from '../contexts/StreamVideoContext';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../theme';
import { useMutingState } from '../hooks/useMutingState';
import { useLocalVideoStream } from '../hooks';
import { VideoRenderer } from './VideoRenderer';
import { Avatar } from './Avatar';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { LOCAL_VIDEO_VIEW_STYLE } from '../constants';

/**
 * Props for the Lobby View Component
 */
type LobbyViewProps = {
  /**
   * Handler called when the join button is clicked in the Lobby View.
   * @returns void
   */
  onCallJoinHandler: () => void;
};

export const LobbyView = ({ onCallJoinHandler }: LobbyViewProps) => {
  const localVideoStream = useLocalVideoStream();
  const connectedUser = useConnectedUser();
  const { isAudioMuted, isVideoMuted, toggleAudioState, toggleVideoState } =
    useMutingState();
  const isCameraOnFrontFacingMode = useStreamVideoStoreValue(
    (store) => store.isCameraOnFrontFacingMode,
  );
  const isVideoAvailable = !!localVideoStream && !isVideoMuted;
  const count = useParticipantCount();
  const call = useCall();

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

  const connectedUserAsParticipant = {
    userId: connectedUser?.id,
    image: connectedUser?.image,
    name: connectedUser?.name,
  } as StreamVideoParticipant;

  const muteStatusColor = (status: boolean) => {
    return !status ? theme.light.static_white : theme.light.static_black;
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
                onPress={toggleAudioState}
                color={muteStatusColor(isAudioMuted)}
                style={[
                  styles.button,
                  theme.button.md,
                  {
                    shadowColor: muteStatusColor(isAudioMuted),
                  },
                ]}
              >
                {MicIcon}
              </CallControlsButton>
              <CallControlsButton
                onPress={toggleVideoState}
                color={muteStatusColor(isVideoMuted)}
                style={[
                  styles.button,
                  theme.button.md,
                  {
                    shadowColor: muteStatusColor(isVideoMuted),
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
          <Pressable style={styles.joinButton} onPress={onCallJoinHandler}>
            <Text style={styles.joinButtonText}>Join</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const ParticipantStatus = () => {
  const connectedUser = useConnectedUser();
  const { isAudioMuted, isVideoMuted } = useMutingState();
  return (
    <View style={styles.status}>
      <Text style={styles.userNameLabel} numberOfLines={1}>
        {connectedUser?.id}
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
