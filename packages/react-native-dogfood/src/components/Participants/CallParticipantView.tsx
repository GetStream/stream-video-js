import React, { useCallback } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { VideoRenderer } from './LocalVideoView';
import { MediaStream, RTCView } from 'react-native-webrtc';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import { useMuteState } from '../../hooks/useMuteState';
import MicOff from '../../icons/MicOff';
import Mic from '../../icons/Mic';
import { Avatar } from '@stream-io/video-react-native-sdk';

export type SizeType = 'small' | 'medium' | 'large' | 'xl';
type CallParticipantViewProps = {
  index: number;
  size: SizeType;
  participant: StreamVideoParticipant;
};

const CallParticipantView = ({
  index,
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

  const { isAudioMuted } = useMuteState(user?.id, call, mediaStream);

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

  const MicIcon = isAudioMuted ? MicOff : Mic;
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
        updateVideoSubscriptionForParticipant(sessionId, width, height);
      }}
    >
      {!!participant.video && videoStream ? (
        <VideoRenderer
          mirror
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
export default CallParticipantView;
