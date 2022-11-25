import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import CallControlsButton from './CallControlsButton';
import { Member } from '@stream-io/video-client/dist/src/gen/video/coordinator/member_v1/member';
import PhoneDown from '../icons/PhoneDown';
import Phone from '../icons/Phone';
import Video from '../icons/Video';

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: 'black',
    opacity: 0.9,
  },
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
  incomingCallText: {
    marginTop: 16,
    fontSize: 20,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.6,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginTop: '40%',
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
  },
});

const sizes = [200, 110, 100];

const UserInfoView = (props: {
  members: { [key: string]: Member };
  memberUserIds: string[];
}) => {
  const { memberUserIds, members } = props;
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

export const IncomingCallView = () => {
  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Text style={styles.name}>Khushal Agarwal</Text>
      </View>
      <Text style={styles.incomingCallText}>Incoming Call...</Text>
      <View style={styles.buttons}>
        <CallControlsButton
          onPress={() => {}}
          colorKey={'cancel'}
          size={70}
          svgContainer={{ height: 30, width: 30 }}
        >
          <PhoneDown color="#ffffff" />
        </CallControlsButton>
        <CallControlsButton
          onPress={() => {}}
          colorKey={true ? 'activated' : 'deactivated'}
          size={70}
          svgContainer={{ height: 25, width: 30 }}
        >
          <Video color="#000000" />
        </CallControlsButton>
        <CallControlsButton
          onPress={() => {}}
          colorKey={'callToAction'}
          size={70}
          svgContainer={{ height: 30, width: 30 }}
        >
          <Phone color="#ffffff" />
        </CallControlsButton>
      </View>
    </View>
  );
};
