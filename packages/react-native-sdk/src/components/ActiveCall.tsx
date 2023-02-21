import React, { useEffect } from 'react';
import {
  useActiveCall,
  useHasOngoingScreenShare,
} from '@stream-io/video-react-bindings';
import { StyleSheet, View } from 'react-native';
import { CallControlsView } from './CallControlsView';
import { CallParticipantsView } from './CallParticipantsView';
import { useMediaDevices } from '../contexts/MediaDevicesContext';
import { getAudioStream, getVideoStream } from '@stream-io/video-client';
import { useStreamVideoStoreValue } from '../contexts';
import { CallParticipantsBadge } from './CallParticipantsBadge';
import { CallParticipantsScreenView } from './CallParticipantsScreenView';

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
  const isAudioMuted = useStreamVideoStoreValue((store) => store.isAudioMuted);
  const hasScreenShare = useHasOngoingScreenShare();

  useEffect(() => {
    if (audioDevice && !isAudioMuted) {
      getAudioStream(audioDevice.deviceId)
        .then((stream) => activeCall?.publishAudioStream(stream))
        .catch((error) => {
          console.log(error);
        });
    }
  }, [activeCall, audioDevice, isAudioMuted]);

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
  }, [activeCall, currentVideoDevice, isVideoMuted]);

  return (
    <View style={styles.container}>
      <CallParticipantsBadge
        onOpenCallParticipantsInfoView={onOpenCallParticipantsInfoView}
      />
      <View style={styles.callParticipantsWrapper}>
        {hasScreenShare ? (
          <CallParticipantsScreenView />
        ) : (
          <CallParticipantsView />
        )}
      </View>
      <CallControlsView onHangupCall={onHangupCall} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  callParticipantsWrapper: { flex: 1 },
});
