import React, { useCallback } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { SfuModels } from '@stream-io/video-client';
import {
  useActiveCall,
  useParticipants,
} from '@stream-io/video-react-bindings';
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
   * The id of the participant that will be displayed
   */
  participantId: string;
}

/**
 * A Wrapper around a participant renders either the participants view
 * and additional info, by an absence of a video track only an avatar/initials and audio track will be rendered.
 */
export const ParticipantView = (props: ParticipantViewProps) => {
  const { size, participantId } = props;
  const call = useActiveCall();
  const participants = useParticipants();
  const participant = participants.find((p) => p.userId === participantId);

  const cameraBackFacingMode = useStreamVideoStoreValue(
    (store) => store.cameraBackFacingMode,
  );

  const updateVideoSubscriptionForParticipant = useCallback(
    (width: number, height: number) => {
      if (!call || !participant) {
        return null;
      }

      call.updateSubscriptionsPartial('video', {
        [participant.sessionId]: {
          dimension: {
            width: Math.trunc(width),
            height: Math.trunc(height),
          },
        },
      });
    },
    [call, participant],
  );

  if (!participant) return null;

  const { videoStream, audioStream, isSpeaking, isLoggedInUser } = participant;
  const audio = participant.publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const video = participant.publishedTracks.includes(SfuModels.TrackType.VIDEO);

  const mirror = isLoggedInUser && !cameraBackFacingMode;
  const MicIcon = !audio ? MicOff : Mic;
  const dominantSpeakerStyle = isSpeaking && {
    borderColor: '#005FFF',
    borderWidth: 2,
  };

  return (
    <View
      style={[
        styles.containerBase,
        styles[`${size}Container`],
        dominantSpeakerStyle,
      ]}
      onLayout={(event: LayoutChangeEvent) => {
        const { height, width } = event.nativeEvent.layout;
        updateVideoSubscriptionForParticipant(width, height);
      }}
    >
      {video && videoStream ? (
        <VideoRenderer
          mirror={mirror}
          mediaStream={videoStream}
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
});
