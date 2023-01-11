import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
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
  /**
   * The video kind that will be displayed
   */
  kind: 'video' | 'screen';
  /**
   * Any custom style to be merged with the participant view
   */
  style?: StyleProp<ViewStyle>;
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
    call.updateSubscriptionsPartial(props.kind, {
      [participant.sessionId]: {
        dimension: {
          width: Math.trunc(width),
          height: Math.trunc(height),
        },
      },
    });
  };

  const { isSpeaking, isLoggedInUser } = participant;

  // NOTE: We have to cast to MediaStream type from webrtc
  // as JS client sends the web navigators' mediastream type instead
  const videoStream = (
    props.kind === 'video'
      ? participant.videoStream
      : participant.screenShareStream
  ) as MediaStream | undefined;

  const audioStream = participant.audioStream as MediaStream | undefined;

  const mirror = isLoggedInUser && !cameraBackFacingMode;
  const MicIcon = !audioStream ? MicOff : Mic;

  return (
    <View
      style={[
        styles.containerBase,
        styles[`${size}Container`],
        isSpeaking ? styles.dominantSpeaker : {},
        props.style,
      ]}
      onLayout={onLayout}
    >
      {!!videoStream ? (
        <VideoRenderer
          mirror={mirror}
          mediaStream={videoStream}
          style={styles.videoRenderer}
        />
      ) : (
        <Avatar participant={participant} />
      )}
      {props.kind === 'video' && !!audioStream && (
        <RTCView streamURL={audioStream.toURL()} />
      )}
      {props.kind === 'video' && (
        <View style={styles.status}>
          <Text style={styles.userNameLabel}>{participant.userId}</Text>
          <View style={styles.svgWrapper}>
            <MicIcon color="#FF003BFF" />
          </View>
        </View>
      )}
      {props.kind === 'screen' && (
        <View style={styles.screenViewStatus}>
          <Text style={styles.userNameLabel}>
            {participant.userId} is presenting
          </Text>
        </View>
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
  screenVideoRenderer: {
    flex: 1,
    justifyContent: 'center',
    borderRadius: 16,
    marginLeft: 8,
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
  screenViewStatus: {
    position: 'absolute',
    left: 8,
    top: 8,
    padding: 4,
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
