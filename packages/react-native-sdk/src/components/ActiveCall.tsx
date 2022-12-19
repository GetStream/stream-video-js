import React, { useEffect } from 'react';
import { useActiveCall } from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';
import { CallControlsView } from './CallControlsView';
import { CallParticipantsView } from './CallParticipantsView';
import { useMediaDevices } from '../contexts/MediaDevicesContext';
import { getAudioStream, getVideoStream } from '@stream-io/video-client';
import {
  useStreamVideoStoreSetState,
  useStreamVideoStoreValue,
} from '../contexts';

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
  const { audioDevice, currentVideoDevice } = useMediaDevices();
  const { onHangupCall } = props;
  const isVideoMuted = useStreamVideoStoreValue((store) => store.isVideoMuted);
  const setState = useStreamVideoStoreSetState();

  useEffect(() => {
    if (audioDevice) {
      getAudioStream(audioDevice.deviceId).then((stream) =>
        activeCall?.publishAudioStream(stream),
      );
    }
  }, [activeCall, audioDevice]);

  useEffect(() => {
    try {
      if (currentVideoDevice && !isVideoMuted) {
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
  }, [activeCall, currentVideoDevice, isVideoMuted, setState]);

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
