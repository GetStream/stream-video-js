import React, { useEffect } from 'react';
import {
  useActiveCall,
  useParticipants,
} from '@stream-io/video-react-bindings';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CallControlsView } from './CallControlsView';
import { CallParticipantsView } from './CallParticipantsView';
import { useMediaDevices } from '../contexts/MediaDevicesContext';
import { getAudioStream, getVideoStream } from '@stream-io/video-client';
import {
  useStreamVideoStoreSetState,
  useStreamVideoStoreValue,
} from '../contexts';
import { Participants } from '../icons';

/**
 * Props to be passed for the ActiveCall component.
 */
export interface ActiveCallProps {
  /**
   * Handler called when the call is hanged up by the caller. Mostly used for navigation and related actions.
   */
  onHangupCall: () => void;
  /**
   * Handler called when participant icon is called
   */
  onOpenParticipantsView: () => void;
}

export const ActiveCall = (props: ActiveCallProps) => {
  const activeCall = useActiveCall();
  const participants = useParticipants();
  const { audioDevice, currentVideoDevice } = useMediaDevices();
  const { onHangupCall, onOpenParticipantsView } = props;
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
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        style={styles.participantIcon}
        onPress={onOpenParticipantsView}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{participants.length}</Text>
        </View>
        <View style={styles.icon}>
          <Participants color="#fff" />
        </View>
      </Pressable>
      <View style={styles.callParticipantsWrapper}>
        <CallParticipantsView />
      </View>
      <CallControlsView onHangupCall={onHangupCall} />
    </View>
  );
};

const styles = StyleSheet.create({
  callParticipantsWrapper: { flex: 1, marginBottom: -20 },
  participantIcon: {
    position: 'absolute',
    right: 20,
    top: 40,
    zIndex: 2,
  },
  icon: { height: 24, width: 27 },
  badge: {
    backgroundColor: '#72767E',
    borderRadius: 30,
    padding: 4,
    position: 'relative',
    left: 10,
    top: 5,
    zIndex: 4,
  },
  badgeText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
