import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SfuModels } from '@stream-io/video-client';

import { RTCView } from 'react-native-webrtc';
import { UserInfoView } from './UserInfoView';
import {
  useActiveCall,
  useHangUpNotifications,
  useLocalParticipant,
  useRemoteParticipants,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { CallControlsButton } from './CallControlsView/CallControlsButton';
import { Mic, MicOff, PhoneDown, Video, VideoSlash } from '../icons';
import { useCall, useCallControls, useCallKeep } from '../hooks';
import InCallManager from 'react-native-incall-manager';

/**
 * Props to be passed for the OutgoingCallView component.
 */
export interface OutgoingCallViewProps {
  /**
   * Handler called when the call is hanged up by the caller. Mostly used for navigation and related actions.
   */
  onHangupCall: () => void;
  /**
   * Handler called when the call is accepted by the callee. Mostly used for navigation and related actions.
   */
  onCallAccepted: () => void;
}

export const OutgoingCallView = (props: OutgoingCallViewProps) => {
  const { onHangupCall, onCallAccepted } = props;
  const { isAudioMuted, isVideoMuted, toggleAudioState, toggleVideoState } =
    useCallControls();
  const { hangupCall } = useCall();
  const client = useStreamVideoClient();
  const activeCall = useActiveCall();
  const terminatedRingCall = useHangUpNotifications();
  const remoteParticipants = useRemoteParticipants();
  const { endCall } = useCallKeep();

  const hangupHandler = useCallback(async () => {
    if (!activeCall) {
      console.warn('Failed to leave call: call is undefined');
      return;
    }
    try {
      if (activeCall.data.call) {
        await client?.cancelCall(activeCall.data.call.callCid);
        endCall();
      }
      activeCall.leave();
      InCallManager.stop();
    } catch (error) {
      console.warn('failed to leave call', error);
    }
  }, [activeCall, client, endCall]);

  useEffect(() => {
    if (terminatedRingCall.length > 0) {
      onHangupCall();
    }
    if (remoteParticipants.length > 0) {
      onCallAccepted();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminatedRingCall, remoteParticipants]);

  // To terminate call after a certain duration of time. Currently set to 10 seconds.
  useEffect(() => {
    const terminateCallAtMilliSeconds = 10000;
    let timerId: ReturnType<typeof setTimeout>;
    if (remoteParticipants.length === 0) {
      timerId = setTimeout(() => {
        hangupHandler();
      }, terminateCallAtMilliSeconds);
    }

    return () => clearTimeout(timerId);
  }, [hangupHandler, remoteParticipants]);

  return (
    <>
      <View style={[StyleSheet.absoluteFill, styles.container]}>
        <UserInfoView />
        <Text style={styles.callingText}>Calling...</Text>
        <View style={styles.buttons}>
          <View style={styles.deviceControlButtons}>
            <CallControlsButton
              onPress={toggleAudioState}
              colorKey={!isAudioMuted ? 'activated' : 'deactivated'}
              style={styles.buttonStyle}
              svgContainerStyle={styles.svgStyle}
            >
              {isAudioMuted ? <MicOff color="#fff" /> : <Mic color="#000" />}
            </CallControlsButton>
            <CallControlsButton
              onPress={toggleVideoState}
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
          </View>

          <CallControlsButton
            onPress={hangupCall}
            colorKey={'cancel'}
            style={[styles.buttonStyle, styles.hangupButton]}
            svgContainerStyle={styles.svgStyle}
          >
            <PhoneDown color="#fff" />
          </CallControlsButton>
        </View>
      </View>
      <Background />
    </>
  );
};

const Background = () => {
  const localParticipant = useLocalParticipant();
  const localVideoStream = localParticipant?.videoStream;
  const isVideoMuted = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  if (isVideoMuted)
    return <View style={[StyleSheet.absoluteFill, styles.background]} />;
  return (
    <RTCView
      streamURL={localVideoStream?.toURL()}
      objectFit="cover"
      zOrder={1}
      style={styles.stream}
      mirror={true}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 2,
  },
  background: {
    backgroundColor: '#272A30',
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
    position: 'absolute',
    bottom: 90,
    width: '100%',
  },
  deviceControlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  hangupButton: {
    alignSelf: 'center',
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
