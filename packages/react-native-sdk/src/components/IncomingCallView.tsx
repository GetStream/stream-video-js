import React, { PropsWithChildren } from 'react';
import { StyleSheet, Text, View, ImageBackground } from 'react-native';
import CallControlsButton from './CallControlsButton';
import PhoneDown from '../icons/PhoneDown';
import Phone from '../icons/Phone';
import Video from '../icons/Video';
import {
  useActiveCall,
  useActiveRingCallDetails,
  useIncomingRingCalls,
  useLocalParticipant,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import VideoSlash from '../icons/VideoSlash';
import { UserInfoView } from './UserInfoView';

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  background: {
    backgroundColor: 'black',
    opacity: 0.9,
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

const Background = ({ children }: PropsWithChildren) => {
  const activeRingCallDetails = useActiveRingCallDetails();
  const memberUserIds = activeRingCallDetails?.memberUserIds || [];

  return memberUserIds.length ? (
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

export const IncomingCallView = () => {
  const client = useStreamVideoClient();
  const activeCall = useActiveCall();
  const incomingRingCalls = useIncomingRingCalls();
  const currentIncomingRingCall =
    incomingRingCalls[incomingRingCalls.length - 1];
  const localParticipant = useLocalParticipant();

  const isVideoMuted = !localParticipant?.video;

  const videoToggle = async () => {
    await activeCall?.updateMuteState('video', !isVideoMuted);
  };

  const rejectCall = async () => {
    if (!client) {
      return;
    }
    await client.rejectCall(currentIncomingRingCall.callCid);
  };

  const answerCall = async () => {
    if (!client) {
      return;
    }
    // const call = await client.joinCall({
    //   id: currentIncomingRingCall.id,
    //   type: 'default',
    //   datacenterId: '',
    //   input: {
    //     ring: true,
    //     members: [],
    //   },
    // });
    // if (!call) {
    //   throw new Error(
    //     `Failed to join a call with id: ${currentIncomingRingCall.id}`,
    //   );
    // } else {
    //   await call.join(
    //     localParticipant?.videoStream,
    //     localParticipant?.audioStream,
    //   );
    // }
  };

  return (
    <Background>
      <UserInfoView />
      <Text style={styles.incomingCallText}>Incoming Call...</Text>
      <View style={styles.buttons}>
        <CallControlsButton
          onPress={rejectCall}
          colorKey={'cancel'}
          size={70}
          svgContainer={{ height: 30, width: 30 }}
        >
          <PhoneDown color="#ffffff" />
        </CallControlsButton>
        <CallControlsButton
          onPress={videoToggle}
          colorKey={isVideoMuted ? 'activated' : 'deactivated'}
          size={70}
          svgContainer={{ height: 25, width: 30 }}
        >
          {isVideoMuted ? (
            <Video color="#000000" />
          ) : (
            <VideoSlash color="#ffffff" />
          )}
        </CallControlsButton>
        <CallControlsButton
          onPress={answerCall}
          colorKey={'callToAction'}
          size={70}
          svgContainer={{ height: 30, width: 30 }}
        >
          <Phone color="#ffffff" />
        </CallControlsButton>
      </View>
    </Background>
  );
};
