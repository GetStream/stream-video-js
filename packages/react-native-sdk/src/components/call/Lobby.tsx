import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Mic, MicOff, Video, VideoSlash } from '../../icons';
import {
  useCall,
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-bindings';
import { CallControlsButton } from '../utility/internal/CallControlsButton';
import { theme } from '../../theme';
import { useLocalVideoStream } from '../../hooks';
import { VideoRenderer } from '../utility/internal/VideoRenderer';
import { Avatar } from '../utility/Avatar';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { LOCAL_VIDEO_VIEW_STYLE } from '../../constants';
import { useMediaStreamManagement } from '../../providers/MediaStreamManagement';

/**
 * Use this view prior to joining a call.
 * This view allows the user to toggle their audio and video state before joining a call.
 */
/**
 * The props for the Join Button in the Lobby.
 */
type JoinCallButtonProps = {
  /**
   * Handler called when the join button is clicked in the Lobby.
   * @returns void
   */
  onPressHandler: () => void;
};

/**
 * Props for the Lobby Component.
 */
type LobbyProps = {
  /**
   * Join button props to be passed as an object
   */
  joinCallButton: JoinCallButtonProps;
};

export const Lobby = ({ joinCallButton }: LobbyProps) => {
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
  const call = useCall();
  const { useCallMetadata } = useCallStateHooks();
  const callMetadata = useCallMetadata();
  const { t } = useI18n();
  const participantsCount = callMetadata?.session?.participants.length;

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
            <Text style={styles.heading}>{t('Before Joining')}</Text>
            <Text style={styles.subHeading}>
              {t('Setup your audio and video')}
            </Text>
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
            {t('You are about to join a call with id {{ callId }}.', {
              callId: call?.id,
            }) +
              ' ' +
              (participantsCount
                ? t(
                    '{{ numberOfParticipants }} participant(s) are in the call.',
                    { numberOfParticipants: participantsCount },
                  )
                : t('You are first to Join the call.'))}
          </Text>
          <Pressable
            style={styles.joinButton}
            onPress={joinCallButton.onPressHandler}
          >
            <Text style={styles.joinButtonText}>{t('Join')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const ParticipantStatus = () => {
  const connectedUser = useConnectedUser();
  const participantLabel = connectedUser?.name ?? connectedUser?.id;
  const { initialAudioEnabled } = useMediaStreamManagement();
  return (
    <View style={styles.status}>
      <Text style={styles.userNameLabel} numberOfLines={1}>
        {participantLabel}
      </Text>
      {!initialAudioEnabled && (
        <View style={[styles.svgContainerStyle, theme.icon.xs]}>
          <MicOff color={theme.light.error} />
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
