import {
  Avatar,
  hasAudio,
  hasVideo,
  OwnCapability,
  StreamVideoParticipant,
  useCall,
  useCallStateHooks,
  useI18n,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { Cross } from '../assets/Cross';
import { Mic } from '../assets/Mic';
import { MicOff } from '../assets/MicOff';
import { Pin } from '../assets/Pin';
import { ScreenShare } from '../assets/ScreenShare';
import { Video } from '../assets/Video';
import { VideoDisabled } from '../assets/VideoDisabled';
import { VideoSlash } from '../assets/VideoSlash';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useCallback, useMemo } from 'react';
import { generateParticipantTitle } from '../utils';

type CallParticipantOptionType = {
  title: string;
  icon?: JSX.Element;
  onPressHandler: () => void;
};

type ParticipantActionsType = {
  participant: StreamVideoParticipant | undefined;
  setSelectedParticipant: React.Dispatch<
    React.SetStateAction<StreamVideoParticipant | undefined>
  >;
};

export const ParticipantActions = (props: ParticipantActionsType) => {
  const { participant, setSelectedParticipant } = props;
  const call = useCall();
  const {
    theme: { colors },
  } = useTheme();
  const styles = useStyles();
  const { t } = useI18n();
  const { useHasPermissions } = useCallStateHooks();
  const userHasMuteUsersCapability = useHasPermissions(
    OwnCapability.MUTE_USERS,
  );
  const userHasUpdateCallPermissionsCapability = useHasPermissions(
    OwnCapability.UPDATE_CALL_PERMISSIONS,
  );
  const userHasBlockUserCapability = useHasPermissions(
    OwnCapability.BLOCK_USERS,
  );
  const onCloseParticipantOptions = useCallback(() => {
    setSelectedParticipant(undefined);
  }, [setSelectedParticipant]);

  if (!participant) {
    return null;
  }

  const grantPermission = async (permission: string) => {
    await call?.updateUserPermissions({
      user_id: participant.userId,
      grant_permissions: [permission],
    });
  };

  const revokePermission = async (permission: string) => {
    await call?.updateUserPermissions({
      user_id: participant.userId,
      revoke_permissions: [permission],
    });
  };

  const muteUser = async (mediaType: 'audio' | 'video') => {
    await call?.muteUser(participant.userId, mediaType);
  };

  const muteUserAudio = async () => {
    await muteUser('audio');
  };

  const muteUserVideo = async () => {
    await muteUser('video');
  };

  const blockUser = async () => {
    await call?.blockUser(participant.userId);
  };

  const toggleParticipantPinnedAt = () => {
    if (participant.pin) {
      call?.unpin(participant.sessionId);
    } else {
      call?.pin(participant.sessionId);
    }
  };

  const participantPublishesVideo = hasVideo(participant);
  const participantPublishesAudio = hasAudio(participant);

  const muteUserVideoOption = participantPublishesVideo
    ? {
        icon: <VideoSlash color={colors.iconPrimary} />,
        title: 'Mute Video',
        onPressHandler: muteUserVideo,
      }
    : null;

  const muteUserAudioOption = participantPublishesAudio
    ? {
        icon: <MicOff color={colors.iconPrimary} />,
        title: 'Mute Audio',
        onPressHandler: muteUserAudio,
      }
    : null;
  const muteUserCapabilities: (CallParticipantOptionType | null)[] =
    userHasMuteUsersCapability
      ? [muteUserVideoOption, muteUserAudioOption]
      : [];

  const updateCallPermissionsCapabilities: (CallParticipantOptionType | null)[] =
    userHasUpdateCallPermissionsCapability
      ? [
          {
            icon: <VideoDisabled color={colors.iconPrimary} />,
            title: 'Disable Video',
            onPressHandler: async () =>
              await revokePermission(OwnCapability.SEND_VIDEO),
          },
          {
            icon: <MicOff color={colors.iconPrimary} />,
            title: 'Disable Audio',
            onPressHandler: async () =>
              await revokePermission(OwnCapability.SEND_AUDIO),
          },
          {
            icon: <Mic color={colors.iconPrimary} />,
            title: 'Allow Audio',
            onPressHandler: async () =>
              await grantPermission(OwnCapability.SEND_AUDIO),
          },
          {
            icon: <Video color={colors.iconPrimary} />,
            title: 'Allow Video',
            onPressHandler: async () =>
              await grantPermission(OwnCapability.SEND_VIDEO),
          },
          {
            icon: <ScreenShare color={colors.iconPrimary} />,
            title: 'Allow Screen Sharing',
            onPressHandler: async () =>
              await grantPermission(OwnCapability.SCREENSHARE),
          },
          {
            icon: <Cross color={colors.iconPrimary} />,
            title: 'Disable Screen Sharing',
            onPressHandler: async () =>
              await revokePermission(OwnCapability.SCREENSHARE),
          },
        ]
      : [];

  const blockCapabilities: (CallParticipantOptionType | null)[] =
    userHasBlockUserCapability
      ? [
          {
            icon: <Cross color={colors.iconPrimary} />,
            title: 'Block',
            onPressHandler: blockUser,
          },
        ]
      : [];

  const isLocalPinningAllowed = !participant.pin || participant.pin.isLocalPin;
  const pinParticipant: CallParticipantOptionType | null = isLocalPinningAllowed
    ? {
        icon: <Pin color={colors.iconPrimary} />,
        title: participant.pin ? 'Unpin' : 'Pin',
        onPressHandler: toggleParticipantPinnedAt,
      }
    : null;

  const options: (CallParticipantOptionType | null)[] = [
    pinParticipant,
    ...blockCapabilities,
    ...muteUserCapabilities,
    ...updateCallPermissionsCapabilities,
  ];

  const showYouLabel = participant.isLocalParticipant;
  return (
    <View style={styles.outerContainer}>
      <View style={styles.modalContainer}>
        <View style={styles.participantInfo}>
          <View style={styles.userInfo}>
            <Avatar size={50} participant={participant} />
            <Text style={styles.name}>
              {generateParticipantTitle(participant.userId) +
                (showYouLabel ? ` ${t('You')}` : '')}
            </Text>
          </View>
          <Pressable
            style={styles.closePressable}
            onPress={onCloseParticipantOptions}
          >
            <Cross color={colors.iconPrimary} style={styles.crossIcon} />
          </Pressable>
        </View>
        {options.map((option, index) => {
          if (!option) {
            return null;
          }
          const applyBottomPadding =
            index < options.length - 1 ? styles.borderBottom : null;

          const onPressHandler = () => {
            option?.onPressHandler();
            onCloseParticipantOptions();
          };

          return (
            <Pressable
              style={[applyBottomPadding, styles.option]}
              key={option.title}
              onPress={onPressHandler}
            >
              <View style={styles.iconContainer}>{option.icon}</View>
              <Text style={styles.title}>{option.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        outerContainer: {
          justifyContent: 'center',
          flex: 1,
        },
        modalContainer: {
          backgroundColor: theme.colors.sheetPrimary,
          borderRadius: 15,
          marginHorizontal: 32,
        },
        participantInfo: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: 12,
        },
        userInfo: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        name: {
          marginLeft: 8,
          fontSize: 16,
          fontWeight: '500',
          color: theme.colors.iconPrimary,
        },
        option: {
          paddingHorizontal: 24,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
        },
        iconContainer: {
          height: 20,
          width: 20,
        },
        title: {
          marginLeft: 16,
          color: theme.colors.iconPrimary,
          fontSize: 16,
          fontWeight: '400',
        },
        borderBottom: {
          borderBottomColor: theme.colors.sheetTertiary,
          borderBottomWidth: 1,
        },
        crossIcon: {
          height: 15,
          width: 15,
        },
        closePressable: {
          padding: 8,
          borderRadius: 15,
          backgroundColor: theme.colors.buttonSecondary,
        },
      }),
    [theme],
  );
};
