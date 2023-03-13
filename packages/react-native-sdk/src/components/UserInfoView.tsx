import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
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
  small = 'small',
  medium = 'medium',
  large = 'large',
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

  const avatarStyles = styles[`${mode}Avatar`];

  return (
    <View style={styles.userInfo}>
      <View style={styles.avatarView}>
        {supportedAmountOfMembers.map((member) => {
          return (
            <Image
              key={member.id}
              style={[styles.avatar, avatarStyles]}
              // FIXME: use real avatar from coordinator this is temporary
              source={{
                uri: member.image,
              }}
            />
          );
        })}
      </View>
      <Text style={styles.name}>{callTitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  userInfo: {
    textAlign: 'center',
    alignItems: 'center',
    marginTop: 90,
    paddingHorizontal: 55,
  },
  avatarView: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
    width: '100%',
  },
  avatar: {
    borderRadius: 100,
  },
  largeAvatar: {
    height: 200,
    width: 200,
  },
  mediumAvatar: {
    height: 120,
    width: 120,
  },
  smallAvatar: {
    height: 100,
    width: 100,
  },
  name: {
    marginTop: 45,
    fontSize: 30,
    color: theme.light.static_white,
    fontWeight: '400',
    textAlign: 'center',
  },
});
