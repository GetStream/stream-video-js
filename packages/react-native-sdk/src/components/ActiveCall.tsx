import React, { useEffect } from 'react';
import {
  useActiveCall,
  useRemoteHangUpNotifications,
} from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';
import { useCallKeep } from '../hooks';
import { CallControlsView } from './CallControlsView';
import { CallParticipantsView } from './CallParticipantsView';
import { useMediaDevices } from '../contexts/MediaDevicesContext';
import { getAudioStream, getVideoStream } from '@stream-io/video-client';

/**
 * Props to be passed for the ActiveCall component.
 */
export interface ActiveCallProps {
  /**
   * Handler called when the call is hanged up by the caller. Mostly used for navigation and related actions.
   */
  onHangupCall: () => void;
}

export const ActiveCall = (props: ActiveCallProps) => {
  const activeCall = useActiveCall();
  const activeCallMeta = activeCall?.data.call;
  const remoteHangUpNotifications = useRemoteHangUpNotifications();
  const { startCall } = useCallKeep();
  const { audioDevice, currentVideoDevice } = useMediaDevices();
  const { onHangupCall } = props;

  const isCallHangedUpByCaller = remoteHangUpNotifications.find(
    (remoteHangUpNotification) =>
      remoteHangUpNotification.call?.callCid === activeCallMeta?.callCid &&
      remoteHangUpNotification.call?.createdByUserId ===
        activeCallMeta?.createdByUserId,
  );

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
    if (isCallHangedUpByCaller) {
      onHangupCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCall, isCallHangedUpByCaller]);

  return (
    <>
      <View style={styles.callParticipantsWrapper}>
        <CallParticipantsView />
      </View>
      <CallControlsView onHangupCall={onHangupCall} />
    </>
  );
};

const styles = StyleSheet.create({
  callParticipantsWrapper: { flex: 1, marginBottom: -20 },
});
