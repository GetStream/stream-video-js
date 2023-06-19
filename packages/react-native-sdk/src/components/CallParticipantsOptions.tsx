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
import { useCall, useHasPermissions } from '@stream-io/video-react-bindings';

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

  const userHasMuteUsersCapability = useHasPermissions(
    OwnCapability.MUTE_USERS,
  );
  const userHasUpdateCallPermissionsCapability = useHasPermissions(
    OwnCapability.UPDATE_CALL_PERMISSIONS,
  );
  const userHasBlockUserCapability = useHasPermissions(
    OwnCapability.BLOCK_USERS,
  );
  const participantCanPublishVideo = participant.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );
  const participantCanPublishAudio = participant.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );

  const callMediaStreamMutePermissions: (CallParticipantOptionType | null)[] =
    userHasMuteUsersCapability
      ? [
          participantCanPublishVideo
            ? {
                title: 'Mute Video',
                onPressHandler: muteUserVideo,
              }
            : null,
          participantCanPublishAudio
            ? {
                title: 'Mute Audio',
                onPressHandler: muteUserAudio,
              }
            : null,
        ]
      : [];

  const callMediaStreamPermissions: (CallParticipantOptionType | null)[] =
    userHasUpdateCallPermissionsCapability
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
    userHasBlockUserCapability
      ? {
          title: 'Block',
          onPressHandler: blockUser,
        }
      : null,
    ...callMediaStreamMutePermissions,
    ...callMediaStreamPermissions,
  ];

  const onCloseParticipantOptions = useCallback(() => {
    setSelectedParticipant(undefined);
  }, [setSelectedParticipant]);

  const showYouLabel = participant.isLocalParticipant;

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
                <View style={[styles.svgContainerStyle, theme.icon.sm]}>
                  {option.icon}
                </View>
                <Text style={styles.title}>{option.title}</Text>
              </Pressable>
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
    color: theme.light.text_high_emphasis,
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
