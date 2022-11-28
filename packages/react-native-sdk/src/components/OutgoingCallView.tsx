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
import { CallControlsButton } from './CallControlsButton';
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
  svgStyle: {
    height: 30,
    width: 30,
  },
  stream: {
    flex: 1,
  },
});

const Background: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const localParticipant = useLocalParticipant();
  const localVideoStream = localParticipant?.videoStream;
  const isVideoMuted = !localParticipant?.video;

  return !isVideoMuted ? (
    <RTCView
      streamURL={localVideoStream?.toURL()}
      objectFit="cover"
      zOrder={1}
      style={styles.stream}
      mirror={true}
    >
      {children}
    </RTCView>
  ) : (
    <View style={[StyleSheet.absoluteFill, styles.background]}>{children}</View>
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
      if (activeRingCallMeta) {
        await client?.cancelCall(activeRingCallMeta.callCid);
        if (Platform.OS === 'ios') {
          await RNCallKeep.endCall(activeRingCallMeta.id);
        }
      }
      activeCall.leave();
      InCallManager.stop();
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
    <Background>
      <View style={StyleSheet.absoluteFill}>
        <UserInfoView />
        <Text style={styles.callingText}>Calling...</Text>
        <View style={styles.buttons}>
          <CallControlsButton
            onPress={audioToggle}
            colorKey={!isAudioMuted ? 'activated' : 'deactivated'}
            style={styles.buttonStyle}
            svgContainerStyle={styles.svgStyle}
          >
            {isAudioMuted ? <MicOff color="#fff" /> : <Mic color="#000" />}
          </CallControlsButton>
          <CallControlsButton
            onPress={videoToggle}
            colorKey={!isVideoMuted ? 'activated' : 'deactivated'}
            style={styles.buttonStyle}
            svgContainerStyle={styles.svgStyle}
          >
            {isVideoMuted ? (
              <VideoSlash color="#fff" />
            ) : (
              <Video color="#000" />
            )}
          </CallControlsButton>
          <CallControlsButton
            onPress={hangupHandler}
            colorKey={'cancel'}
            style={styles.buttonStyle}
            svgContainerStyle={styles.svgStyle}
          >
            <PhoneDown color="#fff" />
          </CallControlsButton>
        </View>
      </View>
    </Background>
  );
};
