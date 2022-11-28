import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Platform,
} from 'react-native';
import { CallControlsButton } from './CallControlsButton';
import PhoneDown from '../icons/PhoneDown';
import Phone from '../icons/Phone';
import Video from '../icons/Video';
import {
  useActiveRingCall,
  useActiveRingCallDetails,
  useIncomingRingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import VideoSlash from '../icons/VideoSlash';
import { UserInfoView } from './UserInfoView';
import InCallManager from 'react-native-incall-manager';
import {
  useStreamVideoStoreSetState,
  useStreamVideoStoreValue,
} from '../contexts/StreamVideoContext';
import RNCallKeep from 'react-native-callkeep';

const styles = StyleSheet.create({
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
  buttonStyle: {
    height: 70,
    width: 70,
    borderRadius: 70,
  },
  svgStyle: {
    height: 30,
    width: 30,
  },
});

const Background: React.FunctionComponent<{ children: React.ReactNode }> = ({
  children,
}) => {
  const activeRingCallDetails = useActiveRingCallDetails();
  const memberUserIds = activeRingCallDetails?.memberUserIds || [];

  return memberUserIds.length ? (
    <ImageBackground
      blurRadius={10}
      source={{
        uri: `https://getstream.io/random_png/?id=${memberUserIds[0]}&name=${memberUserIds[0]}`,
      }}
      style={StyleSheet.absoluteFill}
    >
      {children}
    </ImageBackground>
  ) : (
    <View style={[StyleSheet.absoluteFill, styles.background]}>{children}</View>
  );
};

export const IncomingCallView = () => {
  const client = useStreamVideoClient();
  const activeRingCall = useActiveRingCall();
  const incomingRingCalls = useIncomingRingCalls();
  const currentIncomingRingCall =
    incomingRingCalls[incomingRingCalls.length - 1];
  const localMediaStream = useStreamVideoStoreValue(
    (store) => store.localMediaStream,
  );
  const isVideoMuted = useStreamVideoStoreValue((store) => store.isVideoMuted);
  const setState = useStreamVideoStoreSetState();

  const videoToggle = async () => {
    setState((prevState) => ({
      isVideoMuted: !prevState.isVideoMuted,
    }));
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
    const call = await client.joinCall({
      id: currentIncomingRingCall.id,
      type: 'default',
      datacenterId: '',
      input: {
        ring: true,
        members: [],
      },
    });
    if (!call) {
      throw new Error(
        `Failed to join a call with id: ${currentIncomingRingCall.id}`,
      );
    } else {
      InCallManager.start({ media: 'video' });
      InCallManager.setForceSpeakerphoneOn(true);
      await call.join(localMediaStream, localMediaStream);
      await call.publishMediaStreams(localMediaStream, localMediaStream);
      await client.acceptCall(currentIncomingRingCall.callCid);
      if (activeRingCall && Platform.OS === 'ios') {
        RNCallKeep.startCall(
          activeRingCall.id,
          '',
          activeRingCall.createdByUserId,
          'generic',
        );
      }
    }
  };

  return (
    <Background>
      <UserInfoView />
      <Text style={styles.incomingCallText}>Incoming Call...</Text>
      <View style={styles.buttons}>
        <CallControlsButton
          onPress={rejectCall}
          colorKey={'cancel'}
          style={styles.buttonStyle}
          svgContainerStyle={styles.svgStyle}
        >
          <PhoneDown color="#ffffff" />
        </CallControlsButton>
        <CallControlsButton
          onPress={videoToggle}
          colorKey={isVideoMuted ? 'activated' : 'deactivated'}
          style={styles.buttonStyle}
          svgContainerStyle={styles.svgStyle}
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
          style={styles.buttonStyle}
          svgContainerStyle={styles.svgStyle}
        >
          <Phone color="#ffffff" />
        </CallControlsButton>
      </View>
    </Background>
  );
};
