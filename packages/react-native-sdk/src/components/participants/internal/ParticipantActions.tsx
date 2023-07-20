import {
  OwnCapability,
  SfuModels,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import {
  Cross,
  Mic,
  MicOff,
  Pin,
  ScreenShare,
  Video,
  VideoDisabled,
  VideoSlash,
} from '../../../icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { generateParticipantTitle } from '../../../utils';
import React, { useCallback } from 'react';
import { Avatar } from '../../utility/Avatar';
import { theme } from '../../../theme';
import {
  useCall,
  useHasPermissions,
  useI18n,
} from '@stream-io/video-react-bindings';
import { palette } from '../../../theme/constants';

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
  const { t } = useI18n();
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
    call?.setParticipantPinnedAt(
      participant.sessionId,
      participant.pinnedAt ? undefined : Date.now(),
    );
  };

  const participantPublishesVideo = participant.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );
  const participantPublishesAudio = participant.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );

  const muteUserVideoOption = participantPublishesVideo
    ? {
        icon: <VideoSlash color={theme.dark.text_high_emphasis} />,
        title: 'Mute Video',
        onPressHandler: muteUserVideo,
      }
    : null;

  const muteUserAudioOption = participantPublishesAudio
    ? {
        icon: <MicOff color={theme.dark.text_high_emphasis} />,
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
            icon: <VideoDisabled color={theme.dark.text_high_emphasis} />,
            title: 'Disable Video',
            onPressHandler: async () =>
              await revokePermission(OwnCapability.SEND_VIDEO),
          },
          {
            icon: <MicOff color={theme.dark.text_high_emphasis} />,
            title: 'Disable Audio',
            onPressHandler: async () =>
              await revokePermission(OwnCapability.SEND_AUDIO),
          },
          {
            icon: <Mic color={theme.dark.text_high_emphasis} />,
            title: 'Allow Audio',
            onPressHandler: async () =>
              await grantPermission(OwnCapability.SEND_AUDIO),
          },
          {
            icon: <Video color={theme.dark.text_high_emphasis} />,
            title: 'Allow Video',
            onPressHandler: async () =>
              await grantPermission(OwnCapability.SEND_VIDEO),
          },
          {
            icon: <ScreenShare color={theme.dark.text_high_emphasis} />,
            title: 'Allow Screen Sharing',
            onPressHandler: async () =>
              await grantPermission(OwnCapability.SCREENSHARE),
          },
          {
            icon: <Cross color={theme.dark.text_high_emphasis} />,
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
            icon: <Cross color={theme.dark.text_high_emphasis} />,
            title: 'Block',
            onPressHandler: blockUser,
          },
        ]
      : [];

  const pinParticipant: CallParticipantOptionType | null = {
    icon: <Pin color={theme.dark.text_high_emphasis} />,
    title: participant.pinnedAt ? 'Unpin' : 'Pin',
    onPressHandler: toggleParticipantPinnedAt,
  };

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
            <Avatar radius={theme.avatar.xs} participant={participant} />
            <Text style={styles.name}>
              {generateParticipantTitle(participant.userId) +
                (showYouLabel ? ` ${t('You')}` : '')}
            </Text>
          </View>
          <Pressable
            style={styles.closePressable}
            onPress={onCloseParticipantOptions}
          >
            <Cross color={theme.dark.primary} style={theme.icon.xs} />
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
              <View style={theme.icon.sm}>{option.icon}</View>
              <Text style={styles.title}>{option.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  modalContainer: {
    backgroundColor: theme.dark.bars,
    borderRadius: theme.rounded.md,
    marginHorizontal: theme.margin.xl,
  },
  participantInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.padding.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    marginLeft: theme.margin.sm,
    ...theme.fonts.subtitleBold,
    color: theme.dark.text_high_emphasis,
  },
  option: {
    paddingHorizontal: theme.padding.lg,
    paddingVertical: theme.padding.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: theme.margin.md,
    color: theme.dark.text_high_emphasis,
    ...theme.fonts.subtitle,
  },
  borderBottom: {
    borderBottomColor: theme.dark.borders,
    borderBottomWidth: 1,
  },
  closePressable: {
    padding: theme.padding.sm,
    borderRadius: theme.rounded.xs,
    backgroundColor: palette.grey800,
  },
});
