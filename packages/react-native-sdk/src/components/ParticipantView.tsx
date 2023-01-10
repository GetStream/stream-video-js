import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MediaStream, RTCView } from 'react-native-webrtc';
import {
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { useActiveCall } from '@stream-io/video-react-bindings';
import { VideoRenderer } from './VideoRenderer';
import { Avatar } from './Avatar';
import { useStreamVideoStoreValue } from '../contexts';
import { Mic, MicOff } from '../icons';

type SizeType = 'small' | 'medium' | 'large' | 'xl';

interface ParticipantViewProps {
  /**
   * The size of the participant that correlates to a specific layout
   */
  size: SizeType;
  /**
   * The participant that will be displayed
   */
  participant: StreamVideoParticipant | StreamVideoLocalParticipant;
}

/**
 * A Wrapper around a participant renders either the participants view
 * and additional info, by an absence of a video track only an avatar/initials and audio track will be rendered.
 */
export const ParticipantView = (props: ParticipantViewProps) => {
  const { size, participant } = props;
  const call = useActiveCall();

  const cameraBackFacingMode = useStreamVideoStoreValue(
    (store) => store.cameraBackFacingMode,
  );

  const onLayout: React.ComponentProps<typeof View>['onLayout'] = (event) => {
    if (!call) {
      return;
    }
    const { height, width } = event.nativeEvent.layout;
    call.updateSubscriptionsPartial('video', {
      [participant.sessionId]: {
        dimension: {
          width: Math.trunc(width),
          height: Math.trunc(height),
        },
      },
    });
  };

  const { isSpeaking, isLoggedInUser } = participant;

  console.log({ screenshareStream: participant.screenShareStream });

  // NOTE: We have to cast to MediaStream type from webrtc
  // as JS client sends the web navigators' mediastream type instead
  const videoStreamToShow = (participant.screenShareStream ??
    participant.videoStream) as MediaStream | undefined;
  const audioStream = participant.audioStream as MediaStream | undefined;

  const mirror = isLoggedInUser && !cameraBackFacingMode;
  const MicIcon = !audioStream ? MicOff : Mic;

  return (
    <View
      style={[
        styles.containerBase,
        styles[`${size}Container`],
        isSpeaking ? styles.dominantSpeaker : {},
      ]}
      onLayout={onLayout}
    >
      {!!videoStreamToShow ? (
        <VideoRenderer
          mirror={mirror}
          mediaStream={videoStreamToShow}
          style={styles.videoRenderer}
        />
      ) : (
        <Avatar participant={participant} />
      )}
      {audioStream && <RTCView streamURL={audioStream.toURL()} />}
      <View style={styles.status}>
        <Text style={styles.userNameLabel}>{participant.userId}</Text>
        <View style={styles.svgWrapper}>
          <MicIcon color="#FF003BFF" />
        </View>
      </View>
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
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: 6,
    top: 6,
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
  dominantSpeaker: {
    borderColor: '#005FFF',
    borderWidth: 2,
  },
});
