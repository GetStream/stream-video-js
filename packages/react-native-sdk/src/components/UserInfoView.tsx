import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MAX_AVATARS_IN_VIEW } from '../constants';
import { generateCallTitle } from '../utils';
import { theme } from '../theme';

enum AvatarModes {
  small = 'sm',
  medium = 'md',
  large = 'lg',
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

  const avatarStyles = {
    height: theme.avatar[mode],
    width: theme.avatar[mode],
    borderRadius: theme.avatar[mode] / 2,
  };

  return (
    <View style={styles.userInfo}>
      <View style={styles.avatarGroup}>
        {supportedAmountOfMemberUserIds.map((member) => {
          return (
            <Image
              key={member}
              style={[avatarStyles]}
              // FIXME: use real avatar from coordinator this is temporary
              source={{
                uri: `https://getstream.io/random_png/?id=${member}&name=${member}`,
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
    paddingHorizontal: theme.padding.xl * 2,
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
