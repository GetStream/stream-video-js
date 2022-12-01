import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ImageBackground } from 'react-native';
import { CallControlsButton } from './CallControlsButton';
import {
  useActiveCall,
  useActiveRingCallDetails,
  useIncomingRingCalls,
} from '@stream-io/video-react-bindings';
import { UserInfoView } from './UserInfoView';
import {
  useStreamVideoStoreSetState,
  useStreamVideoStoreValue,
} from '../contexts/StreamVideoContext';
import { useRingCall } from '../hooks';
import { Phone, PhoneDown, Video, VideoSlash } from '../icons';

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#272A30',
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

export type IncomingCallViewProps = {
  /**
   * Handler called when the call is answered. Mostly used for navigation and related actions.
   */
  onAnswerCall: () => void;
  /**
   * Handler called when the call is rejected. Mostly used for navigation and related actions.
   */
  onRejectCall: () => void;
};

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

export const IncomingCallView: React.FC<IncomingCallViewProps> = ({
  onAnswerCall,
  onRejectCall,
}) => {
  const activeCall = useActiveCall();
  const incomingRingCalls = useIncomingRingCalls();
  const isVideoMuted = useStreamVideoStoreValue((store) => store.isVideoMuted);
  const setState = useStreamVideoStoreSetState();
  const { answerCall, rejectCall } = useRingCall();

  useEffect(() => {
    if (activeCall) {
      onAnswerCall();
    } else {
      if (!incomingRingCalls.length) {
        onRejectCall();
      }
    }
  });

  const videoToggle = async () => {
    setState((prevState) => ({
      isVideoMuted: !prevState.isVideoMuted,
    }));
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
          colorKey={!isVideoMuted ? 'activated' : 'deactivated'}
          style={styles.buttonStyle}
          svgContainerStyle={styles.svgStyle}
        >
          {isVideoMuted ? (
            <VideoSlash color="#ffffff" />
          ) : (
            <Video color="#000000" />
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
