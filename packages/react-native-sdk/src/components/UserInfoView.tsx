import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MAX_AVATARS_IN_VIEW } from '../constants';
import { generateCallTitle } from '../utils';
import { theme } from '../theme';

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
    paddingHorizontal: 2 * theme.padding.xl,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  avatarView: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
    width: '100%',
  },
  largeAvatar: {
    height: 200,
    width: 200,
    borderRadius: 100,
  },
  mediumAvatar: {
    height: 120,
    width: 120,
    borderRadius: 60,
  },
  smallAvatar: {
    height: 100,
    width: 100,
    borderRadius: 50,
  },
  name: {
    color: theme.light.static_white,
    textAlign: 'center',
    marginTop: theme.margin.xl,
  },
});
