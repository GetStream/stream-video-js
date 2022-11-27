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
    height: 200,
    width: 200,
    borderRadius: 100,
  },
  name: {
    marginTop: 45,
    fontSize: 30,
    color: 'white',
    fontWeight: '400',
    textAlign: 'center',
  },
});

const sizes = [200, 110, 100];

export const UserInfoView = () => {
  const activeRingCallDetails = useActiveRingCallDetails();

  const members = activeRingCallDetails?.members || {};
  const memberUserIds = activeRingCallDetails?.memberUserIds || [];
  let name: string;
  if (memberUserIds.length <= 2) {
    name = memberUserIds.join(' and  ');
  } else {
    name = `${memberUserIds.slice(0, 2).join(', ')} and + ${
      memberUserIds.length - 2
    } more`;
  }
  return (
    <View style={styles.userInfo}>
      <View style={styles.avatarView}>
        {Object.values(members)
          .slice(0, 3)
          .map((member) => {
            return (
              <Image
                key={member.userId}
                style={[
                  styles.avatar,
                  {
                    height:
                      sizes[
                        memberUserIds.length > 2 ? 2 : memberUserIds.length - 1
                      ],
                    width:
                      sizes[
                        memberUserIds.length > 2 ? 2 : memberUserIds.length - 1
                      ],
                  },
                ]}
                source={{
                  uri: `https://getstream.io/random_png/?id=${member.userId}&name=${member.userId}`,
                }}
              />
            );
          })}
      </View>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
};
