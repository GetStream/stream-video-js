import React, { ComponentType } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MicOff } from '../../../icons';
import {
  useCall,
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-bindings';
import { Avatar } from '../../utility/Avatar';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { LOBBY_VIDEO_VIEW_HEIGHT } from '../../../constants';
import { RTCView } from '@stream-io/react-native-webrtc';
import { LobbyControls as DefaultLobbyControls } from '../CallControls/LobbyControls';
import {
  JoinCallButton as DefaultJoinCallButton,
  JoinCallButtonProps,
} from './JoinCallButton';
import { useTheme } from '../../../contexts/ThemeContext';
import { useCallMediaStreamCleanup } from '../../../hooks/internal/useCallMediaStreamCleanup';
import type { MediaStream } from '@stream-io/react-native-webrtc';

/**
 * Props for the Lobby Component.
 */
export type LobbyProps = {
  /**
   * Handler to be called to join a call.
   */
  onJoinCallHandler?: () => void;
  /**
   * Component to customize the LobbyControls component.
   */
  LobbyControls?: ComponentType<{}> | null;
  /**
   * Component to customize the Join Call Button in the Lobby component.
   */
  JoinCallButton?: ComponentType<JoinCallButtonProps> | null;
  /**
   * Check if device is in landscape mode.
   * This will apply the landscape mode styles to the component.
   */
  landscape?: boolean;
};

/**
 * Components that acts as a pre-join view for the call. Where you can preview your video and audio. Check for call details and check for number of participants already in the call.
 */
export const Lobby = ({
  onJoinCallHandler,
  LobbyControls = DefaultLobbyControls,
  JoinCallButton = DefaultJoinCallButton,
  landscape = false,
}: LobbyProps) => {
  const {
    theme: { colors, lobby, typefaces },
  } = useTheme();
  const connectedUser = useConnectedUser();
  const { useCameraState, useCallSession } = useCallStateHooks();
  const { status: cameraStatus } = useCameraState();
  const call = useCall();
  const session = useCallSession();
  const { t } = useI18n();
  const localVideoStream = call?.camera.state.mediaStream as unknown as
    | MediaStream
    | undefined;
  const participantsCount = session?.participants.length;

  useCallMediaStreamCleanup();

  const connectedUserAsParticipant = {
    userId: connectedUser?.id,
    image: connectedUser?.image,
    name: connectedUser?.name,
  } as StreamVideoParticipant;

  const landScapeStyles: ViewStyle = {
    flexDirection: landscape ? 'row' : 'column',
  };

  return (
    <View
      style={[
        styles.container,
        landScapeStyles,
        { backgroundColor: colors.static_grey },
        lobby.container,
      ]}
    >
      {connectedUser && (
        <View style={[styles.topContainer, lobby.topContainer]}>
          <Text
            style={[
              styles.heading,
              { color: colors.static_white },
              typefaces.heading4,
              lobby.heading,
            ]}
          >
            {t('Before Joining')}
          </Text>
          <Text
            style={[
              styles.subHeading,
              { color: colors.text_low_emphasis },
              typefaces.subtitle,
            ]}
          >
            {t('Setup your audio and video')}
          </Text>
          <View
            style={[
              styles.videoContainer,
              { backgroundColor: colors.disabled },
              lobby.videoContainer,
            ]}
          >
            <View style={styles.topView} />
            {cameraStatus === 'enabled' && localVideoStream ? (
              <RTCView
                mirror={true}
                streamURL={localVideoStream.toURL()}
                objectFit="cover"
                style={StyleSheet.absoluteFillObject}
              />
            ) : (
              <View style={[styles.avatarContainer, lobby.avatarContainer]}>
                <Avatar participant={connectedUserAsParticipant} />
              </View>
            )}
            <ParticipantStatus />
          </View>
        </View>
      )}
      <View style={[styles.bottomContainer, lobby.bottomContainer]}>
        {LobbyControls && <LobbyControls />}
        <View
          style={[
            styles.infoContainer,
            { backgroundColor: colors.static_overlay },
            lobby.infoContainer,
          ]}
        >
          <Text
            style={[
              { color: colors.static_white },
              typefaces.subtitleBold,
              lobby.infoText,
            ]}
          >
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
          {JoinCallButton && (
            <JoinCallButton onJoinCallHandler={onJoinCallHandler} />
          )}
        </View>
      </View>
    </View>
  );
};

const ParticipantStatus = () => {
  const {
    theme: {
      colors,
      typefaces,
      lobby,
      variants: { iconSizes },
    },
  } = useTheme();
  const connectedUser = useConnectedUser();
  const { useMicrophoneState } = useCallStateHooks();
  const participantLabel = connectedUser?.name ?? connectedUser?.id;
  const { status: micStatus } = useMicrophoneState();
  return (
    <View
      style={[
        styles.participantStatusContainer,
        {
          backgroundColor: colors.static_overlay,
        },
        lobby.participantStatusContainer,
      ]}
    >
      <Text
        style={[
          styles.userNameLabel,
          { color: colors.static_white },
          typefaces.caption,
          lobby.userNameLabel,
        ]}
        numberOfLines={1}
      >
        {participantLabel}
      </Text>
      {(!micStatus || micStatus === 'disabled') && (
        <View
          style={[
            styles.audioMutedIconContainer,
            {
              height: iconSizes.xs,
              width: iconSizes.xs,
            },
            lobby.audioMutedIconContainer,
          ]}
        >
          <MicOff color={colors.error} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  topContainer: {
    flex: 2,
    justifyContent: 'space-evenly',
    paddingHorizontal: 12,
  },
  heading: {
    textAlign: 'center',
  },
  subHeading: {
    textAlign: 'center',
  },
  videoContainer: {
    height: LOBBY_VIDEO_VIEW_HEIGHT,
    borderRadius: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  topView: {},
  bottomContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingHorizontal: 12,
  },
  infoContainer: {
    padding: 12,
    borderRadius: 10,
  },
  participantStatusContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 5,
  },
  avatarContainer: {
    flex: 2,
    justifyContent: 'center',
  },
  userNameLabel: {
    flexShrink: 1,
  },
  audioMutedIconContainer: {
    marginLeft: 8,
  },
});
