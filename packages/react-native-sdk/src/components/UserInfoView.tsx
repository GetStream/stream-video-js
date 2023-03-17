import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { MAX_AVATARS_IN_VIEW } from '../constants';
import {
  generateCallTitle,
  getMembersForIncomingCall,
  getMembersForOutgoingCall,
} from '../utils';
import {
  useConnectedUser,
  useIncomingCalls,
  useOutgoingCalls,
} from '@stream-io/video-react-bindings';
import { UserResponse } from '@stream-io/video-client';
import { theme } from '../theme';

enum AvatarModes {
  small = 'sm',
  medium = 'md',
  large = 'lg',
}

export const UserInfoView = () => {
  const [outgoingCall] = useOutgoingCalls();
  const [incomingCall] = useIncomingCalls();
  const connectedUser = useConnectedUser();

  let members: UserResponse[] = [];
  if (outgoingCall) {
    members = getMembersForOutgoingCall(outgoingCall);
  } else if (incomingCall) {
    members = getMembersForIncomingCall(incomingCall, connectedUser);
  }

  const memberUserIds = members.map((member) => member.name || member.id);

  const callTitle = generateCallTitle(memberUserIds);
  const supportedAmountOfMembers = members.slice(0, MAX_AVATARS_IN_VIEW);

  const avatarSizeModes: { [key: number]: AvatarModes } = {
    1: AvatarModes.large,
    2: AvatarModes.medium,
    3: AvatarModes.small,
  };

  const mode = avatarSizeModes[memberUserIds.length] || AvatarModes.small;

  const avatarStyles = {
    height: theme.avatar[mode],
    width: theme.avatar[mode],
    borderRadius: theme.avatar[mode] / 2,
  };

  return (
    <View style={styles.userInfo}>
      <View style={styles.avatarGroup}>
        {supportedAmountOfMembers.map((member) => {
          return (
            <Image
              key={member.id}
              style={[avatarStyles]}
              // FIXME: use real avatar from coordinator this is temporary
              source={{
                uri: member.image,
              }}
            />
          );
        })}
      </View>
      <Text
        style={[
          styles.name,
          memberUserIds.length > 1
            ? theme.fonts.heading5
            : theme.fonts.heading4,
        ]}
      >
        {callTitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  userInfo: {
    paddingHorizontal:
      Platform.OS === 'android' ? theme.padding.xl * 4 : theme.padding.xl * 2,
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
    color: theme.light.static_white,
    textAlign: 'center',
    marginTop: theme.margin.xl,
  },
});
