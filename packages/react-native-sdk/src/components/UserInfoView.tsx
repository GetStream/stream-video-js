import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MAX_AVATARS_IN_VIEW } from '../constants';
import { generateCallTitle } from '../utils';

enum AvatarModes {
  small = 'small',
  medium = 'medium',
  large = 'large',
}

export const UserInfoView = () => {
  // const activeCall = useActiveCall();
  // const activeCallDetails = activeCall?.data.details;
  // const incomingCalls = useIncomingCalls();
  // const incomingCallDetails =
  //   incomingCalls.length && incomingCalls[incomingCalls.length - 1].details;
  // FIXME OL: use real data from coordinator
  const memberUserIds = ['alice', 'bob', 'charlie'];
  // (activeCallDetails && activeCallDetails.memberUserIds) ||
  // (incomingCallDetails && incomingCallDetails?.memberUserIds) ||
  // [];
  const callTitle = generateCallTitle(memberUserIds);
  const supportedAmountOfMemberUserIds = memberUserIds.slice(
    0,
    MAX_AVATARS_IN_VIEW,
  );

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
        {supportedAmountOfMemberUserIds.map((member) => {
          return (
            <Image
              key={member}
              style={[styles.avatar, avatarStyles]}
              // FIXME: use real avatar from coordinator this is temporary
              source={{
                uri: `https://getstream.io/random_png/?id=${member}&name=${member}`,
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
    color: 'white',
    fontWeight: '400',
    textAlign: 'center',
  },
});
