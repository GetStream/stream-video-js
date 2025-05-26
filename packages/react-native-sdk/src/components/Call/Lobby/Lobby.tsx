import React, { type ComponentType, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-bindings';
import { Avatar } from '../../utility/Avatar';
import type { StreamVideoParticipant } from '@stream-io/video-client';
import type { MediaStream } from '@stream-io/react-native-webrtc';
import { RTCView } from '@stream-io/react-native-webrtc';
import { LobbyControls as DefaultLobbyControls } from '../CallControls/LobbyControls';
import {
  JoinCallButton as DefaultJoinCallButton,
  type JoinCallButtonProps,
} from './JoinCallButton';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  LobbyFooter as DefaultLobbyFooter,
  type LobbyFooterProps,
} from './LobbyFooter';

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
  /**
   * Component to customize the Lobby Footer in the Lobby component.
   */
  LobbyFooter?: ComponentType<LobbyFooterProps> | null;
};

/**
 * Components that acts as a pre-join view for the call. Where you can preview your video and audio. Check for call details and check for number of participants already in the call.
 */
export const Lobby = ({
  onJoinCallHandler,
  LobbyControls = DefaultLobbyControls,
  JoinCallButton = DefaultJoinCallButton,
  landscape = false,
  LobbyFooter = DefaultLobbyFooter,
}: LobbyProps) => {
  const {
    theme: { colors, lobby, typefaces },
  } = useTheme();
  const styles = useStyles(landscape);
  const connectedUser = useConnectedUser();
  const { useCameraState, useCallSettings } = useCallStateHooks();
  const callSettings = useCallSettings();
  const isVideoEnabledInCall = callSettings?.video.enabled;
  const { isMute: cameraIsMuted, mediaStream } = useCameraState();
  const { t } = useI18n();
  const localVideoStream = mediaStream as unknown as MediaStream | undefined;

  const connectedUserAsParticipant = {
    userId: connectedUser?.id,
    image: connectedUser?.image,
    name: connectedUser?.name,
  } as StreamVideoParticipant;

  return (
    <View style={[styles.container, lobby.container]}>
      {connectedUser && (
        <>
          <Text style={[styles.heading, typefaces.heading5, lobby.heading]}>
            {t('Before joining')}
          </Text>
          <Text style={[styles.subHeading, lobby.subHeading]}>
            {t('Setup your audio and video')}
          </Text>
          {isVideoEnabledInCall && (
            <View
              style={[
                styles.videoContainer,
                { backgroundColor: colors.sheetTertiary },
                lobby.videoContainer,
              ]}
            >
              <View style={styles.topView} />
              {!cameraIsMuted && localVideoStream ? (
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
          )}
        </>
      )}
      {LobbyControls && <LobbyControls />}
      {LobbyFooter && (
        <LobbyFooter
          JoinCallButton={JoinCallButton}
          onJoinCallHandler={onJoinCallHandler}
        />
      )}
    </View>
  );
};

const ParticipantStatus = () => {
  const {
    theme: { colors, typefaces, lobby },
  } = useTheme();
  const styles = useStyles();
  const connectedUser = useConnectedUser();
  const participantLabel = connectedUser?.name ?? connectedUser?.id;
  return (
    <View
      style={[
        styles.participantStatusContainer,
        { backgroundColor: colors.sheetOverlay },
        lobby.participantStatusContainer,
      ]}
    >
      <Text
        style={[
          styles.userNameLabel,
          { color: colors.textPrimary },
          typefaces.caption,
          lobby.userNameLabel,
        ]}
        numberOfLines={1}
      >
        {participantLabel}
      </Text>
    </View>
  );
};

const useStyles = (landscape = false) => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        heading: {
          textAlign: 'center',
          color: theme.colors.textPrimary,
          paddingBottom: theme.variants.spacingSizes.xs,
        },
        subHeading: {
          textAlign: 'center',
          paddingBottom: theme.variants.spacingSizes.md,
          color: theme.colors.textSecondary,
        },
        container: {
          flex: 1,
          justifyContent: 'center',
          backgroundColor: theme.colors.sheetPrimary,
          paddingRight:
            theme.variants.insets.right + theme.variants.spacingSizes.sm,
          paddingLeft:
            theme.variants.insets.left + theme.variants.spacingSizes.sm,
          paddingTop: theme.variants.insets.top,
          paddingBottom: theme.variants.insets.bottom,
        },
        videoContainer: {
          height: landscape ? '40%' : '50%',
          borderRadius: theme.variants.borderRadiusSizes.md,
          justifyContent: 'space-between',
          alignItems: 'center',
          overflow: 'hidden',
        },
        topView: {},
        participantStatusContainer: {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          padding: theme.variants.spacingSizes.sm,
          borderTopRightRadius: theme.variants.borderRadiusSizes.sm,
        },
        avatarContainer: {
          flex: 2,
          justifyContent: 'center',
        },
        userNameLabel: {
          flexShrink: 1,
        },
      }),
    [theme, landscape],
  );
};
