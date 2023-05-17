import {
  OwnCapability,
  SfuModels,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { Cross, VideoDisabled } from '../icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { generateParticipantTitle } from '../utils';
import { useCallback } from 'react';
import { Avatar } from './Avatar';
import { theme } from '../theme';
import { useCall, useOwnCapabilities } from '@stream-io/video-react-bindings';

type CallParticipantOptionType = {
  title: string;
  icon?: JSX.Element;
  onPressHandler: () => void;
};

type CallParticipantOptionsType = {
  participant: StreamVideoParticipant;
  setSelectedParticipant: React.Dispatch<
    React.SetStateAction<StreamVideoParticipant | undefined>
  >;
};

export const CallParticipantOptions = (props: CallParticipantOptionsType) => {
  const { participant, setSelectedParticipant } = props;
  const ownCapabilities = useOwnCapabilities();
  const call = useCall();

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

  const muteUser = async (userId: string, mediaType: 'audio' | 'video') => {
    await call?.muteUser(userId, mediaType);
  };

  const blockUser = async (userId: string) => {
    await call?.blockUser(userId);
  };

  const callMediaStreamMutePermissions: (CallParticipantOptionType | null)[] =
    ownCapabilities.includes(OwnCapability.MUTE_USERS)
      ? [
          participant.publishedTracks.includes(SfuModels.TrackType.VIDEO)
            ? {
                title: 'Mute Video',
                onPressHandler: async () => {
                  await muteUser(participant.userId, 'video');
                },
              }
            : null,
          participant.publishedTracks.includes(SfuModels.TrackType.AUDIO)
            ? {
                title: 'Mute Audio',
                onPressHandler: async () => {
                  await muteUser(participant.userId, 'audio');
                },
              }
            : null,
        ]
      : [];

  const callMediaStreamPermissions: (CallParticipantOptionType | null)[] =
    ownCapabilities.includes(OwnCapability.UPDATE_CALL_PERMISSIONS)
      ? [
          {
            icon: <VideoDisabled color={theme.light.text_high_emphasis} />,
            title: 'Disable Video',
            onPressHandler: async () =>
              await revokePermission(OwnCapability.SEND_VIDEO),
          },
          {
            title: 'Disable Audio',
            onPressHandler: async () =>
              await revokePermission(OwnCapability.SEND_AUDIO),
          },
          {
            title: 'Allow Audio',
            onPressHandler: async () =>
              await grantPermission(OwnCapability.SEND_AUDIO),
          },
          {
            title: 'Allow Video',
            onPressHandler: async () =>
              await grantPermission(OwnCapability.SEND_VIDEO),
          },
          {
            title: 'Allow Screen Sharing',
            onPressHandler: async () =>
              await grantPermission(OwnCapability.SCREENSHARE),
          },
          {
            title: 'Disable Screen Sharing',
            onPressHandler: async () =>
              await revokePermission(OwnCapability.SCREENSHARE),
          },
        ]
      : [];

  const options: (CallParticipantOptionType | null)[] = [
    ownCapabilities.includes(OwnCapability.BLOCK_USERS)
      ? {
          title: 'Block',
          onPressHandler: async () => await blockUser(participant.userId),
        }
      : null,
    ...callMediaStreamMutePermissions,
    ...callMediaStreamPermissions,
  ];

  const onCloseParticipantOptions = useCallback(() => {
    setSelectedParticipant(undefined);
  }, [setSelectedParticipant]);

  const showYouLabel = participant.isLoggedInUser;

  return (
    <View style={styles.container}>
      <View style={styles.menu}>
        <View style={styles.participantInfo}>
          <View style={styles.userInfo}>
            <Avatar radius={theme.avatar.xs} participant={participant} />

            <Text style={styles.name}>
              {generateParticipantTitle(participant.userId) +
                (showYouLabel ? ' (You)' : '')}
            </Text>
          </View>

          <Pressable
            style={[styles.svgContainerStyle, theme.icon.sm]}
            onPress={onCloseParticipantOptions}
          >
            <Cross color={theme.light.primary} />
          </Pressable>
        </View>
        <View style={styles.options}>
          {options.map((option, index) => {
            const applyBottomPadding =
              index < options.length - 1 ? styles.borderBottom : null;
            return (
              option && (
                <Pressable
                  style={[applyBottomPadding, styles.option]}
                  key={option.title}
                  onPress={option.onPressHandler}
                >
                  <View style={[styles.svgContainerStyle, theme.icon.sm]}>
                    {option.icon}
                  </View>
                  <Text style={styles.title}>{option.title}</Text>
                </Pressable>
              )
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    paddingHorizontal: theme.padding.xl,
  },
  menu: {
    backgroundColor: theme.light.bars,
    borderRadius: theme.rounded.md,
  },
  participantInfo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.padding.md,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    marginLeft: theme.margin.sm,
    ...theme.fonts.subtitleBold,
  },
  svgContainerStyle: {},
  options: {},
  option: {
    paddingHorizontal: theme.padding.md,
    paddingVertical: theme.padding.sm,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: theme.margin.md,
    color: theme.light.text_high_emphasis,
    ...theme.fonts.subtitle,
  },
  borderBottom: {
    borderBottomColor: theme.light.borders,
    borderBottomWidth: 1,
  },
});
