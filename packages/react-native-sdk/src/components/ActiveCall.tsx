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
import { CallParticipantsBadge } from './CallParticipantsBadge';

/**
 * Props to be passed for the ActiveCall component.
 */
export interface ActiveCallProps {
  /**
   * Handler called when the call is hanged up by the caller. Mostly used for navigation and related actions.
   */
  onHangupCall: () => void;
  /**
   * Handler called when the participants info button is pressed in the active call screen.
   */
  onOpenCallParticipantsInfoView: () => void;
}

export const ActiveCall = (props: ActiveCallProps) => {
  const activeCall = useActiveCall();
  const { audioDevice, currentVideoDevice } = useMediaDevices();
  const { onHangupCall, onOpenCallParticipantsInfoView } = props;
  const isVideoMuted = useStreamVideoStoreValue((store) => store.isVideoMuted);
  const setState = useStreamVideoStoreSetState();

  useEffect(() => {
    if (audioDevice) {
      getAudioStream(audioDevice.deviceId)
        .then((stream) => activeCall?.publishAudioStream(stream))
        .catch((error) => {
          console.log(error);
        });
    }
  }, [activeCall, audioDevice]);

  useEffect(() => {
    if (currentVideoDevice && !isVideoMuted) {
      getVideoStream(currentVideoDevice.deviceId)
        .then((stream) => {
          activeCall?.publishVideoStream(stream);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [activeCall, currentVideoDevice, isVideoMuted, setState]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <CallParticipantsBadge
        onOpenCallParticipantsInfoView={onOpenCallParticipantsInfoView}
      />
      <View style={styles.callParticipantsWrapper}>
        <CallParticipantsView />
      </View>
      <CallControlsView onHangupCall={onHangupCall} />
    </View>
  );
};

const styles = StyleSheet.create({
  callParticipantsWrapper: { flex: 1, marginBottom: -20 },
});
