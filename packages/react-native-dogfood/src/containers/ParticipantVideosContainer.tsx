import React, { useCallback } from 'react';
import { MediaStream, RTCView } from 'react-native-webrtc';
import { StyleSheet, View, Image, LayoutChangeEvent, Text } from 'react-native';
import { useMuteState } from '../hooks/useMuteState';
import MicOff from '../icons/MicOff';
import Mic from '../icons/Mic';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { useObservableValue } from '../hooks/useObservable';
import { Call, StreamVideoParticipant } from '@stream-io/video-client';

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
  const call = useAppGlobalStoreValue((store) => store.call);
  if (!call) {
    throw new Error("Call isn't initialized -- ParticipantVideosContainer");
  }
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  if (!videoClient) {
    throw new Error(
      "StreamVideoClient isn't initialized -- ParticipantVideosContainer",
    );
  }

  const allParticipants = useObservableValue(
    videoClient.readOnlyStateStore.activeCallAllParticipants$,
  );
  const loopbackMyVideo = useAppGlobalStoreValue(
    (store) => store.loopbackMyVideo,
  );

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

  const filteredParticipants = loopbackMyVideo
    ? allParticipants
    : allParticipants.filter((p) => !p.isLoggedInUser);

  if (filteredParticipants.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {filteredParticipants.map((participant, index) => {
        const userId = participant.user!.id;
        return (
          <ParticipantVideoContainer
            key={`${userId}/${participant.sessionId}`}
            participant={participant}
            updateVideoSubscriptionForParticipant={
              updateVideoSubscriptionForParticipant
            }
            call={call}
            isLastParticipant={index === allParticipants.length - 1}
          />
        );
      })}
    </View>
  );
};

const ParticipantVideoContainer = ({
  call,
  participant,
  updateVideoSubscriptionForParticipant,
  isLastParticipant,
}: {
  call: Call;
  participant: StreamVideoParticipant;
  updateVideoSubscriptionForParticipant: (
    sessionId: string,
    width: number,
    height: number,
  ) => void;
  isLastParticipant: boolean;
}) => {
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
          {isAudioMuted ? <MicOff color="red" /> : <Mic color="red" />}
        </View>
      </View>
    </View>
  );
};
export default ParticipantVideosContainer;
