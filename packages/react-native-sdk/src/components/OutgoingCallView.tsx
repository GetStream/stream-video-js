import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';

import PhoneDown from '../icons/PhoneDown';
import Video from '../icons/Video';
import VideoSlash from '../icons/VideoSlash';
import Mic from '../icons/Mic';
import MicOff from '../icons/MicOff';
import { RTCView } from 'react-native-webrtc';
import { UserInfoView } from './UserInfoView';
import {
  useActiveCall,
  useActiveRingCall,
  useLocalParticipant,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import CallControlsButton from './CallControlsButton';
import InCallManager from 'react-native-incall-manager';
import RNCallKeep from 'react-native-callkeep';

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  background: {
    backgroundColor: 'black',
    opacity: 0.9,
  },
  view: {
    position: 'absolute',
    zIndex: 5,
    width: '100%',
    height: '100%',
  },
  callingText: {
    fontSize: 20,
    marginTop: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.6,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
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
  svg: {
    height: 30,
    width: 30,
  },
  stream: {
    flex: 1,
  },
});

const Background = () => {
  const localParticipant = useLocalParticipant();
  const localMediaStream = localParticipant?.videoStream;
  const isVideoMuted = !localParticipant?.video;

  return !isVideoMuted ? (
    <RTCView
      // @ts-ignore
      streamURL={localMediaStream?.toURL()}
      objectFit="cover"
      zOrder={1}
      style={styles.stream}
      mirror={true}
    />
  ) : (
    <View style={[styles.container, styles.background]} />
  );
};

export const OutgoingCallView = () => {
  const client = useStreamVideoClient();
  const activeCall = useActiveCall();
  const localParticipant = useLocalParticipant();

  const activeRingCallMeta = useActiveRingCall();
  const isAudioMuted = !localParticipant?.audio;
  const isVideoMuted = !localParticipant?.video;

  const hangupHandler = async () => {
    if (!activeCall) {
      console.warn('Failed to leave call: call is undefined');
      return;
    }
    try {
      activeCall.leave();
      if (Platform.OS === 'ios' && activeRingCallMeta) {
        await RNCallKeep.endCall(activeRingCallMeta.id);
      }
      InCallManager.stop();
      if (activeRingCallMeta) {
        await client?.cancelCall(activeRingCallMeta.callCid);
      }
    } catch (error) {
      console.warn('failed to leave call', error);
    }
  };

  const videoToggle = async () => {
    await activeCall?.updateMuteState('video', !isVideoMuted);
  };

  const audioToggle = async () => {
    await activeCall?.updateMuteState('audio', !isAudioMuted);
  };

  return (
    <>
      <View style={styles.view}>
        <UserInfoView />
        <Text style={styles.callingText}>Calling...</Text>
        <View style={styles.buttons}>
          <CallControlsButton
            onPress={audioToggle}
            colorKey={!isAudioMuted ? 'activated' : 'deactivated'}
            size={70}
            svgContainer={{ height: 25, width: 30 }}
          >
            {isAudioMuted ? <MicOff color="white" /> : <Mic color="black" />}
          </CallControlsButton>
          <CallControlsButton
            onPress={videoToggle}
            colorKey={!isVideoMuted ? 'activated' : 'deactivated'}
            size={70}
            svgContainer={{ height: 25, width: 30 }}
          >
            {isVideoMuted ? (
              <VideoSlash color="white" />
            ) : (
              <Video color="black" />
            )}
          </CallControlsButton>
          <CallControlsButton
            onPress={hangupHandler}
            colorKey={'cancel'}
            size={70}
            svgContainer={{ height: 25, width: 30 }}
          >
            <PhoneDown color="#fff" />
          </CallControlsButton>
        </View>
      </View>
      <Background />
    </>
  );
};
