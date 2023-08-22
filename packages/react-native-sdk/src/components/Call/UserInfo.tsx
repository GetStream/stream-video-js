import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { generateCallTitle } from '../../utils';
import {
  useCallStateHooks,
  useConnectedUser,
} from '@stream-io/video-react-bindings';
import { UserResponse } from '@stream-io/video-client';
import { useTheme } from '../../contexts/ThemeContext';

enum AvatarModes {
  small = 'sm',
  medium = 'md',
  large = 'lg',
}

export type UserInfoType = {
  /**
   * Whether to include the current user in the list of members to show.
   * @default false.
   */
  includeSelf?: boolean;

  /**
   * The maximum number of members to show.
   * @default 3.
   */
  totalMembersToShow?: number;
};

export const UserInfo = ({
  includeSelf = false,
  totalMembersToShow = 3,
}: UserInfoType) => {
  const {
    theme: {
      colors,
      typefaces,
      variants: { avatarSizes },
      userInfo,
    },
  } = useTheme();
  const connectedUser = useConnectedUser();
  const { useCallMembers } = useCallStateHooks();
  const members = useCallMembers();

  // take the first N members to show their avatars
  const membersToShow: UserResponse[] = (members || [])
    .slice(0, totalMembersToShow)
    .map(({ user }) => user)
    .filter((user) => user.id !== connectedUser?.id || includeSelf);
  if (
    includeSelf &&
    !membersToShow.find((user) => user.id === connectedUser?.id)
  ) {
    // if the current user is not in the initial batch of members,
    // add it to the beginning of the list
    const self = members.find(({ user }) => user.id === connectedUser?.id);
    if (self) {
      membersToShow.splice(0, 1, self.user);
    }
  }

  const memberUserIds = membersToShow.map(
    (memberToShow) => memberToShow.name ?? memberToShow.id,
  );

  const callTitle = generateCallTitle(memberUserIds, totalMembersToShow);

  const avatarSizeModes: { [key: number]: AvatarModes } = {
    1: AvatarModes.large,
    2: AvatarModes.medium,
    3: AvatarModes.small,
  };

  const mode = avatarSizeModes[memberUserIds.length] || AvatarModes.small;

  const avatarStyles = {
    height: avatarSizes[mode],
    width: avatarSizes[mode],
    borderRadius: avatarSizes[mode] / 2,
  };

  const fontStyleByMembersCount =
    memberUserIds.length > 1 ? typefaces.heading5 : typefaces.heading4;

  return (
    <View style={[styles.container, userInfo.container]}>
      <View style={[styles.avatarGroup, userInfo.avatarGroup]}>
        {membersToShow.map((memberToShow) => {
          if (!memberToShow.image) {
            return null;
          }
          return (
            <Image
              key={memberToShow.id}
              style={[avatarStyles]}
              // FIXME: use real avatar from coordinator this is temporary
              source={{
                uri: memberToShow.image,
              }}
            />
          );
        })}
      </View>
      <Text
        style={[
          styles.name,
          fontStyleByMembersCount,
          { color: colors.static_white },
          userInfo.name,
        ]}
      >
        {callTitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Platform.OS === 'android' ? 128 : 64,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  avatarGroup: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
  },
  name: {
    textAlign: 'center',
    marginTop: 32,
  },
});
