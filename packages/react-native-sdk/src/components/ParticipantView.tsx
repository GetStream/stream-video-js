import React, { useCallback } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { RTCView } from 'react-native-webrtc';
import { useActiveCall } from '@stream-io/video-react-bindings';
import MicOff from '../icons/MicOff';
import Mic from '../icons/Mic';
import { VideoRenderer } from './VideoRenderer';
import { Avatar } from './Avatar';
import { useStreamVideoStoreValue } from '../contexts';

export type SizeType = 'small' | 'medium' | 'large' | 'xl';

type ParticipantViewProps = {
  index: number;
  size: SizeType;
  participant: StreamVideoParticipant;
};

export const ParticipantView: React.FC<ParticipantViewProps> = ({
  index,
  size,
  participant,
}: ParticipantViewProps) => {
  const call = useActiveCall();
  const {
    videoStream,
    audioStream,
    isSpeaking,
    sessionId,
    user,
    isLoggedInUser,
    audio,
  } = participant;
  const cameraBackFacingMode = useStreamVideoStoreValue(
    (store) => store.cameraBackFacingMode,
  );

  const updateVideoSubscriptionForParticipant = useCallback(
    (width: number, height: number) => {
      if (call) {
        call.updateSubscriptionsPartial({
          [sessionId]: {
            videoDimension: {
              width: Math.trunc(width),
              height: Math.trunc(height),
            },
          },
        });
      }
    },
    [call, sessionId],
  );

  const mirror = isLoggedInUser && !cameraBackFacingMode;
  const MicIcon = !audio ? MicOff : Mic;
  const dominantSpeakerStyle = { borderColor: isSpeaking ? '#005FFF' : '#000' };
  const isBottomParticipant =
    size === 'xl' ||
    (size === 'large' && (index === 1 || index === 0)) ||
    (size === 'medium' && (index === 3 || index === 1)) ||
    (size === 'small' && index === 4);

  return (
    <View
      style={{
        ...styles.containerBase,
        ...styles[`${size}Container`],
        ...dominantSpeakerStyle,
      }}
      onLayout={(event: LayoutChangeEvent) => {
        const { height, width } = event.nativeEvent.layout;
        updateVideoSubscriptionForParticipant(width, height);
      }}
    >
      {!!participant.video && videoStream ? (
        <VideoRenderer
          mirror={mirror}
          mediaStream={videoStream}
          style={styles.videoRenderer}
        />
      ) : (
        <Avatar participant={participant} />
      )}
      {/* @ts-ignore */}
      {audioStream && <RTCView streamURL={audioStream.toURL()} />}
      <View
        style={[
          styles.status,
          isBottomParticipant ? styles.bottomParticipant : null,
        ]}
      >
        <Text style={styles.userNameLabel}>{user?.name || user?.id}</Text>
        <View style={styles.svgWrapper}>
          <MicIcon color="#FF003BFF" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerBase: {
    borderWidth: 2,
    borderColor: '#000',
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
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: 6,
    bottom: 6,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#1C1E22',
  },
  userNameLabel: {
    color: '#fff',
    fontSize: 10,
  },
  svgWrapper: {
    height: 16,
    width: 16,
    marginLeft: 6,
  },
  bottomParticipant: {
    bottom: 24,
  },
});
