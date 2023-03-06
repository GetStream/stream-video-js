import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SfuModels } from '@stream-io/video-client';

import { RTCView } from 'react-native-webrtc';
import { UserInfoView } from './UserInfoView';
import { useLocalParticipant } from '@stream-io/video-react-bindings';
import { CallControlsButton } from './CallControlsButton';
import { Mic, MicOff, PhoneDown, Video, VideoSlash } from '../icons';
import { useCallControls, useRingCall } from '../hooks';
import { theme } from '../theme/colors';

/**
 * Props to be passed for the OutgoingCallView component.
 */
export interface OutgoingCallViewProps {
  /**
   * Handler called when the call is hanged up by the caller. Mostly used for navigation and related actions.
   */
  onHangupCall: () => void;
}

/**
 * View for an outgoing call, after a call is initiated by a caller in ringing mode
 *
 * | Outgoing Call |
 * | :---: |
 * |![outgoing-calo-view-1](https://user-images.githubusercontent.com/25864161/217487315-c32ee3dc-10d7-4726-ae62-de8e8106af86.png)|
 */
export const OutgoingCallView = (props: OutgoingCallViewProps) => {
  const { onHangupCall } = props;
  const { isAudioMuted, isVideoMuted, toggleAudioMuted, toggleVideoMuted } =
    useCallControls();
  const { cancelCall } = useRingCall();

  const hangupCallHandler = useCallback(async () => {
    await cancelCall();
    onHangupCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelCall]);

  return (
    <>
      <View style={[StyleSheet.absoluteFill, styles.container]}>
        <UserInfoView />
        <Text style={styles.callingText}>Calling...</Text>
        <View style={styles.buttons}>
          <View style={styles.deviceControlButtons}>
            <CallControlsButton
              onPress={toggleAudioMuted}
              color={
                isAudioMuted
                  ? theme.light.overlay_dark
                  : theme.light.static_white
              }
              style={styles.buttonStyle}
              svgContainerStyle={styles.svgStyle}
            >
              {isAudioMuted ? <MicOff color="#fff" /> : <Mic color="#000" />}
            </CallControlsButton>
            <CallControlsButton
              onPress={toggleVideoMuted}
              color={
                isVideoMuted
                  ? theme.light.overlay_dark
                  : theme.light.static_white
              }
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
            onPress={hangupCallHandler}
            color={theme.light.error}
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
    backgroundColor: theme.light.static_grey,
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
