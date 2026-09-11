import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  useCallStateHooks,
  useConnectedUser,
} from '@stream-io/video-react-bindings';
import { type UserResponse } from '@stream-io/video-client';
import { generateCallTitle } from '../../../utils';
import { useTheme } from '../../../contexts/ThemeContext';
import { AvatarGroup } from '../../utility/AvatarGroup';

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
  /**
   * The color of the name text.
   * @default 'primary'.
   */
  color?: 'primary' | 'accent';
};

export const UserInfo = ({
  includeSelf = false,
  totalMembersToShow = 5,
  color = 'primary',
}: UserInfoType) => {
  const {
    theme: { userInfo },
  } = useTheme();
  const connectedUser = useConnectedUser();
  const { useCallMembers } = useCallStateHooks();
  const members = useCallMembers();

  // take the first N members to show their avatars
  const visibleMembers = (members || []).filter(
    (user) => user.user_id !== connectedUser?.id || includeSelf,
  );

  // take the first N members to show their avatars
  const membersToShow: UserResponse[] = visibleMembers
    .slice(0, totalMembersToShow)
    .map(({ user }) => user);

  if (
    includeSelf &&
    !membersToShow.find((user) => user.id === connectedUser?.id)
  ) {
    // if the current user is not in the initial batch of members,
    // replace the first item in membersToShow array with the current user
    const self = members.find(({ user }) => user.id === connectedUser?.id);
    if (self) {
      membersToShow.splice(0, 1, self.user);
    }
  }

  const memberUserIds = visibleMembers.map(({ user }) => user.name ?? user.id);
  const callTitle = generateCallTitle(memberUserIds);

  return (
    <View style={[styles.container, userInfo.container]}>
      <AvatarGroup users={membersToShow} size="3xl" />
      <Text
        style={[styles.name, userInfo.name, userInfo.nameVariants[color]]}
        numberOfLines={2}
      >
        {callTitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    alignSelf: 'stretch',
    textAlign: 'center',
  },
});
