import { useActiveRingCallDetails } from '@stream-io/video-react-bindings';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

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
    width: '90%',
  },
  avatar: {
    borderRadius: 100,
  },
  largeAvatar: {
    height: 200,
    width: 200,
  },
  mediumAvatar: {
    height: 110,
    width: 110,
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

const MAX_AVATARS_IN_VIEW = 3;
export type SizeType = 'small' | 'medium' | 'large';

// Utility to join strings with commas and 'and'
function addCommasAndAnd(list: string[]) {
  if (list.length < MAX_AVATARS_IN_VIEW) {
    return list.join(' and ');
  }
  return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
}

export const UserInfoView = () => {
  const activeRingCallDetails = useActiveRingCallDetails();

  const memberUserIds = activeRingCallDetails?.memberUserIds || [];
  let name = addCommasAndAnd(memberUserIds);

  const avatarStyles =
    memberUserIds.length > 2
      ? styles.smallAvatar
      : memberUserIds.length === 2
      ? styles.mediumAvatar
      : styles.largeAvatar;

  return (
    <View style={styles.userInfo}>
      <View style={styles.avatarView}>
        {memberUserIds.slice(0, MAX_AVATARS_IN_VIEW).map((member) => {
          return (
            <Image
              key={member}
              style={[styles.avatar, avatarStyles]}
              source={{
                uri: `https://getstream.io/random_png/?id=${member}&name=${member}`,
              }}
            />
          );
        })}
      </View>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
};
