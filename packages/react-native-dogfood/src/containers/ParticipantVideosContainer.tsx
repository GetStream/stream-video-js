import React, { useCallback } from 'react';
import { RTCView } from 'react-native-webrtc';
import { StyleSheet, View, Image, LayoutChangeEvent, Text } from 'react-native';
import MicOff from '../icons/MicOff';
import Mic from '../icons/Mic';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { StreamVideoParticipant } from '@stream-io/video-client';
import {
  useActiveCall,
  useParticipants,
} from '@stream-io/video-react-native-sdk';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    flexDirection: 'column',
    justifyContent: 'center',
    marginBottom: -25,
  },
  stream: {
    flex: 1,
    borderColor: 'gray',
    justifyContent: 'center',
  },
  avatar: {
    backgroundColor: 'gray',
    borderRadius: 50,
    height: 100,
    width: 100,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  status: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    marginLeft: 10,
    bottom: 10,
    backgroundColor: '#1C1E22',
    paddingHorizontal: 5,
    borderRadius: 5,
    paddingVertical: 5,
  },
  userName: {
    color: 'white',
    fontSize: 10,
  },
  svgContainer: {
    height: 15,
    width: 15,
    marginLeft: 5,
  },
  videoSpeakingState: {
    borderWidth: 2,
    borderColor: '#005FFF',
  },
  lastParticipant: {
    bottom: 35,
  },
});

const ParticipantVideosContainer = () => {
  const call = useActiveCall();
  const allParticipants = useParticipants();
  const loopbackMyVideo = useAppGlobalStoreValue(
    (store) => store.loopbackMyVideo,
  );

  const updateVideoSubscriptionForParticipant = useCallback(
    (sessionId: string, width: number, height: number) => {
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
    [call],
  );

  const filteredParticipants = loopbackMyVideo
    ? allParticipants
    : allParticipants.filter((p) => !p.isLoggedInUser);

  if (filteredParticipants.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {call &&
        filteredParticipants.map((participant, index) => {
          const userId = participant.user!.id;
          return (
            <ParticipantVideoContainer
              key={`${userId}/${participant.sessionId}`}
              participant={participant}
              updateVideoSubscriptionForParticipant={
                updateVideoSubscriptionForParticipant
              }
              isLastParticipant={index === allParticipants.length - 1}
            />
          );
        })}
    </View>
  );
};

const ParticipantVideoContainer = ({
  participant,
  updateVideoSubscriptionForParticipant,
  isLastParticipant,
}: {
  participant: StreamVideoParticipant;
  updateVideoSubscriptionForParticipant: (
    sessionId: string,
    width: number,
    height: number,
  ) => void;
  isLastParticipant: boolean;
}) => {
  const { audio, videoStream, audioStream, isSpeaking, sessionId, user } =
    participant;

  return (
    <View
      style={[styles.stream, isSpeaking ? styles.videoSpeakingState : null]}
      onLayout={(event: LayoutChangeEvent) => {
        const { height, width } = event.nativeEvent.layout;
        updateVideoSubscriptionForParticipant(sessionId, width, height);
      }}
    >
      {videoStream !== undefined ? (
        <RTCView
          // @ts-ignore
          mirror
          streamURL={videoStream.toURL()}
          style={styles.stream}
          objectFit="cover"
        />
      ) : user?.imageUrl ? (
        <Image source={{ uri: user?.imageUrl }} style={styles.avatar} />
      ) : null}
      {/* @ts-ignore */}
      {audioStream && <RTCView streamURL={audioStream.toURL()} />}
      <View
        style={[
          styles.status,
          isLastParticipant ? styles.lastParticipant : null,
        ]}
      >
        <Text style={styles.userName}>{user?.name || user?.id}</Text>
        <View style={styles.svgContainer}>
          {!audio ? <MicOff color="red" /> : <Mic color="red" />}
        </View>
      </View>
    </View>
  );
};
export default ParticipantVideosContainer;
