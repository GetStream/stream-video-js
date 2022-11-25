import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { useObservableValue } from '../hooks/useObservable';
import { useStore } from '../hooks/useStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import ButtonContainer from '../components/CallControls/ButtonContainer';
import PhoneDown from '../icons/PhoneDown';
import Video from '../icons/Video';
import VideoSlash from '../icons/VideoSlash';
import { useRingCall } from '../hooks/useRingCall';
import Mic from '../icons/Mic';
import MicOff from '../icons/MicOff';
import { RTCView } from 'react-native-webrtc';
import { useCallKeep } from '../hooks/useCallKeep';
import { UserInfoView } from '../components/UserInfoView';

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

type Props = NativeStackScreenProps<RootStackParamList, 'OutgoingCallScreen'>;

const Background = () => {
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const isVideoMuted = useAppGlobalStoreValue((store) => store.isVideoMuted);
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

const OutgoingCallScreen = ({ navigation }: Props) => {
  const loopbackMyVideo = useAppGlobalStoreValue(
    (store) => store.loopbackMyVideo,
  );
  const { activeCallRemoteParticipants$ } = useStore();
  const remoteParticipants = useObservableValue(activeCallRemoteParticipants$);
  const isVideoMuted = useAppGlobalStoreValue((store) => store.isVideoMuted);
  const isAudioMuted = useAppGlobalStoreValue((store) => store.isAudioMuted);
  const username = useAppGlobalStoreValue((store) => store.username);
  const setState = useAppGlobalStoreSetState();

  const filteredParticipants = loopbackMyVideo
    ? remoteParticipants
    : remoteParticipants.filter((p) => !p.isLoggedInUser);
  const { activeRingCallDetails$, activeRingCallMeta$, activeCall$ } =
    useStore();
  const activeRingCallDetails = useObservableValue(activeRingCallDetails$);
  const call = useObservableValue(activeCall$);
  const activeRingCallMeta = useObservableValue(activeRingCallMeta$);
  const members = activeRingCallDetails?.members || {};
  const memberUserIds = activeRingCallDetails?.memberUserIds || [];
  const { cancelCall } = useRingCall();
  const { endCall } = useCallKeep();

  const hangupHandler = () => {
    if (!call) {
      console.warn('failed to leave call: ', 'call is undefined');
      return;
    }
    try {
      endCall();
      if (
        activeRingCallMeta &&
        activeRingCallMeta.createdByUserId === username
      ) {
        cancelCall();
      }
    } catch (err) {
      console.warn('failed to leave call', err);
    }
  };

  useEffect(() => {
    if (filteredParticipants.length > 0) {
      navigation.navigate('ActiveCall');
    }
  }, [filteredParticipants, navigation]);

  const videoToggle = () => {
    setState((prevState) => ({
      isVideoMuted: !prevState.isVideoMuted,
    }));
  };

  const audioToggle = () => {
    setState((prevState) => ({
      isAudioMuted: !prevState.isAudioMuted,
    }));
  };

  return (
    <>
      <View style={styles.view}>
        <UserInfoView memberUserIds={memberUserIds} members={members} />
        <Text style={styles.callingText}>Calling...</Text>
        <View style={styles.buttons}>
          <ButtonContainer
            onPress={audioToggle}
            colorKey={isAudioMuted ? 'activated' : 'deactivated'}
            style={styles.buttonStyle}
            svgContainerStyle={styles.svg}
          >
            {isAudioMuted ? <Mic color="black" /> : <MicOff color="white" />}
          </ButtonContainer>
          <ButtonContainer
            onPress={videoToggle}
            colorKey={isVideoMuted ? 'activated' : 'deactivated'}
            style={styles.buttonStyle}
            svgContainerStyle={styles.svg}
          >
            {isVideoMuted ? (
              <Video color="black" />
            ) : (
              <VideoSlash color="white" />
            )}
          </ButtonContainer>
          <ButtonContainer
            onPress={hangupHandler}
            colorKey={'cancel'}
            style={styles.buttonStyle}
            svgContainerStyle={styles.svg}
          >
            <PhoneDown color="#fff" />
          </ButtonContainer>
        </View>
      </View>
      <Background />
    </>
  );
};

export default OutgoingCallScreen;
