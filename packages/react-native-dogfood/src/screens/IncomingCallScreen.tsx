import React, { PropsWithChildren } from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import ButtonContainer from '../components/CallControls/ButtonContainer';

import Phone from '../icons/Phone';
import PhoneDown from '../icons/PhoneDown';
import { useRingCall } from '../hooks/useRingCall';
import { useStore } from '../hooks/useStore';
import { useObservableValue } from '../hooks/useObservable';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import Video from '../icons/Video';
import VideoSlash from '../icons/VideoSlash';
import { Member } from '@stream-io/video-client/dist/src/gen/video/coordinator/member_v1/member';

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  background: {
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

const Background = ({
  children,
  memberUserIds,
}: PropsWithChildren<{ memberUserIds: string[] }>) => {
  return memberUserIds.length === 1 ? (
    <ImageBackground
      blurRadius={10}
      source={{
        uri: `https://getstream.io/random_png/?id=${memberUserIds[0]}&name=${memberUserIds[0]}`,
      }}
      style={styles.container}
    >
      {children}
    </ImageBackground>
  ) : (
    <View style={[styles.container, styles.background]}>{children}</View>
  );
};

const IncomingCallScreen = () => {
  const { incomingRingCalls$, activeRingCallDetails$ } = useStore();
  const incomingRingCalls = useObservableValue(incomingRingCalls$);
  const activeRingCallDetails = useObservableValue(activeRingCallDetails$);
  const { answerCall, rejectCall } = useRingCall();
  const isVideoMuted = useAppGlobalStoreValue((store) => store.isVideoMuted);
  const setState = useAppGlobalStoreSetState();

  const members = activeRingCallDetails?.members || {};
  const memberUserIds = activeRingCallDetails?.memberUserIds || [];

  if (incomingRingCalls.length === 0) {
    return null;
  }

  const videoToggle = () => {
    setState({ isVideoMuted: !isVideoMuted });
  };

  return (
    <Background memberUserIds={memberUserIds}>
      <UserInfoView memberUserIds={memberUserIds} members={members} />
      <Text style={styles.incomingCallText}>Incoming Call...</Text>
      <View style={styles.buttons}>
        <ButtonContainer
          onPress={rejectCall}
          colorKey={'cancel'}
          size={70}
          svgContainer={{ height: 30, width: 30 }}
        >
          <PhoneDown color="#fff" />
        </ButtonContainer>
        <ButtonContainer
          onPress={videoToggle}
          colorKey={isVideoMuted ? 'activated' : 'deactivated'}
          size={70}
          svgContainer={{ height: 25, width: 30 }}
        >
          {isVideoMuted ? (
            <Video color="black" />
          ) : (
            <VideoSlash color="white" />
          )}
        </ButtonContainer>
        <ButtonContainer
          onPress={answerCall}
          colorKey={'callToAction'}
          size={70}
          svgContainer={{ height: 30, width: 30 }}
        >
          <Phone color="#fff" />
        </ButtonContainer>
      </View>
    </Background>
  );
};

export default IncomingCallScreen;
