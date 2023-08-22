import React, { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MicOff } from '../../../icons';
import {
  useCall,
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-bindings';
import { theme } from '../../../theme';
import { useLocalVideoStream } from '../../../hooks';
import { Avatar } from '../../utility/Avatar';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { LOBBY_VIDEO_VIEW_HEIGHT } from '../../../constants';
import { RTCView } from '@stream-io/react-native-webrtc';
import { LobbyControls as DefaultLobbyControls } from '../CallControls/LobbyControls';
import {
  JoinCallButton as DefaultJoinCallButton,
  JoinCallButtonProps,
} from './JoinCallButton';

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
};

/**
 * Components that acts as a pre-join view for the call. Where you can preview your video and audio. Check for call details and check for number of participants already in the call.
 */
export const Lobby = ({
  onJoinCallHandler,
  LobbyControls = DefaultLobbyControls,
  JoinCallButton = DefaultJoinCallButton,
}: LobbyProps) => {
  const connectedUser = useConnectedUser();
  const { useCameraState, useCallSession } = useCallStateHooks();
  const { direction, status: cameraStatus } = useCameraState();
  const localVideoStream = useLocalVideoStream();
  const isVideoAvailable = !!localVideoStream && cameraStatus === 'enabled';
  const call = useCall();
  const session = useCallSession();
  const { t } = useI18n();
  const participantsCount = session?.participants.length;

  const connectedUserAsParticipant = {
    userId: connectedUser?.id,
    image: connectedUser?.image,
    name: connectedUser?.name,
  } as StreamVideoParticipant;

  return (
    <View style={styles.container}>
      {connectedUser && (
        <>
          <Text style={styles.heading}>{t('Before Joining')}</Text>
          <Text style={styles.subHeading}>
            {t('Setup your audio and video')}
          </Text>
          <View style={styles.videoView}>
            <View style={styles.topView} />
            {isVideoAvailable ? (
              <RTCView
                mirror={direction === 'front'}
                streamURL={localVideoStream?.toURL()}
                objectFit="cover"
                style={StyleSheet.absoluteFillObject}
              />
            ) : (
              <View style={styles.avatar}>
                <Avatar participant={connectedUserAsParticipant} />
              </View>
            )}
            <ParticipantStatus />
          </View>
          {LobbyControls && <LobbyControls />}
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
        {JoinCallButton && (
          <JoinCallButton onJoinCallHandler={onJoinCallHandler} />
        )}
      </View>
    </View>
  );
};

const ParticipantStatus = () => {
  const connectedUser = useConnectedUser();
  const { useMicrophoneState } = useCallStateHooks();
  const participantLabel = connectedUser?.name ?? connectedUser?.id;
  const { status: micStatus } = useMicrophoneState();
  return (
    <View style={styles.status}>
      <Text style={styles.userNameLabel} numberOfLines={1}>
        {participantLabel}
      </Text>
      {micStatus === 'disabled' && (
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
    paddingHorizontal: theme.padding.md,
  },
  heading: {
    color: theme.light.static_white,
    textAlign: 'center',
    ...theme.fonts.heading4,
  },
  subHeading: {
    color: theme.light.text_low_emphasis,
    ...theme.fonts.subtitle,
    marginBottom: theme.margin.md,
    textAlign: 'center',
  },
  videoView: {
    backgroundColor: theme.light.disabled,
    height: LOBBY_VIDEO_VIEW_HEIGHT,
    borderRadius: theme.rounded.md,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    padding: theme.padding.sm,
  },
  topView: {},
  info: {
    backgroundColor: theme.light.static_overlay,
    padding: theme.padding.md,
    borderRadius: theme.rounded.sm,
  },
  infoText: {
    color: theme.light.static_white,
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
    flex: 2,
    justifyContent: 'center',
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
