import React, { useCallback } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { VideoRenderer } from './LocalVideoView';
import { MediaStream } from 'react-native-webrtc';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';

export type SizeType = 'small' | 'medium' | 'large' | 'xl';
type CallParticipantViewProps = {
  size: SizeType;
  participant: StreamVideoParticipant;
};

const CallParticipantView = ({
  size,
  participant,
}: CallParticipantViewProps) => {
  const call = useAppGlobalStoreValue((store) => store.call);
  if (!call) {
    throw new Error("Call isn't initialized -- CallParticipantView");
  }

  const {
    videoTrack: videoStream,
    audioTrack: audioStream,
    isSpeaking,
    sessionId,
    user,
  } = participant;
  const mediaStream =
    audioStream &&
    videoStream &&
    new MediaStream([...audioStream?.getTracks(), ...videoStream?.getTracks()]);

  const updateVideoSubscriptionForParticipant = useCallback(
    (sessionId: string, width: number, height: number) => {
      call.updateSubscriptionsPartial({
        [sessionId]: {
          videoDimension: {
            width: Math.trunc(width),
            height: Math.trunc(height),
          },
        },
      });
    },
    [call],
  );
  return (
    <View
      style={{ ...styles.containerBase, ...styles[`${size}Container`] }}
      onLayout={(event: LayoutChangeEvent) => {
        const { height, width } = event.nativeEvent.layout;
        updateVideoSubscriptionForParticipant(sessionId, width, height);
      }}
    >
      {videoStream ? (
        <VideoRenderer
          mirror
          mediaStream={videoStream}
          style={styles.videoRenderer}
        />
      ) : (
        <Text>AVATAR</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  containerBase: {
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  smallContainer: {
    flexBasis: '33.33%',
    width: '50%',
  },
  mediumContainer: {
    flexBasis: '50%',
    width: '50%',
  },
  largeContainer: {},
  xlContainer: {},
  videoRenderer: {
    flex: 1,
    justifyContent: 'center',
  },
});
export default CallParticipantView;
