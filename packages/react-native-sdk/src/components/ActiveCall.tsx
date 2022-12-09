import React, { useEffect } from 'react';
import {
  useActiveCall,
  useTerminatedRingCall,
} from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';
import { useCallKeep } from '../hooks';
import { CallControlsView } from './CallControlsView';
import { CallParticipantsView } from './CallParticipantsView';
import { useMediaDevices } from '../contexts/MediaDevicesContext';
import { getAudioStream, getVideoStream } from '@stream-io/video-client';

export type ActiveCallProps = {
  /**
   * Handler called when the call is hanged up by the caller. Mostly used for navigation and related actions.
   */
  onHangupCall: () => void;
};

export const ActiveCall = (props: ActiveCallProps) => {
  const activeCall = useActiveCall();
  const terminatedRingCall = useTerminatedRingCall();
  const { startCall, endCall } = useCallKeep();
  const { audioDevice, currentVideoDevice } = useMediaDevices();
  const { onHangupCall } = props;

  useEffect(() => {
    if (audioDevice) {
      getAudioStream(audioDevice.deviceId).then((stream) =>
        activeCall?.publishAudioStream(stream),
      );
    }
  }, [activeCall, audioDevice]);

  useEffect(() => {
    try {
      if (currentVideoDevice) {
        getVideoStream(currentVideoDevice.deviceId).then((stream) => {
          if (currentVideoDevice.facing === 'environment') {
            const [primaryVideoTrack] = stream.getVideoTracks();
            primaryVideoTrack._switchCamera();
          }
          activeCall?.publishVideoStream(stream);
        });
      }
    } catch (error) {
      console.log(error);
    }
  }, [activeCall, currentVideoDevice]);

  useEffect(() => {
    startCall();
    if (!activeCall || terminatedRingCall) {
      endCall();
      onHangupCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCall, terminatedRingCall]);

  return (
    <>
      <View style={styles.callParticipantsWrapper}>
        <CallParticipantsView />
      </View>
      <CallControlsView />
    </>
  );
};

const styles = StyleSheet.create({
  callParticipantsWrapper: { flex: 1, marginBottom: -20 },
});
